<protect>
# Track: Big vs. Small Cleaner Mini-Game

**Track ID:** `big-small_20260730`
**Type:** Feature
**Status:** New
**Created:** 2026-07-30

## Overview

Implement Game 6 — Big vs. Small Cleaner, the sixth and final playable mini-game for Aby's Little Lab. A toddler (ages 3-5) drags scattered toys into one of two boxes based on size — sorting "big" toys into the big box and "small" toys into the small box. This track exercises scale discrimination and quantitative reasoning (categorizing spatial size concepts). It reuses the established drag-and-drop + snap interaction pattern from Shape Sorter and Shadow Match, the completion → sticker → auto-return loop, and existing synthesized SFX (correct, incorrect, win, sticker) from the AudioManager. The novel element is scale-based categorization: each toy type appears at two scales (big 1.5× and small 0.7×), and match logic evaluates `toy.scaleCategory === box.scaleCategory` rather than identity matching.

## Scope

### In Scope

1. **Toy & box assets** — 4 new toy SVGs (teddy_bear, toy_car, toy_ball, toy_block) at 512×512 viewBox, storybook flat style with thick dark outlines + soft/vibrant fills. 1 toy_box SVG (single container, rendered at two scales at runtime). 1 sticker SVG.
2. **PreloadScene SVG loading** — load and rasterize the 4 toy SVGs and 1 toy_box SVG at high resolution.
3. **BigSmallScene gameplay** — 3 of 4 toy types randomly selected; each rendered at two scales (big 1.5×, small 0.7×) = 6 toys on screen. Two toy boxes on screen (big box at 1.5×, small box at 0.7×). Child drags each toy into the matching-scale box. Sort all 6 to win.
4. **Drag-and-drop interaction** — drag toy toward a box; on correct scale match → snap into box + correct SFX + particle burst; on mismatch → gentle bounce back to origin + incorrect SFX, no penalty.
5. **Replay variety** — 3 of 4 toy types randomly selected per playthrough; toy positions shuffled independently per playthrough.
6. **Completion flow** — 6 sorted → win animation → sticker award (first time only) → auto-return to Hub after 3s.
7. **Tests** — unit tests for pure game logic (toy selection, scale assignment, shuffle, match detection, win detection) + integration tests for scene flow.

### Out of Scope

- Other mini-games (Games 1-5 done; Game 6 is the final game).
- New audio synthesis (reuse existing correct/incorrect/win/sticker SFX from AudioManager).
- BGM changes (existing handling reused as-is).
- Sticker book visual polish on Hub (basic display exists from foundation).
- PWA deployment.
- Difficulty scaling / multiple rounds (single round = 6 sorted).
- Timed mode (no timer; no-fail design).
- "Medium" size category (only big and small).

## Functional Requirements

### FR1 — Asset Pipeline
- **FR1.1:** Create 4 toy SVGs in `src/assets/svg/toys/`: `teddy_bear.svg`, `toy_car.svg`, `toy_ball.svg`, `toy_block.svg` (512×512 viewBox, flat fills, thick #2D3748 outlines 4-6px, soft/vibrant palette, instantly recognizable by a 3-year-old, maximally distinct outline shapes).
- **FR1.2:** Create 1 toy box SVG: `toy_box.svg` (512×512 viewBox, open container style, flat fill, thick #2D3748 outline, storybook style). Rendered at two scales (1.5× BIG, 0.7× SMALL) at runtime.
- **FR1.3:** Extend PreloadScene to load and rasterize the 4 toy SVGs and 1 toy_box SVG with explicit width/height for high-res rasterization.
- **FR1.4:** Create a `big-small` sticker SVG (`src/assets/svg/stickers/sticker_big_small.svg`).

### FR2 — Round Initialization
- **FR2.1:** On scene create, initialize sorted count to 0 and win target to 6 toys (3 big + 3 small).
- **FR2.2:** Randomly select 3 of 4 toy types from the pool (teddy_bear, toy_car, toy_ball, toy_block).
- **FR2.3:** For each selected toy type, instantiate two sprites: one at 1.5× scale (BIG) and one at 0.7× scale (SMALL). Assign `scaleCategory` property ("big" or "small") to each.
- **FR2.4:** Place two toy_box sprites on screen: BIG box at 1.5× scale (left or top), SMALL box at 0.7× scale (right or bottom). Assign `scaleCategory` ("big" and "small" respectively).
- **FR2.5:** Shuffle toy positions independently per playthrough (replay variety). Toys placed in the play area, distinct from box positions.

### FR3 — Drag-and-Drop & Match Interaction
- **FR3.1:** Child drags a toy; on release over a box, evaluate match: `toy.scaleCategory === box.scaleCategory`.
- **FR3.2:** On correct match: snap toy into box position + correct SFX + particle burst, mark toy as sorted, increment sorted count. Sorted toys lock in place (no longer draggable).
- **FR3.3:** On mismatch: gentle bounce-back animation to origin + incorrect SFX (soft descending tone), no penalty. Toy remains draggable.
- **FR3.4:** Touch targets ≥ 64×64px (ideal 96×96px); inflated hit areas / forgiving snap radius for toddler ergonomics. Small toys (0.7×) must still meet 64px minimum — base SVG rasterized large enough.
- **FR3.5:** When sorted count reaches 6, trigger completion.

### FR4 — Feedback & Audio
- **FR4.1:** Reuse existing AudioManager synthesized SFX: correct (ascending chime), incorrect (soft descending tone), win (celebratory arpeggio), sticker (sparkle). No new audio synthesis.
- **FR4.2:** Respect SFX toggle (no sound when sfxEnabled is false).
- **FR4.3:** Particle burst on correct sort: soft, slow-dissipating (per accessibility guidelines).
- **FR4.4:** No harsh/penalizing audio on mismatch (gentle descending tone only).

### FR5 — Completion & Sticker
- **FR5.1:** Detect completion when sorted count reaches 6.
- **FR5.2:** On completion: play win animation + win SFX.
- **FR5.3:** If first completion (hasSticker === false): award sticker via `storage.earnSticker("big-small")`, play sticker SFX + sticker unlock animation.
- **FR5.4:** After 3s delay, auto-return to Hub scene.
- **FR5.5:** Parental lock (hold 3s on back button) exits early to Hub at any time (already exists in stub).

## Non-Functional Requirements

- **NFR1:** 60fps during drag interactions (min 30fps).
- **NFR2:** Touch latency < 16ms.
- **NFR3:** All tests pass with >80% coverage on new code.
- **NFR4:** Biome lint/format check passes (`pnpm run check`).
- **NFR5:** Production build succeeds (`pnpm run build`).
- **NFR6:** Accessibility — size difference (1.5× vs 0.7×) is the primary discriminator, not color; gentle animations respecting prefers-reduced-motion; no-fail design (no penalties for mismatches).

## Key Technical Decisions

1. **Drag-and-drop sorting** reuses Shape Sorter's and Shadow Match's proven interaction pattern — lowest risk, consistent UX.
2. **Scale-based categorization** — match logic evaluates `toy.scaleCategory === box.scaleCategory`, a novel match criterion distinct from identity matching in other games.
3. **4-toy pool, select 3 per round** — replay variety consistent with Shape Sorter (4 shapes, 3 selected) and Animal Trace (4 pairs, 3 selected).
4. **Single toy_box SVG at two scales** — the size difference of the boxes themselves reinforces the big/small concept visually. No need for separate box designs.
5. **1.5×/0.7× scale ratio** — ≈2:1 visual ratio, clear enough for a 3-year-old to distinguish while keeping both toy sizes reasonably sized on screen.
6. **No penalty on mismatch** — gentle bounce-back + soft incorrect tone; progress unchanged (per gentle-feedback principle).
7. **Pure game logic in `src/game/bigSmallLogic.ts`** (toy selection, scale assignment, shuffle, match detection, win detection) — testable without Phaser.
8. **Reuse existing synthesized SFX** — no new AudioManager methods needed.

## Acceptance Criteria

- [ ] `pnpm dev` loads the game; tapping the Big vs. Small tile enters the game.
- [ ] 6 toys appear on-screen (3 big + 3 small, from a pool of 4 toy types) in shuffled positions alongside a big box and a small box.
- [ ] Dragging a big toy into the big box snaps it in with correct SFX + particles.
- [ ] Dragging a small toy into the small box snaps it in with correct SFX + particles.
- [ ] Dragging a toy into the wrong-size box bounces it back with a gentle tone and no penalty.
- [ ] Sorting all 6 toys triggers win animation + sticker award (first time) + auto-return to Hub after 3s.
- [ ] Replaying does not re-award the sticker.
- [ ] Replay shows a different subset of toys and/or shuffled positions.
- [ ] SFX toggle off silences gameplay sounds.
- [ ] `CI=true pnpm test` passes with >80% coverage on new code.
- [ ] `pnpm run check` and `pnpm run build` pass.
</protect>
