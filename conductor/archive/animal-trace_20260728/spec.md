<protect>
# Track: Animal Trace-and-Connect Mini-Game

**Track ID:** `animal-trace_20260728`
**Type:** Feature
**Status:** New
**Created:** 2026-07-28

## Overview

Implement Game 2 — Animal Trace-and-Connect, the second playable mini-game for Aby's Little Lab. A toddler (ages 3-5) traces a dotted path from an animal sprite to its food sprite, exercising pre-writing fine motor coordination. This track delivers a new path-tracing interaction architecture (distinct from Shape Sorter's drag/drop), built on `Phaser.Curves.Path` with pointer-proximity hit-testing. It reuses the established completion → sticker → auto-return loop and existing synthesized SFX.

## Scope

### In Scope

1. **Animal & food SVG assets** — 4 animal sprites (monkey, rabbit, cat, dog) + 4 food sprites (banana, carrot, fish, bone) at 512×512 viewBox, flat fills, thick dark outlines, storybook style, distinct colors.
2. **Dotted path rendering** — thick dotted curve per pair, generated programmatically via `Phaser.Curves.Path` + Graphics (not a static SVG).
3. **PreloadScene SVG loading** — load and rasterize all 8 animal/food SVGs at high resolution.
4. **AnimalTraceScene gameplay** — 3 of 4 animal-food pairs randomly selected per playthrough; trace each path sequentially; advance to next pair on completion.
5. **Path-tracing interaction** — `Phaser.Curves.Path`; `pointermove` proximity check while pointer down; progress animal sprite along path on valid touch; pause & resume on finger lift/stray.
6. **Feedback system** — completion chime + particle burst on reaching food; no-fail (no penalty for deviation).
7. **Completion flow** — all 3 paths traced → win animation → sticker award (first time only) → auto-return to Hub after 3s.
8. **Tests** — unit tests for pure game logic (pair selection/shuffle, path progress, completion) + integration tests for scene flow.

### Out of Scope

- Other mini-games (Game 1 done; Games 3-6 remain stubs).
- Real MP3 audio (reuses existing synthesized SFX via AudioManager; no new audio methods).
- BGM changes (existing handling reused as-is).
- Sticker book visual polish on Hub (basic display exists from foundation).
- PWA deployment.
- Difficulty scaling / multiple rounds (single round = 3 traces).
- Path complexity scaling (fixed gentle curve per pair).

## Functional Requirements

### FR1 — Asset Pipeline
- **FR1.1:** Create 4 animal SVGs: `monkey.svg`, `rabbit.svg`, `cat.svg`, `dog.svg` (512×512 viewBox, flat fills, 4-6px `#2D3748` stroke, storybook style, distinct soft/vibrant non-primary colors).
- **FR1.2:** Create 4 food SVGs: `banana.svg`, `carrot.svg`, `fish.svg`, `bone.svg` (matching their animal, same style rules).
- **FR1.3:** Generate dotted path per pair at runtime via `Phaser.Curves.Path` rendered as a thick dotted line (`#2D3748`) using Graphics — one gentle multi-point curve from animal (left) to food (right). (Supersedes PRD's static `dotted_path.svg`; a runtime curve is required for proximity hit-testing.)
- **FR1.4:** Create an `animal-trace` sticker SVG (`stickers/sticker_animal_trace.svg`).

### FR2 — Round Initialization
- **FR2.1:** On scene create, randomly select 3 of 4 animal-food pairs.
- **FR2.2:** Render the first pair: animal sprite on left, food sprite on right, dotted path connecting them.
- **FR2.3:** On completing a path, advance to the next pair (3 total). Show a progress indicator (e.g., 3 dots reflecting completed paths).

### FR3 — Path Tracing
- **FR3.1:** Define a `Phaser.Curves.Path` per pair (gentle multi-point curve from animal to food).
- **FR3.2:** On `pointermove` while pointer is down, check pointer proximity to the path; if within tolerance, progress the animal sprite along the path toward the food.
- **FR3.3:** If finger lifts or strays beyond tolerance: animal pauses at current position (no reset, no penalty). Resumes from current position when finger returns near the path.
- **FR3.4:** When animal reaches the food (path fully traced): play completion chime + particle burst, mark path complete.
- **FR3.5:** Trace tolerance generous (per touch-ergonomics guidelines; inflated proximity band to reduce fine-motor frustration).

### FR4 — Feedback & Audio
- **FR4.1:** Reuse existing AudioManager synthesized SFX: `playCorrect` on path completion, `playWin` on round completion, `playSticker` on first win. No new audio methods.
- **FR4.2:** Respect SFX toggle (no sound when `sfxEnabled` is false).
- **FR4.3:** Particle burst on path completion: soft, slow-dissipating (per accessibility guidelines).
- **FR4.4:** Silent during tracing (no continuous tone); audio only on completion events.

### FR5 — Completion & Sticker
- **FR5.1:** Detect round completion when all 3 paths are traced.
- **FR5.2:** On completion: play win animation + win SFX.
- **FR5.3:** If first completion (`hasSticker === false`): award sticker via `storage.earnSticker("animal-trace")`, play sticker SFX + sticker unlock animation.
- **FR5.4:** After 3s delay, auto-return to Hub scene.
- **FR5.5:** Parental lock (hold 3s on back button) exits early to Hub at any time (already exists in stub).

## Non-Functional Requirements

- **NFR1:** 60fps during tracing (min 30fps).
- **NFR2:** Touch latency < 16ms.
- **NFR3:** All tests pass with >80% coverage on new code.
- **NFR4:** Biome lint/format check passes (`pnpm run check`).
- **NFR5:** Production build succeeds (`pnpm run build`).
- **NFR6:** Accessibility — gentle animations respecting `prefers-reduced-motion`; no-fail design (no penalties for deviation/lift).

## Key Technical Decisions

1. **4 animal-food pairs** (monkey→banana, rabbit→carrot, cat→fish, dog→bone); 3 of 4 selected per round, shuffled — parallels Shape Sorter's 3-of-4 pattern.
2. **Dotted path generated programmatically** via `Phaser.Curves.Path` + Graphics (dotted line), NOT a static SVG — enables per-pair path variation and proximity hit-testing on the same curve object. (PRD's `dotted_path.svg` superseded by runtime curve per the Phaser Engine Logic.)
3. **Pause & resume tracing:** animal pauses on finger lift/stray, resumes from current position. No reset penalty (no-fail design).
4. **Reuse existing AudioManager synthesized SFX** (correct/win/sticker) — no new audio methods.
5. **Single round = 3 traces = complete.**
6. **Pure game logic in `src/game/animalTraceLogic.ts`** (pair selection/shuffle, path progress tracking, completion detection) — testable without Phaser.

## Acceptance Criteria

- [ ] `pnpm dev` loads the game; tapping the Animal Trace tile enters the game.
- [ ] 3 animal-food pairs appear sequentially, shuffled per playthrough (3 of 4).
- [ ] Tracing the dotted path moves the animal toward the food.
- [ ] Lifting the finger or straying pauses the animal; resuming continues from the same spot (no reset).
- [ ] Reaching the food triggers chime + particles; advances to the next pair.
- [ ] Tracing all 3 paths triggers win animation + sticker award (first time) + auto-return to Hub after 3s.
- [ ] Replaying does not re-award the sticker.
- [ ] SFX toggle off silences gameplay sounds.
- [ ] `CI=true pnpm test` passes with >80% coverage on new code.
- [ ] `pnpm run check` and `pnpm run build` pass.
</protect>
