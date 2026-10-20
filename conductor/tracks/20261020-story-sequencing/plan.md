# Story Order — Game 22 (Story Sequencing) — Implementation Plan

> **Branch:** `feat/20261020-story-sequencing`
> **Base:** `master` @ `95d044e`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, `blocked`.
> Only the primary agent writes this file.

## Phase 1: Story pool logic

- **Goal:** A pure, seedable sequencing module that produces a 6-round easy-first playthrough from an 8-story pool with no repeats.
- **Depends on:** none
- **Covers:** FR-2, AC-2
- **Touches:** `src/game/storyOrderLogic.ts`, `src/__tests__/game/storyOrderLogic.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified
- **Result:** verified
- **Checkpoint:** 6cafe2e
- **Evidence:** conductor/tracks/20261020-story-sequencing/verification/phase-1.md

- [x] **P1.T1: Story pool and round types** — covers: FR-2
  - [x] **P1.T1.1: Define the 8-story pool** with stable ids, three panel texture keys per story, and an `obvious` / `subtle` ladder tag
  - [x] **P1.T1.2: Define `StoryOrderRound`** (story id, shuffled panel order, solution order) with injectable RNG
- [x] **P1.T2: Playthrough generation** — covers: FR-2
  - [x] **P1.T2.1: `buildPlaythrough()`** returns 3 obvious + 3 subtle rounds, drawn without repeats
  - [x] **P1.T2.2: Guard against an already-solved shuffle** (reshuffle once so the round always requires work)
- [x] **P1.T3: Correctness check** — covers: FR-2
  - [x] **P1.T3.1: `isCorrect(placed, solution)`** compares same length, order and values
  - [x] **P1.T3.2: Unit tests** — seeded determinism, ladder split, no-repeat, shuffle guard, short/wrong strips

## Phase 2: Panel art and game art module

- **Goal:** 26 new storybook-flat SVGs plus a game-local art module that keeps panel strings out of the shell chunk.
- **Depends on:** Phase 1
- **Covers:** FR-8, NFR-3, NFR-6, AC-11
- **Touches:** `src/assets/svg/stories/`, `src/game/storyOrderArt.ts`, `scripts/render-svg-contact-sheets.mjs`, `src/__tests__/game/storyOrderArt.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified
- **Result:** verified
- **Checkpoint:** d167eb2
- **Evidence:** conductor/tracks/20261020-story-sequencing/verification/phase-2.md

- [x] **P2.T1: Author the 24 story panels** — covers: FR-8
  - [x] **P2.T1.1: Obvious pool art** — seed/sprout/flower, flat/round/aloft balloon, egg/cracking/duckling, scoop/dripping/puddle
  - [x] **P2.T1.2: Subtle pool art** — whole/peeled/peel banana, full/pouring/empty cup, bare foot/sock/shoe, cloud/raining cloud/puddle
- [x] **P2.T2: Tile and sticker art** — covers: FR-8, FR-9
  - [x] **P2.T2.1: `tile_story_order.svg`** (three stacked panels motif) and `sticker_story_order.svg` (storybook badge)
- [x] **P2.T3: Game-local art module** — covers: FR-8, NFR-1
  - [x] **P2.T3.1: `storyOrderArt.ts`** imports the 24 panels as `?raw` and exports keyed `{ key, svg }` entries plus a load function using the existing `toDataUri` approach
  - [x] **P2.T3.2: Prove the module never reaches the shell** — the module is imported only by the story game chunk; a unit test asserts 24 keys and no duplicate texture keys
- [x] **P2.T4: Visual QA** — covers: NFR-3, AC-11
  - [x] **P2.T4.1: Add a `stories` category** to `render-svg-contact-sheets.mjs` and render the sheet
  - [x] **P2.T4.2: Grayscale check** — record in the phase evidence that every panel stays distinguishable with colour removed

## Phase 3: Story Order scene

- **Goal:** A playable 6-round sequencing game on the shared choice-round shell, with panel art loaded from its own chunk.
- **Depends on:** Phase 2
- **Covers:** FR-1, FR-3, FR-4, FR-5, FR-6, FR-7, FR-8, NFR-1, NFR-4, NFR-5, NFR-7, AC-3, AC-4, AC-5, AC-6, AC-7, AC-9, AC-11
- **Touches:** `src/scenes/StoryOrderScene.ts`, `src/scenes/sceneRegistry.ts`, `src/scenes/PreloadScene.ts`, `src/types/index.ts`, `src/__tests__/scenes/storyOrderScene.test.ts`, `src/__tests__/utils/storage.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified
- **Result:** verified
- **Checkpoint:** d95394d
- **Evidence:** conductor/tracks/20261020-story-sequencing/verification/phase-3.md

- [x] **P3.T1: Scene skeleton and lazy art load** — covers: FR-1, FR-8, NFR-1, NFR-6
  - [x] **P3.T1.1: `StoryOrderScene`** (key `StoryOrder`) extends `ChoiceRoundScene`, runs `preload()` against `storyOrderArt`, and is registered in `sceneRegistry`
  - [x] **P3.T1.2: Boot art only** — tile and sticker added to `PreloadScene` (176 → 178), no panel SVG at boot
- [x] **P3.T2: Board and drag interaction** — covers: FR-3, FR-4, NFR-5
  - [x] **P3.T2.1: Source row + three ordinal-pip slots** at 1024×768 with ≥ 96 px hit areas and grayscale-distinct panels
  - [x] **P3.T2.2: Drag lift/tilt, snap, slot swap, and return-home on a drop outside a slot** (reuse `dragJuice`), without validating
- [x] **P3.T3: Round resolution** — covers: FR-5, FR-6, FR-7, NFR-4
  - [x] **P3.T3.1: Validate on the third fill** through `resolveWholeRound`; wrong order wiggles and keeps panels in place
  - [x] **P3.T3.2: Rule line, narrator glyph, progress dots, and `completeGame("story-order")`** with celebration, sticker and 3 s return
- [x] **P3.T4: Types and storage compatibility** — covers: NFR-7
  - [x] **P3.T4.1: `GameId` + `GAME_IDS`** gain `story-order`, so old saves backfill the key
  - [x] **P3.T4.2: Storage test** proves a pre-existing v2 save without the key loads, gains it, and keeps stickers and progress
- [x] **P3.T5: Scene tests** — covers: AC-3, AC-4, AC-5, AC-6, AC-7
  - [x] **P3.T5.1: Drag/swap/drop-outside/validation tests** through the Phaser mock, including the no-double-advance guard
  - [x] **P3.T5.2: Art isolation test** — after `pnpm build`, assert no panel texture key appears in the shell chunk

## Phase 4: Hub, progress and paging integration

- **Goal:** Story Order is a first-class 22nd game: on the hub, in Learning Progress, and inside the paging maths.
- **Depends on:** Phase 3
- **Covers:** FR-1, FR-9, AC-1, AC-8
- **Touches:** `src/game/hubTiles.ts`, `src/game/hubPaging.ts`, `src/components/settings/ProgressOverlay.ts`, `src/__tests__/game/hubPaging.test.ts`, `src/__tests__/scenes/hubScene.test.ts`, `src/__tests__/components/SettingsPanel.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified
- **Result:** verified
- **Checkpoint:** bf42d87
- **Evidence:** conductor/tracks/20261020-story-sequencing/verification/phase-4.md

- [x] **P4.T1: Hub tile and grid** — covers: FR-1, AC-1, AC-8
  - [x] **P4.T1.1: 22nd `GAME_TILES` entry** with its icon, label and sticker key
  - [x] **P4.T1.2: Wide grid renders 22 tiles as rows 6/6/6/4** with the layout comments and constants corrected
- [x] **P4.T2: Paged hub** — covers: FR-9, AC-8
  - [x] **P4.T2.1: `HUB_TILE_COUNT` 21 → 22** and page maths to 10 + 10 + 2, partial page centred
  - [x] **P4.T2.2: Paging tests** — three pages, 22 indexes, tile count agreement with `GAME_TILES.length`
- [x] **P4.T3: Learning Progress** — covers: FR-9, AC-8
  - [x] **P4.T3.1: 22nd progress row** (Story Order, last), pages 6 + 6 + 6 + 4
  - [x] **P4.T3.2: Settings test** asserts 22 rows and that the new row reads its own progress record

## Phase 5: Documentation sync

- **Goal:** Product, README and tech-stack describe a 22-game suite and the new art-loading pattern, with no stale counts.
- **Depends on:** Phase 4
- **Covers:** FR-10, NFR-8, AC-10
- **Touches:** `conductor/product.md`, `README.md`, `conductor/tech-stack.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified

- [x] **P5.T1: Product definition** — covers: FR-10
  - [x] **P5.T1.1: Game table row 22**, game count, hub grid/paging figures, progress rows and preload count
  - [x] **P5.T1.2: Game 22 changelog section** recording the mechanic, ladder, 8-story pool and the lazy panel-art decision
- [x] **P5.T2: README and tech stack** — covers: FR-10
  - [x] **P5.T2.1: README** game table row, replay variety, spoken-rule narrator count, project structure, test count
  - [x] **P5.T2.2: Tech stack** scene count 24 → 25, tree entries for scene/art module/story SVGs, tile count 22, dated note on lazy game art
- **Result:** verified
- **Checkpoint:** 2782229
- **Evidence:** conductor/tracks/20261020-story-sequencing/verification/phase-5.md

## Phase R1: Review Fixes

- **Goal:** Close the round-1 review findings - make the tap-to-return path real, reconcile FR-3/AC-3 with the built board, and repair the four record and art nits.
- **Depends on:** Phase 5
- **Covers:** review findings M1, M2, M3, L1, L2, L3, L4
- **Touches:** `src/scenes/StoryOrderScene.ts`, `src/__tests__/scenes/storyOrderScene.test.ts`, `conductor/tracks/20261020-story-sequencing/spec.md`, `conductor/product.md`, `README.md`, `src/assets/svg/stories/story_foot_sock.svg`, `docs/svg-contact-sheets/stories.png`, `conductor/tracks/20261020-story-sequencing/verification/phase-2.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified

- [x] **R1.T1: Resolve M1** - covers: M1
  - [x] **R1.T1.1: Set `justDropped` in `handleDrop` and clear it in `dragstart`** so a real tap returns a placed panel and a real drop does not
  - [x] **R1.T1.2: Drive the real handlers in tests** - a drag/drop sequence that ends in `pointerup`, and a plain tap sequence
- [x] **R1.T2: Resolve M2** - covers: M2
  - [x] **R1.T2.1: Amend FR-3** with a dated note recording slots-above-tray and why
- [x] **R1.T3: Resolve M3** - covers: M3
  - [x] **R1.T3.1: Amend AC-3** to separate tray panels (home) from placed panels (back to slot)
  - [x] **R1.T3.2: Correct the product changelog** wording to match
- [x] **R1.T4: Resolve L1** - covers: L1
  - [x] **R1.T4.1: README shell figure** to 195.4 kB
- [x] **R1.T5: Resolve L2** - covers: L2
  - [x] **R1.T5.1: product.md rule-narrator count** to twelve and a Game 22 changelog heading
- [x] **R1.T6: Resolve L3** - covers: L3
  - [x] **R1.T6.1: Give the sock a silhouette cue** and re-render the story contact sheet
- [x] **R1.T7: Resolve L4** - covers: L4
  - [x] **R1.T7.1: Re-point the phase-2 art rework rows** at the squashed commit
- **Result:** verified
- **Checkpoint:** e83f692
- **Evidence:** conductor/tracks/20261020-story-sequencing/verification/phase-R1.md

<!--
After acceptance, the primary appends to each phase:

**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261020-story-sequencing/verification/phase-<n>.md

Review fixes are appended by conductor-review as:

## Phase R1: Review Fixes
- **Goal:** ...
- **Depends on:** Phase <n>
- **Covers:** review findings <ids>
- **Touches:** ...
- **Verification:** <exact command>
- **Status:** pending

- [ ] **R1.T1: Resolve <finding ID>** — covers: <finding ID>
-->
