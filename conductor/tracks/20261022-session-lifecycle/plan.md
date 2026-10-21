# Session Lifecycle Integrity — Implementation Plan

> **Branch:** `fix/20261022-session-lifecycle`
> **Base:** `master` @ `cbf017e`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and
> the primary records them.

## Phase 1: Progress-Dot Lifecycle

- **Goal:** `GameSceneBase` owns the progress dots, so every game fills its
  visible dots from the first round of every visit.
- **Depends on:** none
- **Covers:** FR-1, AC-1, AC-2
- **Touches:** `src/scenes/GameSceneBase.ts`, `src/scenes/AnimalTraceScene.ts`,
  `src/scenes/FeelingsFacesScene.ts`, `src/scenes/ShapeSorterScene.ts`,
  `src/scenes/PatternBuilderScene.ts`, `src/__tests__/scenes/gameSceneBase.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run`
- **Status:** verified

- [x] **P1.T1: Write the failing second-visit regression test** — covers: FR-1, AC-1
  - [x] **P1.T1.1:** In `src/__tests__/scenes/gameSceneBase.test.ts`, add a test
    that uses the existing `TestScene` scaffold: create dots, emit the scene's
    `shutdown` event, create the dots again on the same instance, then assert
    that the tracked set holds only the current visit's dots and that
    `fillProgressDot(0)` targets the current visit's dot (the mock object
    records `setAlpha` calls).
  - [x] **P1.T1.2:** Run the new test against the unmodified base and record
    that it fails for the right reason — the tracked set still holds the
    previous visit's entries at the low indices, so the fill lands on a stale
    dot.
- [x] **P1.T2: Move progress-dot ownership into the base class** — covers: FR-1, AC-2
  - [x] **P1.T2.1:** `createProgressDots` replaces any previous set instead of
    appending to it, and the shutdown path releases the array so the scene
    holds no references to destroyed objects.
  - [x] **P1.T2.2:** Delete the four now-redundant per-scene resets
    (`AnimalTraceScene.ts:128`, `FeelingsFacesScene.ts:98`,
    `ShapeSorterScene.ts:98`, `PatternBuilderScene.ts:100`) — the base now
    guarantees the invariant for all 22 games.
  - [x] **P1.T2.3:** Re-run the regression test and the phase verification
    command; confirm the new test passes and no existing test changed outcome.

**Result:** verified
**Checkpoint:** 0e229e5
**Evidence:** conductor/tracks/20261022-session-lifecycle/verification/phase-1.md

## Phase 2: One Reaction, One Registration

- **Goal:** The shared wrong-answer reaction has exactly one implementation,
  and the shutdown cleanup handler is registered once per visit.
- **Depends on:** Phase 1
- **Covers:** FR-2, FR-4, AC-3, AC-5
- **Touches:** `src/scenes/GameSceneBase.ts`, `src/scenes/ChoiceRoundScene.ts`,
  `src/__tests__/scenes/gameSceneBase.test.ts`,
  `src/__tests__/scenes/choiceRoundScene.test.ts`,
  `src/__tests__/helpers/phaserMock.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run`
- **Status:** in_progress

- [ ] **P2.T1: Write the failing tests for the shared reaction and the
  handler registration** — covers: FR-2, FR-4, AC-3, AC-5
  - [ ] **P2.T1.1:** Assert that a wrong answer in a `ChoiceRoundScene` game
    plays the incorrect tone once, records one wrong tap, nods the mascot,
    wiggles the tapped card and the scene's own wiggle targets, and still
    fires `onWiggleComplete` and the overridable `onWrong` hook.
  - [ ] **P2.T1.2:** Assert the shared reaction has a single implementation —
    the incorrect tone is requested from exactly one place in `src/scenes`.
  - [ ] **P2.T1.3:** Assert the shutdown cleanup handler does not survive a
    shutdown. The mock keeps its live handler list private, so add a
    read-only `liveEventHandlerCount(event)` accessor to
    `src/__tests__/helpers/phaserMock.ts` (no change to any existing mock
    behavior) and assert the count returns to zero after the shutdown fires.
  - [ ] **P2.T1.4:** Run the new tests against the unmodified base and record
    that they fail for the expected reasons.
- [ ] **P2.T2: Consolidate the wrong-answer reaction** — covers: FR-2, AC-3
  - [ ] **P2.T2.1:** Give `GameSceneBase.reactWrong` an optional
    wiggle-completion callback so a caller can react when the wiggle ends.
    The tone, the wrong-tap count, the mascot nod and the wiggle tween itself
    stay in the base helper.
  - [ ] **P2.T2.2:** Make `ChoiceRoundScene.handleIncorrect` build its own
    wiggle targets — its `wiggleTargets(index)` plus the tapped card — and
    delegate the shared steps to `reactWrong`, keeping its `onWrong(index)`
    hook and its `onWiggleComplete(index)` completion.
  - [ ] **P2.T2.3:** Confirm the observable feel is unchanged — tone, tap
    count, nod, wiggle angle, duration, repeat count and ease — for the six
    games that already used the base helper and the fourteen that used the
    choice-round copy.
- [ ] **P2.T3: Register the shutdown cleanup once per visit** — covers: FR-4, AC-5
  - [ ] **P2.T3.1:** Switch `registerShutdownCleanup` from `events.on` to
    `events.once`, matching the pattern `init()` already uses at
    `GameSceneBase.ts:154`, so a fired handler is removed instead of
    accumulating one entry per visit.
  - [ ] **P2.T3.2:** Re-run the new tests and the phase verification command;
    confirm they pass and no existing test changed outcome.

## Phase 3: Abandoned Session Reaches the Adaptive Window

- **Goal:** A game the child backs out of still contributes its taps to the
  rolling adaptive window — and to nothing else.
- **Depends on:** Phase 2
- **Covers:** FR-3, AC-4
- **Touches:** `src/game/progressLogic.ts`, `src/utils/storage.ts`,
  `src/scenes/GameSceneBase.ts`, `src/__tests__/game/progressLogic.test.ts`,
  `src/__tests__/utils/storage.test.ts`,
  `src/__tests__/scenes/gameSceneBase.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run`
- **Status:** pending

- [ ] **P3.T1: Add a narrow tap-recording path** — covers: FR-3
  - [ ] **P3.T1.1:** Add a pure function to `src/game/progressLogic.ts` that
    folds a session's correct/wrong taps into the rolling recent-tap window
    and changes nothing else — not the cumulative `correct`/`wrong` counters,
    not `wins`, not `plays`.
  - [ ] **P3.T1.2:** Add the matching entry point in `src/utils/storage.ts`
    that writes it for the active profile, mirroring how
    `recordGameResult` targets the active profile.
  - [ ] **P3.T1.3:** Cover both with unit tests that assert the window moves
    and the cumulative counters, wins and plays do not.
- [ ] **P3.T2: Flush the pending taps on shutdown** — covers: FR-3, AC-4
  - [ ] **P3.T2.1:** Have `GameSceneBase` remember the game id it resolved
    from the registry so the shutdown path knows which game the pending taps
    belong to.
  - [ ] **P3.T2.2:** On shutdown, flush the pending taps when the session was
    not completed. A completed session has already zeroed its counters, so
    it must not be flushed twice; a session with no taps writes nothing.
  - [ ] **P3.T2.3:** Add a test that abandons a game mid-session and asserts
    the rolling window changed while the cumulative counters, wins and plays
    did not.
  - [ ] **P3.T2.4:** Re-run the phase verification command; confirm every new
    test passes and no existing test changed outcome.

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261022-session-lifecycle/verification/phase-1.md
-->

<!--
Review fixes are appended by `conductor-review` as:

## Phase R1: Review Fixes

- **Goal:** Resolve review findings ...
- **Depends on:** Phase 3
- **Covers:** review findings
- **Touches:** ...
- **Verification:** ...
- **Status:** pending

- [ ] **R1.T1: Resolve <finding ID>** — covers: <finding ID>
-->
