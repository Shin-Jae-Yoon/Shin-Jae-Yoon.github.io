import { readFile, readdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const quartzRoot = path.resolve(here, "../..")

async function walk(root, extension) {
  const files = []
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(absolute, extension)))
    else if (entry.isFile() && entry.name.endsWith(extension)) files.push(absolute)
  }
  return files.sort()
}

export function counterOutputState(html) {
  const body = html.match(/<body\b[^>]*>/i)?.[0] ?? ""
  return {
    contentType: body.match(/\bdata-content-type="([^"]+)"/i)?.[1],
    hasArticleCounter: /\barticle-view-counter\b|data-counter="article"/i.test(html),
  }
}

export async function verifyCounterOutput() {
  const contentRoot = path.join(quartzRoot, "content")
  const outputRoot = path.join(quartzRoot, "public")
  const articleOutputs = new Set()

  for (const sourcePath of await walk(contentRoot, ".md")) {
    const source = await readFile(sourcePath, "utf8")
    if (!/^contentType:\s*article\s*$/m.test(source)) continue
    const relative = path.relative(contentRoot, sourcePath).split(path.sep).join("/")
    articleOutputs.add(relative.replace(/\.md$/, ".html"))
  }

  const failures = []
  for (const outputPath of await walk(outputRoot, ".html")) {
    const relative = path.relative(outputRoot, outputPath).split(path.sep).join("/")
    const state = counterOutputState(await readFile(outputPath, "utf8"))
    const expectedArticle = articleOutputs.has(relative)
    if ((state.contentType === "article") !== expectedArticle) {
      failures.push({ relative, expectedArticle, contentType: state.contentType })
    }
    if (!expectedArticle && state.hasArticleCounter) {
      failures.push({ relative, reason: "non-article output contains article counter markup" })
    }
  }

  if (failures.length > 0) {
    throw new Error(`counter output verification failed:\n${JSON.stringify(failures, null, 2)}`)
  }
  return { articleOutputCount: articleOutputs.size, status: "pass" }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(await verifyCounterOutput(), null, 2)}\n`)
}
