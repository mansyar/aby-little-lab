# Specification: Hub Grid Decomposition

## Overview

`src/game/hubGrid.ts` is the last god file in the codebase (773 lines) mixing four independent concerns: grid layout + entrance bob, the paged phone layout, the sticker shelf, and time-up dimming. This track splits it into focused modules under `src/game/hub/` behind a thin orchestrator (`hubGrid.ts` stays the single entry point), applying only visually-indistinguishable cleanups. Zero feature work and no user-visible redesign.

## Problem / Motivation

Every hub-related change — paging, sticker effects, time-up handling — edits one 773-line file that is hard to review, hard to test in isolation, and keeps growing with each hub feature. The earlier god-file decomposition track split HubScene and SettingsPanel but deliberately left hubGrid intact. The hub is the most-trafficked screen in the app; decomposing it now keeps future hub work cheap and reviewable, using the same proven pattern as the god-file and drag-board tracks.

## Goals & Success Metrics

- **Goal:** hubGrid.ts becomes a thin orchestrator of **≤200 lines** (from 773) whose four concerns live in separate `src/game/hub/` modules.
  - *Metric:* line count of `src/game/hubGrid.ts` recorded in evidence.
- **Goal:** Behavior parity — the hub looks and behaves the same (allowed cleanups aside).
  - *Metric:* hub/navigation suites green with assertions intact; only mechanical re-wiring.
- **Goal:** Project health gates hold.
  - *Metric:* coverage ≥ 95/88/85/90; shell bundle ≤ 200 kB; full verify_phase gate exit 0.

## Scope

### In Scope

- Extracting the four concerns into separate modules under `src/game/hub/`:
  1. grid layout + entrance bob,
  2. paged phone layout board (reusing existing `hubPaging.ts` where it already fits),
  3. sticker shelf (sparkle/burst),
  4. time-up dimming.
- Allowed cleanups (each visually indistinguishable or provably dead):
  - magic numbers → named constants shared across modules,
  - timing dedup across concerns only where tween configs are already visually equivalent,
  - dead-code / unused-constant removal confirmed by the test suite,
  - internal helper renames for readability (no semantic change).
- New unit tests covering each extracted module's contract.

### Out of Scope

- Changes to `hubPaging.ts`, `hubTiles.ts`, or `HubScene.ts` (a seam may require a minimal, recorded deviation).
- Any new hub features or visual redesigns.
- Changes to the hub's public data flow (`gameRegistry`, progress reads, profile handling).

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | The four concerns live in separate modules under `src/game/hub/`; no concern's implementation remains inline in the orchestrator. | Must |
| FR-2 | `hubGrid.ts` remains the single module `HubScene` imports; its public exports and observable behavior are preserved, and the file shrinks to ≤200 lines. | Must |
| FR-3 | Every non-extraction change in the diff maps to one of the four approved cleanup classes and is listed in the phase evidence. | Must |
| FR-4 | Each extracted module has unit tests covering its contract (including reduced-motion and cross-concern edge cases noted below). | Must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | Visible behavior parity: layout, entrance bob, paging, sticker effects, and dimming are indistinguishable except for approved cleanups. |
| NFR-2 | Coverage gates (95/88/85/90) hold; shell entry ≤ 200 kB; the full verify_phase gate passes on the final phase. |
| NFR-3 | Hub constraints preserved: ≥64px touch targets, prefers-reduced-motion degradation, wide-viewport layouts byte-identical (hubPaging precedent), no mid-animation state leaks on scene shutdown. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | Each concern module owns its logic; the orchestrator contains no mixed-concern implementation (grep/inspection evidence). | FR-1 |
| AC-2 | `HubScene.ts` requires no changes; existing hub tests keep their assertions with at most mechanical re-wiring. | FR-2 |
| AC-3 | Every cleanup in the final diff maps to an approved cleanup class and is itemized in the evidence. | FR-3 |
| AC-4 | New module tests pass and the full verification gate is green. | FR-4, NFR-2 |

## Edge Cases

- Reduced-motion variants of the entrance bob, sticker sparkle, and dimming tweens.
- Time-up dimming while the phone layout is mid-page or during a page slide.
- Sticker-award burst racing a page transition.
- Scene shutdown while any concern's tween/animation is active (no state leaks).
- Wide vs narrow viewport switches at runtime (paged vs full grid).

## Dependencies

**Tracks:** none active (Drag-Board Shell Unification merged via PR #52).

**External:** none.

## Open Questions & Assumptions

- **Assumption:** Concern boundaries follow the four areas above; Phase 1 confirms them against the actual code and records the module map in evidence before extraction proceeds.
- **Assumption:** "Timing dedup" applies only where tweens are already visually equivalent; whenever equivalence is in doubt, keep the existing values and note it in evidence.

## References

- `src/game/hubGrid.ts` (the subject)
- `src/game/hubPaging.ts`, `src/game/hubTiles.ts` (adjacent, unchanged)
- `conductor/archive/` — god-file decomposition and drag-board shell tracks (pattern precedent)
- `conductor/product-guidelines.md` — motion durations, reduced-motion, touch targets
- Hub suites under `src/__tests__/` (navigation, hub grid, paging)
