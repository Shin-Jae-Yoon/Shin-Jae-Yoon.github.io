import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import path from "node:path"
import test from "node:test"
import {
  auditLocalNoExternalMutationBoundary,
  auditTistoryBodies,
} from "./g003-preservation-sentinels.mjs"

const quartzRoot = path.resolve(import.meta.dirname, "../..")
const repositoryRoot = path.resolve(quartzRoot, "../..")
const source = (relativePath) => readFile(path.join(quartzRoot, relativePath), "utf8")
const count = (text, pattern) => text.match(pattern)?.length ?? 0

const routes = {
  about: "about.html",
  "portfolio-index": "portfolio/index.html",
  "portfolio-detail": "portfolio/iot-platform.html",
  "garden-index": "brain/index.html",
  "garden-detail": "brain/notes/java/jvm.html",
  "articles-index": "articles/index.html",
  "articles-category": "articles/category/technical.html",
  "article-detail": "articles/tistory/23.html",
}

test("owner revision binds source content to the requested product surfaces", async () => {
  const [
    landing,
    navigation,
    frame,
    head,
    shellScript,
    spaScript,
    popoverScript,
    accessibilityScript,
    baseCss,
    css,
    config,
    home,
    favicon,
    portfolio,
    iot,
    moabam,
    article,
    graphPatch,
    explorerPatch,
    explorerScript,
    packageJson,
  ] = await Promise.all([
    source("quartz/components/DevUniLanding.tsx"),
    source("quartz/components/PrimaryNavigation.tsx"),
    source("quartz/components/frames/DevUniFrame.tsx"),
    source("quartz/components/Head.tsx"),
    source("quartz/components/scripts/devUniShell.inline.ts"),
    source("quartz/components/scripts/spa.inline.ts"),
    source("quartz/components/scripts/popover.inline.ts"),
    source("quartz/components/scripts/accessibility.inline.ts"),
    source("quartz/styles/base.scss"),
    source("quartz/styles/custom.scss"),
    source("quartz.config.default.yaml"),
    source("content/index.md"),
    source("quartz/static/favicon.svg"),
    source("content/portfolio/index.md"),
    source("content/portfolio/iot-platform.md"),
    source("content/portfolio/moabam.md"),
    source("content/articles/tistory/23.md"),
    source("tooling/plugins/apply-dev-uni-graph-patch.mjs"),
    source("tooling/plugins/apply-dev-uni-explorer-patch.mjs"),
    source(".quartz/plugins/explorer/src/components/scripts/explorer.inline.ts"),
    source("package.json"),
  ])

  assert.match(landing, /제텔카스텐 기법으로 구성된 저의 두 번째 뇌/)
  assert.match(config, /pageTitle:\s*개발자 유니의 두 번째 뇌/)
  assert.doesNotMatch(config, /source:\s*github:quartz-community\/page-title/)
  assert.match(head, /<title>\{cfg\.pageTitle\}<\/title>/)
  assert.match(home, /title:\s*개발자 유니의 두 번째 뇌/)
  assert.match(favicon, /fill="#0a1922"/)
  assert.match(favicon, /stroke="#67c8d0"/)
  assert.match(landing, /<span>SECOND<\/span>/)
  assert.match(landing, /<span>BRAIN<\/span>/)
  assert.match(landing, /home-neural-visual/)
  assert.match(landing, /brain-drawing-public-domain\.svg/)
  assert.match(landing, /home-neural-guidepaths/)
  assert.match(landing, /home-neural-packets/)
  assert.match(landing, /<span>저를 알아가는<\/span>/)
  assert.match(landing, /<span>네 가지 경로<\/span>/)
  assert.match(landing, /사람과 기록 사이에서/)
  assert.doesNotMatch(landing, /SEOUL · 2026/)
  assert.match(landing, /about-jaeyoon-2026\.jpeg/)
  assert.match(navigation, /href: "brain", label: "Brain"/)
  assert.match(frame, /class="dev-uni-scroll-top"/)
  assert.match(frame, /aria-label="페이지 최상단으로 이동"/)
  assert.ok(frame.indexOf('class="right sidebar dev-uni-context"') < frame.indexOf("<main"))
  assert.match(landing, /PortfolioLanding/)
  assert.equal(count(navigation, /data-no-popover="true"/g), 2)
  assert.match(shellScript, /localStorage\.removeItem\("graph-visited"\)/)
  assert.match(spaScript, /await micromorph\(document\.body, html\.body\)/)
  assert.match(spaScript, /const preservedExplorer = preserveExplorerAcrossNavigation\(html\)/)
  assert.match(spaScript, /currentExplorer\.cloneNode\(true\)/)
  assert.match(spaScript, /restoreExplorerAfterNavigation\(preservedExplorer\)/)
  assert.ok(
    spaScript.indexOf("await micromorph(document.body, html.body)") <
      spaScript.indexOf("restoreExplorerAfterNavigation(preservedExplorer)"),
  )
  assert.doesNotMatch(spaScript, /isBrainPath/)
  assert.doesNotMatch(
    baseCss,
    /img\s*\{[^}]*content-visibility:\s*auto/,
    "offscreen article images must reserve their height before TOC anchor navigation",
  )
  assert.match(
    baseCss,
    /html\s*\{[^}]*scroll-padding-top:\s*6\.25rem/s,
    "TOC anchors must stop below the sticky header",
  )
  assert.doesNotMatch(shellScript, /document\.referrer/)
  assert.match(popoverScript, /gardenSurfaces = new Set\(\["garden-index", "garden-detail"\]\)/)
  assert.match(popoverScript, /isEligiblePopoverLink/)
  assert.match(popoverScript, /targetSurface.*gardenSurfaces/s)
  assert.doesNotMatch(popoverScript, /\.explorer a\.nav-file-title/)
  assert.match(popoverScript, /clearActivePopover\(\)\s*activeAnchor = link/)
  assert.match(graphPatch, /current Brain note/i)
  assert.match(graphPatch, /directly related Brain note/i)
  assert.match(graphPatch, /unrelated Brain note/i)
  assert.match(graphPatch, /DEV_UNI_GRAPH_CENTER_ANCHOR/)
  assert.match(graphPatch, /DEV_UNI_GRAPH_BRAIN_HUB/)
  assert.match(graphPatch, /brainHubSlug = "brain"/)
  assert.match(graphPatch, /brainHubCandidates = \["brain\/", "brain\/index"\]/)
  assert.match(graphPatch, /centerNode\.fx = 0/)
  assert.match(graphPatch, /Math\.max\(baseRadius \+ 3, 11\)/)
  assert.match(graphPatch, /dev-uni-global-graph-open/)
  assert.match(graphPatch, /DEV_UNI_GRAPH_VIEWPORT_PORTAL/)
  assert.match(graphPatch, /document\.body\.appendChild\(container\)/)
  assert.match(graphPatch, /home\.parent\.insertBefore/)
  assert.match(packageJson, /apply-dev-uni-graph-patch\.mjs/)
  assert.match(packageJson, /apply-dev-uni-explorer-patch\.mjs/)
  assert.match(explorerPatch, /DEV_UNI_EXPLORER_INTERNAL_SCROLL/)
  assert.match(explorerPatch, /DEV_UNI_EXPLORER_PRESERVED_TREE/)
  assert.match(explorerScript, /DEV_UNI_EXPLORER_INTERNAL_SCROLL/)
  assert.match(explorerScript, /DEV_UNI_EXPLORER_PRESERVED_TREE/)
  assert.match(explorerScript, /hasPreservedTree/)
  assert.match(explorerScript, /explorerUl\.scrollTop/)
  assert.doesNotMatch(explorerScript, /activeElement\.scrollIntoView/)
  assert.match(accessibilityScript, /aria-current", "location"/)
  assert.match(landing, /\.filter\(isTistoryArticle\)/)
  assert.doesNotMatch(landing, /Quartz 5 지식 사이트 전환|progressive-discovery/)
  assert.match(portfolio, /의료 IoT/)
  assert.match(iot, /10,000 TPS/)
  assert.match(moabam, /16팀 중 1등/)

  assert.match(config, /rootPath:\s*brain/)
  assert.match(config, /folderClickBehavior:\s*collapse/)
  assert.match(config, /useSavedState:\s*true/)
  assert.match(shellScript, /localStorage\.removeItem\("fileTree"\)/)
  assert.match(shellScript, /const enteredBrain = !wasBrain/)
  assert.match(shellScript, /if \(wasBrain\) clearExplorerSavedState\(\)/)
  assert.doesNotMatch(shellScript, /captureBrainExplorerScrollPosition/)
  assert.doesNotMatch(shellScript, /restoreBrainExplorerScrollPosition/)
  assert.match(
    shellScript,
    /!mobileNavigation\.matches[\s\S]{0,180}explorer\.classList\.remove\("collapsed"\)/,
  )
  assert.match(shellScript, /enforceInitialExplorerCollapse\(explorer\)/)
  assert.match(shellScript, /className = "dev-uni-collapse-all"/)
  assert.match(shellScript, /className = "dev-uni-explorer-toolbar"/)
  assert.match(shellScript, /className = "dev-uni-explorer-heading"/)
  assert.match(shellScript, /explorerHeading\.textContent = "노트 탐색"/)
  assert.match(config, /source: github:quartz-community\/backlinks[\s\S]*position: right/)
  assert.match(shellScript, /collapseExplorerFolders\(explorer\)/)
  assert.match(shellScript, /function setupScrollToTop\(\)/)
  assert.match(shellScript, /window\.scrollTo\(\{ top: 0, behavior \}\)/)
  assert.match(shellScript, /function setupReaderLayoutReset\(\)/)
  assert.match(shellScript, /root\.classList\.remove\("mobile-no-scroll"\)/)
  assert.match(config, /includePathPrefixes:[\s\S]*- brain/)
  assert.doesNotMatch(config, /includePathPrefixes:[\s\S]*- garden/)
  assert.match(config, /hiddenSegments:[\s\S]*- tistory/)
  assert.match(portfolio, /blog:\s*https:\/\/shin-jae-yoon\.github\.io\//)
  assert.doesNotMatch(portfolio, /tistory:\s*https:\/\/jae-yoon\.tistory\.com/)
  assert.match(landing, /href=\{portfolio\.blog\}/)
  assert.match(css, /grid-template-areas:[\s\S]*"\. \. main right \."/)
  assert.match(css, /--article-reading-width:\s*50rem/)
  assert.match(css, /--garden-reading-width:\s*52rem/)
  assert.match(css, /--du-graph-current:/)
  assert.match(css, /--du-graph-related:/)
  assert.match(css, /--du-graph-unrelated:/)
  assert.match(css, /\.dev-uni-surface-article-detail \.toc a\.du-current/)
  assert.match(css, /\.dev-uni-surface-garden-detail \.toc a\.du-current/)
  assert.match(css, /\.toc a\.du-current[\s\S]{0,240}color:\s*var\(--du-teal\)/)
  assert.match(css, /:root\[saved-theme="dark"\] \.dev-uni-header \.darkmode > \.dayIcon/)
  assert.match(css, /:root\[saved-theme="dark"\] \.dev-uni-header \.darkmode > \.nightIcon/)
  assert.match(css, /\.dev-uni-surface-garden-detail \.nav-file-title\.active/)
  assert.match(css, /\.primary-navigation a\.internal::after[\s\S]{0,320}border-radius:\s*5px/)
  assert.match(
    css,
    /\.primary-navigation a\.internal::after[\s\S]{0,380}clip-path:\s*inset\(0 100% 0 0\)/,
  )
  assert.match(css, /transition:\s*clip-path 220ms cubic-bezier\(0\.22, 1, 0\.36, 1\)/)
  assert.match(css, /\.primary-navigation a\.internal\s*\{[\s\S]{0,180}transition:\s*none/)
  assert.match(
    css,
    /\.dev-uni-surface-home \.primary-navigation a\.internal\[aria-current="page"\],[\s\S]{0,260}color:\s*var\(--du-ink\) !important/,
  )
  assert.match(css, /\.dev-uni-collapse-all/)
  assert.match(
    css,
    /\.dev-uni-surface-garden-index \.explorer \.explorer-content,[\s\S]{0,360}scrollbar-gutter:\s*stable/,
  )
  assert.match(css, /\.dev-uni-explorer-toolbar[\s\S]{0,260}justify-content:\s*space-between/)
  assert.match(
    css,
    /\.dev-uni-explorer-heading,[\s\S]{0,260}\.graph > h2[\s\S]{0,260}font-size:\s*1\.4rem/,
  )
  assert.match(
    css,
    /\.dev-uni-surface-garden-detail \.toc-content,[\s\S]{0,260}overflow-y:\s*auto[\s\S]{0,180}scrollbar-width:\s*none/,
  )
  assert.match(
    css,
    /\.dev-uni-context\.right \.backlinks > ul\.overflow[\s\S]{0,260}overflow-y:\s*auto/,
  )
  assert.match(
    css,
    /\.dev-uni-surface-garden-detail > \.dev-uni-context\.right \.toc,[\s\S]{0,180}flex:\s*2 1 0/,
  )
  assert.match(
    css,
    /\.dev-uni-surface-garden-detail > \.dev-uni-context\.right \.backlinks,[\s\S]{0,180}flex:\s*0\.85 1 0/,
  )
  assert.match(css, /\.dev-uni-scroll-top/)
  assert.match(css, /\.dev-uni-scroll-top\s*\{[\s\S]{0,520}cursor:\s*pointer/)
  assert.match(css, /data-visible="true"/)
  assert.match(css, /\.toc-content\.collapsed[\s\S]{0,120}display:\s*none/)
  assert.match(css, /:root\.dev-uni-global-graph-open[\s\S]{0,120}overflow:\s*hidden/)
  assert.match(
    css,
    /:root\.dev-uni-global-graph-open \.dev-uni-surface-garden-detail > \.dev-uni-context\.left[\s\S]{0,100}visibility:\s*hidden/,
  )
  assert.match(
    css,
    /body > \.global-graph-outer\s*\{[\s\S]{0,180}position:\s*fixed[\s\S]{0,160}z-index:\s*9999/,
  )
  assert.match(css, /body > \.global-graph-outer\.active[\s\S]{0,80}display:\s*block/)
  assert.match(css, /"header"\s*"right"\s*"left"\s*"main"\s*"footer"/)
  assert.match(css, /content:\s*"Brain 탐색"/)
  assert.match(css, /\.explorer button\.mobile-explorer \.lucide-menu[\s\S]{0,80}display:\s*none/)
  assert.match(
    css,
    /\.dev-uni-surface-garden-index \.dev-uni-context\.left \.page-title[\s\S]{0,260}display:\s*none !important/,
  )
  assert.match(
    css,
    /\.dev-uni-surface-garden-index > \.dev-uni-context\.left \.page-title,[\s\S]{0,120}\.dev-uni-surface-garden-detail > \.dev-uni-context\.left \.page-title[\s\S]{0,80}display:\s*none !important/,
  )
  assert.match(
    css,
    /\.dev-uni-surface-garden-index \.explorer \.explorer-content[\s\S]{0,260}position:\s*static/,
  )
  assert.match(
    css,
    /\.dev-uni-surface-garden-index > \.dev-uni-context\.right[\s\S]{0,120}display:\s*none !important/,
  )
  assert.match(
    css,
    /:root\[reader-mode="on"\][\s\S]{0,260}\.dev-uni-surface-article-detail > \.dev-uni-context[\s\S]{0,80}display:\s*none !important/,
  )
  assert.match(css, /\.dev-uni-header\s*\{[\s\S]{0,160}position:\s*sticky/)
  assert.doesNotMatch(css, /data:image\/svg\+xml/)
  assert.match(css, /\.portfolio-identity > \.home-section-label[\s\S]{0,120}translateX\(0\.5px\)/)
  assert.match(css, /\.portfolio-identity > h1[\s\S]{0,120}translateX\(-0\.5px\)/)
  assert.match(css, /\.portfolio-section-heading h2[\s\S]{0,120}translateX\(1px\)/)
  assert.match(css, /\.home-route-geometry\s*\{[\s\S]{0,100}margin-inline:\s*auto/)
  assert.match(css, /\.home-brain-image\s*\{[\s\S]{0,120}filter:\s*invert\(1\)/)
  assert.match(css, /\.home-neural-guidepaths path\s*\{[\s\S]{0,120}stroke:\s*transparent/)
  assert.match(
    css,
    /\.dev-uni-surface-home \.primary-navigation\s*\{[\s\S]{0,140}background:\s*var\(--du-surface\)/,
  )
  assert.match(css, /\.home-neural-packets \.packet/)
  assert.match(css, /\.dev-uni-surface-articles-category/)
  assert.match(
    css,
    /grid-template-columns:\s*minmax\(16rem,\s*1\.3fr\)\s*repeat\(2,\s*minmax\(10rem,\s*1fr\)\)/,
  )
  assert.match(
    css,
    /\.dev-uni-surface-article-detail > \.dev-uni-context\.right[\s\S]*padding-left:\s*1rem\s*!important/,
  )
  assert.match(article, /src="\/static\/tistory\/23\//)
  assert.doesNotMatch(article, /\b(?:src|data-url|data-phocus)="https:\/\/blog\.kakaocdn\.net/)
})

test("built outputs keep Garden tools isolated and Articles flat", async () => {
  const built = Object.fromEntries(
    await Promise.all(
      Object.entries(routes).map(async ([surface, route]) => [
        surface,
        await source(`public/${route}`),
      ]),
    ),
  )

  for (const [surface, html] of Object.entries(built)) {
    assert.match(html, new RegExp(`data-surface="${surface}"`))
    assert.equal(count(html, /<main\b/g), 1)
    assert.equal(count(html, /<h1\b/g), 1)
    assert.equal(count(html, /class="dev-uni-scroll-top"/g), 1)
  }

  for (const surface of ["garden-index", "garden-detail"]) {
    assert.equal(count(built[surface], /class="explorer nav-files-container"/g), 1)
    assert.match(built[surface], /data-root-path="brain"/)
    assert.match(built[surface], /includePathPrefixes&quot;:\[&quot;brain&quot;\]/)
  }
  assert.equal(count(built["garden-index"], /class="graph-container global-graph-container"/g), 1)
  assert.equal(count(built["garden-index"], /class="global-graph-outer"/g), 0)
  assert.equal(count(built["garden-detail"], /class="global-graph-outer"/g), 1)
  for (const surface of [
    "about",
    "portfolio-index",
    "portfolio-detail",
    "articles-index",
    "articles-category",
    "article-detail",
  ]) {
    assert.equal(count(built[surface], /class="explorer nav-files-container"/g), 0)
    assert.equal(count(built[surface], /class="global-graph-outer"/g), 0)
  }

  assert.equal(count(built["articles-index"], /href="\.\.\/articles\/tistory\/\d+"/g), 5)
  assert.equal(count(built["articles-category"], /href="\.\.\/\.\.\/articles\/tistory\/\d+"/g), 9)
  assert.match(built["articles-index"], /articles-category-nav/)
  assert.match(built["articles-index"], /최근 업로드/)
  assert.doesNotMatch(built["articles-index"], />tistory<\/a>/)
  assert.equal(count(built["article-detail"], /class="depth-0"/g), 8)
  assert.ok(
    built["article-detail"].indexOf('class="right sidebar dev-uni-context"') <
      built["article-detail"].indexOf('<main class="center"'),
  )
  assert.doesNotMatch(
    built["article-detail"],
    /visit-counters|article-view-counter|집계 불가|지원 안 함/,
  )

  const portfolioStart = built["portfolio-index"].indexOf(
    '<article class="dev-uni-portfolio portfolio-page"',
  )
  const portfolioEnd = built["portfolio-index"].indexOf("</main>", portfolioStart)
  assert.ok(portfolioStart >= 0 && portfolioEnd > portfolioStart)
  const portfolioPage = built["portfolio-index"].slice(portfolioStart, portfolioEnd)
  assert.equal(count(portfolioPage, /class="internal"/g), 0)
  assert.equal(count(portfolioPage, /class="portfolio-work-project"/g), 5)
  assert.equal(count(portfolioPage, /class="portfolio-project-metrics"/g), 6)
  assert.equal(count(portfolioPage, /class="portfolio-project-metrics">[\s\S]*?<\/dl>/g), 6)
  assert.match(portfolioPage, /개발자로서의 태도/)
  assert.doesNotMatch(
    portfolioPage,
    /고객에게 빠르고 정확한 서비스를 전달하는 백엔드 엔지니어입니다/,
  )
  for (const heading of [
    "IoT 데이터 처리 엔진",
    "협력사 연동 파이프라인",
    "EMR 연동 장애 해결",
    "테스트 코드 도입",
    "호선·선박 RTLS",
    "경험과 학력",
    "발표와 글",
  ]) {
    assert.match(portfolioPage, new RegExp(heading))
  }
  assert.doesNotMatch(portfolioPage, /class="page-listing"|class="tag-link"/)

  const queue = await source("public/brain/notes/cs/ds/queue.html")
  assert.match(
    queue,
    /<strong><span class="text-highlight">큐 \(Queue\) : 삽입과 삭제 연산이 FIFO로 이뤄지는 자료구조<\/span><\/strong>/,
  )
  assert.doesNotMatch(queue, /<span class="text-highlight">\*\*/)
})

test("Tistory author semantics survive the approved local asset projection", async () => {
  const result = await auditTistoryBodies()
  assert.equal(result.status, "pass", result.errors.join("\n"))
  assert.equal(result.recordCount, 15)
})

test("owner revision visual and Garden interaction evidence pass", async () => {
  const [visual, interaction, mobileHome, portfolioAxis] = await Promise.all([
    readFile(
      path.join(repositoryRoot, "migration/evidence/design-owner-revision/capture-index.json"),
      "utf8",
    ).then(JSON.parse),
    readFile(
      path.join(repositoryRoot, "migration/evidence/design-owner-revision/garden-interaction.json"),
      "utf8",
    ).then(JSON.parse),
    readFile(
      path.join(repositoryRoot, "migration/evidence/design-owner-revision/mobile-home-owner.json"),
      "utf8",
    ).then(JSON.parse),
    readFile(
      path.join(
        repositoryRoot,
        "migration/evidence/design-owner-revision/portfolio-axis-owner-dpr2.json",
      ),
      "utf8",
    ).then(JSON.parse),
  ])
  assert.equal(visual.status, "PASS")
  assert.deepEqual(visual.summary.failures, [])
  assert.equal(visual.summary.screenshotCount, 36)
  assert.ok(visual.summary.shellAlignmentMaxDelta <= 1)
  assert.equal(visual.summary.portfolioMetricOverlapFailures, 0)
  assert.equal(visual.summary.portfolioMetricWrapFailures, 0)
  assert.equal(visual.summary.portfolioMetricOverflowFailures, 0)
  assert.equal(visual.summary.portfolioEmailWrapFailures, 0)
  assert.ok(visual.summary.articlesShellMaxDelta <= 1)
  assert.equal(visual.tocCurrentSection.activeCount, 1)
  assert.equal(visual.popover.explorerPopoverVisible, false)
  assert.equal(visual.popover.articlePopoverVisible, false)
  assert.equal(visual.popover.homePopoverVisible, false)
  const article = visual.cells.find((cell) => cell.id === "article-detail-desktop-light")
  assert.equal(article.probe.articleCenterDelta, 0)
  assert.ok(article.probe.articleTocGap >= 32)
  assert.equal(article.probe.articleBrokenImages, 0)
  assert.deepEqual(article.probe.articleRemoteImageSources, [])
  assert.equal(interaction.status, "PASS")
  assert.equal(interaction.interaction.expanded, true)
  assert.equal(interaction.interaction.explorerCount, 1)
  assert.ok(interaction.interaction.footerOverlap <= 1)
  assert.equal(mobileHome.status, "PASS")
  assert.equal(mobileHome.mobileHome.open.navigationBackground, "rgb(255, 255, 255)")
  assert.equal(mobileHome.mobileHome.neural.centerDelta, 0)
  assert.equal(mobileHome.mobileHome.route.centerDelta, 0)
  assert.equal(portfolioAxis.status, "PASS")
  assert.equal(portfolioAxis.axis.ink.delta, 0)
})

test("owner revision remains local and does not authorize deployment", async () => {
  const result = await auditLocalNoExternalMutationBoundary()
  assert.equal(result.status, "pass", result.errors.join("\n"))
})
