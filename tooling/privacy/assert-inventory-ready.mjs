import path from "node:path"
import { fileURLToPath } from "node:url"
import { readJson, unresolvedRecords } from "./inventory-lib.mjs"

const toolingDir = path.dirname(fileURLToPath(import.meta.url))
const inventoryPath = path.resolve(toolingDir, "../../../evidence/inventory.json")
const inventory = await readJson(inventoryPath)
const unresolved = unresolvedRecords(inventory.records)
if (unresolved.length > 0) {
  console.error(
    `BLOCKED: ${unresolved.length} unknown/conflicting/review-required records prevent full-corpus copy/build.`,
  )
  process.exit(2)
}
console.log(`READY: ${inventory.records.length} records are owner-reviewed or hard-denied.`)
