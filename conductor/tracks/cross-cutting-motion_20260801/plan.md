# Implementation Plan: Cross-Cutting Motion

**Track ID:** `cross-cutting-motion_20260801`

---

## Phase 1: Motion Utility [checkpoint: d6ec620]

- [x] Task: Create reduced-motion-aware motion utility [TDD] `4319da7`
  - [x] **RED:** Add failing tests for `isReducedMotion()` (matchMedia mock, absence fallback), `motionDuration(normal, reduced)`, and `motionScale(normal, reduced)`.
  - [x] **GREEN:** Implement `src/utils/motion.ts`; refactor `src/utils/completionEffect.ts` to consume it with behavior unchanged.
  - [x] **REFACTOR:** Keep the utility minimal — no speculative helpers beyond duration/scale/reduced-motion.
  - [x] **VERIFY:** Run completion-effect and navigation tests; confirm behavior unchanged.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 2: Scene Transitions [checkpoint: f103a67]

- [x] Task: Create transition utility and wire into all scene starts [TDD] `a02c441`
  - [x] **RED:** Add failing tests asserting fade + zoom tween configs, reduced-motion fade-only variant, and cleanup (no leftover overlays after completion).
  - [x] **GREEN:** Implement `src/utils/sceneTransitions.ts`; replace `scene.start` in Hub tile taps, all six game Back controls, all six auto-return delayed calls, and Preload→Hub.
  - [x] **REFACTOR:** Extract one shared transition call site per scene; keep Boot→Preload instant.
  - [x] **VERIFY:** Run navigation integration tests; confirm every navigation path is covered and no instant cut remains.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 3: Choreographed Win Celebration [checkpoint: 19aa535]

- [x] Task: Build `createWinCelebration` (star-burst + confetti) [TDD] `b92ee06`
  - [x] **RED:** Add failing tests: Graphics-based rays + drifting confetti bits, bounded self-cleaning (destroy on complete), no `add.particles` usage, reduced-motion variant.
  - [x] **GREEN:** Implement celebration in `src/utils/completionEffect.ts` (or sibling module); wire into all six `handleComplete` flows, replacing the uniform scale-yoyo while preserving sticker reveal.
  - [x] **REFACTOR:** Share one implementation across scenes; remove per-scene duplicated win tween blocks.
  - [x] **VERIFY:** Run all scene completion tests and the full suite.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 4: Press Feedback [checkpoint: 7284cc4]

- [x] Task: Add press-feedback helper and apply to controls [TDD] `8efde26`
  - [x] **RED:** Add failing tests: scale 0.95 on `pointerdown`, restore on `pointerup`/`pointerout`/`pointercancel`, no-op under reduced-motion.
  - [x] **GREEN:** Implement helper; apply to six game Back controls, Musical Memory Replay, and Hub Settings.
  - [x] **REFACTOR:** Reuse the helper everywhere; preserve 96×96 hit areas.
  - [x] **VERIFY:** Run hit-area and navigation tests; confirm controls still work.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 5: Quality Gates [checkpoint: deafc2d]

- [x] Task: Release verification for this track
  - [x] Run `pnpm vitest run` (the project's test script `vitest` runs in watch mode; `pnpm vitest run` is the non-watch equivalent of `pnpm test -- --run`). 15 files, 412 tests pass.
  - [x] Run `pnpm run test:coverage`. All files: 97.45% stmts, 88.58% branch, 97.16% funcs, 98.09% lines — above the 80% thresholds; new utilities (motion, sceneTransitions, completionEffect, pressFeedback) at 100%.
  - [x] Run `pnpm run check`. Biome clean (44 files, no fixes).
  - [x] Run `pnpm run build`. Vite build succeeds (pre-existing >500 kB chunk warning only).
  - [ ] Manual: verify transitions on every navigation path, celebration in all six games, press feedback on Back/Replay/Settings, and reduced-motion behavior. (Pending — to be performed by a human reviewer via `pnpm dev`; recorded per phase in git notes.)
  - [x] Confirm no gameplay-rule, asset, or audio changes were introduced. Only scene wiring, effect/utility code, and tests changed.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Definition of Done

- All approved acceptance criteria pass.
- Every TDD task follows RED → GREEN → REFACTOR → VERIFY.
- Coverage, check, tests, and build pass.
- Manual verification recorded.
- Changes committed with task summaries and Git notes.
