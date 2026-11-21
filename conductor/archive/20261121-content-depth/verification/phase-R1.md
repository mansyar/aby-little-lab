# Phase R1 verification — Review fixes (20261121-content-depth)

Base: `b559cac5b5bdcd960b0ff86c69cb8328d9d3e872`

## Defect fixed (F1)

`ShapeType`/`ALL_SHAPES` was widened to 24 but only 18 `cutout_*.svg` files and art keys
existed, so Shape Sorter slots rendered Phaser's `__MISSING` placeholder for the six new
types. Added the six missing cut-outs (completing the intended design) rather than
restricting the draw pool.

## Changes

- New SVGs in `src/assets/svg/shapes/`: `cutout_cube.svg`, `cutout_cross.svg`,
  `cutout_chevron.svg`, `cutout_capsule.svg`, `cutout_sector.svg`,
  `cutout_parallelogram.svg`. Each is a standalone `viewBox="0 0 512 512"` silhouette
  matching its `shape_*.svg` geometry, with `fill-opacity="0.3"`, `stroke="#2D3748"`,
  `stroke-width="14"`, `stroke-dasharray="18 22"`, ASCII-only, no text/gradients/filters.
- `src/game/art/cutouts.ts`: 6 imports + 6 rows; `cutouts` group 18 -> 24 keys; doc comment updated.
- `src/game/hub/prewarm.ts`: 6 `["cutout_<name>", CARD]` rows in `CUTOUTS_KEYS` (18 -> 24).
- `src/__tests__/game/shapeSorterLogic.test.ts`: regression test asserting every
  `ShapeType` in `ALL_SHAPES` has a `cutout_${type}` key in both the `cutouts` art group
  and `ART_KEYS_BY_GAME["shape-sorter"]` (prewarm), closing the test gap.
- Ripple counts reconciled in `groupIntegrity.test.ts` (`["cutouts", 24]`,
  `TOTAL_APP_ASSETS` 199 -> 205), `shellOwnership.test.ts` (151 group keys / 145 game-only),
  `textureTiers.test.ts` (`APP_ASSET_COUNT` 201 -> 207), `preloadScene.test.ts`
  (`CANONICAL_ASSET_COUNT` 201 -> 207). Assertions kept strict.
- Docs reconciled to the new reality (24+24 = 48 shape files; 151 group / 145 game-only;
  319 SVGs; 207 texture keys; 76.07/319.00 MiB tiers; 3,346 tests), with historical
  measurement records preserved. TDD §10.3 coverage updated to 97.14/90.97/96.25/98.31 (F4).

## Verification (commands run separately)

| Command | Result |
| --- | --- |
| `node scripts/validate-textures.js` | PASS — 319 SVGs (34 icon / 283 card / 2 hero); typical tiered 76.07 MiB (<= 80 MiB); full uniform 512² 319.00 MiB (<= 320 MiB); tier ratio 0.238 (<= 0.500) |
| `pnpm exec vitest run src/__tests__/game/shapeSorterLogic.test.ts` | PASS — 1 file, 23 tests (incl. new cut-out coverage test) |
| `pnpm exec vitest run` | PASS — 154 test files, 3,346 tests |
| `node scripts/validate-docs.js` | PASS — 5 passed / 0 failed |
| `pnpm check` | PASS — biome check clean (343 files) |
| `pnpm typecheck` | PASS — `tsc --noEmit` and e2e `tsconfig` clean |

No build/coverage/bundle/PWA commands were run (owned by primary).

## Primary verification (orchestrator, independent)

- Clean tree; single commit `a67e5ade`; diff confined to R1 Touches (six new cut-out SVGs,
  `cutouts.ts`, `prewarm.ts`, ripple count tests, and count/coverage docs). No Conductor state
  touched. Confirmed 24 `cutout_*.svg` files on disk, all six new keys registered in
  `src/game/art/cutouts.ts:49-54` and `src/game/hub/prewarm.ts:236-241`, and the regression test at
  `src/__tests__/game/shapeSorterLogic.test.ts:53-61` asserting every `ShapeType` has a registered
  `cutout_${type}` key — F1's test gap closed.
- Full `verify_phase` chain re-run by the primary and passed (exit 0): `pnpm check` (Biome clean
  343 files) → `pnpm typecheck` clean → `pnpm test -- --run` (154 files / 3,346 tests) →
  `pnpm test:coverage` (154 / 3,346; 97.14/90.97/96.25/98.31% above gates 95/88/85/90) →
  `pnpm build` (468 modules; shell `index-D7j_hnKs.js` 192.52 kB Vite / 188.0 kB via validator
  ≤ 200 kB; Phaser vendor 1,367.08 kB pre-existing advisory; storyOrderArt chunk 81.84 kB;
  cutouts chunk 7.08 kB) → `validate-bundle.js` PASS → `validate-pwa.js` 16/16 →
  `validate-docs.js` 5/5 → `validate-textures.js` PASS (319 SVGs, typical 76.07 ≤ 80, full
  319.00 ≤ 320, ratio 0.238 ≤ 0.5).
- Result: **verified**. F1 (High, blocking) fixed with a regression test; F2/F4 count and coverage
  docs reconciled to source. F3 compile-forced scene map and FR-7 caps override remain as recorded
  in `review.md`.
