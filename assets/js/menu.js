var lastClickedLink = null;
;(() => {
  const aside_box = document.getElementsByClassName("main-aside-box")[0]
  const arrows_wrappers = document.getElementsByClassName("a-wrapper")
  const wrappers = document.getElementsByClassName("wrapper")
  const folders = document.getElementsByClassName("folder")
  const collapse_btn = document.getElementsByClassName("collapse-btn")[0]
  const blurElement = document.getElementsByClassName("blur-element")[0]

  const menu_content_header_btn = document.getElementsByClassName("menu-content-header-btn")[0]
  const bar_btn = document.getElementsByClassName("section-menu-btn")[0]
  const pagesLink = document.getElementsByClassName("wrapper-link")

  const expand_graph_container = document.getElementsByClassName("expand-graph-container")[0]

  let index = 0

  window.onpopstate = function(event) {
    expand_graph_container.style.opacity = "0"
    expand_graph_container.style.visibility = "hidden"
    blurElement.classList.remove("enabled")
    aside_box.classList.add("disabled")
    aside_box.classList.remove("fixed-position")
    bar_btn.classList.remove("fixed-btn-color")
    blurElement.classList.remove("enabled")
  }

  for (const el of wrappers) {
    const folder = folders[index]
    const arrow = document.getElementsByClassName("arrow")[index]
    el.addEventListener("click", () => {
      arrow.classList.toggle("down")
      folder.classList.toggle("active")
    })
    index++
  }

  collapse_btn.addEventListener("click", (e) => {
    e.preventDefault()
    for (const folder of folders) {
      if (folder.classList.contains("active")) {
        folder.classList.remove("active")
      }
    }

    // 모든 화살표를 위로 돌립니다.
    for (const arrow of arrows_wrappers) {
      const arrowIcon = arrow.getElementsByClassName("arrow")[0]
      arrowIcon.classList.remove("down")
    }
  })

  lastClickedLink = null
  for (const el of pagesLink) {
    el.addEventListener("click", (e) => {
      // 기존의 클릭된 링크의 스타일을 제거합니다.
      if (lastClickedLink) {
        lastClickedLink.classList.remove("clicked")
      }
      // 클릭된 링크의 스타일을 변경합니다.
      el.classList.add("clicked")
      // 마지막으로 클릭된 링크를 저장합니다.
      lastClickedLink = el
      // 사이드바를 닫습니다.
      aside_box.classList.add("disabled")
      aside_box.classList.remove("fixed-position")
      bar_btn.classList.remove("fixed-btn-color")
      blurElement.classList.remove("enabled")
    })
  }

  blurElement.addEventListener("click", (e) => {
    aside_box.classList.add("disabled")
    aside_box.classList.remove("fixed-position")
    bar_btn.classList.remove("fixed-btn-color")
    blurElement.classList.remove("enabled")
  })

  bar_btn.addEventListener("click", (e) => {
    aside_box.classList.toggle("disabled")
    aside_box.classList.toggle("fixed-position")
    bar_btn.classList.toggle("fixed-btn-color")
    blurElement.classList.toggle("enabled")
  })

  menu_content_header_btn.addEventListener("click", (e) => {
    e.stopPropagation()
    aside_box.classList.add("disabled")
    aside_box.classList.remove("fixed-position")
    bar_btn.classList.remove("fixed-btn-color")
    blurElement.classList.remove("enabled")
  })
})()
