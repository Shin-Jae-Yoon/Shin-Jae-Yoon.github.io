import { createHash } from "node:crypto"
import { readdir, readFile, stat } from "node:fs/promises"
import path from "node:path"
import remarkParse from "remark-parse"
import { unified } from "unified"
import { visit } from "unist-util-visit"

export const NOTE_ROOTS = [
  "CS",
  "CodeTree",
  "Common",
  "DB",
  "DevCourse",
  "Infra",
  "Interview",
  "Java",
  "Spring",
]

export const MOVE_RULES = [
  { from: "brain/Lecture", to: "brain/lectures" },
  { from: "brain/Book", to: "brain/books" },
  ...NOTE_ROOTS.map((name) => ({ from: `brain/${name}`, to: `brain/notes/${name}` })),
]

export const ROUTE_LOCK_FILES = [
  "tooling/design/capture-owner-revision.mjs",
  "tooling/design/g002-build-output.test.mjs",
  "tooling/design/g003-behavior-locks.test.mjs",
  "tooling/design/g004-shell-contract.test.mjs",
  "tooling/design/g006-spa-regression.mjs",
  "tooling/design/g006-surface-contract.test.mjs",
]

const EXTERNAL_ROUTE_ALLOWLIST = [
  { prefix: "tooling/migration/", reason: "immutable legacy migration evidence" },
  {
    path: "tooling/privacy/owner-decisions.json",
    reason: "historical owner decisions bound to legacy source hashes",
  },
  {
    path: "tooling/design/capture-legacy-baseline.mjs",
    reason: "immutable legacy baseline capture",
  },
]

const MOVE_SEGMENTS = new Map([
  ["Lecture", "lectures"],
  ["lecture", "lectures"],
  ["Book", "books"],
  ...NOTE_ROOTS.map((name) => [name, `notes/${name}`]),
])

const LOWERCASE_MOVE_SEGMENTS = new Map(
  [...MOVE_SEGMENTS].map(([source, target]) => [source.toLowerCase(), target]),
)

const LEGACY_MARKER_SOURCE = String.raw`\bbrain\/(?:_index(?:\.md)?|Lecture|Book|CS|CodeTree|Common|DB|DevCourse|Infra|Interview|Java|Spring)(?=[/.\s#?'"<>\])}]|$)`
const LEGACY_MARKER = new RegExp(LEGACY_MARKER_SOURCE, "gi")
const CONTAINS_LEGACY_MARKER = new RegExp(LEGACY_MARKER_SOURCE, "i")
const LEGACY_ROUTE_PATH_SOURCE = String.raw`\bbrain\/(?:Lecture|Book|CS|CodeTree|Common|DB|DevCourse|Infra|Interview|Java|Spring)(?=\/|$)(?:\/[A-Za-z0-9._~!$&'()*+,;=:@%-]+)*`

export function toPosix(value) {
  return value.split(path.sep).join("/")
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex")
}

export async function walkFiles(root, predicate = () => true) {
  const output = []
  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true })
    entries.sort((a, b) => a.name.localeCompare(b.name))
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name)
      if (entry.isDirectory()) await visit(absolute)
      else if (entry.isFile() && predicate(absolute)) output.push(absolute)
    }
  }
  await visit(root)
  return output
}

export async function fileRecord(absolute, root) {
  const bytes = await readFile(absolute)
  const metadata = await stat(absolute)
  return {
    path: toPosix(path.relative(root, absolute)),
    mode: metadata.mode & 0o777,
    size: bytes.byteLength,
    sha256: sha256(bytes),
  }
}

export async function manifestForPaths(root, relativePaths) {
  const records = []
  for (const relative of [...new Set(relativePaths)].sort()) {
    records.push(await fileRecord(path.join(root, relative), root))
  }
  return records
}

export function mapContentRelative(relative) {
  const normalized = toPosix(relative).replace(/^content\//, "")
  for (const { from, to } of MOVE_RULES) {
    if (normalized === from || normalized.startsWith(`${from}/`)) {
      return normalized.replace(from, to)
    }
  }
  return normalized
}

export function contentPathToSlug(relative) {
  return toPosix(relative)
    .replace(/^content\//, "")
    .replace(/\.md$/i, "")
    .split("/")
    .map((segment) => segment.toLowerCase())
    .join("/")
}

export function mapSlug(slug) {
  let normalized = String(slug).replace(/^\/+/, "").replace(/\/+$/, "")
  normalized = normalized.replace(/(^|\/)_[iI]ndex(?=$|\/)/g, "$1index")
  const parts = normalized.split("/")
  if (parts[0]?.toLowerCase() !== "brain") return normalized.toLowerCase()
  const original = parts[1]
  const mapped = MOVE_SEGMENTS.get(original) ?? LOWERCASE_MOVE_SEGMENTS.get(original?.toLowerCase())
  if (mapped) parts.splice(1, 1, ...mapped.split("/"))
  return parts.join("/").toLowerCase()
}

function rewriteBrainPathname(pathname) {
  const leadingSlash = pathname.startsWith("/") ? "/" : ""
  const parts = pathname.replace(/^\/+/, "").split("/")
  if (parts[0]?.toLowerCase() !== "brain") return pathname

  const mapped = MOVE_SEGMENTS.get(parts[1]) ?? LOWERCASE_MOVE_SEGMENTS.get(parts[1]?.toLowerCase())
  if (mapped) parts.splice(1, 1, ...mapped.split("/"))
  const finalIndex = parts.length - 1
  if (/^_index(?:\.md)?$/i.test(parts[finalIndex] ?? "")) {
    const extension = /\.md$/i.test(parts[finalIndex]) ? ".md" : ""
    parts[finalIndex] = `index${extension}`
  }
  return `${leadingSlash}${parts.join("/")}`
}

export function rewriteDestination(destination) {
  if (!destination || destination.startsWith("#")) return destination
  const angleWrapped = destination.startsWith("<") && destination.endsWith(">")
  const raw = angleWrapped ? destination.slice(1, -1) : destination
  let rewritten = raw

  if (/^https?:\/\//i.test(raw)) {
    let url
    try {
      url = new URL(raw)
    } catch {
      return destination
    }
    if (!["jae-yoon.tistory.com", "shin-jae-yoon.github.io"].includes(url.hostname)) {
      return destination
    }
    const nextPath = rewriteBrainPathname(url.pathname)
    if (nextPath === url.pathname) return destination
    url.pathname = nextPath
    rewritten = url.href
  } else {
    const suffixIndex = raw.search(/[?#]/)
    const pathname = suffixIndex === -1 ? raw : raw.slice(0, suffixIndex)
    const suffix = suffixIndex === -1 ? "" : raw.slice(suffixIndex)
    const nextPath = rewriteBrainPathname(pathname)
    if (nextPath === pathname) return destination
    rewritten = `${nextPath}${suffix}`
  }

  return angleWrapped ? `<${rewritten}>` : rewritten
}

export function rewriteRouteLockSource(source) {
  let rewriteCount = 0
  const content = source.replace(new RegExp(LEGACY_ROUTE_PATH_SOURCE, "gi"), (route) => {
    const rewritten = mapSlug(route)
    if (rewritten !== route) rewriteCount += 1
    return rewritten
  })
  return { content, rewriteCount }
}

function ignoredCodeRanges(source) {
  const ranges = []
  const lines = source.split(/(?<=\n)/)
  let offset = 0
  let fence = null
  for (const line of lines) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/)
    if (fence === null) {
      if (marker) {
        fence = marker[1][0]
        ranges.push([offset, offset + line.length])
      }
    } else {
      ranges.push([offset, offset + line.length])
      if (marker && marker[1][0] === fence) fence = null
    }
    offset += line.length
  }

  const inline = /(`+)([^\n]*?)\1/g
  for (const match of source.matchAll(inline))
    ranges.push([match.index, match.index + match[0].length])
  return ranges.sort((a, b) => a[0] - b[0])
}

function inRanges(index, ranges) {
  return ranges.some(([start, end]) => index >= start && index < end)
}

function lineColumn(source, index) {
  const before = source.slice(0, index)
  const lines = before.split("\n")
  return { line: lines.length, column: lines.at(-1).length + 1 }
}

function candidateOccurrences(source) {
  const output = []
  const patterns = [
    {
      context: "html",
      regex: /\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi,
      value: (match) => match[1] ?? match[2] ?? match[3],
    },
    {
      context: "html-title-url",
      regex: /\btitle\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi,
      value: (match) => {
        const value = match[1] ?? match[2] ?? match[3]
        return !/\s/.test(value) && /^(?:https?:\/\/|\/?brain\/)/i.test(value) ? value : null
      },
    },
    {
      context: "wikilink",
      regex: /!?\[\[([^\]\n]+)\]\]/g,
      value: (match) => {
        const inner = match[1]
        const divider = inner.indexOf("|")
        return divider === -1 ? inner : inner.slice(0, divider)
      },
    },
  ]

  const tree = unified().use(remarkParse).parse(source)
  visit(tree, ["link", "image", "definition"], (node) => {
    if (
      !node.url ||
      node.position?.start?.offset === undefined ||
      node.position?.end?.offset === undefined
    ) {
      return
    }
    const nodeStart = node.position.start.offset
    const raw = source.slice(nodeStart, node.position.end.offset)
    let relativeStart = raw.indexOf(node.url)
    let destination = node.url
    if (relativeStart === -1) {
      const angle = `<${node.url}>`
      relativeStart = raw.indexOf(angle)
      destination = angle
    }
    if (relativeStart === -1) return
    output.push({
      context: "markdown",
      destination,
      start: nodeStart + relativeStart,
      end: nodeStart + relativeStart + destination.length,
    })
  })

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern.regex)) {
      const value = pattern.value(match)
      if (value === null) continue
      const relativeStart = match[0].indexOf(value)
      output.push({
        context: pattern.context,
        destination: value,
        start: match.index + relativeStart,
        end: match.index + relativeStart + value.length,
      })
    }
  }
  return output
    .filter(
      (entry, index, entries) =>
        entries.findIndex(
          (candidate) => candidate.start === entry.start && candidate.end === entry.end,
        ) === index,
    )
    .sort((a, b) => a.start - b.start)
}

export function transformLinks(source, sourcePath = "") {
  const codeRanges = ignoredCodeRanges(source)
  const candidates = candidateOccurrences(source).filter(
    (entry) => !inRanges(entry.start, codeRanges),
  )
  const edits = []
  const ledger = []
  const classifiedCandidateRanges = []
  const movedSource = MOVE_RULES.some(({ from }) => {
    const prefix = `content/${from}`
    return sourcePath === prefix || sourcePath.startsWith(`${prefix}/`)
  })

  for (const candidate of candidates) {
    const after = rewriteDestination(candidate.destination)
    if (after !== candidate.destination) {
      edits.push({ start: candidate.start, end: candidate.end, value: after })
      ledger.push({
        sourcePath,
        ...lineColumn(source, candidate.start),
        context: candidate.context,
        classification: "rewrite",
        before: candidate.destination,
        after,
      })
      classifiedCandidateRanges.push([candidate.start, candidate.end])
      continue
    }

    const relativeUnsupported = movedSource && /^(?:\.\.?\/)/.test(candidate.destination)
    const legacyUnmapped = CONTAINS_LEGACY_MARKER.test(candidate.destination)
    if (relativeUnsupported || legacyUnmapped) {
      ledger.push({
        sourcePath,
        ...lineColumn(source, candidate.start),
        context: candidate.context,
        classification: "unclassified",
        reason: relativeUnsupported
          ? "relative-destination-unsupported"
          : "legacy-destination-unmapped",
        before: candidate.destination,
        after: candidate.destination,
      })
      classifiedCandidateRanges.push([candidate.start, candidate.end])
    }
  }

  for (const marker of source.matchAll(LEGACY_MARKER)) {
    const index = marker.index
    if (edits.some((edit) => index >= edit.start && index < edit.end)) continue
    if (classifiedCandidateRanges.some(([start, end]) => index >= start && index < end)) continue
    const recognized = candidates.some(
      (candidate) => index >= candidate.start && index < candidate.end,
    )
    ledger.push({
      sourcePath,
      ...lineColumn(source, index),
      context: inRanges(index, codeRanges) ? "code" : recognized ? "link" : "text",
      classification: inRanges(index, codeRanges) ? "ignore-code" : "preserve-text",
      before: marker[0],
      after: marker[0],
    })
  }

  let transformed = source
  for (const edit of [...edits].sort((a, b) => b.start - a.start)) {
    transformed = `${transformed.slice(0, edit.start)}${edit.value}${transformed.slice(edit.end)}`
  }
  return {
    content: transformed,
    ledger: ledger.sort((a, b) => a.line - b.line || a.column - b.column),
  }
}

export function graphProjection(contentIndex, prefix = "brain/knowledge") {
  const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, "").toLowerCase()
  const isKnowledge = (slug) => {
    const normalized = String(slug)
      .replace(/^\/+|\/+$/g, "")
      .toLowerCase()
    return normalized === normalizedPrefix || normalized.startsWith(`${normalizedPrefix}/`)
  }
  const nodes = Object.keys(contentIndex).filter(isKnowledge).sort()
  const nodeSet = new Set(nodes)
  const edges = []
  for (const source of nodes) {
    for (const target of contentIndex[source]?.links ?? []) {
      const normalizedTarget = String(target)
        .replace(/^\/+|\/+$/g, "")
        .toLowerCase()
      if (nodeSet.has(normalizedTarget)) edges.push(`${source}->${normalizedTarget}`)
    }
  }
  return { nodes, edges: [...new Set(edges)].sort() }
}

function externalReferenceAllowance(relative) {
  return EXTERNAL_ROUTE_ALLOWLIST.find(
    (entry) => entry.path === relative || (entry.prefix && relative.startsWith(entry.prefix)),
  )
}

export async function scanExternalOldRouteReferences(root) {
  const toolingRoot = path.join(root, "tooling")
  let files = []
  try {
    files = await walkFiles(toolingRoot, (absolute) => {
      const relative = toPosix(path.relative(root, absolute))
      return (
        !relative.startsWith("tooling/brain/") &&
        /\.(?:mjs|js|ts|tsx|json|md|ya?ml)$/i.test(relative)
      )
    })
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }
  const occurrences = []
  for (const absolute of files) {
    const relative = toPosix(path.relative(root, absolute))
    const source = await readFile(absolute, "utf8")
    const allowance = externalReferenceAllowance(relative)
    for (const match of source.matchAll(new RegExp(LEGACY_ROUTE_PATH_SOURCE, "gi"))) {
      occurrences.push({
        path: relative,
        ...lineColumn(source, match.index),
        route: match[0],
        classification: allowance ? "allowlisted" : "unexpected",
        reason: allowance?.reason ?? null,
      })
    }
  }
  const allowed = occurrences.filter((entry) => entry.classification === "allowlisted")
  const unexpected = occurrences.filter((entry) => entry.classification === "unexpected")
  return {
    occurrenceCount: occurrences.length,
    allowedCount: allowed.length,
    unexpectedCount: unexpected.length,
    allowed,
    unexpected,
    occurrences,
  }
}

export function parseArgs(argv) {
  const result = { _: [] }
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (!token.startsWith("--")) {
      result._.push(token)
      continue
    }
    const key = token.slice(2)
    const value = argv[index + 1]
    if (value === undefined || value.startsWith("--")) result[key] = true
    else {
      result[key] = value
      index += 1
    }
  }
  return result
}
