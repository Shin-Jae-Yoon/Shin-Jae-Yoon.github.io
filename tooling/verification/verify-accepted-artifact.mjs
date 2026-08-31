import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  acceptedArtifactTreeSha256,
  compareArtifactManifests,
  createArtifactManifest,
  parseArtifactManifest,
} from "./artifact-manifest.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const quartzRoot = path.resolve(here, "../..")
const repoRoot = path.resolve(quartzRoot, "../..")
const acceptedManifestPath = path.join(repoRoot, "migration/evidence/g013/build-2.sha256")
const evidencePath = path.join(repoRoot, "migration/evidence/g013/accepted-artifact.json")
export const acceptedTreeSha256 = acceptedArtifactTreeSha256

export async function verifyAcceptedArtifact() {
  const accepted = parseArtifactManifest(await readFile(acceptedManifestPath, "utf8"))
  const current = await createArtifactManifest(path.join(quartzRoot, "public"))
  const comparison = compareArtifactManifests(accepted, current)
  const passed =
    accepted.fileCount === 127 &&
    current.fileCount === 127 &&
    accepted.treeSha256 === acceptedTreeSha256 &&
    current.treeSha256 === acceptedTreeSha256 &&
    comparison.changedFileCount === 0
  const report = {
    schemaVersion: 1,
    status: passed ? "pass" : "fail",
    acceptedManifest: {
      path: "migration/evidence/g013/build-2.sha256",
      fileCount: accepted.fileCount,
      treeSha256: accepted.treeSha256,
    },
    currentArtifact: {
      root: "migration/quartz-v5/public",
      fileCount: current.fileCount,
      htmlFileCount: current.htmlFileCount,
      totalBytes: current.totalBytes,
      treeSha256: current.treeSha256,
    },
    ...comparison,
  }
  await mkdir(path.dirname(evidencePath), { recursive: true })
  await writeFile(evidencePath, `${JSON.stringify(report, null, 2)}\n`)
  if (!passed) throw new Error(`accepted artifact mismatch: ${JSON.stringify(report)}`)
  return report
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(await verifyAcceptedArtifact(), null, 2)}\n`)
}
