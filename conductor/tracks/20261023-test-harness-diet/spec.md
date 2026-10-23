# Spec: Test Harness Diet

> IDs are stable. Never renumber a requirement; if one is withdrawn, mark it
> Withdrawn and leave the id in place.

## Overview

The local test harness costs 8–9 minutes per full-suite run on the development
machine while CI runs the same suite in about 90 seconds. The cause is the
worker pool, not the tests: the default `forks` pool spawns an OS process per
test file, and on a loaded host those processes time out at the 5,000 ms
per-test budget, forcing serialized runs (`--maxWorkers=1`) and ad-hoc
`--testTimeout=30000` retries. A controlled experiment on the current tree ran
the full suite twice under the `vmThreads` pool with a raised test timeout:
59.4 s and 59.9 s, 119 files / 2,556 tests, both green. This track adopts that
configuration permanently and retires the workaround folklore.

## Problem / Motivation

- Every `pnpm test -- --run` on the development host exceeds per-test timeouts
  in untouched files (a different set each run), so every track since the
  session-lifecycle work has carried a "machine note" mandating
  `--maxWorkers=1`, stretching full-suite runs to 460–520 s and coverage runs
  past 8 minutes.
- The `--testTimeout=30000` rescue was applied ad hoc on the command line,
  repeatedly, per phase — policy living in run invocations instead of in the
  repository.
- Each phase pays the cost twice: the subagent runs the full gate, and (until
  the workflow amendment recorded 2026-10-23) the primary re-ran it. With the
  single-gate protocol now in `conductor/workflow.md`, the remaining lever is
  making the one gate fast.
- Measured breakdown under the old configuration shows the tests themselves
  are not the problem: 94–162 s of test time inside 460–520 s of wall clock;
  the rest is per-file process spawn and environment boot.

## Goals & Success Metrics

- **G1 — CI parity locally.** The full unit suite completes on the development
  host in under 90 s. *Metric:* two consecutive full-suite runs under 90 s.
- **G2 — The timeouts policy lives in the repository.** No run needs a
  per-test timeout flag or a worker-count flag. *Metric:* `pnpm test -- --run`
  and `pnpm test:coverage` pass unmodified on the host that previously needed
  the flags.
- **G3 — The folklore is documented, not remembered.** The TDD's testing
  chapter describes the pool, the timeout, and the retired workarounds.
  *Metric:* TDD §10 states the configuration as fact, with the measurement.

## Scope

**In:**

- `vite.config.ts` test block: `pool: "vmThreads"` and `testTimeout: 30000`,
  each with a comment saying why.
- `docs/TDD.md` §10.1 (runner description) updated to state the pool, the
  timeout, and that the `--maxWorkers` / `--testTimeout` command-line
  workarounds are retired.
- `conductor/workflow.md` already carries the single-full-gate protocol
  (amended on `master` before this track opened); this track only verifies the
  gate under the new pool, including the coverage layer, and records the
  before/after measurements in its evidence.

**Out:**

- Per-file `@vitest-environment node` docblocks for the ~58 DOM-free test
  files — considered and rejected on measurement: with the pool fixed the
  whole suite is ~60 s, so the further saving buys seconds, not minutes, and
  costs 58 file edits.
- `isolate: false` or any other isolation reduction — the codebase relies on
  module singletons (`AudioManager.getInstance()`, memo caches); the vmThreads
  pool keeps per-file VM isolation.
- Any test content change, any coverage-threshold change, any CI workflow
  change (CI already passes in ~90 s; the new pool applies there too via the
  same config and is verified by this track's gate).
- The test-count and coverage-gate values themselves.

## Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | The Vitest test block in `vite.config.ts` sets `pool: "vmThreads"` and `testTimeout: 30000`, each with a one-line comment recording the measured reason (59 s vs ~8 min; the 5,000 ms default was marginal on a loaded host). | Must |
| FR-2 | `pnpm test -- --run` and `pnpm test:coverage` pass with no additional flags on the development host that previously required `--maxWorkers=1` / `--testTimeout=30000`. | Must |
| FR-3 | `docs/TDD.md` §10.1 describes the runner: the `vmThreads` pool, the 30,000 ms per-test budget, and the retired command-line workarounds, with the measured before/after. | Must |
| FR-4 | The full `verify_phase` gate — including the coverage layer and the build-artifact, PWA, and document validators — exits 0 under the new configuration. | Must |

## Non-Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| NFR-1 | **Withdrawn 2026-10-23** — superseded by NFR-7 after the phase-1 gate runs showed five inline per-test timeouts overriding the committed budget and failing under load. | — |
| NFR-2 | No new dependency; no network access; offline-first. | Must |
| NFR-3 | Coverage gates (lines 95 / functions 88 / branches 85 / statements 90) hold under the new pool. | Must |
| NFR-4 | CI behaviour does not regress: the `vmThreads` configuration is what CI itself runs, and this track's gate plus CI on the PR prove it. | Must |
| NFR-7 | Exactly five inline per-test timeout overrides are removed so the committed 30,000 ms budget governs everywhere: `src/__tests__/game/countLogic.test.ts` (~:183), `src/__tests__/game/numberOrderLogic.test.ts` (~:144), `src/__tests__/game/addItUpLogic.test.ts` (~:181), `src/__tests__/game/takeAwayLogic.test.ts` (~:182), each `{ timeout: 20_000 }`, and `src/__tests__/scenes/navigation.test.ts` (~:392), positional `15000`. No test assertion, iteration count, or other test content changes; the suite stays 119 files / 2,556 tests. | Must |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | Two consecutive full-suite runs under the new configuration complete in under 90 s each, with 119 files / 2,556 tests passing. | FR-1, FR-2, G1 |
| AC-2 | The coverage layer passes with no timeout retry and holds all four gates. | FR-2, NFR-3 |
| AC-3 | The full `verify_phase` chain exits 0 end to end. | FR-4 |
| AC-4 | The TDD's runner description matches the committed config, and names the retired workarounds. | FR-3, G3 |

## Edge Cases

- A test that legitimately needs more than 30 s would now fail differently —
  no test in the suite comes close (the slowest observed real test is well
  under 2 s); the raise only widens the margin against host load.
- vmThreads and v8 coverage have a history of friction in some tool versions;
  the coverage run in AC-2 is the explicit proof point. If coverage fails
  under vmThreads, the fallback is forks with `testTimeout: 30000` only, and
  the track reports the measured trade rather than forcing the pool.
- CI runs the same config; if the GitHub runner behaves differently, the PR's
  CI run surfaces it before merge.

## Dependencies

- **Tracks:** none. (The workflow amendment `728a659` landed on `master` before
  this track opened and is assumed, not depended on.)
- **External:** none.

## Open Questions & Assumptions

No open questions. Assumptions:

- The experiment's two green runs (59.4 s / 59.9 s, `--testTimeout=30000`) on
  the current tree generalize to the committed configuration — the track
  re-proves this rather than trusting it.
- The 30,000 ms timeout is a load margin, not a licence: no test should
  approach it, and a future test approaching it is a smell, not a
  configuration problem.
- `conductor/product.md` has no "Open Questions & Assumptions" section; the
  assumptions above seed this spec.

## References

- The experiment: two full-suite runs under `--pool=vmThreads
  --testTimeout=30000` on 2026-10-23, 59.4 s and 59.9 s, both 119 files /
  2,556 tests green.
- Single-file environment A/B: `adaptiveLogic.test.ts`, 32.1 s (happy-dom) vs
  2.7 s (node) — the measurement that ruled out per-file environment work as
  the first lever.
- `vite.config.ts` test block; `docs/TDD.md` §10.1; `conductor/workflow.md`
  Verification Strategy (amended `728a659`).
