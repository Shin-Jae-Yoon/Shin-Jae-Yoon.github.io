#!/usr/bin/env node
import fs from "fs"
import path from "path"
import YAML from "yaml"
import { installPlugins, parsePluginSource } from "./gitLoader.js"
import type { PluginSource, QuartzPluginsJson } from "./types.js"

function readConfiguredPluginSources(): PluginSource[] {
  const configPaths = [
    "quartz.config.yaml",
    "quartz.plugins.json",
    "quartz.config.default.yaml",
    "quartz.plugins.default.json",
  ]
  const configPath = configPaths
    .map((candidate) => path.join(process.cwd(), candidate))
    .find((candidate) => fs.existsSync(candidate))

  if (!configPath) return []

  const raw = fs.readFileSync(configPath, "utf8")
  const config = (
    configPath.endsWith(".yaml") ? YAML.parse(raw) : JSON.parse(raw)
  ) as QuartzPluginsJson
  return config.plugins.filter((plugin) => plugin.enabled).map((plugin) => plugin.source)
}

async function main() {
  const externalPlugins = readConfiguredPluginSources()

  if (externalPlugins.length === 0) {
    console.log("No external plugins to install.")
    return
  }

  console.log(`Installing ${externalPlugins.length} plugin(s) from Git...`)

  const specs = externalPlugins.map((source) => parsePluginSource(source))
  const installed = await installPlugins(specs, { verbose: true })

  if (installed.size === externalPlugins.length) {
    console.log("✓ All plugins installed successfully")
  } else {
    console.error(`✗ Only ${installed.size}/${externalPlugins.length} plugins installed`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error("Failed to install plugins:", err)
  process.exit(1)
})
