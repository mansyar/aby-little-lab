# Review - Browser Journey Suite

- **Track:** `20261107-release-e2e`
- **Reviewed range:** `4bcb38a1aac84340a99fa1c34bf3550ee716baf7..HEAD` (base `master` to the doc-sync commit)
- **Rounds:** 1
- **Verdict:** changes required, then resolved

## Findings

| ID | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| F1 | High | AC-7 and FR-7 said the nudge appears *at the daily cap*, but `isNearLimit` requires remaining minutes `> 0`, so the cap locks and only the last five minutes nudge. `time-limit.spec.ts` asserts the real behaviour (`nudging === false` at the cap), and plan task `P4.T2.1` was ticked while describing a test that does not exist. | Spec amended: FR-7 and AC-7 now state the cap as a lock and the nudge as the near-limit path, with a dated amendment explaining that the earlier wording assumed behaviour the product never had (`product.md` §3.2 always described a lock). `P4.T2.1` reworded to match, and the journey verifies both paths. |
| F2 | High | The `Browser Journeys` job was not a required status check, so a red suite still merged, while the goal said a broken game fails CI before merge. | **Fixed at the source, and the premise was wrong**: `master` had *no* branch protection at all (`gh api .../branches/master/protection` returned 404), so even `Quality Gates` was advisory. Protection is now configured with `Quality Gates` and `Browser Journeys` as required contexts (`strict: false`, force-pushes and deletions disallowed, admins still exempt). Recorded in the PR body because it is a repository setting, not a file. |
| F3 | Medium | `integrated.md`'s Browser row is a local run; AC-9 wants the job green on this track's own PR, and NFR-2's five minutes is unmeasured on CI hardware. | Row annotated as a local run, AC-9 left to this track's PR, and the job's first execution is recorded on the PR rather than claimed in evidence. |
| F4 | Medium | `completedRounds()` fell back to `0`-the-same-value-`launch-all`-asserts, unlike every other accessor's impossible sentinel, so a scene that stopped publishing a counter would pass. | Falls back to `-1`; doc comment explains the reasoning; the unit test that asserted `0` now asserts `-1`, and the counter test seeds `0` explicitly. |
| F5 | Low | `ProfileChip` cleared `pressed` on `pointerout` while press feedback shrinks the chip to 0.95 on `pointerdown`, so an edge press cancelled itself; `pointercancel` was dead code. | Both listeners removed and the press decision is made on release. A first attempt judged the release position, which needed a `Phaser` value import (type-only today) and a pointer argument every test helper omits; the shipped guard keeps the "took the press" rule and accepts a press that wandered off, which is the forgiving failure for a 72 px target. |
| F6 | Low | NFR-1 said "no product behaviour change" while the chip guard changes behaviour for every player. | NFR-1 amended with a dated carve-out naming the fix, why it was in scope (the bug the journey found), and what remains of the requirement. |
| F7 | Low | Doc drift: `tech-stack.md` showed `^1.64.1` against an exact pin; `perf-baseline.md` and `TDD.md` disagreed on coverage for the same date; `TDD.md` said "near 2.8 min" against measurements of 3.0-3.1; `product.md` keeps the roadmap key `20261110-release-e2e` while the track is `20261107-release-e2e`. | Version pin corrected to exact. Coverage and runtime claims refreshed to the post-fix measurement (97.19 / 91.12 / 96.16 / 98.19, 3.0-3.2 min). The roadmap key is deliberately left: it is the roadmap's planned identifier and the track ID differs because the roadmap stamped a future date; the row says so in its own text. |

## What the review confirmed

- The bridge is inert: `bridgeRequested()` returns early, all accessors re-read
  live state, no cache, no setter, no storage write, +2.6 kB on a 200 kB gate.
- `workers: 2` is safe: the file is the parallelism unit, every test gets a fresh
  `BrowserContext`, `setOffline` is context-scoped, `launch-all` has ~85 % of its
  timeout headroom.
- The suite can fail (the mutation turned three journeys red) and does not pass
  vacuously (`hubReady` fails closed, geometry is asserted non-empty).
- Gates green at review time: 291 files lint-clean, both tsc programs, 2,881 unit
  tests, bundle, PWA 16/16, docs 5/5, no untracked test artifacts.

## Overrides

None.

## Deferred

Nothing. The repository-settings change (F2) is applied rather than deferred; a
later change to it is that owner's decision, not debt this track leaves behind.
