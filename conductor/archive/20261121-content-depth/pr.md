## Summary

Doubles the learning content in four core games and adds a machine-checkable art-budget guard so
growth cannot silently bloat the bundle: words 28→60, stories 15→30 (45→90 panels), scenarios
32→48, and shapes 18→24 — each pool with two opt-in signature variants and no repeats per
playthrough. Every count-bearing doc is synced to shipped source, and the texture guard is wired
into `verify_phase` with a synthetic-failure proof.

## Track

- **ID:** `20261121-content-depth`
- **Type:** `feature`
- **Spec:** [`conductor/archive/20261121-content-depth/spec.md`](conductor/archive/20261121-content-depth/spec.md)
- **Plan:** [`conductor/archive/20261121-content-depth/plan.md`](conductor/archive/20261121-content-depth/plan.md)
- **Review:** [`conductor/archive/20261121-content-depth/review.md`](conductor/archive/20261121-content-depth/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Word & shape depth | Word and shape pools meet their floors with tiers/partitions and two variants each | verified | `34c1d217` | 60 words (27 tier-3/33 tier-4), 24 shapes + 6 original SVGs; compile-forced `PatternBuilderScene.ts` map (F3, accepted); flaky tier-coverage test hardened (COVERAGE_SAMPLES 200→1500) |
| 2: Story & scenario depth | Story and scenario pools meet floors with ladders/guards and two variants each | verified | `1ac2204a` | 30 stories + 45 original panel SVGs (90 panels), 48 scenarios (12/emotion); strict art bijection preserved |
| 3: Budget guard & no-repeat | Expanded pools schedule without repeats and a machine-checkable texture guard is wired in | verified | `ff643225` | `scripts/validate-textures.js` added to `verify_phase`; caps re-baselined 39/178→80/320 MiB + hard ≤0.5 ratio by explicit owner decision; no-repeat proof across all four games |
| 4: Doc sync | Every count-bearing doc matches shipped pools and the budget gate is documented | verified | `edc25cae` | README/PRD/TDD/perf-baseline/product.md synced; validate-docs 5/5 |
| R1: Review fixes | Resolve round-1 review findings F1–F4 | verified | `f942afca` | F1 (High): six missing cut-outs added + registered + regression test; F2/F4 count and coverage docs reconciled |

## Requirements

- [x] `FR-1` — word pool ≥ 60 (test: `src/__tests__/game/decodeLogic.test.ts`)
- [x] `FR-2` — story pool ≥ 30 (test: `src/__tests__/game/storyOrderLogic.test.ts`, `storyOrderArt.test.ts`)
- [x] `FR-3` — scenario pool ≥ 48, 12/emotion (test: `src/__tests__/game/feelingsFacesLogic.test.ts`)
- [x] `FR-4` — shape pool ≥ 24 with matching cut-outs (test: `src/__tests__/game/shapeSorterLogic.test.ts:53-61`)
- [x] `FR-5` — two opt-in signature variants per pool (purity/byte-identical rule tests)
- [x] `FR-6` — no repeats per playthrough (`src/__tests__/game/noRepeatScheduling.test.ts`)
- [x] `FR-7` — machine-checkable art guard in `verify_phase` (`scripts/validate-textures.js`, synthetic failure proof)
- [x] `FR-8` — all count-bearing docs synced (`node scripts/validate-docs.js` 5/5)
- [x] `FR-9` — no new games/rules/scenes/GameId/i18n/input changes (see F3 accepted deviation)
- [x] `NFR-1` — art reuse + tiering; shell ≤ 200 kB (188.0 kB)
- [x] `NFR-2` — gentle, textless, age-appropriate content
- [x] `NFR-3` — injectable RNG preserved
- [x] `NFR-4` — `validate-docs.js` 5/5
- [x] `NFR-5` — no new deps/services; traceable art rights (all new art authored in-repo)
- [x] `AC-1` — 60 words (27/33)
- [x] `AC-2` — 30 stories (15/15) + 90 panels
- [x] `AC-3` — 48 scenarios (12/emotion)
- [x] `AC-4` — 24 shapes + 24 cut-outs
- [x] `AC-5` — two variants per pool, rules unchanged
- [x] `AC-6` — seeded no-repeat proof (5 degenerate + 128 seeds)
- [x] `AC-7` — texture guard PASS on real assets, FAIL on synthetic over-budget/ratio fixtures
- [x] `AC-8` — docs consistent, validator green
- [x] `AC-9` — no behavior/rule changes (see F3 accepted deviation)

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| unit | `pnpm test -- --run` | pass | 154 files / 3,346 tests |
| coverage | `pnpm test:coverage` | pass | 97.14/90.97/96.25/98.31% vs gates 95/88/85/90 |
| lint | `pnpm check` | pass | Biome clean, 343 files |
| typecheck | `pnpm typecheck` | pass | src + e2e clean |
| build | `pnpm build` | pass | 468 modules; shell 192.52 kB Vite / 188.0 kB validator ≤ 200 kB |
| bundle | `node scripts/validate-bundle.js` | pass | shell 188.0 kB |
| pwa | `node scripts/validate-pwa.js` | pass | 16/16, BGM + all 51 JS chunks precached |
| docs | `node scripts/validate-docs.js` | pass | 5/5 |
| textures | `node scripts/validate-textures.js` | pass | 319 SVGs (34 icon/283 card/2 hero); 76.07/80 MiB typical, 319.00/320 MiB full, ratio 0.238 |

All commands in the final `verify_phase` chain exited 0 on the final head. Evidence:
[`conductor/archive/20261121-content-depth/verification/integrated.md`](conductor/archive/20261121-content-depth/verification/integrated.md).

## Review

- **Verdict:** `PASS`
- **Rounds:** 2
- **Fixed:** 4 findings (F1 High missing cut-outs; F2 Medium count docs; F4 Low coverage %; plus F2-adjacent reconciliation)
- **Accepted/deferred:** 2 (F3 compile-forced scene map; FR-7 caps re-baseline override — both recorded in `review.md`)

## Deviations and risks

- **F3 (accepted):** widening `ShapeType` 18→24 forced six one-line entries in the exhaustive
  `Record<ShapeType, string>` at `src/scenes/PatternBuilderScene.ts:18`. Compile-forced, behavior-
  neutral; AC-9 remains partial for this literal scene touch.
- **FR-7 caps override (owner-approved 2026-11-21):** frozen 39/178 MiB caps were re-baselined to
  80/320 MiB plus a hard `typical ≤ full/2` ratio. The frozen caps were unsatisfiable once the
  corpus grew past 170 SVGs. The guard still fails on synthetic over-budget and bad-ratio fixtures
  (AC-7); the supersession is dated in `docs/perf-baseline.md`.
- **Phase 1 flake fix:** the tier-coverage test's 200-sample loop became flaky with a 33-word tier-4
  pool; `COVERAGE_SAMPLES` raised to 1500 with strict assertions unchanged, proven stable over 5 runs.
- **No new dependency, service, game, rule, scene behavior, i18n, or input mode was introduced.**
  All new art is original and authored in-repo.

## Follow-ups

- none

## Rollback

```bash
# Merge commit
git revert --no-edit -m 1 <merge-commit>

# Squash commit
git revert --no-edit <squash-commit>
```

No migration, feature flag, or saved-data change: this track only expands content pools, adds a
build-time art guard, and updates documentation. Reverting restores the prior pools and docs.
