import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import * as esbuild from "esbuild"
import YAML from "yaml"

const quartzRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const pluginRoot = path.join(quartzRoot, ".quartz/plugins/explorer")
const contentIndexRoot = path.join(quartzRoot, ".quartz/plugins/content-index")
const configPath = path.join(quartzRoot, "quartz.config.default.yaml")
const sourcePath = path.join(pluginRoot, "src/components/scripts/explorer.inline.ts")
const componentPath = path.join(pluginRoot, "src/components/Explorer.tsx")
const contentIndexSourcePath = path.join(contentIndexRoot, "src/emitter.ts")
const contentIndexDistPath = path.join(contentIndexRoot, "dist/index.js")
const distPaths = [
  path.join(pluginRoot, "dist/index.js"),
  path.join(pluginRoot, "dist/components/index.js"),
]

const internalScrollMarker = "DEV_UNI_EXPLORER_INTERNAL_SCROLL"
const preservedTreeMarker = "DEV_UNI_EXPLORER_PRESERVED_TREE"
const rootPathMarker = "DEV_UNI_EXPLORER_ROOT_PATH"
const rootCollapseMarker = "DEV_UNI_EXPLORER_ROOT_COLLAPSE"
const weightMarker = "DEV_UNI_EXPLORER_WEIGHT_ORDER"
const leafLinkMarker = "DEV_UNI_EXPLORER_LEAF_LINK"
const leafOpenMarker = "DEV_UNI_EXPLORER_LEAF_OPEN"
const revealMarker = "DEV_UNI_EXPLORER_REVEAL_ACTIVE"

/**
 * The upstream Explorer has no `rootPath` option: it builds its trie from every
 * contentIndex entry. The site declares one in `quartz.config.default.yaml`, so
 * read it here rather than restating it, and let the patch below be the thing
 * that actually honours it.
 */
async function readExplorerOptions() {
  const config = YAML.parse(await readFile(configPath, "utf8"))
  const explorer = (config?.plugins ?? []).find((plugin) =>
    String(plugin?.source ?? "").endsWith("/explorer"),
  )
  return explorer?.options ?? {}
}

export async function readExplorerRootPath() {
  const rootPath = (await readExplorerOptions())?.rootPath
  if (typeof rootPath !== "string" || rootPath.trim() === "") {
    throw new Error("Explorer patch failed: plugins[].options.rootPath is missing from the config")
  }
  return rootPath.split("/").filter(Boolean)
}

/**
 * Only the lecture and book subtrees keep an intro page worth opening, so the
 * config names them rather than the patch hard-coding a rule about the vault.
 */
export async function readExplorerLeafLinkPaths() {
  const leafLinkPaths = (await readExplorerOptions())?.leafLinkPaths
  if (leafLinkPaths === undefined) return []
  if (!Array.isArray(leafLinkPaths) || leafLinkPaths.some((entry) => typeof entry !== "string")) {
    throw new Error("Explorer patch failed: plugins[].options.leafLinkPaths must be a string list")
  }
  return leafLinkPaths.map((entry) => entry.replace(/^\/+|\/+$/g, "")).filter(Boolean)
}

function replaceOnce(source, before, after, label) {
  if (!source.includes(before)) {
    throw new Error(`Explorer patch failed: ${label} anchor is missing`)
  }
  return source.replace(before, after)
}

async function patchReadableSource(rootSegments, leafLinkPrefixes) {
  let source = await readFile(sourcePath, "utf8")
  if (!source.includes(internalScrollMarker)) {
    source = replaceOnce(
      source,
      `        // restore scrollTop position or scroll to active element
        const scrollTop = sessionStorage.getItem("explorerScrollTop");
        if (scrollTop) {
          explorerUl.scrollTop = parseInt(scrollTop, 10);
        } else {
          const activeElement = explorerUl.querySelector(".active");
          if (activeElement) {
            activeElement.scrollIntoView({ behavior: "smooth" });
          }
        }`,
      `        // ${internalScrollMarker}: keep navigation scroll inside the Explorer rail.
        // Element.scrollIntoView() may scroll the entire document when the rail is sticky.
        const scrollTop = sessionStorage.getItem("explorerScrollTop");
        if (scrollTop !== null) {
          explorerUl.scrollTop = parseInt(scrollTop, 10);
        } else {
          const activeElement = explorerUl.querySelector(".active");
          if (activeElement) {
            requestAnimationFrame(() => {
              const containerRect = explorerUl.getBoundingClientRect();
              const activeRect = activeElement.getBoundingClientRect();
              if (activeRect.top < containerRect.top) {
                explorerUl.scrollTop -= containerRect.top - activeRect.top;
              } else if (activeRect.bottom > containerRect.bottom) {
                explorerUl.scrollTop += activeRect.bottom - containerRect.bottom;
              }
            });
          }
        }`,
      "Explorer-only active item scrolling",
    )
  }

  if (!source.includes(preservedTreeMarker)) {
    const buildFileTrieArguments = source.includes(
      "const trie = await buildFileTrie(dataFns, rootPath);",
    )
      ? "dataFns, rootPath"
      : "dataFns"

    source = replaceOnce(
      source,
      `      // Clear existing content
      explorerUl.innerHTML = '<li class="overflow-end"></li>';

      // Get data functions configuration`,
      `      // ${preservedTreeMarker}: SPA navigation carries the rendered Brain tree forward.
      // Reuse it to preserve open folders and internal scroll without flashing an empty rail.
      const preservedLinks = explorerUl.querySelectorAll("a.nav-file-title");
      const hasPreservedTree = explorerUl.querySelector(".folder-container") !== null;
      if (hasPreservedTree) {
        const normalizedCurrentSlug = currentSlug.replace(/^\\/+|\\/+$/g, "");
        for (const link of preservedLinks) {
          const linkSlug = new URL(link.href, window.location.href).pathname.replace(
            /^\\/+|\\/+$/g,
            "",
          );
          const isActive = linkSlug === normalizedCurrentSlug;
          link.classList.toggle("active", isActive);
          link.classList.toggle("is-active", isActive);
          if (isActive) {
            link.setAttribute("aria-current", "page");
          } else {
            link.removeAttribute("aria-current");
          }
        }
      } else {
        explorerUl.innerHTML = '<li class="overflow-end"></li>';
      }

      // Get data functions configuration`,
      "preserved Explorer tree detection",
    )

    source = replaceOnce(
      source,
      `      // Build and render the tree
      console.log("[Explorer] Starting tree build...");
      const trie = await buildFileTrie(${buildFileTrieArguments});

      // Check if another nav event started while we were fetching
      if (thisGeneration === currentRenderGeneration) {`,
      `      // Build only when the target document did not inherit the rendered tree.
      const trie = hasPreservedTree ? null : await buildFileTrie(${buildFileTrieArguments});

      // Check if another nav event started while we were fetching
      if (!hasPreservedTree && thisGeneration === currentRenderGeneration) {`,
      "skip rebuilding a preserved Explorer tree",
    )

    source = replaceOnce(
      source,
      `      } else {
        console.log("[Explorer] Stale render generation, skipping tree render");
      }

      // Always set up event listeners`,
      `      } else if (!hasPreservedTree) {
        console.log("[Explorer] Stale render generation, skipping tree render");
      } else {
        const scrollTop = sessionStorage.getItem("explorerScrollTop");
        if (scrollTop !== null) explorerUl.scrollTop = parseInt(scrollTop, 10);
      }

      // Always set up event listeners`,
      "restore internal scroll for a preserved Explorer tree",
    )
  }

  if (!source.includes(rootPathMarker)) {
    source = replaceOnce(
      source,
      `// Process and sort nodes
const defaultSortFn = (a, b) => {`,
      `// ${rootPathMarker}: the rail lists the configured root and nothing else.
// contentIndex stays whole, so search, backlinks and the sitemap still see every
// page; only the Explorer's input is narrowed.
const explorerRootSegments = ${JSON.stringify(rootSegments)};
const explorerRootSlug = explorerRootSegments.join("/");

/** True when a nav slug names the rail's own landing page. */
function isExplorerRootSlug(slug) {
  const normalized = String(slug || "")
    .replace(/^\\/+|\\/+$/g, "")
    .replace(/\\/index$/, "");
  return normalized === explorerRootSlug;
}

// Process and sort nodes
const defaultSortFn = (a, b) => {`,
      "Explorer root path constants",
    )

    source = replaceOnce(
      source,
      `    const trie = FileTrieNode.fromEntries(entries);
    console.log("[Explorer] Trie root children:", trie.children.length);`,
      `    const trie = FileTrieNode.fromEntries(entries);

    // Descending into the root node lifts its children to the top level, so the
    // rail does not repeat a "brain" folder underneath the "Brain" heading.
    let rooted = trie;
    for (const segment of explorerRootSegments) {
      rooted = rooted.children.find((child) => child.slugSegment === segment);
      if (!rooted) {
        console.warn("[Explorer] rootPath not found in content index:", explorerRootSlug);
        return null;
      }
    }
    console.log("[Explorer] Trie root children:", rooted.children.length);`,
      "Explorer root path projection",
    )

    source = replaceOnce(
      source,
      "    return processTrie(trie, sortFn, filterFn, mapFn);",
      "    return processTrie(rooted, sortFn, filterFn, mapFn);",
      "Explorer root path projection handoff",
    )
  }

  if (!source.includes(rootCollapseMarker)) {
    // Landing on the rail's own page is a fresh start, so the saved open/closed
    // state is dropped rather than read. Without this the Brain tab reopens
    // whatever was left open, which is what the rail is meant to reset.
    source = replaceOnce(
      source,
      `    const savedState = {};
    try {
      const saved = JSON.parse(localStorage.getItem("fileTree") || "[]");
      saved.forEach((item) => {
        savedState[item.path] = item.collapsed;
      });
    } catch (e) {
      console.error("[Explorer] Error loading saved state:", e);
    }`,
      `    // ${rootCollapseMarker}: the Brain tab always opens a fully collapsed rail.
    const atExplorerRoot = isExplorerRootSlug(currentSlug);
    const savedState = {};
    if (atExplorerRoot) {
      localStorage.removeItem("fileTree");
      sessionStorage.removeItem("explorerScrollTop");
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem("fileTree") || "[]");
        saved.forEach((item) => {
          savedState[item.path] = item.collapsed;
        });
      } catch (e) {
        console.error("[Explorer] Error loading saved state:", e);
      }
    }`,
      "drop saved Explorer state at the rail root",
    )

    // The preserved-tree path skips rendering entirely, so the collapse has to
    // reach the carried-over DOM as well or the Brain tab keeps its open folders.
    source = replaceOnce(
      source,
      `      const preservedLinks = explorerUl.querySelectorAll("a.nav-file-title");
      const hasPreservedTree = explorerUl.querySelector(".folder-container") !== null;`,
      `      const preservedLinks = explorerUl.querySelectorAll("a.nav-file-title");
      const hasPreservedTree = explorerUl.querySelector(".folder-container") !== null;
      if (hasPreservedTree && atExplorerRoot) {
        for (const folderOuter of explorerUl.querySelectorAll(".folder-outer.open")) {
          folderOuter.classList.remove("open");
        }
        explorerUl.scrollTop = 0;
      }`,
      "collapse a preserved Explorer tree at the rail root",
    )
  }

  if (!source.includes(leafLinkMarker)) {
    // A folder title is a button under `folderClickBehavior: collapse`, so the
    // folder's own page is reachable only from the breadcrumb. The books and
    // lectures each keep an intro page there, which nothing in the rail opens.
    // These three edits turn just those folders back into links, and leave the
    // chevron as the collapse control it already is.
    source = replaceOnce(
      source,
      `// Render the file tree
function renderTree(`,
      `// ${leafLinkMarker}: named subtrees whose leaf folders open their own page.
const leafLinkPrefixes = ${JSON.stringify(leafLinkPrefixes)};

/**
 * The folder sitting directly above the leaf files: every child of it is a file.
 * A lecture series or a book is exactly this shape, and its index page is the
 * intro. Folders above it group other folders and have nothing of their own.
 */
function isLeafLinkFolder(node) {
  if (!node || !node.isFolder) return false;
  const children = node.children || [];
  if (children.length === 0 || children.some((child) => child.isFolder)) return false;
  const folderPath = String(node.slug || "").replace(/\\/index$/, "");
  return leafLinkPrefixes.some((prefix) => folderPath.startsWith(prefix + "/"));
}

// Render the file tree
function renderTree(`,
      "leaf-link folder predicate",
    )

    source = replaceOnce(
      source,
      '    if (folderBehavior === "link" && folderButton) {',
      '    if ((folderBehavior === "link" || isLeafLinkFolder(node)) && folderButton) {',
      "render leaf-link folders as anchors",
    )

    source = replaceOnce(
      source,
      `        const buttonClickHandler = function (evt) {
          const folderContainer = this.closest(".folder-container");
          if (!folderContainer) return;

          const folderBehavior = explorer.dataset.behavior || "collapse";`,
      `        const buttonClickHandler = function (evt) {
          const folderContainer = this.closest(".folder-container");
          if (!folderContainer) return;

          // A leaf folder was rendered as an anchor even though the rail's global
          // behaviour is "collapse", so the element itself decides, not the rail.
          const folderBehavior =
            this.tagName === "A" ? "link" : explorer.dataset.behavior || "collapse";`,
      "let a leaf-link anchor navigate",
    )
  }

  if (!source.includes(leafOpenMarker)) {
    // Reaching a lecture's intro cost two clicks: the title to open the page and
    // the chevron to see what is inside. One click now does both.
    source = replaceOnce(
      source,
      `          if (folderBehavior === "link") {
            // When folderBehavior is "link", the <button> has been replaced with an <a> tag
            // that has the correct absolute href (e.g. "/features/"). Let the <a> tag's
            // native click propagate to the SPA router — don't navigate imperatively here,
            // as that would use a relative URL and break SPA navigation.
            return;`,
      `          if (folderBehavior === "link") {
            // ${leafOpenMarker}: the title opens the folder on the way to its page.
            // It only opens, never closes, so a second click still lands on the page
            // rather than hiding what it just revealed. The chevron closes.
            if (childFolderContainer && !childFolderContainer.classList.contains("open")) {
              childFolderContainer.classList.add("open");
              const savedState = JSON.parse(localStorage.getItem("fileTree") || "[]");
              const existingIndex = savedState.findIndex((item) => item.path === folderPath);
              if (existingIndex >= 0) {
                savedState[existingIndex].collapsed = false;
              } else {
                savedState.push({ path: folderPath, collapsed: false });
              }
              localStorage.setItem("fileTree", JSON.stringify(savedState));
            }
            // The <a> carries the correct absolute href, so let its native click reach
            // the SPA router. Navigating here would use a relative URL and break it.
            return;`,
      "open a leaf-link folder on the way to its page",
    )
  }

  if (!source.includes(revealMarker)) {
    // 넘겨받은 트리는 떠나온 페이지의 펼침 상태 그대로다. 도착한 문서가 닫힌 폴더
    // 안에 있으면 활성 표시가 어디에도 안 보인다. 조상 폴더를 열어 자리를 드러낸다.
    // 저장은 하지 않는다. localStorage는 사용자가 직접 접었다 편 것만 담는다.
    //
    // 펼친 뒤 레일 안에서 자리를 맞추는 일은 한 프레임 뒤에 되지 않는다. 트리 교체가
    // 몇십 밀리초에 걸쳐 끝나서, 프레임 하나만 기다리면 아직 짧은 트리를 재고 "이미
    // 보인다"고 판단해 버린다. 그래서 몇 번에 나눠 확인한다. 이미 보이면 아무것도
    // 하지 않으므로 여러 번 불러도 결과는 같다.
    source = replaceOnce(
      source,
      `      if (hasPreservedTree) {
        const normalizedCurrentSlug = currentSlug.replace(/^\\/+|\\/+$/g, "");
        for (const link of preservedLinks) {`,
      `      if (hasPreservedTree && !atExplorerRoot) {
        // ${revealMarker}: 도착한 문서가 든 폴더를 펼쳐 자리를 보여준다.
        const revealSlug = currentSlug.replace(/^\\/+|\\/+$/g, "");
        for (const folderContainer of explorerUl.querySelectorAll(".folder-container")) {
          const folderPath = String(folderContainer.dataset.folderpath || "")
            .replace(/^\\/+|\\/+$/g, "")
            .replace(/\\/index$/, "");
          if (!folderPath) continue;
          if (revealSlug === folderPath || revealSlug.startsWith(folderPath + "/")) {
            folderContainer.nextElementSibling?.classList.add("open");
          }
        }

        const keepRevealedInView = () => {
          const revealed = explorerUl.querySelector(".nav-file-title.active");
          if (!revealed) return;
          const containerRect = explorerUl.getBoundingClientRect();
          const activeRect = revealed.getBoundingClientRect();
          if (activeRect.top < containerRect.top) {
            explorerUl.scrollTop -= containerRect.top - activeRect.top;
          } else if (activeRect.bottom > containerRect.bottom) {
            explorerUl.scrollTop += activeRect.bottom - containerRect.bottom;
          }
        };
        requestAnimationFrame(keepRevealedInView);
        for (const wait of [120, 320, 600]) {
          const timer = window.setTimeout(keepRevealedInView, wait);
          window.addCleanup(() => window.clearTimeout(timer));
        }
      }

      if (hasPreservedTree) {
        const normalizedCurrentSlug = currentSlug.replace(/^\\/+|\\/+$/g, "");
        for (const link of preservedLinks) {`,
      "reveal the active document in a preserved tree",
    )
  }

  await writeFile(sourcePath, source)
  return source
}

/**
 * `weight` frontmatter has ordered this vault since its Hugo days, but Quartz
 * reads no such key: the Explorer sorts by display name and `weight` sits in 165
 * documents doing nothing. These two patches make it real. The emitter carries
 * the number into `contentIndex.json`, and the Explorer's default comparator
 * reads it from the node the trie already holds.
 */
async function patchContentIndexWeight() {
  for (const [file, isSource] of [
    [contentIndexSourcePath, true],
    [contentIndexDistPath, false],
  ]) {
    let source = await readFile(file, "utf8")
    if (source.includes(weightMarker)) continue

    if (isSource) {
      source = replaceOnce(
        source,
        `  tags: string[];
  content: string;`,
        `  tags: string[];
  /** ${weightMarker}: explicit rail ordering. Absent when the document sets none. */
  weight?: number;
  content: string;`,
        "ContentDetails weight field",
      )
      source = replaceOnce(
        source,
        `          tags: (frontmatter.tags as string[] | undefined) ?? [],`,
        `          tags: (frontmatter.tags as string[] | undefined) ?? [],
          weight: readOrderWeight(frontmatter),`,
        "ContentIndex weight emission",
      )
      source = replaceOnce(
        source,
        `export const ContentIndex: QuartzEmitterPlugin<Partial<Options>> = (opts) => {`,
        `// ${weightMarker}
// Accepts a number or a numeric string, since the vault writes both. Anything
// else is treated as absent rather than coerced, so a typo cannot silently
// reorder the rail.
export function readOrderWeight(frontmatter: Record<string, unknown>): number | undefined {
  const raw = frontmatter["weight"];
  const value = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export const ContentIndex: QuartzEmitterPlugin<Partial<Options>> = (opts) => {`,
        "ContentIndex weight reader",
      )
    } else {
      source = replaceOnce(
        source,
        `          tags: frontmatter.tags ?? [],`,
        `          tags: frontmatter.tags ?? [],
          weight: /* ${weightMarker} */ (() => {
            const raw = frontmatter["weight"];
            const value = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;
            return typeof value === "number" && Number.isFinite(value) ? value : void 0;
          })(),`,
        "ContentIndex weight emission (bundle)",
      )
    }

    await writeFile(file, source)
  }
}

/**
 * The comparator that actually runs is `defaultOptions.sortFn` from the compiled
 * component: it is stringified into a data attribute and rebuilt with `new
 * Function`, so it has to stay self-contained. Patch the readable source for the
 * next reader and both bundles for the running site.
 */
async function patchExplorerSort() {
  const edits = [
    [
      componentPath,
      `  sortFn: (a: FileTrieNode, b: FileTrieNode) => {
    if ((!a.isFolder && !b.isFolder) || (a.isFolder && b.isFolder)) {
      return (a.displayName || "").localeCompare(b.displayName || "", undefined, {
        numeric: true,
        sensitivity: "base",
      });
    }

    if (!a.isFolder && b.isFolder) {
      return 1;
    }
    return -1;
  },`,
      `  sortFn: (a: FileTrieNode, b: FileTrieNode) => {
    // ${weightMarker}: \`weight\` frontmatter decides the order and the display
    // name is only the tiebreak. A document without a weight sorts after every
    // weighted sibling, so adding a weight is what moves an entry and no entry
    // moves because a neighbour gained one. Folders still lead files.
    if (a.isFolder !== b.isFolder) {
      return a.isFolder ? -1 : 1;
    }
    const aw = typeof a.data?.weight === "number" ? a.data.weight : Number.MAX_SAFE_INTEGER;
    const bw = typeof b.data?.weight === "number" ? b.data.weight : Number.MAX_SAFE_INTEGER;
    if (aw !== bw) {
      return aw - bw;
    }
    return (a.displayName || "").localeCompare(b.displayName || "", undefined, {
      numeric: true,
      sensitivity: "base",
    });
  },`,
    ],
    ...distPaths.map((distPath) => [
      distPath,
      `  sortFn: (a2, b2) => {
    if (!a2.isFolder && !b2.isFolder || a2.isFolder && b2.isFolder) {
      return (a2.displayName || "").localeCompare(b2.displayName || "", void 0, {
        numeric: true,
        sensitivity: "base"
      });
    }
    if (!a2.isFolder && b2.isFolder) {
      return 1;
    }
    return -1;
  },`,
      `  sortFn: (a2, b2) => {
    if (a2.isFolder !== b2.isFolder) {
      return a2.isFolder ? -1 : 1;
    }
    const aw = typeof a2.data?.weight === "number" ? a2.data.weight : Number.MAX_SAFE_INTEGER;
    const bw = typeof b2.data?.weight === "number" ? b2.data.weight : Number.MAX_SAFE_INTEGER;
    if (aw !== bw) {
      return aw - bw;
    }
    return (a2.displayName || "").localeCompare(b2.displayName || "", void 0, {
      numeric: true,
      sensitivity: "base"
    });
  },`,
    ]),
  ]

  for (const [file, before, after] of edits) {
    const source = await readFile(file, "utf8")
    if (source.includes(weightMarker) && file === componentPath) continue
    if (!source.includes(before)) {
      if (source.includes("Number.MAX_SAFE_INTEGER")) continue
      throw new Error(`Explorer patch failed: weight comparator anchor is missing in ${file}`)
    }
    await writeFile(file, source.replace(before, after))
  }
}

async function compileInlineScript() {
  const result = await esbuild.build({
    absWorkingDir: pluginRoot,
    entryPoints: [sourcePath],
    write: false,
    bundle: true,
    minify: true,
    platform: "browser",
    format: "esm",
    target: "es2020",
    sourcemap: false,
    external: ["http://*", "https://*"],
  })
  const javascript = result.outputFiles?.[0]?.text
  if (!javascript) throw new Error("Explorer patch failed: esbuild emitted no inline script")
  return javascript
}

async function patchDistribution(inlineScript) {
  for (const distPath of distPaths) {
    const source = await readFile(distPath, "utf8")
    const assignment = "var explorer_inline_default = "
    const assignmentStart = source.indexOf(assignment)
    if (assignmentStart === -1) {
      throw new Error(`Explorer patch failed: inline bundle anchor is missing in ${distPath}`)
    }

    const valueStart = assignmentStart + assignment.length
    const quote = source[valueStart]
    if (quote !== '"' && quote !== "`") {
      throw new Error(`Explorer patch failed: inline bundle quote is invalid in ${distPath}`)
    }

    let valueEnd = -1
    for (let index = valueStart + 1; index < source.length; index += 1) {
      if (source[index] !== quote) continue
      let slashCount = 0
      for (let cursor = index - 1; cursor >= valueStart && source[cursor] === "\\"; cursor -= 1) {
        slashCount += 1
      }
      if (slashCount % 2 === 0) {
        valueEnd = index + 1
        break
      }
    }
    if (valueEnd === -1) {
      throw new Error(`Explorer patch failed: inline bundle terminator is missing in ${distPath}`)
    }

    const semicolonEnd = source[valueEnd] === ";" ? valueEnd + 1 : valueEnd
    const patched =
      source.slice(0, assignmentStart) +
      `${assignment}${JSON.stringify(inlineScript)};` +
      source.slice(semicolonEnd)
    await writeFile(distPath, patched)
  }
}

const rootSegments = await readExplorerRootPath()
const leafLinkPrefixes = await readExplorerLeafLinkPaths()
await patchReadableSource(rootSegments, leafLinkPrefixes)
await patchDistribution(await compileInlineScript())
await patchExplorerSort()
await patchContentIndexWeight()
console.log(
  `Applied Dev Uni Explorer SPA-preservation, rootPath, weight-order and leaf-link patch ` +
    `(rootPath: ${rootSegments.join("/")}, leafLinkPaths: ${leafLinkPrefixes.join(", ") || "none"})`,
)
