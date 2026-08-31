import { createHash } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const sources = {
  rss: "https://jae-yoon.tistory.com/rss",
  sitemap: "https://jae-yoon.tistory.com/sitemap.xml",
  index: "https://jae-yoon.tistory.com/",
}
const outputRoot = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(import.meta.dirname, "../../../evidence/tistory/raw/discovery")
await mkdir(outputRoot, { recursive: true })

for (const [name, requestedUrl] of Object.entries(sources)) {
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
    bodySha256: createHash("sha256").update(bytes).digest("hex"),
    bodyBytes: bytes.length,
  }
  await writeFile(path.join(outputRoot, `${name}.body`), bytes)
  await writeFile(
    path.join(outputRoot, `${name}.headers.json`),
    `${JSON.stringify(headers, null, 2)}\n`,
  )
  await writeFile(
    path.join(outputRoot, `${name}.capture.json`),
    `${JSON.stringify(metadata, null, 2)}\n`,
  )
  console.log(`${name} ${metadata.bodySha256}`)
}
