# Phase 1 — Registry foundation

- **Track:** 20261020-game-metadata-source (Game Metadata Single Source of Truth)
- **Phase:** 1 — Registry foundation
- **Date:** 2026-10-20
- **Branch:** `refactor/20261020-game-metadata-source`
- **Base commit:** `890a0f7` (`conductor(plan): Mark phase 'Registry foundation' as in progress`)
- **Head commit:** `5b19b9b` (`test(game): guard registry order, uniqueness, purity and derived tiles`)
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Static (Biome) | `pnpm check` | 0 | 232 files checked, no errors. 1 pre-existing warning (`noNonNullAssertion`, `src/__tests__/scenes/musicalMemoryScene.test.ts:294` — outside this phase's files, present before the change) and 1 info (biome.json schema 2.5.5 vs CLI 2.5.10 — pre-existing). |
| Static (TypeScript) | `pnpm typecheck` | 0 | No diagnostics. |
| Unit (Vitest) | `pnpm test -- --run` | 0 | 111 files / 2310 tests passed. Pre-track baseline measured on this branch before any edit: 110 files / 2305 tests. Net +1 file, +5 tests. |
| Phase verification | `pnpm check && pnpm typecheck && pnpm test -- --run` | 0 | The exact command from the phase brief, run after the last edit. Output: `Checked 232 files`, `tsc --noEmit` silent, `Test Files 111 passed (111)`, `Tests 2310 passed (2310)`. |

## Acceptance criteria and requirements

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| FR-1 | `gameRegistry.ts` exports 22 ordered entries with `gameId`, `sceneKey`, `label`, `tileKey`, `stickerKey` and optional `iconDisplay`/`iconOffsetY`; imports no Phaser, DOM, storage or scene module. | `src/game/gameRegistry.ts` (`GAME_REGISTRY`, `GameRegistryEntry`). Its only import is `import type { GameId } from "../types"`, asserted by `src/__tests__/gameRegistry.test.ts` → "stays pure data: the only import is the GameId type" (scans the raw module source for every `from "…"` specifier — exactly `["../types"]` — and rejects any value import). | met |
| FR-2 | `GAME_TILES` is derived from the registry; `hubGrid`/`HubScene` compile against it unchanged. | `src/game/hubTiles.ts` maps `GAME_REGISTRY` into the unchanged `GameTile` shape; the export name and module path are untouched, and `pnpm typecheck` covers every existing consumer (`hubGrid.ts`, `HubScene.ts`, `hubEngagement`, `navigation` tests). Golden test: "derives the pre-registry tiles unchanged, icon overrides included" (`toStrictEqual` against the frozen 22-entry pre-track array, property presence included). | met |
| FR-8 | `GameId` stays declared in `src/types/index.ts`; the registry is typed against it and a type-level check proves coverage. | `GameRegistryEntry.gameId: GameId` + `GAME_REGISTRY` as `as const satisfies readonly GameRegistryEntry[]` + `export const GAME_ID_COVERAGE: Record<MissingGameIds, true> = {}`, where `MissingGameIds = Exclude<GameId, registry gameIds>`. Proof it bites: deleting the `story-order` entry made `pnpm typecheck` exit 1 with `src/game/gameRegistry.ts(226,14): error TS2741: Property '"story-order"' is missing in type '{}' but required in type 'Record<"story-order", true>.'`; the entry was restored immediately and typecheck re-run green. | met (compile time, not runtime) |
| NFR-1 | No new dependency; no texture key or SVG byte change. | `git show --stat b7bd706 de4412f 5b19b9b` — three source/test files, no `package.json`/lockfile/asset change. All 22 `tileKey`/`stickerKey` values are the pre-track strings. | met |
| NFR-3 | `gameRegistry.ts` is pure data so `src/game/` keeps its no-Phaser/no-DOM rule. | Same purity test as FR-1: the module has one type-only import and no value import, so it cannot reach Phaser, the DOM, storage or a scene module. | met |
| AC-1 | Exactly one module declares the 22 games; the other four lists are derived (grep-level check in the evidence). | Grep `sceneKey: "` over `src/**/*.ts`: matches only in `src/game/gameRegistry.ts` (22 entries) and in the new suite's frozen golden copy (`src/__tests__/gameRegistry.test.ts`). `src/game/hubTiles.ts` no longer contains any game row (`git show de4412f`: 155 deletions, 20 insertions). Remaining copies — `ProgressOverlay.ts:56-78` (`PROGRESS_GAME_ROWS`), `hubPaging.ts` (`HUB_TILE_COUNT`/`PAGE_COUNT`), `PreloadScene.ts` (44 raw imports), `hubGrid.ts:617` and `GameSceneBase.stickerKeyFor` (inline sticker convention) — are Phase 2 and Phase 3 scope by the plan. | partial (this phase's share met) |
| AC-5 | `pnpm check && pnpm typecheck && pnpm test -- --run` passes with the pre-track test count or higher. | Commands table above: exit 0, 2310 tests vs the 2305 pre-track baseline measured on this branch. | met |

## Guard proofs (deliberately broken fixtures, reverted before commit)

| Guard | Fixture | Observed failure | Reverted |
| --- | --- | --- | --- |
| Type-level `GameId` coverage (FR-8) | `story-order` entry deleted | `error TS2741: Property '"story-order"' is missing in type '{}' but required in type 'Record<"story-order", true>.'` (`pnpm typecheck` exit 1) | yes — registry restored, typecheck exit 0 |
| Duplicate-key guard (P1.T3.1) | `feelings-faces.tileKey` set to `tile_number_order` | `AssertionError: duplicate tileKey: tile_number_order` (plus the golden-copy diff naming `tile_feelings_faces`) | yes — value restored, suite green |

## Evidence paths

- `src/game/gameRegistry.ts` — new: `GameRegistryEntry`, 22-entry `GAME_REGISTRY` in Hub order, `GAME_ID_COVERAGE` type-level sentinel.
- `src/game/hubTiles.ts` — `GAME_TILES` now derived; `GameTile` and the export name unchanged; icon overrides carried only when present.
- `src/__tests__/gameRegistry.test.ts` — new suite (5 tests): PRD §2.2 order, uniqueness of `gameId`/`sceneKey`/`tileKey`/`stickerKey` naming the offending value, module purity, pre-track golden equality, one tile per entry.
- Commits: `b7bd706` (registry module), `de4412f` (derived tiles), `5b19b9b` (guards).

## Deviations

None. No file outside the phase `Touches` was modified.

## Notes

- `iconDisplay: 52` / `iconOffsetY: -44` are carried on the same 13 tiles as before; `feelings-faces` and `story-order` keep their no-override shape. The derivation spreads the icon fields conditionally rather than assigning `undefined`, so `toStrictEqual` proves a tile that had no override gains no property.
- `alphabet-match` keeps `tileKey: "tile_alphabet"` and `stickerKey: "sticker_alphabet_match"`; the divergence is now documented on the entry instead of only in a test comment.
- The registry test deliberately asserts order against the PRD list rather than `length === 22`, so a 23rd game (with its PRD entry) does not need this suite edited; the existing `hubTiles.test.ts` still pins 22 and is untouched.
- The pre-existing Biome warning and the biome.json schema info are unrelated to this phase and were left alone (no scope expansion).
- `GAME_ID_COVERAGE` exists only to make the coverage proof a compile-time error rather than a comment; it is not consumed at runtime.

## Primary verification

Independent re-run by the primary agent after the subagent reported, from a clean working tree at `6a3d96b`.

| Layer | Command | Exit | Observed |
| --- | --- | --- | --- |
| Static (Biome) | `pnpm check` | 0 | `Checked 232 files in 385ms`; 1 warning, 1 info (both pre-existing) |
| Static (TypeScript) | `pnpm typecheck` | 0 | silent |
| Unit (Vitest) | `pnpm test -- --run` | 0 | `Test Files 111 passed (111)`, `Tests 2310 passed (2310)` |

- **Working tree:** clean (`git status --porcelain` empty).
- **Files changed vs `Touches`:** `git diff --name-only 890a0f7d..HEAD` returned exactly `src/game/gameRegistry.ts`, `src/game/hubTiles.ts`, `src/__tests__/gameRegistry.test.ts`, `conductor/tracks/.../verification/phase-1.md`. No file outside `Touches`, no unreported deviation.
- **AC check:** FR-1, FR-2, FR-8, NFR-1, NFR-3, AC-5 are met with tests or a compile-time proof. AC-1 is partial by design: `GAME_TILES` is derived here, the remaining three copies belong to Phase 2 (`PROGRESS_GAME_ROWS`, paging counts, sticker convention) and Phase 3 (preload table).
- **Result:** accepted.
