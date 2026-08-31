import assert from "node:assert/strict"
import { readFile, readdir } from "node:fs/promises"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { parse } from "yaml"

const here = path.dirname(fileURLToPath(import.meta.url))
const quartzRoot = path.resolve(here, "../..")
const contentRoot = path.join(quartzRoot, "content")
const productDate = "2026-07-19T00:00:00+09:00"
const productGeneratedPaths = new Set([
  "content/about.md",
  "content/articles/index.md",
  "content/garden/index.md",
  "content/graph.md",
  "content/index.md",
  "content/portfolio/index.md",
  "content/search.md",
  "content/topics.md",
])
const recognizedDateFields = ["created", "modified", "published"]
const preciseIsoDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/

async function markdownFiles(root) {
  const files = []
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name)
    if (entry.isDirectory()) files.push(...(await markdownFiles(absolute)))
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(absolute)
  }
  return files.sort()
}

function frontmatter(source, relativePath) {
  const match = source.match(/^---\n([\s\S]*?)\n---(?:\n|$)/)
  assert.ok(match, `${relativePath} must have YAML frontmatter`)
  return parse(match[1])
}

function assertValidDate(value, field, relativePath) {
  assert.equal(typeof value, "string", `${relativePath} ${field} must be an explicit string`)
  assert.match(value, preciseIsoDate, `${relativePath} ${field} must be a precise ISO date`)
  assert.ok(Number.isFinite(Date.parse(value)), `${relativePath} ${field} must parse as a date`)
  const [year, month, day] = value.slice(0, 10).split("-").map(Number)
  const calendarDate = new Date(Date.UTC(year, month - 1, day))
  assert.equal(calendarDate.getUTCFullYear(), year, `${relativePath} ${field} has an invalid year`)
  assert.equal(
    calendarDate.getUTCMonth() + 1,
    month,
    `${relativePath} ${field} has an invalid month`,
  )
  assert.equal(calendarDate.getUTCDate(), day, `${relativePath} ${field} has an invalid day`)
}

test("all public Markdown inputs have stable CreatedModifiedDate frontmatter", async () => {
  const config = parse(await readFile(path.join(quartzRoot, "quartz.config.default.yaml"), "utf8"))
  assert.equal(
    config.configuration.generatedPageDate,
    productDate,
    "generated virtual pages must use the stable migration date",
  )
  const files = (await markdownFiles(contentRoot)).filter(
    (absolute) => !absolute.startsWith(`${path.join(contentRoot, "brain")}${path.sep}`),
  )
  assert.equal(files.length, 28, "the product and Tistory Markdown input inventory changed")

  for (const absolute of files) {
    const relativePath = path.relative(quartzRoot, absolute).split(path.sep).join("/")
    const metadata = frontmatter(await readFile(absolute, "utf8"), relativePath)
    for (const field of recognizedDateFields) {
      assert.ok(Object.hasOwn(metadata, field), `${relativePath} is missing ${field}`)
      assertValidDate(metadata[field], field, relativePath)
    }
    assert.ok(
      !Object.hasOwn(metadata, "date"),
      `${relativePath} must not use the ambiguous date key`,
    )

    if (relativePath.startsWith("content/articles/tistory/")) {
      assertValidDate(metadata.originalPublished, "originalPublished", relativePath)
      for (const field of recognizedDateFields) {
        assert.equal(
          metadata[field],
          metadata.originalPublished,
          `${relativePath} ${field} drifted`,
        )
      }
    } else if (productGeneratedPaths.has(relativePath)) {
      for (const field of recognizedDateFields) {
        assert.equal(metadata[field], productDate, `${relativePath} ${field} drifted`)
      }
    } else {
      assert.ok(
        Date.parse(metadata.created) <= Date.parse(metadata.modified),
        `${relativePath} created must not be later than modified`,
      )
      assert.ok(
        Date.parse(metadata.published) <= Date.parse(metadata.modified),
        `${relativePath} published must not be later than modified`,
      )
    }
  }
})
