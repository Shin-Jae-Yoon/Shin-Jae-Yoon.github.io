import assert from "node:assert/strict"
import test from "node:test"
import { counterOutputState } from "./counter-output.mjs"

test("counter output classification follows the server-rendered body marker", () => {
  assert.deepEqual(
    counterOutputState('<body data-slug="articles/example" data-content-type="article"></body>'),
    { contentType: "article", hasArticleCounter: false },
  )
  assert.deepEqual(counterOutputState('<body data-slug="garden/example"></body>'), {
    contentType: undefined,
    hasArticleCounter: false,
  })
})

test("non-article output detection rejects either article counter surface", () => {
  assert.equal(
    counterOutputState('<body><p class="article-view-counter content-meta"></p></body>')
      .hasArticleCounter,
    true,
  )
  assert.equal(
    counterOutputState('<body><strong data-counter="article"></strong></body>').hasArticleCounter,
    true,
  )
})
