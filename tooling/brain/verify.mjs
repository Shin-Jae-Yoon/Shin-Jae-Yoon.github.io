import { mkdir, readFile, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { buildInventory } from "./inventory.mjs"
import { MOVE_RULES, fileRecord, mapSlug, parseArgs, sha256, toPosix } from "./lib.mjs"

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

function difference(left, right) {
  const rightSet = new Set(right)
  return left.filter((entry) => !rightSet.has(entry))
}

function mappedEdge(edge) {
  const divider = edge.indexOf("->")
  return `${mapSlug(edge.slice(0, divider))}->${mapSlug(edge.slice(divider + 2))}`
}

function externalReferenceIdentity(entry) {
  return `${entry.path}:${entry.line}:${entry.column}:${entry.route}`
}

function canonicalSlug(slug) {
  return String(slug)
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase()
}

async function verifyRecords(targetRoot, expected) {
  const failures = []
  for (const record of expected) {
    const absolute = path.join(targetRoot, record.path)
    if (!(await exists(absolute))) {
      failures.push({ path: record.path, reason: "missing" })
      continue
    }
    const actual = await fileRecord(absolute, targetRoot)
    if (
      actual.sha256 !== record.sha256 ||
      actual.size !== record.size ||
      actual.mode !== record.mode
    ) {
      failures.push({
        path: record.path,
        reason: "hash-or-metadata-mismatch",
        expected: record,
        actual,
      })
    }
  }
  return failures
}

async function verifyGraph(run, publicRoot) {
  if (!publicRoot || !(await exists(path.join(publicRoot, "static/contentIndex.json")))) {
    return { status: "not-run", reason: "--public content index not supplied" }
  }
  const baseline = await readJson(path.join(run, "baseline.json"))
  if (!baseline.graph) return { status: "fail", reason: "baseline graph evidence missing" }
  const actualIndex = JSON.parse(
    await readFile(path.join(publicRoot, "static/contentIndex.json"), "utf8"),
  )
  const actualNodes = [...new Set(Object.keys(actualIndex).map(canonicalSlug))].sort()
  const actualEdges = []
  for (const [source, node] of Object.entries(actualIndex)) {
    for (const target of node?.links ?? []) {
      actualEdges.push(`${canonicalSlug(source)}->${canonicalSlug(target)}`)
    }
  }
  const uniqueActualEdges = [...new Set(actualEdges)].sort()

  const baselineNodes = baseline.graph.nodes
  const expectedNodes = [
    ...new Set([...baselineNodes.map(mapSlug), "brain/notes/index", "brain/knowledge/index"]),
  ].sort()
  const expectedEdges = [...new Set(baseline.graph.edges.map(mappedEdge))].sort()
  const missingNodes = difference(expectedNodes, actualNodes)
  const unexpectedNodes = difference(actualNodes, expectedNodes)
  const missingEdges = difference(expectedEdges, uniqueActualEdges)
  const unexpectedEdges = difference(uniqueActualEdges, expectedEdges)
  return {
    status:
      missingNodes.length +
        unexpectedNodes.length +
        missingEdges.length +
        unexpectedEdges.length ===
      0
        ? "pass"
        : "fail",
    expectedNodeCount: expectedNodes.length,
    actualNodeCount: actualNodes.length,
    expectedEdgeCount: expectedEdges.length,
    actualEdgeCount: uniqueActualEdges.length,
    missingNodes,
    unexpectedNodes,
    missingEdges,
    unexpectedEdges,
  }
}

export async function verifyMigration({ root, run, target, publicRoot = null }) {
  const targetRoot = target === "stage" ? path.join(run, "stage") : root
  const plan = await readJson(path.join(run, "plan.json"))
  const baseline = await readJson(path.join(run, "baseline.json"))
  const expected = await readJson(path.join(run, "after.manifest.json"))
  const recordFailures = await verifyRecords(targetRoot, expected.records)
  const inventory = await buildInventory({ root: targetRoot, publicRoot })
  const structuralFailures = []

  for (const move of MOVE_RULES) {
    if (await exists(path.join(targetRoot, "content", move.from))) {
      structuralFailures.push({ kind: "old-root-remains", path: `content/${move.from}` })
    }
    if (!(await exists(path.join(targetRoot, "content", move.to)))) {
      structuralFailures.push({ kind: "new-root-missing", path: `content/${move.to}` })
    }
  }
  for (const required of ["content/brain/notes/index.md", "content/brain/knowledge/index.md"]) {
    if (!(await exists(path.join(targetRoot, required)))) {
      structuralFailures.push({ kind: "index-missing", path: required })
    }
  }
  if (inventory.content.brainMarkdownCount !== baseline.content.brainMarkdownCount + 2) {
    structuralFailures.push({
      kind: "brain-markdown-count",
      expected: baseline.content.brainMarkdownCount + 2,
      actual: inventory.content.brainMarkdownCount,
    })
  }
  if (inventory.content.brainUnderscoreIndexCount !== 0) {
    structuralFailures.push({
      kind: "underscore-index-remains",
      actual: inventory.content.brainUnderscoreIndexCount,
    })
  }
  if (inventory.links.rewriteCount !== 0) {
    structuralFailures.push({
      kind: "old-route-reference-remains",
      actual: inventory.links.rewriteCount,
    })
  }
  if (inventory.externalOldRouteReferences.unexpectedCount !== 0) {
    structuralFailures.push({
      kind: "external-old-route-reference",
      references: inventory.externalOldRouteReferences.unexpected,
    })
  }
  const baselineAllowedExternalRoutes = baseline.externalOldRouteReferences.allowed
    .map(externalReferenceIdentity)
    .sort()
  const actualAllowedExternalRoutes = inventory.externalOldRouteReferences.allowed
    .map(externalReferenceIdentity)
    .sort()
  const missingAllowedExternalRoutes = difference(
    baselineAllowedExternalRoutes,
    actualAllowedExternalRoutes,
  )
  const unexpectedAllowedExternalRoutes = difference(
    actualAllowedExternalRoutes,
    baselineAllowedExternalRoutes,
  )
  if (missingAllowedExternalRoutes.length > 0 || unexpectedAllowedExternalRoutes.length > 0) {
    structuralFailures.push({
      kind: "external-old-route-allowlist-drift",
      missing: missingAllowedExternalRoutes,
      unexpected: unexpectedAllowedExternalRoutes,
    })
  }
  if (inventory.content.duplicateRoutes.length !== 0) {
    structuralFailures.push({ kind: "duplicate-route", routes: inventory.content.duplicateRoutes })
  }
  if (inventory.images.treeSha256 !== baseline.images.treeSha256) {
    structuralFailures.push({
      kind: "image-tree-drift",
      expected: baseline.images.treeSha256,
      actual: inventory.images.treeSha256,
    })
  }

  let aliasesOrRedirectsCreated = null
  if (!baseline.public || !inventory.public) {
    structuralFailures.push({ kind: "redirect-evidence-missing" })
  } else {
    aliasesOrRedirectsCreated = Math.max(
      0,
      inventory.public.redirectPageCount - baseline.public.redirectPageCount,
    )
    if (aliasesOrRedirectsCreated !== 0) {
      structuralFailures.push({
        kind: "aliases-or-redirects-created",
        baseline: baseline.public.redirectPages,
        actual: inventory.public.redirectPages,
      })
    }
  }

  const graph = await verifyGraph(run, publicRoot)
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    target,
    status:
      recordFailures.length === 0 && structuralFailures.length === 0 && graph.status === "pass"
        ? "pass"
        : "fail",
    planSha256: sha256(JSON.stringify(plan)),
    expectedManifestSha256: expected.manifestSha256,
    recordFailures,
    structuralFailures,
    graph,
    observations: {
      brainMarkdownCount: inventory.content.brainMarkdownCount,
      underscoreIndexCount: inventory.content.brainUnderscoreIndexCount,
      remainingOldRouteReferences: inventory.links.rewriteCount,
      unexpectedExternalOldRouteReferences: inventory.externalOldRouteReferences.unexpectedCount,
      allowlistedExternalOldRouteReferences: inventory.externalOldRouteReferences.allowedCount,
      imageTreeSha256: inventory.images.treeSha256,
      aliasesOrRedirectsCreated,
    },
  }
  const output = path.join(run, `verify-${target}.json`)
  await mkdir(path.dirname(output), { recursive: true })
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`)
  if (report.status !== "pass") throw new Error(`verification failed: ${JSON.stringify(report)}`)
  return report
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const root = path.resolve(args.root || process.cwd())
  if (!args.run) throw new Error("--run is required")
  const run = path.resolve(root, args.run)
  const allowedRoot = process.env.BRAIN_MIGRATION_ARTIFACT_ROOT
    ? path.resolve(process.env.BRAIN_MIGRATION_ARTIFACT_ROOT)
    : path.resolve(root, ".omx/artifacts/brain-restructure")
  if (run !== allowedRoot && !run.startsWith(`${allowedRoot}${path.sep}`))
    throw new Error("--run is outside artifact root")
  const target = args.target || "stage"
  if (!["stage", "worktree"].includes(target)) throw new Error("--target must be stage or worktree")
  const publicRoot = args.public ? path.resolve(root, args.public) : null
  const report = await verifyMigration({ root, run, target, publicRoot })
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  main().catch((error) => {
    console.error(error.stack || error.message)
    process.exitCode = 1
  })
