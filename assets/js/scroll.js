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
          link.classList.remove("text-active");
      })
      this.asideTOC[activeIndex].classList.add("text-active")
    }
  
    this.ticking = false
  }
  