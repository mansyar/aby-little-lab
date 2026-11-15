# Phase 2 — Robot and prop art, in the game's own chunk

- Track: 20261115-robot-path
- Phase: 2
- Date: 2026-11-15
- Branch: `feat/20261115-robot-path`
- Base / Head: `f2f602a0` / `1898f5cc`
- Result: verified
- Mode: E3 (the primary implemented; no code subagent in this host)

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | Biome: 327 files, no fixes applied |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` plus the e2e project |
| unit | `pnpm test -- --run` | 0 | 149 files, 3,233 tests passed (7 of them new) |
| coverage | `pnpm test:coverage` | 0 | 97.39 / 92.22 / 96.39 / 98.32 project-wide |
| build-artifact | `pnpm build` | 0 | shell entry `index-D-3OKLR6.js` = 179.4 kB |
| build-artifact | `node scripts/validate-bundle.js` | 0 | entry 179.4 kB ≤ 200 kB, vendor chunk isolated |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16/16, 59 precache entries / 1776.92 KiB |
| documents | `node scripts/validate-docs.js` | 0 | 5/5 |

Chained as one background job; final line `GATE EXIT: 0`. Unlike Phase 1 this
phase's gate passed on its first run — the suite-count refresh below was applied
before the run, from a real `pnpm test -- --run` (149 / 3,233), rather than
waiting for the validator to fail.

## Acceptance

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-14 | Six `robot_*` SVGs imported by a scene-local module and rasterized in the game's own preload | `robotPathArt.ts` exports `ROBOT_PATH_ASSETS` (six keys) and `preloadRobotPathArt`; `robotPathArt.test.ts` — "registers every texture once, at the card tier" asserts six `svg` loads at 256 with base64 data URIs | pass |
| FR-14 | The markup never reaches the boot shell | "keeps the robot art module out of the boot preloader" (raw `PreloadScene.ts` contains neither `robotPathArt` nor `svg/robot/`); precache still 59 entries and the shell entry is byte-identical at 179.4 kB | pass |
| NFR-3 | New art costs nothing on the boot path | shell entry unchanged `index-D-3OKLR6.js` 179.4 kB; precache unchanged 59 / 1776.92 KiB | pass |
| D7 | Scene-local module, Story Order's shape | same three parts as `storyOrderArt.ts`: `?raw` imports, one asset table, one preload using `toDataUri` + `textureSizeFor` | pass |
| D8 | Arrows and board drawn, not shipped | the module contains no arrow, tile or trail texture — only the three robot poses and the three props | pass |
| Art contract | Flat fills, dark outlines, no gradients/filters/bitmaps/text | "follows the storybook-flat art contract" over all six files | pass |
| Loader safety | Latin-1 safe for base64 | "stays Latin-1 safe so the loader can base64 it"; "encodes every texture without throwing" | pass |

## Evidence

- `src/assets/svg/robot/robot_idle.svg`, `robot_walk.svg`, `robot_puzzled.svg`,
  `robot_go.svg`, `robot_rock.svg`, `robot_star.svg` — six flat drawings at a
  512 viewBox, 4–8px `#2D3748` outlines, fills from the existing palette
  (`#A0AEC0`/`#718096` body, `#FFF8E7` face plate, `#FC8181` antenna, `#68D391`
  Go, `#F6E05E` star).
- `src/game/robotPathArt.ts` — `ROBOT_PATH_ASSETS` and `preloadRobotPathArt`.
- `src/__tests__/game/robotPathArt.test.ts` — 7 tests over three describes.
- Commits: `ae4124bc` (art), `0cf4d7aa` (module + suite), `1898f5cc` (doc counts).

## Deviations

1. **`README.md`, `docs/TDD.md`, `docs/perf-baseline.md` — outside `Touches`.**
   The art suite adds a test file, so the derived suite truth moved 148/3,226 →
   149/3,233 and the three stated counts were refreshed. Numbers only, consistent
   with the Phase 1 deviation.

## Notes

- **Not visually inspected.** The phase's verification is the gate, and the art
  contract tests prove the markup's shape, not its appearance. Nobody has looked
  at these six drawings rendered in a browser; that check belongs to Phase 3,
  where the scene puts them on a board, and to review.
- The star is warm yellow (`#F6E05E`) rather than a literal neighbour of the
  success green: a green star on a cream tile reads as a blob at 96 px, and the
  Go control is already the green element on screen.
- `robot_go` is used as the Go button's face at 112 px; `robot_puzzled` is the
  stopped-run pose, so the game never needs a "sad" drawing.
- The `robot_walk` pose is a tilted copy of the idle body with one foot raised,
  so a run reads as hopping without a sprite sheet or a new animation system.
