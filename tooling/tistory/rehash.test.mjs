import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import path from "node:path"
import test from "node:test"

const repositoryRoot = path.resolve(import.meta.dirname, "../../../..")
const manifest = JSON.parse(
  await readFile(path.join(repositoryRoot, "migration/evidence/tistory/manifest.json"), "utf8"),
)
const normalization = JSON.parse(
  await readFile(path.join(import.meta.dirname, "normalization-v1.json"), "utf8"),
)
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex")

test("manifest freezes exactly 15 unique canonical public posts", () => {
  assert.equal(manifest.postCount, 15)
  assert.equal(new Set(manifest.posts.map((post) => post.canonicalUrl)).size, 15)
  assert.ok(
    manifest.posts.every((post) =>
      /^https:\/\/jae-yoon\.tistory\.com\/\d+$/.test(post.canonicalUrl),
    ),
  )
})

test("every immutable snapshot re-hashes exactly", async () => {
  for (const post of manifest.posts) {
    for (const [pathKey, hashKey] of [
      ["bodyPath", "bodySha256"],
      ["headersPath", "headersSha256"],
      ["curlMetadataPath", "curlMetadataSha256"],
    ]) {
      const bytes = await readFile(path.join(repositoryRoot, post.snapshots[pathKey]))
      assert.equal(sha256(bytes), post.snapshots[hashKey], `${post.id} ${pathKey}`)
    }
  }
})

test("RSS, sitemap, page canonical, titles, and dates reconcile", () => {
  assert.equal(manifest.discovery.rss.count, 15)
  assert.equal(manifest.discovery.sitemap.count, 15)
  assert.equal(manifest.reconciliation.titleMismatchCount, 0)
  assert.equal(manifest.reconciliation.dateMismatchCount, 0)
  assert.ok(
    manifest.posts.every((post) => post.reconciliation.inRss && post.reconciliation.inSitemap),
  )
})

test("normalization v1 was frozen before conversion and forbids author-content rewrites", () => {
  assert.equal(normalization.version, 1)
  assert.equal(normalization.frozenBeforeConversion, true)
  assert.ok(normalization.forbiddenOperations.includes("rewrite"))
  assert.ok(normalization.forbiddenOperations.includes("omit author content"))
})
