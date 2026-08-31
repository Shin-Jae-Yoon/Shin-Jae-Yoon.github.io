import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import path from "node:path"
import test from "node:test"

const quartzRoot = path.resolve(import.meta.dirname, "../..")
const publicRoot = path.join(quartzRoot, "public")
const origin = "https://shin-jae-yoon.github.io"
const count = (text, pattern) => text.match(pattern)?.length ?? 0
const exactClass = (tag, className) => new RegExp(`<${tag}\\b[^>]*class="${className}"[^>]*>`, "g")
const classToken = (tag, className) =>
  new RegExp(`<${tag}\\b[^>]*class="(?:[^"]*\\s)?${className}(?:\\s[^"]*)?"[^>]*>`, "g")

const routeMatrix = [
  {
    file: "index.html",
    canonical: "/",
    surface: "home",
    forbidden: ["explorer", "graph", "toc", "backlinks"],
  },
  {
    file: "about.html",
    canonical: "/about",
    surface: "about",
    forbidden: ["explorer", "graph", "toc", "backlinks"],
  },
  {
    file: "portfolio/index.html",
    canonical: "/portfolio",
    surface: "portfolio-index",
    forbidden: ["explorer", "graph", "toc", "backlinks"],
  },
  {
    file: "portfolio/iot-platform.html",
    canonical: "/portfolio/iot-platform",
    surface: "portfolio-detail",
    forbidden: ["explorer", "graph", "toc", "backlinks"],
  },
  {
    file: "brain/index.html",
    canonical: "/brain",
    surface: "garden-index",
    required: ["explorer", "graph"],
    forbidden: ["toc", "backlinks"],
  },
  {
    file: "brain/notes/java/jvm.html",
    canonical: "/brain/notes/java/jvm",
    surface: "garden-detail",
    required: ["explorer", "graph", "backlinks"],
    forbidden: ["toc"],
  },
  {
    file: "articles/index.html",
    canonical: "/articles",
    surface: "articles-index",
    forbidden: ["explorer", "graph", "toc", "backlinks"],
  },
  {
    file: "articles/tistory/23.html",
    canonical: "/articles/tistory/23",
    surface: "article-detail",
    required: ["toc"],
    forbidden: ["explorer", "graph", "backlinks"],
  },
  {
    file: "search.html",
    canonical: "/search",
    surface: "utility",
    forbidden: ["explorer", "graph", "toc", "backlinks"],
  },
]

const toolPatterns = {
  explorer: exactClass("div", "explorer nav-files-container"),
  graph: classToken("div", "graph"),
  toc: exactClass("div", "toc"),
  backlinks: exactClass("div", "backlinks"),
}

test("G003 route-purpose DOM and keyboard-entry invariants are preserved", async () => {
  for (const route of routeMatrix) {
    const html = await readFile(path.join(publicRoot, route.file), "utf8")
    assert.match(html, new RegExp(`data-surface="${route.surface}"`), route.file)
    assert.equal(count(html, /<main\b[^>]*id="site-content"[^>]*tabindex="-1"/g), 1, route.file)
    assert.equal(count(html, /<header class="dev-uni-header"/g), 1, route.file)
    assert.equal(count(html, /<footer\b/g), 1, route.file)
    assert.equal(count(html, exactClass("div", "search")), 1, route.file)
    assert.equal(count(html, exactClass("button", "darkmode")), 1, route.file)
    assert.equal(count(html, /class="skip-link" href="#site-content"/g), 1, route.file)
    assert.match(html, /class="search-button" aria-label="검색" aria-expanded="false"/)
    assert.match(html, /class="darkmode" aria-label="다크 모드"/)
    assert.doesNotMatch(html, /class="[^"\n]*properties[^"\n]*"/i, route.file)

    for (const tool of route.required ?? []) {
      assert.equal(count(html, toolPatterns[tool]), 1, `${route.file}: ${tool}`)
    }
    for (const tool of route.forbidden ?? []) {
      assert.equal(count(html, toolPatterns[tool]), 0, `${route.file}: ${tool}`)
    }
  }
})

test("G003 representative SEO and accessibility metadata remain authored and authoritative", async () => {
  for (const route of routeMatrix) {
    const html = await readFile(path.join(publicRoot, route.file), "utf8")
    const expectedCanonical = `${origin}${route.canonical}`
    assert.match(html, new RegExp(`<link rel="canonical" href="${expectedCanonical}"`), route.file)
    assert.match(
      html,
      new RegExp(`<meta property="og:url" content="${expectedCanonical}"`),
      route.file,
    )
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1]
    assert.ok(description && !/설명 없음|no description/i.test(description), route.file)
    assert.match(html, /<nav class="primary-navigation" aria-label="주요 탐색">/, route.file)

    for (const image of html.match(/<img\b[^>]*>/g) ?? []) {
      assert.match(
        image,
        /\balt(?:="[^"]*")?(?:\s|\/?>)/,
        `${route.file}: every image needs an alt decision`,
      )
    }
  }
})

test("G003 former Garden route permanently points search engines and visitors to Brain", async () => {
  const redirect = await readFile(path.join(publicRoot, "garden/index.html"), "utf8")

  assert.match(redirect, /<meta http-equiv="refresh" content="0; url=\.\.\/brain\/">/)
  assert.match(
    redirect,
    /<link rel="canonical" href="https:\/\/shin-jae-yoon\.github\.io\/brain\/">/,
  )
  assert.match(redirect, /<meta name="robots" content="noindex">/)
})

test("G003 analytics remains exactly once while unverified counters stay absent", async () => {
  const analytics = await readFile(
    path.join(quartzRoot, "quartz/plugins/emitters/componentResources.ts"),
    "utf8",
  )
  const googleAnalytics = analytics.match(
    /if \(cfg\.analytics\?\.provider === "google"\)[\s\S]*?else if/,
  )?.[0]
  assert.ok(googleAnalytics)

  assert.equal(count(googleAnalytics, /gtag\('event', 'page_view'/g), 2)
  assert.equal(count(googleAnalytics, /document\.addEventListener\('nav'/g), 1)
  assert.equal(count(googleAnalytics, /send_page_view: false/g), 1)
  assert.equal(count(googleAnalytics, /document\.head\.appendChild\(gtagScript\)/g), 1)
  assert.doesNotMatch(analytics, /publicCountersScript|refreshPublicCounters/)
  const article = await readFile(path.join(publicRoot, "articles/tistory/23.html"), "utf8")
  assert.doesNotMatch(article, /visit-counters|article-view-counter|집계 불가|지원 안 함/)
})

test("owner revision visual gate is current and passing", async () => {
  const report = JSON.parse(
    await readFile(
      path.resolve(quartzRoot, "../evidence/design-owner-revision/capture-index.json"),
      "utf8",
    ),
  )
  assert.equal(report.status, "PASS")
  assert.deepEqual(report.summary.failures, [])
  assert.equal(report.summary.screenshotCount, 36)
})
