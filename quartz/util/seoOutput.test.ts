import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { absolutizeAliasCanonical, finalizeSeoOutput } from "./seoOutput"

test("alias redirect canonicals become absolute without changing the route target", () => {
  const source = `<link rel="canonical" href="../articles/example">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=../articles/example">`
  const result = absolutizeAliasCanonical(
    source,
    new URL("https://shin-jae-yoon.github.io/legacy/example"),
  )

  assert.equal(result.changed, true)
  assert.match(result.html, /href="https:\/\/shin-jae-yoon\.github\.io\/articles\/example"/)
  assert.match(result.html, /content="0; url=\.\.\/articles\/example"/)
})

test("SEO finalization durably emits robots and rewrites only redirect pages", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "quartz-seo-"))
  try {
    await mkdir(path.join(root, "legacy"), { recursive: true })
    await writeFile(
      path.join(root, "legacy", "index.html"),
      `<link rel="canonical" href="../article"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=../article">`,
    )
    await writeFile(path.join(root, "article.html"), `<link rel="canonical" href="/article">`)

    assert.equal(await finalizeSeoOutput(root, "shin-jae-yoon.github.io"), 1)
    assert.equal(
      await readFile(path.join(root, "robots.txt"), "utf8"),
      "User-agent: *\nAllow: /\n\nSitemap: https://shin-jae-yoon.github.io/sitemap.xml\n",
    )
    assert.match(
      await readFile(path.join(root, "legacy", "index.html"), "utf8"),
      /https:\/\/shin-jae-yoon\.github\.io\/article/,
    )
    assert.equal(
      await readFile(path.join(root, "article.html"), "utf8"),
      `<link rel="canonical" href="/article">`,
    )
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
