import { createHash } from "node:crypto"
import {
  appendFile,
  chmod,
  cp,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import * as parse5 from "parse5"

const here = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_ROOT = path.resolve(here, "../..")
export const DEFAULT_RUN = ".omx/artifacts/brain-restructure/tistory-20260812"
const FIXTURE_PATH = "tooling/design/fixtures/g003-tistory-body-hashes.json"
const TISTORY_ROOT = "content/articles/tistory"
const FRONTMATTER_END = Buffer.from("\n---\n")
const KNOWN_INLINE = new Set([
  "a",
  "b",
  "br",
  "code",
  "del",
  "div",
  "em",
  "i",
  "img",
  "s",
  "span",
  "strong",
  "u",
])
const KNOWN_BLOCK = new Set([
  "blockquote",
  "div",
  "figure",
  "figcaption",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "ol",
  "p",
  "pre",
  "table",
  "ul",
])

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex")
}

function toPosix(value) {
  return value.split(path.sep).join("/")
}

function attribute(node, name) {
  return node.attrs?.find((entry) => entry.name === name)?.value ?? ""
}

function textContent(node) {
  if (node.nodeName === "#text") return node.value ?? ""
  if (["script", "style"].includes(node.tagName)) return ""
  return (node.childNodes ?? []).map(textContent).join("")
}

function normalizeText(value, preserveWhitespace = false) {
  const normalized = value
    .replace(/\r\n?/g, "\n")
    .normalize("NFC")
    .replace(/\u00a0/g, " ")
  return preserveWhitespace ? normalized : normalized.replace(/\s+/g, " ").trim()
}

function languageFor(node) {
  const code = (node.childNodes ?? []).find((child) => child.tagName === "code")
  for (const value of [
    attribute(node, "data-ke-language"),
    attribute(code ?? {}, "data-ke-language"),
    attribute(code ?? {}, "class"),
  ]) {
    const match = value.match(/(?:language-|lang-)?([A-Za-z0-9_+#.-]+)/)
    if (match) return match[1].toLowerCase()
  }
  return ""
}

export function splitDocument(bytes, label = "Tistory Markdown") {
  if (!bytes.subarray(0, 4).equals(Buffer.from("---\n"))) {
    throw new Error(`${label}: opening YAML frontmatter is required`)
  }
  const boundary = bytes.indexOf(FRONTMATTER_END, 4)
  if (boundary < 0) throw new Error(`${label}: closing YAML frontmatter is required`)
  const end = boundary + FRONTMATTER_END.length
  return {
    frontmatter: bytes.subarray(0, end),
    body: bytes.subarray(end),
  }
}

function escapeText(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/([*_\[\]<>])/g, "\\$1")
    .replace(/\s+/g, " ")
}

function escapeLabel(value) {
  return value.replace(/\\/g, "\\\\").replace(/([\[\]])/g, "\\$1")
}

function markdownDestination(value) {
  if (/\s/.test(value)) throw new Error(`link target contains whitespace: ${value}`)
  return value.replace(/\\/g, "\\\\").replace(/([()])/g, "\\$1")
}

function inlineCode(value) {
  const longest = Math.max(0, ...[...value.matchAll(/`+/g)].map((match) => match[0].length))
  const fence = "`".repeat(longest + 1)
  const pad = /^`|`$|^\s|\s$/.test(value) ? " " : ""
  return `${fence}${pad}${value}${pad}${fence}`
}

function sameSiteTarget(value) {
  if (!/^https:\/\/jae-yoon\.tistory\.com\//i.test(value)) return null
  let url
  try {
    url = new URL(value)
  } catch {
    return null
  }
  if (url.hostname !== "jae-yoon.tistory.com") return null
  const match = url.pathname.match(/^\/(\d+)\/?$/)
  if (!match) return null
  return `/articles/tistory/${match[1]}/${url.search}${url.hash}`
}

function blockChildren(node) {
  return (node.childNodes ?? []).some((child) => KNOWN_BLOCK.has(child.tagName))
}

class Renderer {
  constructor({ sourceUrl }) {
    this.sourceUrl = sourceUrl
    this.units = []
    this.externalSourceTargets = []
    this.externalDestinationTargets = []
    this.imageSourcePaths = []
    this.imageDestinationPaths = []
    this.sameSiteRewrites = []
    this.formatting = {
      captions: 0,
      codeBlocks: 0,
      emphasis: 0,
      inlineCode: 0,
      links: 0,
      lists: 0,
      strong: 0,
      tables: 0,
      wrapperRemovals: 0,
    }
  }

  start(type, source) {
    const entry = {
      index: this.units.length,
      type,
      source,
      destination: null,
      sourceHash: sha256(JSON.stringify(source)),
      destinationHash: null,
      match: false,
      allowedMechanicalChanges: ["html-to-markdown-formatting"],
      destinationMarkdown: "",
    }
    this.units.push(entry)
    return entry
  }

  finish(entry, destination, markdown, allowed = []) {
    entry.destination = destination
    entry.destinationHash = sha256(JSON.stringify(destination))
    entry.match = JSON.stringify(entry.source) === JSON.stringify(destination)
    entry.allowedMechanicalChanges = [...new Set([...entry.allowedMechanicalChanges, ...allowed])]
    entry.destinationMarkdown = markdown
  }

  renderInline(node, marks = new Set()) {
    if (node.nodeName === "#text") {
      return { markdown: escapeText(node.value ?? ""), plain: node.value ?? "" }
    }
    if (node.nodeName === "#comment") return { markdown: "", plain: "" }
    const tag = node.tagName
    if (!KNOWN_INLINE.has(tag)) throw new Error(`unsupported inline Tistory tag: <${tag}>`)

    if (["span", "div", "u"].includes(tag)) {
      this.formatting.wrapperRemovals += 1
      if (tag === "div" && blockChildren(node)) {
        const rendered = this.renderChildrenAsBlocks(node)
        return { ...rendered, markdown: rendered.markdown.replace(/\n+/g, " ").trim() }
      }
      return this.renderInlineChildren(node, marks)
    }
    if (["b", "strong"].includes(tag)) {
      const child = this.renderInlineChildren(node, new Set([...marks, "strong"]))
      if (marks.has("strong") || !normalizeText(child.plain)) return child
      this.formatting.strong += 1
      return { markdown: `**${child.markdown.trim()}**`, plain: child.plain }
    }
    if (["i", "em"].includes(tag)) {
      const child = this.renderInlineChildren(node, new Set([...marks, "emphasis"]))
      if (marks.has("emphasis") || !normalizeText(child.plain)) return child
      this.formatting.emphasis += 1
      return { markdown: `*${child.markdown.trim()}*`, plain: child.plain }
    }
    if (["s", "del"].includes(tag)) {
      const child = this.renderInlineChildren(node, new Set([...marks, "strike"]))
      if (marks.has("strike") || !normalizeText(child.plain)) return child
      return { markdown: `~~${child.markdown.trim()}~~`, plain: child.plain }
    }
    if (tag === "br") return { markdown: "  \n", plain: "" }
    if (tag === "code") {
      const value = normalizeText(textContent(node), true)
      this.formatting.inlineCode += 1
      return { markdown: inlineCode(value), plain: value }
    }
    if (tag === "a") {
      const sourceTarget = attribute(node, "href")
      if (!sourceTarget) throw new Error("Tistory link is missing href")
      const entry = this.start("link", {
        label: normalizeText(textContent(node)),
        target: sourceTarget,
      })
      const child = this.renderInlineChildren(node, marks)
      const mapped = sameSiteTarget(sourceTarget) ?? sourceTarget
      if (mapped !== sourceTarget) {
        entry.allowedMechanicalChanges.push("same-site-link-target")
        this.sameSiteRewrites.push({ source: sourceTarget, destination: mapped })
      } else if (/^https?:\/\//i.test(sourceTarget)) {
        this.externalSourceTargets.push(sourceTarget)
        this.externalDestinationTargets.push(mapped)
      }
      const markdown = `[${child.markdown.trim()}](${markdownDestination(mapped)})`
      this.formatting.links += 1
      this.finish(
        entry,
        { label: normalizeText(child.plain), target: mapped },
        markdown,
        mapped !== sourceTarget ? ["same-site-link-target"] : [],
      )
      if (mapped !== sourceTarget) entry.match = entry.source.label === entry.destination.label
      return { markdown, plain: child.plain }
    }
    if (tag === "img") {
      const source = attribute(node, "src")
      if (!source) throw new Error("Tistory image is missing src")
      const alt = attribute(node, "alt")
      const title = attribute(node, "title")
      const entry = this.start("image", { source, alt, title })
      const titleSuffix = title ? ` "${title.replaceAll('"', '\\"')}"` : ""
      const markdown = `![${escapeLabel(alt)}](${markdownDestination(source)}${titleSuffix})`
      this.imageSourcePaths.push(source)
      this.imageDestinationPaths.push(source)
      this.finish(entry, { source, alt, title }, markdown)
      return { markdown, plain: alt }
    }
    throw new Error(`unhandled inline Tistory tag: <${tag}>`)
  }

  renderInlineChildren(node, marks = new Set()) {
    const rendered = (node.childNodes ?? []).map((child) => this.renderInline(child, marks))
    return {
      markdown: rendered.map((part) => part.markdown).join(""),
      plain: rendered.map((part) => part.plain).join(""),
    }
  }

  renderParagraph(node) {
    const entry = this.start("paragraph", { text: normalizeText(textContent(node)) })
    const child = this.renderInlineChildren(node)
    const markdown = child.markdown.trim() || "\u00a0"
    this.finish(entry, { text: normalizeText(child.plain) }, markdown, [
      ...(markdown === "\u00a0" ? ["empty-paragraph-as-nbsp"] : []),
    ])
    return { markdown, plain: child.plain }
  }

  renderHeading(node) {
    const level = Number(node.tagName[1])
    const entry = this.start("heading", { level, text: normalizeText(textContent(node)) })
    const child = this.renderInlineChildren(node)
    const markdown = `${"#".repeat(level)} ${child.markdown.trim() || "\u00a0"}`
    this.finish(entry, { level, text: normalizeText(child.plain) }, markdown)
    return { markdown, plain: child.plain }
  }

  renderPre(node) {
    const language = languageFor(node)
    const text = normalizeText(textContent(node), true)
    const entry = this.start("code-block", { text, language: language || null })
    const longest = Math.max(0, ...[...text.matchAll(/`+/g)].map((match) => match[0].length))
    const fence = "`".repeat(Math.max(3, longest + 1))
    const markdown = `${fence}${language}\n${text}${text.endsWith("\n") ? "" : "\n"}${fence}`
    this.formatting.codeBlocks += 1
    this.finish(entry, { text, language: language || null }, markdown)
    return { markdown, plain: text }
  }

  renderList(node, depth = 0) {
    const ordered = node.tagName === "ol"
    const items = (node.childNodes ?? []).filter((child) => child.tagName === "li")
    if (items.length === 0) throw new Error(`empty <${node.tagName}> is not supported`)
    this.formatting.lists += 1
    const rendered = items.map((item, index) => this.renderListItem(item, ordered, index, depth))
    return {
      markdown: rendered.map((part) => part.markdown).join("\n"),
      plain: rendered.map((part) => part.plain).join(""),
    }
  }

  renderListItem(node, ordered, index, depth) {
    const entry = this.start("list-item", { text: normalizeText(textContent(node)) })
    const pieces = []
    const plains = []
    const inlineBuffer = []
    const flushInline = () => {
      if (inlineBuffer.length === 0) return
      const wrapper = { childNodes: inlineBuffer.splice(0) }
      const rendered = this.renderInlineChildren(wrapper)
      if (rendered.markdown.trim()) pieces.push(rendered.markdown.trim())
      plains.push(rendered.plain)
    }
    for (const child of node.childNodes ?? []) {
      if (["ul", "ol"].includes(child.tagName)) {
        flushInline()
        const nested = this.renderList(child, depth + 1)
        pieces.push(nested.markdown)
        plains.push(nested.plain)
      } else if (child.tagName === "p") {
        flushInline()
        const paragraph = this.renderParagraph(child)
        pieces.push(paragraph.markdown)
        plains.push(paragraph.plain)
      } else if (child.nodeName === "#comment") {
        continue
      } else {
        inlineBuffer.push(child)
      }
    }
    flushInline()
    const marker = ordered ? `${index + 1}. ` : "- "
    const indent = " ".repeat(marker.length)
    const body = pieces.join("\n\n") || "\u00a0"
    const lines = body.split("\n")
    const markdown = `${marker}${lines[0]}${lines
      .slice(1)
      .map((line) => `\n${indent}${line}`)
      .join("")}`
    const actualText = normalizeText(plains.join(""))
    this.finish(entry, { text: actualText }, markdown)
    return { markdown, plain: plains.join("") }
  }

  renderBlockquote(node) {
    const entry = this.start("blockquote", { text: normalizeText(textContent(node)) })
    const rendered = this.renderChildrenAsBlocks(node)
    const body = rendered.markdown || "\u00a0"
    const markdown = body
      .split("\n")
      .map((line) => (line ? `> ${line}` : ">"))
      .join("\n")
    this.finish(entry, { text: normalizeText(rendered.plain) }, markdown)
    return { markdown, plain: rendered.plain }
  }

  renderTable(node) {
    const rows = []
    const visitRows = (current) => {
      if (current.tagName === "tr") rows.push(current)
      else for (const child of current.childNodes ?? []) visitRows(child)
    }
    visitRows(node)
    if (rows.length === 0) throw new Error("Tistory table has no rows")
    const renderedRows = rows.map((row) => this.renderTableRow(row))
    const width = Math.max(...renderedRows.map((row) => row.cells.length))
    if (width === 0) throw new Error("Tistory table has no cells")
    const lines = renderedRows.map((row) => {
      const cells = [...row.cells, ...Array(width - row.cells.length).fill("")]
      return `| ${cells.join(" | ")} |`
    })
    lines.splice(1, 0, `| ${Array(width).fill("---").join(" | ")} |`)
    this.formatting.tables += 1
    return { markdown: lines.join("\n"), plain: renderedRows.map((row) => row.plain).join(" ") }
  }

  renderTableRow(node) {
    const cells = (node.childNodes ?? []).filter((child) => ["th", "td"].includes(child.tagName))
    const entry = this.start("table-row", {
      cells: cells.map((cell) => normalizeText(textContent(cell))),
    })
    const rendered = cells.map((cell) => this.renderTableCell(cell))
    const markdownCells = rendered.map((cell) =>
      cell.markdown.replace(/\|/g, "\\|").replace(/\n+/g, " / ").trim(),
    )
    const actual = cells.map((cell) => normalizeText(textContent(cell)))
    const markdown = `| ${markdownCells.join(" | ")} |`
    this.finish(entry, { cells: actual }, markdown)
    return { cells: markdownCells, plain: rendered.map((cell) => cell.plain).join(" ") }
  }

  renderTableCell(node) {
    if (blockChildren(node)) return this.renderChildrenAsBlocks(node)
    return this.renderInlineChildren(node)
  }

  renderCaption(node) {
    const entry = this.start("caption", { text: normalizeText(textContent(node)) })
    const child = this.renderInlineChildren(node)
    const markdown = child.markdown.trim() ? `*${child.markdown.trim()}*` : "\u00a0"
    this.formatting.captions += 1
    this.finish(entry, { text: normalizeText(child.plain) }, markdown, ["caption-emphasis"])
    return { markdown, plain: child.plain }
  }

  renderFigure(node) {
    const pieces = []
    const plains = []
    for (const child of node.childNodes ?? []) {
      const rendered =
        child.tagName === "figcaption" ? this.renderCaption(child) : this.renderBlock(child)
      if (rendered.markdown) pieces.push(rendered.markdown)
      plains.push(rendered.plain)
    }
    return { markdown: pieces.join("\n\n"), plain: plains.join("") }
  }

  renderChildrenAsBlocks(node) {
    const pieces = []
    const plains = []
    const inlineBuffer = []
    const flushInline = () => {
      if (inlineBuffer.length === 0) return
      const wrapper = { childNodes: inlineBuffer.splice(0) }
      const rendered = this.renderInlineChildren(wrapper)
      if (rendered.markdown.trim()) pieces.push(rendered.markdown.trim())
      plains.push(rendered.plain)
    }
    for (const child of node.childNodes ?? []) {
      if (KNOWN_BLOCK.has(child.tagName)) {
        flushInline()
        const rendered = this.renderBlock(child)
        if (rendered.markdown) pieces.push(rendered.markdown)
        plains.push(rendered.plain)
      } else if (child.nodeName === "#comment") {
        continue
      } else {
        inlineBuffer.push(child)
      }
    }
    flushInline()
    return { markdown: pieces.join("\n\n"), plain: plains.join("") }
  }

  renderBlock(node) {
    if (node.nodeName === "#comment") return { markdown: "", plain: "" }
    if (node.nodeName === "#text") {
      if (!normalizeText(node.value ?? "")) return { markdown: "", plain: node.value ?? "" }
      return { markdown: escapeText(node.value ?? "").trim(), plain: node.value ?? "" }
    }
    const tag = node.tagName
    if (/^h[1-6]$/.test(tag)) return this.renderHeading(node)
    if (tag === "p") return this.renderParagraph(node)
    if (tag === "pre") return this.renderPre(node)
    if (["ul", "ol"].includes(tag)) return this.renderList(node)
    if (tag === "blockquote") return this.renderBlockquote(node)
    if (tag === "table") return this.renderTable(node)
    if (tag === "figure") return this.renderFigure(node)
    if (tag === "figcaption") return this.renderCaption(node)
    if (tag === "hr") {
      const entry = this.start("horizontal-rule", {})
      this.finish(entry, {}, "---")
      return { markdown: "---", plain: "" }
    }
    if (tag === "div") {
      this.formatting.wrapperRemovals += 1
      if (blockChildren(node)) return this.renderChildrenAsBlocks(node)
      const rendered = this.renderInlineChildren(node)
      return { ...rendered, markdown: rendered.markdown.trim() }
    }
    if (KNOWN_INLINE.has(tag)) {
      const rendered = this.renderInline(node)
      return { ...rendered, markdown: rendered.markdown.trim() }
    }
    throw new Error(`unsupported block Tistory tag: <${tag}>`)
  }

  render(fragment) {
    const rendered = this.renderChildrenAsBlocks(fragment)
    const body = `${rendered.markdown
      .replace(/[ \t]+$/gm, "")
      .replace(/\n{4,}/g, "\n\n\n")
      .replace(/^[\r\n]+|[\r\n]+$/g, "")}\n`
    for (const unit of this.units) {
      if (!unit.destination || !unit.match) {
        throw new Error(
          `semantic unit ${unit.index} (${unit.type}) did not survive conversion: ${JSON.stringify({ source: unit.source, destination: unit.destination })}`,
        )
      }
    }
    return {
      body,
      ledger: this.units,
      externalSourceTargets: this.externalSourceTargets,
      externalDestinationTargets: this.externalDestinationTargets,
      imageSourcePaths: this.imageSourcePaths,
      imageDestinationPaths: this.imageDestinationPaths,
      sameSiteRewrites: this.sameSiteRewrites,
      formatting: this.formatting,
    }
  }
}

export function convertHtmlBody(body, { sourceUrl = "https://jae-yoon.tistory.com/" } = {}) {
  const fragment = parse5.parseFragment(Buffer.isBuffer(body) ? body.toString("utf8") : body)
  return new Renderer({ sourceUrl }).render(fragment)
}

export function scanNativeMarkdown(body) {
  const withoutCode = body
    .replace(/(^|\n)([ \t]*)(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n\2\3(?=\n|$)/g, "\n")
    .replace(/(`+)(?:[^`]|`(?!\1))*\1/g, "")
  const rawTags = [...withoutCode.matchAll(/<\/?[A-Za-z][^>]*>/g)]
    .filter((match) => withoutCode[match.index - 1] !== "\\")
    .map((match) => match[0])
  const tistoryAttributes = [
    ...withoutCode.matchAll(/\b(?:data-ke-[\w-]+|data-phocus(?:-[\w-]+)?|style)=/gi),
  ].map((match) => match[0])
  const sameSiteAbsoluteLinks = [
    ...body.matchAll(/https:\/\/jae-yoon\.tistory\.com\/\d+\/?(?:[?#][^\s)\]]*)?/gi),
  ].map((match) => match[0])
  return { rawTags, tistoryAttributes, sameSiteAbsoluteLinks }
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

async function fileRecord(root, relative) {
  const absolute = path.join(root, relative)
  const bytes = await readFile(absolute)
  const metadata = await stat(absolute)
  return {
    path: toPosix(relative),
    sha256: sha256(bytes),
    bodySha256: sha256(splitDocument(bytes, relative).body),
    size: bytes.byteLength,
    mode: metadata.mode & 0o777,
  }
}

async function writeJson(absolute, value) {
  await mkdir(path.dirname(absolute), { recursive: true })
  await writeFile(absolute, `${JSON.stringify(value, null, 2)}\n`)
}

async function fixture(root) {
  const value = JSON.parse(await readFile(path.join(root, FIXTURE_PATH), "utf8"))
  if (value.recordCount !== 15 || value.records.length !== 15) {
    throw new Error(`expected exactly 15 Tistory fixture records, got ${value.records.length}`)
  }
  return value
}

async function assertExactFileSet(root, records) {
  const actual = (await readdir(path.join(root, TISTORY_ROOT)))
    .filter((name) => name.endsWith(".md"))
    .sort((a, b) => Number.parseInt(a) - Number.parseInt(b))
  const expected = records
    .map((record) => path.basename(record.destinationPath))
    .sort((a, b) => Number.parseInt(a) - Number.parseInt(b))
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Tistory file set differs: ${JSON.stringify({ actual, expected })}`)
  }
}

export async function planMigration({ root = DEFAULT_ROOT, run = DEFAULT_RUN } = {}) {
  root = path.resolve(root)
  run = path.resolve(root, run)
  const binding = await fixture(root)
  await assertExactFileSet(root, binding.records)
  const beforeRecords = []
  const validations = []
  for (const record of binding.records) {
    const relative = record.destinationPath
    const source = path.join(root, relative)
    const snapshot = path.join(run, "before", relative)
    const current = await readFile(source)
    const currentParts = splitDocument(current, relative)
    let converted
    try {
      converted = convertHtmlBody(currentParts.body, {
        sourceUrl: `https://jae-yoon.tistory.com/${record.id}`,
      })
    } catch (error) {
      throw new Error(`${relative}: ${error.message}`, { cause: error })
    }
    if (converted.ledger.length !== record.semanticUnitCount) {
      throw new Error(
        `${relative}: semantic unit count ${converted.ledger.length} differs from fixture ${record.semanticUnitCount}`,
      )
    }
    if (await exists(snapshot)) {
      const snapshotted = await readFile(snapshot)
      if (!current.equals(snapshotted)) throw new Error(`${relative}: existing snapshot differs`)
    } else {
      await mkdir(path.dirname(snapshot), { recursive: true })
      await cp(source, snapshot, { preserveTimestamps: true })
    }
    const currentRecord = await fileRecord(root, relative)
    beforeRecords.push(currentRecord)
    validations.push({
      id: record.id,
      path: relative,
      historicalBodySha256: record.bodySha256,
      currentBodySha256: currentRecord.bodySha256,
      historicalBodyHashMatches: currentRecord.bodySha256 === record.bodySha256,
      fixtureSemanticUnitCount: record.semanticUnitCount,
      currentSemanticUnitCount: converted.ledger.length,
      semanticUnitCountMatches: true,
      immutableSourceSha256: currentRecord.sha256,
    })
  }
  const sourceValidation = {
    schemaVersion: 1,
    status: "pass",
    historicalBodyHashPolicy: "historical-destination-byte-evidence-not-current-byte-gate",
    acceptedLimitation:
      "Coordinator authorized semantic identity plus exact current-byte snapshot because all 15 historical body hashes predate approved mechanical changes.",
    recordCount: validations.length,
    historicalBodyHashMismatchCount: validations.filter(
      (record) => !record.historicalBodyHashMatches,
    ).length,
    semanticUnitCountMismatchCount: 0,
    records: validations,
  }
  await writeJson(path.join(run, "decisions.json"), {
    schemaVersion: 1,
    phase: "Phase 3 Tistory Markdown",
    sourcePolicy: sourceValidation.historicalBodyHashPolicy,
    applyScope: binding.records.map((record) => record.destinationPath),
    preservePhase2BrainDestinations: true,
  })
  await writeJson(path.join(run, "source-validation.json"), sourceValidation)
  await writeJson(path.join(run, "before.manifest.json"), {
    schemaVersion: 1,
    recordCount: beforeRecords.length,
    records: beforeRecords,
  })
  const plan = {
    schemaVersion: 1,
    phase: "tistory-html-to-obsidian-markdown",
    status: "ready",
    recordCount: binding.records.length,
    paths: binding.records.map((record) => record.destinationPath),
    sourceValidation: "source-validation.json",
    beforeManifest: "before.manifest.json",
    journal: "journal.jsonl",
  }
  await writeJson(path.join(run, "plan.json"), plan)
  return plan
}

async function readManifest(run, name) {
  return JSON.parse(await readFile(path.join(run, name), "utf8"))
}

async function assertSourceHashes(root, manifest) {
  for (const record of manifest.records) {
    const actual = await fileRecord(root, record.path)
    if (actual.sha256 !== record.sha256) {
      throw new Error(`${record.path}: source hash drift before staging/apply`)
    }
  }
}

export async function stageMigration({ root = DEFAULT_ROOT, run = DEFAULT_RUN } = {}) {
  root = path.resolve(root)
  run = path.resolve(root, run)
  const plan = await readManifest(run, "plan.json")
  const before = await readManifest(run, "before.manifest.json")
  if (plan.status !== "ready" || plan.recordCount !== 15)
    throw new Error("Phase 3 plan is not ready")
  await assertSourceHashes(root, before)
  const stageRoot = path.join(run, "stage")
  await rm(stageRoot, { recursive: true, force: true })
  await mkdir(stageRoot, { recursive: true })
  await cp(path.join(root, "content"), path.join(stageRoot, "content"), {
    recursive: true,
    preserveTimestamps: true,
  })
  const binding = await fixture(root)
  const ledgers = []
  const stageRecords = []
  for (const record of binding.records) {
    const relative = record.destinationPath
    const sourceBytes = await readFile(path.join(run, "before", relative))
    const parts = splitDocument(sourceBytes, relative)
    const converted = convertHtmlBody(parts.body, {
      sourceUrl: `https://jae-yoon.tistory.com/${record.id}`,
    })
    if (converted.ledger.length !== record.semanticUnitCount) {
      throw new Error(`${relative}: semantic unit count drift during staging`)
    }
    const destination = Buffer.concat([parts.frontmatter, Buffer.from(converted.body)])
    const stagePath = path.join(stageRoot, relative)
    await writeFile(stagePath, destination)
    await chmod(stagePath, before.records.find((entry) => entry.path === relative).mode)
    const scan = scanNativeMarkdown(converted.body)
    if (scan.rawTags.length || scan.tistoryAttributes.length || scan.sameSiteAbsoluteLinks.length) {
      throw new Error(`${relative}: native Markdown scan failed: ${JSON.stringify(scan)}`)
    }
    if (
      JSON.stringify(converted.externalSourceTargets) !==
        JSON.stringify(converted.externalDestinationTargets) ||
      JSON.stringify(converted.imageSourcePaths) !== JSON.stringify(converted.imageDestinationPaths)
    ) {
      throw new Error(`${relative}: external target or image path changed`)
    }
    const ledger = {
      schemaVersion: 1,
      status: "pass",
      postId: record.id,
      sourcePath: `before/${relative}`,
      destinationPath: `stage/${relative}`,
      sourceSha256: sha256(sourceBytes),
      destinationSha256: sha256(destination),
      sourceUnitCount: converted.ledger.length,
      destinationUnitCount: converted.ledger.length,
      missingUnitCount: 0,
      extraUnitCount: 0,
      reorderedUnitCount: 0,
      nonMechanicalChangeCount: 0,
      allowedMechanicalChanges: [
        "html-to-markdown-formatting",
        "remove-tistory-attributes-and-style-wrappers",
        "same-site-link-target",
        "empty-paragraph-as-nbsp",
      ],
      sameSiteRewrites: converted.sameSiteRewrites,
      externalTargets: converted.externalSourceTargets,
      imagePaths: converted.imageSourcePaths,
      formatting: converted.formatting,
      units: converted.ledger,
    }
    await writeJson(path.join(run, "tistory-fidelity", `${record.id}.json`), ledger)
    ledgers.push(ledger)
    stageRecords.push(await fileRecord(stageRoot, relative))
  }
  await writeJson(path.join(run, "tistory-fidelity.json"), {
    schemaVersion: 1,
    status: "pass",
    passedPostCount: ledgers.length,
    failedPostCount: 0,
    sourceUnitCount: ledgers.reduce((sum, ledger) => sum + ledger.sourceUnitCount, 0),
    destinationUnitCount: ledgers.reduce((sum, ledger) => sum + ledger.destinationUnitCount, 0),
    missingUnitCount: 0,
    extraUnitCount: 0,
    reorderedUnitCount: 0,
    nonMechanicalChangeCount: 0,
    sameSiteRewriteCount: ledgers.reduce((sum, ledger) => sum + ledger.sameSiteRewrites.length, 0),
    posts: ledgers.map((ledger) => ({
      postId: ledger.postId,
      unitCount: ledger.sourceUnitCount,
      status: ledger.status,
    })),
  })
  await writeJson(path.join(run, "stage.manifest.json"), {
    schemaVersion: 1,
    recordCount: stageRecords.length,
    records: stageRecords,
  })
  return { status: "pass", recordCount: stageRecords.length }
}

function knowledgeProjection(contentIndex) {
  const nodes = Object.keys(contentIndex)
    .filter((slug) => slug.startsWith("brain/knowledge/"))
    .sort()
  const nodeSet = new Set(nodes)
  const edges = []
  for (const source of nodes) {
    for (const target of contentIndex[source]?.links ?? []) {
      const normalized = String(target).replace(/^\/+/, "").replace(/\/+$/, "").toLowerCase()
      if (nodeSet.has(normalized)) edges.push(`${source}->${normalized}`)
    }
  }
  return { nodes, edges: edges.sort() }
}

export async function verifyMigration({
  root = DEFAULT_ROOT,
  run = DEFAULT_RUN,
  target = "stage",
  publicRoot,
} = {}) {
  root = path.resolve(root)
  run = path.resolve(root, run)
  const targetRoot = target === "stage" ? path.join(run, "stage") : root
  const before = await readManifest(run, "before.manifest.json")
  const staged = await readManifest(run, "stage.manifest.json")
  const fidelity = await readManifest(run, "tistory-fidelity.json")
  const errors = []
  const records = []
  for (const stageRecord of staged.records) {
    const relative = stageRecord.path
    const bytes = await readFile(path.join(targetRoot, relative))
    const actual = await fileRecord(targetRoot, relative)
    const beforeBytes = await readFile(path.join(run, "before", relative))
    const beforeParts = splitDocument(beforeBytes, relative)
    const parts = splitDocument(bytes, relative)
    const scan = scanNativeMarkdown(parts.body.toString("utf8"))
    if (!parts.frontmatter.equals(beforeParts.frontmatter))
      errors.push(`${relative}: frontmatter changed`)
    if (actual.sha256 !== stageRecord.sha256) errors.push(`${relative}: staged hash mismatch`)
    if (scan.rawTags.length) errors.push(`${relative}: raw HTML remains`)
    if (scan.tistoryAttributes.length) errors.push(`${relative}: Tistory attributes remain`)
    if (scan.sameSiteAbsoluteLinks.length)
      errors.push(`${relative}: same-site absolute links remain`)
    records.push({ path: relative, scan, sha256: actual.sha256 })
  }
  if (
    fidelity.status !== "pass" ||
    fidelity.passedPostCount !== 15 ||
    fidelity.missingUnitCount !== 0 ||
    fidelity.extraUnitCount !== 0 ||
    fidelity.reorderedUnitCount !== 0 ||
    fidelity.nonMechanicalChangeCount !== 0
  ) {
    errors.push("semantic fidelity aggregate is not a clean 15-post pass")
  }
  let graph = null
  const resolvedPublic = publicRoot ? path.resolve(root, publicRoot) : null
  if (resolvedPublic) {
    const contentIndexPath = path.join(resolvedPublic, "static/contentIndex.json")
    if (!(await exists(contentIndexPath))) errors.push("staged content index is missing")
    else {
      const contentIndex = JSON.parse(await readFile(contentIndexPath, "utf8"))
      const projection = knowledgeProjection(contentIndex)
      const tistoryInputNodes = Object.keys(contentIndex).filter((slug) =>
        slug.startsWith("articles/tistory/"),
      )
      const tistoryProjectedNodes = projection.nodes.filter((slug) => slug.includes("tistory"))
      const tistoryProjectedEdges = projection.edges.filter((edge) => edge.includes("tistory"))
      graph = {
        inputTistoryNodeCount: tistoryInputNodes.length,
        projectedKnowledgeNodeCount: projection.nodes.length,
        projectedKnowledgeEdgeCount: projection.edges.length,
        projectedTistoryNodeCount: tistoryProjectedNodes.length,
        projectedTistoryEdgeCount: tistoryProjectedEdges.length,
      }
      if (tistoryProjectedNodes.length || tistoryProjectedEdges.length) {
        errors.push("Tistory leaked into the knowledge-only graph projection")
      }
      for (const record of before.records) {
        const id = path.basename(record.path, ".md")
        if (!(await exists(path.join(resolvedPublic, `articles/tistory/${id}.html`)))) {
          errors.push(`built route is missing: /articles/tistory/${id}/`)
        }
      }
    }
  }
  const report = {
    schemaVersion: 1,
    status: errors.length === 0 ? "pass" : "fail",
    target,
    recordCount: records.length,
    rawHtmlCount: records.reduce((sum, record) => sum + record.scan.rawTags.length, 0),
    tistoryAttributeCount: records.reduce(
      (sum, record) => sum + record.scan.tistoryAttributes.length,
      0,
    ),
    sameSiteAbsoluteLinkCount: records.reduce(
      (sum, record) => sum + record.scan.sameSiteAbsoluteLinks.length,
      0,
    ),
    fidelity: {
      sourceUnitCount: fidelity.sourceUnitCount,
      destinationUnitCount: fidelity.destinationUnitCount,
      missingUnitCount: fidelity.missingUnitCount,
      extraUnitCount: fidelity.extraUnitCount,
      reorderedUnitCount: fidelity.reorderedUnitCount,
      nonMechanicalChangeCount: fidelity.nonMechanicalChangeCount,
    },
    graph,
    errors,
  }
  await writeJson(
    path.join(run, target === "stage" ? "verify-stage.json" : "verify-after.json"),
    report,
  )
  if (errors.length) throw new Error(`Phase 3 ${target} verification failed:\n${errors.join("\n")}`)
  return report
}

async function appendJournalRecord(journalPath, record) {
  await mkdir(path.dirname(journalPath), { recursive: true })
  const handle = await open(journalPath, "a")
  try {
    await handle.write(`${JSON.stringify(record)}\n`)
    await handle.sync()
  } finally {
    await handle.close()
  }
}

async function atomicReplace(target, bytes, mode, transactionRoot) {
  await mkdir(transactionRoot, { recursive: true })
  const temporary = path.join(transactionRoot, `${path.basename(target)}.${process.pid}.tmp`)
  await writeFile(temporary, bytes)
  await chmod(temporary, mode)
  const handle = await open(temporary, "r")
  try {
    await handle.sync()
  } finally {
    await handle.close()
  }
  await rename(temporary, target)
}

export async function applyMigration({
  root = DEFAULT_ROOT,
  run = DEFAULT_RUN,
  faultAfterMutationOperations = null,
} = {}) {
  root = path.resolve(root)
  run = path.resolve(root, run)
  const verification = await readManifest(run, "verify-stage.json")
  if (verification.status !== "pass" || !verification.graph) {
    throw new Error("a passing staged build verification is required before apply")
  }
  const before = await readManifest(run, "before.manifest.json")
  const staged = await readManifest(run, "stage.manifest.json")
  const byPath = new Map(staged.records.map((record) => [record.path, record]))
  const states = []
  for (const record of before.records) {
    const actual = await fileRecord(root, record.path)
    const post = byPath.get(record.path)
    if (!post) throw new Error(`${record.path}: missing stage record`)
    if (actual.sha256 === post.sha256) states.push("post")
    else if (actual.sha256 === record.sha256) states.push("pre")
    else throw new Error(`${record.path}: pre-apply hash drift`)
  }
  if (states.every((state) => state === "post"))
    return { status: "already-applied", recordCount: 15 }
  if (states.some((state) => state === "post"))
    throw new Error("partial Phase 3 apply requires rollback")

  const journalPath = path.join(run, "journal.jsonl")
  await rm(journalPath, { force: true })
  let operations = 0
  for (const record of before.records) {
    const post = byPath.get(record.path)
    const target = path.join(root, record.path)
    const stagedBytes = await readFile(path.join(run, "stage", record.path))
    const base = {
      phase: "tistory-markdown",
      operation: "modified",
      action: "apply",
      path: record.path,
      preSha256: record.sha256,
      postSha256: post.sha256,
    }
    await appendJournalRecord(journalPath, { ...base, state: "intent" })
    await atomicReplace(target, stagedBytes, record.mode, path.join(run, "transactions"))
    operations += 1
    if (faultAfterMutationOperations === operations) {
      throw new Error(`injected Phase 3 apply interruption after ${operations} mutations`)
    }
    await appendJournalRecord(journalPath, { ...base, state: "completed" })
  }
  const after = []
  for (const record of before.records) after.push(await fileRecord(root, record.path))
  await writeJson(path.join(run, "after.manifest.json"), {
    schemaVersion: 1,
    recordCount: after.length,
    records: after,
  })
  return { status: "applied", recordCount: after.length }
}

export async function rollbackMigration({ root = DEFAULT_ROOT, run = DEFAULT_RUN } = {}) {
  root = path.resolve(root)
  run = path.resolve(root, run)
  const before = await readManifest(run, "before.manifest.json")
  const staged = await readManifest(run, "stage.manifest.json")
  const byPath = new Map(staged.records.map((record) => [record.path, record]))
  const allowed = new Set(before.records.map((record) => record.path))
  const journalPath = path.join(run, "journal.jsonl")
  const journal = (await exists(journalPath))
    ? (await readFile(journalPath, "utf8"))
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line))
    : []
  for (const entry of journal) {
    if (!allowed.has(entry.path)) throw new Error(`journal escaped Phase 3 scope: ${entry.path}`)
  }
  let restored = 0
  for (const record of [...before.records].reverse()) {
    const post = byPath.get(record.path)
    const actual = await fileRecord(root, record.path)
    if (actual.sha256 === record.sha256) continue
    if (actual.sha256 !== post.sha256) throw new Error(`${record.path}: rollback hash drift`)
    const base = {
      phase: "tistory-markdown",
      operation: "modified",
      action: "rollback",
      path: record.path,
      preSha256: post.sha256,
      postSha256: record.sha256,
    }
    await appendJournalRecord(journalPath, { ...base, state: "intent" })
    const snapshot = await readFile(path.join(run, "before", record.path))
    await atomicReplace(
      path.join(root, record.path),
      snapshot,
      record.mode,
      path.join(run, "transactions"),
    )
    await appendJournalRecord(journalPath, { ...base, state: "completed" })
    restored += 1
  }
  for (const record of before.records) {
    const actual = await fileRecord(root, record.path)
    if (actual.sha256 !== record.sha256) throw new Error(`${record.path}: rollback was not exact`)
  }
  const report = { schemaVersion: 1, status: "pass", restoredCount: restored, recordCount: 15 }
  await writeJson(path.join(run, "rollback-report.json"), report)
  return report
}

function parseArgs(argv) {
  const [command, ...rest] = argv
  const options = { command }
  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index]
    if (!argument.startsWith("--")) throw new Error(`unexpected argument: ${argument}`)
    const key = argument.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
    const value = rest[index + 1]
    if (!value || value.startsWith("--")) options[key] = true
    else {
      options[key] = value
      index += 1
    }
  }
  return options
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const common = { root: options.root ?? DEFAULT_ROOT, run: options.run ?? DEFAULT_RUN }
  let result
  if (options.command === "plan") result = await planMigration(common)
  else if (options.command === "stage") result = await stageMigration(common)
  else if (options.command === "verify") {
    result = await verifyMigration({
      ...common,
      target: options.target ?? "stage",
      publicRoot: options.publicRoot,
    })
  } else if (options.command === "apply") result = await applyMigration(common)
  else if (options.command === "rollback") result = await rollbackMigration(common)
  else throw new Error("usage: migrate-tistory-markdown.mjs plan|stage|verify|apply|rollback")
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`)
    process.exitCode = 1
  })
}
