<protect>
# Track: Shape Sorter Mini-Game

**Track ID:** `shape-sorter_20260728`
**Type:** Feature
**Status:** New
**Created:** 2026-07-28

## Overview

Implement Game 1 — Shape Sorter, the first playable mini-game for Aby's Little Lab. A toddler (ages 3-5) drags colored geometric shapes (circle, square, triangle, star) to matching cut-out slots. This track delivers the first end-to-end playable game, establishing the reusable gameplay loop (init → play → complete → win + sticker → return), the drag/drop interaction architecture (reused by Games 4 & 6), the SVG asset loading pipeline, and synthesized gameplay SFX.

## Scope

### In Scope

1. **Shape SVG assets** — hand-authored flat vector shapes (4 shapes + 4 cutout slot variants) at 512×512 viewBox, thick dark outlines, storybook style, distinct color per shape (color-independent design).
2. **PreloadScene SVG loading** — load and rasterize shape SVGs at high resolution (wires up the previously-deferred asset pipeline).
3. **ShapeSorterScene gameplay** — 3 of 4 shapes randomly selected per playthrough; 3 slots at top, 3 shapes at bottom; positions shuffled independently.
4. **Drag/drop interaction** — Phaser Pointer Drag + Zone detection; snap-to-center on correct match; gentle bounce-back to origin on incorrect (no penalty).
5. **Feedback system** — correct: synthesized chime + particle burst; incorrect: gentle wobble/bounce-back with soft neutral tone.
6. **Synthesized SFX** — extend AudioManager with Web Audio API synthesis for gameplay SFX (correct, incorrect, win, sticker).
7. **Completion flow** — all 3 shapes placed → win animation → sticker award (first time only, via storage layer) → auto-return to Hub after 3s.
8. **Tests** — unit tests for game logic (shuffle, match detection, completion, sticker award) + integration tests for scene navigation/flow.

### Out of Scope

- Other mini-games (Games 2-6 remain stubs).
- Real MP3 audio files (all gameplay SFX synthesized via Web Audio API).
- BGM changes (existing BGM handling reused as-is).
- Sticker book visual polish on Hub (basic display already exists from foundation track).
- PWA deployment.
- Difficulty scaling / multiple rounds (single round per playthrough).

## Functional Requirements

### FR1 — Asset Pipeline
- **FR1.1:** Create 4 full-color shape SVGs: `shape_circle.svg`, `shape_square.svg`, `shape_triangle.svg`, `shape_star.svg` (512×512 viewBox, flat fills, 4-6px `#2D3748` stroke, soft/vibrant non-primary colors, each shape a distinct color).
- **FR1.2:** Create 4 cutout slot SVGs: same paths with 30% opacity fill + dashed `#2D3748` stroke (per PRD §4.1).
- **FR1.3:** Extend PreloadScene to load all 8 shape SVGs with explicit width/height for high-res rasterization.
- **FR1.4:** Create a `shape-sorter` sticker SVG (`stickers/sticker_shape_sorter.svg`).

### FR2 — Round Initialization
- **FR2.1:** On scene create, randomly select 3 of 4 shape types.
- **FR2.2:** Render 3 cutout slots at top (shuffled positions) and 3 corresponding full-color shapes at bottom (shuffled independently of slot order).
- **FR2.3:** Each shape's correct drop target is its matching slot (matched by shape type).

### FR3 — Drag & Drop
- **FR3.1:** Shapes are draggable via Phaser Pointer Drag.
- **FR3.2:** Drop zones (Phaser Zones) positioned over each slot with inflated bounds (generous snap radius per touch-ergonomics guidelines).
- **FR3.3:** On correct drop (shape type matches slot type): shape snaps to slot center, becomes non-interactive, play correct SFX + particle burst.
- **FR3.4:** On incorrect drop: shape bounces back to origin with gentle wobble animation, soft neutral tone, no penalty.
- **FR3.5:** Touch targets ≥ 64×64px (ideal 96×96px).

### FR4 — Feedback & Audio
- **FR4.1:** Extend AudioManager with Web Audio API synthesis for: correct (pleasant ascending chime), incorrect (soft neutral descending tone), win (celebratory), sticker (sparkle).
- **FR4.2:** Respect SFX toggle setting (if SFX disabled, no SFX plays).
- **FR4.3:** Particle burst on correct placement: soft, slow-dissipating (per accessibility guidelines).

### FR5 — Completion & Sticker
- **FR5.1:** Detect completion when all 3 shapes are correctly placed.
- **FR5.2:** On completion: play win animation + win SFX.
- **FR5.3:** If first completion (`hasSticker === false`): award sticker via `storage.earnSticker("shape-sorter")`, play sticker SFX + sticker unlock animation.
- **FR5.4:** After 3s delay, auto-return to Hub scene.
- **FR5.5:** Parental lock (hold 3s on back button) exits early to Hub at any time (already exists in stub).

## Non-Functional Requirements

- **NFR1:** 60fps during drag interactions (min 30fps).
- **NFR2:** Touch latency < 16ms.
- **NFR3:** All tests pass with >80% coverage on new code.
- **NFR4:** Biome lint/format check passes.
- **NFR5:** Production build succeeds (`pnpm run build`).
- **NFR6:** Accessibility — color-independent design (each shape differs by both color AND geometric form); gentle animations respecting `prefers-reduced-motion`.

## Key Technical Decisions

1. **Hand-authored SVGs** (8 files: 4 shapes + 4 cutouts) — simple flat vectors, no AI generation pipeline yet.
2. **3 of 4 shapes per round**, randomly selected, positions shuffled (per PRD).
3. **Synthesized SFX** via Web Audio API — extends existing AudioManager, no MP3 files.
4. **Single round = complete** (place all 3 → win).
5. **Drag/drop** via Phaser Pointer Drag + Zone detection (establishes pattern reused by Games 4 & 6).
6. **Cutout slots** as separate dashed-outline SVGs (30% opacity + dashed stroke per PRD).

## Acceptance Criteria

- [ ] `pnpm dev` loads the game; tapping Shape Sorter tile enters the game.
- [ ] 3 shapes and 3 matching slots appear, shuffled per playthrough.
- [ ] Dragging a shape to its matching slot snaps it in place with chime + particles.
- [ ] Dragging to a wrong slot bounces the shape back gently (no penalty).
- [ ] Placing all 3 shapes triggers win animation + sticker award (first time) + auto-return to Hub after 3s.
- [ ] Replaying does not re-award the sticker.
- [ ] SFX toggle off silences gameplay sounds.
- [ ] `CI=true pnpm test` passes with >80% coverage on new code.
- [ ] `pnpm run check` and `pnpm run build` pass.
</protect>
