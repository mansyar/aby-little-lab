# Integrated Verification — Session Lifecycle Integrity

- **Track:** 20261022-session-lifecycle — Session Lifecycle Integrity
- **Branch:** fix/20261022-session-lifecycle
- **Base:** master @ cbf017ecf9eaf65e4fda5a1e8a2efc635193cc5d
- **Head:** a91165f (the review-fix phase, plus the post-review doc sync)
- **Date:** 2026-10-22
- **Result:** verified

## Commands

The configured `verify_phase` gate is
`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`.

The numbers below are the **final** state, after Phase R1 (the review fixes).
The gate was also run before Phase R1; that run is recorded in the per-phase
evidence files.

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | 247 files checked. 1 warning (`src/__tests__/scenes/musicalMemoryScene.test.ts:294`, non-null assertion) and 1 info (`biome.json` `$schema` 2.5.5 vs CLI 2.5.10). Both predate this track, in files this track does not touch, and are unchanged. |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean. |
| unit | `pnpm test -- --run` | 1 | 7 failed files / 10 failed tests — **every one a wall-clock timeout** (5,000 / 15,000 / 20,000 ms) in files this track does not touch. No assertion failure. The failing set differs between runs. |
| unit | `pnpm test -- --run --maxWorkers=2` | 0 | **118 test files passed, 2488 tests passed, 0 failed** (the documented fallback for this machine). |
| unit | `pnpm test:coverage -- --maxWorkers=2` | 0 | 118 files / 2488 tests passed. Coverage: **Statements 97.92%** (gate 90), **Branches 91.62%** (gate 85), **Functions 96.58%** (gate 88), **Lines 98.69%** (gate 95). All four gates hold. |
| build-artifact | `pnpm build` | 0 | Build succeeded. |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present (`phaser-P1E8uaLi.js`, 1342.6 kB); shell entry `index-BrQ7goBH.js` = **134.6 kB** (≤ 200 kB). |
| build-artifact | `node scripts/validate-pwa.js` | 0 | **16 passed, 0 failed.** |

The `--maxWorkers=2` variant of the two test segments is accepted under the
workflow's fallback ladder: the plain command fails only on environment-induced
wall-clock timeouts in files this track never touches, and the full suite passes
under the stabilized form. No test code was changed to work around a timeout.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | A two-visit regression test fails on the base and passes after the change (FR-1). | `verification/phase-1.md` — the new test failed on the unmodified base with "expected [...] to have a length of 3 but got 6" and passes after. | pass |
| AC-2 | No scene assigns `this.progressDots` (FR-1). | `verification/phase-1.md` — the four per-scene resets are gone and the base is the only assigner. | pass |
| AC-3 | The wrong reaction plays the tone once, records one wrong tap and nods the mascot; exactly one `playIncorrect()` call site exists (FR-2). | `verification/phase-2.md` — the new choice-round test asserts one tone, one wrong tap, a nod and one wiggle with the exact angle, duration, repeat count and ease; the source scan asserts a single `playIncorrect(` in `src/scenes`, in `GameSceneBase.ts`. | pass |
| AC-4 | A mid-session shutdown folds the taps into the rolling window and leaves the cumulative counters, wins and plays unchanged (FR-3). | `verification/phase-3.md` — the new test asserts the exact window contents after an abandon and that `correct`, `wrong`, `wins` and `plays` are unchanged. | pass |
| AC-5 | The shutdown handler does not accumulate across two visits (FR-4). | `verification/phase-2.md` — the live handler count goes 1 → 0 → 1 → 0 across two visits. | pass |
| AC-6 | The full `verify_phase` gate passes and the four coverage gates hold (FR-1..FR-4). | This document — every segment exits 0 under the stabilized test form, and coverage is above all four gates. | pass |

## Evidence paths

- `conductor/tracks/20261022-session-lifecycle/verification/phase-1.md` — Progress-Dot Lifecycle
- `conductor/tracks/20261022-session-lifecycle/verification/phase-2.md` — One Reaction, One Registration
- `conductor/tracks/20261022-session-lifecycle/verification/phase-3.md` — Abandoned Session Reaches the Adaptive Window
- `conductor/tracks/20261022-session-lifecycle/verification/phase-R1.md` — Review Fixes
- `conductor/tracks/20261022-session-lifecycle/review.md` — the review, round 1 and round 2
- `.conductor/evidence/20261022-session-lifecycle/` — raw failing-run logs (gitignored)

## Deviations

1. **The test segments of the gate ran with `--maxWorkers=2`.** See above.
2. **`src/types/index.ts`** (Phase 3) — the `recent` field's doc comment said
   the window is "folded in when a session completes", which the change makes
   incomplete. Comment only; no type, default or behaviour touched.
3. **`src/__tests__/helpers/sceneFlowHarness.ts`** (Phase 2) — the helper
   looked the scene's shutdown listener up in `events.on` only, so with the
   cleanup registered through `events.once` it would never be found. It now
   fires listeners registered through either style, which is what the scene's
   own emitter does. Test-tree change; no existing mock behaviour changed.
4. **`src/scenes/FeelingsFacesScene.ts`** (Phase 2) — a doc comment that
   described the old ordering of the wrong-answer reaction. Comment only.
5. **`src/__tests__/scenes/gameSceneBase.test.ts`** (Phase 2) — the AC-3 source
   scan uses `import.meta.glob(..., { query: "?raw" })` rather than `node:fs`,
   because the repository has no root `@types/node` and `node:fs` would not
   type-resolve under `pnpm typecheck`. The pattern is the one already used by
   `artDeclarations.test.ts` and `shellOwnership.test.ts`.

## Notes

- **The wrong-answer feel is unchanged.** `motionScale(WIGGLE_ANGLE, WIGGLE_REDUCED_ANGLE)`
  and the choice-round copy's `isReducedMotion() ? WIGGLE_REDUCED_ANGLE : WIGGLE_ANGLE`
  select the same values, and the duration, repeat count and ease were already
  identical — only the code was duplicated, not the behaviour. The new tests
  pin the exact angle, duration, repeat count and ease.
- **The lock/unlock ordering is preserved.** Number Order and Story Order use
  `onWrong` to lock the board and `onWiggleComplete` to unlock it; a missed
  release would freeze the game permanently for the child. `onWrong` now runs
  before the delegation, and the completion is released even when there is
  nothing to wiggle.
- **Abandoned taps no longer ride along into the next completed session's
  cumulative counters.** The flush zeroes the session counters, which is what
  `src/types/index.ts` already documents ("taps across completed sessions").
  Before this change the abandoned taps leaked into the next completed
  session's totals.
- **Pre-existing lint noise** — the `musicalMemoryScene.test.ts:294` warning
  and the `biome.json` schema info are unchanged and out of scope.
- **Not done here:** the repository still has no release notes for the seven
  tracks merged since v1.20.0, and `package.json` is still at `1.20.0`. The
  version bump, the tag and the release notes are human release decisions
  (`conductor/workflow.md`, Release & deployment), not part of this track.
