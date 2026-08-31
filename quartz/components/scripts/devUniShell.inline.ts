const mobileNavigation = window.matchMedia("(max-width: 1200px)")
const graphObservers = new WeakMap<HTMLElement, MutationObserver>()
let previousSurface: string | null = null

function resolveSitePath(pathname: string): string {
  const basePath = document.body.dataset.basepath?.replace(/\/+$/, "") ?? ""
  return `${basePath}/${pathname.replace(/^\/+/, "")}`
}

function enforceReaderSurfaceBoundary() {
  queueMicrotask(() => {
    if (document.querySelector("button.readermode")) return
    if (document.documentElement.getAttribute("reader-mode") !== "on") return

    document.documentElement.setAttribute("reader-mode", "off")
    document.dispatchEvent(
      new CustomEvent("readermodechange", { detail: { mode: "off" as const } }),
    )
  })
}

function resetGraphVisitColors() {
  try {
    localStorage.removeItem("graph-visited")
  } catch {
    // Graph rendering remains usable when storage access is unavailable.
  }
}

function setupGraphFallback() {
  const containers = Array.from(
    document.querySelectorAll<HTMLElement>(".graph-outer > .graph-container"),
  )
  const sync = (container: HTMLElement) => {
    const outer = container.closest<HTMLElement>(".graph-outer")
    if (!outer) return
    if (container.querySelector("canvas, svg")) {
      delete outer.dataset.graphState
      return
    }

    const unavailable =
      outer.dataset.graphState === "unavailable" ||
      container.textContent?.includes("Graph could not load")
    if (!unavailable) return

    outer.dataset.graphState = "unavailable"
    if (container.querySelector("[data-graph-fallback]")) return

    const message = document.createElement("p")
    message.dataset.graphFallback = "true"
    message.append("그래프를 불러오지 못했습니다. ")
    const link = document.createElement("a")
    link.href = resolveSitePath("brain")
    link.className = "internal internal-link"
    link.textContent = "Brain에서 텍스트로 탐색"
    message.append(link)
    container.replaceChildren(message)
  }

  for (const container of containers) {
    sync(container)
    if (graphObservers.has(container)) continue

    const observer = new MutationObserver(() => sync(container))
    observer.observe(container, { childList: true, subtree: true, characterData: true })
    graphObservers.set(container, observer)
    window.addCleanup(() => {
      if (graphObservers.get(container) !== observer) return
      observer.disconnect()
      graphObservers.delete(container)
    })
  }
}

function setupGraphLegend() {
  const graphs = Array.from(document.querySelectorAll<HTMLElement>(".graph"))
  const states = [
    { key: "current", label: "현재 노트" },
    { key: "related", label: "직접 연결" },
    { key: "unrelated", label: "기타 Brain" },
  ] as const

  for (const graph of graphs) {
    if (graph.querySelector("[data-graph-legend]")) continue
    const outer = graph.querySelector(":scope > .graph-outer")
    if (!outer) continue

    const legend = document.createElement("ul")
    legend.className = "dev-uni-graph-legend"
    legend.dataset.graphLegend = "true"
    legend.setAttribute("aria-label", "그래프 관계 범례")
    for (const state of states) {
      const item = document.createElement("li")
      item.dataset.graphDepth = state.key
      const marker = document.createElement("span")
      marker.setAttribute("aria-hidden", "true")
      item.append(marker, state.label)
      legend.append(item)
    }
    outer.insertAdjacentElement("beforebegin", legend)
  }
}

function clearExplorerSavedState() {
  try {
    localStorage.removeItem("fileTree")
    sessionStorage.removeItem("explorerScrollTop")
  } catch {
    // A closed-by-default Explorer does not depend on storage access.
  }
}

function collapseExplorerFolders(explorer: HTMLElement) {
  for (const folder of explorer.querySelectorAll<HTMLElement>(".folder-outer.open")) {
    folder.classList.remove("open")
  }
}

function enforceInitialExplorerCollapse(explorer: HTMLElement) {
  const tree = explorer.querySelector<HTMLElement>(".explorer-ul")
  if (!tree) return

  collapseExplorerFolders(explorer)
  if (tree.querySelector(".folder-container")) return

  let settleTimer: number | undefined
  let maximumTimer: number | undefined
  const disconnect = () => {
    if (settleTimer !== undefined) window.clearTimeout(settleTimer)
    if (maximumTimer !== undefined) window.clearTimeout(maximumTimer)
    observer.disconnect()
  }
  const observer = new MutationObserver(() => {
    collapseExplorerFolders(explorer)
    if (settleTimer !== undefined) window.clearTimeout(settleTimer)
    settleTimer = window.setTimeout(disconnect, 120)
  })
  observer.observe(tree, { childList: true, subtree: true })
  maximumTimer = window.setTimeout(disconnect, 2000)
  window.addCleanup(disconnect)
}

function setupBrainExplorer() {
  const frame = document.querySelector<HTMLElement>(".dev-uni-frame")
  const currentSurface = frame?.dataset.surface ?? null
  const isBrain = currentSurface?.startsWith("garden-") ?? false
  const wasBrain = previousSurface?.startsWith("garden-") ?? false

  if (!isBrain) {
    if (wasBrain) clearExplorerSavedState()
    previousSurface = currentSurface
    return
  }

  // `previousSurface`가 null인 것은 이 페이지 로드의 첫 nav라는 뜻이지 Brain 밖에서
  // 들어왔다는 뜻이 아니다. 그것까지 "들어옴"으로 세면, 그래프에서 노드를 눌러
  // 전체 이동을 하거나 링크를 새 탭에서 열 때마다 노트 탐색이 통째로 접힌다.
  // Brain 탭을 눌러 처음부터 접는 일은 Explorer 쪽 rootPath 패치가 맡는다.
  const enteredBrain = previousSurface !== null && !wasBrain
  if (enteredBrain) clearExplorerSavedState()

  for (const explorer of document.querySelectorAll<HTMLElement>(".explorer.nav-files-container")) {
    if (enteredBrain) enforceInitialExplorerCollapse(explorer)

    // Brain's desktop note explorer is a persistent rail, not a dismissible panel.
    // Restore it after SPA backlink navigation or after leaving reader mode.
    if (
      !mobileNavigation.matches &&
      document.documentElement.getAttribute("reader-mode") !== "on"
    ) {
      explorer.classList.remove("collapsed")
      explorer.setAttribute("aria-expanded", "true")
      explorer
        .querySelector<HTMLElement>(".explorer-content")
        ?.setAttribute("aria-expanded", "true")
    }

    const mobileToggle = explorer.querySelector<HTMLButtonElement>(".mobile-explorer")
    if (mobileToggle && mobileToggle.dataset.inFlowReady !== "true") {
      mobileToggle.dataset.inFlowReady = "true"
      const releaseDocumentScroll = () => {
        queueMicrotask(() => document.documentElement.classList.remove("mobile-no-scroll"))
      }
      mobileToggle.addEventListener("click", releaseDocumentScroll)
      window.addCleanup(() => {
        mobileToggle.removeEventListener("click", releaseDocumentScroll)
        delete mobileToggle.dataset.inFlowReady
      })
    }

    const explorerContent = explorer.querySelector<HTMLElement>(".explorer-content")
    let toolbar = explorer.querySelector<HTMLElement>(".dev-uni-explorer-toolbar")
    if (!toolbar && explorerContent) {
      toolbar = document.createElement("div")
      toolbar.className = "dev-uni-explorer-toolbar"
      explorer.insertBefore(toolbar, explorerContent)
    }

    const desktopTitle = explorer.querySelector<HTMLElement>(".desktop-explorer")
    if (desktopTitle) desktopTitle.hidden = true

    let explorerHeading = toolbar?.querySelector<HTMLHeadingElement>(".dev-uni-explorer-heading")
    if (!explorerHeading && toolbar) {
      explorerHeading = document.createElement("h2")
      explorerHeading.className = "dev-uni-explorer-heading"
      explorerHeading.textContent = "노트 탐색"
      toolbar.prepend(explorerHeading)
    }

    let collapseAllButton = explorer.querySelector<HTMLButtonElement>(".dev-uni-collapse-all")
    if (!collapseAllButton) {
      const button = document.createElement("button")
      button.type = "button"
      button.className = "dev-uni-collapse-all"
      button.textContent = "모두 접기"
      button.setAttribute("aria-label", "노트 탐색 폴더 모두 접기")
      const collapseAll = () => {
        clearExplorerSavedState()
        collapseExplorerFolders(explorer)
      }
      button.addEventListener("click", collapseAll)
      collapseAllButton = button
      window.addCleanup(() => button.removeEventListener("click", collapseAll))
    }
    if (toolbar && collapseAllButton.parentElement !== toolbar) toolbar.append(collapseAllButton)
  }

  previousSurface = currentSurface
}

function setupDevUniShell() {
  const toggle = document.querySelector<HTMLButtonElement>("button.site-menu-toggle")
  const navigation = document.querySelector<HTMLElement>("nav.primary-navigation")
  if (!toggle || !navigation || toggle.dataset.shellReady === "true") return

  toggle.dataset.shellReady = "true"
  const root = document.documentElement
  const frame = document.querySelector<HTMLElement>(".dev-uni-frame")
  const backdrop = document.querySelector<HTMLButtonElement>(".dev-uni-mobile-drawer-backdrop")
  const explorer = frame?.querySelector<HTMLElement>(".explorer.nav-files-container") ?? null
  const explorerContent = explorer?.querySelector<HTMLElement>(".explorer-content") ?? null

  const setExplorerExpanded = (expanded: boolean) => {
    if (!explorer) return
    explorer.classList.toggle("collapsed", !expanded)
    explorer.setAttribute("aria-expanded", String(expanded))
    explorerContent?.setAttribute("aria-expanded", String(expanded))
    for (const explorerToggle of explorer.querySelectorAll<HTMLElement>(".explorer-toggle")) {
      explorerToggle.setAttribute("aria-expanded", String(expanded))
    }
  }
  const setExpanded = (expanded: boolean) => {
    const mobileExpanded = mobileNavigation.matches && expanded
    toggle.setAttribute("aria-expanded", String(expanded))
    toggle.setAttribute("aria-label", expanded ? "메뉴 닫기" : "메뉴 열기")
    navigation.dataset.open = String(expanded)
    root.classList.toggle("dev-uni-mobile-drawer-open", mobileExpanded)
    root.classList.toggle("mobile-no-scroll", mobileExpanded)
    backdrop?.setAttribute("aria-hidden", String(!mobileExpanded))
    if (mobileNavigation.matches) setExplorerExpanded(mobileExpanded)
  }
  const close = () => setExpanded(false)
  const click = () => setExpanded(toggle.getAttribute("aria-expanded") !== "true")
  const closeFromNavigation = (event: Event) => {
    if (!(event.target as Element).closest("a")) return
    close()
  }
  const closeFromExplorer = (event: Event) => {
    if (!(event.target as Element).closest("a.nav-file-title")) return
    close()
  }
  const keydown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || toggle.getAttribute("aria-expanded") !== "true") return
    close()
    toggle.focus()
  }
  const viewportChange = () => {
    if (!mobileNavigation.matches) close()
  }

  close()
  toggle.addEventListener("click", click)
  backdrop?.addEventListener("click", close)
  navigation.addEventListener("click", closeFromNavigation)
  explorer?.addEventListener("click", closeFromExplorer)
  document.addEventListener("keydown", keydown)
  mobileNavigation.addEventListener("change", viewportChange)
  window.addCleanup(() => {
    toggle.removeEventListener("click", click)
    backdrop?.removeEventListener("click", close)
    navigation.removeEventListener("click", closeFromNavigation)
    explorer?.removeEventListener("click", closeFromExplorer)
    document.removeEventListener("keydown", keydown)
    mobileNavigation.removeEventListener("change", viewportChange)
    root.classList.remove("dev-uni-mobile-drawer-open", "mobile-no-scroll")
    delete toggle.dataset.shellReady
  })
}

function setupScrollToTop() {
  const button = document.querySelector<HTMLButtonElement>("button.dev-uni-scroll-top")
  if (!button || button.dataset.scrollTopReady === "true") return

  button.dataset.scrollTopReady = "true"
  const syncVisibility = () => {
    button.dataset.visible = String(window.scrollY > 480)
  }
  const scrollToTop = () => {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth"
    window.scrollTo({ top: 0, behavior })
  }

  syncVisibility()
  window.addEventListener("scroll", syncVisibility, { passive: true })
  button.addEventListener("click", scrollToTop)
  window.addCleanup(() => {
    window.removeEventListener("scroll", syncVisibility)
    button.removeEventListener("click", scrollToTop)
    delete button.dataset.scrollTopReady
  })
}

function setupResponsiveTableOfContents() {
  const frame = document.querySelector<HTMLElement>(
    ".dev-uni-surface-garden-detail, .dev-uni-surface-article-detail",
  )
  const toc =
    frame?.querySelector<HTMLElement>(
      ":scope > .dev-uni-context.right .toc, :scope > main .dev-uni-mobile-inline-toc",
    ) ?? null
  const pageHeader =
    frame?.querySelector<HTMLElement>(":scope > main .page-header .popover-hint") ?? null
  const button = frame?.querySelector<HTMLButtonElement>(".dev-uni-mobile-toc-toggle") ?? null
  const backdrop = frame?.querySelector<HTMLButtonElement>(".dev-uni-mobile-toc-backdrop") ?? null
  if (!frame || !toc || !pageHeader || !button || !backdrop) {
    button?.setAttribute("data-visible", "false")
    return
  }
  if (toc.dataset.responsivePositionReady === "true") return

  const originalParent = toc.parentNode
  if (!originalParent) return

  const root = document.documentElement
  const content = toc.querySelector<HTMLElement>(".toc-content")
  const header = toc.querySelector<HTMLButtonElement>("button.toc-header")
  const headerTitle = header?.querySelector<HTMLElement>("h3") ?? null
  const popoverTitle = document.createElement("h3")
  popoverTitle.className = "dev-uni-mobile-toc-title"
  popoverTitle.textContent = headerTitle?.textContent ?? "목차"
  toc.insertBefore(popoverTitle, header ?? toc.firstChild)
  const hasEntries = Boolean(content?.querySelector("a"))
  toc.dataset.responsivePositionReady = "true"
  const originalPosition = document.createComment("dev-uni-toc-position")
  originalParent.insertBefore(originalPosition, toc)
  if (!toc.id) toc.id = content?.id ? `${content.id}-panel` : "dev-uni-mobile-toc"

  const popoverToc = toc.cloneNode(true) as HTMLElement
  popoverToc
    .querySelectorAll<HTMLElement>("[id]")
    .forEach((element) => element.removeAttribute("id"))
  popoverToc.id = `${toc.id}-popover`
  popoverToc.classList.add("dev-uni-mobile-inline-toc", "dev-uni-mobile-toc-popover")
  popoverToc.hidden = true
  popoverToc.setAttribute("aria-hidden", "true")
  frame.appendChild(popoverToc)
  button.setAttribute("aria-controls", popoverToc.id)

  const setPopoverOpen = (open: boolean, restoreFocus = false) => {
    const shouldOpen = open && mobileNavigation.matches && hasEntries
    const scrollTop = root.scrollTop
    const scrollLeft = root.scrollLeft
    root.classList.toggle("dev-uni-mobile-toc-open", shouldOpen)
    popoverToc.hidden = !shouldOpen
    popoverToc.setAttribute("aria-hidden", String(!shouldOpen))
    button.setAttribute("aria-expanded", String(shouldOpen))
    button.setAttribute("aria-label", shouldOpen ? "목차 닫기" : "목차 열기")
    backdrop.setAttribute("aria-hidden", String(!shouldOpen))

    root.scrollTop = scrollTop
    root.scrollLeft = scrollLeft

    window.requestAnimationFrame(() => {
      if (shouldOpen) {
        popoverToc
          .querySelector<HTMLAnchorElement>(".toc-content a")
          ?.focus({ preventScroll: true })
      } else if (restoreFocus) {
        button.focus({ preventScroll: true })
      }
      root.scrollTop = scrollTop
      root.scrollLeft = scrollLeft
    })
  }

  const restoreDesktopPosition = () => {
    setPopoverOpen(false)
    button.dataset.visible = "false"
    toc.classList.remove("dev-uni-mobile-inline-toc")
    if (originalPosition.parentNode)
      originalPosition.parentNode.insertBefore(toc, originalPosition.nextSibling)
  }
  const placeBelowArticleMeta = () => {
    const anchor =
      pageHeader.querySelector<HTMLElement>(".content-meta") ??
      pageHeader.querySelector<HTMLElement>(".article-title")
    if (!anchor) return

    anchor.insertAdjacentElement("afterend", toc)
    toc.classList.add("dev-uni-mobile-inline-toc")

    const content = toc.querySelector<HTMLElement>(".toc-content")
    if (toc.dataset.mobileCompactReady !== "true" && header && content) {
      toc.dataset.mobileCompactReady = "true"
      content.classList.add("collapsed")
      header.classList.add("collapsed")
      header.setAttribute("aria-expanded", "false")
    }
  }
  const syncPosition = () => {
    setPopoverOpen(false)
    if (mobileNavigation.matches) {
      placeBelowArticleMeta()
      button.dataset.visible = String(hasEntries)
    } else {
      restoreDesktopPosition()
    }
  }
  const togglePopover = () => setPopoverOpen(button.getAttribute("aria-expanded") !== "true")
  const closeFromBackdrop = () => setPopoverOpen(false, true)
  const preventBackdropScroll = (event: Event) => event.preventDefault()
  const closeFromToc = (event: Event) => {
    if (!(event.target as Element).closest("a")) return
    setPopoverOpen(false)
  }
  const closeFromEscape = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || button.getAttribute("aria-expanded") !== "true") return
    setPopoverOpen(false, true)
  }
  const closeForReaderMode = () => setPopoverOpen(false)

  syncPosition()
  button.addEventListener("click", togglePopover)
  backdrop.addEventListener("click", closeFromBackdrop)
  backdrop.addEventListener("wheel", preventBackdropScroll, { passive: false })
  backdrop.addEventListener("touchmove", preventBackdropScroll, { passive: false })
  popoverToc.addEventListener("click", closeFromToc)
  document.addEventListener("keydown", closeFromEscape)
  document.addEventListener("readermodechange", closeForReaderMode)
  mobileNavigation.addEventListener("change", syncPosition)
  window.addCleanup(() => {
    button.removeEventListener("click", togglePopover)
    backdrop.removeEventListener("click", closeFromBackdrop)
    backdrop.removeEventListener("wheel", preventBackdropScroll)
    backdrop.removeEventListener("touchmove", preventBackdropScroll)
    popoverToc.removeEventListener("click", closeFromToc)
    document.removeEventListener("keydown", closeFromEscape)
    document.removeEventListener("readermodechange", closeForReaderMode)
    mobileNavigation.removeEventListener("change", syncPosition)
    restoreDesktopPosition()
    popoverToc.remove()
    originalPosition.remove()
    button.removeAttribute("aria-controls")
    backdrop.setAttribute("aria-hidden", "true")
    popoverTitle.remove()
    delete toc.dataset.mobileCompactReady
    delete toc.dataset.responsivePositionReady
  })
}

function setupReaderLayoutReset() {
  const root = document.documentElement
  if (root.dataset.readerLayoutReady === "true") return

  root.dataset.readerLayoutReady = "true"
  const syncReaderLayout = (event: CustomEventMap["readermodechange"]) => {
    const isReaderMode = event.detail.mode === "on"
    document
      .querySelectorAll<HTMLButtonElement>("button.readermode")
      .forEach((button) => button.setAttribute("aria-pressed", String(isReaderMode)))
    if (!isReaderMode) {
      if (!mobileNavigation.matches) {
        for (const explorer of document.querySelectorAll<HTMLElement>(".explorer")) {
          explorer.classList.remove("collapsed")
          explorer.setAttribute("aria-expanded", "true")
          explorer
            .querySelector<HTMLElement>(".explorer-content")
            ?.setAttribute("aria-expanded", "true")
        }
      }
      return
    }
    root.classList.remove("mobile-no-scroll")
    for (const explorer of document.querySelectorAll<HTMLElement>(".explorer")) {
      explorer.classList.add("collapsed")
      explorer.setAttribute("aria-expanded", "false")
      for (const toggle of explorer.querySelectorAll<HTMLElement>(".explorer-toggle")) {
        toggle.setAttribute("aria-expanded", "false")
      }
    }
  }

  document
    .querySelectorAll<HTMLButtonElement>("button.readermode")
    .forEach((button) =>
      button.setAttribute("aria-pressed", String(root.getAttribute("reader-mode") === "on")),
    )
  document.addEventListener("readermodechange", syncReaderLayout)
  window.addCleanup(() => {
    document.removeEventListener("readermodechange", syncReaderLayout)
    delete root.dataset.readerLayoutReady
  })
}

function refreshDevUniShell() {
  resetGraphVisitColors()
  setupDevUniShell()
  setupGraphLegend()
  setupGraphFallback()
  setupBrainExplorer()
  setupResponsiveTableOfContents()
  setupScrollToTop()
  setupReaderLayoutReset()
  enforceReaderSurfaceBoundary()
}

document.addEventListener("nav", refreshDevUniShell)
document.addEventListener("render", refreshDevUniShell)
window.addEventListener("DOMContentLoaded", refreshDevUniShell, { once: true })
