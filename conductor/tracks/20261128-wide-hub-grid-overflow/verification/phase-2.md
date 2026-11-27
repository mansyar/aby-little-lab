# Phase 2 Verification — Narrow-layout check and conditional rebalance

- **Track:** 20261128-wide-hub-grid-overflow — Fix wide hub grid overflow with 25th game tile
- **Phase:** 2 — Narrow-layout check and conditional rebalance
- **Date:** 2026-11-28
- **Branch:** `fix/20261128-wide-hub-grid-overflow`
- **Base commit:** `cd1ca339`
- **Head commit:** `c5b986c9`
- **Result:** **blocked** — the full verification command was rejected by shell permissions before execution. The new narrow bounds test is green; the primary must run the gate and record its output.

## What changed

`src/__tests__/scenes/hubScene.test.ts` gains one scene-level test, **"keeps all 25 paged tiles and their shelf plaques inside the 1024×768 canvas"**, in the `HubScene paged grid (narrow viewports)` describe block. It walks all three pages (10 + 10 + 5 tiles) by firing the page-dot handlers, and asserts, for every tile and every dashed empty-slot plaque:

- top/bottom within `0…768`
- left/right within `0…1024`

Incoming pages are created one canvas-width to the right (`slideFrom = direction × canvasWidth`) and slide in; the mocked slide timer leaves them at their spawn x, so the test subtracts that offset to assert the settled geometry rather than the transient tween position.

No production code was changed.

## Commands table

| Layer | Command | Exit | Summary |
|---|---|---|---|
| Unit (test-first) | `pnpm test -- --run src/__tests__/scenes/hubScene.test.ts -t "keeps all 25 paged tiles"` | 0 | 164 test files / **3530** tests passed. Vitest ignored the `-t` filter because pnpm forwarded the extra `--`, so the whole suite ran; the count rose from the Phase-1 baseline of 3529 to 3530, confirming the new test executed and passed on its first run. |
| Git | `git add src/__tests__/scenes/hubScene.test.ts` | 0 | Staged the new test. |
| Git | `git commit -m "test(hub): assert all 25 paged tiles and plaques stay in canvas"` | 0 | Created `c5b986c9`. |
| Git | `git log --oneline --max-count=4 HEAD` | 0 | Confirmed base `cd1ca339`, head `c5b986c9`. |
| Verification (all layers) | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | **denied** | `{"error":{"type":"permission.rejected","message":"Permission denied: shell"}}`. No exit code; command never executed. Per the brief it was not retried, rephrased, split, or worked around. The primary must run it. |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-2 / AC-2 | Narrow viewports render all 25 tiles in-canvas; bounds assertions pass for all tiles. | New test covers tiles 1–25 across pages 0/1/2, including incoming-slide offsets, plus one dashed plaque per tile. Green on first run: no narrow violation exists. | pass (unit); full gate pending |
| FR-2 (P2.T2) | Rebalance applied only where the overflow rule interacts; otherwise no-op with evidence. | Code inspection: `GRID_ROWS`, `wideGridOrigin`, and `wideTileCenter` are used only by the wide branches in `src/game/hub/gridBuilder.ts` and `src/game/hub/gridShelf.ts`. Narrow geometry comes from `src/game/hubPaging.ts` → `pagedTilePosition` with its own constants (176×196 tiles, 20px spacing, 5 columns × 2 rows), yielding x bounds 32…992 and y bounds 178…590; plaques centred at y 356/572 with radius 15 (max edge 587). `WIDE_TILE_HEIGHT = 116` is a tile-height constant, not a row count, and was untouched by Phase 1. Conclusion: **no conditional rebalance required** — the narrow path never consumes Phase-1-touched geometry. No production file was modified. | pass (no-op) |
| FR-4 | Full verification gate green. | Exact command denied by shell permissions (see commands table). | blocked |

## Evidence paths

- `src/__tests__/scenes/hubScene.test.ts` — new narrow 25-tile bounds test (commit `c5b986c9`)
- `conductor/tracks/20261128-wide-hub-grid-overflow/verification/phase-1.md` — wide-grid baseline (3529 tests, coverage/artifact thresholds)
- `src/game/hub/gridLayout.ts`, `src/game/hub/gridBuilder.ts`, `src/game/hub/gridShelf.ts`, `src/game/hubPaging.ts` — inspected to establish the wide/narrow geometry split

## Deviations

None. All changes stayed inside the `Touches` paths (one test file) plus this evidence file. No product or design decision was needed.

## Notes for the primary

- P2.T1 and P2.T2 are complete: the narrow path is demonstrably unaffected by Phase 1, so the test-first check passed on its first run rather than going red.
- The full gate is the only outstanding item. Run the exact command from the brief and append its per-layer output/exit codes here before recording the phase as verified.
- Coverage thresholds from the track config remain in force: lines 95 / functions 88 / branches 85 / statements 90; Phase 1 measured 96.93 / 90.33 / 96.35 / 98.09.
