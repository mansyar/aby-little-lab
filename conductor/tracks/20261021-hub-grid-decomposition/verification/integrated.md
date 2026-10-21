# Integrated Verification — Hub Grid Decomposition

- **Track:** 20261021-hub-grid-decomposition
- **Date:** 2026-10-21
- **Branch:** `refactor/20261021-hub-grid-decomposition`
- **Base:** master @ `9976057d` — **Range:** `9976057..c40d39c` (code: `9976057..c40d39c` minus conductor/)

## Method

The full verification gate ran on the final code tree during Phase 4
acceptance (commits after the gate touch only `conductor/**` — verified via
`git status` + commit contents), so the Phase 4 runs are the integrated
verification runs. The full `verify_phase` chain was exercised segment by
segment with captured exit codes.

## Results

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | 244 files; 2 pre-existing findings only (biome.json schema info; musicalMemoryScene.test.ts:294 noNonNullAssertion) — both predate this track |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| unit | `pnpm test -- --run --maxWorkers=2` | 0 | 116 files / 2,429 tests (2,411 at track base + 18 new module tests) |
| coverage | `pnpm test:coverage -- --maxWorkers=2` | 0 | S 97.88 / B 91.52 / F 96.42 / L 98.67 vs gates 95/88/85/90 |
| build-artifact | `pnpm build` | 0 | green; shell `index-agnQ17lN.js` 133.29 kB |
| artifact | `node scripts/validate-bundle.js` | 0 | shell ≤ 200 kB gate holds |
| smoke | `node scripts/validate-pwa.js` | 0 | all PWA checks pass |

**Flakiness note:** three full-suite runs on the default worker pool hit 5,000 ms
timeouts in unrelated files (hubEngagement, takeAwayLogic — both pass in
isolation and in every capped run). Machine-load contention, not a regression;
the gate used `--maxWorkers=2`, under which the suite is stable (twice green).

## Acceptance criteria

| ID | Criterion | Status |
| --- | --- | --- |
| AC-1 | Each of the four concerns lives in its own `src/game/hub/` module | Satisfied — gridLayout.ts (layout/entrance), pageBoard.ts (paging/swipe/dots/slide), stickerShelf.ts (shelf/sparkle/burst/slots), timeUpDim.ts (lock/restore), gridBuilder.ts (construction/teardown/flip) |
| AC-2 | hubGrid.ts ≤ 200 lines, public surface unchanged, HubScene imports only hubGrid | Satisfied — 200 lines (from 773); all 2,429 tests pass with assertions intact; HubScene.ts:9 unchanged |
| AC-3 | Approved cleanups applied and itemized by class | Satisfied — per-phase evidence itemizations (named constants: BOB_SETTLE_DELAY, PAGE_DOT_COLOR; 2 dead-code removals; ~10 comment-accuracy edits; renames confined to moved code; no timing dedup needed) |
| AC-4 | Full verify_phase gate passes | Satisfied — table above |

## Notes

- The mock-registry append-only constraint (learned Phase 2) is documented in
  the phase evidence and respected by the test suite.
- The 2 pre-existing Biome findings are out of scope for this track (review
  will confirm).
