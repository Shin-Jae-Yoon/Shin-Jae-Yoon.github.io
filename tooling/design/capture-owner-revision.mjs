import { spawn } from "node:child_process"
import { createHash } from "node:crypto"
import { createServer } from "node:http"
import { mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import handler from "serve-handler"
import sharp from "sharp"
import WebSocket from "ws"

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)))
const publicDir = join(root, "public")
const evidenceDir = resolve(root, "../evidence/design-owner-revision")
const screenshotDir = join(evidenceDir, "screenshots")
const chromePath =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

const routes = {
  home: "/",
  about: "/about.html",
  "portfolio-index": "/portfolio/",
  "portfolio-detail": "/portfolio/iot-platform.html",
  "garden-index": "/brain/",
  "garden-detail": "/brain/notes/cs/ds/queue.html",
  "articles-index": "/articles/",
  "articles-category": "/articles/category/technical.html",
  "article-detail": "/articles/tistory/23.html",
}
const tistoryRepresentativeRoute = "/articles/tistory/23.html"
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
  "https://cdnjs.cloudflare.com/*",
  "https://*.goatcounter.com/*",
]
const expectedTools = {
  home: { explorer: 0, graph: 0, toc: 0, backlinks: 0, reader: 0, listing: 0 },
  about: { explorer: 0, graph: 0, toc: 0, backlinks: 0, reader: 0, listing: 0 },
  "portfolio-index": { explorer: 0, graph: 0, toc: 0, backlinks: 0, reader: 0, listing: 0 },
  "portfolio-detail": { explorer: 0, graph: 0, toc: 0, backlinks: 0, reader: 0, listing: 0 },
  "garden-index": { explorer: 1, graph: 1, toc: 0, backlinks: 0, reader: 1, listing: 1 },
  "garden-detail": { explorer: 1, graph: 1, toc: 1, backlinks: 1, reader: 1, listing: 0 },
  "articles-index": { explorer: 0, graph: 0, toc: 0, backlinks: 0, reader: 0, listing: 0 },
  "articles-category": { explorer: 0, graph: 0, toc: 0, backlinks: 0, reader: 0, listing: 0 },
  "article-detail": { explorer: 0, graph: 0, toc: 1, backlinks: 0, reader: 1, listing: 0 },
}

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms))
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex")

async function measurePortfolioIdentityInk(bytes, items, cssViewportWidth) {
  if (!bytes || items.length === 0) return null
  const { data, info } = await sharp(bytes).raw().toBuffer({ resolveWithObject: true })
  const scale = info.width / cssViewportWidth
  const pixel = (x, y) => {
    const offset = (y * info.width + x) * info.channels
    return [
      data[offset],
      data[offset + 1],
      data[offset + 2],
      info.channels > 3 ? data[offset + 3] : 255,
    ]
  }
  const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
  const starts = items.map((item) => {
    const left = Math.max(0, Math.floor(item.left * scale))
    const right = Math.min(info.width, Math.ceil(item.right * scale))
    const top = Math.max(0, Math.floor(item.top * scale))
    const bottom = Math.min(info.height, Math.ceil(item.bottom * scale))
    const background = pixel(Math.min(info.width - 1, right + 4), Math.floor((top + bottom) / 2))
    let inkLeft = null
    for (let x = left; x < right && inkLeft === null; x += 1) {
      for (let y = top; y < bottom; y += 1) {
        const candidate = pixel(x, y)
        if (candidate[3] > 200 && distance(candidate, background) > 48) {
          inkLeft = x
          break
        }
      }
    }
    return inkLeft
  })
  if (starts.some((value) => value === null)) return { starts, delta: null }
  return { starts, delta: Math.max(...starts) - Math.min(...starts) }
}

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

async function createPage(
  port,
  url,
  viewport,
  theme,
  { reducedMotion = true, deviceScaleFactor = 1 } = {},
) {
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
    deviceScaleFactor,
    mobile: false,
    positionX: 0,
    positionY: 0,
    dontSetVisibleSize: false,
  }
  await session.send("Emulation.setDeviceMetricsOverride", deviceMetrics)
  await session.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "prefers-reduced-motion", value: reducedMotion ? "reduce" : "no-preference" },
    ],
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

  const navigation = await session.send("Page.navigate", { url })
  const expectedOrigin = new URL(url).origin
  let lastPageState = null
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const pageState = await evaluate(
      session,
      `({ href: location.href, readyState: document.readyState })`,
    )
    lastPageState = pageState
    if (pageState.href.startsWith(expectedOrigin) && pageState.readyState === "complete") break
    if (attempt === 99) {
      throw new Error(
        `Page did not finish navigating to ${url}: ${JSON.stringify({ navigation, lastPageState })}`,
      )
    }
    await sleep(50)
  }
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
      document.querySelectorAll("img[loading='lazy']").forEach(image => { image.loading = "eager" })
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

async function waitForDocumentReady(session) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const ready = await evaluate(session, "document.readyState").catch(() => null)
    if (ready === "complete") return
    await sleep(50)
  }
  throw new Error("Page did not reach document.readyState=complete")
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
    ".dev-uni-context a", ".dev-uni-context h3", ".portfolio-page p", ".portfolio-page dd",
    ".portfolio-work-project li", ".portfolio-work-project h4", ".portfolio-work-project dt",
    ".portfolio-work-project .portfolio-project-context",
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
    ".search-button, .darkmode, .readermode, .site-menu-toggle, .mobile-explorer, .global-graph-icon, .primary-navigation a",
  )).filter(visible).map(element => {
    const rect = element.getBoundingClientRect()
    return {
      className: element.className,
      width: Number(rect.width.toFixed(2)),
      height: Number(rect.height.toFixed(2)),
      pass: rect.width >= 44 && rect.height >= 44,
    }
  })
  const firstListing = document.querySelector(".page-listing .section-li, .articles-archive li")
  const firstListingRect = firstListing?.getBoundingClientRect()
  const portfolioTagRows = new Set(
    Array.from(document.querySelectorAll(".dev-uni-surface-portfolio-index .tag-link"))
      .filter(visible)
      .map(element => Math.round(element.getBoundingClientRect().top)),
  ).size
  const graphOuter = document.querySelector(".graph > .graph-outer")
  const graphOuterRect = graphOuter?.getBoundingClientRect()
  const articleMain = document.querySelector(".dev-uni-surface-article-detail > main")
  const articleMainRect = articleMain?.getBoundingClientRect()
  const articleToc = document.querySelector(".dev-uni-surface-article-detail > .dev-uni-context.right .toc")
  const articleTocRect = articleToc?.getBoundingClientRect()
  const gardenMain = document.querySelector(".dev-uni-surface-garden-detail > main")
  const gardenMainRect = gardenMain?.getBoundingClientRect()
  const primaryTitle = document.querySelector("main h1")
  const alignedShell = document.querySelector(".about-introduction, .portfolio-hero")
  const alignedShellRect = alignedShell?.getBoundingClientRect()
  const portfolioIdentityRect = document.querySelector(".portfolio-identity")?.getBoundingClientRect()
  const portfolioContactRect = document.querySelector(".portfolio-contact")?.getBoundingClientRect()
  const portfolioIdentityItems = Array.from(document.querySelectorAll(
    ".portfolio-identity > .home-section-label, .portfolio-identity > h1, .portfolio-identity > .portfolio-role",
  )).map(element => {
    const rect = element.getBoundingClientRect()
    return {
      tag: element.tagName.toLowerCase(),
      className: element.className,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
    }
  })
  const portfolioIdentityItemRects = portfolioIdentityItems.map(item => ({ left: item.left }))
  const portfolioIdentityLefts = portfolioIdentityItemRects.map(rect => rect.left)
  const aboutPortraitRect = document.querySelector(".about-portrait")?.getBoundingClientRect()
  const aboutTitle = document.querySelector(".about-heading h1")
  const headerUtilityRects = Array.from(
    document.querySelectorAll(".dev-uni-header .search-button, .dev-uni-header .darkmode, .dev-uni-header .readermode"),
  )
    .filter(visible)
    .map(element => element.getBoundingClientRect())
  const headerUtilityCenters = headerUtilityRects.map(rect => (rect.top + rect.bottom) / 2)
  const visibleHeaderIcons = Array.from(document.querySelectorAll(
    ".dev-uni-header .search-button svg, .dev-uni-header .darkmode svg, .dev-uni-header .readermode svg",
  )).filter(visible)
  const visibleHeaderIconCenters = visibleHeaderIcons.map(icon => {
    const rect = icon.getBoundingClientRect()
    return (rect.top + rect.bottom) / 2
  })
  const portfolioEmail = document.querySelector(".portfolio-contact-email a")
  const metricItems = Array.from(document.querySelectorAll(".portfolio-project-metrics > div"))
  const metricRects = metricItems.map(item => item.getBoundingClientRect())
  const portfolioMetricOverlap = metricRects.some((rect, index) => metricRects
    .slice(index + 1)
    .some(other => Math.min(rect.right, other.right) - Math.max(rect.left, other.left) > 1 &&
      Math.min(rect.bottom, other.bottom) - Math.max(rect.top, other.top) > 1))
  const portfolioMetricWrappedValues = Array.from(document.querySelectorAll(".portfolio-project-metrics dt"))
    .filter(value => {
      const style = getComputedStyle(value)
      return value.getBoundingClientRect().height > Number.parseFloat(style.lineHeight) * 1.45
    })
  const portfolioMetricOverflowValues = Array.from(
    document.querySelectorAll(".portfolio-project-metrics dt"),
  ).filter(value => {
    const valueRect = value.getBoundingClientRect()
    const cellRect = value.parentElement?.getBoundingClientRect()
    return value.scrollWidth > value.clientWidth + 1 || Boolean(cellRect && valueRect.right > cellRect.right + 1)
  })
  const articleImages = Array.from(document.querySelectorAll(".dev-uni-surface-article-detail article img"))
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
  const verticalScrollers = selector => Array.from(document.querySelectorAll(selector)).filter(element => {
    const overflowY = getComputedStyle(element).overflowY
    return (overflowY === "auto" || overflowY === "scroll") &&
      element.scrollHeight > element.clientHeight + 1
  })
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
    portfolioInternalLinkCount: document.querySelectorAll(".portfolio-page a.internal").length,
    portfolioMetricCount: document.querySelectorAll(".portfolio-project-metrics > div").length,
    portfolioMetricOverlap,
    portfolioMetricWrappedValueCount: portfolioMetricWrappedValues.length,
    portfolioMetricOverflowValueCount: portfolioMetricOverflowValues.length,
    portfolioEmailLineCount: portfolioEmail ? portfolioEmail.getClientRects().length : null,
    alignedShellLeft: alignedShellRect ? Number(alignedShellRect.left.toFixed(2)) : null,
    portfolioIdentityAlignmentDelta: portfolioIdentityLefts.length > 1
      ? Number((Math.max(...portfolioIdentityLefts) - Math.min(...portfolioIdentityLefts)).toFixed(2))
      : null,
    portfolioIdentityItems,
    portfolioHeroColumnGap: portfolioIdentityRect && portfolioContactRect
      ? Number((portfolioContactRect.left - portfolioIdentityRect.right).toFixed(2))
      : null,
    portfolioHeroTopDelta: portfolioIdentityRect && portfolioContactRect
      ? Number(Math.abs(portfolioIdentityRect.top - portfolioContactRect.top).toFixed(2))
      : null,
    explorerOpenFolderCount: document.querySelectorAll(
      ".dev-uni-surface-garden-index .folder-outer.open, .dev-uni-surface-garden-detail .folder-outer.open",
    ).length,
    explorerCollapseAllCount: document.querySelectorAll(
      ".dev-uni-surface-garden-index .dev-uni-collapse-all, .dev-uni-surface-garden-detail .dev-uni-collapse-all",
    ).length,
    explorerVerticalScrollerCount: verticalScrollers(
      ".dev-uni-surface-garden-index .explorer *, .dev-uni-surface-garden-detail .explorer *",
    ).length,
    rightRailVerticalScrollerCount: verticalScrollers(
      ".dev-uni-surface-garden-index > .dev-uni-context.right *, .dev-uni-surface-garden-detail > .dev-uni-context.right *, .dev-uni-surface-article-detail > .dev-uni-context.right *",
    ).length,
    homeHasSecondBrain: document.querySelector(".home-title")?.textContent.replace(/\s+/g, "").trim() === "SECONDBRAIN",
    homeNeuralVisualCount: document.querySelectorAll(".home-neural-visual svg").length,
    aboutPortraitCount: document.querySelectorAll(".about-portrait img").length,
    aboutPortraitBroken: Array.from(document.querySelectorAll(".about-portrait img"))
      .filter(image => !image.complete || image.naturalWidth === 0).length,
    aboutPortraitWidth: aboutPortraitRect ? Number(aboutPortraitRect.width.toFixed(2)) : null,
    aboutTitleFontSize: aboutTitle ? Number.parseFloat(getComputedStyle(aboutTitle).fontSize) : null,
    headerUtilityCenterDelta: headerUtilityCenters.length > 1
      ? Number((Math.max(...headerUtilityCenters) - Math.min(...headerUtilityCenters)).toFixed(2))
      : 0,
    headerIconCenterDelta: visibleHeaderIconCenters.length > 1
      ? Number((Math.max(...visibleHeaderIconCenters) - Math.min(...visibleHeaderIconCenters)).toFixed(2))
      : 0,
    darkmodeVisibleIconCount: Array.from(document.querySelectorAll(".darkmode svg"))
      .filter(visible).length,
    primaryTitleFontSize: primaryTitle ? Number.parseFloat(getComputedStyle(primaryTitle).fontSize) : null,
    graphState: graphOuter?.getAttribute("data-graph-state") ?? null,
    graphOuterHeight: graphOuterRect ? Number(graphOuterRect.height.toFixed(2)) : null,
    graphOuterWidth: graphOuterRect ? Number(graphOuterRect.width.toFixed(2)) : null,
    graphFallbackCount: document.querySelectorAll("[data-graph-fallback]").length,
    graphLegendDepths: Array.from(document.querySelectorAll("[data-graph-legend] [data-graph-depth]"))
      .map(item => item.getAttribute("data-graph-depth")),
    surface: document.querySelector(".dev-uni-frame")?.getAttribute("data-surface"),
    pageListingCount: document.querySelectorAll(".page-listing").length,
    explorerCount: document.querySelectorAll(".explorer.nav-files-container").length,
    graphCount: document.querySelectorAll(".global-graph-outer").length,
    tocCount: document.querySelectorAll(".toc").length,
    backlinksCount: document.querySelectorAll(".backlinks").length,
    readerCount: document.querySelectorAll(".readermode").length,
    articleCenterDelta: articleMainRect
      ? Number((((articleMainRect.left + articleMainRect.right) / 2) - document.documentElement.clientWidth / 2).toFixed(2))
      : null,
    articleMainWidth: articleMainRect ? Number(articleMainRect.width.toFixed(2)) : null,
    gardenMainWidth: gardenMainRect ? Number(gardenMainRect.width.toFixed(2)) : null,
    articleTocGap: articleMainRect && articleTocRect
      ? Number((articleTocRect.left - articleMainRect.right).toFixed(2))
      : null,
    articleTocEntries: document.querySelectorAll(".toc-content li:not(.overflow-end)").length,
    articleImageCount: articleImages.length,
    articleBrokenImages: articleImages.filter(image => !image.complete || image.naturalWidth === 0).length,
    articleRemoteImageSources: articleImages
      .map(image => image.currentSrc || image.src)
      .filter(source => !new URL(source, location.href).pathname.includes("/static/tistory/")),
    articleBreadcrumbHasTistory: Array.from(document.querySelectorAll(".breadcrumb-element a"))
      .some(link => link.textContent.trim().toLowerCase() === "tistory"),
    articlesIndexRows: document.querySelectorAll(".articles-archive > ol > li").length,
    explorerRootPath: document.querySelector(".explorer")?.getAttribute("data-root-path") ?? null,
    explorerForeignLinks: Array.from(document.querySelectorAll(".explorer a.nav-file-title"))
      .map(link => link.getAttribute("href") || "")
      .filter(href => href && !href.includes("/brain/")),
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
    let screenshotBytes = null
    if (capture) {
      const result = await session.send("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
        captureBeyondViewport: false,
      })
      const bytes = Buffer.from(result.data, "base64")
      screenshotBytes = bytes
      const filename = `${idPrefix}-${viewportName}-${theme}.png`
      await writeFile(join(screenshotDir, filename), bytes)
      screenshot = {
        path: `migration/evidence/design-owner-revision/screenshots/${filename}`,
        bytes: bytes.byteLength,
        width: bytes.readUInt32BE(16),
        height: bytes.readUInt32BE(20),
        sha256: sha256(bytes),
      }
    }
    await resetPageScroll(session)
    const probe = await evaluate(session, probeExpression)
    if (expectedSurface === "portfolio-index" && screenshotBytes) {
      probe.portfolioIdentityInk = await measurePortfolioIdentityInk(
        screenshotBytes,
        probe.portfolioIdentityItems,
        probe.viewport.width,
      )
    }
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

async function verifyGardenInteraction(chromePort, baseUrl) {
  const { session, targetId } = await createPage(
    chromePort,
    `${baseUrl}/brain/`,
    captureViewports.desktop,
    "light",
  )
  try {
    await stabilizePage(session, "light")
    return await evaluate(
      session,
      `(async () => {
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
        const javaTitle = Array.from(document.querySelectorAll(".folder-title"))
          .find(title => title.textContent.trim() === "Java")
        const button = javaTitle?.closest("button.folder-button")
        const folderContainer = button?.closest(".folder-container")
        const folderPath = folderContainer?.getAttribute("data-folderpath") ?? null
        const folderOuter = folderContainer?.nextElementSibling
        const beforePath = location.pathname
        button?.click()
        await wait(100)
        const afterFolderPath = location.pathname
        const expanded = folderOuter?.classList.contains("open") ?? false
        const firstNote = folderOuter?.querySelector("a.nav-file-title")
        const noteHref = firstNote?.getAttribute("href") ?? null
        firstNote?.click()
        await wait(900)
        const preservedContainer = Array.from(document.querySelectorAll(".folder-container"))
          .find(candidate => candidate.getAttribute("data-folderpath") === folderPath)
        const preservedAfterNavigation = preservedContainer?.nextElementSibling?.classList.contains("open") ?? false
        window.scrollTo(0, document.documentElement.scrollHeight)
        await wait(150)
        const footerTop = document.querySelector(".dev-uni-footer")?.getBoundingClientRect().top ?? null
        const railBottoms = Array.from(document.querySelectorAll(".dev-uni-context-inner"))
          .filter(element => getComputedStyle(element).display !== "none")
          .map(element => Number(element.getBoundingClientRect().bottom.toFixed(2)))
        const footerOverlap = footerTop == null || railBottoms.length === 0
          ? null
          : Number(Math.max(0, Math.max(...railBottoms) - footerTop).toFixed(2))
        return {
          beforePath,
          afterFolderPath,
          expanded,
          folderPath,
          preservedAfterNavigation,
          noteHref,
          finalPath: location.pathname,
          surface: document.querySelector(".dev-uni-frame")?.getAttribute("data-surface") ?? null,
          explorerCount: document.querySelectorAll(".explorer.nav-files-container").length,
          explorerRootPath: document.querySelector(".explorer")?.getAttribute("data-root-path") ?? null,
          footerTop: footerTop == null ? null : Number(footerTop.toFixed(2)),
          railBottoms,
          footerOverlap,
        }
      })()`,
    )
  } finally {
    session.close()
    await fetch(`http://127.0.0.1:${chromePort}/json/close/${targetId}`).catch(() => undefined)
  }
}

async function verifyPopoverTypography(chromePort, baseUrl) {
  const { session, targetId } = await createPage(
    chromePort,
    `${baseUrl}/articles/`,
    captureViewports.desktop,
    "light",
  )
  try {
    await stabilizePage(session, "light")
    const articleVisible = await evaluate(
      session,
      `(async () => {
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
        const link = document.querySelector(".articles-archive a.internal")
        link?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, clientX: 300, clientY: 300 }))
        await wait(700)
        const gardenNavigation = Array.from(document.querySelectorAll(".primary-navigation a"))
          .find(candidate => candidate.textContent.trim() === "Brain")
        gardenNavigation?.dispatchEvent(
          new MouseEvent("mouseover", { bubbles: true, clientX: 720, clientY: 60 }),
        )
        await wait(300)
        return {
          articlePopoverVisible: Boolean(document.querySelector(".active-popover")),
          navigationPopoverVisible: Boolean(document.querySelector(".active-popover")),
        }
      })()`,
    )

    await session.send("Page.navigate", { url: `${baseUrl}/` })
    await waitForDocumentReady(session)
    await stabilizePage(session, "light")
    const homeVisible = await evaluate(
      session,
      `(async () => {
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
        const link = document.querySelector('.home-route-directory a[href*="articles"]')
        link?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, clientX: 900, clientY: 650 }))
        await wait(700)
        return Boolean(document.querySelector(".active-popover"))
      })()`,
    )

    await session.send("Page.navigate", { url: `${baseUrl}/brain/notes/java/jvm.html` })
    await waitForDocumentReady(session)
    await stabilizePage(session, "light")
    const garden = await evaluate(
      session,
      `(async () => {
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
        const link = document.querySelector(".explorer a.nav-file-title")
        link?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, clientX: 180, clientY: 340 }))
        await wait(900)
        const explorerPopoverVisible = Boolean(document.querySelector(".active-popover"))
        const backlink = document.querySelector(".backlinks a.internal")
        backlink?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, clientX: 1120, clientY: 720 }))
        await wait(900)
        const backlinkPopoverVisibleOnHover = Boolean(document.querySelector(".active-popover"))
        backlink?.dispatchEvent(new MouseEvent("mouseout", {
          bubbles: true,
          relatedTarget: document.body,
          clientX: 1120,
          clientY: 720,
        }))
        await wait(250)
        return {
          explorerPopoverVisible,
          backlinkPopoverVisibleOnHover,
          backlinkPopoverVisibleAfterLeave: Boolean(document.querySelector(".active-popover")),
        }
      })()`,
    )

    return {
      ...garden,
      articlePopoverVisible: articleVisible.articlePopoverVisible,
      homePopoverVisible: homeVisible,
      navigationPopoverVisible: articleVisible.navigationPopoverVisible,
    }
  } finally {
    session.close()
    await fetch(`http://127.0.0.1:${chromePort}/json/close/${targetId}`).catch(() => undefined)
  }
}

async function verifyArticlesShellStability(chromePort, baseUrl) {
  const { session, targetId } = await createPage(
    chromePort,
    `${baseUrl}/articles/`,
    captureViewports.desktop,
    "light",
  )
  try {
    await stabilizePage(session, "light")
    return await evaluate(
      session,
      `(async () => {
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
        const measure = label => {
          const rect = selector => {
            const element = document.querySelector(selector)
            const box = element?.getBoundingClientRect()
            return box ? {
              left: Number(box.left.toFixed(2)),
              width: Number(box.width.toFixed(2)),
            } : null
          }
          return {
            label,
            path: location.pathname,
            header: rect(".dev-uni-header-shell"),
            identity: rect(".site-identity"),
            categoryNav: rect(".articles-category-nav"),
            tabs: Array.from(document.querySelectorAll(".articles-category-nav a")).map(element => {
              const box = element.getBoundingClientRect()
              return Number(box.width.toFixed(2))
            }),
          }
        }
        const states = [measure("all")]
        for (const label of ["기술", "프로젝트", "전체"]) {
          const link = Array.from(document.querySelectorAll(".articles-category-nav a"))
            .find(candidate => candidate.querySelector("span")?.textContent.trim() === label)
          if (!link) throw new Error("Articles category link not found: " + label)
          const targetPath = new URL(link.href).pathname
          link.click()
          for (let attempt = 0; attempt < 60 && location.pathname !== targetPath; attempt += 1) await wait(50)
          if (location.pathname !== targetPath)
            throw new Error("Articles category did not navigate: " + label + " -> " + targetPath)
          await document.fonts.ready
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
          states.push(measure(label))
        }
        const values = key => states.map(state => state[key]).filter(Boolean)
        const spread = numbers => numbers.length ? Number((Math.max(...numbers) - Math.min(...numbers)).toFixed(2)) : 999
        return {
          states,
          headerLeftDelta: spread(values("header").map(rect => rect.left)),
          headerWidthDelta: spread(values("header").map(rect => rect.width)),
          identityLeftDelta: spread(values("identity").map(rect => rect.left)),
          categoryLeftDelta: spread(values("categoryNav").map(rect => rect.left)),
          categoryWidthDelta: spread(values("categoryNav").map(rect => rect.width)),
          tabWidthDelta: spread(states.flatMap(state => state.tabs)),
        }
      })()`,
    )
  } finally {
    session.close()
    await fetch(`http://127.0.0.1:${chromePort}/json/close/${targetId}`).catch(() => undefined)
  }
}

async function capturePortfolioWork(chromePort, baseUrl) {
  const { session, targetId } = await createPage(
    chromePort,
    `${baseUrl}/portfolio/`,
    captureViewports.desktop,
    "light",
  )
  try {
    await stabilizePage(session, "light")
    const scrollY = await evaluate(
      session,
      `(async () => {
        const work = document.querySelector(".portfolio-work")
        if (!work) throw new Error("Portfolio Work section not found")
        const target = Math.max(0, work.getBoundingClientRect().top + window.scrollY - 16)
        window.scrollTo(0, target)
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        return window.scrollY
      })()`,
    )
    const capture = async (filename) => {
      const result = await session.send("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
        captureBeyondViewport: false,
      })
      const bytes = Buffer.from(result.data, "base64")
      await writeFile(join(screenshotDir, filename), bytes)
      return {
        path: `migration/evidence/design-owner-revision/screenshots/${filename}`,
        scrollY: await evaluate(session, "window.scrollY"),
        width: bytes.readUInt32BE(16),
        height: bytes.readUInt32BE(20),
        sha256: sha256(bytes),
      }
    }
    const workScreenshot = await capture("portfolio-work-desktop-light.png")
    await evaluate(
      session,
      `(async () => {
        const metrics = document.querySelector(".portfolio-project-metrics")
        if (!metrics) throw new Error("Portfolio metrics not found")
        const target = Math.max(0, metrics.getBoundingClientRect().top + window.scrollY - 680)
        window.scrollTo(0, target)
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      })()`,
    )
    const metricsScreenshot = await capture("portfolio-metrics-desktop-light.png")
    return {
      work: workScreenshot,
      metrics: metricsScreenshot,
      initialWorkScrollY: scrollY,
    }
  } finally {
    session.close()
    await fetch(`http://127.0.0.1:${chromePort}/json/close/${targetId}`).catch(() => undefined)
  }
}

async function verifyPortfolioAxis(chromePort, baseUrl) {
  const viewport = { width: 1630, height: 840 }
  const { session, targetId } = await createPage(
    chromePort,
    `${baseUrl}/portfolio/`,
    viewport,
    "light",
    { deviceScaleFactor: 2 },
  )
  try {
    await stabilizePage(session, "light")
    await resetPageScroll(session)
    const items = await evaluate(
      session,
      `(() => [
        ["site-identity", ".site-identity-name"],
        ["portfolio-label", ".portfolio-identity > .home-section-label"],
        ["portfolio-name", ".portfolio-identity > h1"],
        ["portfolio-role", ".portfolio-identity > .portfolio-role"],
        ["profile-label", ".portfolio-engineering-profile .portfolio-section-heading > .home-section-label"],
        ["profile-title", ".portfolio-engineering-profile .portfolio-section-heading > h2"],
      ].map(([name, selector]) => {
        const element = document.querySelector(selector)
        if (!element) throw new Error("Portfolio alignment target missing: " + selector)
        const rect = element.getBoundingClientRect()
        return {
          name,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        }
      }))()`,
    )
    const result = await session.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
    })
    const bytes = Buffer.from(result.data, "base64")
    const filename = "portfolio-axis-owner-dpr2-light.png"
    await writeFile(join(screenshotDir, filename), bytes)
    const ink = await measurePortfolioIdentityInk(bytes, items, viewport.width)
    return {
      viewport,
      deviceScaleFactor: 2,
      items: items.map((item, index) => ({ ...item, inkLeft: ink?.starts[index] ?? null })),
      ink,
      screenshot: {
        path: `migration/evidence/design-owner-revision/screenshots/${filename}`,
        width: bytes.readUInt32BE(16),
        height: bytes.readUInt32BE(20),
        sha256: sha256(bytes),
      },
    }
  } finally {
    session.close()
    await fetch(`http://127.0.0.1:${chromePort}/json/close/${targetId}`).catch(() => undefined)
  }
}

async function captureHomeRouteGuide(chromePort, baseUrl) {
  const { session, targetId } = await createPage(
    chromePort,
    `${baseUrl}/`,
    captureViewports.desktop,
    "light",
  )
  try {
    await stabilizePage(session, "light")
    await evaluate(
      session,
      `(async () => {
        const guide = document.querySelector(".home-route-guide")
        if (!guide) throw new Error("Home route guide not found")
        const target = Math.max(0, guide.getBoundingClientRect().top + window.scrollY - 40)
        window.scrollTo(0, target)
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      })()`,
    )
    const result = await session.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
    })
    const bytes = Buffer.from(result.data, "base64")
    const filename = "home-route-guide-desktop-light.png"
    await writeFile(join(screenshotDir, filename), bytes)
    return {
      path: `migration/evidence/design-owner-revision/screenshots/${filename}`,
      scrollY: await evaluate(session, "window.scrollY"),
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20),
      sha256: sha256(bytes),
    }
  } finally {
    session.close()
    await fetch(`http://127.0.0.1:${chromePort}/json/close/${targetId}`).catch(() => undefined)
  }
}

async function verifyMobileHomeLayout(chromePort, baseUrl) {
  const viewport = captureViewports.mobile
  const { session, targetId } = await createPage(chromePort, `${baseUrl}/`, viewport, "light")
  try {
    await stabilizePage(session, "light")
    await resetPageScroll(session)
    const capture = async (filename) => {
      const result = await session.send("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
        captureBeyondViewport: false,
      })
      const bytes = Buffer.from(result.data, "base64")
      await writeFile(join(screenshotDir, filename), bytes)
      return {
        path: `migration/evidence/design-owner-revision/screenshots/${filename}`,
        width: bytes.readUInt32BE(16),
        height: bytes.readUInt32BE(20),
        sha256: sha256(bytes),
      }
    }
    const closed = await evaluate(
      session,
      `(() => {
        const toggle = document.querySelector(".site-menu-toggle")
        const navigation = document.querySelector(".primary-navigation")
        return {
          expanded: toggle?.getAttribute("aria-expanded"),
          toggleColor: toggle ? getComputedStyle(toggle).color : null,
          navigationDisplay: navigation ? getComputedStyle(navigation).display : null,
        }
      })()`,
    )
    await evaluate(session, `document.querySelector(".site-menu-toggle")?.click()`)
    await sleep(120)
    const open = await evaluate(
      session,
      `(() => {
        const toggle = document.querySelector(".site-menu-toggle")
        const navigation = document.querySelector(".primary-navigation")
        const links = Array.from(document.querySelectorAll(".primary-navigation a"))
        return {
          expanded: toggle?.getAttribute("aria-expanded"),
          toggleColor: toggle ? getComputedStyle(toggle).color : null,
          navigationDisplay: navigation ? getComputedStyle(navigation).display : null,
          navigationBackground: navigation ? getComputedStyle(navigation).backgroundColor : null,
          linkColors: links.map(link => getComputedStyle(link).color),
        }
      })()`,
    )
    const menuScreenshot = await capture("home-mobile-menu-open-light.png")
    await evaluate(session, `document.querySelector(".site-menu-toggle")?.click()`)

    const measureCenteredVisual = async (selector, containerSelector, filename) => {
      const geometry = await evaluate(
        session,
        `(async () => {
          const target = document.querySelector(${JSON.stringify(selector)})
          const container = document.querySelector(${JSON.stringify(containerSelector)})
          if (!target || !container) throw new Error("Mobile visual target missing")
          const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - 120)
          window.scrollTo(0, top)
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
          const targetRect = target.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()
          return {
            targetLeft: Number(targetRect.left.toFixed(2)),
            targetWidth: Number(targetRect.width.toFixed(2)),
            containerLeft: Number(containerRect.left.toFixed(2)),
            containerWidth: Number(containerRect.width.toFixed(2)),
            centerDelta: Number(Math.abs(
              (targetRect.left + targetRect.right) / 2 -
              (containerRect.left + containerRect.right) / 2
            ).toFixed(2)),
          }
        })()`,
      )
      return { ...geometry, screenshot: await capture(filename) }
    }

    const neural = await measureCenteredVisual(
      ".home-neural-visual",
      ".home-introduction-inner",
      "home-mobile-neural-centered-light.png",
    )
    const route = await measureCenteredVisual(
      ".home-route-geometry",
      ".home-route-guide-inner",
      "home-mobile-route-centered-light.png",
    )
    return { viewport, closed, open, menuScreenshot, neural, route }
  } finally {
    session.close()
    await fetch(`http://127.0.0.1:${chromePort}/json/close/${targetId}`).catch(() => undefined)
  }
}

async function verifyMobileReadingLayout(chromePort, baseUrl) {
  const viewport = captureViewports.mobile
  const capture = async (session, filename) => {
    const result = await session.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
    })
    const bytes = Buffer.from(result.data, "base64")
    await writeFile(join(screenshotDir, filename), bytes)
    return {
      path: `migration/evidence/design-owner-revision/screenshots/${filename}`,
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20),
      sha256: sha256(bytes),
    }
  }

  const brainPage = await createPage(chromePort, `${baseUrl}/brain/`, viewport, "light")
  let brain
  try {
    await stabilizePage(brainPage.session, "light")
    await resetPageScroll(brainPage.session)
    const collapsed = await evaluate(
      brainPage.session,
      `(() => {
        const main = document.querySelector("main")
        const left = document.querySelector(".dev-uni-context.left")
        const pageTitle = left?.querySelector(".page-title")
        const explorer = left?.querySelector(".explorer")
        const toggle = explorer?.querySelector(".mobile-explorer")
        const content = explorer?.querySelector(".explorer-content")
        const mainRect = main?.getBoundingClientRect()
        const leftRect = left?.getBoundingClientRect()
        return {
          renderedSiteIdentityCount: document.querySelectorAll(".site-identity-name").length,
          pageTitleDisplay: pageTitle ? getComputedStyle(pageTitle).display : null,
          explorerCollapsed: explorer?.classList.contains("collapsed") ?? null,
          explorerLabel: toggle ? getComputedStyle(toggle, "::before").content : null,
          explorerContentDisplay: content ? getComputedStyle(content).display : null,
          mainTop: mainRect ? Number(mainRect.top.toFixed(2)) : null,
          leftBottom: leftRect ? Number(leftRect.bottom.toFixed(2)) : null,
        }
      })()`,
    )
    const collapsedScreenshot = await capture(
      brainPage.session,
      "brain-mobile-collapsed-reading-light.png",
    )
    await evaluate(
      brainPage.session,
      `(async () => {
        document.querySelector(".mobile-explorer")?.click()
        await new Promise(resolve => setTimeout(resolve, 80))
      })()`,
    )
    const expanded = await evaluate(
      brainPage.session,
      `(() => {
        const content = document.querySelector(".explorer-content")
        const rect = content?.getBoundingClientRect()
        const style = content ? getComputedStyle(content) : null
        return {
          explorerContentDisplay: style?.display ?? null,
          explorerContentPosition: style?.position ?? null,
          explorerContentWidth: rect ? Number(rect.width.toFixed(2)) : null,
          explorerContentHeight: rect ? Number(rect.height.toFixed(2)) : null,
          documentScrollLocked: document.documentElement.classList.contains("mobile-no-scroll"),
          horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        }
      })()`,
    )
    const expandedScreenshot = await capture(
      brainPage.session,
      "brain-mobile-expanded-reading-light.png",
    )
    brain = { collapsed, expanded, collapsedScreenshot, expandedScreenshot }
  } finally {
    brainPage.session.close()
    await fetch(`http://127.0.0.1:${chromePort}/json/close/${brainPage.targetId}`).catch(
      () => undefined,
    )
  }

  const articlePage = await createPage(
    chromePort,
    `${baseUrl}${tistoryRepresentativeRoute}`,
    viewport,
    "light",
  )
  let article
  try {
    await stabilizePage(articlePage.session, "light")
    await resetPageScroll(articlePage.session)
    const beforeReader = await evaluate(
      articlePage.session,
      `(() => {
        const main = document.querySelector("main")
        const right = document.querySelector(".dev-uni-context.right")
        const toc = right?.querySelector(".toc")
        const mainRect = main?.getBoundingClientRect()
        const tocRect = toc?.getBoundingClientRect()
        return {
          rightBeforeMainInDom: Boolean(right && main && (right.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING)),
          tocTop: tocRect ? Number(tocRect.top.toFixed(2)) : null,
          tocBottom: tocRect ? Number(tocRect.bottom.toFixed(2)) : null,
          mainTop: mainRect ? Number(mainRect.top.toFixed(2)) : null,
          readerPressed: document.querySelector("button.readermode")?.getAttribute("aria-pressed"),
        }
      })()`,
    )
    const tocScreenshot = await capture(articlePage.session, "article-mobile-toc-first-light.png")
    await evaluate(
      articlePage.session,
      `(async () => {
        document.querySelector("button.readermode")?.click()
        await new Promise(resolve => setTimeout(resolve, 80))
      })()`,
    )
    const readerOn = await evaluate(
      articlePage.session,
      `(() => {
        const main = document.querySelector("main")
        const right = document.querySelector(".dev-uni-context.right")
        const mainRect = main?.getBoundingClientRect()
        return {
          mode: document.documentElement.getAttribute("reader-mode"),
          readerPressed: document.querySelector("button.readermode")?.getAttribute("aria-pressed"),
          rightDisplay: right ? getComputedStyle(right).display : null,
          mainTop: mainRect ? Number(mainRect.top.toFixed(2)) : null,
        }
      })()`,
    )
    await evaluate(
      articlePage.session,
      `(async () => {
        window.scrollTo(0, 1200)
        await new Promise(resolve => setTimeout(resolve, 80))
      })()`,
    )
    const topButtonVisible = await evaluate(
      articlePage.session,
      `(() => {
        const button = document.querySelector(".dev-uni-scroll-top")
        const style = button ? getComputedStyle(button) : null
        return {
          visible: button?.getAttribute("data-visible"),
          position: style?.position ?? null,
          pointerEvents: style?.pointerEvents ?? null,
        }
      })()`,
    )
    await evaluate(
      articlePage.session,
      `(async () => {
        document.querySelector(".dev-uni-scroll-top")?.click()
        await new Promise(resolve => setTimeout(resolve, 700))
      })()`,
    )
    article = {
      beforeReader,
      readerOn,
      topButtonVisible,
      scrollYAfterTop: await evaluate(articlePage.session, "window.scrollY"),
      tocScreenshot,
    }
  } finally {
    articlePage.session.close()
    await fetch(`http://127.0.0.1:${chromePort}/json/close/${articlePage.targetId}`).catch(
      () => undefined,
    )
  }

  return { viewport, brain, article }
}

async function verifyHomeNeuralMotion(chromePort, baseUrl) {
  const { session, targetId } = await createPage(
    chromePort,
    `${baseUrl}/`,
    captureViewports.desktop,
    "light",
    { reducedMotion: false },
  )
  try {
    await stabilizePage(session, "light")
    return await evaluate(
      session,
      `(async () => {
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
        const line = document.querySelector(".home-neural-line")
        const signal = document.querySelector(".home-neural-signal")
        const readSignal = () => {
          const style = signal ? getComputedStyle(signal) : null
          return style ? {
            animationName: style.animationName,
            animationIterationCount: style.animationIterationCount,
            dashOffset: style.strokeDashoffset,
            opacity: style.opacity,
          } : null
        }
        await wait(2100)
        const first = readSignal()
        await wait(700)
        const second = readSignal()
        return {
          reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
          lineAnimationName: line ? getComputedStyle(line).animationName : null,
          first,
          second,
          signalMoved: Boolean(first && second &&
            (first.dashOffset !== second.dashOffset || first.opacity !== second.opacity)),
        }
      })()`,
    )
  } finally {
    session.close()
    await fetch(`http://127.0.0.1:${chromePort}/json/close/${targetId}`).catch(() => undefined)
  }
}

async function verifyTocCurrentSection(chromePort, baseUrl) {
  const { session, targetId } = await createPage(
    chromePort,
    `${baseUrl}${tistoryRepresentativeRoute}`,
    captureViewports.desktop,
    "light",
  )
  try {
    await stabilizePage(session, "light")
    return await evaluate(
      session,
      `(async () => {
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
        const tocLinks = Array.from(document.querySelectorAll(".toc a[data-for]"))
        const targetLink = tocLinks[Math.min(2, tocLinks.length - 1)]
        const target = targetLink ? document.getElementById(targetLink.getAttribute("data-for")) : null
        if (!target) return {
          activeCount: 0,
          targetId: null,
          activeFor: [],
          ariaCurrentCount: 0,
          persistentCount: 0,
          persistentFor: [],
          currentColor: null,
        }
        window.scrollTo(0, Math.max(0, target.offsetTop - 120))
        await wait(250)
        const active = Array.from(document.querySelectorAll(".toc a.du-current"))
        window.scrollBy(0, 1)
        await wait(900)
        const persistent = Array.from(document.querySelectorAll(".toc a.du-current"))
        return {
          activeCount: active.length,
          targetId: target.id,
          activeFor: active.map(link => link.getAttribute("data-for")),
          ariaCurrentCount: document.querySelectorAll('.toc a[aria-current="location"]').length,
          persistentCount: persistent.length,
          persistentFor: persistent.map(link => link.getAttribute("data-for")),
          currentColor: persistent[0] ? getComputedStyle(persistent[0]).color : null,
        }
      })()`,
    )
  } finally {
    session.close()
    await fetch(`http://127.0.0.1:${chromePort}/json/close/${targetId}`).catch(() => undefined)
  }
}

async function verifyBrainReaderMode(chromePort, baseUrl) {
  const { session, targetId } = await createPage(
    chromePort,
    `${baseUrl}/brain/notes/java/jvm.html`,
    captureViewports.desktop,
    "light",
  )
  try {
    await stabilizePage(session, "light")
    return await evaluate(
      session,
      `(async () => {
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
        const reader = document.querySelector("button.readermode")
        const controls = Array.from(document.querySelectorAll(
          ".dev-uni-header .search-button, .dev-uni-header .darkmode, .dev-uni-header .readermode",
        ))
        const centers = controls.map(control => {
          const rect = control.getBoundingClientRect()
          return (rect.top + rect.bottom) / 2
        })
        const visible = element => {
          const rect = element.getBoundingClientRect()
          return getComputedStyle(element).display !== "none" && rect.width > 0 && rect.height > 0
        }
        const icons = Array.from(document.querySelectorAll(
          ".dev-uni-header .search-button svg, .dev-uni-header .darkmode svg, .dev-uni-header .readermode svg",
        )).filter(visible)
        const header = document.querySelector(".dev-uni-header")
        const headerShell = document.querySelector(".dev-uni-header-shell")
        const identity = document.querySelector(".site-identity-name")
        const navigation = Array.from(document.querySelectorAll(".primary-navigation a"))
        const iconCenters = icons.map(icon => {
          const rect = icon.getBoundingClientRect()
          return (rect.top + rect.bottom) / 2
        })
        const before = document.documentElement.getAttribute("reader-mode")
        reader?.click()
        await wait(150)
        const afterOn = document.documentElement.getAttribute("reader-mode")
        reader?.click()
        await wait(150)
        return {
          readerCount: document.querySelectorAll("button.readermode").length,
          before,
          afterOn,
          afterOff: document.documentElement.getAttribute("reader-mode"),
          utilityCount: controls.length,
          utilityCenterDelta: centers.length > 1
            ? Number((Math.max(...centers) - Math.min(...centers)).toFixed(2))
            : 999,
          visibleIconCount: icons.length,
          visibleThemeIconCount: Array.from(document.querySelectorAll(".darkmode svg"))
            .filter(visible).length,
          headerTop: header ? Number(header.getBoundingClientRect().top.toFixed(2)) : null,
          headerShellTop: headerShell ? Number(headerShell.getBoundingClientRect().top.toFixed(2)) : null,
          identityColor: identity ? getComputedStyle(identity).color : null,
          navigation: navigation.map(link => ({
            label: link.textContent.trim(),
            color: getComputedStyle(link).color,
            top: Number(link.getBoundingClientRect().top.toFixed(2)),
          })),
          iconCenterDelta: iconCenters.length > 1
            ? Number((Math.max(...iconCenters) - Math.min(...iconCenters)).toFixed(2))
            : 999,
        }
      })()`,
    )
  } finally {
    session.close()
    await fetch(`http://127.0.0.1:${chromePort}/json/close/${targetId}`).catch(() => undefined)
  }
}

async function verifyNavigationBrandStates(chromePort, baseUrl) {
  const { session, targetId } = await createPage(
    chromePort,
    `${baseUrl}/portfolio/`,
    captureViewports.desktop,
    "light",
    { reducedMotion: false },
  )
  try {
    await stabilizePage(session, "light")
    const hoverUnderlineInitialClipPath = await evaluate(
      session,
      `(() => {
        const link = Array.from(document.querySelectorAll(".primary-navigation a"))
          .find(candidate => candidate.textContent.trim() === "About")
        return link ? getComputedStyle(link, "::after").clipPath : null
      })()`,
    )
    const aboutRect = await evaluate(
      session,
      `(() => {
        const link = Array.from(document.querySelectorAll(".primary-navigation a"))
          .find(candidate => candidate.textContent.trim() === "About")
        const rect = link?.getBoundingClientRect()
        return rect ? { x: (rect.left + rect.right) / 2, y: (rect.top + rect.bottom) / 2 } : null
      })()`,
    )
    if (!aboutRect) return { hovered: false, hoverColor: null, hoverBorderColor: null }
    await session.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: aboutRect.x,
      y: aboutRect.y,
    })
    await sleep(60)
    const hoverUnderlineMidClipPath = await evaluate(
      session,
      `(() => {
        const link = Array.from(document.querySelectorAll(".primary-navigation a"))
          .find(candidate => candidate.textContent.trim() === "About")
        return link ? getComputedStyle(link, "::after").clipPath : null
      })()`,
    )
    await sleep(160)
    const hover = await evaluate(
      session,
      `(() => {
        const link = Array.from(document.querySelectorAll(".primary-navigation a"))
          .find(candidate => candidate.textContent.trim() === "About")
        const style = link ? getComputedStyle(link) : null
        const underline = link ? getComputedStyle(link, "::after") : null
        return {
          hovered: link?.matches(":hover") ?? false,
          hoverColor: style?.color ?? null,
          hoverBorderColor: style?.borderBottomColor ?? null,
          hoverUnderlineColor: underline?.borderBottomColor ?? null,
          hoverUnderlineRadius: underline?.borderRadius ?? null,
          hoverUnderlineClipPath: underline?.clipPath ?? null,
          hoverUnderlineTransitionProperty: underline?.transitionProperty ?? null,
          hoverPseudoContent: underline?.content ?? null,
        }
      })()`,
    )
    await session.send("Page.navigate", { url: `${baseUrl}/articles/` })
    await waitForDocumentReady(session)
    await stabilizePage(session, "light")
    const active = await evaluate(
      session,
      `(() => {
        const link = document.querySelector('.primary-navigation a[aria-current="page"]')
        const style = link ? getComputedStyle(link) : null
        const underline = link ? getComputedStyle(link, "::after") : null
        return {
          activeLabel: link?.textContent.trim() ?? null,
          activeBorderColor: style?.borderBottomColor ?? null,
          activeUnderlineColor: underline?.borderBottomColor ?? null,
          activeUnderlineRadius: underline?.borderRadius ?? null,
          activeUnderlineClipPath: underline?.clipPath ?? null,
          activeUnderlineTransitionProperty: underline?.transitionProperty ?? null,
          activePseudoContent: underline?.content ?? null,
        }
      })()`,
    )
    return {
      hoverUnderlineInitialClipPath,
      hoverUnderlineMidClipPath,
      ...hover,
      ...active,
    }
  } finally {
    session.close()
    await fetch(`http://127.0.0.1:${chromePort}/json/close/${targetId}`).catch(() => undefined)
  }
}

async function verifyStickyHeader(chromePort, baseUrl) {
  const { session, targetId } = await createPage(
    chromePort,
    `${baseUrl}/portfolio/`,
    captureViewports.desktop,
    "light",
  )
  try {
    await stabilizePage(session, "light")
    return await evaluate(
      session,
      `(async () => {
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
        const header = document.querySelector(".dev-uni-header")
        const before = header?.getBoundingClientRect().top ?? null
        window.scrollTo(0, 720)
        await wait(180)
        const after = header?.getBoundingClientRect().top ?? null
        return {
          position: header ? getComputedStyle(header).position : null,
          before: before == null ? null : Number(before.toFixed(2)),
          after: after == null ? null : Number(after.toFixed(2)),
          scrollY: Number(window.scrollY.toFixed(2)),
        }
      })()`,
    )
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
  if (cell.expectedSurface === "article-detail" && cell.viewport.name === "desktop") {
    if (Math.abs(cell.probe.articleCenterDelta ?? 999) > 2) {
      failures.push(
        `${cell.id}: article body is not viewport-centered (${cell.probe.articleCenterDelta}px)`,
      )
    }
    if ((cell.probe.articleTocGap ?? -1) < 32) {
      failures.push(`${cell.id}: TOC is not far enough right (${cell.probe.articleTocGap}px)`)
    }
    if ((cell.probe.articleMainWidth ?? 0) < 780) {
      failures.push(`${cell.id}: article reading column is still too narrow`)
    }
    if (cell.probe.articleTocEntries < 2) failures.push(`${cell.id}: article TOC is empty`)
    if (cell.probe.articleBrokenImages > 0) failures.push(`${cell.id}: article has broken images`)
    if (cell.probe.articleRemoteImageSources.length > 0)
      failures.push(`${cell.id}: article has remote images`)
    if (cell.probe.articleBreadcrumbHasTistory)
      failures.push(`${cell.id}: tistory visual crumb remains`)
  }
  if (cell.expectedSurface === "home" && !cell.probe.homeHasSecondBrain) {
    failures.push(`${cell.id}: SECOND BRAIN brand headline is missing`)
  }
  if (cell.expectedSurface === "home" && cell.probe.homeNeuralVisualCount !== 1) {
    failures.push(`${cell.id}: second-brain neural visual is missing or duplicated`)
  }
  if (
    cell.expectedSurface === "about" &&
    (cell.probe.aboutPortraitCount !== 1 || cell.probe.aboutPortraitBroken > 0)
  ) {
    failures.push(`${cell.id}: approved About portrait is missing or broken`)
  }
  if (cell.expectedSurface === "about" && cell.viewport.width >= 800) {
    if ((cell.probe.aboutPortraitWidth ?? 999) > 322)
      failures.push(`${cell.id}: About portrait exceeds 322px`)
    if ((cell.probe.aboutTitleFontSize ?? 999) > 46)
      failures.push(`${cell.id}: About title exceeds 46px`)
  }
  if (cell.expectedSurface === "articles-index") {
    const limit = cell.viewport.width >= 1200 ? 56 : 40
    if ((cell.probe.primaryTitleFontSize ?? 999) > limit) {
      failures.push(`${cell.id}: Articles title exceeds ${limit}px`)
    }
  }
  if (
    cell.expectedSurface === "article-detail" &&
    cell.viewport.name === "desktop" &&
    (cell.probe.primaryTitleFontSize ?? 999) > 48
  ) {
    failures.push(`${cell.id}: article title exceeds 48px`)
  }
  if (cell.expectedSurface === "articles-index" && cell.probe.articlesIndexRows !== 5) {
    failures.push(
      `${cell.id}: Articles index expected 5 recent rows, got ${cell.probe.articlesIndexRows}`,
    )
  }
  if (cell.expectedSurface === "articles-category" && cell.probe.articlesIndexRows !== 9) {
    failures.push(
      `${cell.id}: technical category expected 9 rows, got ${cell.probe.articlesIndexRows}`,
    )
  }
  if (cell.expectedSurface.startsWith("garden-")) {
    if (cell.probe.explorerRootPath !== "brain")
      failures.push(`${cell.id}: explorer root is not brain`)
    if (cell.probe.explorerForeignLinks.length > 0)
      failures.push(`${cell.id}: explorer contains non-Garden links`)
    if (cell.viewport.name === "desktop" && cell.expectedSurface === "garden-detail") {
      if ((cell.probe.gardenMainWidth ?? 0) < 800)
        failures.push(`${cell.id}: Garden reading column is still too narrow`)
      if ((cell.probe.graphOuterWidth ?? 999) > 184)
        failures.push(`${cell.id}: Garden graph rail exceeds 184px`)
    }
  }
  if (
    cell.expectedSurface === "articles-index" &&
    cell.viewport.name === "mobile" &&
    !cell.probe.firstListingVisible
  ) {
    failures.push(`${cell.id}: first editorial row is below the initial viewport`)
  }
  if (cell.expectedSurface === "portfolio-index" && cell.viewport.name === "mobile") {
    if (cell.probe.portfolioTagRows > 0) failures.push(`${cell.id}: portfolio tags remain`)
    if (cell.probe.portfolioInternalLinkCount > 0)
      failures.push(`${cell.id}: portfolio still contains internal detail links`)
    if (cell.probe.portfolioMetricCount !== 18)
      failures.push(`${cell.id}: portfolio metrics are incomplete`)
  }
  if (cell.expectedSurface === "portfolio-index") {
    if ((cell.probe.portfolioIdentityAlignmentDelta ?? 999) > 1)
      failures.push(`${cell.id}: Portfolio identity labels do not share one left edge`)
    if (cell.screenshot && (cell.probe.portfolioIdentityInk?.delta ?? 999) > 0)
      failures.push(
        `${cell.id}: Portfolio visible glyph edges differ (${cell.probe.portfolioIdentityInk?.starts?.join(", ")})`,
      )
    if (cell.viewport.width > 800 && (cell.probe.portfolioHeroColumnGap ?? -999) < 32)
      failures.push(`${cell.id}: Portfolio identity and contacts are not separate columns`)
    if (cell.viewport.width > 800 && (cell.probe.portfolioHeroTopDelta ?? 999) > 1)
      failures.push(`${cell.id}: Portfolio identity and contacts do not share one top edge`)
    if (cell.probe.portfolioMetricOverlap)
      failures.push(`${cell.id}: portfolio metric cells overlap`)
    if (cell.probe.portfolioMetricWrappedValueCount > 0)
      failures.push(`${cell.id}: portfolio metric value wraps`)
    if (cell.probe.portfolioMetricOverflowValueCount > 0)
      failures.push(`${cell.id}: portfolio metric value overflows its cell`)
    if (cell.viewport.width >= 800 && cell.probe.portfolioEmailLineCount !== 1)
      failures.push(`${cell.id}: portfolio email wraps on desktop`)
  }
  if (
    cell.expectedSurface.startsWith("garden-") &&
    cell.probe.graphState === "unavailable" &&
    (cell.probe.graphOuterHeight > 120 || cell.probe.graphFallbackCount !== 1)
  ) {
    failures.push(`${cell.id}: unavailable graph is not a compact text fallback`)
  }
  if (
    cell.expectedSurface.startsWith("garden-") &&
    cell.viewport.name === "desktop" &&
    cell.probe.graphLegendDepths.join("|") !== "current|related|unrelated"
  ) {
    failures.push(`${cell.id}: graph does not expose the three depth states`)
  }
  if (cell.expectedSurface.startsWith("garden-")) {
    if (cell.probe.explorerOpenFolderCount !== 0)
      failures.push(`${cell.id}: Brain Explorer does not enter fully collapsed`)
    if (cell.probe.explorerCollapseAllCount !== 1)
      failures.push(`${cell.id}: Brain Explorer collapse-all control is missing or duplicated`)
    if ((cell.probe.explorerVerticalScrollerCount ?? 99) > 1)
      failures.push(`${cell.id}: Brain Explorer has nested vertical scrollbars`)
  }
  if (
    (cell.expectedSurface.startsWith("garden-") || cell.expectedSurface === "article-detail") &&
    (cell.probe.rightRailVerticalScrollerCount ?? 99) > 0
  ) {
    failures.push(`${cell.id}: right contextual rail has a nested vertical scrollbar`)
  }
  if (cell.viewport.width >= 800 && (cell.probe.headerUtilityCenterDelta ?? 999) > 1) {
    failures.push(`${cell.id}: header utility icons are vertically misaligned`)
  }
  if (cell.probe.darkmodeVisibleIconCount !== 1) {
    failures.push(`${cell.id}: theme control does not expose exactly one visible icon`)
  }
  if (cell.viewport.width >= 800 && (cell.probe.headerIconCenterDelta ?? 999) > 1) {
    failures.push(`${cell.id}: visible header glyphs are vertically misaligned`)
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
  const interactionOnly = process.argv.includes("--interaction-only")
  const behaviorOnly = process.argv.includes("--behavior-only")
  const portfolioWorkOnly = process.argv.includes("--portfolio-work-only")
  const homeGuideOnly = process.argv.includes("--home-guide-only")
  const homeMotionOnly = process.argv.includes("--home-motion-only")
  const portfolioAxisOnly = process.argv.includes("--portfolio-axis-only")
  const mobileHomeOnly = process.argv.includes("--mobile-home-only")
  const mobileReadingOnly = process.argv.includes("--mobile-reading-only")
  if (
    !interactionOnly &&
    !behaviorOnly &&
    !portfolioWorkOnly &&
    !homeGuideOnly &&
    !homeMotionOnly &&
    !portfolioAxisOnly &&
    !mobileHomeOnly &&
    !mobileReadingOnly
  ) {
    await rm(screenshotDir, { recursive: true, force: true })
    await mkdir(screenshotDir, { recursive: true })
  } else {
    await mkdir(screenshotDir, { recursive: true })
  }
  const server = createServer((request, response) => {
    return handler(request, response, { public: publicDir, cleanUrls: true })
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
    if (mobileReadingOnly) {
      const mobileReading = await verifyMobileReadingLayout(chromePort, baseUrl)
      const failures = []
      const { collapsed, expanded } = mobileReading.brain
      const { beforeReader, readerOn, topButtonVisible, scrollYAfterTop } = mobileReading.article
      if (collapsed.renderedSiteIdentityCount !== 1 || collapsed.pageTitleDisplay !== "none") {
        failures.push("mobile Brain renders a duplicate site identity")
      }
      if (
        collapsed.explorerCollapsed !== true ||
        collapsed.explorerContentDisplay !== "none" ||
        !collapsed.explorerLabel?.includes("Brain 탐색")
      ) {
        failures.push("mobile Brain Explorer is not a compact closed disclosure")
      }
      if (collapsed.leftBottom - collapsed.mainTop > 1) {
        failures.push("collapsed Brain Explorer overlaps the main content")
      }
      if (
        expanded.explorerContentDisplay === "none" ||
        expanded.explorerContentPosition !== "static" ||
        expanded.explorerContentWidth > mobileReading.viewport.width - 30 ||
        expanded.explorerContentHeight > mobileReading.viewport.height * 0.63 ||
        expanded.documentScrollLocked ||
        expanded.horizontalOverflow
      ) {
        failures.push("expanded Brain Explorer is not an in-flow bounded panel")
      }
      if (
        !beforeReader.rightBeforeMainInDom ||
        beforeReader.tocBottom > beforeReader.mainTop ||
        beforeReader.readerPressed !== "false"
      ) {
        failures.push("mobile TOC is not placed before the article content")
      }
      if (
        readerOn.mode !== "on" ||
        readerOn.readerPressed !== "true" ||
        readerOn.rightDisplay !== "none" ||
        readerOn.mainTop >= beforeReader.mainTop
      ) {
        failures.push("mobile Reader mode does not remove TOC space and pull content upward")
      }
      if (
        topButtonVisible.visible !== "true" ||
        topButtonVisible.position !== "fixed" ||
        topButtonVisible.pointerEvents === "none" ||
        scrollYAfterTop > 2
      ) {
        failures.push("fixed scroll-to-top control does not reveal and return to the top")
      }
      const result = {
        status: failures.length === 0 ? "PASS" : "FAIL",
        mobileReading,
        failures,
      }
      await writeFile(
        join(evidenceDir, "mobile-reading-owner.json"),
        `${JSON.stringify(result, null, 2)}\n`,
      )
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
      if (failures.length > 0) process.exitCode = 1
      return
    }
    if (mobileHomeOnly) {
      const mobileHome = await verifyMobileHomeLayout(chromePort, baseUrl)
      const failures = []
      if (
        mobileHome.closed.expanded !== "false" ||
        mobileHome.closed.navigationDisplay !== "none"
      ) {
        failures.push("mobile Home navigation is not initially closed")
      }
      if (mobileHome.open.expanded !== "true" || mobileHome.open.navigationDisplay === "none") {
        failures.push("mobile Home navigation did not open")
      }
      if (mobileHome.open.navigationBackground !== "rgb(255, 255, 255)") {
        failures.push("mobile Home navigation did not retain the light header surface")
      }
      if (
        mobileHome.open.toggleColor !== "rgb(16, 42, 46)" ||
        mobileHome.open.linkColors.some((color) => color !== "rgb(16, 42, 46)")
      ) {
        failures.push("mobile Home menu controls do not retain readable ink color")
      }
      if (mobileHome.neural.centerDelta > 1) failures.push("mobile neural visual is not centered")
      if (mobileHome.route.centerDelta > 1) failures.push("mobile route geometry is not centered")
      const result = {
        status: failures.length === 0 ? "PASS" : "FAIL",
        mobileHome,
        failures,
      }
      await writeFile(
        join(evidenceDir, "mobile-home-owner.json"),
        `${JSON.stringify(result, null, 2)}\n`,
      )
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
      if (failures.length > 0) process.exitCode = 1
      return
    }
    if (portfolioAxisOnly) {
      const axis = await verifyPortfolioAxis(chromePort, baseUrl)
      const failures = []
      if (axis.screenshot.width !== axis.viewport.width * axis.deviceScaleFactor) {
        failures.push("portfolio DPR2 screenshot width does not match the requested viewport")
      }
      if (axis.screenshot.height !== axis.viewport.height * axis.deviceScaleFactor) {
        failures.push("portfolio DPR2 screenshot height does not match the requested viewport")
      }
      if (axis.ink?.delta !== 0) {
        failures.push(
          `portfolio text axes differ by ${axis.ink?.delta ?? "unknown"} physical pixels`,
        )
      }
      const result = { status: failures.length === 0 ? "PASS" : "FAIL", axis, failures }
      await writeFile(
        join(evidenceDir, "portfolio-axis-owner-dpr2.json"),
        `${JSON.stringify(result, null, 2)}\n`,
      )
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
      if (failures.length > 0) process.exitCode = 1
      return
    }
    if (portfolioWorkOnly) {
      const screenshot = await capturePortfolioWork(chromePort, baseUrl)
      process.stdout.write(`${JSON.stringify({ status: "PASS", screenshot }, null, 2)}\n`)
      return
    }
    if (homeGuideOnly) {
      const screenshot = await captureHomeRouteGuide(chromePort, baseUrl)
      process.stdout.write(`${JSON.stringify({ status: "PASS", screenshot }, null, 2)}\n`)
      return
    }
    if (homeMotionOnly) {
      const motion = await verifyHomeNeuralMotion(chromePort, baseUrl)
      const failures = []
      if (motion.reducedMotion) failures.push("motion probe unexpectedly reduced motion")
      if (motion.lineAnimationName !== "home-neural-draw")
        failures.push("initial neural reveal missing")
      if (motion.first?.animationName !== "home-neural-signal")
        failures.push("neural signal loop missing")
      if (motion.first?.animationIterationCount !== "infinite")
        failures.push("neural signal is not continuous")
      if (!motion.signalMoved) failures.push("neural signal did not move over time")
      const result = { status: failures.length === 0 ? "PASS" : "FAIL", motion, failures }
      await writeFile(
        join(evidenceDir, "home-neural-motion.json"),
        `${JSON.stringify(result, null, 2)}\n`,
      )
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
      if (failures.length > 0) process.exitCode = 1
      return
    }
    if (behaviorOnly) {
      const popover = await verifyPopoverTypography(chromePort, baseUrl)
      const articlesShellStability = await verifyArticlesShellStability(chromePort, baseUrl)
      const tocCurrentSection = await verifyTocCurrentSection(chromePort, baseUrl)
      const brainReaderMode = await verifyBrainReaderMode(chromePort, baseUrl)
      const navigationBrandStates = await verifyNavigationBrandStates(chromePort, baseUrl)
      const stickyHeader = await verifyStickyHeader(chromePort, baseUrl)
      const failures = []
      if (popover.explorerPopoverVisible) failures.push("Garden Explorer opens a hover popover")
      if (popover.articlePopoverVisible) failures.push("Articles opens a hover popover")
      if (popover.homePopoverVisible) failures.push("Home opens a hover popover")
      if (popover.navigationPopoverVisible) failures.push("primary navigation opens a popover")
      if (!popover.backlinkPopoverVisibleOnHover)
        failures.push("Brain backlink preview does not open on hover")
      if (popover.backlinkPopoverVisibleAfterLeave)
        failures.push("Brain backlink preview remains after pointer leave")
      if (tocCurrentSection.activeCount !== 1 || tocCurrentSection.ariaCurrentCount !== 1) {
        failures.push("article TOC does not expose exactly one current section")
      }
      if (
        tocCurrentSection.persistentCount !== 1 ||
        !tocCurrentSection.persistentFor.includes(tocCurrentSection.targetId)
      ) {
        failures.push("article TOC current section does not persist after scrolling settles")
      }
      if (
        brainReaderMode.readerCount !== 1 ||
        brainReaderMode.afterOn !== "on" ||
        brainReaderMode.afterOff !== "off"
      ) {
        failures.push("Brain reader mode does not toggle on and off")
      }
      if (
        brainReaderMode.utilityCount !== 3 ||
        brainReaderMode.visibleIconCount !== 3 ||
        brainReaderMode.visibleThemeIconCount !== 1 ||
        brainReaderMode.utilityCenterDelta > 1 ||
        brainReaderMode.iconCenterDelta > 1
      ) {
        failures.push("Brain header utilities are missing or vertically misaligned")
      }
      if (
        !navigationBrandStates.hovered ||
        navigationBrandStates.hoverUnderlineInitialClipPath !== "inset(0px 100% 0px 0px)" ||
        navigationBrandStates.hoverColor !== "rgb(17, 17, 17)" ||
        navigationBrandStates.hoverBorderColor !== "rgba(0, 0, 0, 0)" ||
        navigationBrandStates.hoverUnderlineColor !== "rgb(255, 138, 0)" ||
        navigationBrandStates.hoverUnderlineRadius !== "0px" ||
        navigationBrandStates.hoverUnderlineClipPath !== "inset(0px)" ||
        navigationBrandStates.hoverUnderlineTransitionProperty !== "clip-path" ||
        navigationBrandStates.hoverPseudoContent !== '""' ||
        navigationBrandStates.activeLabel !== "Articles" ||
        navigationBrandStates.activeBorderColor !== "rgba(0, 0, 0, 0)" ||
        navigationBrandStates.activeUnderlineColor !== "rgb(255, 138, 0)" ||
        navigationBrandStates.activeUnderlineRadius !== "0px" ||
        navigationBrandStates.activeUnderlineClipPath !== "inset(0px)" ||
        navigationBrandStates.activeUnderlineTransitionProperty !== "clip-path" ||
        navigationBrandStates.activePseudoContent !== '""'
      ) {
        failures.push("primary navigation did not reveal the hard orange editorial rule")
      }
      if (
        stickyHeader.position !== "sticky" ||
        stickyHeader.scrollY < 600 ||
        Math.abs(stickyHeader.after ?? 999) > 1
      ) {
        failures.push("global header does not remain pinned while scrolling")
      }
      for (const [metric, delta] of Object.entries(articlesShellStability)) {
        if (metric.endsWith("Delta") && delta > 1)
          failures.push(`Articles shell ${metric} changed by ${delta}px during SPA navigation`)
      }
      const result = {
        status: failures.length === 0 ? "PASS" : "FAIL",
        browser: chromeVersion.Browser,
        popover,
        articlesShellStability,
        tocCurrentSection,
        brainReaderMode,
        navigationBrandStates,
        stickyHeader,
        failures,
      }
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
      if (failures.length > 0) process.exitCode = 1
      return
    }
    if (interactionOnly) {
      const interaction = await verifyGardenInteraction(chromePort, baseUrl)
      const failures = []
      if (interaction.beforePath !== interaction.afterFolderPath)
        failures.push("folder click navigated")
      if (!interaction.expanded) failures.push("Java folder did not expand")
      if (!interaction.preservedAfterNavigation)
        failures.push("Brain folder state did not persist across Brain note navigation")
      if (!interaction.noteHref?.includes("/brain/")) failures.push("Garden note link left brain")
      if (!interaction.finalPath.includes("/brain/"))
        failures.push("note navigation missed brain route")
      if (interaction.surface !== "garden-detail") failures.push("note lost Garden surface")
      if (interaction.explorerCount !== 1)
        failures.push("Explorer disappeared after note navigation")
      if (interaction.explorerRootPath !== "brain")
        failures.push("Explorer root changed after navigation")
      if ((interaction.footerOverlap ?? 999) > 1)
        failures.push(`Garden rails overlap the footer by ${interaction.footerOverlap}px`)
      const result = { status: failures.length === 0 ? "PASS" : "FAIL", interaction, failures }
      await writeFile(
        join(evidenceDir, "garden-interaction.json"),
        `${JSON.stringify(result, null, 2)}\n`,
      )
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
      if (failures.length > 0) process.exitCode = 1
      return
    }
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
    const expectedScreenshotCount =
      Object.keys(routes).length * Object.keys(captureViewports).length * themes.length
    if (cells.length !== expectedScreenshotCount)
      failures.push(`expected ${expectedScreenshotCount} screenshot cells, got ${cells.length}`)
    if (new Set(tupleKeys).size !== expectedScreenshotCount)
      failures.push("screenshot tuples are not unique")
    if (new Set(filenames).size !== expectedScreenshotCount)
      failures.push("screenshot filenames are not unique")
    if (new Set(screenshotHashes).size !== expectedScreenshotCount)
      failures.push("screenshot hashes are not unique")

    const popover = await verifyPopoverTypography(chromePort, baseUrl)
    if (popover.explorerPopoverVisible) failures.push("Garden Explorer opens a hover popover")
    if (popover.articlePopoverVisible) failures.push("Articles opens a hover popover")
    if (popover.homePopoverVisible) failures.push("Home opens a hover popover")
    if (popover.navigationPopoverVisible) failures.push("primary navigation opens a hover popover")
    if (!popover.backlinkPopoverVisibleOnHover)
      failures.push("Brain backlink preview does not open on hover")
    if (popover.backlinkPopoverVisibleAfterLeave)
      failures.push("Brain backlink preview remains after pointer leave")

    const articlesShellStability = await verifyArticlesShellStability(chromePort, baseUrl)
    for (const [metric, delta] of Object.entries(articlesShellStability)) {
      if (metric.endsWith("Delta") && delta > 1)
        failures.push(`Articles shell ${metric} changed by ${delta}px during SPA navigation`)
    }

    const tocCurrentSection = await verifyTocCurrentSection(chromePort, baseUrl)
    if (tocCurrentSection.activeCount !== 1 || tocCurrentSection.ariaCurrentCount !== 1) {
      failures.push("article TOC does not expose exactly one current section")
    }
    if (!tocCurrentSection.activeFor.includes(tocCurrentSection.targetId)) {
      failures.push("article TOC current section does not match the scrolled heading")
    }
    if (
      tocCurrentSection.persistentCount !== 1 ||
      !tocCurrentSection.persistentFor.includes(tocCurrentSection.targetId)
    ) {
      failures.push("article TOC current section does not persist after scrolling settles")
    }
    const brainReaderMode = await verifyBrainReaderMode(chromePort, baseUrl)
    const navigationBrandStates = await verifyNavigationBrandStates(chromePort, baseUrl)
    const stickyHeader = await verifyStickyHeader(chromePort, baseUrl)
    if (
      brainReaderMode.readerCount !== 1 ||
      brainReaderMode.afterOn !== "on" ||
      brainReaderMode.afterOff !== "off"
    ) {
      failures.push("Brain reader mode does not toggle on and off")
    }
    if (
      brainReaderMode.utilityCount !== 3 ||
      brainReaderMode.visibleIconCount !== 3 ||
      brainReaderMode.visibleThemeIconCount !== 1 ||
      brainReaderMode.utilityCenterDelta > 1 ||
      brainReaderMode.iconCenterDelta > 1
    ) {
      failures.push("Brain header utilities are missing or vertically misaligned")
    }
    if (
      !navigationBrandStates.hovered ||
      navigationBrandStates.hoverUnderlineInitialClipPath !== "inset(0px 100% 0px 0px)" ||
      navigationBrandStates.hoverColor !== "rgb(17, 17, 17)" ||
      navigationBrandStates.hoverBorderColor !== "rgba(0, 0, 0, 0)" ||
      navigationBrandStates.hoverUnderlineColor !== "rgb(255, 138, 0)" ||
      navigationBrandStates.hoverUnderlineRadius !== "0px" ||
      navigationBrandStates.hoverUnderlineClipPath !== "inset(0px)" ||
      navigationBrandStates.hoverUnderlineTransitionProperty !== "clip-path" ||
      navigationBrandStates.hoverPseudoContent !== '""' ||
      navigationBrandStates.activeLabel !== "Articles" ||
      navigationBrandStates.activeBorderColor !== "rgba(0, 0, 0, 0)" ||
      navigationBrandStates.activeUnderlineColor !== "rgb(255, 138, 0)" ||
      navigationBrandStates.activeUnderlineRadius !== "0px" ||
      navigationBrandStates.activeUnderlineClipPath !== "inset(0px)" ||
      navigationBrandStates.activeUnderlineTransitionProperty !== "clip-path" ||
      navigationBrandStates.activePseudoContent !== '""'
    ) {
      failures.push("primary navigation did not reveal the hard orange editorial rule")
    }
    if (
      stickyHeader.position !== "sticky" ||
      stickyHeader.scrollY < 600 ||
      Math.abs(stickyHeader.after ?? 999) > 1
    ) {
      failures.push("global header does not remain pinned while scrolling")
    }

    const allProbeCells = [...cells, ...responsiveProbes, ...tistoryProbes]
    const alignmentDeltas = []
    for (const collection of [cells, responsiveProbes]) {
      for (const viewportName of [
        ...Object.keys(captureViewports),
        ...Object.keys(probeViewports),
      ]) {
        for (const theme of themes) {
          const about = collection.find((cell) => cell.id === `about-${viewportName}-${theme}`)
          const portfolio = collection.find(
            (cell) => cell.id === `portfolio-index-${viewportName}-${theme}`,
          )
          if (about?.probe.alignedShellLeft != null && portfolio?.probe.alignedShellLeft != null) {
            alignmentDeltas.push(
              Math.abs(about.probe.alignedShellLeft - portfolio.probe.alignedShellLeft),
            )
          }
        }
      }
    }
    const shellAlignmentMaxDelta = alignmentDeltas.length > 0 ? Math.max(...alignmentDeltas) : 999
    if (shellAlignmentMaxDelta > 1) {
      failures.push(`About and Portfolio shell edges differ by ${shellAlignmentMaxDelta}px`)
    }
    const index = {
      schemaVersion: 1,
      goalId: "owner-revision-2026-07-19",
      generatedAt: new Date().toISOString(),
      status: failures.length === 0 ? "PASS" : "FAIL",
      scope:
        "Owner revision: real portfolio, Garden-only navigation, flat Articles, centered article body, far-right TOC, and localized images",
      environment: {
        browser: chromeVersion.Browser,
        protocolVersion: chromeVersion["Protocol-Version"],
        node: process.version,
        deviceScaleFactor: 1,
        reducedMotion: true,
        externalResourcesBlocked: blockedExternalPatterns,
      },
      summary: {
        expectedScreenshotCount,
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
        shellAlignmentMaxDelta,
        stickyHeader,
        portfolioIdentityAlignmentFailures: allProbeCells.filter(
          (cell) =>
            cell.expectedSurface === "portfolio-index" &&
            (cell.probe.portfolioIdentityAlignmentDelta ?? 999) > 1,
        ).length,
        portfolioHeroColumnFailures: allProbeCells.filter(
          (cell) =>
            cell.expectedSurface === "portfolio-index" &&
            cell.viewport.width > 800 &&
            ((cell.probe.portfolioHeroColumnGap ?? -999) < 32 ||
              (cell.probe.portfolioHeroTopDelta ?? 999) > 1),
        ).length,
        aboutHeroScaleFailures: allProbeCells.filter(
          (cell) =>
            cell.expectedSurface === "about" &&
            cell.viewport.width >= 800 &&
            ((cell.probe.aboutPortraitWidth ?? 999) > 322 ||
              (cell.probe.aboutTitleFontSize ?? 999) > 46),
        ).length,
        headerUtilityAlignmentFailures: allProbeCells.filter(
          (cell) =>
            cell.probe.darkmodeVisibleIconCount !== 1 ||
            (cell.viewport.width >= 800 &&
              ((cell.probe.headerUtilityCenterDelta ?? 999) > 1 ||
                (cell.probe.headerIconCenterDelta ?? 999) > 1)),
        ).length,
        portfolioMetricOverlapFailures: allProbeCells.filter(
          (cell) => cell.expectedSurface === "portfolio-index" && cell.probe.portfolioMetricOverlap,
        ).length,
        portfolioMetricWrapFailures: allProbeCells.filter(
          (cell) =>
            cell.expectedSurface === "portfolio-index" &&
            cell.probe.portfolioMetricWrappedValueCount > 0,
        ).length,
        portfolioMetricOverflowFailures: allProbeCells.filter(
          (cell) =>
            cell.expectedSurface === "portfolio-index" &&
            cell.probe.portfolioMetricOverflowValueCount > 0,
        ).length,
        articlesShellMaxDelta: Math.max(
          ...Object.entries(articlesShellStability)
            .filter(([metric]) => metric.endsWith("Delta"))
            .map(([, delta]) => delta),
        ),
        portfolioEmailWrapFailures: allProbeCells.filter(
          (cell) =>
            cell.expectedSurface === "portfolio-index" &&
            cell.viewport.width >= 800 &&
            cell.probe.portfolioEmailLineCount !== 1,
        ).length,
        failures,
      },
      expectedTools,
      popover,
      articlesShellStability,
      tocCurrentSection,
      brainReaderMode,
      navigationBrandStates,
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
