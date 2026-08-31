import { createHash } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const ids = [23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 8, 7, 6, 4, 3]
const outputRoot = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(import.meta.dirname, "../../../evidence/tistory/raw/posts")
await mkdir(outputRoot, { recursive: true })

for (const id of ids) {
  const requestedUrl = `https://jae-yoon.tistory.com/${id}`
  const retrievedAt = new Date().toISOString()
  const response = await fetch(requestedUrl, {
    redirect: "follow",
    headers: { "user-agent": "Shin-Jae-Yoon-migration-evidence/1.0 (read-only)" },
  })
  if (!response.ok) throw new Error(`${requestedUrl}: HTTP ${response.status}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  const headers = Object.fromEntries([...response.headers].sort(([a], [b]) => a.localeCompare(b)))
  const metadata = {
    requestedUrl,
    effectiveUrl: response.url,
    retrievedAt,
    status: response.status,
    contentType: response.headers.get("content-type"),
    etag: response.headers.get("etag"),
    lastModified: response.headers.get("last-modified"),
    bodySha256: createHash("sha256").update(bytes).digest("hex"),
    bodyBytes: bytes.length,
  }
  await writeFile(path.join(outputRoot, `${id}.body`), bytes)
  await writeFile(
    path.join(outputRoot, `${id}.headers.json`),
    `${JSON.stringify(headers, null, 2)}\n`,
  )
  await writeFile(
    path.join(outputRoot, `${id}.capture.json`),
    `${JSON.stringify(metadata, null, 2)}\n`,
  )
  console.log(`${id} ${metadata.bodySha256}`)
}
