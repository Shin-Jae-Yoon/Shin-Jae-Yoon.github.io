import { validateOwnerDecisions } from "./inventory-lib.mjs"

const key = (sourcePath, sourceSha256) => `${sourcePath}\0${sourceSha256}`

export function verifyLegacyExclusionAuthorization({ legacy, inventory, ownerDecisions }) {
  const schemaErrors = validateOwnerDecisions(ownerDecisions)
  const inventoryByVersion = new Map(
    (inventory.records ?? []).map((record) => [key(record.sourcePath, record.sha256), record]),
  )
  const decisionsByVersion = new Map()
  for (const decision of ownerDecisions.decisions ?? []) {
    const decisionKey = key(decision.sourcePath, decision.sourceSha256)
    decisionsByVersion.set(decisionKey, [...(decisionsByVersion.get(decisionKey) ?? []), decision])
  }

  const failures = schemaErrors.map((reason) => ({ kind: "owner-decision-schema", reason }))
  let reviewedExcludeCount = 0
  for (const candidate of legacy.deferredRoutes ?? []) {
    const candidateKey = key(candidate.sourcePath, candidate.sourceSha256)
    const record = inventoryByVersion.get(candidateKey)
    const decisions = decisionsByVersion.get(candidateKey) ?? []
    if (!record) {
      failures.push({ kind: "inventory-record-missing", sourcePath: candidate.sourcePath })
      continue
    }
    if (decisions.length !== 1) {
      failures.push({
        kind: decisions.length === 0 ? "owner-decision-missing" : "owner-decision-conflict",
        sourcePath: candidate.sourcePath,
      })
      continue
    }
    const decision = decisions[0]
    const reasons = []
    if (decision.decision !== "exclude") reasons.push("decision-is-not-exclude")
    if (decision.destination !== null) reasons.push("exclude-has-public-destination")
    if (decision.legacyRoute !== candidate.legacyRoute) reasons.push("legacy-route-mismatch")
    if (record.classification !== "exclude") reasons.push("inventory-is-not-exclude")
    if (record.reviewStatus !== "reviewed") reasons.push("inventory-is-not-reviewed")
    if (record.reviewer !== decision.reviewer) reasons.push("reviewer-mismatch")
    if (record.reviewedAt !== decision.reviewedAt) reasons.push("review-timestamp-mismatch")
    if (record.destination !== null) reasons.push("inventory-has-public-destination")
    if (reasons.length > 0) {
      failures.push({
        kind: "exclusion-binding-invalid",
        sourcePath: candidate.sourcePath,
        reasons,
      })
      continue
    }
    reviewedExcludeCount += 1
  }

  const copiedLegacyRecords = [...(legacy.routes ?? []), ...(legacy.assets ?? [])]
  for (const copied of copiedLegacyRecords) {
    const record = inventoryByVersion.get(key(copied.sourcePath, copied.sourceSha256))
    failures.push({
      kind: "legacy-record-copied-despite-zero-public-boundary",
      sourcePath: copied.sourcePath,
      inventoryClassification: record?.classification ?? "missing",
      inventoryReviewStatus: record?.reviewStatus ?? "missing",
    })
  }

  return {
    candidateCount: (legacy.deferredRoutes ?? []).length,
    reviewedExcludeCount,
    copiedLegacyRecordCount: copiedLegacyRecords.length,
    failures,
    passed:
      (legacy.deferredRoutes ?? []).length === 261 &&
      reviewedExcludeCount === 261 &&
      copiedLegacyRecords.length === 0 &&
      failures.length === 0,
  }
}
