# Phase R1 Verification — Review Fixes

- **Track:** 20261021-hub-grid-decomposition
- **Phase:** R1 (Review Fixes)
- **Date:** 2026-10-21
- **Branch:** refactor/20261021-hub-grid-decomposition
- **Base:** `aafb40e` — **Head:** `3cae912` (code) + evidence commit
- **Result:** verified

## Findings fixed

| Finding | Severity | Fix |
| --- | --- | --- |
| F1 | Medium | `hubGrid.test.ts` "lets a just-earned award ride a page transition…": sticker collection moved to after `grid.flipTo(1)` (captures the page-1 shelf including the just-earned `sticker_how_many`), plus a `toBeGreaterThan(0)` guard; the swipe → `flipTo(2)` slide-out timer now destroys a non-empty collected list per object. Comments updated to match the asserted behavior. No assertion weakened; the `Back.out` entrance-count assertion is unchanged. |
| F2 | Low | `hubGrid.ts:52` field doc corrected to "The textless page dots (one per page; paged mode only)." — 1:1 line swap, 200-line count preserved. |
| F3 | Low | `hubGrid.test.ts` "releases every grid object on shutdown": earns `how-many` (page 1) so `buildPageGrid(1)` creates a sticker image, with an explicit non-empty `sticker_` assertion before `destroy()`; the per-object loop now covers sticker images. |
| F4 | Low | `phase-4.md` evidence line corrected: gridBuilder.ts 324 → 317 lines. |
| F5 | Low | `phase-4.md` FR-3 ledger gained a line documenting the `deps`/`entranceIndex`/`swipes` private→public widening as inherent to the extraction design. |

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | 244 files; only the 2 pre-existing findings (biome.json schema info; musicalMemoryScene noNonNullAssertion) |
| static | `pnpm typecheck` | 0 | tsc clean |
| unit | `pnpm test -- --run` | 0 | 116 files / 2,429 tests passed |
| focused | `pnpm test -- --run src/__tests__/game/hubGrid.test.ts` | 0 | 20/20 tests pass after the fix |

## Deviations

None — the diff touches exactly the Phase R1 Touches.

## Notes

- F1's root cause was a test-construction ordering bug, not product code; the
  fix keeps the established mock patterns (append-only registry, `at(-1)`
  delayedCall capture).
- hubGrid.ts remains at 200 lines after F2.
