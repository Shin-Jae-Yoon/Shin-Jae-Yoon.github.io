import { QuartzPluginData } from "../plugins/vfile"

export type DevUniSurface =
  | "home"
  | "about"
  | "portfolio-index"
  | "portfolio-detail"
  | "garden-index"
  | "garden-detail"
  | "articles-index"
  | "articles-category"
  | "article-detail"
  | "utility"

type DevUniContentType = "portfolio" | "garden" | "article"

const INDEX_SURFACES = {
  index: "home",
  about: "about",
  "portfolio/index": "portfolio-index",
  "brain/index": "garden-index",
  "articles/index": "articles-index",
} as const satisfies Record<string, Exclude<DevUniSurface, "utility">>

const DETAIL_SURFACES = {
  portfolio: { contentType: "portfolio", surface: "portfolio-detail" },
  garden: { contentType: "garden", surface: "garden-detail" },
  articles: { contentType: "article", surface: "article-detail" },
} as const satisfies Record<
  string,
  { contentType: DevUniContentType; surface: Exclude<DevUniSurface, "utility"> }
>

function declaredContentType(fileData: QuartzPluginData): unknown {
  const frontmatter = fileData.frontmatter
  if (!frontmatter || typeof frontmatter !== "object" || Array.isArray(frontmatter)) {
    return undefined
  }

  return (frontmatter as Record<string, unknown>).contentType
}

function isCanonicalSlug(slug: unknown): slug is string {
  return (
    typeof slug === "string" &&
    slug.length > 0 &&
    !slug.startsWith("/") &&
    !slug.endsWith("/") &&
    !slug.includes("//") &&
    !slug.split("/").some((segment) => segment === "." || segment === "..")
  )
}

/**
 * Classify a rendered route into one Dev Uni product surface.
 *
 * Slugs are the selector. Detail `contentType` values are consistency assertions:
 * missing, malformed, or conflicting assertions fail closed to `utility`.
 */
export function classifyDevUniSurface(fileData: QuartzPluginData): DevUniSurface {
  const slug = fileData.slug
  if (!isCanonicalSlug(slug)) return "utility"

  const contentType = declaredContentType(fileData)
  const exactSurface = INDEX_SURFACES[slug as keyof typeof INDEX_SURFACES]
  if (exactSurface) {
    return contentType === undefined ? exactSurface : "utility"
  }

  const [prefix, ...rest] = slug.split("/")
  if (prefix === "brain" && rest.length > 0) {
    return "garden-detail"
  }

  if (prefix === "articles" && rest[0] === "category" && rest.length === 2) {
    return contentType === undefined ? "articles-category" : "utility"
  }

  const detail = DETAIL_SURFACES[prefix as keyof typeof DETAIL_SURFACES]
  if (!detail || rest.length === 0 || rest.some((segment) => segment.length === 0)) {
    return "utility"
  }

  // Generated folder indexes and alias/virtual routes are not authored detail surfaces.
  if (rest[rest.length - 1] === "index") return "utility"

  return contentType === detail.contentType ? detail.surface : "utility"
}

export const isDevUniHome = (fileData: QuartzPluginData): boolean =>
  classifyDevUniSurface(fileData) === "home"

export const isDevUniAbout = (fileData: QuartzPluginData): boolean =>
  classifyDevUniSurface(fileData) === "about"

export const isDevUniPortfolio = (fileData: QuartzPluginData): boolean => {
  const surface = classifyDevUniSurface(fileData)
  return surface === "portfolio-index" || surface === "portfolio-detail"
}

export const isDevUniGarden = (fileData: QuartzPluginData): boolean => {
  const surface = classifyDevUniSurface(fileData)
  return surface === "garden-index" || surface === "garden-detail"
}

export const isDevUniArticle = (fileData: QuartzPluginData): boolean => {
  const surface = classifyDevUniSurface(fileData)
  return (
    surface === "articles-index" || surface === "articles-category" || surface === "article-detail"
  )
}

export const isDevUniUtility = (fileData: QuartzPluginData): boolean =>
  classifyDevUniSurface(fileData) === "utility"
