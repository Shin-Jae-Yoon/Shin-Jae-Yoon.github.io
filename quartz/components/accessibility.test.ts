import assert from "node:assert/strict"
import test from "node:test"
import { normalizeRenderedAccessibility } from "./accessibility"

test("normalizes external component ARIA targets and sidebar heading order", () => {
  const markup = `
    <div class="explorer nav-files-container">
      <button class="explorer-toggle mobile-explorer" aria-controls="explorer-7"></button>
      <button class="title-button explorer-toggle desktop-explorer" aria-expanded="true"></button>
      <div id="explorer-7" class="explorer-content" aria-expanded="false" role="group"></div>
    </div>
    <div class="graph"><h3>그래프 뷰</h3><div class="graph-outer"></div></div>
    <div class="toc">
      <button class="toc-header" aria-controls="toc-0" aria-expanded="true"></button>
      <ul id="list-0" class="toc-content overflow"></ul>
    </div>
  `

  const normalized = normalizeRenderedAccessibility(markup)

  assert.match(
    normalized,
    /class="explorer-toggle mobile-explorer" aria-controls="explorer-7" aria-expanded="false"/,
  )
  assert.match(
    normalized,
    /class="title-button explorer-toggle desktop-explorer" aria-controls="explorer-7" aria-expanded="true"/,
  )
  assert.match(normalized, /id="explorer-7" class="explorer-content" role="group"/)
  assert.doesNotMatch(normalized, /class="explorer-content"[^>]*aria-expanded/)
  assert.match(normalized, /class="toc-header" aria-expanded="true" aria-controls="list-0"/)
  assert.match(normalized, /<h2>그래프 뷰<\/h2><div class="graph-outer">/)
})

test("leaves unrelated headings and controls unchanged", () => {
  const markup = '<main><h3>Article section</h3><button aria-controls="panel">Open</button></main>'
  assert.equal(normalizeRenderedAccessibility(markup), markup)
})
