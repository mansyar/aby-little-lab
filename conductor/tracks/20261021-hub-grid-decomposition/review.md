# Review — Hub Grid Decomposition

- **Track:** 20261021-hub-grid-decomposition
- **Type:** refactor
- **Branch:** refactor/20261021-hub-grid-decomposition
- **Range:** `9976057..c40d39c` (excluding `conductor/`)
- **Date:** 2026-10-21
- **Verdict:** PASS (round 2; all round-1 findings fixed in Phase R1)

## Summary

The decomposition is faithful — SwipeGesture, swipe-region bounds
(32/992/178/590), page-dot math, shelf Y math, entrance/stagger timing, time-up
lock values (0.45/0.97), and every reduced-motion branch verify against the base
file, and `flipTo`'s Phase-4 relocation to `gridBuilder.ts` is a line-for-line
move. No runtime import cycles exist (hub modules take `HubGrid` via type-only
imports; `HubScene.ts:9` unchanged), `hubGrid.ts` is exactly 200 lines, and
`hubGrid.test.ts` changes are purely additive — the reduced-motion
registry-count rewrite is sound (per-object destroy + exact +10 delta, strictly
stronger than the count it replaced). One new test's destroy assertions are
vacuous, plus four Low nits.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| static | `pnpm check` | pass | 244 files; 2 pre-existing findings only (out of scope) |
| static | `pnpm typecheck` | pass | tsc clean |
| unit | `pnpm test -- --run --maxWorkers=2` | pass | 116 files / 2,429 tests |
| coverage | `pnpm test:coverage -- --maxWorkers=2` | pass | 97.88 / 91.52 / 96.42 / 98.67 vs gates 95/88/85/90 |
| build-artifact | `pnpm build` | pass | shell 133.29 kB |
| artifact | `node scripts/validate-bundle.js` | pass | shell ≤ 200 kB |
| smoke | `node scripts/validate-pwa.js` | pass | all checks pass |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1 (gridLayout, hubGridConstants), P2 (pageBoard), P3 (stickerShelf, timeUpDim), P4 (gridBuilder) | 6 module files under `src/game/hub/` | covered |
| FR-2 | P4 | hubGrid.ts exactly 200 L; HubScene.ts:9 imports only hubGrid; 2,429 tests green | covered |
| FR-3 | P1–P4 ledgers | BOB_SETTLE_DELAY, PAGE_DOT_COLOR, 2 dead-code removals, comment edits verified in diffs (F5: private→public widening not ledgered) | covered |
| FR-4 | P1–P3 | module test suites + orchestrator edge tests (F1: one vacuous loop) | covered |
| NFR-1 | P4 | shell 133.29 kB ≤ 200 kB | covered |
| NFR-2 | all phases | coverage above gates; behavior parity | covered |
| NFR-3 | P1–P3 | reduced-motion tests in all 4 module suites; PAGE_DOT_HIT 64; swipe region byte-pinned | covered |
| AC-1..AC-4 | P1–P4 | integrated.md acceptance table matches code | covered |

## Findings

### Critical

None.

### High

None.

### Medium

None — F1 was **fixed in Phase R1 (`f0c485c`)**: the just-earned
page-transition test now collects the page-1 shelf after `flipTo(1)` with a
non-empty guard, and asserts each collected sticker's destruction by the
`flipTo(2)` slide-out timer; comments updated to match.

### Low

- **F2** — **Fixed in Phase R1 (`f0c485c`)**: field doc corrected to "The
  textless page dots (one per page; paged mode only)." (1:1 swap, 200-line
  count preserved).
- **F3** — **Fixed in Phase R1 (`f0c485c`)**: shutdown test earns `how-many`
  (page 1) with an explicit non-empty `sticker_` assertion; `destroy()` now
  covers sticker-image destruction.
- **F4** — **Fixed in Phase R1 (`f0c485c`)**: phase-4.md evidence corrected to
  317 lines.
- **F5** — **Fixed in Phase R1 (`f0c485c`)**: FR-3 ledger gained the
  private→public field-widening line.

## Overrides

None.

## Plan compliance

All 4 phases verified with matching checkpoints (P1 c8f3b33, P2 d16d4b7,
P3 bb7ff5e, P4 c40d39c). Deviations documented, not silent: primary execution
replacing shell-denied subagents (Phases 2–4), flipTo relocation to gridBuilder
(Phase 4), animateJustEarned setScale consolidation (Phase 3). Spec exclusions
honored: hubPaging.ts, hubTiles.ts, HubScene.ts untouched. Dead-code sweep
verified non-load-bearing (reducedMotion local, stickerX alias). No task drops.

## Out of scope

- The two pre-existing Biome findings (biome.json schema info;
  musicalMemoryScene.test.ts noNonNullAssertion) predate this track.
- Machine-load test flakiness (5,000 ms timeouts in unrelated files on the
  default worker pool, stable under `--maxWorkers=2`) predates this track.

## Debt

None — F1–F5 fixed in Phase R1 (`f0c485c`).

## Doc sync

none

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | PASS WITH FINDINGS | 0 | 0 | 1 | 4 | 0 |
| 2 | PASS | 0 | 0 | 0 | 0 | 5 |
