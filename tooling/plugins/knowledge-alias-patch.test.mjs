import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"
import {
  ALIAS_FRONTMATTER_KEY,
  ALIAS_INDEX_FIELD,
  patchContentIndexDistribution,
  patchContentIndexSource,
  patchSearchComponentDistribution,
  patchSearchComponentSource,
  patchSearchInlineBundle,
  patchSearchInlineSource,
} from "./apply-dev-uni-knowledge-alias-patch.mjs"

const quartzRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))

async function readIfPresent(relative) {
  try {
    return await readFile(path.join(quartzRoot, relative), "utf8")
  } catch (error) {
    if (error.code === "ENOENT") return null
    throw error
  }
}

// Upstream anchors, reproduced verbatim. These stand in for the installed plugin sources so
// the contract holds even where `.quartz/` (gitignored, re-cloned by `install-plugins`) is
// absent — a fresh checkout, or CI before the install step.
const EMITTER_FIXTURE = `export type ContentDetails = {
  slug: FullSlug;
  title: string;
  content: string;
  richContent?: string;
  date?: Date;
};

export const ContentIndex: QuartzEmitterPlugin<Partial<Options>> = (opts) => {
  const emitAll = async (ctx: BuildCtx, content: ProcessedContent[]) => {
    for (const [tree, file] of content) {
      const frontmatter = (data.frontmatter as Record<string, unknown> | undefined) ?? {};
      linkIndex.set(slug, {
          title: (frontmatter.title as string) ?? "",
          content: text ?? "",
          richContent:
            options.rssFullHtml && !isEncrypted ? escapeHTML(toHtml(tree as Root)) : undefined,
      });
    }
  };
};
`

const SEARCH_COMPONENT_FIXTURE = `export type SearchField = "title" | "content" | "tags";

const defaultOptions: SearchOptions = {
  enablePreview: true,
  fieldPriority: ["title", "content", "tags"],
};
`

test("the content index emitter reads alias metadata only from knowledge_aliases", () => {
  const patched = patchContentIndexSource(EMITTER_FIXTURE)

  assert.match(patched, new RegExp(`${ALIAS_INDEX_FIELD}\\?: string\\[\\]`))
  assert.match(patched, new RegExp(`${ALIAS_INDEX_FIELD}: readKnowledgeAliases\\(frontmatter\\)`))

  // Exactly one frontmatter key is read, and it is the search-only one.
  const reader = patched.slice(
    patched.indexOf("function readKnowledgeAliases"),
    patched.indexOf("export const ContentIndex"),
  )
  const keysRead = [...reader.matchAll(/frontmatter\["([^"]+)"\]/g)].map((match) => match[1])
  assert.deepEqual(keysRead, [ALIAS_FRONTMATTER_KEY])
  // The Quartz keys that mint public redirect routes are never a source.
  for (const routingKey of ["aliases", "alias", "permalink"]) {
    assert.doesNotMatch(reader, new RegExp(`frontmatter\\["${routingKey}"\\]`))
    assert.doesNotMatch(reader, new RegExp(`frontmatter\\.${routingKey}\\b`))
  }
})

test("the emitted alias metadata is absent, not empty, when a document has no knowledge aliases", () => {
  const patched = patchContentIndexDistribution(`          content: text2 ?? "",
          richContent: options.rssFullHtml ? html : void 0,`)
  // The inlined reader is self-contained, so it can be evaluated directly.
  const body = patched.slice(patched.indexOf("(() => {"), patched.indexOf("})(),") + 4)
  const read = (frontmatter) => new Function("frontmatter", `return ${body}`)(frontmatter)

  assert.equal(read({}), undefined)
  assert.equal(read({ [ALIAS_FRONTMATTER_KEY]: [] }), undefined)
  assert.equal(read({ [ALIAS_FRONTMATTER_KEY]: ["   "] }), undefined)
  assert.deepEqual(read({ [ALIAS_FRONTMATTER_KEY]: ["Kafka Connect"] }), ["Kafka Connect"])
  assert.deepEqual(read({ [ALIAS_FRONTMATTER_KEY]: " 카프카 커넥트 " }), ["카프카 커넥트"])
  // A routing alias key never reaches the search index.
  assert.equal(read({ aliases: ["public-route"], alias: "x", permalink: "y" }), undefined)
})

test("search defaults prioritize the alias field ahead of title and content", () => {
  const patched = patchSearchComponentSource(SEARCH_COMPONENT_FIXTURE)
  const priority = patched.match(/fieldPriority: \[([^\]]+)\]/)[1]
  const fields = priority.split(",").map((value) => value.trim().replace(/"/g, ""))

  assert.deepEqual(fields, [ALIAS_INDEX_FIELD, "title", "content", "tags"])
  assert.equal(fields[0], ALIAS_INDEX_FIELD, "alias identity must lead the field priority")
  assert.match(patched, new RegExp(`export type SearchField = "${ALIAS_INDEX_FIELD}"`))
})

test("patch transforms are idempotent and fail loudly on a missing anchor", () => {
  const once = patchContentIndexSource(EMITTER_FIXTURE)
  assert.equal(patchContentIndexSource(once), once)

  const search = patchSearchComponentSource(SEARCH_COMPONENT_FIXTURE)
  assert.equal(patchSearchComponentSource(search), search)

  assert.throws(() => patchContentIndexSource("nothing to anchor on"), /anchor is missing/)
  assert.throws(() => patchSearchComponentSource("nothing to anchor on"), /anchor is missing/)
  assert.throws(() => patchSearchInlineSource("nothing to anchor on"), /anchor is missing/)
  assert.throws(() => patchSearchInlineBundle("nothing to anchor on"), /anchor is missing/)
  assert.throws(() => patchSearchComponentDistribution("nothing to anchor on"), /anchor is missing/)
})

// Functional coverage of the artifact the build actually loads: run the shipped emitter over
// synthetic pages and read the `contentIndex.json` it writes. Fixture-level assertions can
// only prove the patch text is right; this proves the emitted index is.
test("the shipped emitter writes alias metadata only for knowledge_aliases", async (context) => {
  const distPath = path.join(quartzRoot, ".quartz/plugins/content-index/dist/index.js")
  if ((await readIfPresent(".quartz/plugins/content-index/dist/index.js")) === null) return
  const { ContentIndex } = await import(pathToFileURL(distPath).href)

  const output = await mkdtemp(path.join(os.tmpdir(), "content-index-alias-"))
  context.after(() => rm(output, { recursive: true, force: true }))

  const page = (slug, frontmatter) => [
    { type: "root", children: [] },
    {
      data: {
        slug,
        relativePath: `${slug}.md`,
        text: `body text for ${slug}`,
        frontmatter: { title: slug, ...frontmatter },
      },
    },
  ]

  const emitter = ContentIndex({ enableSiteMap: false, enableRSS: false })
  await emitter.emit(
    {
      buildId: "alias-patch-test",
      argv: { directory: "content", output, verbose: false },
      cfg: { configuration: { baseUrl: "example.com", pageTitle: "Test" } },
      allSlugs: [],
      allFiles: [],
    },
    [
      page("brain/knowledge/kafka/platform/platform-feature", {
        knowledge_aliases: ["Kafka Connect", "카프카 커넥트"],
      }),
      page("brain/knowledge/plain/no-aliases", {}),
      // Routing keys must never reach the search index, even if a document carries them.
      page("brain/books/routing", { aliases: ["public-route"], alias: "x", permalink: "y" }),
      page("brain/knowledge/blank/empty-aliases", { knowledge_aliases: [] }),
    ],
  )

  const index = JSON.parse(await readFile(path.join(output, "static/contentIndex.json"), "utf8"))

  assert.deepEqual(index["brain/knowledge/kafka/platform/platform-feature"][ALIAS_INDEX_FIELD], [
    "Kafka Connect",
    "카프카 커넥트",
  ])
  // Absent, not an empty array: documents without knowledge aliases are untouched.
  assert.ok(!(ALIAS_INDEX_FIELD in index["brain/knowledge/plain/no-aliases"]))
  assert.ok(!(ALIAS_INDEX_FIELD in index["brain/knowledge/blank/empty-aliases"]))
  assert.ok(!(ALIAS_INDEX_FIELD in index["brain/books/routing"]))
  // The Quartz routing alias keys are not carried into the index under any name.
  assert.doesNotMatch(JSON.stringify(index["brain/books/routing"]), /public-route/)
})

// When the plugins are installed, the working tree must actually carry the patch — the
// build reads `dist/`, so an unpatched dist ships the old ranking no matter what `src/` says.
test("installed plugins carry the alias patch in both source and distribution", async () => {
  const files = {
    "content-index src": await readIfPresent(".quartz/plugins/content-index/src/emitter.ts"),
    "content-index dist": await readIfPresent(".quartz/plugins/content-index/dist/index.js"),
    "search component src": await readIfPresent(".quartz/plugins/search/src/components/Search.tsx"),
    "search inline src": await readIfPresent(
      ".quartz/plugins/search/src/components/scripts/search.inline.ts",
    ),
    "search dist": await readIfPresent(".quartz/plugins/search/dist/index.js"),
    "search component dist": await readIfPresent(".quartz/plugins/search/dist/components/index.js"),
  }
  if (Object.values(files).every((value) => value === null)) {
    // `.quartz/` is gitignored; without `npm run install-plugins` there is nothing to assert.
    return
  }
  for (const [label, source] of Object.entries(files)) {
    assert.ok(source !== null, `${label} is missing from an otherwise installed plugin tree`)
    assert.ok(source.includes(ALIAS_INDEX_FIELD), `${label} does not carry the alias field`)
  }
  // The shipped search bundle must rank exact alias identity, not merely index the field.
  assert.match(files["search dist"], /duKnowledgeAliasIdentity/)
  assert.match(files["search component dist"], /duKnowledgeAliasIdentity/)
})
