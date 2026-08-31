import { computePosition, flip, inline, shift } from "@floating-ui/dom"
import { normalizeRelativeURLs } from "../../util/path"
import { fetchCanonical } from "./util"

const p = new DOMParser()
let activeAnchor: HTMLAnchorElement | null = null
let popoverController: AbortController | null = null

const gardenSurfaces = new Set(["garden-index", "garden-detail"])

function currentGardenFrame(): HTMLElement | null {
  const frame = document.querySelector<HTMLElement>(".dev-uni-frame[data-surface]")
  return frame && gardenSurfaces.has(frame.dataset.surface ?? "") ? frame : null
}

function isGardenDestination(link: HTMLAnchorElement): boolean {
  const target = new URL(link.href, window.location.href)
  if (target.origin !== window.location.origin) return false

  const pathname = target.pathname.replace(/\/$/, "")
  return pathname === "/brain" || pathname.startsWith("/brain/")
}

function isEligiblePopoverLink(link: HTMLAnchorElement): boolean {
  if (window.matchMedia("(max-width: 800px)").matches) return false
  if (link.dataset.noPopover === "true") return false

  const frame = currentGardenFrame()
  if (!frame || !frame.contains(link)) return false
  if (link.closest(".dev-uni-header, .dev-uni-footer, .breadcrumb-container")) return false

  const allowedSource =
    link.matches(".markdown-preview-view a.internal") || link.matches(".backlinks a.internal")

  return allowedSource && isGardenDestination(link)
}

async function mouseEnterHandler(
  link: HTMLAnchorElement,
  { clientX, clientY }: { clientX: number; clientY: number },
) {
  if (!isEligiblePopoverLink(link)) return
  activeAnchor = link

  async function setPosition(popoverElement: HTMLElement) {
    const { x, y } = await computePosition(link, popoverElement, {
      strategy: "fixed",
      middleware: [inline({ x: clientX, y: clientY }), shift(), flip()],
    })
    Object.assign(popoverElement.style, {
      transform: `translate(${x.toFixed()}px, ${y.toFixed()}px)`,
    })
  }

  function showPopover(popoverElement: HTMLElement) {
    clearActivePopover()
    activeAnchor = link
    popoverElement.classList.add("active-popover")
    setPosition(popoverElement as HTMLElement)

    if (hash !== "") {
      const inner = popoverElement.querySelector(".popover-inner") as HTMLElement | null
      if (inner) {
        const targetAnchor = `#popover-internal-${hash.slice(1)}`
        const heading = inner.querySelector(targetAnchor) as HTMLElement | null
        if (heading) {
          // leave ~12px of buffer when scrolling to a heading
          inner.scroll({ top: heading.offsetTop - 12, behavior: "instant" })
        }
      }
    }
  }

  const targetUrl = new URL(link.href)
  const hash = decodeURIComponent(targetUrl.hash)
  targetUrl.hash = ""
  targetUrl.search = ""
  const popoverId = `popover-${link.pathname}`
  const prevPopoverElement = document.getElementById(popoverId)

  // dont refetch if there's already a popover
  if (!!document.getElementById(popoverId)) {
    showPopover(prevPopoverElement as HTMLElement)
    return
  }

  const response = await fetchCanonical(targetUrl).catch((err) => {
    console.error(err)
  })

  if (!response) return
  const rawContentType = response.headers.get("Content-Type")
  if (!rawContentType) return
  const [contentType] = rawContentType.split(";")
  const [contentTypeCategory, typeInfo] = contentType.split("/")

  const popoverElement = document.createElement("div")
  popoverElement.id = popoverId
  popoverElement.classList.add("popover")
  const popoverInner = document.createElement("div")
  popoverInner.classList.add("popover-inner")
  popoverInner.dataset.contentType = contentType ?? undefined
  popoverElement.appendChild(popoverInner)

  switch (contentTypeCategory) {
    case "image":
      const img = document.createElement("img")
      img.src = targetUrl.toString()
      img.alt = targetUrl.pathname

      popoverInner.appendChild(img)
      break
    case "application":
      switch (typeInfo) {
        case "pdf":
          const pdf = document.createElement("iframe")
          pdf.src = targetUrl.toString()
          popoverInner.appendChild(pdf)
          break
        default:
          break
      }
      break
    default:
      const contents = await response.text()
      const html = p.parseFromString(contents, "text/html")
      const targetSurface = html.querySelector<HTMLElement>(".dev-uni-frame[data-surface]")?.dataset
        .surface
      if (!targetSurface || !gardenSurfaces.has(targetSurface)) return
      normalizeRelativeURLs(html, targetUrl)
      // prepend all IDs inside popovers to prevent duplicates
      html.querySelectorAll("[id]").forEach((el) => {
        const targetID = `popover-internal-${el.id}`
        el.id = targetID
      })
      const elts = [...html.getElementsByClassName("popover-hint")]
      if (elts.length === 0) return

      elts.forEach((elt) => popoverInner.appendChild(elt))
  }

  if (document.getElementById(popoverId)) return
  if (activeAnchor !== link || !link.isConnected || !isEligiblePopoverLink(link)) return

  document.body.appendChild(popoverElement)
  showPopover(popoverElement)
}

function clearActivePopover(remove = false) {
  activeAnchor = null
  const allPopoverElements = document.querySelectorAll(".popover")
  allPopoverElements.forEach((popoverElement) => {
    popoverElement.classList.remove("active-popover")
    if (remove) popoverElement.remove()
  })
}

function setupPopovers() {
  popoverController?.abort()
  popoverController = new AbortController()
  clearActivePopover(!currentGardenFrame())

  const { signal } = popoverController
  document.addEventListener(
    "mouseover",
    (event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const link = target.closest<HTMLAnchorElement>("a")
      if (!link || link.contains(event.relatedTarget as Node | null)) return
      void mouseEnterHandler(link, event)
    },
    { signal },
  )
  document.addEventListener(
    "mouseout",
    (event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const link = target.closest<HTMLAnchorElement>("a")
      if (!link || link.contains(event.relatedTarget as Node | null)) return
      if (activeAnchor === link) clearActivePopover()
    },
    { signal },
  )

  window.addCleanup(() => {
    popoverController?.abort()
    clearActivePopover(true)
  })
}

function clearBeforeNavigation() {
  popoverController?.abort()
  clearActivePopover(true)
}

document.addEventListener("prenav", clearBeforeNavigation)
document.addEventListener("nav", setupPopovers)
document.addEventListener("render", setupPopovers)
