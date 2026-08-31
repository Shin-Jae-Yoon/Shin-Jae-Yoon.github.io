import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import path from "node:path"
import test from "node:test"
import {
  auditLocalNoExternalMutationBoundary,
  auditPublicBrandMedia,
  auditTistoryBodies,
  destinationBody,
  sha256,
} from "./g003-preservation-sentinels.mjs"

const quartzRoot = path.resolve(import.meta.dirname, "../..")

test("G003 binds 15 immutable Tistory destination bodies to route and fidelity evidence", async () => {
  const result = await auditTistoryBodies()
  assert.equal(result.status, "pass", result.errors.join("\n"))
  assert.equal(result.recordCount, 15)
  assert.match(result.bodyTreeSha256, /^[0-9a-f]{64}$/)
})

test("G003 body-only hashing excludes frontmatter without normalizing author bytes", () => {
  const first = Buffer.from("---\ntitle: First\n---\n<p>author body</p>\n")
  const second = Buffer.from("---\ntitle: Second\nalias: /old\n---\n<p>author body</p>\n")
  assert.equal(sha256(destinationBody(first)), sha256(destinationBody(second)))
  assert.throws(() => destinationBody(Buffer.from("<p>no frontmatter</p>\n")), /frontmatter/)
})

test("G003 current public output contains only hash-bound owner-approved brand media", async () => {
  await readFile(path.join(quartzRoot, "public/index.html"))
  const result = await auditPublicBrandMedia(path.join(quartzRoot, "public"))
  assert.equal(result.status, "pass", result.errors.join("\n"))
  assert.equal(result.emittedCount, result.approvedCount)
})

test("G003 remains behind the recorded local no-external-mutation boundary", async () => {
  const result = await auditLocalNoExternalMutationBoundary()
  assert.equal(result.status, "pass", result.errors.join("\n"))
  assert.match(result.activeWorkflowSha256, /^[0-9a-f]{64}$/)
  assert.match(result.stagedWorkflowSha256, /^[0-9a-f]{64}$/)
})
