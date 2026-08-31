import { createHash } from "node:crypto"
import { readFile, readdir, stat } from "node:fs/promises"
import path from "node:path"

export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex")
export const acceptedArtifactTreeSha256 =
  "0e345a5b9855190eae4c0c906ff5b9a3c4e0ccc12ce7b2685636e9f91592cae2"

async function walk(root) {
  const files = []
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(absolute)))
    else if (entry.isFile()) files.push(absolute)
  }
  return files.sort()
}

export async function createArtifactManifest(outputRoot) {
  const files = await walk(outputRoot)
  const lines = []
  let totalBytes = 0
  for (const absolute of files) {
    const bytes = await readFile(absolute)
    const relative = path.relative(outputRoot, absolute).split(path.sep).join("/")
    lines.push(`${sha256(bytes)}  ${relative}\n`)
    totalBytes += (await stat(absolute)).size
  }
  const source = lines.join("")
  return {
    source,
    entries: lines.map((line) => ({ sha256: line.slice(0, 64), path: line.slice(66, -1) })),
    fileCount: files.length,
    htmlFileCount: files.filter((file) => file.endsWith(".html")).length,
    totalBytes,
    treeSha256: sha256(source),
  }
}

export function parseArtifactManifest(source) {
  const entries = source
    .trimEnd()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^([0-9a-f]{64})  (.+)$/)
      if (!match) throw new Error(`invalid artifact manifest record: ${line}`)
      return { sha256: match[1], path: match[2] }
    })
  if (new Set(entries.map((entry) => entry.path)).size !== entries.length)
    throw new Error("artifact manifest contains duplicate paths")
  return { source, entries, fileCount: entries.length, treeSha256: sha256(source) }
}

export async function loadArtifactManifest(manifestPath) {
  return parseArtifactManifest(await readFile(manifestPath, "utf8"))
}

export function compareArtifactManifests(accepted, current) {
  const acceptedByPath = new Map(accepted.entries.map((entry) => [entry.path, entry.sha256]))
  const currentByPath = new Map(current.entries.map((entry) => [entry.path, entry.sha256]))
  const paths = [...new Set([...acceptedByPath.keys(), ...currentByPath.keys()])].sort()
  const changedFiles = paths.filter(
    (entryPath) => acceptedByPath.get(entryPath) !== currentByPath.get(entryPath),
  )
  return { changedFileCount: changedFiles.length, changedFiles }
}

export function validateReproducibleManifestPair({
  first,
  second,
  summary,
  currentTreeSha256,
  acceptedTreeSha256 = acceptedArtifactTreeSha256,
}) {
  const errors = []
  if (first.fileCount !== 127) errors.push("first manifest must contain exactly 127 entries")
  if (second.fileCount !== 127) errors.push("second manifest must contain exactly 127 entries")
  if (first.source !== second.source) errors.push("first and second manifests are not identical")
  if (first.treeSha256 !== currentTreeSha256)
    errors.push("first manifest tree does not match the current artifact")
  if (second.treeSha256 !== currentTreeSha256)
    errors.push("second manifest tree does not match the current artifact")
  if (first.treeSha256 !== acceptedTreeSha256)
    errors.push("first manifest tree does not match the accepted artifact")
  if (second.treeSha256 !== acceptedTreeSha256)
    errors.push("second manifest tree does not match the accepted artifact")

  const expectedSummaries = [
    ["first", "migration/evidence/g013/build-1.sha256", first],
    ["second", "migration/evidence/g013/build-2.sha256", second],
  ]
  for (const [key, expectedPath, parsed] of expectedSummaries) {
    if (summary[key]?.path !== expectedPath) errors.push(`${key} summary path mismatch`)
    if (summary[key]?.entryCount !== parsed.fileCount)
      errors.push(`${key} summary entry count mismatch`)
    if (summary[key]?.sha256 !== parsed.treeSha256) errors.push(`${key} summary tree hash mismatch`)
  }
  if (summary.status !== "pass") errors.push("reproducible summary status is not PASS")
  if (summary.changedFileCount !== 0) errors.push("reproducible summary reports changed files")
  if (!Array.isArray(summary.changedFiles) || summary.changedFiles.length !== 0)
    errors.push("reproducible summary changedFiles must be empty")
  return { status: errors.length === 0 ? "pass" : "fail", errors }
}
