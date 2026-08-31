import { spawn } from "node:child_process"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  compareArtifactManifests,
  createArtifactManifest,
} from "../verification/artifact-manifest.mjs"
import { auditPublicBrandMedia } from "./g003-preservation-sentinels.mjs"

const quartzRoot = path.resolve(import.meta.dirname, "../..")

async function runBuild(output) {
  const args = ["quartz/bootstrap-cli.mjs", "build", "--concurrency=1", "--output", output]
  const child = spawn(process.execPath, args, {
    cwd: quartzRoot,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  })
  let stdout = ""
  let stderr = ""
  child.stdout.on("data", (chunk) => {
    stdout += chunk
  })
  child.stderr.on("data", (chunk) => {
    stderr += chunk
  })
  const exitCode = await new Promise((resolve, reject) => {
    child.once("error", reject)
    child.once("close", (code) => resolve(code ?? 1))
  })
  if (exitCode !== 0) {
    throw new Error(`Quartz build failed (${exitCode})\n${stdout}\n${stderr}`)
  }
  return { exitCode }
}

export async function verifyTwoCleanBuilds() {
  const packageJson = JSON.parse(await readFile(path.join(quartzRoot, "package.json"), "utf8"))
  const expectedNode = packageJson.engines.node
  if (process.versions.node !== expectedNode) {
    throw new Error(`Node ${expectedNode} is required; received ${process.versions.node}`)
  }

  const temporaryRoot = await mkdtemp(path.join(tmpdir(), "dev-uni-g003-reproducible-"))
  const firstOutput = path.join(temporaryRoot, "first")
  const secondOutput = path.join(temporaryRoot, "second")
  try {
    await runBuild(firstOutput)
    const first = await createArtifactManifest(firstOutput)
    const firstMedia = await auditPublicBrandMedia(firstOutput)

    await runBuild(secondOutput)
    const second = await createArtifactManifest(secondOutput)
    const secondMedia = await auditPublicBrandMedia(secondOutput)
    const comparison = compareArtifactManifests(first, second)
    const errors = []

    if (first.fileCount === 0 || first.htmlFileCount === 0) {
      errors.push("first clean build emitted no usable artifact")
    }
    if (first.fileCount !== second.fileCount) errors.push("clean build file counts differ")
    if (first.htmlFileCount !== second.htmlFileCount) errors.push("clean build HTML counts differ")
    if (first.source !== second.source || comparison.changedFileCount !== 0) {
      errors.push("clean build manifests differ")
    }
    if (firstMedia.status !== "pass")
      errors.push(...firstMedia.errors.map((error) => `first: ${error}`))
    if (secondMedia.status !== "pass") {
      errors.push(...secondMedia.errors.map((error) => `second: ${error}`))
    }

    return {
      schemaVersion: 1,
      status: errors.length === 0 ? "pass" : "fail",
      runtime: { node: process.versions.node, expectedNode },
      derived: {
        fileCount: first.fileCount,
        htmlFileCount: first.htmlFileCount,
        totalBytes: first.totalBytes,
      },
      firstTreeSha256: first.treeSha256,
      secondTreeSha256: second.treeSha256,
      changedFileCount: comparison.changedFileCount,
      changedFiles: comparison.changedFiles,
      publicBrandMedia: {
        approvedCount: firstMedia.approvedCount,
        emittedCount: firstMedia.emittedCount,
      },
      errors,
    }
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
}

async function main() {
  const report = await verifyTwoCleanBuilds()
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  if (report.status !== "pass") process.exitCode = 1
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main()
}
