# Integrated Verification — 20261027-hubscene-split

- **Track:** 20261027-hubscene-split — HubScene Decomposition
- **Date:** 2026-10-27
- **Branch:** `refactor/20261027-hubscene-split`
- **Head:** `db5d6c21`
- **Result:** pass

## Basis

The full 8-command project gate ran green on the final code state during
Phase 4 acceptance (see `verification/phase-4.md`, Primary verification).
`git diff a804c07a HEAD` proves only `plan.md` and `metadata.json`
(track state) changed since that gate — no source, test, or doc file differs.
The gate results therefore stand for the integrated whole without a redundant
re-run.

## Gate results (from Phase 4, unchanged code)

| # | Command | Exit | Summary |
| --- | --- | --- | --- |
| 1 | `pnpm check` | 0 | 270 files clean |
| 2 | `pnpm typecheck` | 0 | no errors |
| 3 | `pnpm test -- --run` | 0 | 131 files / 2,829 tests pass |
| 4 | `pnpm test:coverage` | 0 | 97.87 / 92.16 / 97.01 / 98.76 vs 95 / 88 / 85 / 90 |
| 5 | `pnpm build` | 0 | precache 59 entries |
| 6 | `node scripts/validate-bundle.js` | 0 | shell 150.0 kB ≤ 200 kB |
| 7 | `node scripts/validate-pwa.js` | 0 | 16/16 |
| 8 | `node scripts/validate-docs.js` | 0 | 6/6 |

## Cross-phase coverage

- FR-1..FR-5, NFR-1, NFR-2, NFR-4, AC-1..AC-3, AC-5: pass per phase evidence.
- NFR-3 (size): partial — helpers within target; HubScene 382 vs ~320.
  Open for `conductor-review` to disposition.
- No Critical/High findings outstanding; no unrecorded dependencies
  (no new packages; no new dynamic imports beyond the moved ones).
