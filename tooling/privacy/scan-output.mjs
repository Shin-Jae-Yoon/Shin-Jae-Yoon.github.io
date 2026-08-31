import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { readJson, scanText, shouldScan, walk } from "./inventory-lib.mjs"

const toolingDir = path.dirname(fileURLToPath(import.meta.url))
const quartzRoot = path.resolve(toolingDir, "../..")
const repositoryRoot = path.resolve(quartzRoot, "../..")
const outputRoot = path.resolve(quartzRoot, process.argv[2] ?? "public")
const policy = await readJson(path.join(toolingDir, "policy.json"))
const { sentinels } = await readJson(path.join(toolingDir, "sentinels.json"))
const inventory = await readJson(path.resolve(repositoryRoot, "migration/evidence/inventory.json"))
const deniedPaths = inventory.records
  .filter((record) => record.classification === "exclude")
  .map((record) => record.sourcePath)
const scannedFiles = []
const findings = []
for (const absolutePath of await walk(outputRoot)) {
  const relativePath = path.relative(outputRoot, absolutePath).split(path.sep).join("/")
  if (!shouldScan(relativePath, policy)) continue
  scannedFiles.push(relativePath)
  findings.push(
    ...scanText({
      relativePath,
      content: await readFile(absolutePath, "utf8"),
      deniedPaths,
      sentinels,
    }),
  )
}
const report = {
  generatedAt: new Date().toISOString(),
  outputRoot,
  scannedFileCount: scannedFiles.length,
  scannedFiles,
  findingCount: findings.length,
  findings,
}
await writeFile(
  path.resolve(repositoryRoot, "migration/evidence/privacy-scan.json"),
  `${JSON.stringify(report, null, 2)}\n`,
)
console.log(
  JSON.stringify({ scannedFileCount: scannedFiles.length, findingCount: findings.length }),
)
if (findings.length > 0) process.exit(3)
