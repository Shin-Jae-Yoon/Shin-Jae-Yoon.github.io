import { createHash } from "node:crypto"
import { readFile, readdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { verifyLegacyExclusionAuthorization } from "../privacy/legacy-authorization.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const quartzRoot = path.resolve(here, "../..")
const repoRoot = path.resolve(quartzRoot, "../..")
const evidenceRoot = path.join(repoRoot, "migration/evidence")
const contentRoot = path.join(quartzRoot, "content")
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex")
const relative = (absolute) => path.relative(quartzRoot, absolute).split(path.sep).join("/")

async function walk(root) {
  const results = []
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name)
    if (entry.isDirectory()) results.push(...(await walk(absolute)))
    else if (entry.isFile()) results.push(absolute)
  }
  return results.sort()
}

export async function verifyMigrationManifest() {
  const legacy = JSON.parse(
    await readFile(path.join(evidenceRoot, "legacy-route-map.json"), "utf8"),
  )
  const tistory = JSON.parse(
    await readFile(path.join(evidenceRoot, "tistory-route-map.json"), "utf8"),
  )
  const inventory = JSON.parse(await readFile(path.join(evidenceRoot, "inventory.json"), "utf8"))
  const ownerDecisions = JSON.parse(
    await readFile(path.join(quartzRoot, "tooling/privacy/owner-decisions.json"), "utf8"),
  )
  const legacyAuthorization = verifyLegacyExclusionAuthorization({
    legacy,
    inventory,
    ownerDecisions,
  })
  const expected = new Map()
  for (const entry of tistory.routes)
    expected.set(entry.destinationPath, { sha256: entry.destinationSha256, kind: "tistory-post" })

  const missing = []
  const hashMismatches = []
  for (const [destinationPath, expectation] of expected) {
    try {
      const bytes = await readFile(path.join(quartzRoot, destinationPath))
      const actual = sha256(bytes)
      if (actual !== expectation.sha256)
        hashMismatches.push({ destinationPath, expected: expectation.sha256, actual })
    } catch (error) {
      if (error.code === "ENOENT") missing.push(destinationPath)
      else throw error
    }
  }

  const allContentFiles = (await walk(contentRoot)).map(relative)
  const ownedPrefixes = ["content/brain/", "content/articles/tistory/"]
  const ownedExact = new Set(["content/project.md"])
  const actualOwned = allContentFiles.filter(
    (file) => ownedExact.has(file) || ownedPrefixes.some((prefix) => file.startsWith(prefix)),
  )
  const extras = actualOwned.filter((file) => !expected.has(file))
  const denied = allContentFiles.filter((file) => {
    const segments = file.split("/")
    return (
      segments.some((segment) => ["private", "templates", ".obsidian"].includes(segment)) ||
      path.posix.basename(file) === "Untitled.md"
    )
  })
  const excludedLegacyBodies = []
  const authorizedProductReplacements = new Set(["content/index.md", "content/about.md"])
  for (const entry of legacy.deferredRoutes) {
    if (!allContentFiles.includes(entry.priorGeneratedDestinationPath)) continue
    const bytes = await readFile(path.join(quartzRoot, entry.priorGeneratedDestinationPath))
    const actual = sha256(bytes)
    if (
      !authorizedProductReplacements.has(entry.priorGeneratedDestinationPath) ||
      actual === entry.priorGeneratedDestinationSha256
    ) {
      excludedLegacyBodies.push({
        sourcePath: entry.sourcePath,
        destinationPath: entry.priorGeneratedDestinationPath,
        actualSha256: actual,
      })
    }
  }
  const counts = {
    publicLegacyRouteCount: legacy.routes.length,
    copiedLegacyAssetCount: legacy.assets.length,
    deferredLegacyRouteCount: legacy.deferredRoutes.length,
    reviewedLegacyExcludeCount: legacyAuthorization.reviewedExcludeCount,
    legacyAuthorizationFailureCount: legacyAuthorization.failures.length,
    tistoryPostCount: tistory.routes.length,
    expectedFileCount: expected.size,
    verifiedFileCount: expected.size - missing.length - hashMismatches.length,
    missingCount: missing.length,
    hashMismatchCount: hashMismatches.length,
    ownedExtraCount: extras.length,
    deniedCopiedCount: denied.length,
    excludedLegacyBodyCount: excludedLegacyBodies.length,
    unknownCopiedCount: legacy.unknownCopiedCount,
    hardDenyExcludedCount: legacy.deniedMarkdownCount,
  }
  const passed =
    legacyAuthorization.passed &&
    counts.publicLegacyRouteCount === 0 &&
    counts.copiedLegacyAssetCount === 0 &&
    counts.deferredLegacyRouteCount === 261 &&
    counts.reviewedLegacyExcludeCount === 261 &&
    counts.tistoryPostCount === 15 &&
    counts.hardDenyExcludedCount === 53 &&
    counts.unknownCopiedCount === 0 &&
    missing.length === 0 &&
    hashMismatches.length === 0 &&
    extras.length === 0 &&
    denied.length === 0 &&
    excludedLegacyBodies.length === 0
  const report = {
    schemaVersion: 1,
    status: passed ? "pass" : "fail",
    boundary: "zero-legacy-public-plus-immutable-tistory-plus-repository-authored-product",
    ...counts,
    missing,
    hashMismatches,
    ownedExtras: extras,
    deniedCopiedPaths: denied,
    excludedLegacyBodies,
    legacyAuthorizationFailures: legacyAuthorization.failures,
    nonMigrationProductFileCount: allContentFiles.length - actualOwned.length,
    nonMigrationProductFiles: allContentFiles.filter((file) => !actualOwned.includes(file)),
  }
  await writeFile(
    path.join(evidenceRoot, "migration-gate.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  )
  if (!passed) {
    throw new Error(
      `BLOCKED: zero-legacy privacy gate failed: ${JSON.stringify({ ...counts, legacyAuthorizationFailures: legacyAuthorization.failures })}`,
    )
  }
  return report
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(await verifyMigrationManifest(), null, 2)}\n`)
}
