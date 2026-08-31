function normalizeAccessibilityState() {
  for (const explorer of document.querySelectorAll<HTMLElement>(".explorer")) {
    const content = explorer.querySelector<HTMLElement>(".explorer-content")
    if (!content?.id) continue

    const expanded = explorer.classList.contains("collapsed") ? "false" : "true"
    explorer.removeAttribute("aria-expanded")
    content.removeAttribute("aria-expanded")

    for (const button of explorer.querySelectorAll<HTMLElement>(".explorer-toggle")) {
      button.setAttribute("aria-controls", content.id)
      button.setAttribute("aria-expanded", expanded)
    }
  }

  for (const toc of document.querySelectorAll<HTMLElement>(".toc")) {
    const button = toc.querySelector<HTMLElement>(".toc-header")
    const content = toc.querySelector<HTMLElement>(".toc-content")
    if (button && content?.id) button.setAttribute("aria-controls", content.id)
  }
}

function normalizeCurrentTocSection() {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(".toc a[data-for]"))
  const candidates = links.flatMap((link) => {
    const id = link.dataset.for
    const heading = id ? document.getElementById(id) : null
    return heading ? [{ link, heading }] : []
  })
  const first = candidates[0]
  if (!first) return

  const activationLine = Math.min(160, window.innerHeight * 0.24)
  let current = first
  for (const candidate of candidates) {
    if (candidate.heading.getBoundingClientRect().top > activationLine) break
    current = candidate
  }

  for (const { link } of candidates) {
    const isCurrent = link === current.link
    link.classList.toggle("in-view", isCurrent)
    link.classList.toggle("du-current", isCurrent)
    if (isCurrent) link.setAttribute("aria-current", "location")
    else link.removeAttribute("aria-current")
  }
}

let tocNormalizationPending = false
function scheduleTocNormalization() {
  if (tocNormalizationPending) return
  tocNormalizationPending = true
  requestAnimationFrame(() => {
    tocNormalizationPending = false
    normalizeCurrentTocSection()
  })
}

let normalizationPending = false
function scheduleAccessibilityNormalization() {
  if (normalizationPending) return
  normalizationPending = true
  queueMicrotask(() => {
    normalizationPending = false
    normalizeAccessibilityState()
  })
}

document.addEventListener("nav", scheduleAccessibilityNormalization)
document.addEventListener("render", scheduleAccessibilityNormalization)
document.addEventListener("nav", scheduleTocNormalization)
document.addEventListener("render", scheduleTocNormalization)
window.addEventListener("scroll", scheduleTocNormalization, { passive: true })
window.addEventListener("resize", scheduleTocNormalization, { passive: true })

const accessibilityObserver = new MutationObserver((records) => {
  if (records.some((record) => (record.target as Element).closest?.(".explorer"))) {
    scheduleAccessibilityNormalization()
  }
  if (records.some((record) => (record.target as Element).closest?.(".toc"))) {
    scheduleTocNormalization()
  }
})
accessibilityObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["class"],
  subtree: true,
})

window.addEventListener("DOMContentLoaded", scheduleAccessibilityNormalization, { once: true })
window.addEventListener("DOMContentLoaded", scheduleTocNormalization, { once: true })
