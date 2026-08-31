import { canonicalPathForSlug, canonicalUrl } from "./canonical"

type ArticleDates = {
  published?: string
  modified?: string
}

const segmentLabels: Record<string, string> = {
  articles: "Articles",
  brain: "Garden",
  garden: "Garden",
  portfolio: "Portfolio",
  tags: "Tags",
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

export function buildPageStructuredData(options: {
  baseUrl: string
  slug: string | undefined
  siteTitle: string
  title: string
  description: string
  image: string
  dates?: ArticleDates
}): Record<string, unknown>[] {
  const { baseUrl, slug, siteTitle, title, description, image, dates } = options
  const pageUrl = canonicalUrl(baseUrl, slug)
  if (!slug || slug === "index") {
    return [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteTitle,
        description,
        url: pageUrl,
        image,
      },
    ]
  }
  if (slug === "404") return []

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: pageUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    datePublished: dates?.published,
    dateModified: dates?.modified ?? dates?.published,
    author: { "@type": "Person", name: "신재윤" },
    image,
  }

  const segments = canonicalPathForSlug(slug).split("/").filter(Boolean)
  const itemListElement = [
    {
      "@type": "ListItem",
      position: 1,
      name: siteTitle,
      item: canonicalUrl(baseUrl, "index"),
    },
    ...segments.map((segment, index) => {
      const path = segments.slice(0, index + 1).join("/")
      const decoded = decodeSegment(segment)
      return {
        "@type": "ListItem",
        position: index + 2,
        name:
          index === segments.length - 1
            ? title
            : (segmentLabels[decoded.toLowerCase()] ?? decoded.replaceAll("-", " ")),
        item: canonicalUrl(baseUrl, path),
      }
    }),
  ]

  return [
    article,
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement,
    },
  ]
}

export function jsonLdMarkup(value: Record<string, unknown>): string {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}
