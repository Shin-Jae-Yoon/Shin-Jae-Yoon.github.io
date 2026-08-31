import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

// Search-only knowledge aliases (owner decision H-1) are knowledge identity: they name a
// concept but never mint a public route. Rendering them into the body alone is not enough
// to satisfy the schema's rank-0 requirement, because the same words legitimately appear in
// other knowledge documents' prose and nothing distinguishes "this document *is* the alias"
// from "this document mentions it". This patch carries the alias list as non-routing
// metadata through Quartz's content index and gives exact alias identity search priority
// ahead of title and content.
//
// `.quartz/` is gitignored and re-cloned by `npm run install-plugins`, so this patch — not
// an edit under `.quartz/` — is the durable form of the change, exactly like the existing
// Dev Uni explorer, graph, and Obsidian-highlight patches.

const quartzRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const contentIndexRoot = path.join(quartzRoot, ".quartz/plugins/content-index")
const searchRoot = path.join(quartzRoot, ".quartz/plugins/search")

export const CONTENT_INDEX_MARKER = "DEV_UNI_KNOWLEDGE_ALIAS_INDEX"
export const SEARCH_MARKER = "DEV_UNI_KNOWLEDGE_ALIAS_SEARCH"

// The single frontmatter key knowledge aliases may come from. Quartz's own `aliases`,
// `alias`, and `permalink` keys are coalesced by the note-properties transformer into
// `file.data.aliases`, which the alias-redirects emitter turns into public redirect pages;
// they stay forbidden in knowledge documents and are never a source for this field.
export const ALIAS_FRONTMATTER_KEY = "knowledge_aliases"
export const ALIAS_INDEX_FIELD = "knowledgeAliases"

function replaceOnce(source, before, after, label) {
  if (!source.includes(before)) {
    throw new Error(`Knowledge alias patch failed: ${label} anchor is missing`)
  }
  if (source.indexOf(before) !== source.lastIndexOf(before)) {
    throw new Error(`Knowledge alias patch failed: ${label} anchor is ambiguous`)
  }
  return source.replace(before, after)
}

/**
 * Content index emitter: carry `knowledge_aliases` into `contentIndex.json` as a
 * non-routing `knowledgeAliases` array. Documents without the key emit nothing, so the
 * index stays byte-identical for every non-knowledge page.
 */
export function patchContentIndexSource(source) {
  if (source.includes(CONTENT_INDEX_MARKER)) return source

  let output = replaceOnce(
    source,
    `  content: string;
  richContent?: string;`,
    `  content: string;
  /**
   * ${CONTENT_INDEX_MARKER}: search-only knowledge identity read from
   * \`${ALIAS_FRONTMATTER_KEY}\`. Never a routing alias and never a public route.
   */
  ${ALIAS_INDEX_FIELD}?: string[];
  richContent?: string;`,
    "ContentDetails alias field",
  )

  output = replaceOnce(
    output,
    `export const ContentIndex: QuartzEmitterPlugin<Partial<Options>> = (opts) => {`,
    `// ${CONTENT_INDEX_MARKER}
// Read only from \`${ALIAS_FRONTMATTER_KEY}\`. \`aliases\`, \`alias\`, and \`permalink\` mint public
// redirect routes and are forbidden in knowledge documents, so they are never read here.
export function readKnowledgeAliases(
  frontmatter: Record<string, unknown>,
): string[] | undefined {
  const raw = frontmatter["${ALIAS_FRONTMATTER_KEY}"];
  const list = Array.isArray(raw) ? raw : raw === undefined || raw === null ? [] : [raw];
  const values = list
    .map((value) => String(value).normalize("NFC").trim())
    .filter((value) => value !== "");
  return values.length > 0 ? values : undefined;
}

export const ContentIndex: QuartzEmitterPlugin<Partial<Options>> = (opts) => {`,
    "ContentIndex alias reader",
  )

  output = replaceOnce(
    output,
    `          content: text ?? "",
          richContent:`,
    `          content: text ?? "",
          ${ALIAS_INDEX_FIELD}: readKnowledgeAliases(frontmatter),
          richContent:`,
    "ContentIndex alias emission",
  )

  return output
}

// The shipped bundle is unminified, so the emitter body is patched in place with the same
// reader inlined; keeping it self-contained avoids depending on a declaration anchor.
export function patchContentIndexDistribution(source) {
  if (source.includes(CONTENT_INDEX_MARKER)) return source
  return replaceOnce(
    source,
    `          content: text2 ?? "",
          richContent:`,
    `          content: text2 ?? "",
          ${ALIAS_INDEX_FIELD}: /* ${CONTENT_INDEX_MARKER} */ (() => {
            const raw = frontmatter["${ALIAS_FRONTMATTER_KEY}"];
            const list = Array.isArray(raw) ? raw : raw === void 0 || raw === null ? [] : [raw];
            const values = list
              .map((value) => String(value).normalize("NFC").trim())
              .filter((value) => value !== "");
            return values.length > 0 ? values : void 0;
          })(),
          richContent:`,
    "ContentIndex bundle alias emission",
  )
}

/** Search component: the alias field leads the default field priority. */
export function patchSearchComponentSource(source) {
  if (source.includes(SEARCH_MARKER)) return source

  let output = replaceOnce(
    source,
    `export type SearchField = "title" | "content" | "tags";`,
    `// ${SEARCH_MARKER}: exact knowledge-alias identity outranks title and content.
export type SearchField = "${ALIAS_INDEX_FIELD}" | "title" | "content" | "tags";`,
    "SearchField union",
  )

  output = replaceOnce(
    output,
    `  fieldPriority: ["title", "content", "tags"],`,
    `  fieldPriority: ["${ALIAS_INDEX_FIELD}", "title", "content", "tags"],`,
    "Search default field priority",
  )

  return output
}

/** Search component bundle: same default, applied to the shipped `defaultOptions`. */
export function patchSearchComponentDistribution(source) {
  if (source.includes(`"${ALIAS_INDEX_FIELD}", "title", "content", "tags"`)) return source
  return replaceOnce(
    source,
    `  fieldPriority: ["title", "content", "tags"]`,
    `  fieldPriority: ["${ALIAS_INDEX_FIELD}", "title", "content", "tags"]`,
    "Search bundle default field priority",
  )
}

/**
 * Search runtime: register the alias field with FlexSearch, query it alongside title and
 * content, feed it from the content index, and hoist exact alias identity to rank 0.
 */
export function patchSearchInlineSource(source) {
  if (source.includes(SEARCH_MARKER)) return source

  let output = replaceOnce(
    source,
    `  tags: string[];
  [key: string]: any;`,
    `  tags: string[];
  ${ALIAS_INDEX_FIELD}?: string[];
  [key: string]: any;`,
    "Item alias field",
  )

  output = replaceOnce(
    output,
    `const index = new FlexSearch.Document({`,
    `// ${SEARCH_MARKER}
// Alias identity comparison uses the same rule the knowledge schema uses to keep titles and
// aliases globally unique: Unicode-normalized, trimmed, case-folded.
const normalizeAliasIdentity = (value: string): string =>
  String(value ?? "")
    .normalize("NFC")
    .trim()
    .toLowerCase();

const index = new FlexSearch.Document({`,
    "alias identity helper",
  )

  output = replaceOnce(
    output,
    `    index: [
      { field: "title", tokenize: "forward" },`,
    `    index: [
      { field: "${ALIAS_INDEX_FIELD}", tokenize: "forward" },
      { field: "title", tokenize: "forward" },`,
    "FlexSearch alias field registration",
  )

  output = replaceOnce(
    output,
    `      : ["title", "content", "tags"];`,
    `      : ["${ALIAS_INDEX_FIELD}", "title", "content", "tags"];`,
    "field priority fallback",
  )

  output = replaceOnce(
    output,
    `          index: ["title", "content"],`,
    `          index: ["${ALIAS_INDEX_FIELD}", "title", "content"],`,
    "query field list",
  )

  output = replaceOnce(
    output,
    `        title: fileData.title || "",
        content: fileData.content || "",
        tags: fileData.tags || [],
      }),`,
    `        title: fileData.title || "",
        content: fileData.content || "",
        tags: fileData.tags || [],
        ${ALIAS_INDEX_FIELD}: fileData.${ALIAS_INDEX_FIELD} || [],
      }),`,
    "initial index payload",
  )

  output = replaceOnce(
    output,
    `      title: fileData.title || "",
      content: fileData.content || "",
      tags: fileData.tags || [],
    });`,
    `      title: fileData.title || "",
      content: fileData.content || "",
      tags: fileData.tags || [],
      ${ALIAS_INDEX_FIELD}: fileData.${ALIAS_INDEX_FIELD} || [],
    });`,
    "incremental index payload",
  )

  // Rank 0 is an identity claim, not a scoring nudge: a document whose alias *is* the query
  // is hoisted ahead of every document that merely contains the same words. Aliases and
  // titles are globally unique across knowledge, so at most one document can claim it.
  output = replaceOnce(
    output,
    `      const allIds: Set<number> = new Set(fieldPriority.flatMap((field) => getByField(field)));

      const filteredIds = [...allIds].filter((id) => {`,
    `      const allIds: Set<number> = new Set(fieldPriority.flatMap((field) => getByField(field)));

      const aliasIdentity = normalizeAliasIdentity(parsed.query);
      const exactAliasIds =
        aliasIdentity === ""
          ? []
          : [...allIds].filter((id) => {
              const aliasSlug = idDataMap[id];
              const aliasItem = aliasSlug ? contentData?.[aliasSlug] : null;
              const aliases = aliasItem?.${ALIAS_INDEX_FIELD} ?? [];
              return aliases.some(
                (alias: string) => normalizeAliasIdentity(alias) === aliasIdentity,
              );
            });
      const rankedIds =
        exactAliasIds.length > 0 ? [...new Set([...exactAliasIds, ...allIds])] : [...allIds];

      const filteredIds = rankedIds.filter((id) => {`,
    "exact alias identity ranking",
  )

  return output
}

// The shipped `search.inline` bundle is minified and embedded as a template literal, and
// the plugin's own build dependencies are not installed here, so it is patched in place
// rather than recompiled. Every anchor below is matched against minified *structure* and
// reuses the minifier's own identifiers, so a renamed build still patches; a genuinely
// changed upstream build fails loudly instead of silently shipping the old ranking.
const RANKING_PATTERN =
  /\[\.\.\.new Set\((\w+)\.flatMap\((\w+)=>(\w+)\(\2\)\)\)\]\.filter\((\w+)=>\{if\((\w+)\.tags\.length===0\)return!0;let (\w+)=(\w+)\[\4\];if\(!\6\)return!1;let \w+=(\w+)\?\.\[\6\];/

export function patchSearchInlineBundle(source) {
  if (source.includes("duKnowledgeAliasIdentity")) return source

  let output = replaceOnce(
    source,
    `index:[{field:"title",tokenize:"forward"}`,
    `index:[{field:"${ALIAS_INDEX_FIELD}",tokenize:"forward"},{field:"title",tokenize:"forward"}`,
    "bundle FlexSearch alias field registration",
  )

  output = replaceOnce(
    output,
    `["title","content","tags"]`,
    `["${ALIAS_INDEX_FIELD}","title","content","tags"]`,
    "bundle field priority fallback",
  )

  output = replaceOnce(
    output,
    `index:["title","content"]`,
    `index:["${ALIAS_INDEX_FIELD}","title","content"]`,
    "bundle query field list",
  )

  // Both index-population call sites: the initial fill and the incremental patch.
  const payloadPattern =
    /(addAsync\(\w+,\{id:\w+,slug:\w+,title:\w+\.title\|\|"",content:\w+\.content\|\|"",tags:(\w+)\.tags\|\|\[\])\}/g
  const payloadMatches = [...output.matchAll(payloadPattern)]
  if (payloadMatches.length !== 2) {
    throw new Error(
      `Knowledge alias patch failed: expected 2 bundle index payloads, found ${payloadMatches.length}`,
    )
  }
  output = output.replace(
    payloadPattern,
    (_match, head, item) => `${head},${ALIAS_INDEX_FIELD}:${item}.${ALIAS_INDEX_FIELD}||[]}`,
  )

  // Exact alias identity is hoisted to rank 0 ahead of the existing tag filter.
  const ranking = output.match(RANKING_PATTERN)
  if (!ranking) {
    throw new Error("Knowledge alias patch failed: bundle ranking anchor is missing")
  }
  const [, fieldPriority, innerParam, getByField, , parsed, , idDataMap, contentData] = ranking
  const head = `[...new Set(${fieldPriority}.flatMap(${innerParam}=>${getByField}(${innerParam})))].filter(`
  const hoisted =
    `(()=>{let duKnowledgeAliasIdentity=duValue=>String(duValue??"").normalize("NFC").trim().toLowerCase();` +
    `let duQuery=duKnowledgeAliasIdentity(${parsed}.query);` +
    `let duAll=[...new Set(${fieldPriority}.flatMap(${innerParam}=>${getByField}(${innerParam})))];` +
    `if(duQuery==="")return duAll;` +
    `let duExact=duAll.filter(duId=>{let duSlug=${idDataMap}[duId];` +
    `let duItem=duSlug?${contentData}?.[duSlug]:null;` +
    `return (duItem?.${ALIAS_INDEX_FIELD}??[]).some(duAlias=>duKnowledgeAliasIdentity(duAlias)===duQuery)});` +
    `return duExact.length>0?[...new Set([...duExact,...duAll])]:duAll})().filter(`

  return replaceOnce(output, head, hoisted, "bundle exact alias identity ranking")
}

async function patchFile(filePath, transform) {
  const before = await readFile(filePath, "utf8")
  const after = transform(before)
  if (after !== before) await writeFile(filePath, after)
  return after !== before
}

export async function applyKnowledgeAliasPatch() {
  const emitterPath = path.join(contentIndexRoot, "src/emitter.ts")
  const contentIndexDist = path.join(contentIndexRoot, "dist/index.js")
  const searchComponentPath = path.join(searchRoot, "src/components/Search.tsx")
  const searchInlinePath = path.join(searchRoot, "src/components/scripts/search.inline.ts")
  const searchDistPaths = [
    path.join(searchRoot, "dist/index.js"),
    path.join(searchRoot, "dist/components/index.js"),
  ]

  await patchFile(emitterPath, patchContentIndexSource)
  await patchFile(contentIndexDist, patchContentIndexDistribution)
  await patchFile(searchComponentPath, patchSearchComponentSource)
  await patchFile(searchInlinePath, patchSearchInlineSource)

  for (const distPath of searchDistPaths) {
    await patchFile(distPath, (source) =>
      patchSearchInlineBundle(patchSearchComponentDistribution(source)),
    )
  }
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (invokedDirectly) {
  await applyKnowledgeAliasPatch()
  console.log("Applied Dev Uni search-only knowledge alias patch")
}
