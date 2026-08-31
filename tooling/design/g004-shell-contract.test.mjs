import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import path from "node:path"
import test from "node:test"

const quartzRoot = path.resolve(import.meta.dirname, "../..")
const source = (relativePath) => readFile(path.join(quartzRoot, relativePath), "utf8")

test("G004 Dev Uni frame owns semantic landmark order and shell lifecycle", async () => {
  const [frame, navigation, lifecycle] = await Promise.all([
    source("quartz/components/frames/DevUniFrame.tsx"),
    source("quartz/components/PrimaryNavigation.tsx"),
    source("quartz/components/scripts/devUniShell.inline.ts"),
  ])

  const skip = frame.indexOf('<a class="skip-link"')
  const header = frame.indexOf('<header class="dev-uni-header">')
  const main = frame.indexOf('<main class="center" id="site-content"')
  const footer = frame.indexOf("<Footer {...componentData} />")
  assert.ok(skip >= 0 && skip < header && header < main && main < footer)
  assert.match(navigation, /class="site-menu-toggle"[\s\S]*aria-expanded="true"/)
  assert.match(navigation, /aria-controls="primary-navigation"/)
  assert.match(lifecycle, /window\.addCleanup\(/)
  assert.match(lifecycle, /queueMicrotask\([\s\S]*button\.readermode/)
})

test("G004 Google analytics queues navigation before external hydration", async () => {
  const resources = await source("quartz/plugins/emitters/componentResources.ts")
  const google = resources.match(
    /if \(cfg\.analytics\?\.provider === "google"\)[\s\S]*?else if/,
  )?.[0]
  assert.ok(google)

  const listener = google.indexOf("document.addEventListener('nav'")
  const append = google.indexOf("document.head.appendChild(gtagScript)")
  assert.ok(listener >= 0 && listener < append)
  assert.doesNotMatch(google, /gtagScript\.onload/)
  assert.match(google, /if \(!\$\{cfg\.enableSPA\}\)/)
})

test("G004 built primary routes expose one owned shell and one H1", async () => {
  const routes = [
    "index.html",
    "about.html",
    "portfolio/index.html",
    "portfolio/iot-platform.html",
    "brain/index.html",
    "brain/notes/java/jvm.html",
    "articles/index.html",
    "articles/tistory/23.html",
  ]

  for (const route of routes) {
    const html = await source(`public/${route}`)
    assert.equal(html.match(/<header class="dev-uni-header"/g)?.length ?? 0, 1, route)
    assert.equal(html.match(/<main\b/g)?.length ?? 0, 1, route)
    assert.equal(html.match(/<footer\b/g)?.length ?? 0, 1, route)
    assert.equal(html.match(/<h1\b/g)?.length ?? 0, 1, route)
    assert.doesNotMatch(html, /Created with[\s\S]*Quartz v/i, route)
  }

  const home = await source("public/index.html")
  const currentLinks = home.match(/<a\b[^>]*aria-current="page"[^>]*>/g) ?? []
  assert.equal(currentLinks.length, 1)
  assert.match(currentLinks[0], /class="[^"]*site-identity[^"]*"/)
})
