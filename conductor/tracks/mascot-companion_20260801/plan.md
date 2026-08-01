# Implementation Plan: Mascot Companion

**Track ID:** `mascot-companion_20260801`

---

## Phase 1: Mascot Assets [checkpoint: 51e628f]

- [x] Task: Author mascot SVGs and register in PreloadScene (7e6a531)
  - [ ] Create `src/assets/svg/ui/mascot_idle.svg` (owl professor, 512×512, storybook style, thick `--outline` strokes).
  - [ ] Create `src/assets/svg/ui/mascot_celebrate.svg` (wings-raised pose).
  - [ ] Import and register both textures in `PreloadScene` (rasterized at 512×512 like all SVGs).
  - [ ] VERIFY: `pnpm run build` succeeds; assets appear in the built bundle/precache manifest.
- [x] Task: Phase Verification & Checkpoint (51e628f)

## Phase 2: Mascot Component [checkpoint: 87350f5]

- [x] Task: Build `Mascot` component with wave/cheer/nod/idleLoop [TDD] (5306e7f)
  - [ ] **RED:** Add failing tests: constructor creates idle image at given position/scale; `wave()` rotation yoyo; `cheer()` switches to celebrate pose, bounces, emits self-cleaning sparkle ring; `nod()` gentle rotate yoyo; `idleLoop()` bob + squash-blink; reduced-motion disables idle loop and minimizes amplitudes; `destroy()` cleans up.
  - [ ] **GREEN:** Implement `src/components/Mascot.ts`.
  - [ ] **REFACTOR:** Reuse motion utilities from `cross-cutting-motion_20260801` for durations/amplitudes where available.
  - [ ] **VERIFY:** Run component tests; no particle emitters used.
- [x] Task: Phase Verification & Checkpoint (87350f5)

## Phase 3: Hub Integration

- [ ] Task: Place mascot on Hub; wave on load; cheer on `justEarned` [TDD]
  - [ ] **RED:** Add failing tests: mascot created on Hub create; `wave()` called on load; `cheer()` when scene data contains `justEarned`; graceful behavior when flag absent; destroyed on shutdown.
  - [ ] **GREEN:** Wire mascot into `HubScene` (bottom corner, touch-inert, behind gameplay z-order).
  - [ ] **VERIFY:** Run Hub navigation tests.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 4: Game Integration (all six scenes)

- [ ] Task: Wire mascot reactions into ShapeSorter, AnimalTrace, PopFreeze, ShadowMatch, MusicalMemory, BigSmall [TDD]
  - [ ] **RED:** Add per-scene failing tests: mascot created at corner scale; `cheer()` on correct action; `nod()` on incorrect action; big `cheer()` on win; destroyed on shutdown.
  - [ ] **GREEN:** Integrate `Mascot` into each scene's create/handlers.
  - [ ] **REFACTOR:** Share wiring where scenes share structure; keep per-scene conventions.
  - [ ] **VERIFY:** Run all scene integration suites.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 5: Quality Gates

- [ ] Task: Release verification for this track
  - [ ] Run `pnpm test -- --run`.
  - [ ] Run `pnpm run test:coverage`.
  - [ ] Run `pnpm run check`.
  - [ ] Run `pnpm run build`.
  - [ ] Manual: verify mascot on Hub + all six games, all reactions, idle loop, reduced-motion behavior, offline precache of new assets.
  - [ ] Confirm no gameplay-rule, SFX, or audio changes were introduced.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Definition of Done

- All approved acceptance criteria pass.
- Every TDD task follows RED → GREEN → REFACTOR → VERIFY.
- Coverage, check, tests, and build pass.
- Manual verification recorded.
- Changes committed with task summaries and Git notes.
