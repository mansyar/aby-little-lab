# CI-fallout fix — chip band swallowing row-0 taps

- **Track:** 20261128-wide-hub-grid-overflow
- **Date:** 2026-11-28
- **Branch:** `fix/20261128-wide-hub-grid-overflow`
- **Result:** **verified** — fix green in unit, E2E, and full gate.

## CI signal

PR #110: Quality Gates pass; Browser Journeys fail on shard 1, shard 2,
firefox, webkit (mobile-chromium passes). Every failing job shows the same
signature: `Error: the active scene should settle on AnimalTrace` (shard 1:
18 occurrences; firefox: 9). The completion journey (`returns to the hub
unaided`) fails the same way.

## Root cause (track-caused, not flake)

Phase 1 recentered the 5-row board to `startY = 50`, putting row 0 (y 50–166,
centers y = 108) under the interactive chip band (6 chip zones, 96×84,
centered at y = 66, spanning y 24–108). The chips render after the grid, so
their zones sit on top and swallow taps aimed at row-0 tile centers (tile 1
center (263,108) lies exactly on the first chip zone's bottom edge).
mobile-chromium passes because the narrow paged layout has no overlap.
Reproduced locally: `animal-trace.spec.ts` fails identically on the
pre-fix tree; the failure screenshot shows the hub still on screen with the
"All" chip selected and the chip band visibly overlapping the top row.

## Fix

- `hubGridConstants.ts`: new `TILE_ROW_SPACING = 18` (row pitch; horizontal
  `TILE_SPACING = 22` and tile size 144×116 unchanged) and `WIDE_BOARD_TOP =
  108` (chip-band bottom: `CHIP_ROW_CENTER_Y` 66 + `CHIP_HEIGHT` 84 / 2).
- `gridLayout.ts`: `wideGridOrigin` keeps horizontally centered `startX = 25`
  but anchors `startY = WIDE_BOARD_TOP`; `wideTileCenter` uses the row pitch.
  New geometry @1024×768: origin (25,108), row centers y
  166/300/434/568/702, board 108–760 (8px bottom margin).
- `gridBuilder.ts`: comment refresh (anchor, not recenter).
- Tests: new chip-clearance guard in `gridLayout.test.ts` (RED pre-fix:
  `expected 50 to be greater than or equal to 108`; GREEN post-fix); goldens
  updated in `gridLayout.test.ts` / `hubGrid.test.ts`. `hubScene.test.ts`
  needs no changes (positions derived from the geometry helpers).
- Deviation from the reviewed tree: vertical row spacing 22→18 and a chip-band
  anchor instead of vertical centering. Tile size, horizontal spacing, and the
  no-paging rule are unchanged. This also resolves roadmap RM-12 (chip-band
  visual overlap) as a side effect: row 0 now starts exactly where the chip
  band ends.

## Verification

- Unit: 164 files / 3531 tests pass (new guard green).
- E2E (fresh `dist/`, chromium): `animal-trace.spec.ts` 1/1 pass;
  `completion.spec.ts` + `launch-all.spec.ts` 4/4 pass (every game launches
  from the hub and returns). Note: the first post-fix E2E run failed because
  `dist/` was stale — E2E serves the preview build, so a rebuild was required.
- Full gate on the final tree: check clean (after `check --write` import
  ordering), typecheck clean, coverage stmts 96.94 / branches 90.36 / funcs 96.35 / lines 98.09 (gates
  90/85/88/95), build 500 modules, bundle PASS (189.3 kB),
  module-size PASS (2 pre-existing warnings), textures PASS unchanged,
  PWA 16/0, docs 5/0 (8 numeric-only 3530→3531 refreshes for the new test).
