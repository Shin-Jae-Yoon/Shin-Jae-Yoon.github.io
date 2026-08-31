import { createHash } from "node:crypto"
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const quartzRoot = path.resolve(here, "../..")
const articlesRoot = path.join(quartzRoot, "content/articles/tistory")
const staticRoot = path.join(quartzRoot, "quartz/static/tistory")
const manifestPath = path.join(staticRoot, "manifest.json")

const sha256 = (value) => createHash("sha256").update(value).digest("hex")
const decodeAttribute = (value) => value.replaceAll("&amp;", "&")

function isKakaoImage(value) {
  try {
    return new URL(decodeAttribute(value)).hostname === "blog.kakaocdn.net"
  } catch {
    return false
  }
}

function extensionFor(url, contentType) {
  const fromPath = path.extname(new URL(url).pathname).toLowerCase()
  if (/^\.(?:avif|gif|jpe?g|png|webp)$/.test(fromPath)) return fromPath
  const byType = {
    "image/avif": ".avif",
    "image/gif": ".gif",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  }
  return byType[contentType?.split(";", 1)[0]] ?? ".img"
}

async function download(url, postId) {
  const response = await fetch(url, {
    headers: {
      Referer: `https://jae-yoon.tistory.com/${postId}`,
      "User-Agent": "Dev-Uni-asset-preservation/1.0",
    },
    redirect: "follow",
  })
  if (!response.ok) throw new Error(`${response.status} ${url}`)

  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.startsWith("image/")) {
    throw new Error(`non-image response ${contentType}: ${url}`)
  }

  return { bytes: Buffer.from(await response.arrayBuffer()), contentType }
}

function rewriteAssetAttributes(source, localByOriginal) {
  return source.replace(/<[^>]+>/g, (tag) => {
    let rewritten = tag.replace(
      /\b(src|data-url|data-phocus)="([^"]+)"/g,
      (attribute, name, value) => {
        const original = decodeAttribute(value)
        const local = localByOriginal.get(original)
        if (!local) return attribute

        const provenanceName =
          name === "data-url"
            ? "data-original-url"
            : name === "data-phocus"
              ? "data-original-phocus"
              : null
        if (provenanceName && !new RegExp(`\\b${provenanceName}=`).test(tag)) {
          return `${name}="${local}" ${provenanceName}="${value}"`
        }
        return `${name}="${local}"`
      },
    )

    const localSrc = rewritten.match(/\bsrc="(\/static\/tistory\/[^"]+)"/)?.[1]
    if (localSrc && /^<img\b/i.test(rewritten)) {
      rewritten = rewritten
        .replace(/\s+srcset="[^"]*"/i, ` srcset="${localSrc}"`)
        .replace(/\s+onerror="[^"]*"/i, "")
      if (!/\salt="[^"]*"/i.test(rewritten)) {
        rewritten = rewritten.replace(/>$/, ' alt="">')
      }
    }
    return rewritten
  })
}

async function localizeArticle(filename) {
  const postId = path.basename(filename, ".md")
  const articlePath = path.join(articlesRoot, filename)
  const source = await readFile(articlePath, "utf8")
  const originalUrls = [
    ...new Set(
      [
        ...source.matchAll(
          /\b(?:src|data-url|data-phocus|data-original-url|data-original-phocus|data-og-image)="([^"]+)"/g,
        ),
      ]
        .map((match) => match[1])
        .filter(isKakaoImage)
        .map(decodeAttribute),
    ),
  ]

  if (originalUrls.length === 0) return { source, records: [] }

  const postRoot = path.join(staticRoot, postId)
  await mkdir(postRoot, { recursive: true })
  const localByOriginal = new Map()
  const records = []

  for (const originalUrl of originalUrls) {
    const { bytes, contentType } = await download(originalUrl, postId)
    const stableKey = new URL(originalUrl).origin + new URL(originalUrl).pathname
    const filename = `${sha256(stableKey).slice(0, 16)}${extensionFor(originalUrl, contentType)}`
    const outputPath = path.join(postRoot, filename)
    await writeFile(outputPath, bytes)

    const publicPath = `/static/tistory/${postId}/${filename}`
    localByOriginal.set(originalUrl, publicPath)
    records.push({
      postId,
      originalUrl,
      publicPath,
      contentType,
      byteLength: bytes.length,
      sha256: sha256(bytes),
    })
  }

  const rewritten = rewriteAssetAttributes(source, localByOriginal)

  if (rewritten !== source) await writeFile(articlePath, rewritten)
  return { source: rewritten, records }
}

export async function applyLocalizedTistoryAssets(manifest) {
  const resolvedManifest = manifest ?? JSON.parse(await readFile(manifestPath, "utf8"))
  const recordsByPost = new Map()
  for (const record of resolvedManifest.records ?? []) {
    const records = recordsByPost.get(String(record.postId)) ?? []
    records.push(record)
    recordsByPost.set(String(record.postId), records)
  }

  for (const [postId, records] of recordsByPost) {
    const articlePath = path.join(articlesRoot, `${postId}.md`)
    const source = await readFile(articlePath, "utf8")
    const localByOriginal = new Map(
      records.map((record) => [record.originalUrl, record.publicPath]),
    )
    const rewritten = rewriteAssetAttributes(source, localByOriginal)
    if (rewritten !== source) await writeFile(articlePath, rewritten)
  }
  return resolvedManifest
}

export async function localizeTistoryAssets() {
  const files = (await readdir(articlesRoot)).filter((name) => /^\d+\.md$/.test(name)).sort()
  const records = []
  for (const filename of files) {
    const result = await localizeArticle(filename)
    records.push(...result.records)
  }

  records.sort((a, b) =>
    a.postId === b.postId
      ? a.originalUrl.localeCompare(b.originalUrl)
      : Number(a.postId) - Number(b.postId),
  )
  const manifest = {
    schemaVersion: 1,
    source: "Tistory author image URLs retained in article provenance attributes",
    recordCount: records.length,
    records,
  }
  await mkdir(staticRoot, { recursive: true })
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  return manifest
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const manifest = await localizeTistoryAssets()
  process.stdout.write(`${JSON.stringify({ recordCount: manifest.recordCount }, null, 2)}\n`)
}
