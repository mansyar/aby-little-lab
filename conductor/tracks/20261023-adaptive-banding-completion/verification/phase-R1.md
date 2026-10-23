# Phase R1 Verification — Review Fixes (round 1)

- **Track:** 20261023-adaptive-banding-completion (Adaptive Difficulty Completion)
- **Phase:** R1 — Review Fixes (round 1)
- **Date:** 2026-10-23
- **Branch:** `feat/20261023-adaptive-banding-completion`
- **Base commit:** `d370347`
- **Head commit(s):** this phase's own commits (see History below)
- **Result:** verified (with one blocked layer recorded)

## What changed

**F2** — `docs/TDD.md:989` (§10.3 Coverage gates): the stale coverage snapshot
was replaced with the integrated run's figures and the instrumentation-variance
clause. The sentence now reads:

> Current coverage (verified 2026-10-23, the integrated final-tree run) is
> statements 97.92 (5241/5352), branches 91.81 (1312/1429), functions 96.6
> (1110/1149) and lines 98.7 (4862/4926) across 119 files and 2,556 tests;
> per-run coverage instrumentation varies by a fraction of a point between
> identical runs.

Nothing else in the file changed. **F1** was the primary's own correction of
its phase-3 evidence (`fbc3ca8`) and is not this phase's work; it is recorded
here only as resolved context.

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | 249 files; the two pre-existing findings only (`musicalMemoryScene.test.ts:294` noNonNullAssertion; `biome.json` `$schema` info) |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| unit | `pnpm test -- --run` (as written) | 1 | 1 failed / 2,555 passed — 5,000 ms wall-clock timeout in `hubEngagement.test.ts:309`, a Hub suite this track does not touch; the documented machine-note failure mode |
| unit | `pnpm test -- --run --maxWorkers=1` (sanctioned retry) | 0 | 119 files / 2,556 tests, all green |
| coverage | `pnpm test:coverage -- --maxWorkers=1` (first attempt) | 1 | same untouched-file wall-clock timeout (`hubEngagement.test.ts:309`, 5,289 ms) |
| coverage | `pnpm test:coverage -- --maxWorkers=1 --testTimeout=30000` (retry #2, per the integrated run's precedent) | 0 | 119 files / 2,556 tests; statements 97.94 (5242/5352), branches 91.88 (1313/1429), functions 96.6, lines 98.7 — gates 90/85/88/95 all hold |
| build-artifact | `pnpm build` | 0 | 342 modules; shell `index-5BMI4mqt.js` 137.79 kB; 54 precache entries (1722.25 KiB) |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present; shell 134.6 kB ≤ 200 kB |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed; 42 chunks, 42 precached |
| documents | `node scripts/validate-docs.js` | denied | permission denied in this subagent shell; not retried or worked around per the brief — the primary's run is the record |

No test was edited to work around a timeout; the retried forms are the
sanctioned ladder already recorded in `verification/integrated.md`.

## Finding resolution

| ID | Finding | Resolution |
|---|---|---|
| F2 | The TDD's coverage snapshot (97.94/91.88) disagrees with the integrated run's figures (97.92/91.81) | Fixed — `docs/TDD.md` §10.3 now quotes the integrated run's figures with counts and carries the per-run instrumentation-variance clause. Notably, this phase's own coverage run re-measured 97.94 (5242/5352) / 91.88 (1313/1429) against the integrated run's 97.92 (5241/5352) / 91.81 (1312/1429) on the same tree — direct evidence that the variance clause describes a real, small effect |
| F1 | Stale ownership figure in `verification/phase-3.md` | Already fixed by the primary (`fbc3ca8`); recorded here as resolved, not re-touched |

## Evidence paths

- `.conductor/evidence/20261023-adaptive-banding-completion/phase-R1-raw-outputs.md` (all layer outputs, including the failed runs and the denial)

## Deviations

1. The verification command's `pnpm test -- --run` layer failed on an
   untouched-file wall-clock timeout and was re-run with `--maxWorkers=1`;
   the coverage layer additionally needed the `--testTimeout=30000` form on
   its second attempt. Both are the sanctioned forms recorded in
   `verification/integrated.md`; no test edited, two retries not exceeded.

## Blockers

1. `node scripts/validate-docs.js` — permission denied by this subagent's
   shell allowlist. Why it is needed: it is the documents layer of the phase's
   verification chain and gates AC-4. Expected result: 5 passed, 0 failed —
   the edit is a one-sentence prose replacement inside an existing §10.3
   paragraph that preserves the sentence's shape and every threshold figure
   the validator anchors on. The primary should run it on the final tree, as
   it did in phases 2–4.

## Notes

- The phase changed exactly one sentence in one product document; no source,
  test, config or lockfile was touched.
- The build's shell hash (`index-5BMI4mqt.js`) is byte-identical to the
  integrated record — a docs-only change does not alter the artifact.
- The fresh coverage run's figures (97.94/91.88/96.6/98.7) match the TDD's
  *original* snapshot rather than the integrated run's; the variance clause
  added by F2's fix is what reconciles the two honest measurements.

## Primary verification

Verified independently by the primary (2026-10-23). The phase's single blocker was cleared by the primary: `node scripts/validate-docs.js` exit 0 (5/5, "All document validation checks passed!").

| Check | Result |
|---|---|
| Working tree | Clean after the phase commits |
| Commits since phase base `d370347` | `af03881` (the F2 fix), `5b7ed7d` (the evidence) - exactly as reported, no merges |
| Files changed vs Touches | `docs/TDD.md` + the evidence file, nothing else |
| Diff review | One sentence rewritten in §10.3: the integrated run's figures (97.92 / 91.81 / 96.6 / 98.7, with denominators) plus the per-run instrumentation-variance clause; nothing else in the file changed; the build's shell hash `index-5BMI4mqt.js` is byte-identical to the integrated record (docs-only change) |
| F1 (primary's fix) | `fbc3ca8` corrected both stale ownership-figure rows in `verification/phase-3.md` (the source-diff-review row and the AC-2 row) to 139/133; the review.md finding describes the first only - both carry the same defect class and both are corrected |
| `pnpm check` / `pnpm typecheck` | exit 0 (the two pre-existing findings only) |
| `node scripts/validate-docs.js` | exit 0 - 5/5 (primary's own run) |

**Primary result:** verified.
