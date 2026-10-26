# Phase 1 — Base seam

- **Track:** `20261026-scene-rng-seam`
- **Phase:** 1 — Base seam
- **Date:** 2026-10-26
- **Branch:** `refactor/20261026-scene-rng-seam`
- **Base commit:** `1474ba23`
- **Head commit:** `0dc331fd`
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | 257 files; 1 warning + 1 info, both pre-existing (`musicalMemoryScene.test.ts` `noNonNullAssertion`; `biome.json` `$schema` 2.5.5 vs 2.5.10) |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| unit | `pnpm test -- --run` | 0 | 124 files / 2694 tests passed (2691 before this phase; +3 from the new suite) |
| unit | `pnpm test:coverage` | 0 | 97.82 statements / 91.85 branches / 96.77 functions / 98.74 lines against 90 / 85 / 88 / 95 |
| build-artifact | `pnpm build` | 0 | 344 modules; PWA `generateSW` 54 precache entries (1727.31 KiB) |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present (1342.6 kB); shell entry `index-BRBRqFYf.js` 138.7 kB ≤ 200 kB |
| smoke | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| docs | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| FR-1 | `GameSceneBase` accepts a trailing optional `rng: Rng = Math.random` and exposes `protected readonly rng: Rng` | `src/scenes/GameSceneBase.ts:74` (field), `:167` (constructor signature), `:171` (`this.rng = rng`); covered by the three cases in `gameSceneBaseRng.test.ts` | satisfied |
| FR-3 | `GroupMathConfig.buildPlaythrough` becomes `(shift, rng?) => Round[]` and `GroupMathScene` passes `this.rng` | `src/scenes/GroupMathScene.ts:81` (widened type), `:117` (call site passes `this.rng`) | satisfied |
| NFR-2 | TSDoc on changed public signatures states the `[0, 1)` contract in the house wording | Both edits carry the same "`rng` must return a number in [0, 1); tests pass a seeded generator so … is reproducible" phrasing used by the logic modules; the base field's TSDoc additionally records why it is a constructor parameter | satisfied |

## Files touched

- `src/scenes/GameSceneBase.ts` — `Rng` import, `protected readonly rng` field with TSDoc, constructor parameter
- `src/scenes/GroupMathScene.ts` — `Rng` import, widened `buildPlaythrough` type with TSDoc, call site forwards `this.rng`
- `src/__tests__/scenes/gameSceneBaseRng.test.ts` — new, 3 cases

## Deviations

None. No file outside Touches was modified.

## Notes

- The three new cases cover: the default is `Math.random` when no argument is
  passed; an injected generator is retained by reference and draws the same
  sequence as a fresh generator with the same seed; the reference survives an
  `init()` → `shutdown` → `init()` cycle, which is the instance-reuse path the
  base class documents.
- `GameSceneBase` is abstract, so the suite subclasses it. `rng` stays
  `protected` in production; the test subclass reads it through a getter rather
  than widening visibility.
- The `rng` parameter is optional in `GroupMathConfig` on purpose: both existing
  consumers (`addItUpLogic`, `takeAwayLogic`) already accept a trailing optional
  rng, so they satisfy the widened type without any edit. No logic module was
  touched.
- No game scene was changed in this phase, so production behavior is identical.
  Shell entry stayed at 138.7 kB and the precache count at 54.
- The phase executor subagent was interrupted by a host restart after writing all
  three files but before committing. The primary verified the partial work, ran
  the full gate, committed it as `0dc331fd`, and authored this evidence file.
