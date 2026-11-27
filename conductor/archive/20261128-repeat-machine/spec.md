# Add Game 25: a Repeat Machine for Loops — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Add the 25th mini-game, Repeat Machine, closing the coding-ladder gap: children author a tiny repeat-N program (one move+sound action, count 2–4) and watch the machine replay it. Target dots show the required count; a wrong count replays visibly and the child retries.

## Problem / Motivation

The coding ladder ends at authoring (Robot Path) and debugging (Fix-It Machine); PRD evidence notes only ~24.6% of four-year-olds produce a repeat-N program. No game teaches the loop concept. If unsolved, the ladder stays incomplete and RM-9 stays an idea.

## Goals & Success Metrics

- **Goal:** A shippable 25th game teaching repeat-N through author-then-watch play.
- **Metric:** 6-round sessions complete with scoring/progress saved; seeded tests prove both correct and wrong-count paths; full gate green.

## Scope

### In Scope

- New `RepeatMachineScene` + repeat-N rule module (target count, action+count program, replay verification).
- Move+sound action set reusing existing art/audio; target-dot display; replay-then-retry on wrong count.
- House session pattern: 6 rounds, scoring, completion, adaptive shifts, saved progress.
- Full wiring: 25th `GAME_IDS` entry, Thinking-group hub placement, progress rows, E2E roster.
- Docs: PRD/TDD/changelog truth; README counts move 24 → 25 games.

### Out of Scope

- Debug/broken-loop authoring (Fix-It Machine owns it); repeat-until or sequence loops; new art/audio assets; narrative/story content; retention or device claims.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | Author a repeat-N program: pick one move+sound action and a count 2–4 | must |
| FR-2 | Show N target dots per round; ramp 2 → 4 across the 6-round session | must |
| FR-3 | Run the program visibly: mascot performs the action exactly N times with sound | must |
| FR-4 | Correct count wins the round; wrong count replays the mismatch then allows retry, scoring on eventual success | must |
| FR-5 | Follow the house session: 6 rounds, scoring, completion, adaptive shifts, saved progress | must |
| FR-6 | Register as the 25th game: `GAME_IDS`, Thinking-group hub chip, progress rows, E2E roster | must |
| FR-7 | Seeded tests for both slides (correct/wrong counts), ramp, no-repeat, invariants, and no-regression parity | must |
| FR-8 | Living docs truth (PRD/TDD/changelog/README 24→25) with historical records unchanged | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No new assets/dependencies/schema/storage; reuse existing art/audio |
| NFR-2 | Deterministic replay from seeded RNG; no `Math.random` in game logic |
| NFR-3 | Round counts/scoring/completion/adaptive behavior match sibling games |
| NFR-4 | Exact configured gate green; bundle stays under cap |
| NFR-5 | Docs validator 5/0; README/PRD/TDD agree on 25 games |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | Authoring publishes action+count; replay performs exactly N action+sound pairs | FR-1, FR-3 |
| AC-2 | Target dots equal the round's N; ramp covers 2–4 across 6 rounds | FR-2 |
| AC-3 | Correct count wins; wrong count visibly replays mismatch and retries to success | FR-4 |
| AC-4 | 6 rounds, scoring, completion, adaptive shifts, saved progress all work | FR-5 |
| AC-5 | 25th registry entry, hub chip, progress rows, E2E journey pass | FR-6 |
| AC-6 | Seeded tests cover correct/wrong/ramp/no-repeat paths; suite green | FR-7 |
| AC-7 | Docs state 25 games with history intact; validator 5/0; gate green | FR-8, NFR-4, NFR-5 |

## Edge Cases

- N at ramp boundaries (2 early, 4 late); adaptive shift changing mid-session targets.
- Retry loop: repeated wrong counts never soft-lock; quit mid-round loses nothing saved.
- Malformed program state (no action / no count) blocks Run with guidance, never crashes.

## Dependencies

- **Tracks:** RM-5 content-variant wiring — satisfied (shipped in PR #104, merged).
- **External:** none.

## Open Questions & Assumptions

- **Assumption:** Move+sound reuses Robot Path / existing mascot moves; no new animation needed.
- **Assumption:** Thinking-group placement follows existing hub group order; exact chip position decided in implementation.

## References

- `conductor/archive/20261116-fix-it-machine/spec.md` (repeat-N gap, 24.6% evidence)
- `conductor/roadmap.md` RM-9; `src/game/gameRegistry.ts`; sibling scenes `RobotPathScene`, `FixItMachineScene`
