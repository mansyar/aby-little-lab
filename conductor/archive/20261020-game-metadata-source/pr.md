# refactor(game): declare the 22 games once and derive every list from it

## Summary

Game identity used to be spelled out five times: `GAME_TILES` (22 rows), `PROGRESS_GAME_ROWS` (22 rows), the paging constants (`HUB_TILE_COUNT`, `PAGE_COUNT`), the boot shell's 44 raw SVG imports, and the sticker key convention duplicated in `GameSceneBase` and `hubGrid`. Adding a game, or renaming one, meant keeping all five in step by hand.

This track introduces `src/game/gameRegistry.ts` as the single declaration of the 22 games — `gameId`, `sceneKey`, `label`, `tileKey`, `stickerKey`, plus the two optional icon overrides — and makes every other list derive from it.

No user-visible behaviour changes: same 22 tiles in the same order, same paging (10 + 10 + 2 on phones, 6/6/6/4 wide), same sticker keys including the `alphabet-match` → `sticker_alphabet_match` divergence, same boot payload.

## What changed

- **`src/game/gameRegistry.ts` (new)** — the 22 entries in Hub/PRD order, `stickerKeyForGame()`, and a compile-time coverage check: `Exclude<GameId, registry ids>` must be empty, so a missing entry fails `tsc` with the missing id named.
- **`src/game/hubTiles.ts`** — `GAME_TILES` is now a projection of the registry; the export name, type and values are unchanged.
- **`src/game/hubPaging.ts`** — `pageCount(tileCount = GAME_REGISTRY.length)` and `pageTileIndexes(page, tileCount)` replace the hard-coded `HUB_TILE_COUNT` / `PAGE_COUNT`.
- **`src/components/settings/ProgressOverlay.ts`** — progress rows derive from the registry.
- **`src/scenes/GameSceneBase.ts`, `src/game/hubGrid.ts`** — both use `stickerKeyForGame`, so the sticker convention exists once.
- **`src/scenes/PreloadScene.ts`** — the 44 game entries of `SHELL_ASSETS` are built at module evaluation from the registry through three eager raw globs (`ui/tile_*.svg`, `ui/tiles/*.svg`, `stickers/*.svg`), resolved by `buildShellAssets`. A missing key, a duplicate file stem or a duplicate registry key throws naming the key, rather than failing at Hub render. The nine non-game rows stay literal.
- **`src/__tests__/gameRegistry.test.ts`** — one suite pins registry ↔ scene loaders ↔ storage ids ↔ shell assets ↔ paging, and stays coherent for a hypothetical 23rd game.
- **Docs** — `docs/TDD.md` (§2.1 tree, §3.3, §7.1, budgets), `docs/PRD.md` §4.1 and `README.md` now describe the registry instead of five hand-maintained lists.

## Verification

| Check | Result |
| --- | --- |
| `pnpm check` (Biome) | pass — 232 files, one pre-existing warning |
| `pnpm typecheck` | pass |
| `pnpm test -- --run` | 111 files / **2333 tests** (pre-track: 110 / 2305) |
| `pnpm test:coverage` | 97.7 stmts / 90.6 branches / 96.4 functions / 98.6 lines (gates 90/85/88/95) |
| `pnpm build` | 41 chunks, precache 53 entries |
| `validate-bundle.js` | shell entry **130.1 kB** ≤ 200 kB |
| `validate-pwa.js` | 16 passed |
| `validate-boot.js` | median cold boot **0.51 s** ≤ 3.0 s |
| Hub walkthrough | 3 phone pages (390×844) + wide (1024×768): 22 tiles, all icons, earned stickers visible |

Guard proofs, each applied then reverted: deleting the story-order entry fails typecheck with `TS2741` naming `"story-order"`; aliasing a `tileKey` fails with `duplicate tileKey: …`; pointing a `tileKey` at a missing file throws `no shell SVG for registry asset key: …`; a duplicate table key throws `duplicate shell asset key: …`; adding a loader makes the bijection test fail naming it.

## Review

Two review rounds, verdict **PASS WITH FINDINGS**, every finding closed in-track by phases R1 and R2 — including the round-1 Medium where the broad `ui/**` glob was inlining the eight lazy glyph SVGs into the shell entry (fixed: entry 133.2 → 130.1 kB), and the round-1 Medium where a duplicate registry key was only caught by a test rather than at module evaluation (fixed and now unit-tested). No debt issues were opened. See `conductor/archive/20261020-game-metadata-source/review.md`.

## Track artifacts

- Spec: `conductor/archive/20261020-game-metadata-source/spec.md`
- Plan: `conductor/archive/20261020-game-metadata-source/plan.md`
- Evidence: `verification/phase-1.md` … `phase-5.md`, `phase-R1.md`, `phase-R2.md`, `integrated.md`

## Risk

Low. The derivation is covered by a golden comparison against the pre-track arrays, and the Hub walkthrough was captured before the PR. Rollback is a revert of the merge; no storage key, migration or asset changed.
