import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import test from "node:test"

const root = new URL("../../", import.meta.url)
const read = (path) => readFile(new URL(path, root), "utf8")

test("repository-authored product home stays separate from excluded legacy content and keeps SEO precedence", async () => {
  const home = await readFile(new URL("content/index.md", root))
  const [legacy, ownerDecisions] = await Promise.all([
    read("../evidence/legacy-route-map.json").then(JSON.parse),
    read("tooling/privacy/owner-decisions.json").then(JSON.parse),
  ])
  const excludedRoot = legacy.deferredRoutes.find((entry) => entry.legacyRoute === "/")
  const rootDecision = ownerDecisions.decisions.find(
    (decision) => decision.sourcePath === excludedRoot.sourcePath,
  )

  assert.equal(legacy.routes.length, 0)
  assert.equal(excludedRoot.publicDestination, null)
  assert.equal(rootDecision.decision, "exclude")
  assert.equal(rootDecision.destination, null)
  assert.notEqual(createHash("sha256").update(home).digest("hex"), excludedRoot.sourceSha256)

  const homeSource = home.toString("utf8")
  assert.match(homeSource, /^---\ntitle: Home$/m)
  assert.match(homeSource, /^description: .+Dev Uni.+$/m)
  assert.match(homeSource, /^cssclasses:\n  - home-page$/m)
  assert.doesNotMatch(homeSource, /^aliases:|^sourceUrl:|^contentType: article$/m)

  const [head, pageDescription] = await Promise.all([
    read("quartz/components/Head.tsx"),
    read("quartz/components/pageDescription.ts"),
  ])
  assert.match(head, /resolvePageDescription\(cfg, fileData\)/)
  assert.ok(
    pageDescription.indexOf("fileData.frontmatter?.description") <
      pageDescription.indexOf('fileData.slug === "index"'),
  )
  assert.match(pageDescription, /if \(description\.trim\(\)\.length > 0\) return description/)
  assert.match(pageDescription, /fileData\.slug === "index"/)
  assert.match(pageDescription, /return HOME_DESCRIPTION/)
})

test("Lighthouse repairs are repository-owned and independent of fetched plugin edits", async () => {
  const [renderPage, accessibility, runtime, css] = await Promise.all([
    read("quartz/components/renderPage.tsx"),
    read("quartz/components/accessibility.ts"),
    read("quartz/components/scripts/accessibility.inline.ts"),
    read("quartz/styles/custom.scss"),
  ])

  assert.match(renderPage, /normalizeRenderedAccessibility\(render\(doc\)\)/)
  assert.match(accessibility, /mobile-explorer/)
  assert.match(accessibility, /desktop-explorer/)
  assert.match(accessibility, /toc-content/)
  assert.match(accessibility, /graph-outer/)
  assert.match(runtime, /explorer\.removeAttribute\("aria-expanded"\)/)
  assert.match(runtime, /content\.removeAttribute\("aria-expanded"\)/)
  assert.match(runtime, /button\.setAttribute\("aria-controls", content\.id\)/)
  assert.match(css, /footer\s*\{\s*opacity:\s*1;/)
})

test("unverified visitor counters do not ship in previews or production", async () => {
  const [resources, home, article] = await Promise.all([
    read("quartz/plugins/emitters/componentResources.ts"),
    read("public/index.html"),
    read("public/articles/tistory/23.html"),
  ])
  assert.doesNotMatch(resources, /publicCountersScript|refreshPublicCounters/)
  for (const html of [home, article]) {
    assert.doesNotMatch(html, /visit-counters|article-view-counter|집계 불가|지원 안 함/)
  }
})
