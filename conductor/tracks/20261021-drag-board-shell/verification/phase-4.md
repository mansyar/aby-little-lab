# Phase 4 — Wrong-answer reaction helpers on GameSceneBase

- **Track:** 20261021-drag-board-shell — Drag-Board Shell Unification
- **Phase:** 4
- **Date:** 2026-10-21
- **Branch:** refactor/20261021-drag-board-shell
- **Base commit:** 309fd17
- **Head commit:** 4b5b305
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| Lint | `pnpm check` | 0 | Biome check clean over 234 files; 1 pre-existing warning (`musicalMemoryScene.test.ts` non-null assertion) and 1 pre-existing biome.json schema-version notice, both untouched by this phase. |
| Typecheck | `pnpm typecheck` | 0 | `tsc --noEmit` clean. |
| Tests | `pnpm test -- --run` | 0 | 112 files, 2377 tests passed, including the 5 new `reactWrong` tests. |
| Full verification | `pnpm check && pnpm typecheck && pnpm test -- --run` | 0 | All three layers green in a single run (third attempt; see notes). |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-3 | GameSceneBase provides shared wrong-answer reaction helpers (wiggle + nod + gentle `sfx_incorrect` tone) | `src/scenes/GameSceneBase.ts` gains `protected reactWrong(targets?)` — plays `audioManager.playIncorrect()` (the gentle descending G4→C4 tone), calls `recordWrong()`, nods the mascot, and when targets are given adds the shared wiggle tween (angle `motionScale(WIGGLE_ANGLE, WIGGLE_REDUCED_ANGLE)`, duration `motionDuration(WIGGLE_DURATION, WIGGLE_REDUCED_DURATION)`, yoyo, `WIGGLE_REPEATS`, `Sine.inOut`) reusing the existing `WIGGLE_*` constants. | covered |
| FR-3 (reduced motion) | Wiggle degrades per `motion.ts` under `prefers-reduced-motion` | New test "degrades the wiggle to the reduced-motion angle and duration" asserts angle 2 / duration 200 with the matchMedia stub set to reduced. | verified |
| FR-3 (no-fail) | Reaction stays a gentle nudge, never a penalty | Helper sets no `inputLocked`, no penalty counters beyond the existing `recordWrong()` learning record; test asserts `inputLocked` stays `false` and that the reaction runs when no mascot exists. | verified |
| FR-3 (override precedence) | Helper is the default path; per-game overrides still take precedence | The helper is purely additive and only fires when invoked, so the `onWrong()` override path (ChoiceRoundScene games: Feelings Faces, Number Order, Story Order) is untouched. New test "keeps custom wrong paths authoritative" models a game with its own `onWrong()` (records only) and asserts the helper's tone/wiggle never fire while learning-progress recording still works. | verified |
| AC-3 (partial — phase-scoped) | The 8 direct games' wrong-answer reactions route through the shared helper | Not yet: Phase 5 performs the migration. This phase verified the helper exists with tests and that no game's behavior changed (full suite green; the 8 games' suites untouched). | deferred to Phase 5 |
| FR-4 / NFR-2 | No game migrated yet; existing behavior preserved | Only `GameSceneBase.ts` and its test file changed; 2377/2377 tests pass, no scene files modified. | verified |

## Tasks

| Task | Status | Commit |
|---|---|---|
| P4.T1.1 — Wiggle + nod + gentle-tone helper respecting `motion.ts` reduced-motion | done | d47a140 |
| P4.T1.2 — Override path intact (helper is opt-in default; `onWrong()` overrides take precedence) | done | d47a140 |
| P4.T2 — Unit tests for helpers and override precedence | done | 4b5b305 |

## Evidence paths

- `src/scenes/GameSceneBase.ts` — `reactWrong(targets?)` helper (25 added lines, after `recordWrong`).
- `src/__tests__/scenes/gameSceneBase.test.ts` — new `reactWrong` describe with 5 tests (88 added lines).

## Design notes (for Phase 5 migration)

- The helper matches the inline sequences observed in the scenes today: tone + `recordWrong()` + `mascot?.nod()`, with an optional shared wiggle on the affected targets (the exact tween shape used by Build the Word and Memory Match).
- Shape Sorter, Shadow Match, and Big vs. Small play tone + nod + record then bounce the object home — they can call `this.reactWrong()` (no targets) and keep their bounce tween.
- Musical Memory plays tone + nod + record with no motion — `this.reactWrong()` directly.
- Memory Match wiggles two card groups; at migration it can pass the flattened target array (one tween instead of two — behavior-equivalent).
- ChoiceRoundScene keeps its own `handleIncorrect`/`onWrong(index)` mechanism untouched; its signature differs, so no `onWrong` hook was added to GameSceneBase (that would have broken the ChoiceRoundScene override chain).

## Deviations

- None. All changes stayed within Touches (`src/scenes/GameSceneBase.ts`, `src/__tests__/scenes/gameSceneBase.test.ts`) plus this evidence file.

## Notes

- Test-first per workflow.md: tests were written first and failed (TS errors), then the helper was implemented.
- The verification command failed twice before passing, each fixed once within the retry policy: (1) typecheck errors in the new tests (invalid `as GameObject` cast, missing test helpers on the custom scene subclass — resolved via `as unknown as` cast and subclassing `TestScene`); (2) the wiggle-detection test helper matched the Mascot's own nod tween (which also carries an `angle` key) — resolved by matching only the helper's numeric wiggle angle.
- The pre-existing Biome warning in `musicalMemoryScene.test.ts` and the biome.json schema-version notice were not introduced by this phase and were left untouched.
- Coverage gate and bundle checks are Phase 5's full gate, not this phase's verification command.
