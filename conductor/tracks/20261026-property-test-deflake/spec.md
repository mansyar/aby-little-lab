# Spec — Property-Test Deflake

## Overview

Give the five known-heavy property sweeps an explicit per-test time budget so
a loaded development host cannot push them past the 30 s global testTimeout.
The 30 s policy stays the default; full 200-sample coverage is kept; the
runner policy note in the TDD is updated. Zero production change.

## Problem / Motivation

The suite's heavy property tests iterate `VARIETY_SAMPLES = 200` across every
adaptive shift (`-1/0/+1`), so the "keeps every round valid at every shift"
sweeps execute 600+ builder invocations per test. Under host load these
exceed the committed 30,000 ms `testTimeout` (`vite.config.ts:73`) and the
full-suite run fails with 5-7 `Test timed out in 30000ms` results — zero
assertion failures, all passing in isolation. This exact flake burned gate
re-runs in three consecutive tracks (`20261025-shared-random-helpers`,
`20261026-scene-rng-seam`, `20261026-docs-truth-pass`); each time the primary
had to settle the host and re-run the whole suite. CI is unaffected (Quality
Gates passes in ~2 min), but the local gate must be trustworthy.

Proven victims (30 s timeouts observed during gate runs):
`addItUpLogic.test.ts`, `countLogic.test.ts`, `numberOrderLogic.test.ts`,
`takeAwayLogic.test.ts`, `firstSoundsLogic.test.ts` — worst observed 66 s.

## Goals & Success Metrics

- **G1** — The five proven sweeps carry an explicit per-test budget ≥ 2×
  their worst observed wall time, so a loaded host that doubles runtimes
  still passes. Metric: every sweep test in the five suites has an explicit
  `timeout` option of 120,000 ms.
- **G2** — Sweep suites without proven timeouts are audited; any whose worst
  observed isolated wall time exceeds 20 s gets the same budget
  (proactive, measured, not guessed). Metric: audit table in the evidence.
- **G3** — The 30 s global policy remains the default in `vite.config.ts`
  (untouched), and `docs/TDD.md`'s runner section records the exception.
  Metric: `vite.config.ts` diff empty; TDD note present; docs validator green.

## Scope

**In:** per-test `timeout` options in the affected suites under
`src/__tests__/game/`; the measured audit run; a TDD runner-section note;
evidence. **Out:** `vite.config.ts` (global policy stays), production `src/**`,
sample-count reduction (coverage is kept — that was the explicit decision),
`pnpm test:coverage` thresholds, docs counts (no test added or removed, so
the count-drift guard is unaffected), CI configuration.

## Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | The proven-victim sweep tests (addItUp, count, numberOrder, takeAway, firstSounds "every round valid at every shift" family) carry an explicit per-test `timeout` of 120,000 ms | must |
| FR-2 | Every sweep test in the 13 `VARIETY_SAMPLES = 200` suites is audited for isolated wall time; any test exceeding 20 s gets the same explicit budget | must |
| FR-3 | The `timeout` options use the installed vitest 4.1.x per-test syntax, verified against the installed version before adoption | must |
| FR-4 | `docs/TDD.md` §10.1 records the exception policy (which tests, why, the measured reason) without rewriting the vmThreads rationale | should |
| FR-5 | No test is added, removed, renamed, or weakened; sample counts stay at 200 | must |

## Non-Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| NFR-1 | Zero `src/**` production change (test files + docs only) | must |
| NFR-2 | Full verification chain green (static, unit incl. coverage, build-artifact, documents) | must |
| NFR-3 | The audit numbers recorded in evidence are real measurements, not estimates | must |

## Acceptance Criteria

| ID | Criterion | Verifies |
|---|---|---|
| AC-1 | Full 8-command verification chain passes on the final tree | FR-2, NFR-2 |
| AC-2 | Grep proof: the five victim suites each carry explicit 120,000 ms timeouts on their sweep tests; no other test carries one unless the audit justified it | FR-1, FR-2 |
| AC-3 | The audit table (per sweep test: worst observed wall time, action taken) exists in the evidence, derived from a real timed run | FR-2, NFR-3 |
| AC-4 | `vite.config.ts` byte-identical; TDD runner note present; docs validator exits 0 | FR-4, G3 |
| AC-5 | Test and file counts unchanged (125 files / 2,729 tests), so the count-drift guard stays green | FR-5 |

## Edge Cases

- Vitest 4 per-test timeout syntax: `{ timeout: 120000 }` as the second
  argument of `it(...)` — the executor must confirm against the installed
  vitest 4.1.11 typings before applying (FR-3); if the options-object form is
  unsupported, use the supported form and record the deviation.
- A sweep test that runs fast in isolation but timed out under load before
  (the load multiplies runtimes ~2-3×): the audit threshold (20 s isolated)
  already accounts for this — 20 s × 3 = 60 s < 120 s budget.
- The audit run itself may hit the global 30 s timeout on the un-patched
  heavy tests — that is expected; the audit measures wall time up to the
  timeout, and a timed-out test's wall time counts as ≥ 30 s for threshold
  purposes.
- `test:coverage` re-runs the same tests: the raised budgets apply there too
  (same runner), keeping both gates reliable.
- The count-drift guard: unchanged counts — no risk.

## Dependencies

- Tracks: none.
- External: none.

## Open Questions & Assumptions

- **A1** — 120,000 ms is the right budget: worst observed 66 s, CI total
  2 min; 2× headroom covers host-load spikes without masking real hangs.
- **A2** — The audit threshold is 20 s isolated wall time (3× worst observed
  load multiplier stays under 120 s).
- **A3** — Only the five proven victims need the budget today; the audit may
  add more, but nothing is raised without a measurement (no blanket change).
- **A4** — The TDD note goes in §10.1 alongside the vmThreads rationale,
  keeping the "policy lives in the repository" principle.

## References

- `vite.config.ts:70-73` (vmThreads + testTimeout policy)
- `docs/TDD.md:1015` (runner section, "30,000 ms per-test budget … measured reason")
- Flake records in `conductor/archive/20261025-shared-random-helpers/`, `conductor/archive/20261026-scene-rng-seam/`, `conductor/archive/20261026-docs-truth-pass/` verification files
