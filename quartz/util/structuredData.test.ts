import assert from "node:assert/strict"
import test from "node:test"
import { buildPageStructuredData, jsonLdMarkup } from "./structuredData"

test("non-root pages emit valid absolute Article and BreadcrumbList JSON-LD", () => {
  const data = buildPageStructuredData({
    baseUrl: "shin-jae-yoon.github.io",
    slug: "articles/reading-first-design",
    siteTitle: "Dev Uni",
    title: "읽기 우선 디자인",
    description: "고유한 설명",
    image: "https://shin-jae-yoon.github.io/static/og-image.png",
    dates: { published: "2026-07-18T00:00:00.000Z" },
  })

  assert.equal(data.length, 2)
  assert.equal(data[0]["@type"], "Article")
  assert.equal(data[1]["@type"], "BreadcrumbList")
  assert.equal(data[0].url, "https://shin-jae-yoon.github.io/articles/reading-first-design")
  const breadcrumb = data[1].itemListElement as Array<Record<string, unknown>>
  assert.deepEqual(
    breadcrumb.map(({ position }) => position),
    [1, 2, 3],
  )
  assert.ok(breadcrumb.every(({ item }) => String(item).startsWith("https://")))

  for (const entry of data) assert.deepEqual(JSON.parse(jsonLdMarkup(entry)), entry)
})

test("root emits WebSite metadata without a breadcrumb", () => {
  const data = buildPageStructuredData({
    baseUrl: "shin-jae-yoon.github.io",
    slug: "index",
    siteTitle: "Dev Uni",
    title: "Dev Uni",
    description: "홈 설명",
    image: "https://shin-jae-yoon.github.io/static/og-image.png",
  })
  assert.equal(data.length, 1)
  assert.equal(data[0]["@type"], "WebSite")
})
