<protect>
# Implementation Plan: Shadow Match Mini-Game

**Track ID:** `shadow-match_20260729`

---

## Phase 1: SVG Assets & Preload Pipeline

- [x] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [x] Task: Create object & shadow silhouette SVG assets
    - [x] Create 6 object SVGs in `src/assets/svg/items/`: `house.svg`, `tree.svg`, `car.svg`, `boat.svg`, `ball.svg`, `umbrella.svg` (512×512 viewBox, flat fills, thick #2D3748 outlines 4-6px, soft/vibrant palette, maximally distinct outline shapes)
    - [x] Create 6 shadow silhouette SVGs in `src/assets/svg/shadows/`: `shadow_house.svg`, `shadow_tree.svg`, `shadow_car.svg`, `shadow_boat.svg`, `shadow_ball.svg`, `shadow_umbrella.svg` (derived: duplicate paths, union fills, set #2D3748)
    - [x] Create `shadow-match` sticker SVG in `src/assets/svg/stickers/sticker_shadow_match.svg`
- [x] Task: Extend PreloadScene to load and rasterize the 6 object SVGs and 6 shadow SVGs with explicit width/height for high-res rasterization [6311857]
- [x] Task: Conductor - User Manual Verification 'SVG Assets & Preload Pipeline' (Protocol in workflow.md)

---

## Phase 2: Round Initialization & Match Logic

- [ ] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [ ] Task: Write tests for round initialization and match logic [TDD-Red]
    - [ ] Test 6 object-silhouette pairs are generated with correct object IDs (house, tree, car, boat, ball, umbrella)
    - [ ] Test shuffle randomizes object positions and shadow positions independently (replay variety)
    - [ ] Test match detection returns true when object and shadow share the same underlying object ID
    - [ ] Test match detection returns false when object and shadow differ
    - [ ] Test win detection returns true when matched count reaches 6
    - [ ] Test win detection returns false when matched count is less than 6
- [ ] Task: Implement round initialization & match logic in `src/game/shadowMatchLogic.ts` (pure functions: pair generation, independent shuffle, match detection, win detection) [TDD-Green]
- [ ] Task: Conductor - User Manual Verification 'Round Initialization & Match Logic' (Protocol in workflow.md)

---

## Phase 3: Drag-and-Drop & Match Interaction

- [ ] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [ ] Task: Write tests for drag-and-drop interaction, snap/bounce, and audio [TDD-Red]
    - [ ] Test dragging a correct object onto its matching silhouette snaps it into place + correct SFX + particle burst
    - [ ] Test dragging an object onto a wrong silhouette triggers bounce-back to origin + incorrect SFX with no penalty (object remains draggable)
    - [ ] Test matched objects lock in place and are no longer draggable
    - [ ] Test touch targets meet ≥64×64px (ideal 96×96px) with inflated hit areas / forgiving snap radius
    - [ ] Test AudioManager plays existing correct SFX on match and incorrect SFX on mismatch (respecting SFX toggle)
- [ ] Task: Implement drag-and-drop + snap + bounce-back + particle burst in `ShadowMatchScene` (reuses Shape Sorter's drag/drop pattern; calls existing AudioManager SFX) [TDD-Green]
- [ ] Task: Conductor - User Manual Verification 'Drag-and-Drop & Match Interaction' (Protocol in workflow.md)

---

## Phase 4: Completion, Sticker Award & Return

- [ ] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [ ] Task: Write tests for completion and sticker flow [TDD-Red]
    - [ ] Test completion detected when matched count reaches 6
    - [ ] Test sticker awarded on first completion only (via `storage.earnSticker("shadow-match")`)
    - [ ] Test auto-return to Hub after 3s delay
    - [ ] Test parental lock exits early to Hub (already covered by existing game-scene-stubs parameterized test for all 6 scenes)
- [ ] Task: Implement completion flow (win animation + sticker award + auto-return) in `ShadowMatchScene` [TDD-Green]
- [ ] Task: Conductor - User Manual Verification 'Completion, Sticker Award & Return' (Protocol in workflow.md)
</protect>
