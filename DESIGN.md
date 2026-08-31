# Dev Uni design

## Source of truth

- Status: Active — neural interaction direction approved; implementation pending.
- Last refreshed: 2026-08-10.
- Primary product surfaces: Home, About, Brain index/detail, Portfolio, Articles index/detail, Search and reading/graph utilities.
- Public product idea: **Developer's Second Brain** — 개발하며 남긴 기록, 판단, 구현을 연결하는 개인 지식 시스템.
- Evidence reviewed:
  - User-approved `dev-uni-neural-interaction-preview.html` and the 2026-08-02 correction: remove visible neural connector paths; align lights to the brain drawing's white contours; add illustrated About/Brain introductions; keep Portfolio static and Articles thumbnail-free.
  - Public-domain `Brain Drawing.svg`, original artwork by T. Wesley Mills and vector conversion by Offnfopt, via Wikimedia Commons.
  - Current Quartz v5 presentation, routes, content, graph data, tests and assets under `migration/quartz-v5/`.
  - Earlier poster/archive previews are superseded. They misunderstood interaction as abstract geometry and overextended thumbnail artwork.

## Brand

- Personality: curious developer, disciplined archivist, human, visually precise.
- Promise: make the movement of thought visible without pretending every page is an art experiment.
- Trust signals: real biography, real projects, dates, code/operations context, actual note relationships and explicit image credits.
- Avoid: generic AI/medical demo visuals, random particles, abstract-circle filler, gradients, glass, shadows, SaaS cards, Studio Feixen imitation without Dev Uni meaning, invented metrics or slogans.

## Product goals

- Goals:
  - Make the Home brain illustration the memorable expression of “Developer's Second Brain.”
  - Concentrate meaningful interaction in Home, About and Brain.
  - Make Portfolio and Articles quiet, fast and readable.
  - Preserve Quartz routes, search, graph semantics, SEO, content and accessibility while replacing the presentation.
- Non-goals:
  - Animate every surface.
  - Generate decorative thumbnails for Articles or Portfolio.
  - Draw a generic node network over the Home brain.
  - Preserve the current Dev Uni landing templates or accumulated visual CSS.
- Success signals:
  - In three seconds, Home reads as a living second brain rather than a generic graph demo.
  - Visible lights remain on the anatomical brain's white contours; no custom connector line is visible.
  - About and Brain each have a meaningful illustrated introduction and distinct interaction purpose.
  - Portfolio contains no animated media; Articles contains no thumbnail system.

## Personas and jobs

- Primary personas: Korean developers reading backend/CS notes, collaborators reviewing work and Jaeyoon revisiting linked knowledge.
- User jobs: understand who Jaeyoon is, inspect projects, browse articles, traverse notes and explore knowledge relationships.
- Key contexts: desktop exploration, mobile reading, keyboard navigation, reduced motion and slow networks.

## Information architecture

- Primary navigation: Dev Uni, About, Brain, Portfolio, Articles and Search/utility access.
- Core routes/screens: `/`, `/about`, `/brain`, `/portfolio`, `/articles`, their detail routes and graph/search overlays.
- Content hierarchy:
  1. Home brain signal stage.
  2. Illustrated route introductions for About and Brain; minimal text entries for Portfolio and Articles.
  3. About identity/working-method content.
  4. Brain graph and selected-note context.
  5. Static Portfolio case list.
  6. Thumbnail-free Articles archive.

## Design principles

- The brain drawing is the route: the anatomical white contours carry the light; no second network is drawn on top.
- Motion earns its place: Home communicates living memory, About reveals identity, Brain supports exploration. Other routes stay still.
- Illustration explains: every illustration means person, record, connection or archive.
- Quiet pages create contrast: Portfolio and Articles become more credible by refusing decorative motion.
- Replace, do not skin: old presentation components and CSS may be deleted when capabilities are preserved.

## Visual language

- Color: black stage, off-white paper, white brain linework, one acid-green signal and rare cyan secondary signal. No rainbow palette.
- Typography: compact grotesk for navigation/headings, readable Korean sans for body, mono only for dates/metadata/state.
- Spacing/layout rhythm: edge-to-edge stages and ruled editorial lists; no centered marketing-card shell.
- Shape/radius/elevation: square edges, thin rules, no radius/shadow/elevation decoration.
- Motion:
  - Home: 3–7 light packets move intermittently along invisible guide paths aligned to brain contours.
  - About: hover/focus/tap highlights one part of a line illustration and changes one description.
  - Brain: movement follows selection; the graph is not an idle screensaver.
  - Portfolio/Articles: no autoplay or decorative animation; only native focus and a subtle row state.
- Imagery/iconography:
  - Home uses the credited public-domain anatomical brain drawing.
  - About uses an authored line illustration: person + observation + note + decision + connection.
  - Brain uses a graph/brain-map illustration fed by real note relationships.
  - Home route introductions use small line illustrations, not generated thumbnails.

## Components

- Existing capabilities to reuse: route/content data, Search, Graph data, backlinks, TOC, theme/Reader behavior, SPA navigation and accessibility semantics.
- New/changed components:
  - `NeuralBrainHero`: inline brain SVG, invisible guide paths, anchored synapses, signal packets, pause/reduced-motion behavior and artwork credit.
  - `IllustratedRouteRail`: About/Brain illustrated entries plus minimal Portfolio/Articles entries.
  - `AboutIdentityStage`: line illustration with four semantic states — Observe, Structure, Record, Connect.
  - `BrainExplorerStage`: existing graph data with a selected-note detail panel and restrained activation styling.
  - `PortfolioCaseList`: static problem/role/result rows without media.
  - `ArticleArchiveList`: date/title/category/summary rows without thumbnails.
  - `MobileTocPopover`: reuses the rendered page TOC and exposes it from a fixed mobile trigger between scroll-to-top and graph controls. Desktop rails show one static, always-expanded `목차`; mobile inline TOCs retain their fold control; the floating popover uses a non-layout clone with a static `목차` heading and always shows entries independently of the inline fold state. Opening the popover keeps the vertical scrollbar and content width stable while the backdrop blocks background wheel/touch input; inline expansion clips transient horizontal overflow.
  - `MobileGraphPopover`: reuses the global graph interaction but presents it at `<=1200px` as a centered canvas at roughly 84% of the viewport, with balanced outer space, the graph trigger remaining available to close it, and inactive utility buttons visually dimmed beneath the backdrop.
  - `MobileHeaderControls`: Search and theme remain available at `<=1200px`; Reader mode is desktop-only.
  - `BrainIndexUtilities`: the Brain index does not expose a scroll-to-top control because its primary graph is already the dominant mobile navigation surface.
- Variants and states: running, paused, reduced-motion, route active, illustration state active, graph node selected, loading/empty/error.
- Ownership: presentation belongs to the new components and one compact token layer; old landing CSS is removed, not overridden.

## Accessibility

- Target: WCAG 2.2 AA.
- Keyboard/focus: native buttons/links, visible focus and equivalent hover/focus/tap behavior.
- Mobile TOC: trigger exposes `aria-controls`/`aria-expanded`; Escape and backdrop close the popover; selecting an entry closes it and keeps the destination heading as the navigation target.
- Mobile graph: preserve existing Escape and backdrop dismissal, keep the active graph trigger visible, and do not trap the graph behind its backdrop.
- Contrast: all text and controls meet AA; acid green is not used for body text on light backgrounds.
- Screen readers: moving lights and guide paths are decorative and hidden; the brain stage has one concise description; graph controls expose selection.
- Reduced motion: packets stop, 3–5 anchored lights remain visible, parallax is disabled and the pause control retains understandable state.

## Responsive behavior

- Supported evidence widths: 1600, 1366, 1199, 768 and 390 px.
- Home: preserve the brain's aspect ratio and whole recognizable silhouette; crop only peripheral empty space. Lights and brain share one viewBox so alignment cannot drift.
- About: desktop two-column illustration/content; mobile illustration first and semantic controls below.
- Brain: desktop 65/35 graph/detail; mobile graph followed by detail.
- Portfolio/Articles: stable single-column editorial rows; metadata wraps without horizontal scrolling.
- Touch: no hover-only meaning. About states and graph nodes are tappable.
- Detail pages at `<=1200px`: when TOC entries exist, the fixed utility stack is scroll-to-top → TOC → graph; Articles without graph use scroll-to-top → TOC. The inline TOC remains collapsible, while the bounded floating popover always exposes the complete outline and does not inherit the inline collapsed state. Floating utility controls use a 52 px touch target; desktop graph/scroll utilities use the same enlarged visual scale.
- At `<=1200px`, the global graph opens beside the utility stack as a bounded 24 rem by approximately 48 vh popover; desktop keeps the centered large graph modal.

## Interaction states

- Loading: static brain poster and anchored lights; text routes remain usable before enhancement.
- Empty: Brain keeps its frame and explains missing relationships; lists keep headings and filters.
- Mobile TOC empty state: do not render or reserve a floating control when the page has no outline entries.
- Error: preserve routes and textual content; do not leave a blank hero or graph.
- Success: active route/node/state is visually and semantically announced.
- Offline/slow network: local SVG and textual navigation work without remote image dependencies.

## Content voice

- Tone: concise, factual, human and observant.
- Home: `Developer's Second Brain` / `기록, 판단, 구현을 연결하는 개인 지식 시스템`.
- About: `기술을 사람의 문제로 읽고, 판단의 흔적을 기록합니다.`
- Brain: `생각은 글보다 먼저 연결됩니다.`
- Portfolio: `문제를 정의하고, 구현하고, 운영하며 남긴 결과들.`
- Articles: `기술과 경험을 편집한 글.`
- Avoid: “성장”, “인사이트”, “혁신” 같은 범용 마케팅 문구와 가짜 수치.

## Implementation constraints

- Framework: Quartz v5/Preact remains. Rewrite presentation components and SCSS where needed.
- Asset: store the brain SVG locally, inline its visual path in the component and keep the public-domain credit in source and rendered footer/About credit.
- Home path alignment:
  - Brain visual and all nodes/guide paths use the original `0 0 1600 1304` coordinate system.
  - The source drawing is a single complex path; do not attempt automatic edge detection.
  - Manually author 5–8 invisible guide paths and 8–12 anchors that visually trace selected white contours.
  - No guide path may render a visible stroke.
- Dependencies: no new animation/graph package without explicit approval.
- Performance: local SVG, bounded signal count, pause when hidden/offscreen, no per-frame layout reads and no continuous animation outside Home.
- Compatibility: preserve URLs, content, graph meaning/data, search, SEO, SPA navigation and user-facing utilities.
- Verification:
  - `npm test`, `npm run check`, `npm run build:ci` in `migration/quartz-v5`.
  - Fresh screenshots at 1600, 1366, 1199, 768 and 390 px for Home, About, Brain, Portfolio and Articles.
  - Motion pause, reduced-motion, keyboard, touch and direct-load/SPA route tests.
  - Visual rejection if any light is visibly off the brain contours, any custom connector is visible, About lacks illustration, Brain is decorative-only, Portfolio animates or Articles render thumbnails.

## Implementation ownership

- Design and acceptance owner: Sol.
- Implementation owner/model: Terra.
- Terra handoff: `migration/quartz-v5/docs/TERRA_NEURAL_ARCHIVE_IMPLEMENTATION_PLAN.md`.
- Approved reference: `dev-uni-neural-interaction-preview.html` plus the user's no-visible-lines / contour-aligned-light correction captured in this document.

## Open questions

- [ ] Approve the revised Home contour-path prototype before whole-site implementation / owner: Jaeyoon / impact: locks the highest-risk motion behavior.
- [ ] Choose whether About uses the existing portrait alongside the line illustration or keeps the portrait in biography content below / owner: Jaeyoon / impact: About composition only.
