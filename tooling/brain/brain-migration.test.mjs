import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import {
  applyMigration,
  drillMigration,
  planMigration,
  rollbackMigration,
  stageMigration,
} from "./migrate-phase1.mjs"
import { verifyMigration } from "./verify.mjs"
import {
  MOVE_RULES,
  contentPathToSlug,
  graphProjection,
  rewriteDestination,
  rewriteRouteLockSource,
  scanExternalOldRouteReferences,
  sha256,
  toPosix,
  transformLinks,
  walkFiles,
} from "./lib.mjs"

async function writeSyntheticContentIndex(contentRoot, publicRoot) {
  const markdown = await walkFiles(contentRoot, (absolute) => absolute.endsWith(".md"))
  const index = {}
  for (const absolute of markdown) {
    const relative = toPosix(path.relative(contentRoot, absolute))
    const slug = contentPathToSlug(relative)
    index[slug] = { title: slug, links: [] }
  }
  await mkdir(path.join(publicRoot, "static"), { recursive: true })
  await writeFile(path.join(publicRoot, "static/contentIndex.json"), `${JSON.stringify(index)}\n`)
}

async function snapshotContent(root) {
  const contentRoot = path.join(root, "content")
  const files = await walkFiles(contentRoot)
  const records = []
  for (const absolute of files) {
    const bytes = await readFile(absolute)
    records.push({ path: toPosix(path.relative(root, absolute)), sha256: sha256(bytes) })
  }
  return records.sort((a, b) => a.path.localeCompare(b.path))
}

async function createFixture(context) {
  const root = await mkdtemp(path.join(os.tmpdir(), "brain-migration-"))
  context.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(path.join(root, "content/brain/image"), { recursive: true })
  await writeFile(path.join(root, "content/brain/image/a.bin"), Buffer.from([0, 1, 2, 3]))
  await writeFile(path.join(root, "content/brain/index.md"), "---\ntitle: Brain\n---\n")
  await writeFile(path.join(root, "content/index.md"), "[old](/brain/Lecture/a.md)\n")
  await mkdir(path.join(root, "tooling/design"), { recursive: true })
  await writeFile(
    path.join(root, "tooling/design/g002-build-output.test.mjs"),
    'export const route = "brain/java/jvm.html"\n',
  )
  await mkdir(path.join(root, "tooling/migration"), { recursive: true })
  await writeFile(
    path.join(root, "tooling/migration/legacy-evidence.mjs"),
    'export const historicalRoute = "brain/java/jvm.html"\n',
  )

  for (const [index, move] of MOVE_RULES.entries()) {
    const directory = path.join(root, "content", move.from)
    await mkdir(directory, { recursive: true })
    await writeFile(
      path.join(directory, `note-${index}.md`),
      `---\ntitle: note-${index}\n---\n\n[next](/brain/Book/note-1.md)\n`,
    )
  }

  const run = path.join(root, ".omx/artifacts/brain-restructure/test-run")
  const baselinePublic = path.join(run, "baseline-public")
  await writeSyntheticContentIndex(path.join(root, "content"), baselinePublic)
  return { root, run, baselinePublic }
}

test("rewrites every approved Brain route shape without creating aliases", () => {
  assert.equal(rewriteDestination("/brain/Lecture/java/a.md#x"), "/brain/lectures/java/a.md#x")
  assert.equal(rewriteDestination("brain/Book/a?view=1"), "brain/books/a?view=1")
  assert.equal(rewriteDestination("/brain/book/a"), "/brain/books/a")
  assert.equal(rewriteDestination("/brain/java/a"), "/brain/notes/Java/a")
  assert.equal(rewriteDestination("/brain/CS/LT/Compiler/"), "/brain/notes/CS/LT/Compiler/")
  assert.equal(rewriteDestination("/brain/lecture/git#merge"), "/brain/lectures/git#merge")
  assert.equal(rewriteDestination("/brain/Java/_index.md"), "/brain/notes/Java/index.md")
  assert.equal(
    rewriteDestination("https://jae-yoon.tistory.com/brain/Interview/a/?x=1#y"),
    "https://jae-yoon.tistory.com/brain/notes/Interview/a/?x=1#y",
  )
  assert.equal(
    rewriteDestination("https://shin-jae-yoon.github.io/brain/CS/LT/Compiler/"),
    "https://shin-jae-yoon.github.io/brain/notes/CS/LT/Compiler/",
  )
  assert.equal(rewriteDestination("/brain/image/a.png"), "/brain/image/a.png")
  assert.equal(
    rewriteDestination("https://example.com/brain/Book/a"),
    "https://example.com/brain/Book/a",
  )
})

test("rewrites active public route locks and classifies historical references", async (context) => {
  assert.deepEqual(rewriteRouteLockSource('"/brain/java/jvm.html"'), {
    content: '"/brain/notes/java/jvm.html"',
    rewriteCount: 1,
  })
  assert.deepEqual(rewriteRouteLockSource('"/brain/lectures/java/jvm.html"'), {
    content: '"/brain/lectures/java/jvm.html"',
    rewriteCount: 0,
  })
  const { root } = await createFixture(context)
  const scan = await scanExternalOldRouteReferences(root)
  assert.equal(scan.unexpectedCount, 1)
  assert.equal(scan.allowedCount, 1)
  assert.equal(scan.unexpected[0].path, "tooling/design/g002-build-output.test.mjs")
  assert.equal(scan.allowed[0].path, "tooling/migration/legacy-evidence.mjs")
})

test("edits destinations, rejects moved relative links, and preserves code and prose", () => {
  const source = [
    "[lecture](/brain/Lecture/a.md#part)",
    "[[brain/Book/b|도서]]",
    '<a href="/brain/CS/c/">CS</a>',
    "<a href=/brain/Java/d>Java</a>",
    '<a title="https://shin-jae-yoon.github.io/brain/Book/e">Book URL</a>',
    '<a title="brain/Book 설명 문구">Tooltip</a>',
    "[[잔재미] String](brain/Lecture/pl/funny-python/funny03.md)",
    "[relative](../Book/no.md)",
    "`[code](/brain/Lecture/no)`",
    "```md",
    "[fenced](/brain/Book/no)",
    "```",
    "문장 속 brain/Spring/name 은 설명이므로 유지한다.",
  ].join("\n")
  const result = transformLinks(source, "content/brain/CS/example.md")
  assert.match(result.content, /\/brain\/lectures\/a\.md#part/)
  assert.match(result.content, /\[\[brain\/books\/b\|도서\]\]/)
  assert.match(result.content, /href="\/brain\/notes\/CS\/c\/"/)
  assert.match(result.content, /href=\/brain\/notes\/Java\/d/)
  assert.match(result.content, /title="https:\/\/shin-jae-yoon\.github\.io\/brain\/books\/e"/)
  assert.match(result.content, /title="brain\/Book 설명 문구"/)
  assert.match(result.content, /\]\(brain\/lectures\/pl\/funny-python\/funny03\.md\)/)
  assert.match(result.content, /\]\(\.\.\/Book\/no\.md\)/)
  assert.match(result.content, /`\[code\]\(\/brain\/Lecture\/no\)`/)
  assert.match(result.content, /\[fenced\]\(\/brain\/Book\/no\)/)
  assert.match(result.content, /brain\/Spring\/name/)
  assert.equal(result.ledger.filter((entry) => entry.classification === "rewrite").length, 6)
  assert.equal(result.ledger.filter((entry) => entry.classification === "unclassified").length, 1)
  assert.equal(result.ledger.filter((entry) => entry.classification === "ignore-code").length, 2)
  assert.equal(result.ledger.filter((entry) => entry.classification === "preserve-text").length, 2)
})

test("projects only knowledge-to-knowledge nodes and edges", () => {
  const projected = graphProjection({
    "brain/knowledge/a": {
      links: ["brain/knowledge/b", "brain/notes/Java/source", "articles/tistory/15"],
    },
    "brain/knowledge/b": { links: ["brain/knowledge/a"] },
    "brain/notes/Java/source": { links: ["brain/knowledge/a"] },
    "articles/tistory/15": { links: ["brain/knowledge/a"] },
  })
  assert.deepEqual(projected.nodes, ["brain/knowledge/a", "brain/knowledge/b"])
  assert.deepEqual(projected.edges, [
    "brain/knowledge/a->brain/knowledge/b",
    "brain/knowledge/b->brain/knowledge/a",
  ])
})

test("stage, apply, graph verification, and exact rollback preserve a dirty fixture", async (context) => {
  const { root, run, baselinePublic } = await createFixture(context)
  const beforeExternal = await readFile(path.join(root, "content/index.md"), "utf8")
  const routeLockPath = path.join(root, "tooling/design/g002-build-output.test.mjs")
  const beforeRouteLock = await readFile(routeLockPath, "utf8")
  const plan = await planMigration({ root, run, publicRoot: baselinePublic })
  assert.equal(plan.moves.length, 11)
  assert.equal(plan.decisions.preserveOldUrls, false)
  assert.equal(plan.routeLockEditCount, 1)
  assert.equal(plan.unplannedExternalOldRouteCount, 0)
  const renderedPlan = await readFile(path.join(run, "plan.md"), "utf8")
  assert.match(renderedPlan, /`\/brain\/lecture\/note-0` → `\/brain\/lectures\/note-0`/)
  assert.doesNotMatch(renderedPlan, /note-0\/`/)

  await stageMigration({ root, run })
  await assert.rejects(verifyMigration({ root, run, target: "stage" }), /verification failed/)
  const stagePublic = path.join(run, "stage-public")
  await writeSyntheticContentIndex(path.join(run, "stage/content"), stagePublic)
  const stageReport = await verifyMigration({ root, run, target: "stage", publicRoot: stagePublic })
  assert.equal(stageReport.status, "pass")
  assert.equal(stageReport.observations.aliasesOrRedirectsCreated, 0)
  assert.equal(stageReport.observations.unexpectedExternalOldRouteReferences, 0)
  assert.equal(stageReport.observations.allowlistedExternalOldRouteReferences, 1)
  assert.equal(await readFile(path.join(root, "content/index.md"), "utf8"), beforeExternal)
  assert.equal(await readFile(routeLockPath, "utf8"), beforeRouteLock)
  assert.match(
    await readFile(path.join(run, "stage/tooling/design/g002-build-output.test.mjs"), "utf8"),
    /brain\/notes\/java\/jvm\.html/,
  )

  const drill = await drillMigration({ root, run })
  assert.equal(drill.status, "pass")
  assert.equal(drill.worktreeContentMutated, false)
  await assert.rejects(stat(path.join(run, "rollback-drill/root")), { code: "ENOENT" })

  await applyMigration({ root, run })
  assert.match(await readFile(routeLockPath, "utf8"), /brain\/notes\/java\/jvm\.html/)
  const afterPublic = path.join(run, "after-public")
  await writeSyntheticContentIndex(path.join(root, "content"), afterPublic)
  const worktreeReport = await verifyMigration({
    root,
    run,
    target: "worktree",
    publicRoot: afterPublic,
  })
  assert.equal(worktreeReport.status, "pass")
  await assert.rejects(stat(path.join(root, "content/brain/Lecture")), { code: "ENOENT" })
  assert.ok(await stat(path.join(root, "content/brain/lectures/note-0.md")))

  await rollbackMigration({ root, run })
  assert.ok(await stat(path.join(root, "content/brain/Lecture/note-0.md")))
  await assert.rejects(stat(path.join(root, "content/brain/lectures")), { code: "ENOENT" })
  assert.equal(await readFile(path.join(root, "content/index.md"), "utf8"), beforeExternal)
  assert.equal(await readFile(routeLockPath, "utf8"), beforeRouteLock)
})

test("an interrupted apply leaves a durable journal and rolls back byte-exactly", async (context) => {
  const { root, run, baselinePublic } = await createFixture(context)
  const plan = await planMigration({ root, run, publicRoot: baselinePublic })
  await stageMigration({ root, run })
  const before = await snapshotContent(root)
  const routeLockPath = path.join(root, "tooling/design/g002-build-output.test.mjs")
  const beforeRouteLock = await readFile(routeLockPath, "utf8")
  await assert.rejects(
    applyMigration({
      root,
      run,
      faultAfterMutationOperations: plan.edits.length + plan.routeLockEdits.length + 1,
    }),
    /injected apply interruption after mutation/,
  )
  const journal = await readFile(path.join(run, "journal.jsonl"), "utf8")
  assert.match(journal, /"state":"completed"/)
  assert.match(journal.trim().split("\n").at(-1), /"state":"intent"/)
  await rollbackMigration({ root, run })
  assert.deepEqual(await snapshotContent(root), before)
  assert.equal(await readFile(routeLockPath, "utf8"), beforeRouteLock)
})

test("stage and apply reject a plan with unclassified links before writing", async (context) => {
  const { root, run, baselinePublic } = await createFixture(context)
  await planMigration({ root, run, publicRoot: baselinePublic })
  const planPath = path.join(run, "plan.json")
  const plan = JSON.parse(await readFile(planPath, "utf8"))
  plan.unclassifiedCount = 1
  await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`)
  await assert.rejects(stageMigration({ root, run }), /plan has 1 unclassified links/)
  await assert.rejects(stat(path.join(run, "stage")), { code: "ENOENT" })

  plan.unclassifiedCount = 0
  await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`)
  await stageMigration({ root, run })
  plan.unclassifiedCount = 1
  await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`)
  await assert.rejects(applyMigration({ root, run }), /plan has 1 unclassified links/)
  await assert.rejects(stat(path.join(run, "journal.jsonl")), { code: "ENOENT" })
  assert.ok(await stat(path.join(root, "content/brain/Lecture")))
})

test("apply fails closed with zero writes when the planned file set drifts", async (context) => {
  const { root, run, baselinePublic } = await createFixture(context)
  await planMigration({ root, run, publicRoot: baselinePublic })
  await stageMigration({ root, run })
  await writeFile(path.join(root, "content/brain/CS/late-note.md"), "[late](/brain/Book/a.md)\n")
  const beforeAttempt = await snapshotContent(root)
  await assert.rejects(applyMigration({ root, run }), /worktree drifted since plan/)
  assert.deepEqual(await snapshotContent(root), beforeAttempt)
  await assert.rejects(stat(path.join(run, "journal.jsonl")), { code: "ENOENT" })
  assert.ok(await stat(path.join(root, "content/brain/Lecture")))
  await assert.rejects(stat(path.join(root, "content/brain/lectures")), { code: "ENOENT" })
})
