## Summary

Retunes the adaptive difficulty cut points against a deterministic simulation of the designed 70% steady / 15% down / 15% up curve, and adds a parent-only band readout to the existing per-game Learning Progress row. The shipped pair is `UP_THRESHOLD = 0.9` / `DOWN_THRESHOLD = 0.5` (down from 0.6), which the seeded 1,000-profile simulation places at roughly 19% down / 69% steady / 12% up ΓÇö inside every ┬▒10 percentage-point target. No save schema, game rule, or child-facing scene changed.

## Track

- **ID:** `20261124-adaptive-tuning`
- **Type:** feature
- **Spec:** [`conductor/archive/20261124-adaptive-tuning/spec.md`](conductor/archive/20261124-adaptive-tuning/spec.md)
- **Plan:** [`conductor/archive/20261124-adaptive-tuning/plan.md`](conductor/archive/20261124-adaptive-tuning/plan.md)
- **Review:** [`conductor/archive/20261124-adaptive-tuning/review.md`](conductor/archive/20261124-adaptive-tuning/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Designed curve and seeded simulation | Design the 70/15/15 curve and prove a cut-point pair reaches it with a seeded simulation of real `bandShiftFor` | verified | `e1cc5dee` | New pure `src/game/adaptiveCurve.ts`; 1,000 profiles, injectable RNG and cut points; TDD ┬º7.3 and PRD ┬º4.8 design prose added |
| 2: Apply tuned thresholds and protect existing behaviour | Pin the simulated pair into production without altering the `bandShiftFor` contract | verified | `4975075b` | One production line changed (`DOWN_THRESHOLD` 0.6 ΓåÆ 0.5); `WINDOW_SIZE`, `MIN_SAMPLE`, `BASE_LADDER` and byte identity preserved |
| 3: Parent band readout | Show the viewed profile's band on the per-game Learning Progress row, gated by the adaptive toggle | verified | `b1bfe433` | `bandShiftFor(game.recent)` on `getProgress(viewedId)`; `getAdaptiveBandShift()` deliberately not used; pure `progressBand.ts` formatter keeps the overlay under 400 lines |
| 4: Doc sync and full gate | Make every count-bearing and behaviour-bearing doc match the shipped behaviour and run the full gate | verified | `57a906a4` | Stale "candidate not yet shipped" prose replaced in PRD ┬º4.8 / TDD ┬º7.3; product roadmap row marked Done; full `verify_phase` green |

## Requirements

- [x] `FR-1` ΓÇö designed 70/15/15 curve met within ┬▒10pp (test: `src/__tests__/game/adaptiveCurve.test.ts`)
- [x] `FR-2` ΓÇö deterministic seeded simulation with injectable RNG importing the real `bandShiftFor` (test: `src/__tests__/game/adaptiveCurve.test.ts`)
- [x] `FR-3` ΓÇö only `UP_THRESHOLD` / `DOWN_THRESHOLD` retuned (test: `src/__tests__/game/adaptiveLogic.test.ts`)
- [x] `FR-4` ΓÇö `bandShiftFor` single-argument contract and boundary semantics preserved (test: `src/__tests__/game/adaptiveLogic.test.ts`)
- [x] `FR-5` ΓÇö parent band readout from the viewed profile, gated by the adaptive toggle (test: `src/__tests__/components/settings/ProgressOverlay.test.ts`)
- [x] `FR-6` ΓÇö PRD, TDD, roadmap and living counts synced (`node scripts/validate-docs.js` 5/5)
- [x] `FR-7` ΓÇö full `verify_phase` green (`verification/integrated.md`)
- [x] `NFR-1` ΓÇö no new dependencies, pure TypeScript
- [x] `NFR-2` ΓÇö no save schema, scene, tween or child-facing change
- [x] `NFR-3` ΓÇö all modules under 400 lines and docs checks 5/5
- [x] `NFR-4` ΓÇö shift-0 behaviour byte-identical
- [x] `AC-1` ΓÇª `AC-8` ΓÇö all eight acceptance criteria covered by the four verified phases (see `review.md`)

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| unit | `pnpm test -- --run` ΓÇö 156 files / 3,380 tests | pass | `conductor/archive/20261124-adaptive-tuning/verification/integrated.md` |
| coverage | `pnpm test:coverage` ΓÇö stmts 97.11/90, branch 90.93/85, funcs 96.33/88, lines 98.25/95 | pass | `conductor/archive/20261124-adaptive-tuning/verification/integrated.md` |
| lint | `pnpm check` ΓÇö 370 files, no fixes | pass | `conductor/archive/20261124-adaptive-tuning/verification/integrated.md` |
| format | `pnpm exec biome format .` ΓÇö 370 files, no fixes | pass | `conductor/archive/20261124-adaptive-tuning/verification/integrated.md` |
| typecheck | `pnpm typecheck` ΓÇö app + e2e | pass | `conductor/archive/20261124-adaptive-tuning/verification/integrated.md` |
| build | `pnpm build` ΓÇö 490 modules | pass | `conductor/archive/20261124-adaptive-tuning/verification/integrated.md` |
| bundle | `node scripts/validate-bundle.js` ΓÇö 192.9 kB Γëñ 200 kB | pass | `conductor/archive/20261124-adaptive-tuning/verification/integrated.md` |
| module size | `node scripts/validate-module-size.js` ΓÇö 171 modules, zero warnings | pass | `conductor/archive/20261124-adaptive-tuning/verification/integrated.md` |
| textures | `node scripts/validate-textures.js` ΓÇö 319 SVGs, all budgets | pass | `conductor/archive/20261124-adaptive-tuning/verification/integrated.md` |
| PWA | `node scripts/validate-pwa.js` ΓÇö 16/16, 51 chunks precached | pass | `conductor/archive/20261124-adaptive-tuning/verification/integrated.md` |
| docs | `node scripts/validate-docs.js` ΓÇö 5/5 | pass | `conductor/archive/20261124-adaptive-tuning/verification/integrated.md` |

## Media

![Parent Learning Progress band readout: Color Match band +1 and Memory Match band -1](https://github.com/user-attachments/assets/7b669311-ac07-4595-a202-f49b5d3231c9)

Captured against the built branch with seeded profiles (9/10, 5/10 and 1/10 recent windows) and adaptive difficulty on.

## Review

- **Verdict:** `PASS`
- **Rounds:** 1
- **Fixed:** 0 findings
- **Accepted/deferred:** 0 (see `review.md`)

## Deviations and risks

- `src/__tests__/components/SettingsPanel.test.ts` changed outside the Phase 3 file list: five exact stats-string expectations gained the ` ┬╖ band 0` suffix. Test-only and required by the intended stats-line change.
- Living suite counts were refreshed 3,362 ΓåÆ 3,374 ΓåÆ 3,376 ΓåÆ 3,380 across `README.md`, `docs/TDD.md` and `docs/perf-baseline.md` as tests were added, because `validate-docs.js` treats every such row as a current claim. Dated build figures and narrative history were left alone.
- Risk: the tuned pair comes from a simulation of realistic 3ΓÇô5-year-old answer streams, not aggregate production data (this is an offline family-only app that collects none). The reviewer independently re-derived the distribution at Γëê20.7/66.9/12.4%, inside all three tolerances.

## Follow-ups

- none

## Rollback

```bash
# Merge commit
git revert --no-edit -m 1 <merge-commit>

# Squash commit
git revert --no-edit <squash-commit>
```

No migration, feature flag or data change: reverting the merge restores `DOWN_THRESHOLD = 0.6` and removes the band suffix from the parent overlay. No stored profile data needs rewriting.

