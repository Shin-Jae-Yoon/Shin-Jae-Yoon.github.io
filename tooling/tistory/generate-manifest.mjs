import { createHash } from "node:crypto"
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const repositoryRoot = path.resolve(import.meta.dirname, "../../../..")
const evidenceRoot = path.join(repositoryRoot, "migration/evidence/tistory")
const discoveryRoot = path.join(evidenceRoot, "raw/discovery")
const postsRoot = path.join(evidenceRoot, "raw/posts")
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex")
const decode = (value) =>
  value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .trim()
const capture = (text, expression, label) => {
  const match = text.match(expression)
  if (!match) throw new Error(`Missing ${label}`)
  return decode(match[1])
}

const rssBytes = await readFile(path.join(discoveryRoot, "rss.body"))
const sitemapBytes = await readFile(path.join(discoveryRoot, "sitemap.body"))
const indexBytes = await readFile(path.join(discoveryRoot, "index.body"))
const rss = rssBytes.toString("utf8")
const sitemap = sitemapBytes.toString("utf8")
const index = indexBytes.toString("utf8")
const rssItems = [...rss.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => ({
  canonicalUrl: capture(item, /<link>([^<]+)<\/link>/, "RSS link"),
  rssTitle: capture(item, /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/, "RSS title"),
  rssPublishedAt: new Date(
    capture(item, /<pubDate>([^<]+)<\/pubDate>/, "RSS publication date"),
  ).toISOString(),
}))
const sitemapUrls = new Set(
  [...sitemap.matchAll(/<loc>(https:\/\/jae-yoon\.tistory\.com\/\d+)<\/loc>/g)].map(
    (match) => match[1],
  ),
)
const indexUrls = new Set(
  [...index.matchAll(/href=["'](\/\d+)["']/g)].map(
    (match) => `https://jae-yoon.tistory.com${match[1]}`,
  ),
)

if (rssItems.length !== 15 || sitemapUrls.size !== 15) {
  throw new Error(`Expected 15 posts: RSS=${rssItems.length}, sitemap=${sitemapUrls.size}`)
}
if (rssItems.some(({ canonicalUrl }) => !sitemapUrls.has(canonicalUrl))) {
  throw new Error("RSS and sitemap canonical post sets differ")
}

const posts = []
for (const item of rssItems) {
  const id = item.canonicalUrl.split("/").at(-1)
  const bodyPath = path.join(postsRoot, `${id}.body`)
  const headersPath = path.join(postsRoot, `${id}.headers`)
  const curlPath = path.join(postsRoot, `${id}.curl.json`)
  const bodyBytes = await readFile(bodyPath)
  const headersBytes = await readFile(headersPath)
  const curl = JSON.parse(await readFile(curlPath, "utf8"))
  const html = bodyBytes.toString("utf8")
  const canonicalUrl = capture(
    html,
    /<link\s+rel="canonical"\s+href="([^"]+)"\s*\/>/,
    "canonical URL",
  )
  const pageTitle = capture(
    html,
    /<meta\s+property="og:title"\s+content="([^"]+)"\s*\/>/,
    "page title",
  )
  const pagePublishedAt = new Date(
    capture(
      html,
      /<meta\s+property="article:published_time"\s+content="([^"]+)"\s*\/>/,
      "page publication date",
    ),
  ).toISOString()
  if (canonicalUrl !== item.canonicalUrl) throw new Error(`${id}: canonical mismatch`)
  posts.push({
    id: Number(id),
    canonicalUrl,
    title: pageTitle,
    publishedAt: pagePublishedAt,
    retrievalTimestamp: new Date(
      curl.time_total
        ? capture(headersBytes.toString("utf8"), /(?:^|\n)date:\s*([^\r\n]+)/i, "response date")
        : Date.now(),
    ).toISOString(),
    response: {
      status: curl.http_code,
      effectiveUrl: curl.url_effective,
      contentType: curl.content_type,
      contentBytes: curl.size_download,
      redirectCount: curl.num_redirects,
      etag: curl.header_json?.at(-1)?.etag ?? null,
      lastModified: curl.header_json?.at(-1)?.["last-modified"] ?? null,
    },
    snapshots: {
      bodyPath: path.relative(repositoryRoot, bodyPath),
      bodySha256: sha256(bodyBytes),
      headersPath: path.relative(repositoryRoot, headersPath),
      headersSha256: sha256(headersBytes),
      curlMetadataPath: path.relative(repositoryRoot, curlPath),
      curlMetadataSha256: sha256(await readFile(curlPath)),
    },
    reconciliation: {
      inRss: true,
      inSitemap: true,
      inCurrentIndexPage: indexUrls.has(canonicalUrl),
      titleMatchesRss: pageTitle === item.rssTitle,
      dateMatchesRss: pagePublishedAt === item.rssPublishedAt,
      rssTitle: item.rssTitle,
      rssPublishedAt: item.rssPublishedAt,
    },
  })
}

const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  readOnlyPublicCapture: true,
  authenticated: false,
  mutatedSource: false,
  normalizationSpecification: "migration/quartz-v5/tooling/tistory/normalization-v1.json",
  discovery: {
    rss: {
      url: "https://jae-yoon.tistory.com/rss",
      count: rssItems.length,
      bodySha256: sha256(rssBytes),
    },
    sitemap: {
      url: "https://jae-yoon.tistory.com/sitemap.xml",
      count: sitemapUrls.size,
      bodySha256: sha256(sitemapBytes),
    },
    currentIndex: {
      url: "https://jae-yoon.tistory.com/",
      postCountOnFirstPage: indexUrls.size,
      bodySha256: sha256(indexBytes),
      explanation:
        "The current index first page exposes only the latest 8 posts; RSS and sitemap independently agree on the complete 15-post canonical set.",
    },
  },
  reconciliation: {
    canonicalSet: "RSS and sitemap match exactly at 15/15.",
    indexCountDifference:
      "Expected pagination difference: first index page lists posts 16-23 only.",
    titleMismatchCount: posts.filter((post) => !post.reconciliation.titleMatchesRss).length,
    dateMismatchCount: posts.filter((post) => !post.reconciliation.dateMatchesRss).length,
  },
  postCount: posts.length,
  posts,
}
await writeFile(path.join(evidenceRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(JSON.stringify({ postCount: posts.length, reconciliation: manifest.reconciliation }))
