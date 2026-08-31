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
const evidenceDir = resolve(root, "../evidence/design-remediation/g006")
const screenshotDir = join(evidenceDir, "screenshots")
const chromePath =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

const routes = {
  "portfolio-index": "/portfolio/",
  "portfolio-detail": "/portfolio/quartz-migration.html",
  "garden-index": "/brain/",
  "garden-detail": "/garden/progressive-discovery.html",
  "articles-index": "/articles/",
  "article-detail": "/articles/reading-first-design.html",
}
const tistoryRepresentativeRoute = "/articles/tistory/17.html"
const captureViewports = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1440, height: 1000 },
}
const probeViewports = {
  narrow: { width: 320, height: 844 },
  boundary: { width: 800, height: 900 },
  wide: { width: 1200, height: 900 },
}
const tistoryProbeViewports = {
  narrow: { width: 320, height: 844 },
  mobile: { width: 390, height: 844 },
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
const expectedTools = {
  "portfolio-index": { explorer: 0, graph: 0, toc: 0, backlinks: 0, reader: 0, listing: 1 },
  "portfolio-detail": { explorer: 0, graph: 0, toc: 0, backlinks: 0, reader: 0, listing: 0 },
  "garden-index": { explorer: 1, graph: 1, toc: 0, backlinks: 0, reader: 1, listing: 1 },
  "garden-detail": { explorer: 1, graph: 1, toc: 1, backlinks: 1, reader: 1, listing: 0 },
  "articles-index": { explorer: 0, graph: 0, toc: 0, backlinks: 0, reader: 0, listing: 1 },
  "article-detail": { explorer: 0, graph: 0, toc: 1, backlinks: 1, reader: 1, listing: 0 },
}

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
  if (!targetResponse.ok)
    throw new Error(`Could not create Chrome target: ${targetResponse.status}`)
  const target = await targetResponse.json()
  const session = new CdpSession(target.webSocketDebuggerUrl)
  await session.open()
  await Promise.all([
    session.send("Page.enable"),
    session.send("Runtime.enable"),
    session.send("Network.enable"),
  ])
  await session.send("Network.setBlockedURLs", { urls: blockedExternalPatterns })
  const deviceMetrics = {
    width: viewport.width,
    height: viewport.height,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
    deviceScaleFactor: 1,
    mobile: false,
    positionX: 0,
    positionY: 0,
    dontSetVisibleSize: false,
  }
  await session.send("Emulation.setDeviceMetricsOverride", deviceMetrics)
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
  await session.send("Emulation.setDeviceMetricsOverride", deviceMetrics)
  await session.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 })
  return { session, externalRequests, targetId: target.id }
}

async function stabilizePage(session, theme) {
  await evaluate(
    session,
    `(async () => {
      localStorage.setItem("saved-theme", ${JSON.stringify(theme)})
      document.documentElement.setAttribute("saved-theme", ${JSON.stringify(theme)})
      await document.fonts.ready
      await Promise.race([
        Promise.all(Array.from(document.images, image => image.complete
          ? Promise.resolve()
          : new Promise(resolve => {
              image.addEventListener("load", resolve, { once: true })
              image.addEventListener("error", resolve, { once: true })
            }))),
        new Promise(resolve => setTimeout(resolve, 750)),
      ])
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
    ".article-title", "article p", ".section .desc a", ".content-meta", ".page-listing > p",
    ".dev-uni-context a", ".dev-uni-context h3",
  ]
  const contrastSamples = Array.from(document.querySelectorAll(contrastSelectors.join(",")))
    .filter(visible)
    .map(element => {
      const foreground = parseColor(getComputedStyle(element).color)
      const ratio = contrast(foreground, backgroundFor(element))
      return {
        selector: contrastSelectors.find(selector => element.matches(selector)),
        text: element.textContent.trim().slice(0, 80),
        ratio: Number(ratio.toFixed(3)),
        pass: ratio >= 4.5,
      }
    })
  const controls = Array.from(document.querySelectorAll(
    ".search-button, .darkmode, .readermode, .site-menu-toggle, .mobile-explorer, .global-graph-icon, .primary-navigation a, .section .desc a",
  )).filter(visible).map(element => {
    const rect = element.getBoundingClientRect()
    return {
      className: element.className,
      width: Number(rect.width.toFixed(2)),
      height: Number(rect.height.toFixed(2)),
      pass: rect.width >= 44 && rect.height >= 44,
    }
  })
  const firstListing = document.querySelector(".page-listing .section-li")
  const firstListingRect = firstListing?.getBoundingClientRect()
  const portfolioListing = document.querySelector(".dev-uni-surface-portfolio-index .page-listing")
  const portfolioEvidence = document.querySelector("article.portfolio-index")
  const portfolioListingRect = portfolioListing?.getBoundingClientRect()
  const portfolioEvidenceRect = portfolioEvidence?.getBoundingClientRect()
  const portfolioTagRows = new Set(
    Array.from(document.querySelectorAll(".dev-uni-surface-portfolio-index .tag-link"))
      .filter(visible)
      .map(element => Math.round(element.getBoundingClientRect().top)),
  ).size
  const graphOuter = document.querySelector(".graph > .graph-outer")
  const graphOuterRect = graphOuter?.getBoundingClientRect()
  const overflowMeasurement = element => {
    const rect = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    return {
      tag: element.tagName.toLowerCase(),
      id: element.id,
      className: typeof element.className === "string" ? element.className : "",
      left: Number(rect.left.toFixed(2)),
      right: Number(rect.right.toFixed(2)),
      width: Number(rect.width.toFixed(2)),
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      computed: {
        width: style.width,
        minWidth: style.minWidth,
        maxWidth: style.maxWidth,
        display: style.display,
        whiteSpace: style.whiteSpace,
        paddingLeft: style.paddingLeft,
        paddingRight: style.paddingRight,
        position: style.position,
        boxSizing: style.boxSizing,
        contain: style.contain,
        overflowX: style.overflowX,
        overflowY: style.overflowY,
      },
    }
  }
  const overflowingElements = Array.from(document.querySelectorAll("body *"))
    .filter(visible)
    .map(element => ({ element, measurement: overflowMeasurement(element) }))
    .filter(({ measurement }) => measurement.left < -1 || measurement.right > innerWidth + 1)
    .map(({ element, measurement }) => {
      const ancestors = []
      let ancestor = element.parentElement
      while (ancestor && ancestors.length < 8) {
        ancestors.push(overflowMeasurement(ancestor))
        if (ancestor.matches("main, article")) break
        ancestor = ancestor.parentElement
      }
      return { ...measurement, ancestors }
    })
    .slice(0, 12)
  const scrollContainers = Array.from(document.querySelectorAll("body *"))
    .filter(element => element.scrollWidth > element.clientWidth + 1)
    .map(element => {
      const measurement = overflowMeasurement(element)
      const before = getComputedStyle(element, "::before")
      const after = getComputedStyle(element, "::after")
      return {
        ...measurement,
        pseudo: {
          before: { content: before.content, display: before.display, width: before.width },
          after: { content: after.content, display: after.display, width: after.width },
        },
      }
    })
    .slice(0, 12)
  const rootScrollWidth = document.documentElement.scrollWidth
  const bodyScrollWidth = document.body.scrollWidth
  window.scrollTo(rootScrollWidth, 0)
  const maxScrollX = window.scrollX
  window.scrollTo(0, 0)
  const skipLink = document.querySelector(".skip-link")
  skipLink?.focus()
  const skipRect = skipLink?.getBoundingClientRect()
  const result = {
    viewport: { width: innerWidth, height: innerHeight },
    theme: document.documentElement.getAttribute("saved-theme"),
    scrollWidth: rootScrollWidth,
    rootClientWidth: document.documentElement.clientWidth,
    bodyScrollWidth,
    bodyClientWidth: document.body.clientWidth,
    maxScrollX,
    horizontalOverflow: rootScrollWidth > innerWidth + 1,
    overflowingElements,
    scrollContainers,
    h1Count: document.querySelectorAll("h1").length,
    mainCount: document.querySelectorAll("main#site-content").length,
    searchCount: document.querySelectorAll(".search-button").length,
    themeControlCount: document.querySelectorAll(".darkmode").length,
    remoteFontLinkCount: document.querySelectorAll(
      'link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]',
    ).length,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    firstListingVisible: Boolean(
      firstListingRect && firstListingRect.top < innerHeight && firstListingRect.bottom > 0
    ),
    portfolioTagRows,
    portfolioEvidenceGap: portfolioListingRect && portfolioEvidenceRect
      ? Number((portfolioEvidenceRect.top - portfolioListingRect.bottom).toFixed(2))
      : null,
    graphState: graphOuter?.getAttribute("data-graph-state") ?? null,
    graphOuterHeight: graphOuterRect ? Number(graphOuterRect.height.toFixed(2)) : null,
    graphFallbackCount: document.querySelectorAll("[data-graph-fallback]").length,
    surface: document.querySelector(".dev-uni-frame")?.getAttribute("data-surface"),
    pageListingCount: document.querySelectorAll(".page-listing").length,
    explorerCount: document.querySelectorAll(".explorer.nav-files-container").length,
    graphCount: document.querySelectorAll(".global-graph-outer").length,
    tocCount: document.querySelectorAll(".toc").length,
    backlinksCount: document.querySelectorAll(".backlinks").length,
    readerCount: document.querySelectorAll(".readermode").length,
    contrastSamples,
    contrastFailures: contrastSamples.filter(sample => !sample.pass),
    controlTargetFailures: controls.filter(control => !control.pass),
    skipLinkFocusVisible: Boolean(skipRect && skipRect.top >= 0 && skipRect.left >= 0 &&
      skipRect.right <= innerWidth && skipRect.bottom <= innerHeight),
  }
  skipLink?.blur()
  return result
})()`

async function captureCell({
  chromePort,
  baseUrl,
  idPrefix,
  route,
  expectedSurface,
  viewportName,
  viewport,
  theme,
  capture,
}) {
  const { session, externalRequests, targetId } = await createPage(
    chromePort,
    `${baseUrl}${route}`,
    viewport,
    theme,
  )
  try {
    await stabilizePage(session, theme)
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
      const filename = `${idPrefix}-${viewportName}-${theme}.png`
      await writeFile(join(screenshotDir, filename), bytes)
      screenshot = {
        path: `migration/evidence/design-remediation/g006/screenshots/${filename}`,
        bytes: bytes.byteLength,
        width: bytes.readUInt32BE(16),
        height: bytes.readUInt32BE(20),
        sha256: sha256(bytes),
      }
    }
    await resetPageScroll(session)
    const probe = await evaluate(session, probeExpression)
    return {
      id: `${idPrefix}-${viewportName}-${theme}`,
      route,
      expectedSurface,
      viewport: { name: viewportName, ...viewport },
      theme,
      captureScrollY,
      blockedExternalRequests: [...new Set(externalRequests)].sort(),
      screenshot,
      probe,
    }
  } finally {
    session.close()
    await fetch(`http://127.0.0.1:${chromePort}/json/close/${targetId}`).catch(() => undefined)
  }
}

function failuresFor(cell, enforceToolMatrix = true) {
  const failures = []
  if (
    cell.probe.viewport.width !== cell.viewport.width ||
    cell.probe.viewport.height !== cell.viewport.height
  ) {
    failures.push(
      `${cell.id}: DOM viewport ${cell.probe.viewport.width}x${cell.probe.viewport.height} does not match requested ${cell.viewport.width}x${cell.viewport.height}`,
    )
  }
  if (cell.probe.horizontalOverflow) {
    const overflowSource = cell.probe.overflowingElements
      .map(
        (element) =>
          `${element.tag}${element.id ? `#${element.id}` : ""}${element.className ? `.${element.className.split(/\s+/).join(".")}` : ""}`,
      )
      .join(", ")
    failures.push(`${cell.id}: horizontal overflow${overflowSource ? ` (${overflowSource})` : ""}`)
  }
  if (cell.probe.h1Count !== 1) failures.push(`${cell.id}: expected one H1`)
  if (cell.probe.mainCount !== 1) failures.push(`${cell.id}: expected one main`)
  if (cell.probe.searchCount !== 1 || cell.probe.themeControlCount !== 1) {
    failures.push(`${cell.id}: native header controls are not unique`)
  }
  if (cell.probe.surface !== cell.expectedSurface) failures.push(`${cell.id}: wrong data-surface`)
  if (cell.probe.theme !== cell.theme) failures.push(`${cell.id}: wrong saved theme`)
  if (cell.captureScrollY !== 0) failures.push(`${cell.id}: capture scrollY is not zero`)
  if (cell.probe.remoteFontLinkCount !== 0) failures.push(`${cell.id}: remote font link found`)
  if (!cell.probe.reducedMotion) failures.push(`${cell.id}: reduced motion not active`)
  if (!cell.probe.skipLinkFocusVisible) failures.push(`${cell.id}: skip link focus is not visible`)
  if (cell.probe.contrastFailures.length > 0) failures.push(`${cell.id}: text contrast below 4.5`)
  if (cell.probe.controlTargetFailures.length > 0)
    failures.push(`${cell.id}: control target below 44px`)
  if (
    cell.expectedSurface === "articles-index" &&
    cell.viewport.name === "mobile" &&
    !cell.probe.firstListingVisible
  ) {
    failures.push(`${cell.id}: first editorial row is below the initial viewport`)
  }
  if (cell.expectedSurface === "portfolio-index" && cell.viewport.name === "mobile") {
    if (cell.probe.portfolioTagRows > 2) failures.push(`${cell.id}: portfolio tags exceed two rows`)
    if (cell.probe.portfolioEvidenceGap > 48) {
      failures.push(`${cell.id}: portfolio project-to-evidence gap exceeds 48px`)
    }
  }
  if (
    cell.expectedSurface.startsWith("garden-") &&
    cell.probe.graphState === "unavailable" &&
    (cell.probe.graphOuterHeight > 120 || cell.probe.graphFallbackCount !== 1)
  ) {
    failures.push(`${cell.id}: unavailable graph is not a compact text fallback`)
  }

  if (enforceToolMatrix) {
    const expected = expectedTools[cell.expectedSurface]
    const actual = {
      explorer: cell.probe.explorerCount,
      graph: cell.probe.graphCount,
      toc: cell.probe.tocCount,
      backlinks: cell.probe.backlinksCount,
      reader: cell.probe.readerCount,
      listing: cell.probe.pageListingCount,
    }
    for (const [tool, count] of Object.entries(expected)) {
      if (actual[tool] !== count)
        failures.push(`${cell.id}: ${tool} expected ${count}, got ${actual[tool]}`)
    }
  }

  if (cell.screenshot) {
    if (
      cell.screenshot.width !== cell.viewport.width ||
      cell.screenshot.height !== cell.viewport.height
    ) {
      failures.push(`${cell.id}: PNG dimensions do not match viewport`)
    }
    if (!/^[0-9a-f]{64}$/.test(cell.screenshot.sha256))
      failures.push(`${cell.id}: invalid PNG hash`)
  }
  return failures
}

async function main() {
  await rm(screenshotDir, { recursive: true, force: true })
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
  const profile = join(tmpdir(), `dev-uni-g006-chrome-${process.pid}`)
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
    for (const [surface, route] of Object.entries(routes)) {
      for (const [viewportName, viewport] of Object.entries(captureViewports)) {
        for (const theme of themes) {
          cells.push(
            await captureCell({
              chromePort,
              baseUrl,
              idPrefix: surface,
              route,
              expectedSurface: surface,
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
    for (const [surface, route] of Object.entries(routes)) {
      for (const [viewportName, viewport] of Object.entries(probeViewports)) {
        for (const theme of themes) {
          responsiveProbes.push(
            await captureCell({
              chromePort,
              baseUrl,
              idPrefix: surface,
              route,
              expectedSurface: surface,
              viewportName,
              viewport,
              theme,
              capture: false,
            }),
          )
        }
      }
    }

    const tistoryProbes = []
    for (const [viewportName, viewport] of Object.entries(tistoryProbeViewports)) {
      for (const theme of themes) {
        tistoryProbes.push(
          await captureCell({
            chromePort,
            baseUrl,
            idPrefix: "tistory-17",
            route: tistoryRepresentativeRoute,
            expectedSurface: "article-detail",
            viewportName,
            viewport,
            theme,
            capture: false,
          }),
        )
      }
    }

    const failures = [
      ...cells.flatMap((cell) => failuresFor(cell)),
      ...responsiveProbes.flatMap((cell) => failuresFor(cell)),
      ...tistoryProbes.flatMap((cell) => failuresFor(cell, false)),
    ]
    const tupleKeys = cells.map(
      (cell) => `${cell.expectedSurface}|${cell.viewport.name}|${cell.theme}`,
    )
    const filenames = cells.map((cell) => cell.screenshot?.path)
    const screenshotHashes = cells.map((cell) => cell.screenshot?.sha256)
    if (cells.length !== 24) failures.push(`expected 24 screenshot cells, got ${cells.length}`)
    if (new Set(tupleKeys).size !== 24) failures.push("screenshot tuples are not unique")
    if (new Set(filenames).size !== 24) failures.push("screenshot filenames are not unique")
    if (new Set(screenshotHashes).size !== 24) failures.push("screenshot hashes are not unique")

    const allProbeCells = [...cells, ...responsiveProbes, ...tistoryProbes]
    const index = {
      schemaVersion: 1,
      goalId: "G006-differentiate-content-surfaces",
      generatedAt: new Date().toISOString(),
      status: failures.length === 0 ? "PASS" : "FAIL",
      scope:
        "Portfolio, Garden, and Articles index/detail light/dark captures with responsive and Tistory 17 overflow probes",
      environment: {
        browser: chromeVersion.Browser,
        protocolVersion: chromeVersion["Protocol-Version"],
        node: process.version,
        deviceScaleFactor: 1,
        reducedMotion: true,
        externalResourcesBlocked: blockedExternalPatterns,
      },
      summary: {
        expectedScreenshotCount: 24,
        screenshotCount: cells.filter((cell) => cell.screenshot).length,
        uniqueTupleCount: new Set(tupleKeys).size,
        uniqueFilenameCount: new Set(filenames).size,
        uniqueScreenshotHashCount: new Set(screenshotHashes).size,
        responsiveProbeCount: responsiveProbes.length,
        tistoryRepresentativeProbeCount: tistoryProbes.length,
        viewportMismatchFailures: allProbeCells.filter(
          (cell) =>
            cell.probe.viewport.width !== cell.viewport.width ||
            cell.probe.viewport.height !== cell.viewport.height,
        ).length,
        horizontalOverflowFailures: allProbeCells.filter((cell) => cell.probe.horizontalOverflow)
          .length,
        contrastFailures: allProbeCells.reduce(
          (sum, cell) => sum + cell.probe.contrastFailures.length,
          0,
        ),
        remoteFontLinkFailures: allProbeCells.filter((cell) => cell.probe.remoteFontLinkCount > 0)
          .length,
        controlTargetFailures: allProbeCells.reduce(
          (sum, cell) => sum + cell.probe.controlTargetFailures.length,
          0,
        ),
        failures,
      },
      expectedTools,
      cells,
      responsiveProbes,
      tistoryProbes,
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
