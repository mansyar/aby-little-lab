## Summary

The four signature content variant packs shipped in v1.25.0 were data-only, so
children never saw them. This track wires them into real playthroughs with a
pure one-draw-per-playthrough selector, optional variant arguments on the four
generators, full-pool fallbacks for thin variants, and scene pass-through in
Word Match, Story Order, Shape Sorter and Feelings Faces. Round counts, scoring,
completion and adaptive-band behaviour are unchanged; PRD, TDD and changelog now
describe the shipped behaviour.

## Track

- **ID:** `20261126-wire-content-variants`
- **Type:** `feature`
- **Pull request:** [#104](https://github.com/mansyar/aby-little-lab/pull/104)
- **Spec:** [`conductor/archive/20261126-wire-content-variants/spec.md`](conductor/archive/20261126-wire-content-variants/spec.md)
- **Plan:** [`conductor/archive/20261126-wire-content-variants/plan.md`](conductor/archive/20261126-wire-content-variants/plan.md)
- **Review:** [`conductor/archive/20261126-wire-content-variants/review.md`](conductor/archive/20261126-wire-content-variants/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Rule-level variant wiring | `contentVariants.ts` selector plus optional variant ids on four generators | verified | `028ac8a0` | Full-pool fallbacks for thin variants; seeded tests; living suite counts refreshed after the gate found stale docs |
| 2: Scene pass-through | Four scenes select one slide per playthrough and forward it to generators | verified | `9f2eab18` | Two test-support adjustments for the selector import and Story Order RNG replay |
| 3: Docs truth sync | PRD, TDD and changelog describe the wired variants | verified | `88c85b00` | PRD §4.11 added instead of an invented §10 |
| R1: Review fixes | Reconcile spec scope and evidence traceability | verified | `62ecfb94` | Conductor prose only; no behavioural change |

## Requirements

- [x] `FR-1` — pure `pickVariantId` selector with frozen id arrays and one clamped RNG draw (test: `src/__tests__/game/wordLogic.test.ts`)
- [x] `FR-2` — `generateWordPlaythrough` accepts an optional variant with tier guard (test: `src/__tests__/game/wordLogic.test.ts`)
- [x] `FR-3` — `buildPlaythrough` accepts an optional variant with story fallback (test: `src/__tests__/game/storyOrderLogic.test.ts`)
- [x] `FR-4` — shape `generatePlaythrough` accepts an optional variant with band fallback (test: `src/__tests__/game/shapeSorterLogic.test.ts`)
- [x] `FR-5` — `drawScenarios` accepts an optional variant with emotion/length guard (test: `src/__tests__/game/feelingsFacesLogic.test.ts`)
- [x] `FR-6` — four scenes select and forward one variant id per playthrough (six scene/flow test files)
- [x] `FR-7` — no-variant path is byte-identical and draws no extra RNG
- [x] `FR-8` — seeded both-slide tests cover fallbacks and all invariants
- [x] `FR-9` — PRD, TDD and changelog match the shipped behaviour
- [x] `NFR-1`–`NFR-5` — no asset/schema/dependency/config change; purity, preserved gameplay, green gate and docs validator
- [x] `AC-1`–`AC-9` — all criteria covered (see `review.md` requirements table)

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| full configured gate | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | pass (exit 0; 158 files / 3435 tests; 97.11 % statements; PWA 16 / 0) | `conductor/archive/20261126-wire-content-variants/verification/integrated.md` |
| docs (independent reviewer re-run) | `node scripts/validate-docs.js` | pass (5 / 0) | `conductor/archive/20261126-wire-content-variants/review.md` |
| scope | `git diff --name-only f328437f..HEAD` | pass (source, tests, living docs and Conductor state only) | `conductor/archive/20261126-wire-content-variants/verification/integrated.md` |

## Review

- **Verdict:** `PASS`
- **Rounds:** 2
- **Fixed:** 1 finding (Low spec/plan inconsistency; two adjacent evidence inaccuracies corrected in the same round)
- **Accepted/deferred:** 0 (see `review.md`)

## Deviations and risks

- Phase executors could not run the shell verification chain because of a permission denial. The primary ran the exact configured command with exit 0 and appended its output to each phase brief; no gate was skipped, split or rephrased.
- Living suite counts and build figures were stale in `README.md`, `docs/TDD.md` and `docs/perf-baseline.md`; they were refreshed when the gate exposed the mismatch, while historical release notes were left untouched.
- `src/__tests__/scenes/artDeclarations.test.ts` allowlists `contentVariants` and `src/__tests__/scenes/sceneRngEquivalence.test.ts` consumes the selector RNG draw before Story Order replay; both are necessary consequences of the scene selector.
- PRD §4.11 was added because the document ends at §9; no §10 was invented and all existing anchors remain valid.
- One pre-existing Vite Phaser chunk-size advisory appears in the build; it is unrelated and unchanged by this track.

## Follow-ups

- none

## Rollback

```bash
# Squash commits (this branch has no merge commit yet)
git revert --no-edit 62ecfb94
git revert --no-edit 88c85b00
git revert --no-edit 9f2eab18
git revert --no-edit 028ac8a0
```

No migration, feature flag, data or storage change is needed; reverting the four
commits restores the previous variant-free behaviour and documentation.
