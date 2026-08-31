import { createHash } from "node:crypto"
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { execFileSync, spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { readJson } from "../privacy/inventory-lib.mjs"
import { verifyLegacyExclusionAuthorization } from "../privacy/legacy-authorization.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const quartzRoot = path.resolve(here, "../..")
const repoRoot = path.resolve(quartzRoot, "../..")
const contentRoot = path.join(quartzRoot, "content")
const evidenceRoot = path.join(repoRoot, "migration/evidence")
const reportPath = path.join(evidenceRoot, "legacy-content-migration.json")
const routeMapPath = path.join(evidenceRoot, "legacy-route-map.json")
const backlogPath = path.join(evidenceRoot, "legacy-deferred-content-backlog.json")
const handoffPath = path.join(evidenceRoot, "legacy-deferred-content-handoff.md")
const inventoryPath = path.join(evidenceRoot, "inventory.json")
const ownerDecisionsPath = path.join(quartzRoot, "tooling/privacy/owner-decisions.json")
const legacyCommit = "d92e3faa9deeb7a1b9406c6e36fbe8eac4a03443"
const deniedPrefixes = ["content/private/", "content/templates/"]
const compatibilityAliases = {
  "content/brain/CS/LT/ParseTree.md": ["brain/CS/LT/ParseTree"],
  "content/brain/Interview/dog-study/dog-week06.md": ["brain/Interview/dog-study/dog-week06/index"],
  "content/brain/Lecture/pl/fun-java/fun-java09.md": ["brain/Lecture/fun-java/fun-java09"],
  "content/brain/Lecture/backend/kim-spring/http/section01.md": [
    "brain/lecture/kim-spring/http/section01/index",
  ],
  "content/brain/Lecture/backend/kim-spring/http/section04.md": [
    "brain/lecture/kim-spring/http/section04/index",
  ],
  "content/brain/Lecture/dataStructure/easy-ds/lecture00.md": [
    "brain/lecture/easycode/ds/lecture01",
    "brain/lecture/easycode/ds/lecture02",
    "brain/lecture/easycode/ds/lecture03",
    "brain/lecture/easycode/ds/lecture04",
    "brain/lecture/easycode/ds/lecture05",
    "brain/lecture/easycode/ds/lecture06",
    "brain/lecture/easycode/ds/lecture10",
    "brain/lecture/easycode/ds/lecture11",
  ],
  "content/brain/Lecture/db/easy-db/lecture12.md": ["brain/lecture/easycode/db/lecture12/index"],
  "content/brain/Lecture/frontend/apple-html/all-in-one-mid.md": [
    "brain/lecture/apple/apple-html/all-in-one-mid",
  ],
  "content/brain/Lecture/frontend/apple-html/all-in-one-last.md": [
    "brain/lecture/apple/apple-html/all-in-one-last",
  ],
  "content/brain/Lecture/frontend/apple-js/apple-js-01.md": [
    "brain/lecture/apple-js/apple-js-01",
    "brain/lecture/apple/apple-js/apple-js-01",
  ],
  "content/brain/Lecture/frontend/apple-js/apple-js-02.md": [
    "brain/lecture/apple/apple-js/apple-js-02",
  ],
  "content/brain/Lecture/pl/fun-java/fun-java04.md": [
    "brain/lecture/fun-java/fun-java04",
    "brain/lecture/fun-java/fun-java04/index",
  ],
}

const sha256 = (value) => createHash("sha256").update(value).digest("hex")
const posix = (value) => value.split(path.sep).join("/")
const git = (...args) => execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" })

function gitBlobs(sourcePaths) {
  const input = sourcePaths.map((sourcePath) => `${legacyCommit}:${sourcePath}\n`).join("")
  const result = spawnSync("git", ["cat-file", "--batch"], {
    cwd: repoRoot,
    input,
    maxBuffer: 1024 * 1024 * 1024,
  })
  if (result.status !== 0) throw new Error(result.stderr.toString("utf8"))
  const blobs = new Map()
  let offset = 0
  for (const sourcePath of sourcePaths) {
    const newline = result.stdout.indexOf(10, offset)
    if (newline < 0) throw new Error(`missing git cat-file header: ${sourcePath}`)
    const header = result.stdout.subarray(offset, newline).toString("utf8")
    const match = header.match(/^[0-9a-f]+ blob (\d+)$/)
    if (!match) throw new Error(`unexpected git cat-file header for ${sourcePath}: ${header}`)
    const size = Number(match[1])
    const start = newline + 1
    blobs.set(sourcePath, Buffer.from(result.stdout.subarray(start, start + size)))
    offset = start + size + 1
  }
  return blobs
}

function sourceRoute(sourcePath) {
  if (sourcePath === "content/brain.md") return "/"
  let stem = sourcePath.slice("content/".length).replace(/\.(?:md|markdown)$/i, "")
  if (stem === "_index" || stem === "index") return "/"
  stem = stem.replace(/\/(?:_index|index)$/i, "")
  return `/${stem}/`
}

function destinationPath(sourcePath) {
  if (sourcePath === "content/brain.md") return "content/index.md"
  const sourceDirectory = path.posix.dirname(sourcePath)
  const sourceStem = path.posix.basename(sourcePath).replace(/\.(?:md|markdown)$/i, "")
  // Quartz treats `folder/folder.md` as the folder index. Nesting the
  // byte-identical document one level deeper preserves Hugo's distinct
  // `/folder/folder/` route without adding route-changing frontmatter.
  if (sourceStem.toLowerCase() === path.posix.basename(sourceDirectory).toLowerCase()) {
    return `${sourceDirectory}/${sourceStem}/index.md`
  }
  return sourcePath.replace(/\/_index\.(md|markdown)$/i, "/index.$1")
}

function legacyAlias(route) {
  if (route === "/") return null
  return `${route.replace(/^\//, "").replace(/\/$/, "")}/index`
}

function withAliases(source, aliases) {
  if (aliases.length === 0) return source
  const line = `aliases:\n${aliases.map((alias) => `  - ${JSON.stringify(alias)}`).join("\n")}\n`
  const text = source.toString("utf8")
  if (text.startsWith("---\n")) return Buffer.from(`---\n${line}${text.slice(4)}`)
  return Buffer.from(`---\n${line}---\n${text}`)
}

function authorBody(source) {
  const text = source.toString("utf8")
  if (!text.startsWith("---\n")) return Buffer.from(text)
  const closing = text.indexOf("\n---", 4)
  if (closing < 0) return Buffer.from(text)
  let start = closing + 4
  if (text[start] === "\n") start += 1
  return Buffer.from(text.slice(start))
}

function stripLiteralExamples(markdown) {
  return markdown
    .replace(/(^|\n)[ \t]*(```|~~~)[^\n]*\n[\s\S]*?\n[ \t]*\2(?=\n|$)/g, "$1")
    .replace(/<!--([\s\S]*?)-->/g, "")
    .replace(/`+[^`\n]*`+/g, "")
}

function referencedAssetTokens(markdown) {
  const text = stripLiteralExamples(markdown)
  const tokens = []
  const patterns = [
    /!\[[^\]]*\]\(\s*<?([^)>\s]+)>?(?:\s+["'][^"']*["'])?\s*\)/g,
    /!\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g,
    /<(?:img|source|video|audio)\b[^>]*\b(?:src|poster)\s*=\s*["']([^"']+)["'][^>]*>/gi,
  ]
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) tokens.push(match[1])
  }
  return tokens
}

function resolveAsset(sourcePath, token, assets, byBasename) {
  let decoded
  try {
    decoded = decodeURIComponent(token)
  } catch {
    decoded = token
  }
  const clean = decoded.trim().replace(/^<|>$/g, "").split(/[?#]/, 1)[0]
  if (!clean || /^(?:[a-z]+:|\/\/|#)/i.test(clean)) return null
  const candidates = clean.startsWith("/")
    ? [`content/${clean.replace(/^\/+/, "")}`]
    : [
        `content/${clean}`,
        path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath), clean)),
      ]
  for (const candidate of candidates) if (assets.has(candidate)) return candidate
  const matches = byBasename.get(path.posix.basename(clean)) ?? []
  return matches.length === 1 ? matches[0] : null
}

async function removePriorGeneratedFiles() {
  try {
    const prior = JSON.parse(await readFile(routeMapPath, "utf8"))
    for (const entry of [...(prior.routes ?? []), ...(prior.assets ?? [])]) {
      if (!entry.destinationPath?.startsWith("content/")) continue
      await rm(path.join(quartzRoot, entry.destinationPath), { force: true })
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }
}

export async function migrateLegacy() {
  const snapshot = JSON.parse(await readFile(path.join(evidenceRoot, "legacy-routes.json"), "utf8"))
  const tracked = git("ls-tree", "-r", "--name-only", legacyCommit, "--", "content")
    .trim()
    .split("\n")
    .filter(Boolean)
    .sort()
  const markdown = tracked.filter((entry) => /\.(?:md|markdown)$/i.test(entry))
  const denied = markdown.filter((entry) =>
    deniedPrefixes.some((prefix) => entry.startsWith(prefix)),
  )
  const candidates = markdown.filter((entry) => !denied.includes(entry))
  const assetCandidates = new Set(tracked.filter((entry) => !markdown.includes(entry)))
  const byBasename = new Map()
  for (const asset of assetCandidates) {
    const basename = path.posix.basename(asset)
    byBasename.set(basename, [...(byBasename.get(basename) ?? []), asset])
  }

  if (candidates.length !== 261 || denied.length !== 53 || snapshot.routeCount !== 261) {
    throw new Error(
      `privacy boundary mismatch: candidates=${candidates.length}, denied=${denied.length}, snapshot=${snapshot.routeCount}`,
    )
  }

  const routeEntries = []
  const assetSources = new Set()
  const unresolvedAssetTokens = []
  const markdownBlobs = gitBlobs(candidates)
  for (const sourcePath of candidates) {
    const source = markdownBlobs.get(sourcePath)
    const destination = destinationPath(sourcePath)
    const route = sourceRoute(sourcePath)
    const aliases = [
      ...new Set([legacyAlias(route), ...(compatibilityAliases[sourcePath] ?? [])]),
    ].filter(Boolean)
    const destinationBytes = withAliases(source, aliases)
    routeEntries.push({
      sourcePath,
      sourceSha256: sha256(source),
      destinationPath: destination,
      destinationSha256: sha256(destinationBytes),
      sourceAuthorBodySha256: sha256(authorBody(source)),
      destinationAuthorBodySha256: sha256(authorBody(destinationBytes)),
      legacyRoute: route,
      destinationUrl:
        route === "/"
          ? "/"
          : `/${route
              .replace(/^\//, "")
              .replace(/\/$/, "")
              .split("/")
              .map((segment) =>
                segment
                  .replace(/\s/g, "-")
                  .replace(/&/g, "-and-")
                  .replace(/%/g, "-percent")
                  .replace(/[?#]/g, "")
                  .replace(/[<>:"|*]/g, "")
                  .toLowerCase(),
              )
              .join("/")}`,
      legacyAlias: legacyAlias(route),
      compatibilityAliases: compatibilityAliases[sourcePath] ?? [],
      metadataDeviation: route === "/" ? [] : ["add-route-preservation-alias"],
      evidence: "legacy-public-route-snapshot",
    })
    const markdownText = source.toString("utf8")
    for (const token of referencedAssetTokens(markdownText)) {
      const resolved = resolveAsset(sourcePath, token, assetCandidates, byBasename)
      if (resolved) assetSources.add(resolved)
      else if (!/^(?:[a-z]+:|\/\/|#)/i.test(token))
        unresolvedAssetTokens.push({ sourcePath, token })
    }
  }

  const mappedRoutes = routeEntries.map((entry) => entry.legacyRoute).sort()
  const expectedRoutes = [...snapshot.routes].sort()
  if (
    new Set(mappedRoutes).size !== 261 ||
    JSON.stringify(mappedRoutes) !== JSON.stringify(expectedRoutes)
  ) {
    throw new Error("derived route map does not exactly match the 261-route legacy snapshot")
  }
  if (unresolvedAssetTokens.length > 0) {
    throw new Error(`unresolved author asset references: ${JSON.stringify(unresolvedAssetTokens)}`)
  }

  const sortedAssetSources = [...assetSources].sort()
  const deniedEntries = denied.map((sourcePath) => ({
    sourcePath,
    exclusionReason: deniedPrefixes.find((prefix) => sourcePath.startsWith(prefix)),
  }))
  const deferredRoutes = routeEntries.map((entry) => ({
    sourcePath: entry.sourcePath,
    sourceSha256: entry.sourceSha256,
    legacyRoute: entry.legacyRoute,
    priorGeneratedDestinationPath: entry.destinationPath,
    priorGeneratedDestinationSha256: entry.destinationSha256,
    publicDestination: null,
    disposition: "deferred-private-local-review",
    laterStatus: "pending-deduplication-consolidation-rewrite",
  }))
  const routeMap = {
    schemaVersion: 1,
    legacyCommit,
    privacyBoundary: "explicit-owner-reviewed-zero-legacy-public",
    publicLegacyRouteCount: 0,
    copiedAssetCount: 0,
    deferredRouteCount: deferredRoutes.length,
    deferredReferencedAssetCount: sortedAssetSources.length,
    deniedMarkdownCount: deniedEntries.length,
    unknownCopiedCount: 0,
    routes: [],
    assets: [],
    deferredRoutes,
    hardDenyExclusions: deniedEntries,
  }
  const inventory = await readJson(inventoryPath)
  const ownerDecisions = await readJson(ownerDecisionsPath)
  const authorization = verifyLegacyExclusionAuthorization({
    legacy: routeMap,
    inventory,
    ownerDecisions,
  })
  if (!authorization.passed) {
    throw new Error(`legacy exclusion authorization failed: ${JSON.stringify(authorization)}`)
  }

  await removePriorGeneratedFiles()

  const backlog = {
    schemaVersion: 1,
    status: "deferred-private-local-review",
    sourceCommit: legacyCommit,
    publicRouteCount: 0,
    candidateCount: deferredRoutes.length,
    bodyContentIncluded: false,
    candidates: deferredRoutes,
  }
  const report = {
    schemaVersion: 1,
    status: "pass",
    sourceCommit: legacyCommit,
    ownerDecision: "exclude-all-legacy-routes-from-cutover",
    reviewedExcludeCount: authorization.reviewedExcludeCount,
    publicLegacyRouteCount: 0,
    destinationMarkdownCount: 0,
    copiedReferencedAssetCount: 0,
    removedLegacyRouteCount: routeEntries.length,
    removedLegacyOnlyAssetCount: sortedAssetSources.length,
    hardDenyExcludedCount: deniedEntries.length,
    nonSnapshotUnknownExcludedCount: 1238,
    unknownCopiedCount: 0,
    routeSnapshotMatch: true,
    deferredBacklogCount: deferredRoutes.length,
    unresolvedAssetReferenceCount: 0,
  }
  await writeFile(routeMapPath, `${JSON.stringify(routeMap, null, 2)}\n`)
  await writeFile(backlogPath, `${JSON.stringify(backlog, null, 2)}\n`)
  await writeFile(
    handoffPath,
    `# Deferred legacy content handoff\n\nThe owner excluded all ${deferredRoutes.length} legacy Obsidian routes from this cutover. Do not copy or publish their bodies or referenced assets. Use \`legacy-deferred-content-backlog.json\` to review one immutable source hash at a time, deduplicate against the public product and Tistory corpus, then create a newly reviewed rewrite or keep it excluded. No backlog entry has a public destination.\n`,
  )
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  return { routeMap, report }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { report } = await migrateLegacy()
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
}
