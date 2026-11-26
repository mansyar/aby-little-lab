# Surface adaptive-band movement on the Progress Overview — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Add a parent-facing **current adaptive-band spread** to the Learning Progress
Overview for the profile being viewed. It counts only games with enough recent
evidence, shows easier/classic/harder counts, and replaces the static adaptive
note on the Overview only. This is deliberately not transition history: the app
stores only each game's rolling ten-tap window, so this track cannot prove
movement over days or weeks.

## Problem / Motivation

Parents currently see a static “Difficulty adapts…” note and per-game band labels,
but cannot quickly answer how many games are currently easier or harder. The
roadmap's adaptive-band metric is still marked “not surfaced.” A current spread
can close that visibility gap without changing storage or overstating what the
data proves.

## Goals & Success Metrics

- **Goal:** Make the current easier/classic/harder spread visible to parents.
- **Metric:** The Overview shows assessed-game counts and deterministic state copy
  for mixed, all-classic, sparse, and disabled cases.
- **Constraint:** Do not claim that the two-week “60% move ≥1 band” metric has been
  measured.
- **Gate:** The exact configured `verify_phase` chain and `validate-docs.js` pass.

## Scope

### In Scope

- A pure adaptive-spread derivation using `bandShiftFor` and `MIN_SAMPLE`.
- Evidence-aware readout copy.
- Viewed-profile and adaptive-toggle correctness.
- Overview-only replacement of the static note; per-game pages retain their
  existing note and rows.
- Unit/component tests and living product/engineering documentation updates.

### Out of Scope

- Persisted band-transition history, event logs, migrations, or save-schema changes.
- Any claim that the two-week “60% move ≥1 band” metric has been measured.
- Child-facing UI, narration, scoring, round counts, adaptive thresholds, or ladders.
- New games, dependencies, assets, network calls, analytics, or PII.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | Derive assessed/easier/classic/harder counts from normalized per-game progress, counting only games with at least `MIN_SAMPLE` recent taps and classifying them with `bandShiftFor`. | must |
| FR-2 | Produce explicit copy for mixed, all-classic, no-assessed-games, and adaptive-disabled states. | must |
| FR-3 | Derive the spread from the viewed profile, never the active profile. | must |
| FR-4 | Respect the adaptive-difficulty setting and show an explicit disabled state. | must |
| FR-5 | Render the dynamic spread only on the Overview at the existing note position. | must |
| FR-6 | Preserve the three insight statements, activity strip, paging, per-game rows, and static note on per-game pages. | must |
| FR-7 | Test mixed, sparse, all-classic, disabled, viewed-profile switching, short-window, and malformed-data cases. | must |
| FR-8 | Update PRD/TDD/changelog so they describe a current spread rather than historical movement. | must |
| FR-9 | Refresh living test/coverage/build figures required by the docs validator, without rewriting historical release notes. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No storage/schema/migration/dependency/asset/network/PII change. |
| NFR-2 | Pure, deterministic derivation; no mutation and no clock dependency. |
| NFR-3 | Parent-only, text-first readout; no color-only meaning and no unsupported evidence claims. |
| NFR-4 | Reuse existing adaptive constants/helpers and remain within module-size budgets. |
| NFR-5 | Exact configured `verify_phase` chain and `validate-docs.js` must pass. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | A fixture with assessed games in all three bands returns exact counts and deterministic copy. | FR-1, FR-2 |
| AC-2 | Assessed games all at shift 0 render “all at classic,” not a misleading movement claim. | FR-2 |
| AC-3 | No game with six recent taps renders the explicit not-enough-play state. | FR-1, FR-2 |
| AC-4 | Adaptive difficulty off renders the explicit disabled state even when windows contain enough taps. | FR-4 |
| AC-5 | Switching the viewed-profile chip changes the spread to that profile's data. | FR-3 |
| AC-6 | Only the Overview note changes; the three statements and per-game-page static note remain intact. | FR-5, FR-6 |
| AC-7 | Short/malformed windows are ignored safely and input progress is not mutated. | FR-1, FR-7 |
| AC-8 | Full verification passes, including coverage and docs validation 5/0. | NFR-5 |
| AC-9 | Docs clearly distinguish current spread from unmeasured longitudinal movement; historical release notes remain unchanged. | FR-8, FR-9 |

## Edge Cases

- Zero, one, or many assessed games.
- Exactly six recent taps and threshold boundaries.
- One or more band categories with zero games.
- Adaptive off with otherwise valid data.
- Switching between profiles with different evidence.
- Malformed or legacy progress records.
- All 24 games unplayed or below the evidence floor.

## Dependencies

- **Tracks:** none
- **External:** none

## Assumptions

- “Movement” means current spread for this track.
- The dynamic readout appears only on the Overview; per-game pages keep the
  existing static note.
- The longitudinal roadmap target remains explicitly unmeasured.

## References

- `conductor/roadmap.md` — RM-6 and §10.3 adaptive-band metric.
- `conductor/archive/20261124-adaptive-tuning/` — existing per-game band readout.
- `src/game/adaptiveLogic.ts` (`bandShiftFor`, `MIN_SAMPLE`, `WINDOW_SIZE`).
- `src/components/settings/ProgressOverlay.ts` and `progressBand.ts`.
- `src/game/insightsSummary.ts`, `docs/PRD.md`, and `docs/TDD.md`.
