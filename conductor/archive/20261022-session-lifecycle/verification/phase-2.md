# Phase 2 — One Reaction, One Registration

- **Track:** 20261022-session-lifecycle (Session Lifecycle Integrity)
- **Phase:** 2 — One Reaction, One Registration
- **Date:** 2026-10-22
- **Branch:** `fix/20261022-session-lifecycle`
- **Base commit:** `0fc5fbf` (conductor(plan): Mark phase 'One Reaction, One Registration' as in progress)
- **Head commit:** `f3bbdee` (fix(scenes): run the wrong-answer reaction from one implementation)
- **Result:** verified

## Scope

The shared wrong-answer reaction now has exactly one implementation, and the
shutdown cleanup handler is registered once per visit.

- `GameSceneBase.reactWrong` takes an optional completion callback and hands it
  to the wiggle tween. With nothing to wiggle it releases the callback straight
  away, so a scene waiting for it can never stay locked.
- `ChoiceRoundScene.handleIncorrect` keeps the choice of *what* wiggles (the
  tapped card plus the game's own targets), runs the game's `onWrong(index)`
  before delegating, and releases the completion through the shared helper.
- `GameSceneBase.registerShutdownCleanup` registers with `events.once` instead
  of `events.on`, so a visit's handler does not outlive the visit.

Covers: FR-2, FR-4, AC-3, AC-5.

### Why `onWrong` runs before the delegation

`NumberOrderScene` and `StoryOrderScene` override the two hooks as a lock /
unlock pair: `onWrong` locks the board, `onWiggleComplete` releases it. A
missed `onWiggleComplete` freezes the game for the child, permanently. The
completion can now be released synchronously — the whole-round answer has
nothing to wiggle — so the lock has to be taken first, which is why
`handleIncorrect` calls `onWrong(index)` before delegating to `reactWrong`.
The new test `runs the wrong-answer hook before the wiggle completion` pins
that order, and the whole-round case pins it in the branch where the release
is synchronous.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| lint | `pnpm check` | 0 | Biome checked 246 files, no fixes applied. 1 pre-existing warning (`src/__tests__/scenes/musicalMemoryScene.test.ts:294` non-null assertion — untouched file) and 1 pre-existing info (biome.json schema 2.5.5 vs CLI 2.5.10). No findings in the changed files. |
| typecheck | `pnpm typecheck` | 0 | `tsc --noEmit` clean, no errors. |
| test (targeted, before fix — P2.T1.4) | `pnpm test -- --run src/__tests__/scenes/gameSceneBase.test.ts src/__tests__/scenes/choiceRoundScene.test.ts --reporter=verbose` | 1 | 4 failed / 47 passed (51). The four failures are the new tests, each failing for its own reason — see "Failing run (P2.T1.4)" below. The three new choice-round tests passed on the base: they pin behaviour that must not change. |
| test (targeted, after fix) | `pnpm test -- --run src/__tests__/scenes/gameSceneBase.test.ts src/__tests__/scenes/choiceRoundScene.test.ts --reporter=verbose` | 0 | 51/51 tests passed. |
| test (phase verification, as specified) | `pnpm check && pnpm typecheck && pnpm test -- --run` | 1 | `pnpm check` and `pnpm typecheck` exited 0. `pnpm test -- --run` reported 10 failures, all of them `Error: Test timed out in 5000ms` (also 20000ms) in 8 files unrelated to this phase (`src/__tests__/game/*Logic.test.ts`, `src/__tests__/scenes/hubEngagement.test.ts`). 2461 tests passed. Machine-load timeouts, not assertion failures — see Notes. |
| test (phase verification retry) | `pnpm test -- --run --maxWorkers=2` | 0 | 117 test files / 2471 tests passed, 0 failed. Same suite, fewer workers, as prescribed by the brief's machine note. |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-3 | A wrong answer plays the incorrect tone exactly once, records exactly one wrong tap, nods the mascot for a choice-round game, and `src/scenes/**` contains exactly one `playIncorrect()` call site. | New test `answers a wrong tap with the shared reaction: one tone, one wrong tap, a nod, one wiggle` in `src/__tests__/scenes/choiceRoundScene.test.ts`: `playIncorrect` called once, `playCorrect` never, the mascot nod tween present, exactly one wiggle tween holding the tapped card *and* the game's extra target (angle 4, duration 350, yoyo, repeat 3, ease `Sine.inOut`), and the wrong tap recorded once (`recordGameResult("take-away", 0, 1)`). New test `calls playIncorrect from exactly one place in src/scenes` in `src/__tests__/scenes/gameSceneBase.test.ts` scans every module in `src/scenes` as text and asserts the only call site is `GameSceneBase.ts` (1 call). Fails on base with two call sites (`ChoiceRoundScene.ts` + `GameSceneBase.ts`) — failing run below. | pass |
| AC-5 | The shutdown cleanup handler does not accumulate; after two visits the first visit's handler is no longer attached. | New test `registers the cleanup once per visit and leaves no handler behind` in `src/__tests__/scenes/gameSceneBase.test.ts`: registers the cleanup, emits `shutdown`, and asserts the live handler count for `"shutdown"` is back to 0; registers it again and asserts the count is 1, not 2. The count comes from the mock's live registration list through the new read-only `MockScene.liveEventHandlerCount` accessor. Fails on base with `expected 1 to be +0` — the base's `events.on` handler outlives its visit. | pass |
| FR-2 | The shared wrong-answer reaction has exactly one implementation: `reactWrong` gains an optional wiggle-completion callback, `ChoiceRoundScene` keeps its target selection, the `onWrong(index)` hook and the `onWiggleComplete(index)` completion, and the observable feel does not change. | `ChoiceRoundScene.handleIncorrect` no longer plays the tone, records the miss or nods the mascot itself: it builds the target list (tapped card first, then the game's own targets) and delegates to `reactWrong(targets, () => this.onWiggleComplete(index))`. The tone, the recording, the nod, the angle, the duration, the yoyo, the repeat count and the ease all live in `GameSceneBase.reactWrong` only. New tests: `hands the completion callback to the wiggle tween` (the callback is the tween's `onComplete`), `releases the completion callback even when there is nothing to wiggle` (released immediately), `runs the wrong-answer hook before the wiggle completion` (the order the two board games depend on), `releases the wiggle completion even when there is nothing to wiggle` (the whole-round path). The pre-existing wrong-answer tests (`answers a wrong tap with the soft tone, a nod, and a gentle wiggle`, `uses the reduced-motion wiggle amplitude and duration`, `moves the subclass's extra targets with the wrong card`) and the base's own `reactWrong` tests still pass unchanged. | pass |
| FR-4 | The shutdown cleanup handler is registered once per visit. | `GameSceneBase.registerShutdownCleanup` registers with `this.events.once("shutdown", …)`, the same pattern `init()` already used for the audio context. The mock's `emit` retires a `once` handler once it has fired, so the handler that ran is gone. The count is observed through `MockScene.liveEventHandlerCount("shutdown")`. | pass |

## Failing run (P2.T1.4)

The new tests were run against the unmodified base (`0fc5fbf`, before any
production change) to confirm they reproduce the defects for the right reasons.
The three source files were reverted to their base state for the run and
restored afterwards (`git status --porcelain` empty, `git diff
f3bbdee~1 -- src/scenes` empty).

```text
$ pnpm test -- --run src/__tests__/scenes/gameSceneBase.test.ts src/__tests__/scenes/choiceRoundScene.test.ts --reporter=verbose

 × src/__tests__/scenes/gameSceneBase.test.ts > GameSceneBase scaffold > registerShutdownCleanup > registers the cleanup once per visit and leaves no handler behind 24ms
   → expected 1 to be +0 // Object.is equality
 × src/__tests__/scenes/gameSceneBase.test.ts > GameSceneBase scaffold > reactWrong > hands the completion callback to the wiggle tween 6ms
   → expected undefined to be [Function Mock] // Object.is equality
 × src/__tests__/scenes/gameSceneBase.test.ts > GameSceneBase scaffold > reactWrong > releases the completion callback even when there is nothing to wiggle 3ms
   → expected "vi.fn()" to be called 1 times, but got 0 times
 × src/__tests__/scenes/gameSceneBase.test.ts > the shared wrong-answer reaction > calls playIncorrect from exactly one place in src/scenes 7ms
   → expected [ { …(2) }, …(1) ] to deeply equal [ { file: 'GameSceneBase.ts', …(1) } ]

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 4 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/__tests__/scenes/gameSceneBase.test.ts > GameSceneBase scaffold > registerShutdownCleanup > registers the cleanup once per visit and leaves no handler behind
AssertionError: expected 1 to be +0 // Object.is equality
 ❯ src/__tests__/scenes/gameSceneBase.test.ts:634:51
    634|       expect(liveHandlerCount(scene, "shutdown")).toBe(0);

 FAIL  src/__tests__/scenes/gameSceneBase.test.ts > GameSceneBase scaffold > reactWrong > hands the completion callback to the wiggle tween
AssertionError: expected undefined to be [Function Mock] // Object.is equality
 ❯ src/__tests__/scenes/gameSceneBase.test.ts:781:34
    781|       expect(wiggle?.onComplete).toBe(onComplete);

 FAIL  src/__tests__/scenes/gameSceneBase.test.ts > GameSceneBase scaffold > reactWrong > releases the completion callback even when there is nothing to wiggle
AssertionError: expected "vi.fn()" to be called 1 times, but got 0 times
 ❯ src/__tests__/scenes/gameSceneBase.test.ts:793:26
    793|       expect(onComplete).toHaveBeenCalledTimes(1);

 FAIL  src/__tests__/scenes/gameSceneBase.test.ts > the shared wrong-answer reaction > calls playIncorrect from exactly one place in src/scenes
AssertionError: expected [ { …(2) }, …(1) ] to deeply equal [ { file: 'GameSceneBase.ts', …(1) } ]

  [
    {
      "calls": 1,
+     "file": "ChoiceRoundScene.ts",
+   },
+   {
      "calls": 1,
      "file": "GameSceneBase.ts",
    },
  ]

 Test Files  1 failed | 1 passed (2)
      Tests  4 failed | 47 passed (51)
```

Each failure names its own defect: the shutdown handler stays attached after
it has run (AC-5), the shared helper takes no completion callback (FR-2), the
callback is never released when there is nothing to wiggle (FR-2), and the
reaction exists in two files (AC-3). The three new choice-round tests passed
on the base — they pin behaviour that must not change (one tone, one recorded
wrong tap, a nod, one wiggle, and the `onWrong`-before-`onWiggleComplete`
order) rather than the defect itself.

The full log is kept at
`.conductor/evidence/20261022-session-lifecycle/phase-2-failing-run.txt`.

## Evidence paths

- Report: `conductor/tracks/20261022-session-lifecycle/verification/phase-2.md`
- Raw failing-run log: `.conductor/evidence/20261022-session-lifecycle/phase-2-failing-run.txt`
- Test: `src/__tests__/scenes/gameSceneBase.test.ts`,
  `src/__tests__/scenes/choiceRoundScene.test.ts`, `src/__tests__/helpers/phaserMock.ts`,
  `src/__tests__/helpers/sceneFlowHarness.ts` (commit `cfcad13`)
- Fix: `src/scenes/GameSceneBase.ts`, `src/scenes/ChoiceRoundScene.ts`,
  `src/scenes/FeelingsFacesScene.ts` (commit `f3bbdee`)

## Deviations

| File | Reason |
| --- | --- |
| `src/__tests__/helpers/sceneFlowHarness.ts` | Outside `Touches`. The shared `triggerShutdown` helper looked the scene's shutdown listener up in `events.on` only. With the cleanup registered through `events.once` it would never find it, and the twelve scene-lifecycle tests that assert the mascot and the parent lock are destroyed on shutdown would break. The helper now fires the listeners a scene registered with `once` as well as the ones it registered with `on` — both are live listeners on the scene's own emitter. No existing mock behaviour changed. |
| `src/scenes/FeelingsFacesScene.ts` | Outside `Touches`. Doc comment only. It stated that the base "has already played the tone, recorded the miss, nodded and wiggled the card" *before* `onWrong` runs; the shared reaction now runs after it, so the sentence had to follow. No behaviour touched. |
| `src/__tests__/scenes/gameSceneBase.test.ts` (source scan) | The AC-3 check reads the scene sources as text with `import.meta.glob(…, { query: "?raw" })` instead of `node:fs`. The repo has no root `@types/node`, so `node:fs` would not type-resolve under `pnpm typecheck`; `import.meta.glob` is the pattern this repository already uses (`src/__tests__/scenes/artDeclarations.test.ts`, `src/__tests__/game/art/shellOwnership.test.ts`). The scope stays `src/scenes`. |
| — (verification command variant) | The phase verification command `pnpm check && pnpm typecheck && pnpm test -- --run` exits 1 on this machine because 10 unrelated tests hit the 5,000 ms / 20,000 ms per-test timeout under load. Per the brief's machine note, the test segment was re-run with `--maxWorkers=2` (`pnpm test -- --run --maxWorkers=2`), which passes 117 files / 2471 tests. No test code was changed to work around a timeout. |

## Notes

- **Machine note applied.** Every run of `pnpm test -- --run` on this machine
  failed with `Test timed out in 5000ms` (or 20000ms) wall-clock timeouts in
  files this phase does not touch (`src/__tests__/game/addItUpLogic.test.ts`,
  `alphabetLogic.test.ts`, `colorMatchLogic.test.ts`, `memoryMatchLogic.test.ts`,
  `numberOrderLogic.test.ts`, `patternBuilderLogic.test.ts`,
  `takeAwayLogic.test.ts`, `wordLogic.test.ts`,
  `src/__tests__/scenes/hubEngagement.test.ts`,
  `src/__tests__/scenes/navigation.test.ts`). The failing set differs from run
  to run, which is the signature of machine load rather than a regression; the
  identical suite with `--maxWorkers=2` passes 2471/2471. Every test file
  covering the changed scenes (`gameSceneBase`, `choiceRoundScene`,
  `feelingsFacesScene`, `sceneLifecycle`, `navigation`, `hubEngagement`)
  passes in the full run.
- **Pre-existing lint noise.** `pnpm check` reports one pre-existing warning
  (`src/__tests__/scenes/musicalMemoryScene.test.ts:294`, non-null assertion)
  and one pre-existing info (biome.json `$schema` 2.5.5 vs CLI 2.5.10). Both
  predate this phase and are in files outside `Touches`; neither was touched.
- **The mock keeps its registration list private.** The live registration list
  stays inside `MockScene`; the new `liveEventHandlerCount(event)` accessor
  only reports how many handlers are still attached. The mock's `emit` already
  retired `once` handlers, so the accessor needed no behaviour change — the
  list simply moved from a constructor-local to an instance field.
- **Counting mascot `destroy` calls would not have worked.** The mascot's
  destroy body is null-guarded, so a second visit's cleanup is silent. The
  count is taken from the registration list instead, which is what the
  accumulation actually is.
- **The Phase 1 regression test still holds.** The progress-dot test registers
  the shutdown cleanup a second time before its second `events.emit("shutdown")`
  and still passes under `events.once`.
- **Whole-round answers.** `WHOLE_ROUND` has no card to wiggle, so the
  completion is released straight away. `onWrong` runs first, so a game that
  locks its input in `onWrong` is never left locked.
- No product or design decision was required.

## Primary verification

Performed independently by the primary agent after the phase report — the
subagent's report was not taken on trust.

| Check | Result |
| --- | --- |
| Working tree after the phase commits | Clean — `git status --porcelain` empty |
| Commits in `0fc5fbf..HEAD` | `cfcad13` (tests), `f3bbdee` (implementation), `9cd8be5` (evidence report) — all three reported by the subagent, no merge commits, no foreign or user commits |
| Files changed vs `Touches` | `src/scenes/GameSceneBase.ts`, `src/scenes/ChoiceRoundScene.ts`, `src/__tests__/scenes/gameSceneBase.test.ts`, `src/__tests__/scenes/choiceRoundScene.test.ts`, `src/__tests__/helpers/phaserMock.ts` — all inside `Touches`. Two further paths, `src/__tests__/helpers/sceneFlowHarness.ts` and `src/scenes/FeelingsFacesScene.ts`, are the deviations the subagent declared; both were reviewed and accepted (below). |
| Source diff review | `reactWrong(targets?, onComplete?)` owns the tone, the recording, the nod and the wiggle tween, and releases the completion even when there is nothing to wiggle. `ChoiceRoundScene.handleIncorrect` keeps its own target selection, calls `onWrong(index)` **before** delegating, and releases through `onWiggleComplete(index)`. `registerShutdownCleanup` uses `events.once`. The now-unused `isReducedMotion` / `motionDuration` import was removed from `ChoiceRoundScene`. No unrelated edits. |
| Ordering constraint | Verified by reading the diff and by the new test: `onWrong` runs before the delegation, so the lock taken in `onWrong` always precedes the release in `onWiggleComplete` — including the whole-round path where the release is synchronous. `NumberOrderScene` and `StoryOrderScene` cannot be left with `inputLocked === true`. |
| `pnpm check` | exit 0 — 1 pre-existing warning (`musicalMemoryScene.test.ts:294`) and 1 pre-existing info (`biome.json` schema), both in files outside `Touches` and untouched by this phase |
| `pnpm typecheck` | exit 0 |
| `pnpm test -- --run` (as specified) | exit 1 — 8 failed files / 12 failed tests, **every one a `Test timed out in 5000ms` / `15000ms` / `20000ms` wall-clock timeout** in files this phase does not touch (`src/__tests__/game/*Logic.test.ts`, `src/__tests__/scenes/hubEngagement.test.ts`, `navigation.test.ts`). No assertion failure. |
| `pnpm test -- --run --maxWorkers=2` (documented fallback) | exit 0 — **117 test files passed, 2471 tests passed, 0 failed** |

### Deviations reviewed

- **`src/__tests__/helpers/sceneFlowHarness.ts`** — `triggerShutdown` looked the
  scene's shutdown listener up in `events.on` only, so with the cleanup
  registered through `events.once` it would never be found and the twelve
  scene-lifecycle tests that assert the mascot and parent lock are destroyed
  on shutdown would break. The helper now fires listeners registered through
  either style, which is what the scene's own emitter does. **Accepted**: it is
  the smallest necessary change, it is in the test tree, and no existing mock
  behaviour changed.
- **`src/scenes/FeelingsFacesScene.ts`** — a doc comment that described the old
  ordering of the wrong-answer reaction. **Accepted**: comment only, no
  behaviour touched.
- **The AC-3 source scan uses `import.meta.glob(..., { query: "?raw" })`, not
  `node:fs`** — the repository has no root `@types/node`, so `node:fs` would not
  type-resolve under `pnpm typecheck`. The glob pattern is the one already used
  by `artDeclarations.test.ts` and `shellOwnership.test.ts`. **Accepted**.

**Primary result:** verified. The `--maxWorkers=2` variant of the test segment
is accepted under the workflow's fallback ladder: the plain command fails only
on environment-induced wall-clock timeouts in untouched files, and the full
suite passes under the stabilized form. No test code was changed to work around
a timeout.

