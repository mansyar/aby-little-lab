# Debug Probes — exploration without a penalty

## Overview

Fix-It Machine records every diagnosis tap as a right-or-wrong answer. A child who
taps a card to find out whether it is the wrong one is therefore recorded as
having answered wrongly, and a normal solve — tap a card, tap another, fix the
real one — lands at roughly 50% accuracy in the parent's Learning Progress. The
game's own spec promises the opposite: "a wrong card tap is information, never a
penalty."

This track separates **answering** from **exploring** in the learning-progress
recorder. An exploratory tap becomes a *probe*: counted, visible, and never
scored. Accuracy keeps meaning "of the answers given, how many were right", the
adaptive window stops seeing guesses, and a parent gets the debugging number that
was always missing — how much looking it took.

## Problem / Motivation

The defect is in the data, not on the screen. On screen a missed card tap bounces
back with a soft wobble and costs nothing; behind it, `FixItMachineScene.tapCard`
calls `reactWrong()` for every non-bug card, which increments `sessionWrong`, which
`recordGameResult` folds into `GameProgress.wrong`. `getAccuracy` divides
`correct` by `correct + wrong` and `ProgressOverlay` prints the result beside the
game's play count.

Consequences, in order of seriousness:

1. **The reported number contradicts the game.** A four-year-old who debugs at
   developmentally expected skill is shown to a parent as failing half the time.
2. **The adaptive window is polluted.** `recordResult` folds the same taps into
   `recent`, the rolling window that drives band shifts. Fix-It does not shift
   bands (its spec D6), but the window it writes is read by the shared logic, and
   any future debugging game that does shift bands would be shifted down by
   exploration.
3. **The skill is invisible.** Searching a program for its fault is exactly what
   this game teaches, and "how many cards did it take to find the wrong one" is
   the number a parent would want. Today it is recorded only as failure.

Only one game is affected today, because only Fix-It asks the child to *find*
which of several existing objects is the answer: every other scene's wrong tap is
a genuine answer to a choice the child made (which shape, which word, which
pair). The audit in Phase 2 records that finding rather than changing those games.

## Goals and Success Metrics

- **Goal:** exploration is counted and never scored.
  - *Metric:* a scene test drives a non-bug card tap and asserts exactly one
    probe, zero wrong answers and an unchanged hint ladder input.
- **Goal:** accuracy means answers.
  - *Metric:* `progressLogic` tests prove `recordResult` with probes leaves
    `getAccuracy` and the `recent` window identical to the same result without
    probes.
- **Goal:** the debugging number is visible to a parent.
  - *Metric:* `ProgressOverlay` renders the probe count for a game that has one
    and renders nothing for a game that does not.
- **Goal:** nothing else changes.
  - *Metric:* every other scene's recording call sites are untouched; the suite's
    previous pass counts hold except for the tests this track adds.

## Scope

### In scope

- `GameProgress` gains an additive `probes` counter, backfilled to zero for every
  stored save, with no storage-version bump.
- `recordResult` / `recordTaps` / `recordGameResult` / `recordGameTaps` carry
  probes without letting them reach accuracy or the adaptive window.
- `GameSceneBase` gains a `recordProbe()` beside `recordCorrect()`/`recordWrong()`,
  flushed with the existing single write.
- `FixItMachineScene`: a non-bug card tap records a probe instead of a wrong
  answer; the hint ladder keeps responding to it.
- `ProgressOverlay` shows the probe count; `insightsSummary` ignores it.
- `docs/TDD.md`, `conductor/product.md` and `README.md` state the rule.
- One assertion added to the existing `e2e/journeys/fix-it-machine.spec.ts`.

### Out of scope

- Any change to how the other games score their answers.
- A storage version bump, a migration, or a new profile field.
- A new game, a new screen, a new dependency, analytics, or a network call.
- A new browser spec file (the suite's budget is already close to its ceiling).
- Redesigning the Learning Progress overlay beyond one line per game.

## Functional Requirements

- **FR-1** — `GameProgress` gains `probes: number`. `createDefaultProgress()` returns
  0, `normalizeProgress()` coerces a missing or invalid value to 0, and a save
  written before this track normalises with `probes: 0` and no other field
  changed.
- **FR-2** — A probe is an exploratory touch. It increments `probes` only: it never
  changes `correct`, `wrong`, `wins`, `plays`, `lastPlayedAt`, `getAccuracy`, or the
  `recent` adaptive window.
- **FR-3** — `recordResult(progress, { correct, wrong, probes, win })` and
  `recordTaps(progress, { correct, wrong, probes })` accept probes; the probe count
  is added to `probes`, the adaptive window receives correct and wrong only, and
  an omitted probe count behaves as 0.
- **FR-4** — `recordGameResult(gameId, correct, wrong, probes)` and
  `recordGameTaps(gameId, correct, wrong, probes)` forward probes through the one
  `mutate`, so a session is still a single write. The probe argument is optional
  so existing call sites keep their behaviour.
- **FR-5** — `GameSceneBase` exposes `recordProbe()`, counts it in a session
  counter, and flushes it with the session's other taps on completion and on the
  abandoned-session path. A scene that never calls it records zero probes and its
  behaviour is unchanged.
- **FR-6** — In Fix-It Machine, a tap on a card that is not the round's wrong card
  records exactly one probe and no wrong answer; a tap on the wrong card still
  records one correct answer. Every tray tap keeps its current scoring: the right
  tool is correct, a distractor is wrong.
- **FR-7** — Every missed tap — probe or wrong answer — still advances Fix-It's hint
  ladder (`wrongTaps`). Hints are about being stuck, not about scoring.
- **FR-8** — `ProgressOverlay` shows a game's probe count when it is above zero, in
  the same row as its plays and accuracy, worded as looking rather than failing
  ("12 looks"). A game with zero probes renders no probe text at all.
- **FR-9** — `insightsSummary`'s per-game accuracy ranking uses answers only; a
  game's probes can never raise or lower it.
- **FR-10** — `e2e/journeys/fix-it-machine.spec.ts` taps a card that is not the bug
  card before repairing, then asserts from the saved progress after leaving that
  the game has exactly one probe, that its rolling answer window holds exactly the
  six misses the session really made (three stopped runs, three distractor tools),
  and that the abandoned session's win/counter totals are untouched. A seventh
  mark in the window is the defect coming back.

## Non-Functional Requirements

- **NFR-1** — No new dependency, no change to the bundle budget: the shell entry
  stays at or below 200 kB and the existing validators pass.
- **NFR-2** — A probe adds no write of its own: probes flush inside the session's
  existing single `mutate`, so the per-session write count is unchanged.
- **NFR-3** — No new motion: the probe path reuses the existing wrong-tap feedback,
  so `prefers-reduced-motion` behaviour is unchanged.
- **NFR-4** — The browser suite stays inside its five-minute budget: the journey is
  extended in place and no spec file is added.
- **NFR-5** — Offline-first is unchanged: no network call, and the probe counter
  lives in the same local save.

## Acceptance Criteria

- **AC-1** — An old save with no probe field loads with `probes: 0` and every other
  counter intact (covers FR-1).
- **AC-2** — A result recorded with probes reports the same accuracy and the same
  adaptive window as the identical result recorded without them (covers FR-2, FR-3).
- **AC-3** — A Fix-It session with exploration taps stores the probes, not the wrong
  answers, whether it was completed or abandoned (covers FR-4, FR-6, FR-10).
- **AC-4** — A missed card tap still raises the hint ladder (covers FR-7).
- **AC-5** — The Learning Progress overlay shows looks for a game that has them and
  shows nothing for a game that does not (covers FR-8).
- **AC-6** — The insights ranking is identical whether or not a game has probes
  (covers FR-9).
- **AC-7** — The full project gate exits 0 and the coverage thresholds hold
  (covers NFR-1, NFR-2, NFR-5).

## Decisions

- **D1 — Where does a probe live?** → An additive `probes` counter on the existing
  `GameProgress`, backfilled by `normalizeProgress`, with no storage-version bump —
  because the field is additive, the normaliser already backfills unknown saves,
  and a version bump would require a migration this defect does not justify.
- **D2 — Which taps are probes in Fix-It?** → Only a card tap that misses. The
  bug-card tap and every tray tap stay answers, because picking the tool is the
  repair decision and the tape tap is a search.
- **D3 — Do probes feed adaptive difficulty?** → No. The `recent` window keeps
  correct and wrong only, because exploration is not evidence about the child's
  answer accuracy.
- **D4 — Do probes advance the hint ladder?** → Yes. Hints respond to being stuck,
  which a probe proves just as well as a wrong answer, and the ladder's counter was
  already separate from scoring.
- **D5 — Where are probes shown?** → In the Learning Progress overlay's per-game row
  only, and only when above zero. Not in the insights summary, whose sentences are
  about answering.
- **D6 — How does the storage API take a probe count?** → As an optional trailing
  argument on the four existing functions, defaulting to 0, rather than an object
  signature — because every existing call site and test then keeps compiling and
  the change stays additive.
- **D7 — How is the end-to-end proof kept cheap?** → Extend the existing
  Fix-It journey and read `progressState`, rather than adding a spec file, because
  the browser suite is within a few seconds of its five-minute budget.
- **D8 — What happens to the other games?** → An audit that records which games tap
  to answer and why they stay as they are. No behaviour change without its own
  track.

## Edge Cases and Failure Modes

- **Old save, no probe field** — normalised to 0; every other counter unchanged.
- **Abandoned session with probes** — `recordGameTaps` flushes probes with the taps;
  counters for completed sessions stay untouched, as today.
- **Probe during a run or while input is locked** — ignored at the scene, exactly
  like the wrong-answer path; nothing is recorded.
- **The same card probed repeatedly** — each tap counts; there is no cap, because
  the number reports looking, and a child may look at one card many times.
- **A probe that is also the bug card** — impossible by construction: the bug card
  records a correct answer, never a probe.
- **Storage refused or degraded** — the guarded store keeps the change in memory;
  a probe never throws.
- **Backup and restore** — the exported save carries `probes` and the import
  normaliser accepts a backup that predates it.

## Dependencies

- Tracks: none
- External: none

## Open Questions and Assumptions

- **Does any other scene mix exploration with answering?** → assumed: no. Every
  other wrong tap is a choice among options the child was asked to pick from; the
  Phase 2 audit verifies this by reading each scene's recording call site, and a
  mismatch is recorded as a finding rather than fixed here.
- **Is a probe count useful at a play count of one?** → assumed: yes; it is shown
  from the first probe, because "3 looks" is meaningful immediately and costs a
  parent nothing to read.
- **Does the wording belong in this track?** → assumed: yes, one short label; the
  overlay's layout already has a free line for the accuracy/plays text.

## References

- `conductor/archive/20261116-fix-it-machine/spec.md` — the no-penalty goal and D11,
  which this track amends.
- `src/game/progressLogic.ts`, `src/scenes/GameSceneBase.ts`,
  `src/scenes/FixItMachineScene.ts`, `src/components/settings/ProgressOverlay.ts` —
  the path a tap takes to the parent's screen.
