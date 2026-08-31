function updateAttribute(tag: string, name: string, value: string): string {
  const attribute = new RegExp(`\\s${name}=(?:"[^"]*"|'[^']*')`)
  const withoutAttribute = tag.replace(attribute, "")
  return withoutAttribute.replace(/>$/, ` ${name}="${value}">`)
}

function removeAttribute(tag: string, name: string): string {
  return tag.replace(new RegExp(`\\s${name}=(?:"[^"]*"|'[^']*')`, "g"), "")
}

/**
 * Normalizes accessibility markup emitted by externally managed components.
 *
 * The upstream component trees are installed into the ignored `.quartz` cache,
 * so output repairs belong here rather than in files that disappear on a clean
 * install. Keep these transforms narrow and tied to stable public class names.
 */
export function normalizeRenderedAccessibility(markup: string): string {
  const explorerContentId = markup.match(
    /<div\b[^>]*\bid="([^"]+)"[^>]*\bclass="[^"]*\bexplorer-content\b[^"]*"[^>]*>/,
  )?.[1]

  let normalized = markup.replace(
    /<div\b[^>]*\bclass="[^"]*\bexplorer-content\b[^"]*"[^>]*>/g,
    (tag) => removeAttribute(tag, "aria-expanded"),
  )

  if (explorerContentId) {
    normalized = normalized.replace(
      /<button\b[^>]*\bclass="[^"]*\bmobile-explorer\b[^"]*"[^>]*>/g,
      (tag) =>
        updateAttribute(
          updateAttribute(tag, "aria-controls", explorerContentId),
          "aria-expanded",
          "false",
        ),
    )
    normalized = normalized.replace(
      /<button\b[^>]*\bclass="[^"]*\bdesktop-explorer\b[^"]*"[^>]*>/g,
      (tag) =>
        updateAttribute(
          updateAttribute(tag, "aria-controls", explorerContentId),
          "aria-expanded",
          "true",
        ),
    )
  }

  const tocContentId = normalized.match(
    /<ul\b[^>]*\bid="([^"]+)"[^>]*\bclass="[^"]*\btoc-content\b[^"]*"[^>]*>/,
  )?.[1]
  if (tocContentId) {
    normalized = normalized.replace(
      /<button\b[^>]*\bclass="[^"]*\btoc-header\b[^"]*"[^>]*>/g,
      (tag) => updateAttribute(tag, "aria-controls", tocContentId),
    )
  }

  return normalized.replace(/<h3>([^<]*)<\/h3>(?=\s*<div class="graph-outer">)/g, "<h2>$1</h2>")
}
