# Phase 1 Verification — Implement and prove the current spread

- Track: 20261127-progress-band-movement — Surface adaptive-band movement on the Progress Overview
- Phase: 1
- Date: 2026-11-27
- Branch: `feat/20261127-progress-band-movement`
- Phase base: `e278530c7372e7eb39831327c2f172c2c41ff93b`
- Code head: `5bdf0a3908720e12beaae4153ce5f0b479b262d8`
- Result: **verified** — the exact configured verification chain was run independently by the primary from the repository root and exited 0; every check in the chain passes.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Format/lint | `pnpm check` | 0 | Biome checked 378 files, no fixes applied. An earlier run flagged two formatting issues in the new tests; both were fixed and re-checked. |
| Types | `pnpm typecheck` | 0 | App and e2e TypeScript projects clean. |
| Unit | `pnpm test -- --run` | 0 | 159 files / 3,451 tests passed. |
| Coverage | `pnpm test:coverage` | 0 | 159 files / 3,451 tests; gate run reported 97.11 % statements / 91 % branches / 96.4 % functions / 98.25 % lines (the executor's individual run measured 97.12 / 91.04 / 96.4 / 98.25 — instrumentation varies by a fraction of a point between identical runs). |
| Build | `pnpm build` | 0 | 493 modules; shell chunk `index-CK_dfCdR.js` 200.86 kB / 51.47 kB gzip; PWA 65 precache entries / 1880.33 KiB. |
| Bundle | `node scripts/validate-bundle.js` | 0 | PASS; Phaser vendor chunk present; shell entry 196.2 kB <= 200 kB. |
| Module size | `node scripts/validate-module-size.js` | 0 | PASS; 174 TypeScript files, zero warnings. |
| Textures | `node scripts/validate-textures.js` | 0 | PASS; 319 SVGs, tiered 76.07 MiB <= 80 MiB, full uniform 319.00 MiB <= 320 MiB. |
| PWA | `node scripts/validate-pwa.js` | 0 | 16 passed / 0 failed; 53 JavaScript chunks / 53 precached. |
| Docs | `node scripts/validate-docs.js` | 0 | 5 passed / 0 failed after refreshing the living suite counts and build figures. Historical release notes and archived figures unchanged. |
| Full gate | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | 0 | Run by the primary from the repository root; all ten checks green. Worktree clean after the gate. |

The subagent's shell denied the chained command and two constituent validators (`permission.rejected`); the primary ran the exact chain and those validators successfully, so no verification blocker remains. One optional development-only command (`pnpm exec vitest run src/__tests__/game/adaptiveSummary.test.ts`) was also denied and was replaced by the full-suite run.

## Acceptance criteria

IDs and wording follow `conductor/tracks/20261127-progress-band-movement/spec.md`; AC-9 remains Phase 2 scope.

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | A fixture with assessed games in all three bands returns exact counts and deterministic copy. | Mixed-band fixture in `src/__tests__/game/adaptiveSummary.test.ts`; exact-count/copy assertions against `src/game/adaptiveSummary.ts`. | verified |
| AC-2 | Assessed games all at shift 0 render "all at classic," not a misleading movement claim. | All-classic fixture test asserts the "all at classic" line and no band-count claim. | verified |
| AC-3 | No game with six recent taps renders the explicit not-enough-play state. | Sparse-state test with sub-floor windows plus the exact 6-vs-5 boundary cases in `adaptiveSummary.test.ts`. | verified |
| AC-4 | Adaptive difficulty off renders the explicit disabled state even when windows contain enough taps. | Disabled-state test supplies full windows and pins the disabled line; component disabled test covers the Overview. | verified |
| AC-5 | Switching the viewed-profile chip changes the spread to that profile's data. | `ProgressOverlay.test.ts` viewed-profile switching tests; active profile id stays unchanged. | verified |
| AC-6 | Only the Overview note changes; the three statements and per-game-page static note remain intact. | `ProgressOverlay.test.ts` preservation tests; full 3,451-test suite green. | verified |
| AC-7 | Short/malformed windows are ignored safely and input progress is not mutated. | Malformed/short-window and frozen-input cases in `adaptiveSummary.test.ts`. | verified |
| AC-8 | Full verification passes, including coverage and docs validation 5/0. | Primary gate run, exit 0; coverage thresholds met; `node scripts/validate-docs.js` reports 5 passed / 0 failed. | verified |

## Commits (base..code head)

- `562ef26e` test(game): cover current adaptive band spread summary
- `bae087b5` feat(game): derive current adaptive band spread
- `cf56c614` test(progress): cover current band spread on the Overview
- `9ca7eb8b` feat(progress): show viewed profile's current band spread
- `8f269b2e` style: apply biome formatting to the new band tests
- `5bdf0a39` docs: sync living suite and build figures

## Scope

`git diff --stat e278530c..HEAD` (code head) reports 8 files, 456 insertions, 19 deletions:
`README.md`, `docs/TDD.md`, `docs/perf-baseline.md`, `src/game/adaptiveSummary.ts`, `src/__tests__/game/adaptiveSummary.test.ts`, `src/components/settings/ProgressOverlay.ts`, `src/__tests__/components/settings/ProgressOverlay.test.ts`, and the deviation below. No product/docs-of-record, storage, schema, dependency, asset or config files were changed.

## Deviations

- `src/__tests__/components/SettingsPanel.test.ts` — outside the phase Touches. One legacy test asserted that the Overview prints a text containing "adapt" and "Settings"; the new sparse line deliberately replaces that static note. The test's title and assertion were updated minimally to the current-band sparse copy so the suite stays green. No production code was changed there.

## Notes

- The two-week "60% move >= 1 band" metric is not claimed anywhere in the new copy or docs; AC-9 (longitudinal-distinction docs) stays in Phase 2.
- Adaptive-off and insufficient-sample states have explicit lines; per-game pages retain the original static note.
- Historical release notes and archived figures were not edited; only living/current figures were refreshed.
- This finalization changed only this evidence file; source, tests, docs, Conductor state and verification results are unchanged.

## Primary verification

- **Verdict:** accepted
- **Independent gate:** the primary ran the exact configured chain from the repository root at 2026-11-27 08:43–08:48 +11:00; exit 0. Biome 378 files, app/E2E TypeScript clean, Vitest 159 files / 3,451 tests, coverage 97.11 % statements / 91 % branches / 96.4 % functions / 98.25 % lines, Vite 493 modules, bundle/module-size/texture guards pass, PWA 16/0, docs 5/0.
- **Scope:** `git diff --name-only e278530c..HEAD` contains the seven planned files, this evidence file, and the documented `SettingsPanel.test.ts` test-only deviation. No storage, schema, dependency, asset, config, scoring, round-count or adaptive-threshold file changed.
- **Acceptance criteria:** AC-1 through AC-8 are proved by the corrected table above. AC-9 remains Phase 2 scope.
- **Deviation:** accepted as the smallest necessary update to a legacy assertion whose old static-note expectation no longer applies.
- **Visual smoke:** `.conductor/media/20261127-progress-band-movement/progress-band-overview.png` was captured from the production build and inspected; the Overview shows the seeded 3-game / 1-easier / 1-classic / 1-harder spread. Media stays gitignored under `.conductor/media/` and is for the PR only.
- **Checkpoint:** `df98e3246122e3f98af41e883d0facd6d061407c`.
