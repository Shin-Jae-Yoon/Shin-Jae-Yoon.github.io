import assert from "node:assert/strict"
import { access, readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(path, import.meta.url), "utf8")

test("unverified public counters are absent from the runtime and built pages", async () => {
  const resources = await read("../../quartz/plugins/emitters/componentResources.ts")
  await assert.rejects(
    access(new URL("../../quartz/components/scripts/publicCounters.inline.ts", import.meta.url)),
  )
  assert.doesNotMatch(resources, /publicCountersScript|refreshPublicCounters/)

  for (const route of ["index.html", "articles/tistory/23.html", "garden/index.html"]) {
    const html = await read(`../../public/${route}`)
    assert.doesNotMatch(html, /visit-counters|article-view-counter|집계 불가|지원 안 함/)
  }
})

test("footer keeps stable spacing without a counter placeholder", async () => {
  const [footer, css] = await Promise.all([
    read("../../quartz/components/DevUniFooter.tsx"),
    read("../../quartz/styles/custom.scss"),
  ])
  assert.doesNotMatch(footer, /counter|visitor/i)
  assert.match(css, /\.dev-uni-footer-shell[\s\S]*padding-top:\s*2\.5rem/)
  assert.match(css, /\.visit-counters,[\s\S]*display:\s*none\s*!important/)
})
