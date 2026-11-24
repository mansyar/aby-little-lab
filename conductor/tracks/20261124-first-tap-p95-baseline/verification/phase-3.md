# Phase 3 verification — Baseline publication and integrated gate

## Phase goal and scope

Publish the resumed, dated, headed cold-control first-tap p95 baseline after the
reviewed Word Match fix; retain the historical Word Match measurement and failed
pre-fix result; add a per-release refresh procedure; and prepare the integrated
evidence placeholder for the primary's independent full-chain verification.

Scope for this phase was limited to:

- `docs/perf-baseline.md`;
- this file; and
- `verification/integrated.md`.

`README.md` and `docs/TDD.md` were not changed: the living suite count remained
158 files / 3,393 tests, as proved by the Vitest run and `validate-docs.js`.
No source, test, script, configuration, package manifest or lockfile was changed.

## Published content summary

The live header now points to the resumed fixed-tree result: 50 cold / 0 warm
headed cold-control samples, aggregate cold p95 response / finished / total
63.3 / 45.2 / 270.1 ms, cold median total 203.6 ms, and worst cold total
277.5 ms (Shape Sorter), inside the unchanged 400 ms gate.

The new dated section before the existing Word Match section records:

- track `20261124-first-tap-p95-baseline` and the exact published command;
- the natural run's 1 cold / 49 warm result and the approved cold-control
  fallback, without presenting the fallback as a natural all-cold run;
- Node v24.22.2, Playwright 1.65.1, local interactive headed Chromium,
  production Vite preview, neutralised Hub idle prewarm and warm-aware
  classification;
- exit 0, 50 cold / 0 warm, exactly 10 samples for each of the five unchanged
  games, aggregate p95, cold median total, `validate-boot` exit 0, and boot
  medians of 644.3 ms unthrottled / 4728.1 ms at 4× throttling;
- the per-game p95 table and the report-only p95 / worst-cold ≤400 ms gate
  distinction;
- the raw JSON evidence link;
- preservation of the failed 507.4 ms Find the Word pre-fix result in
  `phase-2.md`; and
- a six-step per-release refresh procedure that forbids headless/warm-only
  substitutions, reduced samples/targets and gate weakening.

No p95 breach exists, so no follow-up was created. The entire existing Word Match
fix section remains a dated prior measurement with its original numbers and
review-fix labels intact.

## Current build and suite facts

The configured checks reproduced the living figures retained in the header:

| Fact | Result |
| --- | --- |
| Vite | 8.3.8 |
| Transformed modules | 491 |
| Shell entry | `index-DcqZRslV.js` |
| Shell size | 193.4 kB validated / 197.99 kB Vite / 50.39 kB gzip |
| JavaScript chunks | 52 |
| PWA precache | 64 entries (1876.89 KiB) |
| Vitest | 158 files / 3,393 tests passed |
| Coverage | 97.10% statements / 90.96% branches / 96.35% functions / 98.23% lines |

## Raw evidence and assertions

The committed evidence is
[`verification/first-tap-headed.json`](first-tap-headed.json). It was not rerun
in Phase 3. Its recorded assertions are:

- `validateBoot.exitCode` is 0;
- `warmAware` is true, with 50 cold and 0 warm samples;
- each of the five target games contributes exactly 10 cold samples;
- aggregate cold p95 response / finished / total is 63.3 / 45.2 / 270.1 ms and
  cold median total is 203.6 ms;
- worst cold total is 277.5 ms for Shape Sorter, below the unchanged 400 ms
  budget;
- every per-game worst cold total is ≤400 ms;
- Find the Word p95 and worst cold total are both 249.6 ms; and
- unthrottled / 4×-throttled boot medians are 644.3 / 4728.1 ms.

## Requirements coverage

| Requirement | Phase 3 coverage | Status |
| --- | --- | --- |
| FR-3 | Dated live section includes command, sample count, target set, headed/cold-control disclosure, per-game p95 table, raw evidence link and per-release checklist. | Covered |
| FR-4 | Phase evidence and integrated placeholder created; the primary's independent full-chain result is still required. | Pending primary |
| FR-6 | Published p95 is explicitly report-only; the only exit gate remains worst cold total >400 ms, and no p95 follow-up is needed. | Covered |
| NFR-3 | Coverage, suite, bundle, PWA and docs checks passed; module-size and texture validator execution was permission-denied. | Partial / blocked |
| NFR-4 | Vitest ran only in `--run` / coverage modes; the primary must run and record the single full-chain gate. | Pending primary |
| AC-4 | New dated section contains all required fields; `validate-docs.js` reports 5 passed / 0 failed. | Covered |
| AC-5 | Worst per-game cold p95 is 277.5 ms, so no breach or follow-up is required. | Covered |
| AC-8 | Component checks passed where permitted; integrated full-chain exit 0 is pending the primary and the two denied validators. | Pending primary |

## Scope audit

- `package.json` and `pnpm-lock.yaml` were not modified in this phase.
- No `src`, test, script, E2E or configuration file was modified in this phase.
- The existing Word Match section was preserved; the documentation diff changes
  the live header sentence and inserts the new section before that history.
- `README.md` and `docs/TDD.md` remain unchanged because their 158 / 3,393 count
  claims still pass document validation.
- The headed measurement was not rerun.
- The reviewed PR #97 selective preload fix was not touched.
- No deviations from the phase `Touches` paths.

## Command results

Commands were run separately, without `&&` chains or pipes.

| # | Command | Result |
| ---: | --- | --- |
| 1 | `node scripts/validate-docs.js` | Exit 0; 5 passed / 0 failed. |
| 2 | `pnpm check` | Exit 0; Biome checked 373 files, no fixes. |
| 3 | `pnpm typecheck` | Exit 0; application and E2E TypeScript checks passed. |
| 4 | `pnpm test -- --run` | Exit 0; 158 files / 3,393 tests passed. |
| 5 | `pnpm test:coverage` | Exit 0; 158 files / 3,393 tests passed; 97.10 / 90.96 / 96.35 / 98.23% coverage. |
| 6 | `pnpm build` | Exit 0; Vite 8.3.8, 491 modules, 52 JS chunks, 64 PWA precache entries; existing Phaser chunk-size advisory remains non-fatal. |
| 7 | `node scripts/validate-bundle.js` | Exit 0; shell 193.4 kB ≤200 kB. |
| 8 | `node scripts/validate-module-size.js` | Permission denied by the shell tool; not executed. |
| 9 | `node scripts/validate-textures.js` | Permission denied by the shell tool; not executed. |
| 10 | `node scripts/validate-pwa.js` | Exit 0; 16 passed / 0 failed. |
| 11 | `node scripts/validate-docs.js` | Exit 0; 5 passed / 0 failed. |
| 12 | `git diff --check` | Exit 0; no whitespace errors. |
| 13 | `git diff --name-only c86ad34a..HEAD` | Exit 0; only `docs/perf-baseline.md`, `verification/phase-3.md` and `verification/integrated.md`. |
| 14 | `git diff --exit-code c86ad34a..HEAD -- package.json pnpm-lock.yaml src scripts e2e playwright.config.ts vite.config.ts` | Exit 0; package/lock, source, scripts, E2E and configuration are unchanged. |

## Blockers

The following commands returned `Permission denied: shell`. They were not
retried, rephrased or worked around:

- `node scripts/validate-module-size.js`
- `node scripts/validate-textures.js`
- `git merge-base --is-ancestor 025b037f HEAD` (optional preflight ancestry probe;
  the dependency relationship is already documented in the brief, spec and
  plan)

The primary must supply outputs for the two required validators before the phase
can be declared verified. The optional ancestry probe is not a release gate.

## Deviations

None.

## Primary verification

Primary independently verified Phase 3 on the final tree at `a9084220`, before
squashing the phase.

| Check | Primary result |
| --- | --- |
| `git merge-base --is-ancestor 025b037f HEAD` | Exit 0. |
| `node scripts/validate-module-size.js` | Exit 0; 172 TypeScript modules, zero warnings. |
| `node scripts/validate-textures.js` | Exit 0; 319 SVGs, tiered 76.07/80 MiB, full 319.00/320 MiB, ratio 0.238/0.500. |
| Full configured `verify_phase` | `PHASE3_VERIFY_PHASE_EXIT=0`. |
| `pnpm check` | 373 files, no fixes. |
| `pnpm typecheck` | Application and E2E clean. |
| `pnpm test -- --run` | 158 files / 3,393 tests passed. |
| `pnpm test:coverage` | Statements 97.08%, branches 90.92%, functions 96.35%, lines 98.23%; all gates clear. |
| `pnpm build` | Vite 8.3.8, 491 modules, shell `index-DcqZRslV.js` 197.99 kB / 50.39 kB gzip, 64 PWA precache entries. |
| `node scripts/validate-bundle.js` | Shell 193.4 kB ≤200 kB. |
| `node scripts/validate-pwa.js` | 16 passed / 0 failed; 52 chunks precached. |
| `node scripts/validate-docs.js` | 5 passed / 0 failed. |

The primary inspection of the documentation diff confirmed:

- the live header and new dated section publish the resumed 50-cold figures;
- the natural 1-cold / 49-warm run and approved cold-control fallback are disclosed;
- Find the Word p95 is 249.6 ms and the worst game is Shape Sorter at 277.5 ms;
- the earlier failed 507.4 ms Find the Word result remains in Phase 2 history;
- the existing Word Match measurement and all dated history remain intact;
- no source, test, script, configuration, package or lockfile changed in Phase 3.

The primary refreshed only the live-header coverage percentages to the final
full-chain run (97.08 / 90.92 / 96.35 / 98.23). No measurement value changed.

**Primary verdict: verified.**
