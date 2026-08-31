import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("primary product routes exist with unique titles and descriptions", async () => {
  const routes = [
    "content/portfolio/index.md",
    "content/brain/_index.md",
    "content/articles/index.md",
    "content/portfolio/iot-platform.md",
    "content/portfolio/moabam.md",
    "content/search.md",
    "content/graph.md",
    "content/topics.md",
  ]

  const documents = await Promise.all(routes.map(read))
  const titles = documents.map((document) => document.match(/^title:\s*(.+)$/m)?.[1])
  const descriptions = documents.map((document) => document.match(/^description:\s*(.+)$/m)?.[1])

  assert.ok(titles.every(Boolean), "every route needs an explicit title")
  assert.ok(descriptions.every(Boolean), "every route needs an explicit description")
  assert.equal(new Set(titles).size, routes.length, "route titles must be unique")
  assert.equal(new Set(descriptions).size, routes.length, "route descriptions must be unique")
})

test("site shell exposes primary navigation and semantic skip target", async () => {
  const navigation = await read("quartz/components/PrimaryNavigation.tsx")
  const quartzEntry = await read("quartz.ts")
  const frames = await Promise.all(
    ["DefaultFrame.tsx", "FullWidthFrame.tsx", "MinimalFrame.tsx", "DevUniFrame.tsx"].map((name) =>
      read(`quartz/components/frames/${name}`),
    ),
  )

  for (const label of ["About", "Portfolio", "Brain", "Articles"]) {
    assert.match(navigation, new RegExp(`label: "${label}"`))
  }
  assert.match(navigation, /aria-label="주요 탐색"/)
  assert.match(navigation, /aria-current=/)
  assert.match(navigation, /currentSlug === "index"/)
  assert.match(navigation, /currentSlug === "about"/)
  assert.match(navigation, /class="site-menu-toggle"/)
  assert.match(navigation, /aria-controls="primary-navigation"/)
  assert.match(quartzEntry, /loadQuartzConfig\(undefined, layoutOverrides\)/)

  for (const frame of frames) {
    assert.match(frame, /class="skip-link" href="#site-content"/)
    assert.match(frame, /<main[^>]+id="site-content"[^>]+tabindex=\{-1\}/)
  }
})

test("theme contract includes focus, reduced motion, readable width, and responsive navigation", async () => {
  const css = await read("quartz/styles/custom.scss")
  const config = await read("quartz.config.default.yaml")

  assert.match(css, /--site-reading-width:\s*46rem/)
  assert.match(css, /:focus-visible/)
  assert.match(css, /prefers-reduced-motion:\s*reduce/)
  assert.match(css, /\.skip-link[\s\S]*top:\s*0\.5rem[\s\S]*clip-path:\s*inset\(50%\)/)
  assert.doesNotMatch(css, /\.skip-link[\s\S]{0,500}translateY\(-180%\)/)
  assert.match(config, /lightMode:[\s\S]*gray:\s*"#52666a"/)
  assert.match(config, /darkMode:[\s\S]*gray:\s*"#a9b9bc"/)
  assert.match(css, /max-width:\s*800px/)
  assert.match(css, /grid-template-columns:\s*1fr/)

  for (const selector of [
    String.raw`\.search-button`,
    String.raw`\.darkmode`,
    String.raw`\.readermode`,
    String.raw`\.explorer button\.mobile-explorer`,
    String.raw`\.global-graph-icon`,
    String.raw`\.primary-navigation a\.internal`,
  ]) {
    assert.match(
      css,
      new RegExp(`${selector}[\\s\\S]{0,220}min-height:\\s*44px`),
      `${selector} needs a 44px mobile hit target`,
    )
  }
})

test("owner revision screenshot harness resets page scroll immediately before capture", async () => {
  const harness = await read("tooling/design/capture-owner-revision.mjs")
  const routeBlock = harness.match(/const routes = \{[\s\S]*?\n\}/)?.[0]

  assert.ok(routeBlock)
  assert.equal(routeBlock.match(/^  "?[a-z-]+"?:/gm)?.length, 9)
  assert.match(routeBlock, /home: "\/"/)
  assert.match(routeBlock, /about: "\/about\.html"/)
  assert.match(harness, /"portfolio-detail": "\/portfolio\/iot-platform\.html"/)
  assert.match(harness, /"garden-index": "\/brain\/"/)
  assert.match(harness, /"garden-detail": "\/brain\/cs\/ds\/queue\.html"/)
  assert.match(harness, /"articles-index": "\/articles\/"/)
  assert.match(harness, /"articles-category": "\/articles\/category\/technical\.html"/)
  assert.match(harness, /history\.scrollRestoration = "manual"/)
  assert.match(harness, /window\.scrollTo\(0, 0\)/)
  assert.match(harness, /await resetPageScroll\(session\)[\s\S]{0,260}Page\.captureScreenshot/)
})

test("graph and search remain progressive enhancements with text alternatives", async () => {
  const config = await read("quartz.config.default.yaml")
  const garden = await read("content/brain/_index.md")
  const graph = await read("content/graph.md")
  const search = await read("content/search.md")

  assert.match(config, /source: github:quartz-community\/search[\s\S]*enabled: true/)
  assert.match(config, /source: github:quartz-community\/graph[\s\S]*enabled: true/)
  assert.match(config, /source: github:quartz-community\/backlinks[\s\S]*enabled: true/)
  assert.match(garden, /Java, Spring, CS, DB/)
  assert.match(garden, /aliases:[\s\S]*garden\/index/)
  assert.match(graph, /텍스트 경로/)
  assert.doesNotMatch(graph, /Articles|전체 태그/)
  assert.match(search, /검색을 사용하지 않아도/)
})
