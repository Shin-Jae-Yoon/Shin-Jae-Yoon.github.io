import { readFile, mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  classify,
  readJson,
  sha256,
  unresolvedRecords,
  validateOwnerDecisions,
  walk,
} from "./inventory-lib.mjs"

const toolingDir = path.dirname(fileURLToPath(import.meta.url))
const quartzRoot = path.resolve(toolingDir, "../..")
const repositoryRoot = process.env.INVENTORY_SOURCE_ROOT
  ? path.resolve(process.env.INVENTORY_SOURCE_ROOT)
  : path.resolve(quartzRoot, "../..")
const evidenceRepositoryRoot = path.resolve(quartzRoot, "../..")
const evidenceDir = path.resolve(evidenceRepositoryRoot, "migration/evidence")
const policy = await readJson(path.join(toolingDir, "policy.json"))
const ownerDecisions = await readJson(path.join(toolingDir, "owner-decisions.json"))
const decisionErrors = validateOwnerDecisions(ownerDecisions)
if (decisionErrors.length > 0) {
  throw new Error(`invalid owner decisions: ${decisionErrors.join("; ")}`)
}
const { decisions } = ownerDecisions
const candidates = []

for (const sourceRoot of policy.sourceRoots) {
  const absoluteRoot = path.join(repositoryRoot, sourceRoot)
  for (const absolutePath of await walk(absoluteRoot)) {
    candidates.push(absolutePath)
  }
}

const records = []
const concurrency = 32
for (let offset = 0; offset < candidates.length; offset += concurrency) {
  const batch = candidates.slice(offset, offset + concurrency)
  records.push(
    ...(await Promise.all(
      batch.map(async (absolutePath) => {
        const sourcePath = path.relative(repositoryRoot, absolutePath).split(path.sep).join("/")
        const bytes = await readFile(absolutePath)
        const content = bytes.toString("utf8")
        const sourceSha256 = sha256(bytes)
        return {
          sourcePath,
          sha256: sourceSha256,
          ...classify({ sourcePath, sourceSha256, content, policy, decisions }),
        }
      }),
    )),
  )
}

// Preserve reviewed historical exclusions as distinct immutable inventory versions.
// This never creates publish authorization for bytes that were not scanned.
const inventoryVersions = new Set(records.map((record) => `${record.sourcePath}\0${record.sha256}`))
for (const decision of decisions) {
  const key = `${decision.sourcePath}\0${decision.sourceSha256}`
  if (decision.decision !== "exclude" || inventoryVersions.has(key)) continue
  records.push({
    sourcePath: decision.sourcePath,
    sha256: decision.sourceSha256,
    evidenceSignals: ["owner-decision:exclude", "historical-source-version"],
    classification: "exclude",
    classificationRule: "owner-reviewed-decision",
    classificationReason: decision.reason,
    reviewStatus: "reviewed",
    reviewer: decision.reviewer,
    reviewedAt: decision.reviewedAt,
    destination: null,
    exclusionReason: decision.reason,
  })
}
records.sort((left, right) =>
  `${left.sourcePath}\0${left.sha256}`.localeCompare(`${right.sourcePath}\0${right.sha256}`),
)

const counts = Object.fromEntries(
  [...new Set(records.map((record) => record.classification))]
    .sort()
    .map((classification) => [
      classification,
      records.filter((record) => record.classification === classification).length,
    ]),
)
const unresolved = unresolvedRecords(records)
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceSnapshot: process.env.INVENTORY_SOURCE_SNAPSHOT ?? "working-tree",
  sourceRoots: policy.sourceRoots,
  precedence: [
    "hard-deny",
    "owner-reviewed-decision",
    "frontmatter-review-only",
    "legacy-evidence-only",
    "fail-closed-default",
  ],
  recordCount: records.length,
  counts,
  unresolvedCount: unresolved.length,
  readyForFullCorpusCopyOrBuild: unresolved.length === 0,
  records,
}
await mkdir(evidenceDir, { recursive: true })
await writeFile(path.join(evidenceDir, "inventory.json"), `${JSON.stringify(report, null, 2)}\n`)
await writeFile(
  path.join(evidenceDir, "inventory-summary.json"),
  `${JSON.stringify({ ...report, records: undefined, unresolvedSourcePaths: unresolved.map((record) => record.sourcePath) }, null, 2)}\n`,
)
console.log(
  JSON.stringify({
    recordCount: records.length,
    counts,
    unresolvedCount: unresolved.length,
    ready: report.readyForFullCorpusCopyOrBuild,
  }),
)
