import { createHash } from "node:crypto"
import { readFile, readdir } from "node:fs/promises"
import path from "node:path"

export const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex")

const normalized = (value) => value.split(path.sep).join("/")
const matchesAny = (value, patterns) =>
  patterns.some((pattern) => new RegExp(pattern, "im").test(value))

export async function walk(root) {
  const files = []
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name)
      if (entry.isDirectory()) await visit(absolute)
      else if (entry.isFile()) files.push(absolute)
    }
  }
  await visit(root)
  return files.sort()
}

export function validateOwnerDecisions(document) {
  const errors = []
  if (document?.schemaVersion !== 1) errors.push("schemaVersion must be 1")
  if (document?.authority !== "explicit-owner-review")
    errors.push("authority must be explicit-owner-review")
  if (!Array.isArray(document?.decisions)) return [...errors, "decisions must be an array"]

  for (const [index, decision] of document.decisions.entries()) {
    const label = `decisions[${index}]`
    if (typeof decision.sourcePath !== "string" || !decision.sourcePath.startsWith("content/"))
      errors.push(`${label}.sourcePath is invalid`)
    if (!/^[0-9a-f]{64}$/.test(decision.sourceSha256 ?? ""))
      errors.push(`${label}.sourceSha256 is invalid`)
    if (!["publish", "exclude"].includes(decision.decision))
      errors.push(`${label}.decision must be publish or exclude`)
    if (typeof decision.reviewer !== "string" || decision.reviewer.trim() === "")
      errors.push(`${label}.reviewer is required`)
    if (typeof decision.reviewedAt !== "string" || Number.isNaN(Date.parse(decision.reviewedAt)))
      errors.push(`${label}.reviewedAt must be an ISO timestamp`)
    if (typeof decision.decisionSource !== "string" || decision.decisionSource.trim() === "")
      errors.push(`${label}.decisionSource is required`)
    if (typeof decision.reason !== "string" || decision.reason.trim() === "")
      errors.push(`${label}.reason is required`)
    if (decision.decision === "publish" && typeof decision.destination !== "string")
      errors.push(`${label}.destination is required for publish`)
    if (decision.decision === "exclude" && decision.destination !== null)
      errors.push(`${label}.destination must be null for exclude`)
  }
  return errors
}

export function classify({ sourcePath, sourceSha256, content, policy, decisions = [] }) {
  const pathSegments = normalized(sourcePath).split("/")
  const basename = path.posix.basename(normalized(sourcePath))
  const extension = path.posix.extname(basename).toLowerCase()
  const signals = []

  const deniedPath = pathSegments.some((segment) => policy.hardDenyPathSegments.includes(segment))
  const deniedName = policy.hardDenyBasenames.includes(basename)
  const deniedExtension = policy.hardDenyExtensions.includes(extension)
  const deniedTemporary = matchesAny(normalized(sourcePath), policy.temporaryPatterns)
  const deniedSecret = matchesAny(content, policy.secretPatterns)
  if (deniedPath) signals.push("hard-deny:path-segment")
  if (deniedName) signals.push("hard-deny:basename")
  if (deniedExtension) signals.push("hard-deny:extension")
  if (deniedTemporary) signals.push("hard-deny:temporary")
  if (deniedSecret) signals.push("hard-deny:secret-pattern")

  // Precedence 1: hard deny is absolute and cannot be overridden.
  if (signals.length > 0) {
    return {
      evidenceSignals: signals,
      classification: "exclude",
      classificationRule: "hard-deny",
      classificationReason: "A hard-deny path, artifact, temporary, or secret rule matched.",
      reviewStatus: "not-required",
      reviewer: null,
      reviewedAt: null,
      destination: null,
      exclusionReason: signals.join(", "),
    }
  }

  const pathDecisions = decisions.filter(
    (decision) => decision.sourcePath === normalized(sourcePath),
  )
  const matchingDecisions = pathDecisions.filter(
    (decision) => decision.sourceSha256 === sourceSha256,
  )
  const decisionValues = new Set(matchingDecisions.map((decision) => decision.decision))
  // Precedence 2: exactly one owner-reviewed decision controls non-denied content.
  if (decisionValues.size > 1) {
    return {
      evidenceSignals: ["owner-decision:conflict"],
      classification: "conflicting",
      classificationRule: "owner-decision-conflict",
      classificationReason: "Multiple owner decisions disagree.",
      reviewStatus: "blocked",
      reviewer: null,
      reviewedAt: null,
      destination: null,
      exclusionReason: null,
    }
  }
  if (matchingDecisions.length === 1) {
    const decision = matchingDecisions[0]
    return {
      evidenceSignals: [`owner-decision:${decision.decision}`],
      classification: decision.decision,
      classificationRule: "owner-reviewed-decision",
      classificationReason: decision.reason,
      reviewStatus: "reviewed",
      reviewer: decision.reviewer,
      reviewedAt: decision.reviewedAt,
      destination: decision.decision === "publish" ? decision.destination : null,
      exclusionReason: decision.decision === "exclude" ? decision.reason : null,
    }
  }

  if (pathDecisions.length > 0) {
    return {
      evidenceSignals: ["owner-decision:source-hash-mismatch"],
      classification: "review-required",
      classificationRule: "owner-decision-version-mismatch",
      classificationReason: "The reviewed decision applies to a different immutable source hash.",
      reviewStatus: "pending-owner-review",
      reviewer: null,
      reviewedAt: null,
      destination: null,
      exclusionReason: null,
    }
  }

  // Precedence 3: source frontmatter can request review but never publish directly.
  if (matchesAny(content, policy.publishFrontmatterPatterns)) {
    return {
      evidenceSignals: ["frontmatter:publish-signal"],
      classification: "review-required",
      classificationRule: "frontmatter-review-only",
      classificationReason: "Publish-like frontmatter requires an explicit owner decision.",
      reviewStatus: "pending-owner-review",
      reviewer: null,
      reviewedAt: null,
      destination: null,
      exclusionReason: null,
    }
  }

  // Precedence 4/5: legacy presence is discovery evidence only; default is unknown.
  return {
    evidenceSignals: ["legacy-corpus:present"],
    classification: "unknown",
    classificationRule: "fail-closed-default",
    classificationReason: "No hard deny or explicit owner-reviewed decision exists.",
    reviewStatus: "pending-owner-review",
    reviewer: null,
    reviewedAt: null,
    destination: null,
    exclusionReason: null,
  }
}

export function unresolvedRecords(records) {
  return records.filter((record) =>
    ["unknown", "conflicting", "review-required"].includes(record.classification),
  )
}

export function shouldScan(relativePath, policy) {
  const normalizedPath = normalized(relativePath).toLowerCase()
  const extension = path.posix.extname(normalizedPath)
  return (
    policy.emittedExtensions.includes(extension) ||
    policy.emittedNamePatterns.some((fragment) => normalizedPath.includes(fragment))
  )
}

export function scanText({ relativePath, content, deniedPaths, sentinels }) {
  const findings = []
  for (const deniedPath of deniedPaths) {
    if (content.includes(deniedPath))
      findings.push({ relativePath, kind: "denied-path", match: deniedPath })
  }
  for (const sentinel of sentinels) {
    if (content.includes(sentinel))
      findings.push({ relativePath, kind: "sentinel", match: sentinel })
  }
  return findings
}

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"))
}
