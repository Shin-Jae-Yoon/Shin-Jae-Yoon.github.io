import path from "node:path"
import { readFile, readdir, writeFile } from "node:fs/promises"

const canonicalPattern = /(<link\s+rel=["']canonical["']\s+href=["'])([^"']+)(["'][^>]*>)/i
const noindexPattern = /<meta\s+name=["']robots["']\s+content=["']noindex["'][^>]*>/i
const refreshPattern = /<meta\s+http-equiv=["']refresh["'][^>]*>/i

async function htmlFiles(root: string): Promise<string[]> {
  const files: string[] = []
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name)
    if (entry.isDirectory()) files.push(...(await htmlFiles(absolute)))
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(absolute)
  }
  return files
}

function documentUrl(outputRoot: string, filePath: string, origin: string): URL {
  const relative = path.relative(outputRoot, filePath).split(path.sep).join("/")
  const route = relative.endsWith("/index.html")
    ? `/${relative.slice(0, -"index.html".length)}`
    : `/${relative.replace(/\.html$/, "")}`
  return new URL(route, origin)
}

export function absolutizeAliasCanonical(
  html: string,
  pageUrl: URL,
): { html: string; changed: boolean } {
  if (!noindexPattern.test(html) || !refreshPattern.test(html)) return { html, changed: false }

  const match = html.match(canonicalPattern)
  if (!match || /^https?:\/\//i.test(match[2])) return { html, changed: false }

  const canonical = new URL(match[2], pageUrl).toString()
  return {
    html: html.replace(canonicalPattern, `$1${canonical}$3`),
    changed: true,
  }
}

export async function finalizeSeoOutput(outputRoot: string, baseUrl: string): Promise<number> {
  const origin = new URL(`https://${baseUrl}`).origin
  await writeFile(
    path.join(outputRoot, "robots.txt"),
    `User-agent: *\nAllow: /\n\nSitemap: ${new URL("/sitemap.xml", origin).toString()}\n`,
  )

  let rewritten = 0
  for (const filePath of await htmlFiles(outputRoot)) {
    const source = await readFile(filePath, "utf8")
    const result = absolutizeAliasCanonical(source, documentUrl(outputRoot, filePath, origin))
    if (!result.changed) continue
    await writeFile(filePath, result.html)
    rewritten++
  }
  return rewritten
}
