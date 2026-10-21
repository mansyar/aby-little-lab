# PR: Hub Grid Decomposition

## Summary

Decomposed the 773-line `src/game/hubGrid.ts` god file into a thin 200-line
orchestrator plus six focused concern modules under `src/game/hub/`, with zero
user-visible behavior change. All 2,429 existing tests pass with their
assertions intact; 18+2 new module/edge tests cover the extracted contracts.

## Track

- **ID:** 20261021-hub-grid-decomposition (refactor, medium)
- **Spec:** [spec.md](./spec.md) · **Plan:** [plan.md](./plan.md) · **Review:** [review.md](./review.md)

## What happened

| Phase | Goal | Result | Checkpoint |
| --- | --- | --- | --- |
| 1 | Concern inventory + hub module foundation + grid layout/entrance-bob extraction | verified | `c8f3b33` |
| 2 | Paged phone board extraction (swipe state machine, dots, slides) | verified | `d16d4b7` |
| 3 | Sticker shelf + time-up dimming extraction | verified | `bb7ff5e` |
| 4 | Orchestrator slim-down to ≤200 lines + full gate | verified | `c40d39c` |
| R1 | Review fixes (F1–F5) | verified | `f0c485c` |

New modules: `hubGridConstants.ts`, `gridLayout.ts`, `pageBoard.ts`,
`stickerShelf.ts`, `timeUpDim.ts`, `gridBuilder.ts`. `hubPaging.ts`,
`hubTiles.ts`, and `HubScene.ts` are untouched; HubScene still imports only
`hubGrid.ts` and the public `HubGrid` surface is unchanged.

## Requirements

- [x] FR-1 — concern modules under `src/game/hub/`
- [x] FR-2 — public surface preserved; hubGrid.ts ≤ 200 lines (exactly 200)
- [x] FR-3 — approved cleanups (named constants, dead-code removals, comment accuracy, confined renames) itemized in evidence
- [x] FR-4 — module unit tests (gridLayout 11, pageBoard, stickerShelf 11, timeUpDim 4, orchestrator edge tests)
- [x] NFR-1 — shell bundle 133.29 kB ≤ 200 kB
- [x] NFR-2 — behavior preservation; coverage 97.88 / 91.52 / 96.42 / 98.67 vs gates 95/88/85/90
- [x] NFR-3 — reduced-motion, touch-target and single-finger constraints preserved and tested
- [x] AC-1..AC-4 — see verification/integrated.md

## Verification

| Layer | Command | Result |
| --- | --- | --- |
| static | `pnpm check` | pass (2 pre-existing findings only) |
| static | `pnpm typecheck` | pass |
| unit | `pnpm test -- --run` | pass — 116 files / 2,429 tests |
| coverage | `pnpm test:coverage` | pass — 97.88/91.52/96.42/98.67 |
| build-artifact | `pnpm build` | pass — shell 133.29 kB |
| artifact | `validate-bundle.js` / `validate-pwa.js` | pass / pass |

Note: three full-suite runs on the default worker pool hit 5,000 ms timeouts in
unrelated files under machine load (both pass in isolation and in every
`--maxWorkers=2` run); pre-existing, not introduced by this track.

## Review

- **Verdict:** PASS (round 2)
- **Rounds:** 2 — round 1 PASS WITH FINDINGS (1 Medium, 4 Low); all 5 fixed in Phase R1 (`f0c485c`)
- **Fixed:** F1 vacuous destroy-loop in the just-earned page-transition test
  (now collects the page-1 shelf after `flipTo(1)` and asserts slide-out-timer
  destruction per object); F2 page-dots doc; F3 shutdown test now covers a
  non-empty sticker list; F4/F5 evidence corrections
- **Accepted/deferred:** none

## Deviations and risks

- Phases 2–4 and R1 executed by the primary after repeated subagent shell
  denials (user-approved for Phase 4; same precedent applied to R1).
- `flipTo` moved to `gridBuilder.ts` in Phase 4 to reach the ≤200-line target
  without violating the module boundary (verified line-for-line faithful).
- `deps`/`entranceIndex`/`swipes` widened private→public so concern-module
  functions operate on the orchestrator instance (documented in the FR-3
  ledger; no behavior change).
- Residual risk: none identified — behavior-neutral, no schema/data changes.

## Follow-ups

None from review. (Out-of-scope observation: a future track could pass narrow
structural interfaces instead of widened public fields to re-encapsulate the
orchestrator.)

## Rollback

`git revert --no-edit f0c485c` (reverts the review-fix delta), or revert the
squashed phase commits in reverse order (`c40d39c`, `bb7ff5e`, `d16d4b7`,
`c8f3b33`). No migrations or data changes; rollback is behavior-safe.
