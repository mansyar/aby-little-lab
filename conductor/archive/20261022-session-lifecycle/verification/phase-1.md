# Phase 1 — Progress-Dot Lifecycle

- **Track:** 20261022-session-lifecycle (Session Lifecycle Integrity)
- **Phase:** 1 — Progress-Dot Lifecycle
- **Date:** 2026-10-22
- **Branch:** `fix/20261022-session-lifecycle`
- **Base commit:** `da17058` (conductor(plan): Mark phase 'Progress-Dot Lifecycle' as in progress)
- **Head commit:** `3ae5b93` (fix(scenes): let GameSceneBase own the progress-dot lifecycle)
- **Result:** verified

## Scope

`GameSceneBase` now owns the progress-dot lifecycle, so every game fills its
visible dots from the first round of every visit. The four per-scene workarounds
were removed because the base class guarantees the invariant for all 22 games.

- `createProgressDots` replaces any set left over from a previous visit
  instead of appending to it (`src/scenes/GameSceneBase.ts`).
- The shutdown path releases the dot array, so the scene holds no references to
  destroyed objects (`registerShutdownCleanup`).
- The redundant per-scene resets were deleted from `AnimalTraceScene`,
  `FeelingsFacesScene`, `ShapeSorterScene` and `PatternBuilderScene`.

Covers: FR-1, AC-1, AC-2.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| lint | `pnpm check` | 0 | Biome checked 246 files, no fixes applied. 1 pre-existing warning (`src/__tests__/scenes/musicalMemoryScene.test.ts:294` non-null assertion — untouched file) and 1 pre-existing info (biome.json schema 2.5.5 vs CLI 2.5.10). No new findings in the changed files. |
| typecheck | `pnpm typecheck` | 0 | `tsc --noEmit` clean, no errors. |
| test (targeted, before fix) | `pnpm test -- --run src/__tests__/scenes/gameSceneBase.test.ts --reporter=verbose` | 1 | The new regression test failed on the unmodified base; the other 31 tests in the file passed. Full output in "Failing run (P1.T1.2)" below. |
| test (targeted, after fix) | `pnpm test -- --run src/__tests__/scenes/gameSceneBase.test.ts --reporter=verbose` | 0 | 32/32 tests passed, including the new regression test. |
| test (phase verification, as specified) | `pnpm check && pnpm typecheck && pnpm test -- --run` | 1 | `pnpm check` and `pnpm typecheck` exited 0. `pnpm test -- --run` reported 21 failures, all of them `Error: Test timed out in 5000ms` (also 20000ms/15000ms) in 11 files unrelated to this phase (`src/__tests__/game/*Logic.test.ts`, `src/__tests__/scenes/navigation.test.ts`, `src/__tests__/scenes/hubEngagement.test.ts`). 2443 tests passed. Machine-load timeouts, not assertion failures — see Notes. |
| test (phase verification retry) | `pnpm test -- --run --maxWorkers=2` | 0 | 117 test files / 2464 tests passed, 0 failed. Same suite, fewer workers, as prescribed by the brief's machine note. |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | A regression test drives a scene through two visits and asserts the second visit's visible dot receives the fill; it fails on the base branch and passes after the fix. | New test `replaces the previous visit's dots so a second visit fills its own dot` in `src/__tests__/scenes/gameSceneBase.test.ts` (uses the existing `TestScene` scaffold). Fails on base `da17058` with `expected [...] to have a length of 3 but got 6` (failing run below); passes after the fix (32/32). The fill is asserted on the current visit's own `setAlpha` mock, not on the array position. | pass |
| AC-2 | No game scene assigns to `this.progressDots`; the only writes to that array live in `GameSceneBase`. | `grep "progressDots\s*(=\|\.length\s*=)" src/scenes` matches only `src/scenes/GameSceneBase.ts:314` (`createProgressDots`) and `src/scenes/GameSceneBase.ts:437` (shutdown release). The four per-scene assignments were deleted in `3ae5b93`. The only remaining scene-side reference is a read in `MusicalMemoryScene.ts:271` (`this.progressDots.length`). | pass |
| FR-1 | `GameSceneBase` owns the progress-dot lifecycle: creating dots replaces any set left from a previous visit, the shutdown path releases the array, and the four per-scene workarounds are removed. | `createProgressDots` starts with `this.progressDots = []`; `registerShutdownCleanup` releases the array on shutdown; `AnimalTraceScene.ts:128`, `FeelingsFacesScene.ts:98`, `ShapeSorterScene.ts:98` and `PatternBuilderScene.ts:100` resets removed. Covered by the AC-1 test (tracked set + fill target + release on shutdown). | pass |

## Failing run (P1.T1.2)

The new regression test was run against the unmodified base (`da17058`, before
any production change) to confirm it reproduces the defect for the right reason.

```text
$ pnpm test -- --run src/__tests__/scenes/gameSceneBase.test.ts --reporter=verbose

 × src/__tests__/scenes/gameSceneBase.test.ts > GameSceneBase scaffold > createProgressDots > replaces the previous visit's dots so a second visit fills its own dot 38ms
   → expected [ { kind: 'circle', …(51) }, …(5) ] to have a length of 3 but got 6

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/__tests__/scenes/gameSceneBase.test.ts > GameSceneBase scaffold > createProgressDots > replaces the previous visit's dots so a second visit fills its own dot
AssertionError: expected [ { kind: 'circle', …(51) }, …(5) ] to have a length of 3 but got 6

- Expected
+ Received

- 3
+ 6

 ❯ src/__tests__/scenes/gameSceneBase.test.ts:320:31
    318|       // The tracked set holds only this visit's dots: the previous vi…
    319|       // dots were destroyed with the display list.
    320|       expect(scene.getDots()).toHaveLength(3);
       |                               ^
    321|       expect(scene.getDots()).not.toContain(firstVisitDots[0]);

 Test Files  1 failed (1)
      Tests  1 failed | 31 passed (32)
```

The failure is the expected one: after the second visit the tracked set holds
six circles — the previous visit's three destroyed dots still sit at the low
indices, so `fillProgressDot(0)` would write to a stale dot and the visible dot
would never fill. The remaining 31 tests in the file passed on the base, so
the new test is the only behavioural change introduced.

After the fix the same file reports `Test Files 1 passed (1) / Tests 32 passed (32)`.

## Evidence paths

- Report: `conductor/tracks/20261022-session-lifecycle/verification/phase-1.md`
- Raw failing-run log: `.conductor/evidence/20261022-session-lifecycle/phase-1-failing-run.txt`
- Test: `src/__tests__/scenes/gameSceneBase.test.ts` (commit `0e747ae`)
- Fix: `src/scenes/GameSceneBase.ts`, `src/scenes/AnimalTraceScene.ts`,
  `src/scenes/FeelingsFacesScene.ts`, `src/scenes/ShapeSorterScene.ts`,
  `src/scenes/PatternBuilderScene.ts` (commit `3ae5b93`)

## Deviations

| File | Reason |
| --- | --- |
| — (no source files outside `Touches`) | All six changed files are inside the phase's `Touches` list. No file outside `Touches` was modified. |
| — (verification command variant) | The phase verification command `pnpm check && pnpm typecheck && pnpm test -- --run` exits 1 on this machine because 21 unrelated tests hit the 5,000 ms per-test timeout under load. Per the brief's machine note, the test segment was re-run with `--maxWorkers=2` (`pnpm test -- --run --maxWorkers=2`), which passes 117 files / 2464 tests. No test code was changed to work around a timeout. |

## Notes

- **Machine note applied.** The first full run of `pnpm test -- --run` failed
  with 21 `Test timed out in 5000ms` errors in 11 files that this phase does not
  touch (`src/__tests__/game/addItUpLogic.test.ts`, `alphabetLogic.test.ts`,
  `colorMatchLogic.test.ts`, `countLogic.test.ts`, `memoryMatchLogic.test.ts`,
  `numberOrderLogic.test.ts`, `patternBuilderLogic.test.ts`,
  `takeAwayLogic.test.ts`, `wordLogic.test.ts`, `src/__tests__/scenes/navigation.test.ts`,
  `src/__tests__/scenes/hubEngagement.test.ts`). These are wall-clock timeouts
  caused by machine load, not assertion failures. The identical suite with
  `--maxWorkers=2` passes 2464/2464, and every test file covering the four
  changed scenes (animalTrace, shapeSorter, patternBuilder, feelingsFaces,
  choiceRound) passed in both runs.
- **Pre-existing lint noise.** `pnpm check` reports one pre-existing warning
  (`src/__tests__/scenes/musicalMemoryScene.test.ts:294`, non-null assertion)
  and one pre-existing info (biome.json `$schema` 2.5.5 vs CLI 2.5.10). Both
  predate this phase and are in files outside `Touches`; neither was touched.
- **Shutdown release placement.** The dot array is released in the base's
  existing shutdown path (`registerShutdownCleanup`). All 18 scenes that call
  `createProgressDots` also call `registerShutdownCleanup` in their `create()`,
  so the release runs on every visit. The `createProgressDots` replacement
  alone already guarantees the visible-dot behaviour, so the release is
  defence in depth for scenes that create dots.
- **Phase 2 note.** `registerShutdownCleanup` still uses `events.on`, so its
  handler accumulates one registration per visit. Phase 2 switches it to
  `events.once`; the new regression test registers the cleanup a second time
  before the second shutdown emit, so it stays valid under that change.
- No product or design decision was required, and nothing outside `Touches`
  was touched.

## Primary verification

Performed independently by the primary agent after the phase report — the
subagent's report was not taken on trust.

| Check | Result |
| --- | --- |
| Working tree after the phase commits | Clean — `git status --porcelain` empty |
| Commits in `da17058..HEAD` | `0e747ae` (test), `3ae5b93` (fix), `dfa4ad0` (evidence report) — all three reported by the subagent, no merge commits, no foreign or user commits |
| Files changed vs `Touches` | `src/scenes/GameSceneBase.ts`, `src/scenes/AnimalTraceScene.ts`, `src/scenes/FeelingsFacesScene.ts`, `src/scenes/ShapeSorterScene.ts`, `src/scenes/PatternBuilderScene.ts`, `src/__tests__/scenes/gameSceneBase.test.ts` — all inside `Touches`. The only other path is this evidence file, which is expected. |
| Source diff review | `createProgressDots` starts with `this.progressDots = []` (replaces, not appends); `registerShutdownCleanup` releases the array; the four per-scene resets are deleted. No unrelated edits, no reformatting, no adjacent code touched. |
| `pnpm check` | exit 0 — 1 pre-existing warning (`musicalMemoryScene.test.ts:294`) and 1 pre-existing info (`biome.json` schema), both in files outside `Touches` |
| `pnpm typecheck` | exit 0 |
| `pnpm test -- --run` (as specified) | exit 1 — 11 failed files / 11 failed tests, **every one a `Test timed out in 5000ms` / `15000ms` wall-clock timeout** in files this phase does not touch (`src/__tests__/game/*Logic.test.ts`, `src/__tests__/scenes/navigation.test.ts`, `src/__tests__/scenes/hubEngagement.test.ts`). No assertion failure. |
| `pnpm test -- --run --maxWorkers=2` (documented fallback) | exit 0 — **117 test files passed, 2464 tests passed, 0 failed** |

The primary run's plain-command failure count (11) is lower than the subagent's
(21) because the machine load varied between runs; the failing set and the
failure mode are identical, and every file the phase touched passes in both
runs.

**Primary result:** verified. The deviation recorded above — re-running the
test segment with `--maxWorkers=2` — is accepted: the workflow's fallback
ladder allows the narrowest reliable form when a check cannot run cleanly
because of the environment, and the full suite passes under it. No test code
was changed to work around a timeout.

