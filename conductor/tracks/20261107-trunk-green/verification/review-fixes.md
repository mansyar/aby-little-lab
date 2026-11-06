# Review Fixes

- **Track:** `20261107-trunk-green`
- **Date:** 2026-11-07
- **Review round:** 1
- **Verdict returned:** PASS WITH FINDINGS (6 medium, 4 low, no critical or high)
- **Status after this round:** all ten findings resolved; nothing deferred

The reviewer confirmed the track's engineering core (audit completeness, guard
non-vacuity, mutation proof, zero remaining literals, the load-versus-code
diagnosis behind the 60 s budgets) and found that several *claims* outran the
code. Each is listed with what changed.

| ID | Severity | Finding | Resolution |
|----|----------|---------|------------|
| R1 | medium | The headline metric ("suite green with system time faked twelve months forward") was never run | **Run and recorded below.** It also found a real remaining defect: `playTimeUi.test.ts` derived its fixture from the ambient clock and failed under the shift. Fixed, then re-run full-suite |
| R2 | medium | `docs/TDD.md` still asserted that no other test carries a per-test timeout | The two 22-scene sweeps are now named in the per-test exception list with their measured numbers |
| R3 | medium | Counts were rewritten under 2026-10-27 dates, producing an impossible provenance, and `perf-baseline` kept a coverage figure from a different run | All touched claims re-dated to 2026-11-07 with this track's coverage figures; the dated Phase 3 walkthrough in `perf-baseline` restored to its 131 files / 2,829 tests |
| R4 | medium | NFR-2 forbade the doc edits the count guard makes mandatory | NFR-2 amended in the spec, narrow to the three count-bearing documents, recorded rather than waived |
| R5 | medium | `PlayTimeIndicator.test.ts` froze the clock at module load while production reads `new Date()` per call | The file now freezes `Date` in `beforeEach` and derives `TODAY` from the same instant; only `Date` is faked, timers stay real |
| R6 | medium | `todayKey()` at `storage.test.ts:911` was the ambient clock and contradicted the new style rule | The file freezes `Date` at one instant and every fixture and expectation derives from it |
| R7 | low | The guard's line-scoped regex missed a split key/value and template quotes, and could fail on comment prose | Whole-file scan with line offsets, backtick support, comment-line skip; four probe cases assert the accepted shape and the documented limit |
| R8 | low | Evidence cited SHAs the squash removed, claimed "132 files scanned", and phase 3's header still said blocked | SHA mapping added, scan count corrected, header set to verified |
| R9 | low | A 60 s budget hides a genuine 2x slowdown | The measured baseline (20-23 s isolated, 30-31 s under coverage) is now in both test comments and the TDD |
| R10 | low | `doc_sync` pending after the sync landed; an unrelated registry row was reformatted | Metadata updated; the reformatted line restored |

## R1 - the twelve-months-forward run

The run used a throwaway config and setup file (both deleted afterwards, never
committed). Only `Date` is faked, so timers stay real:

```ts
// setup
beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2027-11-07T10:00:00"));
});
afterAll(() => vi.useRealTimers());
```

| Run | Result |
|-----|--------|
| Six date-sensitive suites, clock shifted to 2027-11-07 | **failed** - 6 tests in `game/hub/playTimeUi.test.ts` |
| Full suite, clock shifted, after the fix below | **132 files / 2,833 tests passed** |
| Full suite, real clock, after the fix | **132 files / 2,833 tests passed** |

The first run is the point: `playTimeUi.test.ts` built `TODAY` with `todayKey()`
at module load, so under a shifted clock the fixture's day key and production's
disagreed, `normalizePlayTime` reset the usage, and the "locks the tiles when the
cap is reached" family of tests inverted. That is the same defect class as
2026-10-27's `gameLaunch.test.ts`, surviving in a file the literal scan could not
see because the value was derived rather than written.

## Defect the review did not find, and the run did

`src/__tests__/game/hub/playTimeUi.test.ts` now follows the same pattern as
`PlayTimeIndicator.test.ts`: one frozen instant, `TODAY` derived from it, and
`vi.useRealTimers()` in `afterEach`. `storage.test.ts` was hardened at the same
time, since its session assertions compare production's written key against the
test's own.

This is why the metric existed, and why recording it was worth more than
declaring it out of scope.
