import assert from "node:assert/strict"
import test from "node:test"
import {
  createPassingReport,
  evaluateFinalGates,
  privacyEvidencePasses,
  requiredCommandIds,
  requiredGateIds,
} from "./final-gates.mjs"

function passingInputs() {
  return {
    commands: requiredCommandIds.map((id) => ({ id, exitCode: 0 })),
    gates: Object.fromEntries(requiredGateIds.map((id) => [id, { status: "pass", fresh: true }])),
  }
}

test("a failed fresh sub-gate cannot emit a PASS final report", () => {
  const inputs = passingInputs()
  inputs.commands.find((entry) => entry.id === "tests").exitCode = 1
  inputs.gates.tests.status = "fail"
  const evaluation = evaluateFinalGates(inputs)
  assert.equal(evaluation.status, "fail")
  assert.throws(() => createPassingReport({ schemaVersion: 1 }, evaluation), /fail-closed/)
})

test("zero scanned privacy files cannot satisfy the accepted privacy boundary", () => {
  assert.equal(privacyEvidencePasses({ fresh: true, scannedFileCount: 0, findingCount: 0 }), false)
  assert.equal(privacyEvidencePasses({ fresh: true, scannedFileCount: 42, findingCount: 0 }), true)
})

test("a stale passing sub-gate cannot emit a PASS final report", () => {
  const inputs = passingInputs()
  inputs.gates.privacy.fresh = false
  const evaluation = evaluateFinalGates(inputs)
  assert.equal(evaluation.status, "fail")
  assert.throws(() => createPassingReport({ schemaVersion: 1 }, evaluation), /stale: privacy/)
})
