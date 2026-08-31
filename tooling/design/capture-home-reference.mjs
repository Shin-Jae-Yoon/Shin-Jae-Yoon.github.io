import { spawn } from "node:child_process"
import { createServer } from "node:http"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import WebSocket from "ws"
import {
  homeReferencePaths,
  loadAndVerifyHomeReference,
  scanHomeReferenceSource,
  sha256,
} from "./home-reference.mjs"

const { repositoryRoot, referenceRoot, indexPath } = homeReferencePaths
const screenshotRoot = path.join(referenceRoot, "screenshots")
const chromePath =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const viewports = {
  desktop: { width: 1440, height: 1000 },
  mobile: { width: 390, height: 844 },
}
const themes = ["light", "dark"]
const requiredMarkers = [
  "Dev Uni",
  "신재윤 / Backend Software Engineer",
  "SECOND BRAIN",
  "이해한 것을 연결하고",
  "점진적 발견과 디지털 가든",
  "Quartz 5 지식 사이트 전환",
  "공개 범위와 기존 경로를 보존한 Quartz 5 선택",
  "기술 블로그에서 읽기 우선 디자인하기",
]

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

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

class CdpSession {
  constructor(url) {
    this.nextId = 0
    this.pending = new Map()
    this.events = new Map()
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
      const listeners = this.events.get(message.method) ?? []
      this.events.delete(message.method)
      for (const listener of listeners) listener(message.params)
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
      const listeners = this.events.get(method) ?? []
      listeners.push(resolveEvent)
      this.events.set(method, listeners)
    })
  }

  close() {
    this.socket.close()
  }
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

async function captureCell(
  chromePort,
  baseUrl,
  viewportName,
  viewport,
  theme,
  captureKind = "first-viewport",
) {
  const targetResponse = await fetch(
    `http://127.0.0.1:${chromePort}/json/new?${encodeURIComponent("about:blank")}`,
    { method: "PUT" },
  )
  if (!targetResponse.ok)
    throw new Error(`could not create Chrome target: ${targetResponse.status}`)
  const target = await targetResponse.json()
  const session = new CdpSession(target.webSocketDebuggerUrl)
  await session.open()
  try {
    await Promise.all([session.send("Page.enable"), session.send("Runtime.enable")])
    await session.send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewportName === "mobile",
    })
    await session.send("Emulation.setEmulatedMedia", {
      media: "screen",
      features: [
        { name: "prefers-color-scheme", value: theme },
        { name: "prefers-reduced-motion", value: "reduce" },
      ],
    })
    await session.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `document.documentElement.setAttribute("data-theme", ${JSON.stringify(theme)}); history.scrollRestoration = "manual";`,
    })
    const loaded = session.once("Page.loadEventFired")
    await session.send("Page.navigate", { url: baseUrl })
    await loaded
    const probe = await evaluate(
      session,
      `(async () => {
        document.documentElement.setAttribute("data-theme", ${JSON.stringify(theme)})
        history.scrollRestoration = "manual"
        await document.fonts.ready
        const contentFieldElement = document.querySelector(".content-field")
        const requestedScrollY = ${JSON.stringify(captureKind)} === "mobile-continuation"
          ? Math.max(0, contentFieldElement.offsetTop - 160)
          : 0
        window.scrollTo(0, requestedScrollY)
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        const bodyText = (document.body?.innerText ?? "").replace(/\\s+/g, " ").trim()
        const heading = document.querySelector("h1")
        const normalizedHeading = (heading?.innerText ?? "").replace(/\\s+/g, " ").trim()
        const connected = document.querySelector(".connected-records")?.getBoundingClientRect()
        const contentField = contentFieldElement.getBoundingClientRect()
        const recordTitleSizes = Array.from(document.querySelectorAll(".record-copy strong"))
          .map(element => Number.parseFloat(getComputedStyle(element).fontSize))
        const recordMetadataSizes = Array.from(document.querySelectorAll(".record-copy small"))
          .map(element => Number.parseFloat(getComputedStyle(element).fontSize))
        const headerControls = Array.from(document.querySelectorAll(".header-tools button"))
        const mobileTargetFailures = innerWidth <= 800
          ? headerControls.filter(control => {
              const rect = control.getBoundingClientRect()
              return rect.width < 44 || rect.height < 44
            }).length
          : 0
        const forbiddenComputed = Array.from(document.querySelectorAll("*"))
          .filter(element => {
            const style = getComputedStyle(element)
            return style.backgroundImage !== "none" ||
              (style.backdropFilter && style.backdropFilter !== "none") ||
              style.animationName !== "none"
          })
        const remoteResources = Array.from(document.querySelectorAll("[src], [href]"))
          .filter(element => /^https?:\\/\\//i.test(element.getAttribute("src") ?? element.getAttribute("href") ?? ""))
        return {
          title: document.title,
          theme: document.documentElement.getAttribute("data-theme"),
          width: innerWidth,
          height: innerHeight,
          scrollY,
          scrollWidth: document.documentElement.scrollWidth,
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
          h1Count: document.querySelectorAll("h1").length,
          normalizedHeading,
          requiredMarkersFound: ${JSON.stringify(requiredMarkers)}.every(marker => bodyText.includes(marker)),
          rebrandabilityMarkersFound:
            bodyText.includes("신재윤 / Backend Software Engineer") &&
            bodyText.includes("공개 범위와 기존 경로를 보존한 Quartz 5 선택"),
          minimumRecordTitlePx: Math.min(...recordTitleSizes),
          minimumRecordMetadataPx: Math.min(...recordMetadataSizes),
          legacyMediaElementCount: document.querySelectorAll("img, picture, video, iframe").length,
          remoteResourceCount: remoteResources.length,
          forbiddenComputedStyleCount: forbiddenComputed.length,
          unlabeledHeaderControlCount: headerControls.filter(control => !control.getAttribute("aria-label")).length,
          mobileTargetFailureCount: mobileTargetFailures,
          connectedRecordsVisibleInFirstViewport: Boolean(connected && connected.top < innerHeight && connected.bottom > 0),
          canvasTransitionVisible:
            contentField.top > 0 &&
            contentField.top < innerHeight &&
            contentField.bottom > contentField.top,
          canvasTransitionTop: contentField.top,
          heroColor: getComputedStyle(document.querySelector(".identity-field")).backgroundColor,
          canvasColor: getComputedStyle(document.querySelector(".content-field")).backgroundColor,
          fontFamily: getComputedStyle(document.body).fontFamily,
        }
      })()`,
    )
    const screenshot = await session.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
      fromSurface: true,
    })
    const bytes = Buffer.from(screenshot.data, "base64")
    const id =
      captureKind === "mobile-continuation"
        ? `home-mobile-continuation-${theme}`
        : `home-${viewportName}-${theme}`
    const filename = `${id}.png`
    await writeFile(path.join(screenshotRoot, filename), bytes)
    return {
      id,
      surface: "home-reference",
      captureKind,
      route: "/",
      viewport: { name: viewportName, ...viewport },
      theme,
      screenshot: {
        path: `migration/evidence/design-remediation/reference/screenshots/${filename}`,
        bytes: bytes.byteLength,
        sha256: sha256(bytes),
      },
      probe,
      status: "captured",
    }
  } finally {
    session.close()
  }
}

async function binding(relativePath) {
  const bytes = await readFile(path.join(repositoryRoot, relativePath))
  return { path: relativePath, bytes: bytes.byteLength, sha256: sha256(bytes) }
}

async function readPreviousHashes() {
  try {
    const previous = JSON.parse(await readFile(indexPath, "utf8"))
    return new Map(
      [...previous.matrix.cells, ...(previous.continuationMatrix?.cells ?? [])].map((cell) => [
        cell.id,
        cell.screenshot.sha256,
      ]),
    )
  } catch {
    return null
  }
}

async function capture() {
  const sourceScan = await scanHomeReferenceSource()
  if (sourceScan.status !== "pass") {
    throw new Error(`reference source scan failed: ${JSON.stringify(sourceScan)}`)
  }
  const previousHashes = await readPreviousHashes()
  const sitePort = await getFreePort()
  const chromePort = await getFreePort()
  const chromeProfile = await mkdtemp(path.join(tmpdir(), "dev-uni-reference-chrome-"))
  const baseUrl = `http://127.0.0.1:${sitePort}/`
  let siteServer
  let chrome
  try {
    siteServer = createServer(async (request, response) => {
      const pathname = new URL(request.url, baseUrl).pathname
      const file = pathname === "/home.css" ? "home.css" : pathname === "/" ? "home.html" : null
      if (!file) {
        response.statusCode = 404
        response.end("Not found")
        return
      }
      const bytes = await readFile(path.join(referenceRoot, file))
      response.setHeader(
        "content-type",
        file.endsWith(".css") ? "text/css; charset=utf-8" : "text/html; charset=utf-8",
      )
      response.setHeader("cache-control", "no-store")
      response.end(bytes)
    })
    await new Promise((resolveListen) => siteServer.listen(sitePort, "127.0.0.1", resolveListen))
    chrome = spawn(
      chromePath,
      [
        "--headless=new",
        `--remote-debugging-port=${chromePort}`,
        `--user-data-dir=${chromeProfile}`,
        "--disable-background-networking",
        "--disable-component-update",
        "--disable-default-apps",
        "--disable-sync",
        "--disable-lcd-text",
        "--font-render-hinting=none",
        "--force-device-scale-factor=1",
        "--hide-scrollbars",
        "--lang=ko-KR",
        "about:blank",
      ],
      { stdio: "ignore" },
    )
    const browser = await waitForChrome(chromePort)
    await mkdir(screenshotRoot, { recursive: true })
    const cells = []
    for (const [viewportName, viewport] of Object.entries(viewports)) {
      for (const theme of themes) {
        cells.push(await captureCell(chromePort, baseUrl, viewportName, viewport, theme))
      }
    }
    const continuationCells = []
    for (const theme of themes) {
      continuationCells.push(
        await captureCell(
          chromePort,
          baseUrl,
          "mobile",
          viewports.mobile,
          theme,
          "mobile-continuation",
        ),
      )
    }
    const allCells = [...cells, ...continuationCells]
    const bindings = {
      design: await binding("DESIGN.md"),
      visualBrief: await binding("migration/evidence/design-remediation/visual-brief.md"),
      legacyBaseline: await binding(
        "migration/evidence/design-remediation/legacy-baseline/index.json",
      ),
      html: await binding("migration/evidence/design-remediation/reference/home.html"),
      css: await binding("migration/evidence/design-remediation/reference/home.css"),
    }
    const bindingIndexSha256 = sha256(
      Object.values(bindings)
        .map(({ path: bindingPath, sha256: hash }) => `${bindingPath}\0${hash}\n`)
        .join(""),
    )
    const identicalRerun = Boolean(
      previousHashes &&
      allCells.every((cell) => previousHashes.get(cell.id) === cell.screenshot.sha256) &&
      previousHashes.size === allCells.length,
    )
    const index = {
      schemaVersion: 1,
      status: "complete-candidate-reference",
      generatedAt: new Date().toISOString(),
      approvalState: "pending-owner-review",
      authorizesDirection: false,
      authorizesAssets: false,
      productionUiMutation: false,
      source: {
        kind: "standalone-static-review-reference",
        bindings,
        bindingIndexSha256,
      },
      captureEnvironment: {
        browser: browser.Browser,
        protocolVersion: browser["Protocol-Version"],
        deviceScaleFactor: 1,
        reducedMotion: true,
        baseUrl: "ephemeral-local-server-removed-after-capture",
        externalNetworkRequired: false,
      },
      validation: {
        sourceScan,
        expectedRealContentMarkers: requiredMarkers,
      },
      matrix: {
        expectedCellCount: 4,
        capturedCellCount: cells.length,
        missingCellIds: [
          "home-desktop-light",
          "home-desktop-dark",
          "home-mobile-light",
          "home-mobile-dark",
        ].filter((id) => !cells.some((cell) => cell.id === id)),
        viewports,
        themes,
        cells,
      },
      continuationMatrix: {
        purpose: "Show the deterministic navy identity-field to Canvas transition on mobile.",
        expectedCellCount: 2,
        capturedCellCount: continuationCells.length,
        missingCellIds: ["home-mobile-continuation-light", "home-mobile-continuation-dark"].filter(
          (id) => !continuationCells.some((cell) => cell.id === id),
        ),
        viewport: viewports.mobile,
        themes,
        cells: continuationCells,
      },
      reproducibility: {
        status: identicalRerun ? "verified-identical-rerun" : "requires-identical-rerun",
        comparedWithPriorIndex: previousHashes !== null,
        screenshotHashesIdentical: identicalRerun,
      },
      notes: [
        "This static reference is not production Quartz UI.",
        "No legacy or remote media is used.",
        "The reference and its hashes do not authorize direction or assets.",
      ],
    }
    await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`)
    if (identicalRerun) await loadAndVerifyHomeReference()
    console.log(
      `CAPTURED: ${cells.length}/4 Home reference cells and ${continuationCells.length}/2 mobile continuation cells; reproducibility ${index.reproducibility.status}.`,
    )
  } finally {
    if (chrome && chrome.exitCode === null) {
      const exited = new Promise((resolveExit) => chrome.once("close", resolveExit))
      chrome.kill("SIGTERM")
      await Promise.race([exited, sleep(2_000)])
      if (chrome.exitCode === null) chrome.kill("SIGKILL")
    }
    if (siteServer) await new Promise((resolveClose) => siteServer.close(resolveClose))
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        await rm(chromeProfile, { recursive: true, force: true })
        break
      } catch (error) {
        if (attempt === 4) throw error
        await sleep(100)
      }
    }
  }
}

await capture()
