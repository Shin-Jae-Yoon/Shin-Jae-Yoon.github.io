import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

import {
  KNOWLEDGE_HUB_SLUG,
  PROJECTOR_SOURCE,
  isKnowledgeSlug,
  projectKnowledgeGraph,
  projectionMetrics,
} from "./graph-projector.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const patchPath = path.join(here, "apply-dev-uni-graph-patch.mjs")

/**
 * A miniature contentIndex shaped like the real one: knowledge notes linking to
 * each other, a knowledge folder page, and the three families of node the graph
 * must never show — the Tistory archive, a source note and a lecture — each one
 * given both a shared tag and a cross-link, which are the two ways an excluded
 * page could otherwise slip back in.
 */
function fixture() {
  return new Map(
    Object.entries({
      "brain/knowledge": { title: "Knowledge", links: ["brain/knowledge/algo"], tags: [] },
      "brain/knowledge/algo": { title: "algo", links: [], tags: ["algo"] },
      "brain/knowledge/algo/sort/quick-sort": {
        title: "퀵 정렬",
        links: [
          "brain/knowledge/algo/sort/merge-sort",
          "brain/knowledge/algo/sort/index",
          "brain/notes/CS/Algo/sort/comparison/quickSort",
          "tistory/2023/some-post",
        ],
        tags: ["algo", "sort"],
      },
      "brain/knowledge/algo/sort/merge-sort": {
        title: "합병 정렬",
        links: ["brain/knowledge/algo/sort/quick-sort"],
        tags: ["algo", "sort"],
      },
      "brain/notes/CS/Algo/sort/comparison/quickSort": {
        title: "퀵정렬 노트",
        links: ["brain/knowledge/algo/sort/quick-sort"],
        tags: ["algo", "sort"],
      },
      "brain/lectures/algo/fastcampus-algo/lecture01": {
        title: "강의 1",
        links: ["brain/knowledge/algo/sort/merge-sort"],
        tags: ["algo"],
      },
      "tistory/2023/some-post": { title: "티스토리 글", links: [], tags: ["algo"] },
      index: { title: "홈", links: ["brain/knowledge"], tags: [] },
    }),
  )
}

/** The renderer's own traversal, run over projected data. */
function traverse(projected, startSlug, depth) {
  const links = []
  projected.forEach((details, source) => {
    for (const dest of details.links) {
      const simplified = dest.replace(/\/index$/, "")
      if (projected.has(simplified)) links.push({ source, target: simplified })
    }
  })

  const neighbourhood = new Set()
  if (depth >= 0) {
    let queue = [startSlug]
    const seen = new Set([startSlug])
    for (let d = 0; d <= depth && queue.length > 0; d += 1) {
      const next = []
      for (const cur of queue) {
        neighbourhood.add(cur)
        for (const link of links) {
          if (link.source === cur && !seen.has(link.target)) {
            seen.add(link.target)
            next.push(link.target)
          }
          if (link.target === cur && !seen.has(link.source)) {
            seen.add(link.source)
            next.push(link.source)
          }
        }
      }
      queue = next
    }
  } else {
    projected.forEach((_details, id) => neighbourhood.add(id))
  }
  return { neighbourhood, links }
}

test("the node predicate admits the knowledge root, its descendants and nothing else", () => {
  assert.equal(isKnowledgeSlug("brain/knowledge"), true)
  assert.equal(isKnowledgeSlug("brain/knowledge/algo"), true)
  assert.equal(isKnowledgeSlug("brain/knowledge/algo/sort/quick-sort"), true)

  assert.equal(isKnowledgeSlug("brain"), false)
  assert.equal(isKnowledgeSlug("brain/index"), false)
  assert.equal(isKnowledgeSlug("brain/notes/CS/Algo/sort/comparison/quickSort"), false)
  assert.equal(isKnowledgeSlug("brain/lectures/algo/fastcampus-algo/lecture01"), false)
  assert.equal(isKnowledgeSlug("brain/books/fun-java/chap01"), false)
  assert.equal(isKnowledgeSlug("tistory/2023/some-post"), false)
  assert.equal(isKnowledgeSlug("brain/knowledgebase/x"), false)
  assert.equal(isKnowledgeSlug(undefined), false)
})

test("projection keeps only knowledge nodes", () => {
  const projected = projectKnowledgeGraph(fixture())
  const ids = [...projected.keys()].sort()
  assert.deepEqual(ids, [
    "brain/knowledge",
    "brain/knowledge/algo",
    "brain/knowledge/algo/sort/merge-sort",
    "brain/knowledge/algo/sort/quick-sort",
  ])
  for (const id of ids) assert.equal(isKnowledgeSlug(id), true)
})

test("an edge survives only when both endpoints are knowledge nodes", () => {
  const projected = projectKnowledgeGraph(fixture())
  const quick = projected.get("brain/knowledge/algo/sort/quick-sort")
  assert.deepEqual(quick.links, [
    "brain/knowledge/algo/sort/merge-sort",
    "brain/knowledge/algo/sort/index",
  ])

  for (const details of projected.values()) {
    for (const dest of details.links) assert.equal(isKnowledgeSlug(dest), true)
  }
})

test("no edge points into the projection from outside it", () => {
  const raw = fixture()
  const projected = projectKnowledgeGraph(raw)
  for (const [id, details] of projected) {
    assert.ok(raw.has(id))
    void details
  }
  // The note and the lecture both link into the knowledge base in the fixture;
  // after projection neither exists, so neither edge can be drawn.
  assert.equal(projected.has("brain/notes/CS/Algo/sort/comparison/quickSort"), false)
  assert.equal(projected.has("brain/lectures/algo/fastcampus-algo/lecture01"), false)
})

test("tags are dropped, so no tag node can reintroduce an excluded page", () => {
  const projected = projectKnowledgeGraph(fixture())
  for (const details of projected.values()) {
    assert.deepEqual(details.tags, [])
  }
})

test("local traversal at depth 1 cannot leave the projection", () => {
  const projected = projectKnowledgeGraph(fixture())
  const { neighbourhood } = traverse(projected, "brain/knowledge/algo/sort/quick-sort", 1)
  for (const id of neighbourhood) assert.equal(isKnowledgeSlug(id), true)
  assert.equal(neighbourhood.has("brain/notes/CS/Algo/sort/comparison/quickSort"), false)
  assert.equal(neighbourhood.has("brain/lectures/algo/fastcampus-algo/lecture01"), false)
})

test("global traversal at depth -1 is exactly the projected node set", () => {
  const projected = projectKnowledgeGraph(fixture())
  const { neighbourhood } = traverse(projected, "brain", -1)
  assert.deepEqual([...neighbourhood].sort(), [...projected.keys()].sort())
  for (const id of neighbourhood) assert.equal(isKnowledgeSlug(id), true)
})

test("the synthetic hub anchors on a node that satisfies the predicate", () => {
  assert.equal(isKnowledgeSlug(KNOWLEDGE_HUB_SLUG), true)
  const projected = projectKnowledgeGraph(fixture())
  assert.equal(projected.has(KNOWLEDGE_HUB_SLUG), true)
})

test("metrics count what the projection kept", () => {
  assert.deepEqual(projectionMetrics(fixture()), { nodes: 4, edges: 4 })
})

test("the patch injects the shared projector rather than a copy of it", async () => {
  const patch = await readFile(patchPath, "utf8")
  assert.match(patch, /DEV_UNI_GRAPH_KNOWLEDGE_PROJECTOR/)
  assert.match(patch, /from "\.\/graph-projector\.mjs"/)
  assert.match(patch, /data = projectKnowledgeGraph\(data\);/)
  assert.match(patch, /showTags = false;/)
  // The projector body must not be duplicated in the patch — it is interpolated.
  assert.equal(patch.includes("function projectKnowledgeGraph(data) {"), false)
  assert.ok(PROJECTOR_SOURCE.includes("function projectKnowledgeGraph(data) {"))
})
