import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { loadAndVerifyBrandAssetManifest } from "./brand-assets.mjs"
import { loadAndVerifyHomeReference } from "./home-reference.mjs"

const quartzRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const repositoryRoot = path.resolve(quartzRoot, "../..")
const evidenceRoot = path.join(repositoryRoot, "migration/evidence/design-remediation")
const expectedLegacyCommit = "d92e3faa9deeb7a1b9406c6e36fbe8eac4a03443"

const sha256 = (value) => createHash("sha256").update(value).digest("hex")
const readJson = async (absolutePath) => JSON.parse(await readFile(absolutePath, "utf8"))

function assertBindingShape(binding, label) {
  if (!binding || typeof binding.path !== "string" || !/^[a-f0-9]{64}$/.test(binding.sha256)) {
    throw new Error(`${label}: path and sha256 binding are required`)
  }
}

async function assertBinding(binding, label) {
  assertBindingShape(binding, label)
  const bytes = await readFile(path.join(repositoryRoot, binding.path))
  if (sha256(bytes) !== binding.sha256) throw new Error(`${label}: stale content hash`)
}

async function verifyBaseline() {
  const indexPath = path.join(evidenceRoot, "legacy-baseline/index.json")
  const index = await readJson(indexPath)
  if (index.status !== "complete-local-frozen-baseline") {
    throw new Error("legacy baseline is not complete")
  }
  if (
    index.source.repositoryCommit !== expectedLegacyCommit ||
    index.source.expectedLegacyCommit !== expectedLegacyCommit ||
    index.source.userWorkingTreeReadForRender !== false ||
    index.source.snapshotTemporaryAndRemoved !== true
  ) {
    throw new Error("legacy baseline source binding is invalid or dirty")
  }
  if (
    index.matrix.expectedCellCount !== 16 ||
    index.matrix.capturedCellCount !== 16 ||
    index.matrix.missingCellIds.length !== 0 ||
    index.matrix.cells.length !== 16
  ) {
    throw new Error("legacy baseline must contain all 16 required cells")
  }
  const ids = new Set()
  for (const cell of index.matrix.cells) {
    if (ids.has(cell.id)) throw new Error(`duplicate baseline cell: ${cell.id}`)
    ids.add(cell.id)
    const bytes = await readFile(path.join(repositoryRoot, cell.screenshot.path))
    if (bytes.byteLength !== cell.screenshot.bytes || sha256(bytes) !== cell.screenshot.sha256) {
      throw new Error(`${cell.id}: screenshot bytes or hash mismatch`)
    }
    if (
      bytes.readUInt32BE(16) !== cell.viewport.width ||
      bytes.readUInt32BE(20) !== cell.viewport.height
    ) {
      throw new Error(`${cell.id}: PNG dimensions do not match the viewport`)
    }
    if (
      /^Files within\b/.test(cell.probe.title) ||
      !cell.probe.title.includes("개발자 유니의 두 번째 뇌") ||
      cell.probe.heading !== "Dev Uni" ||
      cell.probe.expectedMarkerFound !== true ||
      cell.themeApplication?.mode !== "synthetic-forced-local-storage"
    ) {
      throw new Error(`${cell.id}: capture probe is not a verified legacy page`)
    }
  }
  return index
}

async function verifyRemediationStatus() {
  const record = await readJson(path.join(evidenceRoot, "remediation-status.json"))
  if (
    record.status !== "unapproved" ||
    record.replacementGate.currentState !== "pending-owner-review"
  ) {
    throw new Error("current staged design must remain explicitly unapproved")
  }
  for (const [index, binding] of record.boundHistoricalEvidence.entries()) {
    await assertBinding(binding, `remediation historical binding ${index}`)
  }
  await assertBinding(record.currentQuartzSource, "remediation current Quartz source")
  if (record.currentQuartzSource.commitClaim !== null) {
    throw new Error("current untracked Quartz source must not claim the legacy commit")
  }
  return record
}

export async function verifyQuartzSourceScope({
  requireLiveMatch,
  scope: suppliedScope,
  readLiveFile = (bindingPath) => readFile(path.join(repositoryRoot, bindingPath)),
} = {}) {
  if (typeof requireLiveMatch !== "boolean") {
    throw new Error("current Quartz scope validation requires an explicit phase model")
  }
  const scope =
    suppliedScope ?? (await readJson(path.join(evidenceRoot, "current-quartz-source.json")))
  if (
    scope.schemaVersion !== 1 ||
    scope.kind !== "scoped-working-tree-hash-no-commit-claim" ||
    scope.repositoryCommit !== null ||
    !Array.isArray(scope.files) ||
    scope.files.length === 0 ||
    !/^[a-f0-9]{64}$/.test(scope.treeSha256)
  ) {
    throw new Error("current Quartz scope structure is invalid")
  }
  const lines = []
  const paths = new Set()
  for (const binding of scope.files) {
    assertBindingShape(binding, "current Quartz snapshot line")
    const normalizedPath = path.posix.normalize(binding.path.replaceAll("\\", "/"))
    if (
      normalizedPath !== binding.path ||
      !normalizedPath.startsWith("migration/quartz-v5/") ||
      normalizedPath.split("/").includes("..") ||
      paths.has(normalizedPath)
    ) {
      throw new Error(`current Quartz snapshot path is invalid or duplicated: ${binding.path}`)
    }
    paths.add(normalizedPath)
    lines.push(`${binding.path}\0${binding.sha256}\n`)
  }
  if (sha256(lines.join("")) !== scope.treeSha256) {
    throw new Error("current Quartz scoped tree hash mismatch")
  }
  if (requireLiveMatch) {
    for (const binding of scope.files) {
      const liveBytes = await readLiveFile(binding.path)
      if (sha256(liveBytes) !== binding.sha256) {
        throw new Error(`current Quartz ${binding.path}: stale content hash before approval`)
      }
    }
  }
  return {
    ...scope,
    validation: {
      snapshotIntegrity: "verified",
      liveSourceComparison: requireLiveMatch
        ? "required-and-matched-before-direction-approval"
        : "not-compared-after-direction-approval",
      implementationPhaseEvidence: "required-separate-exact-hash",
    },
  }
}

async function verifyDirectionApproval({ requireApproval = false } = {}) {
  const record = await readJson(path.join(evidenceRoot, "direction-approval.json"))
  if (record.legacySourceCommit !== expectedLegacyCommit) {
    throw new Error("direction approval is bound to an unexpected source commit")
  }
  await assertBinding(record.bindings.design, "direction DESIGN.md")
  await assertBinding(record.bindings.visualBrief, "direction visual brief")
  await assertBinding(record.bindings.legacyBaseline, "direction legacy baseline")
  await assertBinding(record.bindings.currentQuartzSource, "direction current Quartz source")
  await assertBinding(record.bindings.brandManifestReferenceOnly, "direction brand manifest")
  await assertBinding(record.bindings.homeReferenceCandidate, "direction Home reference")
  if (record.bindings.brandManifestReferenceOnly.authorizesAssets !== false) {
    throw new Error("direction approval must not authorize brand assets")
  }
  if (
    record.bindings.homeReferenceCandidate.authorizesDirection !== false ||
    record.bindings.homeReferenceCandidate.authorizesAssets !== false ||
    record.bindings.homeReferenceCandidate.productionUiMutation !== false
  ) {
    throw new Error("Home reference binding must remain review-only and non-production")
  }

  const approval = record.approval
  if (approval.verdict === "pending-owner-review") {
    if (
      approval.ownerIdentity !== null ||
      approval.reviewedAt !== null ||
      approval.decisionSource !== null ||
      record.implementationGate.open !== false
    ) {
      throw new Error("pending direction approval must remain fail-closed and owner-empty")
    }
    if (requireApproval) throw new Error("direction approval is still pending owner review")
    return { record, approved: false }
  }

  if (!["approve", "revise", "reject"].includes(approval.verdict)) {
    throw new Error("direction approval verdict is invalid")
  }
  for (const field of ["ownerIdentity", "reviewedAt", "decisionSource"]) {
    if (typeof approval[field] !== "string" || approval[field].trim() === "") {
      throw new Error(`direction approval is missing ${field}`)
    }
  }
  if (Number.isNaN(Date.parse(approval.reviewedAt))) {
    throw new Error("direction approval reviewedAt is not an ISO timestamp")
  }
  if (
    approval.verdict === "approve" &&
    (approval.ownerIdentity !== "site owner in active Codex thread" ||
      approval.decisionSource !== 'Owner message in active Codex thread: "이 시안 승인"')
  ) {
    throw new Error("direction approval does not match the exact owner decision evidence")
  }
  const approved = approval.verdict === "approve"
  if (record.implementationGate.open !== approved) {
    throw new Error("direction implementation gate disagrees with the owner verdict")
  }
  if (
    record.remainingGates?.brandAssets !== "pending-owner-review" ||
    record.remainingGates?.finalImplementedVisualResult !== "pending-owner-review" ||
    record.remainingGates?.deployment !== "not-authorized"
  ) {
    throw new Error("direction approval must not authorize assets, final visuals, or deployment")
  }
  if (requireApproval && !approved) throw new Error(`direction verdict is ${approval.verdict}`)
  return { record, approved }
}

export async function verifyDesignGovernance(options = {}) {
  const [baseline, remediation, direction, brandAssets, homeReference] = await Promise.all([
    verifyBaseline(),
    verifyRemediationStatus(),
    verifyDirectionApproval(options),
    loadAndVerifyBrandAssetManifest(),
    loadAndVerifyHomeReference(),
  ])
  const quartzSource = await verifyQuartzSourceScope({ requireLiveMatch: !direction.approved })
  return { baseline, remediation, direction, brandAssets, quartzSource, homeReference }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const requireApproval = process.argv.includes("--require-direction-approval")
  const result = await verifyDesignGovernance({ requireApproval })
  console.log(
    `VALID: baseline ${result.baseline.matrix.capturedCellCount}/16; Home reference ${result.homeReference.matrix.capturedCellCount}/4; direction ${result.direction.record.approval.verdict}; approved assets ${result.brandAssets.approved.length}.`,
  )
}
