import assert from "node:assert/strict"
import test from "node:test"
import { canonicalPathForSlug, canonicalUrl, normalizeCanonicalPath } from "./canonical"

test("canonical paths share one encoded, query-free normalization", () => {
  assert.equal(normalizeCanonicalPath("/한 글/index/?utm=x#part"), "/%ED%95%9C%20%EA%B8%80")
  assert.equal(normalizeCanonicalPath("/%ED%95%9C%20%EA%B8%80/"), "/%ED%95%9C%20%EA%B8%80")
  assert.equal(canonicalPathForSlug("index"), "/")
})

test("canonical URL uses https and the normalized path", () => {
  assert.equal(
    canonicalUrl("jae-yoon.github.io", "brain/테스트"),
    "https://jae-yoon.github.io/brain/%ED%85%8C%EC%8A%A4%ED%8A%B8",
  )
})
