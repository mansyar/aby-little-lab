# Phase 4 Evidence — Close the invariants

- **Track:** 20261020-game-metadata-source — Game Metadata Single Source of Truth
- **Phase:** 4 — Close the invariants
- **Date:** 2026-10-21
- **Branch:** refactor/20261020-game-metadata-source
- **Base:** 7f65d6a (companion commit `conductor(plan): Mark phase 'Close the invariants' as in progress`)
- **Head:** working tree at time of verification (committed as the phase checkpoint)
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | 232 files; the one pre-existing `noNonNullAssertion` warning and the biome.json schema info, unchanged |
| static | `pnpm typecheck` | 0 | silent |
| unit | `pnpm test -- --run` | 0 | 111 files / **2327 tests** (Phase 3 closed at 2321; this phase adds six) |
| unit (scoped) | `pnpm exec vitest --run src/__tests__/gameRegistry.test.ts` | 0 | 14 tests in the extended suite |

## Requirements met

| ID | Requirement | Evidence | Status |
| --- | --- | --- | --- |
| FR-7 | One suite proves registry, lazy scene loaders, storage ids, shell assets and paging agree | `src/__tests__/gameRegistry.test.ts` → `describe("the 22 game invariants")`: `GAME_IDS` equals registry order; `Object.keys(sceneLoaders)` equals registry `sceneKey` set in both directions with every value a function; every `tileKey`/`stickerKey` resolves to exactly one `SHELL_ASSETS` entry with no duplicate shell key; `pageCount()` equals `ceil(length / PAGE_SIZE)`, the union of pages reproduces `0..length-1`, and `pageOf` is in range for every tile. | met |
| AC-2 | Adding a 23rd game changes no paging constant and its suite stays green | Test "stays coherent when a 23rd game is added" drives `pageCount(23)`, `pageTileIndexes(page, 23)` and `pageOf(22)` purely from the count: three pages, union `0..22`, no `RangeError`. Nothing in the assertion names 22, and the loader/`GAME_IDS`/shell checks are set comparisons rather than counts, so they extend to a 23rd entry without edits. | met |
| AC-4 | Removing one registry `tileKey` (or a stray loader) fails a test naming the key | Both proven by temporary mutation, both reverted: (a) `tile_shape_sorter` → `tile_shape_sorter_v2` in the registry failed with `Error: no shell SVG for registry asset key: tile_shape_sorter_v2`; (b) a `Ghost` loader added to `sceneRegistry.ts` failed the bijection with `AssertionError … + "Ghost"` against the registry's 22 scene keys. | met |

## Evidence paths

- `conductor/tracks/20261020-game-metadata-source/verification/phase-4.md` (this file)
- Guard proofs were run in the working tree and reverted; `git status --porcelain` after each
  restore showed only `src/__tests__/gameRegistry.test.ts` modified.

## Deviations

None. The only file touched is `src/__tests__/gameRegistry.test.ts`, exactly as the phase
contract states. The suite imports `SHELL_ASSETS`, so it carries the same minimal
`vi.mock("phaser")` the other two shell suites use — no new dependency, no production code.

## Notes

- The suite deliberately asserts relationships, not the number 22. `PRD_ORDER` and the frozen
  pre-track tile array stay the golden record for order and values; the invariant block is
  written so a 23rd game needs a registry entry, a scene loader and its art, and nothing else.
- `sceneLoaders` values are checked for being callable, not invoked: importing all 22 game
  scenes inside this suite would duplicate the lazy-loading work other suites already cover
  and slow the unit layer for no extra guarantee.
