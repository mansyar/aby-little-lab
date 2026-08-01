# Implementation Plan: Per-Game Juice

**Track ID:** `per-game-juice_20260801`

---

## Phase 1: Drag Lift and Snap (ShapeSorter, ShadowMatch, BigSmall)

- [x] Task: Drag lift, drop-zone highlight, and snap-to-slot tween [TDD] `05de0d4`
  - [x] **RED:** Add failing tests: scale/tilt on drag start and restore on drop; drop-zone highlight on dragover; snap tween (200ms `Back.out`) replacing instant `setPosition`; reduced-motion amplitudes; incorrect bounce-back preserved.
  - [x] **GREEN:** Implement shared drag-juice helper (or per-scene where conventions differ) in the three drag scenes.
  - [x] **REFACTOR:** Keep match detection and win logic untouched; share only genuinely identical behavior.
  - [x] **VERIFY:** Run all three logic suites plus scene integration tests.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 2: BigSmall Box Reaction

- [ ] Task: Toy drop-in shrink and box lid wiggle [TDD]
  - [ ] **RED:** Add failing tests: 150ms shrink-drop tween on correct drop, box rotation wiggle ±3° yoyo, box scale bump 1.05, splash still created.
  - [ ] **GREEN:** Implement in `BigSmallScene`.
  - [ ] **VERIFY:** Run BigSmall logic + scene tests.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 3: ShadowMatch Reveal

- [ ] Task: Shadow stamp flash and matched-object dim [TDD]
  - [ ] **RED:** Add failing tests: slot scale 1.1 yoyo + fill flash on match, matched object alpha reduced, splash still created.
  - [ ] **GREEN:** Implement in `ShadowMatchScene`.
  - [ ] **VERIFY:** Run ShadowMatch logic + scene tests.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 4: AnimalTrace Movement

- [ ] Task: Animal hops, food wiggle, progress-dot pop [TDD]
  - [ ] **RED:** Add failing tests: hop arc tween per waypoint advance, food wiggle on arrival, progress dots pop (scale 1 → 1.4 → 1 `Back.out`) instead of alpha-only.
  - [ ] **GREEN:** Implement in `AnimalTraceScene`.
  - [ ] **VERIFY:** Run AnimalTrace logic + scene tests.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 5: PopFreeze Reactions

- [ ] Task: Pop droplets and breathing decoys [TDD]
  - [ ] **RED:** Add failing tests: 3–4 droplet circles from pop point (Graphics, self-cleaning, ~300ms); sleeping animals breathing loop 1.0 → 1.03 yoyo; reduced-motion disables breathing.
  - [ ] **GREEN:** Implement in `PopFreezeScene`.
  - [ ] **VERIFY:** Run PopFreeze logic + scene tests.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 6: MusicalMemory Reactions

- [ ] Task: Ripple rings, lily pad drift, progress-dot pop [TDD]
  - [ ] **RED:** Add failing tests: expanding ripple ring on frog tap (Graphics, 400ms, alpha fade, self-cleaning); lily pad drift loop; progress dots pop on fill; reduced-motion disables drift.
  - [ ] **GREEN:** Implement in `MusicalMemoryScene`.
  - [ ] **VERIFY:** Run MusicalMemory logic + scene tests.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 7: Quality Gates

- [ ] Task: Release verification for this track
  - [ ] Run `pnpm test -- --run`.
  - [ ] Run `pnpm run test:coverage`.
  - [ ] Run `pnpm run check`.
  - [ ] Run `pnpm run build`.
  - [ ] Manual: play each game once and verify all listed reactions, effect cleanup, and reduced-motion behavior.
  - [ ] Confirm no logic-file changes and no new assets/audio.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Definition of Done

- All approved acceptance criteria pass.
- Every TDD task follows RED → GREEN → REFACTOR → VERIFY.
- Coverage, check, tests, and build pass.
- Manual verification recorded.
- Changes committed with task summaries and Git notes.
