# Implementation Plan: iPad Black Screen — Orientation Lock Crash

## Phase 1 — TDD Fix: BootScene Orientation Lock Crash

- [x] **Task: Write failing regression test (Red phase)** `3621766`
  - [x] In `src/__tests__/scenes/navigation.test.ts` (BootScene describe block): stub `screen.orientation` with only `unlock` (WebKit partial API — no `lock`), call `scene.create()`, assert `scene.scene.start` called with `"Preload"`
  - [x] Run the new test and confirm it **FAILS** against current code (TypeError aborts `create()` before `start`)

- [x] **Task: Implement minimal guard in BootScene (Green phase)** `24d993e`
  - [x] In `src/scenes/BootScene.ts` `create()`: only invoke `orientation.lock("landscape")` when `screen.orientation` exists and `typeof orientation.lock === "function"`; `this.scene.start("Preload")` always runs
  - [x] Confirm the regression test now passes
  - [x] Confirm existing BootScene tests still pass (transitions, lock attempt, rejection handling, AudioManager init)

- [x] **Task: Run quality gates**
  - [x] `CI=true pnpm test` — full suite green (664/664)
  - [x] `pnpm run check` — Biome lint/format clean (57 files)
  - [x] `pnpm run build` — production build succeeds (PWA generated)

- [~] **Task: Phase Verification & Checkpoint** (Refer to workflow.md)
  - [ ] Present manual iPad verification steps (Safari + Chrome: game boots to Hub, no black screen)
  - [ ] Create checkpoint commit with verification git note
