import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { createServer } from "node:http"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import handler from "serve-handler"
import WebSocket from "ws"

const quartzRoot = path.resolve(import.meta.dirname, "../..")
const publicRoot = path.join(quartzRoot, "public")
const chromePath =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const sleep = (milliseconds) =>
  new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds))

class CdpSession {
  constructor(url) {
    this.nextId = 0
    this.pending = new Map()
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
    })
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) ?? []
    listeners.push(listener)
    this.listeners.set(method, listeners)
  }

  once(method) {
    return new Promise((resolveEvent) => {
      const listener = (params) => {
        const listeners = this.listeners.get(method) ?? []
        this.listeners.set(
          method,
          listeners.filter((candidate) => candidate !== listener),
        )
        resolveEvent(params)
      }
      this.on(method, listener)
    })
  }

  send(method, params = {}) {
    const id = ++this.nextId
    return new Promise((resolveSend, reject) => {
      this.pending.set(id, { resolve: resolveSend, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
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

async function waitFor(session, expression, label) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (await evaluate(session, expression)) return
    await sleep(50)
  }
  throw new Error(`Timed out waiting for ${label}`)
}

const probeExpression = `(() => {
  const count = selector => document.querySelectorAll(selector).length
  const pageViews = Array.from(window.dataLayer ?? [], entry => Array.from(entry))
    .filter(entry => entry[0] === "event" && entry[1] === "page_view")
    .map(entry => entry[2])
  const articleCounter = document.querySelector(".article-view-counter")
  return {
    path: location.pathname,
    surface: document.querySelector(".dev-uni-frame[data-surface]")?.dataset.surface ?? null,
    theme: document.documentElement.getAttribute("saved-theme"),
    readerMode: document.documentElement.getAttribute("reader-mode"),
    activeElement: document.activeElement?.matches("main#site-content")
      ? "main"
      : document.activeElement?.className || document.activeElement?.tagName || null,
    activeNavigation: Array.from(document.querySelectorAll(".primary-navigation [aria-current=page]"), element => element.textContent.trim()),
    counts: {
      header: count(".dev-uni-frame > header"),
      footer: count(".dev-uni-frame > footer"),
      main: count(".dev-uni-frame > main#site-content"),
      h1: count(".dev-uni-frame h1"),
      search: count(".dev-uni-frame div.search"),
      searchContainer: count(".dev-uni-frame .search-container"),
      searchResultsContainer: count(".dev-uni-frame .results-container"),
      searchGhost: count(".dev-uni-frame .ghost-text"),
      searchTags: count(".dev-uni-frame .tag-suggestions"),
      darkmode: count(".dev-uni-frame button.darkmode"),
      readermode: count(".dev-uni-frame button.readermode"),
      explorer: count(".dev-uni-frame div.explorer.nav-files-container"),
      graph: count(".dev-uni-frame div.graph"),
      toc: count(".dev-uni-frame div.toc"),
      backlinks: count(".dev-uni-frame div.backlinks"),
      globalCounter: count(".dev-uni-frame > footer .visit-counters"),
      articleCounter: count(".dev-uni-frame .article-view-counter"),
    },
    counterStates: Array.from(document.querySelectorAll("[data-counter]"), element => ({
      name: element.dataset.counter,
      state: element.dataset.state,
      text: element.textContent,
    })),
    articleCounterAfterMetadata: !articleCounter || articleCounter.previousElementSibling?.matches(".content-meta:not(.article-view-counter)") === true,
    pageViews,
    unhandledRejections: window.__g003UnhandledRejections ?? [],
  }
})()`

const routeContracts = {
  "/": {
    surface: "home",
    required: [],
    forbidden: ["explorer", "graph", "toc", "backlinks", "readermode"],
  },
  "/garden/progressive-discovery.html": {
    surface: "garden-detail",
    required: ["explorer", "graph", "toc", "backlinks", "readermode"],
    forbidden: [],
  },
  "/articles/tistory/23.html": {
    surface: "article-detail",
    required: ["readermode"],
    forbidden: ["explorer", "graph"],
  },
  "/articles/reading-first-design.html": {
    surface: "article-detail",
    required: ["toc", "backlinks", "readermode"],
    forbidden: ["explorer", "graph"],
  },
  "/portfolio/quartz-migration.html": {
    surface: "portfolio-detail",
    required: [],
    forbidden: ["explorer", "graph", "toc", "backlinks", "readermode"],
  },
  "/portfolio/quartz-migration": {
    surface: "portfolio-detail",
    required: [],
    forbidden: ["explorer", "graph", "toc", "backlinks", "readermode"],
  },
}

function assertSnapshot(snapshot, expectedPath, expectedPageViews) {
  const contract = routeContracts[expectedPath]
  assert.equal(snapshot.path, expectedPath)
  assert.equal(snapshot.surface, contract.surface)
  for (const name of [
    "header",
    "footer",
    "main",
    "search",
    "searchContainer",
    "searchResultsContainer",
    "searchGhost",
    "searchTags",
    "darkmode",
    "globalCounter",
  ]) {
    assert.equal(snapshot.counts[name], 1, `${expectedPath}: ${name}`)
  }
  for (const name of contract.required)
    assert.equal(snapshot.counts[name], 1, `${expectedPath}: ${name}`)
  for (const name of contract.forbidden)
    assert.equal(snapshot.counts[name], 0, `${expectedPath}: ${name}`)
  const isArticle = contract.surface === "article-detail"
  assert.equal(
    snapshot.counts.articleCounter,
    isArticle ? 1 : 0,
    `${expectedPath}: article counter`,
  )
  assert.equal(snapshot.articleCounterAfterMetadata, true, `${expectedPath}: counter placement`)
  assert.equal(snapshot.pageViews.length, expectedPageViews, `${expectedPath}: page_view count`)
  assert.equal(
    snapshot.pageViews.at(-1)?.page_location?.endsWith(expectedPath),
    true,
    `${expectedPath}: page_view location`,
  )
  assert.equal(snapshot.unhandledRejections.length, 0, `${expectedPath}: unhandled rejection`)
}

async function navigate(session, pathName, expectedPageViews) {
  await evaluate(
    session,
    `window.spaNavigate(new URL(${JSON.stringify(pathName)}, location.origin))`,
  )
  await waitFor(session, `location.pathname === ${JSON.stringify(pathName)}`, pathName)
  await waitFor(
    session,
    `Array.from(window.dataLayer ?? [], entry => Array.from(entry)).filter(entry => entry[0] === "event" && entry[1] === "page_view").length === ${expectedPageViews}`,
    `${pathName} analytics`,
  )
  await sleep(100)
  const snapshot = await evaluate(session, probeExpression)
  assertSnapshot(snapshot, pathName, expectedPageViews)
  return snapshot
}

async function traverseHistory(session, direction, expectedPath, expectedPageViews) {
  await evaluate(session, `history.${direction}(); true`)
  await waitFor(
    session,
    `location.pathname === ${JSON.stringify(expectedPath)}`,
    `${direction} ${expectedPath}`,
  )
  await waitFor(
    session,
    `Array.from(window.dataLayer ?? [], entry => Array.from(entry)).filter(entry => entry[0] === "event" && entry[1] === "page_view").length === ${expectedPageViews}`,
    `${direction} analytics`,
  )
  await sleep(100)
  const snapshot = await evaluate(session, probeExpression)
  assertSnapshot(snapshot, expectedPath, expectedPageViews)
  return snapshot
}

async function main() {
  const requireComplete = process.argv.includes("--require-complete")
  const serverPort = await getFreePort()
  const chromePort = await getFreePort()
  const userDataDir = await mkdtemp(path.join(tmpdir(), "dev-uni-g003-chrome-"))
  const server = createServer((request, response) =>
    handler(request, response, { public: publicRoot, cleanUrls: true }),
  )
  let chrome
  let session

  try {
    await new Promise((resolveListen) => server.listen(serverPort, "127.0.0.1", resolveListen))
    chrome = spawn(
      chromePath,
      [
        "--headless=new",
        "--disable-gpu",
        "--disable-background-networking",
        "--no-first-run",
        "--no-sandbox",
        `--remote-debugging-port=${chromePort}`,
        `--user-data-dir=${userDataDir}`,
        "about:blank",
      ],
      { stdio: "ignore" },
    )
    const chromeVersion = await waitForChrome(chromePort)
    const targetResponse = await fetch(
      `http://127.0.0.1:${chromePort}/json/new?${encodeURIComponent("about:blank")}`,
      { method: "PUT" },
    )
    assert.equal(
      targetResponse.ok,
      true,
      `Could not create Chrome target: ${targetResponse.status}`,
    )
    const target = await targetResponse.json()
    session = new CdpSession(target.webSocketDebuggerUrl)
    await session.open()

    const consoleErrors = []
    const exceptions = []
    const logErrors = []
    const externalRequests = []
    session.on("Runtime.consoleAPICalled", (event) => {
      if (event.type === "error")
        consoleErrors.push(event.args.map((arg) => arg.value ?? arg.description))
    })
    session.on("Runtime.exceptionThrown", (event) => {
      exceptions.push(event.exceptionDetails.exception?.description ?? event.exceptionDetails.text)
    })
    session.on("Log.entryAdded", ({ entry }) => {
      if (entry.level === "error" && entry.source !== "network") logErrors.push(entry.text)
    })
    session.on("Fetch.requestPaused", ({ requestId, request }) => {
      externalRequests.push({ url: request.url, method: request.method })
      void session.send("Fetch.fulfillRequest", {
        requestId,
        responseCode: request.url.includes("googletagmanager.com/gtag/js") ? 200 : 204,
        responseHeaders: [
          { name: "content-type", value: "application/javascript" },
          { name: "access-control-allow-origin", value: "*" },
        ],
        body: "",
      })
    })
    await Promise.all([
      session.send("Page.enable"),
      session.send("Runtime.enable"),
      session.send("Log.enable"),
      session.send("Fetch.enable", { patterns: [{ urlPattern: "https://*" }] }),
      session.send("Emulation.setDeviceMetricsOverride", {
        width: 390,
        height: 844,
        deviceScaleFactor: 1,
        mobile: true,
      }),
    ])
    await session.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `
        window.__g003UnhandledRejections = []
        addEventListener("unhandledrejection", event => {
          window.__g003UnhandledRejections.push(String(event.reason?.stack ?? event.reason))
        })
      `,
    })

    const origin = `http://127.0.0.1:${serverPort}`
    const loaded = session.once("Page.loadEventFired")
    await session.send("Page.navigate", { url: origin })
    await loaded
    await waitFor(
      session,
      `Array.from(window.dataLayer ?? [], entry => Array.from(entry)).some(entry => entry[0] === "event" && entry[1] === "page_view")`,
      "initial analytics",
    )
    await sleep(200)
    await waitFor(
      session,
      `document.querySelectorAll(".results-container").length === 1`,
      "search setup",
    )

    const snapshots = []
    const initial = await evaluate(session, probeExpression)
    const initialPageViews = initial.pageViews.length
    let expectedPageViews = initialPageViews
    assertSnapshot(initial, "/", expectedPageViews)
    snapshots.push(initial)

    await evaluate(session, `document.querySelector("button.darkmode").click(); true`)
    await waitFor(
      session,
      `document.documentElement.getAttribute("saved-theme") === "dark"`,
      "dark theme",
    )

    snapshots.push(
      await navigate(session, "/garden/progressive-discovery.html", ++expectedPageViews),
    )
    await waitFor(
      session,
      `!document.querySelector("button.mobile-explorer")?.classList.contains("hide-until-loaded")`,
      "mobile Explorer setup",
    )
    await evaluate(session, `document.querySelector("button.mobile-explorer").click(); true`)
    await waitFor(
      session,
      `document.querySelector("button.mobile-explorer")?.getAttribute("aria-expanded") === "true"`,
      "mobile Explorer expanded state",
    )
    const explorerState = await evaluate(
      session,
      `(() => {
        const button = document.querySelector("button.mobile-explorer")
        return { expanded: button.getAttribute("aria-expanded"), controls: button.getAttribute("aria-controls") }
      })()`,
    )
    assert.equal(explorerState.expanded, "true")
    assert.ok(explorerState.controls)

    const longArticle = await navigate(session, "/articles/tistory/23.html", ++expectedPageViews)
    assert.equal(longArticle.theme, "dark")
    await evaluate(session, `document.querySelector("button.readermode").click(); true`)
    await waitFor(
      session,
      `document.documentElement.getAttribute("reader-mode") === "on"`,
      "reader mode",
    )

    const shortArticle = await navigate(
      session,
      "/articles/reading-first-design.html",
      ++expectedPageViews,
    )
    assert.equal(shortArticle.theme, "dark")
    assert.equal(shortArticle.readerMode, "on")
    snapshots.push(longArticle, shortArticle)
    snapshots.push(
      await navigate(session, "/garden/progressive-discovery.html", ++expectedPageViews),
    )
    snapshots.push(
      await traverseHistory(
        session,
        "back",
        "/articles/reading-first-design.html",
        ++expectedPageViews,
      ),
    )
    snapshots.push(
      await traverseHistory(session, "back", "/articles/tistory/23.html", ++expectedPageViews),
    )
    snapshots.push(
      await traverseHistory(
        session,
        "forward",
        "/articles/reading-first-design.html",
        ++expectedPageViews,
      ),
    )
    const gardenAfterForward = await traverseHistory(
      session,
      "forward",
      "/garden/progressive-discovery.html",
      ++expectedPageViews,
    )
    snapshots.push(gardenAfterForward)

    await evaluate(
      session,
      `(() => {
        document.querySelector(".search-button").click()
        const input = document.querySelector(".search-bar")
        input.value = "Quartz 5"
        input.dispatchEvent(new Event("input", { bubbles: true }))
      })()`,
    )
    await waitFor(
      session,
      `Boolean(document.querySelector('.result-card[href*="portfolio/quartz-migration"]'))`,
      "cross-surface search result",
    )
    await evaluate(
      session,
      `document.querySelector('.result-card[href*="portfolio/quartz-migration"]').click(); true`,
    )
    await waitFor(
      session,
      `location.pathname === "/portfolio/quartz-migration"`,
      "search result navigation",
    )
    await waitFor(
      session,
      `Array.from(window.dataLayer ?? [], entry => Array.from(entry)).filter(entry => entry[0] === "event" && entry[1] === "page_view").length === ${++expectedPageViews}`,
      "search result analytics",
    )
    await sleep(100)
    const portfolio = await evaluate(session, probeExpression)
    assertSnapshot(portfolio, "/portfolio/quartz-migration", expectedPageViews)
    snapshots.push(portfolio)

    const expectedFailures = []
    if (initialPageViews !== 1) {
      expectedFailures.push({
        id: "analytics.initial-pageview-exactly-once",
        current: `Initial load records ${initialPageViews} GA4 page_view events; each later SPA transition increments by one.`,
        futurePassCondition:
          "Initial load and every SPA transition each record exactly one page_view event.",
        ownerStage: "G004",
      })
    }
    if (portfolio.activeElement !== "main") {
      expectedFailures.push({
        id: "spa.focus-restoration",
        current: `Search-result navigation leaves focus on ${portfolio.activeElement}.`,
        futurePassCondition:
          "Cross-surface SPA navigation restores focus to main or the new route heading.",
        ownerStage: "G004",
      })
    }
    if (gardenAfterForward.readerMode === "on") {
      expectedFailures.push({
        id: "spa.reader-state-boundary",
        current: "Reader mode remains active after leaving article surfaces.",
        futurePassCondition:
          "Reader state persists between articles but is cleared or made inert on non-article surfaces.",
        ownerStage: "G004-G006",
      })
    }

    const injectedFailureErrors = consoleErrors.filter(
      ([message]) =>
        message === "[Graph] Failed to load libraries:" ||
        message === "[Graph] Libraries not loaded",
    )
    const unexpectedConsoleErrors = consoleErrors.filter(
      ([message]) =>
        message !== "[Graph] Failed to load libraries:" &&
        message !== "[Graph] Libraries not loaded",
    )
    assert.deepEqual(unexpectedConsoleErrors, [])
    assert.deepEqual(exceptions, [])
    assert.deepEqual(logErrors, [])
    assert.ok(externalRequests.length > 0)
    assert.ok(externalRequests.every(({ method }) => method === "GET"))
    assert.ok(externalRequests.some(({ url }) => url.includes("/d3@7/")))
    assert.ok(externalRequests.some(({ url }) => url.includes("/pixi.js@8/")))

    const report = {
      schemaVersion: 1,
      status: expectedFailures.length === 0 ? "pass" : "pass-with-expected-failures",
      gateMode: requireComplete ? "require-complete" : "baseline-evidence",
      runtime: { node: process.version, browser: chromeVersion.Browser },
      viewport: { width: 390, height: 844 },
      assertions: {
        bidirectionalSpa: "pass",
        mobileGardenTool: "pass",
        searchCrossSurface: "pass",
        themeState: "pass",
        readerArticleState: "pass",
        uniqueRuntimeControls: "pass",
        counterPlacementAndState: "pass",
        analyticsNavigationIncrementExactlyOnce: "pass",
        analyticsInitialExactlyOnce: initialPageViews === 1 ? "pass" : "expected-failure",
        browserErrors: "pass",
        graphNetworkFailureDoesNotBlockReadingOrNavigation: "pass",
        externalMutation: "pass",
      },
      expectedFailureIds: expectedFailures.map(({ id }) => id),
      expectedFailures,
      snapshots,
      consoleErrors,
      injectedFailureErrors,
      unexpectedConsoleErrors,
      exceptions,
      logErrors,
      interceptedExternalRequests: externalRequests,
      externalMutationPerformed: false,
    }
    const outputIndex = process.argv.indexOf("--output")
    if (outputIndex >= 0) {
      const outputPath = path.resolve(process.cwd(), process.argv[outputIndex + 1])
      await mkdir(path.dirname(outputPath), { recursive: true })
      await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`)
    }
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
    if (requireComplete && expectedFailures.length > 0) process.exitCode = 1
  } finally {
    session?.close()
    chrome?.kill("SIGTERM")
    await new Promise((resolveClose) => server.close(resolveClose))
    await rm(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
}

await main()
