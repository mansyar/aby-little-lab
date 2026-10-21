# Session Lifecycle Integrity — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Make the game-session lifecycle owned by the shared base class and correct on
every visit. This track fixes a confirmed user-visible defect (progress dots
never fill from a child's second playthrough in 18 of the 22 games), collapses
the duplicated wrong-answer reaction into one implementation, stops the
adaptive tap window from losing a session the child abandoned, and stops the
shutdown cleanup handler from accumulating one entry per visit.

## Problem / Motivation

**1. Progress dots stop working from the second playthrough (18 of 22 games).**
`GameSceneBase.createProgressDots` (`src/scenes/GameSceneBase.ts:306-318`)
appends to the `this.progressDots` array without clearing it. Phaser destroys
every display-list child on scene shutdown
(`node_modules/phaser/src/gameobjects/DisplayList.js:165,243`) and reuses the
scene instance across visits (`src/scenes/HubScene.ts:108`). On the second
visit the array therefore holds the previous visit's destroyed `Arc` objects at
the low indices, and `fillProgressDot` (`src/scenes/GameSceneBase.ts:321-323`)
mutates those dead objects by index — the dots the child can actually see never
fill. Four games paper over it locally (`AnimalTraceScene.ts:128`,
`FeelingsFacesScene.ts:98`, `ShapeSorterScene.ts:98`, `PatternBuilderScene.ts:100`);
the other eighteen do not. The child loses all sense of round progress from
their second game onward.

**2. The wrong-answer reaction exists twice.**
`GameSceneBase.reactWrong` (`src/scenes/GameSceneBase.ts:352-367`) and
`ChoiceRoundScene.handleIncorrect` (`src/scenes/ChoiceRoundScene.ts:258-281`)
each play the incorrect tone, record the wrong tap, nod the mascot and run the
same reduced-motion-aware wiggle. Six games get the base version, the fourteen
`ChoiceRoundScene` games get the copy. Any change to the wrong-answer feel must
be made in two places, and the two have already drifted.

The two are not identical. The choice-round copy additionally drives a wiggle
`onComplete` callback (`onWiggleComplete(index)`) and an overridable
`onWrong(index)` hook, and it selects the objects to wiggle itself
(`wiggleTargets(index)` plus the tapped card). The base helper has no place
for either, which is why the copy was written in the first place — it is the
reason the consolidation needs a small extension rather than a blind swap.

**3. An abandoned session loses every tap.**
`completeGame` (`src/scenes/GameSceneBase.ts:374-378`) is the only writer of
the session counters. A child who backs out mid-game — a normal, unpunished
action in a no-fail app — loses those taps, so the rolling 10-tap window that
drives adaptive difficulty (`src/game/adaptiveLogic.ts:49-62`) never sees them.

**4. The shutdown handler accumulates.**
`registerShutdownCleanup` (`src/scenes/GameSceneBase.ts:416-428`) uses
`events.on`, not `events.once`. Every visit to a game adds another handler
that is never removed, so the handler list grows by one entry per visit for
the lifetime of the scene instance. Each handler is null-guarded, so this is a
slow leak rather than a crash — but it is in the same lifecycle and the same
file.

Who feels it: the child (dots never fill), the parent (accuracy under-reports
when a session is abandoned), and the maintainer (one policy, two
implementations, plus a leaked handler per visit).

## Goals & Success Metrics

- **Goal:** the shared base class owns the session lifecycle and it is correct
  on every visit.
  - **Metric:** a second-visit regression test proves the visible progress dot
    receives the fill on visit 2; no game scene assigns to `this.progressDots`.
- **Goal:** exactly one implementation of the wrong-answer reaction exists.
  - **Metric:** `src/scenes/**` contains exactly one `playIncorrect()` call
    site, in `GameSceneBase.reactWrong`.
- **Goal:** a child's abandoned taps still inform adaptive difficulty.
  - **Metric:** a test shows the rolling window changes on abandon while the
    cumulative counters, wins and plays do not.
- **Goal:** nothing about the shipped experience changes.
  - **Metric:** all 2,463 existing tests keep their current outcome, the audio
    identity work from `20261021-audio-variety` is untouched, and the wrong-answer
    feel is byte-identical for both audiences.

## Scope

### In Scope

- The base class owns the progress-dot lifecycle across visits; the four
  now-redundant per-scene workarounds are removed.
- One implementation of the shared wrong-answer reaction. `ChoiceRoundScene`
  keeps its own target selection, its `onWrong` hook and its
  wiggle-completion callback.
- An abandoned session folds its taps into the adaptive rolling window only.
- The shutdown cleanup handler is registered once per visit.

### Out of Scope

- Bringing the seven non-adaptive games (`shape-sorter`, `animal-trace`,
  `pop-freeze`, `shadow-match`, `big-small`, `feelings-faces`, `story-order`)
  into the band system. They keep collecting a window nothing reads.
- Any change to the *feel* of the wrong-answer reaction: timings, amplitude,
  tone, mascot nod and the reduced-motion variants stay exactly as they are.
- Giving Animal Trace or Pop & Freeze a wrong-answer reaction. Neither game
  has a wrong state; Pop & Freeze's `handleWake`
  (`src/scenes/PopFreezeScene.ts:266-280`) is a success moment, not an error.
- Migrating the three hand-rolled drag games onto the `DragBoard` shell.
- Tuning the per-game audio identities, the BGM, or the pop/wake/sticker cues.
- Storage schema versioning, the install-prompt scope fix, and the
  chunk-load failure path.
- The documentation truth pass (PRD §7, TDD §2/§8, README, v1.21.0 notes).

## Bug Details

- **Reproduction steps:**
  1. Open the app and pick any of the eighteen games that does not reset the
     dots itself (for example Find the Word).
  2. Play and complete one run, or let the 3-second auto-return take you back
     to the Hub.
  3. Tap the same game tile again. Phaser restarts the same scene instance, so
     `create()` runs a second time on it.
  4. Answer the first round correctly.
  5. Look at the progress dots along the top of the screen: the dot does not
     fill. The fill pulse went to the previous visit's destroyed dot.
- **Expected behavior:** the visible progress dot fills as each round is
  answered, on every visit.
- **Actual behavior:** from the second visit onward the visible progress dots
  never fill.
- **Root-cause hypothesis:** `GameSceneBase.createProgressDots`
  (`src/scenes/GameSceneBase.ts:306-318`) appends to a `protected` array that
  is never cleared. Phaser's `DisplayList.shutdown` destroys every child
  (`node_modules/phaser/src/gameobjects/DisplayList.js:165,243`) and the scene
  instance is reused across visits (`src/scenes/HubScene.ts:108`), so the array
  keeps references to destroyed `Arc` objects and `fillProgressDot`
  (`src/scenes/GameSceneBase.ts:321-323`) targets them by index.
- **Regression test:** a test that drives one scene through
  `create()` → shutdown → `create()` and asserts that the dot belonging to the
  *current* visit receives the fill (not a stale object from the previous one).
  It must fail on the base branch and pass after the fix.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | `GameSceneBase` owns the progress-dot lifecycle: creating dots replaces any set left from a previous visit instead of appending to it, and the shutdown path releases the array. All 22 games fill their visible progress dots correctly from the first round of every visit. The four per-scene workarounds (`AnimalTraceScene.ts:128`, `FeelingsFacesScene.ts:98`, `ShapeSorterScene.ts:98`, `PatternBuilderScene.ts:100`) are removed because the base now guarantees the invariant. | must |
| FR-2 | Exactly one implementation of the shared wrong-answer reaction exists. `GameSceneBase.reactWrong` gains an optional wiggle-completion callback, and `ChoiceRoundScene.handleIncorrect` keeps its own choice of wiggle targets, its overridable `onWrong(index)` hook and its `onWiggleComplete(index)` completion, delegating the incorrect tone, the wrong-tap count, the mascot nod and the wiggle tween itself to the base helper. The observable feel — tone, tap count, mascot nod, wiggle angle, duration, repeat count and ease — is unchanged for both the six games that already used the base helper and the fourteen that used the choice-round copy. | must |
| FR-3 | When a game scene shuts down without completing, the taps recorded during that session are folded into the rolling 10-tap window that drives adaptive difficulty, and into nothing else. The cumulative `correct`/`wrong` counters, the win count, the play count and the parent-facing accuracy are unaffected by an abandon. | must |
| FR-4 | The shutdown cleanup handler is registered once per visit rather than accumulated. A second visit to the same scene does not leave the first visit's handler attached. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No change to the shipped per-game audio identities, the win and celebration flow, the sticker award, or the wrong-answer feel. Existing audio, scene and storage tests keep their current outcome. |
| NFR-2 | No new dependency, no new runtime network access. The app stays offline-first (`conductor/workflow.md`, guiding principle 8). |
| NFR-3 | Coverage stays at or above lines 95 / functions 88 / branches 85 / statements 90; the shell bundle stays under the 200 kB gate; the PWA validator stays 16/16. |
| NFR-4 | The base class remains the single owner of shared session state. The change requires no edits to the 22 game scenes beyond removing the four now-redundant workarounds. |
| NFR-5 | No new animation, no new audio, no new child-facing text. Nothing about the visual or audible experience of a game changes except that the progress dots fill again. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | A regression test drives a scene through two visits and asserts the second visit's visible dot receives the fill; it fails on the base branch and passes after the fix. | FR-1 |
| AC-2 | No game scene assigns to `this.progressDots`; the only writes to that array live in `GameSceneBase`. | FR-1 |
| AC-3 | A test asserts the wrong-answer reaction plays the incorrect tone exactly once, records exactly one wrong tap, and nods the mascot for a choice-round game; and `src/scenes/**` contains exactly one `playIncorrect()` call site. | FR-2 |
| AC-4 | A test asserts that shutting a scene down mid-session folds the session's taps into the adaptive rolling window and leaves the cumulative counters, the win count and the play count unchanged. | FR-3 |
| AC-5 | A test asserts the shutdown cleanup handler does not accumulate: after two visits, the first visit's handler is no longer attached. | FR-4 |
| AC-6 | The full `verify_phase` gate passes and the four coverage gates hold. | FR-1, FR-2, FR-3, FR-4 |

## Edge Cases

- A game is completed and then shuts down after the 3-second auto-return:
  `completeGame` already zeroed the counters, so the flush writes nothing and
  the result is not double-recorded.
- A game shuts down with zero taps recorded: nothing is written.
- A game shuts down after only wrong taps: those wrong taps are folded in
  alone.
- Two different games played back to back: the flush writes to the game that
  was actually visited, never to the previously visited one.
- A scene shuts down before its registry entry resolved (unknown scene key):
  no flush is written.
- A game that is not adaptive (seven of them) is abandoned: the taps are still
  folded into its window. Nothing reads it yet, so no behavior changes.

## Dependencies

- **Tracks:** none. `20261021-audio-variety` is merged (`cbf017e`) and this
  track is cut from `master`.
- **External:** none.

## Open Questions & Assumptions

- **Question:** none open. All four scope decisions were confirmed by the user
  on 2026-10-22.
- **Assumption:** "adaptive window only" means one narrow storage entry point
  that updates `progress[gameId].recent` and nothing else. The parent's
  Progress overlay numbers do not move because a child abandoned a game.
- **Assumption:** the wrong-answer consolidation keeps `ChoiceRoundScene`'s own
  target selection, `onWrong` hook and wiggle-completion callback local to
  that class; the base helper gains only an optional completion callback, not
  a flash parameter.
- **Assumption:** Animal Trace and Pop & Freeze gain no wrong-answer reaction
  in this track — neither game has a wrong state.
- **Assumption:** `conductor/product.md` has no "Open Questions & Assumptions"
  section, so no product-level open question seeds this spec.

## References

- `src/scenes/GameSceneBase.ts:53`, `:306-332`, `:352-367`, `:374-378`, `:416-428`
- `src/scenes/ChoiceRoundScene.ts:258-281`
- `src/scenes/AnimalTraceScene.ts:128`, `src/scenes/FeelingsFacesScene.ts:98`,
  `src/scenes/ShapeSorterScene.ts:98`, `src/scenes/PatternBuilderScene.ts:100`
- `src/scenes/PopFreezeScene.ts:266-280`
- `src/scenes/HubScene.ts:108`
- `src/utils/storage.ts:218-255`, `src/game/progressLogic.ts:65-93`,
  `src/game/adaptiveLogic.ts:33-62`
- `node_modules/phaser/src/gameobjects/DisplayList.js:165,243`
- `conductor/workflow.md` — verification layers, coverage gates, evidence path
- `conductor/product-guidelines.md` §4 — No-Fail Design
