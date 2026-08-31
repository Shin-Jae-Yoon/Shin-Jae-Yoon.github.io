import assert from "node:assert/strict"
import { test } from "node:test"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { scanHomeReferenceSource } from "./home-reference.mjs"

test("Home reference source rejects template tropes and unapproved media", async () => {
  const scan = await scanHomeReferenceSource()
  assert.equal(scan.status, "pass")
  assert.deepEqual(scan.forbiddenMatches, [])
  assert.deepEqual(scan.missingRequiredText, [])
  assert.deepEqual(scan.excessiveRadii, [])
  assert.equal(scan.usesLegacyOrRemoteMedia, false)
})

test("owner revision replaces the stale Home reference evidence", async () => {
  const root = path.resolve(import.meta.dirname, "../../..")
  const index = JSON.parse(
    await readFile(path.join(root, "evidence/design-owner-revision/capture-index.json"), "utf8"),
  )
  assert.equal(index.status, "PASS")
  assert.equal(index.summary.screenshotCount, 36)
  assert.deepEqual(index.summary.failures, [])
})
