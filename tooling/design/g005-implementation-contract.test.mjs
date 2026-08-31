import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import path from "node:path"
import test from "node:test"
import YAML from "yaml"

const quartzRoot = path.resolve(import.meta.dirname, "../..")
const source = (relativePath) => readFile(path.join(quartzRoot, relativePath), "utf8")
const frontmatter = (document) => {
  const match = document.match(/^---\n([\s\S]*?)\n---/)
  assert.ok(match, "Markdown frontmatter is required")
  return YAML.parse(match[1])
}

test("G005 uses the approved local typography and navy-teal-coral token lineage", async () => {
  const [config, css] = await Promise.all([
    source("quartz.config.default.yaml"),
    source("quartz/styles/custom.scss"),
  ])

  assert.match(config, /fontOrigin: local/)
  assert.match(config, /cdnCaching: false/)
  assert.match(config, /lightMode:[\s\S]*light: "#f7fafa"[\s\S]*secondary: "#187c87"/)
  assert.match(config, /lightMode:[\s\S]*tertiary: "#d96f69"/)
  assert.match(config, /darkMode:[\s\S]*light: "#0b151a"[\s\S]*secondary: "#67c8d0"/)
  assert.match(config, /darkMode:[\s\S]*tertiary: "#f29a94"/)

  assert.match(css, /--du-font-sans:[\s\S]*-apple-system[\s\S]*Apple SD Gothic Neo/)
  assert.match(css, /--du-space-24:\s*6rem/)
  assert.match(css, /--du-radius-md:\s*0\.375rem/)
  assert.match(css, /--du-motion-standard:\s*180ms/)
  assert.match(css, /:root\s*\{[\s\S]*--du-coral-text:\s*#a94d47/)
  assert.match(css, /:root\[saved-theme="dark"\][\s\S]*--du-coral-text:\s*#f29a94/)
  assert.match(css, /\.about-stack-list dt\s*\{[\s\S]{0,120}color:\s*var\(--du-coral-text\)/)
  assert.match(css, /prefers-reduced-motion:\s*reduce/)
  assert.doesNotMatch(css, /(?:linear|radial|conic)-gradient\(/)
  assert.match(css, /\.portfolio-metrics\s*\{[\s\S]{0,180}grid-template-columns:\s*repeat\(2/)
})

test("G005 Home, About, and Portfolio use authored semantic structures and owner-backed copy", async () => {
  const [landing, frame, home, about, portfolio] = await Promise.all([
    source("quartz/components/DevUniLanding.tsx"),
    source("quartz/components/frames/DevUniFrame.tsx"),
    source("content/index.md"),
    source("content/about.md"),
    source("content/portfolio/index.md"),
  ])

  assert.match(
    frame,
    /surface === "home" \|\|[\s\S]{0,100}surface === "portfolio-index" \|\|[\s\S]{0,100}surface === "articles-index"/,
  )
  assert.match(frame, /renderDevUniLanding\(surface, componentData\)/)
  assert.match(
    frame,
    /isLandingSurface \?[\s\S]*renderDevUniLanding\(surface, componentData\)[\s\S]*<Content \{\.\.\.componentData\} \/>/,
  )
  assert.match(landing, /<article class="dev-uni-home home-page"/)
  assert.match(landing, /<article class="dev-uni-about about-page"/)
  assert.match(landing, /<h1 class="home-title" id="home-title"/)
  assert.match(
    landing,
    /<h1 id="about-title">[\s\S]*<span>안녕하세요<\/span>[\s\S]*<span>신재윤입니다\.<\/span>/,
  )

  for (const marker of [
    "<span>SECOND</span>",
    "<span>BRAIN</span>",
    "제텔카스텐 기법으로 구성된 저의 두 번째 뇌",
    "<span>두 번째 뇌는 작은</span>",
    "<span>메모에서 시작합니다.</span>",
    "ATOMIC NOTE",
    "ADDRESS &amp; LINK",
    "STRUCTURE NOTE",
    "저를 알아가는",
  ]) {
    assert.match(landing, new RegExp(marker))
  }
  assert.doesNotMatch(landing, /복잡한 데이터 흐름을 안정적인 서비스로 만듭니다\.|최근에 쓴 글/)
  assert.match(landing, /A LITTLE MORE/)
  assert.match(landing, /ENGINEERING PROFILE/)
  assert.doesNotMatch(landing, /about-facts/)
  for (const marker of ["Java", "Spring Boot", "MySQL", "AWS", "Docker", "Kafka"]) {
    assert.match(portfolio, new RegExp(marker))
  }
  assert.match(home, /단편적인 개발 지식을 새롭고 통합된 지식으로 전환/)
  assert.match(landing, /about-jaeyoon-2026\.jpeg/)
  assert.doesNotMatch(landing, /미래를 만들|혁신적인 솔루션/i)

  const contentContract = {
    visibleContentOwner: "quartz/components/DevUniLanding.tsx",
    markdownBodyRole: "seo-index-shadow",
  }
  assert.deepEqual(frontmatter(home).devUniContentContract, contentContract)
  assert.deepEqual(frontmatter(about).devUniContentContract, contentContract)
})

test("G005 built Home and About preserve one shell, one H1, and local font loading", async () => {
  const [home, about] = await Promise.all([
    source("public/index.html"),
    source("public/about.html"),
  ])

  for (const [route, html] of [
    ["Home", home],
    ["About", about],
  ]) {
    assert.equal(html.match(/<header\b/g)?.length ?? 0, 1, route)
    assert.equal(html.match(/<main\b/g)?.length ?? 0, 1, route)
    assert.equal(html.match(/<footer\b/g)?.length ?? 0, 1, route)
    assert.equal(html.match(/<h1\b/g)?.length ?? 0, 1, route)
    assert.equal(html.match(/class="search-button"/g)?.length ?? 0, 1, route)
    assert.equal(html.match(/class="darkmode"/g)?.length ?? 0, 1, route)
    assert.equal(html.match(/class="site-menu-toggle"/g)?.length ?? 0, 1, route)
    assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/, route)
  }

  assert.doesNotMatch(home, /class="home-kicker">DEV UNI'S/)
  assert.match(home, /class="home-title"[^>]*><span>SECOND<\/span><span>BRAIN<\/span>/)
  assert.match(home, /brain-drawing-public-domain\.svg/)
  assert.match(home, /제텔카스텐 기법으로 구성된 저의 두 번째 뇌/)
  assert.match(home, /<span>두 번째 뇌는 작은<\/span><span>메모에서 시작합니다\.<\/span>/)
  assert.match(home, /ATOMIC NOTE/)
  assert.match(home, /ADDRESS &amp; LINK/)
  assert.match(home, /STRUCTURE NOTE/)
  assert.doesNotMatch(home, /DIGITAL GARDENING/)
  assert.doesNotMatch(home, /복잡한 데이터 흐름을 안정적인 서비스로 만듭니다\.|최근에 쓴 글/)
  assert.match(
    about,
    /사람들과 편하게 이야기를 나누고, 궁금한 건 직접 부딪혀 알아가는 것을 좋아합니다/,
  )
  assert.match(about, /src="\.\/static\/dev-uni\/about-jaeyoon-2026\.jpeg"/)
  assert.doesNotMatch(home, /<h1 class="article-title">Home<\/h1>/)
  assert.doesNotMatch(about, /<h1 class="article-title">About<\/h1>/)
})

test("G005 capture harness owns a fresh deterministic Home and About matrix", async () => {
  const harness = await source("tooling/design/capture-g005.mjs")

  assert.match(harness, /home: "\/"/)
  assert.match(harness, /about: "\/about\.html"/)
  assert.match(harness, /mobile: \{ width: 390, height: 844 \}/)
  assert.match(harness, /desktop: \{ width: 1440, height: 1000 \}/)
  assert.match(harness, /narrow: \{ width: 320, height: 844 \}/)
  assert.match(harness, /design-remediation\/g005/)
  assert.match(harness, /prefers-reduced-motion/)
  assert.match(harness, /await resetPageScroll\(session\)[\s\S]{0,420}Page\.captureScreenshot/)
  assert.match(harness, /const contrastSelectors = \[/)
  for (const selector of [
    ".home-title",
    ".home-statement",
    ".home-primary-action",
    ".home-connected-records a",
    ".home-proof-link",
    ".about-identity h1",
    ".about-lead",
    ".about-section-heading h2",
    ".about-principles strong",
    ".about-stack-list dt",
    ".about-stack-list dd",
    ".about-route-links a",
  ]) {
    assert.match(harness, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
  }
  assert.match(harness, /pass: ratio >= 4\.5/)
  assert.match(harness, /contrastSamples\.length === 0/)
  assert.match(harness, /text contrast below 4\.5/)
  assert.match(harness, /contrastSampledProbeCount/)
  assert.match(harness, /contrastFailures: allCells\.reduce/)
  assert.doesNotMatch(harness, /design-remediation\/reference\/screenshots/)
})
