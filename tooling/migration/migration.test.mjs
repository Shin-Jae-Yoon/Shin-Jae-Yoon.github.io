import assert from "node:assert/strict"
import { readFile, stat } from "node:fs/promises"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { migrateLegacy } from "./migrate-legacy.mjs"
import { migrateTistory } from "./migrate-tistory.mjs"
import { verifyMigrationManifest } from "./verify-manifest.mjs"
import { verifyLegacyExclusionAuthorization } from "../privacy/legacy-authorization.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const quartzRoot = path.resolve(here, "../..")
const repoRoot = path.resolve(quartzRoot, "../..")

test("keeps the reviewed legacy publication gate closed while preserving the local Garden snapshot", async () => {
  const { routeMap, report } = await migrateLegacy()
  assert.equal(report.status, "pass")
  assert.equal(routeMap.routes.length, 0)
  assert.equal(routeMap.assets.length, 0)
  assert.equal(routeMap.deferredRoutes.length, 261)
  assert.equal(new Set(routeMap.deferredRoutes.map((entry) => entry.legacyRoute)).size, 261)
  assert.equal(routeMap.hardDenyExclusions.length, 53)
  assert.equal(routeMap.unknownCopiedCount, 0)
  assert.equal(report.reviewedExcludeCount, 261)
  assert.equal(report.removedLegacyRouteCount, 261)
  assert.equal(report.removedLegacyOnlyAssetCount, 854)
  assert.ok(
    routeMap.hardDenyExclusions.every((entry) =>
      /content\/(private|templates)\//.test(entry.sourcePath),
    ),
  )
  assert.ok(await stat(path.join(quartzRoot, "content/brain/Book/dinosaur/chap01.md")))
  assert.ok(await stat(path.join(quartzRoot, "content/brain/image/0x01-1.png")))
})

test("converts exactly 15 immutable Tistory posts with zero semantic deviations", async () => {
  const { aggregate, routeEntries } = await migrateTistory()
  assert.equal(aggregate.status, "pass")
  assert.equal(aggregate.sourcePostCount, 15)
  assert.equal(aggregate.destinationPostCount, 15)
  assert.equal(aggregate.unresolvedBindingDeviationCount, 0)
  assert.equal(aggregate.nonMechanicalDeviationCount, 0)
  assert.equal(routeEntries.length, 15)
  for (const entry of routeEntries) {
    const body = await readFile(path.join(quartzRoot, entry.destinationPath), "utf8")
    assert.match(body, /^---\ntitle:/)
    assert.match(body, /contentType: article/)
    assert.match(body, /sourceUrl:/)
    assert.match(body, /originalPublished:/)
    assert.match(body, /created:/)
    assert.match(body, /modified:/)
    assert.match(body, /published:/)
  }
})

test("migration reports retain only metadata for deferred legacy content", async () => {
  const routeMap = JSON.parse(
    await readFile(path.join(repoRoot, "migration/evidence/legacy-route-map.json"), "utf8"),
  )
  const tistory = JSON.parse(
    await readFile(path.join(repoRoot, "migration/evidence/tistory-route-map.json"), "utf8"),
  )
  assert.equal(routeMap.publicLegacyRouteCount, 0)
  assert.equal(routeMap.deferredRouteCount, 261)
  assert.equal(routeMap.routes.length, 0)
  assert.equal(routeMap.assets.length, 0)
  assert.equal(tistory.routeCount, 15)
  assert.equal(routeMap.deferredRoutes.filter((entry) => entry.legacyRoute === "/").length, 1)
  assert.equal(routeMap.deferredRoutes.filter((entry) => entry.legacyRoute === "/brain/").length, 1)
  assert.equal(
    routeMap.deferredRoutes.find((entry) => entry.legacyRoute === "/").sourcePath,
    "content/brain.md",
  )
  assert.ok(routeMap.deferredRoutes.every((entry) => entry.publicDestination === null))
})

test("deployment migration gate remains fail-closed for the local Garden preview", async () => {
  await assert.rejects(verifyMigrationManifest(), /zero-legacy privacy gate failed/)
})

test("legacy output evidence cannot authorize publication", () => {
  const sourceSha256 = "a".repeat(64)
  const result = verifyLegacyExclusionAuthorization({
    legacy: {
      approvedRouteCount: 261,
      routes: [{ sourcePath: "content/note.md", sourceSha256 }],
      assets: [],
      deferredRoutes: [],
    },
    inventory: {
      records: [
        {
          sourcePath: "content/note.md",
          sha256: sourceSha256,
          classification: "unknown",
          reviewStatus: "pending-owner-review",
        },
      ],
    },
    ownerDecisions: { schemaVersion: 1, authority: "explicit-owner-review", decisions: [] },
  })
  assert.equal(result.passed, false)
  assert.equal(result.copiedLegacyRecordCount, 1)
  assert.ok(
    result.failures.some(
      (failure) => failure.kind === "legacy-record-copied-despite-zero-public-boundary",
    ),
  )
})

test("self-reported route counts cannot bypass the inventory and owner-decision join", () => {
  const sourceSha256 = "b".repeat(64)
  const result = verifyLegacyExclusionAuthorization({
    legacy: {
      deferredRouteCount: 261,
      routes: [],
      assets: [],
      deferredRoutes: [
        {
          sourcePath: "content/note.md",
          sourceSha256,
          legacyRoute: "/note/",
        },
      ],
    },
    inventory: { records: [] },
    ownerDecisions: { schemaVersion: 1, authority: "explicit-owner-review", decisions: [] },
  })
  assert.equal(result.candidateCount, 1)
  assert.equal(result.passed, false)
  assert.ok(result.failures.some((failure) => failure.kind === "inventory-record-missing"))
})
