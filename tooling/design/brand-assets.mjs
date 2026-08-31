import { createHash } from "node:crypto"
import { lstat, readFile, realpath } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const quartzRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const repositoryRoot = path.resolve(quartzRoot, "../..")
const allowedSourceRoot = path.join(repositoryRoot, "static/images")
const allowedDestinationRoot = "quartz/static/dev-uni/"
const supportedMediaTypes = new Set(["image/png", "image/jpeg", "image/webp"])

const sha256 = (value) => createHash("sha256").update(value).digest("hex")

function assertPlainRelativePath(value, label) {
  if (typeof value !== "string" || value.length === 0 || path.isAbsolute(value)) {
    throw new Error(`${label} must be a non-empty relative path`)
  }
  const normalized = value.replaceAll("\\", "/")
  if (normalized.split("/").includes("..") || normalized.includes("\0")) {
    throw new Error(`${label} contains traversal or invalid bytes: ${value}`)
  }
  return normalized
}

function assertApproval(record) {
  const approval = record.approval
  if (
    !approval ||
    !["pending-owner-review", "approve", "defer", "reject"].includes(approval.verdict)
  ) {
    throw new Error(`${record.id}: approval.verdict is invalid`)
  }

  if (approval.verdict === "pending-owner-review") {
    for (const field of ["ownerIdentity", "reviewedAt", "decisionSource", "boundSourceSha256"]) {
      if (approval[field] !== null) {
        throw new Error(`${record.id}: pending approval must leave ${field} null`)
      }
    }
    return
  }

  for (const field of [
    "ownerIdentity",
    "reviewedAt",
    "decisionSource",
    "boundSourceSha256",
    "boundDestination",
    "ownershipAndLicenseAssertion",
  ]) {
    if (typeof approval[field] !== "string" || approval[field].trim() === "") {
      throw new Error(`${record.id}: decided approval is missing ${field}`)
    }
  }
  if (Number.isNaN(Date.parse(approval.reviewedAt))) {
    throw new Error(`${record.id}: approval reviewedAt is not an ISO timestamp`)
  }
  if (approval.boundSourceSha256 !== record.source.sha256) {
    throw new Error(`${record.id}: approval is stale for source bytes`)
  }
  if (approval.boundDestination !== record.destination.path) {
    throw new Error(`${record.id}: approval is stale for destination`)
  }
  if (approval.ownershipAndLicenseAssertion !== record.ownershipAndLicenseAssertion) {
    throw new Error(`${record.id}: approval is stale for ownership/license assertion`)
  }
  if (approval.altDecision !== record.accessibility.decision) {
    throw new Error(`${record.id}: approval is stale for the alt/decorative decision`)
  }
}

export async function verifyBrandAssetManifest(
  manifest,
  { repository = repositoryRoot, requestedSources = [] } = {},
) {
  if (manifest.schemaVersion !== 1 || manifest.policy !== "explicit-owner-review-fail-closed") {
    throw new Error("brand manifest schema or policy is unsupported")
  }
  if (!Array.isArray(manifest.assets) || manifest.assets.length === 0) {
    throw new Error("brand manifest must name at least one candidate asset")
  }

  const sourceRoot = path.join(repository, "static/images")
  const resolvedSourceRoot = await realpath(sourceRoot)
  const ids = new Set()
  const sources = new Set()
  const destinations = new Set()
  const verified = []

  for (const record of manifest.assets) {
    if (
      !record ||
      typeof record !== "object" ||
      typeof record.id !== "string" ||
      record.id === ""
    ) {
      throw new Error("every brand asset needs an id")
    }
    if (ids.has(record.id)) throw new Error(`duplicate asset id: ${record.id}`)
    ids.add(record.id)

    const sourcePath = assertPlainRelativePath(record.source?.path, `${record.id}.source.path`)
    if (!sourcePath.startsWith("static/images/")) {
      throw new Error(`${record.id}: source must be under static/images/`)
    }
    const destination = assertPlainRelativePath(
      record.destination?.path,
      `${record.id}.destination.path`,
    )
    if (!destination.startsWith(allowedDestinationRoot)) {
      throw new Error(`${record.id}: destination must be under ${allowedDestinationRoot}`)
    }
    if (sources.has(sourcePath)) throw new Error(`duplicate source: ${sourcePath}`)
    if (destinations.has(destination)) throw new Error(`duplicate destination: ${destination}`)
    sources.add(sourcePath)
    destinations.add(destination)

    if (!supportedMediaTypes.has(record.media?.type)) {
      throw new Error(`${record.id}: unsupported or active media type ${record.media?.type}`)
    }
    if (!Number.isInteger(record.media.width) || !Number.isInteger(record.media.height)) {
      throw new Error(`${record.id}: image dimensions must be positive integers`)
    }
    if (record.media.width <= 0 || record.media.height <= 0) {
      throw new Error(`${record.id}: image dimensions must be positive integers`)
    }
    if (
      !record.budget ||
      !Number.isInteger(record.budget.maxBytes) ||
      !Number.isInteger(record.budget.maxWidth) ||
      !Number.isInteger(record.budget.maxHeight)
    ) {
      throw new Error(`${record.id}: byte and dimension budgets are required`)
    }
    if (
      record.source.bytes > record.budget.maxBytes ||
      record.media.width > record.budget.maxWidth ||
      record.media.height > record.budget.maxHeight
    ) {
      throw new Error(`${record.id}: candidate exceeds its declared budget`)
    }
    if (
      record.accessibility?.decision !== "semantic" &&
      record.accessibility?.decision !== "decorative"
    ) {
      throw new Error(`${record.id}: semantic or decorative decision is required`)
    }
    if (
      record.accessibility.decision === "semantic" &&
      (typeof record.accessibility.proposedAltText !== "string" ||
        record.accessibility.proposedAltText.trim() === "")
    ) {
      throw new Error(`${record.id}: semantic media needs proposed alt text`)
    }
    assertApproval(record)

    const absoluteSource = path.join(repository, sourcePath)
    const stat = await lstat(absoluteSource)
    if (stat.isSymbolicLink()) throw new Error(`${record.id}: symlink sources are forbidden`)
    if (!stat.isFile()) throw new Error(`${record.id}: source is not a regular file`)
    const resolvedSource = await realpath(absoluteSource)
    if (!resolvedSource.startsWith(`${resolvedSourceRoot}${path.sep}`)) {
      throw new Error(`${record.id}: resolved source escapes static/images`)
    }
    const bytes = await readFile(resolvedSource)
    if (bytes.byteLength !== record.source.bytes) {
      throw new Error(`${record.id}: source byte length mismatch`)
    }
    if (sha256(bytes) !== record.source.sha256) {
      throw new Error(`${record.id}: source hash mismatch`)
    }
    verified.push({ ...record, authorizedForCopy: record.approval.verdict === "approve" })
  }

  for (const requested of requestedSources) {
    const normalized = assertPlainRelativePath(requested, "requested source")
    const record = verified.find((candidate) => candidate.source.path === normalized)
    if (!record) throw new Error(`requested asset is not listed: ${normalized}`)
    if (!record.authorizedForCopy)
      throw new Error(`requested asset is not owner-approved: ${normalized}`)
  }

  return {
    records: verified,
    approved: verified.filter((record) => record.authorizedForCopy),
    pending: verified.filter((record) => record.approval.verdict === "pending-owner-review"),
  }
}

export async function loadAndVerifyBrandAssetManifest(options = {}) {
  const manifestPath = path.join(quartzRoot, "tooling/design/brand-assets.json")
  return verifyBrandAssetManifest(JSON.parse(await readFile(manifestPath, "utf8")), options)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await loadAndVerifyBrandAssetManifest()
  console.log(
    `VALID: ${result.records.length} named candidates; ${result.approved.length} approved; ${result.pending.length} pending owner review.`,
  )
}
