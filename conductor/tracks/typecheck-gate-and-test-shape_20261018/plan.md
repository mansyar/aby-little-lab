# Implementation Plan: Typecheck Gate + Test Suite Shape

## Phase 1 — Typed Mock Foundation

- [x] Task: Add `typecheck` script and record the baseline error inventory
    - [x] Add `"typecheck": "tsc --noEmit"` to `package.json`
    - [x] Group the current 116 test-tree errors (+7 helper errors) by class so progress is measurable: callable-mock, invalid-interface-extends, stale fixture shape, stale scene casts, `mockImplementation` access
- [x] Task: Fix the shared helpers first (they unblock the majority of files)
    - [x] Make `MockFn` genuinely callable under Vitest 4's `Mock<Procedure | Constructable>` — `ReturnType<typeof vi.fn>` instantiates the generic with its full constraint; spelling the signature out (`ReturnType<typeof vi.fn<(...args: any[]) => any>>`, one documented `biome-ignore`, mirrors Vitest's own `Procedure`) fixed ~70 errors at a stroke
    - [x] Convert `MatchMediaStub` from `interface extends MockFn` to a type alias exposing `setReducedMotion`, built with `Object.assign` instead of a cast
    - [x] Type `phaserMock` factory captures (`on` handler param is now `MockFn`) and give `MockScene.scale` an explicit shape instead of a `Record<… | number>` intersection
    - [x] Verify both helper self-suites stay green (`phaserMock.test.ts`, `matchMediaStub.test.ts`)
- [x] Task: Clear remaining test-file errors by class, assertions untouched
    - [x] `hubScene.test.ts` — drop its stale local `MockFn`, `MockObj` → `MockObject`, and read handler capture maps through `sceneInputHandlers()` / `scaleHandlers()` accessors instead of unsatisfiable `HubScene & { … }` intersections
    - [x] `PwaToasts.test.ts` — type the `PwaToast` constructor mock's params and read call args through a `toastOptions(index)` guard instead of indexing an untyped tuple
    - [x] `ProfileChip.test.ts` — fixtures passed `"Second"` (a profile *name*) where an `AvatarId` belongs; now `addProfile("dog")`
    - [x] `InstallRow.test.ts` — two deps objects missing `overlayObjects`
    - [x] `phaserMock.test.ts` — registry fixture typed `MockObject[]`; `storage.test.ts` — fixtures now spread `createDefaultStickers()` / `getSettings()` instead of hand-listing subsets
    - [x] `InstallRow` / `ResetModal` deps fixtures missing `overlayObjects` / `onProgressReset`
- [x] Task: Verify the gate — `tsc --noEmit` exits 0 and the full suite is unchanged (1,980 tests, 83 files)
- [x] Task: Commit (`chore(test): make the test tree typecheck cleanly with typed mock helpers`; commit 2617e29)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) (checkpoint: 230daa5)

## Phase 2 — Split `navigation.test.ts` (5,842 L)

- [x] Task: Extract a shared hub-scene harness (scene factory, handler accessors, storage seeding) used by all four suites (note: final shape approved by user was "co-locate + shared harness": `src/__tests__/helpers/sceneFlowHarness.ts` holds the 11 audio spies, speech/PWA-bridge/settings-panel/PWA-toast doubles, storage spies with `restoreStorageSpies()`, and all 24 object/tween/touch-target helpers moved verbatim; scene-registry tables live separately in `src/__tests__/helpers/gameScenes.ts` because importing scenes from a module loaded inside `vi.mock` factories deadlocks the mock graph)
- [x] Task: Record the original test/assertion counts as the move baseline (353 tests / 701 `expect(` calls)
- [x] Task: Create the focused suites, moving test bodies verbatim (12 files: hub integration split into `navigation.test.ts` 773 L, `hubEngagement.test.ts` 868 L, `hubPlayTime.test.ts` 412 L, plus `bootScene.test.ts` 240 L and `sceneLifecycle.test.ts` 908 L; each game's flow describes co-located with its scene suite — `shapeSorterFlow` 703, `animalTraceFlow` 720, `popFreezeFlow` 697, `shadowMatchScene` 740, `musicalMemoryFlow` 943, `patternBuilderFlow` 444, `bigSmallScene` 826 L. Largest file 943 L vs 7,013 L before)
- [x] Task: Delete `navigation.test.ts` only after the combined assertion count matches the baseline exactly (701 = 701, and 353 = 353 tests)
- [x] Task: Verify — full suite green, no test file above ~1,600 lines, `typecheck` still clean (94 files / 1,980 tests; `tsc --noEmit` exit 0; `biome check` clean bar the pre-existing musicalMemory warning)
- [x] Task: Commit (`refactor(test): split navigation suite into focused scene-flow files`)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) (checkpoint: 71f2da5)

## Phase 3 — Missing Scene Suites

- [ ] Task: `BigSmallScene` suite — round progression, win/lose paths, adaptive band application
- [ ] Task: `ShadowMatchScene` suite — matching taps, wrong-answer feedback, completion reveal
- [ ] Task: `BootScene` suite — `create()` routes to Preload with a fade, first-gesture audio unlock, reduced-motion path
- [x] Task: Verify — new suites green, coverage thresholds still met (BigSmallScene + ShadowMatchScene 100%/100%/100%, BootScene 100%; full suite 94 files / 1,982 tests; 	sc clean; iome check clean bar the pre-existing warning)
- [ ] Task: Commit (`test(scenes): cover Big Small, Shadow Match and Boot flows`)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

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
