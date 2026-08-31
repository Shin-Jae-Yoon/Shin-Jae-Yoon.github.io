# Terra implementation plan — Studio Feixen-literal full replacement

> **Status: superseded on 2026-08-02. Do not implement this plan.**
> The approved direction is now the neural archive plan in `TERRA_NEURAL_ARCHIVE_IMPLEMENTATION_PLAN.md`.

## Authority

- Design source: `../../../DESIGN.md`.
- Quartz contract: `../DESIGN.md`.
- Visual source: a new approved literal-reference preview plus the live Studio Feixen macro structure.
- Rejected sources: `dev-uni-full-redesign-board.html`, `dev-uni-editorial-motion-v2.html` and older Studio-Feixen/Pudding mockups.

## Definition of done

The current Dev Uni presentation is no longer identifiable. Content, URLs, SEO, graph semantics, search and accessibility remain, while layout, component composition, class names and styling are replaced. Screenshots match Studio Feixen's macro structure and interaction rhythm using Dev Uni assets.

## Phase 1 — behavior contract and deletion map

- Run current tests and record user-facing behavior for navigation, search, filters, SPA routing, graph, Explorer, TOC, backlinks, Reader and theme.
- Identify data owners separately from presentation owners.
- Delete obsolete landing markup and CSS instead of retaining it beneath a new skin.
- Add regression tests for capabilities whose DOM/hooks will change.

## Phase 2 — reference shell

- Build a new header: wordmark, three symbol modes, compact About/contact/search links and featured-link slot.
- Rebuild mobile navigation and overlays; do not preserve the old curved underline or drawer appearance.
- Establish one new token set and media sizing system.

## Phase 3 — Home macro structure

- Edge-to-edge changing media with no headline overlay.
- Poster fallback, pause and reduced-motion state.
- Black Quick Links/contact band with animated illustrations.
- White Works/filter header using the three mode symbols.
- Mixed-ratio archive tiles fed by real Portfolio, Brain and Articles content.
- Plain About/contact footer.

## Phase 4 — shared archive modes

- Portfolio, Brain and Articles switch the shared archive mode and URL state.
- Derive tiles from real titles, dates, categories, project media, note relationships and article topics.
- Provide hover/focus/touch media states without generic placeholder geometry.
- Move résumé evidence to project details and About/CV content.

## Phase 5 — tools and detail pages

- Brain Explorer/Graph open as full-canvas tools or overlays from archive entries; preserve data, state and relationships without the legacy three-column landing layout.
- Project, note and article details use media-first modular bands.
- Recompose TOC, backlinks, code, evidence and graph context per content type; do not force a universal right rail.
- Rebuild Search, Reader, theme and graph overlays in the same visual system.

## Phase 6 — responsive and performance

- Reference-aligned mobile header, deliberate hero crop, touch Quick Links and ratio-aware archive reflow.
- Responsive poster/video sources, lazy archive media, offscreen suspension and stable loading states.
- Ensure the fallback experience remains complete offline and under reduced motion.

## Phase 7 — verification

1. `npm test`
2. `npm run check`
3. `npm run build:ci`
4. Direct-load and SPA route tests.
5. Fresh screenshots at 1600, 1366, 1199, 768 and 390 px.
6. Direct visual comparison with the live reference's header, media, Quick Links, filters, archive and footer.
7. Keyboard/reduced-motion checks for navigation, search, filters, media, graph, TOC, backlinks and overlays.

## Guardrails

- Do not edit authored Markdown prose merely to fit layout.
- Do not invent projects, metrics, biography or article claims.
- Do not preserve old layout because a component already exists.
- Do not copy Studio Feixen's logo, text, commercial assets or proprietary font files.
- Do not add a compatibility CSS layer that keeps both designs alive.
