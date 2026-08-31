import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { createServer } from "node:http"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import handler from "serve-handler"
import WebSocket from "ws"

const quartzRoot = path.resolve(import.meta.dirname, "../..")
const publicRoot = path.join(quartzRoot, "public")
const chromePath =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const sleep = (milliseconds) =>
  new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds))

const contracts = {
  "portfolio-index": {
    path: "/portfolio/",
    h1: "신재윤",
    tools: [0, 0, 0, 0, 0],
    listing: 0,
  },
  "portfolio-detail": {
    path: "/portfolio/iot-platform.html",
    h1: "의료 IoT 데이터 플랫폼",
    tools: [0, 0, 0, 0, 0],
    listing: 0,
  },
  "garden-index": {
    path: "/brain/",
    h1: "Brain",
    tools: [1, 1, 0, 0, 0],
    listing: 1,
  },
  "garden-detail": {
    path: "/brain/notes/java/jvm.html",
    h1: "Java Virtual Machine",
    tools: [1, 1, 0, 1, 1],
    listing: 0,
  },
  "articles-index": {
    path: "/articles/",
    h1: "글",
    tools: [0, 0, 0, 0, 0],
    listing: 0,
  },
  "article-detail": {
    path: "/articles/tistory/23.html",
    h1: "[오늘의 일기] 다시 기초로 돌아가야 하는 이유",
    tools: [0, 0, 1, 0, 1],
    listing: 0,
  },
}

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
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (await evaluate(session, expression)) return
    await sleep(50)
  }
  throw new Error(`Timed out waiting for ${label}`)
}

const probeExpression = `(() => {
  const count = selector => document.querySelectorAll(selector).length
  const targetSurfaceClasses = [
    ".dev-uni-surface-portfolio-index", ".dev-uni-surface-portfolio-detail",
    ".dev-uni-surface-garden-index", ".dev-uni-surface-garden-detail",
    ".dev-uni-surface-articles-index", ".dev-uni-surface-article-detail",
    "article.portfolio-index", "article.portfolio-detail", "article.garden-index",
    "article.garden-note", "article.articles-index", "article.article-detail",
  ]
  return {
    path: location.pathname,
    surface: document.querySelector(".dev-uni-frame")?.dataset.surface ?? null,
    h1: document.querySelector("h1")?.textContent.replace(/\\s+/g, " ").trim() ?? null,
    activeIsMain: document.activeElement?.matches("main#site-content") === true,
    readerMode: document.documentElement.getAttribute("reader-mode"),
    counts: {
      header: count(".dev-uni-frame > header"),
      main: count(".dev-uni-frame > main#site-content"),
      footer: count(".dev-uni-frame > footer"),
      h1: count(".dev-uni-frame h1"),
      search: count(".dev-uni-frame .search-button"),
      theme: count(".dev-uni-frame .darkmode"),
      explorer: count(".dev-uni-frame .explorer.nav-files-container"),
      graph: count(".dev-uni-frame .global-graph-outer"),
      toc: count(".dev-uni-frame .toc"),
      backlinks: count(".dev-uni-frame .backlinks"),
      reader: count(".dev-uni-frame .readermode"),
      listing: count(".dev-uni-frame .page-listing"),
      articleTitle: count(".dev-uni-frame .article-title"),
    },
    surfaceClassCounts: Object.fromEntries(targetSurfaceClasses.map(selector => [selector, count(selector)])),
    unhandledRejections: window.__g006UnhandledRejections ?? [],
  }
})()`

const explorerTreeExpression = `(() => {
  const links = Array.from(document.querySelectorAll('.explorer a.nav-file-title'))
  return {
    folders: document.querySelectorAll('.explorer .folder-container').length,
    links: links.length,
    blankLinks: links.filter(link => !link.textContent?.trim()).length,
  }
})()`

const mobileInlineTocExpression = `(() => {
  const frame = document.querySelector(
    '.dev-uni-surface-garden-detail, .dev-uni-surface-article-detail',
  )
  const pageHeader = frame?.querySelector(':scope > main .page-header .popover-hint')
  const title = pageHeader?.querySelector('.article-title')
  const meta = pageHeader?.querySelector('.content-meta')
  const toc = pageHeader?.querySelector('.toc.dev-uni-mobile-inline-toc')
  const article = frame?.querySelector(':scope > main > article')
  const follows = (first, second) => Boolean(
    first && second && (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING),
  )
  return {
    inline: Boolean(toc),
    afterTitle: follows(title, toc),
    afterMeta: meta ? follows(meta, toc) : true,
    beforeArticle: follows(toc, article),
  }
})()`

function assertMobileInlineToc(layout, surface) {
  assert.deepEqual(
    layout,
    { inline: true, afterTitle: true, afterMeta: true, beforeArticle: true },
    `${surface}: mobile TOC follows title and metadata`,
  )
}

function assertContract(snapshot, surface, { focus = true } = {}) {
  const contract = contracts[surface]
  assert.equal(snapshot.surface, surface)
  assert.equal(snapshot.h1, contract.h1)
  for (const name of ["header", "main", "footer", "h1", "search", "theme"]) {
    assert.equal(snapshot.counts[name], 1, `${surface}: ${name}`)
  }
  assert.deepEqual(
    [
      snapshot.counts.explorer,
      snapshot.counts.graph,
      snapshot.counts.toc,
      snapshot.counts.backlinks,
      snapshot.counts.reader,
    ],
    contract.tools,
    `${surface}: tool matrix`,
  )
  assert.equal(snapshot.counts.listing, contract.listing, `${surface}: FolderContent listing`)
  assert.equal(snapshot.unhandledRejections.length, 0, `${surface}: unhandled rejection`)
  if (focus) assert.equal(snapshot.activeIsMain, true, `${surface}: focus restored to main`)

  const expectedRoot = `.dev-uni-surface-${surface}`
  for (const [selector, count] of Object.entries(snapshot.surfaceClassCounts)) {
    const expected = selector === expectedRoot || selector === `article.${surface}`
    if (selector.startsWith(".dev-uni-surface-")) {
      assert.equal(count, expected ? 1 : 0, `${surface}: stale root class ${selector}`)
    }
  }
}

async function navigate(session, surface) {
  const pathName = contracts[surface].path
  await evaluate(
    session,
    `window.spaNavigate(new URL(${JSON.stringify(pathName)}, location.origin))`,
  )
  await waitFor(session, `location.pathname === ${JSON.stringify(pathName)}`, pathName)
  await sleep(100)
  const snapshot = await evaluate(session, probeExpression)
  assertContract(snapshot, surface)
  return snapshot
}

async function main() {
  const serverPort = await getFreePort()
  const chromePort = await getFreePort()
  const userDataDir = await mkdtemp(path.join(tmpdir(), "dev-uni-g006-spa-"))
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
    assert.equal(targetResponse.ok, true)
    const target = await targetResponse.json()
    session = new CdpSession(target.webSocketDebuggerUrl)
    await session.open()

    const consoleErrors = []
    const exceptions = []
    const externalRequests = []
    session.on("Runtime.consoleAPICalled", (event) => {
      if (event.type === "error")
        consoleErrors.push(event.args.map((arg) => arg.value ?? arg.description))
    })
    session.on("Runtime.exceptionThrown", (event) => {
      exceptions.push(event.exceptionDetails.exception?.description ?? event.exceptionDetails.text)
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
        window.__g006UnhandledRejections = []
        addEventListener("unhandledrejection", event => {
          window.__g006UnhandledRejections.push(String(event.reason?.stack ?? event.reason))
        })
      `,
    })

    const origin = `http://127.0.0.1:${serverPort}`
    const loaded = session.once("Page.loadEventFired")
    await session.send("Page.navigate", { url: `${origin}/portfolio/` })
    await loaded
    await waitFor(session, `document.querySelectorAll(".results-container").length === 1`, "search")
    await sleep(150)

    const snapshots = []
    const initial = await evaluate(session, probeExpression)
    assertContract(initial, "portfolio-index", { focus: false })
    snapshots.push(initial)
    snapshots.push(await navigate(session, "portfolio-detail"))
    snapshots.push(await navigate(session, "garden-index"))
    const collapsedBrainIndex = await evaluate(
      session,
      `(() => ({
        openFolders: document.querySelectorAll('.folder-outer.open').length,
        collapseAllControls: document.querySelectorAll('.dev-uni-collapse-all').length,
        savedState: localStorage.getItem('fileTree'),
      }))()`,
    )
    assert.equal(collapsedBrainIndex.openFolders, 0)
    assert.equal(collapsedBrainIndex.collapseAllControls, 1)
    assert.equal(collapsedBrainIndex.savedState, null)

    const initialBrainTree = await evaluate(session, explorerTreeExpression)
    assert.ok(initialBrainTree.folders > 0)
    assert.ok(initialBrainTree.links > 0)
    assert.equal(initialBrainTree.blankLinks, 0)

    const brainFolderState = await evaluate(
      session,
      `(() => {
        const button = document.querySelector('.explorer .folder-button')
        const container = button?.closest('.folder-container')
        const outer = container?.nextElementSibling
        button?.click()
        return {
          path: container?.getAttribute('data-folderpath') ?? null,
          open: outer?.classList.contains('open') ?? false,
          savedState: localStorage.getItem('fileTree'),
        }
      })()`,
    )
    assert.equal(brainFolderState.open, true)
    assert.ok(brainFolderState.path)
    assert.match(brainFolderState.savedState ?? "", /"collapsed":false/)
    snapshots.push(await navigate(session, "garden-detail"))
    const preservedBrainFolder = await evaluate(
      session,
      `(() => {
        const path = ${JSON.stringify(brainFolderState.path)}
        const container = Array.from(document.querySelectorAll('.folder-container'))
          .find(candidate => candidate.getAttribute('data-folderpath') === path)
        return container?.nextElementSibling?.classList.contains('open') ?? false
      })()`,
    )
    assert.equal(preservedBrainFolder, true)
    const preservedBrainTree = await evaluate(session, explorerTreeExpression)
    assert.deepEqual(preservedBrainTree, initialBrainTree)

    const tocFixturePath = "/brain/lectures/backend/kim-spring/spring-intro/spring-basic-01"
    await evaluate(
      session,
      `window.spaNavigate(new URL(${JSON.stringify(tocFixturePath)}, location.origin))`,
    )
    await waitFor(
      session,
      `location.pathname === ${JSON.stringify(tocFixturePath)}`,
      tocFixturePath,
    )
    await waitFor(
      session,
      `document.querySelector('.toc a[href="#서비스-개발"]') !== null`,
      "long Brain TOC fixture",
    )
    assertMobileInlineToc(await evaluate(session, mobileInlineTocExpression), "garden-detail")
    const tocAnchorOffset = await evaluate(
      session,
      `(async () => {
        const link = document.querySelector('.toc a[href="#서비스-개발"]')
        const hash = link?.getAttribute('href')
        const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null
        link?.click()
        await new Promise(resolve => setTimeout(resolve, 700))
        const headerBottom = document.querySelector('.dev-uni-header')?.getBoundingClientRect().bottom
        const targetTop = target?.getBoundingClientRect().top
        return { headerBottom, targetTop }
      })()`,
    )
    assert.equal(typeof tocAnchorOffset.headerBottom, "number")
    assert.equal(typeof tocAnchorOffset.targetTop, "number")
    assert.ok(tocAnchorOffset.targetTop >= tocAnchorOffset.headerBottom + 12)

    await waitFor(session, `document.querySelector("button.site-menu-toggle") !== null`, "mobile menu")
    await evaluate(session, `document.querySelector("button.site-menu-toggle").click(); true`)
    await waitFor(
      session,
      `document.documentElement.classList.contains("dev-uni-mobile-drawer-open")`,
      "mobile Brain drawer open",
    )
    await waitFor(
      session,
      `getComputedStyle(document.querySelector(".dev-uni-context.left")).opacity === "1"`,
      "mobile Brain drawer transition",
    )
    const explorerOpen = await evaluate(
      session,
      `(() => {
        const button = document.querySelector("button.site-menu-toggle")
        const explorer = document.querySelector(".explorer")
        const left = document.querySelector(".dev-uni-context.left")
        const backdrop = document.querySelector(".dev-uni-mobile-drawer-backdrop")
        const navigation = document.querySelector(".primary-navigation")
        const activeNavigationLink = navigation?.querySelector("a.active, a[aria-current='page']")
          ?? navigation?.querySelector("a")
        const navigationLinkRect = activeNavigationLink?.getBoundingClientRect()
        const navigationHit = navigationLinkRect
          ? document.elementFromPoint(
              navigationLinkRect.left + navigationLinkRect.width / 2,
              navigationLinkRect.top + navigationLinkRect.height / 2,
            )
          : null
        const graphButton = document.querySelector(".graph .global-graph-icon")
        const graphButtonRect = graphButton?.getBoundingClientRect()
        const graphButtonHit = graphButtonRect
          ? document.elementFromPoint(
              graphButtonRect.left + graphButtonRect.width / 2,
              graphButtonRect.top + graphButtonRect.height / 2,
            )
          : null
        const scrollTop = document.querySelector(".dev-uni-scroll-top")
        return {
          expanded: button?.getAttribute("aria-expanded"),
          explorerCollapsed: explorer?.classList.contains("collapsed"),
          explorerToggleHidden: getComputedStyle(document.querySelector("button.mobile-explorer")).display,
          leftPosition: getComputedStyle(left).position,
          leftVisible: getComputedStyle(left).opacity,
          backdropEvents: getComputedStyle(backdrop).pointerEvents,
          navigationEvents: getComputedStyle(navigation).pointerEvents,
          navigationLinkClickable: Boolean(navigationHit?.closest("a") === activeNavigationLink),
          navigationLinkWidth: navigationLinkRect?.width,
          navigationWidth: navigation?.getBoundingClientRect().width,
          graphPosition: getComputedStyle(graphButton.closest(".graph")).position,
          graphVisible: getComputedStyle(graphButton).display,
          graphClickable: Boolean(graphButtonHit?.closest("button") === graphButton),
          scrollTopVisible: getComputedStyle(scrollTop).opacity,
          scrollTopEvents: getComputedStyle(scrollTop).pointerEvents,
        }
      })()`,
    )
    assert.equal(explorerOpen.expanded, "true")
    assert.equal(explorerOpen.explorerCollapsed, false)
    assert.equal(explorerOpen.explorerToggleHidden, "none")
    assert.equal(explorerOpen.leftPosition, "fixed")
    assert.equal(explorerOpen.leftVisible, "1")
    assert.equal(explorerOpen.backdropEvents, "auto")
    assert.equal(explorerOpen.navigationEvents, "auto")
    assert.equal(explorerOpen.navigationLinkClickable, true)
    assert.ok(explorerOpen.navigationLinkWidth < explorerOpen.navigationWidth / 3)
    assert.equal(explorerOpen.graphPosition, "fixed")
    assert.notEqual(explorerOpen.graphVisible, "none")
    assert.equal(explorerOpen.graphClickable, true)
    assert.equal(explorerOpen.scrollTopVisible, "1")
    assert.equal(explorerOpen.scrollTopEvents, "auto")
    const folderOpened = await evaluate(
      session,
      `(() => {
        const button = Array.from(document.querySelectorAll('.explorer .folder-button'))
          .find(candidate => !candidate.closest('.folder-container')?.nextElementSibling?.classList.contains('open'))
        if (!button) return false
        button.click()
        return Boolean(button.closest('.folder-container')?.nextElementSibling?.classList.contains('open'))
      })()`,
    )
    assert.equal(folderOpened, true)
    await evaluate(session, `document.querySelector('.dev-uni-collapse-all').click(); true`)
    assert.equal(
      await evaluate(session, `document.querySelectorAll('.folder-outer.open').length`),
      0,
    )
    assert.equal(await evaluate(session, `localStorage.getItem('fileTree')`), null)

    await evaluate(session, `document.querySelector('.dev-uni-mobile-drawer-backdrop').click(); true`)
    await waitFor(
      session,
      `!document.documentElement.classList.contains("dev-uni-mobile-drawer-open")`,
      "mobile Brain drawer close",
    )
    await session.send("Emulation.setDeviceMetricsOverride", {
      width: 1200,
      height: 768,
      deviceScaleFactor: 1,
      mobile: true,
    })
    await waitFor(session, `matchMedia("(max-width: 1200px)").matches`, "compact breakpoint")
    await evaluate(session, `document.querySelector("button.site-menu-toggle").click(); true`)
    await waitFor(
      session,
      `document.documentElement.classList.contains("dev-uni-mobile-drawer-open")`,
      "tablet Brain drawer open",
    )
    const tabletDrawer = await evaluate(
      session,
      `(() => ({
        toggleDisplay: getComputedStyle(document.querySelector("button.site-menu-toggle")).display,
        leftPosition: getComputedStyle(document.querySelector(".dev-uni-context.left")).position,
        leftVisible: getComputedStyle(document.querySelector(".dev-uni-context.left")).opacity,
        navigationEvents: getComputedStyle(document.querySelector(".primary-navigation")).pointerEvents,
        backdropEvents: getComputedStyle(document.querySelector(".dev-uni-mobile-drawer-backdrop")).pointerEvents,
      }))()`,
    )
    assert.notEqual(tabletDrawer.toggleDisplay, "none")
    assert.equal(tabletDrawer.leftPosition, "fixed")
    assert.equal(tabletDrawer.leftVisible, "1")
    assert.equal(tabletDrawer.navigationEvents, "auto")
    assert.equal(tabletDrawer.backdropEvents, "auto")
    await evaluate(session, `document.querySelector('.dev-uni-mobile-drawer-backdrop').click(); true`)
    await waitFor(
      session,
      `!document.documentElement.classList.contains("dev-uni-mobile-drawer-open")`,
      "1200px Brain drawer close",
    )
    await session.send("Emulation.setDeviceMetricsOverride", {
      width: 1201,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false,
    })
    await waitFor(
      session,
      `!matchMedia("(max-width: 1200px)").matches`,
      "desktop breakpoint",
    )
    assert.equal(
      await evaluate(
        session,
        `getComputedStyle(document.querySelector("button.site-menu-toggle")).display`,
      ),
      "none",
    )
    await session.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    })

    snapshots.push(await navigate(session, "articles-index"))
    assert.equal(await evaluate(session, `localStorage.getItem('fileTree')`), null)
    snapshots.push(await navigate(session, "article-detail"))
    assertMobileInlineToc(await evaluate(session, mobileInlineTocExpression), "article-detail")
    await evaluate(session, `document.querySelector("button.readermode").click(); true`)
    await waitFor(
      session,
      `document.documentElement.getAttribute("reader-mode") === "on"`,
      "Reader mode",
    )

    await evaluate(
      session,
      `window.spaNavigate(new URL("/articles/tistory/17.html", location.origin))`,
    )
    await waitFor(session, `location.pathname === "/articles/tistory/17.html"`, "Tistory 17")
    await sleep(100)
    const tistory = await evaluate(session, probeExpression)
    assert.equal(tistory.surface, "article-detail")
    assert.equal(tistory.counts.explorer, 0)
    assert.equal(tistory.counts.graph, 0)
    assert.equal(tistory.counts.reader, 1)
    assert.equal(tistory.counts.listing, 0)
    assert.equal(tistory.readerMode, "on")
    snapshots.push(tistory)

    await evaluate(session, `history.back(); true`)
    await waitFor(session, `location.pathname === "/articles/tistory/23.html"`, "history back")
    await sleep(100)
    const afterBack = await evaluate(session, probeExpression)
    assertContract(afterBack, "article-detail")
    assert.equal(afterBack.readerMode, "on")
    snapshots.push(afterBack)

    await evaluate(session, `history.forward(); true`)
    await waitFor(session, `location.pathname === "/articles/tistory/17.html"`, "history forward")
    await sleep(100)
    const afterForward = await evaluate(session, probeExpression)
    assert.equal(afterForward.surface, "article-detail")
    assert.equal(afterForward.counts.explorer, 0)
    assert.equal(afterForward.counts.graph, 0)
    assert.equal(afterForward.counts.listing, 0)
    snapshots.push(afterForward)

    await evaluate(
      session,
      `(() => {
        document.querySelector(".search-button").click()
        const input = document.querySelector(".search-bar")
        input.value = "의료 IoT 데이터 플랫폼"
        input.dispatchEvent(new Event("input", { bubbles: true }))
      })()`,
    )
    await waitFor(
      session,
      `Boolean(document.querySelector('.result-card[href*="portfolio/iot-platform"]'))`,
      "Portfolio search result",
    )
    await evaluate(
      session,
      `document.querySelector('.result-card[href*="portfolio/iot-platform"]').click(); true`,
    )
    await waitFor(
      session,
      `location.pathname === "/portfolio/iot-platform" || location.pathname === "/portfolio/iot-platform.html"`,
      "search navigation",
    )
    await sleep(100)
    const searchPortfolio = await evaluate(session, probeExpression)
    assertContract(searchPortfolio, "portfolio-detail")
    assert.notEqual(searchPortfolio.readerMode, "on")
    snapshots.push(searchPortfolio)

    await evaluate(session, `window.spaNavigate(new URL("/", location.origin))`)
    await waitFor(session, `location.pathname === "/"`, "Home")
    await sleep(100)
    const home = await evaluate(session, probeExpression)
    assert.equal(home.surface, "home")
    assert.equal(home.h1, "SECONDBRAIN")
    assert.deepEqual(
      [
        home.counts.explorer,
        home.counts.graph,
        home.counts.toc,
        home.counts.backlinks,
        home.counts.reader,
        home.counts.listing,
        home.counts.articleTitle,
      ],
      [0, 0, 0, 0, 0, 0, 0],
    )
    assert.ok(Object.values(home.surfaceClassCounts).every((count) => count === 0))
    assert.equal(home.activeIsMain, true)
    assert.equal(home.unhandledRejections.length, 0)
    snapshots.push(home)

    const knownGraphErrors = consoleErrors.filter(
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
    assert.ok(externalRequests.every(({ method }) => method === "GET"))

    const report = {
      schemaVersion: 1,
      goalId: "G006-differentiate-content-surfaces",
      status: "PASS",
      runtime: { node: process.version, browser: chromeVersion.Browser },
      viewport: { width: 390, height: 844 },
      sequence: [
        "portfolio-index",
        "portfolio-detail",
        "garden-index",
        "explorer-initially-collapsed",
        "garden-detail",
        "explorer-open",
        "explorer-collapse-all",
        "articles-index",
        "article-detail",
        "reader-on",
        "tistory-17",
        "history-back",
        "history-forward",
        "search-portfolio-detail",
        "home-stale-state-check",
      ],
      assertions: {
        exactSurfaceSequence: "PASS",
        uniqueShellAndTools: "PASS",
        nativeFolderContentOwnership: "PASS",
        explorerTreeSurvivesSpaNavigation: "PASS",
        tocAnchorsClearStickyHeader: "PASS",
        explorerLifecycle: "PASS",
        explorerStartsCollapsedAndCollapsesAll: "PASS",
        readerLifecycle: "PASS",
        tistoryTocNotForced: "PASS",
        historyBackForward: "PASS",
        searchCrossSurface: "PASS",
        homeHasNoStaleToolsTitleListingOrClasses: "PASS",
        browserErrors: "PASS",
        externalMutation: "PASS",
      },
      snapshots,
      knownGraphErrors,
      unexpectedConsoleErrors,
      exceptions,
      interceptedExternalRequests: externalRequests,
      externalMutationPerformed: false,
    }
    const outputIndex = process.argv.indexOf("--output")
    if (outputIndex >= 0) {
      const outputPath = path.resolve(process.cwd(), process.argv[outputIndex + 1])
      await mkdir(path.dirname(outputPath), { recursive: true })
      await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`)
    }
    process.stdout.write(`${JSON.stringify(report.assertions, null, 2)}\n`)
  } finally {
    session?.close()
    chrome?.kill("SIGTERM")
    await new Promise((resolveClose) => server.close(resolveClose))
    await rm(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
}

await main()
