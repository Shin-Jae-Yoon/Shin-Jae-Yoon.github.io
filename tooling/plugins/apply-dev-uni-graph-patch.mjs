import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import * as esbuild from "esbuild"

import { KNOWLEDGE_HUB_SLUG, PROJECTOR_SOURCE } from "./graph-projector.mjs"

const quartzRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const pluginRoot = path.join(quartzRoot, ".quartz/plugins/graph")
const sourcePath = path.join(pluginRoot, "src/components/scripts/graph.inline.ts")
const componentSourcePath = path.join(pluginRoot, "src/components/Graph.tsx")
const distPaths = [
  path.join(pluginRoot, "dist/index.js"),
  path.join(pluginRoot, "dist/components/index.js"),
]

// Visual contract: current Brain note, directly related Brain note,
// and unrelated Brain note are three stable, explained graph states.
const marker = "DEV_UNI_GRAPH_DEPTH_STATES"
const centerMarker = "DEV_UNI_GRAPH_CENTER_ANCHOR"
const portalMarker = "DEV_UNI_GRAPH_VIEWPORT_PORTAL"
const hubMarker = "DEV_UNI_GRAPH_BRAIN_HUB"
const landingMarker = "DEV_UNI_GRAPH_INDEX_LANDING"
const projectorMarker = "DEV_UNI_GRAPH_KNOWLEDGE_PROJECTOR"
const spaMarker = "DEV_UNI_GRAPH_SPA_NAVIGATION"

// The projector runs inside `renderGraph`, so its ES5 source is indented to the
// surrounding function body before injection.
const indentedProjectorSource = PROJECTOR_SOURCE.split("\n")
  .map((line) => (line.length === 0 ? line : `      ${line}`))
  .join("\n")

function replaceOnce(source, before, after, label) {
  if (!source.includes(before)) {
    throw new Error(`Graph patch failed: ${label} anchor is missing`)
  }
  return source.replace(before, after)
}

function replaceOneOf(source, candidates, after, label) {
  const before = candidates.find((candidate) => source.includes(candidate))
  if (!before) {
    throw new Error(`Graph patch failed: ${label} anchor is missing`)
  }
  return source.replace(before, after)
}

async function patchReadableSource() {
  let source = await readFile(sourcePath, "utf8")
  if (!source.includes(marker)) {
    source = replaceOnce(
      source,
      `      var bodyFont = styles.getPropertyValue("--bodyFont").trim() || "inherit";

      var app = new PIXI.Application();`,
      `      var bodyFont = styles.getPropertyValue("--bodyFont").trim() || "inherit";
      var graphCurrent = resolveColor(
        styles.getPropertyValue("--du-graph-current").trim(),
        dark,
      );
      var graphRelated = resolveColor(
        styles.getPropertyValue("--du-graph-related").trim(),
        tertiary,
      );
      var graphUnrelated = resolveColor(
        styles.getPropertyValue("--du-graph-unrelated").trim(),
        gray,
      );

      var app = new PIXI.Application();`,
      "Dev Uni graph color tokens",
    )

    source = replaceOneOf(
      source,
      [
        `      function nodeRadius(d) {
        var numLinks = 0;
        for (var i = 0; i < graphLinks.length; i++) {
          if (graphLinks[i].source.id === d.id || graphLinks[i].target.id === d.id) {
            numLinks++;
          }
        }
        return 2 + Math.sqrt(numLinks);
      }

      function nodeColor(d) {
        var isCurrent = d.id === slug;
        if (isCurrent) {
          return secondary;
        } else {
          return gray;
        }
      }`,
        `      function nodeRadius(d) {
        var numLinks = 0;
        for (var i = 0; i < graphLinks.length; i++) {
          if (graphLinks[i].source.id === d.id || graphLinks[i].target.id === d.id) {
            numLinks++;
          }
        }
        return 2 + Math.sqrt(numLinks);
      }

      function nodeColor(d) {
        var isCurrent = d.id === slug;
        if (isCurrent) {
          return secondary;
        } else if (visited.has(d.id) || d.id.startsWith("tags/")) {
          return tertiary;
        } else {
          return gray;
        }
      }`,
      ],
      `      // ${marker}: preserve three relationship depths without visit-history colors.
      function isDirectlyRelated(nodeId) {
        for (var i = 0; i < graphLinks.length; i++) {
          var link = graphLinks[i];
          if (
            (link.source.id === slug && link.target.id === nodeId) ||
            (link.target.id === slug && link.source.id === nodeId)
          ) {
            return true;
          }
        }
        return false;
      }

      function nodeRadius(d) {
        var numLinks = 0;
        for (var i = 0; i < graphLinks.length; i++) {
          if (graphLinks[i].source.id === d.id || graphLinks[i].target.id === d.id) {
            numLinks++;
          }
        }
        var baseRadius = 2 + Math.sqrt(numLinks);
        if (d.id === slug) return baseRadius + 3;
        if (isDirectlyRelated(d.id)) return baseRadius + 1;
        return baseRadius;
      }

      function nodeColor(d) {
        if (d.id === slug) return graphCurrent;
        if (isDirectlyRelated(d.id)) return graphRelated;
        return graphUnrelated;
      }`,
      "node relationship state",
    )

    source = replaceOnce(
      source,
      `          var alpha = 1;
          if (hoveredNodeId !== null) {
            alpha = linkData.active ? 1 : 0.2;
          }
          linkData.alpha = alpha;
          linkData.color = linkData.active ? gray : lightgray;`,
      `          var touchesCurrent =
            linkData.simulationData.source.id === slug ||
            linkData.simulationData.target.id === slug;
          var alpha = touchesCurrent ? 0.95 : 0.45;
          if (hoveredNodeId !== null) {
            alpha = linkData.active ? 1 : 0.12;
          }
          linkData.alpha = alpha;
          linkData.color = linkData.active
            ? graphCurrent
            : touchesCurrent
              ? graphRelated
              : lightgray;`,
      "relationship link emphasis",
    )

    source = replaceOnce(
      source,
      `          if (hoveredNodeId === nodeData.simulationData.id) {
            nodeData.label.alpha = 1;
            nodeData.label.scale.set(activeScale);
          } else {
            nodeData.label.scale.set(defaultScale);
          }`,
      `          if (
            hoveredNodeId === nodeData.simulationData.id ||
            nodeData.simulationData.id === slug
          ) {
            nodeData.label.alpha = 1;
            nodeData.label.scale.set(activeScale);
          } else {
            nodeData.label.scale.set(defaultScale);
          }`,
      "persistent current label",
    )

    source = replaceOnce(
      source,
      `        label.alpha = 0;
        label.scale.set(1 / scale);`,
      `        label.alpha = nodeId === slug ? 1 : 0;
        label.scale.set(nodeId === slug ? 1.1 / scale : 1 / scale);`,
      "initial current label",
    )

    source = replaceOnce(
      source,
      `        if (isTagNode) {
          gfx.stroke({ width: 2, color: tertiary });
        }`,
      `        if (isTagNode || nodeId === slug) {
          gfx.stroke({ width: nodeId === slug ? 2.5 : 2, color: graphRelated });
        }`,
      "current node ring",
    )

    source = replaceOnce(
      source,
      `            if (nodeRenderData[i].active) {
              activeLabels.push(nodeRenderData[i].label);
            }`,
      `            if (
              nodeRenderData[i].active ||
              nodeRenderData[i].simulationData.id === slug
            ) {
              activeLabels.push(nodeRenderData[i].label);
            }`,
      "zoom current label",
    )
  }

  if (!source.includes(centerMarker)) {
    source = replaceOnce(
      source,
      `      var width = graph.offsetWidth;
      var height = Math.max(graph.offsetHeight, 250);`,
      `      var width = graph.offsetWidth;
      var height = Math.max(graph.offsetHeight, 250);
      var isGlobalGraph = graph.classList.contains("global-graph-container");`,
      "global graph detection",
    )

    source = replaceOnce(
      source,
      `      var styles = getComputedStyle(document.documentElement);`,
      `      // ${centerMarker}: keep the current note as the visual origin
      // in the expanded graph while allowing the surrounding network to settle naturally.
      var currentNode = nodeMap.get(slug);
      if (currentNode && isGlobalGraph) {
        currentNode.x = 0;
        currentNode.y = 0;
        currentNode.fx = 0;
        currentNode.fy = 0;
      }

      var styles = getComputedStyle(document.documentElement);`,
      "expanded graph center anchor",
    )

    source = replaceOnce(
      source,
      `        if (d.id === slug) return baseRadius + 3;`,
      `        if (d.id === slug) return isGlobalGraph ? Math.max(baseRadius + 3, 11) : baseRadius + 3;`,
      "expanded current node radius",
    )

    source = replaceOnce(
      source,
      `          event.subject.fx = null;
          event.subject.fy = null;`,
      `          if (isGlobalGraph && event.subject.id === slug) {
            event.subject.fx = 0;
            event.subject.fy = 0;
          } else {
            event.subject.fx = null;
            event.subject.fy = null;
          }`,
      "current node drag anchor",
    )

    source = replaceOnce(
      source,
      `    function hideGlobalGraph() {
      cleanupGlobal();`,
      `    function hideGlobalGraph() {
      cleanupGlobal();
      document.documentElement.classList.remove("dev-uni-global-graph-open");`,
      "global graph close state",
    )

    source = replaceOnce(
      source,
      `    function showGlobalGraph() {
      cleanupGlobal();`,
      `    function showGlobalGraph() {
      cleanupGlobal();
      document.documentElement.classList.add("dev-uni-global-graph-open");`,
      "global graph open state",
    )
  }

  if (!source.includes(portalMarker)) {
    source = replaceOnce(
      source,
      `      for (var i = 0; i < globalContainers.length; i++) {
        globalContainers[i].classList.remove("active");
        var sidebar = globalContainers[i].closest(".sidebar");`,
      `      for (var i = 0; i < globalContainers.length; i++) {
        var container = globalContainers[i];
        container.classList.remove("active");
        var home = container.__devUniGraphHome;
        if (home && home.parent && home.parent.isConnected) {
          var anchor = home.nextSibling;
          home.parent.insertBefore(
            container,
            anchor && anchor.parentNode === home.parent ? anchor : null,
          );
        }
        delete container.__devUniGraphHome;
        var sidebar = container.closest(".sidebar");`,
      "global graph portal restoration",
    )

    source = replaceOnce(
      source,
      `      for (var i = 0; i < globalContainers.length; i++) {
        var container = globalContainers[i];
        container.classList.add("active");`,
      `      for (var i = 0; i < globalContainers.length; i++) {
        var container = globalContainers[i];
        // ${portalMarker}: escape sticky sidebar clipping while expanded.
        if (!container.__devUniGraphHome) {
          container.__devUniGraphHome = {
            parent: container.parentNode,
            nextSibling: container.nextSibling,
          };
        }
        document.body.appendChild(container);
        container.classList.add("active");`,
      "global graph viewport portal",
    )
  }

  if (!source.includes(hubMarker)) {
    source = replaceOnce(
      source,
      `      var width = graph.offsetWidth;
      var height = Math.max(graph.offsetHeight, 250);
      var isGlobalGraph = graph.classList.contains("global-graph-container");`,
      `      var width = graph.offsetWidth;
      var height = Math.max(graph.offsetHeight, 250);
      var isGlobalGraph = graph.classList.contains("global-graph-container");
      var brainHubSlug = "brain";`,
      "Brain hub slug",
    )

    source = replaceOnce(
      source,
      `      var neighbourhood = new Set();`,
      `      // ${hubMarker}: the expanded graph gets one visual-only Brain hub.
      // Markdown links and backlinks remain untouched, while the global canvas
      // gains the dense radial composition of a single connected knowledge base.
      if (isGlobalGraph && validLinks.has(brainHubSlug)) {
        validLinks.forEach(function (noteSlug) {
          if (noteSlug === brainHubSlug) return;
          var alreadyLinked = links.some(function (link) {
            return (
              (link.source === brainHubSlug && link.target === noteSlug) ||
              (link.target === brainHubSlug && link.source === noteSlug)
            );
          });
          if (!alreadyLinked) {
            links.push({ source: brainHubSlug, target: noteSlug, syntheticHub: true });
          }
        });
      }

      var neighbourhood = new Set();`,
      "expanded Brain hub links",
    )

    source = replaceOnce(
      source,
      `      var validLinks = new Set(data.keys());`,
      `      var validLinks = new Set(data.keys());
      if (!validLinks.has(brainHubSlug)) {
        var brainHubCandidates = ["brain/", "brain/index"];
        for (var candidateIndex = 0; candidateIndex < brainHubCandidates.length; candidateIndex++) {
          if (validLinks.has(brainHubCandidates[candidateIndex])) {
            brainHubSlug = brainHubCandidates[candidateIndex];
            break;
          }
        }
      }`,
      "Brain hub index slug fallback",
    )

    source = replaceOnce(
      source,
      `      var currentNode = nodeMap.get(slug);
      if (currentNode && isGlobalGraph) {
        currentNode.x = 0;
        currentNode.y = 0;
        currentNode.fx = 0;
        currentNode.fy = 0;
      }`,
      `      var currentNode = nodeMap.get(slug);
      var brainHubNode = nodeMap.get(brainHubSlug);
      var centerNode = isGlobalGraph ? brainHubNode || currentNode : currentNode;
      if (centerNode && isGlobalGraph) {
        centerNode.x = 0;
        centerNode.y = 0;
        centerNode.fx = 0;
        centerNode.fy = 0;
      }`,
      "expanded Brain hub center anchor",
    )

    source = replaceOnce(
      source,
      `            graphLinks.push({ source: sourceNode, target: targetNode });`,
      `            graphLinks.push({
              source: sourceNode,
              target: targetNode,
              syntheticHub: link.syntheticHub === true,
            });`,
      "Brain hub link metadata",
    )

    source = replaceOnce(
      source,
      `        if (d.id === slug) return isGlobalGraph ? Math.max(baseRadius + 3, 11) : baseRadius + 3;`,
      `        if (isGlobalGraph && d.id === brainHubSlug) return Math.max(baseRadius + 4, 16);
        if (d.id === slug) return isGlobalGraph ? Math.max(baseRadius + 2, 8) : baseRadius + 3;`,
      "Brain hub radius",
    )

    source = replaceOnce(
      source,
      `          var alpha = touchesCurrent ? 0.95 : 0.45;`,
      `          var isHubLink = linkData.simulationData.syntheticHub === true;
          var alpha = touchesCurrent ? 0.95 : isHubLink ? 0.32 : 0.45;`,
      "Brain hub link opacity",
    )

    source = replaceOnce(
      source,
      `            : touchesCurrent
              ? graphRelated
              : lightgray;`,
      `            : touchesCurrent
              ? graphRelated
              : isHubLink
                ? gray
                : lightgray;`,
      "Brain hub link color",
    )

    source = replaceOnce(
      source,
      `        label.alpha = nodeId === slug ? 1 : 0;
        label.scale.set(nodeId === slug ? 1.1 / scale : 1 / scale);`,
      `        var isBrainHub = isGlobalGraph && nodeId === brainHubSlug;
        label.alpha = nodeId === slug || isBrainHub ? 1 : 0;
        label.scale.set(nodeId === slug || isBrainHub ? 1.1 / scale : 1 / scale);`,
      "Brain hub label",
    )

    source = replaceOnce(
      source,
      `        if (isTagNode || nodeId === slug) {
          gfx.stroke({ width: nodeId === slug ? 2.5 : 2, color: graphRelated });
        }`,
      `        if (isTagNode || nodeId === slug || isBrainHub) {
          gfx.stroke({ width: nodeId === slug || isBrainHub ? 2.5 : 2, color: graphRelated });
        }`,
      "Brain hub outline",
    )

    source = replaceOnce(
      source,
      `          if (isGlobalGraph && event.subject.id === slug) {`,
      `          if (isGlobalGraph && event.subject.id === brainHubSlug) {`,
      "Brain hub drag anchor",
    )
  }

  if (!source.includes(projectorMarker)) {
    source = replaceOnce(
      source,
      `      var links = [];
      var allTags = [];`,
      `      // ${projectorMarker}: the renderer draws the knowledge base and nothing else.
      // The full contentIndex stays intact for search and backlinks; only the graph's
      // input is narrowed, to brain/knowledge nodes and edges whose two endpoints are
      // both such nodes. Tags are stripped with it, since a tag shared with a source
      // note would otherwise reintroduce that note as a neighbour.
${indentedProjectorSource}

      data = projectKnowledgeGraph(data);
      showTags = false;
      brainHubSlug = ${JSON.stringify(KNOWLEDGE_HUB_SLUG)};

      if (data.size === 0 || (!isGlobalGraph && !isKnowledgeSlug(slug))) {
        var graphBlock = graph.closest(".graph") || graph.closest(".global-graph-outer");
        if (graphBlock) graphBlock.style.display = "none";
        return function () {};
      }

      var links = [];
      var allTags = [];`,
      "knowledge graph projector",
    )
  }

  if (!source.includes(spaMarker)) {
    // `window.location.href`는 전체 페이지 로드다. 그러면 노트 탐색 트리가 버려지고
    // 처음부터 다시 그려진다. 라우터를 거치면 렌더된 트리가 그대로 넘어가서 펼친
    // 폴더와 레일 스크롤이 유지된다. 라우터가 없을 때만 예전 방식으로 떨어진다.
    source = replaceOnce(
      source,
      `      var app = new PIXI.Application();`,
      `      // ${spaMarker}: 노드 클릭도 본문 링크와 같은 길로 보낸다.
      var devUniGo = function (target) {
        try {
          if (typeof window.spaNavigate === "function") {
            window.spaNavigate(new URL(target, window.location.toString()));
            return;
          }
        } catch (error) {
          console.warn("[Graph] SPA navigation failed, falling back", error);
        }
        window.location.href = target;
      };

      var app = new PIXI.Application();`,
      "graph SPA navigation helper",
    )

    source = replaceOnce(
      source,
      `          if (Date.now() - dragStartTime < 500) {
            var target = resolveBasePath(event.subject.id);
            window.location.href = target;
          }`,
      `          if (Date.now() - dragStartTime < 500) {
            devUniGo(resolveBasePath(event.subject.id));
          }`,
      "graph drag-click navigation",
    )

    source = replaceOnce(
      source,
      `            nodeData.gfx.on("click", function () {
              var target = resolveBasePath(nodeData.simulationData.id);
              window.location.href = target;
            });`,
      `            nodeData.gfx.on("click", function () {
              devUniGo(resolveBasePath(nodeData.simulationData.id));
            });`,
      "graph node click navigation",
    )
  }

  await writeFile(sourcePath, source)
  return source
}

async function patchGraphComponentSource() {
  let source = await readFile(componentSourcePath, "utf8")
  source = source.replace(
    `  const Graph: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {`,
    `  const Graph: QuartzComponent = ({ displayClass, cfg, fileData }: QuartzComponentProps) => {`,
  )
  if (source.includes(landingMarker)) {
    await writeFile(componentSourcePath, source)
    return
  }

  if (source.includes('const isBrainIndex = fileData.slug === "brain/index";')) {
    source = replaceOnce(
      source,
      '    const isBrainIndex = fileData.slug === "brain/index";',
      `    // ${landingMarker}: render the Brain index as a full knowledge-map landing page.
    const isBrainIndex = fileData.slug === "brain/index";`,
      "Brain index landing marker",
    )
    await writeFile(componentSourcePath, source)
    return
  }

  source = replaceOnce(
    source,
    `    const globalGraph = { ...defaultOptions.globalGraph, ...userOpts?.globalGraph };

    return (`,
    `    const globalGraph = { ...defaultOptions.globalGraph, ...userOpts?.globalGraph };
    // ${landingMarker}: render the Brain index as a full knowledge-map landing page.
    const isBrainIndex = fileData.slug === "brain/index";
    const graphClasses = classNames(
      displayClass,
      "graph",
      isBrainIndex ? "dev-uni-brain-index-graph" : "",
    );

    return (`,
    "Brain index graph state",
  )
  source = replaceOnce(
    source,
    `<div class={classNames(displayClass, "graph")}>`,
    `<div class={graphClasses}>`,
    "Brain index graph class",
  )
  source = replaceOnce(
    source,
    `<h3>{i18n(cfg.locale ?? "en-US").components.graph.title}</h3>`,
    `<h3>
          {isBrainIndex
            ? "전체 두뇌 연결"
            : i18n(cfg.locale ?? "en-US").components.graph.title}
        </h3>`,
    "Brain index graph heading",
  )
  source = replaceOnce(
    source,
    `<div class="graph-container" data-cfg={JSON.stringify(localGraph)}></div>`,
    `<div
            class={isBrainIndex ? "graph-container global-graph-container" : "graph-container"}
            data-cfg={JSON.stringify(isBrainIndex ? globalGraph : localGraph)}
          ></div>`,
    "Brain index global graph container",
  )
  source = replaceOnce(
    source,
    `          <button class="global-graph-icon" aria-label="Global Graph">`,
    `          {!isBrainIndex && (
            <button class="global-graph-icon" aria-label="Global Graph">`,
    "Brain index global graph button guard",
  )
  source = replaceOnce(
    source,
    `          </button>
        </div>
        <div class="global-graph-outer">`,
    `            </button>
          )}
        </div>
        {!isBrainIndex && (
          <div class="global-graph-outer">`,
    "Brain index global graph modal guard",
  )
  source = replaceOnce(
    source,
    `        </div>
      </div>
    );`,
    `          </div>
        )}
      </div>
    );`,
    "Brain index global graph modal closing guard",
  )

  await writeFile(componentSourcePath, source)
}

async function patchGraphComponentDistribution() {
  for (const distPath of distPaths) {
    let source = await readFile(distPath, "utf8")
    source = source.replace(
      `  const Graph = ({ displayClass, cfg }) => {`,
      `  const Graph = ({ displayClass, cfg, fileData }) => {`,
    )
    if (source.includes('const isBrainIndex = fileData.slug === "brain/index";')) {
      await writeFile(distPath, source)
      continue
    }

    source = replaceOnce(
      source,
      `    const globalGraph = { ...defaultOptions.globalGraph, ...userOpts?.globalGraph };
    return /* @__PURE__ */ u2("div", { class: classNames(displayClass, "graph"), children: [`,
      `    const globalGraph = { ...defaultOptions.globalGraph, ...userOpts?.globalGraph };
    const isBrainIndex = fileData.slug === "brain/index";
    const graphClasses = classNames(
      displayClass,
      "graph",
      isBrainIndex ? "dev-uni-brain-index-graph" : ""
    );
    return /* @__PURE__ */ u2("div", { class: graphClasses, children: [`,
      `Brain index distribution state in ${distPath}`,
    )
    source = replaceOnce(
      source,
      `      /* @__PURE__ */ u2("h3", { children: i18n(cfg.locale ?? "en-US").components.graph.title }),`,
      `      /* @__PURE__ */ u2("h3", { children: isBrainIndex ? "\\uC804\\uCCB4 \\uB450\\uB1CC \\uC5F0\\uACB0" : i18n(cfg.locale ?? "en-US").components.graph.title }),`,
      `Brain index distribution heading in ${distPath}`,
    )
    source = replaceOnce(
      source,
      `        /* @__PURE__ */ u2("div", { class: "graph-container", "data-cfg": JSON.stringify(localGraph) }),`,
      `        /* @__PURE__ */ u2("div", { class: isBrainIndex ? "graph-container global-graph-container" : "graph-container", "data-cfg": JSON.stringify(isBrainIndex ? globalGraph : localGraph) }),`,
      `Brain index distribution graph container in ${distPath}`,
    )
    source = replaceOnce(
      source,
      `        /* @__PURE__ */ u2("button", { class: "global-graph-icon", "aria-label": "Global Graph", children:`,
      `        !isBrainIndex && /* @__PURE__ */ u2("button", { class: "global-graph-icon", "aria-label": "Global Graph", children:`,
      `Brain index distribution button guard in ${distPath}`,
    )
    source = replaceOnce(
      source,
      `      /* @__PURE__ */ u2("div", { class: "global-graph-outer", children:`,
      `      !isBrainIndex && /* @__PURE__ */ u2("div", { class: "global-graph-outer", children:`,
      `Brain index distribution modal guard in ${distPath}`,
    )
    await writeFile(distPath, source)
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
  if (!javascript) throw new Error("Graph patch failed: esbuild emitted no inline script")
  return javascript
}

async function patchDistribution(inlineScript) {
  for (const distPath of distPaths) {
    const source = await readFile(distPath, "utf8")
    const assignment = "var graph_inline_default = "
    const assignmentStart = source.indexOf(assignment)
    if (assignmentStart === -1) {
      throw new Error(`Graph patch failed: inline bundle anchor is missing in ${distPath}`)
    }

    const valueStart = assignmentStart + assignment.length
    const quote = source[valueStart]
    if (quote !== '"' && quote !== "`") {
      throw new Error(`Graph patch failed: inline bundle quote is invalid in ${distPath}`)
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
      throw new Error(`Graph patch failed: inline bundle terminator is missing in ${distPath}`)
    }

    const semicolonEnd = source[valueEnd] === ";" ? valueEnd + 1 : valueEnd
    const patched =
      source.slice(0, assignmentStart) +
      `${assignment}${JSON.stringify(inlineScript)};` +
      source.slice(semicolonEnd)
    await writeFile(distPath, patched)
  }
}

await patchGraphComponentSource()
await patchReadableSource()
await patchGraphComponentDistribution()
await patchDistribution(await compileInlineScript())
console.log("Applied Dev Uni three-depth graph patch")
