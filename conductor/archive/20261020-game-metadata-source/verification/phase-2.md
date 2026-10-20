# Phase 2 — Consumers derive

- **Track:** 20261020-game-metadata-source — Game Metadata Single Source of Truth
- **Phase:** 2
- **Date:** 2026-10-20
- **Branch:** refactor/20261020-game-metadata-source
- **Base:** 41489a0d (phase start)
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | 232 files checked; 1 pre-existing `noNonNullAssertion` warning (`musicalMemoryScene.test.ts:294`) and 1 biome.json schema info, both untouched |
| static | `pnpm typecheck` | 0 | silent |
| unit | `pnpm test -- --run` | 0 | 111 files / 2317 tests passed (pre-track 110 / 2305, phase-1 111 / 2310) |

## Requirements

| ID | Requirement | Evidence | Status |
| --- | --- | --- | --- |
| FR-3 | Progress rows derive from the registry | `PROGRESS_GAME_ROWS` deleted; `PROGRESS_ROWS` maps `GAME_REGISTRY`; test "derives its rows from the registry, in hub order" asserts page-0 icon keys and labels against `GAME_REGISTRY.slice(0, 6)` | met |
| FR-4 | Paging derives from registry length | `HUB_TILE_COUNT` and `PAGE_COUNT` removed; `pageCount(tileCount = GAME_REGISTRY.length)`; `pageTileIndexes(page, tileCount)` returns a short final page; `hubGrid` calls `pageCount()` for the flip guard and the page dots | met |
| FR-6 | One sticker-key definition | `stickerKeyForGame(gameId)` in `gameRegistry.ts` resolves the entry's `stickerKey`; `GameSceneBase.stickerKeyFor` delegates; `hubGrid` shelf uses it. Grep for `replace(/-/g` and `replaceAll("-", "_")` across `src/**/*.ts` returns only prose matches ("replaces") | met |
| NFR-1 | No new dependency | `package.json` / `pnpm-lock.yaml` untouched | met |
| NFR-3 | Registry stays pure data | `gameRegistry.ts` still imports only `import type { GameId } from "../types"`; the purity test still passes | met |
| AC-1 | One declaration, other lists derived | This phase's share: `PROGRESS_GAME_ROWS`, `PAGE_COUNT` and `HUB_TILE_COUNT` are gone. Remaining copy is the 44-entry preload table, owned by Phase 3 | partial (by design) |
| AC-2 | A 23rd game needs no paging edit | New `describe("a 23rd game")`: `pageCount(23) === 3`, `pageTileIndexes(2, 23) === [20, 21, 22]`, `pageOf(22) === 2`, `pageTileIndexes(3, 23)` still throws | met |
| AC-4 | Removing a registry key fails loudly | This phase's share: `stickerKeyForGame` throws `no registry entry for game id: …` for an unknown id (tested). The `tileKey`-removal guard is Phase 4 asset resolution | partial (by design) |
| AC-5 | Gate passes at or above the pre-track count | 2317 >= 2310 | met |

## Behavior preservation

- 22 tiles still render as 10 + 10 + 2; `pageTileIndexes(pageCount() - 1)` still returns `[20, 21]`.
- Progress overlay still shows `1 / 4` … `4 / 4` with 6 rows per page and 4 on the last.
- Every sticker key is unchanged, including `sticker_alphabet_match` for `alphabet-match`.
- `pagedTilePosition`, layout constants and rendered strings are untouched.

## Deviations

1. **Executed by the primary, not a `conductor-phase` subagent.** Two launches failed with a
   platform error (the configured model had no seat in its experiment), and the earlier attempt
   left uncommitted partial work in `ProgressOverlay.ts` and `hubPaging.ts` with
   `hubGrid.ts` still importing the deleted `PAGE_COUNT`. The primary reviewed that work,
   kept the sound parts, completed the remaining tasks and ran the full gate. No behavior
   change went unreported.
2. **`tileCount: number` annotation is required.** `GAME_REGISTRY` is `as const`, so
   `GAME_REGISTRY.length` has the literal type `22`; an unannotated default narrowed the
   parameter to `22` and `tsc` rejected the 23-tile tests. Annotated explicitly.
3. **`hubTiles.test.ts` updated.** It asserted the now-deleted `HUB_TILE_COUNT`; it now asserts
   `pageCount()` equals `ceil(GAME_TILES.length / PAGE_SIZE)`. Inside `src/__tests__/**`.

## Notes

- `pageOf` needed no change: it is a pure floor over `PAGE_SIZE` with no range to derive.
- The new paging tests use an explicit `tileCount` fixture rather than mutating the real
  registry, so the 22-game assertions stay honest while 23-tile forward compatibility is proven.
- Pre-existing Biome warning and schema info were deliberately not touched.
