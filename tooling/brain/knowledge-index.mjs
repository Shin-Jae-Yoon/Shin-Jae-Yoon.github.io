import { access, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import YAML from "yaml"
import { sha256, toPosix, walkFiles } from "./lib.mjs"

const KNOWLEDGE_ROOT = "content/brain/knowledge"
const RESERVED_TAGS = new Set(["brain", "knowledge"])

// Knowledge aliases are search-only identity (owner decision H-1). Quartz turns the
// frontmatter keys below into public redirect routes: `note-properties` coalesces
// `aliases`/`alias` (plus `permalink`) into `file.data.aliases`, and the
// `alias-redirects` emitter writes one `<alias>.html` redirect page per entry.
// Knowledge documents therefore carry aliases under a key Quartz never reads.
export const KNOWLEDGE_ALIAS_KEY = "knowledge_aliases"
export const QUARTZ_PUBLIC_ALIAS_KEYS = Object.freeze(["aliases", "alias", "permalink"])

function normalizedKey(value) {
  return String(value).normalize("NFKC").trim().toLocaleLowerCase("en-US")
}

function array(value) {
  return value === undefined || value === null ? [] : Array.isArray(value) ? value : [value]
}

export function parseFrontmatter(source, label = "Markdown") {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) throw new Error(`${label}: YAML frontmatter is required`)
  const data = YAML.parse(match[1]) ?? {}
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`${label}: YAML frontmatter must be a mapping`)
  }
  return { data, body: source.slice(match[0].length), frontmatterBytes: match[0] }
}

export function folderTags(canonicalPath) {
  const relative = toPosix(canonicalPath)
  const prefix = `${KNOWLEDGE_ROOT}/`
  if (!relative.startsWith(prefix) || !relative.endsWith(".md")) {
    throw new Error(
      `${canonicalPath}: canonical path must be a Markdown file under ${KNOWLEDGE_ROOT}`,
    )
  }
  return relative.slice(prefix.length).split("/").slice(0, -1)
}

function validateStringArray(value, label) {
  const items = array(value)
  if (items.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new Error(`${label} must contain non-empty strings`)
  }
  return items
}

export function recordFromMarkdown(source, filePath, origin = "approved") {
  const { data } = parseFrontmatter(source, filePath)
  const canonicalPath = toPosix(data.canonical_path ?? filePath)
  if (!data.concept_id) {
    if (path.posix.basename(filePath) === "index.md" && origin === "approved") return null
    throw new Error(`${filePath}: concept_id is required`)
  }
  if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(data.concept_id)) {
    throw new Error(`${filePath}: concept_id is not stable machine syntax`)
  }
  if (typeof data.title !== "string" || data.title.trim() === "") {
    throw new Error(`${filePath}: title is required`)
  }
  for (const key of QUARTZ_PUBLIC_ALIAS_KEYS) {
    if (data[key] !== undefined && data[key] !== null) {
      throw new Error(
        `${filePath}: \`${key}\` emits a public Quartz redirect route; knowledge aliases are search-only and belong under \`${KNOWLEDGE_ALIAS_KEY}\``,
      )
    }
  }
  const aliases = validateStringArray(
    data[KNOWLEDGE_ALIAS_KEY],
    `${filePath}: ${KNOWLEDGE_ALIAS_KEY}`,
  )
  const tags = validateStringArray(data.tags, `${filePath}: tags`)
  const expectedTags = folderTags(canonicalPath)
  if (JSON.stringify([...tags].sort()) !== JSON.stringify([...expectedTags].sort())) {
    throw new Error(`${filePath}: tags must exactly match knowledge folder segments`)
  }
  if (tags.some((tag) => RESERVED_TAGS.has(normalizedKey(tag)))) {
    throw new Error(`${filePath}: reserved brain/knowledge tag is forbidden`)
  }
  const sources = array(data.sources)
  if (sources.length === 0) throw new Error(`${filePath}: sources[] is required`)
  for (const [index, sourceEntry] of sources.entries()) {
    const label = `${filePath}: sources[${index}]`
    if (!sourceEntry || typeof sourceEntry !== "object")
      throw new Error(`${label} must be a mapping`)
    if (typeof sourceEntry.path !== "string" || path.isAbsolute(sourceEntry.path)) {
      throw new Error(`${label}.path must be repo-relative`)
    }
    if (!/^[a-f0-9]{64}$/.test(sourceEntry.source_sha256 ?? "")) {
      throw new Error(`${label}.source_sha256 must be an exact SHA-256`)
    }
    const locator = sourceEntry.locator
    if (
      !locator ||
      typeof locator !== "object" ||
      !Number.isInteger(locator.start_line) ||
      !Number.isInteger(locator.end_line) ||
      locator.start_line < 1 ||
      locator.end_line < locator.start_line ||
      !/^[a-f0-9]{64}$/.test(locator.span_sha256 ?? "")
    ) {
      throw new Error(`${label}.locator must contain line bounds and span_sha256`)
    }
    if (typeof locator.heading !== "string" || locator.heading.trim() === "") {
      throw new Error(`${label}.locator.heading is required`)
    }
  }
  const relatedConcepts = validateStringArray(
    data.related_concepts,
    `${filePath}: related_concepts`,
  )
  return {
    concept_id: data.concept_id,
    title: data.title,
    aliases,
    tags,
    sources,
    related_concepts: relatedConcepts,
    canonical_path: canonicalPath,
    proposal_kind: data.proposal_kind ?? null,
    proposal_status: data.proposal_status ?? null,
    origin,
    document_sha256: sha256(source),
  }
}

export function collisionReport(records) {
  const buckets = { concept_id: new Map(), title_or_alias: new Map(), canonical_path: new Map() }
  for (const record of records) {
    const values = [record.title, ...record.aliases]
    for (const [kind, rawValues] of [
      ["concept_id", [record.concept_id]],
      ["canonical_path", [record.canonical_path]],
      ["title_or_alias", values],
    ]) {
      for (const value of rawValues) {
        const key = normalizedKey(value)
        const entries = buckets[kind].get(key) ?? []
        entries.push({ concept_id: record.concept_id, value })
        buckets[kind].set(key, entries)
      }
    }
  }
  const collisions = []
  for (const [kind, bucket] of Object.entries(buckets)) {
    for (const [key, entries] of bucket) {
      const concepts = new Set(entries.map((entry) => entry.concept_id))
      const duplicateWithinConcept = kind === "title_or_alias" && entries.length > 1
      if (concepts.size > 1 || duplicateWithinConcept) collisions.push({ kind, key, entries })
    }
  }
  for (const record of records) {
    const stem = path.posix.basename(record.canonical_path, ".md")
    const folder = path.posix.basename(path.posix.dirname(record.canonical_path))
    if (normalizedKey(stem) === normalizedKey(folder)) {
      collisions.push({
        kind: "folder_route",
        key: toPosix(record.canonical_path)
          .replace(/^content\//, "")
          .replace(/\.md$/, ""),
        entries: [{ concept_id: record.concept_id, value: record.canonical_path }],
      })
    }
  }
  return { status: collisions.length === 0 ? "pass" : "fail", count: collisions.length, collisions }
}

async function exists(absolute) {
  try {
    await access(absolute)
    return true
  } catch {
    return false
  }
}

export async function buildKnowledgeIndex({ root, proposalDir = null, out = null }) {
  const records = []
  const approvedRoot = path.join(root, KNOWLEDGE_ROOT)
  if (await exists(approvedRoot)) {
    const files = await walkFiles(approvedRoot, (absolute) => absolute.endsWith(".md"))
    for (const absolute of files) {
      const relative = toPosix(path.relative(root, absolute))
      const record = recordFromMarkdown(await readFile(absolute, "utf8"), relative, "approved")
      if (record) records.push(record)
    }
  }
  if (proposalDir && (await exists(proposalDir))) {
    const files = await walkFiles(proposalDir, (absolute) => absolute.endsWith(".md"))
    for (const absolute of files) {
      const relative = toPosix(path.relative(root, absolute))
      const record = recordFromMarkdown(await readFile(absolute, "utf8"), relative, "proposal")
      if (record) records.push(record)
    }
  }
  records.sort((left, right) => left.concept_id.localeCompare(right.concept_id))
  const collisions = collisionReport(records)
  const index = {
    schema_version: 1,
    approved_count: records.filter((record) => record.origin === "approved").length,
    proposal_count: records.filter((record) => record.origin === "proposal").length,
    collision_count: collisions.count,
    concepts: records,
  }
  if (out) await writeFile(out, `${JSON.stringify(index, null, 2)}\n`)
  return { index, collisions }
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
  if (options.command !== "build")
    throw new Error(
      "usage: knowledge-index.mjs build --root <root> [--proposals <dir>] [--out <json>]",
    )
  const root = path.resolve(options.root ?? process.cwd())
  const proposalDir = options.proposals ? path.resolve(root, options.proposals) : null
  const out = options.out ? path.resolve(root, options.out) : null
  const result = await buildKnowledgeIndex({ root, proposalDir, out })
  if (result.collisions.count > 0)
    throw new Error(`knowledge index collision count: ${result.collisions.count}`)
  process.stdout.write(`${JSON.stringify(result.index, null, 2)}\n`)
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked)
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
