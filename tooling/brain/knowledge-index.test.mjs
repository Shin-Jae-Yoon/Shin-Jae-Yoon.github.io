import assert from "node:assert/strict"
import test from "node:test"
import {
  KNOWLEDGE_ALIAS_KEY,
  QUARTZ_PUBLIC_ALIAS_KEYS,
  collisionReport,
  folderTags,
  recordFromMarkdown,
} from "./knowledge-index.mjs"
import { sha256 } from "./lib.mjs"

function document(overrides = {}) {
  const source = "# assertion"
  const canonicalPath = overrides.canonical_path ?? "content/brain/knowledge/java/oop/example.md"
  const data = {
    concept_id: "java.oop.example",
    title: "Example",
    knowledge_aliases: ["Example alias"],
    tags: ["java", "oop"],
    canonical_path: canonicalPath,
    sources: [
      {
        path: "content/brain/books/example.md",
        source_sha256: sha256(source),
        locator: {
          heading: "# assertion",
          start_line: 1,
          end_line: 1,
          span_sha256: sha256(source),
        },
      },
    ],
    related_concepts: [],
    ...overrides,
  }
  return `---\n${Object.entries(data)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n")}\n---\n`
}

test("folder tags are knowledge-only and exclude reserved path segments", () => {
  assert.deepEqual(folderTags("content/brain/knowledge/java/oop/inheritance.md"), ["java", "oop"])
  assert.throws(
    () =>
      recordFromMarkdown(
        document({
          canonical_path: "content/brain/knowledge/brain/example.md",
          tags: ["brain"],
        }),
        "proposal.md",
        "proposal",
      ),
    /reserved brain\/knowledge tag/,
  )
})

test("knowledge aliases stay search-only identity and reject Quartz redirect keys", () => {
  const record = recordFromMarkdown(document(), "search-only.md", "proposal")
  assert.deepEqual(record.aliases, ["Example alias"])
  assert.equal(KNOWLEDGE_ALIAS_KEY, "knowledge_aliases")
  for (const key of QUARTZ_PUBLIC_ALIAS_KEYS) {
    assert.throws(
      () => recordFromMarkdown(document({ [key]: ["old-route"] }), `${key}.md`, "proposal"),
      new RegExp(`\`${key}\` emits a public Quartz redirect route`),
    )
  }
})

test("concept records require provenance and report title/alias collisions", () => {
  const first = recordFromMarkdown(document(), "first.md", "proposal")
  const second = recordFromMarkdown(
    document({
      concept_id: "java.oop.second",
      title: "Second",
      knowledge_aliases: ["example"],
      canonical_path: "content/brain/knowledge/java/oop/second.md",
    }),
    "second.md",
    "proposal",
  )
  const report = collisionReport([first, second])
  assert.equal(report.status, "fail")
  assert.equal(
    report.collisions.some((collision) => collision.kind === "title_or_alias"),
    true,
  )
  assert.throws(
    () => recordFromMarkdown(document({ sources: [] }), "missing.md", "proposal"),
    /sources\[\] is required/,
  )
  const folderRoute = recordFromMarkdown(
    document({
      concept_id: "domain.domain",
      title: "Domain",
      knowledge_aliases: [],
      canonical_path: "content/brain/knowledge/domain/domain.md",
      tags: ["domain"],
    }),
    "folder-route.md",
    "proposal",
  )
  assert.equal(
    collisionReport([folderRoute]).collisions.some(
      (collision) => collision.kind === "folder_route",
    ),
    true,
  )
})
