import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  contentPathToSlug,
  fileRecord,
  graphProjection,
  parseArgs,
  scanExternalOldRouteReferences,
  sha256,
  toPosix,
  transformLinks,
  walkFiles,
} from "./lib.mjs"

async function readContentIndex(publicRoot) {
  if (!publicRoot) return null
  try {
    return JSON.parse(await readFile(path.join(publicRoot, "static/contentIndex.json"), "utf8"))
  } catch (error) {
    if (error.code === "ENOENT") return null
    throw error
  }
}

async function summarizePublic(publicRoot) {
  if (!publicRoot) return null
  let files
  try {
    files = await walkFiles(publicRoot)
  } catch (error) {
    if (error.code === "ENOENT") return null
    throw error
  }
  const redirectPages = []
  for (const absolute of files.filter((entry) => entry.endsWith(".html"))) {
    const source = await readFile(absolute, "utf8")
    if (/<meta\s+http-equiv=["']refresh["']/i.test(source)) {
      redirectPages.push(toPosix(path.relative(publicRoot, absolute)))
    }
  }
  return {
    emittedFileCount: files.length,
    redirectPageCount: redirectPages.length,
    redirectPages: redirectPages.sort(),
  }
}

function summarizeGraph(contentIndex) {
  if (!contentIndex) return null
  const nodes = Object.keys(contentIndex).sort()
  const nodeSet = new Set(nodes)
  const edges = []
  for (const source of nodes) {
    for (const target of contentIndex[source]?.links ?? []) edges.push(`${source}->${target}`)
  }
  const brainNodes = nodes.filter((slug) => slug === "brain" || slug.startsWith("brain/"))
  const tistoryNodes = nodes.filter((slug) => slug.startsWith("articles/tistory"))
  const knowledge = graphProjection(contentIndex)
  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    brainNodeCount: brainNodes.length,
    brainEdgeCount: edges.filter((edge) => edge.startsWith("brain/")).length,
    tistoryNodeCount: tistoryNodes.length,
    knowledgeNodeCount: knowledge.nodes.length,
    knowledgeEdgeCount: knowledge.edges.length,
    selfEdges: edges.filter((edge) => {
      const [source, target] = edge.split("->")
      return source === target
    }),
    unresolvedEdges: edges.filter((edge) => !nodeSet.has(edge.slice(edge.indexOf("->") + 2))),
    nodes,
    edges: edges.sort(),
  }
}

export async function buildInventory({ root, publicRoot = null }) {
  const contentRoot = path.join(root, "content")
  const markdownFiles = await walkFiles(contentRoot, (absolute) => absolute.endsWith(".md"))
  const records = []
  const links = []
  const routeOwners = new Map()
  const brainRoots = {}

  for (const absolute of markdownFiles) {
    const record = await fileRecord(absolute, root)
    const relativeContent = toPosix(path.relative(contentRoot, absolute))
    const slug = contentPathToSlug(relativeContent)
    records.push({ ...record, slug })
    if (!routeOwners.has(slug)) routeOwners.set(slug, [])
    routeOwners.get(slug).push(record.path)
    if (relativeContent.startsWith("brain/")) {
      const rootName = relativeContent.split("/")[1]
      brainRoots[rootName] = (brainRoots[rootName] ?? 0) + 1
    }
    const raw = await readFile(absolute, "utf8")
    links.push(...transformLinks(raw, record.path).ledger)
  }

  const imageRoot = path.join(contentRoot, "brain/image")
  const imageFiles = await walkFiles(imageRoot)
  const imageRecords = []
  for (const absolute of imageFiles) imageRecords.push(await fileRecord(absolute, root))

  records.sort((a, b) => a.path.localeCompare(b.path))
  imageRecords.sort((a, b) => a.path.localeCompare(b.path))
  const contentIndex = await readContentIndex(publicRoot)
  const duplicateRoutes = [...routeOwners]
    .filter(([, owners]) => owners.length > 1)
    .map(([slug, owners]) => ({ slug, owners }))

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    root: ".",
    content: {
      markdownCount: records.length,
      brainMarkdownCount: records.filter((entry) => entry.path.startsWith("content/brain/")).length,
      brainIndexCount: records.filter(
        (entry) => entry.path.startsWith("content/brain/") && entry.path.endsWith("/index.md"),
      ).length,
      brainUnderscoreIndexCount: records.filter(
        (entry) => entry.path.startsWith("content/brain/") && entry.path.endsWith("/_index.md"),
      ).length,
      brainRoots: Object.fromEntries(Object.entries(brainRoots).sort()),
      corpusSha256: sha256(JSON.stringify(records)),
      records,
      duplicateRoutes,
    },
    links: {
      occurrenceCount: links.length,
      rewriteCount: links.filter((entry) => entry.classification === "rewrite").length,
      ignoredCodeCount: links.filter((entry) => entry.classification === "ignore-code").length,
      preservedTextCount: links.filter((entry) => entry.classification === "preserve-text").length,
      unclassifiedCount: links.filter((entry) => entry.classification === "unclassified").length,
      occurrences: links,
    },
    images: {
      fileCount: imageRecords.length,
      treeSha256: sha256(JSON.stringify(imageRecords)),
      records: imageRecords,
    },
    graph: summarizeGraph(contentIndex),
    public: await summarizePublic(publicRoot),
    externalOldRouteReferences: await scanExternalOldRouteReferences(root),
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const root = path.resolve(args.root || process.cwd())
  if (!args.out) throw new Error("--out is required")
  const outputPath = path.resolve(root, args.out)
  const publicRoot = args.public ? path.resolve(root, args.public) : path.join(root, "public")
  const inventory = await buildInventory({ root, publicRoot })
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(inventory, null, 2)}\n`)
  process.stdout.write(
    `${JSON.stringify({ output: toPosix(path.relative(root, outputPath)), markdown: inventory.content.markdownCount, brain: inventory.content.brainMarkdownCount, rewrites: inventory.links.rewriteCount, graph: inventory.graph && { nodes: inventory.graph.nodeCount, edges: inventory.graph.edgeCount } }, null, 2)}\n`,
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  main().catch((error) => {
    console.error(error.stack || error.message)
    process.exitCode = 1
  })
