import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import {
  applyMigration,
  convertHtmlBody,
  planMigration,
  rollbackMigration,
  scanNativeMarkdown,
  sha256,
  stageMigration,
  verifyMigration,
} from "./migrate-tistory-markdown.mjs"

const STRUCTURE_FIXTURE = `
<h2 data-ke-size="size26"><b>Heading</b></h2>
<p data-ke-size="size16">A <b>strong</b>, <i>emphasis</i>, <code>x()</code>, and <a href="https://example.com/a?q=1">link</a>.</p>
<blockquote data-ke-style="style3"><p>Quoted <span style="color:red">text</span></p></blockquote>
<ol data-ke-list-type="decimal"><li>first<ul><li>nested</li></ul></li><li>second</li></ol>
<pre data-ke-language="javascript"><code>const x = "&lt;tag&gt;";\n</code></pre>
<table data-ke-style="style13"><tbody><tr><td>Name</td><td>Value</td></tr><tr><td>A</td><td><b>B</b></td></tr></tbody></table>
<figure data-ke-type="image"><span data-phocus="x"><img src="/static/tistory/3/a.png" alt="diagram"></span><figcaption>Image caption</figcaption></figure>
<p><a href="https://jae-yoon.tistory.com/15?x=1#part">same site</a></p>
`

test("renders Tistory body structures as native Markdown with a complete semantic ledger", () => {
  const result = convertHtmlBody(STRUCTURE_FIXTURE, {
    sourceUrl: "https://jae-yoon.tistory.com/3",
  })
  assert.match(result.body, /^## \*\*Heading\*\*/m)
  assert.match(result.body, /\*\*strong\*\*/)
  assert.match(result.body, /\*emphasis\*/)
  assert.match(result.body, /`x\(\)`/)
  assert.match(result.body, /> Quoted text/)
  assert.match(result.body, /1\. first\n\n {3}- nested/)
  assert.match(result.body, /```javascript\nconst x = "<tag>";\n```/)
  assert.match(result.body, /\| Name \| Value \|\n\| --- \| --- \|\n\| A \| \*\*B\*\* \|/)
  assert.match(result.body, /!\[diagram\]\(\/static\/tistory\/3\/a\.png\)/)
  assert.match(result.body, /\*Image caption\*/)
  assert.match(result.body, /\[same site\]\(\/articles\/tistory\/15\/\?x=1#part\)/)
  assert.deepEqual(result.externalSourceTargets, ["https://example.com/a?q=1"])
  assert.deepEqual(result.externalDestinationTargets, result.externalSourceTargets)
  assert.deepEqual(result.imageSourcePaths, ["/static/tistory/3/a.png"])
  assert.deepEqual(result.imageDestinationPaths, result.imageSourcePaths)
  assert.ok(result.ledger.length > 10)
  assert.ok(result.ledger.every((unit, index) => unit.index === index && unit.match))
  assert.deepEqual(scanNativeMarkdown(result.body), {
    rawTags: [],
    tistoryAttributes: [],
    sameSiteAbsoluteLinks: [],
  })
})

test("preserves empty paragraphs and readable style-only wrappers without raw HTML", () => {
  const result = convertHtmlBody(
    '<p data-ke-size="size16">&nbsp;</p><div style="text-align:center"><span><u>readable</u></span></div>',
  )
  assert.match(result.body, /^\u00a0\n\nreadable\n$/)
  assert.equal(result.ledger.length, 1)
  assert.equal(result.ledger[0].source.text, "")
  assert.equal(result.ledger[0].destination.text, "")
  assert.equal(scanNativeMarkdown(result.body).rawTags.length, 0)
})

async function createRepository(context) {
  const root = await mkdtemp(path.join(os.tmpdir(), "tistory-phase3-"))
  context.after(() => rm(root, { recursive: true, force: true }))
  const records = []
  for (let id = 1; id <= 15; id += 1) {
    const relative = `content/articles/tistory/${id}.md`
    const body = `<p data-ke-size="size16">post ${id} <a href="https://jae-yoon.tistory.com/${id}">self</a></p>\n`
    const bytes = Buffer.from(`---\ntitle: ${id}\n---\n${body}`)
    await mkdir(path.join(root, path.dirname(relative)), { recursive: true })
    await writeFile(path.join(root, relative), bytes)
    records.push({
      id,
      destinationPath: relative,
      destinationUrl: `/articles/tistory/${id}/`,
      bodySha256: sha256(Buffer.from(`historical-${id}`)),
      semanticSha256: sha256(Buffer.from(`semantic-${id}`)),
      semanticUnitCount: 2,
    })
  }
  await mkdir(path.join(root, "tooling/design/fixtures"), { recursive: true })
  await writeFile(
    path.join(root, "tooling/design/fixtures/g003-tistory-body-hashes.json"),
    `${JSON.stringify({ schemaVersion: 1, recordCount: 15, records }, null, 2)}\n`,
  )
  return { root, run: ".omx/artifacts/brain-restructure/tistory-test" }
}

async function fakeBuild(root, run) {
  const publicRoot = path.join(root, run, "stage-public")
  await mkdir(path.join(publicRoot, "static"), { recursive: true })
  const index = {
    "brain/knowledge/a": { links: ["brain/knowledge/b", "articles/tistory/1"] },
    "brain/knowledge/b": { links: ["brain/knowledge/a"] },
  }
  for (let id = 1; id <= 15; id += 1) {
    index[`articles/tistory/${id}`] = { links: ["brain/knowledge/a"] }
    await mkdir(path.join(publicRoot, "articles/tistory"), { recursive: true })
    await writeFile(path.join(publicRoot, `articles/tistory/${id}.html`), `<p>post ${id}</p>`)
  }
  await writeFile(path.join(publicRoot, "static/contentIndex.json"), JSON.stringify(index))
  return publicRoot
}

test("plans, stages, verifies, applies, and rolls back only the 15 hash-bound posts", async (context) => {
  const { root, run } = await createRepository(context)
  await planMigration({ root, run })
  const before = await readFile(path.join(root, "content/articles/tistory/1.md"))
  await stageMigration({ root, run })
  const stagedOnce = await readFile(path.join(root, run, "stage/content/articles/tistory/1.md"))
  await stageMigration({ root, run })
  const stagedTwice = await readFile(path.join(root, run, "stage/content/articles/tistory/1.md"))
  assert.deepEqual(stagedTwice, stagedOnce)
  const publicRoot = await fakeBuild(root, run)
  const verification = await verifyMigration({ root, run, target: "stage", publicRoot })
  assert.equal(verification.status, "pass")
  assert.equal(verification.graph.projectedTistoryNodeCount, 0)
  assert.equal(verification.graph.projectedTistoryEdgeCount, 0)
  await applyMigration({ root, run })
  assert.match(
    await readFile(path.join(root, "content/articles/tistory/1.md"), "utf8"),
    /\[self\]\(\/articles\/tistory\/1\/\)/,
  )
  const journal = await readFile(path.join(root, run, "journal.jsonl"), "utf8")
  assert.equal(journal.trim().split("\n").length, 30)
  await rollbackMigration({ root, run })
  assert.deepEqual(await readFile(path.join(root, "content/articles/tistory/1.md")), before)
})

test("apply fails closed on drift and interrupted apply rolls back byte-exactly", async (context) => {
  const { root, run } = await createRepository(context)
  await planMigration({ root, run })
  await stageMigration({ root, run })
  const publicRoot = await fakeBuild(root, run)
  await verifyMigration({ root, run, target: "stage", publicRoot })
  const target = path.join(root, "content/articles/tistory/1.md")
  const before = await readFile(target)
  await writeFile(target, Buffer.concat([before, Buffer.from("drift")]))
  await assert.rejects(applyMigration({ root, run }), /pre-apply hash drift/)
  await writeFile(target, before)
  await assert.rejects(
    applyMigration({ root, run, faultAfterMutationOperations: 3 }),
    /injected Phase 3 apply interruption/,
  )
  await rollbackMigration({ root, run })
  assert.deepEqual(await readFile(target), before)
})
