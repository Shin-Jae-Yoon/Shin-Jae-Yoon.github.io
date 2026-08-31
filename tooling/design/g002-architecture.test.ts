import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import { describe, test } from "node:test"
import YAML from "yaml"
import type { QuartzComponentProps } from "../../quartz/components/types"
import { classifyDevUniSurface, type DevUniSurface } from "../../quartz/components/devUniSurface"
import { DevUniFrame } from "../../quartz/components/frames/DevUniFrame"
import { MinimalFrame, resolveFrame } from "../../quartz/components/frames"
import {
  getAllConditionNames,
  getCondition,
  registerDevUniConditions,
} from "../../quartz/plugins/loader/conditions"

const projectFile = (path: string) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

function fileData(
  slug: unknown,
  contentType?: unknown,
  extraFrontmatter: Record<string, unknown> = {},
): QuartzComponentProps["fileData"] {
  const frontmatter: Record<string, unknown> = {
    title: String(slug ?? "fixture"),
    ...extraFrontmatter,
  }
  if (contentType !== undefined) frontmatter.contentType = contentType
  return { slug, frontmatter } as QuartzComponentProps["fileData"]
}

describe("G002 explicit Dev Uni frame", () => {
  test("resolves dev-uni explicitly and rejects unknown frame names", () => {
    const resolved = resolveFrame("dev-uni")

    assert.equal(resolved, DevUniFrame)
    assert.equal(resolved.name, "dev-uni")
    assert.throws(
      () => resolveFrame("dev-uni-typo"),
      /Unknown page frame "dev-uni-typo"/,
      "an unknown frame must fail instead of falling back to DefaultFrame",
    )
  })

  test("keeps the generated 404 page on the minimal frame", async () => {
    const notFoundSource = await projectFile("quartz/plugins/pageTypes/404.ts")

    assert.match(notFoundSource, /layout:\s*"404"/)
    assert.match(notFoundSource, /frame:\s*"minimal"/)
    assert.equal(resolveFrame("minimal"), MinimalFrame)
  })
})

describe("G002 pure Dev Uni surface classification", () => {
  const cases: Array<{
    name: string
    slug: unknown
    contentType?: unknown
    frontmatter?: Record<string, unknown>
    expected: DevUniSurface
  }> = [
    { name: "Home exact index", slug: "index", expected: "home" },
    { name: "About exact slug", slug: "about", expected: "about" },
    { name: "Portfolio index", slug: "portfolio/index", expected: "portfolio-index" },
    {
      name: "Portfolio detail",
      slug: "portfolio/quartz-migration",
      contentType: "portfolio",
      expected: "portfolio-detail",
    },
    { name: "Brain index", slug: "brain/index", expected: "garden-index" },
    {
      name: "Garden detail",
      slug: "garden/progressive-discovery",
      contentType: "garden",
      expected: "garden-detail",
    },
    { name: "Articles index", slug: "articles/index", expected: "articles-index" },
    {
      name: "Articles category",
      slug: "articles/category/technical",
      expected: "articles-category",
    },
    {
      name: "Article detail",
      slug: "articles/reading-first-design",
      contentType: "article",
      expected: "article-detail",
    },
    {
      name: "Tistory article detail",
      slug: "articles/tistory/6",
      contentType: "article",
      expected: "article-detail",
    },
    { name: "Search utility", slug: "search", expected: "utility" },
    { name: "Graph utility", slug: "graph", expected: "utility" },
    { name: "Topics utility", slug: "topics", expected: "utility" },
    { name: "Tag virtual route", slug: "tags/quartz", expected: "utility" },
    { name: "404 virtual route", slug: "404", expected: "utility" },
    {
      name: "Generated nested folder index cannot claim article",
      slug: "articles/tistory/index",
      contentType: "article",
      expected: "utility",
    },
    {
      name: "Alias metadata does not alter canonical detail",
      slug: "articles/reading-first-design",
      contentType: "article",
      frontmatter: { aliases: ["old-reading-route"] },
      expected: "article-detail",
    },
    {
      name: "Alias-shaped slug outside a primary prefix is utility",
      slug: "old-reading-route",
      contentType: "article",
      frontmatter: { aliases: ["articles/reading-first-design"] },
      expected: "utility",
    },
    { name: "Unknown route fallback", slug: "misc/note", expected: "utility" },
    { name: "Missing slug fallback", slug: undefined, expected: "utility" },
    { name: "Non-string slug fallback", slug: 42, expected: "utility" },
    { name: "Empty slug fallback", slug: "", expected: "utility" },
    {
      name: "Detail without contentType fails closed",
      slug: "garden/untagged",
      expected: "utility",
    },
    {
      name: "Detail with non-string contentType fails closed",
      slug: "articles/malformed",
      contentType: ["article"],
      expected: "utility",
    },
    {
      name: "Detail with unknown contentType fails closed",
      slug: "articles/unknown",
      contentType: "post",
      expected: "utility",
    },
    {
      name: "Slug-contentType conflict fails closed",
      slug: "portfolio/conflict",
      contentType: "article",
      expected: "utility",
    },
    {
      name: "Exact primary index rejects asserted contentType",
      slug: "brain/index",
      contentType: "garden",
      expected: "utility",
    },
    {
      name: "Home rejects asserted contentType",
      slug: "index",
      contentType: "article",
      expected: "utility",
    },
  ]

  for (const fixture of cases) {
    test(fixture.name, () => {
      assert.equal(
        classifyDevUniSurface(
          fileData(fixture.slug, fixture.contentType, fixture.frontmatter ?? {}),
        ),
        fixture.expected,
      )
    })
  }
})

describe("G002 named route predicates", () => {
  registerDevUniConditions()

  const expectedNames = [
    "dev-uni-home",
    "dev-uni-about",
    "dev-uni-portfolio",
    "dev-uni-garden",
    "dev-uni-article",
    "dev-uni-utility",
    "dev-uni-explorer",
    "dev-uni-graph",
    "dev-uni-toc",
    "dev-uni-backlinks",
    "dev-uni-reader-mode",
  ]

  test("registers the complete named condition set exactly once", () => {
    const names = getAllConditionNames()
    for (const name of expectedNames) {
      assert.equal(typeof getCondition(name), "function", `${name} must be registered`)
      assert.equal(names.filter((candidate) => candidate === name).length, 1)
    }
    assert.equal(getCondition("dev-uni-unregistered"), undefined)
  })

  const props = (slug: string, contentType?: string) =>
    ({ fileData: fileData(slug, contentType) }) as QuartzComponentProps

  test("matches broad surface predicates through the pure classifier", () => {
    assert.equal(getCondition("dev-uni-home")!(props("index")), true)
    assert.equal(getCondition("dev-uni-about")!(props("about")), true)
    assert.equal(
      getCondition("dev-uni-portfolio")!(props("portfolio/quartz-migration", "portfolio")),
      true,
    )
    assert.equal(
      getCondition("dev-uni-garden")!(props("garden/progressive-discovery", "garden")),
      true,
    )
    assert.equal(
      getCondition("dev-uni-article")!(props("articles/reading-first-design", "article")),
      true,
    )
    assert.equal(getCondition("dev-uni-utility")!(props("search")), true)
  })

  test("matches tool predicates to the binding surface matrix", () => {
    const home = props("index")
    const gardenIndex = props("brain/index")
    const gardenDetail = props("garden/progressive-discovery", "garden")
    const articleDetail = props("articles/reading-first-design", "article")

    for (const name of ["dev-uni-explorer", "dev-uni-graph"]) {
      assert.equal(getCondition(name)!(home), false)
      assert.equal(getCondition(name)!(gardenIndex), true)
      assert.equal(getCondition(name)!(gardenDetail), true)
      assert.equal(getCondition(name)!(articleDetail), false)
    }

    for (const name of ["dev-uni-toc", "dev-uni-backlinks"]) {
      assert.equal(getCondition(name)!(home), false)
      assert.equal(getCondition(name)!(gardenIndex), false)
      assert.equal(getCondition(name)!(gardenDetail), true)
      assert.equal(getCondition(name)!(articleDetail), true)
    }

    assert.equal(getCondition("dev-uni-reader-mode")!(gardenIndex), false)
    assert.equal(getCondition("dev-uni-reader-mode")!(gardenDetail), true)
    assert.equal(getCondition("dev-uni-reader-mode")!(articleDetail), true)
  })
})

describe("G002 YAML header and condition contract", () => {
  test("registers named conditions before either configuration load", async () => {
    const quartzEntry = await projectFile("quartz.ts")
    const registration = quartzEntry.indexOf("registerDevUniConditions()")
    const configLoad = quartzEntry.indexOf("await loadQuartzConfig")
    const layoutLoad = quartzEntry.indexOf("await loadQuartzLayout")

    assert.ok(registration >= 0, "quartz.ts must register Dev Uni conditions")
    assert.ok(configLoad > registration, "conditions must register before loadQuartzConfig")
    assert.ok(layoutLoad > registration, "conditions must register before loadQuartzLayout")
  })

  test("declares a typed/schema-valid first-class header position", async () => {
    const [typesSource, schemaSource] = await Promise.all([
      projectFile("quartz/plugins/loader/types.ts"),
      projectFile("quartz/plugins/quartz-plugins.schema.json"),
    ])
    const schema = JSON.parse(schemaSource)
    const positionEnum = schema.properties.plugins.items.properties.layout.properties.position.enum

    assert.match(typesSource, /LayoutPosition\s*=\s*[^\n]*"header"/)
    assert.ok(positionEnum.includes("header"), "JSON schema must accept the header position")
  })

  test("places unique Quartz-native header controls and named route tools declaratively", async () => {
    const config = YAML.parse(await projectFile("quartz.config.default.yaml"))
    const enabled = config.plugins.filter((entry: { enabled: boolean }) => entry.enabled)
    const plugin = (name: string) => {
      const matches = enabled.filter(
        (entry: { source: string }) => entry.source === `github:quartz-community/${name}`,
      )
      assert.equal(matches.length, 1, `${name} must be configured exactly once`)
      return matches[0]
    }

    const search = plugin("search")
    const darkmode = plugin("darkmode")
    assert.equal(search.layout.position, "header")
    assert.equal(darkmode.layout.position, "header")
    assert.ok(
      search.layout.priority < darkmode.layout.priority,
      "header order must be deterministic",
    )

    const expectedTools = {
      explorer: "dev-uni-explorer",
      graph: "dev-uni-graph",
      "table-of-contents": "dev-uni-toc",
      backlinks: "dev-uni-backlinks",
      "reader-mode": "dev-uni-reader-mode",
    }
    for (const [name, condition] of Object.entries(expectedTools)) {
      assert.equal(plugin(name).layout.condition, condition, `${name} must use a named predicate`)
    }

    const notePropertiesEntries = config.plugins.filter(
      (entry: { source: string }) => entry.source === "github:quartz-community/note-properties",
    )
    assert.equal(notePropertiesEntries.length, 1, "note-properties must have one explicit decision")
    const [noteProperties] = notePropertiesEntries
    assert.equal(noteProperties.enabled, true, "its frontmatter transformer must remain active")
    assert.equal(noteProperties.options.hidePropertiesView, true)
    assert.equal(noteProperties.layout, undefined, "raw Note Properties must not occupy a slot")
  })

  test("unknown conditions fail instead of silently rendering", async () => {
    const loader = await projectFile("quartz/plugins/loader/config-loader.ts")
    const wrapperStart = loader.indexOf("function applyConditionWrapper")
    assert.ok(wrapperStart >= 0)
    const wrapper = loader.slice(wrapperStart, wrapperStart + 900)

    assert.match(wrapper, /if \(!predicate\)[\s\S]*throw new Error\(/)
    assert.doesNotMatch(wrapper, /Component will always render/)
  })

  test("keeps the spike inside the narrow seam with no generated import or dependency drift", async () => {
    const changedSources = [
      "quartz/components/devUniSurface.ts",
      "quartz/components/frames/DevUniFrame.tsx",
      "quartz/components/frames/index.ts",
      "quartz/plugins/loader/types.ts",
      "quartz/plugins/loader/config-loader.ts",
      "quartz/plugins/loader/conditions.ts",
      "quartz/plugins/quartz-plugins.schema.json",
      "quartz.ts",
      "quartz.config.default.yaml",
    ]
    const combined = (await Promise.all(changedSources.map(projectFile))).join("\n")

    assert.doesNotMatch(combined, /(?:from|import\()\s*["'][^"']*\.quartz\/plugins\//)
    assert.doesNotMatch(
      combined,
      /component\s*\.\s*(?:name|displayName)|(?:constructor|function)\.name/,
    )
    assert.doesNotMatch(combined, /window\.location/)

    const [baselineSource, packageLock] = await Promise.all([
      readFile(
        new URL("../../../evidence/design-remediation/current-quartz-source.json", import.meta.url),
        "utf8",
      ),
      projectFile("package-lock.json"),
    ])
    const baseline = JSON.parse(baselineSource)
    const baselineLock = baseline.files.find(
      (binding: { path: string }) => binding.path === "migration/quartz-v5/package-lock.json",
    )
    assert.ok(baselineLock, "Stage 0 must bind the package lock")
    assert.equal(
      createHash("sha256").update(packageLock).digest("hex"),
      baselineLock.sha256,
      "G002 must add no dependency",
    )
  })
})
