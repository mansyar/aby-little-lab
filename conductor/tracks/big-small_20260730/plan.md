<protect>
# Implementation Plan: Big vs. Small Cleaner Mini-Game

**Track ID:** `big-small_20260730`

---

## Phase 1: SVG Assets & Preload Pipeline [checkpoint: dd9ed06]

- [x] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [x] Task: Create toy & box SVG assets
    - [x] Create 4 toy SVGs in `src/assets/svg/toys/`: `teddy_bear.svg`, `toy_car.svg`, `toy_ball.svg`, `toy_block.svg` (512×512 viewBox, flat fills, thick #2D3748 outlines 4-6px, soft/vibrant palette, maximally distinct outline shapes)
    - [x] Create 1 toy box SVG: `toy_box.svg` in `src/assets/svg/toys/` (512×512 viewBox, open container style, flat fill, thick #2D3748 outline, storybook style)
    - [x] Create `big-small` sticker SVG in `src/assets/svg/stickers/sticker_big_small.svg`
- [x] Task: Extend PreloadScene to load and rasterize the 4 toy SVGs and 1 toy_box SVG with explicit width/height for high-res rasterization
- [x] Task: Conductor - User Manual Verification 'SVG Assets & Preload Pipeline' (Protocol in workflow.md)

---

## Phase 2: Round Initialization & Match Logic [checkpoint: b7e66a4]

- [x] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [x] Task: Write tests for round initialization and match logic [TDD-Red]
    - [x] Test 3-of-4 toy types are randomly selected from the pool (teddy_bear, toy_car, toy_ball, toy_block)
    - [x] Test each selected toy type gets two scale instances: big (1.5×) and small (0.7×) = 6 toys total
    - [x] Test `scaleCategory` property is assigned correctly ("big" for 1.5×, "small" for 0.7×)
    - [x] Test toy positions are shuffled independently per playthrough (replay variety)
    - [x] Test match detection returns true when `toy.scaleCategory === box.scaleCategory`
    - [x] Test match detection returns false when scale categories differ
    - [x] Test win detection returns true when sorted count reaches 6
    - [x] Test win detection returns false when sorted count is less than 6
- [x] Task: Implement round initialization & match logic in `src/game/bigSmallLogic.ts` (pure functions: toy selection, scale assignment, shuffle, match detection, win detection) [TDD-Green]
- [x] Task: Conductor - User Manual Verification 'Round Initialization & Match Logic' (Protocol in workflow.md)

---

## Phase 3: Drag-and-Drop & Match Interaction [checkpoint: c8760cd]

- [x] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [x] Task: Write tests for drag-and-drop interaction, snap/bounce, and audio [TDD-Red]
    - [x] Test dragging a correct-scale toy into the matching box snaps it into place + correct SFX + particle burst
    - [x] Test dragging a toy into the wrong-scale box triggers bounce-back to origin + incorrect SFX with no penalty (toy remains draggable)
    - [x] Test sorted toys lock in place and are no longer draggable
    - [x] Test touch targets meet ≥64×64px (ideal 96×96px) with inflated hit areas / forgiving snap radius (small toys at 0.7× must still meet minimum)
    - [x] Test AudioManager plays existing correct SFX on match and incorrect SFX on mismatch (respecting SFX toggle)
- [x] Task: Implement drag-and-drop + snap + bounce-back + particle burst in `BigSmallScene` (reuses Shape Sorter's drag/drop pattern; calls existing AudioManager SFX; renders toy_box at two scales) [TDD-Green]
- [x] Task: Conductor - User Manual Verification 'Drag-and-Drop & Match Interaction' (Protocol in workflow.md)

---

## Phase 4: Completion, Sticker Award & Return [checkpoint: 6839ef2]

- [x] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [x] Task: Write tests for completion and sticker flow [TDD-Red]
    - [x] Test completion detected when sorted count reaches 6
    - [x] Test sticker awarded on first completion only (via `storage.earnSticker("big-small")`)
    - [x] Test auto-return to Hub after 3s delay
    - [x] Test parental lock exits early to Hub (already covered by existing game-scene-stubs parameterized test for all 6 scenes)
- [x] Task: Implement completion flow (win animation + sticker award + auto-return) in `BigSmallScene` [TDD-Green]
- [x] Task: Conductor - User Manual Verification 'Completion, Sticker Award & Return' (Protocol in workflow.md)

---

## Phase: Review Fixes

- [ ] Task: Apply review suggestions
</protect>
