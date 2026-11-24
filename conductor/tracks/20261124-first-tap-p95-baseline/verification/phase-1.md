# Phase 1 verification — Pure p95 helper and measurement-script integration

## Result

**Phase result: verified.**

Phase base: `542c7a4d`.

Implemented:

- `scripts/firstTapStats.mjs`: pure nearest-rank `percentile` / `p95` helpers; empty input returns `null`; input order is not mutated.
- `scripts/firstTapStats.d.mts`: typed declarations for the guard-test import.
- `src/__tests__/guard/firstTapStats.test.ts`: five deterministic guard tests.
- `scripts/measure-first-tap.mjs`: `--samples <n>` / `--samples=<n>` (default 10), repeated fresh contexts per target, cold-only `cold.p95Ms` plus `cold.perGameP95Ms` JSON reporting, and aggregate/per-game p95 lines in the text table. Existing median/worst semantics and the sole `worst.totalMs > 400` exit gate are unchanged.
- Count-only living-doc refresh: 156 files / 3,380 tests -> 157 files / 3,385 tests.

No package, lockfile, production app, scene, save-schema, asset, E2E, CI, or gate configuration changed.

## Task status

| Task | Status | Evidence |
|---|---|---|
| P1.T1 — pure helper and declaration | done | `scripts/firstTapStats.mjs`, `scripts/firstTapStats.d.mts`, five green guard tests |
| P1.T2 — script integration | done | `--samples` parsing, repeated fresh contexts, cold-only `p95Ms`, text output; valid and invalid CLI checks |
| P1.T3 — living counts and scope audit | done | README/TDD/perf-baseline count-only edits; package/lock and production-src diffs empty |
| P1.T4 — phase verification | done | targeted test, full gate, build/PWA/docs validators, cold-control preview smoke |

## Verification commands

| Command | Result |
|---|---|
| `pnpm exec vitest run src/__tests__/guard/firstTapStats.test.ts` | exit 0; 1 file / 5 tests passed |
| `node scripts/measure-first-tap.mjs --samples 0 --json` | exit 1; `--samples must be a positive integer` |
| `node scripts/measure-first-tap.mjs --samples nope --json` | exit 1; `--samples must be a positive integer` |
| `node scripts/measure-first-tap.mjs --samples --json` | exit 1; `--samples requires a positive integer value` |
| `pnpm check` | exit 0; 371 files, no fixes |
| `pnpm typecheck` | exit 0; app + E2E clean |
| `pnpm test -- --run` | exit 0; 157 files / 3,385 tests |
| `pnpm test:coverage` | exit 0; statements 97.11%, branches 90.93%, functions 96.33%, lines 98.25% |
| `pnpm build` | exit 0; Vite 8.3.8, 490 modules, shell `index-Dw5_jcTg.js` 197.64 kB / 50.27 kB gzip, 63 precache entries |
| `node scripts/validate-bundle.js` | exit 0; shell 193.0 kB <= 200 kB |
| `node scripts/validate-module-size.js` | exit 0; 171 TypeScript modules, zero warnings |
| `node scripts/validate-textures.js` | exit 0; 319 SVGs, all tier/full/ratio budgets pass |
| `node scripts/validate-pwa.js` | exit 0; 16 passed / 0 failed, 51 chunks precached |
| `node scripts/validate-docs.js` | exit 0; 5 passed / 0 failed |
| Full configured `verify_phase` chain | exit 0; all ten commands green on the final tree |
| `TAP_INERT_IDLE=1 node scripts/measure-first-tap.mjs --with-preview --samples 1 --json` | exit 0; 5 fresh-context taps; cold p95 total 264.2 ms; worst cold 264.2 ms; cold median 214.6 ms; five per-game p95 rows; `validate-boot` exit 0 |

The unmodified headless preview smoke (`node scripts/measure-first-tap.mjs --with-preview --samples 1 --json`) timed out twice waiting for the Shape Sorter chunk because the Hub idle prewarm had already imported the chunk before the tap. The script's documented cold control, `TAP_INERT_IDLE=1`, neutralises that idle scheduler and completed the same smoke successfully. This is measurement-environment behavior, not a product or p95-helper failure.

## Acceptance-criteria evidence

| AC | Status | Evidence |
|---|---|---|
| AC-1 — nearest-rank p95 helper and unit coverage | covered | five guard tests; ten values select index `ceil(0.95*10)-1 = 9`; empty/single/even/odd/non-mutation cases; smoke proves aggregate and five per-game p95 rows |
| AC-6 — no new dependency | covered | `git diff 542c7a4d -- package.json pnpm-lock.yaml` is empty |
| AC-7 — no production app change | covered | only `src/**` addition is `src/__tests__/guard/firstTapStats.test.ts`; all other implementation is under `scripts/` |
| AC-9 — living counts and docs guard | covered | full suite proves 157 / 3,385; count-only docs refreshed; `validate-docs` 5/5 |
| AC-10 — no gate weakening | covered | `tapExitCode` remains byte-identical: only `worst.totalMs > budgetMs` fails; p95 is report-only; invalid `--samples` fails before browser work |

## Static scope audit

- `git diff --check`: exit 0.
- `package.json` / `pnpm-lock.yaml`: unchanged.
- `src/**` production files: unchanged; new guard test only.
- `TARGETS`: existing five games and order unchanged.
- `TOTAL_BUDGET_MS`: unchanged at 400 ms.
- `tapExitCode`: unchanged; p95 never influences exit status.
- Boot/preload/PWA/asset source: unchanged, so `validate-boot` was not required as an additional Conductor smoke gate (the measurement smoke itself ran `validate-boot` and passed).

## Deviations

1. The phase subagent's permission layer denied the ancestry check, the test-first targeted run, and the post-implementation targeted run. The primary verified ancestry (exit 0), observed the expected missing-helper red result, then ran the green targeted test and completed the remaining verification/evidence without changing the implementation.
2. The preview smoke needed the documented `TAP_INERT_IDLE=1` cold control on this host because idle prewarm can import the tapped chunk before the measurement, leaving no new cold response for the existing script to observe.
3. Adding the guard test moved living suite truth from 156 / 3,380 to 157 / 3,385; only those count claims were refreshed.

## Primary verification

Primary independently inspected the full implementation diff, ran the targeted test, invalid-argument checks, full suite, coverage, build, all five validators, the exact configured `verify_phase` chain, and the cold-control preview smoke. Scope audit is clean and all required gates are green.

**Primary verdict: verified.**
