# Dev Uni Redesign Direction — ARCHIVE OS

> **Status: independent editorial review input, not an approved direction or public brand.**  
> Useful archive and editorial ideas were incorporated into `DESIGN_DIRECTION_REVIEW_2026-08-01.md`; the ARCHIVE OS name was rejected.

Status: proposal for Sol review and Terra implementation
Scope: full visual direction, not incremental tuning

## Decision

Discard the current `SIGNAL / FIELD` direction.

The next design direction should be `ARCHIVE OS`: a personal research desk for “개발자 유니의 두 번째 뇌”. It should feel like a carefully kept index archive, not a Quartz clone, not a generic AI portfolio, and not another teal-on-white developer template.

## Core concept

Dev Uni is not just a blog. It is a second brain where raw study notes, work records, articles, and personal context are organized into a retrievable knowledge system.

The UI should therefore feel like:

- a private archive;
- an index-card catalog;
- a technical notebook;
- a map table for connected notes;
- a restrained editorial portfolio.

The memorable visual object is not a gradient hero. It is a physical-feeling archive system: tabs, ruled lines, paper surfaces, stamps, memo cards, and graph maps.

## Reference synthesis

Use these as directional references, not as layouts to copy.

- Are.na: knowledge collection, blocks, connected references, quiet archive behavior.
- Quartz: graph-based knowledge navigation and explorer affordances.
- MUBI / editorial magazines: dense but calm indexes, strong typographic rhythm.
- A24-style editorial grids: strong content-first listings without generic card UI.
- The previous Dev Uni blog: clear left drawer, direct mobile navigation, practical note browsing.

## Brand position

Search/SEO phrase remains:

> 개발자 유니의 두 번째 뇌

But the site should not visually scream “brain” through cliché neural gradients. The brand should express second brain through structure:

- notes are filed;
- connections are visible;
- categories are browsable;
- writing can be retrieved later.

## Palette

Move away from the current cyan/teal-heavy system. Keep only a very restrained blue-green as a legacy accent.

Primary:

- Ink: `#171915`
- Paper: `#f3efe5`
- Porcelain: `#fbfaf5`
- Archive Gray: `#8d9189`
- Graph Mist: `#d7ddd8`

Accents:

- Brass: `#b38a3c`
- Rust Stamp: `#a94f32`
- Deep Graph Blue: `#1b3f4b`
- Old Teal: `#247f86` only for links, selected states, and active graph nodes

No purple gradients. No neon SaaS palette. No bright cyan as the default brand surface.

## Typography

Use type to create human/editorial character.

- Korean/body: `IBM Plex Sans KR` or `Pretendard` only if already available, with tighter weights.
- Editorial accent: `Gowun Batang` for short personal/about copy, not for all technical content.
- Mono: `IBM Plex Mono` for dates, labels, metadata, route breadcrumbs.

Avoid huge one-size-fits-all hero titles. Korean line breaks must respect words.

## Page directions

### Home

Purpose: Brand landing page for “개발자 유니의 두 번째 뇌”.

Layout:

- dark ink hero with paper-card graph object;
- title block stays compact and readable;
- navigation tabs feel like archive labels;
- intro copy explains second brain / zettelkasten without repeating Brain page;
- lower section shows four paths: About, Portfolio, Brain, Articles.

Motion:

- page-load graph tracing;
- subtle ongoing signal pulse along lines;
- no excessive floating blobs.

### About

Purpose: Who Shin Jae-yoon is beyond technical resume.

Layout:

- editorial essay + centered portrait card;
- photo becomes centered when stacked;
- copy explains curiosity, coffee, conversation, ESTP-like energy without sounding like a slogan;
- 전기공학과에서 컴퓨터공학으로 옮긴 전환 서사를 넣는다.

### Portfolio

Purpose: Career dossier, not a duplicated resume screenshot.

Layout:

- top identity and contact in strict two-column dossier;
- every case is a project sheet:
  - context;
  - problem;
  - role;
  - technical decision;
  - measurable result;
  - stack.
- Contact block alignment must share the same left axis as “Portfolio / 신재윤 / Backend”.

### Brain

Purpose: Main knowledge map.

Layout:

- note explorer and graph view align at the same top baseline;
- side columns are farther apart from content than now;
- Brain landing page should use a compact archive intro, then a large graph table.
- Graph is the main visual object on Brain landing, not a small right rail.

Information architecture:

- Use high-level lenses such as Lecture / Book / Note only if they help graph comprehension.
- Do not mechanically link every page only to Brain. That creates a starburst graph with little meaning.
- Better structure:
  - Brain links to major index pages.
  - Major index pages link to categories.
  - Notes link to topic/index pages and real related notes.

### Articles

Purpose: Published writing index.

Layout:

- compact publication masthead;
- category tabs: 전체 / 기술 / 회고 / 프로젝트;
- latest five shown on total view;
- list rows should feel like a journal index, not plain Quartz list rows.

### Article / Brain note detail

Purpose: reading without distraction.

Layout:

- desktop: left note explorer, center reading column, right graph/TOC/backlinks;
- under 1200px: drawer navigation and inline TOC below title/date;
- fixed header offset must be honored for anchor jumps;
- graph overlay should dim the existing page, not blank it.

## Interaction rules

- Hover never turns icons white on light surfaces.
- Hamburger, graph, top buttons always use pointer cursor.
- Header active mark keeps the curved underline, no simple generic line.
- Graph overlay and side drawer use the same dimmed-page behavior.
- TOC anchor scroll must land below the fixed header.
- Left explorer state persists only inside Brain navigation.
- Initial Brain entry can start collapsed; Brain-to-Brain note navigation preserves open branches.

## Anti-slop gates

Reject the implementation if:

- it still looks like a centered SaaS landing page;
- teal is the dominant visual identity;
- all page titles use the same huge typography;
- graph is decorative instead of navigational;
- mobile drawer and graph overlay behave differently;
- body copy is rephrased away from the user’s original writing;
- Korean words are broken awkwardly across lines.

## Terra implementation sequencing

1. Replace tokens first: colors, fonts, line rhythm, header active states.
2. Rebuild shell layout: desktop rails, <1200 drawer mode, fixed header offsets.
3. Rebuild Home and Brain landing pages as the flagship visual surfaces.
4. Rebuild Portfolio and About as editorial/dossier pages.
5. Rebuild Articles and detail templates.
6. Verify responsive states at 390, 768, 1024, 1194, 1440, 1728.
7. Run build/check and visual smoke captures before reporting completion.
