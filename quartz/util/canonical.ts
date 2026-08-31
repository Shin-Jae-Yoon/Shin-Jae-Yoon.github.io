import { FullSlug } from "./path"

export function normalizeCanonicalPath(pathname: string): string {
  const withoutQuery = pathname.split(/[?#]/, 1)[0] ?? "/"
  const decoded = withoutQuery
    .split("/")
    .map((segment) => {
      try {
        return decodeURIComponent(segment)
      } catch {
        return segment
      }
    })
    .join("/")
  const encoded = decoded
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")

  return encoded === "" || encoded === "index" ? "/" : `/${encoded.replace(/\/index$/, "")}`
}

export function canonicalPathForSlug(slug: FullSlug | string | undefined): string {
  if (!slug || slug === "index") return "/"
  return normalizeCanonicalPath(`/${slug}`)
}

export function canonicalUrl(baseUrl: string, slug: FullSlug | string | undefined): string {
  const origin = new URL(`https://${baseUrl}`).origin
  return new URL(canonicalPathForSlug(slug), origin).toString()
}
