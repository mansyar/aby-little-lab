# Review: HubScene Decomposition

- **Track:** `20261027-hubscene-split`
- **Type:** `refactor`
- **Branch:** `refactor/20261027-hubscene-split`
- **Range:** `e7d6b90b..8800185a`
- **Date:** `2026-10-27T14:20:00+11:00`
- **Verdict:** `PASS`

## Summary

The HubScene decomposition is a faithful five-slice extraction: 821 → 382
lines in `HubScene.ts`, five focused modules under `src/game/hub/`, full
8-command gate green on the final code. The independent reviewer found zero
findings across all four per-phase diffs plus the integration pass. The two
known size deviations (HubScene 382 vs ~320, hubPrewarm 275 vs 200) read as
acceptable single-concern remainders, not correctness gaps. Ready to ship.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| lint | `pnpm check` | pass | review-time re-run, 270 files clean |
| typecheck | `pnpm typecheck` | pass | review-time re-run, no errors |
| test | `pnpm test -- --run` | pass | 131 files / 2,829 tests, identical-code gate (`verification/phase-4.md`) |
| coverage | `pnpm test:coverage` | pass | 97.87 / 92.16 / 97.01 / 98.76 vs 95 / 88 / 85 / 90 |
| build | `pnpm build` | pass | precache 59 entries |
| bundle | `node scripts/validate-bundle.js` | pass | shell 150.0 kB ≤ 200 kB |
| pwa | `node scripts/validate-pwa.js` | pass | 16/16 |
| docs | `node scripts/validate-docs.js` | pass | 6/6 |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1.T1 | `artGroups.test.ts` + hubScene 48/48 | covered |
| FR-2 | P2.T1 | `gameLaunch.test.ts` 10/10 + hubSceneLoad suite | covered |
| FR-3 | P3.T1 | `hubPrewarm.test.ts` 10/10 | covered |
| FR-4 | P4.T1 | `playTimeUi.test.ts` + full suite | covered |
| FR-5 | P4.T1 | `hubAttract.test.ts` + full suite | covered |
| NFR-1 | all phases | full suite 2,829 green | covered |
| NFR-2 | all phases | bundle shell 150.0 kB | covered |
| NFR-3 | all phases | helper sizes + HubScene 382 | partial (see notes) |
| NFR-4 | all phases | coverage + pinned suite unmodified | covered |
| AC-1 | P1.T2 | suite green, exact imports | covered |
| AC-2 | P2.T2 | 10/10 + integration suites | covered |
| AC-3 | P3.T2 | module tests + AC-1 hold | covered |
| AC-4 | P4.T2 | modules ≤200; HubScene 382 vs ~320 | partial |
| AC-5 | P4 gate | structural-only diff + suite green | covered |

## Findings

### Critical

- none

### High

- none

### Medium

- none

### Low

- none

## Overrides

- none

## Plan compliance

All four phases carry `Result`, `Checkpoint`, and `Evidence`; all 8 tasks
marked `[x]` were implemented (verified per-phase by the primary, including
independent re-runs of every targeted check). No task dropped. The final diff
stays within the union of phase `Touches` except reported, evidence-backed
deviations: the source-guard retarget (P1), the lazy registry thunk + compat
getters (primary fixes), and six validator-mandated doc-count lines. No
review-fix phase was needed.

## Out of scope

- none discovered.

## Debt

- NFR-3 / AC-4 size note (not a finding): `HubScene.ts` is 382 lines vs the
  ~320 spec target and `hubPrewarm.ts` is 275 lines vs the 200-line helper
  target. Both read as single-concern lifecycle/delegation remainder; the
  reviewer explicitly notes further splitting would be out-of-scope refactor.
  No issue filed — accepted as the track's end state, recorded here.
- No issues created: zero findings at or above `min_severity: medium`.

## Doc sync

`updated` — `conductor/product.md` changelog carries the HubScene
Decomposition entry; suite-count lines in README/TDD/perf-baseline refreshed
to 131/2,829. No tech-stack or guideline changes (no stack/behavior change).

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | PASS | 0 | 0 | 0 | 0 | 0 |
