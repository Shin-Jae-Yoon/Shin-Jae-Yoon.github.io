import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const quartzRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const pluginRoot = path.join(quartzRoot, ".quartz/plugins/obsidian-flavored-markdown")
const sourcePath = path.join(pluginRoot, "src/transformer.ts")
const outputPath = path.join(pluginRoot, "dist/index.js")
const marker = "DEV_UNI_OBSIDIAN_NESTED_HIGHLIGHT"

function replaceOnce(source, before, after, label) {
  if (!source.includes(before)) {
    throw new Error(`Obsidian highlight patch failed: ${label} anchor is missing`)
  }
  return source.replace(before, after)
}

async function patchReadableSource() {
  let source = await readFile(sourcePath, "utf8")
  if (source.includes(marker)) return

  source = replaceOnce(
    source,
    `import type { PluggableList } from "unified";`,
    `import type { PluggableList, Processor } from "unified";`,
    "Unified processor type import",
  )
  source = replaceOnce(
    source,
    `import path from "path";`,
    `import path from "path";\nimport { fromMarkdown, type Options as FromMarkdownOptions } from "mdast-util-from-markdown";`,
    "nested Markdown parser import",
  )
  source = replaceOnce(
    source,
    `const getLiteralValue = (child: Node): string => {
  const literalChild = child as { value?: unknown };
  if (typeof literalChild.value === "string") {
    return literalChild.value;
  }
  return "";
};`,
    `const getLiteralValue = (child: Node): string => {
  const literalChild = child as { value?: unknown };
  if (typeof literalChild.value === "string") {
    return literalChild.value;
  }
  return "";
};

type MarkdownParserData = {
  micromarkExtensions?: FromMarkdownOptions["extensions"];
  fromMarkdownExtensions?: FromMarkdownOptions["mdastExtensions"];
};

// ${marker}: parse Markdown nested inside ==highlights==.
function parseHighlightChildren(text: string, processor: Processor | undefined): PhrasingContent[] {
  const parserData = (processor?.data() ?? {}) as MarkdownParserData;
  const parsed = fromMarkdown(text, {
    extensions: parserData.micromarkExtensions,
    mdastExtensions: parserData.fromMarkdownExtensions,
  });
  const block = parsed.children.length === 1 ? parsed.children[0] : undefined;

  if (block?.type === "paragraph" || block?.type === "heading") {
    return block.children;
  }

  return [{ type: "text", value: text }];
}`,
    "nested Markdown helper",
  )
  source = replaceOnce(
    source,
    `      plugins.push(() => {
        return (tree: Root, file) => {
          const base = pathToRoot(file.data.slug! as FullSlug);`,
    `      plugins.push(function (this: Processor | undefined) {
        const processor = this;

        return (tree: Root, file) => {
          const base = pathToRoot(file.data.slug! as FullSlug);`,
    "processor-aware Markdown transformer",
  )
  source = replaceOnce(
    source,
    `          if (opts.highlight) {
            visit(
              tree,
              (node) => node.type === "highlight",
              (node, index: number | undefined, parent: Parent | undefined) => {
                if (parent == null || index == null) return;
                const highlightNode = node as HighlightNode;
                const text = highlightNode.children?.map(getLiteralValue).join("") ?? "";
                parent.children[index] = {
                  type: "html",
                  value: \`<span class="text-highlight">\${text}</span>\`,
                };
                return SKIP;
              },
            );
          }

`,
    "",
    "literal highlight renderer",
  )
  source = replaceOnce(
    source,
    `          if (opts.wikilinks) {`,
    `          if (opts.highlight) {
            visit(
              tree,
              (node) => node.type === "highlight",
              (node) => {
                const highlightNode = node as HighlightNode;
                const text = highlightNode.children?.map(getLiteralValue).join("") ?? "";
                highlightNode.children = parseHighlightChildren(text, processor);
                highlightNode.data = {
                  ...highlightNode.data,
                  hName: "span",
                  hProperties: { className: ["text-highlight"] },
                };
              },
            );
          }

          if (opts.wikilinks) {`,
    "nested highlight transformer",
  )

  await writeFile(sourcePath, source)
}

async function patchDistribution() {
  let source = await readFile(outputPath, "utf8")
  if (source.includes(marker)) return

  source = replaceOnce(
    source,
    `import { fileURLToPath } from 'url';`,
    `import { fileURLToPath } from 'url';\nimport { fromMarkdown as parseNestedMarkdown } from "mdast-util-from-markdown";`,
    "distribution Markdown parser import",
  )
  source = replaceOnce(
    source,
    `var getLiteralValue = (child) => {
  const literalChild = child;
  if (typeof literalChild.value === "string") {
    return literalChild.value;
  }
  return "";
};`,
    `var getLiteralValue = (child) => {
  const literalChild = child;
  if (typeof literalChild.value === "string") {
    return literalChild.value;
  }
  return "";
};
// ${marker}: parse Markdown nested inside ==highlights==.
function parseHighlightChildren(text, processor) {
  const parserData = processor?.data() ?? {};
  const parsed = parseNestedMarkdown(text, {
    extensions: parserData.micromarkExtensions,
    mdastExtensions: parserData.fromMarkdownExtensions
  });
  const block = parsed.children.length === 1 ? parsed.children[0] : void 0;
  if (block?.type === "paragraph" || block?.type === "heading") {
    return block.children;
  }
  return [{ type: "text", value: text }];
}`,
    "distribution nested Markdown helper",
  )
  source = replaceOnce(
    source,
    `      plugins.push(() => {
        return (tree, file) => {
          const base2 = pathToRoot(file.data.slug);`,
    `      plugins.push(function() {
        const processor = this;
        return (tree, file) => {
          const base2 = pathToRoot(file.data.slug);`,
    "distribution processor-aware transformer",
  )
  source = replaceOnce(
    source,
    `          if (opts.highlight) {
            visit3(
              tree,
              (node) => node.type === "highlight",
              (node, index2, parent) => {
                if (parent == null || index2 == null) return;
                const highlightNode = node;
                const text5 = highlightNode.children?.map(getLiteralValue).join("") ?? "";
                parent.children[index2] = {
                  type: "html",
                  value: \`<span class="text-highlight">\${text5}</span>\`
                };
                return SKIP3;
              }
            );
          }
`,
    "",
    "distribution literal highlight renderer",
  )
  source = replaceOnce(
    source,
    `          if (opts.wikilinks) {`,
    `          if (opts.highlight) {
            visit3(
              tree,
              (node) => node.type === "highlight",
              (node) => {
                const highlightNode = node;
                const text5 = highlightNode.children?.map(getLiteralValue).join("") ?? "";
                highlightNode.children = parseHighlightChildren(text5, processor);
                highlightNode.data = {
                  ...highlightNode.data,
                  hName: "span",
                  hProperties: { className: ["text-highlight"] }
                };
              }
            );
          }
          if (opts.wikilinks) {`,
    "distribution nested highlight transformer",
  )

  await writeFile(outputPath, source)
}

await patchReadableSource()
await patchDistribution()
console.log("Applied Dev Uni nested Obsidian highlight patch")
