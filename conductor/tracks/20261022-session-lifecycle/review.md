# Review: Session Lifecycle Integrity

- **Track:** `20261022-session-lifecycle`
- **Type:** `bug`
- **Branch:** `fix/20261022-session-lifecycle`
- **Range:** `cbf017ecf9eaf65e4fda5a1e8a2efc635193cc5d..b325250`
- **Date:** 2026-10-22
- **Verdict:** `PASS WITH FINDINGS`

## Summary

The three lifecycle defects this track set out to fix are fixed at the right
level — in the shared base class, not in each scene — and the review confirmed
the two failure modes that matter most: the abandoned-session flush cannot
double-count (the completion path is the only cumulative writer, it zeroes the
counters, and the flush zeroes them again, so a reused scene instance cannot
report the same taps twice), and the flush cannot write to the wrong profile or
the wrong game. The wrong-answer *feel* is preserved for the enumerated
elements — the tone, the wrong-tap count, the mascot nod, the wiggle angle,
duration, repeat count and ease all resolve to the same values as before.

One shipped behaviour did change, and the track's own spec said it must not:
consolidating the reaction moved the scene's `onWrong` hook ahead of the
shared feedback, so in Feelings Faces the re-spoken scenario now starts before
the incorrect tone instead of after it, and the tone lands on top of the
narration. The reorder was introduced to keep `onWrong` strictly before
`onWiggleComplete` — but the pre-existing order was already safe, because the
wiggle tween's completion was always asynchronous. The reorder bought nothing
and changed what the child hears. That is finding F1, and it is fixed in
Phase R1. Four Low findings (a stale doc comment, a mis-stated fact about the
play counter repeated in four places, a test helper that no longer models
Phaser's `once` semantics, and a test name that now describes the opposite of
what it guards) are fixed in the same phase. No finding was deferred: the
project runs `review.strict`, so all five are fixed rather than filed.

Volume was large (17 code files, 609 insertions, 73 deletions), so the review
covered each phase checkpoint diff separately and then the cross-phase
integration diff, and duplicate findings were merged.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| test | `pnpm test -- --run` | fail (environment) | 7 files / 10 tests, every one a wall-clock timeout (5,000 / 15,000 / 20,000 ms) in files this track does not touch; no assertion failure; the failing set differs between runs |
| test | `pnpm test -- --run --maxWorkers=2` | pass | 117 files / 2486 tests, 0 failed — the documented fallback for this machine |
| coverage | `pnpm test:coverage -- --maxWorkers=2` | pass | Statements 97.92% (gate 90), Branches 91.62% (85), Functions 96.58% (88), Lines 98.69% (95) — all four gates hold |
| lint | `pnpm check` | pass | 246 files; 1 pre-existing warning (`src/__tests__/scenes/musicalMemoryScene.test.ts:294`) and 1 pre-existing info (`biome.json` schema) — both predate the track and are untouched |
| typecheck | `pnpm typecheck` | pass | clean |
| build | `pnpm build` | pass | clean build |
| build-artifact | `node scripts/validate-bundle.js` | pass | Phaser vendor chunk present (1342.6 kB); shell entry 134.6 kB (≤ 200 kB) |
| build-artifact | `node scripts/validate-pwa.js` | pass | 16 passed, 0 failed |
| integrated | `verify_phase` gate | pass | `verification/integrated.md` |

The reviewer re-ran `pnpm check` and `pnpm typecheck` independently; both pass
with only the two pre-existing noise items.

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1.T1, P1.T2 | `src/__tests__/scenes/gameSceneBase.test.ts:358` (second visit), `:648` | covered |
| FR-2 | P2.T1, P2.T2 | `src/__tests__/scenes/choiceRoundScene.test.ts:424`, `:456`, `:476`; `gameSceneBase.test.ts:890`, `:942` | partial — the reaction is consolidated and the tone/count/nod/wiggle are pinned, but the **order** of the tone relative to the scene's `onWrong` hook was not pinned, and it changed (F1) |
| FR-3 | P3.T1, P3.T2 | `src/__tests__/game/progressLogic.test.ts`; `src/__tests__/utils/storage.test.ts:809-961`; `src/__tests__/scenes/gameSceneBase.test.ts:714-806` | covered |
| FR-4 | P2.T3 | `src/__tests__/scenes/gameSceneBase.test.ts:648-665`; `src/__tests__/helpers/phaserMock.test.ts:248` | covered |
| NFR-1 | P2.T2, P2.T3 | `src/__tests__/scenes/choiceRoundScene.test.ts:372`, `:396` | partial — the wrong-answer *feel* changed in one respect (the tone now follows the scene's re-speech in Feelings Faces) (F1) |
| NFR-2 | all phases | no `package.json` / lockfile change; `src/utils/storage.ts` writes through `mutate()` only, no network | covered |
| NFR-3 | all phases | coverage above all four gates; shell 134.6 kB; PWA 16/16 | covered |
| NFR-4 | all phases | the diff touches `GameSceneBase`, `ChoiceRoundScene`, the four removed workarounds, plus the three declared deviations | covered |
| NFR-5 | all phases | no new animation, audio asset or child-facing copy | covered |
| AC-1 | P1.T1 | `gameSceneBase.test.ts:358` | covered |
| AC-2 | P1.T2 | `progressDots` is assigned only in `GameSceneBase.ts:354` and `:490`; `MusicalMemoryScene.ts:271` is a read | covered |
| AC-3 | P2.T1, P2.T2 | `choiceRoundScene.test.ts:424-454`; `gameSceneBase.test.ts:942-952` | covered |
| AC-4 | P3.T2 | `gameSceneBase.test.ts:733-772`, `:774-806` | covered |
| AC-5 | P2.T3 | `gameSceneBase.test.ts:648-665` | covered |
| AC-6 | all phases | `verification/integrated.md` | covered |

## Findings

### Critical

- <none>

### High

- <none>

### Medium

- **F1 - The `onWrong` hook now runs before the incorrect tone, changing what the child hears**
  - **File:** `src/scenes/ChoiceRoundScene.ts:265-276`
  - **What:** Consolidating the reaction inverted the order of the scene's
    `onWrong` hook. Before the track the sequence was playIncorrect →
    recordWrong → mascot nod → wiggle tween → `onWrong(index)` (last). It is
    now `onWrong(index)` → playIncorrect → recordWrong → nod → wiggle tween.
    The reorder was introduced so that `onWrong` still precedes
    `onWiggleComplete` when the base releases the completion synchronously
    because there is nothing to wiggle — but the pre-existing order was
    already safe, because the old tween's `onComplete` was always
    asynchronous, so `onWiggleComplete` could never beat the synchronous
    `onWrong` call. The "nothing to wiggle" path is unreachable in
    production (the twelve tap-a-choice games always include the tapped card,
    and Number Order / Story Order only answer once every slot is filled, so
    `board.placedPieces()` is never empty), so the reorder bought nothing and
    changed shipped behaviour.
  - **Why:** `FeelingsFacesScene.onWrong` (`src/scenes/FeelingsFacesScene.ts:175-179`)
    re-speaks the scenario with the Web Speech API. The wrong tap now
    re-speaks the scenario first and the gentle `sfx_incorrect` tone plays on
    top of that narration, instead of the tone leading and the scenario
    following. The error cue is masked by the speech it is meant to
    accompany. It also contradicts NFR-1 ("no change to … wrong-answer feel")
    and the plan's P2.T3 "confirm feel unchanged", and no test pinned the
    order of the tone relative to the scene hook.
  - **Fix:** Keep the shipped order by giving the base an explicit
    pre-wiggle hook instead of moving the scene hook ahead of the tone:
    `protected reactWrong(targets?: GameObject[], onComplete?: () => void, onPreWiggle?: () => void): void`
    with the body `playIncorrect(); recordWrong(); mascot?.nod(); onPreWiggle?.(); if (!targets || targets.length === 0) { onComplete?.(); return; } tweens.add({ …, onComplete })`,
    called from `ChoiceRoundScene.handleIncorrect` as
    `this.reactWrong(targets, () => this.onWiggleComplete(index), () => this.onWrong(index))`.
    That restores tone → record → nod → `onWrong` → tween (observationally
    identical to the pre-track order, because the tween completion is
    asynchronous) and still guarantees `onWrong` strictly before
    `onWiggleComplete`, including the synchronous release.
  - **Requirement:** FR-2, NFR-1
  - **Test gap:** Add a choice-round test that records the order of the
    incorrect tone and the subclass's `onWrong` hook, asserting the tone
    comes first.

### Low

- **F2 - The `onWrong` doc comment states the opposite of the code**
  - **File:** `src/scenes/ChoiceRoundScene.ts:88`
  - **What:** The comment still reads "Optional per-game wrong-answer extras,
    run after the shared feedback." The track moved `onWrong` ahead of the
    shared feedback, so the comment now contradicts the code. (The sibling
    `onCorrect` comment at line 85 is still correct.)
  - **Why:** The file the track edited carries a comment that contradicts its
    own behaviour, so the next reader either trusts the comment and re-breaks
    the ordering, or wastes time re-deriving it.
  - **Fix:** Update the comment to describe the restored contract — the extras
    run after the shared tone and before the wiggle completes.
  - **Requirement:** FR-2
  - **Test gap:** none

- **F3 - The play count does not describe completed sessions; the claim is repeated in four places**
  - **File:** `docs/PRD.md:405`
  - **What:** The new sentence "Only the window moves: the plays, the accuracy
    and the win count a parent sees describe completed sessions only" is wrong
    about the play count. `plays` is incremented by the Hub when a tile is
    tapped (`recordGamePlay(GAME_TILES[tileIndex].gameId)` at
    `src/scenes/HubScene.ts:234`), i.e. when the game *starts*, so a game the
    child starts and abandons still counts as a play for the parent. Only the
    accuracy (derived from the cumulative `correct`/`wrong` counters) and the
    win count describe completed sessions. This also contradicts PRD §4.7 two
    paragraphs above ("a play when a Hub tile is tapped"). The same phrasing
    was copied into three other places by this track: `docs/TDD.md:763`,
    `src/game/progressLogic.ts:100` and `src/scenes/GameSceneBase.ts:183-184`.
  - **Why:** The PRD is the normative product document, and as written it
    tells a reader that abandoning a game does not change the play count the
    parent sees — which is false. The behaviour itself is correct (the flush
    really does leave `plays` alone), but the prose misattributes where the
    play count comes from, and the same sentence now appears in the TDD and in
    two code comments, so the error is load-bearing in four places.
  - **Fix:** Reword to separate the two counters in all four places — the
    accuracy and the win count describe completed sessions; the play count
    still counts every game the child starts, abandoned or not.
  - **Requirement:** FR-3
  - **Test gap:** none

- **F4 - `triggerShutdown` no longer models Phaser's `once` semantics**
  - **File:** `src/__tests__/helpers/sceneFlowHarness.ts:216-229`
  - **What:** The helper walks the raw `mock.calls` of both `events.on` and
    `events.once` and invokes each registered function directly, bypassing
    the emitter. The mock's own `emit` retires a `once` handler after it fires
    (pinned by `src/__tests__/helpers/phaserMock.test.ts:248-264`), and Phaser
    removes a `once` listener before invoking it — but `triggerShutdown` never
    retires anything, so a `once` handler that has already fired is invoked
    again on every later `triggerShutdown` call on the same scene.
  - **Why:** The base now registers per-visit `once` handlers
    (`registerShutdownCleanup`, the game-context clear, the pending-tap
    flush), so this helper drives `once` semantics it does not model. No
    current test calls `triggerShutdown` twice on one scene, so nothing fails
    today; the first test that does will silently double-destroy the mascot
    and double-invoke the flush, and it will read as a product bug rather
    than a harness artefact.
  - **Fix:** Use the emitter the helper stands in for:
    `events.emit("shutdown")` — the mock's `emit` already fires both `on` and
    `once` registrations and retires the `once` ones, which is exactly
    Phaser's behaviour, and it removes the duck-typing over the two register
    mocks.
  - **Requirement:** FR-4
  - **Test gap:** Add a helper test asserting that a `once` shutdown handler
    registered on a scene fires once across two `triggerShutdown` calls.

- **F5 - A pre-existing test name now describes the opposite of its behaviour**
  - **File:** `src/__tests__/scenes/gameSceneBase.test.ts:701`
  - **What:** The test is still named "does not flush results when the scene
    shuts down without completing". After this track a shutdown without
    completing *does* flush — the taps go to the rolling window through
    `recordGameTaps`; what is not written is the completed result
    (`recordGameResult`).
  - **Why:** The test still passes (it only asserts on
    `mockRecordGameResult`), which is exactly why the stale name is
    dangerous: a future reader scanning the suite for shutdown/flush
    behaviour concludes that nothing is written on an abandoned shutdown and
    may delete or weaken the real guard tests in the "abandoned session
    flush" block.
  - **Fix:** Rename it to "does not record a completed result when the scene
    shuts down without completing" and, if the intent is to pin the whole
    contract, add `expect(mockRecordGameTaps).not.toHaveBeenCalled()`
    alongside the existing assertion.
  - **Requirement:** FR-3
  - **Test gap:** none

## Overrides

- <none>

## Plan compliance

All three planned phases are accounted for, and every task marked `[x]` was
implemented and verified by a phase evidence file:

- **Phase 1 — Progress-Dot Lifecycle** (P1.T1, P1.T2): verified,
  checkpoint `0e229e5`, evidence `verification/phase-1.md`. The new test was
  confirmed to fail on the unmodified base ("expected […] to have a length of
  3 but got 6") before the fix.
- **Phase 2 — One Reaction, One Registration** (P2.T1, P2.T2, P2.T3):
  verified, checkpoint `34c3a31`, evidence `verification/phase-2.md`. Four new
  tests were confirmed to fail on the unmodified base. This phase introduced
  finding F1.
- **Phase 3 — Abandoned Session Reaches the Adaptive Window** (P3.T1, P3.T2):
  verified, checkpoint `48d81a8`, evidence `verification/phase-3.md`. Nine
  failures on the unmodified base were confirmed first.
- No task was silently dropped. The final diff stays inside the union of the
  phases' `Touches` except for the five declared deviations, all recorded in
  the phase evidence files.

## Out of scope

- The seven non-adaptive games (Shape Sorter, Animal Trace, Pop & Freeze,
  Shadow Match, Big vs. Small, Feelings Faces, Story Order) still fold their
  taps into a window nothing reads. This was explicitly out of scope in the
  spec.
- The `recordGameResult` path and the parent-facing accuracy model were not
  changed, as specified.
- The repository's standing documentation debt (no release notes for the
  tracks merged since v1.20.0, `package.json` still at 1.20.0) is a release
  decision, not part of this track.

## Debt

- <none — every finding is fixed in Phase R1; nothing was deferred>

## Doc sync

`pending` — the post-review documentation sync runs after Phase R1 and will
cover the two files this track touched (`docs/PRD.md` §4.8, `docs/TDD.md`
§7.3), including the F3 correction in both.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | PASS WITH FINDINGS | 0 | 0 | 1 | 4 | 0 |
