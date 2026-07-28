<protect>
# Implementation Plan: Animal Trace-and-Connect Mini-Game

**Track ID:** `animal-trace_20260728`

---

## Phase 1: SVG Assets & Preload Pipeline [checkpoint: f46400d]

- [x] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [x] Task: Create animal and food SVG assets [fe8c733]
    - [x] Create 4 animal SVGs (`monkey.svg`, `rabbit.svg`, `cat.svg`, `dog.svg`) at 512×512 viewBox, flat fills, 4-6px `#2D3748` stroke, distinct soft/vibrant non-primary colors, storybook style
    - [x] Create 4 food SVGs (`banana.svg`, `carrot.svg`, `fish.svg`, `bone.svg`) matching their animal, same style rules
    - [x] Create `animal-trace` sticker SVG in `src/assets/svg/stickers/`
- [x] Task: Extend PreloadScene to load all 8 animal/food SVGs with explicit width/height for high-res rasterization [f55043a]
- [x] Task: Conductor - User Manual Verification 'SVG Assets & Preload Pipeline' (Protocol in workflow.md)

---

## Phase 2: Round Initialization & Path Logic [checkpoint: b3f881a]

- [x] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [x] Task: Write tests for round initialization and path logic [c481ac2]
    - [x] Test 3 of 4 animal-food pairs are randomly selected per round
    - [x] Test pair order is shuffled (Fisher-Yates)
    - [x] Test path progress tracking (animal advances along path points on valid trace input)
    - [x] Test completion detection (all 3 paths traced = round complete)
- [x] Task: Implement round initialization & path logic in `src/game/animalTraceLogic.ts` (pure functions: pair selection/shuffle, path progress computation, completion detection) [c481ac2]
- [x] Task: Conductor - User Manual Verification 'Round Initialization & Path Logic' (Protocol in workflow.md)

---

## Phase 3: Path Tracing & Feedback [checkpoint: 583aaca]

- [x] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [x] Task: Write tests for path tracing and feedback behavior [22d434c]
    - [x] Test pointer proximity check progresses animal along `Phaser.Curves.Path` on valid touch (pointer within tolerance band)
    - [x] Test finger lift/stray beyond tolerance pauses animal at current position (no reset, no penalty)
    - [x] Test resume continues from current position when finger returns near path
    - [x] Test reaching food triggers correct SFX + particle burst, marks path complete
    - [x] Test trace tolerance is generous (inflated proximity band per touch-ergonomics)
- [x] Task: Implement path tracing interaction (`Phaser.Curves.Path` + `pointermove` proximity) + particle burst + pause/resume in `AnimalTraceScene` [22d434c]
- [x] Task: Conductor - User Manual Verification 'Path Tracing & Feedback' (Protocol in workflow.md)

---

## Phase 4: Completion, Sticker Award & Return [checkpoint: bcc1e4e]

- [x] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [x] Task: Write tests for completion and sticker flow [0b6486a]
    - [x] Test completion detected when all 3 paths are traced
    - [x] Test sticker awarded on first completion only (via `storage.earnSticker`)
    - [x] Test auto-return to Hub after 3s delay
    - [x] Test parental lock exits early to Hub (already covered by existing "game scene stubs" parameterized test for all 6 scenes)
- [x] Task: Implement completion flow (win animation + sticker award + auto-return) in `AnimalTraceScene` [0b6486a]
- [x] Task: Conductor - User Manual Verification 'Completion, Sticker Award & Return' (Protocol in workflow.md)

---

## Phase: Review Fixes
- [x] Task: Apply review suggestions 6773252
</protect>
