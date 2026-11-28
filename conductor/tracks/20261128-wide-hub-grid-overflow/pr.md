# Fix wide hub grid overflow with 25th game tile

## Summary

With 25 games the wide (desktop All-view) hub grid overflowed: `GRID_ROWS = 4`
laid out rows of 6/6/6/6+1, leaving the 25th tile (and its shelf plaque) below
the 1024×768 fold. This track flows the 25th tile onto a fifth row and recenters
the wide board (`wideGridOrigin` (25,119)→(25,50)); tile size and spacing are
unchanged and no paging was added. The narrow/paged path is proven unaffected
(documented no-op).

## Phases

- P1 `2321bea1`: RED bounds test (25th tile bottom 787 > 768), `GRID_ROWS`
  4→5, recentered origin, golden updates (hubScene/hubGrid/gridLayout/
  groupLayout), plus a one-line stale groupLayout comment fix
- P2 `13d35778`: new narrow-viewport bounds test over all 25 paged tiles +
  plaques (green first run); paged geometry never consumes wide constants, so
  no rebalance — no production change
- CI-fallout fix: `WIDE_BOARD_TOP` anchor + `TILE_ROW_SPACING` 18 with a
  chip-clearance guard — row 0 clears the interactive chip band (board
  108–760); also resolves RM-12. Evidence:
  `verification/ci-fix.md`.

## Tests

164 files / 3531 tests green; coverage stmts 96.94 / branches 90.36 / funcs
96.35 / lines 98.09
(gates 90/85/88/95). Full gate green: check, typecheck, build, bundle,
module-size (2 pre-existing warnings), textures 76.42/321.00/0.238 vs
80/322/0.5 (unchanged), PWA 16/0, docs 5/0. Integrated evidence:
`conductor/archive/20261128-wide-hub-grid-overflow/verification/integrated.md`.
E2E list: 59 tests / 22 files, no errors; animal-trace, completion, and
launch-all journeys verified green locally on the fixed build (full browser
runs in CI).

## Verification

Per-phase evidence in `verification/{phase-1,phase-2}.md`; review `review.md`
— PASS, no findings (strict mode, round 1 of 2, no fix round needed).

## How to land

Merge (per workflow `merge_method: merge`); no migrations, no new deps,
no assets, no storage changes. No secrets touched. Retires roadmap RM-11
(origin issue #108, now closed by this fix).

## Follow-ups

- Roadmap RM-12 (chip-band overlap with row 0) resolved as a side effect of
  the CI-fallout fix: the board now anchors below the chip band, so no
  relocation track is needed.
