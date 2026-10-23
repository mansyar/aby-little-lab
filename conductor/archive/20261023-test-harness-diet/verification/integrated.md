# Integrated Verification — Test Harness Diet

- **Track:** 20261023-test-harness-diet
- **Branch:** `chore/20261023-test-harness-diet`
- **Base:** `master` @ `728a65919311254220ae5661c2390db88e096414`
- **Head:** `5f51e28` (the phase state commit; the phase code commit is `e3e8df5`)
- **Date:** 2026-10-23
- **Result:** verified

The track has one phase, so the phase's gate run doubles as the integrated
run — with the single-full-gate protocol from `conductor/workflow.md` (`728a659`),
the primary ran the full chain once after the subagent's individual proof runs.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | 249 files; the two pre-existing findings only (`musicalMemoryScene.test.ts:294` warning, `biome.json` `$schema` info) |
| static | `pnpm typecheck` | 0 | no diagnostics |
| unit | `pnpm test -- --run` | 0 | 119 files / 2,556 tests in **62.62 s** — no flags |
| unit | `pnpm test:coverage` | 0 | 119 files / 2,556 tests in **70.22 s, first try, no retry**; statements 97.94 / branches 91.88 / functions 96.6 / lines 98.7 (gates 90/85/88/95 hold) |
| build | `pnpm build` | 0 | success |
| artifact | `node scripts/validate-bundle.js` | 0 | all bundle checks passed |
| artifact | `node scripts/validate-pwa.js` | 0 | all PWA checks passed |
| documents | `node scripts/validate-docs.js` | 0 | all document validation checks passed |

**Chain exit: 0.** Together with the subagent's own runs (61.3 s and 63.1 s),
AC-1 has four consecutive sub-90 s no-flag full-suite runs on the host that
previously needed `--maxWorkers=1` and `--testTimeout=30000`.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | Two consecutive sub-90 s full-suite runs, 119 files / 2,556 tests | `verification/phase-1.md` run table (61.3 / 63.1 / 62.62 s) + this file's unit row | pass |
| AC-2 | Coverage passes with no retry; gates hold | `verification/phase-1.md` + this file's coverage row (70.22 s, first try) | pass |
| AC-3 | Full `verify_phase` chain exits 0 | this file's commands table | pass |
| AC-4 | TDD §10.1 matches the committed config and names the retired workarounds | `docs/TDD.md` diff in `25ef461`; reviewed by the primary and the phase agent | pass |

## Evidence paths

- `conductor/tracks/20261023-test-harness-diet/verification/phase-1.md`
- `.conductor/evidence/20261023-test-harness-diet/` (gitignored raw run logs)

## Deviations

1. **NFR-1 withdrawn / NFR-7 added** (user-approved, `45e4a98`): the phase's
   gate runs found five inline per-test timeout overrides defeating the
   committed budget under load; the removal of exactly those five overrides
   (`758bbee`) is the sanctioned change. No other test content changed; the
   suite stays 119 files / 2,556 tests.

## Notes

- The failed first re-proof is preserved in `abdd730`'s evidence as the
  finding that motivated the amendment: the five inline overrides were the
  recurring "timeouts in untouched files" across recent tracks.
- `conductor/workflow.md`'s single-full-gate protocol (`728a659`) was followed
  for the first time in this track: the subagent's runs are the phase record,
  the primary ran the chain once as the blocker clearance and integrated run.
- The `vmThreads` + v8-coverage friction risk from the spec's edge cases did
  not materialize: coverage passed first try twice (89.3 s subagent, 70.22 s
  primary).
