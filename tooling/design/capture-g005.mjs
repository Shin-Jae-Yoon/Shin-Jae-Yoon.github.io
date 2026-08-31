import { spawn } from "node:child_process"
import { createHash } from "node:crypto"
import { createServer } from "node:http"
import { mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import handler from "serve-handler"
import WebSocket from "ws"

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)))
const publicDir = join(root, "public")
const evidenceDir = resolve(root, "../evidence/design-remediation/g005")
const screenshotDir = join(evidenceDir, "screenshots")
const chromePath =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

const routes = {
  home: "/",
  about: "/about.html",
}
const captureViewports = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1440, height: 1000 },
}
const probeViewports = {
  narrow: { width: 320, height: 844 },
  boundary: { width: 800, height: 900 },
  wide: { width: 1200, height: 900 },
}
const themes = ["light", "dark"]
const blockedExternalPatterns = [
  "https://fonts.googleapis.com/*",
  "https://fonts.gstatic.com/*",
  "https://www.googletagmanager.com/*",
  "https://www.google-analytics.com/*",
  "https://cdn.jsdelivr.net/*",
  "https://cdnjs.cloudflare.com/*",
  "https://*.goatcounter.com/*",
]

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms))
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex")

class CdpSession {
  constructor(url) {
    this.nextId = 0
    this.pending = new Map()
    this.onceListeners = new Map()
    this.listeners = new Map()
    this.socket = new WebSocket(url)
  }

  async open() {
    await new Promise((resolveOpen, reject) => {
      this.socket.once("open", resolveOpen)
      this.socket.once("error", reject)
    })
    this.socket.on("message", (payload) => {
      const message = JSON.parse(payload.toString())
      if (message.id) {
        const pending = this.pending.get(message.id)
        this.pending.delete(message.id)
        if (message.error) pending?.reject(new Error(message.error.message))
        else pending?.resolve(message.result)
        return
      }
      for (const listener of this.listeners.get(message.method) ?? []) listener(message.params)
      const once = this.onceListeners.get(message.method) ?? []
      this.onceListeners.delete(message.method)
      for (const listener of once) listener(message.params)
    })
  }

  send(method, params = {}) {
    const id = ++this.nextId
    return new Promise((resolveSend, reject) => {
      this.pending.set(id, { resolve: resolveSend, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  once(method) {
    return new Promise((resolveEvent) => {
      const listeners = this.onceListeners.get(method) ?? []
      listeners.push(resolveEvent)
      this.onceListeners.set(method, listeners)
    })
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) ?? []
    listeners.push(listener)
    this.listeners.set(method, listeners)
  }

  close() {
    this.socket.close()
  }
}

async function getFreePort() {
  const server = createServer()
  await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen))
  const { port } = server.address()
  await new Promise((resolveClose) => server.close(resolveClose))
  return port
}

async function waitForChrome(port) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`)
      if (response.ok) return response.json()
    } catch {}
    await sleep(100)
  }
  throw new Error("Chrome DevTools endpoint did not become ready")
}

async function evaluate(session, expression) {
  const result = await session.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text)
  }
  return result.result.value
}

async function createPage(port, url, viewport, theme) {
  const targetResponse = await fetch(
    `http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`,
    { method: "PUT" },
  )
  if (!targetResponse.ok) {
    throw new Error(`Could not create Chrome target: ${targetResponse.status}`)
  }
  const target = await targetResponse.json()
  const session = new CdpSession(target.webSocketDebuggerUrl)
  await session.open()
  await Promise.all([
    session.send("Page.enable"),
    session.send("Runtime.enable"),
    session.send("Network.enable"),
  ])
  await session.send("Network.setBlockedURLs", { urls: blockedExternalPatterns })
  await session.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.width <= 800,
  })
  await session.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  })
  await session.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `
      history.scrollRestoration = "manual"
      localStorage.setItem("saved-theme", ${JSON.stringify(theme)})
      document.documentElement.setAttribute("saved-theme", ${JSON.stringify(theme)})
    `,
  })

  const externalRequests = []
  session.on("Network.requestWillBeSent", ({ request }) => {
    const requestUrl = new URL(request.url)
    if (requestUrl.hostname !== "127.0.0.1") externalRequests.push(request.url)
  })

  const loaded = session.once("Page.loadEventFired")
  await session.send("Page.navigate", { url })
  await loaded
  return { session, externalRequests }
}

async function stabilizePage(session, theme) {
  await evaluate(
    session,
    `(async () => {
      localStorage.setItem("saved-theme", ${JSON.stringify(theme)})
      document.documentElement.setAttribute("saved-theme", ${JSON.stringify(theme)})
      await document.fonts.ready
      await Promise.all(Array.from(document.images, image => image.complete
        ? Promise.resolve()
        : new Promise(resolve => image.addEventListener("load", resolve, { once: true }))))
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    })()`,
  )
}

async function resetPageScroll(session) {
  await evaluate(
    session,
    `(async () => {
      history.scrollRestoration = "manual"
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
      window.scrollTo(0, 0)
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      window.scrollTo(0, 0)
    })()`,
  )
}

const probeExpression = `(() => {
  const visible = element => {
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0
  }
  const parseColor = value => {
    const parts = value.match(/[\\d.]+/g)?.map(Number) ?? []
    return { r: parts[0] ?? 0, g: parts[1] ?? 0, b: parts[2] ?? 0, a: parts[3] ?? 1 }
  }
  const composite = (foreground, background) => ({
    r: foreground.r * foreground.a + background.r * (1 - foreground.a),
    g: foreground.g * foreground.a + background.g * (1 - foreground.a),
    b: foreground.b * foreground.a + background.b * (1 - foreground.a),
    a: 1,
  })
  const backgroundFor = element => {
    let current = element
    let background = { r: 255, g: 255, b: 255, a: 1 }
    while (current) {
      const candidate = parseColor(getComputedStyle(current).backgroundColor)
      if (candidate.a > 0) {
        background = composite(candidate, background)
        if (candidate.a === 1) break
      }
      current = current.parentElement
    }
    return background
  }
  const luminance = color => [color.r, color.g, color.b]
    .map(channel => channel / 255)
    .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0)
  const contrast = (foreground, background) => {
    const first = luminance(foreground)
    const second = luminance(background)
    return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
  }
  const contrastSelectors = [
    ".home-title",
    ".home-statement",
    ".home-description",
    ".home-primary-action",
    ".home-secondary-action",
    ".home-connected-records a",
    ".home-garden-preview h2",
    ".home-garden-preview p",
    ".home-text-action",
    ".home-note-list a",
    ".home-proof-copy h2",
    ".home-proof-copy p",
    ".home-proof-link",
    ".about-identity h1",
    ".about-role",
    ".about-thesis",
    ".about-lead",
    ".about-section-heading h2",
    ".about-section-heading p",
    ".about-principles strong",
    ".about-principles p",
    ".about-stack-list dt",
    ".about-stack-list dd",
    ".about-closing h2",
    ".about-closing p",
    ".about-route-links a",
  ]
  const contrastSamples = Array.from(document.querySelectorAll(contrastSelectors.join(",")))
    .filter(visible)
    .map(element => {
      const foreground = parseColor(getComputedStyle(element).color)
      const ratio = contrast(foreground, backgroundFor(element))
      return {
        selector: contrastSelectors.find(selector => element.matches(selector)),
        text: element.textContent.replace(/\\s+/g, " ").trim().slice(0, 80),
        ratio: Number(ratio.toFixed(3)),
        pass: ratio >= 4.5,
      }
    })
  const controls = Array.from(document.querySelectorAll(
    ".search-button, .darkmode, .site-menu-toggle, .primary-navigation a, .home-primary-action, .about-route-links a",
  )).filter(visible).map(element => {
    const rect = element.getBoundingClientRect()
    return {
      className: element.className,
      width: Number(rect.width.toFixed(2)),
      height: Number(rect.height.toFixed(2)),
      pass: rect.width >= 44 && rect.height >= 44,
    }
  })
  const skipLink = document.querySelector(".skip-link")
  skipLink?.focus()
  const skipRect = skipLink?.getBoundingClientRect()
  const probe = {
    viewport: { width: innerWidth, height: innerHeight },
    theme: document.documentElement.getAttribute("saved-theme"),
    scrollWidth: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
    h1Count: document.querySelectorAll("h1").length,
    h1Text: document.querySelector("h1")?.textContent.replace(/\s+/g, " ").trim(),
    mainCount: document.querySelectorAll("main#site-content").length,
    searchCount: document.querySelectorAll(".search-button").length,
    themeControlCount: document.querySelectorAll(".darkmode").length,
    menuCount: document.querySelectorAll(".site-menu-toggle").length,
    remoteFontLinkCount: document.querySelectorAll(
      'link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]',
    ).length,
    systemFontStack: getComputedStyle(document.body).fontFamily,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    controlTargetFailures: controls.filter(control => !control.pass),
    skipLinkFocusVisible: Boolean(skipRect && skipRect.top >= 0 && skipRect.left >= 0),
    surface: document.querySelector(".dev-uni-frame")?.getAttribute("data-surface"),
    homeMarkers: Boolean(
      document.querySelector(".home-title") &&
      document.querySelector(".home-neural-visual") &&
      document.querySelector(".home-route-guide")
    ),
    aboutMarkers: Boolean(
      document.querySelector(".about-heading") &&
      document.querySelector(".about-personal-section") &&
      document.querySelector(".about-story")
    ),
    bodyBackground: getComputedStyle(document.body).backgroundColor,
    headerBackground: getComputedStyle(document.querySelector(".dev-uni-header")).backgroundColor,
    contrastSamples,
    contrastFailures: contrastSamples.filter(sample => !sample.pass),
  }
  skipLink?.blur()
  return probe
})()`

async function captureCell({
  chromePort,
  baseUrl,
  surface,
  viewportName,
  viewport,
  theme,
  capture,
}) {
  const { session, externalRequests } = await createPage(
    chromePort,
    `${baseUrl}${routes[surface]}`,
    viewport,
    theme,
  )
  try {
    await stabilizePage(session, theme)
    await resetPageScroll(session)
    const probe = await evaluate(session, probeExpression)
    await resetPageScroll(session)
    const captureScrollY = await evaluate(session, "window.scrollY")
    let screenshot = null
    if (capture) {
      const result = await session.send("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
        captureBeyondViewport: false,
      })
      const bytes = Buffer.from(result.data, "base64")
      const filename = `${surface}-${viewportName}-${theme}.png`
      await writeFile(join(screenshotDir, filename), bytes)
      screenshot = {
        path: `migration/evidence/design-remediation/g005/screenshots/${filename}`,
        bytes: bytes.byteLength,
        width: bytes.readUInt32BE(16),
        height: bytes.readUInt32BE(20),
        sha256: sha256(bytes),
      }
    }
    return {
      id: `${surface}-${viewportName}-${theme}`,
      route: routes[surface],
      surface,
      viewport: { name: viewportName, ...viewport },
      theme,
      captureScrollY,
      blockedExternalRequests: [...new Set(externalRequests)].sort(),
      screenshot,
      probe,
    }
  } finally {
    session.close()
  }
}

function failuresFor(cell) {
  const failures = []
  if (cell.probe.horizontalOverflow) failures.push(`${cell.id}: horizontal overflow`)
  if (cell.probe.h1Count !== 1) failures.push(`${cell.id}: expected one H1`)
  if (cell.probe.mainCount !== 1) failures.push(`${cell.id}: expected one main`)
  if (cell.probe.searchCount !== 1 || cell.probe.themeControlCount !== 1) {
    failures.push(`${cell.id}: native header controls are not unique`)
  }
  if (cell.probe.remoteFontLinkCount !== 0) failures.push(`${cell.id}: remote font link found`)
  if (!cell.probe.reducedMotion) failures.push(`${cell.id}: reduced motion not active`)
  if (!cell.probe.skipLinkFocusVisible) failures.push(`${cell.id}: skip link focus is not visible`)
  if (cell.probe.contrastSamples.length === 0) failures.push(`${cell.id}: no text contrast samples`)
  if (cell.probe.contrastFailures.length > 0) failures.push(`${cell.id}: text contrast below 4.5`)
  if (cell.probe.controlTargetFailures.length > 0) {
    failures.push(`${cell.id}: control target below 44px`)
  }
  if (cell.surface === "home" && !cell.probe.homeMarkers) failures.push(`${cell.id}: Home markers`)
  if (cell.surface === "about" && !cell.probe.aboutMarkers) {
    failures.push(`${cell.id}: About markers`)
  }
  return failures
}

async function main() {
  await mkdir(screenshotDir, { recursive: true })
  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url, "http://localhost")
    if (requestUrl.pathname.endsWith("/")) {
      requestUrl.pathname += "index.html"
      request.url = `${requestUrl.pathname}${requestUrl.search}`
    }
    return handler(request, response, { public: publicDir, cleanUrls: false })
  })
  await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen))
  const serverPort = server.address().port
  const baseUrl = `http://127.0.0.1:${serverPort}`
  const chromePort = await getFreePort()
  const profile = join(tmpdir(), `dev-uni-g005-chrome-${process.pid}`)
  const chrome = spawn(
    chromePath,
    [
      "--headless=new",
      "--disable-gpu",
      "--disable-background-networking",
      "--force-color-profile=srgb",
      "--force-device-scale-factor=1",
      "--no-first-run",
      `--remote-debugging-port=${chromePort}`,
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  )

  try {
    const chromeVersion = await waitForChrome(chromePort)
    const cells = []
    for (const surface of Object.keys(routes)) {
      for (const [viewportName, viewport] of Object.entries(captureViewports)) {
        for (const theme of themes) {
          cells.push(
            await captureCell({
              chromePort,
              baseUrl,
              surface,
              viewportName,
              viewport,
              theme,
              capture: true,
            }),
          )
        }
      }
    }

    const responsiveProbes = []
    for (const surface of Object.keys(routes)) {
      for (const [viewportName, viewport] of Object.entries(probeViewports)) {
        for (const theme of themes) {
          responsiveProbes.push(
            await captureCell({
              chromePort,
              baseUrl,
              surface,
              viewportName,
              viewport,
              theme,
              capture: false,
            }),
          )
        }
      }
    }

    const allCells = [...cells, ...responsiveProbes]
    const failures = allCells.flatMap(failuresFor)
    const index = {
      schemaVersion: 1,
      goalId: "G005-implement-the-dev-uni-visual-system",
      generatedAt: new Date().toISOString(),
      status: failures.length === 0 ? "PASS" : "FAIL",
      scope: "Home and About iteration-1 light/dark captures with 320-1440 responsive probes",
      environment: {
        browser: chromeVersion.Browser,
        protocolVersion: chromeVersion["Protocol-Version"],
        node: process.version,
        deviceScaleFactor: 1,
        reducedMotion: true,
        externalResourcesBlocked: blockedExternalPatterns,
      },
      summary: {
        expectedScreenshotCount: 8,
        screenshotCount: cells.filter((cell) => cell.screenshot).length,
        responsiveProbeCount: responsiveProbes.length,
        contrastProbeCount: allCells.length,
        contrastSampledProbeCount: allCells.filter((cell) => cell.probe.contrastSamples.length > 0)
          .length,
        contrastSampleCount: allCells.reduce(
          (sum, cell) => sum + cell.probe.contrastSamples.length,
          0,
        ),
        contrastFailures: allCells.reduce(
          (sum, cell) => sum + cell.probe.contrastFailures.length,
          0,
        ),
        horizontalOverflowFailures: allCells.filter((cell) => cell.probe.horizontalOverflow).length,
        remoteFontLinkFailures: allCells.filter((cell) => cell.probe.remoteFontLinkCount > 0)
          .length,
        controlTargetFailures: allCells.reduce(
          (sum, cell) => sum + cell.probe.controlTargetFailures.length,
          0,
        ),
        failures,
      },
      cells,
      responsiveProbes,
    }
    await writeFile(join(evidenceDir, "capture-index.json"), `${JSON.stringify(index, null, 2)}\n`)
    process.stdout.write(`${JSON.stringify(index.summary, null, 2)}\n`)
    if (failures.length > 0) process.exitCode = 1
  } finally {
    chrome.kill("SIGTERM")
    await new Promise((resolveClose) => server.close(resolveClose))
    await Promise.race([
      new Promise((resolveExit) => chrome.once("exit", resolveExit)),
      sleep(2_000),
    ])
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  }
}

await main()
