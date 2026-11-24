# Phase 2 Verification — Apply tuned thresholds and protect existing behaviour

- Track: `20261124-adaptive-tuning` (Adaptive Tuning)
- Phase: 2 — Apply tuned thresholds and protect existing behaviour
- Date: 2026-11-24
- Branch: `feat/20261124-adaptive-tuning`
- Base commit: `99dad235`
- Head commit at verification time: `cd13ffe9` (this commit: code, tests and living doc counts)
- Result: **blocked** — every executed check is green; four verification commands were denied by the subagent shell permission policy and need the primary to run them.

## What changed

Pinned the Phase 1 grid-search winner in `src/game/adaptiveLogic.ts`: **`UP_THRESHOLD = 0.9` (unchanged)** and **`DOWN_THRESHOLD = 0.5` (changed from `0.6`)**. The sole behavioural difference is the 5/10 accuracy boundary: a window at exactly 50% now holds steady (shift `0`) instead of shifting down (`-1`). All other adaptive constants and logic are byte-identical to the phase base:

| Frozen item | Value | Byte-identical to base |
| --- | --- | --- |
| `WINDOW_SIZE` | `10` | yes |
| `MIN_SAMPLE` | `6` | yes |
| `BASE_LADDER` | `[1, 1, 2, 2, 3, 3]` | yes |
| `UP_THRESHOLD` | `0.9` | yes (not edited) |
| `updateRecentWindow`, `shiftLadder` | — | yes |
| `bandShiftFor` body (incl. `recent.length < MIN_SAMPLE -> 0` guard and single-argument default) | — | yes |
| simulation module `adaptiveCurve.ts` | — | yes (no production edit) |

Only `DOWN_THRESHOLD` in the production diff changed; no save schema, no game rule, no child-facing surface beyond that one band boundary.

## Commands table

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Unit (targeted) | `pnpm exec vitest run src/__tests__/game/adaptiveLogic.test.ts` | denied | Subagent shell permission rejected this exact command; the full-suite run below executes the same file. |
| Unit (targeted) | `pnpm exec vitest run src/__tests__/game/adaptiveCurve.test.ts` | denied | Same denial as Phase 1; full-suite run covers it. |
| Lint/format | `pnpm check` | 0 | Biome clean across 369 files. |
| Types | `pnpm typecheck` | 0 | App and e2e TypeScript projects clean. |
| Unit (full) | `pnpm test -- --run` | 0 | 156 files / 3,376 tests passed (up from 156 / 3,374: +2 test cases in the same two files, +0 files). This is the full-suite count used to refresh the living doc claims; `vitest list` was not needed separately. |
| Coverage | `pnpm test:coverage` | 0 | All gates cleared: statements 97.11 / 90, branches 90.91 / 85, functions 96.33 / 88, lines 98.25 / 95. `adaptiveCurve.ts`: 98 / 100 / 100 / 97.77. |
| Build | `pnpm build` | 0 | 489 modules; shell entry `index-DaRoPiPE.js` 197.45 kB as Vite prints it (192.8 kB via `validate-bundle`), 51 chunks, 63 precache entries (1875.24 KiB). |
| Bundle | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present; shell entry 192.8 kB <= 200 kB. |
| Module size | `node scripts/validate-module-size.js` | denied | Same denial as Phase 1. `src/game/adaptiveLogic.ts` shrank by one character in a numeric literal; `adaptiveCurve.ts` untouched; no module grew. |
| Textures | `node scripts/validate-textures.js` | denied | Same denial as Phase 1. No SVG or asset file was touched by this phase. |
| PWA | `node scripts/validate-pwa.js` | 0 | 16/16 checks; 51 chunks, 51 precached. |
| Docs | `node scripts/validate-docs.js` | 0 | 5/5 after the living suite-count claims were refreshed to 3,376. |

## Acceptance-criteria table

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| FR-3 / AC-3 | Tuned up/down thresholds pinned in `adaptiveLogic.ts`; only those two constants changed | `UP_THRESHOLD = 0.9`, `DOWN_THRESHOLD = 0.5` in `src/game/adaptiveLogic.ts`; frozen-item table above; production diff is one line | done |
| FR-4 / AC-3 / AC-4 | Band boundaries and contracts asserted with exact-boundary cases | `src/__tests__/game/adaptiveLogic.test.ts`: 0 below `MIN_SAMPLE` (5 taps), `+1` at/above the up cut (9/10 and 100%), `-1` below the down cut (4/10 and 0%), `0` between (8/10, 4/2, 6/4 and the changed 5/10). The explicit 0.6 injected-cut-point case (`bandShiftFor(makeWindow(5), 0.9, 0.6) -> -1`) is kept in `adaptiveCurve.test.ts` to prove injection, not shipped values. | done |
| FR-1 / AC-3 | Simulated distribution with the pinned constants meets the 70/15/15 ±10pp target | New test `meets the designed curve with the shipped pinned constants` in `adaptiveCurve.test.ts`: real `simulateDistribution(SIMULATION_PROFILES, UP_THRESHOLD, DOWN_THRESHOLD, mulberry32(SIMULATION_SEED))`, `profiles >= 1000`, `distributionMeetsTarget === true`, per-band bounds from `TARGET_DISTRIBUTION +/- TARGET_TOLERANCE`. Phase 1 recorded ≈19.2 / 68.7 / 12.1. | done |
| AC-3 | Shipped constants equal the recorded candidate pair | New test `pins the shipped thresholds to the recorded candidate pair` asserts `UP_THRESHOLD === CANDIDATE_UP === 0.9` and `DOWN_THRESHOLD === CANDIDATE_DOWN === 0.5` | done |
| NFR-4 / AC-5 | Existing adaptive guarantees intact; no shift-0 playthrough or game rule changed | Full suite green (156 / 3,376), including the `storage.test.ts` adaptive-band suites (9/1 -> +1, 8/2 -> 0, 1/9 -> -1, 4/2 -> 0, 0/6 -> -1), golden/byte-identity suites and every band test; none of those windows sits in the changed [0.5, 0.6) accuracy band | done |
| NFR-4 | No schema/save or child-facing change | No migration, type or asset change; only the numeric constant and test/docs edits | done |

## Evidence paths

- `src/game/adaptiveLogic.ts` — one-line production change: `DOWN_THRESHOLD` `0.6 -> 0.5`
- `src/__tests__/game/adaptiveLogic.test.ts` — constant assertion updated; 5/10 moved from `-1` to `0`; 4/10 replaces 5/10 as the `-1` exact case; 8/10 and 9/10 boundary comments clarified
- `src/__tests__/game/adaptiveCurve.test.ts` — imports `TARGET_TOLERANCE`; new `pinned tuned constants` describe with two tests (pinned pair, simulated distribution with shipped constants)
- `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` — living suite counts refreshed from 3,374 to 3,376 (file count stays 156)
- Commit `cd13ffe9` — `feat(game): Pin tuned adaptive thresholds to 0.9 / 0.5` (production, tests and living doc counts)

## Deviations

- `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` (line 49; TDD 1320/1326; perf-baseline 3/421/758/790/851): living `<N> tests` / `<N> files` claims refreshed from 3,374 to 3,376 so `validate-docs.js` check 5 stays 5/5. This is the count-only deviation anticipated by the brief; `docs/TDD.md` §7.3 and `docs/PRD.md` §4.8 prose were deliberately left untouched for the Phase 4 doc sync.
- No other file outside the brief's Touches was modified.

## Notes

- Denied commands are reported as blockers, not worked around. The two denied targeted Vitest runs are fully covered by the green full-suite run (which executes both files) and the green coverage run; the two denied validators are unchanged-environment checks and no texture/module file was touched. Please re-run all four exactly as written and append their output here if green.
- The living counts were refreshed from the authoritative `pnpm test -- --run` output (156 files / 3,376 tests); `validate-docs.js` independently derives the same truth from `vitest list --no-staticParse` and confirmed 5/5.
- Coverage figures quoted in `docs/TDD.md` §10.3 and `docs/perf-baseline.md` are dated snapshot prose, not validator-checked test-count claims, so they were left for the Phase 4 doc sync.

## Primary verification

Primary (independent) verification run by the Conductor after the subagent reported four permission-denied commands. The evidence file was untracked and the working tree otherwise clean; `git diff --name-only 99dad235..HEAD` listed exactly the three Touches plus the three count-only living-doc deviations. The full production diff is one line: `DOWN_THRESHOLD = 0.6 -> 0.5`; `UP_THRESHOLD`, `WINDOW_SIZE`, `MIN_SAMPLE`, `BASE_LADDER`, `updateRecentWindow`, `shiftLadder`, `bandShiftFor`'s body/defaults and `adaptiveCurve.ts` are byte-identical to the phase base.

| Blocked command (re-run verbatim by primary) | Exit | Evidence |
| --- | --- | --- |
| `pnpm exec vitest run src/__tests__/game/adaptiveLogic.test.ts` | 0 | 1 file / 15 tests passed; includes "shifts down below the 50% accuracy threshold" and "holds steady inside the neutral band" |
| `pnpm exec vitest run src/__tests__/game/adaptiveCurve.test.ts` | 0 | 1 file / 14 tests passed; includes "pinned tuned constants" and the shipped-constant distribution assertion |
| `node scripts/validate-module-size.js` | 0 | 170 TypeScript modules, zero warnings |
| `node scripts/validate-textures.js` | 0 | 319 SVGs; tiered 76.07 MiB <= 80, full 319.00 MiB <= 320, ratio 0.238 <= 0.500 |

Static checks: `adaptiveLogic.test.ts` asserts `UP_THRESHOLD === 0.9` and `DOWN_THRESHOLD === 0.5`; `adaptiveCurve.test.ts` asserts both shipped constants equal `CANDIDATE_UP`/`CANDIDATE_DOWN` and that `simulateDistribution(..., UP_THRESHOLD, DOWN_THRESHOLD, ...)` satisfies `distributionMeetsTarget` over >= 1,000 profiles. The explicit injected 0.6 case in that suite proves injection, not a shipped value. Full suite (156 / 3,376), coverage, build, bundle, PWA and docs 5/5 were green in the subagent run.

**Primary verdict: verified.** Every configured verification layer passed, including the four commands the subagent could not run.
