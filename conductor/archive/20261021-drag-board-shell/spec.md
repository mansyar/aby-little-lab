# Drag-Board Shell Unification — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Extract a shared, parameterized **ordered-drag-board shell** from
`NumberOrderScene.ts` (441 L) and `StoryOrderScene.ts` (385 L), and extract the
inline wiggle/nod/soft-tone wrong-answer reaction sequences repeated across the
8 direct `GameSceneBase` games into shared base helpers. The shell architecture
(GameSceneBase → ChoiceRoundScene → GroupMathScene) is this codebase's proven
pattern for eliminating per-game scaffolding; this track extends it to the two
drag-board games.

## Problem / Motivation

- `NumberOrderScene` and `StoryOrderScene` each hand-roll near-identical
  scaffolding over `ChoiceRoundScene`: drop zones at a shared `SLOT_Y`,
  `isOverAnyZone()`, `snapToSlot` wiring, tap-withdraw logic — **~150+
  duplicated lines**. Story Order added a 10px tap threshold and retry-in-place
  wiggles that Number Order lacks; the next drag-based game (two of the last
  three games are drag games) would copy from whichever came third.
- The 8 direct `GameSceneBase` subclasses (Shape Sorter, Animal Trace,
  Pop & Freeze, Shadow Match, Musical Memory, Big vs. Small, Memory Match,
  Build the Word) repeat wiggle/soft-tone/nod reaction sequences inline instead
  of calling shared helpers — only Feelings Faces, Number Order, and Story
  Order override `onWrong()`.

## Goals & Success Metrics

- **Goal:** One shared ordered-drag-board shell serves both drag games;
  wrong-answer reactions live in `GameSceneBase` helpers. Net source-line
  reduction in the two scenes (~150+ lines) with zero behavior change.
- **Metric:** Full `verify_phase` gate passes (typecheck, ~2,200 tests,
  coverage 95/88/85/90, bundle ≤ 200 kB shell); existing Number Order &
  Story Order tests pass with only mechanical re-wiring.

## Scope

### In Scope

- New shared component owning: slot/drop-zone registration, hover detection,
  `snapToSlot` wiring via `dragJuice`, tap-vs-drag discrimination (10px
  threshold), and parameterized policies (see FR-1).
- Wrong-answer reaction helpers on `GameSceneBase` (wiggle, soft tone, nod —
  the `sfx_incorrect` gentle descending tone stays).
- Rewiring both scenes onto the new shell/helpers; their public behavior and
  scene keys unchanged.

### Out of Scope

- Changing any game's visible behavior (bounce-home vs retry-in-place stays
  per-game).
- Migrating the 8 direct games onto `ChoiceRoundScene`'s round loop.
- New games, new art, audio content changes, `hubGrid` decomposition.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | The drag-board shell exposes per-game policies: wrong-answer behavior (bounce-home vs retry-in-place), tap-withdraw (on/off), and per-slot validation timing (drop vs round-full) — each game keeps its current combination. | must |
| FR-2 | `NumberOrderScene` and `StoryOrderScene` delegate slot management, hover/drop detection, snapping, tap-vs-drag, and tap-withdraw to the shared shell; neither retains its own drop-zone/snap scaffolding. | must |
| FR-3 | `GameSceneBase` provides shared wrong-answer reaction helpers (wiggle + nod + gentle tone) used by the inline-repeating games; game-specific overrides (Feelings Faces, Number Order, Story Order `onWrong()`) still work. | must |
| FR-4 | Existing shell classes (`GameSceneBase`, `ChoiceRoundScene`, `GroupMathScene`) remain untouched except where the new code plugs into them. | should |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | Shell bundle size does not grow toward the 200 kB gate (currently 195.4 kB); both drag scenes remain lazy-loaded chunks. |
| NFR-2 | Behavior preservation: existing Number Order & Story Order scene/flow tests assert the same behavior with at most mechanical re-wiring; no regression in any of the 22 games' suites. |
| NFR-3 | `prefers-reduced-motion`, single-finger drag, ≥64×64 touch targets, and no-fail philosophy (no penalties) remain intact per product guidelines. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | Both drag scenes contain no local drop-zone registration, `isOverAnyZone`, or snap logic; all of it resolves in the shared shell. | FR-1, FR-2 |
| AC-2 | Number Order keeps bounce-home + drop-validation; Story Order keeps retry-in-place + round-full validation + tap-withdraw; existing tests pass unchanged except mechanical re-wiring. | FR-1 |
| AC-3 | The 8 direct games' wrong-answer reactions route through the shared `GameSceneBase` helper; a per-game override (e.g. Feelings Faces) still takes effect. | FR-3 |
| AC-4 | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js` all pass; new shell tests cover each parameterized policy. | FR-1, FR-2, NFR-1, NFR-2 |

## Edge Cases

- Slot↔slot swap and tray↔slot displacement (both current behaviors) preserved
  through the shell.
- Story Order's `key|key|key` signature guard against re-validation loops must
  survive the extraction.
- Tap-that-is-really-a-drag (sub-threshold movement) and drag-that-ends
  off-board.
- Shutdown cleanup: shell-owned listeners/tweens must register with
  `GameSceneBase` shutdown registry.
- `prefers-reduced-motion`: wiggle/snap animations degrade per `motion.ts`.

## Dependencies

- **Tracks:** none active (predecessors — Shared Choice-Round Shell, Story
  Order, Number Order, God-File Decomposition — are merged & archived).
- **External:** none.

## Open Questions & Assumptions

- **Assumption:** The 8 direct games share enough reaction-sequence shape
  (wiggle + nod + gentle tone) for one helper set; if a game's sequence differs
  materially, it keeps its own and we note it.
- **Assumption:** Shell placement follows the `GroupMathScene` precedent
  (generic over a round type) — final home (`src/game/` vs `src/components/`)
  decided in the plan.

## References

- `src/scenes/NumberOrderScene.ts`, `src/scenes/StoryOrderScene.ts`,
  `src/game/dragJuice.ts`, `src/scenes/GameSceneBase.ts`,
  `src/scenes/ChoiceRoundScene.ts`
- Product guidelines: No-Fail Design, touch/motion accessibility
- Archived tracks: Shared Choice-Round Shell, Story Order, Number Order
