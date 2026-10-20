# Integrated Verification — 20261020-game-metadata-source

- **Track:** Game Metadata Single Source of Truth (refactor)
- **Branch:** refactor/20261020-game-metadata-source
- **Base:** master @ 3201c9c
- **Head:** bdc9705 (`conductor(plan): Mark phase 'Docs and the full gate' as complete`) plus this file
- **Date:** 2026-10-21
- **Result:** verified — every layer green

## Full ladder

| Layer | Command | Exit | Result |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | 232 files; 1 pre-existing warning (`noNonNullAssertion`, `src/__tests__/scenes/musicalMemoryScene.test.ts:294`) + 1 biome.json schema info, both present before this track |
| static | `pnpm typecheck` | 0 | silent |
| unit | `pnpm test -- --run` | 0 | 111 files / 2327 tests (pre-track 110 / 2305) |
| unit | `pnpm test:coverage` | 0 | 97.77 % statements, 90.69 % branches, 96.37 % functions, 98.55 % lines — gates are 90 / 85 / 88 / 95 |
| build-artifact | `pnpm build` | 0 | 41 JS chunks; `precache 53 entries (1703.44 KiB)` |
| build-artifact | `node scripts/validate-bundle.js` | 0 | shell entry 133.2 kB (<= 200 kB); Phaser vendor chunk present |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| smoke | `node scripts/validate-boot.js` | 0 | median cold boot 0.18 s warm / 0.59 s cold-cache runs, against the 3.0 s budget |

## Acceptance criteria

| ID | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| AC-1 | One module declares the 22 games; the other four lists derive | met | grep sweep in `phase-5.md`: 22 `sceneKey` literals, all in `gameRegistry.ts`; `PROGRESS_GAME_ROWS`, `HUB_TILE_COUNT`, `PAGE_COUNT`, literal `tile_`/`sticker_` rows and `sticker_${…}` all at zero |
| AC-2 | A 23rd game changes no paging constant | met | `phase-4.md` — `pageCount(23)`, `pageTileIndexes(page, 23)` and `pageOf(22)` assertions with no 22 literal; loader, `GAME_IDS` and shell checks are set comparisons |
| AC-3 | `SHELL_ASSETS` has 44 game entries in registry order with today's keys | met | `phase-3.md` — runtime table pinned against an independent 53-key golden list in `shellOwnership.test.ts` and a disk-truth glob map in `preloadScene.test.ts` |
| AC-4 | Removing a registry `tileKey` fails a test naming the key | met | `phase-3.md` (throw at module evaluation) and `phase-4.md` (broken key + stray loader mutations, both reverted) |
| AC-5 | `check && typecheck && test` at or above the pre-track count | met | 2327 vs 2305 |
| AC-6 | Full `verify_phase` passes within existing thresholds | met | table above |
| AC-7 | Hub walkthrough: 22 tiles over three pages plus wide, icons rendering, earned sticker as earned | met | `.conductor/evidence/hub/*.png` — 10 + 10 + 2 and 6/6/6/4, three seeded stickers shown on their shelves |
| AC-8 | TDD §7.1, README, PRD §4.1 mention the registry | met | `phase-5.md` |

## Cross-phase coherence

- One declaration (`GAME_REGISTRY`) now feeds five consumers: `GAME_TILES` (Phase 1),
  progress rows, paging counts and sticker keys (Phase 2), the boot table (Phase 3), and the
  invariant suite that holds all of them together (Phase 4).
- No production behaviour changed: the Hub renders the same 22 tiles in the same order, the
  same paging sizes, and the same shell payload (53 entries / 1703.44 KiB).
- The forward-compatibility criterion is proved by construction, not by pinning 22: every new
  assertion is either a set comparison or driven from `GAME_REGISTRY.length`.

## Deviations carried into review

1. Phase 2 and 3 were executed by the primary after the `conductor-phase` subagent failed to
   start twice (platform seat error). Both phases ran the same brief, verification and
   evidence rules.
2. `shellOwnership.test.ts` was updated to read `SHELL_ASSETS` at runtime; the 53-key golden
   list stayed hand-written there, so the guard still has an independent source of truth.
3. `tileCount` parameters are annotated `number` so the literal type of
   `GAME_REGISTRY.length` cannot narrow them.
4. One flaky 5 s timeout in `hubEngagement.test.ts` was observed once under full-suite load and
   passed on both the isolated and the next full run.
