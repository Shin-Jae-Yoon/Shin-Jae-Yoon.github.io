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
import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { buildInventory } from "./inventory.mjs"
import {
  MOVE_RULES,
  ROUTE_LOCK_FILES,
  contentPathToSlug,
  fileRecord,
  manifestForPaths,
  mapContentRelative,
  parseArgs,
  rewriteRouteLockSource,
  scanExternalOldRouteReferences,
  sha256,
  toPosix,
  transformLinks,
  walkFiles,
} from "./lib.mjs"

const INDEX_FILES = [
  {
    path: "content/brain/notes/index.md",
    content: '---\ntitle: "메모"\n---\n\n강의와 도서 밖에서 그때그때 적어둔 기록입니다.\n',
  },
  {
    path: "content/brain/knowledge/index.md",
    content:
      '---\ntitle: "지식"\n---\n\n강의·도서·메모에서 뽑아낸 개념을 원자 단위로 정리하고 서로 연결한 공간입니다.\n',
  },
]

function manifestHash(records) {
  return sha256(JSON.stringify(records))
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

async function writeJson(absolute, value) {
  await mkdir(path.dirname(absolute), { recursive: true })
  await writeFile(absolute, `${JSON.stringify(value, null, 2)}\n`)
}

async function readJson(absolute) {
  return JSON.parse(await readFile(absolute, "utf8"))
}

function resolveRun(root, value) {
  if (!value) throw new Error("--run is required")
  const run = path.resolve(root, value)
  const allowedRoot = process.env.BRAIN_MIGRATION_ARTIFACT_ROOT
    ? path.resolve(process.env.BRAIN_MIGRATION_ARTIFACT_ROOT)
    : path.resolve(root, ".omx/artifacts/brain-restructure")
  if (run !== allowedRoot && !run.startsWith(`${allowedRoot}${path.sep}`)) {
    throw new Error(`run directory must be inside ${allowedRoot}`)
  }
  return run
}

async function assertManifest(root, records, label) {
  const failures = []
  for (const expected of records) {
    const absolute = path.join(root, expected.path)
    if (!(await exists(absolute))) {
      failures.push({ path: expected.path, reason: "missing" })
      continue
    }
    const actual = await fileRecord(absolute, root)
    if (
      actual.sha256 !== expected.sha256 ||
      actual.size !== expected.size ||
      actual.mode !== expected.mode
    ) {
      failures.push({ path: expected.path, reason: "hash-or-metadata-drift", expected, actual })
    }
  }
  if (failures.length > 0)
    throw new Error(`${label} manifest mismatch: ${JSON.stringify(failures)}`)
}

function setDifference(left, right) {
  const rightSet = new Set(right)
  return left.filter((entry) => !rightSet.has(entry))
}

async function currentApplyShape(root) {
  const contentRoot = path.join(root, "content")
  const movedPaths = []
  for (const rule of MOVE_RULES) {
    const source = path.join(contentRoot, rule.from)
    if (!(await exists(source))) throw new Error(`missing source directory: content/${rule.from}`)
    movedPaths.push(
      ...(await walkFiles(source)).map((absolute) => toPosix(path.relative(root, absolute))),
    )
  }
  const editPaths = []
  const markdownFiles = await walkFiles(contentRoot, (absolute) => absolute.endsWith(".md"))
  for (const absolute of markdownFiles) {
    const relative = toPosix(path.relative(root, absolute))
    const raw = await readFile(absolute, "utf8")
    if (transformLinks(raw, relative).content !== raw) editPaths.push(relative)
  }
  const routeLockEditPaths = []
  for (const relative of ROUTE_LOCK_FILES) {
    const absolute = path.join(root, relative)
    if (!(await exists(absolute))) continue
    const raw = await readFile(absolute, "utf8")
    if (rewriteRouteLockSource(raw).content !== raw) routeLockEditPaths.push(relative)
  }
  const externalOldRouteReferences = await scanExternalOldRouteReferences(root)
  return {
    movedPaths: movedPaths.sort(),
    editPaths: editPaths.sort(),
    routeLockEditPaths: routeLockEditPaths.sort(),
    externalOldRouteReferencesSha256: sha256(
      JSON.stringify(externalOldRouteReferences.occurrences),
    ),
  }
}

async function assertPlanShape(root, plan, label) {
  const current = await currentApplyShape(root)
  const expectedMoved = [...(plan.movedPaths ?? [])].sort()
  const expectedEdits = plan.edits.map((entry) => entry.path).sort()
  const expectedRouteLocks = (plan.routeLockEdits ?? []).map((entry) => entry.path).sort()
  const targetRootsUnexpected = []
  for (const move of plan.moves) {
    if (await exists(path.join(root, move.target))) targetRootsUnexpected.push(move.target)
  }
  const indexPathsUnexpected = []
  for (const entry of plan.indexes) {
    if (await exists(path.join(root, entry.path))) indexPathsUnexpected.push(entry.path)
  }
  const failures = {
    movedMissing: setDifference(expectedMoved, current.movedPaths),
    movedUnexpected: setDifference(current.movedPaths, expectedMoved),
    editsMissing: setDifference(expectedEdits, current.editPaths),
    editsUnexpected: setDifference(current.editPaths, expectedEdits),
    routeLocksMissing: setDifference(expectedRouteLocks, current.routeLockEditPaths),
    routeLocksUnexpected: setDifference(current.routeLockEditPaths, expectedRouteLocks),
    externalOldRouteReferencesDrift:
      current.externalOldRouteReferencesSha256 === plan.externalOldRouteReferencesSha256
        ? []
        : [
            {
              expected: plan.externalOldRouteReferencesSha256,
              actual: current.externalOldRouteReferencesSha256,
            },
          ],
    targetRootsUnexpected,
    indexPathsUnexpected,
  }
  if (Object.values(failures).some((entries) => entries.length > 0)) {
    throw new Error(`${label}: worktree drifted since plan (${JSON.stringify(failures)})`)
  }
}

async function appendJournal(handle, entry) {
  await handle.write(`${JSON.stringify(entry)}\n`)
  await handle.sync()
}

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
  while (cursor && cursor !== "." && !(await exists(path.join(root, cursor)))) {
    missing.push(cursor)
    cursor = toPosix(path.dirname(cursor))
  }
  for (const directory of missing.reverse()) {
    await runJournaledMutation(
      state,
      { operation: "created", entryType: "directory", path: directory },
      () => mkdir(path.join(root, directory)),
    )
  }
}

async function collectPlan(root, publicRoot) {
  const contentRoot = path.join(root, "content")
  const movedFiles = []
  for (const rule of MOVE_RULES) {
    const source = path.join(contentRoot, rule.from)
    const target = path.join(contentRoot, rule.to)
    if (!(await exists(source))) throw new Error(`missing source directory: content/${rule.from}`)
    if (await exists(target)) throw new Error(`target already exists: content/${rule.to}`)
    movedFiles.push(...(await walkFiles(source)))
  }

  const allMarkdown = await walkFiles(contentRoot, (absolute) => absolute.endsWith(".md"))
  const edits = []
  const linkLedger = []
  for (const absolute of allMarkdown) {
    const sourcePath = toPosix(path.relative(root, absolute))
    const raw = await readFile(absolute, "utf8")
    const transformed = transformLinks(raw, sourcePath)
    linkLedger.push(...transformed.ledger)
    if (transformed.content !== raw) {
      edits.push({
        path: sourcePath,
        beforeSha256: sha256(raw),
        afterSha256: sha256(transformed.content),
        rewriteCount: transformed.ledger.filter((entry) => entry.classification === "rewrite")
          .length,
      })
    }
  }

  const movedPaths = movedFiles.map((absolute) => toPosix(path.relative(root, absolute)))
  const movedSet = new Set(movedPaths)
  const externalEditPaths = edits.map((entry) => entry.path).filter((entry) => !movedSet.has(entry))
  const routeLockEdits = []
  for (const relative of ROUTE_LOCK_FILES) {
    const absolute = path.join(root, relative)
    if (!(await exists(absolute))) continue
    const raw = await readFile(absolute, "utf8")
    const transformed = rewriteRouteLockSource(raw)
    if (transformed.content === raw) continue
    routeLockEdits.push({
      path: relative,
      beforeSha256: sha256(raw),
      afterSha256: sha256(transformed.content),
      rewriteCount: transformed.rewriteCount,
    })
  }
  const routeLockPaths = routeLockEdits.map((entry) => entry.path)
  const beforePaths = [...new Set([...movedPaths, ...externalEditPaths, ...routeLockPaths])].sort()
  const beforeManifest = await manifestForPaths(root, beforePaths)
  const movedMarkdown = movedPaths.filter((entry) => entry.endsWith(".md"))
  const routeMap = movedMarkdown.map((sourcePath) => {
    const contentRelative = sourcePath.replace(/^content\//, "")
    const targetRelative = mapContentRelative(contentRelative)
    return {
      sourcePath,
      targetPath: `content/${targetRelative}`,
      oldSlug: contentPathToSlug(contentRelative),
      newSlug: contentPathToSlug(targetRelative),
    }
  })
  const targetPaths = [
    ...movedPaths.map((sourcePath) => `content/${mapContentRelative(sourcePath)}`),
    ...externalEditPaths,
    ...routeLockPaths,
    ...INDEX_FILES.map((entry) => entry.path),
  ]
  if (targetPaths.length !== new Set(targetPaths).size)
    throw new Error("target path collision in plan")
  const inventory = await buildInventory({ root, publicRoot })
  const routeLockPathSet = new Set(routeLockPaths)
  const unplannedExternalOldRouteReferences =
    inventory.externalOldRouteReferences.unexpected.filter(
      (entry) => !routeLockPathSet.has(entry.path),
    )

  return {
    inventory,
    beforeManifest,
    routeMap,
    linkLedger,
    plan: {
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      decisions: {
        preserveOldUrls: false,
        createAliasesOrRedirects: false,
        tistoryMigration: "separate-native-markdown-phase",
        structuralTags: "knowledge-only",
        graphProjection: "knowledge-to-knowledge-only",
      },
      moves: MOVE_RULES.map((rule) => ({
        source: `content/${rule.from}`,
        target: `content/${rule.to}`,
      })),
      edits,
      routeLockEdits,
      indexes: INDEX_FILES.map((entry) => ({ path: entry.path, sha256: sha256(entry.content) })),
      movedFileCount: movedPaths.length,
      movedMarkdownCount: movedMarkdown.length,
      movedPaths: movedPaths.sort(),
      externalEditPaths: externalEditPaths.sort(),
      externalEditCount: externalEditPaths.length,
      routeLockEditCount: routeLockEdits.length,
      routeLockRewriteCount: routeLockEdits.reduce((sum, entry) => sum + entry.rewriteCount, 0),
      externalOldRouteReferencesSha256: sha256(
        JSON.stringify(inventory.externalOldRouteReferences.occurrences),
      ),
      allowlistedExternalOldRouteCount: inventory.externalOldRouteReferences.allowedCount,
      unexpectedExternalOldRouteCount: inventory.externalOldRouteReferences.unexpectedCount,
      unplannedExternalOldRouteCount: unplannedExternalOldRouteReferences.length,
      rewriteCount: linkLedger.filter((entry) => entry.classification === "rewrite").length,
      unclassifiedCount: linkLedger.filter((entry) => entry.classification === "unclassified")
        .length,
      beforeManifestSha256: manifestHash(beforeManifest),
      beforePaths,
      targetPaths: [...new Set(targetPaths)].sort(),
    },
  }
}

async function snapshotBefore(root, run, records) {
  const snapshotRoot = path.join(run, "before")
  await rm(snapshotRoot, { recursive: true, force: true })
  for (const record of records) {
    const source = path.join(root, record.path)
    const target = path.join(snapshotRoot, record.path)
    await mkdir(path.dirname(target), { recursive: true })
    await cp(source, target, { preserveTimestamps: true })
  }
}

function renderPlanMarkdown(plan, routeMap) {
  const representatives = plan.moves
    .map((move) => routeMap.find((route) => route.sourcePath.startsWith(`${move.source}/`)))
    .filter(Boolean)
  return [
    "# Brain Phase 1 exact migration plan",
    "",
    `- Previous URL preservation: **disabled**`,
    `- Directory moves: ${plan.moves.length}`,
    `- Moved files: ${plan.movedFileCount}`,
    `- Moved Markdown: ${plan.movedMarkdownCount}`,
    `- Link destination rewrites: ${plan.rewriteCount}`,
    `- External edited Markdown: ${plan.externalEditCount}`,
    `- External route-lock files: ${plan.routeLockEditCount}`,
    `- External route-lock rewrites: ${plan.routeLockRewriteCount}`,
    `- Allowlisted historical route references: ${plan.allowlistedExternalOldRouteCount}`,
    `- Unplanned external old-route references: ${plan.unplannedExternalOldRouteCount}`,
    `- Aliases/redirects created: 0`,
    "",
    "## Directory moves",
    "",
    ...plan.moves.map((entry) => `- \`${entry.source}\` → \`${entry.target}\``),
    "",
    "## Representative routes",
    "",
    ...representatives.map((entry) => {
      const oldUrl = entry.oldSlug.replace(/\/index$/i, "")
      const newUrl = entry.newSlug.replace(/\/index$/i, "")
      return `- \`/${oldUrl}\` → \`/${newUrl}\``
    }),
    "",
  ].join("\n")
}

export async function planMigration({ root, run, publicRoot }) {
  await mkdir(run, { recursive: true })
  const collected = await collectPlan(root, publicRoot)
  await snapshotBefore(root, run, collected.beforeManifest)
  await writeJson(path.join(run, "baseline.json"), collected.inventory)
  await writeJson(path.join(run, "before.manifest.json"), {
    schemaVersion: 1,
    manifestSha256: manifestHash(collected.beforeManifest),
    records: collected.beforeManifest,
  })
  await writeJson(path.join(run, "route-map.json"), {
    schemaVersion: 1,
    preserveOldUrls: false,
    routeCount: collected.routeMap.length,
    routes: collected.routeMap,
  })
  await writeJson(path.join(run, "link-ledger.json"), {
    schemaVersion: 1,
    occurrenceCount: collected.linkLedger.length,
    rewriteCount: collected.plan.rewriteCount,
    unclassifiedCount: collected.plan.unclassifiedCount,
    occurrences: collected.linkLedger,
  })
  await writeJson(
    path.join(run, "existing-broken.json"),
    collected.inventory.graph?.unresolvedEdges ?? [],
  )
  await writeJson(path.join(run, "decisions.json"), collected.plan.decisions)
  await writeJson(path.join(run, "plan.json"), collected.plan)
  await writeFile(path.join(run, "plan.md"), renderPlanMarkdown(collected.plan, collected.routeMap))
  if (collected.plan.unclassifiedCount > 0) {
    throw new Error(
      `plan contains ${collected.plan.unclassifiedCount} unclassified link candidates`,
    )
  }
  if (collected.plan.unplannedExternalOldRouteCount > 0) {
    throw new Error(
      `plan contains ${collected.plan.unplannedExternalOldRouteCount} unplanned external old-route references`,
    )
  }
  return collected.plan
}

async function transformTree(root) {
  const contentRoot = path.join(root, "content")
  const markdownFiles = await walkFiles(contentRoot, (absolute) => absolute.endsWith(".md"))
  let rewriteCount = 0
  for (const absolute of markdownFiles) {
    const raw = await readFile(absolute, "utf8")
    const transformed = transformLinks(raw, toPosix(path.relative(root, absolute)))
    if (transformed.content !== raw) await writeFile(absolute, transformed.content)
    rewriteCount += transformed.ledger.filter((entry) => entry.classification === "rewrite").length
  }
  return rewriteCount
}

async function transformRouteLocks(root, plan) {
  let rewriteCount = 0
  for (const edit of plan.routeLockEdits ?? []) {
    const absolute = path.join(root, edit.path)
    const raw = await readFile(absolute, "utf8")
    const transformed = rewriteRouteLockSource(raw)
    if (sha256(raw) !== edit.beforeSha256 || sha256(transformed.content) !== edit.afterSha256) {
      throw new Error(`route-lock edit drifted: ${edit.path}`)
    }
    await writeFile(absolute, transformed.content)
    rewriteCount += transformed.rewriteCount
  }
  return rewriteCount
}

async function moveDirectories(root) {
  const contentRoot = path.join(root, "content")
  for (const rule of MOVE_RULES) {
    const source = path.join(contentRoot, rule.from)
    const target = path.join(contentRoot, rule.to)
    await mkdir(path.dirname(target), { recursive: true })
    await rename(source, target)
  }
}

async function createIndexes(root) {
  for (const entry of INDEX_FILES) {
    const absolute = path.join(root, entry.path)
    await mkdir(path.dirname(absolute), { recursive: true })
    await writeFile(absolute, entry.content)
  }
}

async function buildAfterManifest(stageRoot, plan) {
  return manifestForPaths(stageRoot, plan.targetPaths)
}

export async function stageMigration({ root, run }) {
  const plan = await readJson(path.join(run, "plan.json"))
  const before = await readJson(path.join(run, "before.manifest.json"))
  if (plan.unclassifiedCount > 0) {
    throw new Error(`stage aborted: plan has ${plan.unclassifiedCount} unclassified links`)
  }
  if (plan.unplannedExternalOldRouteCount > 0) {
    throw new Error(
      `stage aborted: plan has ${plan.unplannedExternalOldRouteCount} unplanned external old-route references`,
    )
  }
  await assertManifest(root, before.records, "stage precondition")
  await assertPlanShape(root, plan, "stage aborted")
  if (manifestHash(before.records) !== plan.beforeManifestSha256) {
    throw new Error("plan/before manifest hash mismatch")
  }

  const stageRoot = path.join(run, "stage")
  await rm(stageRoot, { recursive: true, force: true })
  await mkdir(stageRoot, { recursive: true })
  await cp(path.join(root, "content"), path.join(stageRoot, "content"), { recursive: true })
  if (await exists(path.join(root, "tooling"))) {
    await cp(path.join(root, "tooling"), path.join(stageRoot, "tooling"), { recursive: true })
  }
  const rewriteCount = await transformTree(stageRoot)
  const routeLockRewriteCount = await transformRouteLocks(stageRoot, plan)
  await moveDirectories(stageRoot)
  await createIndexes(stageRoot)
  const afterManifest = await buildAfterManifest(stageRoot, plan)
  const stageInventory = await buildInventory({ root: stageRoot })
  const remainingRewrites = stageInventory.links.rewriteCount
  if (remainingRewrites !== 0)
    throw new Error(`stage is not idempotent: ${remainingRewrites} rewrites remain`)
  const after = {
    schemaVersion: 1,
    manifestSha256: manifestHash(afterManifest),
    records: afterManifest,
  }
  await writeJson(path.join(run, "after.manifest.json"), after)
  await writeJson(path.join(run, "stage-inventory.json"), stageInventory)
  await writeJson(path.join(run, "stage-summary.json"), {
    schemaVersion: 1,
    status: "pass",
    rewriteCount,
    routeLockRewriteCount,
    remainingRewrites,
    stageContent: toPosix(path.relative(root, path.join(stageRoot, "content"))),
    afterManifestSha256: after.manifestSha256,
  })
  return { stageRoot, after, stageInventory }
}

export async function applyMigration({
  root,
  run,
  faultAfterOperations = null,
  faultAfterIntentOperations = null,
  faultAfterMutationOperations = null,
}) {
  const plan = await readJson(path.join(run, "plan.json"))
  const before = await readJson(path.join(run, "before.manifest.json"))
  const expectedAfter = await readJson(path.join(run, "after.manifest.json"))
  if (plan.unclassifiedCount > 0) {
    throw new Error(`apply aborted: plan has ${plan.unclassifiedCount} unclassified links`)
  }
  if (plan.unplannedExternalOldRouteCount > 0) {
    throw new Error(
      `apply aborted: plan has ${plan.unplannedExternalOldRouteCount} unplanned external old-route references`,
    )
  }
  await assertManifest(root, before.records, "apply precondition")
  await assertPlanShape(root, plan, "apply aborted")
  if (manifestHash(before.records) !== plan.beforeManifestSha256) {
    throw new Error("apply aborted: baseline drift")
  }

  const journalPath = path.join(run, "journal.jsonl")
  await mkdir(path.dirname(journalPath), { recursive: true })
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
  try {
    for (const edit of plan.edits) {
      const absolute = path.join(root, edit.path)
      const raw = await readFile(absolute, "utf8")
      const transformed = transformLinks(raw, edit.path)
      if (sha256(raw) !== edit.beforeSha256 || sha256(transformed.content) !== edit.afterSha256) {
        throw new Error(`apply aborted: planned edit drifted (${edit.path})`)
      }
      await runJournaledMutation(
        state,
        {
          operation: "modified",
          path: edit.path,
          beforeSha256: edit.beforeSha256,
          postSha256: edit.afterSha256,
        },
        () => writeFile(absolute, transformed.content),
      )
    }
    for (const edit of plan.routeLockEdits ?? []) {
      const absolute = path.join(root, edit.path)
      const raw = await readFile(absolute, "utf8")
      const transformed = rewriteRouteLockSource(raw)
      if (sha256(raw) !== edit.beforeSha256 || sha256(transformed.content) !== edit.afterSha256) {
        throw new Error(`apply aborted: planned route lock drifted (${edit.path})`)
      }
      await runJournaledMutation(
        state,
        {
          operation: "modified",
          path: edit.path,
          beforeSha256: edit.beforeSha256,
          postSha256: edit.afterSha256,
        },
        () => writeFile(absolute, transformed.content),
      )
    }
    for (const rule of MOVE_RULES) {
      const source = `content/${rule.from}`
      const target = `content/${rule.to}`
      await ensureDirectoryWithJournal(root, toPosix(path.dirname(target)), state)
      await runJournaledMutation(state, { operation: "renamed", source, target }, () =>
        rename(path.join(root, source), path.join(root, target)),
      )
    }
    for (const entry of INDEX_FILES) {
      const absolute = path.join(root, entry.path)
      await ensureDirectoryWithJournal(root, toPosix(path.dirname(entry.path)), state)
      if (await exists(absolute))
        throw new Error(`apply created path already exists: ${entry.path}`)
      await runJournaledMutation(
        state,
        {
          operation: "created",
          entryType: "file",
          path: entry.path,
          postSha256: sha256(entry.content),
        },
        () => writeFile(absolute, entry.content),
      )
    }
    await assertManifest(root, expectedAfter.records, "apply result")
    await appendJournal(handle, { state: "apply-completed", operationCount: state.operationCount })
    return { status: "pass", operationCount: state.operationCount }
  } finally {
    await handle.close()
  }
}

function parseJournal(source) {
  const operations = new Map()
  const rollbackCompleted = new Set()
  let legacyId = 0
  for (const record of source.trim().split("\n").filter(Boolean).map(JSON.parse)) {
    if (record.state === "intent") operations.set(record.id, record)
    else if (record.state === "rollback-completed") rollbackCompleted.add(record.id)
    else if (record.operation) {
      legacyId += 1
      operations.set(`legacy-${legacyId}`, { id: `legacy-${legacyId}`, ...record })
    }
  }
  return { operations: [...operations.values()], rollbackCompleted }
}

async function mutationState(root, entry) {
  if (entry.operation === "modified") {
    const absolute = path.join(root, entry.path)
    if (!(await exists(absolute))) throw new Error(`rollback drift: missing ${entry.path}`)
    const current = await fileRecord(absolute, root)
    if (current.sha256 === entry.postSha256) return "applied"
    if (current.sha256 === entry.beforeSha256) return "restored"
    throw new Error(`rollback drift: ${entry.path}`)
  }
  if (entry.operation === "renamed") {
    const sourceExists = await exists(path.join(root, entry.source))
    const targetExists = await exists(path.join(root, entry.target))
    if (!sourceExists && targetExists) return "applied"
    if (sourceExists && !targetExists) return "restored"
    throw new Error(`rollback rename drift: ${entry.source} -> ${entry.target}`)
  }
  if (entry.operation === "created") {
    const absolute = path.join(root, entry.path)
    if (!(await exists(absolute))) return "restored"
    if (entry.entryType === "directory") return "applied"
    const current = await fileRecord(absolute, root)
    if (current.sha256 !== entry.postSha256) throw new Error(`rollback drift: ${entry.path}`)
    return "applied"
  }
  throw new Error(`unknown journal operation: ${entry.operation}`)
}

export async function rollbackMigration({ root, run }) {
  const before = await readJson(path.join(run, "before.manifest.json"))
  const journalPath = path.join(run, "journal.jsonl")
  const { operations, rollbackCompleted } = parseJournal(await readFile(journalPath, "utf8"))
  const handle = await open(journalPath, "a")
  try {
    for (const entry of [...operations].reverse()) {
      if (rollbackCompleted.has(entry.id)) continue
      const state = await mutationState(root, entry)
      if (state === "restored") {
        await appendJournal(handle, { id: entry.id, state: "rollback-completed", action: "noop" })
        continue
      }
      if (entry.operation === "created") {
        const absolute = path.join(root, entry.path)
        if (entry.entryType === "directory") await rmdir(absolute)
        else await unlink(absolute)
      } else if (entry.operation === "renamed") {
        await rename(path.join(root, entry.target), path.join(root, entry.source))
      } else if (entry.operation === "modified") {
        const absolute = path.join(root, entry.path)
        const snapshot = path.join(run, "before", entry.path)
        const snapshotRecord = await fileRecord(snapshot, path.join(run, "before"))
        if (snapshotRecord.sha256 !== entry.beforeSha256) {
          throw new Error(`rollback snapshot drift: ${entry.path}`)
        }
        const temporary = `${absolute}.brain-rollback-${entry.id}`
        await rm(temporary, { force: true })
        await cp(snapshot, temporary, { preserveTimestamps: true })
        await rename(temporary, absolute)
      }
      await appendJournal(handle, { id: entry.id, state: "rollback-completed", action: "restored" })
    }
  } finally {
    await handle.close()
  }
  await assertManifest(root, before.records, "rollback result")
  for (const entry of operations.filter((candidate) => candidate.operation === "created")) {
    if (await exists(path.join(root, entry.path))) {
      throw new Error(`rollback created path remains: ${entry.path}`)
    }
  }
  const report = { status: "pass", restoredManifestSha256: manifestHash(before.records) }
  await writeJson(path.join(run, "rollback-report.json"), report)
  return report
}

async function contentTreeEvidence(root) {
  const contentRoot = path.join(root, "content")
  const paths = (await walkFiles(contentRoot)).map((absolute) =>
    toPosix(path.relative(root, absolute)),
  )
  const records = await manifestForPaths(root, paths)
  return { fileCount: records.length, manifestSha256: manifestHash(records) }
}

export async function drillMigration({ root, run }) {
  const drillRoot = path.join(run, "rollback-drill/root")
  const drillRun = path.join(drillRoot, ".omx/artifacts/brain-restructure/drill")
  const worktreeBefore = await contentTreeEvidence(root)
  const before = await readJson(path.join(run, "before.manifest.json"))
  const worktreeTouchedBefore = {
    recordCount: before.records.length,
    manifestSha256: manifestHash(
      await manifestForPaths(
        root,
        before.records.map((entry) => entry.path),
      ),
    ),
  }
  await rm(path.join(run, "rollback-drill"), { recursive: true, force: true })
  await mkdir(drillRun, { recursive: true })
  await cp(path.join(root, "content"), path.join(drillRoot, "content"), { recursive: true })
  if (await exists(path.join(root, "tooling"))) {
    await cp(path.join(root, "tooling"), path.join(drillRoot, "tooling"), { recursive: true })
  }
  for (const name of ["plan.json", "before.manifest.json", "after.manifest.json"]) {
    await cp(path.join(run, name), path.join(drillRun, name))
  }
  await cp(path.join(run, "before"), path.join(drillRun, "before"), { recursive: true })

  const apply = await applyMigration({ root: drillRoot, run: drillRun })
  const rollback = await rollbackMigration({ root: drillRoot, run: drillRun })
  const drillInventory = await buildInventory({ root: drillRoot })
  const baseline = await readJson(path.join(run, "baseline.json"))
  const worktreeAfter = await contentTreeEvidence(root)
  const worktreeTouchedAfter = {
    recordCount: before.records.length,
    manifestSha256: manifestHash(
      await manifestForPaths(
        root,
        before.records.map((entry) => entry.path),
      ),
    ),
  }
  const worktreeContentMutated =
    worktreeBefore.fileCount !== worktreeAfter.fileCount ||
    worktreeBefore.manifestSha256 !== worktreeAfter.manifestSha256 ||
    worktreeTouchedBefore.manifestSha256 !== worktreeTouchedAfter.manifestSha256
  const rollbackRouteCollisionCount = drillInventory.content.duplicateRoutes.length
  const baselineRouteCollisionCount = baseline.content.duplicateRoutes.length
  const report = {
    schemaVersion: 2,
    status:
      !worktreeContentMutated && rollbackRouteCollisionCount === baselineRouteCollisionCount
        ? "pass"
        : "fail",
    apply,
    rollback,
    destructiveScope: toPosix(path.relative(root, drillRoot)),
    worktreeContentMutated,
    worktreeBefore,
    worktreeAfter,
    worktreeTouchedBefore,
    worktreeTouchedAfter,
    baselineRouteCollisionCount,
    rollbackRouteCollisionCount,
  }
  await writeJson(path.join(run, "rollback-drill.json"), report)
  if (report.status !== "pass") throw new Error(`rollback drill failed: ${JSON.stringify(report)}`)
  await rm(path.join(run, "rollback-drill"), { recursive: true, force: true })
  return report
}

async function runProcess(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options)
    const stdout = []
    const stderr = []
    child.stdout.on("data", (chunk) => stdout.push(chunk))
    child.stderr.on("data", (chunk) => stderr.push(chunk))
    child.on("error", reject)
    child.on("close", (code) =>
      resolve({
        code,
        stdout: Buffer.concat(stdout).toString(),
        stderr: Buffer.concat(stderr).toString(),
      }),
    )
  })
}

export async function buildMigrationSite({ root, run, target }) {
  if (!["baseline", "stage", "worktree"].includes(target)) {
    throw new Error("build target must be baseline, stage, or worktree")
  }
  const targetRoot = target === "stage" ? path.join(run, "stage") : root
  if (!(await exists(path.join(targetRoot, "content")))) {
    throw new Error(`build source is missing for target ${target}`)
  }
  const outputName = target === "worktree" ? "after-public" : `${target}-public`
  const outputRoot = path.join(run, outputName)
  const logPath = path.join(run, `${target}-build.log`)
  await rm(outputRoot, { recursive: true, force: true })
  const args = [
    path.join(root, "quartz/bootstrap-cli.mjs"),
    "build",
    "-d",
    toPosix(path.relative(root, path.join(targetRoot, "content"))),
    "-o",
    toPosix(path.relative(root, outputRoot)),
  ]
  const result = await runProcess(process.execPath, args, {
    cwd: root,
    env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
    stdio: ["ignore", "pipe", "pipe"],
  })
  const commandText = [process.execPath, ...args].join(" ")
  await writeFile(
    logPath,
    [`$ ${commandText}`, "", result.stdout, result.stderr].filter(Boolean).join("\n"),
  )
  const inventory =
    result.code === 0 ? await buildInventory({ root: targetRoot, publicRoot: outputRoot }) : null
  const warnings = `${result.stdout}\n${result.stderr}`
    .split("\n")
    .filter((line) => /warn|direct eval|latex/i.test(line))
  const record = {
    input: toPosix(path.relative(root, path.join(targetRoot, "content"))),
    output: toPosix(path.relative(root, outputRoot)),
    command: commandText,
    exitCode: result.code,
    inputMarkdownCount: inventory?.content.markdownCount ?? null,
    emittedFileCount: inventory?.public?.emittedFileCount ?? null,
    duplicateRouteCount: inventory?.content.duplicateRoutes.length ?? null,
    redirectPageCount: inventory?.public?.redirectPageCount ?? null,
    warnings,
    status: result.code === 0 && inventory?.content.duplicateRoutes.length === 0 ? "pass" : "fail",
    log: toPosix(path.relative(root, logPath)),
  }
  const evidencePath = path.join(run, "build-evidence.json")
  const evidence =
    target !== "baseline" && (await exists(evidencePath))
      ? await readJson(evidencePath)
      : { schemaVersion: 2, builds: {} }
  evidence.schemaVersion = 2
  evidence.builds = { ...(evidence.builds ?? {}), [target]: record }
  evidence[target] = record
  evidence.status = Object.values(evidence.builds).every((entry) => entry.status === "pass")
    ? "pass"
    : "fail"
  await writeJson(evidencePath, evidence)
  if (record.status !== "pass") throw new Error(`Quartz build failed: ${JSON.stringify(record)}`)
  return record
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const command = args._[0]
  const root = path.resolve(args.root || process.cwd())
  const run = resolveRun(root, args.run)
  const publicRoot = args.public ? path.resolve(root, args.public) : path.join(root, "public")
  let result
  if (command === "plan") result = await planMigration({ root, run, publicRoot })
  else if (command === "stage") result = await stageMigration({ root, run })
  else if (command === "apply") result = await applyMigration({ root, run })
  else if (command === "rollback") result = await rollbackMigration({ root, run })
  else if (command === "drill") result = await drillMigration({ root, run })
  else if (command === "build") {
    result = await buildMigrationSite({ root, run, target: args.target || "stage" })
  } else throw new Error("command must be plan, stage, build, apply, rollback, or drill")
  const output =
    command === "plan"
      ? {
          status: "planned",
          moves: result.moves.length,
          movedFiles: result.movedFileCount,
          movedMarkdown: result.movedMarkdownCount,
          rewrites: result.rewriteCount,
          externalEdits: result.externalEditCount,
          routeLockFiles: result.routeLockEditCount,
          routeLockRewrites: result.routeLockRewriteCount,
          unclassified: result.unclassifiedCount,
        }
      : command === "stage"
        ? {
            status: "staged",
            stageRoot: toPosix(path.relative(root, result.stageRoot)),
            manifestSha256: result.after.manifestSha256,
            brainMarkdown: result.stageInventory.content.brainMarkdownCount,
            remainingRewrites: result.stageInventory.links.rewriteCount,
          }
        : result
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  main().catch((error) => {
    console.error(error.stack || error.message)
    process.exitCode = 1
  })
