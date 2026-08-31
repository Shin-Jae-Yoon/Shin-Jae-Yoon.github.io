// The one-time signed-U2 promotion path. Phase 4's generic `apply` stays permanently
// unavailable; `promote` is the only way a signed pilot ever reaches approved content, and
// every refusal below must happen before the first byte is written.
import assert from "node:assert/strict"
import { cp, mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import {
  applyKnowledge,
  promoteSignedPilot,
  proposeKnowledge,
  rollbackKnowledgeApply,
  verifyKnowledgeRun,
} from "./knowledge.mjs"
import { sha256, toPosix, walkFiles } from "./lib.mjs"

const KNOWLEDGE = "content/brain/knowledge"
const RUN = ".omx/artifacts/brain-restructure/pilot"
const REVIEWER = "신재윤"
const SIGNED_AT = "2026-08-13T00:00:00Z"
const REPO = path.resolve(import.meta.dirname, "../..")
const REAL_RUN = ".omx/artifacts/brain-restructure/pilot-20260812"

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

// Nine proposal-only candidates over one synthetic raw source — the smallest pilot the
// engine accepts. The related-concept chain stops before the last one so no candidate
// links outside the pilot set.
async function pilotFixture(context) {
  const root = await mkdtemp(path.join(os.tmpdir(), "brain-promote-"))
  context.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(path.join(root, KNOWLEDGE), { recursive: true })
  await mkdir(path.join(root, "content/brain/books"), { recursive: true })
  await mkdir(path.join(root, "tooling/brain/fixtures"), { recursive: true })
  await writeFile(path.join(root, KNOWLEDGE, "index.md"), "---\ntitle: Knowledge\n---\n")
  const raw = "# Pilot\n\nSource-backed pilot assertion.\n"
  const sourcePath = "content/brain/books/pilot.md"
  await writeFile(path.join(root, sourcePath), raw)
  const pilot = {
    schema_version: 1,
    candidates: Array.from({ length: 9 }, (_, index) => ({
      concept_id: `domain.pilot-${index}`,
      title: `Pilot Concept ${index}`,
      aliases: [`Pilot Alias ${index}`],
      canonical_path: `${KNOWLEDGE}/domain/pilot-${index}.md`,
      tags: ["domain"],
      proposal_kind: "create",
      concept_granularity: "one pilot fixture assertion",
      pilot_strata: ["fixture"],
      related_concepts: index < 8 ? [`domain.pilot-${index + 1}`] : [],
      locators: [
        {
          path: sourcePath,
          source_sha256: sha256(raw),
          heading: "# Pilot",
          start_line: 1,
          end_line: 3,
        },
      ],
    })),
    rejected_candidates: [
      {
        concept_id: "domain.pilot-rejected",
        title: "Pilot Rejected",
        reason_code: "insufficient-source-evidence",
        reason: "fixture rejection",
        sources: [{ path: sourcePath, source_sha256: sha256(raw) }],
      },
    ],
  }
  const pilotPath = "tooling/brain/fixtures/pilot.json"
  await writeFile(path.join(root, pilotPath), `${JSON.stringify(pilot, null, 2)}\n`)
  return { root, run: RUN, pilotPath, sourcePath, raw }
}

// The signed U2 record the owner produces by deciding every scaffolded proposal.
function signedReview(scaffold, decisions = {}) {
  const proposals = scaffold.proposals.map((entry) => {
    const decision = decisions[entry.concept_id] ?? "approve"
    return {
      ...entry,
      decision,
      critical_issues: [],
      reviewer: decision === "pending" ? null : REVIEWER,
      reviewed_at: decision === "pending" ? null : SIGNED_AT,
    }
  })
  return {
    ...scaffold,
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

async function proposedPilot(context, decisions = {}) {
  const fixture = await pilotFixture(context)
  const { root, run, pilotPath } = fixture
  await proposeKnowledge({ root, run, pilotPath })
  const runAbsolute = path.join(root, run)
  const reviewPath = path.join(runAbsolute, "pilot-review.json")
  const manifest = await readJson(path.join(runAbsolute, "proposal-manifest.json"))
  const scaffold = await readJson(reviewPath)
  const review = signedReview(scaffold, decisions)
  await writeJson(reviewPath, review)
  return { ...fixture, runAbsolute, reviewPath, manifest, scaffold, review }
}

async function assertZeroWrite(root, run, knowledgeBefore) {
  assert.deepEqual(await hashes(root, KNOWLEDGE), knowledgeBefore)
  assert.equal(await exists(path.join(root, run, "journal.jsonl")), false)
  assert.equal(await exists(path.join(root, run, "before-manifest.json")), false)
  assert.equal(await exists(path.join(root, run, "promotion-report.json")), false)
}

test("promotion refuses every unsigned, incomplete, malformed, or stale review with zero writes", async (context) => {
  const { root, run, runAbsolute, reviewPath, scaffold, manifest } = await proposedPilot(context)
  const knowledgeBefore = await hashes(root, KNOWLEDGE)
  const signed = signedReview(scaffold)
  const other = manifest.proposals[0].concept_id

  for (const [label, review, pattern] of [
    ["unsigned scaffold", scaffold, /pilot review is not signed/],
    [
      "signed but not approved",
      { ...signed, status: "awaiting_user_review" },
      /pilot review status is/,
    ],
    ["approved but unsigned", { ...signed, signed: false }, /pilot review is not signed/],
    ["wrong gate", { ...signed, gate: "U3" }, /pilot review gate is/],
    ["no reviewer", { ...signed, reviewer: "  " }, /records no reviewer/],
    ["no signed_at", { ...signed, signed_at: "" }, /records no signed_at/],
    ["critical issue count", { ...signed, critical_issue_count: 1 }, /critical issues/],
    [
      "incomplete review",
      (() => {
        const proposals = signed.proposals.map((entry, index) =>
          index === 0
            ? { ...entry, decision: "pending", reviewer: null, reviewed_at: null }
            : entry,
        )
        return {
          ...signed,
          proposals,
          reviewed_proposal_count: proposals.length - 1,
        }
      })(),
      /pilot review is incomplete/,
    ],
    [
      "counts disagree",
      {
        ...signed,
        reviewed_proposal_count: signed.proposals.length + 3,
        total_proposal_count: signed.proposals.length + 3,
      },
      /counts disagree/,
    ],
    [
      "stale proposal hash",
      {
        ...signed,
        proposals: signed.proposals.map((entry, index) =>
          index === 0 ? { ...entry, proposal_sha256: sha256("stale") } : entry,
        ),
      },
      /reviewed proposal hash differs from the manifest/,
    ],
    [
      "stale canonical path",
      {
        ...signed,
        proposals: signed.proposals.map((entry, index) =>
          index === 0 ? { ...entry, canonical_path: `${KNOWLEDGE}/domain/moved.md` } : entry,
        ),
      },
      /reviewed canonical path differs from the manifest/,
    ],
    [
      "unknown concept",
      {
        ...signed,
        proposals: signed.proposals.map((entry, index) =>
          index === 0 ? { ...entry, concept_id: "domain.not-in-manifest" } : entry,
        ),
      },
      /absent from the manifest/,
    ],
    [
      "missing proposal",
      (() => {
        const proposals = signed.proposals.slice(1)
        return {
          ...signed,
          proposals,
          reviewed_proposal_count: proposals.length,
          total_proposal_count: proposals.length,
        }
      })(),
      /is missing from the pilot review/,
    ],
    [
      "duplicate concept",
      (() => {
        const proposals = [...signed.proposals, signed.proposals[0]]
        return {
          ...signed,
          proposals,
          reviewed_proposal_count: proposals.length,
          total_proposal_count: proposals.length,
        }
      })(),
      /repeats a concept_id/,
    ],
    // Independent Phase 5 verification F2: a decision outside the contract is malformed,
    // not a silent exclusion.
    [
      "invalid decision",
      {
        ...signed,
        proposals: signed.proposals.map((entry, index) =>
          index === 0 ? { ...entry, decision: "modify" } : entry,
        ),
      },
      /decision must be approve, reject, or pending/,
    ],
    // Independent Phase 5 verification F2: one recorded critical issue rejects the batch,
    // however the top-level counter reads.
    [
      "inconsistent critical issues",
      {
        ...signed,
        proposals: signed.proposals.map((entry, index) =>
          index === 0 ? { ...entry, critical_issues: ["unresolved provenance gap"] } : entry,
        ),
      },
      /unresolved critical issue/,
    ],
    [
      "a rejected proposal",
      {
        ...signed,
        proposals: signed.proposals.map((entry, index) =>
          index === 8 ? { ...entry, decision: "reject" } : entry,
        ),
      },
      /must approve every proposal/,
    ],
  ]) {
    await writeJson(reviewPath, review)
    await assert.rejects(promoteSignedPilot({ root, run }), pattern, label)
    await assertZeroWrite(root, run, knowledgeBefore)
  }

  // The valid record still promotes, so the matrix above refused on shape, not on setup.
  await writeJson(reviewPath, signed)
  const promoted = await promoteSignedPilot({ root, run })
  assert.equal(promoted.status, "pass")
  assert.equal(promoted.applied_count, 9)
  assert.equal(promoted.gate, "U2")
  assert.equal(promoted.applied[0].concept_id, other)
  assert.equal((await readJson(path.join(runAbsolute, "promotion-report.json"))).applied_count, 9)
})

test("promotion fails closed with zero writes when a locked source drifts", async (context) => {
  const { root, run, sourcePath, raw } = await proposedPilot(context)
  const knowledgeBefore = await hashes(root, KNOWLEDGE)
  await writeFile(path.join(root, sourcePath), `${raw}drift\n`)
  await assert.rejects(promoteSignedPilot({ root, run }), /source drift/)
  await assertZeroWrite(root, run, knowledgeBefore)
})

test("promotion fails closed with zero writes when proposal bytes drift from the manifest", async (context) => {
  const { root, run, runAbsolute, manifest } = await proposedPilot(context)
  const knowledgeBefore = await hashes(root, KNOWLEDGE)
  const artifact = path.join(runAbsolute, manifest.proposals[0].artifact_path)
  await writeFile(artifact, `${await readFile(artifact, "utf8")}\nHand edit.\n`)
  await assert.rejects(promoteSignedPilot({ root, run }), /proposal bytes differ from the manifest/)
  await assertZeroWrite(root, run, knowledgeBefore)
})

test("promotion fails closed with zero writes when the approved tree drifts after propose", async (context) => {
  const { root, run } = await proposedPilot(context)
  await writeFile(
    path.join(root, KNOWLEDGE, "index.md"),
    "---\ntitle: Knowledge\n---\n\nDrifted after propose.\n",
  )
  const knowledgeBefore = await hashes(root, KNOWLEDGE)
  await assert.rejects(
    promoteSignedPilot({ root, run }),
    /approved knowledge content changed after proposal generation/,
  )
  await assertZeroWrite(root, run, knowledgeBefore)
})

test("promotion names the exact target when a canonical path appears after propose", async (context) => {
  const { root, run } = await proposedPilot(context)
  const squatter = path.join(root, KNOWLEDGE, "domain/pilot-4.md")
  await mkdir(path.dirname(squatter), { recursive: true })
  await writeFile(squatter, "---\ntitle: Hand written\n---\n")
  const knowledgeBefore = await hashes(root, KNOWLEDGE)
  await assert.rejects(
    promoteSignedPilot({ root, run }),
    /target drift for content\/brain\/knowledge\/domain\/pilot-4\.md \(expected no document\)/,
  )
  await assertZeroWrite(root, run, knowledgeBefore)
})

for (const fault of [
  { label: "after intent", faults: { faultAfterIntentOperations: 3 } },
  { label: "after mutation", faults: { faultAfterMutationOperations: 2 } },
]) {
  test(`interrupted promotion ${fault.label} rolls back byte-exact from its journal`, async (context) => {
    const { root, run, runAbsolute } = await proposedPilot(context)
    const knowledgeBefore = await hashes(root, KNOWLEDGE)
    await assert.rejects(
      promoteSignedPilot({ root, run, ...fault.faults }),
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
    assert.equal(before.promotion, "signed-u2-pilot")
    assert.equal(before.knowledge_tree_sha256.length, 64)
    assert.equal(await exists(path.join(runAbsolute, "promotion-report.json")), false)

    // Re-promoting over an interrupted journal is refused; rollback is the only way out.
    await assert.rejects(promoteSignedPilot({ root, run }), /interrupted promotion journal/)
    await assert.rejects(verifyKnowledgeRun({ root, run }), /interrupted promotion journal/)

    const rollback = await rollbackKnowledgeApply({ root, run })
    assert.equal(rollback.status, "pass")
    assert.deepEqual(await hashes(root, KNOWLEDGE), knowledgeBefore)
    assert.equal(rollback.restored_knowledge_tree_sha256, before.knowledge_tree_sha256)

    // A rolled-back run is spent: it verifies as pre-promotion and refuses a second try.
    const report = await verifyKnowledgeRun({ root, run })
    assert.equal(report.status, "pass")
    assert.equal(report.promoted, false)
    assert.equal(report.rolled_back, true)
    await assert.rejects(promoteSignedPilot({ root, run }), /was rolled back; propose a new run/)
  })
}

test("promotion writes the approved documents, verifies, re-runs as a no-op, and rolls back byte-exact", async (context) => {
  const { root, run, runAbsolute, manifest, reviewPath } = await proposedPilot(context)
  const knowledgeBefore = await hashes(root, KNOWLEDGE)

  const result = await promoteSignedPilot({ root, run })
  assert.equal(result.status, "pass")
  assert.equal(result.applied_count, 9)
  assert.equal(result.excluded_count, 0)
  assert.equal(result.mode, "proposal-only")
  assert.equal(result.reviewer, REVIEWER)
  assert.equal(
    result.approved_review_sha256,
    sha256(await readFile(reviewPath, "utf8")),
    "the promotion is bound to the exact signed review bytes",
  )

  // Exactly the reviewed proposals landed, at their promoted bytes, and the only
  // difference from the reviewed proposal is the promoted status line.
  for (const proposal of manifest.proposals) {
    const applied = await readFile(path.join(root, proposal.canonical_path), "utf8")
    const reviewed = await readFile(path.join(runAbsolute, proposal.artifact_path), "utf8")
    assert.match(applied, /^proposal_status: approved$/m)
    assert.doesNotMatch(applied, /awaiting_user_review/)
    assert.equal(
      applied,
      reviewed.replace("proposal_status: awaiting_user_review", "proposal_status: approved"),
    )
    const record = result.applied.find((entry) => entry.concept_id === proposal.concept_id)
    assert.equal(sha256(applied), record.applied_sha256)
    assert.equal(record.proposal_sha256, proposal.proposal_sha256)
  }

  const verification = await verifyKnowledgeRun({ root, run })
  assert.equal(verification.status, "pass")
  assert.equal(verification.promoted, true)
  assert.equal(verification.promoted_count, 9)
  assert.equal(verification.u2_state, "signed")
  assert.equal(verification.ac13_status, "recorded_user_u2")
  assert.equal(verification.provenance_coverage_percent, 100)
  assert.equal(verification.collision_count, 0)
  assert.equal(verification.broken_knowledge_link_count, 0)
  assert.equal(verification.graph_source_leakage_count, 0)
  assert.equal(verification.public_alias_route_count, 0)

  // Promoting the same signed review again is a measured no-op, not a second write.
  const promotedHashes = await hashes(root, KNOWLEDGE)
  const rerun = await promoteSignedPilot({ root, run })
  assert.equal(rerun.status, "noop")
  assert.equal(rerun.applied_count, 9)
  assert.deepEqual(await hashes(root, KNOWLEDGE), promotedHashes)

  const rollback = await rollbackKnowledgeApply({ root, run })
  assert.equal(rollback.status, "pass")
  assert.equal(rollback.restored_count, 9)
  assert.deepEqual(await hashes(root, KNOWLEDGE), knowledgeBefore)
})

test("verify measures the promoted tree and fails when it or its signed evidence is edited", async (context) => {
  const { root, run, reviewPath } = await proposedPilot(context)
  await promoteSignedPilot({ root, run })

  const target = path.join(root, KNOWLEDGE, "domain/pilot-2.md")
  const promotedBytes = await readFile(target, "utf8")
  await writeFile(target, `${promotedBytes}\nHand edit.\n`)
  await assert.rejects(verifyKnowledgeRun({ root, run }), /applied bytes differ/)
  await assert.rejects(promoteSignedPilot({ root, run }), /promoted state drifted/)
  await writeFile(target, promotedBytes)

  // A promoted document that loses its approved status is not a promoted document.
  await writeFile(
    target,
    promotedBytes.replace("proposal_status: approved", "proposal_status: awaiting_user_review"),
  )
  await assert.rejects(verifyKnowledgeRun({ root, run }), /applied bytes differ/)
  await writeFile(target, promotedBytes)

  // Deleting a promoted document is drift, not a fresh promotion opportunity.
  await rm(target)
  await assert.rejects(verifyKnowledgeRun({ root, run }), /applied document is missing/)
  await writeFile(target, promotedBytes)

  // The signed review is the evidence the promotion is bound to; changing it invalidates
  // the promoted state even though the content is untouched.
  const reviewBytes = await readFile(reviewPath, "utf8")
  await writeFile(reviewPath, reviewBytes.replace(REVIEWER, "다른 사람"))
  await assert.rejects(verifyKnowledgeRun({ root, run }), /signed review evidence changed/)
  await writeFile(reviewPath, reviewBytes)
  assert.equal((await verifyKnowledgeRun({ root, run })).status, "pass")
})

test("verify accepts an unsigned or a validly signed U2 run and fails closed in between", async (context) => {
  const { root, run, reviewPath, scaffold, manifest } = await proposedPilot(context)

  // The unsigned handoff scaffold still verifies, and still reads as pending U2.
  await writeJson(reviewPath, scaffold)
  const unsigned = await verifyKnowledgeRun({ root, run })
  assert.equal(unsigned.status, "pass")
  assert.equal(unsigned.u2_state, "unsigned")
  assert.equal(unsigned.ac13_status, "pending_user_u2")
  assert.equal(unsigned.promoted, false)

  // A valid signed record verifies too — the state this whole lane exists to unblock.
  const signed = signedReview(scaffold)
  await writeJson(reviewPath, signed)
  const valid = await verifyKnowledgeRun({ root, run })
  assert.equal(valid.status, "pass")
  assert.equal(valid.u2_state, "signed")
  assert.equal(valid.ac13_status, "recorded_user_u2")

  // Everything between the two valid shapes fails closed.
  for (const [label, review, pattern] of [
    ["signed but pending", { ...signed, status: "awaiting_user_review" }, /pilot review status is/],
    ["approved but unsigned", { ...signed, signed: false }, /must be either unsigned/],
    ["signed with no reviewer", { ...signed, reviewer: null }, /records no reviewer/],
    ["signed with a critical issue", { ...signed, critical_issue_count: 2 }, /critical issues/],
    [
      "signed with an undecided proposal",
      {
        ...signed,
        reviewed_proposal_count: signed.proposals.length - 1,
        proposals: signed.proposals.map((entry, index) =>
          index === 1 ? { ...entry, decision: "pending" } : entry,
        ),
      },
      /pilot review is incomplete/,
    ],
    [
      "signed with an invalid decision",
      {
        ...signed,
        proposals: signed.proposals.map((entry, index) =>
          index === 1 ? { ...entry, decision: "approved" } : entry,
        ),
      },
      /decision must be approve, reject, or pending/,
    ],
    [
      "signed over a stale proposal hash",
      {
        ...signed,
        proposals: signed.proposals.map((entry, index) =>
          index === 2 ? { ...entry, proposal_sha256: sha256("stale") } : entry,
        ),
      },
      /reviewed proposal hash differs from the manifest/,
    ],
  ]) {
    await writeJson(reviewPath, review)
    await assert.rejects(verifyKnowledgeRun({ root, run }), pattern, label)
  }

  // A `reject` decision is a valid signed review — verify accepts it, promotion does not.
  await writeJson(
    reviewPath,
    signedReview(scaffold, { [manifest.proposals[8].concept_id]: "reject" }),
  )
  assert.equal((await verifyKnowledgeRun({ root, run })).u2_state, "signed")
  await assert.rejects(promoteSignedPilot({ root, run }), /must approve every proposal/)
})

test("generic phase 4 apply stays unavailable before and after promotion", async (context) => {
  const { root, run, reviewPath, scaffold } = await proposedPilot(context)

  // Unsigned: apply refuses on the review gate, exactly as it did before this lane.
  await writeJson(reviewPath, scaffold)
  await assert.rejects(applyKnowledge({ root, run }), /apply refused: U2 pilot review/)
  await assert.rejects(
    applyKnowledge({ root, run, approvedPath: `${run}/pilot-review.json` }),
    /apply refused: U2 pilot review/,
  )

  // Signed: apply still refuses. A signed pilot is written by `promote`, never by `apply`.
  await writeJson(reviewPath, signedReview(scaffold))
  const knowledgeBefore = await hashes(root, KNOWLEDGE)
  await assert.rejects(applyKnowledge({ root, run }), /apply is intentionally unavailable/)
  await assert.rejects(
    applyKnowledge({ root, run, approvedPath: `${run}/pilot-review.json` }),
    /apply is intentionally unavailable/,
  )
  await assertZeroWrite(root, run, knowledgeBefore)

  // And after promotion it is still unavailable, not a second write path.
  await promoteSignedPilot({ root, run })
  await assert.rejects(applyKnowledge({ root, run }), /apply is intentionally unavailable/)
})

// The real signed U2 pilot, replayed byte-for-byte in an isolated copy. Nothing in this
// test touches the repository: the run artifacts, the signed review, and the four raw
// sources are copied into a temporary root, and the promotion is measured there.
test("the real signed U2 pilot replays at its exact recorded hashes", async (context) => {
  const realRun = path.join(REPO, REAL_RUN)
  if (!(await exists(path.join(realRun, "pilot-review.json")))) {
    context.skip("the real pilot run is not present in this checkout")
    return
  }
  const root = await mkdtemp(path.join(os.tmpdir(), "brain-real-pilot-"))
  context.after(() => rm(root, { recursive: true, force: true }))

  const manifestBytes = await readFile(path.join(realRun, "proposal-manifest.json"), "utf8")
  const manifest = JSON.parse(manifestBytes)
  const reviewBytes = await readFile(path.join(realRun, "pilot-review.json"), "utf8")
  assert.equal(manifest.mode, "proposal-only")
  assert.equal(
    sha256(reviewBytes),
    "effbcf93ca6607f93189111eabbb618c6acf81a97f4e96733eb1a75736233ae4",
    "the signed U2 record must still be the one recorded in brain-u2-signature-verification.md",
  )

  // Copy only what the engine reads: the knowledge baseline, the cited raw sources, the
  // run's proposal artifacts and JSON records, and the eleven staged overlay files.
  const copy = async (relative) => {
    await mkdir(path.dirname(path.join(root, relative)), { recursive: true })
    await cp(path.join(REPO, relative), path.join(root, relative), { recursive: true })
  }
  await copy(`${KNOWLEDGE}/index.md`)
  const sources = new Set()
  for (const proposal of manifest.proposals) {
    const markdown = await readFile(path.join(realRun, proposal.artifact_path), "utf8")
    for (const match of markdown.matchAll(/^ {2}- path: (.+)$/gm)) sources.add(match[1].trim())
  }
  assert.equal(sources.size, 4)
  for (const source of sources) await copy(source)
  for (const record of [
    "proposal-manifest.json",
    "pilot-review.json",
    "rejected-candidates.json",
  ]) {
    await copy(`${REAL_RUN}/${record}`)
  }
  await copy(`${REAL_RUN}/proposals`)
  for (const proposal of manifest.proposals) {
    await copy(`${REAL_RUN}/stage/${proposal.canonical_path}`)
  }

  // The recorded baseline reproduces exactly in the isolated copy.
  const run = REAL_RUN
  const runAbsolute = path.join(root, run)
  assert.equal(
    sha256(await readFile(path.join(runAbsolute, "proposal-manifest.json"), "utf8")),
    sha256(manifestBytes),
  )
  for (const proposal of manifest.proposals) {
    assert.equal(
      sha256(await readFile(path.join(runAbsolute, proposal.artifact_path), "utf8")),
      proposal.proposal_sha256,
      `${proposal.concept_id}: replayed proposal bytes`,
    )
  }

  // The real signed record verifies as a signed U2 run — the state that used to fail.
  const preVerification = await verifyKnowledgeRun({ root, run })
  assert.equal(preVerification.status, "pass")
  assert.equal(preVerification.u2_state, "signed")
  assert.equal(preVerification.proposal_count, 11)
  assert.equal(preVerification.provenance_coverage_percent, 100)

  const knowledgeBefore = await hashes(root, KNOWLEDGE)
  const result = await promoteSignedPilot({ root, run })
  assert.equal(result.status, "pass")
  assert.equal(result.applied_count, 11)
  assert.equal(result.reviewer, "신재윤")
  assert.equal(result.before_knowledge_tree_sha256, manifest.approved_knowledge_tree_sha256)
  assert.equal(
    result.approved_review_sha256,
    "effbcf93ca6607f93189111eabbb618c6acf81a97f4e96733eb1a75736233ae4",
  )

  // Every promoted document is its reviewed proposal with exactly one line changed.
  const review = JSON.parse(reviewBytes)
  const reviewed = new Map(review.proposals.map((entry) => [entry.concept_id, entry]))
  for (const proposal of manifest.proposals) {
    const source = await readFile(path.join(runAbsolute, proposal.artifact_path), "utf8")
    const applied = await readFile(path.join(root, proposal.canonical_path), "utf8")
    assert.equal(
      applied,
      source.replace("proposal_status: awaiting_user_review", "proposal_status: approved"),
    )
    assert.equal(reviewed.get(proposal.concept_id).proposal_sha256, proposal.proposal_sha256)
    assert.equal(reviewed.get(proposal.concept_id).decision, "approve")
  }

  const verification = await verifyKnowledgeRun({ root, run })
  assert.equal(verification.status, "pass")
  assert.equal(verification.promoted, true)
  assert.equal(verification.promoted_count, 11)
  assert.equal(verification.provenance_coverage_percent, 100)
  assert.equal(verification.collision_count, 0)
  assert.equal(verification.broken_knowledge_link_count, 0)
  assert.equal(verification.graph_source_leakage_count, 0)

  assert.equal((await promoteSignedPilot({ root, run })).status, "noop")
  const rollback = await rollbackKnowledgeApply({ root, run })
  assert.equal(rollback.status, "pass")
  assert.equal(rollback.restored_count, 11)
  assert.deepEqual(await hashes(root, KNOWLEDGE), knowledgeBefore)
  assert.equal(rollback.restored_knowledge_tree_sha256, manifest.approved_knowledge_tree_sha256)
})

// Independent Phase 5 verification, D1: the journal is created and fsynced before the
// first `intent`, so an interruption inside that window leaves a valid zero-byte journal.
// It used to classify as `interrupted` forever — rollback had no operations to undo, so it
// reported `pass` without changing anything and the next promotion refused identically.
// Rollback now finalizes the journal, and a journal finalized with zero operations names a
// run that never mutated anything and may be started again.
for (const arrival of [
  {
    label: "an injected pre-intent interruption",
    async reach(root, run) {
      await assert.rejects(
        promoteSignedPilot({ root, run, faultBeforeFirstIntent: true }),
        /injected apply interruption before the first intent/,
      )
    },
  },
  {
    // The exact on-disk state the independent review reproduced: whatever produced it, a
    // zero-byte journal is classified by its bytes, not by how it was reached.
    label: "a hand-truncated zero-byte journal",
    async reach(root, run) {
      await assert.rejects(
        promoteSignedPilot({ root, run, faultBeforeFirstIntent: true }),
        /injected apply interruption/,
      )
      await writeFile(path.join(root, run, "journal.jsonl"), "")
    },
  },
]) {
  test(`a promotion interrupted before its first intent recovers through rollback from ${arrival.label}`, async (context) => {
    const { root, run, runAbsolute } = await proposedPilot(context)
    const knowledgeBefore = await hashes(root, KNOWLEDGE)
    const journalPath = path.join(runAbsolute, "journal.jsonl")
    await arrival.reach(root, run)

    // The crash window: a journal exists, is zero bytes, and the before snapshot that
    // makes rollback possible is already durable.
    assert.equal(await readFile(journalPath, "utf8"), "")
    const before = await readJson(path.join(runAbsolute, "before-manifest.json"))
    assert.equal(before.promotion, "signed-u2-pilot")
    assert.equal(await exists(path.join(runAbsolute, "promotion-report.json")), false)
    assert.deepEqual(await hashes(root, KNOWLEDGE), knowledgeBefore)

    // Before rollback the run is interrupted, exactly as any other interruption.
    await assert.rejects(promoteSignedPilot({ root, run }), /interrupted promotion journal/)
    await assert.rejects(verifyKnowledgeRun({ root, run }), /interrupted promotion journal/)

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

    // A reset run verifies as the pre-promotion run it still is.
    const reverified = await verifyKnowledgeRun({ root, run })
    assert.equal(reverified.status, "pass")
    assert.equal(reverified.run_state, "reset")
    assert.equal(reverified.promoted, false)
    assert.equal(reverified.rolled_back, false)
    assert.equal(reverified.u2_state, "signed")

    // And the retry the old lifecycle made impossible now succeeds under every guard.
    const retry = await promoteSignedPilot({ root, run })
    assert.equal(retry.status, "pass")
    assert.equal(retry.applied_count, 9)
    const verification = await verifyKnowledgeRun({ root, run })
    assert.equal(verification.status, "pass")
    assert.equal(verification.promoted, true)
    assert.equal(verification.run_state, "completed")
    assert.equal(verification.promoted_count, 9)
    assert.equal((await promoteSignedPilot({ root, run })).status, "noop")

    const undo = await rollbackKnowledgeApply({ root, run })
    assert.equal(undo.status, "pass")
    assert.equal(undo.run_state, "rolled_back")
    assert.equal(undo.restored_count, 9)
    assert.deepEqual(await hashes(root, KNOWLEDGE), knowledgeBefore)
    await assert.rejects(promoteSignedPilot({ root, run }), /was rolled back; propose a new run/)
  })
}

// Independent Phase 5 verification, D2: the completion marker used to be fsynced before
// the report it makes mandatory, so a crash in between classified the run as complete
// while rerun and verify threw ENOENT. The order is now report-then-marker, and this test
// pins the repaired boundary: the surviving state is interrupted, never complete.
test("a promotion interrupted between its report and its completion marker never reads as complete", async (context) => {
  const { root, run, runAbsolute } = await proposedPilot(context)
  const knowledgeBefore = await hashes(root, KNOWLEDGE)
  const reportPath = path.join(runAbsolute, "promotion-report.json")

  await assert.rejects(
    promoteSignedPilot({ root, run, faultBeforeCompletionMarker: true }),
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

  await assert.rejects(promoteSignedPilot({ root, run }), /interrupted promotion journal/)
  await assert.rejects(verifyKnowledgeRun({ root, run }), /interrupted promotion journal/)

  const rollback = await rollbackKnowledgeApply({ root, run })
  assert.equal(rollback.status, "pass")
  assert.equal(rollback.run_state, "rolled_back")
  assert.equal(rollback.restored_count, 9)
  assert.deepEqual(await hashes(root, KNOWLEDGE), knowledgeBefore)

  // The unbound report described a run that has now been undone; it does not survive it.
  assert.equal(await exists(reportPath), false)
  const verification = await verifyKnowledgeRun({ root, run })
  assert.equal(verification.status, "pass")
  assert.equal(verification.promoted, false)
  assert.equal(verification.rolled_back, true)
  await assert.rejects(promoteSignedPilot({ root, run }), /was rolled back; propose a new run/)
})

// Independent Phase 5 verification, D2 (second half): a completed run must never depend on
// a file it cannot check. The marker binds the report's exact bytes, so a report that is
// deleted, truncated, or edited is refused by name — not as a raw ENOENT, and never
// silently trusted — while rollback stays available and nothing is written.
test("a completed promotion whose report is missing or altered refuses by name with zero writes", async (context) => {
  const { root, run, runAbsolute } = await proposedPilot(context)
  const knowledgeBefore = await hashes(root, KNOWLEDGE)
  const reportPath = path.join(runAbsolute, "promotion-report.json")
  await promoteSignedPilot({ root, run })
  const promotedHashes = await hashes(root, KNOWLEDGE)
  const reportBytes = await readFile(reportPath, "utf8")

  // The completion marker is bound to the exact report bytes it was written after.
  const completion = (await readFile(path.join(runAbsolute, "journal.jsonl"), "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line))
    .find((entry) => entry.state === "apply-completed")
  assert.equal(completion.report, "promotion-report.json")
  assert.equal(completion.reportSha256, sha256(reportBytes))

  for (const [label, mutate, pattern] of [
    ["missing report", async () => rm(reportPath), /promotion-report\.json is missing/],
    [
      "truncated report",
      async () => writeFile(reportPath, reportBytes.slice(0, 120)),
      /promotion-report\.json bytes differ from the completion marker/,
    ],
    [
      "edited but well-formed report",
      async () =>
        writeFile(reportPath, reportBytes.replace('"applied_count": 9', '"applied_count": 3')),
      /promotion-report\.json bytes differ from the completion marker/,
    ],
  ]) {
    await mutate()
    await assert.rejects(promoteSignedPilot({ root, run }), pattern, label)
    await assert.rejects(verifyKnowledgeRun({ root, run }), pattern, label)
    // The refusal is a named lifecycle error, not a filesystem error escaping re-entry.
    const error = await promoteSignedPilot({ root, run }).catch((caught) => caught)
    assert.equal(error.code, undefined, label)
    assert.match(error.message, /^promotion refused: /, label)
    assert.deepEqual(await hashes(root, KNOWLEDGE), promotedHashes, label)
  }

  // Restoring the exact bytes restores the verified no-op the contract promises.
  await writeFile(reportPath, reportBytes)
  assert.equal((await promoteSignedPilot({ root, run })).status, "noop")
  assert.equal((await verifyKnowledgeRun({ root, run })).status, "pass")
  assert.deepEqual(await hashes(root, KNOWLEDGE), promotedHashes)

  // And a completed run whose report is gone is still rollback-recoverable, byte-exactly.
  await rm(reportPath)
  const rollback = await rollbackKnowledgeApply({ root, run })
  assert.equal(rollback.status, "pass")
  assert.equal(rollback.restored_count, 9)
  assert.deepEqual(await hashes(root, KNOWLEDGE), knowledgeBefore)
})

// A completed-run refusal writes nothing at all: not the approved tree, and not the run's
// own artifacts. `verify` legitimately rewrites its reports, so only re-entry is measured
// this way.
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

// Independent Phase 5 verification, finding 2 (HIGH) — the promotion half. Re-entry checked
// manifest identity, review bytes, applied content, tree, and provenance, but never re-read
// the proposal artifacts, so an altered proposal returned `noop` while `verify` refused.
// Both now run the one authoritative completed-state checker over the same evidence set.
test("a completed promotion refuses post-completion drift on every evidence surface from both verify and rerun", async (context) => {
  const { root, run, runAbsolute, reviewPath, sourcePath, raw } = await proposedPilot(context)
  await promoteSignedPilot({ root, run })
  const promotedHashes = await hashes(root, KNOWLEDGE)

  const surfaces = [
    {
      label: "proposal artifact bytes",
      file: path.join(runAbsolute, "proposals/domain.pilot-2.md"),
      mutate: (bytes) => `${bytes}\nHand edit after promotion.\n`,
      pattern: /domain\.pilot-2: proposal bytes differ from manifest/,
    },
    {
      label: "locked source bytes",
      file: path.join(root, sourcePath),
      mutate: () => `${raw}drift after promotion\n`,
      pattern: /source drift|locator drift|exact source span/,
    },
    {
      label: "signed review bytes",
      file: reviewPath,
      mutate: (bytes) => bytes.replace(REVIEWER, "다른 사람"),
      pattern: /signed review evidence changed after promotion/,
    },
    {
      label: "proposal manifest bytes",
      file: path.join(runAbsolute, "proposal-manifest.json"),
      mutate: (bytes) => bytes.replace('"accepted_count": 9', '"accepted_count": 8'),
      pattern: /promotion report is bound to different proposal manifest bytes/,
    },
    {
      label: "promoted document bytes",
      file: path.join(root, KNOWLEDGE, "domain/pilot-3.md"),
      mutate: (bytes) => `${bytes}\nHand edit.\n`,
      pattern: /domain\.pilot-3: applied bytes differ from the apply report/,
    },
  ]

  for (const surface of surfaces) {
    const original = await readFile(surface.file, "utf8")
    await writeFile(surface.file, surface.mutate(original))
    const runBefore = await hashes(root, run)
    const knowledgeNow = await hashes(root, KNOWLEDGE)

    const refusal = await promoteSignedPilot({ root, run }).catch((caught) => caught)
    assert.ok(refusal instanceof Error, surface.label)
    assert.match(refusal.message, /^promotion refused: promoted state drifted:/, surface.label)
    assert.match(refusal.message, surface.pattern, surface.label)
    assert.equal(refusal.code, undefined, surface.label)
    await assertNoWriteAnywhere(root, run, knowledgeNow, runBefore, surface.label)

    // The refusal is deterministic: the same drift refuses identically on every call.
    const again = await promoteSignedPilot({ root, run }).catch((caught) => caught)
    assert.equal(again.message, refusal.message, surface.label)

    await assert.rejects(verifyKnowledgeRun({ root, run }), surface.pattern, surface.label)

    await writeFile(surface.file, original)
    assert.equal((await promoteSignedPilot({ root, run })).status, "noop", surface.label)
    assert.equal((await verifyKnowledgeRun({ root, run })).status, "pass", surface.label)
    assert.deepEqual(await hashes(root, KNOWLEDGE), promotedHashes, surface.label)
  }

  // A deleted proposal artifact is drift, not an absence of evidence to check.
  await rm(path.join(runAbsolute, "proposals/domain.pilot-5.md"))
  await assert.rejects(
    promoteSignedPilot({ root, run }),
    /domain\.pilot-5: proposal artifact is missing/,
  )
  await assert.rejects(
    verifyKnowledgeRun({ root, run }),
    /domain\.pilot-5: proposal artifact is missing/,
  )
  assert.deepEqual(await hashes(root, KNOWLEDGE), promotedHashes)
})

// A signed review that stops approving a promoted proposal is drift even though its
// recorded hash still matches nothing else changed — the completed state is measured
// against the *current* decision contract, not against the one it was written under.
test("a completed promotion refuses a signed review that no longer satisfies the U2 contract", async (context) => {
  const { root, run, runAbsolute, reviewPath, scaffold } = await proposedPilot(context)
  const promoted = await promoteSignedPilot({ root, run })
  const promotedHashes = await hashes(root, KNOWLEDGE)
  const reportPath = path.join(runAbsolute, "promotion-report.json")

  // Rewriting the review and re-binding the report to its new bytes isolates the decision
  // contract from the byte-identity guard: only the contract can refuse this.
  const rebind = async (review) => {
    await writeJson(reviewPath, review)
    const report = {
      ...promoted,
      approved_review_sha256: sha256(await readFile(reviewPath, "utf8")),
    }
    const bytes = `${JSON.stringify(report, null, 2)}\n`
    await writeFile(reportPath, bytes)
    const journalPath = path.join(runAbsolute, "journal.jsonl")
    await writeFile(
      journalPath,
      journalText(
        journalLines(await readFile(journalPath, "utf8")).map((entry) =>
          entry.state === "apply-completed" ? { ...entry, reportSha256: sha256(bytes) } : entry,
        ),
      ),
    )
  }

  for (const [label, review, pattern] of [
    [
      "a rejected proposal",
      signedReview(scaffold, { "domain.pilot-4": "reject" }),
      /domain\.pilot-4: promoted proposal is not approved by the current signed review/,
    ],
    [
      "an out-of-contract decision",
      signedReview(scaffold, { "domain.pilot-4": "modify" }),
      /decision must be approve, reject, or pending/,
    ],
    [
      "a recorded critical issue",
      (() => {
        const value = signedReview(scaffold)
        return {
          ...value,
          proposals: value.proposals.map((entry, index) =>
            index === 0 ? { ...entry, critical_issues: ["unresolved provenance gap"] } : entry,
          ),
        }
      })(),
      /unresolved critical issue/,
    ],
    [
      "an unsigned record",
      { ...signedReview(scaffold), signed: false },
      /pilot review is not signed/,
    ],
  ]) {
    await rebind(review)
    const runBefore = await hashes(root, run)
    await assert.rejects(promoteSignedPilot({ root, run }), pattern, label)
    await assertNoWriteAnywhere(root, run, promotedHashes, runBefore, label)
    await assert.rejects(verifyKnowledgeRun({ root, run }), pattern, label)
    assert.deepEqual(await hashes(root, KNOWLEDGE), promotedHashes, label)
  }

  await rebind(signedReview(scaffold))
  assert.equal((await promoteSignedPilot({ root, run })).status, "noop")
  assert.equal((await verifyKnowledgeRun({ root, run })).status, "pass")
  assert.deepEqual(await hashes(root, KNOWLEDGE), promotedHashes)
})

// Independent Phase 5 verification, finding 3 (MEDIUM) — the promotion half, over the exact
// journal probes the independent review ran against the real signed pilot.
test("a malformed promotion journal fails closed by name on promote, verify, and rollback", async (context) => {
  const { root, run, runAbsolute } = await proposedPilot(context)
  await promoteSignedPilot({ root, run })
  const promotedHashes = await hashes(root, KNOWLEDGE)
  const journalPath = path.join(runAbsolute, "journal.jsonl")
  const canonical = await readFile(journalPath, "utf8")
  const records = journalLines(canonical)
  const completion = records.find((entry) => entry.state === "apply-completed")
  const intents = records.filter((entry) => entry.state === "intent")
  // 9 proposals plus the one journalled directory creation.
  assert.equal(intents.length, 10)

  for (const [label, text, pattern] of [
    [
      "an unknown but well-formed record",
      `${canonical}${JSON.stringify({ state: "unknown-independent-record" })}\n`,
      /journal\.jsonl is invalid: line 22 records unknown state "unknown-independent-record"/,
    ],
    [
      "a partial JSON append",
      `${canonical}{"state":"rollback-fin`,
      /journal\.jsonl is invalid: line 22 is not valid JSON \(truncated or corrupt\)/,
    ],
    [
      "a rollback finalized over a completed run that was never undone",
      `${canonical}${JSON.stringify({
        state: "rollback-finalized",
        operationCount: intents.length,
        restoredCount: intents.length,
        restoredDirectoryCount: 0,
        noopCount: 0,
        knowledgeTreeSha256: sha256("forged"),
      })}\n`,
      /journal\.jsonl is invalid: line 22 finalizes a rollback of a completed run with 10 operation\(s\) still applied/,
    ],
    [
      "a completion marker over an incomplete operation set",
      journalText([intents[0], completion]),
      /journal\.jsonl is invalid: line 2 apply-completed claims 10 operation\(s\) over 0 completed of 1 journalled/,
    ],
    [
      "an intent that names no path",
      journalText(records.map((entry, index) => (index === 0 ? { ...entry, path: "" } : entry))),
      /journal\.jsonl is invalid: line 1 intent names no path/,
    ],
    [
      "a created file intent with no post hash",
      journalText(
        records.map((entry) =>
          entry.state === "intent" && entry.entryType === "file"
            ? { ...entry, postSha256: "not-a-hash" }
            : entry,
        ),
      ),
      /journal\.jsonl is invalid: line 3 created file intent has no postSha256/,
    ],
  ]) {
    await writeFile(journalPath, text)
    const runBefore = await hashes(root, run)
    for (const call of [
      () => promoteSignedPilot({ root, run }),
      () => verifyKnowledgeRun({ root, run }),
      () => rollbackKnowledgeApply({ root, run }),
    ]) {
      const error = await call().catch((caught) => caught)
      assert.ok(error instanceof Error, label)
      assert.equal(error.name, "JournalGrammarError", label)
      assert.equal(error.code, undefined, label)
      assert.match(error.message, pattern, label)
    }
    await assertNoWriteAnywhere(root, run, promotedHashes, runBefore, label)
  }

  // Restoring the canonical journal restores the verified no-op, and the legal
  // completion-plus-rollback journal a real rollback produces still classifies correctly.
  await writeFile(journalPath, canonical)
  assert.equal((await promoteSignedPilot({ root, run })).status, "noop")
  assert.equal((await verifyKnowledgeRun({ root, run })).status, "pass")
  const rollback = await rollbackKnowledgeApply({ root, run })
  assert.equal(rollback.status, "pass")
  assert.equal(rollback.run_state, "rolled_back")
  assert.equal(rollback.restored_count, 9)
  const settled = journalLines(await readFile(journalPath, "utf8"))
  assert.ok(settled.some((entry) => entry.state === "apply-completed"))
  assert.ok(settled.some((entry) => entry.state === "rollback-finalized"))
  assert.equal((await verifyKnowledgeRun({ root, run })).run_state, "rolled_back")
  await assert.rejects(promoteSignedPilot({ root, run }), /was rolled back; propose a new run/)
})

// Independent Phase 5 completed-state repair verification, C3 (BLOCKING) — the promotion
// half. Both write paths share one journal format and one parser, so a phase-order hole in
// one is a hole in the other; this proves the repair on `promote`'s own public entry points.
test("the promotion journal grammar refuses contradictory apply/rollback phase order with zero writes", async (context) => {
  const { root, run, runAbsolute } = await proposedPilot(context)
  const knowledgeBefore = await hashes(root, KNOWLEDGE)
  await promoteSignedPilot({ root, run })
  const promotedHashes = await hashes(root, KNOWLEDGE)
  const journalPath = path.join(runAbsolute, "journal.jsonl")
  const canonical = await readFile(journalPath, "utf8")
  const records = journalLines(canonical)
  const completion = records.find((entry) => entry.state === "apply-completed")
  const intents = records.filter((entry) => entry.state === "intent")
  const completions = records.filter((entry) => entry.state === "completed")
  // 9 proposals plus the one journalled directory creation.
  assert.equal(intents.length, 10)
  assert.equal(completions.length, 10)
  assert.equal(records.length, 21)
  const applyPhase = records.filter((entry) => entry.state !== "apply-completed")
  const rolledBack = (id) => ({ id, state: "rollback-completed", action: "restored" })

  for (const [label, text, pattern] of [
    // The independent report's public-API reordering, over the promotion journal.
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
    [
      "the completion marker moved behind the rollback records",
      journalText([...applyPhase, ...intents.map((entry) => rolledBack(entry.id)), completion]),
      /journal\.jsonl is invalid: line 31 records apply-completed after the rollback record at line 21/,
    ],
    [
      "a completed record for an intent already rolled back",
      journalText(
        applyPhase.flatMap((entry) =>
          entry.state === "intent" ? [entry, rolledBack(entry.id)] : [entry],
        ),
      ),
      /journal\.jsonl is invalid: line 3 completes intent 1 already recorded rolled back at line 2/,
    ],

    // Direct grammar regressions over hand-built record sequences.
    [
      "a completion marker after a single rollback record",
      journalText([intents[0], completions[0], rolledBack(1), completion]),
      /journal\.jsonl is invalid: line 4 records apply-completed after the rollback record at line 3/,
    ],
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
      () => promoteSignedPilot({ root, run }),
      () => verifyKnowledgeRun({ root, run }),
      () => rollbackKnowledgeApply({ root, run }),
    ]) {
      const error = await call().catch((caught) => caught)
      assert.ok(error instanceof Error, label)
      assert.equal(error.name, "JournalGrammarError", label)
      assert.equal(error.code, undefined, label)
      assert.match(error.message, pattern, label)
      assert.doesNotMatch(error.message, /was rolled back; propose a new run/, label)
      assert.doesNotMatch(error.message, /differs from the before snapshot/, label)
    }
    await assertNoWriteAnywhere(root, run, promotedHashes, runBefore, label)
  }

  // The recovery contract holds: the canonical journal is still a measured no-op and still
  // rolls the promoted tree back byte-exactly.
  await writeFile(journalPath, canonical)
  assert.equal((await promoteSignedPilot({ root, run })).status, "noop")
  assert.equal((await verifyKnowledgeRun({ root, run })).status, "pass")
  const rollback = await rollbackKnowledgeApply({ root, run })
  assert.equal(rollback.status, "pass")
  assert.equal(rollback.run_state, "rolled_back")
  assert.equal(rollback.restored_count, 9)
  assert.deepEqual(await hashes(root, KNOWLEDGE), knowledgeBefore)

  // The one legal completion-then-rollback ordering still parses.
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

// The phase rule closes the apply phase on the first rollback record rather than requiring
// a marker ahead of it, so an interrupted promotion still rolls back normally.
test("the promotion phase-order grammar still accepts a rollback of a run that never completed", async (context) => {
  const { root, run, runAbsolute } = await proposedPilot(context)
  const knowledgeBefore = await hashes(root, KNOWLEDGE)
  await assert.rejects(
    promoteSignedPilot({ root, run, faultAfterMutationOperations: 2 }),
    /injected apply interruption/,
  )
  const journalPath = path.join(runAbsolute, "journal.jsonl")

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
