import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const quartzRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const repositoryRoot = path.resolve(quartzRoot, "../..")
const referenceRoot = path.join(repositoryRoot, "migration/evidence/design-remediation/reference")
const indexPath = path.join(referenceRoot, "index.json")

const expectedCells = new Map([
  ["home-desktop-light", { width: 1440, height: 1000, theme: "light" }],
  ["home-desktop-dark", { width: 1440, height: 1000, theme: "dark" }],
  ["home-mobile-light", { width: 390, height: 844, theme: "light" }],
  ["home-mobile-dark", { width: 390, height: 844, theme: "dark" }],
])

const expectedContinuationCells = new Map([
  ["home-mobile-continuation-light", { width: 390, height: 844, theme: "light" }],
  ["home-mobile-continuation-dark", { width: 390, height: 844, theme: "dark" }],
])

const requiredText = [
  "Dev Uni",
  "신재윤 / Backend Software Engineer",
  "SECOND",
  "BRAIN",
  "이해한 것을 연결하고",
  "점진적 발견과 디지털 가든",
  "Quartz 5 지식 사이트 전환",
  "공개 범위와 기존 경로를 보존한 Quartz 5 선택",
  "기술 블로그에서 읽기 우선 디자인하기",
]

const forbiddenSourcePatterns = [
  ["gradient", /\b(?:linear|radial|conic)-gradient\s*\(/i],
  ["backdrop-filter", /\bbackdrop-filter\s*:/i],
  ["blur-filter", /\bfilter\s*:\s*blur\s*\(/i],
  ["ambient-animation", /(?:@keyframes\b|\banimation(?:-name)?\s*:)/i],
  ["oversized-pill-radius", /\bborder-radius\s*:\s*(?:99|999|9999)(?:px|rem)\b/i],
  ["background-image", /\bbackground-image\s*:/i],
  ["legacy-or-stock-media", /<(?:img|picture|video|iframe)\b/i],
  ["remote-resource", /\b(?:src|href)\s*=\s*["']https?:\/\//i],
  ["generic-portfolio-copy", /welcome to my portfolio|building the future|ai-powered/i],
  ["fake-metric-copy", /\b\d+[km]\+\s+(?:users|customers|projects)\b/i],
]

export const sha256 = (value) => createHash("sha256").update(value).digest("hex")

async function assertBinding(binding, label) {
  if (!binding || typeof binding.path !== "string" || !/^[a-f0-9]{64}$/.test(binding.sha256)) {
    throw new Error(`${label}: path and sha256 binding are required`)
  }
  const bytes = await readFile(path.join(repositoryRoot, binding.path))
  if (sha256(bytes) !== binding.sha256) throw new Error(`${label}: stale content hash`)
}

function pngDimensions(bytes) {
  if (
    bytes.byteLength < 24 ||
    bytes.toString("hex", 0, 8) !== "89504e470d0a1a0a" ||
    bytes.toString("ascii", 12, 16) !== "IHDR"
  ) {
    throw new Error("reference screenshot is not a valid PNG")
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

export async function scanHomeReferenceSource() {
  const sourcePaths = [
    "migration/evidence/design-remediation/reference/home.html",
    "migration/evidence/design-remediation/reference/home.css",
  ]
  const matches = []
  let combined = ""
  for (const sourcePath of sourcePaths) {
    const source = await readFile(path.join(repositoryRoot, sourcePath), "utf8")
    combined += `\n${source}`
    for (const [label, pattern] of forbiddenSourcePatterns) {
      if (pattern.test(source)) matches.push({ path: sourcePath, label })
    }
  }
  const missingText = requiredText.filter((text) => !combined.includes(text))
  const radii = [...combined.matchAll(/border-radius\s*:\s*([0-9.]+)px/gi)].map((match) =>
    Number(match[1]),
  )
  const excessiveRadii = radii.filter((radius) => radius > 8)
  return {
    status:
      matches.length === 0 && missingText.length === 0 && excessiveRadii.length === 0
        ? "pass"
        : "fail",
    files: sourcePaths,
    forbiddenMatches: matches,
    missingRequiredText: missingText,
    excessiveRadii,
    usesLegacyOrRemoteMedia: matches.some(({ label }) =>
      ["legacy-or-stock-media", "remote-resource"].includes(label),
    ),
  }
}

export async function loadAndVerifyHomeReference() {
  const index = JSON.parse(await readFile(indexPath, "utf8"))
  if (
    index.schemaVersion !== 1 ||
    index.status !== "complete-candidate-reference" ||
    index.approvalState !== "pending-owner-review" ||
    index.authorizesDirection !== false ||
    index.authorizesAssets !== false ||
    index.productionUiMutation !== false
  ) {
    throw new Error("Home reference status must remain complete, non-production, and unapproved")
  }

  const requiredBindings = ["design", "visualBrief", "legacyBaseline", "html", "css"]
  for (const name of requiredBindings) {
    await assertBinding(index.source.bindings[name], `Home reference ${name}`)
  }
  const bindingLines = requiredBindings.map((name) => {
    const binding = index.source.bindings[name]
    return `${binding.path}\0${binding.sha256}\n`
  })
  if (sha256(bindingLines.join("")) !== index.source.bindingIndexSha256) {
    throw new Error("Home reference binding index hash mismatch")
  }

  const scan = await scanHomeReferenceSource()
  if (scan.status !== "pass") {
    throw new Error(`Home reference forbidden-source scan failed: ${JSON.stringify(scan)}`)
  }
  if (
    index.validation.sourceScan.status !== "pass" ||
    index.validation.sourceScan.usesLegacyOrRemoteMedia !== false
  ) {
    throw new Error("Home reference index does not record a passing source scan")
  }

  if (
    index.matrix.expectedCellCount !== 4 ||
    index.matrix.capturedCellCount !== 4 ||
    index.matrix.missingCellIds.length !== 0 ||
    index.matrix.cells.length !== 4
  ) {
    throw new Error("Home reference must contain all four required cells")
  }

  const seen = new Set()
  for (const cell of index.matrix.cells) {
    const expected = expectedCells.get(cell.id)
    if (!expected || seen.has(cell.id)) throw new Error(`unexpected or duplicate cell: ${cell.id}`)
    seen.add(cell.id)
    if (
      cell.theme !== expected.theme ||
      cell.viewport.width !== expected.width ||
      cell.viewport.height !== expected.height
    ) {
      throw new Error(`${cell.id}: viewport or theme mismatch`)
    }
    const bytes = await readFile(path.join(repositoryRoot, cell.screenshot.path))
    const dimensions = pngDimensions(bytes)
    if (
      bytes.byteLength !== cell.screenshot.bytes ||
      sha256(bytes) !== cell.screenshot.sha256 ||
      dimensions.width !== expected.width ||
      dimensions.height !== expected.height
    ) {
      throw new Error(`${cell.id}: screenshot bytes, hash, or dimensions mismatch`)
    }
    const probe = cell.probe
    if (
      probe.title !== "Dev Uni — Second Brain visual reference" ||
      probe.theme !== expected.theme ||
      probe.width !== expected.width ||
      probe.height !== expected.height ||
      probe.scrollY !== 0 ||
      probe.horizontalOverflow !== false ||
      probe.h1Count !== 1 ||
      probe.normalizedHeading !== "SECOND BRAIN" ||
      probe.requiredMarkersFound !== true ||
      probe.rebrandabilityMarkersFound !== true ||
      probe.minimumRecordTitlePx < 14 ||
      probe.minimumRecordMetadataPx < 12 ||
      probe.legacyMediaElementCount !== 0 ||
      probe.remoteResourceCount !== 0 ||
      probe.forbiddenComputedStyleCount !== 0 ||
      probe.unlabeledHeaderControlCount !== 0 ||
      probe.mobileTargetFailureCount !== 0 ||
      probe.connectedRecordsVisibleInFirstViewport !== true
    ) {
      throw new Error(`${cell.id}: capture probe failed closed: ${JSON.stringify(probe)}`)
    }
  }
  if (seen.size !== expectedCells.size) throw new Error("Home reference cell set is incomplete")
  if (
    index.continuationMatrix.expectedCellCount !== 2 ||
    index.continuationMatrix.capturedCellCount !== 2 ||
    index.continuationMatrix.missingCellIds.length !== 0 ||
    index.continuationMatrix.cells.length !== 2
  ) {
    throw new Error("Home reference must contain both mobile continuation cells")
  }
  const seenContinuations = new Set()
  for (const cell of index.continuationMatrix.cells) {
    const expected = expectedContinuationCells.get(cell.id)
    if (!expected || seenContinuations.has(cell.id)) {
      throw new Error(`unexpected or duplicate continuation cell: ${cell.id}`)
    }
    seenContinuations.add(cell.id)
    const bytes = await readFile(path.join(repositoryRoot, cell.screenshot.path))
    const dimensions = pngDimensions(bytes)
    if (
      cell.captureKind !== "mobile-continuation" ||
      cell.theme !== expected.theme ||
      cell.viewport.width !== expected.width ||
      cell.viewport.height !== expected.height ||
      bytes.byteLength !== cell.screenshot.bytes ||
      sha256(bytes) !== cell.screenshot.sha256 ||
      dimensions.width !== expected.width ||
      dimensions.height !== expected.height
    ) {
      throw new Error(`${cell.id}: continuation screenshot binding mismatch`)
    }
    const probe = cell.probe
    if (
      probe.scrollY <= 0 ||
      probe.horizontalOverflow !== false ||
      probe.canvasTransitionVisible !== true ||
      probe.canvasTransitionTop <= 0 ||
      probe.canvasTransitionTop >= expected.height ||
      probe.requiredMarkersFound !== true ||
      probe.rebrandabilityMarkersFound !== true ||
      probe.minimumRecordTitlePx < 14 ||
      probe.minimumRecordMetadataPx < 12 ||
      probe.forbiddenComputedStyleCount !== 0
    ) {
      throw new Error(`${cell.id}: continuation probe failed closed: ${JSON.stringify(probe)}`)
    }
  }
  if (seenContinuations.size !== expectedContinuationCells.size) {
    throw new Error("Home reference continuation cell set is incomplete")
  }
  if (index.reproducibility.status !== "verified-identical-rerun") {
    throw new Error("Home reference requires an identical screenshot-hash rerun")
  }
  return index
}

export const homeReferencePaths = { repositoryRoot, referenceRoot, indexPath }
