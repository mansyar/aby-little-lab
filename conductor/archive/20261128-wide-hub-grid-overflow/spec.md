# Fix wide hub grid overflow with 25th game tile — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Restore the default wide All-view hub contract (every tile + sticker shelf on-canvas) with 25 registry games by giving the wide grid an explicit overflow rule: tiles flow to a fifth row and the board stays in-canvas, with narrow layouts checked and rebalanced only where the rule interacts.

## Problem / Motivation

With 25 games, `buildWideGrid` lays out 6/6/6/6 + 1 against `GRID_ROWS = 4`. The 25th tile (Repeat Machine) lands on a fifth row below the fold and its sticker-shelf plaque clips off-canvas at 1024x768. The default All-board contract is every tile + shelf on-canvas. Non-blocking today: reachable via tap, via the Thinking chip, and E2E passes — but the board is visibly broken.

## Goals & Success Metrics

- **Goal:** 25th tile + its shelf plaque fully on-canvas in default All wide view; narrow layouts unaffected or rebalanced where the rule interacts.
- **Metric:** bounds assertion over all 25 tiles + shelves passes; full `verify_phase` gate green.

## Scope

### In Scope

- Overflow rule for the wide grid: 5th-row flow, recentered origin as needed to stay in-canvas at 1024x768.
- Narrow-layout check; rebalance only where the overflow rule interacts.
- Regression test: extend the `hubScene.test.ts` bounds assertion from 24 tiles to all tiles + shelf plaques.

### Out of Scope

- Paged-layout fallback (rejected by product decision: flow, not paging).
- 5x5 rebalance (rejected).
- New art/assets; tile resizing.
- New E2E journeys (existing journeys must stay green).

## Bug Details

- **Reproduction steps:**
  1. Boot at 1024x768 wide viewport.
  2. Open the hub default All view.
  3. Observe the 25th tile (Repeat Machine) on a fifth row below the fold with its shelf plaque clipped.
- **Expected behavior:** all 25 tiles + shelf plaques on-canvas in a 6/6/6/6 + 1 flow.
- **Actual behavior:** 25th tile below the fold, shelf plaque clipped off-canvas.
- **Root-cause hypothesis:** `wideTileCenter`/`wideGridOrigin` assume 6x4 capacity (`GRID_ROWS = 4`); origin/container not recentered for a fifth row; bounds test covers only the original 24.
- **Regression test:** extended in-canvas bounds assertion over all `GAME_TILES` + shelf plaques at 1024x768 in `hubScene.test.ts` — must fail before the fix and pass after.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | Wide All-view lays out all registry tiles in 6/6/6/6 + 1 flow with every tile + shelf plaque fully inside canvas at 1024x768 | must |
| FR-2 | Narrow layouts render all tiles in-canvas, rebalanced only where the overflow rule interacts, otherwise unchanged | must |
| FR-3 | Board origin recenters so the 5-row board stays visually centered | should |
| FR-4 | No existing hub behavior changes (chip filters, paging, entrances, locks, shelf spotlight) | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No new assets, dependencies, storage, or texture-budget change |
| NFR-2 | Coverage gates hold (95/88/85/90); full `verify_phase` green |
| NFR-3 | No measurable perf change (layout is arithmetic; first-tap p95 report-only) |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | Bounds unit test over all 25 tiles + shelf plaques at 1024x768 passes (fails pre-fix) | FR-1 |
| AC-2 | Narrow-viewport bounds assertions pass for all tiles | FR-2 |
| AC-3 | Full `verify_phase` gate green on the track branch | FR-4, NFR-2 |
| AC-4 | `validate-textures` figures unchanged | NFR-1 |

## Edge Cases

- Window resize/rotate between wide and narrow after the fix.
- Chip-filtered views (e.g. Thinking) unaffected.
- Shelf spotlight / empty-slot rendering on the fifth row.
- Daily-cap lock / time-up overlay on fifth-row tiles.
- Future 26th game: the flow rule generalizes (document, don't build).

## Dependencies

- **Tracks:** `20261128-repeat-machine` (merged to `master` — satisfied).
- **External:** none.

## Open Questions & Assumptions

- **Assumption:** 5th-row flow per user product decision 2026-11-28 (overrides #108's paged-fallback suggestion).
- **Assumption:** tile size stays unchanged; origin recentering suffices at 1024x768 — to be verified in-track; if a fifth row cannot fit, report blocked rather than silently shrinking tiles.
- No open questions.

## References

- Issue #108; `conductor/archive/20261128-repeat-machine/review.md` (F1); `src/game/hub/gridBuilder.ts:119-127`; `hubScene.test.ts` bounds assertion.
