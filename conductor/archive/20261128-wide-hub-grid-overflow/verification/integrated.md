# Integrated Verification — 20261128-wide-hub-grid-overflow

- **Track:** 20261128-wide-hub-grid-overflow — Fix wide hub grid overflow with 25th game tile
- **Date:** 2026-11-28
- **Branch:** `fix/20261128-wide-hub-grid-overflow`
- **Head commit:** `38115490`
- **Result:** **verified** — complete gate green on the final tree.

## Gate (exact command, exit 0)

`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`

| Layer | Result |
| --- | --- |
| check (biome) | 390 files, no fixes |
| typecheck | clean (incl. e2e project) |
| tests | 164 files / 3530 tests pass |
| coverage | stmts 96.94 / branches 90.36 / funcs 96.35 / lines 98.09 (gates 90/85/88/95) |
| build | 500 modules, entry 193.88 kB (gzip 48.60 kB) |
| bundle | entry 189.3 kB ≤ 200 kB PASS |
| module-size | PASS, 2 pre-existing warnings (e2eBridgeTypes.ts, RepeatMachineSceneScene) |
| textures | 76.42/321.00/0.238 vs 80/322/0.5 PASS, unchanged |
| PWA | 16/0 PASS |
| docs | 5/0 PASS (8 numeric-only 3529→3530 refreshes for the new test) |

## E2E layer

`pnpm exec playwright test --list`: 59 tests in 22 files, listed with no errors.
Full browser runs are CI's job; no journey was added or needed (unit bounds
tests cover the fix; existing journeys unaffected).

## Cross-phase summary

- Phase 1 (`2321bea1`): GRID_ROWS 4→5, wide origin recentered (25,50); all 25
  tiles + shelf plaques on-canvas at 1024×768. Evidence: verification/phase-1.md.
- Phase 2 (`13d35778`): narrow/paged path proven unaffected (new 25-tile bounds
  test green on first run); documented no-op, no production change. Evidence:
  verification/phase-2.md.
- Follow-up captured: roadmap RM-12 (chip band visually overlaps row 0;
  controls render on top and stay tappable).

## AC coverage

| AC | Status |
| --- | --- |
| AC-1 bounds unit test, RED→GREEN | pass (phase-1.md) |
| AC-2 narrow bounds pass | pass (phase-2.md) |
| AC-3 full gate green | pass (this report) |
| AC-4 textures unchanged | pass (this report, 321.00 MiB) |

All FR-1–FR-4 and NFR-1–NFR-3 verified; no deviations beyond recorded goldens
and the numeric-only docs refresh.
