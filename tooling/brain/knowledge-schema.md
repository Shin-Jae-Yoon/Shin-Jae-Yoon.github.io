# Canonical knowledge proposal schema

Phase 4 is proposal-only. A proposal may be rendered into a run-local staged content copy, but it must not be written to `content/brain/knowledge/**` until U2 is signed and recorded; once it is, the one explicit [`promote`](#signed-u2-promotion-one-time) command is the only path that writes it. Phase 5 adds the batch lifecycle that does write approved documents; see [Phase 5 batch lifecycle](#phase-5-batch-lifecycle). A run declares which surface it is: `proposal-manifest.json` carries `mode: proposal-only` (Phase 4, gate U2, apply permanently unavailable) or `mode: batch` (Phase 5, gate U3, apply available behind a signed review).

```yaml
---
concept_id: java.oop.polymorphism
title: 다형성
knowledge_aliases:
  - Polymorphism
tags:
  - java
  - oop
canonical_path: content/brain/knowledge/java/oop/polymorphism.md
proposal_kind: create
proposal_status: awaiting_user_review
sources:
  - path: content/brain/books/do-it-java/chap08.md
    source_sha256: 64-character-lowercase-sha256
    locator:
      heading: "## 다형성 > ### 다형성이란?"
      start_line: 660
      end_line: 671
      span_sha256: 64-character-lowercase-sha256
related_concepts:
  - java.oop.virtual-method
---
```

## Invariants

- `concept_id` is stable, unique, and matches `^[a-z0-9]+(?:[._-][a-z0-9]+)*$`.
- `title` and every `knowledge_aliases[]` value are non-empty and globally unique after Unicode normalization, trimming, and case folding. A title may not repeat its own alias.
- Knowledge aliases are search-only (owner decision H-1). They are knowledge identity and are recorded in `concept-index.json` and in the U2 review record, but they never become public routes. `aliases`, `alias`, and `permalink` are forbidden in a knowledge document: Quartz's `note-properties` transformer coalesces them into `file.data.aliases`, and the `alias-redirects` emitter writes one public `<alias>.html` redirect page per entry. The generated proposal instead renders the aliases into the document body under a `다른 이름` heading between `<!-- KNOWLEDGE_ALIASES_START -->` and `<!-- KNOWLEDGE_ALIASES_END -->`, so the alias text lands in the `content` field of Quartz's `static/contentIndex.json`.

  Body text alone cannot carry the invariant. An alias is a short phrase whose words legitimately recur in other knowledge documents' prose, so when two documents both match verbatim nothing distinguishes the document that _is_ the alias from one that merely mentions it, and rank 0 falls to whichever the emitter happened to write first. Aliases are therefore also carried as **exact identity metadata**: the patched content-index emitter reads `knowledge_aliases` — and only that key, never the routing keys above — into a non-routing `knowledgeAliases` array on the document's `contentIndex.json` entry, absent rather than empty when a document has none. The patched search plugin registers `knowledgeAliases` as a FlexSearch field, leads `fieldPriority` with it, and hoists any document whose alias exactly equals the query (Unicode-normalized, trimmed, case-folded — the same rule that keeps titles and aliases unique) ahead of every title and content match. Because titles and aliases are globally unique across knowledge, at most one document can claim that rank. This is metadata for ranking only: it mints no route, and `aliases`/`alias`/`permalink` remain forbidden. Both plugins live under the gitignored `.quartz/`, which `npm run install-plugins` re-clones, so the durable form of the change is `tooling/plugins/apply-dev-uni-knowledge-alias-patch.mjs` — registered in that script alongside the other Dev Uni plugin patches, idempotent, and failing loudly if an upstream anchor moves rather than silently shipping the old ranking.

  `alias-policy-report.json` records the alias count, the body-presence count, the staged public alias route count (which must be zero), and the per-alias search resolution under `alias_search_scan` — its `source`, the `knowledge_document_count` it ranked against, `indexed_alias_metadata_count`, and `resolved_alias_count`. Resolution is measured with the search plugin's own tokenizer, `tokenize: "forward"` semantics, and the same field ordering the plugin ships. An alias must rank **first among all knowledge documents in the corpus** — not merely among its own batch — and must appear in the site-wide result set; an alias missing from the `knowledgeAliases` metadata is a violation (`alias-metadata-not-indexed`) in its own right, even where the ranking happens to come out right. It is not required to outrank the raw book and Tistory pages, which legitimately contain the same words.

- `canonical_path` is a Markdown path below `content/brain/knowledge/`.
- `tags[]` exactly equals the folders between `knowledge/` and the filename. `brain` and `knowledge` are reserved and forbidden. Folder-derived tags are not inferred for raw books, lectures, notes, or Tistory sources.
- `sources[]` is non-empty. Every source `path` is repo-relative and points outside the canonical knowledge layer. `source_sha256` binds the complete raw-layer file bytes.
- Every locator has an exact one-based inclusive line range, the enclosing heading chain, and `span_sha256` over the selected UTF-8 source text, including internal newlines. The validator derives the actual YAML frontmatter range from the source delimiters; `heading` is descriptive and is never trusted as evidence classification. Body prose without a Markdown heading uses `unheaded-body`, while `frontmatter` is reserved for a line physically inside YAML frontmatter. These fields make provenance mechanically verifiable and fail closed on source drift.
- Proposal body assertions are exact source spans. Tool-generated labels and fenced excerpt boundaries are presentation metadata; the text inside each source excerpt is byte-for-byte source text.
- `related_concepts[]` and body wiki links may target only an approved or proposed knowledge `concept_id`. Source, article, image, and Tistory paths are never graph edges.
- `proposal_kind` is `create`, `update`, `merge`, or `stub`. Every accepted locator, for every kind, must include substantive body evidence outside YAML frontmatter. Frontmatter-only metadata, a title/heading alone, structural Markdown alone, or an empty body is insufficient.
- `proposal_status` remains `awaiting_user_review` until U2 records a reviewer, signature, reviewed proposal hashes, and zero critical issues. A proposal artifact keeps that status forever; only the promoted copy in the knowledge layer reads `approved` (see [Signed U2 promotion](#signed-u2-promotion-one-time)).

`content/brain/knowledge/index.md` is a folder landing page, not a concept document, and is the only approved Markdown file in the knowledge tree that may omit `concept_id`.

## Run lifecycle and durability

Both write paths — the one-time [`promote`](#signed-u2-promotion-one-time) and Phase 5 [`apply`](#apply---approved-reviewjson) — share one journal format and therefore one lifecycle. They read it through the same classifier, so a state they disagreed about would be a recovery gap in whichever one disagreed.

`<run>/journal.jsonl` is append-only and fsynced per record. It carries five record kinds:

| Record               | Written                                                                    |
| -------------------- | -------------------------------------------------------------------------- |
| `intent`             | before each mutation, naming the path and its before/after hashes          |
| `completed`          | after that mutation returns                                                |
| `apply-completed`    | once, after the run's report is durable; binds `report` and `reportSha256` |
| `rollback-completed` | per journal entry undone, so an interrupted rollback resumes               |
| `rollback-finalized` | once, after rollback has measured the tree back to the before snapshot     |

**The grammar is enforced, not assumed.** The journal is the lifecycle attestation, so it is parsed as a strict grammar that fails closed before any classification. Every violation below is a named `JournalGrammarError` — `journal.jsonl is invalid: line <n> …` — raised identically from `promote`, `apply`, `verify`, and `rollback`, with zero writes. Nothing outside the grammar is silently ignored, and no raw `SyntaxError` or `ENOENT` escapes re-entry.

- **Record kinds.** Any `state` outside the five above is refused by name. A line that is not JSON is a truncated or corrupt append; a line that parses to a non-object is not a record; a blank line other than the trailing separator is corruption.
- **Field shapes.** `intent` needs a positive integer `id`, a non-empty `path`, and either `operation: created` with `entryType: file` plus a 64-hex `postSha256` (or `entryType: directory` with no `postSha256`), or `operation: modified` with a 64-hex `beforeSha256`/`postSha256` pair and no `entryType`. `apply-completed` needs a non-negative `operationCount`, a non-empty `report`, and a 64-hex `reportSha256`. `rollback-finalized` needs non-negative `operationCount`, `restoredCount`, `restoredDirectoryCount`, `noopCount` and a 64-hex `knowledgeTreeSha256`. `rollback-completed` needs an `action` of `noop` or `restored`.
- **Identity and order.** `intent` ids are unique and strictly increasing. A `completed` or `rollback-completed` record must name an already-journalled intent and may not repeat for that intent.
- **Operation counts.** `apply-completed.operationCount` must equal both the number of journalled intents and the number of `completed` records; `rollback-finalized.operationCount` must equal the number of journalled intents. (The `restored`/`noop` counters are per-invocation, so a resumed rollback legitimately reports fewer than it undid in total.)
- **Terminal exclusivity.** At most one `apply-completed` and at most one `rollback-finalized`. Nothing may follow `rollback-finalized`. Only `rollback-completed` and `rollback-finalized` may follow `apply-completed` — an `intent` or `completed` after the marker is refused.
- **Phase order.** A journal moves through exactly two phases, in this order and never back. The **apply phase** carries `intent`, `completed`, and `apply-completed`; the **rollback phase** carries `rollback-completed` and `rollback-finalized`. The first rollback record closes the apply phase permanently, so an `intent`, a `completed`, or an `apply-completed` after any rollback record is refused by name and cites the line that opened the rollback phase — `line <n> records <state> after the rollback record at line <m>`, or `line <n> completes intent <id> already recorded rolled back at line <m>` when the `completed` record names an intent that is itself already undone. Undoing a run is strictly later than performing it, so in any journal that has an `apply-completed`, every rollback record follows it; a run that never completed has no marker for them to follow and rolls back the same way. This phase rule is checked before the field-shape and operation-count rules, so the earliest violated boundary is the one that names the refusal.
- **Rollback completeness.** `rollback-finalized` asserts the run was undone, so every journalled intent must already carry its `rollback-completed` record. This is what distinguishes the one legal completion-plus-rollback journal — rolling back a run that had completed, which classifies as `rolled_back` — from a `rollback-finalized` appended to a completed run that was never undone, which is refused by name.

The phase rule is what makes the `rolled_back` classification trustworthy. `rolled_back` outranks the completion marker, so without it a journal that interleaved rollback records into its apply phase — records no writer can produce — classified a fully applied tree as undone: `apply` refused only with the generic `this run was rolled back; propose a new run`, `verify` reported tree drift rather than a grammar violation, and `rollback` trusted the premature records, skipped every operation, and failed without restoring anything. Rollback records that follow a genuine apply phase are not separable by grammar from an interrupted rollback that really did restore those entries — that is what the before-snapshot tree measurement at the end of `rollback` is for — but records that contradict the phase order are, and they now fail closed as `JournalGrammarError` with zero writes.

A run is therefore in exactly one of five states:

| State         | Journal                                                       | `promote` / `apply`                     |
| ------------- | ------------------------------------------------------------- | --------------------------------------- |
| `none`        | absent                                                        | runs                                    |
| `interrupted` | no `apply-completed`, not finalized                           | refuses; demands rollback               |
| `completed`   | `apply-completed` present                                     | measured no-op against the bound report |
| `rolled_back` | finalized, or every entry `rollback-completed`, with ≥1 entry | refuses; demands a new run              |
| `reset`       | finalized with zero entries                                   | runs — the run is started over          |

**Pre-intent interruption (`reset`).** The journal is created and fsynced before the first `intent`, so an interruption in that window leaves a valid zero-byte journal. It is `interrupted` like any other, and rollback is still the only way out — but a rollback that finds zero entries has proven the run never recorded an intent and therefore never mutated anything, and it finalizes the journal only after measuring the tree back to `before-manifest.json`. That finalized-and-empty journal is `reset`: the run is byte-identically where it started and may be run again under the full gate set. It is not an unlocked run — batch `apply` still requires `--approved`, and every hash, target, tree, and provenance guard re-runs from the top.

**Report/marker ordering.** A run's report (`promotion-report.json` or `apply-report.json`) is fsynced **before** the `apply-completed` marker, and the marker carries the report's SHA-256. The order is the durability contract: an interruption before the report leaves an `interrupted` journal that rolls back; an interruption between the two leaves that same `interrupted` journal plus an unbound report, which rollback deletes because it describes a run that has just been undone. **No window classifies a run as `completed` without a report that verifies against its marker.**

**Missing or altered report.** A `completed` run is only ever measured through the report its marker binds. A report that is absent, truncated, or edited fails the binding and is refused by name — `… is recorded complete but <report> is missing; roll this run back`, or `… bytes differ from the completion marker; roll this run back` — from `promote`, `apply`, and `verify` alike. It is never a raw `ENOENT` escaping re-entry and never a silently trusted file. Restoring the exact bytes restores the verified no-op; otherwise `rollback` still restores the tree byte-exactly. Recovery never accepts drift: the tree, the report bytes, and the signed review are all re-measured, and any mismatch refuses.

`rollback-report.json` records `run_state`, read back from the journal after the rollback rather than restated from intent, so a rollback that failed to transition the run cannot report that it did. `verification-report.json` records the same `run_state` for both surfaces.

### Completed-state evidence

A `completed` run is not settled history. Both surfaces measure it through **one authoritative completed-state evidence checker**, and `verify` and the completed no-op re-entry of `promote`/`apply` call exactly that checker and nothing else, so they cannot reach different verdicts about the same run. It is strictly read-only; the caller decides what to write, which is what makes the no-op zero-write. Its refusals are named and deterministic: the same drift refuses with the same message on every call, under `promotion refused: promoted state drifted:` or `apply refused: applied state drifted:`.

Every one of the following is re-read and re-hashed from disk on **every** completed-state call:

- **Manifest identity.** The report's `proposal_manifest_sha256` equals the SHA-256 of the run's current `proposal-manifest.json` bytes, and (batch) its `batch_id` equals the run's.
- **Signed review.** The file at `approved_review` still hashes to `approved_review_sha256`, **and** its current contents still satisfy the full gate for this surface — U2 `signedPilotReviewErrors` or U3 `signedBatchReviewErrors`, the same functions the pre-write gate uses. Every applied document is still decided `approve`, every approved proposal is still in the report, and nothing outside the manifest was applied.
- **Canonical sample** (batch). `sample.json` is present, byte-identical to the sample the manifest derives, and equal to the report's `sample_sha256`.
- **Proposal artifacts.** Every manifest proposal artifact is re-read and must hash to its `proposal_sha256`, still carry `proposal_status: awaiting_user_review` and its manifest `canonical_path`, still promote to `applied_sha256` (batch), and still match its staged overlay. A missing artifact is named, not an `ENOENT`.
- **Locked sources.** Provenance is re-measured against current source bytes behind every applied document — file hash, heading chain, span bounds, span hash, and exact-excerpt containment.
- **Targets, applied bytes, and tree.** Applied documents at their exact recorded bytes each recording `proposal_status: approved`; unapproved proposals still absent or byte-unchanged; the tree hash equal to the report's `after_knowledge_tree_sha256`.
- **Graph and link closure.** The approved index is rebuilt: zero collisions, no broken knowledge edges, no source/Tistory leakage, and each applied document's body wiki links exactly equal its `related_concepts`.
- **Run invariants.** Rejected candidates still unproposed; the search-only alias policy still clean — including the measured alias search invariant below, not merely body presence.
- **Alias search resolution.** Every alias is re-resolved against a **full-corpus index**: the run's rendered `stage-public` build when one is present, otherwise the equivalent index derived from the approved knowledge tree. `alias_search_evidence` records which (`rendered-build` or `approved-corpus`), and a completed run that can measure neither fails by name with `completed-state alias search evidence is missing`. Body presence (`searchable_alias_count`) is a necessary condition and never a sufficient one: it is reported alongside, but the gate is `resolved_alias_search_count`.

Any one of these failing makes the completed run drift: `verify` fails and re-entry refuses instead of returning `status: noop`. Restoring the exact bytes restores the verified no-op; otherwise `rollback` still restores the tree byte-exactly.

## Signed U2 promotion (one-time)

```bash
node tooling/brain/knowledge.mjs promote --run <run>
```

Phase 4's generic `apply` is permanently unavailable for a `mode: proposal-only` run and stays that way whether the run's review is unsigned or signed. A pilot that U2 actually signed reaches the knowledge layer through one explicit command, `promote`, which exists so a signed record does not have to be re-proposed as a batch to be honoured.

`promote` reads the run's own `pilot-review.json` — it takes no `--approved` argument, so no hand-authored file can stand in for the signed record — and refuses unless every guard below holds. Every refusal happens **before the first write**: no journal, no snapshot, no byte of `content/brain/knowledge/**` changed.

- **Review gate.** `gate: U2`, `status: approved`, `signed: true`, non-empty `reviewer` and `signed_at`, `critical_issue_count: 0`, self-consistent decision counts, and `reviewed_proposal_count == total_proposal_count == proposals.length` (complete).
- **Decision contract.** Every decision is exactly `approve`, `reject`, or `pending`; every `critical_issues` is an array; the top-level critical count is recomputed from the entries, so an approved review can never carry an unresolved critical issue. Promotion additionally requires every decision to be `approve` — a partially approved pilot is a batch, and batches go through `apply` with its sample gate and exclusion accounting.
- **Review hash guards.** No repeated `concept_id`, no decision naming a proposal absent from the manifest, no manifest proposal missing from the review, and every reviewed `proposal_sha256` and `canonical_path` equal to the manifest's.
- **Proposal hash guards.** Each proposal artifact's current bytes hash to its manifest `proposal_sha256`, and its frontmatter `canonical_path` matches.
- **Source hash guards.** Provenance is re-measured against current source bytes — file hash, heading chain, span bounds, span hash, and exact-excerpt containment. Any source drift refuses.
- **Target guards.** Each canonical path lies under `content/brain/knowledge/` and must be absent; a path that appeared after propose is named exactly. No concept may already exist in the approved tree.
- **Tree guard.** The approved knowledge tree still hashes to `approved_knowledge_tree_sha256`.
- **Link closure.** A promoted document may not link to a concept outside the pilot set and the already-approved tree.

The applied bytes are the reviewed proposal with its single `proposal_status` line rewritten to `approved`; nothing else changes, so every verified source excerpt is byte-identical to what U2 read. Promotion reuses the Phase 5 machinery verbatim: the durable `<run>/before/` snapshot and fsynced `before-manifest.json`, the write-ahead `<run>/journal.jsonl`, and `rollback`, which restores byte-exactly and asserts the tree hashes back to the before snapshot. The result is `<run>/promotion-report.json`, fsynced before the completion marker that binds its hash — see [Run lifecycle and durability](#run-lifecycle-and-durability).

**Re-entry.** A completed promotion re-measures the whole current evidence set through its bound report — see [Completed-state evidence](#completed-state-evidence) — and returns `status: noop` with zero writes. An interrupted journal refuses re-promotion and demands rollback first. A rolled-back run refuses re-promotion and demands a new run. A `reset` run — rolled back before it ever recorded an intent — is promoted again from the top under every guard.

### Verify (proposal-only)

`verify` accepts a `pilot-review.json` in exactly two shapes and fails closed on everything in between: the unsigned handoff scaffold (`signed: false`, `awaiting_user_review`), reported as `u2_state: "unsigned"` / `ac13_status: "pending_user_u2"`, or a record satisfying the full signed U2 gate above, reported as `u2_state: "signed"` / `ac13_status: "recorded_user_u2"`. Signed-but-pending, approved-but-unsigned, a missing reviewer, an undecided proposal, an out-of-contract decision, and a stale reviewed hash all fail.

Before promotion `verify` measures the run against an unchanged approved tree, exactly as Phase 4 always did. After promotion it runs the shared [completed-state evidence](#completed-state-evidence) checker, so it measures exactly what the promotion no-op measures: manifest identity, the signed review's bytes and decision contract, every proposal artifact's bytes, current source provenance, the promoted documents at their exact recorded bytes each recording `proposal_status: approved`, the tree hash equal to the promotion report, and approved-graph closure. An interrupted promotion journal fails verification and demands rollback. A promotion report that no longer matches its completion marker fails verification by name rather than throwing. After a rollback, and for a `reset` run, it measures the pre-promotion state again.

## Phase 5 batch lifecycle

```bash
node tooling/brain/knowledge.mjs propose  --batch <batch-manifest.json> --run <run>
node tooling/brain/knowledge.mjs sample   --run <run>
node tooling/brain/knowledge.mjs apply    --run <run> --approved <signed-review.json>
node tooling/brain/knowledge.mjs verify   --run <run>
node tooling/brain/knowledge.mjs rollback --run <run>
```

### Batch manifest (input, authored by extraction)

```json
{
  "schema_version": 1,
  "batch_id": "do-it-java-oop",
  "scope": ["content/brain/books/do-it-java"],
  "candidates": [{ "concept_id": "…", "review_flags": ["conflict"], "locators": [] }],
  "rejected_candidates": []
}
```

- `batch_id` matches `^[a-z0-9]+(?:[._-][a-z0-9]+)*$` and names the rollback boundary (R5).
- A candidate has the same shape as a pilot candidate — including `pilot_strata`, whose key name is retained so proposal bytes stay comparable with the signed Phase 4 pilot — plus an optional `review_flags[]` drawn from `conflict`, `low-confidence`, `provenance-warning`.
- `rejected_candidates[]` is optional for a batch and stays `proposal_created: false`, exactly as in Phase 4.
- A batch may re-propose a concept it has already approved, which is how `update`/`merge` revise an existing document. It may **not** move one: the proposal's `canonical_path` must equal the approved document's, or propose refuses. The pre-apply index counts the proposal instead of both copies, so a revision is not reported as a collision against its own approved self.

### Propose (batch)

Writes the same artifacts as Phase 4 plus, per proposal in `proposal-manifest.json`: `proposal_kind`, sorted `review_flags`, `target_exists`, `target_before_sha256` (null when absent), and `applied_sha256`. `applied_sha256` is the hash of the _promoted_ document — the proposal with `proposal_status: awaiting_user_review` rewritten to `proposal_status: approved`, the only difference between a proposal and its applied form. The body, and with it every verified source excerpt, is byte-identical, so the exact applied bytes are known before anyone signs. The unsigned review scaffold is `batch-review.json` (gate U3) and binds `proposal_manifest_sha256`.

### Sample (`sample.json`, AC-15)

Deterministic and reproducible from the run alone. Seed = SHA-256 over `batch_id`, `approved_knowledge_tree_sha256`, `batch_manifest_sha256`, and `proposal_manifest_sha256`; each proposal's rank is `sha256("<seed>:<concept_id>")`. Every flagged proposal is reviewed in full; the remaining pool is drawn in rank order at `max(5, ceil(10%))` of the pool, then widened until every proposal kind present in the pool is represented. Re-running `sample` on an unchanged run reproduces the file byte-for-byte.

### Apply (`--approved <review.json>`)

Apply is refused unless every guard below holds, and every refusal happens **before the first write**: no journal, no snapshot, no byte of `content/brain/knowledge/**` changed.

- **Review gate.** `gate: U3`, `status: approved`, `signed: true`, non-empty `reviewer` and `signed_at`, `critical_issue_count: 0`, and self-consistent decision counts.
- **Review hash guards.** `review.batch_id` equals the run's, `review.proposal_manifest_sha256` equals the SHA-256 of the run's `proposal-manifest.json` bytes, every reviewed `proposal_sha256` equals the manifest's, and no decision names a proposal absent from the manifest.
- **Decision contract.** Every decision is exactly `approve`, `reject`, or `pending`; every `critical_issues` is an array; and the top-level critical count is recomputed from the entries, so an approved review can never carry an unresolved critical issue.
- **Sample gate.** `sample.json` exists and is byte-identical to the sample this manifest derives — apply and verify rederive it rather than trusting the file's own `selected[]`, so editing the selection, counts, ranks, mandatory flags, or category coverage cannot shrink the reviewed set — and every sampled proposal carries a non-pending decision.
- **Proposal hash guards.** Each proposal artifact hashes to its manifest `proposal_sha256`, and its promoted bytes hash to `applied_sha256`.
- **Source hash guards.** Provenance is re-measured against current source bytes — file hash, heading chain, span bounds, span hash, and exact-excerpt containment. Any source drift refuses.
- **Target guards.** Each canonical path lies under `content/brain/knowledge/`, its presence matches `target_exists`, and an existing document's bytes match `target_before_sha256`. Named per path, checked before the whole-tree guard so a drifted target is reported exactly.
- **Tree guard.** The approved knowledge tree still hashes to `approved_knowledge_tree_sha256`.
- **Link closure.** An approved document may not link to a concept the review left unapproved, which would apply a broken knowledge edge.

Only proposals decided `approve` are written; `reject`, `pending`, and absent decisions are excluded and recorded in `apply-report.json`. A review that approves nothing is a refusal, not an empty success.

**Before snapshot and journal.** Every existing target's bytes are copied to `<run>/before/<path>` and `<run>/before-manifest.json` records the pre-apply tree hash and records; both are fsynced before the first mutation. `<run>/journal.jsonl` then records an `intent` line, fsynced, **before** each mutation and a `completed` line after it, closing with `apply-completed` once `apply-report.json` is durable. An apply killed at any point therefore leaves a journal naming every path it may have touched. See [Run lifecycle and durability](#run-lifecycle-and-durability) for the record kinds, the five run states, and the report/marker ordering.

**Re-entry.** A completed apply re-measures the whole current evidence set through its bound report — see [Completed-state evidence](#completed-state-evidence) — and returns `status: noop` with zero writes (AC-14 rerun no-op). An interrupted journal refuses re-apply and demands rollback first. A rolled-back run refuses re-apply and demands a new run. A `reset` run — rolled back before it ever recorded an intent — is applied again from the top, still behind `--approved` and every other guard.

### Rollback (R5)

Reads `journal.jsonl` in reverse and decides each entry from the filesystem, not from the journal's own bookkeeping — an apply killed between the mutation and its `completed` line is indistinguishable in the journal but obvious on disk. Created files are unlinked, created directories are `rmdir`ed (non-recursive; `ENOTEMPTY` is not swallowed), and modified files are restored from `<run>/before/<path>` behind a snapshot hash check via a temp-file rename. Each undone entry appends `rollback-completed`, so an interrupted rollback resumes. Rollback then asserts the tree hashes back to `before-manifest.json` and that no journalled `created` path remains, and fails loudly if not.

Only once those assertions hold does it append `rollback-finalized` — the record that transitions the run to `rolled_back`, or to `reset` when there was never an entry to undo. Drift throws before that record is written, so a run whose tree cannot be restored stays `interrupted` and rollback-recoverable rather than being marked done. A report with no completion marker to bind it is deleted at the same point: it describes a run that has just been undone.

### Verify

`verify` measures the pre-apply run exactly as Phase 4 does — unchanged tree, proposal bytes, staged overlay, provenance, collisions, graph closure, alias policy. After apply it runs the shared [completed-state evidence](#completed-state-evidence) checker, so it measures exactly what the apply no-op measures: manifest and batch identity, the signed review's bytes and decision contract, the canonical sample, **every proposal artifact's current bytes against its manifest `proposal_sha256`**, current source provenance, approved documents at their exact `applied_sha256` and recording `proposal_status: approved`, every unapproved proposal still absent (or untouched, if its target pre-existed), tree hash equal to the apply report, and the whole approved graph closed and free of source/Tistory leakage (AC-14). An apply report that no longer matches its completion marker fails verification by name rather than throwing. After a rollback, and for a `reset` run, it measures the pre-apply state again.
