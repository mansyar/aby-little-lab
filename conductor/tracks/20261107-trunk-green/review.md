# Review

- **Track:** `20261107-trunk-green` - Trunk Green - Wall-Clock-Safe Test Fixtures
- **Reviewed:** 2026-11-07
- **Diff:** `6cd2d85a867d704039decb8427a4ebece7cc68bc..1eda5fc2`, plus the review-fix commit
- **Reviewer:** `conductor-reviewer` subagent (read-only)
- **Rounds:** 1
- **Verdict:** PASS WITH FINDINGS - all ten findings resolved in round 1, none deferred

## Scope reviewed

The audit artifact, the guard test, the five fixture conversions, the two sweep
budgets, the style-guide section, the suite-count refresh in the three living
documents, and the evidence files.

## Findings

| ID | Severity | Area | Summary | Resolution |
|----|----------|------|---------|------------|
| R1 | medium | metric | The twelve-months-forward run was never performed | Run recorded in `verification/review-fixes.md`; it exposed a real remaining defect in `playTimeUi.test.ts`, now fixed |
| R2 | medium | docs | TDD claimed no other test carries a per-test timeout | The two sweeps named in the exception list with measured numbers |
| R3 | medium | docs | Counts rewritten under 2026-10-27 dates; stale coverage figure | Re-dated to 2026-11-07; `perf-baseline`'s dated walkthrough restored to its historical 131 / 2,829 |
| R4 | medium | spec | NFR-2 forbade edits the count guard makes mandatory | NFR-2 amended, narrow and recorded in the spec |
| R5 | medium | test correctness | `PlayTimeIndicator.test.ts` froze the clock at module load | Freezes `Date` per test; fixture derives from the same instant |
| R6 | medium | test correctness | `storage.test.ts` used the ambient `todayKey()` | Same freeze pattern; all fixtures and expectations derive from it |
| R7 | low | guard | Line-scoped regex missed split lines and backticks, false-positived on comments | Whole-file scan, line offsets, comment skip, four probe cases |
| R8 | low | evidence | Unreachable SHAs, wrong scan count, phase-3 header still "blocked" | Corrected |
| R9 | low | signal | 60 s budget hides a real 2x slowdown | Baseline recorded beside the budget in the tests and the TDD |
| R10 | low | state | `doc_sync` pending; unrelated registry row reformatted | Metadata updated; row restored |

Full detail, including the four code probes and the clock-shift command output,
is in `verification/review-fixes.md`.

## What the review confirmed

- The audit enumerates 29 rows / 31 quoted literals and classifies every one.
- A fresh independent scan for a quoted day key on `lastUsedDate` returns zero.
- The guard cannot pass vacuously: eager typed glob, three concrete path
  assertions, and a self-exclusion that is itself asserted.
- The mutation proof is real; no probe line survives in any commit.
- The 60 s budgets address a load artefact that a control run demonstrated, not
  a code regression.

## Overrides

None. No finding was waived, and no acceptance criterion was accepted as unmet.

## Deferred

Nothing. There are no follow-up issues to file: every finding was resolved in
this round, including the two the reviewer rated as the weakest claims
(`FIXED_NOW` at module load, and the ambient `todayKey()`), which are now the
strongest assertions in the track.
