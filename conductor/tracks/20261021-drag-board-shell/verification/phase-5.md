# Phase 5 Verification — Migrate the 8 direct games to the reaction helpers

- **Track:** 20261021-drag-board-shell
- **Phase:** 5
- **Date:** 2026-10-21
- **Branch:** `refactor/20261021-drag-board-shell`
- **Base commit:** `24284e6` (phase start)
- **Head commit:** `0886557`

## Result: VERIFIED ✅

All 6 direct games with wrong-answer reactions now route their inline
`playIncorrect` + `recordWrong` + `mascot?.nod()` (+ optional wiggle) sequences
through `GameSceneBase.reactWrong(targets?)`. The two games without
wrong-answer paths (Animal Trace, Pop & Freeze — no right/wrong taps by design)
are noted below with nothing to migrate. Full gate green.

## Commands

| Command | Exit | Result |
|---|---|---|
| `pnpm check` | 0 | Biome clean (pre-existing schema-version info + 1 pre-existing lint warning in `musicalMemoryScene.test.ts`, both present before this phase) |
| `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| `pnpm test -- --run` | 0 | 2377 tests / 112 files passed |
| `pnpm test:coverage` | 0 | Statements 97.78% (≥90), Branches 90.88% (≥85), Functions 96.52% (≥88), Lines 98.63% (≥95) — all thresholds met |
| `pnpm build` | 0 | Built in 1.98s, 42 chunks |
| `node scripts/validate-bundle.js` | 0 | Shell entry `index-CvJcrZt_.js` = 130.1 kB ≤ 200 kB (also ≤ 195.4 kB phase budget); Phaser vendor chunk present |
| `node scripts/validate-pwa.js` | 0 | 16/16 checks passed, 42/42 chunks precached |

The gate was executed as the exact `&&`-chained sequence
`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
across two consecutive shell runs (check+typecheck+tests, then coverage+build+validators); every segment exited 0.

## Acceptance Criteria

| AC | Requirement | Status |
|---|---|---|
| AC-3 | The 8 direct games' wrong reactions route through the shared `reactWrong` helper; Feelings Faces override still effective | ✅ 6/8 migrated (the other 2 have no wrong path by design); `FeelingsFacesScene` override untouched and green in `gameSceneBase.test.ts` |
| FR-3 | GameSceneBase shared wrong-answer helpers used by direct games | ✅ see per-scene table |
| FR-4 | GameSceneBase/ChoiceRoundScene/GroupMathScene untouched except plug-in points | ✅ no changes to those three files in this phase |
| NFR-2 | Behavior preservation; mechanical test re-wiring only | ✅ see re-wire note below |

## Per-scene migration outcomes

| Scene | Before | After | Notes |
|---|---|---|---|
| ShapeSorterScene | tone+record+nod inline, then bounce tween | `this.reactWrong()` | Bounce-to-origin tween stays local (drag-shell concern, out of helper scope) |
| ShadowMatchScene | same pattern | `this.reactWrong()` | Bounce + success stamp/flash effects stay local |
| BigSmallScene | same pattern | `this.reactWrong()` | Box-lid wiggle/bump stays local — it is *correct-drop* feedback with its own BOX_WIGGLE_* constants (angle 3, 200/120ms), materially different from the WIGGLE_* wrong-reaction, so left local |
| MusicalMemoryScene | tone+record+nod, then `playSequence()` | `this.reactWrong()` + `playSequence()` | Sequence re-prompt stays local |
| MemoryMatchScene | tone+record+nod + two inline wiggle tweens (one per card over rect/back/face) | `this.reactWrong([rect,back,face ×2 cards])` | Single shared wiggle tween over all 6 card objects — identical WIGGLE_* amplitude/duration/repeat/ease; MISMATCH_PAUSE flip-back stays local |
| WordBuilderScene | tone+record+nod + inline wiggle tween over tile rect+letter image | `this.reactWrong([tileRect, tileLetterImage])` | Identical WIGGLE_* parameters via helper |
| PopFreezeScene | — | — | **No wrong-answer path by design** (no right/wrong taps); the `mascot.nod()` in `handleWake` is part of the positive wake reaction (playWake + wobble), left local |
| AnimalTraceScene | — | — | **No wrong-answer path by design**; only positive wiggleFood reaction exists, left local |

## Test re-wire (mechanical only)

`src/__tests__/scenes/memoryMatchScene.test.ts`:
- "mismatched pair wiggles…" — previously asserted **two** wiggle tweens (one per card). The helper emits **one** shared tween over all six card objects with identical angle (4), yoyo, repeat, and ease. Re-wired the structural assertion to `toHaveLength(1)` on the shared tween and kept the behavior assertions (both card rects present in targets, `yoyo: true`, flip-back after pause, input unlock, round not advanced, `playIncorrect` called exactly once).
- "uses smaller wiggle amplitude…" (reduced motion) — same re-wire: one shared tween at angle 2 / duration 200; kept duration + reduced flip-duration (120ms) assertions.

No behavior assertion was weakened. All other suites passed unchanged
(playIncorrect called-once / not-called assertions remain valid because
`reactWrong` calls `playIncorrect` internally).

## Evidence paths

- Per-phase gate output: this file (commands table above).
- Task commits: `ce54e35` (Shape Sorter, Shadow Match, Big vs Small), `3ad91c6` (Musical Memory, Build the Word), `0886557` (Memory Match + test re-wire).

## Deviations

None. All changes are inside the phase `Touches` scope (the six scene files plus
their matching test files).

## Notes

- Migration is behavior-neutral: `reactWrong()` = `playIncorrect()` +
  `recordWrong()` + mascot nod (+ reduced-motion-aware wiggle only when targets
  are given), matching the inline sequences exactly.
- Bundle headroom improved: shell entry 130.1 kB vs 195.4 kB budget.
- Full suite ran twice green (after each of the last two batches and in the
  final gate), confirming no cross-scene regressions.
