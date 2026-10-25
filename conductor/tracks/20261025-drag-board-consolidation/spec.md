# Drag-Board Consolidation — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Move the three drag games that hand-roll their drag scaffolding — Shape Sorter
(`src/scenes/ShapeSorterScene.ts`), Shadow Match (`src/scenes/ShadowMatchScene.ts`)
and Big & Small (`src/scenes/BigSmallScene.ts`) — onto the shared drag-board
shell that Number Order and Story Order already use
(`src/game/dragBoard.ts`). The consolidation is internals-only: every lift,
drop-zone highlight, snap, bounce-home and lock-on-correct stays as shipped.
The shell absorbs the three scenes' shape differences with one minimal, generic
generalization (pieces may be plain `Phaser.GameObjects.Image` objects; a slot
may accept multiple pieces), after which a search for `DragBoard` in
`src/scenes/` finds five of the five drag games instead of two.

## Problem / Motivation

`docs/roadmap.md` Known Issue "Three games hand-roll their drag scaffolding"
(checked against the code 2026-10-22, re-verified 2026-10-25): Shape Sorter,
Shadow Match and Big & Small each rebuild lift, drop-zone highlight and snap
from the `dragJuice` helpers and wire `dragstart`/`drop` themselves, while only
`NumberOrderScene` and `StoryOrderScene` use `DragBoard`. The shared board's
swap and tap-withdraw behaviours reach only two of the five drag games, and the
scaffolding exists in five places where it could live in one. Any future change
to drag ergonomics must now be applied in five scenes; this track makes it
apply in one.

Scope guard (user decision 2026-10-25): **behaviour parity, internals only.**
No kid-visible behaviour changes: no tap-withdraw, no `onTap` speech hook, no
slot swaps in the three adopting games. The board adoption must be
undetectable to a kid playing any of the three games.

## Goals & Success Metrics

- **Goal:** All five drag games manage their drag scaffolding through
  `DragBoard`; the three adopting scenes delete their hand-rolled piece state
  wiring, drag event wiring and duplicated bounce constants.
- **Metric:** `grep DragBoard src/scenes/` returns five scenes; the three
  adopting scenes no longer import `snapToSlot` / wire `obj.on("drop", …)`
  directly; the whole 8-layer verification gate (typecheck, lint, unit
  coverage, schema, docs, build, PWA audit, mutation spot-check) passes; the
  adopting scenes' existing regression suites plus new board-capacity tests
  are green.

## Scope

### In Scope

- Generalize `src/game/dragBoard.ts` minimally and generically (no
  game-specific branches):
  - Widen the piece contract's draggable field from
    `Phaser.GameObjects.Container` to the `DragTarget` capability set
    (transform + drag lifecycle + scene), so the scenes' plain
    `Phaser.GameObjects.Image` pieces qualify without reparenting.
  - Introduce a slot capacity option (`single` | `multi`) so Big & Small's two
    book-keeping slots (each holding many toys) register on the board; placed
    occupancy bookkeeping keeps feeding the same `onDrop` /
    round-full-signature machinery.
- Rebuild `ShapeSorterScene` piece/slot orchestration on the board
  (bounce-home on wrong, per-drop validation, no withdraw).
- Rebuild `ShadowMatchScene` piece/slot orchestration on the board
  (bounce-home on wrong, per-drop validation, no withdraw).
- Rebuild `BigSmallScene` piece/slot orchestration on the board (bounce-home on
  wrong, per-drop validation, no withdraw, multi-occupancy boxes).
- Delete the now-duplicated per-scene scaffolding: local `BOUNCE_DURATION` /
  `BOUNCE_REDUCED_DURATION` copies and hand-wired `dragstart`/`drop` +
  snap_home code paths, superseded by the board's identical defaults the three
  scenes already match numerically (300 / 180 ms).
- Keep per-scene constants that stay scene-specific: drop-zone sizes, layout
  y-positions, shrink-into-box timing, shadow-stamp pulse, box lid wiggle.
- Docs truth: update `docs/TDD.md` (drag-board section + the three game
  sections), and `docs/roadmap.md` (remove the Known Issue and Future-Work
  item 1, refresh the "checked against the code" date, and remove the delivered
  "Bank play time as it is earned" bullet — user-approved fold-in).

### Out of Scope

- Any kid-visible behaviour change: no tap-withdraw in the three games, no
  `onTap` piece-speech hook, no slot↔slot swaps beyond what the two existing
  board games already do, no new sprites, sounds or copy.
- Rewrites of board mechanics used by Number Order / Story Order that would
  change their behaviour (their parity is also asserted, not redesigned).
- A general redesign of `dragJuice.ts` beyond what the board adoption needs.
- The remaining roadmap items (storage schema version, shared random helpers)
  — separate tracks.
- Device-class finger testing (manual, post-release, as before).

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | `ShapeSorterScene` runs its piece lift, drop-zone highlight, snap, wrong-answer bounce-home and per-drop validation entirely through `DragBoard`, with visuals (cutout slot images, shape art, splash/ray feedback) unchanged. | must |
| FR-2 | `ShadowMatchScene` runs its piece lift, drop-zone highlight, snap, wrong-answer bounce-home, per-drop validation and shadow-stamp pulse entirely through `DragBoard`, with visuals unchanged. | must |
| FR-3 | `BigSmallScene` runs its piece lift, drop-zone highlight, snap, wrong-answer bounce-home, per-drop validation, shrink-into-box tween, lid wiggle and box bump entirely through `DragBoard`, registering its two boxes as multi-occupancy slots, with visuals unchanged. | must |
| FR-4 | The shell's generalizations are generic: the piece contract accepts both `Image` and `Container` draggables via the `DragTarget` capability set, slots declare single or multi capacity, and `src/game/dragBoard.ts` contains no game-name or game-specific branches. | must |
| FR-5 | The three adopting scenes delete their hand-rolled drag scaffolding that the board supersedes — hand-wired `dragstart`/`drop` state machines and local bounce-duration constants duplicated from board defaults. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | Kid-visible behaviour parity: timings (lift, snap settle, bounce home, shrink, lid wiggle), feedback and lock-on-correct match the shipped games; reduced-motion variants keep their shorter/gentler forms. |
| NFR-2 | Number Order and Story Order behaviour parity: their existing regression suites and board tests pass unchanged in intent; the shell generalization must not alter their visual or timing behaviour. |
| NFR-3 | The full verification gate passes (typecheck, lint, unit tests with coverage thresholds, schema, docs validator, build shell ≤ 200 kB, PWA audit) exactly as configured in `conductor/workflow.md`. |
| NFR-4 | Bundle discipline: the shell stays game-free and small; any shell growth must be a negligible fraction of the 200 kB gate (fingerprint change alone is expected and not a regression). |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | A search of `src/scenes/` for `DragBoard` returns Shape Sorter, Shadow Match, Big & Small, Number Order and Story Order, and zero scenes hand-wire their own `drop` state machine for slot placement (`obj.on("drop")` appears only inside the shell or where scenes keep non-placement reaction wiring). | FR-1, FR-2, FR-3, FR-5 |
| AC-2 | Board-level tests cover the generalizations: an `Image`-satisfying piece registers and delivers `onDrop`; a multi-capacity slot accepts several pieces in the same gesture session and feeds each drop to the scene; a `single` slot keeps exact Number-Order/Story-Order occupancy semantics. | FR-4 |
| AC-3 | Per-scene regression suites exist and pass for all three adopting games, asserting the shipped board surface: wrong answers bounce home at the board's 300/180 ms timings, correct answers validate per drop and run their scene-owned reaction (splash-ray / stamp pulse / shrink-lid-bump), and placed-correct pieces lock. | FR-1, FR-2, FR-3 |
| AC-4 | Number Order and Story Order suites pass with no behavioural delta beyond what their own tests already accept. | NFR-2 |
| AC-5 | The whole verification gate (NFR-3's layers) is green on the track branch, including the docs validator. | NFR-3 |
| AC-6 | `docs/TDD.md` describes the board's generalized piece contract and slot capacity truthfully, names all five consuming scenes, and `docs/roadmap.md` carries neither the drag-scaffolding Known Issue nor the drag-board Future-Work item nor the delivered play-time-banking bullet. | FR-5 |

## Edge Cases

- **Tap-vs-drag discrimination:** the board's drag-distance threshold (10 px
  default) becomes active in the three scenes; tiny jitters read as taps.
  Scenes that never treated taps specially keep working through the same
  threshold the two existing board games use.
- **Overlapping drop zones:** the three games' inflated zones do not overlap
  today; board hover/nearest-zone rules are the same engine rules the existing
  boards already use.
- **Gesture during feedback:** wrong-answer bounces and correct-answer
  reactions run under the board's shared scene input lock (`isLocked`), as in
  Number Order / Story Order.
- **Round teardown:** the board releases its zone/listener/tween state on scene
  shutdown (same registry mechanism as GameSceneBase); the three scenes read
  the round's pieces fresh each round as today.
- **Reduced motion:** every board-driven movement must honour
  `motionDuration`-style switches exactly as the scenes do today.
- **Big & Small box capacity:** a full or partial box accepts at most one
  piece per drop gesture; the box's sorted-vs-fit validation stays in the
  scene (shell reports, scene validates — unchanged shell contract).

## Dependencies

- **Tracks:** none.
- **External:** none (no new assets, no new audio, no storage shape change).

## Open Questions & Assumptions

- **Assumption:** the scenes do not set `dragDistanceThreshold` today; after
  adoption the board's 10 px default applies, matching the two existing board
  games. Impact on the three shipped games is treated as parity-neutral
  (drags start after 10 px of travel instead of immediately), subject to
  per-scene regression proof.
- **Assumption:** the exact internal shape of the piece records during
  migration (which fields move into `BoardPiece`-satisfying records, how
  `originX/Y` derive from each tray layout) is a plan-level design decision;
  the spec pins only the outcome (parity, no per-game branches).
- **Question (parked):** whether `dragJuice.ts`'s `attachDragLift` /
  `attachDropZoneHighlight` remain scene-called inside the board's wiring
  (current board design) or get absorbed into the shell — resolved in the plan
  by whatever the two existing board games already do, without redesign.

## References

- `docs/roadmap.md` — Known Issue "Three games hand-roll their drag
  scaffolding" and Future-Work item 1 (the reason for this track).
- `src/game/dragBoard.ts` — the shell (contract under FR-4's generalization).
- `src/utils/dragJuice.ts` — lift/highlight/snap helpers the board builds on.
- `src/scenes/{ShapeSorterScene,ShadowMatchScene,BigSmallScene}.ts` — the three
  adopting scenes (verified hand-rolling on 2026-10-25).
- `src/scenes/{NumberOrderScene,StoryOrderScene}.ts` — the two board games
  (parity baseline NFR-2).
- `conductor/archive/20261021-drag-board-shell/` — the track that extracted
  the shell from Number Order and Story Order.
