# Game Metadata Single Source of Truth — Implementation Plan

> **Branch:** `refactor/20261020-game-metadata-source`
> **Base:** `master` @ `3201c9c`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Registry foundation

- **Goal:** `gameRegistry.ts` is the only declaration of the 22 games, and `GAME_TILES` derives from it with byte-identical values.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-8, NFR-1, NFR-3, AC-1, AC-5
- **Touches:** `src/game/gameRegistry.ts`, `src/game/hubTiles.ts`, `src/__tests__/gameRegistry.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run`
- **Status:** verified

- [x] **P1.T1: Create the registry module** — covers: FR-1, FR-8
  - [x] **P1.T1.1:** Export `GameRegistryEntry` with required `gameId`, `sceneKey`, `label`, `tileKey`, `stickerKey` and optional `iconDisplay`, `iconOffsetY`.
  - [x] **P1.T1.2:** Transcribe the 22 entries in Hub order from `hubTiles.ts`; change no value, including `tile_alphabet` and `sticker_alphabet_match`.
  - [x] **P1.T1.3:** Prove purity: the module imports nothing from Phaser, DOM, storage or `src/scenes/`.
  - [x] **P1.T1.4:** Add the type-level coverage check so a `GameId` with no entry fails `pnpm typecheck` (not at runtime).
- [x] **P1.T2: Derive `GAME_TILES`** — covers: FR-2
  - [x] **P1.T2.1:** Map registry entries to the existing `GameTile` shape; keep the exported name and type so `HubScene`/`hubGrid` compile untouched.
  - [x] **P1.T2.2:** Test that the derived array deep-equals the pre-track 22 tuples, optional icon fields included.
- [x] **P1.T3: Registry-internal tests** — covers: FR-7
  - [x] **P1.T3.1:** Fail on duplicate `gameId`, `tileKey`, `stickerKey` or `sceneKey`, naming the offending value.
  - [x] **P1.T3.2:** Assert registry order equals PRD §2.2 order.

**Result:** verified
**Checkpoint:** a7bc1a2
**Evidence:** conductor/tracks/20261020-game-metadata-source/verification/phase-1.md

## Phase 2: Consumers derive

- **Goal:** progress rows, paging maths and sticker lookups read the registry; no 22-item copy or `replace(/-/g,"_")` literal survives outside it.
- **Depends on:** Phase 1
- **Covers:** FR-3, FR-4, FR-6, AC-1, AC-2, AC-4
- **Touches:** `src/components/settings/ProgressOverlay.ts`, `src/game/hubPaging.ts`, `src/scenes/GameSceneBase.ts`, `src/game/hubGrid.ts`, `src/__tests__/**`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run`
- **Status:** pending

- [ ] **P2.T1: Progress rows derive from the registry** — covers: FR-3
  - [ ] **P2.T1.1:** Delete `PROGRESS_GAME_ROWS`; derive `{gameId, label, tileKey}` from the registry.
  - [ ] **P2.T1.2:** Test that the overlay has one row per registry entry, in order, with unchanged labels and icons.
- [ ] **P2.T2: Paging maths derives from length** — covers: FR-4
  - [ ] **P2.T2.1:** Replace `HUB_TILE_COUNT` with a `tileCount` parameter defaulting to `GAME_REGISTRY.length`; derive `PAGE_COUNT` from it.
  - [ ] **P2.T2.2:** Make `pageTileIndexes` return a short final page instead of assuming `PAGE_SIZE`.
  - [ ] **P2.T2.3:** Test with a synthetic 23-tile count: three pages, last page of 3, no `RangeError` from `pageOf`.
- [ ] **P2.T3: One sticker-key definition** — covers: FR-6
  - [ ] **P2.T3.1:** Export the convention once; `GameSceneBase.stickerKeyFor` delegates to it.
  - [ ] **P2.T3.2:** Replace `hubGrid.ts:617`'s inline `replace` with the shared lookup; grep-confirm no other site builds the string.
  - [ ] **P2.T3.3:** Test all 22 keys against the registry-provided `stickerKey`.
- [ ] **P2.T4: Regression sweep** — covers: AC-5
  - [ ] **P2.T4.1:** Run the full unit suite; record the count in the phase evidence (must be ≥ the pre-track 2,305).

## Phase 3: Shell preload derives

- **Goal:** `SHELL_ASSETS` is built from files at build time in registry order; a missing or duplicated asset fails at module evaluation with the key in the message.
- **Depends on:** Phase 1
- **Covers:** FR-5, FR-9, NFR-1, NFR-2, NFR-5, AC-3, AC-6
- **Touches:** `src/scenes/PreloadScene.ts`, `src/__tests__/**`
- **Verification:** `pnpm test -- --run && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** pending

- [ ] **P3.T1: Glob-derive the game assets** — covers: FR-5, NFR-5
  - [ ] **P3.T1.1:** Replace the 44 game `?raw` imports with two eager raw globs over `assets/svg/ui/**/*.svg` and `assets/svg/stickers/*.svg`, filtered to `tile_`/`sticker_` stems (this must pick up `ui/tile_feelings_faces.svg` as well as `ui/tiles/*`).
  - [ ] **P3.T1.2:** Build the game entries by iterating the registry, not the glob, so order is deterministic.
  - [ ] **P3.T1.3:** Keep the 9 non-game entries (mascot ×2, `icon_speaker`, 6 avatars) exactly as they are.
- [ ] **P3.T2: Fail loudly on mismatch** — covers: FR-9
  - [ ] **P3.T2.1:** Throw at module evaluation naming the key when a registry `tileKey`/`stickerKey` has no file or resolves twice.
- [ ] **P3.T3: Prove the derivation** — covers: AC-3
  - [ ] **P3.T3.1:** Test 53 entries total (44 game + 9 non-game), game block in registry order, keys and SVG sources identical to the pre-track list.
  - [ ] **P3.T3.2:** Confirm the glob resolves inside Vitest, not only in the browser build.
  - [ ] **P3.T3.3:** Record entry-chunk size and chunk count against the 200 kB gate in the evidence file.

## Phase 4: Close the invariants

- **Goal:** one suite proves registry ↔ lazy scene loaders ↔ storage ids ↔ shell assets ↔ paging agree, and stays honest for a 23rd game.
- **Depends on:** Phase 2, Phase 3
- **Covers:** FR-7, AC-2, AC-4
- **Touches:** `src/__tests__/gameRegistry.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run`
- **Status:** pending

- [ ] **P4.T1: Scene-loader bijection** — covers: FR-7
  - [ ] **P4.T1.1:** Assert `sceneLoaders` keys and registry `sceneKey` values are the same set, in both directions, so neither a stray loader nor an unregistered game ships.
- [ ] **P4.T2: Storage id agreement** — covers: FR-7
  - [ ] **P4.T2.1:** Assert `GAME_IDS` order equals registry `gameId` order.
- [ ] **P4.T3: Asset resolution** — covers: AC-4
  - [ ] **P4.T3.1:** Assert every registry `tileKey`/`stickerKey` resolves to exactly one shell asset.
  - [ ] **P4.T3.2:** Demonstrate the guard bites: a temporarily broken fixture entry fails the suite with the key in the message; reverted before commit.

## Phase 5: Docs and the full gate

- **Goal:** docs describe the registry truthfully and the complete verification ladder passes.
- **Depends on:** Phase 4
- **Covers:** FR-10, NFR-2, NFR-4, AC-5, AC-6, AC-7, AC-8
- **Touches:** `docs/TDD.md`, `docs/PRD.md`, `README.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** pending

- [ ] **P5.T1: TDD §7.1** — covers: FR-10
  - [ ] **P5.T1.1:** Add the registry row; correct the `hubTiles`/`hubPaging`/`PreloadScene` descriptions that still claim hand-maintained lists.
- [ ] **P5.T2: README and PRD** — covers: FR-10
  - [ ] **P5.T2.1:** Update the README structure line to name the registry.
  - [ ] **P5.T2.2:** PRD §4.1 gains one sentence that game identity is declared once; no product-behavior prose changes.
- [ ] **P5.T3: Full ladder + hub evidence** — covers: AC-6, AC-7
  - [ ] **P5.T3.1:** Run the full `verify_phase` command and record output in `verification/phase-5.md`.
  - [ ] **P5.T3.2:** Capture all three paged Hub views plus the wide layout from a local preview as evidence under `.conductor/evidence/` (screenshot only — no new CI layer), confirming 22 tiles, icons rendering, and an earned sticker shown as earned.
