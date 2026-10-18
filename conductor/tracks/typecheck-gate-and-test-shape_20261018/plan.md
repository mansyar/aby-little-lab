# Implementation Plan: Typecheck Gate + Test Suite Shape

## Phase 1 — Typed Mock Foundation

- [ ] Task: Add `typecheck` script and record the baseline error inventory
    - [ ] Add `"typecheck": "tsc --noEmit"` to `package.json`
    - [ ] Group the current 116 test-tree errors (+7 helper errors) by class so progress is measurable: callable-mock, invalid-interface-extends, stale fixture shape, stale scene casts, `mockImplementation` access
- [ ] Task: Fix the shared helpers first (they unblock the majority of files)
    - [ ] Make `MockFn` genuinely callable under Vitest 4's `Mock<Procedure | Constructable>`
    - [ ] Convert `MatchMediaStub` from `interface extends MockFn` to a type alias exposing `mockImplementation`
    - [ ] Type `phaserMock` factory captures (`args`, `mockRegistry`, `MockScene` subsystem records) without consumer-side casts
    - [ ] Verify both helper self-suites stay green (`phaserMock.test.ts`, `matchMediaStub.test.ts`)
- [ ] Task: Clear remaining test-file errors by class, assertions untouched
    - [ ] Constructor mocks (`new`-only) in component and settings suites
    - [ ] Stale fixture literals in `storage.test.ts` (complete sticker map, full `Settings`)
    - [ ] `InstallRow` / `ResetModal` deps fixtures missing `overlayObjects` / `onProgressReset`
    - [ ] `HubScene` handler-cast helpers (`MockObj`, `sceneInputHandlers`, `scaleHandlers`)
- [ ] Task: Verify the gate — `tsc --noEmit` exits 0 and the full suite is unchanged (≥1,980 tests)
- [ ] Task: Commit (`chore(test): make the test tree typecheck cleanly with typed mock helpers`)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Split `navigation.test.ts` (5,842 L)

- [ ] Task: Extract a shared hub-scene harness (scene factory, handler accessors, storage seeding) used by all four suites
- [ ] Task: Record the original test/assertion counts as the move baseline
- [ ] Task: Create the four suites, moving test bodies verbatim
    - [ ] `hubNavigation.test.ts` — hub entry, tile taps, paging, swipe, album shelf
    - [ ] `profileSwitching.test.ts` — chip, picker, active-profile changes, per-profile shelf
    - [ ] `settingsWiring.test.ts` — panel open/close, toggles, voices, overlays, reset
    - [ ] `gameLaunch.test.ts` — scene launch, audio unlock, play-time, auto-return
- [ ] Task: Delete `navigation.test.ts` only after the combined assertion count matches the baseline exactly
- [ ] Task: Verify — full suite green, no test file above ~1,600 lines, `typecheck` still clean
- [ ] Task: Commit (`refactor(test): split navigation suite into four focused files`)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Missing Scene Suites

- [ ] Task: `BigSmallScene` suite — round progression, win/lose paths, adaptive band application
- [ ] Task: `ShadowMatchScene` suite — matching taps, wrong-answer feedback, completion reveal
- [ ] Task: `BootScene` suite — `create()` routes to Preload with a fade, first-gesture audio unlock, reduced-motion path
- [ ] Task: Verify — new suites green, coverage thresholds still met
- [ ] Task: Commit (`test(scenes): cover Big Small, Shadow Match and Boot flows`)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — CI Gate, Docs & Final Verification

- [ ] Task: Add the dedicated Typecheck step to `.github/workflows/ci.yml` before the test step
- [ ] Task: Negative verification — inject a type error in `src/` and in a test file, confirm `pnpm typecheck` fails, then revert both
- [ ] Task: Update README development commands with `pnpm typecheck`
- [ ] Task: Update `conductor/tech-stack.md` CI section with the typecheck gate and new suite layout
- [ ] Task: Run all gates: `pnpm run check`, `pnpm typecheck`, `CI=true pnpm test`, `pnpm run build`, `validate-bundle`, `validate-pwa`, `validate-boot`
- [ ] Task: Commit (`chore(ci): add typecheck gate and document suite layout`)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

---

## Progress Notes

- Track created 2026-10-18 from a post-v1.18.0 codebase audit (PR #41 merged).
- Baseline: production `src/` typechecks clean; ~116 errors in `src/__tests__/` + 7 in helpers; suite 1,980 tests across 83 files.
