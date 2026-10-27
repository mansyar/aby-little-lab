# HubScene Decomposition — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Split `src/scenes/HubScene.ts` (821 lines, the largest source file) into five
focused modules under `src/game/hub/`, leaving `HubScene` a thin coordinator
that owns only the `create()`/`shutdown` lifecycle wiring. No player-visible
behavior changes; the file is hard to navigate and mixes five concerns that
already have natural seams.

## Problem / Motivation

`HubScene` mixes art-group tables, the game-launch flow, prewarm orchestration,
play-time UI, and attract/decor logic in one 821-line class. Every Hub change —
most recently the idle-prewarm and art-preload tracks — lands in the same file,
raising review burden and regression risk for the screen every child touches
first. If it is not split, the next Hub change adds to the same knot.

## Goals & Success Metrics

- **Goal:** Five single-concern modules plus a thin `HubScene` coordinator.
- **Metric:** `HubScene.ts` ≤ ~320 lines, each new helper ≤ 200 lines.
- **Metric:** Zero behavior change — existing `hubScene.test.ts` passes
  unmodified, new per-module unit tests pass, full 8-command gate green.

## Scope

### In Scope

- Extract (1) art-group tables + SVG resolver, (2) game-launch flow with
  single-flight/visit-token guards, (3) prewarm orchestration, (4) play-time UI
  + nudge + visibility hook, (5) attract/decor/mascot setup into `src/game/hub/`.
- Rewire `HubScene` to construct and delegate; keep `create()`/`shutdown`.
- New unit tests per extracted module.

### Out of Scope

- `HubGrid`, components (`Mascot`, `ProfileChip`, `SettingsPanel`, …) — already
  separate, untouched.
- Any player-visible change (layout, timing, copy, audio, motion).
- Any cleanup beyond the cut (no renames-for-taste, no logic tweaks).

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | Art-group tables resolve every game's keys identically to today (resolver parity holds). | must |
| FR-2 | Game launch preserves single-flight, visit-token, time-up, and retry-cue semantics. | must |
| FR-3 | Prewarm orchestration preserves gates (play-time lock, hidden tab, launch in flight) and pass lifecycle. | must |
| FR-4 | Play-time indicator, refresh, visibility re-read, and pre-game nudge behave identically. | must |
| FR-5 | Idle attract, tile wiggle, mascot, and decorations behave identically. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | Zero behavior change: the diff is structural only. |
| NFR-2 | Dynamic `import()`s stay dynamic; `validate-bundle` shell budget (≤ 200 kB) holds. |
| NFR-3 | `HubScene.ts` ≤ ~320 lines; each new helper ≤ 200 lines. |
| NFR-4 | Coverage gates hold (95 / 88 / 85 / 90); `hubScene.test.ts` passes unmodified. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | Art tables extracted; resolver parity test passes; `hubScene.test.ts` green unmodified. | FR-1 |
| AC-2 | Launch flow extracted; single-flight/visit-token/retry-cue tests pass. | FR-2 |
| AC-3 | Prewarm orchestration extracted; gate/lifecycle tests pass. | FR-3 |
| AC-4 | Play-time UI and attract/decor extracted; HubScene ≤ ~320 lines; full gate green. | FR-4, FR-5 |
| AC-5 | No player-visible change confirmed by review of the final diff (structure only). | NFR-1 |

## Edge Cases

- Launch races: a load settling after shutdown or the next `create()` must stay
  inert (visit-token semantics preserved across the cut).
- Art-pass cancellation: in-flight resolutions after cancel/restart queue nothing.
- The `hubScene.test.ts` source guard pins dynamic-imports-only; the art-tables
  module must keep every artwork import a dynamic `import()`.
- Prewarm gates under play-time lock, hidden tab, and launch-in-flight.
- Reduced-motion paths (no decorations, no wiggle) preserved.

## Dependencies

- **Tracks:** none
- **External:** none

## Open Questions & Assumptions

- **Assumption:** Exact module file names are decided at implementation time
  within `src/game/hub/`; slice boundaries above are the contract.
- **Assumption:** `HubGrid`'s public surface needs no change to support the cut.

## References

- `src/scenes/HubScene.ts` (821 lines, pre-refactor)
- `src/scenes/__tests__/hubScene.test.ts` (behavior + import-guard pins)
- `src/game/hub/prewarm.ts`, `src/game/hubGrid.ts` (placement precedent)
