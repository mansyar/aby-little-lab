# Drag-Board Consolidation — Implementation Plan

> **Branch:** `refactor/20261025-drag-board-consolidation`
> **Base:** `master` @ `7f40c076d08d4f6a95a498d1aa0c1435abddc098`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Generalize the shell — Image pieces and slot capacity

- **Goal:** `src/game/dragBoard.ts` accepts both `Image` and `Container`
  draggables via the `DragTarget` capability set and supports single- and
  multi-capacity slots, generically, with board-level tests proving it.
- **Depends on:** none
- **Covers:** FR-4, AC-2, NFR-2, NFR-3, NFR-4
- **Touches:** `src/game/dragBoard.ts`, `src/__tests__/game/dragBoard.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified

- [x] **P1.T1: Board tests for the generalizations (red first)** — covers: FR-4
  - [x] **P1.T1.1: Image-piece test** — a piece whose draggable is a plain `Phaser.GameObjects.Image` (satisfying the `DragTarget` set) registers on the board, delivers a drop through `onDrop` and updates occupancy, proving the widened contract.
  - [x] **P1.T1.2: Slot-capacity test** — a `multi` slot accepts several distinct pieces across drop gestures, feeding each drop to the scene, while a `single` slot keeps the exact single-occupancy semantics Number Order and Story Order rely on (existing board tests prove those unchanged).
> **Red-first note:** the P1.T1 tests must fail against the un-generalized
> shell (a TS type error under vitest is an acceptable red) before
> implementation begins.
- [x] **P1.T2: Generalize the shell** — covers: FR-4
  - [x] **P1.T2.1: Widen the piece contract** — the draggable field becomes the `DragTarget` capability set (transform + drag lifecycle + scene) so `Image` and `Container` both qualify; `BoardPiece` keeps its data fields as-is.
  - [x] **P1.T2.2: Add slot capacity** — `addSlot` gains a capacity option (`single` default | `multi`); occupancy bookkeeping (per-slot pieces, round-full signature entries, tray↔slot displacement) generalizes over lists; no game names and no game-specific branches in `dragBoard.ts`.

**Result:** verified
**Checkpoint:** `3d94b937`
**Evidence:** conductor/tracks/20261025-drag-board-consolidation/verification/phase-1.md

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/<track-id>/verification/phase-1.md
-->

## Phase 2: Adopt the board in Shape Sorter, Shadow Match and Big & Small

- **Goal:** All three adopting scenes run their drag scaffolding through
  `DragBoard` (bounce-home, per-drop validation, no withdraw), delete their
  hand-rolled wiring and duplicated bounce constants, and are proven at
  behaviour parity by regression suites; the two existing board games stay
  unchanged.
- **Depends on:** Phase 1
- **Covers:** FR-1, FR-2, FR-3, FR-5, AC-1, AC-3, AC-4, NFR-1, NFR-2, NFR-3, NFR-4
- **Touches:** `src/scenes/ShapeSorterScene.ts`, `src/scenes/ShadowMatchScene.ts`, `src/scenes/BigSmallScene.ts`, `src/__tests__/scenes/shapeSorterScene.test.ts`, `src/__tests__/scenes/shapeSorterFlow.test.ts`, `src/__tests__/scenes/shadowMatchFlow.test.ts`, `src/__tests__/scenes/bigSmallScene.test.ts`, `src/__tests__/scenes/bigSmallFlow.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified

- [x] **P2.T1: Shape Sorter onto the board** — covers: FR-1
  - [x] **P2.T1.1: Rebuild orchestration** — piece/slot records satisfy `BoardPiece`; slots register as `single`; wrong drops bounce home via the board (300/180 ms), correct drops fire the scene's splash/ray reaction through callbacks; juice stays scene-called (`attachDragLift`, `attachDropZoneHighlight`) the same way the two board games use juice; delete the hand-wired `dragstart`/`drop` state machine and local `BOUNCE_*` constants.
- [x] **P2.T2: Shadow Match onto the board** — covers: FR-2
  - [x] **P2.T2.1: Same rebuild** — identical board wiring to P2.T1 with the shadow-stamp scale pulse retained as the scene-owned correct reaction; delete the duplicated bounce constants and hand-wired handlers.
- [x] **P2.T3: Big & Small onto the board** — covers: FR-3
  - [x] **P2.T3.1: Multi-occupancy adoption** — the two boxes register as `multi` slots; sorted-vs-fit validation stays in the scene (`onDrop` callback → shrink-into-box tween, lid wiggle, box bump on correct; board bounce-home on wrong); placed-correct toys lock (`attachDragLift` skip semantics preserved); delete the duplicated constants and hand-wired handlers.
- [x] **P2.T4: Parity regression suites (red-proofed)** — covers: AC-3, NFR-1
  - [x] **P2.T4.1: Per-scene parity assertions** — extend/keep each adopting scene's suite: wrong answer bounces home at board timings (assert 300/180 and reduced-motion forms), correct answer validates per drop and runs its scene reaction, placed-correct pieces lock, reduced-motion variants assert their shorter forms.
  - [x] **P2.T4.2: Mutation spot-check** — mutate the board's bounce default (e.g. 300 → 3000) and prove at least one parity timing assertion fails, then restore byte-identical; a controlled un-fix rerun may stand in if the mutation target is awkward.
- [x] **P2.T5: Consolidation truth** — covers: AC-1, AC-4, FR-5
  - [x] **P2.T5.1: Grep-level proof** — searching `src/scenes/` for `DragBoard` returns five scenes; no adopting scene hand-wires a placement `drop` state machine; all five per-game drag-flow suites plus `numberOrderScene`/`storyOrderScene` suites pass unchanged.

**Result:** verified
**Checkpoint:** `6187149d`
**Evidence:** conductor/tracks/20261025-drag-board-consolidation/verification/phase-2.md

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/<track-id>/verification/phase-2.md
-->

## Phase 3: Docs truth — TDD and roadmap

- **Goal:** `docs/TDD.md` describes the board's generalized contract and all
  five consuming scenes; `docs/roadmap.md` carries neither the drag-scaffolding
  Known Issue, the drag-board Future-Work item, nor the delivered play-time
  banking bullet.
- **Depends on:** Phase 2
- **Covers:** AC-6
- **Touches:** `docs/TDD.md`, `docs/roadmap.md`
- **Verification:** `pnpm test -- --run && node scripts/validate-docs.js`
- **Status:** in_progress

- [ ] **P3.T1: TDD.md board section** — covers: AC-6
  - [ ] **P3.T1.1: Generalized contract truthfully documented** — the board section names the widened piece contract (Image/Container via the DragTarget set), the `single|multi` slot capacity, and all five consuming scenes; stay engine-accurate (line/behaviour references match shipped code).
- [ ] **P3.T2: roadmap.md refresh** — covers: AC-6
  - [ ] **P3.T2.1: Remove delivered/solved entries** — delete Known Issue "Three games hand-roll their drag scaffolding", Future-Work item 1 (drag-board consolidation), and the delivered "Bank play time as it is earned" bullet (user-approved fold-in); renumber the Future-Work list.
  - [ ] **P3.T2.2: Refresh the review date** — the "checked against the code" line reflects this track's verification date.
- [ ] **P3.T3: Docs gate** — covers: AC-5
  - [ ] **P3.T3.1: Validator green** — `node scripts/validate-docs.js` passes with the updated docs.

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/<track-id>/verification/phase-3.md
-->
