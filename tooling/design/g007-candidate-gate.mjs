import { createHash } from "node:crypto"
import { cp, lstat, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises"
import { basename, isAbsolute, join, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"
import { auditPublicBrandMedia } from "./g003-preservation-sentinels.mjs"

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)))
const repoRoot = resolve(root, "../..")
const evidenceRoot = resolve(root, "../evidence/design-remediation")
const outputDir = join(evidenceRoot, "g007")
const screenshotDir = join(outputDir, "screenshots")
const diffDir = join(outputDir, "diffs")

const sha256 = (value) => createHash("sha256").update(value).digest("hex")
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"))
const relativeToRepo = (path) => relative(repoRoot, path)

async function resolveRepoEvidenceFile(pathValue, label) {
  if (
    typeof pathValue !== "string" ||
    pathValue.length === 0 ||
    pathValue.includes("\0") ||
    isAbsolute(pathValue) ||
    /^[A-Za-z]:[\\/]/.test(pathValue) ||
    pathValue.startsWith("\\\\")
  ) {
    throw new Error(`${label}: evidence path must be a repository-relative file path`)
  }

  const portableSegments = pathValue.replaceAll("\\", "/").split("/")
  if (portableSegments.includes("..")) {
    throw new Error(`${label}: evidence path traversal is forbidden`)
  }

  const absolute = resolve(repoRoot, pathValue)
  const repositoryRelative = relative(repoRoot, absolute)
  if (
    repositoryRelative === ".." ||
    repositoryRelative.startsWith(`..${sep}`) ||
    isAbsolute(repositoryRelative)
  ) {
    throw new Error(`${label}: evidence path resolves outside the repository`)
  }

  let cursor = repoRoot
  let metadata
  for (const segment of repositoryRelative.split(sep).filter(Boolean)) {
    cursor = join(cursor, segment)
    metadata = await lstat(cursor)
    if (metadata.isSymbolicLink()) {
      throw new Error(`${label}: evidence path must not contain symbolic links`)
    }
  }
  if (!metadata?.isFile()) throw new Error(`${label}: evidence path must resolve to a file`)
  return absolute
}

async function fileBinding(path) {
  const bytes = await readFile(path)
  const metadata = path.endsWith(".png") ? await sharp(bytes).metadata() : undefined
  return {
    path: relativeToRepo(path),
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
    ...(metadata ? { width: metadata.width, height: metadata.height } : {}),
  }
}

async function treeBinding(path) {
  const entries = []
  let latestModifiedAt = 0
  async function walk(directory) {
    for (const name of (await readdir(directory)).sort()) {
      const absolute = join(directory, name)
      const info = await stat(absolute)
      if (info.isDirectory()) await walk(absolute)
      else if (info.isFile()) {
        entries.push(await fileBinding(absolute))
        latestModifiedAt = Math.max(latestModifiedAt, info.mtimeMs)
      }
    }
  }
  await walk(path)
  const canonical = entries
    .map(({ path: filePath, bytes, sha256: hash }) => `${filePath}\0${bytes}\0${hash}`)
    .join("\n")
  return {
    path: relativeToRepo(path),
    fileCount: entries.length,
    sha256: sha256(canonical),
    latestModifiedAt: new Date(latestModifiedAt).toISOString(),
  }
}

async function makeDiff(id, candidatePath, referencePath) {
  const candidate = sharp(candidatePath).ensureAlpha().raw()
  const reference = sharp(referencePath).ensureAlpha().raw()
  const [candidateMeta, referenceMeta] = await Promise.all([
    candidate.metadata(),
    reference.metadata(),
  ])
  if (
    candidateMeta.width !== referenceMeta.width ||
    candidateMeta.height !== referenceMeta.height
  ) {
    throw new Error(`${id}: candidate/reference dimensions differ`)
  }
  const [candidatePixels, referencePixels] = await Promise.all([
    candidate.toBuffer(),
    reference.toBuffer(),
  ])
  const diff = Buffer.alloc(candidatePixels.length)
  let absoluteError = 0
  let changedPixels = 0
  for (let index = 0; index < candidatePixels.length; index += 4) {
    let pixelChanged = false
    for (let channel = 0; channel < 3; channel += 1) {
      const delta = Math.abs(candidatePixels[index + channel] - referencePixels[index + channel])
      absoluteError += delta
      pixelChanged ||= delta > 8
      diff[index + channel] = delta
    }
    diff[index + 3] = 255
    if (pixelChanged) changedPixels += 1
  }
  const pixelCount = candidateMeta.width * candidateMeta.height
  const outputPath = join(diffDir, `${id}-diff.png`)
  await sharp(diff, {
    raw: { width: candidateMeta.width, height: candidateMeta.height, channels: 4 },
  })
    .png()
    .toFile(outputPath)
  return {
    id,
    candidate: await fileBinding(candidatePath),
    reference: await fileBinding(referencePath),
    diff: await fileBinding(outputPath),
    metrics: {
      meanAbsoluteError: Number((absoluteError / (pixelCount * 3 * 255)).toFixed(6)),
      changedPixelRatio: Number((changedPixels / pixelCount).toFixed(6)),
      role: "secondary-diagnostic-only",
    },
  }
}

const g005 = await readJson(join(evidenceRoot, "g005/capture-index.json"))
const g006 = await readJson(join(evidenceRoot, "g006/capture-index.json"))
const reference = await readJson(join(evidenceRoot, "reference/index.json"))
const legacy = await readJson(join(evidenceRoot, "legacy-baseline/index.json"))
const visualVerdict = await readJson(join(outputDir, "visual-verdict.json"))
const mandatoryVisualAssessmentFields = [
  "approvedDevUniDirection",
  "referenceHomeMatch",
  "surfaceConsistency",
  "purposeDistinction",
  "mobile",
  "darkMode",
  "editorialAsymmetry",
  "modernClean",
  "nonAiTemplate",
  "notQuartzClone",
]

if (g005.status !== "PASS" || g005.cells.length !== 8)
  throw new Error("G005 capture evidence is incomplete")
if (g006.status !== "PASS" || g006.cells.length !== 24)
  throw new Error("G006 capture evidence is incomplete")
if (legacy.matrix.cells.length !== 16)
  throw new Error("Legacy baseline must contain exactly 16 cells")
if (
  visualVerdict.verdict !== "PASS" ||
  visualVerdict.threshold !== 90 ||
  visualVerdict.score < 90 ||
  visualVerdict.reviewedCellCount !== 32 ||
  !Array.isArray(visualVerdict.blockingFindings) ||
  visualVerdict.blockingFindings.length !== 0 ||
  mandatoryVisualAssessmentFields.some((field) => visualVerdict.assessment?.[field] !== "PASS")
) {
  throw new Error("Independent visual verdict is incomplete or below threshold")
}

await Promise.all([mkdir(screenshotDir, { recursive: true }), mkdir(diffDir, { recursive: true })])

const sourceCells = [...g005.cells, ...g006.cells]
const ids = new Set(sourceCells.map((cell) => cell.id))
if (sourceCells.length !== 32 || ids.size !== 32)
  throw new Error("Candidate matrix must contain 32 unique cells")

const cells = []
for (const cell of sourceCells) {
  const sourcePath = await resolveRepoEvidenceFile(
    cell.screenshot?.path,
    `${cell.id}: candidate screenshot`,
  )
  const targetPath = join(screenshotDir, basename(cell.screenshot.path))
  await cp(sourcePath, targetPath)
  const screenshot = await fileBinding(targetPath)
  const expectedWidth = cell.viewport.width
  const expectedHeight = cell.viewport.height
  if (screenshot.width !== expectedWidth || screenshot.height !== expectedHeight) {
    throw new Error(`${cell.id}: screenshot dimensions do not match the capture contract`)
  }
  cells.push({
    id: cell.id,
    route: cell.route,
    surface: cell.surface ?? cell.expectedSurface,
    viewport: cell.viewport,
    theme: cell.theme,
    screenshot,
    sourceEvidence: relativeToRepo(sourcePath),
  })
}
const candidateMatrixSha256 = sha256(
  cells
    .map((cell) => `${cell.id}\0${cell.screenshot.sha256}`)
    .sort()
    .join("\n"),
)
if (visualVerdict.candidateMatrixSha256 !== candidateMatrixSha256) {
  throw new Error("Independent visual verdict is not bound to the current candidate matrix")
}

const homeDiffs = []
for (const id of [
  "home-mobile-light",
  "home-mobile-dark",
  "home-desktop-light",
  "home-desktop-dark",
]) {
  homeDiffs.push(
    await makeDiff(
      id,
      join(screenshotDir, `${id}.png`),
      join(evidenceRoot, `reference/screenshots/${id}.png`),
    ),
  )
}

const legacyCells = []
for (const cell of legacy.matrix.cells) {
  const path = await resolveRepoEvidenceFile(cell.screenshot?.path, `${cell.id}: legacy screenshot`)
  const binding = await fileBinding(path)
  if (binding.sha256 !== cell.screenshot.sha256)
    throw new Error(`${cell.id}: legacy baseline hash changed`)
  legacyCells.push({ id: cell.id, screenshot: binding })
}

const antiTemplateSources = [
  "migration/quartz-v5/quartz/styles/custom.scss",
  "migration/quartz-v5/quartz/components/DevUniLanding.tsx",
  "migration/quartz-v5/quartz/components/frames/DevUniFrame.tsx",
  "migration/quartz-v5/quartz/components/PrimaryNavigation.tsx",
  "migration/quartz-v5/quartz/components/scripts/devUniShell.inline.ts",
  "migration/quartz-v5/content/index.md",
  "migration/quartz-v5/content/about.md",
  "migration/quartz-v5/content/portfolio/index.md",
  "migration/quartz-v5/content/portfolio/quartz-migration.md",
  "migration/quartz-v5/content/brain/_index.md",
  "migration/quartz-v5/content/garden/progressive-discovery.md",
  "migration/quartz-v5/content/articles/index.md",
  "migration/quartz-v5/content/articles/reading-first-design.md",
]
const ownershipSources = [
  "migration/quartz-v5/quartz.ts",
  "migration/quartz-v5/quartz.config.default.yaml",
  "migration/quartz-v5/package.json",
  "migration/quartz-v5/package-lock.json",
  "migration/quartz-v5/.node-version",
  "migration/quartz-v5/quartz/components/devUniSurface.ts",
  "migration/quartz-v5/quartz/components/frames/index.ts",
  "migration/quartz-v5/quartz/components/frames/registry.ts",
  "migration/quartz-v5/quartz/components/renderPage.tsx",
  "migration/quartz-v5/quartz/plugins/loader/conditions.ts",
  "migration/quartz-v5/quartz/plugins/loader/config-loader.ts",
  "migration/quartz-v5/tooling/design/g003-preservation-sentinels.mjs",
  "migration/quartz-v5/tooling/design/capture-g005.mjs",
  "migration/quartz-v5/tooling/design/capture-g006.mjs",
  "migration/quartz-v5/tooling/design/g006-spa-regression.mjs",
  "migration/quartz-v5/tooling/design/g005-implementation-contract.test.mjs",
  "migration/quartz-v5/tooling/design/g006-surface-contract.test.mjs",
  "migration/quartz-v5/tooling/design/g007-candidate-gate.mjs",
]
const antiTemplateSourceSet = new Set(antiTemplateSources)
const relevantSources = [...new Set([...antiTemplateSources, ...ownershipSources])]
const sourceBindings = []
let combinedSource = ""
let latestSourceModifiedAt = 0
for (const sourcePath of relevantSources) {
  const absolute = resolve(repoRoot, sourcePath)
  sourceBindings.push(await fileBinding(absolute))
  latestSourceModifiedAt = Math.max(latestSourceModifiedAt, (await stat(absolute)).mtimeMs)
  if (antiTemplateSourceSet.has(sourcePath)) {
    combinedSource += `\n${await readFile(absolute, "utf8")}`
  }
}

const forbiddenPatterns = [
  { name: "gradient", expression: /(?:linear|radial|conic)-gradient\s*\(/gi },
  { name: "glassmorphism", expression: /backdrop-filter\s*:|glassmorph/gi },
  { name: "sparkle-decoration", expression: /[✨🌟💫]|sparkle/gi },
  { name: "invented-metric-copy", expression: /(?:\b\d{2,3}%\b|\b\d+x\b)/gi },
  {
    name: "generic-ai-hero-copy",
    expression: /unlock your potential|reimagine the future|supercharge your/gi,
  },
]
const forbiddenMatches = forbiddenPatterns.flatMap(({ name, expression }) =>
  [...combinedSource.matchAll(expression)].map((match) => ({ name, value: match[0] })),
)
if (forbiddenMatches.length > 0)
  throw new Error(`Anti-template scan failed: ${JSON.stringify(forbiddenMatches)}`)

const g005ProbeEntries = [...g005.cells, ...(g005.responsiveProbes ?? [])]
const g006ProbeEntries = [
  ...g006.cells,
  ...(g006.responsiveProbes ?? []),
  ...(g006.tistoryProbes ?? []),
]
const allProbeEntries = [...g005ProbeEntries, ...g006ProbeEntries]
if (g005ProbeEntries.length !== 20 || g006ProbeEntries.length !== 64) {
  throw new Error("Accessibility probe matrices are incomplete")
}
if (new Set(allProbeEntries.map((entry) => entry.id)).size !== allProbeEntries.length) {
  throw new Error("Accessibility probe ids are not unique")
}
const probeMatrix = allProbeEntries.map((entry) => ({
  id: entry.id,
  requestedViewport: { width: entry.viewport.width, height: entry.viewport.height },
  actualViewport: entry.probe.viewport,
  theme: entry.theme,
  actualTheme: entry.probe.theme,
  horizontalOverflow: entry.probe.horizontalOverflow,
  h1Count: entry.probe.h1Count,
  mainCount: entry.probe.mainCount,
  searchCount: entry.probe.searchCount,
  themeControlCount: entry.probe.themeControlCount,
  menuCount: entry.probe.menuCount,
  skipLinkFocusVisible: entry.probe.skipLinkFocusVisible,
  reducedMotion: entry.probe.reducedMotion,
  contrastSampleCount: entry.probe.contrastSamples?.length ?? null,
  contrastFailureCount: entry.probe.contrastFailures?.length ?? 0,
  controlTargetFailureCount: entry.probe.controlTargetFailures?.length ?? 0,
}))
const allProbes = allProbeEntries.map((entry) => entry.probe)
const widths = [...new Set(allProbes.map((probe) => probe.viewport?.width).filter(Boolean))].sort(
  (a, b) => a - b,
)
const accessibility = {
  widths,
  requiredWidthsPresent: [320, 390, 800, 1200, 1440].every((width) => widths.includes(width)),
  expectedProbeCount: 84,
  probeCount: probeMatrix.length,
  viewportContractFailures: probeMatrix.filter(
    ({ requestedViewport, actualViewport }) =>
      requestedViewport.width !== actualViewport.width ||
      requestedViewport.height !== actualViewport.height,
  ).length,
  themeContractFailures: probeMatrix.filter(({ theme, actualTheme }) => theme !== actualTheme)
    .length,
  horizontalOverflowFailures: allProbes.filter((probe) => probe.horizontalOverflow).length,
  contrastFailures: allProbes.flatMap((probe) => probe.contrastFailures ?? []).length,
  controlTargetFailures: allProbes.flatMap((probe) => probe.controlTargetFailures ?? []).length,
  remoteFontFailures: allProbes.filter((probe) => probe.remoteFontLinkCount > 0).length,
  headingFailures: allProbes.filter((probe) => probe.h1Count !== 1 || probe.mainCount !== 1).length,
  uniqueHeaderControlFailures: allProbes.filter(
    (probe) =>
      probe.searchCount !== 1 ||
      probe.themeControlCount !== 1 ||
      (probe.menuCount !== undefined && probe.menuCount !== 1),
  ).length,
  skipLinkFailures: allProbes.filter((probe) => probe.skipLinkFocusVisible !== true).length,
  emptyContrastSampleFailures: allProbeEntries.filter(
    (entry) =>
      !Array.isArray(entry.probe.contrastSamples) || entry.probe.contrastSamples.length === 0,
  ).length,
  reducedMotionFailures: allProbes.filter((probe) => probe.reducedMotion !== true).length,
  tistoryRepresentativeProbeCount: g006.summary.tistoryRepresentativeProbeCount,
  probeMatrix,
}
if (
  !accessibility.requiredWidthsPresent ||
  accessibility.probeCount !== accessibility.expectedProbeCount ||
  accessibility.tistoryRepresentativeProbeCount !== 4 ||
  Object.entries(accessibility).some(([key, value]) => key.endsWith("Failures") && value !== 0)
) {
  throw new Error(`Accessibility aggregate failed: ${JSON.stringify(accessibility)}`)
}

const packageJson = await readJson(join(root, "package.json"))
const publicTree = await treeBinding(join(root, "public"))
const captureGeneratedAt = Math.min(Date.parse(g005.generatedAt), Date.parse(g006.generatedAt))
if (
  !Number.isFinite(captureGeneratedAt) ||
  captureGeneratedAt < latestSourceModifiedAt ||
  captureGeneratedAt < Date.parse(publicTree.latestModifiedAt)
) {
  throw new Error("Candidate captures are older than their bound source or public build")
}
const brandMedia = await auditPublicBrandMedia(join(root, "public"), { repository: repoRoot })
if (brandMedia.status !== "pass") {
  throw new Error(`Brand media audit failed: ${brandMedia.errors.join("; ")}`)
}
const expectedSurfaceMarkers = [
  "home",
  "about",
  "portfolio-index",
  "portfolio-detail",
  "garden-index",
  "garden-detail",
  "articles-index",
  "article-detail",
]
const actualSurfaceMarkers = [...new Set(cells.map((cell) => cell.surface))].sort()
if (
  actualSurfaceMarkers.length !== expectedSurfaceMarkers.length ||
  expectedSurfaceMarkers.some((surface) => !actualSurfaceMarkers.includes(surface))
) {
  throw new Error(`Surface-purpose matrix is incomplete: ${actualSurfaceMarkers.join(", ")}`)
}
const devUniMarkers = ["Dev Uni", "SECOND", "BRAIN", "NOW / CONNECTED RECORDS"].filter((marker) =>
  combinedSource.includes(marker),
)
if (devUniMarkers.length !== 4 || visualVerdict.assessment.nonAiTemplate !== "PASS") {
  throw new Error("Dev Uni rebrandability or independent anti-template review is incomplete")
}
const report = {
  schemaVersion: 1,
  goalId: "G007-candidate-visual-gate",
  generatedAt: new Date().toISOString(),
  status: "PASS",
  approvalState: "candidate-validated; pending-owner-final-review",
  authorizesDeployment: false,
  matrix: {
    surfaces: 8,
    viewports: ["mobile-390x844", "desktop-1440x1000"],
    themes: ["light", "dark"],
    expectedCellCount: 32,
    capturedCellCount: cells.length,
    uniqueCellCount: ids.size,
    candidateMatrixSha256,
    cells,
  },
  referenceComparison: {
    role: "pixel-diff-is-secondary-to-independent-visual-review",
    referenceIndex: await fileBinding(join(evidenceRoot, "reference/index.json")),
    homeDiffs,
  },
  legacyContinuity: {
    role: "hash-bound-context-only; no fabricated similarity score",
    expectedCellCount: 16,
    verifiedCellCount: legacyCells.length,
    baselineIndex: await fileBinding(join(evidenceRoot, "legacy-baseline/index.json")),
    cells: legacyCells,
  },
  accessibility,
  antiTemplate: {
    status: "PASS",
    forbiddenMatches,
    machineChecks: [
      "no gradients",
      "no glass effects",
      "no sparkle decoration",
      "no invented metrics",
      "no generic AI hero copy",
    ],
    independentVisualChecks: {
      repeatedGenericCards: visualVerdict.assessment.nonAiTemplate,
      rebrandability: visualVerdict.assessment.approvedDevUniDirection,
      purposeDistinction: visualVerdict.assessment.purposeDistinction,
    },
    devUniMarkers,
    surfaceMarkers: actualSurfaceMarkers,
    brandMediaAudit: brandMedia,
  },
  bindings: {
    node: process.version,
    packageManager: packageJson.packageManager,
    sourceFiles: sourceBindings,
    g005CaptureIndex: await fileBinding(join(evidenceRoot, "g005/capture-index.json")),
    g006CaptureIndex: await fileBinding(join(evidenceRoot, "g006/capture-index.json")),
    capturesGeneratedAt: {
      g005: g005.generatedAt,
      g006: g006.generatedAt,
    },
    latestSourceModifiedAt: new Date(latestSourceModifiedAt).toISOString(),
    publicTree,
  },
  independentVisualVerdict: {
    status: visualVerdict.verdict,
    score: visualVerdict.score,
    threshold: visualVerdict.threshold,
    reviewer: visualVerdict.reviewer,
    evidence: await fileBinding(join(outputDir, "visual-verdict.json")),
  },
}

await writeFile(join(outputDir, "candidate-gate.json"), `${JSON.stringify(report, null, 2)}\n`)
console.log(
  `G007 candidate gate PASS: ${cells.length}/32 screenshots, ${homeDiffs.length}/4 diffs, ${legacyCells.length}/16 legacy hashes`,
)
