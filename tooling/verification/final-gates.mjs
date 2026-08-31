import { spawn } from "node:child_process"

export const requiredCommandIds = [
  "check",
  "tests",
  "migration",
  "build",
  "counters",
  "privacy",
  "output",
  "seo",
  "ciContract",
  "acceptedArtifact",
]

export const requiredGateIds = [...requiredCommandIds, "reproducibleBuild"]

export async function runCommand({ id, command, args, cwd, env = process.env }) {
  const startedAtMs = Date.now()
  const child = spawn(command, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] })
  let stdout = ""
  let stderr = ""
  child.stdout.on("data", (chunk) => {
    const text = chunk.toString()
    stdout += text
    process.stdout.write(text)
  })
  child.stderr.on("data", (chunk) => {
    const text = chunk.toString()
    stderr += text
    process.stderr.write(text)
  })
  const exitCode = await new Promise((resolve, reject) => {
    child.once("error", reject)
    child.once("close", (code) => resolve(code ?? 1))
  })
  return { id, command: [command, ...args].join(" "), startedAtMs, exitCode, stdout, stderr }
}

export function evaluateFinalGates({ commands, gates }) {
  const errors = []
  const commandById = new Map(commands.map((entry) => [entry.id, entry]))
  for (const id of requiredCommandIds) {
    const result = commandById.get(id)
    if (!result) errors.push(`required command was not executed: ${id}`)
    else if (result.exitCode !== 0) errors.push(`required command failed: ${id}`)
  }
  for (const id of requiredGateIds) {
    const gate = gates[id]
    if (!gate) errors.push(`required gate evidence is missing: ${id}`)
    else {
      if (gate.fresh !== true) errors.push(`required gate evidence is stale: ${id}`)
      if (gate.status !== "pass") errors.push(`required gate did not pass: ${id}`)
    }
  }
  return { status: errors.length === 0 ? "pass" : "fail", errors }
}

export function createPassingReport(report, evaluation) {
  if (evaluation.status !== "pass" || evaluation.errors.length > 0) {
    throw new Error(`final verification is fail-closed: ${evaluation.errors.join("; ")}`)
  }
  return { ...report, status: "pass" }
}

export function commandEvidence(result, summary = {}) {
  return {
    status: result.exitCode === 0 ? "pass" : "fail",
    fresh: true,
    command: result.command,
    exitCode: result.exitCode,
    ...summary,
  }
}

export function privacyEvidencePasses(evidence, expectedScannedFileCount = 42) {
  return (
    evidence.fresh === true &&
    evidence.scannedFileCount === expectedScannedFileCount &&
    evidence.findingCount === 0
  )
}
