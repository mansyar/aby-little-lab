# Debug Probes — exploring stops costing accuracy

## What

Fix-It Machine recorded every tap on a tape card as a right-or-wrong answer, so a
child who tapped a card to find out whether it was the faulty one collected wrong
answers for looking. A normal solve — look, look, find it, repair it — landed near
50% accuracy in the parent's Learning Progress, which is the opposite of what the
game promises on screen.

This branch separates **answering** from **looking** in the learning-progress
recorder. An exploratory tap becomes a *probe*: stored on the game's progress,
shown to a parent as `3 looks`, and never scored. Accuracy still means "of the
answers given, how many were right", the rolling window that drives adaptive
difficulty no longer sees guesses, and the debugging skill gets the number it was
always measuring but reporting as failure.

The rule it rests on is written down for the next debugging game: **pressing Go,
choosing a tile, placing a letter or picking a tool is an answer; tapping an
object to see what it is, is a look.**

## Why

[`spec.md`](./spec.md) — the archived Fix-It spec's own goal says "a wrong card
tap is information, never a penalty"; the penalty existed only in the data layer,
where `FixItMachineScene.tapCard` recorded a wrong answer per look and
`progressLogic.recordResult` folded it into the accuracy ratio and the adaptive
window.

## Evidence

- Phase reports: [`verification/`](./verification) — `phase-1.md` … `phase-5.md`,
  each with a command table and its exit codes.
- Review: [`review.md`](./review.md) — verdict **PASS**, round 2, cold-read,
  pinned to `b308ae20`.
- Gates: `.conductor/evidence/20261117-debug-probes/phase-{1..5}-gate.log`, all
  `GATE EXIT: 0`. Unit suite 3,323 tests over 153 files; coverage 97.12 / 90.94 /
  96.21 / 98.31 against 95 / 88 / 85 / 90; shell entry 186.7 kB ≤ 200 kB; PWA
  16/16; documents 5/5.
- Browser: `pnpm test:e2e` 26 cases in 3.7 min — the same 26 as before, because
  the Fix-It journey was extended rather than duplicated.

## Coverage

| ID | Test | Evidence |
|---|---|---|
| FR-1, FR-2, FR-3 | `src/__tests__/game/progressLogic.test.ts` (probes block) | phase-1.md |
| FR-4 | `src/__tests__/utils/storage.test.ts` (probes stored, flushed, exported, backfilled) | phase-1.md |
| FR-5, FR-6, FR-7 | `src/__tests__/scenes/gameSceneBase.test.ts`, `fixItMachineScene.test.ts` | phase-2.md |
| FR-8, FR-9 | `src/__tests__/components/settings/ProgressOverlay.test.ts` (plural and singular look labels), `insightsSummary.test.ts` | phase-3.md |
| FR-10 | `e2e/journeys/fix-it-machine.spec.ts` (one probe saved; six real misses in the window) | phase-3.md |
| AC-1 … AC-7 | mapped in `review.md` | phases 1–5 |

## Debt and follow-ups

- **R1-1 (Low) — fixed** in Phase 5: the look label is a module helper, not a
  closure rebuilt inside the row loop. Its singular branch now has its own case,
  proved by removing the branch and watching that case fail.
- **R1-2 (Low) — accepted**: the archived Fix-It spec still describes the old rule,
  because archives are frozen by convention. The live rule is the TDD paragraph
  added in Phase 4, and this track's spec supersedes the archived one.
- **Not changed on purpose**: a stopped run is still recorded as a wrong answer,
  because pressing Go is the child's claim that the program is right. Only card
  taps became probes. The distinction is in `docs/TDD.md`.

## Decisions

| ID | Taken | Authority |
|---|---|---|
| D1 | Additive `probes` on `GameProgress`, backfilled to 0, no schema bump | spec D1 |
| D2 | Only a missed card tap is a probe; the tray keeps scoring answers | spec D2 |
| D3 | Probes never enter the adaptive window | spec D3 |
| D4 | Every miss still advances the hint ladder | spec D4 |
| D5 | Looks appear in the Learning Progress row only, when non-zero | spec D5 |
| D6 | Probes travel as an optional trailing argument on the storage writers | spec D6 |
| D7 | The end-to-end proof extends the existing Fix-It journey | spec D7 |
| D8 | Other games audited, not changed | spec D8 |

## Notes

- An old save loads with `probes: 0` and every other counter intact; a merge
  takes the higher probe count, so a re-import adds nothing.
- The Fix-It journey now asserts from the stored save that one look is stored as a
  look and that the rolling answer window holds exactly the six misses the session
  really made. A seventh would be this defect coming back.
- Nothing in this branch touches a game's rounds, art, audio, pacing or difficulty.
