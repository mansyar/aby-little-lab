# Plan: Test Harness Diet

> **Branch:** `chore/20261023-test-harness-diet`
> **Base:** `master` @ `728a659`

States: `pending | in_progress | verified | failed | blocked`. Only the
primary agent writes this file.

## Phase 1: The pool, the budget, and the record

- **Goal:** The test harness runs the full suite in under 90 s locally with no
  command-line workarounds, the coverage layer holds its gates under the same
  configuration, and the TDD's runner description states the configuration and
  its measured reason.
- **Depends on:** none.
- **Covers:** FR-1, FR-2, FR-3, FR-4, NFR-1..NFR-4, AC-1..AC-4.
- **Touches:** `vite.config.ts`, `docs/TDD.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P1.T1: Commit the pool and the budget** — covers: FR-1
  - [ ] **P1.T1.1:** In `vite.config.ts`'s `test` block set `pool: "vmThreads"` and `testTimeout: 30000`, each with a one-line comment recording the measured reason (full suite 59–60 s vs ~8 min under forks on this host; the 5,000 ms default was marginal on a loaded machine).
  - [ ] **P1.T1.2:** Run the full unit suite twice with no additional flags; both runs must pass 119 files / 2,556 tests in under 90 s (AC-1). Record both wall-clock times in the evidence.
  - [ ] **P1.T1.3:** Run `pnpm test:coverage` with no additional flags; it must pass with no timeout retry and hold all four gates (AC-2). If coverage fails under `vmThreads`, fall back to the default pool with `testTimeout: 30000` only, re-run, and record the measured trade in the evidence.
- [ ] **P1.T2: State the runner in the TDD** — covers: FR-3
  - [ ] **P1.T2.1:** Update `docs/TDD.md` §10.1 to describe the runner as the `vmThreads` pool with a 30,000 ms per-test budget, and record that the former `--maxWorkers=1` / `--testTimeout=30000` command-line workarounds are retired in favour of the committed configuration, with the before/after measurement.
- [ ] **P1.T3: Prove the whole gate under the new configuration** — covers: FR-4
  - [ ] **P1.T3.1:** Run the full `verify_phase` chain exactly as written above; it must exit 0 end to end (AC-3). Record every segment's result in the evidence.

<!--
After accepting a phase, the primary appends under it:

**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/<track-id>/verification/phase-<n>.md

`conductor-review` appends its own phase if findings require fixes:

## Phase R1: Review Fixes
...
- [ ] **R1.T1: Resolve <finding ID>** - covers: <finding ID>
-->
