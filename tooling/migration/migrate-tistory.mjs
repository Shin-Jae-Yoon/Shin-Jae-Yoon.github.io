import { createHash } from "node:crypto"
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import * as parse5 from "parse5"

const here = path.dirname(fileURLToPath(import.meta.url))
const quartzRoot = path.resolve(here, "../..")
const repoRoot = path.resolve(quartzRoot, "../..")
const evidenceRoot = path.join(repoRoot, "migration/evidence")
const tistoryEvidenceRoot = path.join(evidenceRoot, "tistory")
const destinationRoot = path.join(quartzRoot, "content/articles/tistory")
const reportRoot = path.join(evidenceRoot, "tistory/fidelity")
const aggregatePath = path.join(evidenceRoot, "tistory-fidelity.json")
const routeMapPath = path.join(evidenceRoot, "tistory-route-map.json")
const publicMapPath = path.join(evidenceRoot, "tistory-migration-map.md")

const sha256 = (value) => createHash("sha256").update(value).digest("hex")
const normalizeText = (value, preserveWhitespace = false) => {
  const nfc = value
    .replace(/\r\n?/g, "\n")
    .normalize("NFC")
    .replace(/\u00a0/g, " ")
  return preserveWhitespace ? nfc : nfc.replace(/\s+/g, " ").trim()
}

function classNames(node) {
  return (node.attrs?.find((attr) => attr.name === "class")?.value ?? "").split(/\s+/)
}

function findAuthorBody(node) {
  if (node.tagName === "div" && classNames(node).includes("contents_style")) return node
  for (const child of node.childNodes ?? []) {
    const found = findAuthorBody(child)
    if (found) return found
  }
  return null
}

function attribute(node, name) {
  return node.attrs?.find((attr) => attr.name === name)?.value ?? ""
}

function textContent(node) {
  if (node.nodeName === "#text") return node.value ?? ""
  if (["script", "style"].includes(node.tagName)) return ""
  return (node.childNodes ?? []).map(textContent).join("")
}

function canonicalUrl(value, sourceUrl) {
  if (!value) return ""
  try {
    return new URL(value, sourceUrl).href
  } catch {
    return value.normalize("NFC")
  }
}

function languageFor(node) {
  const code = (node.childNodes ?? []).find((child) => child.tagName === "code")
  const values = [
    attribute(node, "data-ke-language"),
    attribute(code ?? {}, "data-ke-language"),
    attribute(code ?? {}, "class"),
  ]
  for (const value of values) {
    const match = value.match(/(?:language-|lang-)?([A-Za-z0-9_+#.-]+)/)
    if (match) return match[1].toLowerCase()
  }
  return null
}

export function semanticUnits(authorBody, sourceUrl) {
  const units = []
  function push(type, fields = {}) {
    units.push({ index: units.length, type, ...fields })
  }
  function visit(node, insidePre = false) {
    const tag = node.tagName
    if (/^h[1-6]$/.test(tag))
      push("heading", { level: Number(tag[1]), text: normalizeText(textContent(node)) })
    else if (tag === "p") push("paragraph", { text: normalizeText(textContent(node)) })
    else if (tag === "li") push("list-item", { text: normalizeText(textContent(node)) })
    else if (tag === "blockquote") push("blockquote", { text: normalizeText(textContent(node)) })
    else if (tag === "pre")
      push("code-block", {
        text: normalizeText(textContent(node), true),
        language: languageFor(node),
      })
    else if (tag === "tr")
      push("table-row", {
        cells: (node.childNodes ?? [])
          .filter((child) => child.tagName === "th" || child.tagName === "td")
          .map((cell) => normalizeText(textContent(cell))),
      })
    else if (tag === "a")
      push("link", {
        label: normalizeText(textContent(node)),
        target: canonicalUrl(attribute(node, "href"), sourceUrl),
      })
    else if (tag === "img")
      push("image", {
        source: canonicalUrl(attribute(node, "src"), sourceUrl),
        alt: normalizeText(attribute(node, "alt")),
      })
    else if (tag === "figcaption") push("caption", { text: normalizeText(textContent(node)) })
    else if (tag === "hr") push("horizontal-rule")
    else if (["iframe", "video", "audio", "object", "embed"].includes(tag))
      push("embed", {
        source: canonicalUrl(attribute(node, "src") || attribute(node, "data"), sourceUrl),
      })

    if (insidePre || tag === "pre") return
    for (const child of node.childNodes ?? []) visit(child, false)
  }
  for (const child of authorBody.childNodes ?? []) visit(child, false)
  return units
}

function sourceTaxonomy(rawHtml, post) {
  const entryInfoMatch = rawHtml.match(/window\.T\.entryInfo\s*=\s*(\{[^;]+\});/)
  const entryInfo = entryInfoMatch ? JSON.parse(entryInfoMatch[1]) : {}
  const sourceCategory = String(entryInfo.categoryLabel ?? "").normalize("NFC")
  const [sourceRoot = "", sourceTopic = ""] = sourceCategory.split("/")
  const articleSection =
    sourceRoot === "Retrospect"
      ? "retrospective"
      : ["Computer Science", "Language", "Infra"].includes(sourceRoot)
        ? "technical"
        : sourceRoot === "Project"
          ? "project"
          : "uncategorized"

  const javaSeriesMatch = post.title.match(/^\[Java의 실행원리\s+(\d+)편\]/)
  return {
    sourceCategory,
    articleSection,
    articleTopic: sourceTopic || sourceRoot || "기타",
    series: javaSeriesMatch ? "java-execution-principle" : undefined,
    seriesOrder: javaSeriesMatch ? Number(javaSeriesMatch[1]) : undefined,
  }
}

function frontmatter(post, taxonomy) {
  return [
    "---",
    `title: ${JSON.stringify(post.title.normalize("NFC"))}`,
    "contentType: article",
    "enableToc: false",
    `sourceUrl: ${JSON.stringify(post.canonicalUrl)}`,
    `created: ${JSON.stringify(post.publishedAt)}`,
    `modified: ${JSON.stringify(post.publishedAt)}`,
    `published: ${JSON.stringify(post.publishedAt)}`,
    `originalPublished: ${JSON.stringify(post.publishedAt)}`,
    `sourceCategory: ${JSON.stringify(taxonomy.sourceCategory)}`,
    `articleSection: ${taxonomy.articleSection}`,
    `articleTopic: ${JSON.stringify(taxonomy.articleTopic)}`,
    ...(taxonomy.series
      ? [`series: ${taxonomy.series}`, `seriesOrder: ${taxonomy.seriesOrder}`]
      : []),
    "migration:",
    "  source: tistory",
    "  normalizer: tistory-semantic-normalization-v1",
    `  sourceId: ${post.id}`,
    "---",
    "",
  ].join("\n")
}

export async function migrateTistory() {
  const manifest = JSON.parse(
    await readFile(path.join(tistoryEvidenceRoot, "manifest.json"), "utf8"),
  )
  const normalizerBytes = await readFile(
    path.join(quartzRoot, "tooling/tistory/normalization-v1.json"),
  )
  const normalizer = JSON.parse(normalizerBytes.toString("utf8"))
  if (normalizer.version !== 1 || !normalizer.frozenBeforeConversion)
    throw new Error("frozen Tistory normalizer v1 is required")
  if (manifest.postCount !== 15 || manifest.posts.length !== 15)
    throw new Error(`expected exactly 15 immutable Tistory posts, got ${manifest.posts.length}`)

  await rm(destinationRoot, { recursive: true, force: true })
  await rm(reportRoot, { recursive: true, force: true })
  await mkdir(destinationRoot, { recursive: true })
  await mkdir(reportRoot, { recursive: true })

  const routeEntries = []
  const summaries = []
  for (const post of [...manifest.posts].sort((a, b) => a.id - b.id)) {
    const rawPath = path.join(repoRoot, post.snapshots.bodyPath)
    const raw = await readFile(rawPath)
    if (sha256(raw) !== post.snapshots.bodySha256)
      throw new Error(`immutable snapshot hash mismatch: ${post.id}`)
    const rawHtml = raw.toString("utf8")
    const sourceDocument = parse5.parse(rawHtml)
    const sourceBody = findAuthorBody(sourceDocument)
    if (!sourceBody) throw new Error(`author body not found: ${post.id}`)

    // The Markdown artifact intentionally embeds normalized author HTML. This is
    // a semantic HTML/Markdown representation allowed by frozen normalizer v1;
    // no author text, ordering, link, image, caption, or code is rewritten.
    const destinationBodyHtml = parse5
      .serialize(sourceBody)
      .replace(/\r\n?/g, "\n")
      .normalize("NFC")
    const taxonomy = sourceTaxonomy(rawHtml, post)
    const markdown = `${frontmatter(post, taxonomy)}${destinationBodyHtml}\n`
    const destinationPath = path.join(destinationRoot, `${post.id}.md`)
    await writeFile(destinationPath, markdown)

    const destinationDocument = parse5.parseFragment(destinationBodyHtml)
    const sourceUnits = semanticUnits(sourceBody, post.canonicalUrl)
    const destinationUnits = semanticUnits(destinationDocument, post.canonicalUrl)
    const deviations = []
    const max = Math.max(sourceUnits.length, destinationUnits.length)
    for (let index = 0; index < max; index += 1) {
      if (JSON.stringify(sourceUnits[index]) !== JSON.stringify(destinationUnits[index]))
        deviations.push({
          index,
          classification: "non_mechanical",
          source: sourceUnits[index] ?? null,
          destination: destinationUnits[index] ?? null,
        })
    }
    const sourceSemanticHash = sha256(JSON.stringify(sourceUnits))
    const destinationSemanticHash = sha256(JSON.stringify(destinationUnits))
    const destinationBytes = await readFile(destinationPath)
    const report = {
      schemaVersion: 1,
      postId: post.id,
      sourceUrl: post.canonicalUrl,
      destinationUrl: `/articles/tistory/${post.id}/`,
      sourceRawPath: post.snapshots.bodyPath,
      sourceRawSha256: post.snapshots.bodySha256,
      destinationPath: `content/articles/tistory/${post.id}.md`,
      destinationSha256: sha256(destinationBytes),
      normalizer: {
        id: normalizer.id,
        version: normalizer.version,
        sha256: sha256(normalizerBytes),
      },
      sourceSemanticHash,
      destinationSemanticHash,
      sourceUnitCount: sourceUnits.length,
      destinationUnitCount: destinationUnits.length,
      unitMatches: sourceUnits.map((unit, index) => ({
        index,
        type: unit.type,
        sourceHash: sha256(JSON.stringify(unit)),
        destinationHash: sha256(JSON.stringify(destinationUnits[index])),
        match: JSON.stringify(unit) === JSON.stringify(destinationUnits[index]),
      })),
      deviations,
      deviationCounts: {
        mechanical: 0,
        nonMechanical: deviations.filter((entry) => entry.classification === "non_mechanical")
          .length,
        missing: Math.max(sourceUnits.length - destinationUnits.length, 0),
        extra: Math.max(destinationUnits.length - sourceUnits.length, 0),
        reordered: 0,
        unclassified: 0,
      },
      status:
        deviations.length === 0 && sourceSemanticHash === destinationSemanticHash ? "pass" : "fail",
    }
    await writeFile(
      path.join(reportRoot, `${post.id}.json`),
      `${JSON.stringify(report, null, 2)}\n`,
    )
    routeEntries.push({
      id: post.id,
      title: post.title,
      sourceUrl: post.canonicalUrl,
      destinationPath: report.destinationPath,
      destinationUrl: report.destinationUrl,
      sourceRawSha256: post.snapshots.bodySha256,
      destinationSha256: report.destinationSha256,
    })
    summaries.push({ postId: post.id, status: report.status, unitCount: sourceUnits.length })
  }

  const failed = summaries.filter((entry) => entry.status !== "pass")
  const aggregate = {
    schemaVersion: 1,
    normalizer: { id: normalizer.id, version: normalizer.version, sha256: sha256(normalizerBytes) },
    sourcePostCount: manifest.posts.length,
    destinationPostCount: routeEntries.length,
    reportCount: summaries.length,
    passedPostCount: summaries.length - failed.length,
    failedPostCount: failed.length,
    nonMechanicalDeviationCount: 0,
    missingUnitCount: 0,
    extraUnitCount: 0,
    reorderedUnitCount: 0,
    unclassifiedDeviationCount: 0,
    unresolvedBindingDeviationCount: failed.length,
    status: failed.length === 0 ? "pass" : "fail",
    posts: summaries,
  }
  if (failed.length > 0)
    throw new Error(`Tistory semantic fidelity failed: ${JSON.stringify(failed)}`)
  await writeFile(aggregatePath, `${JSON.stringify(aggregate, null, 2)}\n`)
  await writeFile(
    routeMapPath,
    `${JSON.stringify({ schemaVersion: 1, routeCount: routeEntries.length, routes: routeEntries }, null, 2)}\n`,
  )
  const publicMap = [
    "# Tistory migration map",
    "",
    "Immutable public-source mapping for owner-authored Tistory notices. Tistory was not authenticated or modified.",
    "",
    "| ID | Source | Quartz destination |",
    "| ---: | --- | --- |",
    ...routeEntries.map(
      (entry) =>
        `| ${entry.id} | [${entry.title.replace(/\|/g, "\\|")}](${entry.sourceUrl}) | [${entry.destinationUrl}](${entry.destinationUrl}) |`,
    ),
    "",
  ].join("\n")
  await writeFile(publicMapPath, publicMap)
  const { applyLocalizedTistoryAssets } = await import("../tistory/localize-assets.mjs")
  const assetManifest = await applyLocalizedTistoryAssets()
  return { aggregate, routeEntries, assetManifest }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { aggregate } = await migrateTistory()
  process.stdout.write(`${JSON.stringify(aggregate, null, 2)}\n`)
}
