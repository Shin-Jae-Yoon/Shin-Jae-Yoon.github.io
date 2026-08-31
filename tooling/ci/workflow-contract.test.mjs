import assert from "node:assert/strict"
import { readFile, readdir } from "node:fs/promises"
import path from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"
import YAML from "yaml"

const toolingDir = path.dirname(fileURLToPath(import.meta.url))
const quartzRoot = path.resolve(toolingDir, "../..")
const repositoryRoot = path.resolve(quartzRoot, "../..")
const workflowsDir = path.join(quartzRoot, ".github/workflows")
const workflowPath = path.join(workflowsDir, "pages-artifact.yaml")
const rootProductionWorkflowPath = path.join(repositoryRoot, ".github/workflows/deploy.yaml")
const packagePath = path.join(quartzRoot, "package.json")
const nodeVersionPath = path.join(quartzRoot, ".node-version")

async function readWorkflow() {
  const source = await readFile(workflowPath, "utf8")
  return { source, document: YAML.parse(source) }
}

test("migration contains one staged artifact-only workflow and no deploy action", async () => {
  assert.deepEqual((await readdir(workflowsDir)).sort(), ["pages-artifact.yaml"])
  const { source, document } = await readWorkflow()
  assert.match(source, /intentionally staged below migration\/quartz-v5/)
  assert.doesNotMatch(
    source,
    /actions\/deploy-pages|cloudflare|actions-gh-pages|docker\/build-push/i,
  )
  assert.doesNotMatch(source, /\bdeploy(?:ment)?s?\s*:/i)
  assert.equal(document.on.push, undefined)
  assert.ok(Object.hasOwn(document.on, "pull_request"))
  assert.ok(Object.hasOwn(document.on, "workflow_dispatch"))
})

test("workflow uses least privilege and never requests credentials or write permissions", async () => {
  const { source, document } = await readWorkflow()
  assert.deepEqual(document.permissions, { contents: "read" })
  const job = document.jobs["build-pages-artifact"]
  assert.deepEqual(job.permissions, { contents: "read" })
  assert.doesNotMatch(source, /\b(?:pages|deployments|id-token|packages|contents):\s*write\b/)
  assert.doesNotMatch(source, /\bsecrets\./)
  const checkout = job.steps.find((step) => step.uses?.startsWith("actions/checkout@"))
  assert.equal(checkout.with["persist-credentials"], false)
})

test("workflow pins runner, Node, npm, and official actions exactly", async () => {
  const { source, document } = await readWorkflow()
  const job = document.jobs["build-pages-artifact"]
  const steps = job.steps
  assert.equal(job["runs-on"], "ubuntu-24.04")
  assert.doesNotMatch(source, /ubuntu-latest|node-version:\s*(?:22|latest)\s*$/m)
  const actionPins = new Map([
    ["actions/checkout", "df4cb1c069e1874edd31b4311f1884172cec0e10"],
    ["actions/setup-node", "249970729cb0ef3589644e2896645e5dc5ba9c38"],
    ["actions/upload-pages-artifact", "fc324d3547104276b827a68afc52ff2a11cc49c9"],
  ])
  const actionSteps = steps.filter((step) => step.uses)
  assert.equal(actionSteps.length, actionPins.size)
  for (const step of actionSteps) {
    const [action, revision] = step.uses.split("@")
    assert.equal(revision, actionPins.get(action), `${action} must use its verified release SHA`)
    assert.match(revision, /^[0-9a-f]{40}$/)
  }
  assert.match(source, /actions\/checkout@[0-9a-f]{40} # v6\.0\.3/)
  assert.match(source, /actions\/setup-node@[0-9a-f]{40} # v6\.5\.0/)
  assert.match(source, /actions\/upload-pages-artifact@[0-9a-f]{40} # v5\.0\.0/)
  assert.doesNotMatch(source, /^\s*uses:\s*[^\s#]+@v\d+(?:\.\d+){0,2}\s*(?:#.*)?$/m)

  const setup = steps.find((step) => step.uses?.startsWith("actions/setup-node@"))
  assert.equal(setup.with["node-version"], "22.22.2")
  const commands = steps.map((step) => step.run ?? step.uses)
  assert.ok(commands.includes("npm install --global npm@10.9.7"))
  assert.ok(
    commands.includes(
      'test "$(node --version)" = "v22.22.2" && test "$(npm --version)" = "10.9.7"',
    ),
  )
  assert.ok(commands.indexOf("npm ci") < commands.indexOf("npm run install-plugins"))
  assert.ok(
    commands.indexOf("npm run install-plugins") <
      commands.indexOf("node ../g013/generate-final-verification.mjs"),
  )

  const packageJson = JSON.parse(await readFile(packagePath, "utf8"))
  assert.deepEqual(packageJson.engines, { npm: "10.9.7", node: "22.22.2" })
  assert.equal(packageJson.packageManager, "npm@10.9.7")
  assert.equal((await readFile(nodeVersionPath, "utf8")).trim(), "v22.22.2")
})

test("fail-closed G013, G010, and accepted-artifact gates bind the upload input", async () => {
  const { document } = await readWorkflow()
  const steps = document.jobs["build-pages-artifact"].steps
  const commands = steps.map((step) => step.run ?? step.uses)
  const g013 = commands.indexOf("node ../g013/generate-final-verification.mjs")
  const g010 = commands.indexOf("node ../g010/validate-handoff.mjs")
  const accepted = commands.indexOf("npm run artifact:verify-accepted")
  const upload = commands.findIndex((command) =>
    command.startsWith("actions/upload-pages-artifact@"),
  )
  assert.ok(g013 > 0 && g013 < g010 && g010 < accepted && accepted < upload)
  assert.equal(commands.indexOf("npm run inventory:generate"), -1)
  assert.equal(commands.indexOf("npm run inventory:gate"), -1)
  assert.equal(commands.indexOf("npm run output:inspect"), -1)
})

test("active root production workflow remains legacy and separate from staged Quartz CI", async () => {
  const source = await readFile(rootProductionWorkflowPath, "utf8")
  assert.match(source, /branches:\s*\n\s*- hugo/)
  assert.match(source, /jackyzha0\/hugo-obsidian@v2\.19/)
  assert.match(source, /peaceiris\/actions-hugo@v2/)
  assert.match(source, /peaceiris\/actions-gh-pages@v3/)
  assert.doesNotMatch(source, /migration\/quartz-v5|upload-pages-artifact/)
})
