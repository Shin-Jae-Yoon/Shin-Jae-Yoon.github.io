import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import {
  applyKnowledge,
  proposeKnowledge,
  rollbackKnowledgeApply,
  sampleKnowledgeBatch,
  verifyKnowledgeRun,
} from "./knowledge.mjs"
import { sha256, toPosix, walkFiles } from "./lib.mjs"

const KNOWLEDGE = "content/brain/knowledge"
const RUN = ".omx/artifacts/brain-restructure/batch"
const REVIEWER = "신재윤"
const SIGNED_AT = "2026-08-13T00:00:00Z"

async function hashes(root, relativeRoot) {
  const absoluteRoot = path.join(root, relativeRoot)
  const files = await walkFiles(absoluteRoot, () => true)
  const output = []
  for (const absolute of files) {
    output.push({
      path: toPosix(path.relative(absoluteRoot, absolute)),
      sha256: sha256(await readFile(absolute)),
    })
  }
  return output
}

async function exists(absolute) {
  try {
    await stat(absolute)
    return true
  } catch (error) {
    if (error.code === "ENOENT") return false
    throw error
  }
}

async function readJson(absolute) {
  return JSON.parse(await readFile(absolute, "utf8"))
}

async function writeJson(absolute, value) {
  await mkdir(path.dirname(absolute), { recursive: true })
  await writeFile(absolute, `${JSON.stringify(value, null, 2)}\n`)
}

// Twelve engine-contract candidates over one synthetic raw source. Two carry review
// flags so the mandatory half of the §5.1 sample rule has something to select, and the
// related-concept chain stops before `batch-11` so exactly one leaf can be rejected
// without orphaning an approved link.
async function batchFixture(context) {
  const root = await mkdtemp(path.join(os.tmpdir(), "brain-batch-"))
  context.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(path.join(root, KNOWLEDGE), { recursive: true })
  await mkdir(path.join(root, "content/brain/books"), { recursive: true })
  await mkdir(path.join(root, "tooling/brain/fixtures"), { recursive: true })
  await writeFile(path.join(root, KNOWLEDGE, "index.md"), "---\ntitle: Knowledge\n---\n")
  const raw = "# Batch\n\nSource-backed batch assertion.\n"
  const sourcePath = "content/brain/books/batch.md"
  await writeFile(path.join(root, sourcePath), raw)
  const candidates = Array.from({ length: 12 }, (_, index) => ({
    concept_id: `domain.batch-${index}`,
    title: `Batch Concept ${index}`,
    aliases: [`Batch Alias ${index}`],
    canonical_path: `${KNOWLEDGE}/domain/batch-${index}.md`,
    tags: ["domain"],
    proposal_kind: index === 0 ? "stub" : index === 1 ? "merge" : "create",
    concept_granularity: "one batch fixture assertion",
    pilot_strata: ["fixture"],
    review_flags: index === 3 ? ["conflict"] : index === 7 ? ["low-confidence"] : [],
    related_concepts: index < 10 ? [`domain.batch-${index + 1}`] : [],
    locators: [
      {
        path: sourcePath,
        source_sha256: sha256(raw),
        heading: "# Batch",
        start_line: 1,
        end_line: 3,
      },
    ],
  }))
  const batch = {
    schema_version: 1,
    batch_id: "fixture-batch",
    scope: [sourcePath],
    candidates,
    rejected_candidates: [
      {
        concept_id: "domain.batch-rejected",
        title: "Batch Rejected",
        reason_code: "insufficient-source-evidence",
        reason: "fixture rejection",
        sources: [{ path: sourcePath, source_sha256: sha256(raw) }],
      },
    ],
  }
  const batchPath = "tooling/brain/fixtures/batch.json"
  await writeFile(path.join(root, batchPath), `${JSON.stringify(batch, null, 2)}\n`)
  return { root, run: RUN, batchPath, sourcePath, raw }
}

function reviewFor(manifest, manifestSha256, decisions = {}) {
  const proposals = manifest.proposals.map((proposal) => {
    const decision = decisions[proposal.concept_id] ?? "approve"
    return {
      concept_id: proposal.concept_id,
      proposal_sha256: proposal.proposal_sha256,
      decision,
      critical_issues: [],
      reviewer: decision === "pending" ? null : REVIEWER,
      reviewed_at: decision === "pending" ? null : SIGNED_AT,
    }
  })
  return {
    schema_version: 1,
    gate: "U3",
    batch_id: manifest.batch_id,
    proposal_manifest_sha256: manifestSha256,
    status: "approved",
    signed: true,
    reviewer: REVIEWER,
    signed_at: SIGNED_AT,
    critical_issue_count: 0,
    reviewed_proposal_count: proposals.filter((entry) => entry.decision !== "pending").length,
    total_proposal_count: proposals.length,
    proposals,
  }
}

async function proposedBatch(context, decisions = {}) {
  const fixture = await batchFixture(context)
  const { root, run, batchPath } = fixture
  await proposeKnowledge({ root, run, batchPath })
  const runAbsolute = path.join(root, run)
  const manifestBytes = await readFile(path.join(runAbsolute, "proposal-manifest.json"), "utf8")
  const manifest = JSON.parse(manifestBytes)
  const sample = await sampleKnowledgeBatch({ root, run })
  const approvedPath = `${run}/approved-review.json`
  const review = reviewFor(manifest, sha256(manifestBytes), decisions)
  await writeJson(path.join(root, approvedPath), review)
  return {
    ...fixture,
    runAbsolute,
    manifest,
    manifestSha256: sha256(manifestBytes),
    sample,
    review,
    approvedPath,
  }
}

async function assertZeroWrite(root, run, knowledgeBefore) {
  assert.deepEqual(await hashes(root, KNOWLEDGE), knowledgeBefore)
  assert.equal(await exists(path.join(root, run, "journal.jsonl")), false)
}

// A completed-run refusal writes nothing at all: not the approved tree, and not the run's
// own artifacts. `verify` legitimately rewrites its reports, so only the re-entry paths are
// measured this way.
async function assertNoWriteAnywhere(root, run, knowledgeBefore, runBefore, label) {
  assert.deepEqual(await hashes(root, KNOWLEDGE), knowledgeBefore, label)
  assert.deepEqual(await hashes(root, run), runBefore, label)
}

function journalLines(source) {
  return source
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line))
}

function journalText(records) {
  return `${records.map((record) => JSON.stringify(record)).join("\n")}\n`
}

test("batch propose is deterministic, leaves approved content untouched, and scaffolds an unsigned U3 review", async (context) => {
  const { root, run, batchPath } = await batchFixture(context)
  const knowledgeBefore = await hashes(root, KNOWLEDGE)
  await proposeKnowledge({ root, run, batchPath })
  const first = await hashes(root, run)
  await proposeKnowledge({ root, run, batchPath })
  assert.deepEqual(await hashes(root, run), first)
  assert.deepEqual(await hashes(root, KNOWLEDGE), knowledgeBefore)

  const runAbsolute = path.join(root, run)
  const manifest = await readJson(path.join(runAbsolute, "proposal-manifest.json"))
  assert.equal(manifest.phase, 5)
  assert.equal(manifest.mode, "batch")
  assert.equal(manifest.review_gate, "U3")
  assert.equal(manifest.batch_id, "fixture-batch")
  assert.equal(manifest.accepted_count, 12)
  assert.equal(manifest.rejected_count, 1)
  for (const proposal of manifest.proposals) {
    assert.equal(proposal.target_exists, false)
    assert.equal(proposal.target_before_sha256, null)
    assert.match(proposal.applied_sha256, /^[a-f0-9]{64}$/)
    assert.notEqual(proposal.applied_sha256, proposal.proposal_sha256)
  }

  const review = await readJson(path.join(runAbsolute, "batch-review.json"))
  assert.equal(review.gate, "U3")
  assert.equal(review.signed, false)
  assert.equal(review.status, "awaiting_user_review")
  assert.equal(review.batch_id, "fixture-batch")
  assert.equal(
    review.proposal_manifest_sha256,
    sha256(await readFile(path.join(runAbsolute, "proposal-manifest.json"), "utf8")),
  )
  assert.deepEqual(
    review.proposals.map((entry) => entry.decision),
    Array.from({ length: 12 }, () => "pending"),
  )

  const report = await verifyKnowledgeRun({ root, run })
  assert.equal(report.status, "pass")
  assert.equal(report.mode, "batch")
  assert.equal(report.applied, false)
  assert.equal(report.provenance_coverage_percent, 100)
  assert.equal(report.collision_count, 0)
})

test("batch sample is deterministic, reviews every flagged proposal, and covers each present category", async (context) => {
  const { root, run, batchPath } = await batchFixture(context)
  await proposeKnowledge({ root, run, batchPath })
  const first = await sampleKnowledgeBatch({ root, run })
  const second = await sampleKnowledgeBatch({ root, run })
  assert.deepEqual(second, first)
  assert.equal(
    first.proposal_manifest_sha256,
    sha256(await readFile(path.join(root, run, "proposal-manifest.json"), "utf8")),
  )

  const mandatory = first.selected.filter((entry) => entry.mandatory)
  assert.deepEqual(mandatory.map((entry) => entry.concept_id).sort(), [
    "domain.batch-3",
    "domain.batch-7",
  ])
  assert.equal(first.mandatory_count, 2)
  // 10 discretionary candidates -> max(5, ceil(10 * 0.1)) = 5.
  assert.equal(first.discretionary_quota, 5)
  const discretionary = first.selected.filter((entry) => !entry.mandatory)
  assert.ok(discretionary.length >= 5)
  const covered = new Set(discretionary.map((entry) => entry.proposal_kind))
  for (const kind of ["create", "merge", "stub"]) assert.ok(covered.has(kind), `missing ${kind}`)
  assert.equal(first.selected.length + first.not_selected.length, first.total_proposal_count)

  // Seeded by the baseline knowledge-tree hash: a different baseline reshuffles the draw.
  const other = await batchFixture(context)
  await writeFile(
    path.join(other.root, KNOWLEDGE, "index.md"),
    "---\ntitle: Knowledge\n---\n\nBaseline shifted.\n",
  )
  await proposeKnowledge({ root: other.root, run: other.run, batchPath: other.batchPath })
  const reseeded = await sampleKnowledgeBatch({ root: other.root, run: other.run })
  assert.notEqual(reseeded.seed, first.seed)
})

test("batch apply gates on a signed, hash-bound, fully-sampled review and never writes on refusal", async (context) => {
  const { root, run, batchPath } = await batchFixture(context)
  await proposeKnowledge({ root, run, batchPath })
  const runAbsolute = path.join(root, run)
  const knowledgeBefore = await hashes(root, KNOWLEDGE)
  const manifestBytes = await readFile(path.join(runAbsolute, "proposal-manifest.json"), "utf8")
  const manifest = JSON.parse(manifestBytes)
  const manifestSha256 = sha256(manifestBytes)
  const approvedPath = `${run}/approved-review.json`
  const approvedAbsolute = path.join(root, approvedPath)

  await writeJson(approvedAbsolute, reviewFor(manifest, manifestSha256))
  await assert.rejects(applyKnowledge({ root, run, approvedPath }), /sample\.json is missing/)
  await assertZeroWrite(root, run, knowledgeBefore)

  await sampleKnowledgeBatch({ root, run })

  await assert.rejects(applyKnowledge({ root, run }), /requires --approved/)
  await assertZeroWrite(root, run, knowledgeBefore)

  for (const [label, mutate, pattern] of [
    ["unsigned", (review) => ({ ...review, signed: false }), /batch review is unsigned/],
    [
      "critical issue",
      (review) => ({ ...review, critical_issue_count: 1 }),
      /batch review is unsigned/,
    ],
    ["no reviewer", (review) => ({ ...review, reviewer: "  " }), /batch review is unsigned/],
    ["wrong batch", (review) => ({ ...review, batch_id: "other-batch" }), /batch identity differs/],
    [
      "stale manifest hash",
      (review) => ({ ...review, proposal_manifest_sha256: sha256("stale") }),
      /proposal manifest hash differs/,
    ],
    [
      "stale proposal hash",
      (review) => ({
        ...review,
        proposals: review.proposals.map((entry, index) =>
          index === 0 ? { ...entry, proposal_sha256: sha256("stale") } : entry,
        ),
      }),
      /reviewed proposal hash differs/,
    ],
  ]) {
    await writeJson(approvedAbsolute, mutate(reviewFor(manifest, manifestSha256)))
    await assert.rejects(applyKnowledge({ root, run, approvedPath }), pattern, label)
    await assertZeroWrite(root, run, knowledgeBefore)
  }

  // A sampled proposal left undecided blocks the whole batch: the U3 sample is the gate.
  const sample = await readJson(path.join(runAbsolute, "sample.json"))
  const sampled = sample.selected[0].concept_id
  await writeJson(approvedAbsolute, reviewFor(manifest, manifestSha256, { [sampled]: "pending" }))
  await assert.rejects(applyKnowledge({ root, run, approvedPath }), /is unreviewed/)
  await assertZeroWrite(root, run, knowledgeBefore)

  // Nothing approved at all is a refusal, not an empty success.
  await writeJson(
    approvedAbsolute,
    reviewFor(
      manifest,
      manifestSha256,
      Object.fromEntries(manifest.proposals.map((entry) => [entry.concept_id, "reject"])),
    ),
  )
  await assert.rejects(applyKnowledge({ root, run, approvedPath }), /no approved proposals/)
  await assertZeroWrite(root, run, knowledgeBefore)
})

test("batch apply fails closed with zero writes when a locked source drifts", async (context) => {
  const { root, run, approvedPath, sourcePath, raw } = await proposedBatch(context)
  const knowledgeBefore = await hashes(root, KNOWLEDGE)
  await writeFile(path.join(root, sourcePath), `${raw}drift\n`)
  await assert.rejects(applyKnowledge({ root, run, approvedPath }), /source drift/)
  await assertZeroWrite(root, run, knowledgeBefore)
})

test("batch apply fails closed with zero writes when approved knowledge content drifts after propose", async (context) => {
  const { root, run, approvedPath } = await proposedBatch(context)
  await writeFile(
    path.join(root, KNOWLEDGE, "index.md"),
    "---\ntitle: Knowledge\n---\n\nDrifted after propose.\n",
  )
  const knowledgeBefore = await hashes(root, KNOWLEDGE)
  await assert.rejects(
    applyKnowledge({ root, run, approvedPath }),
    /approved knowledge content changed/,
  )
  await assertZeroWrite(root, run, knowledgeBefore)
})

test("batch apply names the exact target when a canonical path appears after propose", async (context) => {
  const { root, run, approvedPath } = await proposedBatch(context)
  const squatter = path.join(root, KNOWLEDGE, "domain/batch-4.md")
  await mkdir(path.dirname(squatter), { recursive: true })
  await writeFile(squatter, "---\ntitle: Hand written\n---\n")
  const knowledgeBefore = await hashes(root, KNOWLEDGE)
  await assert.rejects(
    applyKnowledge({ root, run, approvedPath }),
    /target drift for content\/brain\/knowledge\/domain\/batch-4\.md \(expected no document\)/,
  )
  await assertZeroWrite(root, run, knowledgeBefore)
})

test("batch apply refuses when an approved proposal links to an unapproved concept", async (context) => {
  const { root, run, approvedPath } = await proposedBatch(context, { "domain.batch-5": "reject" })
  const knowledgeBefore = await hashes(root, KNOWLEDGE)
  await assert.rejects(
    applyKnowledge({ root, run, approvedPath }),
    /links to unapproved concept domain\.batch-5/,
  )
  await assertZeroWrite(root, run, knowledgeBefore)
})

for (const fault of [
  { label: "after intent", faults: { faultAfterIntentOperations: 3 } },
  { label: "after mutation", faults: { faultAfterMutationOperations: 4 } },
]) {
  test(`interrupted batch apply ${fault.label} rolls back byte-exact from its journal`, async (context) => {
    const { root, run, runAbsolute, approvedPath } = await proposedBatch(context)
    const knowledgeBefore = await hashes(root, KNOWLEDGE)
    await assert.rejects(
      applyKnowledge({ root, run, approvedPath, ...fault.faults }),
      /injected apply interruption/,
    )

    // The journal and the before snapshot both survive the interruption.
    const journal = (await readFile(path.join(runAbsolute, "journal.jsonl"), "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line))
    assert.ok(journal.some((entry) => entry.state === "intent"))
    assert.equal(
      journal.some((entry) => entry.state === "apply-completed"),
      false,
    )
    const before = await readJson(path.join(runAbsolute, "before-manifest.json"))
    assert.equal(before.knowledge_tree_sha256.length, 64)
    assert.equal(await exists(path.join(runAbsolute, "apply-report.json")), false)

    // Re-applying over an interrupted journal is refused; rollback is the only way out.
    await assert.rejects(applyKnowledge({ root, run, approvedPath }), /interrupted apply/)

    const rollback = await rollbackKnowledgeApply({ root, run })
    assert.equal(rollback.status, "pass")
    assert.deepEqual(await hashes(root, KNOWLEDGE), knowledgeBefore)
    assert.equal(rollback.restored_knowledge_tree_sha256, before.knowledge_tree_sha256)
  })
}

// Mirrors the patched Quartz content-index emitter over an applied knowledge tree: rendered
// body text plus the search-only `knowledgeAliases` identity metadata, and nothing else.
async function renderedIndexFor(root, manifest, appliedIds) {
  const contentIndex = {}
  for (const proposal of manifest.proposals) {
    if (!appliedIds.has(proposal.concept_id)) continue
    const slug = proposal.canonical_path.replace(/^content\//, "").replace(/\.md$/, "")
    const markdown = await readFile(path.join(root, proposal.canonical_path), "utf8")
    const [, frontmatter, body] = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
    const aliases = [...frontmatter.matchAll(/^ {2}- (.*)$/gm)].map((match) => match[1])
    contentIndex[slug] = {
      slug,
      title: frontmatter.match(/^title: (.*)$/m)[1],
      links: [],
      tags: [],
      content: body.replace(/<!--[\s\S]*?-->/g, "").replace(/^[-#]\s*/gm, ""),
      ...(aliases.length > 0 ? { knowledgeAliases: aliases } : {}),
    }
  }
  return contentIndex
}

async function writeStagePublic(runAbsolute, contentIndex) {
  const stagePublic = path.join(runAbsolute, "stage-public")
  await writeJson(path.join(stagePublic, "static/contentIndex.json"), contentIndex)
  return stagePublic
}

// The Batch 04 verifier blind spot: an alias whose text is present in its own rendered body —
// so the body-presence count reads a clean 77/77 — while a *different* knowledge document
// wins rank 0 for that alias. Completed-state verification has to measure resolution across
// the whole knowledge corpus, not body presence, or it reports PASS on a broken search index.
test("completed batch evidence fails an alias that is present in the body but not rank 0", async (context) => {
  const { root, run, runAbsolute, manifest, approvedPath } = await proposedBatch(context, {
    "domain.batch-11": "reject",
  })
  await applyKnowledge({ root, run, approvedPath })
  const appliedIds = new Set(
    manifest.proposals
      .map((proposal) => proposal.concept_id)
      .filter((conceptId) => conceptId !== "domain.batch-11"),
  )

  // A rendered build that reproduces the failure: the alias text is in the canonical body,
  // but an older knowledge document mentioning the same words is indexed first and the
  // canonical document carries no alias identity metadata.
  const contested = await renderedIndexFor(root, manifest, appliedIds)
  const canonical = "brain/knowledge/domain/batch-5"
  const broken = {
    "brain/knowledge/domain/decoy": {
      slug: "brain/knowledge/domain/decoy",
      title: "Decoy Concept",
      links: [],
      tags: [],
      content: "Batch Alias 5 also appears verbatim in this older knowledge document.",
    },
    ...contested,
    [canonical]: { ...contested[canonical], knowledgeAliases: undefined },
  }
  await writeStagePublic(runAbsolute, broken)

  await assert.rejects(verifyKnowledgeRun({ root, run }), /alias-search-does-not-resolve/)
  const failed = await readJson(path.join(runAbsolute, "alias-policy-report.json"))
  assert.equal(failed.status, "fail")
  assert.equal(failed.alias_search_scan.measured, true)
  assert.equal(failed.alias_search_scan.source, "rendered-build")
  // Body presence still reads clean — which is precisely why it can never be the gate.
  assert.equal(failed.searchable_alias_count, failed.alias_count)
  assert.ok(
    failed.violations.some(
      (violation) =>
        violation.kind === "alias-search-does-not-resolve" && violation.alias === "Batch Alias 5",
    ),
  )
  assert.ok(
    failed.violations.some((violation) => violation.kind === "alias-metadata-not-indexed"),
    "missing alias identity metadata is a violation in its own right",
  )

  // Restoring the alias identity metadata is what makes the same contested corpus resolve.
  await writeStagePublic(runAbsolute, { ...broken, [canonical]: contested[canonical] })
  const repaired = await verifyKnowledgeRun({ root, run })
  assert.equal(repaired.status, "pass")
  assert.equal(repaired.alias_search_evidence, "rendered-build")
  assert.equal(repaired.resolved_alias_search_count, repaired.alias_count)
  assert.equal(repaired.public_alias_route_count, 0)
})

// Without a rendered build the completed run still measures resolution, against the
// equivalent full-corpus index over the approved knowledge tree. It never falls back to
// body presence, so `alias_search_evidence` is never "absent" for a completed batch.
test("completed batch evidence measures alias search without a rendered build", async (context) => {
  const { root, run, approvedPath } = await proposedBatch(context, {
    "domain.batch-11": "reject",
  })
  await applyKnowledge({ root, run, approvedPath })

  const verification = await verifyKnowledgeRun({ root, run })
  assert.equal(verification.status, "pass")
  assert.equal(verification.alias_search_evidence, "approved-corpus")
  assert.equal(verification.resolved_alias_search_count, verification.alias_count)
  // The corpus is the whole approved tree, not just this batch's documents.
  assert.ok(verification.knowledge_document_count >= verification.applied_count)
})

test("batch apply writes only approved proposals, verifies, and rolls back byte-exact", async (context) => {
  const { root, run, runAbsolute, manifest, approvedPath, manifestSha256 } = await proposedBatch(
    context,
    { "domain.batch-11": "reject" },
  )
  const knowledgeBefore = await hashes(root, KNOWLEDGE)

  const result = await applyKnowledge({ root, run, approvedPath })
  assert.equal(result.status, "pass")
  assert.equal(result.applied_count, 11)
  assert.equal(result.excluded_count, 1)

  const report = await readJson(path.join(runAbsolute, "apply-report.json"))
  assert.equal(report.status, "pass")
  assert.equal(report.batch_id, "fixture-batch")
  assert.equal(report.proposal_manifest_sha256, manifestSha256)
  assert.equal(
    report.approved_review_sha256,
    sha256(await readFile(path.join(root, approvedPath), "utf8")),
  )
  assert.deepEqual(
    report.excluded.map((entry) => entry.concept_id),
    ["domain.batch-11"],
  )

  // Exactly the approved proposals landed, at their promoted bytes.
  for (const proposal of manifest.proposals) {
    const absolute = path.join(root, proposal.canonical_path)
    if (proposal.concept_id === "domain.batch-11") {
      assert.equal(await exists(absolute), false, "rejected proposal must not be written")
      continue
    }
    const applied = await readFile(absolute, "utf8")
    assert.equal(sha256(applied), proposal.applied_sha256)
    assert.match(applied, /^proposal_status: approved$/m)
    assert.doesNotMatch(applied, /awaiting_user_review/)
  }

  const verification = await verifyKnowledgeRun({ root, run })
  assert.equal(verification.status, "pass")
  assert.equal(verification.applied, true)
  assert.equal(verification.applied_count, 11)
  assert.equal(verification.excluded_count, 1)
  assert.equal(verification.provenance_coverage_percent, 100)
  assert.equal(verification.collision_count, 0)
  assert.equal(verification.broken_knowledge_link_count, 0)
  assert.equal(verification.graph_source_leakage_count, 0)
  assert.equal(verification.public_alias_route_count, 0)

  // Applying the same approved review again is a measured no-op, not a second write.
  const appliedHashes = await hashes(root, KNOWLEDGE)
  const rerun = await applyKnowledge({ root, run, approvedPath })
  assert.equal(rerun.status, "noop")
  assert.deepEqual(await hashes(root, KNOWLEDGE), appliedHashes)

  const rollback = await rollbackKnowledgeApply({ root, run })
  assert.equal(rollback.status, "pass")
  assert.equal(rollback.restored_count, 11)
  assert.deepEqual(await hashes(root, KNOWLEDGE), knowledgeBefore)
})

test("batch verify fails when an unapproved proposal appears in approved content", async (context) => {
  const { root, run, runAbsolute, approvedPath } = await proposedBatch(context, {
    "domain.batch-11": "reject",
  })
  await applyKnowledge({ root, run, approvedPath })
  const excluded = "domain.batch-11"
  const smuggled = await readFile(path.join(runAbsolute, `proposals/${excluded}.md`), "utf8")
  await writeFile(
    path.join(root, KNOWLEDGE, "domain/batch-11.md"),
    smuggled.replace("proposal_status: awaiting_user_review", "proposal_status: approved"),
  )
  await assert.rejects(verifyKnowledgeRun({ root, run }), /unapproved proposal/)
})

test("batch verify fails when applied content is edited after apply", async (context) => {
  const { root, run, approvedPath } = await proposedBatch(context)
  await applyKnowledge({ root, run, approvedPath })
  const target = path.join(root, KNOWLEDGE, "domain/batch-2.md")
  await writeFile(target, `${await readFile(target, "utf8")}\nHand edit.\n`)
  await assert.rejects(verifyKnowledgeRun({ root, run }), /applied bytes differ/)
})

test("a second batch updates an existing approved concept behind an exact before snapshot", async (context) => {
  const first = await proposedBatch(context)
  const { root } = first
  await applyKnowledge({ root, run: first.run, approvedPath: first.approvedPath })
  const appliedHashes = await hashes(root, KNOWLEDGE)
  const originalBytes = await readFile(path.join(root, KNOWLEDGE, "domain/batch-0.md"), "utf8")

  const updateRun = ".omx/artifacts/brain-restructure/batch-update"
  const updatePath = "tooling/brain/fixtures/batch-update.json"
  const source = await readFile(path.join(root, first.sourcePath), "utf8")
  await writeFile(
    path.join(root, updatePath),
    `${JSON.stringify(
      {
        schema_version: 1,
        batch_id: "fixture-batch-update",
        scope: [first.sourcePath],
        candidates: [
          {
            concept_id: "domain.batch-0",
            title: "Batch Concept 0",
            aliases: ["Batch Alias 0"],
            canonical_path: `${KNOWLEDGE}/domain/batch-0.md`,
            tags: ["domain"],
            proposal_kind: "update",
            concept_granularity: "one revised batch fixture assertion",
            pilot_strata: ["fixture"],
            related_concepts: [],
            locators: [
              {
                path: first.sourcePath,
                source_sha256: sha256(source),
                heading: "# Batch",
                start_line: 1,
                end_line: 3,
              },
            ],
          },
        ],
        rejected_candidates: [],
      },
      null,
      2,
    )}\n`,
  )
  await proposeKnowledge({ root, run: updateRun, batchPath: updatePath })
  const updateAbsolute = path.join(root, updateRun)
  const updateBytes = await readFile(path.join(updateAbsolute, "proposal-manifest.json"), "utf8")
  const updateManifest = JSON.parse(updateBytes)
  assert.equal(updateManifest.collision_count, 0)
  assert.equal(updateManifest.proposals[0].target_exists, true)
  assert.equal(updateManifest.proposals[0].target_before_sha256, sha256(originalBytes))
  await sampleKnowledgeBatch({ root, run: updateRun })
  const updateApproved = `${updateRun}/approved-review.json`
  await writeJson(path.join(root, updateApproved), reviewFor(updateManifest, sha256(updateBytes)))

  // Hand-editing the document this batch is about to replace names that exact target.
  const target = path.join(root, KNOWLEDGE, "domain/batch-0.md")
  await writeFile(target, `${originalBytes}\nHand edit before apply.\n`)
  await assert.rejects(
    applyKnowledge({ root, run: updateRun, approvedPath: updateApproved }),
    /target drift for content\/brain\/knowledge\/domain\/batch-0\.md \(bytes changed\)/,
  )
  assert.equal(await exists(path.join(root, updateRun, "journal.jsonl")), false)
  await writeFile(target, originalBytes)

  const applied = await applyKnowledge({ root, run: updateRun, approvedPath: updateApproved })
  assert.equal(applied.status, "pass")
  assert.deepEqual(
    applied.applied.map((entry) => entry.operation),
    ["modified"],
  )
  const snapshot = await readFile(
    path.join(updateAbsolute, "before", `${KNOWLEDGE}/domain/batch-0.md`),
    "utf8",
  )
  assert.equal(sha256(snapshot), sha256(originalBytes))
  const updatedBytes = await readFile(path.join(root, KNOWLEDGE, "domain/batch-0.md"), "utf8")
  assert.notEqual(sha256(updatedBytes), sha256(originalBytes))
  assert.equal(sha256(updatedBytes), updateManifest.proposals[0].applied_sha256)

  assert.equal((await verifyKnowledgeRun({ root, run: updateRun })).status, "pass")

  const rollback = await rollbackKnowledgeApply({ root, run: updateRun })
  assert.equal(rollback.status, "pass")
  assert.deepEqual(await hashes(root, KNOWLEDGE), appliedHashes)
})

// Independent Phase 5 verification, F1: `sample.json` is a deterministic function of the
// manifest, so apply and verify rederive it instead of trusting the file's own selection.
// Shrinking the reviewed set on disk must not shrink the review coverage gate.
test("batch apply refuses a hand-edited sample with zero writes and verify refuses it too", async (context) => {
  const { root, run, runAbsolute, approvedPath } = await proposedBatch(context)
  const knowledgeBefore = await hashes(root, KNOWLEDGE)
  const samplePath = path.join(runAbsolute, "sample.json")
  const canonical = await readFile(samplePath, "utf8")
  const sample = JSON.parse(canonical)

  for (const [label, mutate] of [
    ["emptied selection", (value) => ({ ...value, selected: [], sampled_count: 0 })],
    [
      "dropped one selected proposal",
      (value) => ({
        ...value,
        selected: value.selected.slice(1),
        sampled_count: value.sampled_count - 1,
      }),
    ],
    [
      "demoted a mandatory proposal",
      (value) => ({
        ...value,
        selected: value.selected.map((entry) => ({ ...entry, mandatory: false })),
        mandatory_count: 0,
      }),
    ],
    [
      "rewritten rank",
      (value) => ({
        ...value,
        selected: value.selected.map((entry, index) =>
          index === 0 ? { ...entry, rank: sha256("rerank") } : entry,
        ),
      }),
    ],
    [
      "widened quota",
      (value) => ({ ...value, discretionary_quota: value.discretionary_quota + 1 }),
    ],
    ["dropped category coverage", (value) => ({ ...value, categories_covered: ["create"] })],
    [
      "moved a proposal to not_selected",
      (value) => ({
        ...value,
        selected: value.selected.slice(0, -1),
        not_selected: [...value.not_selected, value.selected.at(-1)],
        sampled_count: value.sampled_count - 1,
      }),
    ],
  ]) {
    await writeJson(samplePath, mutate(sample))
    await assert.rejects(
      applyKnowledge({ root, run, approvedPath }),
      /sample\.json differs from the canonical deterministic sample/,
      label,
    )
    await assertZeroWrite(root, run, knowledgeBefore)
  }

  // A sample bound to different manifest bytes is still named as such.
  await writeJson(samplePath, { ...sample, proposal_manifest_sha256: sha256("stale") })
  await assert.rejects(
    applyKnowledge({ root, run, approvedPath }),
    /sample proposal manifest hash differs/,
  )
  await assertZeroWrite(root, run, knowledgeBefore)

  // Restoring the canonical bytes applies, and tampering after apply fails verification.
  await writeFile(samplePath, canonical)
  assert.equal((await applyKnowledge({ root, run, approvedPath })).status, "pass")
  await writeJson(samplePath, { ...sample, selected: [], sampled_count: 0 })
  await assert.rejects(verifyKnowledgeRun({ root, run }), /canonical deterministic sample/)
  await writeFile(samplePath, canonical)
  assert.equal((await verifyKnowledgeRun({ root, run })).status, "pass")
})

// Independent Phase 5 verification, F2: a signed review must be internally valid. A
// decision outside the contract is malformed rather than a silent exclusion, and one
// recorded critical issue rejects the batch however the top-level counter reads.
test("batch apply refuses an internally invalid signed review with zero writes", async (context) => {
  const { root, run, runAbsolute, manifest, manifestSha256, approvedPath } =
    await proposedBatch(context)
  const knowledgeBefore = await hashes(root, KNOWLEDGE)
  const approvedAbsolute = path.join(root, approvedPath)
  const valid = reviewFor(manifest, manifestSha256)

  for (const [label, mutate, pattern] of [
    [
      "decision outside the contract",
      (review) => ({
        ...review,
        proposals: review.proposals.map((entry, index) =>
          index === 0 ? { ...entry, decision: "modify" } : entry,
        ),
      }),
      /decision must be approve, reject, or pending/,
    ],
    [
      "decision is not a string",
      (review) => ({
        ...review,
        proposals: review.proposals.map((entry, index) =>
          index === 0 ? { ...entry, decision: null } : entry,
        ),
      }),
      /decision must be approve, reject, or pending/,
    ],
    [
      "critical issue recorded under a zero count",
      (review) => ({
        ...review,
        proposals: review.proposals.map((entry, index) =>
          index === 0 ? { ...entry, critical_issues: ["unresolved provenance gap"] } : entry,
        ),
      }),
      /unresolved critical issue/,
    ],
    [
      "critical_issues is not an array",
      (review) => ({
        ...review,
        proposals: review.proposals.map((entry, index) =>
          index === 0 ? { ...entry, critical_issues: "none" } : entry,
        ),
      }),
      /critical_issues must be an array/,
    ],
    [
      "entry without a concept_id",
      (review) => ({
        ...review,
        proposals: review.proposals.map((entry, index) =>
          index === 0 ? { ...entry, concept_id: "" } : entry,
        ),
      }),
      /entry without a concept_id/,
    ],
  ]) {
    await writeJson(approvedAbsolute, mutate(valid))
    await assert.rejects(
      applyKnowledge({ root, run, approvedPath }),
      /batch review is internally invalid/,
      label,
    )
    await assert.rejects(applyKnowledge({ root, run, approvedPath }), pattern, label)
    await assertZeroWrite(root, run, knowledgeBefore)
  }

  // The one difference the counter can legitimately record is a nonzero count, which the
  // top-level gate already refuses before the entries are read.
  await writeJson(approvedAbsolute, {
    ...valid,
    critical_issue_count: 1,
    proposals: valid.proposals.map((entry, index) =>
      index === 0 ? { ...entry, critical_issues: ["unresolved provenance gap"] } : entry,
    ),
  })
  await assert.rejects(applyKnowledge({ root, run, approvedPath }), /batch review is unsigned/)
  await assertZeroWrite(root, run, knowledgeBefore)

  await writeJson(approvedAbsolute, valid)
  assert.equal((await applyKnowledge({ root, run, approvedPath })).applied_count, 12)
  assert.equal(await exists(path.join(runAbsolute, "apply-report.json")), true)
})

test("phase 4 proposal-only runs keep their apply refusal on the phase 5 engine", async (context) => {
  const { root, run, batchPath } = await batchFixture(context)
  const pilotPath = "tooling/brain/fixtures/pilot.json"
  const batch = await readJson(path.join(root, batchPath))
  await writeJson(path.join(root, pilotPath), {
    schema_version: 1,
    candidates: batch.candidates.slice(0, 10).map(({ review_flags, ...candidate }) => ({
      ...candidate,
      related_concepts: candidate.related_concepts.filter((id) => id !== "domain.batch-10"),
    })),
    rejected_candidates: batch.rejected_candidates,
  })
  await proposeKnowledge({ root, run, pilotPath })
  const manifest = await readJson(path.join(root, run, "proposal-manifest.json"))
  assert.equal(manifest.phase, 4)
  assert.equal(manifest.mode, "proposal-only")
  assert.equal((await verifyKnowledgeRun({ root, run })).status, "pass")
  await assert.rejects(applyKnowledge({ root, run }), /apply refused: U2 pilot review/)
  await assert.rejects(
    applyKnowledge({ root, run, approvedPath: `${run}/pilot-review.json` }),
    /apply refused: U2 pilot review/,
  )
  await assert.rejects(sampleKnowledgeBatch({ root, run }), /batch run/)
  await assert.rejects(
    proposeKnowledge({ root, run, pilotPath, batchPath }),
    /exactly one of --pilot or --batch/,
  )
})

// Independent Phase 5 verification, D1 — the batch half of the same defect. The journal is
// created and fsynced before the first `intent`, so an interruption in that window leaves a
// valid zero-byte journal that used to classify as `interrupted` forever: rollback found no
// operations, changed nothing, reported `pass`, and the next apply refused identically.
for (const arrival of [
  {
    label: "an injected pre-intent interruption",
    async reach(root, run, approvedPath) {
      await assert.rejects(
        applyKnowledge({ root, run, approvedPath, faultBeforeFirstIntent: true }),
        /injected apply interruption before the first intent/,
      )
    },
  },
  {
    // The same on-disk state reached by hand: a zero-byte journal is classified by its
    // bytes, not by how it came to exist.
    label: "a hand-truncated zero-byte journal",
    async reach(root, run, approvedPath) {
      await assert.rejects(
        applyKnowledge({ root, run, approvedPath, faultBeforeFirstIntent: true }),
        /injected apply interruption/,
      )
      await writeFile(path.join(root, run, "journal.jsonl"), "")
    },
  },
]) {
  test(`a batch apply interrupted before its first intent recovers through rollback from ${arrival.label}`, async (context) => {
    const { root, run, runAbsolute, approvedPath } = await proposedBatch(context)
    const knowledgeBefore = await hashes(root, KNOWLEDGE)
    const journalPath = path.join(runAbsolute, "journal.jsonl")
    await arrival.reach(root, run, approvedPath)

    // The crash window: a zero-byte journal over an already-durable before snapshot.
    assert.equal(await readFile(journalPath, "utf8"), "")
    const before = await readJson(path.join(runAbsolute, "before-manifest.json"))
    assert.equal(before.batch_id, "fixture-batch")
    assert.equal(await exists(path.join(runAbsolute, "apply-report.json")), false)
    assert.deepEqual(await hashes(root, KNOWLEDGE), knowledgeBefore)

    await assert.rejects(applyKnowledge({ root, run, approvedPath }), /interrupted apply journal/)
    await assert.rejects(verifyKnowledgeRun({ root, run }), /interrupted apply journal/)

    // Rollback transitions it to a reusable state instead of reporting a no-change pass.
    const rollback = await rollbackKnowledgeApply({ root, run })
    assert.equal(rollback.status, "pass")
    assert.equal(rollback.run_state, "reset")
    assert.equal(rollback.restored_count, 0)
    assert.equal(rollback.noop_count, 0)
    assert.equal(rollback.restored_knowledge_tree_sha256, before.knowledge_tree_sha256)
    assert.deepEqual(await hashes(root, KNOWLEDGE), knowledgeBefore)
    const finalized = (await readFile(journalPath, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line))
    assert.deepEqual(
      finalized.map((entry) => entry.state),
      ["rollback-finalized"],
    )
    assert.equal(finalized[0].operationCount, 0)
    assert.equal(finalized[0].knowledgeTreeSha256, before.knowledge_tree_sha256)

    // A reset run verifies as the pre-apply run it still is.
    const reverified = await verifyKnowledgeRun({ root, run })
    assert.equal(reverified.status, "pass")
    assert.equal(reverified.run_state, "reset")
    assert.equal(reverified.applied, false)
    assert.equal(reverified.rolled_back, false)

    // A reset run is a fresh run, not an unlocked one: it still demands a signed review.
    await assert.rejects(applyKnowledge({ root, run }), /requires --approved/)

    // And the retry the old lifecycle made impossible now succeeds under every guard.
    const retry = await applyKnowledge({ root, run, approvedPath })
    assert.equal(retry.status, "pass")
    assert.equal(retry.applied_count, 12)
    const verification = await verifyKnowledgeRun({ root, run })
    assert.equal(verification.status, "pass")
    assert.equal(verification.applied, true)
    assert.equal(verification.run_state, "completed")
    assert.equal((await applyKnowledge({ root, run, approvedPath })).status, "noop")

    const undo = await rollbackKnowledgeApply({ root, run })
    assert.equal(undo.status, "pass")
    assert.equal(undo.run_state, "rolled_back")
    assert.equal(undo.restored_count, 12)
    assert.deepEqual(await hashes(root, KNOWLEDGE), knowledgeBefore)
    await assert.rejects(
      applyKnowledge({ root, run, approvedPath }),
      /was rolled back; propose a new run/,
    )
  })
}

// Independent Phase 5 verification, D2 — the batch half. The completion marker used to be
// fsynced before the report it makes mandatory; the order is now report-then-marker, so the
// surviving state at that boundary is interrupted, never complete.
test("a batch apply interrupted between its report and its completion marker never reads as complete", async (context) => {
  const { root, run, runAbsolute, approvedPath } = await proposedBatch(context)
  const knowledgeBefore = await hashes(root, KNOWLEDGE)
  const reportPath = path.join(runAbsolute, "apply-report.json")

  await assert.rejects(
    applyKnowledge({ root, run, approvedPath, faultBeforeCompletionMarker: true }),
    /injected apply interruption before the completion marker/,
  )

  // The report is already durable and the mutations already happened; only the marker is
  // missing. That is precisely the window the old ordering classified as complete.
  assert.equal(await exists(reportPath), true)
  const journal = (await readFile(path.join(runAbsolute, "journal.jsonl"), "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line))
  assert.ok(journal.some((entry) => entry.state === "intent"))
  assert.equal(
    journal.some((entry) => entry.state === "apply-completed"),
    false,
  )

  await assert.rejects(applyKnowledge({ root, run, approvedPath }), /interrupted apply journal/)
  await assert.rejects(verifyKnowledgeRun({ root, run }), /interrupted apply journal/)

  const rollback = await rollbackKnowledgeApply({ root, run })
  assert.equal(rollback.status, "pass")
  assert.equal(rollback.run_state, "rolled_back")
  assert.equal(rollback.restored_count, 12)
  assert.deepEqual(await hashes(root, KNOWLEDGE), knowledgeBefore)

  // The unbound report described a run that has now been undone; it does not survive it.
  assert.equal(await exists(reportPath), false)
  const verification = await verifyKnowledgeRun({ root, run })
  assert.equal(verification.status, "pass")
  assert.equal(verification.applied, false)
  assert.equal(verification.rolled_back, true)
  await assert.rejects(
    applyKnowledge({ root, run, approvedPath }),
    /was rolled back; propose a new run/,
  )
})

// Independent Phase 5 verification, D2 (second half) — the batch half. The marker binds the
// report's exact bytes, so a report that is deleted, truncated, or edited is refused by name
// rather than as a raw ENOENT, while rollback stays available and nothing is written.
test("a completed batch apply whose report is missing or altered refuses by name with zero writes", async (context) => {
  const { root, run, runAbsolute, approvedPath } = await proposedBatch(context)
  const knowledgeBefore = await hashes(root, KNOWLEDGE)
  const reportPath = path.join(runAbsolute, "apply-report.json")
  await applyKnowledge({ root, run, approvedPath })
  const appliedHashes = await hashes(root, KNOWLEDGE)
  const reportBytes = await readFile(reportPath, "utf8")

  // The completion marker is bound to the exact report bytes it was written after.
  const completion = (await readFile(path.join(runAbsolute, "journal.jsonl"), "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line))
    .find((entry) => entry.state === "apply-completed")
  assert.equal(completion.report, "apply-report.json")
  assert.equal(completion.reportSha256, sha256(reportBytes))

  for (const [label, mutate, pattern] of [
    ["missing report", async () => rm(reportPath), /apply-report\.json is missing/],
    [
      "truncated report",
      async () => writeFile(reportPath, reportBytes.slice(0, 120)),
      /apply-report\.json bytes differ from the completion marker/,
    ],
    [
      "edited but well-formed report",
      async () =>
        writeFile(reportPath, reportBytes.replace('"applied_count": 12', '"applied_count": 4')),
      /apply-report\.json bytes differ from the completion marker/,
    ],
  ]) {
    await mutate()
    await assert.rejects(applyKnowledge({ root, run, approvedPath }), pattern, label)
    await assert.rejects(verifyKnowledgeRun({ root, run }), pattern, label)
    // The refusal is a named lifecycle error, not a filesystem error escaping re-entry.
    const error = await applyKnowledge({ root, run, approvedPath }).catch((caught) => caught)
    assert.equal(error.code, undefined, label)
    assert.match(error.message, /^apply refused: /, label)
    assert.deepEqual(await hashes(root, KNOWLEDGE), appliedHashes, label)
  }

  // Restoring the exact bytes restores the verified no-op the contract promises.
  await writeFile(reportPath, reportBytes)
  assert.equal((await applyKnowledge({ root, run, approvedPath })).status, "noop")
  assert.equal((await verifyKnowledgeRun({ root, run })).status, "pass")
  assert.deepEqual(await hashes(root, KNOWLEDGE), appliedHashes)

  // And a completed run whose report is gone is still rollback-recoverable, byte-exactly.
  await rm(reportPath)
  const rollback = await rollbackKnowledgeApply({ root, run })
  assert.equal(rollback.status, "pass")
  assert.equal(rollback.restored_count, 12)
  assert.deepEqual(await hashes(root, KNOWLEDGE), knowledgeBefore)
})

// Independent Phase 5 verification, finding 1 (HIGH) and finding 2 (HIGH) — the batch half.
// Completed batch verification never re-read the proposal artifacts, so an altered proposal
// still verified `pass`; and the completed no-op returned before the review, sample,
// proposal, and provenance checks could run, so every drift surface below reported `noop`.
// Both now measure the same current evidence set through one authoritative checker.
test("a completed batch refuses post-completion drift on every evidence surface from both verify and rerun", async (context) => {
  const { root, run, runAbsolute, approvedPath, sourcePath, raw } = await proposedBatch(context)
  await applyKnowledge({ root, run, approvedPath })
  const appliedHashes = await hashes(root, KNOWLEDGE)

  const surfaces = [
    {
      label: "proposal artifact bytes",
      file: path.join(runAbsolute, "proposals/domain.batch-2.md"),
      mutate: (bytes) => `${bytes}\nHand edit after apply.\n`,
      pattern: /domain\.batch-2: proposal bytes differ from manifest/,
    },
    {
      label: "locked source bytes",
      file: path.join(root, sourcePath),
      mutate: () => `${raw}drift after apply\n`,
      pattern: /source drift|locator drift|exact source span/,
    },
    {
      label: "signed review bytes",
      file: path.join(root, approvedPath),
      mutate: (bytes) => bytes.replace(REVIEWER, "다른 사람"),
      pattern: /signed review evidence changed after apply/,
    },
    {
      label: "proposal manifest bytes",
      file: path.join(runAbsolute, "proposal-manifest.json"),
      mutate: (bytes) => bytes.replace('"accepted_count": 12', '"accepted_count": 11'),
      pattern: /apply report is bound to different proposal manifest bytes/,
    },
    {
      label: "canonical sample bytes",
      file: path.join(runAbsolute, "sample.json"),
      mutate: (bytes) => bytes.replace('"sampled_count"', '"sampled_count_shadowed"'),
      pattern: /sample\.json changed after apply|canonical deterministic sample/,
    },
  ]

  for (const surface of surfaces) {
    const original = await readFile(surface.file, "utf8")
    await writeFile(surface.file, surface.mutate(original))
    const runBefore = await hashes(root, run)

    // The rerun must refuse by name instead of returning `noop`, and must write nothing.
    const refusal = await applyKnowledge({ root, run, approvedPath }).catch((caught) => caught)
    assert.ok(refusal instanceof Error, surface.label)
    assert.match(refusal.message, /^apply refused: applied state drifted:/, surface.label)
    assert.match(refusal.message, surface.pattern, surface.label)
    assert.equal(refusal.code, undefined, surface.label)
    await assertNoWriteAnywhere(root, run, appliedHashes, runBefore, surface.label)

    // The refusal is deterministic: the same drift refuses identically on every call.
    const again = await applyKnowledge({ root, run, approvedPath }).catch((caught) => caught)
    assert.equal(again.message, refusal.message, surface.label)

    // And completed verification refuses the same drift — the false `pass` is closed.
    await assert.rejects(verifyKnowledgeRun({ root, run }), surface.pattern, surface.label)

    await writeFile(surface.file, original)
    assert.equal((await applyKnowledge({ root, run, approvedPath })).status, "noop", surface.label)
    assert.equal((await verifyKnowledgeRun({ root, run })).status, "pass", surface.label)
    assert.deepEqual(await hashes(root, KNOWLEDGE), appliedHashes, surface.label)
  }

  // A signed review that stops approving an applied proposal is drift too, even though its
  // recorded hash and the applied bytes are untouched — so is a deleted proposal artifact.
  const reviewBytes = await readFile(path.join(root, approvedPath), "utf8")
  const report = await readJson(path.join(runAbsolute, "apply-report.json"))
  assert.equal(report.applied_count, 12)
  assert.equal(sha256(reviewBytes), report.approved_review_sha256)

  await rm(path.join(runAbsolute, "proposals/domain.batch-5.md"))
  await assert.rejects(
    applyKnowledge({ root, run, approvedPath }),
    /domain\.batch-5: proposal artifact is missing/,
  )
  await assert.rejects(
    verifyKnowledgeRun({ root, run }),
    /domain\.batch-5: proposal artifact is missing/,
  )
  assert.deepEqual(await hashes(root, KNOWLEDGE), appliedHashes)
})

// Independent Phase 5 verification, finding 3 (MEDIUM). The parser recognized five states
// and silently ignored every other well-formed record, accepted duplicate identifiers and
// terminals, and leaked a raw `SyntaxError` on a truncated append. The grammar is now
// strict and fails closed on all three write/read paths with zero writes.
test("a malformed batch journal fails closed by name on apply, verify, and rollback", async (context) => {
  const { root, run, runAbsolute, approvedPath } = await proposedBatch(context)
  await applyKnowledge({ root, run, approvedPath })
  const appliedHashes = await hashes(root, KNOWLEDGE)
  const journalPath = path.join(runAbsolute, "journal.jsonl")
  const canonical = await readFile(journalPath, "utf8")
  const records = journalLines(canonical)
  const completion = records.find((entry) => entry.state === "apply-completed")
  const intents = records.filter((entry) => entry.state === "intent")
  // 12 proposals plus the one journalled directory creation.
  assert.equal(intents.length, 13)
  assert.equal(completion.operationCount, 13)

  const rollbackFinalized = {
    state: "rollback-finalized",
    operationCount: intents.length,
    restoredCount: intents.length,
    restoredDirectoryCount: 0,
    noopCount: 0,
    knowledgeTreeSha256: sha256("forged"),
  }

  for (const [label, text, pattern] of [
    [
      "an unknown but well-formed record",
      `${canonical}${JSON.stringify({ state: "unknown-independent-record" })}\n`,
      /journal\.jsonl is invalid: line 28 records unknown state "unknown-independent-record"/,
    ],
    [
      "a truncated final append",
      `${canonical}{"state":"apply-comp`,
      /journal\.jsonl is invalid: line 28 is not valid JSON \(truncated or corrupt\)/,
    ],
    [
      "a non-object record",
      `${canonical}"apply-completed"\n`,
      /journal\.jsonl is invalid: line 28 is not a journal record object/,
    ],
    [
      "a duplicate completion terminal",
      `${canonical}${JSON.stringify(completion)}\n`,
      /journal\.jsonl is invalid: line 28 repeats the apply-completed terminal record/,
    ],
    [
      "a rollback finalized over a completed run that was never undone",
      `${canonical}${JSON.stringify(rollbackFinalized)}\n`,
      /journal\.jsonl is invalid: line 28 finalizes a rollback of a completed run with 13 operation\(s\) still applied/,
    ],
    [
      "a duplicate intent id",
      journalText([intents[0], intents[0]]),
      /journal\.jsonl is invalid: line 2 repeats intent id 1/,
    ],
    [
      "an intent id that goes backwards",
      journalText([intents[1], intents[0]]),
      /journal\.jsonl is invalid: line 2 intent id 1 does not follow 2 in order/,
    ],
    [
      "an operation count that disagrees with the records",
      journalText(
        records.map((entry) =>
          entry.state === "apply-completed" ? { ...entry, operationCount: 4 } : entry,
        ),
      ),
      /journal\.jsonl is invalid: line 27 apply-completed claims 4 operation\(s\) over 13 completed of 13 journalled/,
    ],
    [
      "a completion marker that binds no report hash",
      journalText(
        records.map((entry) => {
          if (entry.state !== "apply-completed") return entry
          const { reportSha256, ...rest } = entry
          return rest
        }),
      ),
      /journal\.jsonl is invalid: line 27 apply-completed binds no reportSha256/,
    ],
    [
      "an intent naming an unknown operation",
      journalText(
        records.map((entry, index) => (index === 0 ? { ...entry, operation: "moved" } : entry)),
      ),
      /journal\.jsonl is invalid: line 1 intent records unknown operation "moved"/,
    ],
    [
      "a completed record for an unjournalled intent",
      journalText([intents[0], { id: 99, state: "completed" }]),
      /journal\.jsonl is invalid: line 2 completes unjournalled intent id 99/,
    ],
    [
      "a rollback-completed record with an unknown action",
      journalText([intents[0], { id: 1, state: "rollback-completed", action: "partially" }]),
      /journal\.jsonl is invalid: line 2 rollback-completed records unknown action "partially"/,
    ],
    [
      "a blank record separator",
      `${canonical.trimEnd()}\n\n${JSON.stringify(completion)}\n`,
      /journal\.jsonl is invalid: line 28 is blank/,
    ],
  ]) {
    await writeFile(journalPath, text)
    const runBefore = await hashes(root, run)
    for (const call of [
      () => applyKnowledge({ root, run, approvedPath }),
      () => verifyKnowledgeRun({ root, run }),
      () => rollbackKnowledgeApply({ root, run }),
    ]) {
      const error = await call().catch((caught) => caught)
      assert.ok(error instanceof Error, label)
      assert.equal(error.name, "JournalGrammarError", label)
      assert.equal(error.code, undefined, label)
      assert.match(error.message, pattern, label)
    }
    await assertNoWriteAnywhere(root, run, appliedHashes, runBefore, label)
  }

  // Restoring the canonical journal restores the verified no-op, and the legal
  // completion-plus-rollback journal a real rollback produces still classifies as
  // `rolled_back` rather than tripping the terminal-exclusivity rule.
  await writeFile(journalPath, canonical)
  assert.equal((await applyKnowledge({ root, run, approvedPath })).status, "noop")
  assert.equal((await verifyKnowledgeRun({ root, run })).status, "pass")
  const rollback = await rollbackKnowledgeApply({ root, run })
  assert.equal(rollback.status, "pass")
  assert.equal(rollback.run_state, "rolled_back")
  assert.equal(rollback.restored_count, 12)
  const settled = journalLines(await readFile(journalPath, "utf8"))
  assert.ok(settled.some((entry) => entry.state === "apply-completed"))
  assert.ok(settled.some((entry) => entry.state === "rollback-finalized"))
  const reverified = await verifyKnowledgeRun({ root, run })
  assert.equal(reverified.status, "pass")
  assert.equal(reverified.run_state, "rolled_back")
  await assert.rejects(
    applyKnowledge({ root, run, approvedPath }),
    /was rolled back; propose a new run/,
  )

  // A record appended after the rollback terminal is refused too.
  await writeFile(
    journalPath,
    `${await readFile(journalPath, "utf8")}${JSON.stringify({ state: "apply-completed", operationCount: 0, report: "apply-report.json", reportSha256: sha256("forged") })}\n`,
  )
  await assert.rejects(
    applyKnowledge({ root, run, approvedPath }),
    /records apply-completed after the rollback-finalized terminal record/,
  )
})

// Independent Phase 5 completed-state repair verification, C3 (BLOCKING). The parser used
// to accept rollback records interleaved into the apply phase: the run then classified as
// `rolled_back` while the approved tree was still fully applied, apply refused only
// generically, and rollback trusted the premature records, skipped every operation, and
// left the run unrestorable. Phase order is now grammar — refused by name, from every
// public entry point, before classification and before a single byte is written.
test("the journal grammar refuses contradictory apply/rollback phase order with zero writes", async (context) => {
  const { root, run, runAbsolute, approvedPath } = await proposedBatch(context)
  const knowledgeBefore = await hashes(root, KNOWLEDGE)
  await applyKnowledge({ root, run, approvedPath })
  const appliedHashes = await hashes(root, KNOWLEDGE)
  const journalPath = path.join(runAbsolute, "journal.jsonl")
  const canonical = await readFile(journalPath, "utf8")
  const records = journalLines(canonical)
  const completion = records.find((entry) => entry.state === "apply-completed")
  const intents = records.filter((entry) => entry.state === "intent")
  const completions = records.filter((entry) => entry.state === "completed")
  // 12 proposals plus the one journalled directory creation, each intent paired with its
  // completed record, then the single terminal marker.
  assert.equal(intents.length, 13)
  assert.equal(completions.length, 13)
  assert.equal(records.length, 27)
  const applyPhase = records.filter((entry) => entry.state !== "apply-completed")
  const rolledBack = (id) => ({ id, state: "rollback-completed", action: "restored" })

  for (const [label, text, pattern] of [
    // The independent report's public-API fixture, rebuilt exactly: after each normal
    // `completed`, its matching `rollback-completed`, then the original valid marker.
    [
      "a rollback record inserted after every completed record",
      journalText([
        ...applyPhase.flatMap((entry) =>
          entry.state === "completed" ? [entry, rolledBack(entry.id)] : [entry],
        ),
        completion,
      ]),
      /journal\.jsonl is invalid: line 4 records intent after the rollback record at line 3/,
    ],
    // The same reordering grouped rather than interleaved: a complete, valid apply phase
    // whose terminal marker was moved behind the rollback records that undo it.
    [
      "the completion marker moved behind the rollback records",
      journalText([...applyPhase, ...intents.map((entry) => rolledBack(entry.id)), completion]),
      /journal\.jsonl is invalid: line 40 records apply-completed after the rollback record at line 27/,
    ],
    // The report's second contradictory ordering: every intent recorded rolled back before
    // the `completed` record that says the mutation returned.
    [
      "a completed record for an intent already rolled back",
      journalText(
        applyPhase.flatMap((entry) =>
          entry.state === "intent" ? [entry, rolledBack(entry.id)] : [entry],
        ),
      ),
      /journal\.jsonl is invalid: line 3 completes intent 1 already recorded rolled back at line 2/,
    ],

    // Direct grammar regressions over hand-built record sequences, each isolating one
    // phase-order violation independent of the fixture's own journal.
    [
      "a completion marker after a single rollback record",
      journalText([intents[0], completions[0], rolledBack(1), completion]),
      /journal\.jsonl is invalid: line 4 records apply-completed after the rollback record at line 3/,
    ],
    // The phase rule is checked before the operation-count rule, so the earliest boundary
    // is the one that names the refusal.
    [
      "a completion marker after a rollback record and before any completed record",
      journalText([intents[0], rolledBack(1), { ...completion, operationCount: 1 }]),
      /journal\.jsonl is invalid: line 3 records apply-completed after the rollback record at line 2/,
    ],
    [
      "a completed record after a different intent was rolled back",
      journalText([intents[0], intents[1], rolledBack(2), completions[0]]),
      /journal\.jsonl is invalid: line 4 records completed after the rollback record at line 3/,
    ],
    [
      "a new intent after the rollback phase began",
      journalText([intents[0], rolledBack(1), intents[1]]),
      /journal\.jsonl is invalid: line 3 records intent after the rollback record at line 2/,
    ],
  ]) {
    await writeFile(journalPath, text)
    const runBefore = await hashes(root, run)
    for (const call of [
      () => applyKnowledge({ root, run, approvedPath }),
      () => verifyKnowledgeRun({ root, run }),
      () => rollbackKnowledgeApply({ root, run }),
    ]) {
      const error = await call().catch((caught) => caught)
      assert.ok(error instanceof Error, label)
      assert.equal(error.name, "JournalGrammarError", label)
      assert.equal(error.code, undefined, label)
      assert.match(error.message, pattern, label)
      // The old failure was a generic rolled-back classification over a still-applied
      // tree, so neither refusal may read as one.
      assert.doesNotMatch(error.message, /was rolled back; propose a new run/, label)
      assert.doesNotMatch(error.message, /differs from the before snapshot/, label)
    }
    await assertNoWriteAnywhere(root, run, appliedHashes, runBefore, label)
  }

  // The recovery contract the contradictory journals broke: the canonical journal still
  // measures as a completed no-op and still rolls back byte-exactly to the before tree.
  await writeFile(journalPath, canonical)
  assert.equal((await applyKnowledge({ root, run, approvedPath })).status, "noop")
  assert.equal((await verifyKnowledgeRun({ root, run })).status, "pass")
  const rollback = await rollbackKnowledgeApply({ root, run })
  assert.equal(rollback.status, "pass")
  assert.equal(rollback.run_state, "rolled_back")
  assert.equal(rollback.restored_count, 12)
  assert.deepEqual(await hashes(root, KNOWLEDGE), knowledgeBefore)

  // And the one legal completion-then-rollback ordering the phase rule must never reject:
  // the apply phase closed by its marker, then a rollback record per operation, then the
  // finalizer.
  const settled = journalLines(await readFile(journalPath, "utf8"))
  const markerIndex = settled.findIndex((entry) => entry.state === "apply-completed")
  const firstRollbackIndex = settled.findIndex((entry) => entry.state === "rollback-completed")
  assert.ok(markerIndex >= 0 && firstRollbackIndex > markerIndex)
  assert.equal(settled.at(-1).state, "rollback-finalized")
  assert.equal(
    settled.filter((entry) => entry.state === "rollback-completed").length,
    intents.length,
  )
  assert.equal((await verifyKnowledgeRun({ root, run })).run_state, "rolled_back")
})

// The phase rule closes the apply phase on the first rollback record — it does not require
// an `apply-completed` marker to exist. An interrupted run that never completed still rolls
// back, and its rollback records are legal with no marker ahead of them.
test("the phase-order grammar still accepts a rollback of a run that never completed", async (context) => {
  const { root, run, runAbsolute, approvedPath } = await proposedBatch(context)
  const knowledgeBefore = await hashes(root, KNOWLEDGE)
  await assert.rejects(
    applyKnowledge({ root, run, approvedPath, faultAfterMutationOperations: 4 }),
    /injected apply interruption/,
  )
  const journalPath = path.join(runAbsolute, "journal.jsonl")
  assert.equal(
    journalLines(await readFile(journalPath, "utf8")).some(
      (entry) => entry.state === "apply-completed",
    ),
    false,
  )

  const rollback = await rollbackKnowledgeApply({ root, run })
  assert.equal(rollback.status, "pass")
  assert.equal(rollback.run_state, "rolled_back")
  assert.deepEqual(await hashes(root, KNOWLEDGE), knowledgeBefore)

  const settled = journalLines(await readFile(journalPath, "utf8"))
  assert.equal(
    settled.some((entry) => entry.state === "apply-completed"),
    false,
  )
  assert.ok(settled.some((entry) => entry.state === "rollback-completed"))
  assert.equal(settled.at(-1).state, "rollback-finalized")
  assert.equal((await verifyKnowledgeRun({ root, run })).run_state, "rolled_back")
})

// The remaining legal run states still classify, so the strict grammar is a fail-closed
// filter over the documented lifecycle rather than a narrower one.
test("the strict journal grammar still accepts every documented run state", async (context) => {
  const { root, run, runAbsolute, approvedPath } = await proposedBatch(context)
  const journalPath = path.join(runAbsolute, "journal.jsonl")

  // none — no journal at all.
  assert.equal(await exists(journalPath), false)
  assert.equal((await verifyKnowledgeRun({ root, run })).run_state, "none")

  // interrupted — a zero-byte journal parses to zero records rather than failing.
  await assert.rejects(
    applyKnowledge({ root, run, approvedPath, faultBeforeFirstIntent: true }),
    /injected apply interruption/,
  )
  assert.equal(await readFile(journalPath, "utf8"), "")
  await assert.rejects(verifyKnowledgeRun({ root, run }), /interrupted apply journal/)

  // reset — finalized with zero operations.
  assert.equal((await rollbackKnowledgeApply({ root, run })).run_state, "reset")
  assert.equal((await verifyKnowledgeRun({ root, run })).run_state, "reset")

  // completed — a full apply, then its no-op.
  assert.equal((await applyKnowledge({ root, run, approvedPath })).status, "pass")
  assert.equal((await verifyKnowledgeRun({ root, run })).run_state, "completed")
  assert.equal((await applyKnowledge({ root, run, approvedPath })).status, "noop")

  // rolled_back — every operation undone and finalized.
  assert.equal((await rollbackKnowledgeApply({ root, run })).run_state, "rolled_back")
  assert.equal((await verifyKnowledgeRun({ root, run })).run_state, "rolled_back")
})

// A batch that revises or extends an already-approved corpus has to be able to point
// `related_concepts` at concepts it does not itself carry. These four cases pin the whole
// contract: an external link renders, a same-ID candidate outranks its approved self, an
// unresolvable relation still fails closed, and rendering stays byte-deterministic.
const EXTRA_SOURCE_PATH = "content/brain/books/batch-extra.md"
const EXTRA_SOURCE = "# Batch Extra\n\nA second source-backed batch assertion.\n"

function locatorFor(sourcePath, source, heading) {
  return {
    path: sourcePath,
    source_sha256: sha256(source),
    heading,
    start_line: 1,
    end_line: 3,
  }
}

// Applies the twelve-concept fixture batch so the approved knowledge tree carries concepts
// a follow-up batch can link to from outside its own candidate set.
async function approvedCorpus(context) {
  const first = await proposedBatch(context)
  await applyKnowledge({ root: first.root, run: first.run, approvedPath: first.approvedPath })
  await writeFile(path.join(first.root, EXTRA_SOURCE_PATH), EXTRA_SOURCE)
  return first
}

async function writeFollowUpBatch(root, relativePath, candidates, batchId) {
  const base = await readFile(path.join(root, "content/brain/books/batch.md"), "utf8")
  await writeFile(
    path.join(root, relativePath),
    `${JSON.stringify(
      {
        schema_version: 1,
        batch_id: batchId,
        scope: ["content/brain/books/batch.md", EXTRA_SOURCE_PATH],
        candidates: candidates(base),
        rejected_candidates: [],
      },
      null,
      2,
    )}\n`,
  )
  return relativePath
}

test("a follow-up batch links to approved concepts outside itself and keeps candidate data authoritative", async (context) => {
  const { root } = await approvedCorpus(context)
  const approvedHashes = await hashes(root, KNOWLEDGE)
  const beforeBatch0 = await readFile(path.join(root, KNOWLEDGE, "domain/batch-0.md"), "utf8")
  const beforeBatch3 = await readFile(path.join(root, KNOWLEDGE, "domain/batch-3.md"), "utf8")

  const run = ".omx/artifacts/brain-restructure/batch-external"
  const batchPath = await writeFollowUpBatch(
    root,
    "tooling/brain/fixtures/batch-external.json",
    (base) => [
      {
        // update: keeps its approved edge to a concept this batch does not carry, and adds
        // a second locator so evidence grows without the edge being dropped.
        concept_id: "domain.batch-0",
        title: "Batch Concept 0",
        aliases: ["Batch Alias 0"],
        canonical_path: `${KNOWLEDGE}/domain/batch-0.md`,
        tags: ["domain"],
        proposal_kind: "update",
        concept_granularity: "one revised batch fixture assertion",
        pilot_strata: ["fixture"],
        related_concepts: ["domain.batch-1"],
        locators: [
          locatorFor("content/brain/books/batch.md", base, "# Batch"),
          locatorFor(EXTRA_SOURCE_PATH, EXTRA_SOURCE, "# Batch Extra"),
        ],
      },
      {
        // update with a revised title: the candidate, not the approved document, must be
        // what a sibling candidate's rendered link reads.
        concept_id: "domain.batch-3",
        title: "Batch Concept 3 Revised",
        aliases: ["Batch Alias 3"],
        canonical_path: `${KNOWLEDGE}/domain/batch-3.md`,
        tags: ["domain"],
        proposal_kind: "update",
        concept_granularity: "one retitled batch fixture assertion",
        pilot_strata: ["fixture"],
        related_concepts: ["domain.batch-4"],
        locators: [locatorFor("content/brain/books/batch.md", base, "# Batch")],
      },
      {
        // create: links to an approved concept the batch does not carry, and to a concept
        // the batch does carry.
        concept_id: "domain.batch-new",
        title: "Batch Concept New",
        aliases: ["Batch Alias New"],
        canonical_path: `${KNOWLEDGE}/domain/batch-new.md`,
        tags: ["domain"],
        proposal_kind: "create",
        concept_granularity: "one new batch fixture assertion",
        pilot_strata: ["fixture"],
        related_concepts: ["domain.batch-2", "domain.batch-3"],
        locators: [locatorFor(EXTRA_SOURCE_PATH, EXTRA_SOURCE, "# Batch Extra")],
      },
    ],
    "fixture-batch-external",
  )

  await proposeKnowledge({ root, run, batchPath })
  const runAbsolute = path.join(root, run)

  // Deterministic rerun: the same inputs re-render the same run bytes.
  const firstRun = await hashes(root, run)
  await proposeKnowledge({ root, run, batchPath })
  assert.deepEqual(await hashes(root, run), firstRun)
  assert.deepEqual(await hashes(root, KNOWLEDGE), approvedHashes)

  const update = await readFile(path.join(runAbsolute, "proposals/domain.batch-0.md"), "utf8")
  // The approved external edge survives, and the added locator is real evidence.
  assert.match(update, /- \[\[brain\/knowledge\/domain\/batch-1\|Batch Concept 1\]\]/)
  assert.match(update, /A second source-backed batch assertion\./)
  assert.match(update, /Source-backed batch assertion\./)

  const created = await readFile(path.join(runAbsolute, "proposals/domain.batch-new.md"), "utf8")
  // External approved target renders from the approved index; the batch's own candidate
  // wins for the concept_id this batch also revises.
  assert.match(created, /- \[\[brain\/knowledge\/domain\/batch-2\|Batch Concept 2\]\]/)
  assert.match(created, /- \[\[brain\/knowledge\/domain\/batch-3\|Batch Concept 3 Revised\]\]/)
  assert.equal(created.includes("Batch Concept 3]]"), false)

  const manifestBytes = await readFile(path.join(runAbsolute, "proposal-manifest.json"), "utf8")
  const manifest = JSON.parse(manifestBytes)
  assert.equal(manifest.collision_count, 0)
  assert.equal(manifest.replaced_concept_count, 2)
  const byId = new Map(manifest.proposals.map((entry) => [entry.concept_id, entry]))
  assert.equal(byId.get("domain.batch-0").source_count, 2)
  assert.equal(byId.get("domain.batch-0").target_exists, true)
  assert.equal(byId.get("domain.batch-0").target_before_sha256, sha256(beforeBatch0))
  assert.equal(byId.get("domain.batch-3").target_before_sha256, sha256(beforeBatch3))
  assert.equal(byId.get("domain.batch-new").target_exists, false)
  assert.equal(byId.get("domain.batch-new").target_before_sha256, null)

  const provenance = await readJson(path.join(runAbsolute, "provenance-report.json"))
  assert.equal(provenance.status, "pass")
  assert.equal(provenance.unsupported_assertion_count, 0)
  const link = await readJson(path.join(runAbsolute, "link-report.json"))
  assert.equal(link.status, "pass")
  assert.equal(link.broken_knowledge_link_count, 0)

  // Pre-apply verification measures the same proposal bytes and must agree.
  assert.equal((await verifyKnowledgeRun({ root, run })).status, "pass")

  await sampleKnowledgeBatch({ root, run })
  const approvedPath = `${run}/approved-review.json`
  await writeJson(path.join(root, approvedPath), reviewFor(manifest, sha256(manifestBytes)))
  const applied = await applyKnowledge({ root, run, approvedPath })
  assert.equal(applied.status, "pass")
  assert.deepEqual(applied.applied.map((entry) => entry.operation).sort(), [
    "created",
    "modified",
    "modified",
  ])
  const appliedUpdate = await readFile(path.join(root, KNOWLEDGE, "domain/batch-0.md"), "utf8")
  assert.equal(sha256(appliedUpdate), byId.get("domain.batch-0").applied_sha256)
  assert.match(appliedUpdate, /- \[\[brain\/knowledge\/domain\/batch-1\|Batch Concept 1\]\]/)
  assert.equal((await verifyKnowledgeRun({ root, run })).status, "pass")

  const rollback = await rollbackKnowledgeApply({ root, run })
  assert.equal(rollback.status, "pass")
  assert.deepEqual(await hashes(root, KNOWLEDGE), approvedHashes)
})

test("a follow-up batch still fails closed on a related concept that exists nowhere", async (context) => {
  const { root } = await approvedCorpus(context)
  const approvedHashes = await hashes(root, KNOWLEDGE)
  const run = ".omx/artifacts/brain-restructure/batch-unknown-link"
  const batchPath = await writeFollowUpBatch(
    root,
    "tooling/brain/fixtures/batch-unknown-link.json",
    (base) => [
      {
        concept_id: "domain.batch-0",
        title: "Batch Concept 0",
        aliases: ["Batch Alias 0"],
        canonical_path: `${KNOWLEDGE}/domain/batch-0.md`,
        tags: ["domain"],
        proposal_kind: "update",
        concept_granularity: "one revised batch fixture assertion",
        pilot_strata: ["fixture"],
        related_concepts: ["domain.batch-1", "domain.batch-nowhere"],
        locators: [locatorFor("content/brain/books/batch.md", base, "# Batch")],
      },
    ],
    "fixture-batch-unknown-link",
  )
  await assert.rejects(
    proposeKnowledge({ root, run, batchPath }),
    /domain\.batch-0: unknown related concept domain\.batch-nowhere/,
  )
  assert.deepEqual(await hashes(root, KNOWLEDGE), approvedHashes)
  assert.equal(await exists(path.join(root, run)), false)
})
