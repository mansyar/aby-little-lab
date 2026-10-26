# PR Body — property-test-deflake

## Summary

The five heavy "at every shift" property sweeps (`VARIETY_SAMPLES = 200` × 3 shifts of builder calls) get explicit per-test time budgets instead of relying on the 30 s global default they occasionally blow past under host load. Zero production change; sample coverage unchanged at 200.

## Track

- **Track:** `20261026-property-test-deflake` (chore, high)
- **Branch:** `chore/20261026-property-test-deflake` → `master`
- **Phases:** P1 audit + budgets (`bf96b31c`), P2 verify (`6e8a9b9b`), R1 review fixes (`84c0699d`)

## What changed

- `{ timeout: 120_000 }` (vitest 4 options-object form) on seven sweep tests: addItUpLogic:172, countLogic:174, decodeLogic:322, firstSoundsLogic:252, numberOrderLogic:136, takeAwayLogic:173, wordLogic:254. Five budgeted in Phase 1 (the proven victims from three tracks of gate flake records), two added in the review round (the historical flake record lists decodeLogic; its sweep was once observed at 46 s).
- `docs/TDD.md` §10.1 records the exception policy: 30 s global default unchanged, seven sweep tests carry explicit 120 s budgets, pre-existing 20 s guards inventoried accurately (five pair-pool + two moreLess sweep guards).
- Audit table in the phase evidence: every sweep in the 13 `VARIETY_SAMPLES = 200` suites timed in isolation; worst isolated 4.84 s; budgeted sweeps run 0.7-1.6 s isolated on a settled host — ~78× headroom.
- `vite.config.ts` byte-identical (30 s global policy untouched); `VARIETY_SAMPLES` stays 200 everywhere; no test renamed, removed, or weakened.

## Verification

Full 8-command chain green on every phase and the integrated run: check (1 pre-existing warning + 1 info), typecheck clean, **125 files / 2,729 tests**, coverage 97.82/91.96/96.77/98.74, build precache 54 entries, bundle PASS (shell 138.7 kB), PWA 16/0, docs 6/0.

## Review

**PASS** after 2 strict rounds. Round 1 (PASS WITH FINDINGS) caught the two unprotected sweeps the historical record implicates (F1 Medium) plus two Low wording/provenance defects; all fixed in R1. Round 2 delta re-review independently re-derived the grep proof, the archived flake record, and the multiplier arithmetic; one further Low (stale post-squash commit hashes in evidence) fixed and recorded.

## Rollback

Single revert of the branch: five test files' options-object additions, TDD §10.1 note, evidence files. No migration, no data.
