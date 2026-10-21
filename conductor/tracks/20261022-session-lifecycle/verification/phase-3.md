# Phase 3 — Abandoned Session Reaches the Adaptive Window

- **Track:** 20261022-session-lifecycle (Session Lifecycle Integrity)
- **Phase:** 3 — Abandoned Session Reaches the Adaptive Window
- **Date:** 2026-10-22
- **Branch:** `fix/20261022-session-lifecycle`
- **Base commit:** `025e69f` (conductor(plan): Mark phase 'Abandoned Session Reaches the Adaptive Window' as in progress)
- **Head commit:** `d3a0f0c` (docs(types): say the rolling window folds in when a session ends)
- **Result:** verified

## Scope

A game session the child backs out of still happened, so its taps still inform
the rolling window that drives adaptive difficulty. The phase adds the narrow
path that gets them there and nothing more.

- `progressLogic.recordTaps(progress, { correct, wrong })` is a pure function
  that folds a session's taps into the rolling window and changes nothing else:
  the cumulative `correct` / `wrong`, the win count, the play count and
  `lastPlayedAt` are all left as they were.
- `storage.recordGameTaps(gameId, correct, wrong)` is the single write path
  for it. It mirrors `recordGameResult` exactly — it goes through `mutate()`,
  it touches the ACTIVE profile only, and it never calls `save()` or writes to
  `localStorage` directly.
- `GameSceneBase` remembers the game id it resolved from the registry and, on
  shutdown, folds the pending taps into that game's window — but only when the
  session has taps and the game id is known.

Covers: FR-3, AC-4.

### Why the flush zeroes the session counters

Scene instances are reused across visits (`src/scenes/HubScene.ts:108` starts
each game scene again rather than building a new one). The session counters
live on the instance, so a flush that left them standing would make the *next*
visit report the abandoned taps a second time — and the rolling window would
count them twice. The flush therefore zeroes `sessionCorrect` and
`sessionWrong` after writing.

Zeroing is also what keeps the abandoned taps out of the next completed
session's cumulative counters. `src/types/index.ts:35` and `:38` describe
`correct` and `wrong` as "taps across completed sessions"; a completed
session reports only its own taps, so the abandoned taps never inflate the
number the parent's accuracy screen shows. A completed session is unaffected:
`completeGame` already zeroed the counters, so the flush finds nothing to
write and writes nothing.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| test (targeted, before fix — P3.T1.2 / P3.T2.2) | `pnpm test -- --run src/__tests__/game/progressLogic.test.ts src/__tests__/utils/storage.test.ts src/__tests__/scenes/gameSceneBase.test.ts` | 1 | 9 failed / 140 passed (149). The 6 `progressLogic` failures and the 3 `storage` failures name their own missing piece: `TypeError: recordTaps is not a function` and `TypeError: recordGameTaps is not a function`. The scene suite could not load in this run because the new storage mock held the real module in a `const` that the `vi.mock` factory assigns to — a defect in the new test scaffolding, fixed and re-run below. See "Failing run" below. |
| test (targeted, before fix, scene suite re-run on the same unmodified base) | `pnpm test -- --run src/__tests__/scenes/gameSceneBase.test.ts` | 1 | 3 failed / 39 passed (42). The 3 failures are the new flush tests, each naming its own defect: `recordGameTaps` is never called on shutdown, and the rolling window stays at the completed session's six taps — the abandoned session's three taps are lost. The other 3 new scene tests (a completed session writes nothing, a session with no taps writes nothing, a non-registry scene key writes nothing) already pass on the base: they pin behaviour that must not change. |
| test (targeted, after fix) | `pnpm test -- --run src/__tests__/game/progressLogic.test.ts src/__tests__/utils/storage.test.ts` | 0 | 149/149 tests passed. |
| test (targeted, after fix) | `pnpm test -- --run src/__tests__/scenes/gameSceneBase.test.ts` | 0 | 42/42 tests passed. |
| lint | `pnpm check` | 0 | Biome checked 246 files, no fixes applied. 1 pre-existing warning (`src/__tests__/scenes/musicalMemoryScene.test.ts:294` non-null assertion — a file outside `Touches`, untouched) and 1 pre-existing info (biome.json schema 2.5.5 vs CLI 2.5.10). No finding in any changed file. |
| typecheck | `pnpm typecheck` | 0 | `tsc --noEmit` clean, no errors. |
| test (phase verification, as specified) | `pnpm check && pnpm typecheck && pnpm test -- --run` | 1 | `pnpm check` and `pnpm typecheck` exited 0. `pnpm test -- --run` reported 14 failures, every one a `Error: Test timed out in 5000ms` (also 15000ms / 20000ms) wall-clock timeout in files this phase does not touch (`src/__tests__/game/wordLogic.test.ts`, `colorMatchLogic.test.ts`, `countLogic.test.ts`, `numberOrderLogic.test.ts`, `addItUpLogic.test.ts`, `takeAwayLogic.test.ts`, `memoryMatchLogic.test.ts`, `src/__tests__/scenes/navigation.test.ts`, `hubEngagement.test.ts`). 2472 tests passed. No assertion failure anywhere. Machine-load timeouts — see Notes. |
| test (phase verification, as specified, second attempt) | `pnpm check && pnpm typecheck && pnpm test -- --run` | 1 | `pnpm check` and `pnpm typecheck` exited 0 again. 9 failures, the same class of unrelated wall-clock timeout and a *smaller* set than the first attempt (9 vs 14) across 7 files — the signature of machine load, not a regression. 2477 tests passed. |
| test (phase verification retry, machine note) | `pnpm test -- --run --maxWorkers=2` | 0 | **117 test files passed, 2486 tests passed, 0 failed.** Same suite, fewer workers, as prescribed by the brief's machine note. |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-4 | A test asserts that a session shut down mid-game folds its taps into the rolling window and leaves the cumulative counters, the win count and the play count unchanged. | New test `folds the abandoned taps into the rolling window and nothing else` in `src/__tests__/scenes/gameSceneBase.test.ts`: a completed session first records `(5, 1)` and one play, then the abandoned session taps 2 correct / 1 wrong and shuts down. The assertion reads the real stored progress: `recent` is `[true, true, true, true, true, false, true, true, false]` — the completed session's six taps plus the abandoned session's three — while `correct` is still 5, `wrong` still 1, `wins` still 1 and `plays` still 1. Fails on the base: the window stays at the completed session's six taps, because the abandoned taps are lost. | pass |
| FR-3 | When a game scene shuts down without completing, its taps fold into the rolling window and into nothing else: the cumulative correct/wrong, the win count, the play count and the parent-facing accuracy are unaffected. | `progressLogic.recordTaps` is the only writer of the window for an abandoned session and touches nothing but `recent` — pinned by `leaves the cumulative counters, wins, plays and last-played untouched` (wins 1, correct 8, wrong 2, plays 2, `lastPlayedAt` unchanged) and by `does not mutate the input`. `storage.recordGameTaps` writes it to the ACTIVE profile only — pinned by `records an abandoned session's taps on the active profile only` (the other profile's window is untouched) and by `moves only the rolling window, leaving the cumulative counters, wins and plays alone`. `GameSceneBase.flushPendingTaps` calls it on shutdown only when the session has taps and the game id resolved from the registry — pinned by `resolves the game id from the registry and flushes the pending taps on shutdown` (`recordGameTaps("shape-sorter", 2, 1)`) and by the three guard tests. The parent-facing accuracy is derived from the cumulative counters (`progressLogic.getAccuracy`), which the window never enters. | pass |

## Failing run (P3.T1.2 / P3.T2.2)

The new tests were run against the unmodified base (`025e69f`, before any
production change) to confirm they reproduce the defects for the right reasons.

The first invocation ran all three touched test files together:

```text
$ pnpm test -- --run src/__tests__/game/progressLogic.test.ts src/__tests__/utils/storage.test.ts src/__tests__/scenes/gameSceneBase.test.ts

 ❯ src/__tests__/game/progressLogic.test.ts (46 tests | 6 failed)
 ❯ src/__tests__/utils/storage.test.ts (103 tests | 3 failed)
 ❯ src/__tests__/scenes/gameSceneBase.test.ts (0 test)

 FAIL  src/__tests__/scenes/gameSceneBase.test.ts [ src/__tests__/scenes/gameSceneBase.test.ts ]
Error: [vitest] There was an error when mocking a module. …
Caused by: TypeError: Assignment to constant variable.
 ❯ src/__tests__/scenes/gameSceneBase.test.ts:89:3

 FAIL  src/__tests__/game/progressLogic.test.ts > progressLogic > recordTaps > …
TypeError: recordTaps is not a function

 FAIL  src/__tests__/utils/storage.test.ts > progress recording > …
TypeError: recordGameTaps is not a function

 Test Files  3 failed (3)
      Tests  9 failed | 140 passed (149)
```

The scene suite's failure to load was a defect in the **new test
scaffolding**, not in the product: the new storage mock held the real module
in a `const` and the `vi.mock` factory assigns to it. The holder was made
mutable and the scene suite was re-run on the same unmodified base:

```text
$ pnpm test -- --run src/__tests__/scenes/gameSceneBase.test.ts

 ❯ src/__tests__/scenes/gameSceneBase.test.ts (42 tests | 3 failed)
       × resolves the game id from the registry and flushes the pending taps on shutdown
       × folds the abandoned taps into the rolling window and nothing else
       × zeroes the session counters so the next visit reports only its own taps

 FAIL  … > resolves the game id from the registry and flushes the pending taps on shutdown
AssertionError: expected "vi.fn()" to be called 1 times, but got 0 times
 ❯ src/__tests__/scenes/gameSceneBase.test.ts:729:34

 FAIL  … > folds the abandoned taps into the rolling window and nothing else
AssertionError: expected [ true, true, true, true, true, false ] to deeply equal
               [ true, true, true, true, true, …(4) ]
 ❯ src/__tests__/scenes/gameSceneBase.test.ts:748:31

 FAIL  … > zeroes the session counters so the next visit reports only its own taps
AssertionError: expected "vi.fn()" to be called with arguments: [ 'shape-sorter', 2, 1 ]
Number of calls: 0
 ❯ src/__tests__/scenes/gameSceneBase.test.ts:774:34

 Test Files  1 failed (1)
      Tests  3 failed | 39 passed (42)
```

Each failure names its own defect: the flush never runs on shutdown, and the
rolling window stays at the completed session's six taps — the abandoned
session's three taps are lost. The three new scene guard tests (a completed
session writes nothing at shutdown, a session with no taps writes nothing, a
scene key that is not in the registry writes nothing) passed on the base:
they pin behaviour that must not change.

The full log is kept at
`.conductor/evidence/20261022-session-lifecycle/phase-3-failing-run.txt`.

## Evidence paths

- Report: `conductor/tracks/20261022-session-lifecycle/verification/phase-3.md`
- Raw failing-run log: `.conductor/evidence/20261022-session-lifecycle/phase-3-failing-run.txt`
- Test: `src/__tests__/game/progressLogic.test.ts`,
  `src/__tests__/utils/storage.test.ts`, `src/__tests__/scenes/gameSceneBase.test.ts`
  (commits `2e35c62`, `5398e5a`)
- Fix: `src/game/progressLogic.ts`, `src/utils/storage.ts` (commit `4a24039`),
  `src/scenes/GameSceneBase.ts` (commit `b3dad4c`)
- Doc: `src/types/index.ts` (commit `d3a0f0c`)

## Deviations

| File | Reason |
| --- | --- |
| `src/types/index.ts` | Outside `Touches`. Doc comment only. The `recent` field said the window is "folded in when a session completes", which this phase makes incomplete — the window now also takes a session's taps when the child abandons it. The comment was corrected to "folded in when a session ends — completed or abandoned". No type, no behaviour, no default touched. |
| — (verification command variant) | The phase verification command `pnpm check && pnpm typecheck && pnpm test -- --run` exits 1 on this machine because unrelated tests hit the 5,000 ms / 15,000 ms / 20,000 ms per-test timeout under load. Per the brief's machine note, the test segment was re-run with `--maxWorkers=2` (`pnpm test -- --run --maxWorkers=2`), which passes 117 files / 2486 tests. No test code was changed to work around a timeout. |

## Notes

- **Machine note applied.** Both runs of the exact verification command failed
  only on `Error: Test timed out in 5000ms` (and 15000ms / 20000ms)
  wall-clock timeouts in files this phase does not touch
  (`src/__tests__/game/wordLogic.test.ts`, `colorMatchLogic.test.ts`,
  `countLogic.test.ts`, `numberOrderLogic.test.ts`, `addItUpLogic.test.ts`,
  `takeAwayLogic.test.ts`, `memoryMatchLogic.test.ts`,
  `src/__tests__/scenes/navigation.test.ts`, `hubEngagement.test.ts`). The
  failing set differs between the two runs (14 then 9), and the identical
  suite with `--maxWorkers=2` passes 2486/2486 — the signature of machine load
  rather than a regression. Not one of the three test files this phase
  touched ever failed on a timeout; they pass in every run, targeted and full.
- **The consequence of zeroing.** Abandoned taps no longer ride along into
  the next completed session's cumulative counters. `src/types/index.ts:35`
  and `:38` already described `correct` and `wrong` as "taps across completed
  sessions", and that is now literally true: a completed session reports only
  its own taps. The abandoned taps live in the rolling window and nowhere
  else, which is what FR-3 asks for and what the parent's accuracy screen
  (derived from the cumulative counters through `progressLogic.getAccuracy`)
  never sees.
- **A completed session is never flushed twice.** `completeGame` already zeroes
  `sessionCorrect` and `sessionWrong`, so the flush finds nothing to write.
  The new test `writes nothing at shutdown when the session was completed`
  pins that `recordGameTaps` is never called after a completion.
- **Two games back to back target the right game.** The scene stores the game
  id it resolved from the registry in `init()`, so the flush always names the
  game the visit was playing — never the previous one. A scene key that is not
  in the registry resolves to no id, and the flush writes nothing.
- **The storage mock in the scene suite was extended.** `src/__tests__/scenes/gameSceneBase.test.ts`
  now also spies on `recordGameTaps`, and both spies call through to the real
  storage so the assertions can read the real stored progress. Because the
  suite calls `vi.restoreAllMocks()` after every test, the call-through is
  re-armed in `beforeEach` rather than only in the `vi.mock` factory — without
  that, the second and later tests would see a spy with no implementation and
  the stored progress would stay empty. All 39 pre-existing tests in that file
  still pass unchanged.
- **Non-adaptive games fold their taps too.** The flush is registered on the
  shared base, so every game scene gets it; a game that does not use the
  adaptive band simply has no consumer for the window.
- **Pre-existing lint noise.** `pnpm check` reports one pre-existing warning
  (`src/__tests__/scenes/musicalMemoryScene.test.ts:294`, non-null assertion)
  and one pre-existing info (biome.json `$schema` 2.5.5 vs CLI 2.5.10). Both
  predate this phase and are in files outside `Touches`; neither was touched.
- No product or design decision was required.

## Primary verification

Performed independently by the primary agent after the phase report — the
subagent's report was not taken on trust.

| Check | Result |
| --- | --- |
| Working tree after the phase commits | Clean — `git status --porcelain` empty |
| Commits in `025e69f..HEAD` | `2e35c62` (tests), `5398e5a` (formatting), `4a24039` (progress path), `b3dad4c` (flush), `d3a0f0c` (types doc), `994b4ed` (evidence report) — all reported by the subagent, no merge commits |
| Files changed vs `Touches` | `src/game/progressLogic.ts`, `src/utils/storage.ts`, `src/scenes/GameSceneBase.ts`, `src/__tests__/game/progressLogic.test.ts`, `src/__tests__/utils/storage.test.ts`, `src/__tests__/scenes/gameSceneBase.test.ts` — all inside `Touches`. `src/types/index.ts` is the one declared deviation (doc comment only). |
| Source diff review | `recordTaps` mirrors `recordResult` exactly — same `normalizeProgress`, same `Math.max(0, …)` clamping, same `updateRecentWindow` call — and changes `recent` and nothing else. `recordGameTaps` goes through `mutate()` and targets the active profile only, exactly like `recordGameResult`; no direct `save()` or `localStorage` access. `GameSceneBase` stores the registry-resolved game id in `init()`, registers a second per-visit `events.once("shutdown")` for the flush, and `flushPendingTaps()` writes only when the id is known and the session has taps, then zeroes both counters. No unrelated edits. |
| Counter-zeroing requirement | Verified in the diff and by the test "zeroes the session counters so the next visit reports only its own taps": the flush writes and then clears `sessionCorrect` / `sessionWrong`, so a reused scene instance cannot carry the abandoned taps into the next visit and double-count them in the window. |
| Completed-session path | Verified: `completeGame` already zeroes the counters, so the shutdown flush finds nothing to write. The test "writes nothing at shutdown when the session was completed" pins this. |
| `pnpm check` | exit 0 — 1 pre-existing warning (`musicalMemoryScene.test.ts:294`) and 1 pre-existing info (`biome.json` schema), both pre-existing and untouched |
| `pnpm typecheck` | exit 0 |
| `pnpm test -- --run` (as specified) | exit 1 — 7 failed files / 10 failed tests, all wall-clock timeouts in files this phase does not touch |
| `pnpm test -- --run --maxWorkers=2` (documented fallback) | exit 0 — **117 test files passed, 2486 tests passed, 0 failed** |

### Deviations reviewed

- **`src/types/index.ts`** — the `recent` field's doc comment said the window
  is "folded in when a session completes", which this phase makes incomplete.
  **Accepted**: comment only; no type, default or behaviour touched. The
  corrected wording matches the new behaviour.
- **The verification command variant** — the plain test command fails only on
  environment-induced wall-clock timeouts in untouched files, and the failing
  set differs between runs. **Accepted** under the workflow's fallback ladder.

**Primary result:** verified.

