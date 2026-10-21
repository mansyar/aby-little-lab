# Drag-Board Shell Unification — Implementation Plan

> **Branch:** `refactor/20261021-drag-board-shell`
> **Base:** `master` @ `6133e71f9e09714a57a9374acb78ba189b6a4a1c`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Extract the shared DragBoard shell

- **Goal:** A new parameterized `DragBoard` component exists with unit tests covering every policy combination, with no game rewired yet (behavior-neutral addition).
- **Depends on:** none
- **Covers:** FR-1, FR-2, AC-1
- **Touches:** `src/game/dragBoard.ts` (new), `src/__tests__/game/dragBoard.test.ts` (new)
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run`
- **Status:** verified
**Result:** verified
**Checkpoint:** d0ef7da
**Evidence:** conductor/tracks/20261021-drag-board-shell/verification/phase-1.md

- [x] **P1.T1: Implement DragBoard shell** — covers: FR-1, FR-2
  - [x] **P1.T1.1: Slot/drop-zone registration and hover detection (`isOverAnyZone` equivalent)**
  - [x] **P1.T1.2: Snap wiring over `dragJuice` (`snapToSlot`), slot↔slot swap, tray↔slot displacement**
  - [x] **P1.T1.3: Tap-vs-drag discrimination (10px threshold) and tap-withdraw policy**
  - [x] **P1.T1.4: Policy parameters — wrong-answer behavior (`bounce-home` vs `retry-in-place`), validation timing (per-drop vs round-full)**
- [x] **P1.T2: Unit tests for all policy combinations** — covers: FR-1, AC-2
  - [x] **P1.T2.1: Bounce-home policy suite**
  - [x] **P1.T2.2: Retry-in-place + tap-withdraw suite**
  - [x] **P1.T2.3: Shutdown-cleanup registration with `GameSceneBase` registry; `prefers-reduced-motion` degradation**

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261021-drag-board-shell/verification/phase-1.md
-->

## Phase 2: Rewire Story Order onto the shell

- **Goal:** `StoryOrderScene` delegates all slot/hover/snap/tap-withdraw logic to `DragBoard`; behavior (retry-in-place, round-full validation, signature guard) unchanged.
- **Depends on:** Phase 1
- **Covers:** FR-1, FR-2, AC-1, AC-2
- **Touches:** `src/scenes/StoryOrderScene.ts`, `src/__tests__/scenes/StoryOrder*.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run` (Story Order suite assertions unchanged except re-wiring)
- **Status:** verified
**Result:** verified
**Checkpoint:** 7996475
**Evidence:** conductor/tracks/20261021-drag-board-shell/verification/phase-2.md

- [x] **P2.T1: Replace Story Order's hand-rolled scaffolding with DragBoard** — covers: FR-2
  - [x] **P2.T1.1: Migrate slot registration, hover, snapping, tap-withdraw; preserve `key|key|key` signature guard**
  - [x] **P2.T1.2: Preserve retry-in-place wiggle + panel-stays-where-placed behavior**
- [x] **P2.T2: Mechanically re-wire Story Order tests to the shell; confirm all assertions pass unchanged** — covers: NFR-2

## Phase 3: Rewire Number Order onto the shell

- **Goal:** `NumberOrderScene` delegates slot/hover/snap logic to `DragBoard`; bounce-home + drop-validation behavior unchanged.
- **Depends on:** Phase 1
- **Covers:** FR-1, FR-2, AC-1, AC-2
- **Touches:** `src/scenes/NumberOrderScene.ts`, `src/__tests__/scenes/NumberOrder*.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run`
- **Status:** verified
**Result:** verified
**Checkpoint:** b93ab74
**Evidence:** conductor/tracks/20261021-drag-board-shell/verification/phase-3.md

- [x] **P3.T1: Replace Number Order's scaffolding with DragBoard** — covers: FR-2
  - [x] **P3.T1.1: Migrate slot registration, hover, snapping; `tryAutoValidate` on drop preserved**
  - [x] **P3.T1.2: Bounce-back-to-source-row wrong-answer behavior preserved**
- [x] **P3.T2: Mechanically re-wire Number Order tests; confirm all assertions pass unchanged** — covers: NFR-2

## Phase 4: Wrong-answer reaction helpers on GameSceneBase

- **Goal:** `GameSceneBase` gains shared reaction helpers (wiggle + nod + gentle `sfx_incorrect` tone) with unit tests; no game migrated yet.
- **Depends on:** none
- **Covers:** FR-3, AC-3
- **Touches:** `src/scenes/GameSceneBase.ts`, `src/__tests__/scenes/GameSceneBase*.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run`
- **Status:** verified
**Result:** verified
**Checkpoint:** fdb6779
**Evidence:** conductor/tracks/20261021-drag-board-shell/verification/phase-4.md

- [x] **P4.T1: Add reaction helpers** — covers: FR-3
  - [x] **P4.T1.1: Wiggle + nod + gentle-tone helper (respects `motion.ts` reduced-motion and no-fail philosophy)**
  - [x] **P4.T1.2: Override path intact — helper is default, `onWrong()` overrides still take precedence**
- [x] **P4.T2: Unit tests for helpers and override precedence** — covers: FR-3, AC-3

## Phase 5: Migrate the 8 direct games to the reaction helpers

- **Goal:** Shape Sorter, Animal Trace, Pop & Freeze, Shadow Match, Musical Memory, Big vs. Small, Memory Match, and Build the Word route their inline wrong-answer reactions through the shared helpers; any game with a materially different sequence keeps its own and the deviation is noted.
- **Depends on:** Phase 4
- **Covers:** FR-3, FR-4, AC-3, AC-4
- **Touches:** `src/scenes/{ShapeSorter,AnimalTrace,PopFreeze,ShadowMatch,MusicalMemory,BigSmall,MemoryMatch,WordBuilder}Scene.ts` + matching test files
- **Verification:** full gate — `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** pending

- [ ] **P5.T1: Migrate the 8 scenes' inline reactions to helpers** — covers: FR-3
  - [ ] **P5.T1.1: One-to-four scenes per sub-step, suite green after each migration**
  - [ ] **P5.T1.2: Note any scene whose sequence differs materially and leave it local**
- [ ] **P5.T2: Confirm no visible behavior change across the 8 games' suites** — covers: NFR-2, AC-4
  - [ ] **P5.T2.1: Full gate green, coverage gate 95/88/85/90 holds, shell bundle ≤ 195.4 kB current size**

<!--
Review fixes are appended by `conductor-review` as:

## Phase R1: Review Fixes

- **Goal:** Resolve review findings ...
- **Depends on:** Phase 5
- **Covers:** review findings
- **Touches:** ...
- **Verification:** ...
- **Status:** pending

- [ ] **R1.T1: Resolve <finding ID>** — covers: <finding ID>
-->
