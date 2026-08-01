# Implementation Plan: Hub Engagement

**Track ID:** `hub-engagement_20260801`

---

## Phase 1: Entrance and Idle Life [checkpoint: 99f3af1]

- [x] Task: Staggered entrance, tile bobbing, and background decorations [TDD] `c6f035a`
  - [x] **RED:** Add failing tests asserting staggered entrance tweens (delayed per-element, 300ms each), phase-offset bob loops on tiles, drifting background shapes, and static behavior under reduced-motion.
  - [x] **GREEN:** Implement entrance stagger, bob loops, and decorative layer in `HubScene`.
  - [x] **REFACTOR:** Keep decorations minimal and low-contrast; no speculative extras.
  - [x] **VERIFY:** Run Hub navigation tests; confirm scene still starts games correctly.

> **Deviation note (2026-08-01):** Manual verification surfaced a pre-existing runtime crash in `sceneTransitions.ts` (`Camera.zoomTo(1, duration, "Sine.out")` — camera Zoom effects resolve ease strings against their own EaseMap, where `"Sine.out"` is not a key, so `this.ease` stayed undefined and every scene entrance threw `TypeError: this.ease is not a function`). Fixed by passing the canonical EaseMap key `"Sine"` (→ `Sine.Out`), with regression test updated. Commit `48d9067`.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 2: Tile Press Feedback [checkpoint: 25a7eae]

- [x] Task: Add press feedback to Hub tiles [TDD] `13a2013`
  - [x] **RED:** Add failing tests: scale 0.95 on `pointerdown`, spring-back on `pointerup`/`pointerout`, no-op under reduced-motion.
  - [x] **GREEN:** Implement press feedback on tiles without changing navigation behavior.
  - [x] **REFACTOR:** Reuse the shared press-feedback helper if available from `cross-cutting-motion_20260801`; otherwise implement locally.
  - [x] **VERIFY:** Run navigation tests; confirm tile taps still start games.

> **Deviation note (2026-08-01):** User feedback during Phase 2 manual verification — tiles started the game on `pointerdown`, so the press squish was never visible (the scene faded out instantly). Per user decision, tiles now navigate on `pointerup` (release on the tile), so holding shows the squish and spring-back; `pointerout`/`pointercancel` before release cancel navigation. Regression tests updated + new cancel tests. Commit `295cffe`.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 3: Sticker Shelf [checkpoint: 5160877]

- [x] Task: Real sticker thumbnails with earned/unearned states and just-earned highlight [TDD] `e98bf59`
  - [x] **RED:** Add failing tests: one thumbnail per game using sticker textures, earned full alpha + sparkle loop, unearned dimmed, larger bounce + sparkle burst for the `justEarned` id passed via scene-start data.
  - [x] **GREEN:** Implement shelf in `HubScene`; update all six game scenes to pass `{ justEarned: gameId }` on auto-return when a sticker was earned that session.
  - [x] **REFACTOR:** Centralize shelf construction; keep unearned presentation consistent.
  - [x] **VERIFY:** Run sticker-award integration tests across all games; confirm shelf states render correctly.

> **Deviation note (2026-08-01):** User feedback during Phase 3 manual verification — sticker thumbnails rendered at full 512px texture size and filled the screen. Root cause: `setDisplaySize(56, 56)` was overridden by entrance/burst tweens tweening `scaleX/scaleY` to absolute values (1 / 0.85 / 1.15 / 1.25). Fixed by tweening to shelf-relative scales (`STICKER_SCALE = 56 / 512`, matching the existing game-scene pattern) and giving `animateEntrance` an optional `targetScale`. Regression tests assert final scales with `toBeCloseTo`. Commit `c2c9103`.
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
