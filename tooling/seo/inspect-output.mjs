import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const quartzRoot = path.resolve(here, "../..")
const outputRoot = path.join(quartzRoot, "public")
const evidencePath = path.resolve(quartzRoot, "../evidence/g013/seo-contract-report.json")
const legacyRouteMapPath = path.resolve(quartzRoot, "../evidence/legacy-route-map.json")
const origin = "https://shin-jae-yoon.github.io"

async function walk(root) {
  const files = []
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(absolute)))
    else if (entry.isFile()) files.push(absolute)
  }
  return files
}

const representativeFiles = [
  "index.html",
  "about.html",
  "tags/index.html",
  "garden/progressive-discovery.html",
  "articles/reading-first-design.html",
]
const representatives = await Promise.all(
  representativeFiles.map(async (file) => [
    file,
    await readFile(path.join(outputRoot, file), "utf8"),
  ]),
)
const failures = []
const descriptions = []

for (const [file, html] of representatives) {
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1]
  const ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/)?.[1]
  if (!canonical?.startsWith(`${origin}/`) && canonical !== `${origin}/`)
    failures.push(`${file}: invalid canonical ${canonical}`)
  if (!ogUrl?.startsWith(origin)) failures.push(`${file}: invalid og:url ${ogUrl}`)
  if (!description || /설명 없음|no description/i.test(description))
    failures.push(`${file}: placeholder description`)
  descriptions.push(description)

  const schemas = [
    ...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
  ].map((match) => JSON.parse(match[1]))
  if (file === "index.html") {
    if (!schemas.some((schema) => schema["@type"] === "WebSite"))
      failures.push(`${file}: WebSite JSON-LD missing`)
  } else {
    if (!schemas.some((schema) => schema["@type"] === "Article"))
      failures.push(`${file}: Article JSON-LD missing`)
    const breadcrumb = schemas.find((schema) => schema["@type"] === "BreadcrumbList")
    if (!breadcrumb) failures.push(`${file}: BreadcrumbList JSON-LD missing`)
    else if (
      !breadcrumb.itemListElement?.every(
        (item) => Number.isInteger(item.position) && String(item.item).startsWith(origin),
      )
    )
      failures.push(`${file}: invalid BreadcrumbList items`)
  }
}
if (new Set(descriptions).size !== descriptions.length)
  failures.push("representative descriptions are not unique")

const cname = await readFile(path.join(outputRoot, "CNAME"), "utf8")
const robots = await readFile(path.join(outputRoot, "robots.txt"), "utf8")
const sitemap = await readFile(path.join(outputRoot, "sitemap.xml"), "utf8")
const rss = await readFile(path.join(outputRoot, "index.xml"), "utf8")
if (cname !== "shin-jae-yoon.github.io") failures.push(`CNAME mismatch: ${cname}`)
if (robots !== `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`)
  failures.push("robots.txt mismatch")
for (const [name, document] of [
  ["sitemap", sitemap],
  ["RSS", rss],
]) {
  if (!document.includes(origin)) failures.push(`${name}: authoritative origin missing`)
  if (document.includes("https://jae-yoon.github.io")) failures.push(`${name}: old origin present`)
}

let aliasCount = 0
let invalidAliasCanonicalCount = 0
for (const file of (await walk(outputRoot)).filter((file) => file.endsWith(".html"))) {
  const html = await readFile(file, "utf8")
  if (!/<meta name="robots" content="noindex">/i.test(html)) continue
  if (!/<meta http-equiv="refresh"/i.test(html)) continue
  aliasCount++
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1]
  if (!canonical?.startsWith(origin)) invalidAliasCanonicalCount++
}
const legacyRouteMap = JSON.parse(await readFile(legacyRouteMapPath, "utf8"))
const expectedAliasCount = legacyRouteMap.routes.reduce(
  (count, route) =>
    count + Number(Boolean(route.legacyAlias)) + (route.compatibilityAliases?.length ?? 0),
  0,
)
if (legacyRouteMap.routes.length !== 0)
  failures.push(`${legacyRouteMap.routes.length} legacy public routes violate the G013 boundary`)
if (aliasCount !== expectedAliasCount)
  failures.push(
    `alias redirect count mismatch: expected ${expectedAliasCount}, found ${aliasCount}`,
  )
if (invalidAliasCanonicalCount > 0)
  failures.push(`${invalidAliasCanonicalCount} alias canonicals are not absolute/authoritative`)

const report = {
  schemaVersion: 1,
  status: failures.length === 0 ? "pass" : "fail",
  origin,
  representativeFiles,
  representativeDescriptionCount: new Set(descriptions).size,
  aliasCount,
  expectedAliasCount,
  publicLegacyRouteCount: legacyRouteMap.routes.length,
  invalidAliasCanonicalCount,
  robotsPresent: true,
  failures,
}
await mkdir(path.dirname(evidencePath), { recursive: true })
await writeFile(evidencePath, `${JSON.stringify(report, null, 2)}\n`)
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
if (failures.length > 0) process.exitCode = 1
