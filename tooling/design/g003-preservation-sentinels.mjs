import { createHash } from "node:crypto"
import { readFile, readdir } from "node:fs/promises"
import path from "node:path"
import * as parse5 from "parse5"
import { semanticUnits } from "../migration/migrate-tistory.mjs"

const quartzRoot = path.resolve(import.meta.dirname, "../..")
const repositoryRoot = path.resolve(quartzRoot, "../..")
const fixturePath = path.join(quartzRoot, "tooling/design/fixtures/g003-tistory-body-hashes.json")

export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex")

export function destinationBody(bytes, label = "destination Markdown") {
  const opening = Buffer.from("---\n")
  const closing = Buffer.from("\n---\n")
  if (!bytes.subarray(0, opening.length).equals(opening)) {
    throw new Error(`${label}: opening YAML frontmatter is required`)
  }
  const boundary = bytes.indexOf(closing, opening.length)
  if (boundary < 0) throw new Error(`${label}: closing YAML frontmatter is required`)
  return bytes.subarray(boundary + closing.length)
}

async function walk(root) {
  const files = []
  let entries
  try {
    entries = await readdir(root, { withFileTypes: true })
  } catch (error) {
    if (error.code === "ENOENT") return files
    throw error
  }
  for (const entry of entries) {
    const absolute = path.join(root, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(absolute)))
    else if (entry.isFile()) files.push(absolute)
  }
  return files.sort()
}

export async function auditTistoryBodies({ repository = repositoryRoot } = {}) {
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"))
  const routeMap = JSON.parse(await readFile(path.join(repository, fixture.routeMap), "utf8"))
  const summary = JSON.parse(
    await readFile(path.join(repository, "migration/evidence/tistory-fidelity.json"), "utf8"),
  )
  const assetManifest = JSON.parse(
    await readFile(
      path.join(repository, "migration/quartz-v5/quartz/static/tistory/manifest.json"),
      "utf8",
    ),
  )
  const errors = []

  if (fixture.schemaVersion !== 1) errors.push("unsupported body fixture schema")
  if (fixture.recordCount !== 15 || fixture.records.length !== fixture.recordCount) {
    errors.push("body fixture must contain exactly 15 records")
  }
  if (
    routeMap.routeCount !== fixture.recordCount ||
    routeMap.routes.length !== fixture.recordCount
  ) {
    errors.push("Tistory route map is not bound to the 15-record fixture")
  }
  if (
    summary.status !== "pass" ||
    summary.passedPostCount !== fixture.recordCount ||
    summary.failedPostCount !== 0
  ) {
    errors.push("Tistory fidelity summary is not a clean 15-post pass")
  }

  const recordsById = new Map(fixture.records.map((record) => [record.id, record]))
  if (recordsById.size !== fixture.recordCount) errors.push("body fixture contains duplicate IDs")
  const summaryById = new Map(summary.posts.map((post) => [post.postId, post]))

  for (const route of routeMap.routes) {
    const label = `Tistory ${route.id}`
    const record = recordsById.get(route.id)
    if (!record) {
      errors.push(`${label}: body fixture record is missing`)
      continue
    }
    if (record.destinationPath !== route.destinationPath) {
      errors.push(`${label}: destination path differs from the route map`)
    }
    if (record.destinationUrl !== route.destinationUrl) {
      errors.push(`${label}: destination URL differs from the route map`)
    }

    const destination = await readFile(
      path.join(repository, "migration/quartz-v5", route.destinationPath),
    )
    let projectedBody = destinationBody(destination, label).toString("utf8")
    for (const asset of assetManifest.records.filter(
      (entry) => Number(entry.postId) === Number(route.id),
    )) {
      projectedBody = projectedBody.replaceAll(asset.publicPath, asset.originalUrl)
    }
    const currentUnits = semanticUnits(parse5.parseFragment(projectedBody), route.sourceUrl)
    if (sha256(JSON.stringify(currentUnits)) !== record.semanticSha256) {
      errors.push(`${label}: author semantics changed outside the approved asset projection`)
    }

    const fidelity = JSON.parse(
      await readFile(
        path.join(repository, fixture.fidelityEvidenceRoot, `${route.id}.json`),
        "utf8",
      ),
    )
    if (
      fidelity.status !== "pass" ||
      fidelity.postId !== route.id ||
      fidelity.destinationPath !== route.destinationPath ||
      fidelity.destinationUrl !== route.destinationUrl
    ) {
      errors.push(`${label}: fidelity identity or status mismatch`)
    }
    if (
      fidelity.sourceSemanticHash !== fidelity.destinationSemanticHash ||
      fidelity.destinationSemanticHash !== record.semanticSha256
    ) {
      errors.push(`${label}: semantic fidelity hash mismatch`)
    }
    if (
      fidelity.sourceUnitCount !== fidelity.destinationUnitCount ||
      fidelity.destinationUnitCount !== record.semanticUnitCount ||
      summaryById.get(route.id)?.unitCount !== record.semanticUnitCount
    ) {
      errors.push(`${label}: semantic unit count mismatch`)
    }
    if (fidelity.unitMatches.some((unit) => unit.match !== true)) {
      errors.push(`${label}: fidelity evidence contains a non-matching unit`)
    }
  }

  return {
    status: errors.length === 0 ? "pass" : "fail",
    recordCount: fixture.records.length,
    bodyTreeSha256: sha256(
      fixture.records.map(({ id, bodySha256 }) => `${id}  ${bodySha256}\n`).join(""),
    ),
    errors,
  }
}

export async function auditPublicBrandMedia(publicRoot, { repository = repositoryRoot } = {}) {
  const manifest = JSON.parse(
    await readFile(
      path.join(repository, "migration/quartz-v5/tooling/design/brand-assets.json"),
      "utf8",
    ),
  )
  const errors = []
  if (manifest.schemaVersion !== 1 || manifest.policy !== "explicit-owner-review-fail-closed") {
    errors.push("brand asset manifest schema or policy is unsupported")
  }

  const approved = manifest.assets.filter(({ approval }) => approval.verdict === "approve")
  const approvedByOutput = new Map(
    approved.map((record) => [record.destination.path.replace(/^quartz\//, ""), record]),
  )
  const emitted = (await walk(path.join(publicRoot, "static/dev-uni"))).map((absolute) =>
    path.relative(publicRoot, absolute).split(path.sep).join("/"),
  )

  for (const relative of emitted) {
    const record = approvedByOutput.get(relative)
    if (!record) {
      errors.push(`unauthorized public brand media: ${relative}`)
      continue
    }
    const actual = sha256(await readFile(path.join(publicRoot, relative)))
    const expected = record.destination.transformedSha256 ?? record.source.sha256
    if (actual !== expected) errors.push(`public brand media hash mismatch: ${relative}`)
  }
  for (const relative of approvedByOutput.keys()) {
    if (!emitted.includes(relative))
      errors.push(`approved public brand media is missing: ${relative}`)
  }

  return {
    status: errors.length === 0 ? "pass" : "fail",
    approvedCount: approved.length,
    emittedCount: emitted.length,
    errors,
  }
}

export async function auditLocalNoExternalMutationBoundary({ repository = repositoryRoot } = {}) {
  const ciEvidence = JSON.parse(
    await readFile(path.join(repository, "migration/evidence/ci-non-cutover.json"), "utf8"),
  )
  const handoff = JSON.parse(
    await readFile(path.join(repository, "migration/evidence/g010/handoff.json"), "utf8"),
  )
  const activeWorkflow = await readFile(
    path.join(repository, ciEvidence.activeProduction.workflowPath),
  )
  const stagedWorkflowPath = handoff.recordedState.stagedWorkflow.path
  const stagedWorkflow = await readFile(path.join(repository, stagedWorkflowPath), "utf8")
  const errors = []

  if (sha256(activeWorkflow) !== ciEvidence.activeProduction.workflowSha256) {
    errors.push("active production workflow differs from the non-cutover evidence")
  }
  if (sha256(activeWorkflow) !== handoff.recordedState.legacy.workflowSha256) {
    errors.push("active production workflow differs from the controlled handoff")
  }
  if (sha256(stagedWorkflow) !== handoff.recordedState.stagedWorkflow.sha256) {
    errors.push("staged artifact-only workflow differs from the controlled handoff")
  }
  if (
    ciEvidence.ownerCutoverPerformed !== false ||
    ciEvidence.credentialsChangedOrUsed !== false ||
    ciEvidence.tistoryMutated !== false ||
    ciEvidence.activeProduction.branchOrSettingsChanged !== false
  ) {
    errors.push("non-cutover evidence reports an external mutation")
  }
  if (Object.values(handoff.mutationBoundary).some((value) => value !== false)) {
    errors.push("controlled handoff reports an external mutation")
  }
  if (
    handoff.recordedState.stagedWorkflow.githubDiscoversAtCurrentPath !== false ||
    handoff.recordedState.stagedWorkflow.deployJobPresent !== false ||
    stagedWorkflowPath !== "migration/quartz-v5/.github/workflows/pages-artifact.yaml"
  ) {
    errors.push("staged workflow crossed the repository-root activation boundary")
  }
  if (
    /actions\/deploy-pages|actions-gh-pages|\b(?:pages|deployments|id-token|contents):\s*write\b/i.test(
      stagedWorkflow,
    )
  ) {
    errors.push("staged workflow contains deployment or write capability")
  }

  return {
    status: errors.length === 0 ? "pass" : "fail",
    scope: "repository-local evidence and workflow capability; no network or account-state claim",
    activeWorkflowSha256: sha256(activeWorkflow),
    stagedWorkflowSha256: sha256(stagedWorkflow),
    errors,
  }
}
