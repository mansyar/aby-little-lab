<protect>
# Implementation Plan: Pop & Freeze! Mini-Game

**Track ID:** `pop-freeze_20260729`

---

## Phase 1: SVG Assets & Preload Pipeline [checkpoint: cfa3184]

- [x] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [x] Task: Create bubble & sticker SVG assets [c6cc947]
    - [x] Create 1 bubble SVG (`bubble.svg`) at 512×512 viewBox, translucent round bubble with highlight, storybook style
    - [x] Create `pop-freeze` sticker SVG in `src/assets/svg/stickers/`
    - [x] Verify existing 4 animal SVGs (`monkey.svg`, `rabbit.svg`, `cat.svg`, `dog.svg`) are reused as sleeping-animal content (no new animal art)
- [x] Task: Extend PreloadScene to load the new bubble SVG with explicit width/height for high-res rasterization (animals already loaded by animal-trace track) [c7926ef]
- [x] Task: Conductor - User Manual Verification 'SVG Assets & Preload Pipeline' (Protocol in workflow.md)

---

## Phase 2: Round Initialization & Bubble Logic [checkpoint: 42a84b4]

- [x] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [x] Task: Write tests for round initialization and bubble logic [TDD-Red] [ff91b8f]
    - [x] Test pop count initializes to 0 and win target is 6
    - [x] Test spawn scheduling selects bubble type (poppable vs sleeping) maintaining the concurrent on-screen mix
    - [x] Test spawn config generation randomizes position & velocity (within world bounds)
    - [x] Test pop registration increments count and returns win status when target (6) reached
    - [x] Test wake registration does not change pop count (no penalty)
- [x] Task: Implement round initialization & bubble logic in `src/game/popFreezeLogic.ts` (pure functions: spawn scheduling/type selection, spawn config generation, pop counting, win detection) [TDD-Green] [755f050]
- [x] Task: Conductor - User Manual Verification 'Round Initialization & Bubble Logic' (Protocol in workflow.md)

---

## Phase 3: Floating Bubbles & Tap Interaction [checkpoint: 7dce3eb]

- [x] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [x] Task: Write tests for floating bubble motion, tap interaction, and audio [TDD-Red] [6cb5e0e]
    - [x] Test bubbles float via Arcade Physics with random velocity and bounce off world bounds (stay on-screen)
    - [x] Test tapping a poppable bubble triggers pop animation + pop SFX + particle burst + increments count
    - [x] Test tapping a sleeping-animal bubble triggers wake SFX + brief wake animation with no penalty (count unchanged, bubble remains)
    - [x] Test poppable bubble respawn maintains concurrent count until win target reached
    - [x] Test touch targets meet ≥64×64px (ideal 96×96px) with inflated hit areas
    - [x] Test AudioManager plays synthesized pop SFX on pop and wake SFX on wake (respecting SFX toggle)
- [x] Task: Extend AudioManager with synthesized pop & wake SFX via Web Audio API (pop = short percussive blip, wake = soft rousing tone) [TDD-Green] [b5062d0]
- [x] Task: Implement floating bubble spawning (Arcade Physics + world-bounds bounce) + tap-to-pop + wake feedback + particle burst in `PopFreezeScene` [TDD-Green] [b5062d0]
- [x] Task: Conductor - User Manual Verification 'Floating Bubbles & Tap Interaction' (Protocol in workflow.md)

---

## Phase 4: Completion, Sticker Award & Return [checkpoint: b07dede]

- [x] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [x] Task: Write tests for completion and sticker flow [TDD-Red] [e17bab8]
    - [x] Test completion detected when pop count reaches 6
    - [x] Test sticker awarded on first completion only (via `storage.earnSticker("pop-freeze")`)
    - [x] Test auto-return to Hub after 3s delay
    - [x] Test parental lock exits early to Hub (already covered by existing game-scene-stubs parameterized test for all 6 scenes)
- [x] Task: Implement completion flow (stop spawning + win animation + sticker award + auto-return) in `PopFreezeScene` [TDD-Green] [abb41d1]
- [x] Task: Conductor - User Manual Verification 'Completion, Sticker Award & Return' (Protocol in workflow.md)

---

## Phase: Review Fixes
- [x] Task: Apply review suggestions [a7936dc]
</protect>
