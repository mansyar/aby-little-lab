# Phase R1 evidence — Review Fixes

- **Track:** `20261124-first-tap-p95-baseline`
- **Phase:** R1
- **Date:** 2026-11-25
- **Branch:** `chore/20261124-first-tap-p95-baseline`
- **Base:** `7be677fa`
- **Head:** working tree based on `7be677fa` (no subagent commits before primary completion)
- **Result:** verified

## Finding disposition

- **F1 — resolved:** The tap report renderer is now a pure exported function with
  structural typings. Normal and `--with-preview` text/JSON output use the
  renderer, and behavioral text/JSON guard tests cover aggregate/per-game p95,
  median, worst, the 400 ms budget and the no-cold/null-p95 case. The primary
  supplied the intended test-first red result and post-implementation green
  result (1 file / 7 tests), completed the remaining checks, and ran the full
  `verify_phase` chain successfully.
- **F2 — resolved by the primary:** Confirmed read-only that `spec.md` now says
  an empty sample set yields `null` and a single-sample set returns that value.
  This subagent did not edit or revert `spec.md`.

## Changed files

- `scripts/firstTapReport.mjs` — new pure `renderFirstTapReport(taps, format =
  "text")`; JSON uses `JSON.stringify(taps, null, 2)` and text preserves the
  existing title, stage explanations, warm explanation, table header, run rows,
  cold median/p95, per-game p95, warm median, worst/no-cold, tap-kind counts and
  budget line without logging, I/O, measurement or input mutation.
- `scripts/firstTapReport.d.mts` — new structural declarations for the summary,
  runs, stage values, per-game p95 rows and `"text" | "json"` formats.
- `scripts/measure-first-tap.mjs` — imports the renderer, removes `printTapTable`,
  and uses the renderer in normal and `--with-preview` text and JSON branches.
  Preview JSON retains the existing `{ bootBudgetMs, ...suite }` envelope.
- `src/__tests__/guard/firstTapStats.test.ts` — adds a representative
  aggregate/per-game p95 report contract test and a no-cold/null-p95 test.
- `README.md` — count-only living snapshot update from 3,393 to 3,395 tests.
- `docs/TDD.md` — count-only living snapshot updates from 3,393 to 3,395 tests.
- `docs/perf-baseline.md` — count-only living value updates from 3,393 to 3,395
  tests in the header and four current-value rows.
- `conductor/tracks/20261124-first-tap-p95-baseline/spec.md` — pre-existing,
  uncommitted primary-applied F2 change; not edited by this subagent.
- `conductor/tracks/20261124-first-tap-p95-baseline/verification/phase-R1.md` —
  this blocked-phase record.

No package, lock, reviewed Word Match, source or configuration changes were
made.

## Test-first history

1. Added the report contract tests before implementation.
2. The initial shell attempt was denied before execution. The primary then ran
   the same required command verbatim; it exited 1 at collection because
   `scripts/firstTapReport.mjs` did not exist. This is the accepted red baseline.
3. Implemented the renderer, declaration, measurement integration and tests.
4. The first post-implementation shell attempt was denied. The primary then ran
   the command verbatim; it passed 1 file / 7 tests. This satisfies the green
   baseline for the report guard.
5. Continued with the remaining checks; a later shell permission denial
   prevented completion. The already-running full suite subsequently completed
   and its passing result is recorded below.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Targeted unit (red, primary-run) | `pnpm exec vitest run src/__tests__/guard/firstTapStats.test.ts` | 1 | Intended collection failure: report module absent before implementation |
| Targeted unit (green, primary-run) | `pnpm exec vitest run src/__tests__/guard/firstTapStats.test.ts` | 0 | 1 file / 7 tests passed |
| Lint/format | `pnpm check` | 0 | Biome checked 373 files; no fixes applied |
| Type safety | `pnpm typecheck` | 0 | App and e2e TypeScript checks passed |
| Full suite | `pnpm test -- --run` | 0 | 158 files / 3,395 tests passed |
| Coverage | `pnpm test:coverage` | 0 | Statements 97.08%, branches 90.92%, functions 96.35%, lines 98.23% |
| Build | `pnpm build` | 0 | Vite 8.3.8; 491 modules; shell 197.99 kB / 50.39 kB gzip; 64 precache entries |
| Bundle | `node scripts/validate-bundle.js` | 0 | Shell entry 193.4 kB <= 200 kB |
| Module size | `node scripts/validate-module-size.js` | 0 | 172 modules; zero warnings (primary re-run after subagent denial) |
| Textures | `node scripts/validate-textures.js` | 0 | 319 SVGs; all tiered and full budgets pass |
| PWA | `node scripts/validate-pwa.js` | 0 | 16 passed / 0 failed; 52 chunks precached |
| Docs | `node scripts/validate-docs.js` | 0 | 5 passed / 0 failed |
| Renderer smoke | exact R1 brief smoke command | 0 | `RENDERER_SMOKE_OK` |
| Whitespace | `git diff --check` | 0 | No whitespace errors |
| Full gate | configured `verify_phase` chain | 0 | `R1_VERIFY_PHASE_EXIT=0` |

## Scope audit

- Read-only grep confirms `printTapTable` is absent from
  `scripts/measure-first-tap.mjs`, all four normal/preview text/JSON paths call
  `renderFirstTapReport`, and the exact gate line
  `if (taps.worst.totalMs > taps.budgetMs)` remains at the unchanged call site.
- No `tapExitCode` logic, measured values, thresholds, sample parsing,
  warm-aware logic, target set, preview/boot logic or exit behavior was edited.
- No `package.json` or `pnpm-lock.yaml` edit.
- No `src/scenes/**` or `src/game/wordMatchArt.ts` edit.
- No source or configuration edit outside the allowed script/test paths.
- The primary completed both scoped Git audits against the base and the working
  tree; `package.json`, `pnpm-lock.yaml`, `src/scenes/**` and
  `src/game/wordMatchArt.ts` are byte-identical to `7be677fa`.
- The full suite proved the two new tests changed the living count from 3,393 to
  3,395; only those numeric count claims were refreshed in README, TDD and perf
  baseline documentation.

## Requirements coverage

| Requirement | Status | Evidence |
| --- | --- | --- |
| F1 | Covered | Pure renderer/declaration, four-path integration, 7 passing targeted guard tests and full gate pass |
| F2 | Covered | Primary-applied `spec.md` wording distinguishes empty and single-sample behavior |
| FR-1 | Covered | Existing p95 helper unchanged; JSON and text report integration preserves measured values |
| AC-1 | Covered | Text/JSON tests cover aggregate/per-game p95, no-cold behavior, median, worst and budget |
| NFR-3 | Covered | Full coverage, build, bundle, module-size, texture, PWA and docs gates pass |
| NFR-4 | Covered | Non-watch full suite and the complete `verify_phase` chain passed |

## Deviations

The subagent was permission-denied on its targeted test runs and module-size
validator. The primary ran each exact command verbatim, accepted the intended
red/green results, and completed the remaining checks. No implementation
deviation was required.

## Blockers

None remaining. The subagent's `node scripts/validate-module-size.js` denial was
cleared by the primary's exit-0 re-run (172 modules, zero warnings).

## Primary verification

The primary independently inspected the renderer and all four integration call
sites, confirmed `printTapTable` was removed, and verified the exact budget gate
`if (taps.worst.totalMs > taps.budgetMs)` remains unchanged. Targeted tests passed
7/7; the renderer smoke passed; scoped diffs prove package/lock and reviewed Word
Match files are unchanged; `git diff --check` passed. The complete configured
`verify_phase` chain passed with `R1_VERIFY_PHASE_EXIT=0`:

- `pnpm check`: 373 files, no fixes.
- `pnpm typecheck`: app and E2E clean.
- `pnpm test -- --run`: 158 files / 3,395 tests.
- `pnpm test:coverage`: statements 97.08%, branches 90.92%, functions 96.35%, lines 98.23%.
- `pnpm build`: Vite 8.3.8, 491 modules, shell 197.99 kB / 50.39 kB gzip, 64 precache entries.
- Bundle: 193.4 kB <= 200 kB; module size: 172 modules, zero warnings.
- Textures: 319 SVGs, all budgets pass; PWA: 16/16, 52 chunks precached.
- Docs: 5 passed / 0 failed with the refreshed living counts.

**Primary verdict: verified.**

