import { spawn } from "node:child_process"
import { createHash } from "node:crypto"
import { createServer } from "node:http"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import handler from "serve-handler"
import WebSocket from "ws"

const quartzRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const repositoryRoot = path.resolve(quartzRoot, "../..")
const evidenceRoot = path.join(
  repositoryRoot,
  "migration/evidence/design-remediation/legacy-baseline",
)
const screenshotRoot = path.join(evidenceRoot, "screenshots")
const expectedLegacyCommit = "d92e3faa9deeb7a1b9406c6e36fbe8eac4a03443"
const chromePath =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

const surfaces = {
  home: "/",
  about: "/about/",
  article: "/brain/Java/Java/",
  project: "/project/",
}
const viewports = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1440, height: 1000 },
}
const themes = ["light", "dark"]
const expectedSurfaceMarkers = {
  home: "SECOND BRAIN",
  about: "Contact",
  article: "Java 특징",
  project: "MOABAM PROJECT",
}
const bindingPaths = [
  "config.toml",
  "layouts/index.html",
  "layouts/_default/about.html",
  "layouts/_default/single.html",
  "layouts/_default/project.html",
  "layouts/partials/head.html",
  "layouts/partials/header.html",
  "layouts/partials/footer.html",
  "layouts/partials/custommain.html",
  "assets/styles/custom.scss",
  "assets/styles/navheader.scss",
  "assets/styles/single-page.scss",
  "assets/styles/project-page.scss",
  "assets/js/darkmode.js",
  "content/about.md",
  "content/project.md",
  "content/brain/Java/Java.md",
]

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
const sha256 = (value) => createHash("sha256").update(value).digest("hex")

async function run(command, args, options = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? repositoryRoot,
      env: { ...process.env, ...(options.env ?? {}) },
      stdio: ["ignore", "pipe", "pipe"],
    })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (chunk) => (stdout += chunk))
    child.stderr.on("data", (chunk) => (stderr += chunk))
    child.once("error", reject)
    child.once("close", (code) => {
      if (code === 0) resolveRun({ stdout, stderr })
      else reject(new Error(`${command} exited ${code}\n${stdout}\n${stderr}`))
    })
  })
}

async function extractCommitSnapshot(commit, destination) {
  await new Promise((resolveExtract, reject) => {
    const archive = spawn("git", ["archive", commit], {
      cwd: repositoryRoot,
      stdio: ["ignore", "pipe", "pipe"],
    })
    const extract = spawn("tar", ["-x", "-C", destination], {
      stdio: ["pipe", "ignore", "pipe"],
    })
    let archiveError = ""
    let extractError = ""
    archive.stderr.on("data", (chunk) => (archiveError += chunk))
    extract.stderr.on("data", (chunk) => (extractError += chunk))
    archive.stdout.pipe(extract.stdin)
    archive.once("error", reject)
    extract.once("error", reject)
    let archiveCode
    let extractCode
    const finish = () => {
      if (archiveCode === undefined || extractCode === undefined) return
      if (archiveCode === 0 && extractCode === 0) resolveExtract()
      else reject(new Error(`snapshot extraction failed\n${archiveError}\n${extractError}`))
    }
    archive.once("close", (code) => {
      archiveCode = code
      finish()
    })
    extract.once("close", (code) => {
      extractCode = code
      finish()
    })
  })
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

async function capturePage(port, baseUrl, surface, route, viewportName, viewport, theme) {
  const targetResponse = await fetch(
    `http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`,
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
    await session.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `
        history.scrollRestoration = "manual";
        localStorage.setItem("theme", ${JSON.stringify(theme)});
        document.documentElement.setAttribute("saved-theme", ${JSON.stringify(theme)});
      `,
    })
    const loaded = session.once("Page.loadEventFired")
    const url = new URL(route, baseUrl).href
    await session.send("Page.navigate", { url })
    await loaded
    const probe = await evaluate(
      session,
      `(async () => {
        localStorage.setItem("theme", ${JSON.stringify(theme)})
        document.documentElement.setAttribute("saved-theme", ${JSON.stringify(theme)})
        history.scrollRestoration = "manual"
        window.scrollTo(0, 0)
        await document.fonts.ready
        await Promise.all(Array.from(document.images, image => image.complete
          ? Promise.resolve()
          : new Promise(resolve => {
              image.addEventListener("load", resolve, { once: true })
              image.addEventListener("error", resolve, { once: true })
            })))
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        const bodyText = document.body?.innerText ?? ""
        return {
          title: document.title,
          pathname: location.pathname,
          theme: document.documentElement.getAttribute("saved-theme"),
          width: innerWidth,
          height: innerHeight,
          scrollY,
          heading: document.querySelector("h1")?.textContent?.trim() ?? null,
          expectedMarkerFound: bodyText.includes(${JSON.stringify(expectedSurfaceMarkers)}[${JSON.stringify(surface)}]),
        }
      })()`,
    )
    if (probe.pathname !== new URL(route, baseUrl).pathname) {
      throw new Error(`${surface}: route mismatch ${probe.pathname}`)
    }
    if (
      probe.theme !== theme ||
      probe.width !== viewport.width ||
      probe.height !== viewport.height
    ) {
      throw new Error(`${surface}: capture environment mismatch`)
    }
    if (
      /^Files within\b/.test(probe.title) ||
      !probe.title.includes("개발자 유니의 두 번째 뇌") ||
      probe.heading !== "Dev Uni" ||
      probe.expectedMarkerFound !== true
    ) {
      throw new Error(
        `${surface}: expected legacy page content was not rendered: ${JSON.stringify(probe)}`,
      )
    }
    const screenshot = await session.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
      fromSurface: true,
    })
    const bytes = Buffer.from(screenshot.data, "base64")
    const filename = `${surface}-${viewportName}-${theme}.png`
    await writeFile(path.join(screenshotRoot, filename), bytes)
    return {
      id: `${surface}-${viewportName}-${theme}`,
      surface,
      route,
      url,
      viewport: { name: viewportName, ...viewport },
      theme,
      themeApplication: {
        mode: "synthetic-forced-local-storage",
        storageKey: "theme",
        htmlAttribute: "saved-theme",
        note: "Theme was forced for deterministic comparison; this is not a claim about the user's OS preference.",
      },
      screenshot: {
        path: `migration/evidence/design-remediation/legacy-baseline/screenshots/${filename}`,
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

async function capture() {
  const generatedAt = new Date().toISOString()
  const commit = (await run("git", ["rev-parse", "HEAD"])).stdout.trim()
  if (commit !== expectedLegacyCommit) {
    throw new Error(
      `legacy source commit mismatch: expected ${expectedLegacyCommit}, got ${commit}`,
    )
  }

  const sourceSnapshotRoot = await mkdtemp(path.join(tmpdir(), "dev-uni-legacy-source-"))
  await extractCommitSnapshot(commit, sourceSnapshotRoot)
  const snapshotIndexRoot = path.join(sourceSnapshotRoot, "assets/indices")
  await mkdir(snapshotIndexRoot, { recursive: true })
  await Promise.all([
    writeFile(path.join(snapshotIndexRoot, "contentIndex.json"), "{}\n"),
    writeFile(path.join(snapshotIndexRoot, "linkIndex.json"), "{}\n"),
  ])
  const bindings = []
  for (const relativePath of bindingPaths) {
    const bytes = await readFile(path.join(sourceSnapshotRoot, relativePath))
    bindings.push({ path: relativePath, bytes: bytes.byteLength, sha256: sha256(bytes) })
  }
  const bindingIndexSha256 = sha256(
    bindings.map((binding) => `${binding.path}\0${binding.sha256}\n`).join(""),
  )
  const buildRoot = await mkdtemp(path.join(tmpdir(), "dev-uni-legacy-build-"))
  const chromeProfile = await mkdtemp(path.join(tmpdir(), "dev-uni-legacy-chrome-"))
  const sitePort = await getFreePort()
  const chromePort = await getFreePort()
  const baseUrl = `http://127.0.0.1:${sitePort}/`
  let siteServer
  let chrome
  try {
    const build = await run(
      "hugo",
      [
        "--destination",
        buildRoot,
        "--cleanDestinationDir",
        "--baseURL",
        baseUrl,
        "--enableGitInfo=false",
      ],
      { cwd: sourceSnapshotRoot },
    )
    siteServer = createServer((request, response) => {
      const requestUrl = new URL(request.url, "http://localhost")
      if (requestUrl.pathname.endsWith("/")) {
        requestUrl.pathname += "index.html"
        request.url = `${requestUrl.pathname}${requestUrl.search}`
      }
      return handler(request, response, { public: buildRoot, cleanUrls: false })
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
        "--hide-scrollbars",
        "about:blank",
      ],
      { stdio: "ignore" },
    )
    const browser = await waitForChrome(chromePort)
    await mkdir(screenshotRoot, { recursive: true })
    const cells = []
    for (const [surface, route] of Object.entries(surfaces)) {
      for (const [viewportName, viewport] of Object.entries(viewports)) {
        for (const theme of themes) {
          cells.push(
            await capturePage(chromePort, baseUrl, surface, route, viewportName, viewport, theme),
          )
        }
      }
    }
    const index = {
      schemaVersion: 1,
      status: cells.length === 16 ? "complete-local-frozen-baseline" : "incomplete",
      generatedAt,
      source: {
        kind: "local-frozen-hugo-render-from-immutable-git-archive",
        repositoryCommit: commit,
        expectedLegacyCommit,
        userWorkingTreeReadForRender: false,
        snapshotTemporaryAndRemoved: true,
        bindings,
        bindingIndexSha256,
        syntheticBuildInputs: [
          {
            path: "assets/indices/contentIndex.json",
            sha256: sha256("{}\n"),
            reason: "Ignored generated search data is not required for visual baseline capture.",
          },
          {
            path: "assets/indices/linkIndex.json",
            sha256: sha256("{}\n"),
            reason: "Ignored generated graph data is not required for visual baseline capture.",
          },
        ],
      },
      captureEnvironment: {
        hugo: (await run("hugo", ["version"])).stdout.trim(),
        chrome: browser.Browser,
        protocolVersion: browser["Protocol-Version"],
        baseUrl,
        buildDestination: "temporary directory removed after capture",
        hugoWarnings: build.stderr.trim() || null,
      },
      matrix: {
        expectedCellCount: 16,
        capturedCellCount: cells.length,
        missingCellIds: [],
        surfaces: Object.keys(surfaces),
        viewports,
        themes,
        themeApplication:
          "Both themes are synthetic forced states using the legacy theme storage contract.",
        cells,
      },
      liveFrozenComparison: {
        status: "not-measured",
        liveCaptureIncluded: false,
        reason:
          "This evidence freezes the exact local legacy source at the recorded commit without depending on mutable production state. No live-production claim is made.",
      },
      reproduction: {
        workingDirectory: "migration/quartz-v5",
        command: "node ./tooling/design/capture-legacy-baseline.mjs",
        externalMutationPerformed: false,
      },
    }
    await writeFile(path.join(evidenceRoot, "index.json"), `${JSON.stringify(index, null, 2)}\n`)
    console.log(`CAPTURED: ${cells.length}/16 legacy baseline cells at ${evidenceRoot}`)
  } finally {
    if (chrome && chrome.exitCode === null) {
      chrome.kill("SIGTERM")
      await Promise.race([
        new Promise((resolveClose) => chrome.once("close", resolveClose)),
        sleep(2000),
      ])
    }
    if (siteServer) await new Promise((resolveClose) => siteServer.close(resolveClose))
    await Promise.all([
      rm(buildRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }),
      rm(chromeProfile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }),
      rm(sourceSnapshotRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }),
    ])
  }
}

await capture()
