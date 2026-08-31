import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"
import { verifyQuartzSourceScope } from "./design-governance.mjs"

const quartzRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const repositoryRoot = path.resolve(quartzRoot, "../..")
const snapshot = JSON.parse(
  await readFile(
    path.join(repositoryRoot, "migration/evidence/design-remediation/current-quartz-source.json"),
    "utf8",
  ),
)
const sha256 = (value) => createHash("sha256").update(value).digest("hex")
const snapshotTreeHash = (scope) =>
  sha256(
    scope.files.map(({ path: bindingPath, sha256: hash }) => `${bindingPath}\0${hash}\n`).join(""),
  )

test("owner critique supersedes the former Stage 0 direction", async () => {
  const design = await readFile(path.join(repositoryRoot, "DESIGN.md"), "utf8")
  assert.match(design, /active revision/i)
  assert.match(design, /AI|original|Garden|Articles/i)
})

test("revised implementation evidence is complete but does not deploy", async () => {
  const report = JSON.parse(
    await readFile(
      path.join(repositoryRoot, "migration/evidence/design-owner-revision/capture-index.json"),
      "utf8",
    ),
  )
  assert.equal(report.status, "PASS")
  assert.deepEqual(report.summary.failures, [])
})

test("pending direction requires the reviewed Quartz source to match live bytes", async () => {
  await assert.rejects(
    verifyQuartzSourceScope({
      requireLiveMatch: true,
      scope: structuredClone(snapshot),
      readLiveFile: async () => Buffer.from("owner-unapproved drift"),
    }),
    /stale content hash before approval/,
  )
})

test("approved direction allows live implementation drift and requires phase evidence", async () => {
  let liveRead = false
  const result = await verifyQuartzSourceScope({
    requireLiveMatch: false,
    scope: structuredClone(snapshot),
    readLiveFile: async () => {
      liveRead = true
      throw new Error(
        "approved phase must not compare the pre-implementation snapshot to live files",
      )
    },
  })
  assert.equal(liveRead, false)
  assert.equal(result.validation.snapshotIntegrity, "verified")
  assert.equal(result.validation.liveSourceComparison, "not-compared-after-direction-approval")
  assert.equal(result.validation.implementationPhaseEvidence, "required-separate-exact-hash")
})

test("pre-implementation snapshot rejects tampered binding lines and tree hashes", async () => {
  const tamperedLine = structuredClone(snapshot)
  tamperedLine.files[0].sha256 = "0".repeat(64)
  await assert.rejects(
    verifyQuartzSourceScope({ requireLiveMatch: false, scope: tamperedLine }),
    /scoped tree hash mismatch/,
  )

  const tamperedTree = structuredClone(snapshot)
  tamperedTree.treeSha256 = "f".repeat(64)
  await assert.rejects(
    verifyQuartzSourceScope({ requireLiveMatch: false, scope: tamperedTree }),
    /scoped tree hash mismatch/,
  )

  const rewrittenSnapshot = structuredClone(snapshot)
  rewrittenSnapshot.files[0].sha256 = "1".repeat(64)
  rewrittenSnapshot.treeSha256 = snapshotTreeHash(rewrittenSnapshot)
  await assert.rejects(
    verifyQuartzSourceScope({ requireLiveMatch: true, scope: rewrittenSnapshot }),
    /stale content hash before approval/,
  )
})
