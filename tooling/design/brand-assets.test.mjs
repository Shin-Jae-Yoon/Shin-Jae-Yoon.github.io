import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"
import { verifyBrandAssetManifest } from "./brand-assets.mjs"

const quartzRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const repositoryRoot = path.resolve(quartzRoot, "../..")
const manifest = JSON.parse(
  await readFile(path.join(quartzRoot, "tooling/design/brand-assets.json"), "utf8"),
)
const clone = () => structuredClone(manifest)
const pendingIndex = manifest.assets.findIndex(
  (asset) => asset.approval.verdict === "pending-owner-review",
)

test("current brand manifest is valid and authorizes no owner-unapproved copy", async () => {
  const result = await verifyBrandAssetManifest(manifest)
  assert.equal(result.records.length, 12)
  assert.equal(result.approved.length, 1)
  assert.equal(result.pending.length, 11)
  await verifyBrandAssetManifest(manifest, {
    requestedSources: ["static/images/about-jaeyoon-2026.jpeg"],
  })
  await assert.rejects(
    verifyBrandAssetManifest(manifest, {
      requestedSources: ["static/images/about-profile.png"],
    }),
    /not owner-approved/,
  )
})

test("brand assets reject traversal, duplicate destinations, hash mismatch, and active media", async () => {
  const traversal = clone()
  traversal.assets[0].source.path = "static/images/../secret.png"
  await assert.rejects(verifyBrandAssetManifest(traversal), /traversal/)

  const duplicate = clone()
  duplicate.assets[1].destination.path = duplicate.assets[0].destination.path
  await assert.rejects(verifyBrandAssetManifest(duplicate), /duplicate destination/)

  const mismatch = clone()
  mismatch.assets[pendingIndex].source.sha256 = "0".repeat(64)
  await assert.rejects(verifyBrandAssetManifest(mismatch), /hash mismatch/)

  const active = clone()
  active.assets[pendingIndex].media.type = "image/svg+xml"
  await assert.rejects(verifyBrandAssetManifest(active), /unsupported or active media/)
})

test("brand assets reject over-budget files and incomplete owner or alt decisions", async () => {
  const overBudget = clone()
  overBudget.assets[pendingIndex].budget.maxBytes = 1
  await assert.rejects(verifyBrandAssetManifest(overBudget), /exceeds its declared budget/)

  const missingAlt = clone()
  missingAlt.assets[pendingIndex].accessibility.proposedAltText = ""
  await assert.rejects(verifyBrandAssetManifest(missingAlt), /needs proposed alt text/)

  const incompleteApproval = clone()
  incompleteApproval.assets[pendingIndex].approval.verdict = "approve"
  await assert.rejects(verifyBrandAssetManifest(incompleteApproval), /missing ownerIdentity/)
})

test("brand assets reject unlisted copy requests", async () => {
  await assert.rejects(
    verifyBrandAssetManifest(manifest, {
      requestedSources: ["static/images/not-listed.png"],
    }),
    /not listed/,
  )
})

test("brand assets reject symlink sources even when they resolve inside the allowed root", async () => {
  const fixtureRoot = await mkdtemp(path.join(tmpdir(), "dev-uni-brand-assets-"))
  await mkdir(path.join(fixtureRoot, "static/images"), { recursive: true })
  await writeFile(path.join(fixtureRoot, "static/images/original.png"), "fixture")
  await symlink("original.png", path.join(fixtureRoot, "static/images/link.png"))
  const fixture = {
    schemaVersion: 1,
    policy: "explicit-owner-review-fail-closed",
    assets: [
      {
        id: "symlink",
        source: {
          path: "static/images/link.png",
          sha256: "1d7f7abc18fcb43975065399b0d1e48e1e2b720cbb309a7ef2273c177b48a0d4",
          bytes: 7,
        },
        media: { type: "image/png", width: 1, height: 1 },
        destination: { path: "quartz/static/dev-uni/link.png", transformedSha256: null },
        usageSurfaces: ["home"],
        ownershipAndLicenseAssertion: null,
        accessibility: { decision: "decorative", proposedAltText: null },
        budget: { maxBytes: 10, maxWidth: 1, maxHeight: 1 },
        approval: {
          verdict: "pending-owner-review",
          ownerIdentity: null,
          reviewedAt: null,
          decisionSource: null,
          boundSourceSha256: null,
          boundDestination: null,
          ownershipAndLicenseAssertion: null,
          altDecision: null,
        },
      },
    ],
  }
  await assert.rejects(
    verifyBrandAssetManifest(fixture, { repository: fixtureRoot }),
    /symlink sources are forbidden/,
  )
})
