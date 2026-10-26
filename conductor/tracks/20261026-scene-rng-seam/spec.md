# Specification: Scene RNG Seam

## Overview

Give the 22 game scenes an injectable random number generator, so scene-level
tests seed it instead of stubbing `Math.random` globally. This is the direct
sequel to `20261025-shared-random-helpers`, which threaded the seam through the
21 per-game logic modules but deliberately stopped at the logic boundary
(assumption A4 of that track).

That boundary left a measurable cost behind: **52 `vi.spyOn(Math, "random")`
sites across 27 scene test files**, plus a documented exception written into the
merged spec (`FR-6` clause (b) and `AC-4` clause (b) carve out "scoped
scene-level stubs in flow suites"). This track removes the cause rather than
continuing to document it.

## Problem / Motivation

The logic layer is now fully injectable, but the layer above it is not:

- **Scenes call builders bare.** `MemoryMatchScene.ts:98` reads
  `buildPlaythrough(getAdaptiveBandShift("memory-match"))` — there is no
  generator to inject, so a test has no way to seed the draw.
- **Global stubs are order-dependent.** `mockReturnValueOnce` builds a queue,
  and any change in how many times a code path draws silently shifts that queue
  for every later assertion in the file. This is not hypothetical: it is exactly
  the failure mode that produced both High findings in the predecessor track's
  review (F1 and F2), where three suites were passing on `undefined`-derived
  `NaN` output.
- **The spec carries a permanent wart.** FR-6's exception exists solely because
  the seam stopped one layer too low. Every future test written in a scene suite
  has to be told which of two conventions applies.

A scene-level rng removes all three. Phaser instantiates scenes via
`createSceneFromFunction` as `new scene()` with zero arguments
(`node_modules/phaser/src/scene/SceneManager.js:663`), so a trailing optional
constructor parameter defaults to `Math.random` in production and is only ever
supplied by tests.

## Goals & Success Metrics

| ID | Goal | Metric |
| --- | --- | --- |
| G1 | Every game scene holds an rng and forwards it to every random-dependent builder it calls | Zero non-default `Math.random` occurrences in `src/scenes/**` |
| G2 | No global random stubs remain in scene tests | `grep "vi.spyOn(Math" src/__tests__/scenes` returns zero matches |
| G3 | The FR-6 exception is retired, not re-documented | `spec.md` FR-6 and AC-4 each carry one default-wiring clause and no scene carve-out |
| G4 | Zero kid-visible behavior change | Full `verify_phase` green; shell and precache budgets unchanged |

## Scope

### In Scope

- `GameSceneBase` gains a trailing optional `rng: Rng = Math.random` constructor
  parameter, stored as `protected readonly rng`.
- All 22 game scenes gain the same parameter and forward it to `super(...)`.
  Every scene already has an explicit constructor, so this extends rather than
  adds.
- `GroupMathConfig.buildPlaythrough` widens from `(shift) => Round[]` to
  `(shift, rng?) => Round[]`, and `GroupMathScene` passes `this.rng`.
- Every builder call site in `src/scenes/**` passes `this.rng` in that builder's
  actual parameter position, including nested and per-tap draws.
- Test migration: 52 stub sites across 27 files become seeded injections using
  the existing `mulberry32` helper.
- `spec.md` FR-6 and AC-4 amended to retire the scene carve-out;
  `conductor/tech-stack.md` design note and `conductor/product.md` changelog
  record the change.

### Out of Scope

- Runtime seeding. The rng is a test seam only; no `scene.start(key, data)`
  plumbing and no user-facing reproducible-round feature.
- `src/utils/completionEffect.ts` confetti randomness — it is visual noise, not a
  gameplay draw, and it stays on `Math.random`.
- `BootScene`, `PreloadScene`, `HubScene` — none make gameplay draws.
- Any change to the 21 logic modules. That seam is complete.
- Art, audio, and gameplay tuning.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | `GameSceneBase` accepts a trailing optional `rng: Rng = Math.random` and exposes it as `protected readonly rng: Rng` | must |
| FR-2 | All 22 game scenes accept a trailing optional `rng` and forward it to `super(...)` | must |
| FR-3 | `GroupMathConfig.buildPlaythrough` becomes `(shift: BandShift, rng?: Rng) => Round[]`; `GroupMathScene` passes `this.rng` at its single call site | must |
| FR-4 | Every builder call site in `src/scenes/**` passes `this.rng` in that builder's actual parameter position, including nested draws (`BigSmallScene.createToys`, `PopFreezeScene` spawn configs, `MusicalMemoryScene.appendNote`) | must |
| FR-5 | No `Math.random` remains in `src/scenes/**` outside a default-parameter initializer | must |
| FR-6 | Every `vi.spyOn(Math, "random")` in scene and flow suites is replaced by an injected seeded rng; global stubs are removed except documented default-wiring assertions | must |
| FR-7 | `spec.md` FR-6 and AC-4 retire the scene carve-out; `tech-stack.md` and `product.md` record the change; `validate-docs` passes | should |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | Behavior-preserving. Phaser instantiates scenes with zero arguments (`SceneManager.js:663`), so production always takes the `Math.random` default. No kid-visible change. |
| NFR-2 | TSDoc on every changed public signature states the `[0, 1)` contract in the house wording established by the logic modules. |
| NFR-3 | Coverage gates maintained: lines 95 / functions 88 / branches 85 / statements 90. |
| NFR-4 | No new dependencies. Shell entry ≤ 200 kB, 42 JavaScript chunks precached, precache count unchanged. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | A test constructs each scene twice with `mulberry32(1234)` and receives identical rounds both times | FR-1, FR-2 |
| AC-2 | Static proof: `grep "Math\.random" src/scenes` returns zero matches; `grep "vi.spyOn(Math" src/__tests__/scenes` returns zero matches | FR-5, FR-6 |
| AC-3 | A seeded scene produces output equal to calling the same builder directly with the same seed — this proves argument **position**, not merely presence | FR-4 |
| AC-4 | Add It Up and Take Away each have a seeded determinism case driven through `GroupMathScene` | FR-3 |
| AC-5 | Full `verify_phase` chain exits 0 | NFR-1, NFR-2, NFR-3, NFR-4 |
| AC-6 | `spec.md` amended, `tech-stack.md` and `product.md` updated, `validate-docs` exits 0 | FR-7 |

## Edge Cases & Failure Modes

- **`storyOrderLogic.buildPlaythrough(rng, shift)` is rng-FIRST**, unlike every
  other builder. `StoryOrderScene.ts:90` already passes it first
  (`buildPlaythrough(Math.random, getAdaptiveBandShift("story-order"))`), so the
  change is a straight substitution to `this.rng`. Do not "normalize" it to a
  trailing parameter — that would silently swap the arguments.
- **`oddOneOutLogic.createRound(band, usedOddTextures, rng)` takes rng third.**
  The middle slot must be filled (`undefined`) or the generator lands in the
  `usedOddTextures` parameter. This is the exact defect that produced the
  predecessor track's review finding F2-adjacent bug.
- **`countLogic.createRound(band, target?, rng)`** has an optional parameter in
  the middle; passing rng second would target the `target` slot.
- **`wordLogic` has two draws in `WordBuilderScene`** — the playthrough
  (`:125`) and `generateLetterTiles` (`:171`). Both need the rng.
- **`PopFreezeScene` draws at three levels** — initial bubbles, then a spawn
  config per bubble, then a sleeping-animal pick per sleeping bubble.
- **`MusicalMemoryScene` draws twice per round** — the initial sequence and one
  `appendNote` per tap.
- **`AnimalTraceScene` draws for both path geometry and pair selection**
  (`generatePathPoints` and `selectThreePairs`).
- **Scene instances are reused across visits.** `GameSceneBase` documents that
  the audio context is dropped on shutdown for exactly this reason, so `rng`
  must be `readonly` and must not be reassigned per visit.
- **Tests that construct scenes in `beforeEach`** must pass the seed at
  construction, not stub before it — the stub has to be gone before the
  constructor runs.

## Dependencies

- **Tracks:** `20261025-shared-random-helpers` — complete, merged as PR #67
  (merge commit `0a6758c0`). It supplies `src/game/random.ts` (`Rng`, `shuffle`)
  and `src/__tests__/helpers/randomHelper.ts` (`mulberry32`). Satisfied.
- **External:** none.

## Open Questions & Assumptions

| ID | Assumption |
| --- | --- |
| A1 | The rng is a test seam only. No runtime seeding capability is added. |
| A2 | The rng lives on `GameSceneBase` as a constructor parameter rather than as a per-scene field or a module-level injectable. |
| A3 | Phaser instantiates scene classes with zero arguments — verified at `node_modules/phaser/src/scene/SceneManager.js:663`. |
| A4 | `completionEffect` confetti stays on `Math.random`; it is not a gameplay draw. |
| A5 | `sceneLifecycle.test.ts` and `firstWordsIntegration.test.ts` are in scope — they stub `Math.random` too, even though they are not per-game flow suites. |
| A6 | `mulberry32` remains the only seeded test helper; no second generator is introduced. |

## References

- Predecessor track: `conductor/archive/20261025-shared-random-helpers/`
- `src/game/random.ts` — `Rng` type and the shared `shuffle`
- `src/__tests__/helpers/randomHelper.ts` — `mulberry32`
- `src/scenes/GameSceneBase.ts:150` — base constructor
- `src/scenes/GroupMathScene.ts:74,110` — config type and its call site
- `node_modules/phaser/src/scene/SceneManager.js:663` — zero-argument instantiation
- `conductor/code_styleguides/typescript.md`, `conductor/code_styleguides/general.md`
