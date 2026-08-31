import assert from "node:assert/strict"
import test from "node:test"
import {
  classify,
  scanText,
  shouldScan,
  unresolvedRecords,
  validateOwnerDecisions,
} from "./inventory-lib.mjs"
import policy from "./policy.json" with { type: "json" }
import sentinelFixture from "./sentinels.json" with { type: "json" }

const reviewedPublish = {
  sourcePath: "content/private/forced.md",
  sourceSha256: "a".repeat(64),
  decision: "publish",
  destination: "garden/forced.md",
  reason: "fixture",
  reviewer: "owner",
  reviewedAt: "2026-07-18T00:00:00Z",
  decisionSource: "test fixture",
}

test("hard deny wins over owner publish and frontmatter", () => {
  const result = classify({
    sourcePath: "content/private/forced.md",
    sourceSha256: "a".repeat(64),
    content: "publish: true",
    policy,
    decisions: [reviewedPublish],
  })
  assert.equal(result.classification, "exclude")
  assert.equal(result.classificationRule, "hard-deny")
})

test("conflicting owner decisions fail closed", () => {
  const base = {
    sourcePath: "content/note.md",
    sourceSha256: "b".repeat(64),
    reason: "fixture",
    reviewer: "owner",
    reviewedAt: "2026-07-18T00:00:00Z",
  }
  const result = classify({
    sourcePath: "content/note.md",
    sourceSha256: "b".repeat(64),
    content: "",
    policy,
    decisions: [
      { ...base, decision: "publish", destination: "garden/note.md" },
      { ...base, decision: "exclude" },
    ],
  })
  assert.equal(result.classification, "conflicting")
  assert.equal(unresolvedRecords([result]).length, 1)
})

test("frontmatter is review-required, never direct publication", () => {
  const result = classify({
    sourcePath: "content/note.md",
    sourceSha256: "c".repeat(64),
    content: "---\npublish: true\n---",
    policy,
    decisions: [],
  })
  assert.equal(result.classification, "review-required")
})

test("unknown content blocks readiness", () => {
  const result = classify({
    sourcePath: "content/note.md",
    sourceSha256: "d".repeat(64),
    content: "plain",
    policy,
    decisions: [],
  })
  assert.equal(result.classification, "unknown")
  assert.equal(unresolvedRecords([result]).length, 1)
})

test("owner decisions require explicit reviewer, timestamp, hash, decision source, and destination", () => {
  assert.deepEqual(
    validateOwnerDecisions({
      schemaVersion: 1,
      authority: "explicit-owner-review",
      decisions: [
        {
          sourcePath: "content/note.md",
          sourceSha256: "e".repeat(64),
          decision: "exclude",
          reviewer: "owner",
          reviewedAt: "2026-07-18T00:00:00Z",
          decisionSource: "owner instruction",
          reason: "deferred",
          destination: null,
        },
      ],
    }),
    [],
  )
  assert.ok(validateOwnerDecisions({ schemaVersion: 1, decisions: [{}] }).length > 0)
})

test("owner decisions are bound to the reviewed immutable source hash", () => {
  const result = classify({
    sourcePath: "content/note.md",
    sourceSha256: "f".repeat(64),
    content: "plain",
    policy,
    decisions: [
      {
        ...reviewedPublish,
        sourcePath: "content/note.md",
        sourceSha256: "0".repeat(64),
      },
    ],
  })
  assert.equal(result.classification, "review-required")
  assert.equal(result.classificationRule, "owner-decision-version-mismatch")
})

test("redundant emitted formats and named indexes are scanned", () => {
  for (const file of [
    "index.html",
    "data.json",
    "sitemap.xml",
    "feed.rss",
    "bundle.js.map",
    "search-index.txt",
    "graph-data.bin",
  ]) {
    assert.equal(shouldScan(file, policy), true, file)
  }
})

test("every unique sentinel and denied source path is detected", () => {
  assert.equal(new Set(sentinelFixture.sentinels).size, sentinelFixture.sentinels.length)
  const deniedPaths = ["content/private/secret.md"]
  const content = `${deniedPaths[0]} ${sentinelFixture.sentinels.join(" ")}`
  const findings = scanText({
    relativePath: "search-index.json",
    content,
    deniedPaths,
    sentinels: sentinelFixture.sentinels,
  })
  assert.equal(findings.length, 1 + sentinelFixture.sentinels.length)
})
