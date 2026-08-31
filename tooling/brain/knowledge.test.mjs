import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import {
  applyKnowledge,
  proposeKnowledge,
  searchResolve,
  verifyKnowledgeRun,
} from "./knowledge.mjs"
import { KNOWLEDGE_ALIAS_KEY, QUARTZ_PUBLIC_ALIAS_KEYS } from "./knowledge-index.mjs"
import { sha256, toPosix, walkFiles } from "./lib.mjs"

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

async function fixture(context) {
  const root = await mkdtemp(path.join(os.tmpdir(), "brain-knowledge-"))
  context.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(path.join(root, "content/brain/knowledge"), { recursive: true })
  await mkdir(path.join(root, "content/brain/books"), { recursive: true })
  await mkdir(path.join(root, "tooling/brain/fixtures"), { recursive: true })
  await writeFile(
    path.join(root, "content/brain/knowledge/index.md"),
    "---\ntitle: Knowledge\n---\n",
  )
  const raw = "# Pilot\n\nSource-backed assertion.\n"
  const sourcePath = "content/brain/books/pilot.md"
  await writeFile(path.join(root, sourcePath), raw)
  const candidates = Array.from({ length: 8 }, (_, index) => ({
    concept_id: `domain.concept-${index}`,
    title: `Concept ${index}`,
    aliases: [`Alias ${index}`],
    canonical_path: `content/brain/knowledge/domain/concept-${index}.md`,
    tags: ["domain"],
    proposal_kind: index === 0 ? "stub" : "create",
    concept_granularity: "one fixture assertion",
    pilot_strata: index === 0 ? ["source-backed-stub"] : ["fixture"],
    related_concepts: index < 7 ? [`domain.concept-${index + 1}`] : [],
    locators: [
      {
        path: sourcePath,
        source_sha256: sha256(raw),
        heading: "# Pilot",
        start_line: 1,
        end_line: 3,
      },
    ],
  }))
  const pilot = {
    schema_version: 1,
    candidates,
    rejected_candidates: [
      {
        concept_id: "domain.rejected",
        title: "Rejected",
        reason_code: "insufficient-source-evidence",
        reason: "fixture rejection",
        sources: [{ path: sourcePath, source_sha256: sha256(raw) }],
      },
    ],
  }
  const pilotPath = "tooling/brain/fixtures/pilot.json"
  await writeFile(path.join(root, pilotPath), `${JSON.stringify(pilot, null, 2)}\n`)
  return { root, run: ".omx/artifacts/brain-restructure/pilot", pilotPath, sourcePath, raw }
}

test("proposal run is deterministic, provenance-complete, K-to-K only, and apply-gated", async (context) => {
  const { root, run, pilotPath } = await fixture(context)
  const knowledgeBefore = await hashes(root, "content/brain/knowledge")
  await proposeKnowledge({ root, run, pilotPath })
  const first = await hashes(root, run)
  await proposeKnowledge({ root, run, pilotPath })
  const second = await hashes(root, run)
  assert.deepEqual(second, first)
  assert.deepEqual(await hashes(root, "content/brain/knowledge"), knowledgeBefore)

  const report = await verifyKnowledgeRun({ root, run })
  assert.equal(report.status, "pass")
  assert.equal(report.provenance_coverage_percent, 100)
  assert.equal(report.broken_knowledge_link_count, 0)
  assert.equal(report.graph_source_leakage_count, 0)
  assert.equal(report.graph_tistory_leakage_count, 0)
  await assert.rejects(applyKnowledge({ root, run }), /apply refused: U2 pilot review/)
  assert.deepEqual(await hashes(root, "content/brain/knowledge"), knowledgeBefore)
  await assert.rejects(readFile(path.join(root, run, "proposals/domain.rejected.md"), "utf8"), {
    code: "ENOENT",
  })
})

// Mirrors the patched content-index emitter's single source for the search-only alias
// metadata: the `knowledge_aliases` frontmatter key and nothing else.
function stagedKnowledgeAliases(frontmatter) {
  const aliases = []
  let inside = false
  for (const line of frontmatter.split("\n")) {
    if (/^knowledge_aliases:\s*$/.test(line)) {
      inside = true
      continue
    }
    if (!inside) continue
    const item = line.match(/^\s+-\s+(.*)$/)
    if (item) {
      aliases.push(item[1].replace(/^"(.*)"$/, "$1"))
      continue
    }
    inside = false
  }
  return aliases
}

// Stands in for a staged Quartz build: one HTML route per knowledge document plus the
// `static/contentIndex.json` the search UI fetches. `content` is the rendered body text,
// which is where Quartz's content-index emitter puts it, and `knowledgeAliases` is the
// non-routing identity metadata the patched emitter carries alongside it.
async function stageQuartzBuild(root, run) {
  const stagePublic = path.join(root, run, "stage-public")
  const manifest = JSON.parse(
    await readFile(path.join(root, run, "proposal-manifest.json"), "utf8"),
  )
  const contentIndex = {}
  for (const proposal of manifest.proposals) {
    const slug = proposal.canonical_path.replace(/^content\//, "").replace(/\.md$/, "")
    const markdown = await readFile(path.join(root, run, "stage", proposal.canonical_path), "utf8")
    const [, frontmatter, body] = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
    const title = frontmatter.match(/^title: (.*)$/m)[1]
    await mkdir(path.dirname(path.join(stagePublic, `${slug}.html`)), { recursive: true })
    await writeFile(path.join(stagePublic, `${slug}.html`), `<html><body>${body}</body></html>`)
    const aliases = stagedKnowledgeAliases(frontmatter)
    contentIndex[slug] = {
      slug,
      title,
      links: [],
      tags: [],
      content: body.replace(/<!--[\s\S]*?-->/g, "").replace(/^[-#]\s*/gm, ""),
      ...(aliases.length > 0 ? { knowledgeAliases: aliases } : {}),
    }
  }
  await mkdir(path.join(stagePublic, "static"), { recursive: true })
  await writeFile(
    path.join(stagePublic, "static/contentIndex.json"),
    `${JSON.stringify(contentIndex, null, 2)}\n`,
  )
  return { stagePublic, contentIndex }
}

test("knowledge aliases are search-only: no redirect frontmatter, no staged routes, still searchable", async (context) => {
  const { root, run, pilotPath } = await fixture(context)
  const result = await proposeKnowledge({ root, run, pilotPath })
  const runAbsolute = path.join(root, run)

  assert.equal(result.aliasPolicy.status, "pass")
  assert.equal(result.aliasPolicy.alias_count, 8)
  assert.equal(result.aliasPolicy.searchable_alias_count, 8)
  assert.equal(result.aliasPolicy.public_alias_route_count, 0)

  // Neither the proposal artifact nor its staged content copy may carry a key that
  // Quartz's note-properties transformer turns into `file.data.aliases`.
  const manifest = JSON.parse(await readFile(path.join(runAbsolute, "proposal-manifest.json")))
  for (const proposal of manifest.proposals) {
    for (const relative of [proposal.artifact_path, `stage/${proposal.canonical_path}`]) {
      const markdown = await readFile(path.join(runAbsolute, relative), "utf8")
      const frontmatter = markdown.match(/^---\n([\s\S]*?)\n---\n/)[1]
      for (const key of QUARTZ_PUBLIC_ALIAS_KEYS) {
        assert.doesNotMatch(frontmatter, new RegExp(`^${key}:`, "m"), `${relative} carries ${key}`)
      }
      assert.match(frontmatter, new RegExp(`^${KNOWLEDGE_ALIAS_KEY}:`, "m"))
    }
  }

  // Alias identity survives in the concept index and in the U2 review record.
  const index = JSON.parse(await readFile(path.join(runAbsolute, "concept-index.json")))
  const review = JSON.parse(await readFile(path.join(runAbsolute, "pilot-review.json")))
  assert.deepEqual(
    index.concepts.map((concept) => concept.aliases),
    Array.from({ length: 8 }, (_, offset) => [`Alias ${offset}`]),
  )
  assert.deepEqual(
    review.proposals.map((proposal) => proposal.aliases),
    Array.from({ length: 8 }, (_, offset) => [`Alias ${offset}`]),
  )

  // A search by an alias resolves to that alias's canonical knowledge document.
  const { contentIndex } = await stageQuartzBuild(root, run)
  for (let offset = 0; offset < 8; offset += 1) {
    assert.equal(
      searchResolve(contentIndex, `Alias ${offset}`)[0],
      `brain/knowledge/domain/concept-${offset}`,
    )
  }

  const report = await verifyKnowledgeRun({ root, run })
  assert.equal(report.status, "pass")
  assert.equal(report.alias_policy, "search-only")
  assert.equal(report.alias_count, 8)
  assert.equal(report.searchable_alias_count, 8)
  assert.equal(report.public_alias_route_count, 0)
  assert.equal(report.resolved_alias_search_count, 8)

  const aliasPolicy = JSON.parse(await readFile(path.join(runAbsolute, "alias-policy-report.json")))
  assert.equal(aliasPolicy.status, "pass")
  assert.equal(aliasPolicy.staged_route_scan.scanned, true)
  assert.deepEqual(aliasPolicy.staged_route_scan.routes, [])
})

// The Batch 04 failure mode, reduced: two knowledge documents where each one's canonical
// alias text also appears verbatim in the other's prose. Body text alone cannot separate
// them — both are verbatim matches — so rank 0 has to come from the alias metadata.
test("exact alias metadata ranks the canonical document first when another body contains the same text", () => {
  const contested = {
    // Deliberately ordered so the *wrong* document is first in the index: without an
    // identity tier, a stable sort over equal-strength matches hands rank 0 to whichever
    // document the emitter happened to write first.
    "brain/knowledge/kafka/client/kafka-client": {
      slug: "brain/knowledge/kafka/client/kafka-client",
      title: "카프카 클라이언트",
      content: "카프카 커넥트와 Kafka Streams는 클라이언트 라이브러리 위에서 동작한다.",
      tags: [],
      knowledgeAliases: ["카프카 클라이언트"],
    },
    "brain/knowledge/kafka/platform/platform-feature": {
      slug: "brain/knowledge/kafka/platform/platform-feature",
      title: "플랫폼 기능",
      content: "카프카 커넥트, Kafka Streams 같은 플랫폼 기능을 제공한다.",
      tags: [],
      knowledgeAliases: ["카프카 커넥트", "Kafka Streams"],
    },
  }

  // Both aliases resolve to the document that *is* them, in both directions.
  assert.equal(
    searchResolve(contested, "카프카 커넥트")[0],
    "brain/knowledge/kafka/platform/platform-feature",
  )
  assert.equal(
    searchResolve(contested, "Kafka Streams")[0],
    "brain/knowledge/kafka/platform/platform-feature",
  )
  assert.equal(
    searchResolve(contested, "카프카 클라이언트")[0],
    "brain/knowledge/kafka/client/kafka-client",
  )

  // Identity is normalized the same way the schema keeps aliases unique.
  assert.equal(
    searchResolve(contested, "  kafka streams  ")[0],
    "brain/knowledge/kafka/platform/platform-feature",
  )

  // Negative control: strip the metadata and the contested alias loses rank 0 to the other
  // document's prose. This is exactly the 20-alias Batch 04 regression.
  const withoutMetadata = {
    "brain/knowledge/kafka/client/kafka-client": {
      ...contested["brain/knowledge/kafka/client/kafka-client"],
      knowledgeAliases: undefined,
    },
    "brain/knowledge/kafka/platform/platform-feature": {
      ...contested["brain/knowledge/kafka/platform/platform-feature"],
      knowledgeAliases: undefined,
    },
  }
  assert.equal(
    searchResolve(withoutMetadata, "카프카 커넥트")[0],
    "brain/knowledge/kafka/client/kafka-client",
  )
})

test("verification fails when an alias reintroduces a public redirect route", async (context) => {
  const { root, run, pilotPath } = await fixture(context)
  await proposeKnowledge({ root, run, pilotPath })
  const { stagePublic } = await stageQuartzBuild(root, run)
  const target = "brain/knowledge/domain/concept-0"
  await writeFile(
    path.join(stagePublic, "alias-0.html"),
    [
      "<!DOCTYPE html>",
      '<html lang="en-us">',
      "<head>",
      `<title>${target}</title>`,
      '<meta charset="utf-8">',
      `<meta http-equiv="refresh" content="0; url=./${target}">`,
      "</head>",
      "</html>",
      "",
    ].join("\n"),
  )

  await assert.rejects(verifyKnowledgeRun({ root, run }), /public-alias-route/)
  const aliasPolicy = JSON.parse(
    await readFile(path.join(root, run, "alias-policy-report.json"), "utf8"),
  )
  assert.equal(aliasPolicy.status, "fail")
  assert.equal(aliasPolicy.public_alias_route_count, 1)
  assert.deepEqual(aliasPolicy.staged_route_scan.routes, [{ route: "alias-0.html", target }])
})

test("source drift fails closed before proposal generation and during verification", async (context) => {
  const { root, run, pilotPath, sourcePath, raw } = await fixture(context)
  await writeFile(path.join(root, sourcePath), `${raw}drift\n`)
  await assert.rejects(proposeKnowledge({ root, run, pilotPath }), /source drift/)
  await writeFile(path.join(root, sourcePath), raw)
  await proposeKnowledge({ root, run, pilotPath })
  await writeFile(path.join(root, sourcePath), `${raw}drift\n`)
  await assert.rejects(verifyKnowledgeRun({ root, run }), /source drift/)
})

for (const proposalKind of ["create", "update", "merge", "stub"]) {
  test(`${proposalKind} rejects frontmatter-only accepted evidence`, async (context) => {
    const { root, run, pilotPath } = await fixture(context)
    const pilotAbsolute = path.join(root, pilotPath)
    const pilot = JSON.parse(await readFile(pilotAbsolute, "utf8"))
    const sourcePath = `content/brain/books/frontmatter-only-${proposalKind}.md`
    const source = `---\ntitle: ${proposalKind} metadata only\n---\n`
    await writeFile(path.join(root, sourcePath), source)
    pilot.candidates[0].proposal_kind = proposalKind
    pilot.candidates[0].locators = [
      {
        path: sourcePath,
        source_sha256: sha256(source),
        heading: "frontmatter",
        start_line: 2,
        end_line: 2,
      },
    ]
    await writeFile(pilotAbsolute, `${JSON.stringify(pilot, null, 2)}\n`)

    await assert.rejects(
      proposeKnowledge({ root, run, pilotPath }),
      /frontmatter-only source span is not evidence/,
    )
  })
}

for (const proposalKind of ["create", "update", "merge", "stub"]) {
  test(`${proposalKind} rejects structural-only body evidence`, async (context) => {
    const { root, run, pilotPath } = await fixture(context)
    const pilotAbsolute = path.join(root, pilotPath)
    const pilot = JSON.parse(await readFile(pilotAbsolute, "utf8"))
    const sourcePath = `content/brain/books/structural-only-${proposalKind}.md`
    const source = "---\ntitle: Structural metadata\n---\n\n# Empty structure\n\n-\n"
    await writeFile(path.join(root, sourcePath), source)
    pilot.candidates[0].proposal_kind = proposalKind
    pilot.candidates[0].locators = [
      {
        path: sourcePath,
        source_sha256: sha256(source),
        heading: "# Empty structure",
        start_line: 5,
        end_line: 7,
      },
    ]
    await writeFile(pilotAbsolute, `${JSON.stringify(pilot, null, 2)}\n`)

    await assert.rejects(
      proposeKnowledge({ root, run, pilotPath }),
      /source span lacks substantive body evidence/,
    )
  })
}

test("unheaded body evidence after frontmatter remains accepted", async (context) => {
  const { root, run, pilotPath } = await fixture(context)
  const pilotAbsolute = path.join(root, pilotPath)
  const pilot = JSON.parse(await readFile(pilotAbsolute, "utf8"))
  const sourcePath = "content/brain/books/unheaded-body.md"
  const source = "---\ntitle: API\n---\n\nBody-backed API assertion.\n"
  await writeFile(path.join(root, sourcePath), source)
  pilot.candidates[0].locators = [
    {
      path: sourcePath,
      source_sha256: sha256(source),
      heading: "unheaded-body",
      start_line: 5,
      end_line: 5,
    },
  ]
  await writeFile(pilotAbsolute, `${JSON.stringify(pilot, null, 2)}\n`)

  const result = await proposeKnowledge({ root, run, pilotPath })
  assert.equal(result.provenanceReport.status, "pass")
  assert.equal(result.provenanceReport.verified_source_count, 8)
  assert.equal(result.provenanceReport.unsupported_assertion_count, 0)
  assert.equal(result.provenanceReport.template_mismatch_count, 0)
})

test("verification rejects generated body text outside the source-backed template", async (context) => {
  const { root, run, pilotPath } = await fixture(context)
  await proposeKnowledge({ root, run, pilotPath })
  const runAbsolute = path.join(root, run)
  const manifestPath = path.join(runAbsolute, "proposal-manifest.json")
  const reviewPath = path.join(runAbsolute, "pilot-review.json")
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"))
  const review = JSON.parse(await readFile(reviewPath, "utf8"))
  const proposalEntry = manifest.proposals[0]
  const proposalPath = path.join(runAbsolute, proposalEntry.artifact_path)
  const original = await readFile(proposalPath, "utf8")
  const tampered = original.replace(
    "<!-- KNOWLEDGE_PROPOSAL_EXCERPTS_END -->",
    "Invented unsupported assertion.\n\n<!-- KNOWLEDGE_PROPOSAL_EXCERPTS_END -->",
  )
  const tamperedHash = sha256(tampered)
  proposalEntry.proposal_sha256 = tamperedHash
  review.proposals[0].proposal_sha256 = tamperedHash
  await writeFile(proposalPath, tampered)
  await writeFile(path.join(runAbsolute, "stage", proposalEntry.canonical_path), tampered)
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`)

  await assert.rejects(verifyKnowledgeRun({ root, run }), /proposal body template mismatch/)
  const provenance = JSON.parse(
    await readFile(path.join(runAbsolute, "provenance-report.json"), "utf8"),
  )
  assert.equal(provenance.status, "fail")
  assert.equal(provenance.unsupported_assertion_count, 1)
  assert.equal(provenance.template_mismatch_count, 1)
  assert.deepEqual(provenance.template_mismatches, [proposalEntry.concept_id])
})
