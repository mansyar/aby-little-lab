# Phase R1 — Review Fixes

- **Track:** 20261022-session-lifecycle (Session Lifecycle Integrity)
- **Phase:** R1 — Review Fixes
- **Date:** 2026-10-22
- **Branch:** `fix/20261022-session-lifecycle`
- **Base commit:** `d8429e6` (conductor(plan): Mark phase 'Review Fixes' as in progress) — track base `cbf017e`
- **Head commit:** `77eda9a` (test(scenes): name the shutdown test after what it guards)
- **Result:** verified

## Scope

The review returned PASS WITH FINDINGS with five findings (F1–F5). This phase
resolves exactly those five and nothing else. No feature was added, no
adjacent code was refactored, and the base class's API grew only by the one
callback F1 requires.

- **F1** restores the shipped order of the wrong-answer reaction: the shared
  tone, the recorded miss and the mascot's nod come first, the scene's own
  `onWrong` extras run next, and the wiggle completion stays last.
- **F2** corrects the `onWrong` doc comment to that order.
- **F3** corrects the play-count claim in the four places the review names.
- **F4** makes the `triggerShutdown` test helper model Phaser's `once`
  semantics.
- **F5** renames the stale shutdown test so its name matches what it guards.

The wrong-answer feel is unchanged: tone, wrong-tap count, mascot nod, wiggle
angle (4 / 2 reduced), duration (350 / 200 reduced), repeat count (3) and ease
("Sine.inOut") are exactly what they were.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| test (targeted, before fix — R1.T1 / R1.T4) | `pnpm test -- --run src/__tests__/scenes/choiceRoundScene.test.ts src/__tests__/helpers/sceneFlowHarness.test.ts` | 1 | 2 failed / 15 passed (17). The F1 test failed with `expected [ 'wrong:1', 'tone' ] to deeply equal [ 'tone', 'wrong:1' ]` — the scene's hook ran before the shared tone. The F4 test failed with `expected "vi.fn()" to be called 1 times, but got 2 times` — a once-registered shutdown handler ran again on the second shutdown. |
| test (targeted, after fix) | `pnpm test -- --run src/__tests__/scenes/choiceRoundScene.test.ts src/__tests__/helpers/sceneFlowHarness.test.ts src/__tests__/scenes/gameSceneBase.test.ts` | 0 | 59/59 tests passed across the 3 files. |
| lint | `pnpm check` | 0 | Biome checked 247 files, no fixes applied. 1 pre-existing warning (`src/__tests__/scenes/musicalMemoryScene.test.ts:294` non-null assertion — outside `Touches`, untouched) and 1 pre-existing info (biome.json schema 2.5.5 vs CLI 2.5.10). No finding in any changed file. |
| typecheck | `pnpm typecheck` | 0 | `tsc --noEmit` clean, no errors. |
| test (phase verification, as specified) | `pnpm check && pnpm typecheck && pnpm test -- --run` | 1 | `pnpm check` and `pnpm typecheck` exited 0. `pnpm test -- --run` reported 9 failures, every one an `Error: Test timed out in 5000ms` (also 15000ms / 20000ms) wall-clock timeout in files this phase does not touch (`src/__tests__/game/colorMatchLogic.test.ts`, `patternBuilderLogic.test.ts`, `numberOrderLogic.test.ts`, `addItUpLogic.test.ts`, `takeAwayLogic.test.ts`, `memoryMatchLogic.test.ts`, `src/__tests__/scenes/navigation.test.ts`, `hubEngagement.test.ts`). 2479 tests passed. No assertion failure anywhere. Machine-load timeouts — see Notes. |
| test (phase verification retry, machine note) | `pnpm check && pnpm typecheck && pnpm test -- --run --maxWorkers=2` | 0 | **118 test files passed, 2488 tests passed, 0 failed.** Same suite, fewer workers, as prescribed by the brief's machine note. |

## Findings

| Finding | What changed | How it was verified | Status |
| --- | --- | --- | --- |
| **F1** (Medium) — the wrong-answer reaction's order was changed: the scene's `onWrong` hook ran before the shared feedback, so in Feelings Faces the re-spoken scenario started before the incorrect tone. | `GameSceneBase.reactWrong` gained a third parameter `onPreWiggle?: () => void`, invoked after `playIncorrect()`, `recordWrong()` and `mascot?.nod()` and before the wiggle tween is created. `ChoiceRoundScene.handleIncorrect` now calls `this.reactWrong(targets, () => this.onWiggleComplete(index), () => this.onWrong(index))`. The order is tone → record → nod → `onWrong` → tween; `onWrong` stays strictly before `onWiggleComplete`, including on the synchronous "nothing to wiggle" release path, because `onPreWiggle` runs before that branch. The wiggle spec (angle 4 / 2 reduced, duration 350 / 200 reduced, yoyo, repeat 3, ease "Sine.inOut") is untouched. | New test `plays the incorrect tone before the scene's wrong-answer hook` (`src/__tests__/scenes/choiceRoundScene.test.ts`) records the tone and the subclass's hook into one log and asserts `["tone", "wrong:1"]`. It fails on the base with `expected [ 'wrong:1', 'tone' ] to deeply equal [ 'tone', 'wrong:1' ]` and passes after the fix. The pre-existing `runs the wrong-answer hook before the wiggle completion` and `releases the wiggle completion even when there is nothing to wiggle` tests still pass unchanged. | resolved |
| **F2** (Low) — the `onWrong` doc comment said the extras run "after the shared feedback", which no longer described the contract. | `src/scenes/ChoiceRoundScene.ts` — the `onWrong` comment now reads "Optional per-game wrong-answer extras, run after the shared tone and the mascot's nod, and before the wiggle completes." The `handleIncorrect` comment was updated in the same commit because it described the same order ("The game's own `onWrong` runs first…"). | Read against the restored call order; `pnpm check` and `pnpm typecheck` clean. | resolved |
| **F3** (Low) — the PRD (and three other places) claimed the play count describes completed sessions only. It does not: `HubScene.activateTile` calls `recordGamePlay(GAME_TILES[tileIndex].gameId)` when the tile is tapped, so an abandoned game still counts a play. | Reworded in exactly the four places the review names: `docs/PRD.md` §4.8, `docs/TDD.md` §7.3, `src/game/progressLogic.ts` (`recordTaps` doc comment) and `src/scenes/GameSceneBase.ts` (`flushPendingTaps` doc comment). Each now separates the two: the accuracy and the win count describe completed sessions, while the play count still counts every game the child starts, abandoned or not. The flush's meaning is unchanged — it still moves the rolling window and touches nothing else. | Read against `src/scenes/HubScene.ts:234` and PRD §4.7 ("a play when a Hub tile is tapped"), so the four wordings agree with each other. No behaviour changed; the full suite is green. | resolved |
| **F4** (Low) — `triggerShutdown` walked the mock's `events.on` / `events.once` registration calls and invoked every registered handler, so an already-fired `once` handler ran again. | `src/__tests__/helpers/sceneFlowHarness.ts` — `triggerShutdown` now emits the scene's own event: `const events = (scene as { events: { emit: (name: string) => void } }).events; events.emit("shutdown");`. `getMockFn` stays imported: 25 other call sites in the same file use it. New file `src/__tests__/helpers/sceneFlowHarness.test.ts` registers one `once` and one `on` shutdown handler and asserts the `once` handler fires once across two shutdowns while the `on` handler fires on each. | The new test fails on the base with `expected "vi.fn()" to be called 1 times, but got 2 times` and passes after the fix. The suites that use the helper (`sceneLifecycle.test.ts`, `navigation.test.ts`, `hubEngagement.test.ts`) are untouched and pass. | resolved |
| **F5** (Low) — the test named "does not flush results when the scene shuts down without completing" described the opposite of what it guards. | `src/__tests__/scenes/gameSceneBase.test.ts` — renamed to "does not record a completed result when the scene shuts down without completing". It now asserts what the test actually guards: the completed result is not written, and the tap flush did not run in that path (the test records a tap and invokes the cleanup handler directly, so the flush — registered in `init()` — never runs). The "abandoned session flush" block is untouched and still covers the abandoned-session contract. | The renamed test passes; the "abandoned session flush" block (6 tests) still passes unchanged. | resolved |

## Commits

| Commit | Task | Message |
| --- | --- | --- |
| `b1e6d85` | R1.T1, R1.T2 | fix(scenes): restore the shared wrong-answer order |
| `b150e3b` | R1.T3 | docs(progress): say which counters describe completed sessions |
| `1eeb52f` | R1.T4 | test(harness): drive the scene's own shutdown event |
| `77eda9a` | R1.T5 | test(scenes): name the shutdown test after what it guards |

R1.T1 and R1.T2 share `src/scenes/ChoiceRoundScene.ts` and describe one
contract — the order of the wrong-answer reaction — so they are one commit.

## Evidence paths

- This report: `conductor/tracks/20261022-session-lifecycle/verification/phase-R1.md`
- Failing runs (before the fix): the two targeted runs in the Commands table —
  `pnpm test -- --run src/__tests__/scenes/choiceRoundScene.test.ts src/__tests__/helpers/sceneFlowHarness.test.ts` (exit 1, 2 failed / 15 passed)
- New/changed tests: `src/__tests__/scenes/choiceRoundScene.test.ts` (F1),
  `src/__tests__/helpers/sceneFlowHarness.test.ts` (F4, new file),
  `src/__tests__/scenes/gameSceneBase.test.ts` (F5)
- Review findings being resolved: `conductor/tracks/20261022-session-lifecycle/review.md`

## Deviations

- `verification command` — the phase's test segment was re-run with
  `--maxWorkers=2`. The plain `pnpm test -- --run` failed with 9 wall-clock
  timeouts (5,000 / 15,000 / 20,000 ms) in files this phase does not touch,
  the machine-load signature the brief's machine note describes. No test code
  was changed to work around a timeout; the same suite passes unchanged with
  fewer workers (118 files / 2488 tests).
- `src/__tests__/scenes/gameSceneBase.test.ts` — the "session progress
  recording" block's `beforeEach` now also clears `mockRecordGameTaps`. The
  renamed F5 test asserts that the tap flush did not run in that path, and
  the clear makes that assertion independent of earlier tests in the file.
  (The file is inside `Touches`.)

## Notes

- No production behaviour outside the wrong-answer order changed: the F1 fix
  only re-orders the two calls inside the shared reaction and adds one
  optional callback to the base helper.
- `src/utils/storage.ts:258-262` (`recordGameTaps`) still carries the same
  wording as the old F3 text — "the play count … describe completed
  sessions". The review and the brief name four places and that file is not
  among them, and it is outside `Touches`, so it was left untouched. The
  primary may want it folded into the post-review doc sync.
- The review's own verification run recorded the same environmental timeouts
  (`pnpm test -- --run` failing on 7 files / 10 tests, all wall-clock
  timeouts) and the same green result with `--maxWorkers=2` (117 files / 2486
  tests). This phase adds one test file and two tests: 118 files / 2488
  tests.

## Primary verification

| Check | Result |
| --- | --- |
| Working tree | Clean before acceptance; all five phase commits reported. |
| Commits in `d8429e6..HEAD` | `b1e6d85` (F1, F2), `b150e3b` (F3), `1eeb52f` (F4), `77eda9a` (F5), `ac9653d` (evidence). No merge commits, no foreign commits. |
| Files changed vs `Touches` | The nine `Touches` paths and the phase evidence file. Nothing outside. |
| Source diff review | `reactWrong(targets, onComplete, onPreWiggle)` plays the tone, records the miss and nods, then calls `onPreWiggle` before the wiggle tween is created; `onComplete` is released immediately when there is nothing to wiggle. `ChoiceRoundScene.handleIncorrect` passes `onWrong` as the pre-wiggle callback and `onWiggleComplete` as the completion. The wiggle spec (angle 4 / 2 reduced, duration 350 / 200 reduced, yoyo, repeat 3, ease "Sine.inOut") is byte-identical to before. `triggerShutdown` now drives the scene's own emitter. The three F3 wordings now separate the accuracy and win count from the play count, and agree with PRD 4.7 ("a play when a Hub tile is tapped"). No unrelated edits. |
| `pnpm check` | Exit 0 - 247 files, 1 pre-existing warning (`src/__tests__/scenes/musicalMemoryScene.test.ts:294`) and 1 pre-existing info (`biome.json` schema). Neither is in a changed file. |
| `pnpm typecheck` | Exit 0. |
| `pnpm test -- --run --maxWorkers=2` | Exit 0 - **118 test files passed, 2488 tests passed, 0 failed** (193.56s). |
| F1 invariant | The new test asserts the tone is requested before the scene's hook; the pre-existing hook-ordering test and the nothing-to-wiggle test both still pass. The tone leads the narration in Feelings Faces again. |
| F3 accuracy | Checked against `src/scenes/HubScene.ts` (the tile tap records the play) and PRD 4.7. A fifth copy of the same claim exists at `src/utils/storage.ts:258-262` (`recordGameTaps`); it was outside `Touches`, so the phase left it, and the primary corrected it in the post-review doc sync. |
| F4 accuracy | The new helper test drives the mock's own emitter, so it now models Phaser: a `once` handler fires once, an `on` handler fires on every shutdown. |
| F5 accuracy | The renamed test asserts what it guards - no completed result is written - and the "abandoned session flush" block still owns the abandoned-session contract. |

### Deviations reviewed

1. **The test segment ran with `--maxWorkers=2`.** Accepted under the workflow's
   fallback ladder: the plain command fails only on environment-induced
   wall-clock timeouts in files this phase does not touch, and the full suite
   passes under the stabilized form. No test code was changed to work around a
   timeout.
2. **`src/__tests__/scenes/gameSceneBase.test.ts`** - the "session progress
   recording" `beforeEach` now also clears `mockRecordGameTaps`, so the
   renamed F5 test's assertion does not depend on an earlier test in the file.
   The file is inside `Touches`.

**Primary result:** verified.
