/**
 * Knowledge graph projector — Phase 6 of the brain restructure.
 *
 * The graph renderer is fed the full `contentIndex`, which also carries the
 * Tistory archive and every source note, book and lecture. Search and backlinks
 * need that index intact, so the narrowing happens at the renderer's input:
 * only `brain/knowledge` and `brain/knowledge/**` become nodes, and an edge
 * survives only when both of its endpoints do.
 *
 * The projector is written once, as ES5 source text, because it has to run in
 * two places — injected verbatim into the inline graph script, and here, where
 * the contract tests exercise it. Evaluating the same string in both keeps them
 * from drifting apart.
 */

export const KNOWLEDGE_ROOT = "brain/knowledge"
export const KNOWLEDGE_HUB_SLUG = "brain/knowledge"

export const PROJECTOR_SOURCE = `function isKnowledgeSlug(id) {
  if (typeof id !== "string") return false;
  return id === "brain/knowledge" || id.indexOf("brain/knowledge/") === 0;
}

function projectKnowledgeGraph(data) {
  var projected = new Map();
  data.forEach(function (details, id) {
    if (!isKnowledgeSlug(id)) return;
    var outgoing = details && details.links ? details.links : [];
    var kept = [];
    for (var li = 0; li < outgoing.length; li++) {
      if (isKnowledgeSlug(outgoing[li])) kept.push(outgoing[li]);
    }
    projected.set(id, {
      title: details && details.title ? details.title : id,
      links: kept,
      tags: [],
    });
  });
  return projected;
}`

const factory = new Function(
  `${PROJECTOR_SOURCE}
return { isKnowledgeSlug: isKnowledgeSlug, projectKnowledgeGraph: projectKnowledgeGraph };`,
)

const runtime = factory()

/** True when the slug names a knowledge note or a knowledge folder page. */
export const isKnowledgeSlug = runtime.isKnowledgeSlug

/**
 * Narrow a simplified-slug content map to the knowledge subgraph.
 * Tags are dropped outright so no `tags/*` node can pull an excluded page back
 * in through a shared tag.
 */
export const projectKnowledgeGraph = runtime.projectKnowledgeGraph

/** Convenience for tests and reports: the projected node and edge counts. */
export function projectionMetrics(data) {
  const projected = projectKnowledgeGraph(data)
  let edges = 0
  for (const details of projected.values()) {
    edges += details.links.length
  }
  return { nodes: projected.size, edges }
}
