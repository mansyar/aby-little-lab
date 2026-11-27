## Summary

Surface the current adaptive difficulty spread on the Progress Overview: assessed adaptive games, easier/classic/harder counts, and explicit mixed, all-classic, insufficient-data, and adaptive-off states. The readout uses the viewed profile's recent answers, appears only on the Overview, preserves per-game pages and existing behavior, and does not claim longitudinal movement.

Closes RM-6.

## Track

- **ID:** 20261127-progress-band-movement
- **Type:** feature
- **Priority:** high
- **Pull request:** [#105](https://github.com/mansyar/aby-little-lab/pull/105)
- **Spec:** [spec.md](conductor/archive/20261127-progress-band-movement/spec.md)
- **Plan:** [plan.md](conductor/archive/20261127-progress-band-movement/plan.md)
- **Review:** [review.md](conductor/archive/20261127-progress-band-movement/review.md)

## What happened

| Area | Change |
| --- | --- |
| Summary logic | Added a pure deterministic adaptive-spread helper covering only the 22 adaptive games with at least `MIN_SAMPLE` recent taps. |
| Overview | Replaced the static adaptive note on page 0 with the current spread and four explicit states; per-game pages retain the static note. |
| Narrow layout | Wrapped only the Overview replacement line to the existing card width and kept it centered. |
| Tests | Added helper and component regressions for counts, states, profile switching, malformed/short windows, non-adaptive exclusions, and narrow-card styling. |
| Docs | Updated PRD, TDD, changelog, README, perf baseline, and roadmap truth without claiming the unmeasured two-week target. |
| Scope | No storage/schema/migration/dependency/asset/network change. |

## Requirements

- FR-1–FR-9: current spread states, viewed-profile behavior, Overview-only replacement, robust input handling, current-truth docs, and living figures.
- NFR-1–NFR-5: no storage/schema/dependency/asset/PII change; pure deterministic helper; unchanged game behavior; small focused module; exact gate evidence.
- AC-1–AC-9: all acceptance cases covered by tests, docs validation, and narrow-viewport visual evidence.

## Verification

Final configured gate: **PASS**, exit 0.

- Biome: 378 files checked, no fixes.
- TypeScript: application and E2E clean.
- Vitest: **159 files / 3,454 tests passed**.
- Coverage: **97.12% statements / 91.05% branches / 96.4% functions / 98.25% lines**.
- Build: 493 modules; only the pre-existing Phaser chunk advisory.
- Bundle: shell `index-ljU3tdMP.js` = **196.3 kB**, within budget.
- Module size: **zero warnings**; `ProgressOverlay.ts` is 399 lines.
- Texture guard: passed.
- PWA guard: **16 passed / 0 failed**.
- Docs guard: **5 passed / 0 failed**.
- Whitespace/scope: full review range and working tree clean.

## Media

![Progress Overview at 844×390 showing 3 games assessed, 1 easier, 1 classic, and 1 harder](../../../.conductor/media/20261127-progress-band-movement/progress-band-overview.png)

## Review

- **Verdict:** PASS
- **Rounds:** 2
- **Fixed:** 3 findings — non-adaptive game exclusion, narrow-card wrapping, and Phase 2 evidence EOF whitespace.
- **Accepted debt:** none; strict mode required all findings to be fixed.

## Deviations and risks

- One existing `SettingsPanel` test assertion was minimally updated to the new Overview copy; no production code changed there.
- A frozen Phase 2 checkpoint retains its historical EOF blank line. The current file and full review range are clean; history was not rewritten.
- The current spread is not persisted band-transition history and does not measure the two-week longitudinal target.
- The final gate had earlier tool-timeout/living-doc failures; all were resolved before the final green run.

## Follow-ups

None. Longitudinal movement remains a separate product question, not hidden scope in this track.

## Rollback

Revert the three feature/docs checkpoints after merge:

```bash
git revert --no-edit 72f95f55 40db0123 df98e324
```
