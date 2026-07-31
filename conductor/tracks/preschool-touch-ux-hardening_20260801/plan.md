# Implementation Plan: Preschool Touch UX Hardening

**Track ID:** `preschool-touch-ux-hardening_20260801`

---

## Phase 1: ParentLock Hardening [checkpoint: f4b3138]

- [x] Task: Harden ParentLock reliability and circular progress feedback [TDD] `4878222`
  - [x] **RED:** Add failing tests for duplicate pointer-down prevention, pointer release/pointerout/pointercancel cancellation, callback-once behavior, shutdown cleanup, and progress reset.
  - [x] **GREEN:** Implement active-pointer tracking, guarded 3-second timer behavior, cancellation handling, cleanup, and circular progress feedback.
  - [x] **REFACTOR:** Simplify state transitions and remove duplication without changing behavior.
  - [x] **VERIFY:** Run ParentLock tests and confirm all existing navigation tests still pass.
- [x] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 2: Touch Target Integration [checkpoint: 6fa1abb]

- [x] Task: Expand protected and replay control hit areas [TDD] `074a1bb` (+fix `e678c99`)
  - [x] **RED:** Add failing tests asserting 96×96 logical-pixel hit areas for Hub Settings, all game Back controls, and Musical Memory Replay.
  - [x] **GREEN:** Add inflated interactive bounds while preserving visual positions and existing navigation/gameplay behavior.
  - [x] **REFACTOR:** Consolidate only genuinely shared hit-area logic and preserve scene-local conventions.
  - [x] **VERIFY:** Run affected scene tests and confirm neighboring controls do not overlap.
- [x] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 3: Cross-Scene Regression Verification [checkpoint: a0be9c5]

- [x] Task: Verify consistent touch behavior across the full navigation flow [TDD/Integration] `2500ece`
  - [x] **RED:** Add or extend integration assertions for Settings, every game Back control, and Musical Memory Replay.
  - [x] **GREEN:** Resolve any scene-specific integration failures without changing gameplay rules.
  - [x] **REFACTOR:** Remove test duplication and keep shared assertions readable.
  - [x] **VERIFY:** Confirm cancellation never navigates, completed holds navigate once, and progress indicators are cleaned up on scene shutdown.
- [x] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 4: Quality Gates and Manual Touch Verification

- [x] Task: Complete release verification for this track
  - [x] Run `pnpm test -- --run`.
  - [x] Run `pnpm run test:coverage`.
  - [x] Run `pnpm run check`.
  - [x] Run `pnpm run build`.
  - [x] Verify Settings and every game Back control with a 3-second hold.
  - [x] Verify early release, pointerout, and cancellation do not trigger navigation.
  - [x] Verify Back, Settings, and Replay are usable without precision tapping.
  - [x] Confirm no asset-loading, orientation, audio, or gameplay changes were introduced.
- [~] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Definition of Done

- All approved acceptance criteria pass.
- Every TDD task follows RED → GREEN → REFACTOR → VERIFY.
- Coverage, check, tests, and build pass.
- Manual touch verification is recorded.
- Changes are committed with task summaries and Git notes.
