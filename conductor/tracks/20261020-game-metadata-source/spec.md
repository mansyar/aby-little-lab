# Game Metadata Single Source of Truth — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Introduce one registry that owns each game's identity and presentation —
`gameId`, `sceneKey`, `label`, `tileKey`, `stickerKey`, and the two optional
icon-placement fields — and make every current consumer derive from it: the Hub
grid, the Learning Progress rows, the paging maths, the shell preload table, and
the sticker-key convention. Behavior, art bytes, texture keys and bundle output
stay identical; what changes is that a 22-item list exists once instead of five
times.

## Problem / Motivation

Adding or renaming a game today means editing hand-written copies of the same
list in five places, three of which fail silently:

| Consumer | Copy | Failure if missed |
| --- | --- | --- |
| `ProgressOverlay.ts PROGRESS_GAME_ROWS` | 22 × `{gameId, label, tileKey}` | new game shows no progress row; no error |
| `PreloadScene.ts SHELL_ASSETS` | 44 entries over 44 hand `?raw` imports | `texture not found` at Hub render |
| `hubPaging.ts HUB_TILE_COUNT` / `PAGE_COUNT` | `22` / `3` | `pageOf()` throws `RangeError` past page 2 |
| `hubGrid.ts:617` | re-derives `sticker_${gameId.replace(/-/g,"_")}` | shelf shows the earned sticker as unearned |
| `GameSceneBase.stickerKeyFor()` | the same convention again | sticker awarded under a key nothing reads |

The last two documentation tracks spent effort chasing exactly this class of
drift. The cost is not today's bug — it is that the 23rd game is currently a
ten-file change with three silent failure modes.

## Goals & Success Metrics

- **Goal:** one ordered registry is the only place a game is declared.
- **Metric:** the tile count `22` and the 22-row lists appear in exactly one
  source module; `pnpm test` fails if any consumer disagrees.
- **Goal:** the drift class is caught at test time.
- **Metric:** a deliberately inconsistent registry entry (missing loader,
  missing SVG, duplicate key) makes `pnpm test` fail with a message naming the
  offending game.
- **Goal:** no behavior change.
- **Metric:** all gates green — check, typecheck, 2,305+ tests, coverage, bundle
  ≤200 kB, PWA validation, boot median <3 s.

## Scope

### In Scope

- New `src/game/gameRegistry.ts`: 22 readonly entries in Hub order, pure data.
- `hubTiles.ts` re-exports `GAME_TILES` derived from the registry (Hub imports
  unchanged).
- `ProgressOverlay` rows derived from the registry.
- `hubPaging` tile/page counts derived from registry length; remainder page
  stays correct.
- `SHELL_ASSETS` derived with `import.meta.glob` (eager, `?raw`), keyed by file
  stem.
- One definition of the sticker-key convention, consumed by `GameSceneBase` and
  `hubGrid`.
- Invariant test suite + type-level coverage check.
- Docs: TDD §7.1, README structure line, PRD §4.1.

### Out of Scope

- Any visual, layout, timing, audio or difficulty change.
- Renaming existing `tileKey`/`stickerKey` values (including the intentional
  `alphabet-match → tile_alphabet` divergence).
- `curriculumDomain`, adaptive-capability flags, or any field for a future
  hub-grouping track.
- Moving art-group declarations out of scenes.
- Game #23, hub regrouping, save-path work.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | `gameRegistry.ts` exports 22 ordered entries with `gameId`, `sceneKey`, `label`, `tileKey`, `stickerKey`, optional `iconDisplay`/`iconOffsetY`; it imports no Phaser, DOM, storage or scene module. | must |
| FR-2 | `GAME_TILES` is derived from the registry; `hubGrid`/`HubScene` compile against it unchanged. | must |
| FR-3 | `PROGRESS_GAME_ROWS` is derived from the registry, preserving today's order, labels and icons. | must |
| FR-4 | `HUB_TILE_COUNT`, `PAGE_COUNT` and `pageTileIndexes` derive from registry length; a 23rd entry needs no paging edit. | must |
| FR-5 | `SHELL_ASSETS` is built from eager raw globs over `assets/svg/ui/**/*.svg` and `assets/svg/stickers/*.svg`, filtered to `tile_`/`sticker_` stems, and **ordered by the registry**, not by glob order. | must |
| FR-6 | The sticker-key convention is defined once in the registry and used by both `GameSceneBase.stickerKeyFor` and the Hub shelf lookup. | must |
| FR-7 | A unit suite asserts: registry length; `GAME_IDS` order equals registry order; `sceneLoaders` keys equal registry `sceneKey` set both ways; every `tileKey`/`stickerKey` resolves to exactly one shell asset; no duplicate `gameId`/`tileKey`/`stickerKey`; every registry key resolves to a file stem. | must |
| FR-8 | `GameId` stays declared in `src/types/index.ts`; the registry is typed against it and a type-level check proves the registry covers every `GameId`. | must |
| FR-9 | A missing or duplicate asset key throws at module evaluation with a message naming the key, never at Hub render. | must |
| FR-10 | TDD §7.1, README structure and PRD §4.1 describe the registry and drop the now-false duplication notes. | should |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No new runtime or dev dependency; no change to texture keys or SVG bytes. |
| NFR-2 | `validate-bundle` (≤200 kB entry) and `validate-boot` (<3 s median) pass with no threshold edits. |
| NFR-3 | `gameRegistry.ts` is pure data so `src/game/` keeps its no-Phaser/no-DOM rule. |
| NFR-4 | Coverage gate unchanged: lines 95 / functions 88 / branches 85 / statements 90. |
| NFR-5 | Eager glob must not pull game art into the entry chunk; the entry set stays the same 44 shell SVGs. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | Exactly one module declares the 22 games; the other four lists are derived (grep-level check recorded in the phase evidence). | FR-1, FR-2, FR-3, FR-4 |
| AC-2 | Adding a 23rd registry entry (fixture, not committed) changes no paging constant and its test suite stays green. | FR-4, FR-7 |
| AC-3 | `SHELL_ASSETS` has exactly 44 game entries in registry order, with keys identical to today's. | FR-5 |
| AC-4 | Removing one registry `tileKey` makes `pnpm test` fail naming that key. | FR-7, FR-9 |
| AC-5 | `pnpm check && pnpm typecheck && pnpm test -- --run` passes with the pre-track test count or higher. | FR-8, FR-9 |
| AC-6 | Full `verify_phase` passes; bundle and boot numbers are within the existing thresholds. | NFR-2, NFR-4, NFR-5 |
| AC-7 | A Hub walkthrough (all 3 pages + wide layout) shows 22 tiles, all icons rendering, an earned sticker shown as earned. | FR-2, FR-3, FR-5, FR-6 |
| AC-8 | TDD §7.1, README and PRD §4.1 mention the registry and no longer claim the lists are hand-maintained. | FR-10 |

## Edge Cases

- **Glob ordering is filesystem-dependent** — `SHELL_ASSETS` order must come from
  the registry array, never from glob iteration.
- **`assets/svg/ui/` holds non-tile art** (`tile_feelings_faces.svg` sits outside
  `tiles/`, while `icon_speaker.svg` and mascot art live alongside) — the prefix
  filter must include both directories and exclude everything else.
- **A 23rd game** makes the paged layout `10 + 10 + 3`; `pageTileIndexes` must
  return a short final page rather than assume `PAGE_SIZE`.
- **Wide grid capacity** is 24 slots (6×4); 23 fits, 25 does not — out of scope,
  but the test should not assert `length === 22` in a way that blocks the next
  game.
- **Duplicate keys across games** must fail loudly, not last-write-wins.
- **Vitest/happy-dom and `import.meta.glob`** — the derived map must be
  exercised in at least one test, not only in the browser build.
- **`iconDisplay`/`iconOffsetY`** are presentation overrides for
  typography-heavy tiles; derivation must carry them, not drop to defaults.

## Dependencies

- **Tracks:** none.
- **External:** none. No new packages; no credentials.

## Open Questions & Assumptions

- **Assumption:** `GameId` stays hand-declared in `src/types/index.ts` because
  `types/` must not import runtime game modules; agreement is enforced by test
  (FR-7) rather than derivation.
- **Assumption:** `sticker_alphabet_match` and `tile_alphabet` remain the
  canonical keys for `alphabet-match`; this track records the divergence in the
  registry instead of renaming it.
- **Assumption:** art-group declarations stay per scene; the registry does not
  own them.
- **Assumption:** `import.meta.glob` raw/eager is supported by the pinned Vite 8
  + Vitest 4 setup; if it proves not to be, FR-5 falls back to a test-guarded
  explicit list without changing FR-1..FR-4.

## References

- `docs/PRD.md` §2.1 (domains), §2.2 (22 games in Hub order), §4.1 (shared scene
  bases)
- `docs/TDD.md` §7.1 (module list)
- `src/game/hubTiles.ts`, `src/game/hubPaging.ts`, `src/scenes/PreloadScene.ts`,
  `src/scenes/sceneRegistry.ts`, `src/components/settings/ProgressOverlay.ts`,
  `src/scenes/GameSceneBase.ts`, `src/game/hubGrid.ts:617`
