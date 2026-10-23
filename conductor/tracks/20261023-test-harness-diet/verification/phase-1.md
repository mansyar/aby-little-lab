# Phase 1 Verification — The pool, the budget, and the record

- **Track:** 20261023-test-harness-diet
- **Phase:** 1
- **Date:** 2026-10-23
- **Branch:** `chore/20261023-test-harness-diet`
- **Base:** `b2aa8a2`
- **Head commits:** `e0c5f59` (config), `25ef461` (TDD), `758bbee` (P1.T4 inline-timeout removal)
- **Result:** **blocked** — AC-1 and AC-2 are proven green under the new configuration (61.3 s / 63.1 s runs; coverage 89.3 s first pass with all four gates held), but the full `verify_phase` chain was **permission-denied by the shell allowlist before it ran a single segment** and, per the brief, was not retried or worked around. The primary must run the gate command.

> History: the first execution of this phase (evidence recorded at `abdd730`) failed AC-1 because five tests carried inline per-test timeout overrides that defeated the committed 30 s budget under host load. The spec was amended (`45e4a98`, user-approved): NFR-1 withdrawn, superseded by NFR-7, and plan task P1.T4 added. This document supersedes that run's verdict; its finding is recorded under "Rework" below.

## What changed

1. `vite.config.ts` — test block, exactly two lines added, each with a one-line comment:
   ```ts
   // vmThreads: full suite 59-60 s vs ~8 min under the forks pool on this loaded host.
   pool: "vmThreads",
   // 30,000 ms: the 5,000 ms default was marginal on a loaded machine.
   testTimeout: 30000,
   ```
2. `docs/TDD.md` §10.1 — the opening paragraph states the `vmThreads` pool, the 30,000 ms per-test budget, the measured reason (forks 460–520 s with `--maxWorkers=1` + ad-hoc `--testTimeout=30000` retries vs 59.4 s / 59.9 s green under vmThreads, measured 2026-10-23), that the command-line workarounds are retired, and that vmThreads keeps per-file VM isolation for the module singletons. §10.2–10.4 untouched.

## Rework (P1.T4, commit `758bbee`, covers NFR-7)

Deleted the five inline per-test timeout overrides so the committed 30,000 ms budget governs. No assertion, iteration count, or describe/it text changed; suite stays 119 files / 2,556 tests.

```diff
--- a/src/__tests__/game/addItUpLogic.test.ts      (line 181)
-  it("keeps the shifted band ladder and validity across many samples", { timeout: 20_000 }, () => {
+  it("keeps the shifted band ladder and validity across many samples", () => {
--- a/src/__tests__/game/countLogic.test.ts       (line 183)
-  it("keeps the shifted band ladder across many samples", { timeout: 20_000 }, () => {
+  it("keeps the shifted band ladder across many samples", () => {
--- a/src/__tests__/game/numberOrderLogic.test.ts (line 144)
-  it("keeps the shifted band ladder across many samples", { timeout: 20_000 }, () => {
+  it("keeps the shifted band ladder across many samples", () => {
--- a/src/__tests__/game/takeAwayLogic.test.ts   (line 182)
-  it("keeps the shifted band ladder and validity across many samples", { timeout: 20_000 }, () => {
+  it("keeps the shifted band ladder and validity across many samples", () => {
--- a/src/__tests__/scenes/navigation.test.ts    (lines 372–392)
-  // 22 fresh Hub instantiations per pass now; under full-suite coverage load
-  // this can exceed the 5s default, so give it explicit headroom.
   it("navigates to each game scene when respective tile is clicked", async () => {
     ...
-  }, 15000);
+  });
```

Note: the two deleted comment lines in `navigation.test.ts` existed solely to justify the removed 15 s override and referenced the 5 s default that no longer applies; no test logic was touched.

## Commands

| # | Command | Result | Wall clock | Exit | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | `pnpm test -- --run` (AC-1 run 1, post-rework) | 119 files / 2,556 tests passed | 61.3 s (64.7 s incl. stopwatch wrapper) | 0 | Tests aggregate 225.8 s |
| 2 | `pnpm test -- --run` (AC-1 run 2, post-rework) | 119 files / 2,556 tests passed | 63.1 s (66.2 s incl. wrapper) | 0 | Tests aggregate 248.0 s; consecutive with run 1 |
| 3 | `pnpm test:coverage` (AC-2) | 119 files / 2,556 tests passed, all gates held | 89.3 s | 0 | First pass, no timeout retry. Statements 97.92 (5241/5352) ≥ 90; branches 91.81 (1312/1429) ≥ 85; functions 96.6 (1110/1149) ≥ 88; lines 98.7 (4862/4926) ≥ 95 |
| 4 | Full verification chain (`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`) | **permission-denied before execution** | — | — | Not retried, not worked around, per brief rule. `pnpm check`, `pnpm typecheck`, `pnpm build` and the three validators have no exit codes this session |

Earlier pre-rework runs (for the record): run at 22:34 passed 119/2,556 in 72.1 s; three runs at 22:36–22:42 failed on the five inline-timeout tests under a 3.3–4.3× host-load spike. Details in git history of this file at `abdd730` and in `.conductor/evidence/20261023-test-harness-diet/phase-1-test-runs.md`.

## Acceptance criteria

| ID | Criterion | Verdict | Evidence |
| --- | --- | --- | --- |
| AC-1 | Two consecutive full-suite runs under 90 s, 119 files / 2,556 tests | **Met** | 61.3 s and 63.1 s consecutive green runs post-rework (rows 1–2). Matches the pre-track experiment (59.4 s / 59.9 s). |
| AC-2 | Coverage passes with no timeout retry, all four gates hold | **Met** | Row 3: 89.3 s, first pass, 97.92 / 91.81 / 96.6 / 98.7 against gates 90 / 85 / 88 / 95. |
| AC-3 | Full `verify_phase` chain exits 0 | **Blocked** | The exact chain was permission-denied by the shell allowlist before execution. The test and coverage segments were proven individually green (rows 1–3); the remaining segments (`pnpm check`, `pnpm typecheck`, `pnpm build`, bundle/PWA/docs validators) await the primary's run. |
| AC-4 | TDD §10.1 matches committed config and names retired workarounds | **Met** | `25ef461`; paragraph states pool, 30,000 ms budget, retired `--maxWorkers=1` / `--testTimeout=30000`, and the before/after measurement. |

## Deviations

- `src/__tests__/game/{addItUp,count,numberOrder,takeAway}Logic.test.ts`, `src/__tests__/scenes/navigation.test.ts` — outside the original `Touches` (`vite.config.ts`, `docs/TDD.md`); authorized by the Rework amendment (P1.T4 / NFR-7) after the primary's spec amendment `45e4a98`. Changes limited to the five inline timeout overrides listed above.

## Notes

- The permission-denied command, verbatim, for the primary to run:
  `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
  If the primary's run exits 0, AC-3 closes and the phase can be marked verified; the config, TDD, and P1.T4 commits are already in place.
- The timing wrapper used for rows 1–2 was `[System.Diagnostics.Stopwatch]` around the exact `pnpm test -- --run` invocation; no extra Vitest flags were passed.
- Raw run summaries: `.conductor/evidence/20261023-test-harness-diet/phase-1-test-runs.md` (pre-rework failures) — post-rework green runs are recorded in the table above.

## 9. Primary verification

- Working tree clean; commits in `b2aa8a2..HEAD`: `e0c5f59` (the config), `25ef461` (the TDD runner paragraph), `abdd730` (the first evidence record — the failed re-proof), `45e4a98` (the user-approved spec amendment + P1.T4 plan task), `758bbee` (the five inline-override removals), `2627e47` (the reworked evidence). No merge commits.
- Files changed vs `Touches`: `vite.config.ts`, `docs/TDD.md`, and the five test files added to `Touches` by the amendment, plus the evidence file. Nothing else.
- Source diff review: the config adds exactly `pool: "vmThreads"` and `testTimeout: 30000` with one-line measured comments; the five test edits delete only the inline overrides (`{ timeout: 20_000 }` x4, positional `15000` x1) and one stale comment justifying them; no assertion or iteration change; TDD §10.1 states the runner and the retired workarounds.
- The primary ran the full gate chain (the subagent's allowlist blocker): `pnpm check` 0 (249 files, the two pre-existing findings), `pnpm typecheck` 0, `pnpm test -- --run` 0 - **62.62 s**, 119 files / 2,556 tests; `pnpm test:coverage` 0 - **70.22 s, first try, no retry**, statements 97.94 / branches 91.88 / functions 96.6 / lines 98.7 (gates 90/85/88/95 hold); `pnpm build` 0; `validate-bundle.js` 0; `validate-pwa.js` 0; `validate-docs.js` 0. **Chain exit 0.**
- Combined with the subagent's own runs (61.3 s and 63.1 s green), AC-1 has four consecutive sub-90 s no-flag full-suite runs; AC-2 has two no-retry coverage passes; AC-3 is proven by the chain above; AC-4 verified by reading the TDD paragraph against the committed config.
- The failed first re-proof (`abdd730`) is preserved as the finding that motivated NFR-7: the five inline overrides defeated the committed budget under a 3.3-4.3x host-load spike, exactly the failure mode this track set out to retire.

**Primary result:** verified.
