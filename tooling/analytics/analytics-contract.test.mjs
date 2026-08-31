import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import YAML from "yaml"

const projectRoot = new URL("../../", import.meta.url)

test("Google Analytics uses the authoritative GA4 tag through one loader integration", async () => {
  const config = YAML.parse(
    await readFile(new URL("quartz.config.default.yaml", projectRoot), "utf8"),
  )
  assert.deepEqual(config.configuration.analytics, {
    provider: "google",
    tagId: "G-GJFBQJ80N7",
  })

  const componentResources = await readFile(
    new URL("quartz/plugins/emitters/componentResources.ts", projectRoot),
    "utf8",
  )
  assert.equal(
    componentResources.match(/https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=\$\{tagId\}/g)
      ?.length ?? 0,
    1,
  )
  assert.equal(
    componentResources.match(/document\.head\.appendChild\(gtagScript\);/g)?.length ?? 0,
    1,
  )
})
