import {
  cp,
  mkdir,
  open,
  readFile,
  rename,
  rm,
  rmdir,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import YAML from "yaml"
import {
  KNOWLEDGE_ALIAS_KEY,
  QUARTZ_PUBLIC_ALIAS_KEYS,
  buildKnowledgeIndex,
  collisionReport,
  folderTags,
  parseFrontmatter,
  recordFromMarkdown,
} from "./knowledge-index.mjs"
import { sha256, toPosix, walkFiles } from "./lib.mjs"

const KNOWLEDGE_ROOT = "content/brain/knowledge"
// Every knowledge document's rendered slug starts here, so this is how the knowledge layer
// is identified inside a rendered, whole-site content index.
const KNOWLEDGE_SLUG_PREFIX = "brain/knowledge/"
// The non-routing metadata field the patched Quartz content-index emitter carries
// `knowledge_aliases` in, and the field the patched search plugin ranks first. Kept in step
// with `tooling/plugins/apply-dev-uni-knowledge-alias-patch.mjs`.
export const CONTENT_INDEX_ALIAS_FIELD = "knowledgeAliases"
const REVIEW_STATUS = "awaiting_user_review"
const APPROVED_STATUS = "approved"
const RESERVED_TAGS = new Set(["brain", "knowledge"])
const VALID_KINDS = new Set(["create", "update", "merge", "stub"])
// Phase 5 batch review gate (consensus plan §Phase 5, user gate U3). Phase 4's
// proposal-only surface keeps its own U2 gate and stays apply-less: its one and only
// write path is the explicit one-time `promote` command below.
const BATCH_REVIEW_GATE = "U3"
const PILOT_REVIEW_GATE = "U2"
// The whole decision contract. A review value outside this set is malformed, not a
// silent exclusion (independent Phase 5 verification, F2).
const REVIEW_DECISIONS = new Set(["approve", "reject", "pending"])
const REVIEW_FLAGS = new Set(["conflict", "low-confidence", "provenance-warning"])
const BATCH_ID_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

async function writeStable(absolute, content) {
  let before = null
  try {
    before = await readFile(absolute, "utf8")
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }
  if (before === content) return false
  await mkdir(path.dirname(absolute), { recursive: true })
  await writeFile(absolute, content)
  return true
}

// Apply-path artifacts (the before snapshot and the journal) are the only way a
// partial apply can be undone, so they are flushed to disk before the mutation they
// protect. `writeStable` is fine for reports; recovery inputs use this.
async function writeDurable(absolute, content) {
  await mkdir(path.dirname(absolute), { recursive: true })
  const handle = await open(absolute, "w")
  try {
    await handle.write(content)
    await handle.sync()
  } finally {
    await handle.close()
  }
}

function assertInside(root, target, label) {
  const relative = path.relative(root, target)
  if (relative.startsWith("..") || path.isAbsolute(relative))
    throw new Error(`${label} escapes root`)
}

function sourceLines(source) {
  return source.replaceAll("\r\n", "\n").split("\n")
}

function selectedSpan(source, startLine, endLine) {
  const lines = sourceLines(source)
  if (startLine < 1 || endLine < startLine || endLine > lines.length) {
    throw new Error(`invalid source locator lines ${startLine}-${endLine}`)
  }
  return lines.slice(startLine - 1, endLine).join("\n")
}

function frontmatterLineRange(source) {
  const lines = sourceLines(source)
  if (lines[0] !== "---") return null
  const closingIndex = lines.findIndex((line, index) => index > 0 && line === "---")
  return closingIndex === -1 ? null : { start_line: 1, end_line: closingIndex + 1 }
}

function isFrontmatterLine(range, lineNumber) {
  return range && lineNumber >= range.start_line && lineNumber <= range.end_line
}

function substantiveBodyText(lines) {
  return lines
    .join("\n")
    .replace(/<!--[\s\S]*?-->/g, "")
    .split("\n")
    .some((line) => {
      const trimmed = line.trim()
      if (!trimmed) return false
      if (/^#{1,6}(?:\s|$)/.test(trimmed)) return false
      if (/^(?:```+|~~~+)/.test(trimmed)) return false
      if (/^(?:[-*_]\s*){3,}$/.test(trimmed)) return false
      if (/^<[^>]+>$/.test(trimmed)) return false
      if (/^>\s*\[![^\]]+\](?:[+-])?(?:\s+.*)?$/.test(trimmed)) return false
      return /[\p{L}\p{N}]/u.test(trimmed.replace(/<[^>]*>/g, ""))
    })
}

function validatedEvidenceSpan(source, startLine, endLine, conceptId) {
  const span = selectedSpan(source, startLine, endLine)
  const lines = sourceLines(source)
  const frontmatter = frontmatterLineRange(source)
  const bodyLines = lines
    .slice(startLine - 1, endLine)
    .filter((_, index) => !isFrontmatterLine(frontmatter, startLine + index))
  if (bodyLines.length === 0) {
    throw new Error(`${conceptId}: frontmatter-only source span is not evidence`)
  }
  if (!substantiveBodyText(bodyLines)) {
    throw new Error(`${conceptId}: source span lacks substantive body evidence`)
  }
  return span
}

function headingChain(source, lineNumber) {
  const chain = []
  const lines = sourceLines(source)
  const frontmatter = frontmatterLineRange(source)
  if (isFrontmatterLine(frontmatter, lineNumber)) return "frontmatter"
  let fence = null
  for (let index = 0; index < Math.min(lineNumber, lines.length); index += 1) {
    const currentLine = index + 1
    if (isFrontmatterLine(frontmatter, currentLine)) continue
    const fenceMatch = lines[index].match(/^\s*(`{3,}|~{3,})/)
    if (fenceMatch) {
      const marker = fenceMatch[1][0]
      if (fence === marker) fence = null
      else if (fence === null) fence = marker
      continue
    }
    if (fence !== null) continue
    const match = lines[index].match(/^(#{1,6})\s+(.+?)\s*$/)
    if (!match) continue
    const depth = match[1].length
    chain.splice(depth - 1)
    chain[depth - 1] = `${match[1]} ${match[2]}`
  }
  return chain.filter(Boolean).join(" > ") || "unheaded-body"
}

async function treeManifest(root, relativeRoot) {
  const absoluteRoot = path.join(root, relativeRoot)
  const files = await walkFiles(absoluteRoot, () => true)
  const records = []
  for (const absolute of files) {
    const bytes = await readFile(absolute)
    records.push({ path: toPosix(path.relative(root, absolute)), sha256: sha256(bytes) })
  }
  records.sort((left, right) => left.path.localeCompare(right.path))
  return { records, sha256: sha256(stableJson(records)) }
}

function knowledgeSlug(canonicalPath) {
  return toPosix(canonicalPath)
    .replace(/^content\//, "")
    .replace(/\.md$/, "")
}

function validateCandidateShape(candidate) {
  if (!candidate || typeof candidate !== "object")
    throw new Error("pilot candidate must be a mapping")
  if (!VALID_KINDS.has(candidate.proposal_kind)) {
    throw new Error(`${candidate.concept_id}: unsupported proposal_kind`)
  }
  if (!Array.isArray(candidate.locators) || candidate.locators.length === 0) {
    throw new Error(`${candidate.concept_id}: at least one locator is required`)
  }
  const derivedTags = folderTags(candidate.canonical_path)
  if (JSON.stringify([...candidate.tags].sort()) !== JSON.stringify([...derivedTags].sort())) {
    throw new Error(
      `${candidate.concept_id}: tags must be derived from the canonical knowledge folders`,
    )
  }
  if (candidate.tags.some((tag) => RESERVED_TAGS.has(String(tag).toLowerCase()))) {
    throw new Error(`${candidate.concept_id}: reserved tag is forbidden`)
  }
  for (const flag of candidate.review_flags ?? []) {
    if (!REVIEW_FLAGS.has(flag))
      throw new Error(`${candidate.concept_id}: unknown review flag ${flag}`)
  }
}

async function resolveCandidate(root, candidate) {
  validateCandidateShape(candidate)
  const sources = []
  const excerpts = []
  for (const locator of candidate.locators) {
    if (path.isAbsolute(locator.path))
      throw new Error(`${candidate.concept_id}: source path must be repo-relative`)
    const absolute = path.resolve(root, locator.path)
    assertInside(root, absolute, `${candidate.concept_id}: source path`)
    if (toPosix(locator.path).startsWith("content/brain/knowledge/")) {
      throw new Error(`${candidate.concept_id}: provenance must point to the raw layer`)
    }
    const source = await readFile(absolute, "utf8")
    const sourceHash = sha256(source)
    if (sourceHash !== locator.source_sha256) {
      throw new Error(`${candidate.concept_id}: source drift for ${locator.path}`)
    }
    const actualHeading = headingChain(source, locator.start_line)
    if (actualHeading !== locator.heading) {
      throw new Error(
        `${candidate.concept_id}: heading drift for ${locator.path}:${locator.start_line}`,
      )
    }
    const span = validatedEvidenceSpan(
      source,
      locator.start_line,
      locator.end_line,
      candidate.concept_id,
    )
    const spanHash = sha256(span)
    sources.push({
      path: toPosix(locator.path),
      source_sha256: sourceHash,
      locator: {
        heading: actualHeading,
        start_line: locator.start_line,
        end_line: locator.end_line,
        span_sha256: spanHash,
      },
    })
    excerpts.push({
      path: toPosix(locator.path),
      start_line: locator.start_line,
      end_line: locator.end_line,
      span,
    })
  }
  return { ...candidate, sources, excerpts }
}

function proposalBody(candidate, catalog) {
  const body = ["<!-- KNOWLEDGE_PROPOSAL_EXCERPTS_START -->"]
  candidate.excerpts.forEach((excerpt, index) => {
    body.push(
      "",
      `## 원문 ${index + 1}`,
      "",
      `<!-- ${excerpt.path}:${excerpt.start_line}-${excerpt.end_line} -->`,
      "",
      "````text",
      excerpt.span,
      "````",
    )
  })
  body.push("", "<!-- KNOWLEDGE_PROPOSAL_EXCERPTS_END -->")
  // Aliases are rendered into the document text, not into redirect-producing
  // frontmatter, so Quartz's content index carries them and search resolves an
  // alias query to this canonical document.
  const aliases = candidate.aliases ?? []
  if (aliases.length > 0) {
    body.push("", "<!-- KNOWLEDGE_ALIASES_START -->", "", "## 다른 이름", "")
    for (const alias of aliases) body.push(`- ${alias}`)
    body.push("", "<!-- KNOWLEDGE_ALIASES_END -->")
  }
  if (candidate.related_concepts.length > 0) {
    body.push("", "## 관련 개념", "")
    for (const conceptId of candidate.related_concepts) {
      const related = catalog.get(conceptId)
      if (!related) throw new Error(`${candidate.concept_id}: unknown related concept ${conceptId}`)
      body.push(`- [[${knowledgeSlug(related.canonical_path)}|${related.title}]]`)
    }
  }
  return `\n${body.join("\n")}\n`
}

function proposalMarkdown(candidate, catalog) {
  const data = {
    concept_id: candidate.concept_id,
    title: candidate.title,
    [KNOWLEDGE_ALIAS_KEY]: candidate.aliases,
    tags: candidate.tags,
    canonical_path: candidate.canonical_path,
    proposal_kind: candidate.proposal_kind,
    proposal_status: REVIEW_STATUS,
    concept_granularity: candidate.concept_granularity,
    pilot_strata: candidate.pilot_strata,
    sources: candidate.sources,
    related_concepts: candidate.related_concepts,
  }
  return `---\n${YAML.stringify(data).trimEnd()}\n---\n${proposalBody(candidate, catalog)}`
}

function reviewRecord(candidate, proposalSha256) {
  return {
    concept_id: candidate.concept_id,
    proposal_sha256: proposalSha256,
    proposal_kind: candidate.proposal_kind,
    concept_granularity: candidate.concept_granularity,
    canonical_path: candidate.canonical_path,
    aliases: candidate.aliases,
    tags: candidate.tags,
    locators: candidate.sources.map((source) => ({ path: source.path, ...source.locator })),
    related_links: candidate.related_concepts,
    decision: "pending",
    critical_issues: [],
    reviewer: null,
    reviewed_at: null,
  }
}

// `documents` are the Markdown files whose source provenance is being measured: the
// run's proposal artifacts before apply, or the applied knowledge documents after it.
// `catalogExtra` supplies related-concept targets that live outside this set, which is
// how an applied batch resolves links into previously approved concepts.
async function measuredProvenanceReport({ root, documents, catalogExtra = [] }) {
  const records = []
  const validationErrors = []
  for (const proposalEntry of documents) {
    try {
      const markdown = await readFile(proposalEntry.absolute, "utf8")
      const parsed = parseFrontmatter(markdown, proposalEntry.label)
      records.push({ proposalEntry, markdown, ...parsed })
    } catch (error) {
      validationErrors.push({ concept_id: proposalEntry.concept_id, error: error.message })
    }
  }

  const catalog = new Map([
    ...catalogExtra.map((record) => [record.concept_id, record]),
    ...records.map(({ data }) => [data.concept_id, data]),
  ])
  let sourceCount = 0
  let verifiedSourceCount = 0
  let proposalsWithProvenance = 0
  const templateMismatches = []
  for (const { proposalEntry, data, body } of records) {
    const sources = Array.isArray(data.sources) ? data.sources : []
    sourceCount += sources.length
    let proposalSourcesVerified = sources.length > 0
    const excerpts = []
    if (sources.length !== proposalEntry.source_count) {
      proposalSourcesVerified = false
      validationErrors.push({
        concept_id: proposalEntry.concept_id,
        error: `source count differs from manifest (${sources.length}/${proposalEntry.source_count})`,
      })
    }
    for (const sourceEntry of sources) {
      try {
        const absoluteSource = path.resolve(root, sourceEntry.path)
        assertInside(root, absoluteSource, `${data.concept_id}: source`)
        if (toPosix(sourceEntry.path).startsWith("content/brain/knowledge/")) {
          throw new Error(`${data.concept_id}: provenance must point to the raw layer`)
        }
        const source = await readFile(absoluteSource, "utf8")
        if (sha256(source) !== sourceEntry.source_sha256) {
          throw new Error(`${data.concept_id}: source drift for ${sourceEntry.path}`)
        }
        const locator = sourceEntry.locator
        const actualHeading = headingChain(source, locator.start_line)
        if (actualHeading !== locator.heading) {
          throw new Error(
            `${data.concept_id}: heading drift for ${sourceEntry.path}:${locator.start_line}`,
          )
        }
        const span = validatedEvidenceSpan(
          source,
          locator.start_line,
          locator.end_line,
          data.concept_id,
        )
        if (sha256(span) !== locator.span_sha256) {
          throw new Error(`${data.concept_id}: locator drift for ${sourceEntry.path}`)
        }
        if (!body.includes(`\n${span}\n\`\`\`\``)) {
          throw new Error(`${data.concept_id}: proposal body does not contain exact source span`)
        }
        verifiedSourceCount += 1
        excerpts.push({
          path: sourceEntry.path,
          start_line: locator.start_line,
          end_line: locator.end_line,
          span,
        })
      } catch (error) {
        proposalSourcesVerified = false
        validationErrors.push({ concept_id: data.concept_id, error: error.message })
      }
    }
    if (proposalSourcesVerified) proposalsWithProvenance += 1
    try {
      const expectedBody = proposalBody(
        { ...data, aliases: data[KNOWLEDGE_ALIAS_KEY] ?? [], excerpts },
        catalog,
      )
      if (body !== expectedBody) templateMismatches.push(data.concept_id)
    } catch (error) {
      templateMismatches.push(data.concept_id)
      validationErrors.push({ concept_id: data.concept_id, error: error.message })
    }
  }

  const proposalCount = documents.length
  const coveragePercent =
    sourceCount === 0 ? 0 : Number(((verifiedSourceCount / sourceCount) * 100).toFixed(2))
  const verifiedProposalCount = records.filter(({ data }) => {
    return (
      Array.isArray(data.sources) &&
      data.sources.length > 0 &&
      !validationErrors.some(({ concept_id }) => concept_id === data.concept_id) &&
      !templateMismatches.includes(data.concept_id)
    )
  }).length
  const status =
    records.length === proposalCount &&
    verifiedProposalCount === proposalCount &&
    verifiedSourceCount === sourceCount &&
    templateMismatches.length === 0
      ? "pass"
      : "fail"
  return {
    schema_version: 1,
    status,
    proposal_count: proposalCount,
    verified_proposal_count: verifiedProposalCount,
    proposals_with_provenance: proposalsWithProvenance,
    source_count: sourceCount,
    verified_source_count: verifiedSourceCount,
    coverage_percent: coveragePercent,
    unsupported_assertion_count: templateMismatches.length,
    template_mismatch_count: templateMismatches.length,
    template_mismatches: templateMismatches,
    validation_error_count: validationErrors.length,
    validation_errors: validationErrors,
  }
}

// The concepts a run may legitimately link to but does not itself carry: the live approved
// knowledge index. Related-concept rendering seeds from this so a create can point at an
// already approved concept and an update can preserve the approved edges it is revising,
// instead of every outside target reading as unknown. A record that is in neither this set
// nor the run's own documents is still unknown, so unresolvable relations keep failing
// closed.
//
// A document under the approved root that cannot be read as a concept record is simply
// absent here rather than thrown from: seeding a lookup table must never preempt the
// index, collision, and per-target guards that name such a document on their own surfaces
// and in their own order. Being absent from the catalog is the fail-closed outcome — it
// makes the document unreachable as a link target.
async function approvedCatalogRecords(root) {
  const approvedRoot = path.join(root, KNOWLEDGE_ROOT)
  if (!(await fileExists(approvedRoot))) return []
  const records = []
  for (const absolute of await walkFiles(approvedRoot, (file) => file.endsWith(".md"))) {
    const relative = toPosix(path.relative(root, absolute))
    try {
      const record = recordFromMarkdown(await readFile(absolute, "utf8"), relative, "approved")
      if (record) records.push(record)
    } catch {
      continue
    }
  }
  records.sort((left, right) => left.concept_id.localeCompare(right.concept_id))
  return records
}

// A batch may revise a concept it has already approved. Apply overwrites that document in
// place, so the pre-apply view must count the proposal instead of both copies; otherwise
// every revision would read as a concept_id collision against its own approved self.
async function batchProposalIndex({ root, run, proposalIds }) {
  const built = await buildKnowledgeIndex({ root, proposalDir: path.join(run, "proposals") })
  const replaced = built.index.concepts.filter(
    (record) => record.origin === "approved" && proposalIds.has(record.concept_id),
  )
  if (replaced.length === 0) {
    return { index: built.index, collisions: built.collisions, replaced }
  }
  const concepts = built.index.concepts.filter(
    (record) => !(record.origin === "approved" && proposalIds.has(record.concept_id)),
  )
  const collisions = collisionReport(concepts)
  return {
    index: {
      ...built.index,
      approved_count: concepts.filter((record) => record.origin === "approved").length,
      proposal_count: concepts.filter((record) => record.origin === "proposal").length,
      collision_count: collisions.count,
      concepts,
    },
    collisions,
    replaced,
  }
}

function proposalDocuments(run, manifest) {
  return manifest.proposals.map((proposalEntry) => {
    const absolute = path.resolve(run, proposalEntry.artifact_path)
    assertInside(run, absolute, `${proposalEntry.concept_id}: proposal artifact`)
    return {
      concept_id: proposalEntry.concept_id,
      absolute,
      label: proposalEntry.artifact_path,
      source_count: proposalEntry.source_count,
    }
  })
}

async function stageContent(root, run, proposals) {
  const stageRoot = path.join(run, "stage/content")
  assertInside(run, stageRoot, "stage content")
  await rm(stageRoot, { recursive: true, force: true })
  await mkdir(path.dirname(stageRoot), { recursive: true })
  await cp(path.join(root, "content"), stageRoot, { recursive: true, preserveTimestamps: true })
  for (const proposal of proposals) {
    const destination = path.join(run, "stage", proposal.canonical_path)
    assertInside(run, destination, `${proposal.concept_id}: staged proposal`)
    await mkdir(path.dirname(destination), { recursive: true })
    await writeFile(destination, proposal.markdown)
  }
}

function graphPreview(index) {
  const nodes = index.concepts.map((record) => ({
    concept_id: record.concept_id,
    path: knowledgeSlug(record.canonical_path),
    title: record.title,
    origin: record.origin,
  }))
  const byId = new Map(index.concepts.map((record) => [record.concept_id, record]))
  const edges = []
  const broken = []
  for (const record of index.concepts) {
    for (const targetId of record.related_concepts) {
      const target = byId.get(targetId)
      if (!target) broken.push({ source: record.concept_id, target: targetId })
      else
        edges.push({
          source: knowledgeSlug(record.canonical_path),
          target: knowledgeSlug(target.canonical_path),
        })
    }
  }
  edges.sort((left, right) =>
    `${left.source}->${left.target}`.localeCompare(`${right.source}->${right.target}`),
  )
  const leakage = [
    ...nodes.map((node) => node.path),
    ...edges.flatMap((edge) => [edge.source, edge.target]),
  ].filter((value) => !value.startsWith("brain/knowledge/"))
  const tistoryLeakage = leakage.filter((value) => value.includes("tistory"))
  return {
    schema_version: 1,
    scope: "staged-preview-only",
    production_cutover: false,
    node_count: nodes.length,
    edge_count: edges.length,
    broken_edge_count: broken.length,
    source_leakage_count: leakage.length,
    tistory_leakage_count: tistoryLeakage.length,
    nodes,
    edges,
    broken,
    leakage,
  }
}

// Mirrors the tokenizer in the Quartz search plugin
// (.quartz/plugins/search/src/components/scripts/search.inline.ts). CJK code points
// are single-character tokens; everything else splits on whitespace.
export function searchTokens(value) {
  const tokens = []
  const lower = String(value).toLowerCase()
  let bufferStart = -1
  let bufferEnd = -1
  let index = 0
  const flush = () => {
    if (bufferStart !== -1) tokens.push(lower.slice(bufferStart, bufferEnd))
    bufferStart = -1
  }
  for (const char of lower) {
    const code = char.codePointAt(0)
    const isCJK =
      (code >= 0x3040 && code <= 0x309f) ||
      (code >= 0x30a0 && code <= 0x30ff) ||
      (code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0xac00 && code <= 0xd7af) ||
      (code >= 0x20000 && code <= 0x2a6df)
    if (isCJK) {
      flush()
      tokens.push(char)
    } else if (code === 32 || code === 9 || code === 10 || code === 13) {
      flush()
    } else {
      if (bufferStart === -1) bufferStart = index
      bufferEnd = index + 1
    }
    index += char.length
  }
  flush()
  return tokens
}

// Alias identity comparison, matching both the knowledge schema's uniqueness rule and the
// search plugin's `normalizeAliasIdentity`: Unicode-normalized, trimmed, case-folded.
export function normalizeAliasIdentity(value) {
  return String(value ?? "")
    .normalize("NFC")
    .trim()
    .toLowerCase()
}

// The browser index registers `knowledgeAliases`, `title`, `content`, and `tags` with
// FlexSearch's `tokenize: "forward"`, so a query token matches a document token that starts
// with it. This resolves a query the same way, against the emitted contentIndex.json, and
// mirrors the plugin's field ordering: the alias field leads `fieldPriority`, and a document
// whose alias *is* the query is hoisted to rank 0 before the rest of the result set.
export function searchResolve(contentIndex, query) {
  const queryTokens = searchTokens(query)
  if (queryTokens.length === 0) return []
  const identity = normalizeAliasIdentity(query)
  const matches = []
  for (const [slug, entry] of Object.entries(contentIndex)) {
    const aliases = entry[CONTENT_INDEX_ALIAS_FIELD] ?? []
    const fields = [entry.title ?? "", entry.content ?? "", ...aliases, ...(entry.tags ?? [])]
    const documentTokens = fields.flatMap((field) => searchTokens(field))
    if (!queryTokens.every((token) => documentTokens.some((value) => value.startsWith(token))))
      continue
    // A knowledge alias is that document's name. The same words legitimately appear in other
    // documents' prose, so being the alias outranks merely containing it — this is the tier
    // that makes rank 0 an identity claim rather than a scoring accident.
    const aliasIdentity =
      identity !== "" && aliases.some((alias) => normalizeAliasIdentity(alias) === identity)
    const verbatim = fields.some((field) =>
      field.toLowerCase().includes(String(query).toLowerCase()),
    )
    matches.push({ slug, aliasIdentity, verbatim })
  }
  // Exact alias identity first, then a verbatim occurrence over a token-level match, which is
  // how FlexSearch scores a fully matched phrase above scattered token hits. `sort` is stable,
  // so documents within a tier keep their content-index order.
  matches.sort(
    (left, right) =>
      Number(right.aliasIdentity) - Number(left.aliasIdentity) ||
      Number(right.verbatim) - Number(left.verbatim),
  )
  return matches.map((match) => match.slug)
}

function frontmatterAliasViolations(label, data) {
  return QUARTZ_PUBLIC_ALIAS_KEYS.filter(
    (key) => data[key] !== undefined && data[key] !== null,
  ).map((key) => ({ kind: "public-alias-frontmatter-key", document: label, key }))
}

// Quartz alias redirects are tiny `<meta http-equiv="refresh">` stubs whose <title>
// is the target slug, so redirect pages pointing at a knowledge route are exactly the
// public routes an alias would have created.
async function knowledgeRedirectRoutes(stagePublic, knowledgeSlugs) {
  const files = await walkFiles(stagePublic, (absolute) => absolute.endsWith(".html"))
  const routes = []
  for (const absolute of files) {
    const info = await stat(absolute)
    if (info.size > 4096) continue
    const html = await readFile(absolute, "utf8")
    if (!html.includes('http-equiv="refresh"')) continue
    const target = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? ""
    if (!knowledgeSlugs.has(target)) continue
    routes.push({ route: toPosix(path.relative(stagePublic, absolute)), target })
  }
  return routes
}

// Approximates what Quartz's content-index emitter puts in `content`: rendered text, not
// markup. Wikilinks render as their label, and HTML comments (the alias block markers)
// render as nothing.
function renderedTextApproximation(body) {
  return body
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/^[-#>\s]*/gm, "")
}

// An equivalent full-corpus content index, built from the approved knowledge tree and
// shaped exactly like the emitted `contentIndex.json` — including the search-only alias
// metadata field. This is what lets completed-state verification measure alias ranking
// across the whole knowledge corpus without requiring a rendered Quartz build, so a
// completed run can never fall back to a body-presence-only check.
export async function knowledgeCorpusContentIndex({ root }) {
  const approvedRoot = path.join(root, KNOWLEDGE_ROOT)
  const contentIndex = {}
  if (!(await fileExists(approvedRoot))) return contentIndex
  const files = await walkFiles(approvedRoot, (absolute) => absolute.endsWith(".md"))
  for (const absolute of files) {
    const relative = toPosix(path.relative(root, absolute))
    const markdown = await readFile(absolute, "utf8")
    let parsed
    try {
      parsed = parseFrontmatter(markdown, relative)
    } catch {
      continue
    }
    const aliases = parsed.data[KNOWLEDGE_ALIAS_KEY] ?? []
    const slug = knowledgeSlug(relative)
    contentIndex[slug] = {
      slug,
      title: parsed.data.title ?? "",
      links: [],
      tags: parsed.data.tags ?? [],
      content: renderedTextApproximation(parsed.body),
      ...(aliases.length > 0 ? { [CONTENT_INDEX_ALIAS_FIELD]: aliases } : {}),
    }
  }
  return contentIndex
}

async function aliasPolicyReport({ run, proposals, stagePublic = null, corpusIndex = null }) {
  const violations = []
  let aliasCount = 0
  let searchableAliasCount = 0
  const documents = []
  for (const proposal of proposals) {
    const { data, body } = parseFrontmatter(proposal.markdown, proposal.concept_id)
    const aliases = data[KNOWLEDGE_ALIAS_KEY] ?? []
    aliasCount += aliases.length
    violations.push(...frontmatterAliasViolations(proposal.concept_id, data))
    const staged = path.join(run, "stage", proposal.canonical_path)
    if (await fileExists(staged)) {
      const stagedParsed = parseFrontmatter(await readFile(staged, "utf8"), proposal.concept_id)
      violations.push(
        ...frontmatterAliasViolations(`${proposal.concept_id} (staged)`, stagedParsed.data),
      )
    }
    for (const alias of aliases) {
      if (body.includes(alias)) searchableAliasCount += 1
      else
        violations.push({
          kind: "alias-not-searchable",
          document: proposal.concept_id,
          alias,
        })
    }
    documents.push({
      concept_id: proposal.concept_id,
      slug: knowledgeSlug(proposal.canonical_path),
      aliases,
    })
  }

  const knowledgeSlugs = new Set(documents.map((document) => document.slug))

  // Public routes are a property of a rendered build, so the route scan still requires one.
  let routeScan = null
  let renderedIndex = null
  if (stagePublic && (await fileExists(stagePublic))) {
    const routes = await knowledgeRedirectRoutes(stagePublic, knowledgeSlugs)
    const contentIndexPath = path.join(stagePublic, "static/contentIndex.json")
    if (await fileExists(contentIndexPath)) {
      renderedIndex = JSON.parse(await readFile(contentIndexPath, "utf8"))
    }
    routeScan = { scanned: true, public_alias_route_count: routes.length, routes }
    for (const route of routes) {
      violations.push({ kind: "public-alias-route", route: route.route, target: route.target })
    }
  }

  // Search ranking is measured against whichever full-corpus index is available: the
  // rendered build when there is one, otherwise the equivalent index derived from the
  // approved knowledge tree. A completed run therefore always measures resolution instead
  // of falling back to body presence, which is what produced the Batch 04 false pass.
  const contentIndex = renderedIndex ?? corpusIndex
  let searchScan = { measured: false, source: null }
  if (contentIndex) {
    // The raw book and Tistory layers legitimately contain the same words, so an alias query
    // is only required to reach its canonical document site-wide and to be that document
    // unambiguously within the knowledge layer.
    //
    // The knowledge layer is every knowledge document in the corpus, not just this run's own
    // documents. Ranking a batch against itself is what let Batch 04 report a clean alias
    // policy while 20 aliases resolved first to an older knowledge document.
    const knowledgeIndex = Object.fromEntries(
      Object.entries(contentIndex).filter(
        ([slug]) => slug.startsWith(KNOWLEDGE_SLUG_PREFIX) || knowledgeSlugs.has(slug),
      ),
    )
    const resolutions = []
    for (const document of documents) {
      const indexedAliases = contentIndex[document.slug]?.[CONTENT_INDEX_ALIAS_FIELD] ?? []
      for (const alias of document.aliases) {
        const site = searchResolve(contentIndex, alias)
        const knowledge = searchResolve(knowledgeIndex, alias)
        const siteRank = site.indexOf(document.slug)
        const knowledgeRank = knowledge.indexOf(document.slug)
        // The alias must reach the index as identity metadata, not only as body prose. Body
        // text alone is what produced the false pass, so its absence is a violation in its
        // own right even when the ranking happens to come out right.
        const indexed = indexedAliases.some(
          (value) => normalizeAliasIdentity(value) === normalizeAliasIdentity(alias),
        )
        resolutions.push({
          alias,
          slug: document.slug,
          knowledge_rank: knowledgeRank,
          site_rank: siteRank,
          site_result_count: site.length,
          alias_metadata_indexed: indexed,
        })
        if (!indexed)
          violations.push({
            kind: "alias-metadata-not-indexed",
            document: document.concept_id,
            alias,
            field: CONTENT_INDEX_ALIAS_FIELD,
          })
        if (knowledgeRank !== 0 || siteRank < 0)
          violations.push({
            kind: "alias-search-does-not-resolve",
            document: document.concept_id,
            alias,
            knowledge_rank: knowledgeRank,
            site_rank: siteRank,
          })
      }
    }
    searchScan = {
      measured: true,
      source: renderedIndex ? "rendered-build" : "approved-corpus",
      alias_index_field: CONTENT_INDEX_ALIAS_FIELD,
      knowledge_document_count: Object.keys(knowledgeIndex).length,
      search_resolutions: resolutions,
      resolved_alias_count: resolutions.filter(
        (entry) => entry.knowledge_rank === 0 && entry.site_rank >= 0,
      ).length,
      indexed_alias_metadata_count: resolutions.filter((entry) => entry.alias_metadata_indexed)
        .length,
    }
  }

  return {
    schema_version: 1,
    policy: "search-only-knowledge-aliases",
    decision: "H-1",
    status: violations.length === 0 ? "pass" : "fail",
    alias_frontmatter_key: KNOWLEDGE_ALIAS_KEY,
    quartz_public_alias_keys: [...QUARTZ_PUBLIC_ALIAS_KEYS],
    alias_count: aliasCount,
    // Body presence only. It is a necessary condition, never a sufficient one: read
    // `alias_search_scan.resolved_alias_count` for the measured search invariant.
    searchable_alias_count: searchableAliasCount,
    public_alias_route_count: routeScan?.public_alias_route_count ?? 0,
    staged_route_scan: routeScan
      ? { ...routeScan, ...searchScan, scanned: true }
      : { scanned: false, ...searchScan },
    alias_search_scan: searchScan,
    resolved_alias_search_count: searchScan.resolved_alias_count ?? null,
    violation_count: violations.length,
    violations,
  }
}

// Promotes a reviewed proposal to its approved form. Only the gate field changes, so
// the body — and with it every verified source excerpt — stays byte-identical and the
// applied bytes are known at propose time, before anyone signs.
function promoteApprovedMarkdown(markdown, label) {
  const { data, body, frontmatterBytes } = parseFrontmatter(markdown, label)
  if (data.proposal_status !== REVIEW_STATUS) {
    throw new Error(`${label}: proposal_status must be ${REVIEW_STATUS} before promotion`)
  }
  const needle = `\nproposal_status: ${REVIEW_STATUS}\n`
  if (
    !frontmatterBytes.includes(needle) ||
    frontmatterBytes.indexOf(needle) !== frontmatterBytes.lastIndexOf(needle)
  ) {
    throw new Error(`${label}: proposal_status is not a single promotable frontmatter line`)
  }
  return `${frontmatterBytes.replace(needle, `\nproposal_status: ${APPROVED_STATUS}\n`)}${body}`
}

export async function proposeKnowledge({ root, pilotPath = null, batchPath = null, run }) {
  root = path.resolve(root)
  run = path.resolve(root, run)
  assertInside(root, run, "run")
  if (Boolean(pilotPath) === Boolean(batchPath)) {
    throw new Error("propose requires exactly one of --pilot or --batch")
  }
  const batchMode = Boolean(batchPath)
  const fixtureLabel = batchMode ? "batch manifest" : "pilot fixture"
  const fixtureAbsolute = path.resolve(root, batchMode ? batchPath : pilotPath)
  assertInside(root, fixtureAbsolute, fixtureLabel)
  const fixtureSource = await readFile(fixtureAbsolute, "utf8")
  const pilot = JSON.parse(fixtureSource)
  const rejectedCandidates = batchMode
    ? (pilot.rejected_candidates ?? [])
    : pilot.rejected_candidates
  if (batchMode) {
    if (!Array.isArray(pilot.candidates) || !Array.isArray(rejectedCandidates)) {
      throw new Error("batch manifest must contain a candidates array")
    }
    if (!BATCH_ID_PATTERN.test(pilot.batch_id ?? "")) {
      throw new Error("batch manifest must declare a stable batch_id")
    }
    if (pilot.candidates.length === 0) {
      throw new Error("batch manifest must contain at least one candidate")
    }
  } else {
    if (!Array.isArray(pilot.candidates) || !Array.isArray(rejectedCandidates)) {
      throw new Error("pilot fixture must contain candidates and rejected_candidates arrays")
    }
    if (pilot.candidates.length < 8 || pilot.candidates.length > 12) {
      throw new Error("pilot must contain 8-12 accepted proposal candidates")
    }
  }
  const catalog = new Map(pilot.candidates.map((candidate) => [candidate.concept_id, candidate]))
  if (catalog.size !== pilot.candidates.length)
    throw new Error(`${batchMode ? "batch" : "pilot"} concept_id collision`)

  // Candidates are seeded last, so a candidate that revises an approved concept renders
  // from the revision under review rather than from the document it is about to replace.
  const approvedCatalog = await approvedCatalogRecords(root)
  const renderCatalog = new Map([
    ...approvedCatalog.map((record) => [record.concept_id, record]),
    ...catalog,
  ])

  const resolved = []
  for (const candidate of pilot.candidates) resolved.push(await resolveCandidate(root, candidate))
  const proposals = resolved.map((candidate) => {
    const markdown = proposalMarkdown(candidate, renderCatalog)
    return { ...candidate, markdown, proposal_sha256: sha256(markdown) }
  })

  const rejected = []
  for (const candidate of rejectedCandidates) {
    if (catalog.has(candidate.concept_id))
      throw new Error(`${candidate.concept_id}: rejected candidate overlaps accepted proposal`)
    const evidence = []
    for (const sourceEntry of candidate.sources ?? []) {
      const absolute = path.resolve(root, sourceEntry.path)
      assertInside(root, absolute, `${candidate.concept_id}: rejected source`)
      const source = await readFile(absolute, "utf8")
      const actualHash = sha256(source)
      if (actualHash !== sourceEntry.source_sha256) {
        throw new Error(`${candidate.concept_id}: rejected-source drift for ${sourceEntry.path}`)
      }
      evidence.push({ path: sourceEntry.path, source_sha256: actualHash })
    }
    rejected.push({ ...candidate, sources: evidence, proposal_created: false })
  }

  await mkdir(path.join(run, "proposals"), { recursive: true })
  const expectedProposalFiles = new Set()
  for (const proposal of proposals) {
    const relative = `proposals/${proposal.concept_id}.md`
    expectedProposalFiles.add(relative)
    await writeStable(path.join(run, relative), proposal.markdown)
  }
  const existingProposalFiles = await walkFiles(path.join(run, "proposals"), (absolute) =>
    absolute.endsWith(".md"),
  )
  for (const absolute of existingProposalFiles) {
    const relative = toPosix(path.relative(run, absolute))
    if (!expectedProposalFiles.has(relative)) await rm(absolute)
  }

  const { index, collisions, replaced } = await batchProposalIndex({
    root,
    run,
    proposalIds: new Set(proposals.map((proposal) => proposal.concept_id)),
  })
  if (replaced.length > 0 && !batchMode) {
    throw new Error(
      `proposal-only run may not re-propose approved concepts: ${replaced
        .map((record) => record.concept_id)
        .join(", ")}`,
    )
  }
  for (const record of replaced) {
    const proposal = proposals.find((entry) => entry.concept_id === record.concept_id)
    if (toPosix(proposal.canonical_path) !== toPosix(record.canonical_path)) {
      throw new Error(
        `${record.concept_id}: batch proposal may not move an approved concept (${record.canonical_path})`,
      )
    }
  }
  const preview = graphPreview(index)
  const knowledgeBefore = await treeManifest(root, KNOWLEDGE_ROOT)
  const proposalEntries = []
  for (const proposal of proposals) {
    const absolute = path.resolve(root, proposal.canonical_path)
    assertInside(root, absolute, `${proposal.concept_id}: canonical path`)
    const entry = {
      concept_id: proposal.concept_id,
      canonical_path: proposal.canonical_path,
      artifact_path: `proposals/${proposal.concept_id}.md`,
      proposal_sha256: proposal.proposal_sha256,
      source_count: proposal.sources.length,
    }
    if (batchMode) {
      const targetExists = await fileExists(absolute)
      entry.proposal_kind = proposal.proposal_kind
      entry.review_flags = [...(proposal.review_flags ?? [])].sort()
      entry.target_exists = targetExists
      entry.target_before_sha256 = targetExists ? sha256(await readFile(absolute, "utf8")) : null
      entry.applied_sha256 = sha256(promoteApprovedMarkdown(proposal.markdown, proposal.concept_id))
    }
    proposalEntries.push(entry)
  }
  const manifest = batchMode
    ? {
        schema_version: 1,
        phase: 5,
        mode: "batch",
        review_gate: BATCH_REVIEW_GATE,
        status: REVIEW_STATUS,
        batch_id: pilot.batch_id,
        batch_manifest: toPosix(path.relative(root, fixtureAbsolute)),
        batch_manifest_sha256: sha256(fixtureSource),
        batch_scope: pilot.scope ?? [],
        approved_knowledge_tree_sha256: knowledgeBefore.sha256,
        collision_count: collisions.count,
        accepted_count: proposals.length,
        rejected_count: rejected.length,
        replaced_concept_count: replaced.length,
        proposals: proposalEntries,
      }
    : {
        schema_version: 1,
        phase: 4,
        mode: "proposal-only",
        review_gate: "U2",
        status: REVIEW_STATUS,
        pilot_fixture: toPosix(path.relative(root, fixtureAbsolute)),
        pilot_fixture_sha256: sha256(fixtureSource),
        approved_knowledge_tree_sha256: knowledgeBefore.sha256,
        accepted_count: proposals.length,
        rejected_count: rejected.length,
        proposals: proposalEntries,
      }
  const provenanceReport = await measuredProvenanceReport({
    root,
    documents: proposalDocuments(run, manifest),
    catalogExtra: approvedCatalog,
  })
  if (provenanceReport.status !== "pass") {
    await writeStable(path.join(run, "provenance-report.json"), stableJson(provenanceReport))
    throw new Error("generated proposal provenance validation failed")
  }
  const linkReport = {
    status: preview.broken_edge_count === 0 && preview.source_leakage_count === 0 ? "pass" : "fail",
    knowledge_edge_count: preview.edge_count,
    broken_knowledge_link_count: preview.broken_edge_count,
    source_or_tistory_leakage_count: preview.source_leakage_count,
  }
  const reservedTagViolations = proposals.flatMap((proposal) =>
    proposal.tags
      .filter((tag) => RESERVED_TAGS.has(String(tag).toLowerCase()))
      .map((tag) => ({ concept_id: proposal.concept_id, tag })),
  )
  const manifestBytes = stableJson(manifest)
  const review = {
    schema_version: 1,
    gate: batchMode ? BATCH_REVIEW_GATE : "U2",
    ...(batchMode
      ? { batch_id: pilot.batch_id, proposal_manifest_sha256: sha256(manifestBytes) }
      : {}),
    status: REVIEW_STATUS,
    signed: false,
    reviewer: null,
    signed_at: null,
    critical_issue_count: null,
    reviewed_proposal_count: 0,
    total_proposal_count: proposals.length,
    proposals: proposals.map((proposal) => reviewRecord(proposal, proposal.proposal_sha256)),
  }
  const reviewFile = batchMode ? "batch-review.json" : "pilot-review.json"

  await writeStable(path.join(run, "concept-index.json"), stableJson(index))
  await writeStable(path.join(run, "proposal-manifest.json"), manifestBytes)
  await writeStable(path.join(run, "collision-report.json"), stableJson(collisions))
  await writeStable(path.join(run, "provenance-report.json"), stableJson(provenanceReport))
  await writeStable(path.join(run, "link-report.json"), stableJson(linkReport))
  await writeStable(
    path.join(run, "reserved-tag-report.json"),
    stableJson({
      status: reservedTagViolations.length === 0 ? "pass" : "fail",
      count: reservedTagViolations.length,
      violations: reservedTagViolations,
    }),
  )
  await writeStable(
    path.join(run, "rejected-candidates.json"),
    stableJson({
      status: "recorded-not-proposed",
      count: rejected.length,
      candidates: rejected,
    }),
  )
  await writeStable(path.join(run, "graph-preview.json"), stableJson(preview))
  let existingReview = null
  try {
    existingReview = JSON.parse(await readFile(path.join(run, reviewFile), "utf8"))
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }
  if (existingReview) {
    const existingHashes = (existingReview.proposals ?? []).map((entry) => entry.proposal_sha256)
    const nextHashes = review.proposals.map((entry) => entry.proposal_sha256)
    const staleBinding =
      batchMode && existingReview.proposal_manifest_sha256 !== review.proposal_manifest_sha256
    if (JSON.stringify(existingHashes) !== JSON.stringify(nextHashes) || staleBinding) {
      if (existingReview.signed || existingReview.status !== REVIEW_STATUS) {
        throw new Error(
          `${batchMode ? "batch" : "pilot"} inputs changed after review state advanced; use a new run`,
        )
      }
      await writeStable(path.join(run, reviewFile), stableJson(review))
    }
  } else {
    await writeStable(path.join(run, reviewFile), stableJson(review))
  }
  await stageContent(root, run, proposals)
  const aliasPolicy = await aliasPolicyReport({ run, proposals })
  await writeStable(path.join(run, "alias-policy-report.json"), stableJson(aliasPolicy))
  if (aliasPolicy.status !== "pass") {
    throw new Error(
      `search-only alias policy violated: ${JSON.stringify(aliasPolicy.violations, null, 2)}`,
    )
  }
  return {
    manifest,
    preview,
    collisions,
    provenanceReport,
    linkReport,
    aliasPolicy,
    reviewStatus: REVIEW_STATUS,
    ...(batchMode ? { batchId: pilot.batch_id, reviewFile, nextCommand: "sample" } : {}),
  }
}

function extractWikiLinks(body) {
  return [...body.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g)].map(
    (match) => match[1],
  )
}

async function fileExists(absolute) {
  try {
    await stat(absolute)
    return true
  } catch (error) {
    if (error.code === "ENOENT") return false
    throw error
  }
}

export async function verifyKnowledgeRun({ root, run }) {
  root = path.resolve(root)
  run = path.resolve(root, run)
  assertInside(root, run, "run")
  const manifestBytes = await readFile(path.join(run, "proposal-manifest.json"), "utf8")
  const manifest = JSON.parse(manifestBytes)
  if (manifest.mode === "batch") {
    return verifyKnowledgeBatch({ root, run, manifest, manifestSha256: sha256(manifestBytes) })
  }
  const review = JSON.parse(await readFile(path.join(run, "pilot-review.json"), "utf8"))
  const errors = []
  const promotion = await runLifecycleState({ run })
  if (promotion.state === "interrupted") {
    errors.push("an interrupted promotion journal is present; roll this run back before verifying")
  }
  const promoted = promotion.state === "completed"
  // A completed promotion is measured through its bound report. If the report is missing
  // or no longer hashes to the completion marker, that is a named verification failure —
  // never an ENOENT thrown out of verify, and never a silently trusted file.
  let promotionReport = null
  if (promoted) {
    const resolved = await completedRunReport({
      reportPath: path.join(run, "promotion-report.json"),
      completion: promotion.journal.completion,
      label: "this promotion",
    })
    errors.push(...resolved.errors)
    promotionReport = resolved.report
  }
  const knowledgeNow = await treeManifest(root, KNOWLEDGE_ROOT)
  if (promoted) {
    if (promotionReport) {
      // The same authoritative completed-state checker the promotion no-op runs.
      errors.push(
        ...(
          await completedRunEvidence({
            root,
            run,
            manifest,
            manifestSha256: sha256(manifestBytes),
            report: promotionReport,
            surface: "proposal-only",
          })
        ).errors,
      )
    }
  } else if (knowledgeNow.sha256 !== manifest.approved_knowledge_tree_sha256) {
    errors.push("approved knowledge content changed after proposal generation")
  }
  // After promotion the approved tree holds the same concepts as the run's proposals, so
  // the pre-promotion view counts the proposal instead of both copies — exactly as a
  // batch revision does — and every other check below reads unchanged.
  const { index, collisions } = promoted
    ? await batchProposalIndex({
        root,
        run,
        proposalIds: new Set(manifest.proposals.map((proposal) => proposal.concept_id)),
      })
    : await buildKnowledgeIndex({ root, proposalDir: path.join(run, "proposals") })
  if (collisions.count !== 0) errors.push(`collision count is ${collisions.count}`)
  const provenanceReport = await measuredProvenanceReport({
    root,
    documents: proposalDocuments(run, manifest),
    catalogExtra: await approvedCatalogRecords(root),
  })
  await writeStable(path.join(run, "provenance-report.json"), stableJson(provenanceReport))
  for (const { error } of provenanceReport.validation_errors) errors.push(error)
  for (const conceptId of provenanceReport.template_mismatches) {
    errors.push(`${conceptId}: proposal body template mismatch`)
  }
  const byId = new Map(index.concepts.map((record) => [record.concept_id, record]))
  const verifiedSourceCount = provenanceReport.verified_source_count
  const aliasProposals = []
  for (const proposalEntry of manifest.proposals) {
    const absolute = path.join(run, proposalEntry.artifact_path)
    // A proposal artifact that is gone is a named verification failure, never a raw ENOENT
    // thrown out of verify.
    if (!(await fileExists(absolute))) {
      errors.push(`${proposalEntry.concept_id}: proposal artifact is missing`)
      continue
    }
    const markdown = await readFile(absolute, "utf8")
    if (sha256(markdown) !== proposalEntry.proposal_sha256) {
      errors.push(`${proposalEntry.concept_id}: proposal bytes differ from manifest`)
      continue
    }
    const { data, body } = parseFrontmatter(markdown, proposalEntry.artifact_path)
    aliasProposals.push({
      concept_id: proposalEntry.concept_id,
      canonical_path: proposalEntry.canonical_path,
      markdown,
    })
    if (data.proposal_status !== REVIEW_STATUS)
      errors.push(`${data.concept_id}: proposal status bypassed U2`)
    if (data.canonical_path !== proposalEntry.canonical_path)
      errors.push(`${data.concept_id}: canonical path drift`)
    const expectedLinks = (data.related_concepts ?? [])
      .map((id) => {
        const target = byId.get(id)
        if (!target) {
          errors.push(`${data.concept_id}: broken related concept ${id}`)
          return null
        }
        return knowledgeSlug(target.canonical_path)
      })
      .filter(Boolean)
      .sort()
    const actualLinks = extractWikiLinks(body).sort()
    if (JSON.stringify(actualLinks) !== JSON.stringify(expectedLinks)) {
      errors.push(`${data.concept_id}: body related links differ from related_concepts`)
    }
    if (actualLinks.some((link) => !link.startsWith("brain/knowledge/"))) {
      errors.push(`${data.concept_id}: non-knowledge graph link found`)
    }
    const staged = path.join(run, "stage", data.canonical_path)
    if (
      !(await fileExists(staged)) ||
      sha256(await readFile(staged, "utf8")) !== sha256(markdown)
    ) {
      errors.push(`${data.concept_id}: staged overlay is missing or differs`)
    }
  }
  const preview = graphPreview(index)
  if (preview.broken_edge_count !== 0) errors.push("staged graph has broken knowledge links")
  if (preview.source_leakage_count !== 0 || preview.tistory_leakage_count !== 0) {
    errors.push("staged graph leaks source or Tistory nodes")
  }
  const rejected = JSON.parse(await readFile(path.join(run, "rejected-candidates.json"), "utf8"))
  for (const candidate of rejected.candidates) {
    if (candidate.proposal_created !== false)
      errors.push(`${candidate.concept_id}: rejected candidate marked proposed`)
    if (await fileExists(path.join(run, `proposals/${candidate.concept_id}.md`))) {
      errors.push(`${candidate.concept_id}: rejected candidate has a proposal note`)
    }
  }
  const totalSources = provenanceReport.source_count
  if (verifiedSourceCount !== totalSources)
    errors.push(`provenance verified ${verifiedSourceCount}/${totalSources}`)
  const reviewState = pilotReviewState({ review, manifest })
  errors.push(...reviewState.errors)
  if (promoted && reviewState.state !== "signed") {
    errors.push("a promoted run must carry a valid signed U2 pilot review")
  }
  const stagePublic = path.join(run, "stage-public")
  const buildChecked = await fileExists(stagePublic)
  let renderedGraph = null
  if (buildChecked) {
    for (const proposal of manifest.proposals) {
      const route = proposal.canonical_path.replace(/^content\//, "").replace(/\.md$/, ".html")
      if (!(await fileExists(path.join(stagePublic, route))))
        errors.push(`${proposal.concept_id}: staged HTML missing`)
    }
    const contentIndexPath = path.join(stagePublic, "static/contentIndex.json")
    if (!(await fileExists(contentIndexPath))) {
      errors.push("staged Quartz contentIndex.json is missing")
    } else {
      const contentIndex = JSON.parse(await readFile(contentIndexPath, "utf8"))
      const proposalSlugs = new Set(
        manifest.proposals.map((proposal) => knowledgeSlug(proposal.canonical_path)),
      )
      const nodes = Object.entries(contentIndex).filter(([slug]) => proposalSlugs.has(slug))
      const edges = nodes.flatMap(([source, entry]) =>
        (entry.links ?? []).map((target) => ({ source, target })),
      )
      const leakage = edges.filter(
        (edge) =>
          !edge.source.startsWith("brain/knowledge/") ||
          !edge.target.startsWith("brain/knowledge/"),
      )
      const tistoryLeakage = leakage.filter(
        (edge) => edge.source.includes("tistory") || edge.target.includes("tistory"),
      )
      renderedGraph = {
        node_count: nodes.length,
        edge_count: edges.length,
        source_leakage_count: leakage.length,
        tistory_leakage_count: tistoryLeakage.length,
      }
      if (nodes.length !== manifest.accepted_count)
        errors.push("staged Quartz knowledge node count differs")
      if (leakage.length !== 0 || tistoryLeakage.length !== 0) {
        errors.push("staged Quartz knowledge subgraph leaks source or Tistory links")
      }
    }
  }
  const aliasPolicy = await aliasPolicyReport({
    run,
    proposals: aliasProposals,
    stagePublic: buildChecked ? stagePublic : null,
  })
  await writeStable(path.join(run, "alias-policy-report.json"), stableJson(aliasPolicy))
  for (const violation of aliasPolicy.violations) {
    errors.push(`search-only alias policy: ${JSON.stringify(violation)}`)
  }
  // The completed-state checker and the pre-promotion checks overlap deliberately: a
  // finding reported by both is one finding, so identical strings collapse.
  const unique = [...new Set(errors)]
  const report = {
    schema_version: 1,
    status: unique.length === 0 ? "pass" : "fail",
    ac12_ready: unique.length === 0,
    ac13_status: reviewState.state === "signed" ? "recorded_user_u2" : "pending_user_u2",
    u2_state: reviewState.state,
    promoted,
    run_state: promotion.state,
    rolled_back: promotion.state === "rolled_back",
    promoted_count: promotionReport?.applied_count ?? null,
    proposal_count: manifest.accepted_count,
    rejected_candidate_count: manifest.rejected_count,
    collision_count: collisions.count,
    provenance_coverage_percent:
      totalSources === 0 ? 0 : (verifiedSourceCount / totalSources) * 100,
    broken_knowledge_link_count: preview.broken_edge_count,
    graph_source_leakage_count: preview.source_leakage_count,
    graph_tistory_leakage_count: preview.tistory_leakage_count,
    staged_quartz_build_checked: buildChecked,
    staged_quartz_knowledge_graph: renderedGraph,
    alias_policy: "search-only",
    alias_count: aliasPolicy.alias_count,
    searchable_alias_count: aliasPolicy.searchable_alias_count,
    public_alias_route_count: aliasPolicy.public_alias_route_count,
    resolved_alias_search_count: aliasPolicy.staged_route_scan.resolved_alias_count ?? null,
    errors: unique,
  }
  await writeStable(path.join(run, "verification-report.json"), stableJson(report))
  if (unique.length > 0) throw new Error(`knowledge verification failed:\n- ${unique.join("\n- ")}`)
  return report
}

// Phase 5 batch verification. Before apply it measures the run against an unchanged
// approved tree, exactly like Phase 4. After apply it measures the approved tree itself:
// approved documents at their exact applied bytes, unapproved proposals still absent, and
// the whole approved graph closed and leak-free (AC-14).
async function verifyKnowledgeBatch({ root, run, manifest, manifestSha256 }) {
  const errors = []
  const lifecycle = await runLifecycleState({ run })
  const rolledBack = lifecycle.state === "rolled_back"
  const applied = lifecycle.state === "completed"
  if (lifecycle.state === "interrupted") {
    errors.push("an interrupted apply journal is present; roll this run back before verifying")
  }

  let applyReport = null
  if (applied) {
    // Same contract as promotion verify: the completed run is measured through the report
    // its completion marker binds, and an unbindable report is a named failure.
    const resolved = await completedRunReport({
      reportPath: path.join(run, "apply-report.json"),
      completion: lifecycle.journal.completion,
      label: "this apply",
    })
    errors.push(...resolved.errors)
    applyReport = resolved.report
  }
  // A completed batch is measured by the one authoritative completed-state checker the
  // apply no-op also runs, so verify and re-entry cannot reach different verdicts about the
  // same evidence. Everything else measures the pre-apply run.
  const evidence = applyReport
    ? await completedRunEvidence({
        root,
        run,
        manifest,
        manifestSha256,
        report: applyReport,
        surface: "batch",
      })
    : await pendingBatchEvidence({ root, run, manifest, manifestSha256, applied })
  errors.push(...evidence.errors)

  const { index, collisions, preview, provenance, documents, aliasPolicy, sampleSha256 } = evidence
  await writeStable(path.join(run, "provenance-report.json"), stableJson(provenance))
  await writeStable(path.join(run, "alias-policy-report.json"), stableJson(aliasPolicy))
  const totalSources = provenance.source_count
  const unique = [...new Set(errors)]
  const report = {
    schema_version: 1,
    status: unique.length === 0 ? "pass" : "fail",
    phase: 5,
    mode: "batch",
    batch_id: manifest.batch_id,
    applied,
    run_state: lifecycle.state,
    rolled_back: rolledBack,
    ac14_ready: unique.length === 0,
    proposal_count: manifest.accepted_count,
    rejected_candidate_count: manifest.rejected_count,
    applied_count: applyReport?.applied_count ?? null,
    excluded_count: applyReport?.excluded_count ?? null,
    collision_count: collisions.count,
    provenance_coverage_percent:
      totalSources === 0 ? 0 : (provenance.verified_source_count / totalSources) * 100,
    broken_knowledge_link_count: preview.broken_edge_count,
    graph_source_leakage_count: preview.source_leakage_count,
    graph_tistory_leakage_count: preview.tistory_leakage_count,
    knowledge_node_count: preview.node_count,
    knowledge_edge_count: preview.edge_count,
    alias_policy: "search-only",
    alias_count: aliasPolicy.alias_count,
    searchable_alias_count: aliasPolicy.searchable_alias_count,
    public_alias_route_count: aliasPolicy.public_alias_route_count,
    // The measured search invariant, not body presence. `alias_search_evidence` names what it
    // was measured against so a completed run can never read as search-verified without one.
    alias_search_evidence: aliasPolicy.alias_search_scan.source ?? "absent",
    resolved_alias_search_count: aliasPolicy.resolved_alias_search_count,
    knowledge_document_count: aliasPolicy.alias_search_scan.knowledge_document_count ?? null,
    sample_sha256: sampleSha256,
    errors: unique,
  }
  await writeStable(path.join(run, "verification-report.json"), stableJson(report))
  if (unique.length > 0) {
    throw new Error(`knowledge batch verification failed:\n- ${unique.join("\n- ")}`)
  }
  return report
}

// The pre-apply half of batch verification, in the same shape the completed-state checker
// returns so the two branches feed one report assembler. `applied` is true only in the
// degenerate case of a completed run whose report cannot be bound to its marker: the run is
// already failing by name, and this still measures what it can.
async function pendingBatchEvidence({ root, run, manifest, manifestSha256, applied }) {
  const errors = []
  const { index, collisions } = await batchProposalIndex({
    root,
    run,
    proposalIds: new Set(manifest.proposals.map((proposal) => proposal.concept_id)),
  })
  const provenance = await measuredProvenanceReport({
    root,
    documents: proposalDocuments(run, manifest),
    catalogExtra: await approvedCatalogRecords(root),
  })
  for (const { error } of provenance.validation_errors) errors.push(error)
  for (const conceptId of provenance.template_mismatches) {
    errors.push(`${conceptId}: proposal body template mismatch`)
  }
  if (provenance.verified_source_count !== provenance.source_count) {
    errors.push(
      `provenance verified ${provenance.verified_source_count}/${provenance.source_count}`,
    )
  }
  const knowledgeNow = await treeManifest(root, KNOWLEDGE_ROOT)
  if (!applied && knowledgeNow.sha256 !== manifest.approved_knowledge_tree_sha256) {
    errors.push("approved knowledge content changed after proposal generation")
  }
  const documents = []
  for (const proposal of manifest.proposals) {
    const artifact = path.resolve(run, proposal.artifact_path)
    assertInside(run, artifact, `${proposal.concept_id}: proposal artifact`)
    if (!(await fileExists(artifact))) {
      errors.push(`${proposal.concept_id}: proposal artifact is missing`)
      continue
    }
    const markdown = await readFile(artifact, "utf8")
    if (sha256(markdown) !== proposal.proposal_sha256) {
      errors.push(`${proposal.concept_id}: proposal bytes differ from manifest`)
      continue
    }
    const { data } = parseFrontmatter(markdown, proposal.artifact_path)
    if (data.proposal_status !== REVIEW_STATUS) {
      errors.push(`${proposal.concept_id}: proposal status bypassed ${BATCH_REVIEW_GATE}`)
    } else if (
      sha256(promoteApprovedMarkdown(markdown, proposal.concept_id)) !== proposal.applied_sha256
    ) {
      errors.push(`${proposal.concept_id}: promoted bytes differ from manifest`)
    }
    if (data.canonical_path !== proposal.canonical_path) {
      errors.push(`${proposal.concept_id}: canonical path drift`)
    }
    const staged = path.join(run, "stage", proposal.canonical_path)
    if (
      !(await fileExists(staged)) ||
      sha256(await readFile(staged, "utf8")) !== sha256(markdown)
    ) {
      errors.push(`${proposal.concept_id}: staged overlay is missing or differs`)
    }
    documents.push({
      concept_id: proposal.concept_id,
      canonical_path: proposal.canonical_path,
      markdown,
      label: proposal.artifact_path,
    })
  }
  if (collisions.count !== 0) errors.push(`collision count is ${collisions.count}`)
  const preview = graphPreview(index)
  if (preview.broken_edge_count !== 0) errors.push("knowledge graph has broken knowledge links")
  if (preview.source_leakage_count !== 0 || preview.tistory_leakage_count !== 0) {
    errors.push("knowledge graph leaks source or Tistory nodes")
  }
  errors.push(...documentLinkErrors({ documents, index }))
  errors.push(...(await rejectedCandidateErrors({ run })))
  let sampleSha256 = null
  const samplePath = path.join(run, "sample.json")
  if (await fileExists(samplePath)) {
    const sampleBytes = await readFile(samplePath, "utf8")
    sampleSha256 = sha256(sampleBytes)
    try {
      errors.push(...(await canonicalSampleErrors({ run, manifest, manifestSha256, sampleBytes })))
    } catch {
      errors.push("sample.json is not valid JSON")
    }
  } else if (applied) {
    errors.push("sample.json is missing for an applied batch")
  }
  const pendingStagePublic = path.join(run, "stage-public")
  const aliasPolicy = await aliasPolicyReport({
    run,
    proposals: documents,
    stagePublic: (await fileExists(pendingStagePublic)) ? pendingStagePublic : null,
  })
  for (const violation of aliasPolicy.violations) {
    errors.push(`search-only alias policy: ${JSON.stringify(violation)}`)
  }
  return {
    errors: [...new Set(errors)],
    index,
    collisions,
    preview,
    provenance,
    documents,
    aliasPolicy,
    sampleSha256,
  }
}

// § 5.1 sample rule. Every flagged proposal is reviewed in full; the remainder is drawn
// deterministically from a seed over the batch identity and the approved-tree baseline,
// so the same run always yields the same draw (AC-15), and the draw is widened until each
// proposal kind present in the pool is represented.
export async function sampleKnowledgeBatch({ root, run }) {
  root = path.resolve(root)
  run = path.resolve(root, run)
  assertInside(root, run, "run")
  const manifestBytes = await readFile(path.join(run, "proposal-manifest.json"), "utf8")
  const manifest = JSON.parse(manifestBytes)
  if (manifest.mode !== "batch") throw new Error("sample requires a batch run")
  const sample = computeBatchSample({ manifest, manifestSha256: sha256(manifestBytes) })
  await writeStable(path.join(run, "sample.json"), stableJson(sample))
  return sample
}

// The sample is a pure function of the manifest, so apply and verify can rederive it and
// refuse a hand-edited `sample.json` instead of trusting the file's own `selected[]`
// (independent Phase 5 verification, F1).
function computeBatchSample({ manifest, manifestSha256 }) {
  const seedInputs = {
    batch_id: manifest.batch_id,
    approved_knowledge_tree_sha256: manifest.approved_knowledge_tree_sha256,
    batch_manifest_sha256: manifest.batch_manifest_sha256,
    proposal_manifest_sha256: manifestSha256,
  }
  const seed = sha256(stableJson(seedInputs))
  const entries = manifest.proposals.map((proposal) => ({
    concept_id: proposal.concept_id,
    proposal_kind: proposal.proposal_kind,
    proposal_sha256: proposal.proposal_sha256,
    review_flags: proposal.review_flags ?? [],
    rank: sha256(`${seed}:${proposal.concept_id}`),
  }))
  const mandatory = entries
    .filter((entry) => entry.review_flags.length > 0)
    .sort((left, right) => left.concept_id.localeCompare(right.concept_id))
    .map((entry) => ({
      ...entry,
      mandatory: true,
      reason: `review-flag:${entry.review_flags.join("+")}`,
    }))
  const pool = entries
    .filter((entry) => entry.review_flags.length === 0)
    .sort(
      (left, right) =>
        left.rank.localeCompare(right.rank) || left.concept_id.localeCompare(right.concept_id),
    )
  const quota = Math.min(pool.length, Math.max(5, Math.ceil(pool.length * 0.1)))
  const chosen = new Map(
    pool.slice(0, quota).map((entry) => [entry.concept_id, { ...entry, reason: "seeded-quota" }]),
  )
  for (const kind of [...new Set(pool.map((entry) => entry.proposal_kind))].sort()) {
    if ([...chosen.values()].some((entry) => entry.proposal_kind === kind)) continue
    const first = pool.find((entry) => entry.proposal_kind === kind)
    chosen.set(first.concept_id, { ...first, reason: `category-coverage:${kind}` })
  }
  const discretionary = pool
    .filter((entry) => chosen.has(entry.concept_id))
    .map((entry) => ({ ...chosen.get(entry.concept_id), mandatory: false }))
  const selected = [...mandatory, ...discretionary]
  const selectedIds = new Set(selected.map((entry) => entry.concept_id))
  return {
    schema_version: 1,
    rule: "full review of flagged proposals plus a baseline-seeded max(5, ceil(10%)) draw covering every proposal kind present",
    batch_id: manifest.batch_id,
    proposal_manifest_sha256: manifestSha256,
    seed,
    seed_inputs: seedInputs,
    total_proposal_count: entries.length,
    mandatory_count: mandatory.length,
    discretionary_pool_count: pool.length,
    discretionary_quota: quota,
    sampled_count: selected.length,
    categories_covered: [...new Set(selected.map((entry) => entry.proposal_kind))].sort(),
    selected,
    not_selected: entries
      .filter((entry) => !selectedIds.has(entry.concept_id))
      .sort((left, right) => left.concept_id.localeCompare(right.concept_id)),
  }
}

// Reads `sample.json` and requires it to be byte-identical to the sample this manifest
// derives, so altering `selected`, the counts, the ranks, the mandatory flags, or the
// category coverage cannot shrink the reviewed set.
async function canonicalSampleErrors({ run, manifest, manifestSha256, sampleBytes }) {
  const errors = []
  if (JSON.parse(sampleBytes).proposal_manifest_sha256 !== manifestSha256) {
    errors.push("sample proposal manifest hash differs from the run manifest")
  }
  if (sampleBytes !== stableJson(computeBatchSample({ manifest, manifestSha256 }))) {
    errors.push("sample.json differs from the canonical deterministic sample for this run")
  }
  return errors
}

// A signed review must be internally valid, not merely non-pending: every decision is one
// of the three contract values, every entry carries a critical-issue array, and the
// top-level count is recomputed from the entries so an approved review can never carry an
// unresolved critical issue (independent Phase 5 verification, F2).
function reviewDecisionErrors(review, gate) {
  const errors = []
  let criticalIssueCount = 0
  for (const entry of review.proposals) {
    if (!entry || typeof entry.concept_id !== "string" || !entry.concept_id.trim()) {
      errors.push(`${gate} review has an entry without a concept_id`)
      continue
    }
    if (!REVIEW_DECISIONS.has(entry.decision)) {
      errors.push(
        `${entry.concept_id}: decision must be approve, reject, or pending (found ${JSON.stringify(
          entry.decision,
        )})`,
      )
    }
    if (!Array.isArray(entry.critical_issues)) {
      errors.push(`${entry.concept_id}: critical_issues must be an array`)
      continue
    }
    criticalIssueCount += entry.critical_issues.length
  }
  if (criticalIssueCount !== 0) {
    errors.push(`${gate} review records ${criticalIssueCount} unresolved critical issue(s)`)
  }
  if (review.critical_issue_count !== criticalIssueCount) {
    errors.push(
      `${gate} review critical_issue_count ${JSON.stringify(
        review.critical_issue_count,
      )} disagrees with its own entries (${criticalIssueCount})`,
    )
  }
  return errors
}

// A signed U2 pilot record is usable — by verify, and by the one-time promotion — only
// when it is approved, signed, complete, free of critical issues, and hash-bound to every
// proposal in the run's manifest.
function signedPilotReviewErrors({ review, manifest }) {
  const errors = []
  if (review.gate !== PILOT_REVIEW_GATE) {
    errors.push(`pilot review gate is ${JSON.stringify(review.gate)}, not ${PILOT_REVIEW_GATE}`)
  }
  if (review.status !== APPROVED_STATUS) {
    errors.push(`pilot review status is ${JSON.stringify(review.status)}, not ${APPROVED_STATUS}`)
  }
  if (review.signed !== true) errors.push("pilot review is not signed")
  if (typeof review.reviewer !== "string" || !review.reviewer.trim()) {
    errors.push("pilot review records no reviewer")
  }
  if (typeof review.signed_at !== "string" || !review.signed_at.trim()) {
    errors.push("pilot review records no signed_at")
  }
  if (review.critical_issue_count !== 0) {
    errors.push(
      `pilot review records ${JSON.stringify(review.critical_issue_count)} critical issues`,
    )
  }
  if (!Array.isArray(review.proposals)) {
    errors.push("pilot review has no proposals array")
    return errors
  }
  errors.push(...reviewDecisionErrors(review, PILOT_REVIEW_GATE))
  const decided = review.proposals.filter((entry) => entry?.decision !== "pending").length
  if (
    review.reviewed_proposal_count !== decided ||
    review.total_proposal_count !== review.proposals.length
  ) {
    errors.push("pilot review counts disagree with its own decisions")
  }
  if (review.reviewed_proposal_count !== review.total_proposal_count) {
    errors.push(
      `pilot review is incomplete (${review.reviewed_proposal_count}/${review.total_proposal_count} decided)`,
    )
  }
  const byId = new Map()
  for (const entry of review.proposals) {
    if (byId.has(entry?.concept_id)) {
      errors.push(`pilot review repeats a concept_id (${entry.concept_id})`)
    }
    byId.set(entry?.concept_id, entry)
  }
  const manifestIds = new Set(manifest.proposals.map((proposal) => proposal.concept_id))
  for (const entry of review.proposals) {
    if (!manifestIds.has(entry?.concept_id)) {
      errors.push(`pilot review decides a proposal absent from the manifest (${entry?.concept_id})`)
    }
  }
  for (const proposal of manifest.proposals) {
    const entry = byId.get(proposal.concept_id)
    if (!entry) {
      errors.push(`${proposal.concept_id}: manifest proposal is missing from the pilot review`)
      continue
    }
    if (entry.proposal_sha256 !== proposal.proposal_sha256) {
      errors.push(`${proposal.concept_id}: reviewed proposal hash differs from the manifest`)
    }
    if (entry.canonical_path !== undefined && entry.canonical_path !== proposal.canonical_path) {
      errors.push(`${proposal.concept_id}: reviewed canonical path differs from the manifest`)
    }
  }
  return errors
}

// The U3 batch counterpart. Apply gates on it before the first write and the completed
// evidence checker re-runs it against the *current* review bytes, so a review that stops
// satisfying the contract after apply is drift rather than settled history.
function signedBatchReviewErrors({ review, manifest, manifestSha256 }) {
  const errors = []
  if (review.gate !== BATCH_REVIEW_GATE) {
    errors.push(`batch review gate is ${JSON.stringify(review.gate)}, not ${BATCH_REVIEW_GATE}`)
  }
  if (review.status !== APPROVED_STATUS) {
    errors.push(`batch review status is ${JSON.stringify(review.status)}, not ${APPROVED_STATUS}`)
  }
  if (review.signed !== true) errors.push("batch review is not signed")
  if (typeof review.reviewer !== "string" || !review.reviewer.trim()) {
    errors.push("batch review records no reviewer")
  }
  if (typeof review.signed_at !== "string" || !review.signed_at.trim()) {
    errors.push("batch review records no signed_at")
  }
  if (review.critical_issue_count !== 0) {
    errors.push(
      `batch review records ${JSON.stringify(review.critical_issue_count)} critical issues`,
    )
  }
  if (!Array.isArray(review.proposals)) {
    errors.push("batch review has no proposals array")
    return errors
  }
  errors.push(...reviewDecisionErrors(review, BATCH_REVIEW_GATE))
  if (review.batch_id !== manifest.batch_id) {
    errors.push(
      `review batch identity differs from the run (${review.batch_id} != ${manifest.batch_id})`,
    )
  }
  if (review.proposal_manifest_sha256 !== manifestSha256) {
    errors.push("review proposal manifest hash differs from the run manifest")
  }
  const decided = review.proposals.filter((entry) => entry?.decision !== "pending").length
  if (
    review.reviewed_proposal_count !== decided ||
    review.total_proposal_count !== review.proposals.length
  ) {
    errors.push("batch review counts disagree with its own decisions")
  }
  const byId = new Map()
  for (const entry of review.proposals) {
    if (byId.has(entry?.concept_id)) {
      errors.push(`batch review repeats a concept_id (${entry?.concept_id})`)
    }
    byId.set(entry?.concept_id, entry)
  }
  const manifestIds = new Set(manifest.proposals.map((proposal) => proposal.concept_id))
  for (const entry of review.proposals) {
    if (!manifestIds.has(entry?.concept_id)) {
      errors.push(`review decides a proposal absent from the manifest (${entry?.concept_id})`)
    }
  }
  for (const proposal of manifest.proposals) {
    const entry = byId.get(proposal.concept_id)
    if (entry && entry.proposal_sha256 !== proposal.proposal_sha256) {
      errors.push(`reviewed proposal hash differs from the manifest (${proposal.concept_id})`)
    }
  }
  return errors
}

// The proposal-only handoff record is valid in exactly two shapes: the unsigned scaffold
// U2 is still waiting on, or a fully signed and approved U2 record. Every other
// combination — signed but pending, approved but unsigned, signed with a missing reviewer
// or an undecided proposal — fails closed.
function pilotReviewState({ review, manifest }) {
  if (review.signed === false && review.status === REVIEW_STATUS) {
    return { state: "unsigned", errors: [] }
  }
  if (review.signed !== true) {
    return {
      state: "malformed",
      errors: [
        `pilot review must be either unsigned and ${REVIEW_STATUS} or signed and ${APPROVED_STATUS}`,
      ],
    }
  }
  const errors = signedPilotReviewErrors({ review, manifest })
  return { state: errors.length === 0 ? "signed" : "malformed", errors }
}

async function appendJournal(handle, entry) {
  await handle.write(`${JSON.stringify(entry)}\n`)
  await handle.sync()
}

// The intent record is on disk before the mutation and the completed record after it, so
// an apply killed at any point leaves a journal that names every path it may have
// touched. Fault hooks exist so the interruption path is testable rather than argued.
async function runJournaledMutation(state, operation, mutate) {
  const entry = { id: state.nextId, state: "intent", ...operation }
  state.nextId += 1
  await appendJournal(state.handle, entry)
  state.intentCount += 1
  if (
    Number.isInteger(state.faultAfterIntentOperations) &&
    state.intentCount >= state.faultAfterIntentOperations
  ) {
    throw new Error(`injected apply interruption after intent ${state.intentCount}`)
  }
  await mutate()
  state.mutationCount += 1
  if (
    Number.isInteger(state.faultAfterMutationOperations) &&
    state.mutationCount >= state.faultAfterMutationOperations
  ) {
    throw new Error(`injected apply interruption after mutation ${state.mutationCount}`)
  }
  await appendJournal(state.handle, { id: entry.id, state: "completed" })
  state.operationCount += 1
  if (
    Number.isInteger(state.faultAfterOperations) &&
    state.operationCount >= state.faultAfterOperations
  ) {
    throw new Error(`injected apply interruption after operation ${state.operationCount}`)
  }
}

async function ensureDirectoryWithJournal(root, relative, state) {
  const missing = []
  let cursor = relative
  while (cursor && cursor !== "." && !(await fileExists(path.resolve(root, cursor)))) {
    missing.push(cursor)
    cursor = toPosix(path.dirname(cursor))
  }
  for (const directory of missing.reverse()) {
    await runJournaledMutation(
      state,
      { operation: "created", entryType: "directory", path: directory },
      () => mkdir(path.resolve(root, directory)),
    )
  }
}

// The journal is the lifecycle attestation, so it is parsed as a strict grammar rather
// than scanned for the records we happen to recognize. Every violation below is a named
// lifecycle error thrown before any classification, so a corrupt, truncated, ambiguous, or
// undocumented journal fails closed instead of being silently reinterpreted (independent
// Phase 5 verification, finding 3).
class JournalGrammarError extends Error {
  constructor(detail) {
    super(`journal.jsonl is invalid: ${detail}`)
    this.name = "JournalGrammarError"
  }
}

const JOURNAL_STATES = new Set([
  "intent",
  "completed",
  "apply-completed",
  "rollback-completed",
  "rollback-finalized",
])
// The two phases every journal moves through, in this order and never back. An apply phase
// writes `intent`/`completed`/`apply-completed`; the first rollback record closes it for
// good. Naming the rollback record kinds once is what lets the phase rule and the
// post-completion rule state the same boundary instead of two drifting lists.
const JOURNAL_ROLLBACK_STATES = new Set(["rollback-completed", "rollback-finalized"])
const JOURNAL_ROLLBACK_ACTIONS = new Set(["noop", "restored"])

function isSha256Field(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value)
}

function isCountField(value) {
  return Number.isInteger(value) && value >= 0
}

// Line-addressed so a refusal names the exact record. A trailing newline is the writer's
// own record separator; any other blank line is corruption, and a line that does not parse
// is a truncated append rather than a raw `SyntaxError` leaking out of re-entry.
function journalRecords(source) {
  const lines = source.split("\n")
  const records = []
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (line === "") {
      if (index === lines.length - 1) continue
      throw new JournalGrammarError(`line ${index + 1} is blank`)
    }
    let record
    try {
      record = JSON.parse(line)
    } catch {
      throw new JournalGrammarError(`line ${index + 1} is not valid JSON (truncated or corrupt)`)
    }
    if (record === null || typeof record !== "object" || Array.isArray(record)) {
      throw new JournalGrammarError(`line ${index + 1} is not a journal record object`)
    }
    records.push({ record, line: index + 1 })
  }
  return records
}

function validateIntentRecord(record, line, operations, lastIntentId) {
  if (!Number.isInteger(record.id) || record.id < 1) {
    throw new JournalGrammarError(
      `line ${line} intent has no positive integer id (${JSON.stringify(record.id)})`,
    )
  }
  if (operations.has(record.id)) {
    throw new JournalGrammarError(`line ${line} repeats intent id ${record.id}`)
  }
  if (record.id <= lastIntentId) {
    throw new JournalGrammarError(
      `line ${line} intent id ${record.id} does not follow ${lastIntentId} in order`,
    )
  }
  if (typeof record.path !== "string" || !record.path.trim()) {
    throw new JournalGrammarError(`line ${line} intent names no path`)
  }
  if (record.operation === "created") {
    if (record.entryType !== "file" && record.entryType !== "directory") {
      throw new JournalGrammarError(
        `line ${line} created intent has no file/directory entryType (${JSON.stringify(record.entryType)})`,
      )
    }
    if (record.entryType === "file" && !isSha256Field(record.postSha256)) {
      throw new JournalGrammarError(`line ${line} created file intent has no postSha256`)
    }
    if (record.entryType === "directory" && record.postSha256 !== undefined) {
      throw new JournalGrammarError(`line ${line} created directory intent records a postSha256`)
    }
    return
  }
  if (record.operation === "modified") {
    if (record.entryType !== undefined) {
      throw new JournalGrammarError(`line ${line} modified intent records an entryType`)
    }
    if (!isSha256Field(record.beforeSha256) || !isSha256Field(record.postSha256)) {
      throw new JournalGrammarError(`line ${line} modified intent has no before/after hash pair`)
    }
    return
  }
  throw new JournalGrammarError(
    `line ${line} intent records unknown operation ${JSON.stringify(record.operation)}`,
  )
}

function parseJournal(source) {
  const operations = new Map()
  const completedOperations = new Set()
  const rollbackCompleted = new Set()
  const rollbackCompletedLines = new Map()
  let completion = null
  let rollbackFinalized = false
  let lastIntentId = 0
  // Line of the record that opened the rollback phase, or 0 while still applying. A journal
  // moves apply → rollback exactly once and never back, so this doubles as the phase state
  // and as the evidence a refusal cites.
  let rollbackPhaseLine = 0

  for (const { record, line } of journalRecords(source)) {
    if (!JOURNAL_STATES.has(record.state)) {
      throw new JournalGrammarError(
        `line ${line} records unknown state ${JSON.stringify(record.state)}`,
      )
    }
    // Terminal exclusivity. `rollback-finalized` is the last record a journal may ever
    // carry; `apply-completed` may only be followed by the rollback records that undo it.
    if (rollbackFinalized) {
      throw new JournalGrammarError(
        record.state === "rollback-finalized"
          ? `line ${line} repeats the rollback-finalized terminal record`
          : `line ${line} records ${record.state} after the rollback-finalized terminal record`,
      )
    }
    // Phase order. Undoing a run is strictly later than performing it, so the first
    // rollback record closes the apply phase and no `intent`, `completed`, or
    // `apply-completed` may follow it. Without this the parser accepted journals no writer
    // can produce — a run rolled back before it completed, or an operation completed after
    // it was undone — and then classified them `rolled_back` while the tree was still
    // applied, which made rollback skip every operation and left the run unrestorable
    // (Phase 5 completed-state repair independent verification, C3).
    if (rollbackPhaseLine > 0 && !JOURNAL_ROLLBACK_STATES.has(record.state)) {
      throw new JournalGrammarError(
        record.state === "completed" && rollbackCompleted.has(record.id)
          ? `line ${line} completes intent ${record.id} already recorded rolled back at line ${rollbackCompletedLines.get(record.id)}`
          : `line ${line} records ${record.state} after the rollback record at line ${rollbackPhaseLine}`,
      )
    }
    if (JOURNAL_ROLLBACK_STATES.has(record.state) && rollbackPhaseLine === 0) {
      rollbackPhaseLine = line
    }
    if (completion) {
      if (record.state === "apply-completed") {
        throw new JournalGrammarError(`line ${line} repeats the apply-completed terminal record`)
      }
      if (!JOURNAL_ROLLBACK_STATES.has(record.state)) {
        throw new JournalGrammarError(
          `line ${line} records ${record.state} after the apply-completed marker`,
        )
      }
    }
    if (record.state === "intent") {
      validateIntentRecord(record, line, operations, lastIntentId)
      lastIntentId = record.id
      operations.set(record.id, record)
      continue
    }
    if (record.state === "completed") {
      if (!operations.has(record.id)) {
        throw new JournalGrammarError(
          `line ${line} completes unjournalled intent id ${JSON.stringify(record.id)}`,
        )
      }
      if (completedOperations.has(record.id)) {
        throw new JournalGrammarError(
          `line ${line} repeats the completed record for intent ${record.id}`,
        )
      }
      completedOperations.add(record.id)
      continue
    }
    if (record.state === "rollback-completed") {
      if (!operations.has(record.id)) {
        throw new JournalGrammarError(
          `line ${line} rolls back unjournalled intent id ${JSON.stringify(record.id)}`,
        )
      }
      if (rollbackCompleted.has(record.id)) {
        throw new JournalGrammarError(
          `line ${line} repeats the rollback-completed record for intent ${record.id}`,
        )
      }
      if (!JOURNAL_ROLLBACK_ACTIONS.has(record.action)) {
        throw new JournalGrammarError(
          `line ${line} rollback-completed records unknown action ${JSON.stringify(record.action)}`,
        )
      }
      rollbackCompleted.add(record.id)
      rollbackCompletedLines.set(record.id, line)
      continue
    }
    if (record.state === "apply-completed") {
      if (!isCountField(record.operationCount)) {
        throw new JournalGrammarError(`line ${line} apply-completed has no operationCount`)
      }
      if (typeof record.report !== "string" || !record.report.trim()) {
        throw new JournalGrammarError(`line ${line} apply-completed binds no report`)
      }
      if (!isSha256Field(record.reportSha256)) {
        throw new JournalGrammarError(`line ${line} apply-completed binds no reportSha256`)
      }
      if (
        record.operationCount !== operations.size ||
        completedOperations.size !== operations.size
      ) {
        throw new JournalGrammarError(
          `line ${line} apply-completed claims ${record.operationCount} operation(s) over ${completedOperations.size} completed of ${operations.size} journalled`,
        )
      }
      completion = record
      continue
    }
    if (
      !isCountField(record.operationCount) ||
      !isCountField(record.restoredCount) ||
      !isCountField(record.restoredDirectoryCount) ||
      !isCountField(record.noopCount)
    ) {
      throw new JournalGrammarError(`line ${line} rollback-finalized has malformed counts`)
    }
    if (!isSha256Field(record.knowledgeTreeSha256)) {
      throw new JournalGrammarError(
        `line ${line} rollback-finalized records no knowledgeTreeSha256`,
      )
    }
    if (record.operationCount !== operations.size) {
      throw new JournalGrammarError(
        `line ${line} rollback-finalized claims ${record.operationCount} operation(s) over ${operations.size} journalled`,
      )
    }
    // A finalized rollback asserts the run was undone, so every journalled operation must
    // already carry its `rollback-completed` record. This is also what keeps the one legal
    // completion-plus-rollback journal — rolling back a completed run — distinguishable
    // from a `rollback-finalized` appended to a completed run that was never undone.
    const outstanding = [...operations.keys()].filter((id) => !rollbackCompleted.has(id))
    if (outstanding.length > 0) {
      throw new JournalGrammarError(
        completion
          ? `line ${line} finalizes a rollback of a completed run with ${outstanding.length} operation(s) still applied`
          : `line ${line} finalizes a rollback with ${outstanding.length} operation(s) still applied`,
      )
    }
    rollbackFinalized = record
  }

  return {
    operations: [...operations.values()],
    completedOperations,
    rollbackCompleted,
    completion,
    completed: completion !== null,
    rollbackFinalized,
  }
}

// One lifecycle for both write paths. Promotion and batch apply share the journal format
// byte-for-byte, so a state they classify differently is a recovery gap in whichever one
// disagrees; these five states are the whole contract.
//
// `reset` is the repair for the pre-intent crash window. A journal is created and fsynced
// before the first `intent`, so an interruption in that window leaves a zero-byte journal:
// valid, un-completed, and — before this — permanently `interrupted`, because a rollback
// with no operations to undo appended nothing and changed nothing. A journal whose
// rollback finalized with zero operations names a run that never recorded an intent, so it
// cannot have mutated anything; once rollback has measured the tree back to the before
// snapshot, the run is exactly where it started and may be started again.
//
// `rolled_back` outranks the completion marker, which is only sound because the grammar
// above proves the rollback records came after the apply phase closed. A journal that
// interleaved them would classify a still-applied tree as undone.
function journalRunState(journal) {
  const fullyRolledBack =
    journal.operations.length > 0 &&
    journal.operations.every((entry) => journal.rollbackCompleted.has(entry.id))
  if (journal.rollbackFinalized && journal.operations.length === 0) return "reset"
  if (journal.rollbackFinalized || fullyRolledBack) return "rolled_back"
  if (!journal.completed) return "interrupted"
  return "completed"
}

async function runLifecycleState({ run }) {
  const journalPath = path.join(run, "journal.jsonl")
  if (!(await fileExists(journalPath))) return { state: "none", journal: null }
  const journal = parseJournal(await readFile(journalPath, "utf8"))
  return { state: journalRunState(journal), journal }
}

// A completed run must stay verifiable, so its report is fsynced *before* the completion
// marker that names it and the marker carries the report's hash. No interruption can
// therefore leave a marker without a matching report; a marker whose report is missing,
// truncated, or edited is storage loss or tampering, and it is named here rather than
// surfacing as a raw ENOENT or a silently trusted file from deep inside re-entry.
async function completedRunReport({ reportPath, completion, label }) {
  const name = path.basename(reportPath)
  let bytes = null
  try {
    bytes = await readFile(reportPath, "utf8")
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }
  const bound = typeof completion?.reportSha256 === "string" ? completion.reportSha256 : null
  if (bound === null) {
    return {
      report: null,
      errors: [`${label} completion marker does not bind ${name}; roll this run back`],
    }
  }
  if (bytes === null) {
    return {
      report: null,
      errors: [`${label} is recorded complete but ${name} is missing; roll this run back`],
    }
  }
  if (sha256(bytes) !== bound) {
    return {
      report: null,
      errors: [`${label} ${name} bytes differ from the completion marker; roll this run back`],
    }
  }
  return { report: JSON.parse(bytes), errors: [] }
}

// The last thing a write path does: fsync the report, then fsync a completion marker bound
// to its exact bytes. The order is the durability contract — a crash before the report
// leaves an interrupted journal that rolls back, and a crash between the two leaves the
// same interrupted journal plus an unbound report that rollback discards. There is no
// window in which a run reads as complete without a report that verifies against it.
async function completeJournaledRun({ handle, reportPath, report, state, fault }) {
  const bytes = stableJson(report)
  await writeDurable(reportPath, bytes)
  if (fault) throw new Error("injected apply interruption before the completion marker")
  await appendJournal(handle, {
    state: "apply-completed",
    operationCount: state.operationCount,
    report: path.basename(reportPath),
    reportSha256: sha256(bytes),
  })
}

// Recovery reads the filesystem, not the journal's own bookkeeping: an apply killed
// between mutation and completed record is indistinguishable in the journal but obvious
// on disk, and that is what decides whether an entry still needs undoing.
async function journaledMutationState(root, entry) {
  const absolute = path.resolve(root, entry.path)
  assertInside(root, absolute, `${entry.path}: journal entry`)
  if (entry.operation === "modified") {
    if (!(await fileExists(absolute))) throw new Error(`rollback drift: missing ${entry.path}`)
    const current = sha256(await readFile(absolute, "utf8"))
    if (current === entry.postSha256) return "applied"
    if (current === entry.beforeSha256) return "restored"
    throw new Error(`rollback drift: ${entry.path}`)
  }
  if (entry.operation === "created") {
    if (!(await fileExists(absolute))) return "restored"
    if (entry.entryType === "directory") return "applied"
    if (sha256(await readFile(absolute, "utf8")) !== entry.postSha256) {
      throw new Error(`rollback drift: ${entry.path}`)
    }
    return "applied"
  }
  throw new Error(`unknown journal operation: ${entry.operation}`)
}

// Measures the approved tree against a completed apply report: approved documents at
// their exact applied bytes, and every unapproved proposal still absent or untouched.
async function appliedStateErrors({ root, manifest, report }) {
  const errors = []
  const applied = new Map(report.applied.map((entry) => [entry.concept_id, entry]))
  for (const proposal of manifest.proposals) {
    const absolute = path.resolve(root, proposal.canonical_path)
    assertInside(root, absolute, `${proposal.concept_id}: canonical path`)
    const present = await fileExists(absolute)
    const record = applied.get(proposal.concept_id)
    if (record) {
      if (!present) {
        errors.push(`${proposal.concept_id}: applied document is missing`)
      } else if (sha256(await readFile(absolute, "utf8")) !== record.applied_sha256) {
        errors.push(`${proposal.concept_id}: applied bytes differ from the apply report`)
      }
      continue
    }
    if (!proposal.target_exists) {
      if (present) {
        errors.push(`${proposal.concept_id}: unapproved proposal is present in approved content`)
      }
      continue
    }
    if (!present) errors.push(`${proposal.concept_id}: unapproved target disappeared`)
    else if (sha256(await readFile(absolute, "utf8")) !== proposal.target_before_sha256) {
      errors.push(`${proposal.concept_id}: unapproved target bytes changed`)
    }
  }
  const after = await treeManifest(root, KNOWLEDGE_ROOT)
  if (after.sha256 !== report.after_knowledge_tree_sha256) {
    errors.push("approved knowledge tree differs from the apply report")
  }
  return errors
}

async function applyProposalOnlyRun({ root, run }) {
  const review = JSON.parse(await readFile(path.join(run, "pilot-review.json"), "utf8"))
  if (
    review.status !== "approved" ||
    review.signed !== true ||
    typeof review.reviewer !== "string" ||
    !review.reviewer.trim() ||
    typeof review.signed_at !== "string" ||
    review.critical_issue_count !== 0 ||
    review.reviewed_proposal_count !== review.total_proposal_count
  ) {
    throw new Error(
      "apply refused: U2 pilot review is unsigned, incomplete, pending, or has critical issues",
    )
  }
  // Generic apply stays permanently unavailable here. A signed U2 pilot has exactly one
  // write path, the explicit one-time `promote` command, and it is never reachable by
  // running `apply` against a proposal-only run.
  throw new Error(
    "apply is intentionally unavailable in the Phase 4 proposal-only surface; a signed U2 pilot is written only by the explicit one-time `promote` command",
  )
}

// Body wiki links must be exactly the document's declared `related_concepts`, resolved
// against the index the caller measured, and every edge must stay inside the knowledge
// layer. Shared so the pre-write, completed, and pre-apply views close the graph the same
// way.
function documentLinkErrors({ documents, index }) {
  const errors = []
  const conceptById = new Map(index.concepts.map((record) => [record.concept_id, record]))
  for (const document of documents) {
    const { data, body } = parseFrontmatter(document.markdown, document.label)
    const expectedLinks = (data.related_concepts ?? [])
      .map((id) => {
        const target = conceptById.get(id)
        if (!target) {
          errors.push(`${data.concept_id}: broken related concept ${id}`)
          return null
        }
        return knowledgeSlug(target.canonical_path)
      })
      .filter(Boolean)
      .sort()
    const actualLinks = extractWikiLinks(body).sort()
    if (JSON.stringify(actualLinks) !== JSON.stringify(expectedLinks)) {
      errors.push(`${data.concept_id}: body related links differ from related_concepts`)
    }
    if (actualLinks.some((link) => !link.startsWith("brain/knowledge/"))) {
      errors.push(`${data.concept_id}: non-knowledge graph link found`)
    }
  }
  return errors
}

async function rejectedCandidateErrors({ run }) {
  const rejectedPath = path.join(run, "rejected-candidates.json")
  if (!(await fileExists(rejectedPath))) return ["rejected-candidates.json is missing"]
  let rejected
  try {
    rejected = JSON.parse(await readFile(rejectedPath, "utf8"))
  } catch {
    return ["rejected-candidates.json is not valid JSON"]
  }
  const errors = []
  for (const candidate of rejected.candidates ?? []) {
    if (candidate.proposal_created !== false) {
      errors.push(`${candidate.concept_id}: rejected candidate marked proposed`)
    }
    if (await fileExists(path.join(run, `proposals/${candidate.concept_id}.md`))) {
      errors.push(`${candidate.concept_id}: rejected candidate has a proposal note`)
    }
  }
  return errors
}

// THE authoritative completed-state evidence checker. `verify` and the completed no-op
// re-entry of both write paths — signed-U2 `promote` and batch `apply` — call exactly this
// and nothing else to decide whether a completed run still holds, so a state one accepts
// and the other refuses is impossible by construction (independent Phase 5 verification,
// findings 1 and 2).
//
// It re-reads and re-hashes the whole current evidence set: the manifest identity the
// report is bound to, the signed review's exact bytes *and* its full decision contract,
// the canonical sample (batch), every proposal artifact's bytes, the locked source bytes
// and locators behind every applied document, the applied/target bytes, the approved tree,
// graph and link closure, and the surface's own invariants. It is strictly read-only: the
// caller decides what, if anything, to write, which is what makes the no-op zero-write.
async function completedRunEvidence({ root, run, manifest, manifestSha256, report, surface }) {
  const batch = surface === "batch"
  const label = batch ? "apply" : "promotion"
  const applyLabel = batch ? "applied" : "promoted"
  const gate = batch ? BATCH_REVIEW_GATE : PILOT_REVIEW_GATE
  const errors = []

  // 1. Manifest identity. `manifestSha256` is the hash of the manifest bytes this command
  //    just read, so binding the report to it binds the whole completed state to them.
  if (report.proposal_manifest_sha256 !== manifestSha256) {
    errors.push(`${label} report is bound to different proposal manifest bytes`)
  }
  if (batch && report.batch_id !== manifest.batch_id) {
    errors.push("apply report batch identity differs from the run")
  }

  // 2. Signed review evidence: the exact bytes the run was written against, still
  //    satisfying the full decision contract for this gate.
  const reviewAbsolute = path.resolve(root, report.approved_review)
  assertInside(root, reviewAbsolute, "approved review")
  let review = null
  if (!(await fileExists(reviewAbsolute))) {
    errors.push(`signed review evidence is missing: ${report.approved_review}`)
  } else {
    const reviewBytes = await readFile(reviewAbsolute, "utf8")
    if (sha256(reviewBytes) !== report.approved_review_sha256) {
      errors.push(`signed review evidence changed after ${label}: ${report.approved_review}`)
    } else {
      try {
        review = JSON.parse(reviewBytes)
      } catch {
        errors.push(`signed review evidence is not valid JSON: ${report.approved_review}`)
      }
    }
  }
  const appliedIds = new Set(report.applied.map((entry) => entry.concept_id))
  const excludedIds = new Set((report.excluded ?? []).map((entry) => entry.concept_id))
  if (review) {
    errors.push(
      ...(batch
        ? signedBatchReviewErrors({ review, manifest, manifestSha256 })
        : signedPilotReviewErrors({ review, manifest })),
    )
    // 3. Decision-to-report reconciliation. Every applied document is still approved by
    //    the current review, every approved proposal is still applied, and nothing outside
    //    the manifest was written.
    const decisions = new Map(
      (Array.isArray(review.proposals) ? review.proposals : []).map((entry) => [
        entry?.concept_id,
        entry,
      ]),
    )
    for (const proposal of manifest.proposals) {
      const decision = decisions.get(proposal.concept_id)?.decision
      const isApplied = appliedIds.has(proposal.concept_id)
      if (isApplied && decision !== "approve") {
        errors.push(
          `${proposal.concept_id}: ${applyLabel} proposal is not approved by the current signed review`,
        )
      }
      if (!isApplied && decision === "approve") {
        errors.push(`${proposal.concept_id}: approved proposal is absent from the ${label} report`)
      }
      if (!isApplied && !excludedIds.has(proposal.concept_id)) {
        errors.push(`${proposal.concept_id}: manifest proposal is absent from the ${label} report`)
      }
    }
  }
  const manifestIds = new Set(manifest.proposals.map((proposal) => proposal.concept_id))
  for (const conceptId of appliedIds) {
    if (!manifestIds.has(conceptId)) {
      errors.push(`${conceptId}: ${label} report applies a concept absent from the manifest`)
    }
  }

  // 4. Canonical sample (batch surface). Rederived from the manifest, never trusted.
  let sampleSha256 = null
  if (batch) {
    const samplePath = path.join(run, "sample.json")
    if (!(await fileExists(samplePath))) {
      errors.push("sample.json is missing for an applied batch")
    } else {
      const sampleBytes = await readFile(samplePath, "utf8")
      sampleSha256 = sha256(sampleBytes)
      try {
        errors.push(
          ...(await canonicalSampleErrors({ run, manifest, manifestSha256, sampleBytes })),
        )
      } catch {
        errors.push("sample.json is not valid JSON")
      }
      if (report.sample_sha256 !== sampleSha256) errors.push("sample.json changed after apply")
    }
  }

  // 5. Proposal artifact bytes. The completed state is only as good as the artifacts the
  //    review signed, so every one is re-read and re-hashed against the manifest — this is
  //    what a completed run used to skip entirely.
  for (const proposal of manifest.proposals) {
    const artifact = path.resolve(run, proposal.artifact_path)
    assertInside(run, artifact, `${proposal.concept_id}: proposal artifact`)
    if (!(await fileExists(artifact))) {
      errors.push(`${proposal.concept_id}: proposal artifact is missing`)
      continue
    }
    const markdown = await readFile(artifact, "utf8")
    if (sha256(markdown) !== proposal.proposal_sha256) {
      errors.push(`${proposal.concept_id}: proposal bytes differ from manifest`)
      continue
    }
    const { data } = parseFrontmatter(markdown, proposal.artifact_path)
    if (data.proposal_status !== REVIEW_STATUS) {
      errors.push(`${proposal.concept_id}: proposal status bypassed ${gate}`)
    } else if (
      batch &&
      sha256(promoteApprovedMarkdown(markdown, proposal.concept_id)) !== proposal.applied_sha256
    ) {
      errors.push(`${proposal.concept_id}: promoted bytes differ from manifest`)
    }
    if (data.canonical_path !== proposal.canonical_path) {
      errors.push(`${proposal.concept_id}: canonical path drift`)
    }
    const staged = path.join(run, "stage", proposal.canonical_path)
    if (
      !(await fileExists(staged)) ||
      sha256(await readFile(staged, "utf8")) !== sha256(markdown)
    ) {
      errors.push(`${proposal.concept_id}: staged overlay is missing or differs`)
    }
  }

  // 6/7. Target and applied bytes, plus the approved tree hash the report recorded.
  errors.push(
    ...(await appliedStateErrors({
      root,
      manifest: batch ? manifest : { proposals: report.targets ?? [] },
      report,
    })),
  )
  if (!batch) {
    const targetIds = new Set((report.targets ?? []).map((entry) => entry.concept_id))
    for (const proposal of manifest.proposals) {
      if (!targetIds.has(proposal.concept_id)) {
        errors.push(
          `${proposal.concept_id}: manifest proposal is absent from the promotion targets`,
        )
      }
    }
  }

  // 8. Graph and link closure over the approved tree as it stands now.
  const { index, collisions } = await buildKnowledgeIndex({ root })
  if (collisions.count !== 0) errors.push(`collision count is ${collisions.count}`)
  const preview = graphPreview(index)
  if (preview.broken_edge_count !== 0) errors.push("knowledge graph has broken knowledge links")
  if (preview.source_leakage_count !== 0 || preview.tistory_leakage_count !== 0) {
    errors.push("knowledge graph leaks source or Tistory nodes")
  }

  // 9. Locked source bytes, locators, and body template behind every applied document.
  const bySourceCount = new Map(
    manifest.proposals.map((proposal) => [proposal.concept_id, proposal.source_count]),
  )
  const documents = []
  for (const entry of report.applied) {
    const absolute = path.resolve(root, entry.canonical_path)
    assertInside(root, absolute, `${entry.concept_id}: canonical path`)
    if (!(await fileExists(absolute))) continue
    const markdown = await readFile(absolute, "utf8")
    const { data } = parseFrontmatter(markdown, entry.canonical_path)
    if (data.proposal_status !== APPROVED_STATUS) {
      errors.push(`${entry.concept_id}: ${applyLabel} document does not record an approved status`)
    }
    documents.push({
      concept_id: entry.concept_id,
      canonical_path: entry.canonical_path,
      markdown,
      absolute,
      label: entry.canonical_path,
      source_count: bySourceCount.get(entry.concept_id) ?? 0,
    })
  }
  const provenance = await measuredProvenanceReport({
    root,
    documents,
    catalogExtra: index.concepts,
  })
  for (const { error } of provenance.validation_errors) errors.push(error)
  for (const conceptId of provenance.template_mismatches) {
    errors.push(`${conceptId}: ${applyLabel} body template mismatch`)
  }
  if (provenance.verified_source_count !== provenance.source_count) {
    errors.push(
      `${applyLabel} provenance verified ${provenance.verified_source_count}/${provenance.source_count}`,
    )
  }
  errors.push(...documentLinkErrors({ documents, index }))
  errors.push(...(await rejectedCandidateErrors({ run })))
  // A completed run is measured against a full-corpus index — the rendered build when one is
  // staged, otherwise the equivalent index over the approved knowledge tree. Calling this
  // without either is what let a completed batch report 77/77 searchable aliases while 20 of
  // them resolved first to a different knowledge document.
  const stagePublic = path.join(run, "stage-public")
  const aliasPolicy = await aliasPolicyReport({
    run,
    proposals: documents,
    stagePublic: (await fileExists(stagePublic)) ? stagePublic : null,
    corpusIndex: await knowledgeCorpusContentIndex({ root }),
  })
  for (const violation of aliasPolicy.violations) {
    errors.push(`search-only alias policy: ${JSON.stringify(violation)}`)
  }
  if (!aliasPolicy.alias_search_scan.measured) {
    errors.push("completed-state alias search evidence is missing")
  }

  return {
    errors: [...new Set(errors)],
    index,
    collisions,
    preview,
    provenance,
    documents,
    aliasPolicy,
    sampleSha256,
  }
}

// The one-time signed-U2 promotion (Phase 4 → approved content). It is deliberately a
// separate command from `apply`: `apply` stays unavailable for proposal-only runs, and
// this path accepts nothing but the run's own signed `pilot-review.json`, re-measured
// against the manifest, the current proposal bytes, the current source bytes, and the
// approved-tree baseline. It reuses the Phase 5 durable before-snapshot, write-ahead
// journal, drift guards, and byte-exact rollback verbatim.
export async function promoteSignedPilot({
  root,
  run,
  faultAfterOperations = null,
  faultAfterIntentOperations = null,
  faultAfterMutationOperations = null,
  faultBeforeFirstIntent = false,
  faultBeforeCompletionMarker = false,
}) {
  root = path.resolve(root)
  run = path.resolve(root, run)
  assertInside(root, run, "run")
  const manifestBytes = await readFile(path.join(run, "proposal-manifest.json"), "utf8")
  const manifest = JSON.parse(manifestBytes)
  if (manifest.mode !== "proposal-only") {
    throw new Error(
      `promotion refused: this run is mode ${JSON.stringify(manifest.mode)}; batch runs apply through \`apply --approved\``,
    )
  }
  const manifestSha256 = sha256(manifestBytes)
  const reportPath = path.join(run, "promotion-report.json")

  // Re-entry: a completed promotion is a measured no-op, an interrupted one has to be
  // rolled back before anything else may write to approved content, and a `reset` run —
  // rolled back before it ever recorded an intent — starts over from here.
  const lifecycle = await runLifecycleState({ run })
  if (lifecycle.state === "interrupted") {
    throw new Error(
      "promotion refused: interrupted promotion journal is present; run rollback first",
    )
  }
  if (lifecycle.state === "rolled_back") {
    throw new Error("promotion refused: this run was rolled back; propose a new run")
  }
  if (lifecycle.state === "completed") {
    const resolved = await completedRunReport({
      reportPath,
      completion: lifecycle.journal.completion,
      label: "this promotion",
    })
    if (resolved.errors.length > 0) {
      throw new Error(`promotion refused: ${resolved.errors.join("; ")}`)
    }
    // The no-op is a full re-measurement of the current evidence set, not a report lookup:
    // the same authoritative checker `verify` runs, so the two can never disagree about a
    // completed run. It writes nothing, and its refusal is named and deterministic.
    const { errors: drift } = await completedRunEvidence({
      root,
      run,
      manifest,
      manifestSha256,
      report: resolved.report,
      surface: "proposal-only",
    })
    if (drift.length > 0) {
      throw new Error(`promotion refused: promoted state drifted:\n- ${drift.join("\n- ")}`)
    }
    return { ...resolved.report, status: "noop" }
  }

  const reviewRelative = toPosix(path.relative(root, path.join(run, "pilot-review.json")))
  const approvedBytes = await readFile(path.join(run, "pilot-review.json"), "utf8")
  const approvedReviewSha256 = sha256(approvedBytes)
  const review = JSON.parse(approvedBytes)
  const reviewErrors = signedPilotReviewErrors({ review, manifest })
  if (reviewErrors.length > 0) {
    throw new Error(
      `promotion refused: ${PILOT_REVIEW_GATE} pilot review is unsigned, incomplete, pending, or has critical issues:\n- ${reviewErrors.join(
        "\n- ",
      )}`,
    )
  }
  // Every proposal must be approved. A partially-approved pilot is a batch, and batches
  // go through the Phase 5 `apply` path with its sample gate and exclusion accounting.
  const undecided = review.proposals.filter((entry) => entry.decision !== "approve")
  if (undecided.length > 0) {
    throw new Error(
      `promotion refused: the signed pilot review must approve every proposal (${undecided
        .map((entry) => `${entry.concept_id}=${entry.decision}`)
        .join(", ")})`,
    )
  }

  for (const proposal of manifest.proposals) {
    const artifact = path.resolve(run, proposal.artifact_path)
    assertInside(run, artifact, `${proposal.concept_id}: proposal artifact`)
    if (sha256(await readFile(artifact, "utf8")) !== proposal.proposal_sha256) {
      throw new Error(
        `promotion refused: proposal bytes differ from the manifest (${proposal.concept_id})`,
      )
    }
  }

  const provenanceReport = await measuredProvenanceReport({
    root,
    documents: proposalDocuments(run, manifest),
    catalogExtra: await approvedCatalogRecords(root),
  })
  if (provenanceReport.status !== "pass") {
    const detail = [
      ...provenanceReport.validation_errors.map((entry) => entry.error),
      ...provenanceReport.template_mismatches.map((id) => `${id}: proposal body template mismatch`),
    ]
    throw new Error(
      `promotion refused: source provenance re-verification failed:\n- ${detail.join("\n- ")}`,
    )
  }

  // Per-target guards run before the whole-tree guard so a drifted path this pilot owns is
  // named exactly, instead of being reported as anonymous tree drift.
  const targets = []
  for (const proposal of manifest.proposals) {
    const absolute = path.resolve(root, proposal.canonical_path)
    assertInside(root, absolute, `${proposal.concept_id}: canonical path`)
    if (!toPosix(proposal.canonical_path).startsWith(`${KNOWLEDGE_ROOT}/`)) {
      throw new Error(
        `promotion refused: canonical path is outside the knowledge layer (${proposal.canonical_path})`,
      )
    }
    if (await fileExists(absolute)) {
      throw new Error(
        `promotion refused: target drift for ${proposal.canonical_path} (expected no document)`,
      )
    }
    targets.push({
      concept_id: proposal.concept_id,
      canonical_path: proposal.canonical_path,
      target_exists: false,
      target_before_sha256: null,
    })
  }
  const before = await treeManifest(root, KNOWLEDGE_ROOT)
  if (before.sha256 !== manifest.approved_knowledge_tree_sha256) {
    throw new Error(
      "promotion refused: approved knowledge content changed after proposal generation",
    )
  }

  const promotedIds = new Set(manifest.proposals.map((proposal) => proposal.concept_id))
  const { index: approvedIndex } = await buildKnowledgeIndex({ root })
  const existingIds = new Set(approvedIndex.concepts.map((record) => record.concept_id))
  const plan = []
  for (const proposal of [...manifest.proposals].sort((left, right) =>
    left.concept_id.localeCompare(right.concept_id),
  )) {
    if (existingIds.has(proposal.concept_id)) {
      throw new Error(`promotion refused: ${proposal.concept_id} is already an approved concept`)
    }
    const artifact = path.resolve(run, proposal.artifact_path)
    const source = await readFile(artifact, "utf8")
    const { data } = parseFrontmatter(source, proposal.artifact_path)
    if (data.canonical_path !== proposal.canonical_path) {
      throw new Error(`promotion refused: canonical path drift (${proposal.concept_id})`)
    }
    for (const target of data.related_concepts ?? []) {
      if (!promotedIds.has(target) && !existingIds.has(target)) {
        throw new Error(
          `promotion refused: ${proposal.concept_id} links to unapproved concept ${target}`,
        )
      }
    }
    plan.push({ proposal, markdown: promoteApprovedMarkdown(source, proposal.concept_id) })
  }

  // Everything below this line may write. The before snapshot and its manifest are
  // fsynced first so rollback has exact bytes for every path the journal can name.
  await rm(path.join(run, "before"), { recursive: true, force: true })
  await writeDurable(
    path.join(run, "before-manifest.json"),
    stableJson({
      schema_version: 1,
      batch_id: manifest.batch_id ?? null,
      promotion: "signed-u2-pilot",
      proposal_manifest_sha256: manifestSha256,
      approved_review: reviewRelative,
      approved_review_sha256: approvedReviewSha256,
      knowledge_tree_sha256: before.sha256,
      records: before.records,
    }),
  )

  const handle = await open(path.join(run, "journal.jsonl"), "w")
  const state = {
    handle,
    nextId: 1,
    operationCount: 0,
    intentCount: 0,
    mutationCount: 0,
    faultAfterOperations,
    faultAfterIntentOperations,
    faultAfterMutationOperations,
  }
  const appliedRecords = []
  let report
  try {
    if (faultBeforeFirstIntent) {
      throw new Error("injected apply interruption before the first intent")
    }
    for (const { proposal, markdown } of plan) {
      const absolute = path.resolve(root, proposal.canonical_path)
      await ensureDirectoryWithJournal(root, toPosix(path.dirname(proposal.canonical_path)), state)
      const appliedSha256 = sha256(markdown)
      await runJournaledMutation(
        state,
        {
          operation: "created",
          entryType: "file",
          path: proposal.canonical_path,
          postSha256: appliedSha256,
        },
        () => writeFile(absolute, markdown),
      )
      appliedRecords.push({
        concept_id: proposal.concept_id,
        canonical_path: proposal.canonical_path,
        proposal_sha256: proposal.proposal_sha256,
        applied_sha256: appliedSha256,
        operation: "created",
      })
    }
    const after = await treeManifest(root, KNOWLEDGE_ROOT)
    report = {
      schema_version: 1,
      status: "pass",
      phase: 4,
      mode: "proposal-only",
      promotion: "signed-u2-pilot",
      gate: PILOT_REVIEW_GATE,
      approved_review: reviewRelative,
      approved_review_sha256: approvedReviewSha256,
      proposal_manifest_sha256: manifestSha256,
      reviewer: review.reviewer,
      signed_at: review.signed_at,
      applied_count: appliedRecords.length,
      excluded_count: 0,
      operation_count: state.operationCount,
      before_knowledge_tree_sha256: before.sha256,
      after_knowledge_tree_sha256: after.sha256,
      applied: appliedRecords,
      targets,
      excluded: [],
    }
    await completeJournaledRun({
      handle,
      reportPath,
      report,
      state,
      fault: faultBeforeCompletionMarker,
    })
  } finally {
    await handle.close()
  }
  return report
}

export async function applyKnowledge({
  root,
  run,
  approvedPath = null,
  faultAfterOperations = null,
  faultAfterIntentOperations = null,
  faultAfterMutationOperations = null,
  faultBeforeFirstIntent = false,
  faultBeforeCompletionMarker = false,
}) {
  root = path.resolve(root)
  run = path.resolve(root, run)
  assertInside(root, run, "run")
  const manifestBytes = await readFile(path.join(run, "proposal-manifest.json"), "utf8")
  const manifest = JSON.parse(manifestBytes)
  if (manifest.mode !== "batch") return applyProposalOnlyRun({ root, run })
  const manifestSha256 = sha256(manifestBytes)
  const journalPath = path.join(run, "journal.jsonl")
  const applyReportPath = path.join(run, "apply-report.json")

  // Re-entry: a completed apply is a measured no-op, an interrupted one has to be rolled
  // back before anything else may write to approved content, and a `reset` run — rolled
  // back before it ever recorded an intent — starts over from here. Identical to promotion
  // by construction: both read the same journal through the same classifier.
  const lifecycle = await runLifecycleState({ run })
  if (lifecycle.state === "interrupted") {
    throw new Error("apply refused: interrupted apply journal is present; run rollback first")
  }
  if (lifecycle.state === "rolled_back") {
    throw new Error("apply refused: this run was rolled back; propose a new run")
  }
  if (lifecycle.state === "completed") {
    const resolved = await completedRunReport({
      reportPath: applyReportPath,
      completion: lifecycle.journal.completion,
      label: "this apply",
    })
    if (resolved.errors.length > 0) {
      throw new Error(`apply refused: ${resolved.errors.join("; ")}`)
    }
    // Identical to promotion re-entry by construction: the same authoritative checker
    // `verify` runs, over the same current evidence set, writing nothing.
    const { errors: drift } = await completedRunEvidence({
      root,
      run,
      manifest,
      manifestSha256,
      report: resolved.report,
      surface: "batch",
    })
    if (drift.length > 0) {
      throw new Error(`apply refused: applied state drifted:\n- ${drift.join("\n- ")}`)
    }
    return { ...resolved.report, status: "noop" }
  }
  if (!approvedPath) {
    throw new Error("apply refused: batch apply requires --approved <review.json>")
  }

  const approvedAbsolute = path.resolve(root, approvedPath)
  assertInside(root, approvedAbsolute, "approved review")
  const approvedBytes = await readFile(approvedAbsolute, "utf8")
  const approvedReviewSha256 = sha256(approvedBytes)
  const review = JSON.parse(approvedBytes)
  // The same contract the completed-state checker re-runs against the current review bytes
  // after apply, so the gate that admits a write and the gate that keeps a completed run
  // accepted are one function.
  const reviewErrors = signedBatchReviewErrors({ review, manifest, manifestSha256 })
  if (reviewErrors.length > 0) {
    throw new Error(
      `apply refused: ${BATCH_REVIEW_GATE} batch review is unsigned, pending, or has critical issues, or the batch review is internally invalid against the run:\n- ${reviewErrors.join(
        "\n- ",
      )}`,
    )
  }
  const decisions = new Map(review.proposals.map((entry) => [entry.concept_id, entry]))

  const samplePath = path.join(run, "sample.json")
  if (!(await fileExists(samplePath))) {
    throw new Error("apply refused: sample.json is missing; run sample first")
  }
  const sampleBytes = await readFile(samplePath, "utf8")
  const sample = JSON.parse(sampleBytes)
  const sampleErrors = await canonicalSampleErrors({ run, manifest, manifestSha256, sampleBytes })
  if (sampleErrors.length > 0) {
    throw new Error(`apply refused: ${sampleErrors.join("; ")}`)
  }
  for (const entry of sample.selected) {
    const decision = decisions.get(entry.concept_id)
    if (!decision || decision.decision === "pending") {
      throw new Error(`apply refused: sampled proposal ${entry.concept_id} is unreviewed`)
    }
  }

  for (const proposal of manifest.proposals) {
    const artifact = path.resolve(run, proposal.artifact_path)
    assertInside(run, artifact, `${proposal.concept_id}: proposal artifact`)
    if (sha256(await readFile(artifact, "utf8")) !== proposal.proposal_sha256) {
      throw new Error(
        `apply refused: proposal bytes differ from the manifest (${proposal.concept_id})`,
      )
    }
  }

  const provenanceReport = await measuredProvenanceReport({
    root,
    documents: proposalDocuments(run, manifest),
    catalogExtra: await approvedCatalogRecords(root),
  })
  if (provenanceReport.status !== "pass") {
    const detail = [
      ...provenanceReport.validation_errors.map((entry) => entry.error),
      ...provenanceReport.template_mismatches.map((id) => `${id}: proposal body template mismatch`),
    ]
    throw new Error(
      `apply refused: source provenance re-verification failed:\n- ${detail.join("\n- ")}`,
    )
  }

  // Per-target guards run before the whole-tree guard so a drifted path this batch owns
  // is named exactly, instead of being reported as anonymous tree drift.
  for (const proposal of manifest.proposals) {
    const absolute = path.resolve(root, proposal.canonical_path)
    assertInside(root, absolute, `${proposal.concept_id}: canonical path`)
    if (!toPosix(proposal.canonical_path).startsWith(`${KNOWLEDGE_ROOT}/`)) {
      throw new Error(
        `apply refused: canonical path is outside the knowledge layer (${proposal.canonical_path})`,
      )
    }
    const present = await fileExists(absolute)
    if (present !== proposal.target_exists) {
      throw new Error(
        `apply refused: target drift for ${proposal.canonical_path} (expected ${
          proposal.target_exists ? "an existing" : "no"
        } document)`,
      )
    }
    if (present && sha256(await readFile(absolute, "utf8")) !== proposal.target_before_sha256) {
      throw new Error(`apply refused: target drift for ${proposal.canonical_path} (bytes changed)`)
    }
  }
  const before = await treeManifest(root, KNOWLEDGE_ROOT)
  if (before.sha256 !== manifest.approved_knowledge_tree_sha256) {
    throw new Error("apply refused: approved knowledge content changed after proposal generation")
  }

  const approved = manifest.proposals.filter(
    (proposal) => decisions.get(proposal.concept_id)?.decision === "approve",
  )
  const excluded = manifest.proposals.filter(
    (proposal) => decisions.get(proposal.concept_id)?.decision !== "approve",
  )
  if (approved.length === 0) {
    throw new Error("apply refused: the signed review has no approved proposals")
  }

  // An approved document may not link to a concept this review left unapproved: that
  // would apply a broken knowledge edge (AC-14).
  const approvedIds = new Set(approved.map((proposal) => proposal.concept_id))
  const { index: approvedIndex } = await buildKnowledgeIndex({ root })
  const existingIds = new Set(approvedIndex.concepts.map((record) => record.concept_id))
  const plan = []
  for (const proposal of [...approved].sort((left, right) =>
    left.concept_id.localeCompare(right.concept_id),
  )) {
    const artifact = path.resolve(run, proposal.artifact_path)
    const source = await readFile(artifact, "utf8")
    const { data } = parseFrontmatter(source, proposal.artifact_path)
    for (const target of data.related_concepts ?? []) {
      if (!approvedIds.has(target) && !existingIds.has(target)) {
        throw new Error(
          `apply refused: ${proposal.concept_id} links to unapproved concept ${target}`,
        )
      }
    }
    const markdown = promoteApprovedMarkdown(source, proposal.concept_id)
    if (sha256(markdown) !== proposal.applied_sha256) {
      throw new Error(
        `apply refused: promoted bytes differ from the manifest (${proposal.concept_id})`,
      )
    }
    plan.push({ proposal, markdown })
  }

  // Everything below this line may write. The before snapshot and its manifest are
  // fsynced first so rollback has exact bytes for every path the journal can name.
  const snapshotRoot = path.join(run, "before")
  await rm(snapshotRoot, { recursive: true, force: true })
  for (const { proposal } of plan.filter((entry) => entry.proposal.target_exists)) {
    const snapshot = path.join(snapshotRoot, proposal.canonical_path)
    assertInside(run, snapshot, `${proposal.concept_id}: before snapshot`)
    await writeDurable(
      snapshot,
      await readFile(path.resolve(root, proposal.canonical_path), "utf8"),
    )
  }
  await writeDurable(
    path.join(run, "before-manifest.json"),
    stableJson({
      schema_version: 1,
      batch_id: manifest.batch_id,
      proposal_manifest_sha256: manifestSha256,
      approved_review: toPosix(path.relative(root, approvedAbsolute)),
      approved_review_sha256: approvedReviewSha256,
      knowledge_tree_sha256: before.sha256,
      records: before.records,
    }),
  )

  const handle = await open(journalPath, "w")
  const state = {
    handle,
    nextId: 1,
    operationCount: 0,
    intentCount: 0,
    mutationCount: 0,
    faultAfterOperations,
    faultAfterIntentOperations,
    faultAfterMutationOperations,
  }
  const appliedRecords = []
  let report
  try {
    if (faultBeforeFirstIntent) {
      throw new Error("injected apply interruption before the first intent")
    }
    for (const { proposal, markdown } of plan) {
      const absolute = path.resolve(root, proposal.canonical_path)
      await ensureDirectoryWithJournal(root, toPosix(path.dirname(proposal.canonical_path)), state)
      const operation = proposal.target_exists
        ? {
            operation: "modified",
            path: proposal.canonical_path,
            beforeSha256: proposal.target_before_sha256,
            postSha256: proposal.applied_sha256,
          }
        : {
            operation: "created",
            entryType: "file",
            path: proposal.canonical_path,
            postSha256: proposal.applied_sha256,
          }
      await runJournaledMutation(state, operation, () => writeFile(absolute, markdown))
      appliedRecords.push({
        concept_id: proposal.concept_id,
        canonical_path: proposal.canonical_path,
        applied_sha256: proposal.applied_sha256,
        operation: operation.operation,
      })
    }
    const after = await treeManifest(root, KNOWLEDGE_ROOT)
    report = {
      schema_version: 1,
      status: "pass",
      phase: 5,
      mode: "batch",
      batch_id: manifest.batch_id,
      approved_review: toPosix(path.relative(root, approvedAbsolute)),
      approved_review_sha256: approvedReviewSha256,
      proposal_manifest_sha256: manifestSha256,
      sample_sha256: sha256(sampleBytes),
      reviewer: review.reviewer,
      signed_at: review.signed_at,
      applied_count: appliedRecords.length,
      excluded_count: excluded.length,
      operation_count: state.operationCount,
      before_knowledge_tree_sha256: before.sha256,
      after_knowledge_tree_sha256: after.sha256,
      applied: appliedRecords,
      excluded: excluded.map((proposal) => ({
        concept_id: proposal.concept_id,
        canonical_path: proposal.canonical_path,
        decision: decisions.get(proposal.concept_id)?.decision ?? "absent",
        target_exists: proposal.target_exists,
        target_before_sha256: proposal.target_before_sha256,
      })),
    }
    await completeJournaledRun({
      handle,
      reportPath: applyReportPath,
      report,
      state,
      fault: faultBeforeCompletionMarker,
    })
  } finally {
    await handle.close()
  }
  return report
}

export async function rollbackKnowledgeApply({ root, run }) {
  root = path.resolve(root)
  run = path.resolve(root, run)
  assertInside(root, run, "run")
  const before = JSON.parse(await readFile(path.join(run, "before-manifest.json"), "utf8"))
  const journalPath = path.join(run, "journal.jsonl")
  const journal = parseJournal(await readFile(journalPath, "utf8"))
  const { operations, rollbackCompleted } = journal
  const handle = await open(journalPath, "a")
  let restoredFiles = 0
  let restoredDirectories = 0
  let noopCount = 0
  let after
  try {
    for (const entry of [...operations].reverse()) {
      if (rollbackCompleted.has(entry.id)) continue
      const state = await journaledMutationState(root, entry)
      if (state === "restored") {
        await appendJournal(handle, { id: entry.id, state: "rollback-completed", action: "noop" })
        noopCount += 1
        continue
      }
      const absolute = path.resolve(root, entry.path)
      if (entry.operation === "created") {
        if (entry.entryType === "directory") await rmdir(absolute)
        else await unlink(absolute)
      } else {
        const snapshot = path.join(run, "before", entry.path)
        const snapshotBytes = await readFile(snapshot, "utf8")
        if (sha256(snapshotBytes) !== entry.beforeSha256) {
          throw new Error(`rollback snapshot drift: ${entry.path}`)
        }
        const temporary = `${absolute}.brain-rollback-${entry.id}`
        await rm(temporary, { force: true })
        await writeDurable(temporary, snapshotBytes)
        await rename(temporary, absolute)
      }
      if (entry.entryType === "directory") restoredDirectories += 1
      else restoredFiles += 1
      await appendJournal(handle, { id: entry.id, state: "rollback-completed", action: "restored" })
    }
    after = await treeManifest(root, KNOWLEDGE_ROOT)
    if (after.sha256 !== before.knowledge_tree_sha256) {
      throw new Error("rollback failed: approved knowledge tree differs from the before snapshot")
    }
    for (const entry of operations.filter((candidate) => candidate.operation === "created")) {
      if (await fileExists(path.resolve(root, entry.path))) {
        throw new Error(`rollback created path remains: ${entry.path}`)
      }
    }
    // The terminal record lands only after the tree has been measured back to the before
    // snapshot, so a finalized journal is evidence of a completed rollback rather than an
    // attempted one — drift throws above and leaves the run rollback-recoverable.
    if (!journal.rollbackFinalized) {
      await appendJournal(handle, {
        state: "rollback-finalized",
        operationCount: operations.length,
        restoredCount: restoredFiles,
        restoredDirectoryCount: restoredDirectories,
        noopCount,
        knowledgeTreeSha256: after.sha256,
      })
    }
  } finally {
    await handle.close()
  }
  // A report with no completion marker to bind it is the residue of an interruption
  // between the report write and the marker. The run it describes has just been undone, so
  // it is not evidence of anything and must not outlive the rollback.
  if (!journal.completed) {
    for (const orphan of ["promotion-report.json", "apply-report.json"]) {
      await rm(path.join(run, orphan), { force: true })
    }
  }
  // Re-read the journal rather than restating the intent: the reported state is the state
  // `promote`/`apply` will actually classify this run as on the next command, so a rollback
  // that failed to transition the run cannot report that it did.
  const settled = await runLifecycleState({ run })
  const report = {
    schema_version: 1,
    status: "pass",
    batch_id: before.batch_id,
    run_state: settled.state,
    restored_count: restoredFiles,
    restored_directory_count: restoredDirectories,
    noop_count: noopCount,
    restored_knowledge_tree_sha256: after.sha256,
  }
  await writeStable(path.join(run, "rollback-report.json"), stableJson(report))
  return report
}

function parseArgs(argv) {
  const [command, ...rest] = argv
  const options = { command }
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index]
    if (!token.startsWith("--")) throw new Error(`unexpected argument: ${token}`)
    const key = token.slice(2).replaceAll("-", "_")
    const value = rest[index + 1]
    if (!value || value.startsWith("--")) throw new Error(`${token} requires a value`)
    options[key] = value
    index += 1
  }
  return options
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const root = path.resolve(options.root ?? process.cwd())
  if (options.command === "propose") {
    if (!options.run) throw new Error("propose requires --run")
    if (Boolean(options.pilot) === Boolean(options.batch)) {
      throw new Error("propose requires exactly one of --pilot or --batch")
    }
    const result = await proposeKnowledge({
      root,
      pilotPath: options.pilot ?? null,
      batchPath: options.batch ?? null,
      run: options.run,
    })
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    return
  }
  if (options.command === "sample") {
    if (!options.run) throw new Error("sample requires --run")
    const result = await sampleKnowledgeBatch({ root, run: options.run })
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    return
  }
  if (options.command === "verify") {
    if (!options.run) throw new Error("verify requires --run")
    const result = await verifyKnowledgeRun({ root, run: options.run })
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    return
  }
  if (options.command === "apply") {
    if (!options.run) throw new Error("apply requires --run")
    const result = await applyKnowledge({
      root,
      run: options.run,
      approvedPath: options.approved ?? null,
    })
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    return
  }
  if (options.command === "promote") {
    if (!options.run) throw new Error("promote requires --run")
    const result = await promoteSignedPilot({ root, run: options.run })
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    return
  }
  if (options.command === "rollback") {
    if (!options.run) throw new Error("rollback requires --run")
    const result = await rollbackKnowledgeApply({ root, run: options.run })
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    return
  }
  throw new Error(
    "usage: knowledge.mjs <propose|sample|apply|promote|verify|rollback> --root <root> --run <run> [--pilot <json>] [--batch <json>] [--approved <json>]",
  )
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked)
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
