import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

const readPublic = (path) => readFile(new URL(`../../public/${path}`, import.meta.url), "utf8")
const count = (html, pattern) => html.match(pattern)?.length ?? 0
const exactClass = (tag, className) => new RegExp(`<${tag}\\b[^>]*class="${className}"[^>]*>`, "g")
const classToken = (tag, className) =>
  new RegExp(`<${tag}\\b[^>]*class="(?:[^"]*\\s)?${className}(?:\\s[^"]*)?"[^>]*>`, "g")

const routes = [
  { path: "index.html", surface: "home", forbidden: ["explorer", "graph", "toc", "backlinks"] },
  { path: "about.html", surface: "about", forbidden: ["explorer", "graph", "toc", "backlinks"] },
  {
    path: "portfolio/index.html",
    surface: "portfolio-index",
    forbidden: ["explorer", "graph", "toc", "backlinks"],
  },
  {
    path: "portfolio/iot-platform.html",
    surface: "portfolio-detail",
    forbidden: ["explorer", "graph", "toc", "backlinks"],
  },
  {
    path: "brain/index.html",
    surface: "garden-index",
    required: ["explorer", "graph"],
    forbidden: ["toc", "backlinks"],
  },
  {
    path: "brain/notes/java/jvm.html",
    surface: "garden-detail",
    required: ["explorer", "graph", "backlinks"],
    forbidden: ["toc"],
  },
  {
    path: "articles/index.html",
    surface: "articles-index",
    forbidden: ["explorer", "graph", "toc", "backlinks"],
  },
  {
    path: "articles/tistory/23.html",
    surface: "article-detail",
    required: ["toc"],
    forbidden: ["explorer", "graph", "backlinks"],
  },
  {
    path: "articles/tistory/6.html",
    surface: "article-detail",
    forbidden: ["explorer", "graph"],
  },
  { path: "search.html", surface: "utility", forbidden: ["explorer", "graph", "toc", "backlinks"] },
  { path: "graph.html", surface: "utility", forbidden: ["explorer", "toc", "backlinks"] },
  { path: "topics.html", surface: "utility", forbidden: ["explorer", "graph", "toc", "backlinks"] },
]

const rootPatterns = {
  explorer: exactClass("div", "explorer nav-files-container"),
  graph: classToken("div", "graph"),
  toc: exactClass("div", "toc"),
  backlinks: exactClass("div", "backlinks"),
}

for (const route of routes) {
  test(`G002 built DOM: ${route.path}`, async () => {
    const html = await readPublic(route.path)

    assert.match(html, /<div id="quartz-root" class="page" data-frame="dev-uni">/)
    assert.match(html, new RegExp(`data-surface="${route.surface}"`))
    assert.equal(count(html, exactClass("div", "search")), 1, "Search must render exactly once")
    assert.equal(
      count(html, exactClass("button", "darkmode")),
      1,
      "Darkmode must render exactly once",
    )

    for (const tool of route.required ?? []) {
      assert.equal(count(html, rootPatterns[tool]), 1, `${tool} must render exactly once`)
    }
    for (const tool of route.forbidden ?? []) {
      assert.equal(count(html, rootPatterns[tool]), 0, `${tool} must be physically absent`)
    }
  })
}

test("G002 built DOM: 404 remains minimal and has no Dev Uni controls", async () => {
  const html = await readPublic("404.html")

  assert.match(html, /<div id="quartz-root" class="page" data-frame="minimal">/)
  assert.doesNotMatch(html, /data-surface=/)
  assert.equal(count(html, exactClass("div", "search")), 0)
  assert.equal(count(html, exactClass("button", "darkmode")), 0)
  for (const pattern of Object.values(rootPatterns)) assert.equal(count(html, pattern), 0)
})
