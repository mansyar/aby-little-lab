# Implementation Plan: Hub Engagement

**Track ID:** `hub-engagement_20260801`

---

## Phase 1: Entrance and Idle Life

- [x] Task: Staggered entrance, tile bobbing, and background decorations [TDD] `c6f035a`
  - [x] **RED:** Add failing tests asserting staggered entrance tweens (delayed per-element, 300ms each), phase-offset bob loops on tiles, drifting background shapes, and static behavior under reduced-motion.
  - [x] **GREEN:** Implement entrance stagger, bob loops, and decorative layer in `HubScene`.
  - [x] **REFACTOR:** Keep decorations minimal and low-contrast; no speculative extras.
  - [x] **VERIFY:** Run Hub navigation tests; confirm scene still starts games correctly.

> **Deviation note (2026-08-01):** Manual verification surfaced a pre-existing runtime crash in `sceneTransitions.ts` (`Camera.zoomTo(1, duration, "Sine.out")` — camera Zoom effects resolve ease strings against their own EaseMap, where `"Sine.out"` is not a key, so `this.ease` stayed undefined and every scene entrance threw `TypeError: this.ease is not a function`). Fixed by passing the canonical EaseMap key `"Sine"` (→ `Sine.Out`), with regression test updated. Commit `48d9067`.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 2: Tile Press Feedback

- [ ] Task: Add press feedback to Hub tiles [TDD]
  - [ ] **RED:** Add failing tests: scale 0.95 on `pointerdown`, spring-back on `pointerup`/`pointerout`, no-op under reduced-motion.
  - [ ] **GREEN:** Implement press feedback on tiles without changing navigation behavior.
  - [ ] **REFACTOR:** Reuse the shared press-feedback helper if available from `cross-cutting-motion_20260801`; otherwise implement locally.
  - [ ] **VERIFY:** Run navigation tests; confirm tile taps still start games.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 3: Sticker Shelf

- [ ] Task: Real sticker thumbnails with earned/unearned states and just-earned highlight [TDD]
  - [ ] **RED:** Add failing tests: one thumbnail per game using sticker textures, earned full alpha + sparkle loop, unearned dimmed, larger bounce + sparkle burst for the `justEarned` id passed via scene-start data.
  - [ ] **GREEN:** Implement shelf in `HubScene`; update all six game scenes to pass `{ justEarned: gameId }` on auto-return when a sticker was earned that session.
  - [ ] **REFACTOR:** Centralize shelf construction; keep unearned presentation consistent.
  - [ ] **VERIFY:** Run sticker-award integration tests across all games; confirm shelf states render correctly.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 4: Idle Attract

- [ ] Task: Idle timer, wiggle cue, and `playIdleCall` SFX [TDD]
  - [ ] **RED:** Add failing AudioManager tests for `playIdleCall()` (gentle two-tone synthesis, respects SFX toggle); add Hub tests: fires ~25s after last input, repeats every ~10s, resets on pointer input, clears on shutdown, reduced-motion disables wiggle.
  - [ ] **GREEN:** Implement `AudioManager.playIdleCall()` and the Hub idle-attract timer + wiggle animation.
  - [ ] **REFACTOR:** Ensure single timer lifecycle; no duplicate listeners.
  - [ ] **VERIFY:** Run AudioManager and Hub navigation tests; confirm no interference with ParentLock.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 5: Quality Gates

- [ ] Task: Release verification for this track
  - [ ] Run `pnpm test -- --run`.
  - [ ] Run `pnpm run test:coverage`.
  - [ ] Run `pnpm run check`.
  - [ ] Run `pnpm run build`.
  - [ ] Manual: verify entrance stagger, idle float, tile press, sticker shelf states, just-earned highlight, and idle attract (~25s) on a touch-sized landscape viewport.
  - [ ] Confirm no gameplay-rule, asset, or orientation changes were introduced.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Definition of Done

- All approved acceptance criteria pass.
- Every TDD task follows RED → GREEN → REFACTOR → VERIFY.
- Coverage, check, tests, and build pass.
- Manual verification recorded.
- Changes committed with task summaries and Git notes.
