# Terra implementation plan — superseded SIGNAL / FIELD draft

> **Status: superseded on 2026-08-01. Do not implement this plan.**  
> The multidisciplinary review retired SIGNAL / FIELD. See `DESIGN_DIRECTION_REVIEW_2026-08-01.md` and the repository-root `DESIGN.md`. A fresh Terra plan will be written only after the new whole-site visual board is approved.

## Handoff

- Plan author/model: **Sol**
- Implementation model: **Terra**
- Status: **superseded — do not implement**
- Canonical design source: `../../../DESIGN.md`
- Existing Quartz behavior contract: `../DESIGN.md`
- Scope: rebuild the complete presentation layer while preserving content, routes, SEO, Brain hierarchy, graph semantics, search, backlinks, and static output.
- Dependency policy: no new dependency unless an existing implementation cannot satisfy an approved interaction.

## Definition of done

The redesign is complete when the live site matches the approved SIGNAL / FIELD board across Home, About, Portfolio, Brain, Articles, and Article detail at desktop, 1024px tablet, and 390px mobile; all existing content and knowledge-navigation behavior remain intact; and the old teal/navy template grammar is absent.

## Phase 0 — freeze and measure

### Work

- Keep the archived baseline at `docs/design-baseline/2026-08-01-current/` immutable.
- Capture fresh route screenshots and automated behavior checks before styling changes.
- Record current DOM owners for header, mobile drawer, Explorer, graph overlay, TOC, backlinks, footer, and surface classes.
- Add regression coverage only where the existing behavior is not protected.

### Required checks

- Direct load and SPA navigation start at page top unless a hash is present.
- Brain Explorer persists and retains expansion state during Brain-to-Brain navigation.
- Brain Explorer is initially closed when entering Brain from another top-level route.
- TOC anchors land below the sticky header in one jump.
- Search, theme, reading visibility, graph overlay, back-to-top, and drawer controls remain keyboard accessible.

## Phase 1 — remove the old visual system

### Work

- Inventory `custom.scss` and page-specific overrides by actual owner.
- Delete obsolete teal/navy, giant-title, centered-intro, rounded-card, gradient, and repeated breakpoint rules.
- Introduce only the approved SIGNAL / FIELD tokens from `DESIGN.md`.
- Establish explicit surface roots for Home, About, Portfolio, Brain landing, Brain note, Articles index, and Article detail.
- Keep state/interaction rules outside breakpoints; breakpoints change layout only.

### Acceptance

- One rule owner per component state.
- No stale pass-specific override is required for correctness.
- The build contains no accidental use of the retired brand palette in primary UI.

## Phase 2 — shared shell and responsive drawer

### Work

- Rebuild the header as a stable three-zone grid.
- Recreate the slim curved cobalt active indicator and identical hover preview.
- Keep header sticky; define a single CSS variable for its measured height.
- Switch to drawer navigation below 1200px.
- Use a neutral overlay scrim and prevent body scroll while the drawer is open.
- Keep search, theme, and reading controls aligned and visible.
- Normalize cursor, focus-visible, hover, and 44px tap targets.

### Acceptance

- Header content never shifts between routes.
- No label becomes white on a white background on hover.
- Drawer links are clickable across their full row and close after navigation.
- Brain drawer includes Explorer; other drawers do not render empty Brain structures.

## Phase 3 — Home cover

### Work

- Replace the current landing composition with an obsidian full-bleed cover.
- Implement the Korean lead phrase with explicit phrase-safe line breaks.
- Build a lightweight SVG or canvas signal field using existing graph data where feasible.
- Animate initialization once, then send sparse pulses through a bounded edge subset.
- Add the four-route editorial index as the bottom cover strip.

### Acceptance

- No gradient or generic geometric decoration.
- Motion is smooth, bounded, and disabled by reduced-motion.
- The first viewport reads as a unique cover rather than a portfolio template.

## Phase 4 — About and Portfolio

### About

- Reframe the supplied portrait as an orange editorial image field.
- Reuse approved personal copy; do not introduce professional project claims here.
- Add the three factual modules only when their wording is approved.
- Center the image and fill the section background when it stacks below 1200px.

### Portfolio

- Preserve verified résumé facts and all real projects.
- Convert each project to problem / decision / implementation / evidence sections.
- Use the black metric column and orange numbers only for verifiable values.
- Keep contact data compact and aligned; verify all public links.

### Acceptance

- About and Portfolio no longer look like duplicates.
- No invented metric, technology, employer, or narrative appears.

## Phase 5 — Brain map room

### Work

- Keep the Explorer logic and data model; rebuild only its presentation.
- Create the cobalt map room landing layout with a compact explorer/filter rail.
- Make the Brain root visually dominant and preserve current/direct/other depth states.
- Derive all graph nodes from Brain content, not Articles or Portfolio.
- Preserve the compact contextual graph on note pages.
- Under 1200px, open Explorer from the hamburger and graph from a persistent fixed control.

### Acceptance

- Brain landing communicates relationships before folders.
- Note pages retain Explorer throughout Brain navigation.
- Graph overlays keep the underlying page visible beneath a neutral scrim.
- No unnecessary graph reconstruction causes scroll or layout jumps.

## Phase 6 — Articles index and detail

### Articles index

- Replace repeated cards with numbered issue rows.
- Keep category controls stable and data-driven.
- Highlight only one featured issue at a time.
- Render frontmatter tags in a dedicated column.
- Add pagination or bounded category views for growth.

### Article detail

- Center long-form copy at the approved measure.
- Place TOC and backlinks in the desktop right rail with independent hidden-scrollbar regions.
- Keep graph + TOC/backlink rail fixed while only the relevant list scrolls.
- Move TOC below title and metadata under 1200px.
- Remove the TOC from layout when reading visibility is toggled off.
- Apply the shared sticky-header anchor offset to every rendered heading.

### Acceptance

- A distant TOC target lands correctly in one action.
- Current section remains visibly cobalt during scrolling.
- No duplicate separator appears between TOC and backlinks.
- Article body width does not shrink because of an oversized rail.

## Phase 7 — responsive hardening

### Reference widths

- 1600×1000 desktop
- 1366×900 laptop
- 1024×900 tablet
- 768×1024 narrow tablet
- 390×844 mobile
- 360×800 narrow mobile

### Verify

- no one-character Korean columns;
- no horizontal page scroll;
- no clipped graph or portrait;
- no header overlap;
- no fixed button covering content;
- drawer, graph overlay, and TOC have deterministic z-index order;
- all breakpoint states preserve identical interaction colors and cursors.

## Phase 8 — accessibility, performance, and release QA

### Accessibility

- Semantic landmarks, headings, buttons, and links.
- Focus trap and Escape dismissal for modal overlays.
- Focus-visible contrast on cobalt, citron, orange, black, and bone.
- Reduced-motion fallback for every new animation.
- Accessible graph labels and non-visual relationship summary.

### Performance

- Reuse existing graph runtime.
- Avoid per-frame DOM creation and unbounded animation loops.
- Lazy-load noncritical portrait/graph assets where appropriate.
- Confirm no large layout shift from fonts, images, or graph initialization.

### Final verification sequence

1. Targeted unit tests for changed components.
2. Typecheck and lint.
3. Production build.
4. Direct-load and SPA route smoke tests.
5. Desktop/tablet/mobile screenshot pass for all six surfaces.
6. Keyboard-only drawer, search, theme, reading, graph, TOC, backlink, and back-to-top pass.
7. Compare against approved mockup and archived baseline.

## Terra guardrails

- Do not rewrite content to make the layout fit.
- Do not reintroduce the old palette as a compromise.
- Do not create a universal page hero component.
- Do not hide responsive defects with overflow clipping.
- Do not add new card abstractions, decorative SVG packs, or animation libraries.
- Stop and report if implementation requires changing routes, graph meaning, article source files, résumé facts, or SEO identity.
