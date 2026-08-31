import { readFile, readdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const quartzRoot = path.resolve(here, "../..")
const repoRoot = path.resolve(quartzRoot, "../..")
const evidenceRoot = path.join(repoRoot, "migration/evidence")
const outputRoot = path.join(quartzRoot, "public")
const origin = "https://shin-jae-yoon.github.io"

async function walk(root) {
  const results = []
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name)
    if (entry.isDirectory()) results.push(...(await walk(absolute)))
    else if (entry.isFile()) results.push(absolute)
  }
  return results.sort()
}

function candidates(target) {
  const clean = target.replace(/^\/+/, "")
  if (clean === "") return ["index.html"]
  if (clean.endsWith("/")) return [`${clean.slice(0, -1)}.html`, `${clean}index.html`]
  if (path.posix.extname(clean)) return [clean]
  return [clean, `${clean}.html`, `${clean}/index.html`]
}

function decode(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function resolveReference(raw, sourceFile) {
  if (/^(?:data|mailto|tel|javascript):/i.test(raw) || raw.startsWith("//")) return null
  const parsed = new URL(raw, `${origin}/${sourceFile}`)
  if (parsed.origin !== origin) return null
  return {
    pathname: decode(parsed.pathname).replace(/^\/+/, ""),
    fragment: decode(parsed.hash.replace(/^#/, "")),
  }
}

function htmlIds(html) {
  return new Set([...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => decode(match[1])))
}

export async function verifyMigrationOutput() {
  const legacy = JSON.parse(
    await readFile(path.join(evidenceRoot, "legacy-route-map.json"), "utf8"),
  )
  const tistory = JSON.parse(
    await readFile(path.join(evidenceRoot, "tistory-route-map.json"), "utf8"),
  )
  const files = (await walk(outputRoot)).map((absolute) =>
    path.relative(outputRoot, absolute).split(path.sep).join("/"),
  )
  const fileSet = new Set(files)
  const foldedFiles = new Map(files.map((file) => [file.toLowerCase(), file]))
  const aliasTargets = new Map()
  const deferredLegacyRoutes = new Set(
    (legacy.deferredRoutes ?? []).map((entry) => entry.legacyRoute.replace(/^\/+|\/+$/g, "")),
  )
  for (const entry of legacy.routes) {
    for (const alias of [entry.legacyAlias, ...entry.compatibilityAliases].filter(Boolean)) {
      aliasTargets.set(`${alias}.html`, entry.destinationUrl)
    }
  }

  const routeFailures = []
  for (const entry of legacy.routes) {
    if (!candidates(entry.destinationUrl).some((candidate) => fileSet.has(candidate)))
      routeFailures.push({ kind: "legacy-destination", sourcePath: entry.sourcePath })
    if (entry.legacyAlias) {
      const aliasFile = `${entry.legacyAlias}.html`
      if (!fileSet.has(aliasFile) && !foldedFiles.has(aliasFile.toLowerCase()))
        routeFailures.push({ kind: "legacy-alias", sourcePath: entry.sourcePath, aliasFile })
    }
  }
  for (const entry of tistory.routes) {
    if (!candidates(entry.destinationUrl).some((candidate) => fileSet.has(candidate)))
      routeFailures.push({ kind: "tistory-destination", postId: entry.id })
  }

  const broken = []
  const deferredLegacyReferences = []
  let internalReferenceCount = 0
  let anchorReferenceCount = 0
  let caseSensitiveAliasSimulationCount = 0
  for (const sourceFile of files.filter((file) => file.endsWith(".html"))) {
    const html = await readFile(path.join(outputRoot, sourceFile), "utf8")
    for (const match of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
      const resolved = resolveReference(match[1], sourceFile)
      if (!resolved) continue
      internalReferenceCount += 1
      const possible = candidates(resolved.pathname)
      const declaredAlias = possible.find((candidate) => aliasTargets.has(candidate))
      let targetFile = possible.find((candidate) => fileSet.has(candidate))
      let aliasTarget = declaredAlias ? aliasTargets.get(declaredAlias) : null
      if (!targetFile) {
        if (declaredAlias) {
          const physical = foldedFiles.get(declaredAlias.toLowerCase())
          if (physical) {
            targetFile = physical
            aliasTarget = aliasTargets.get(declaredAlias)
            caseSensitiveAliasSimulationCount += 1
          }
        }
      }
      if (!targetFile) {
        if (deferredLegacyRoutes.has(resolved.pathname.replace(/^\/+|\/+$/g, ""))) {
          deferredLegacyReferences.push({
            sourceFile,
            reference: match[1],
            reason: "owner-reviewed-deferred-legacy-route",
          })
          continue
        }
        broken.push({ sourceFile, reference: match[1], reason: "missing-target" })
        continue
      }
      if (resolved.fragment && !resolved.fragment.startsWith(":~:text=")) {
        anchorReferenceCount += 1
        let anchorFile = targetFile
        if (aliasTarget) {
          anchorFile = candidates(aliasTarget).find((candidate) => fileSet.has(candidate))
        }
        if (!anchorFile) {
          broken.push({ sourceFile, reference: match[1], reason: "missing-alias-destination" })
          continue
        }
        const targetHtml = await readFile(path.join(outputRoot, anchorFile), "utf8")
        if (!htmlIds(targetHtml).has(resolved.fragment))
          broken.push({
            sourceFile,
            reference: match[1],
            reason: "missing-anchor",
            anchor: resolved.fragment,
            targetFile: anchorFile,
          })
      }
    }
  }

  const passed = routeFailures.length === 0 && broken.length === 0
  const report = {
    schemaVersion: 1,
    status: passed ? "pass" : "fail",
    outputFileCount: files.length,
    publicLegacyRouteCount: legacy.routes.length,
    preservedLegacyAliasCount: legacy.routes.filter((entry) => entry.legacyAlias).length,
    compatibilityAliasCount: legacy.routes.reduce(
      (count, entry) => count + entry.compatibilityAliases.length,
      0,
    ),
    tistoryRouteCount: tistory.routes.length,
    internalReferenceCount,
    anchorReferenceCount,
    caseSensitiveAliasSimulationCount,
    routeFailureCount: routeFailures.length,
    brokenInternalReferenceCount: broken.length,
    deferredLegacyReferenceCount: deferredLegacyReferences.length,
    unresolvedInternalAssetCount: broken.filter((entry) =>
      /\.(?:png|gif|svg|webp|jpe?g)$/i.test(entry.reference),
    ).length,
    unresolvedInternalAnchorCount: broken.filter((entry) => entry.reason === "missing-anchor")
      .length,
    routeFailures,
    brokenInternalReferences: broken,
    deferredLegacyReferences,
    externalReferencePolicy:
      "External references are retained and not fetched by this offline gate.",
  }
  await writeFile(
    path.join(evidenceRoot, "migration-output-verification.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  )
  if (!passed)
    throw new Error(
      `migration output verification failed: routes=${routeFailures.length}, internal=${broken.length}`,
    )
  return report
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(await verifyMigrationOutput(), null, 2)}\n`)
}
