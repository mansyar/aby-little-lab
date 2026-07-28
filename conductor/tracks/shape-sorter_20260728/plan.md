<protect>
# Implementation Plan: Shape Sorter Mini-Game

**Track ID:** `shape-sorter_20260728`

---

## Phase 1: SVG Assets & Preload Pipeline

- [x] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [x] Task: Create shape and sticker SVG assets 7f8d4bb
    - [x] Create 4 full-color shape SVGs (`shape_circle.svg`, `shape_square.svg`, `shape_triangle.svg`, `shape_star.svg`) at 512×512 viewBox, flat fills, 4-6px `#2D3748` stroke, distinct soft/vibrant non-primary colors
    - [x] Create 4 cutout slot SVGs (same paths, 30% opacity fill + dashed `#2D3748` stroke)
    - [x] Create `shape-sorter` sticker SVG in `src/assets/svg/stickers/`
- [x] Task: Extend PreloadScene to load all 8 shape SVGs with explicit width/height for high-res rasterization e33cffe
- [x] Task: Conductor - User Manual Verification 'SVG Assets & Preload Pipeline' (Protocol in workflow.md)

[checkpoint: b6d9bfd]

---

## Phase 2: Synthesized Gameplay SFX

- [x] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [x] Task: Write tests for synthesized gameplay SFX e591bf6
    - [x] Test `playCorrect` plays an ascending chime
    - [x] Test `playIncorrect` plays a soft descending tone
    - [x] Test `playWin` plays a celebratory tone
    - [x] Test `playSticker` plays a sparkle tone
    - [x] Test SFX toggle respected (no sound when `sfxEnabled` is false)
- [x] Task: Implement synthesized SFX methods in AudioManager (Web Audio API) e591bf6
- [x] Task: Conductor - User Manual Verification 'Synthesized Gameplay SFX' (Protocol in workflow.md)

[checkpoint: 38ae02f]

---

## Phase 3: Round Initialization & Match Logic

- [x] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [x] Task: Write tests for round initialization and match logic a055f8c
    - [x] Test 3 of 4 shapes are randomly selected per round
    - [x] Test slot positions and shape positions are shuffled independently
    - [x] Test match detection (shape type matches slot type)
- [x] Task: Implement round initialization & match logic in ShapeSorterScene 1cf79cc
- [~] Task: Conductor - User Manual Verification 'Round Initialization & Match Logic' (Protocol in workflow.md)

---

## Phase 4: Drag, Drop & Feedback

- [ ] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [ ] Task: Write tests for drag/drop and feedback behavior
    - [ ] Test correct drop snaps shape to slot center, marks non-interactive, triggers correct SFX + particles
    - [ ] Test incorrect drop bounces shape back to origin with wobble (no penalty)
    - [ ] Test touch targets meet 64×64px minimum
- [ ] Task: Implement drag/drop interaction + particle burst + bounce-back in ShapeSorterScene
- [ ] Task: Conductor - User Manual Verification 'Drag, Drop & Feedback' (Protocol in workflow.md)

---

## Phase 5: Completion, Sticker Award & Return

- [ ] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [ ] Task: Write tests for completion and sticker flow
    - [ ] Test completion detected when all 3 shapes are placed
    - [ ] Test sticker awarded on first completion only (via `storage.earnSticker`)
    - [ ] Test auto-return to Hub after 3s delay
    - [ ] Test parental lock exits early to Hub
- [ ] Task: Implement completion flow (win animation + sticker award + auto-return) in ShapeSorterScene
- [ ] Task: Conductor - User Manual Verification 'Completion, Sticker Award & Return' (Protocol in workflow.md)
</protect>
