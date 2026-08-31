# Terra implementation plan — Neural Archive

## Authority

- Canonical design: `../../../DESIGN.md`.
- Quartz contract: `../DESIGN.md`.
- Approved direction: `dev-uni-neural-interaction-preview.html` plus the user's correction that Home must show no custom connector lines and all lights must visually follow the brain drawing's white contours.
- Implementation owner/model: Terra.
- Design and acceptance owner: Sol.
- Superseded plans: `TERRA_EDITORIAL_POSTER_IMPLEMENTATION_PLAN.md` and `TERRA_REDESIGN_IMPLEMENTATION_PLAN.md`.

## Definition of done

The site presents Dev Uni as a living second brain. Home uses the local anatomical brain drawing as the visual coordinate system; anchored synapses and intermittent light packets stay on selected white contours without rendering guide lines. About and Brain have meaningful illustrated introductions. Portfolio is static and media-free. Articles is thumbnail-free. Existing Quartz content, URLs, Search, graph relationships, SEO, reading utilities and accessibility remain functional.

## Technical decision: Home signal motion

### Selected approach

Use one inline SVG component with the original brain `viewBox="0 0 1600 1304"`:

1. Inline the public-domain brain path as the visible artwork.
2. Manually author 5–8 invisible guide paths in the same coordinate system. Each path visually traces a selected existing contour.
3. Place 8–12 anchored synapse groups directly on verified contour coordinates.
4. Animate 3–7 signal packets along guide paths using SVG-native motion or a small component-local controller based on `getTotalLength()` / `getPointAtLength()`.
5. Keep guide paths `stroke="none"` or otherwise non-rendering. They are geometry only.

### Why this approach

- The source SVG is one complex path, so automatic semantic path extraction is unreliable and unnecessary.
- A shared viewBox prevents responsive drift between the drawing and the lights.
- Manual guides provide art direction and deterministic screenshots without an edge-detection dependency.
- A bounded signal count is cheaper and more controllable than canvas particles or a general animation library.

### Prototype gate

Before implementing other routes, build a Home-only contour prototype and capture desktop plus 390 px screenshots. Do not proceed until all of the following pass:

- No custom connector line is visible.
- Every anchored circle visually touches a white brain contour at both widths.
- Each moving packet appears to travel on an existing contour.
- No packet travels through empty black space or outside the silhouette.
- Pause and reduced-motion states work.

## Phase 0 — baseline and capability contract

- From `migration/quartz-v5`, run:
  1. `npm test`
  2. `npm run check`
  3. `npm run build:ci`
- Record current behavior for navigation, direct load, SPA navigation, Search, Brain graph, backlinks, TOC, Reader/theme behavior and mobile drawer.
- Add/adjust regression tests before replacing presentation owners whose hooks will change.
- Create a deletion map for rejected Home/About/Portfolio/Articles landing markup and the old custom.scss layers.

## Phase 1 — assets and tokens

### Files

- Add `quartz/static/dev-uni/brain-drawing-public-domain.svg`.
- Add `quartz/static/dev-uni/ARTWORK_CREDITS.md` or an equivalent source comment plus rendered credit data.
- Create one compact token section in `quartz/styles/custom.scss` or a dedicated imported partial.

### Requirements

- Preserve the source SVG and license/source information.
- Palette: black, off-white, white linework, acid-green signal and rare cyan secondary signal.
- Remove obsolete teal/navy/poster/rainbow tokens as their owners are deleted.
- No new dependency.

## Phase 2 — Home contour prototype and final component

### Files

- Add `quartz/components/NeuralBrainHero.tsx`.
- Add `quartz/components/styles/neuralBrainHero.scss`.
- Add `quartz/components/scripts/neuralBrainHero.inline.ts` only if SVG-native animation cannot satisfy pause/offscreen lifecycle cleanly.
- Update `quartz/components/DevUniLanding.tsx` to render the component on Home.
- Update the appropriate resource registration/import owner.

### Component responsibilities

- Own the inline brain path, guide paths, anchors, packet timing and poster state.
- Render one meaningful accessible label for the stage; hide guide geometry and packet graphics from assistive technology.
- Provide a native pause/play button with persistent state during the current page view.
- Stop animation when the document is hidden or the stage is offscreen.
- Disable parallax and motion under `prefers-reduced-motion: reduce`; leave 3–5 anchored lights visible.
- Render the artwork credit in the footer or About credit surface.

### Motion limits

- 3–7 moving packets.
- 8–12 stationary anchors.
- Packet duration 3.5–7 seconds with staggered quiet intervals.
- Core plus restrained halo; no large background glow, random particles or free-floating nodes.
- No per-frame layout measurement; cache guide lengths and points after mount/resize.

### Tests

- Component markup: pause semantics, accessible description, decorative geometry hidden.
- Script/controller: pause/play, reduced-motion initialization, visibility/offscreen suspension and SPA remount cleanup.
- Visual: screenshot overlay confirms guide strokes are not rendered and anchor coordinates remain aligned.

## Phase 3 — illustrated route introductions

### Files

- Add `quartz/components/IllustratedRouteRail.tsx` and its style partial, or fold it into the new Home composition if it has no reuse value.
- Add authored inline SVG illustrations under `quartz/components/illustrations/`:
  - `AboutLineIllustration.tsx`: person, observation, note and decision fragments.
  - `BrainMapIllustration.tsx`: brain/map outline and note nodes.
  - Minimal line icons for Portfolio and Articles only; no large artwork or thumbnail behavior.

### Interaction

- About and Brain entries may highlight a meaningful illustration fragment on hover/focus/tap.
- Portfolio and Articles entries remain static except focus/pressed feedback.
- All entries retain real links and native navigation semantics.

## Phase 4 — About identity stage

### Files

- Replace the About landing branch in `quartz/components/DevUniLanding.tsx`, preferably extracting `AboutIdentityStage.tsx`.
- Reuse the real portrait at `quartz/static/dev-uni/about-jaeyoon-2026.jpeg` in biography content if it strengthens trust; do not make it the sole interaction.

### Layout and behavior

- Desktop: large authored line illustration left; Observe, Structure, Record and Connect controls/content right.
- Hover/focus/tap changes one explanatory sentence and highlights only the matching drawing fragment.
- Mobile: illustration first, then a native button/tab or accordion-like list; no floating orbit cards.
- Preserve authored biography and route links without inventing claims.

### Acceptance

- About visibly contains an illustration at all evidence widths.
- Every highlighted fragment has a matching text state and keyboard/touch equivalent.
- No idle particle system, card orbit, shadow or random motion.

## Phase 5 — Brain explorer stage

### Files

- Introduce a Brain landing owner in `DevUniFrame.tsx` / `DevUniLanding.tsx` if surface classification does not currently route Brain there.
- Reuse the existing Quartz graph data/component and plugin patches; do not fork graph semantics.
- Add a presentation wrapper such as `BrainExplorerStage.tsx` plus a style partial.

### Layout and behavior

- Desktop: graph canvas 65%, selected-note detail 35%.
- Mobile: graph first, detail below.
- Graph is real exploration: selecting a node shows note title, related notes/articles/projects, backlinks and tags when data exists.
- Base connections are quiet; only the selected neighborhood receives the signal color.
- Avoid continuous floating animation. Home is ambient; Brain is interactive information.

### Tests

- Existing graph relationship and navigation tests continue to pass.
- Add selected-node detail, keyboard focus, empty graph and fallback assertions.
- Verify direct-load and SPA navigation do not duplicate listeners or stale selection.

## Phase 6 — static Portfolio

### Files

- Replace the Portfolio landing branch in `DevUniLanding.tsx`; extract `PortfolioCaseList.tsx` if it improves ownership.
- Delete obsolete Portfolio hero/media/metric presentation styles when no longer referenced.

### Content structure

- Number, project name, one-line problem, role/technology, result or learning and period.
- No thumbnail, video, autoplay, poster art or decorative interaction.
- Only focus visibility and a restrained row hover/underline.
- Preserve real project and career evidence; do not invent metrics.

## Phase 7 — thumbnail-free Articles

### Files

- Replace Articles index/category presentation in `DevUniLanding.tsx`; extract `ArticleArchiveList.tsx` if appropriate.
- Reuse existing article metadata and category routing.
- Delete thumbnail generation/rendering from the index presentation; authored images inside article bodies remain untouched.

### Row structure

- Date, title, category, one-line description and optional text-only Brain backlink/count.
- No generated or default thumbnail containers.
- Empty/category states remain accessible and readable.

## Phase 8 — shell, responsive and cleanup

- Simplify `PrimaryNavigation.tsx` to the approved route order and active semantics.
- Update `DevUniFrame.tsx` surface ownership so Home/About/Brain/Portfolio/Articles use the new presentation without legacy sidebars leaking into landing surfaces.
- Replace old visual rules; do not append a compatibility override layer.
- Ensure 390 px has no horizontal scroll, clipped brain, detached anchors, floating About cards, graph overflow or metadata collisions.
- Keep Search, Reader/theme and other retained utilities visually compatible without placing them over the brain stage.

## Phase 9 — verification and acceptance

### Automated

1. Targeted component/controller tests.
2. `npm test`.
3. `npm run check`.
4. `npm run build:ci`.
5. Direct-load and SPA route smoke tests.

### Visual evidence

- Capture Home, About, Brain, Portfolio and Articles at 1600, 1366, 1199, 768 and 390 px.
- Capture Home running, paused and reduced-motion states.
- Capture About default and one selected semantic state.
- Capture Brain default, selected node and empty/fallback states.
- Confirm Portfolio contains no moving/thumbnail media and Articles contains no thumbnails.

### Hard rejection conditions

- Any visible custom neural connector on Home.
- Any anchored or moving light visibly detached from the brain contours.
- Any light outside the brain silhouette except during an intentional clipped transition that is not visible to users.
- About without meaningful line illustration or with floating orbit cards.
- Brain as decorative-only animation or with lost relationship/navigation semantics.
- Portfolio autoplay/illustration or Articles thumbnail rendering.
- Missing artwork credit, inaccessible pause/focus behavior, motion under reduced-motion, horizontal scroll or failed build/tests.

## Delivery order

1. Baseline tests and deletion map.
2. Home-only contour prototype — acceptance gate.
3. Final Home component and route introductions.
4. About.
5. Brain.
6. Portfolio.
7. Articles.
8. Shell cleanup, responsive pass and full verification.

