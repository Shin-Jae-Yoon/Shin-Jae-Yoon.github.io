import assert from "node:assert/strict"
import test from "node:test"
import { GlobalConfiguration } from "../cfg"
import { QuartzComponentProps } from "./types"
import { HOME_DESCRIPTION, resolvePageDescription } from "./pageDescription"

const cfg = { locale: "ko-KR" } as GlobalConfiguration

test("home receives a useful description without requiring content metadata", () => {
  const fileData = {
    slug: "index",
    frontmatter: { title: "Brain" },
    description: "",
  } as QuartzComponentProps["fileData"]

  assert.equal(resolvePageDescription(cfg, fileData), HOME_DESCRIPTION)
  assert.ok(HOME_DESCRIPTION.length >= 50)
})

test("explicit page descriptions remain authoritative", () => {
  const fileData = {
    slug: "articles/example",
    frontmatter: { description: "명시적인 문서 설명" },
    description: "추출된 설명",
  } as QuartzComponentProps["fileData"]

  assert.equal(resolvePageDescription(cfg, fileData), "명시적인 문서 설명")
})

test("non-root pages receive unique non-placeholder fallback descriptions", () => {
  const about = {
    slug: "about",
    frontmatter: { title: "About" },
    description: "",
  } as QuartzComponentProps["fileData"]
  const tags = {
    slug: "tags",
    frontmatter: { title: "태그" },
    description: "",
  } as QuartzComponentProps["fileData"]

  const aboutDescription = resolvePageDescription(cfg, about)
  const tagsDescription = resolvePageDescription(cfg, tags)
  assert.notEqual(aboutDescription, tagsDescription)
  assert.doesNotMatch(aboutDescription, /설명 없음/)
  assert.doesNotMatch(tagsDescription, /설명 없음/)
})
