# Specification: Hub Game Groups

## Overview

The Hub currently shows all 22 game tiles at once (6×4 on wide screens, three
10-tile pages on phones) in registry order, so the only way to find a game is to
remember where its tile sits. This track adds a row of six textless-topped group
chips (All plus five learning domains) in the Hub's existing top band. Tapping a
group redraws the board with only that group's games, at a larger tile size, so a
child reaches any game in at most two taps and the grid never has to be read
through. All stays the landing state and its geometry is byte-identical to today.

## Problem / Motivation

- 22 tiles is past the point where a pre-reader can scan a grid: `product.md`
  §3.1 already sorts the games by milestone (literacy, numeracy, visual
  discrimination, memory, social-emotional), but the Hub throws that structure
  away and renders one flat list.
- On wide screens the grid is packed at 144×116 to fit four rows, which is the
  smallest tile the layout can afford. With six or fewer tiles on screen the
  same canvas can show 176×196 tiles — noticeably easier for small hands and for
  finding a familiar icon.
- Phones already page 10 tiles at a time; without grouping, a child swipes
  through 22 tiles in registry order to reach the last game.
- The pieces are in place: `GAME_REGISTRY` is the single declaration of the games
  (2026-10-20 track), the grid was decomposed into `src/game/hub/` concerns
  (2026-10-21 track), and `src/game/hubPaging.ts` already owns narrow-viewport
  paging. Grouping is a layout concern on top of settled foundations, not a
  registry rewrite.

## Goals and Success Metrics

- **Goal:** every game is reachable in at most two taps from the Hub, and one tap
  brings a whole learning domain on screen.
  - *Metric:* a browser journey selects each chip, counts the tiles it draws, and
    launches a game from a group (evidence in `verification/phase-5.md`).
- **Goal:** a filtered board's tiles are larger than the All board's.
  - *Metric:* geometry test asserts 176×196 for filtered tiles against 144×116
    for All on the same 1024×768 canvas.
- **Goal:** nothing that already works changes on the All view.
  - *Metric:* the existing hub, navigation and `e2e`-launch assertions stay green
    with no assertion removed or loosened.
- **Goal:** project health gates hold.
  - *Metric:* coverage ≥ 95/88/85/90; shell entry ≤ 200 kB; full `verify_phase`
    gate exit 0 on every phase.

## Scope

### In scope

- A `group` field on `GAME_REGISTRY` entries and the group table that names the
  five domains (id, chip label, spoken name, glyph key).
- A chip row of six chips (All + five groups) in the Hub top band.
- A filtered board for wide and paged layouts, at the larger tile size.
- Five new shell SVG group glyphs, preloaded with the other Hub furniture.
- Speaking the selected group's name through the existing TTS path.
- Publishing the selection and the chips through the read-only `?e2e=1` bridge.
- Documentation sync (README, PRD, TDD, `conductor/product.md`,
  `conductor/product-guidelines.md`).

### Out of scope

- Any change to game scenes, game logic, adaptive difficulty, or narration.
- Any change to sticker, progress, play-time or profile storage; no new schema
  field and no new storage key.
- Any reordering of `GAME_REGISTRY` or `GAME_IDS` (registry order remains the
  storage order, the sticker-shelf order and the paging order).
- A remembered or persisted group selection.
- Search, favourites, "recently played" rows, or any per-child ordering.
- A new animation language for the chip row (no slide, no bounce, no sparkle).

## Functional Requirements

- **FR-1** — Every `GAME_REGISTRY` entry carries a `group` of type `HubGroupId`,
  and the five groups hold exactly: Letters & Sounds 5 (`alphabet-match`,
  `word-match`, `word-builder`, `first-sounds`, `decode-it`), Numbers & Counting
  5 (`how-many`, `more-less`, `add-it-up`, `take-away`, `number-order`), Thinking
  & Matching 6 (`shape-sorter`, `shadow-match`, `pattern-builder`,
  `odd-one-out`, `color-match`, `big-small`), Play & Memory 4 (`animal-trace`,
  `pop-freeze`, `musical-memory`, `memory-match`), Feelings & Stories 2
  (`feelings-faces`, `story-order`) — 22 in total, each game in exactly one.
- **FR-2** — The Hub renders six chips in its existing top band, in the order
  All, Letters, Numbers, Thinking, Play, Stories. Each chip shows a glyph above a
  one-word label; All's glyph is drawn, not shipped as art.
- **FR-3** — Tapping a chip redraws the board for that selection without leaving
  the Hub. Tapping All redraws today's board: the wide 6×4 grid (rows 6/6/6/4 at
  144×116, 22px spacing, centred) and, on a paged viewport, the 10-tile 5×2 pages
  with their page dots — both geometrically identical to the pre-track layout.
- **FR-4** — A filtered board draws its tiles at 176×196 with 20px spacing,
  centred on the canvas: 1–3 tiles in one row (n columns), 4–6 tiles as 3 columns
  with `ceil(n/3)` rows and each row centred within the board.
- **FR-5** — Within a group, tiles stay in registry order; the chip order is the
  order the group table declares.
- **FR-6** — Every one of the 22 games is reachable in at most two taps from a
  freshly opened Hub (chip, then tile).
- **FR-7** — The selection is per-visit state: it resets to All on every Hub
  visit, including an auto-return from a game, and no selection is written to
  storage.
- **FR-8** — Tapping a chip speaks that group's spoken name through
  `speakSentence(name, getSettings().sfxEnabled)`, so it is silent when SFX is
  off or the device has no voice. All speaks "All games".
- **FR-9** — The sticker shelf, the just-earned highlight, the play-time lock, the
  idle-attract targets, the retry cue's teardown and the entrance gating all
  follow the board that is drawn; a filtered board is never left with a cue,
  wiggle target or lock that belongs to a different board.
- **FR-10** — Five group glyphs ship in the boot shell as
  `src/assets/svg/ui/group_<id>.svg`, are imported explicitly (the shell glob
  keeps only `tile_`/`sticker_` keys), and rasterize at the icon tier. The shell
  inventory becomes 58 keys and 191 app keys in total, and the guard suites that
  state those inventories are updated to the new numbers rather than loosened.
- **FR-11** — The `?e2e=1` bridge publishes the selected group id and each chip's
  live centre, and `e2eHubTiles()` keeps reporting registry indexes for the tiles
  actually on screen, so a journey can tell which game a filtered tile is.
- **FR-12** — The README, `docs/PRD.md`, `docs/TDD.md`, `conductor/product.md`
  and `conductor/product-guidelines.md` describe the groups, the six chips, the
  two-tap rule and the new shell key count.

## Non-Functional Requirements

- **NFR-1** — Touch: a chip's hit area is 96×84 logical px, matching the existing
  top-band controls (the 96px Settings hit box and the 96px avatar chip), and no
  filtered tile is smaller than the All tile (176×196 against 144×116). The
  existing 64px tile floor test keeps passing unchanged.
- **NFR-2** — Parity on the All view: positions, sizes, entrance stagger, breathe
  bob, page count, dots and swipe behaviour are unchanged, and no assertion in the
  existing hub, navigation or browser suites is removed or loosened.
- **NFR-3** — Budget: boot shell entry stays ≤ 200 kB, the five new SVGs add no
  more than 5 kB to the precache list in total, and both figures are measured and
  recorded in the phase evidence.
- **NFR-4** — Motion: the chip row introduces no new tween. A filtered board uses
  the existing entrance animation, which already degrades to an alpha fade under
  `prefers-reduced-motion`; the selection swap itself is instant at every motion
  setting.
- **NFR-5** — Offline-first: no runtime network request, no new dependency, no new
  storage key, nothing transmitted.
- **NFR-6** — Coverage gates (lines 95 / functions 88 / branches 85 / statements
  90) hold, including the new modules.

## Acceptance Criteria

- **AC-1** — The group table decomposes the registry exactly 5/5/6/4/2 with every
  game in one group and no group empty (covers FR-1, FR-5).
- **AC-2** — The All board is geometrically identical to the pre-track board on
  both layouts, proved against a golden table of positions (covers FR-3, NFR-2).
- **AC-3** — One chip tap draws exactly that group's tiles, and the journey
  launches a game from a filtered board (covers FR-2, FR-4, FR-6).
- **AC-4** — Filtered tiles are 176×196 logical, each row centred, every tile
  inside the canvas below the chip band and above the mascot band (covers FR-4,
  NFR-1).
- **AC-5** — A chip tap calls `speakSentence` with the group's spoken name and the
  current SFX setting; with SFX off it is silent (covers FR-8).
- **AC-6** — The selection resets to All on the next Hub visit and never writes to
  storage (covers FR-7).
- **AC-7** — After a filtered rebuild, the attract targets, sticker shelf, time-up
  lock and load-cue teardown all describe the new board (covers FR-9).
- **AC-8** — The shell ships 58 keys / 191 app keys, the five `group_*` glyphs
  resolve to the icon tier, and the guard suites state those numbers (covers
  FR-10, NFR-3).
- **AC-9** — The bridge reports the selected group and each chip's centre, and
  tile ids stay registry indexes on a filtered board (covers FR-11).
- **AC-10** — The documents name the groups and the new shell count, and
  `validate-docs` passes (covers FR-12).

## Decisions

- **D1** — Grouping model → five learning-domain groups, in the order All,
  Letters, Numbers, Thinking, Play, Stories, with the membership in FR-1 and
  registry order inside each group — because `product.md` §3.1 already sorts the
  games by milestone, and a milestone grouping is the one a parent can name.
- **D2** — Control → six chips only, in the existing top band between the avatar
  chip (ends at x=116) and Settings (starts at x=908): 96×84 each, 10px gap, total
  626 wide, centres at x = 247, 353, 459, 565, 671, 777, centre y = 66, glyph
  centre y = 52, label centre y = 92 — because it is the only band on the canvas
  with room, and it needs no change to either existing grid. Chips stay tappable
  while the daily cap is locked, since a chip launches nothing.
- **D3** — Filtered geometry → 176×196 tiles, 20px spacing, n columns for n ≤ 3
  and 3 columns above that, each row centred, board centred: 6 tiles give
  start (228, 178), 5 and 4 the same box, 2 give start (286 y), and 1 centres
  alone. The All selection keeps today's wide and paged layouts untouched — the
  larger tiles are the point of filtering, and the All grid is already as large as
  four rows allow. Page dots are hidden while a group is selected and restored on
  All.
- **D4** — Selection state → `HubGrid.selection`, reset to `all` in
  `resetForVisit()`; no storage write and no schema change — a fresh Hub is always
  the familiar 22-tile board, which is the state a child already knows.
- **D5** — Data ownership → `group` on each `GAME_REGISTRY` entry, typed
  `HubGroupId` declared in `src/types/index.ts` (no runtime import, so no cycle),
  with labels, spoken names and glyph keys in `src/game/hubGroups.ts`. `GameTile`
  and `GAME_TILES` keep their exact shape, so the pre-registry golden test stays
  byte-identical.
- **D6** — Audio → the grid reports a selection through an optional
  `onSelectGroup` dep; `HubScene` implements it as `speakSentence`, which re-reads
  the SFX toggle on every call. No new audio cue, no new asset.
- **D7** — Art → five flat storybook glyphs, one or two shapes each at a 512
  viewBox with the 4–6px `#2D3748` outline: `group_letters` a letter card,
  `group_numbers` a numeral card, `group_thinking` a star beside a rounded
  square, `group_play` a green music note over a face-down card, `group_stories`
  a smiling round face. They are explicit `SHELL_ASSETS` rows (the shell glob
  keeps only `tile_`/`sticker_` keys) with a `/^group_/ → icon` tier rule. The All
  chip's 2×2 grid is drawn with `Graphics` in outline ink, because six SVGs for
  five groups would break the "five group glyphs" count for one chip.
- **D8** — Lifecycle → chips are built and destroyed with the board, like the page
  dots, and repainting a selection is alpha/stroke only. Under reduced motion
  nothing changes, because there is nothing to reduce.
- **D9** — Bridge shape → `e2eHubGroups()` returns
  `{ selected, chips: [{ id, x, y }] }` from the live objects, and `e2eHubTiles()`
  maps drawn slots back to registry indexes, so a journey can drive a group
  without knowing the layout.

## Edge Cases and Failure Modes

- A resize that flips wide↔paged keeps the current selection and rebuilds that
  group's board in the new layout.
- The daily cap being reached while a group is selected locks the filtered board
  as it is drawn, and every later selection draws already-locked tiles.
- A retry cue anchored to a tile must die when a chip tap rebuilds the board
  (`onBoardChange` already fires on rebuild).
- A just-earned sticker for a game outside the current group draws no highlight
  and raises no error; it highlights when All or its own group is shown.
- A group of one tile (possible after a future registry edit) centres a single
  tile; `ceil(n/3)` needs no special case.
- A 23rd game added later raises its group's count; the geometry derives rows from
  the count, so nothing here needs an edit.
- A chip tap while the profile picker or Settings is open cannot happen: both
  overlays cover the canvas and take the pointer.
- Speech before the first audio unlock is silent by design; a chip tap is itself a
  user gesture, so the unlock in `HubScene.create()` has already run.
- A group whose art is already prewarmed keeps its existing prewarm order; the
  selection never reorders or cancels the idle passes.

## Dependencies

- Tracks: none active. Built on `20261020-game-metadata-source` (the registry),
  `20261021-hub-grid-decomposition` (the `src/game/hub/` modules) and
  `20261017-hub-phone-ux-perf` (the paged layout).
- External: none. No new package, no service, no storage key.

## Open Questions and Assumptions

- Which short label fits the motor/memory group → assumed **Play**, spoken as
  "Play and memory" — because Animal Trace and Pop & Freeze are movement games,
  Musical Memory and Memory Match are recall, and "Play" is the shortest word
  that covers both; review may rename it, which touches one table row.
- Whether the chip row should scroll or wrap on an unexpected viewport → assumed
  no: the canvas is a fixed 1024×768 logical space under FIT scaling, so the row
  is laid out once and scales with everything else.
- Whether a parent needs the group name written on screen → assumed the chip label
  is enough; there is no header line, because a header would take grid space and
  the six chips already name every section.

## References

- `conductor/product.md` §3.1 (the game table this grouping follows) and §6 (the
  Boot → Preload → Hub → Game flow).
- `conductor/product-guidelines.md` (touch targets, textless cues, reduced motion,
  narrow-viewport paging pattern).
- `conductor/workflow.md` (verification commands, evidence format, gates).
- `src/game/gameRegistry.ts`, `src/game/hubTiles.ts`, `src/game/hubPaging.ts`,
  `src/game/hubGrid.ts`, `src/game/hub/gridBuilder.ts`,
  `src/game/hub/pageBoard.ts`, `src/scenes/HubScene.ts`,
  `src/scenes/PreloadScene.ts`, `src/utils/textureTiers.ts`,
  `src/utils/speech.ts`.
- `conductor/archive/20261020-game-metadata-source/`,
  `conductor/archive/20261021-hub-grid-decomposition/`,
  `conductor/archive/20261017-hub-phone-ux-perf/`.
