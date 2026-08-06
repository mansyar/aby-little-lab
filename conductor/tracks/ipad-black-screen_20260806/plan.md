# Implementation Plan: iPad Black Screen — Orientation Lock Crash

## Phase 1 — TDD Fix: BootScene Orientation Lock Crash

- [ ] **Task: Write failing regression test (Red phase)**
  - [ ] In `src/__tests__/scenes/navigation.test.ts` (BootScene describe block): stub `screen.orientation` with only `unlock` (WebKit partial API — no `lock`), call `scene.create()`, assert `scene.scene.start` called with `"Preload"`
  - [ ] Run the new test and confirm it **FAILS** against current code (TypeError aborts `create()` before `start`)

- [ ] **Task: Implement minimal guard in BootScene (Green phase)**
  - [ ] In `src/scenes/BootScene.ts` `create()`: only invoke `orientation.lock("landscape")` when `screen.orientation` exists and `typeof orientation.lock === "function"`; `this.scene.start("Preload")` always runs
  - [ ] Confirm the regression test now passes
  - [ ] Confirm existing BootScene tests still pass (transitions, lock attempt, rejection handling, AudioManager init)

- [ ] **Task: Run quality gates**
  - [ ] `CI=true pnpm test` — full suite green
  - [ ] `pnpm run check` — Biome lint/format clean
  - [ ] `pnpm run build` — production build succeeds

- [ ] **Task: Phase Verification & Checkpoint** (Refer to workflow.md)
  - [ ] Present manual iPad verification steps (Safari + Chrome: game boots to Hub, no black screen)
  - [ ] Create checkpoint commit with verification git note
