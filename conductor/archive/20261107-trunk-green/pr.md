## Summary

Makes the test suite's verdict independent of the calendar. A fixture date is now derived from an explicit clock or rejected by a guard, so no test can pass or fail because of the day it runs on. Along the way it removed the last two ambient-clock fixtures and gave the two 22-scene sweeps a budget that reflects what they actually cost.

## Track

- **ID:** `20261107-trunk-green`
- **Type:** chore
- **Spec:** [`conductor/archive/20261107-trunk-green/spec.md`](conductor/archive/20261107-trunk-green/spec.md)
- **Plan:** [`conductor/archive/20261107-trunk-green/plan.md`](conductor/archive/20261107-trunk-green/plan.md)
- **Review:** [`conductor/archive/20261107-trunk-green/review.md`](conductor/archive/20261107-trunk-green/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Audit and convert the clock stand-ins | Every bare date literal classified; clock stand-ins derived from an explicit clock | verified | `f08e956c` | 29 literals / 31 quoted values: 5 were stand-ins, 24 were payload data. `playTimeLogic.test.ts` added to the sweep beyond the brief |
| 2: Guard and style rule | The suite rejects the pattern; the rule is written down | verified | `8ab35c1a` | Guard denied `edit` on the `<protect>`-wrapped style guide, so the primary applied that patch. The gate exposed a pre-existing timeout flake in two 22-scene sweeps |
| 3: Timeout headroom for the 22-scene sweeps | A green gate means green code, not a lucky scheduler | verified | `1eda5fc2` | Added after Phase 2's gate failed twice on 30-31 s sweep tests against a 30 s budget; approved before implementing |
| Review fixes | Close all ten findings | verified | `a3be4e13` | The missing twelve-months-forward run found a real remaining defect: `playTimeUi` derived `TODAY` from the ambient clock at module load |

## Requirements

- [x] `FR-1` — every date literal classified with file, line and verdict (evidence: `verification/date-literal-audit.md`)
- [x] `FR-2` — a guard test rejects a bare quoted day key assigned to `lastUsedDate` (test: `src/__tests__/guard/fixture-clock.test.ts`)
- [x] `FR-3` — every clock stand-in derives from an explicit clock (`PlayTimeIndicator`, `playTimeUi`, `storage`, `gameLaunch`, `playTimeLogic`)
- [x] `FR-4` — the rule is in `conductor/code_styleguides/typescript.md` §6
- [x] `FR-5` — the guard runs inside the existing `pnpm test` selection; no new script or CI step
- [x] `NFR-1` — the guard runs in 30-52 ms with no network, timers or Phaser
- [x] `NFR-2` — as amended: test tree, style guide, the three count-bearing living documents and Conductor artifacts only; no production source
- [x] `NFR-3` — guard reads text only; independent of host date, timezone and locale
- [x] `NFR-4` — no existing test removed or skipped; coverage gates unchanged
- [x] `AC-1`..`AC-6` — see `verification/integrated.md`

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| unit | `CI=true pnpm test -- --run` | pass — 132 files / 2,833 tests | `conductor/archive/20261107-trunk-green/verification/integrated.md` |
| unit | full suite with `Date` frozen at 2027-11-07 | pass — 132 files / 2,833 tests | `conductor/archive/20261107-trunk-green/verification/review-fixes.md` |
| coverage | `pnpm test:coverage` | pass — statements 97.87 / branches 92.16 / functions 97.01 / lines 98.76 | same |
| lint | `pnpm check` | pass — 271 files | same |
| types | `pnpm typecheck` | pass | same |
| build | `pnpm build` | pass | same |
| bundle artifact | `node scripts/validate-bundle.js` | pass — shell 150.0 kB ≤ 200 kB | same |
| PWA artifact | `node scripts/validate-pwa.js` | 16 passed / 47 chunks precached | same |
| documents | `node scripts/validate-docs.js` | 5 passed | same |

## Review

- **Verdict:** `PASS WITH FINDINGS`
- **Rounds:** 1
- **Fixed:** 10 findings (6 medium, 4 low)
- **Accepted/deferred:** 0

## Deviations and risks

- **Three living documents changed, against NFR-2 as written.** `scripts/validate-docs.js` derives the suite counts from a `vitest list` run and fails any document whose claim disagrees, so adding a test file made the counts mandatory. NFR-2 amended in the spec rather than the requirement being quietly broken.
- **Phase 3 was added mid-track.** The coverage gate failed twice on two 22-scene sweeps at 30-31 s against a 30 s budget; a control run without the guard was worse, so the guard was not the cause. Approved before implementation, and the two tests got 60 s budgets rather than the global default being raised.
- **Media is omitted.** The change has no visual surface; `pr.media: always` has nothing to show. The evidence files carry the command output instead.
- **Residual risk.** A 60 s budget absorbs a genuine 2× regression in a 22-scene boot. The measured baseline (20-23 s isolated, 30-31 s under coverage) is recorded beside each budget so the next slowdown reads as 40 s, not only at the deadline.

## Follow-ups

- none

## Rollback

```bash
# Merge commit
git revert --no-edit -m 1 <merge-commit>

# Squash commit
git revert --no-edit <squash-commit>
```

No migration and no data change: the track touches tests, the TypeScript style guide, three living documents, and Conductor artifacts. Reverting restores the previous fixtures; nothing outside the repository depends on it.
