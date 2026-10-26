# PR: Scene RNG Seam — injectable randomness in the 22 game scenes

## Summary

Every game scene now carries its own injectable random number generator, and
every scene test seeds it instead of stubbing `Math.random` globally. This
finishes the randomness seam that `20261025-shared-random-helpers` started:
that track threaded an injectable `rng` through all 21 logic modules but
stopped at the logic boundary (its assumption A4), leaving 52
`vi.spyOn(Math, "random")` sites across 27 scene test files. This track
removes the cause rather than extending the carve-out. Pure internal
refactor — zero kid-visible change.

## Track

| | |
|---|---|
| Track ID | `20261026-scene-rng-seam` |
| Type / Priority | refactor / high |
| Branch | `refactor/20261026-scene-rng-seam` |
| Base | `master` @ `0a6758c0` |
| Phases | 5 + 1 review-fix phase, all verified |
| Spec / Plan | `conductor/tracks/20261026-scene-rng-seam/spec.md` · `plan.md` |

## What happened

| Phase | Goal | Checkpoint |
|---|---|---|
| 1 | Base seam — `GameSceneBase(key, rng = Math.random)`, `protected readonly rng`, `GroupMathConfig` widened | `0dc331fd` |
| 2 | Forward through the 16 single-draw scenes (+ the 12 arity assertions the change invalidated) | `385395da` |
| 3 | Six multi-draw scenes + the `sceneRngEquivalence` proof (mutation-tested) | `31e4283c` |
| 4 | Test migration — 52 stub sites across 27 files seeded; 27 `(AC-1)` determinism cases | `ae0ccaa2` |
| 5 | Docs truth pass — FR-6 scene carve-out retired, tech-stack + product updated | `59b81b3b` |
| R1 | Review fixes — shared replay helper, 15 pinned wiring assertions | `2adcf1db` |

Key design points:

- `GameSceneBase` gains a trailing `constructor(key, rng: Rng = Math.random)`
  storing `protected readonly rng` (readonly because Phaser reuses scene
  instances across visits). Phaser instantiates scenes with zero arguments
  (`SceneManager.js:663` — `new scene()`), so production always takes the
  `Math.random` default: no runtime behavior change.
- Every builder call site forwards `this.rng` in that builder's **real**
  parameter position — not uniformly trailing. `storyOrderLogic.buildPlaythrough(rng, shift)`
  keeps rng FIRST for `StoryOrderScene` call compatibility (the one
  deliberate exception, documented).
- The equivalence proof (`sceneRngEquivalence.test.ts`, 8 cases) compares
  seeded scene output against a direct builder replay through ONE shared
  rng instance — same-seed-twice alone would pass even with a wrong argument
  position; this is the test that catches it. A deliberate mutation (swapping
  StoryOrder's rng position) was verified to fail the suite.
- AC-1: 27 two-construction `mulberry32(1234)` determinism cases — all 22
  game scenes covered (ShadowMatchScene has no per-game suite, so its case
  lives in `shadowMatchFlow.test.ts`).

## Requirements

- [x] FR-1 — `GameSceneBase` trailing optional `rng`, stored `protected readonly rng`
- [x] FR-2 — all 22 game scenes accept and forward rng to `super(...)`
- [x] FR-3 — `GroupMathConfig.buildPlaythrough` widened to `(shift, rng?)`
- [x] FR-4 — every builder call site passes `this.rng` in the real parameter position
- [x] FR-5 — no `Math.random` in `src/scenes/**` outside default-parameter initializers
- [x] FR-6 — all 52 scene-test stub sites replaced by seeded construction
- [x] FR-7 — FR-6/AC-4 scene carve-out retired; tech-stack + product record the change
- [x] NFR-1..NFR-4 — behavior-preserving, house TSDoc, coverage gates, no new deps / budgets held

## Verification

Full chained `verify_phase` on the integrated branch — **exit 0**:

| Layer | Result |
|---|---|
| `pnpm check` | 258 files; only the 2 pre-existing diagnostics |
| `pnpm typecheck` | clean |
| `pnpm test -- --run` | 125 files / **2,729 tests** |
| `pnpm test:coverage` | 97.82 st / 91.96 br / 96.77 fn / 98.74 ln (gates 90/85/88/95) |
| `pnpm build` | 54 precache entries (1,727.85 KiB) |
| `validate-bundle.js` | shell entry 138.7 kB ≤ 200 kB; Phaser vendor present |
| `validate-pwa.js` | 16 passed / 0 failed (42 chunks, 42 precached) |
| `validate-docs.js` | 5 passed / 0 failed |

Static proofs: `vi.spyOn(Math` in `src/__tests__/scenes` → 0 matches;
`Math.random` in `src/scenes` → 23 constructor defaults + 2 TSDoc prose, 0
live draws.

## Review

**PASS** (2 rounds, strict mode). Round 1 (PASS WITH FINDINGS) found one
Medium (a latent divergent copy of the `pathRngForPair` replay helper) and
one Low (8 suites whose wiring assertions didn't pin the forwarded
generator); both fixed in the R1 phase and verified resolved in round 2 with
no new findings. Full record: `conductor/tracks/20261026-scene-rng-seam/review.md`.

## Deviations and risks

- Phase 2 owned 12 exact-arity assertion repairs its own changes invalidated
  (plan amended before the work resumed, commit `77a410d0`); Phase 3 added 3
  more of the same class.
- Phase 4's rework round added 3 missing AC-1 cases (ShapeSorter,
  ShadowMatch, a two-construction case for PopFreeze) and corrected the
  evidence arithmetic.
- Phase 5's executor was permission-denied on all file edits; the primary
  applied the five prepared edits (recorded in the phase-5 evidence).
- Risk: near-zero — production randomness source is unchanged (Phaser's
  zero-arg instantiation guarantees the default), and the full 2,729-test
  suite plus the equivalence proof guard the refactor.

## Follow-ups

- ~22 remaining scene suites (not flow suites) construct scenes bare and
  run on `Math.random` — pre-existing, out of FR-6's scope; a candidate
  polish track if deterministic scene-level coverage there is ever wanted.
- Pre-existing: `musicalMemoryScene.test.ts` `noNonNullAssertion` warning,
  `biome.json` schema-version skew.

## Rollback

Single-PR revert restores the prior per-game behavior; no data, schema, or
storage changes are involved.
