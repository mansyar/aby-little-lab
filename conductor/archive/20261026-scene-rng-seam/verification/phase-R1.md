# Phase R1 Evidence — Review Fixes

- **Track:** 20261026-scene-rng-seam
- **Phase:** R1
- **Date:** 2026-10-26
- **Branch:** `refactor/20261026-scene-rng-seam`
- **Base:** `f183b63b` — **Head at verification:** `530cfa13` (task commits `2c5effee`, `530cfa13`; evidence committed after the verification run)
- **Result:** verified

## Commands

| Layer | Command | Result |
|---|---|---|
| lint/format | `pnpm check` | pass (exit 0; 1 pre-existing warning — musicalMemory `noNonNullAssertion` — + 1 pre-existing info — biome schema version, both listed as out-of-scope in review.md) |
| types | `pnpm typecheck` | pass |
| tests | `pnpm test -- --run` | pass — 125 files / 2,729 tests |
| coverage | `pnpm test:coverage` | pass — 97.82 / 91.96 / 96.77 / 98.74 vs gates 90/85/88/95 |
| build | `pnpm build` | pass — 54 precache entries |
| bundle | `node scripts/validate-bundle.js` | pass — shell 138.7 kB ≤ 200 kB |
| pwa | `node scripts/validate-pwa.js` | pass — 16/16 |
| docs | `node scripts/validate-docs.js` | pass — 5/5 |

Full chain: `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` — exit 0.

## Findings

| Finding | Status | Fix |
|---|---|---|
| F1 (Medium) — divergent `pathRngForPair` copies in `animalTraceFlow.test.ts` | **resolved** | Preferred fix applied: hoisted ONE module-scope `pathRngForPair` helper (with the shared layout constants `ANIMAL_X`/`FOOD_X`/`SPRITE_Y`/`PATH_POINTS`) used by both describe blocks; warm-up loop passes `rng` (the correct copy's behavior). Both in-block duplicates deleted — the two blocks can no longer diverge. |
| F2 (Low) — unpinned forwarded generator in 8 suites' band-shift assertions | **resolved** | All 15 listed assertions now pin the generator: recorder wrappers converted to the rest-args pattern `(...args: Parameters<typeof actual.X>) => { mock(...args); return actual.X(...args); }` (matches the seven suites repaired in Phase 2) and `expect.any(Function)` appended. Leading-argument expectations preserved verbatim. |

### F2 detail — assertion sites (post-edit line numbers)

| Suite | Wrapper mock | Assertions |
|---|---|---|
| `howManyScene.test.ts` | `createPlaythrough` (countLogic) | `:720` `(1, any)`, `:727` `(0, any)` |
| `memoryMatchScene.test.ts` | `buildPlaythrough` (memoryMatchLogic) | `:749` `(1, any)`, `:755` `(0, any)` |
| `wordMatchScene.test.ts` | `generateWordPlaythrough` (wordLogic) | `:785` `(6, 1, any)`, `:792` `(6, 0, any)` |
| `addItUpScene.test.ts` | `buildPlaythrough` (addItUpLogic) | `:664` `(1, any)`, `:671` `(0, any)` |
| `takeAwayScene.test.ts` | `buildPlaythrough` (takeAwayLogic) | `:665` `(1, any)`, `:672` `(0, any)` |
| `decodeItScene.test.ts` | `buildPlaythrough` (decodeLogic) | `:743` `(6, 1, any)`, `:750` `(6, 0, any)` |
| `wordBuilderScene.test.ts` | `generateWordBuildPlaythrough` (wordLogic) | `:842` `(3, -1, any)`, `:849` `(3, 0, any)` |
| `musicalMemoryScene.test.ts` | `generateSequence` (musicalMemoryLogic) | `:281` `(start, any)` |

`isWin` in musicalMemory already recorded/pinned both args — unchanged (not in the finding).

## Files touched

- `src/__tests__/scenes/animalTraceFlow.test.ts` (F1)
- `src/__tests__/scenes/howManyScene.test.ts`
- `src/__tests__/scenes/memoryMatchScene.test.ts`
- `src/__tests__/scenes/wordMatchScene.test.ts`
- `src/__tests__/scenes/addItUpScene.test.ts`
- `src/__tests__/scenes/takeAwayScene.test.ts`
- `src/__tests__/scenes/decodeItScene.test.ts`
- `src/__tests__/scenes/wordBuilderScene.test.ts`
- `src/__tests__/scenes/musicalMemoryScene.test.ts`

## Deviations

None. All changes are inside the phase's `Touches` paths. Side effect of the F2 rest-args rewrite: the now-unused `import type { Rng }` lines were removed from six suites (howMany, memoryMatch, wordMatch, addItUp, takeAway, wordBuilder, musicalMemory — seven removals total across the eight; decodeIt never imported `Rng`), since the wrappers no longer name `Rng` explicitly and an unused type import would fail `pnpm check`. No behavior change.

## Notes

- F1 used the preferred hoist (no import/ordering complications: `mulberry32`, `selectThreePairs`, `generatePathPoints` are already imported at module scope).
- No assertion was weakened; the F2 change strictly strengthens them (exact leading args + `expect.any(Function)` in the generator slot).
- Pre-existing warnings (biome schema-version info, musicalMemory `noNonNullAssertion`) match the review baseline; not touched.

## Primary verification

Primary verification performed 2026-10-26 by the primary.

- Tree clean; range f183b63b..HEAD = 4 commits, no merge commits; exactly
  the 9 Touches files changed.
- F1 spot-audit: exactly one pathRngForPair definition remains (hoisted to
  module scope), and the warm-up loop passes rng - the latent divergence is
  structurally impossible now that there is one helper.
- F2 spot-audit: expect.any(Function) appended with leading arguments
  preserved verbatim (howMany :720/:727, musicalMemory :281 verified;
  the reviewer's counts reconciled - 15 assertions across the 8 suites).
- Side effect audited: the removed "import type { Rng }" lines in seven
  suites were made unused BY this change (the rest-args wrappers no longer
  name Rng), so their removal is the correct orphan cleanup.
- Command table re-run by the primary: all exit 0.

| Layer | Command | Exit | Summary |
|---|---|---|---|
| lint/format | pnpm check | 0 | 258 files; 1 warning + 1 info (both pre-existing) |
| types | pnpm typecheck | 0 | tsc --noEmit clean |
| tests | pnpm test -- --run | 0 | 125 files / 2729 tests passed |
| coverage | pnpm test:coverage | 0 | 97.82 st / 91.96 br / 96.77 fn / 98.74 ln |
| build | pnpm build | 0 | 54 precache entries (1727.85 KiB) |
| bundle | node scripts/validate-bundle.js | 0 | shell 138.7 kB <= 200 kB; Phaser vendor present |
| pwa | node scripts/validate-pwa.js | 0 | all checks passed |
| docs | node scripts/validate-docs.js | 0 | all checks passed |

Primary verdict: **verified**.
