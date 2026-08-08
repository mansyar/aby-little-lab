# Implementation Plan: Game Scene Scaffold Extraction

**Track ID:** `scene-scaffold_20260808`
**Status:** new

## Phase 1: Base Scaffold (TDD)

- [x] Task: Write failing tests for `src/scenes/GameSceneBase.ts` (Red phase) `adf5d99`
  - [x] Test: `createBackButton()` — creates back text with ParentLock; ParentLock success transitions to Hub
  - [x] Test: `createProgressDots(n)` — creates n dots at top with correct spacing/radius/alpha
  - [x] Test: `fillProgressDot(i)` — fills dot (alpha 1) + pop tween, honors reduced-motion
  - [x] Test: `completeGame(gameId)` — win SFX, mascot cheer, celebration, auto-return after delay
  - [x] Test: `completeGame` sticker path — earns sticker + animation on first completion; skips when already earned
  - [x] Test: shutdown cleanup — destroys parentLock/mascot/speaker on `shutdown`
- [x] Task: Implement `GameSceneBase` (Green phase) — shared state (parentLock, mascot, speaker, audioManager, progressDots, inputLocked) + shared methods + protected constants `adf5d99`
- [x] Task: Run `CI=true pnpm test` to confirm scaffold tests pass; Biome clean `adf5d99`
- [x] Task: Commit `refactor(scenes): Add GameSceneBase shared scaffold` `adf5d99`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [checkpoint: 2dfa520]

## Phase 2: Migrate Speech/Card Family (6 scenes)

- [x] Task: Migrate `AlphabetScene` — extends GameSceneBase; remove duplicated constants/methods (progress dots, win flow, back button, shutdown) `6cef9a8`
  - [x] Verify `alphabetScene.test.ts` still passes unchanged `6cef9a8`
- [x] Task: Migrate `WordMatchScene` — same treatment `6cef9a8`
- [x] Task: Migrate `WordBuilderScene` `6cef9a8`
- [x] Task: Migrate `HowManyScene` `6cef9a8`
- [x] Task: Migrate `FirstSoundsScene` `6cef9a8`
- [x] Task: Migrate `MoreLessScene` `6cef9a8`
- [x] Task: Run full suite `CI=true pnpm test` + `pnpm run check` green `6cef9a8`
- [x] Task: Commit `refactor(scenes): Migrate speech family to GameSceneBase` (one commit per scene or batch, per workflow) `6cef9a8`
- [~] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3: Migrate Drag/Pattern Family (5 scenes)

- [ ] Task: Migrate `ShapeSorterScene` (reset progress dots per playthrough behavior preserved)
- [ ] Task: Migrate `AnimalTraceScene`
- [ ] Task: Migrate `ShadowMatchScene`
- [ ] Task: Migrate `BigSmallScene`
- [ ] Task: Migrate `PatternBuilderScene`
- [ ] Task: Run full suite `CI=true pnpm test` + `pnpm run check` green
- [ ] Task: Commit `refactor(scenes): Migrate drag/pattern family to GameSceneBase`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4: Migrate Odd Scenes + Integration

- [ ] Task: Migrate `PopFreezeScene` (no progress dots — base methods used without dots)
- [ ] Task: Migrate `MusicalMemoryScene` (5 progress dots, dot count parameterized)
- [ ] Task: Verify `navigation.test.ts` + all 13 scene tests green
- [ ] Task: Commit `refactor(scenes): Migrate PopFreeze and MusicalMemory to GameSceneBase`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5: Docs, Quality Gates, Completion

- [ ] Task: Update `conductor/tech-stack.md` — document GameSceneBase scaffold architecture (dated note)
- [ ] Task: Run final gates: `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`
- [ ] Task: Commit `docs(conductor): Document scene scaffold architecture`
- [ ] Task: Final checkpoint + git note with verification report
