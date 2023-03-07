function scroll_init() {
  if (document.getElementById("asideTOC")) {
    this.asideTOC = document.querySelectorAll(".asideTOC li a")
    this.asideTOC[0].classList.add("text-active")
    this.asideTOC.forEach((link) => {
      link.parentElement.classList.add("text-transition")
    })
    this.headers = Array.from(this.asideTOC).map((link) => {
      let id = decodeURIComponent(link.href.split("#")[1])
      return document.getElementById(id)
    })

    this.ticking = false
    window.addEventListener("scroll", (e) => {
      this.scroll_onScroll()
    })
  }
}

function scroll_onScroll() {
  if (!this.ticking) {
    requestAnimationFrame(this.scroll_update.bind(this))
    this.ticking = true
  }
}

function scroll_update() {
  this.activeHeader ||= this.headers[0]
  let activeIndex = this.headers.findIndex((header) => {
    return header.getBoundingClientRect().top > 150
  })
  if (activeIndex == -1) {
    activeIndex = this.headers.length - 1
  } else if (activeIndex > 0) {
    activeIndex--
  }
  let active = this.headers[activeIndex]
  if (active !== this.activeHeader) {
    this.activeHeader = active
    this.asideTOC.forEach((link) => {
      link.classList.remove("text-active")
    })
    this.asideTOC[activeIndex].classList.add("text-active")
  }

  this.ticking = false
}

function btn_init() {
  if (document.querySelector(".top-btn")) {
    document.querySelector(".top-btn").addEventListener("click", () => {
      window.scrollTo({top:0, behavior:"smooth"})
    })
  }
}

function global_init() {
  const expand_graph_container = document.getElementsByClassName("expand-graph-container")[0]
  const blurElement = document.getElementsByClassName("blur-element")[0]
  const expand_btn = document.getElementById("expand-btn")
  const expand_btn2 = document.getElementById("expand-btn2")
  const expand_close_btn = document.getElementById("expand-close-btn")

  expand_btn.onclick = function (event) {
    event.preventDefault()
    event.stopPropagation()
    expand_graph_container.style.visibility = "visible"
    expand_graph_container.style.opacity = "1"
  }

  expand_btn2.onclick = function (event) {
    event.stopPropagation()
    event.preventDefault()
    expand_graph_container.style.visibility = "visible"
    expand_graph_container.style.opacity = "1"
  }

  expand_close_btn.onclick = function (event) {
    event.stopPropagation()
    expand_graph_container.style.opacity = "0"
    expand_graph_container.style.visibility = "hidden"
    blurElement.classList.remove("enabled")
  }

  expand_graph_container.onclick = function (event) {
    event.stopPropagation()
    expand_graph_container.style.opacity = "0"
    expand_graph_container.style.visibility = "hidden"
    blurElement.classList.remove("enabled")
  }
}