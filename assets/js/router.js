import {
  apply,
  navigate,
  prefetch,
  router,
} from "https://unpkg.com/million@1.11.5/dist/router.mjs"

export const attachSPARouting = (init, rerender) => {
  // Attach SPA functions to the global Million namespace
  window.Million = {
    apply,
    navigate,
    prefetch,
    router,
  }

  const render = () => requestAnimationFrame(rerender)

  window.addEventListener("DOMContentLoaded", () => {
    apply((doc) => init(doc))
    init()
    router(".singlePage")
    render()
    scroll_init()
    btn_init()
  })
  window.addEventListener("million:navigate", () => {
    render()
    scroll_init()
    btn_init()
    // drawGraph()
    // global_init()
  })
}
