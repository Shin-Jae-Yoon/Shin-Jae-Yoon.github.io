import assert from "node:assert/strict"
import { describe, test } from "node:test"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { unified } from "unified"
import { ObsidianFlavoredMarkdown } from "../../.quartz/plugins/obsidian-flavored-markdown/dist/index.js"

const context = { allSlugs: [] }

async function render(markdown) {
  const plugin = ObsidianFlavoredMarkdown()
  const markdownProcessor = unified().use(remarkParse).use(plugin.markdownPlugins(context))
  const markdownTree = markdownProcessor.parse(markdown)
  const transformedMarkdown = await markdownProcessor.run(markdownTree, {
    data: { slug: "brain/test", frontmatter: {} },
  })
  const htmlProcessor = unified()
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(plugin.htmlPlugins(context))

  return htmlProcessor.run(transformedMarkdown)
}

function findElement(node, predicate) {
  if (node?.type === "element" && predicate(node)) return node
  for (const child of node?.children ?? []) {
    const match = findElement(child, predicate)
    if (match) return match
  }
  return undefined
}

describe("Obsidian highlight rendering", () => {
  test("parses nested Markdown instead of exposing its delimiters", async () => {
    const tree = await render("==**bold** and `code` and [[note|link]]==")
    const highlight = findElement(
      tree,
      (node) => node.tagName === "span" && node.properties?.className?.includes("text-highlight"),
    )

    assert.ok(highlight, "the Obsidian highlight must render as a span")
    assert.equal(highlight.children[0]?.tagName, "strong")
    assert.equal(highlight.children[0]?.children[0]?.type, "text")
    assert.equal(highlight.children[0]?.children[0]?.value, "bold")
    assert.equal(
      findElement(highlight, (node) => node.tagName === "code")?.children[0]?.value,
      "code",
    )

    const link = findElement(highlight, (node) => node.tagName === "a")
    assert.equal(link?.properties?.href, "note")
    assert.equal(link?.children[0]?.value, "link")
    assert.doesNotMatch(
      JSON.stringify(highlight),
      /\*\*/,
      "rendered output must not contain literal strong delimiters",
    )
  })
})
