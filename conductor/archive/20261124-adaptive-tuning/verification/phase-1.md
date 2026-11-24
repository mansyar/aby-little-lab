# Phase 1 Verification — Designed curve and seeded simulation

- Track: `20261124-adaptive-tuning` (Adaptive Tuning)
- Phase: 1 — Designed curve and seeded simulation
- Date: 2026-11-24
- Branch: `feat/20261124-adaptive-tuning`
- Base commit: `0faf7b7c`
- Head commit at verification time: `f4cddd57` (evidence commit follows)
- Result: **blocked** — all executed checks are green; three verification commands were denied by the subagent shell permission policy and need the primary to run them.

## What was built

A pure, offline simulation module `src/game/adaptiveCurve.ts` that models preschool answer streams with a seeded mulberry32 RNG, a three-component latent-accuracy mixture, ten Bernoulli taps per profile, and the **real** `bandShiftFor` with two injected cut points. `bandShiftFor` gained two optional trailing parameters that default to the shipped constants, so single-argument behaviour is unchanged. The designed 70/15/15 (±10pp) curve is documented in TDD §7.3 and PRD §4.8; the shipped constants were **not** changed.

### Simulation design (recorded decision)

| Choice | Value |
| --- | --- |
| RNG | `mulberry32(seed)`, seed `20261124`, drawn fresh per candidate so every cut-point pair sees the same population |
| Population mixture | struggling `0.35` @ `0.15`, typical `0.62` @ `0.70`, thriving `0.85` @ `0.15` (weights authored to mirror a majority-typical population) |
| Window | 10 Bernoulli taps at the profile's latent accuracy (full `WINDOW_SIZE`, so cut points are effectively quantised to tenths) |
| Sample size | 1,000 profiles per distribution (≥ 1,000 required) |
| Up grid | `[0.70, 0.75, 0.80, 0.85, 0.90, 0.95]` |
| Down grid | `[0.40, 0.45, 0.50, 0.55, 0.60, 0.65]` |
| Passing pairs (6 of 36) | `(0.85, 0.40)`, `(0.85, 0.45)`, `(0.85, 0.50)`, `(0.90, 0.40)`, `(0.90, 0.45)`, `(0.90, 0.50)` |
| **Recorded candidate** | **`up = 0.90`, `down = 0.50`** — 19.2% down / 68.7% steady / 12.1% up at 1,000 profiles (20.1 / 67.9 / 11.9 at 2,000) |
| Shipped Phase 1 pair | `0.90 / 0.60` → 35.5% down / 52.4% steady / 12.1% up — outside tolerance; this is why Phase 2 must pin the candidate |

`up = 0.85` and `up = 0.90` are behaviourally identical on a 10-tap window (both require ≥ 9/10 correct); the candidate with `up = 0.90` is recorded because it keeps the existing up cut point and changes only `DOWN_THRESHOLD` in Phase 2.

## Commands table

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Unit (targeted) | `pnpm exec vitest run src/__tests__/game/adaptiveCurve.test.ts` | denied | Subagent shell permission rejected this exact command; the full-suite run below executes the same file. |
| Docs | `node scripts/validate-docs.js` | 0 | 5/5 after the count claims were refreshed. |
| Lint/format | `pnpm check` | 0 | Biome clean across 369 files. |
| Types | `pnpm typecheck` | 0 | App and e2e TypeScript projects clean. |
| Unit (full) | `pnpm test -- --run` | 0 | 156 files / 3,374 tests passed (up from 155 / 3,362: +1 file, +12 tests). |
| Coverage | `pnpm test:coverage` | 0 | All gates cleared: statements 97.11, branches 90.91, functions 96.33, lines 98.25. `adaptiveCurve.ts`: 98 / 100 / 100 / 97.77. |
| Build | `pnpm build` | 0 | 489 modules; shell entry `index-vc3BDukq.js` 192.8 kB; 51 chunks. |
| Bundle | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk and 200 kB shell-entry budget pass. |
| Module size | `node scripts/validate-module-size.js` | denied | Subagent shell permission rejected this command. Manual inspection: `adaptiveCurve.ts` is 156 lines, below the 400-line warn / 600-line fail budgets; no other production module changed size. |
| Textures | `node scripts/validate-textures.js` | denied | Subagent shell permission rejected this command. No SVG or asset file was touched by this phase. |
| PWA | `node scripts/validate-pwa.js` | 0 | 16/16 checks; 51 chunks, 51 precached. |
| Docs (final repeat) | `node scripts/validate-docs.js` | 0 | 5/5, re-run after the final doc edits. |

## Acceptance-criteria table

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| FR-1 / AC-1 | Designed 70/15/15 ±10pp curve authored and mirrored in TDD §7.3 / PRD §4.8 | New "Designed curve" paragraph in both docs; `TARGET_DISTRIBUTION` + `TARGET_TOLERANCE` in `adaptiveCurve.ts`; test `meets the designed 70/15/15 curve` | done |
| FR-2 / NFR-1 / AC-2 | Deterministic seeded simulation of ≥1,000 profiles, pure, injectable RNG, no new dependency, uses the real `bandShiftFor` | `mulberry32`, `sampleLatentAccuracy`, `simulateWindow`, `simulateDistribution` in `src/game/adaptiveCurve.ts`; `findTunedCutPoints`; tests for reproducibility, draw counts and a manual `bandShiftFor` cross-check | done |
| FR-2 edge case | Degenerate RNG never divides by zero or returns NaN | Test covering constant `0`, `0.5`, `0.999999` RNGs and an empty run; fixed-count denominator plus explicit zero guard in `simulateDistribution` | done |
| FR-1 default behaviour | Single-argument `bandShiftFor` unchanged | Optional trailing params default to `UP_THRESHOLD` / `DOWN_THRESHOLD`; equivalence and boundary tests in the new suite; existing `adaptiveLogic` suite still green | done |
| P1.T3 | Candidate cut points derived, recorded, not shipped | Grid search and recorded pair above; `CANDIDATE_UP = 0.9`, `CANDIDATE_DOWN = 0.5` exported as design output; shipped constants still `0.9 / 0.6` in `adaptiveLogic.ts` | done |

## Evidence paths

- `src/game/adaptiveCurve.ts` — pure simulation module (156 lines)
- `src/game/adaptiveLogic.ts` — optional cut-point parameters on `bandShiftFor` only
- `src/__tests__/game/adaptiveCurve.test.ts` — 12 tests covering RNG, model, distribution, search and defaults
- `docs/TDD.md` §7.3, `docs/PRD.md` §4.8 — designed-curve text
- `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` — refreshed living suite counts (156 files / 3,374 tests)
- Commits: `1ee07ada` (code + tests), `f4cddd57` (docs)

## Deviations

- `docs/perf-baseline.md`: four suite-count rows inside dated build-figure tables (lines 421, 758, 790, 851) were refreshed alongside the headers. `validate-docs.js` treats every `<N> files / <N> tests` row as a living claim, so leaving them at the old truth would fail check 5. Purely narrative history (e.g. "the same 154 files") was left untouched.
- No other file outside the brief's Touches was modified.

## Notes

- Denied commands are reported as blockers, not worked around; the equivalent full-suite, coverage and build gates all passed through permitted commands. Please run the three denied commands exactly as written and append their output here if they are green.
- Structure-tree module counts in README and TDD (`73 files = 43 modules`) became stale by one with the new `adaptiveCurve.ts`. They are not validator-checked test-count claims, so they were left for the Phase 4 doc sync.
- Phase 2 should pin `DOWN_THRESHOLD = 0.5` (`UP_THRESHOLD` stays `0.9`), update the constant table in TDD §7.3 and the 60% wording in PRD §4.8, and remove the Phase 1 "shipped pair is outside tolerance" sentence once the candidate ships.

## Primary verification

Primary (independent) verification run by the Conductor after the subagent reported three permission-denied commands. Working tree was clean; `git diff --name-only 0faf7b7c..HEAD` listed exactly the six Touches plus the evidence file, with no off-scope files.

| Blocked command (re-run verbatim by primary) | Exit | Evidence |
| --- | --- | --- |
| `pnpm exec vitest run src/__tests__/game/adaptiveCurve.test.ts` | 0 | 1 test file / 12 tests passed in 1.39s |
| `node scripts/validate-module-size.js` | 0 | 170 TypeScript modules checked, zero warnings (`adaptiveCurve.ts` is 156 lines) |
| `node scripts/validate-textures.js` | 0 | 319 SVGs; tiered 76.07 MiB <= 80, full 319.00 MiB <= 320, ratio 0.238 <= 0.500 |

Static checks: the simulator imports the real `bandShiftFor` from `src/game/adaptiveLogic.ts`, takes an injectable `Rng`, uses a fixed seed (`20261124`) and >= 1000 profiles, and asserts `distributionMeetsTarget` (70/15/15 with +/-10pp tolerance). The designed curve is present in TDD §7.3 (line ~1127) and PRD §4.8 (line ~431). `bandShiftFor`'s new optional cut-point parameters default to `UP_THRESHOLD`/`DOWN_THRESHOLD`, keeping single-argument behaviour unchanged. No new dependency was introduced (no package manifest change).

**Primary verdict: verified.** Every configured verification layer passed, including the three commands the subagent could not run.
