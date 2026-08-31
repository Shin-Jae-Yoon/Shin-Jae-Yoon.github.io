import assert from "node:assert/strict"
import path from "node:path"
import test from "node:test"
import { tmpdir } from "node:os"
import {
  loadArtifactManifest,
  parseArtifactManifest,
  validateReproducibleManifestPair,
} from "./artifact-manifest.mjs"

function manifestSource(changedFirst = false) {
  return Array.from({ length: 127 }, (_, index) => {
    const hash = changedFirst && index === 0 ? "f".repeat(64) : index.toString(16).padStart(64, "0")
    return `${hash}  file-${String(index).padStart(3, "0")}.html\n`
  }).join("")
}

test("a missing reproducibility manifest fails closed", async () => {
  await assert.rejects(
    loadArtifactManifest(path.join(tmpdir(), `missing-manifest-${process.pid}.sha256`)),
    /ENOENT/,
  )
})

test("malformed and duplicate manifest records are rejected", () => {
  assert.throws(() => parseArtifactManifest("not-a-manifest\n"), /invalid artifact manifest/)
  const hash = "a".repeat(64)
  assert.throws(
    () => parseArtifactManifest(`${hash}  duplicate.html\n${hash}  duplicate.html\n`),
    /duplicate paths/,
  )
})

test("a changed first manifest fails despite a forged PASS summary", () => {
  const first = parseArtifactManifest(manifestSource(true))
  const second = parseArtifactManifest(manifestSource(false))
  const forgedSummary = {
    status: "pass",
    changedFileCount: 0,
    changedFiles: [],
    first: {
      path: "migration/evidence/g013/build-1.sha256",
      entryCount: 127,
      sha256: second.treeSha256,
    },
    second: {
      path: "migration/evidence/g013/build-2.sha256",
      entryCount: 127,
      sha256: second.treeSha256,
    },
  }
  const result = validateReproducibleManifestPair({
    first,
    second,
    summary: forgedSummary,
    currentTreeSha256: second.treeSha256,
    acceptedTreeSha256: second.treeSha256,
  })
  assert.equal(result.status, "fail")
  assert.ok(result.errors.some((error) => error.includes("not identical")))
  assert.ok(result.errors.some((error) => error.includes("first manifest tree")))
  assert.ok(result.errors.some((error) => error.includes("first summary tree hash")))
})
