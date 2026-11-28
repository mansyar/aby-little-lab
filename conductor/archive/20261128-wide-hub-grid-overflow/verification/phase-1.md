# Phase 1 Verification — Wide-grid overflow rule

- **Track**: 20261128-wide-hub-grid-overflow — Fix wide hub grid overflow with 25th game tile
- **Phase**: 1 — Wide-grid overflow rule
- **Date**: 2026-11-28
- **Branch**: `fix/20261128-wide-hub-grid-overflow` (not switched)
- **Base commit**: `4a5972e6`
- **Head commit**: `a0157764` (plus the uncommitted evidence file for the primary's state commit)
- **Result**: **verified** — implementation and targeted tests are complete and green; the primary ran the exact full verification gate green (see Primary verification).

## Summary

`GRID_ROWS` changed from 4 to 5, so the 25th tile flows onto a fifth row and
`wideGridOrigin` recenters the board for 5 rows: `(startX, startY)` =
`(25, 50)` at 1024×768 (was `(25, 119)`). Tile size (144×116) and spacing (22)
are unchanged. All 25 tiles and all 25 shelf plaques now lie inside the
1024×768 canvas. No paging was added and no tiles were resized.

## Commands table

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Preflight | `git status --short` | 0 | Clean tree at base `4a5972e6`. |
| Preflight | `git log --oneline --max-count=5 HEAD` | 0 | Confirmed branch head `4a5972e6`. |
| RED (P1.T1.1) | `pnpm test -- --run src/__tests__/scenes/hubScene.test.ts -t "keeps all 25 tiles"` | 1 | Expected failure: `expected 787 to be less than or equal to 768` — 25th tile bottom at 787, below the fold. 1 failed / 3528 passed. |
| GREEN (P1.T3.1) | `pnpm test -- --run src/__tests__/scenes/hubScene.test.ts -t "keeps all 25 tiles"` | 0 | After the fix: 164 files / 3529 tests passed. |
| History | `git log --oneline --max-count=6 HEAD` | 0 | Three task commits on top of base. |
| Full gate (P1.T3.2 / AC-3 / AC-4) | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | — | **Permission denied: shell.** Not retried or worked around, per the phase rules. Primary must run this exact command and hand back the output. |

Note: one earlier probe included a `|` character inside a `-t` filter, which the
shell misparsed (exit 1, `'grid' is not recognized as an internal or external
command`). It was replaced by a pipe-free equivalent; no code was changed as a
result.

## Acceptance-criteria table

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| FR-1 | All 25 tiles on-canvas in the wide All view | `hubScene.test.ts` bounds test now loops all 25 tiles; RED at 787px pre-fix, GREEN post-fix. `gridBuilder.ts` loops all `GAME_TILES`. | pass |
| FR-3 | Fifth-row flow with recentered origin | `GRID_ROWS = 5`; `wideGridOrigin(1024,768) = {startX:25, startY:50}`; row centers 108/246/384/522/660. Geometry test asserts row sizes `[6,6,6,6,1]`. | pass |
| FR-4 | Existing hub behavior preserved | Thinking-chip filter still yields 9 on-canvas tiles; all 3529 tests pass after golden updates. See Notes for a visual overlap caveat. | pass (with note) |
| NFR-1 | Tile size unchanged | `TILE_WIDTH 144`, `TILE_HEIGHT 116`, `TILE_SPACING 22` untouched. | pass |
| NFR-2 | No new runtime imports/coupling | Only constants/comments changed in source; geometry helpers stay pure. | pass |
| NFR-3 | No tile resizing / paging | Paged layout (`hubPaging.ts`) untouched; its threshold depends on tile height only. | pass |
| AC-1 | Bounds unit test over 25 tiles + shelf plaques at 1024×768, RED pre-fix / GREEN post-fix | RED: `expected 787 to be less than or equal to 768`; GREEN: 3529/3529 pass. Plaque bounds read from the 25 dashed-ring graphics' `setPosition` centres (±11px). | pass |
| AC-3 | Full verification gate green | Primary ran the exact gate: check, typecheck, 164 files / 3529 tests, coverage 96.93/90.33/96.35/98.09, build, bundle, module-size, textures, PWA 16/0, docs 5/0 — all exit 0. | pass |
| AC-4 | Texture figures unchanged | Primary gate: 76.42/321.00/0.238 vs caps 80/322/0.5 — unchanged, exit 0. | pass |

## Commits

| Commit | Description |
| --- | --- |
| `9c8b9f7f` | `test(hub): assert all 25 tiles and shelf plaques fit the 1024x768 canvas` (RED test) |
| `d8e01e10` | `fix(hub): flow 25th tile onto a fifth row and recenter the wide board` |
| `a0157764` | `test(hub): update wide-grid goldens for the recentered five-row board` |

## Files changed

Within Touches:
- `src/__tests__/scenes/hubScene.test.ts` — bounds test extended to all 25 tiles + 25 plaques; geometry and e2e test titles refreshed.
- `src/game/hub/hubGridConstants.ts` — `GRID_ROWS = 5` plus updated layout comment.
- `src/game/hub/gridLayout.ts` — origin/geometry comments updated.
- `src/game/hub/gridBuilder.ts` — build comments updated.
- `src/__tests__/game/hubGrid.test.ts` — origin/position goldens `[97,177] → [97,108]`, `[595,591] → [595,522]`; titles/comments refreshed.

Outside Touches (recorded as deviations):
- `src/__tests__/game/hub/gridLayout.test.ts` — origin/centers goldens updated.
- `src/__tests__/game/hub/groupLayout.test.ts` — stale "above the grid's first row" claim removed from title/comment.
- `src/game/hub/groupLayout.ts` — stale "clear of … the grid's first row at 119" comment removed.

## Deviations

| File | Reason |
| --- | --- |
| `src/__tests__/game/hub/gridLayout.test.ts` | Hardcoded `wideGridOrigin` and tile-centre goldens had to change with the recentered 5-row board; file lives in the `hub/` subdirectory, outside the literal `src/__tests__/game/hub*.test.ts` glob. |
| `src/__tests__/game/hub/groupLayout.test.ts` | Test title/comment asserted the chip row was above the grid's first row, which is no longer true after recentering; assertion values unchanged. Same subdirectory reason. |
| `src/game/hub/groupLayout.ts` | Source comment on `CHIP_ROW_CENTER_Y` repeated the same now-false "clear of the grid's first row at 119" claim; one-line comment fix, no behavior change. |

## Evidence paths

- Phase report: `conductor/tracks/20261128-wide-hub-grid-overflow/verification/phase-1.md`
- RED run: 25th tile bottom 787 > 768 at `src/__tests__/scenes/hubScene.test.ts:758` (exit 1).
- GREEN run: 164 files / 3529 tests passed (exit 0).

## Notes for the primary agent

1. **Full gate needs a primary-run.** The exact verification command was denied by
   shell permissions (`Permission denied: shell`), most likely because it contains
   `&&` chains. I did not retry, rephrase, split it, or route it through another
   tool, per the phase rules. Please run it and hand back the output; if green,
   AC-3/AC-4 can be marked pass in this report by the primary's state commit.
2. **Chip-band overlap caveat.** A 5-row board of 116px tiles (580px of tiles +
   88px of gaps = 668px) recenters at `startY = 50`, so row 0 spans y 50–166 while
   the chip row spans y 24–108 and the avatar/Settings band spans y 20–116.
   The controls are created *after* the grid in `HubScene.create()`, so they render
   on top and remain tappable, but the chip row visually overlaps the top of row 0
   tiles and tile centres (y=108) sit on the chip row's bottom edge. Fitting 5 rows
   *below* the old 119px first-row top is mathematically impossible without
   shrinking tiles (580px of tiles > 530px available), so this is a direct
   consequence of the fixed "5th-row flow, no tile resizing" decision. Flagging it
   as a possible follow-up (e.g., relocating the chip band) rather than silently
   changing layout outside this phase's scope.
3. Remaining stale prose outside Touches: `src/game/hubGrid.ts` (lines 56, 76, 314)
   and `src/game/hubPaging.ts` (lines 9, 39, 66) still say "6x4 wide grid" in
   comments only — no runtime dependency on row count. Left untouched to keep the
   phase surgical; candidate for a docs-only follow-up.

## Primary verification

- Command (exact phase Verification gate): `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- Exit code: 0 (full output in the primary transcript).
- Results: check 390 files clean; typecheck clean; 164 files / 3529 tests pass;
  coverage stmts 96.93 / branches 90.33 / funcs 96.35 / lines 98.09 (gates
  90/85/88/95); build 500 modules, entry 193.88 kB (gzip 48.60 kB); bundle PASS;
  module-size PASS with 2 pre-existing warnings (e2eBridgeTypes.ts, RepeatMachineScene.ts);
  textures 76.42/321.00/0.238 vs 80/322/0.5 PASS; PWA 16/0 PASS; docs 5/0 PASS.
- Deviations accepted: `src/__tests__/game/hub/gridLayout.test.ts`,
  `src/__tests__/game/hub/groupLayout.test.ts`, `src/game/hub/groupLayout.ts`
  (golden updates + one-line stale-comment fix, smallest necessary change).
- Follow-up captured: roadmap RM-12 (chip band overlaps row 0 visually, y 50–166
  vs chips y 24–108; controls render on top and stay tappable — direct consequence
  of the fixed no-resize decision).
