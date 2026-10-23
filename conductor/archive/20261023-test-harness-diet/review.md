# Review: Test Harness Diet

- **Track:** 20261023-test-harness-diet
- **Type:** chore
- **Branch:** `chore/20261023-test-harness-diet`
- **Range:** `728a65919311254220ae5661c2390db88e096414..HEAD`
- **Date:** 2026-10-23
- **Verdict:** `PASS` (round 1 returned PASS WITH FINDINGS; the single Low finding is a spec-wording correction fixed by the primary as the owner of the Conductor prose)

## Summary

The track does exactly what it says and nothing else: two config lines with
measured-reason comments, five inline timeout-override removals matching the
NFR-7 list line-for-line (plus one stale comment justifying a removed
override), and a TDD §10.1 paragraph that accurately states the pool, the
budget, the retired workarounds and the measurements. Four consecutive
sub-90 s no-flag full-suite runs and two first-try coverage passes retire the
weeks-long machine-note era. The single finding is a Low spec-wording
inaccuracy in NFR-7's universal claim, fixed in the same review.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| static | `pnpm check` (reviewer re-run) | pass — 249 files, the two pre-existing findings only | reviewer checks |
| static | `pnpm typecheck` (reviewer re-run) | pass — no diagnostics | reviewer checks |
| unit | `pnpm test -- --run` (targeted, reviewer) | pass — 5 touched files / 110 tests under the committed config, no flags | reviewer checks |
| unit | `pnpm test -- --run` (full, primary) | pass — 62.62 s, 119 files / 2,556 tests | `verification/integrated.md` |
| unit | `pnpm test -- --run` x2 (subagent, consecutive) | pass — 61.3 s and 63.1 s | `verification/phase-1.md` |
| coverage | `pnpm test:coverage` (primary + subagent) | pass — 70.22 s / 89.3 s, both first try; 97.94/91.88/96.6/98.7, gates hold | both evidence files |
| build | `pnpm build` + `validate-bundle.js` + `validate-pwa.js` | pass | `verification/integrated.md` |
| documents | `node scripts/validate-docs.js` | pass — 5/5 | `verification/integrated.md` |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1.T1 | `vite.config.ts:70-73` diff review; phase-1 evidence | covered |
| FR-2 | P1.T1.2 | four consecutive sub-90 s no-flag runs (61.3 / 63.1 / 62.62 s) | covered |
| FR-3 | P1.T2 | `docs/TDD.md` §10.1 diff reviewed against the committed config | covered |
| FR-4 | P1.T3 | `verification/integrated.md` — chain exit 0 | covered |
| NFR-2 | P1.T1 | no dependency or lockfile change in the diff | covered |
| NFR-3 | P1.T1.3 | two first-try coverage passes, all four gates held | covered |
| NFR-4 | P1.T3 | local gate exit 0; CI proof lands with the PR per the requirement's own wording | covered |
| NFR-7 | P1.T4 | diff review: exactly the five listed overrides removed, no assertion/iteration changes; targeted 5-file run green | covered |
| AC-1 | P1.T1.2 | the consecutive-run table in both evidence files | covered |
| AC-2 | P1.T1.3 | two first-try coverage passes | covered |
| AC-3 | P1.T3.1 | integrated chain exit 0 | covered |
| AC-4 | P1.T2 | TDD §10.1 states pool, budget, retired workarounds, measurement | covered |

## Findings

### Critical

None.

### High

None.

### Medium

None.

### Low

**F1 — NFR-7's "governs everywhere" overstated.**
- **File:** `conductor/tracks/20261023-test-harness-diet/spec.md:93`
- **What:** NFR-7 claimed the removal of five overrides makes the committed budget "govern everywhere", but nine pre-existing inline overrides remain — `moreLessLogic.test.ts:151` and `:168`, `countLogic.test.ts:197-199`, `addItUpLogic.test.ts:194` and `~:207`, `takeAwayLogic.test.ts:195` and `~:208`, `decodeLogic.test.ts:340`, `firstSoundsLogic.test.ts:266` — including additional sites inside the four files this track touched (each had more than one override; only the surfaced one was removed per file).
- **Why:** The testable clause ("exactly five... removed") is satisfied and verified; the universal claim is inaccurate and could mislead a future agent hunting the next "timeouts in untouched files" failure.
- **Fix (applied):** NFR-7's wording rescoped to the five surfaced tests, with the nine remaining sites named as out-of-scope follow-up debt.
- **Requirement:** NFR-7 · **Test gap:** none (spec prose only).

## Overrides

None. `review.strict` is `true`; the single Low finding was fixed rather than deferred.

## Plan compliance

| Phase | Checkpoint | Evidence |
| --- | --- | --- |
| 1 — The pool, the budget, and the record | `e3e8df5` | `verification/phase-1.md` |

Every task implemented and verified; the diff stays inside the (amended) `Touches`; the rework used one of the two allowed attempts and its root cause — the inline overrides — is precisely what P1.T4 removed.

## Out of scope

The nine remaining inline overrides (follow-up debt, see F1); CI changes (the new pool applies to CI via the same config and is proven by the PR's run); per-file environment docblocks (considered and rejected on measurement, recorded in the spec); the test-count and coverage-gate values.

## Debt

One item, recorded rather than filed as an issue per the user's single-session flow: **nine pre-existing inline per-test timeout overrides remain** (`moreLessLogic.test.ts:151,168`, `countLogic.test.ts:197-199`, `addItUpLogic.test.ts:194,~207`, `takeAwayLogic.test.ts:195,~208`, `decodeLogic.test.ts:340`, `firstSoundsLogic.test.ts:266`). They predate this track, the diff does not worsen them, and under the committed 30 s budget they now have more headroom than before. A future pass may lift them the same way.

## Doc sync

`updated` — the spec's NFR-7 wording was rescoped during the review disposition; `docs/TDD.md` §10.1 was updated by the phase itself.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | PASS WITH FINDINGS | 0 | 0 | 0 | 1 | 1 |
