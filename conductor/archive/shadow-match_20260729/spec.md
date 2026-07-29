<protect>
# Track: Shadow Match Mini-Game

**Track ID:** `shadow-match_20260729`
**Type:** Feature
**Status:** New
**Created:** 2026-07-29

## Overview

Implement Game 4 — Shadow Match, the fourth playable mini-game for Aby's Little Lab. A toddler (ages 3-5) drags colored objects onto matching dark silhouettes, exercising visual discrimination and spatial awareness. This track reuses the established drag-and-drop + snap interaction pattern from Shape Sorter and introduces the shadow/silhouette asset pipeline (duplicate paths, union fills, set #2D3748) — a documented-but-untested capability. It reuses the established completion → sticker → auto-return loop and existing synthesized SFX (correct, incorrect, win, sticker) from the AudioManager.

## Scope

### In Scope

1. **Object & shadow silhouette assets** — 6 new object SVGs (house, tree, car, boat, ball, umbrella) at 512×512 viewBox, storybook flat style with thick dark outlines + soft/vibrant fills. 6 pre-rendered shadow silhouette SVGs derived from each object (duplicate paths, union fills, set #2D3748). 1 sticker SVG.
2. **PreloadScene SVG loading** — load and rasterize the 6 object SVGs and 6 shadow SVGs at high resolution.
3. **ShadowMatchScene gameplay** — 6 colored objects and 6 shadow silhouettes placed on-screen; child drags each object onto its matching silhouette. Match all 6 to win.
4. **Drag-and-drop interaction** — drag colored object onto a shadow; on match → snap into place + correct SFX + particle burst; on mismatch → gentle bounce back to origin + incorrect SFX, no penalty.
5. **Replay variety** — object and shadow positions shuffle per playthrough.
6. **Completion flow** — 6 matches → win animation → sticker award (first time only) → auto-return to Hub after 3s.
7. **Tests** — unit tests for pure game logic (pair generation, shuffle, match detection, win detection) + integration tests for scene flow.

### Out of Scope

- Other mini-games (Games 1-3 done; Games 5-6 remain stubs).
- New audio synthesis (reuse existing correct/incorrect/win/sticker SFX from AudioManager).
- BGM changes (existing handling reused as-is).
- Sticker book visual polish on Hub (basic display exists from foundation).
- PWA deployment.
- Difficulty scaling / multiple rounds (single round = 6 matches).
- Timed mode (no timer; no-fail design).

## Functional Requirements

### FR1 — Asset Pipeline
- **FR1.1:** Create 6 object SVGs in `src/assets/svg/items/`: `house.svg`, `tree.svg`, `car.svg`, `boat.svg`, `ball.svg`, `umbrella.svg` (512×512 viewBox, flat fills, thick #2D3748 outlines 4-6px, soft/vibrant palette, instantly recognizable by a 3-year-old, maximally distinct outline shapes).
- **FR1.2:** Create 6 shadow silhouette SVGs in `src/assets/svg/shadows/`: `shadow_house.svg`, `shadow_tree.svg`, `shadow_car.svg`, `shadow_boat.svg`, `shadow_ball.svg`, `shadow_umbrella.svg` — derived by duplicating each object's paths, unioning fills, setting color to #2D3748 (per tech-stack.md §6). Silhouettes differ by outline shape, not just darkness (accessibility).
- **FR1.3:** Extend PreloadScene to load and rasterize the 6 object SVGs and 6 shadow SVGs with explicit width/height for high-res rasterization.
- **FR1.4:** Create a `shadow-match` sticker SVG (`src/assets/svg/stickers/sticker_shadow_match.svg`).

### FR2 — Round Initialization
- **FR2.1:** On scene create, initialize matched count to 0 and win target to 6 object-silhouette pairs.
- **FR2.2:** Generate a shuffled set of 6 objects and independently shuffled 6 shadow silhouettes, placed at distinct on-screen positions (e.g., objects along bottom row, shadows scattered in play area).
- **FR2.3:** Pair positions are randomized per playthrough (replay variety).

### FR3 — Drag-and-Drop & Match Interaction
- **FR3.1:** Child drags a colored object; on release over a shadow silhouette, evaluate match.
- **FR3.2:** On match (object and shadow are the same underlying object): snap object into the silhouette position, play correct SFX + particle burst, mark pair as matched, increment matched count. Matched objects lock in place (no longer draggable).
- **FR3.3:** On mismatch: gentle bounce-back animation to origin + incorrect SFX (soft descending tone), no penalty. Object remains draggable.
- **FR3.4:** Touch targets ≥ 64×64px (ideal 96×96px); inflated hit areas / forgiving snap radius for toddler ergonomics.
- **FR3.5:** When matched count reaches 6, trigger completion.

### FR4 — Feedback & Audio
- **FR4.1:** Reuse existing AudioManager synthesized SFX: correct (ascending chime), incorrect (soft descending tone), win (celebratory arpeggio), sticker (sparkle). No new audio synthesis.
- **FR4.2:** Respect SFX toggle (no sound when sfxEnabled is false).
- **FR4.3:** Particle burst on correct match: soft, slow-dissipating (per accessibility guidelines).
- **FR4.4:** No harsh/penalizing audio on mismatch (gentle descending tone only).

### FR5 — Completion & Sticker
- **FR5.1:** Detect completion when matched count reaches 6.
- **FR5.2:** On completion: play win animation + win SFX.
- **FR5.3:** If first completion (hasSticker === false): award sticker via `storage.earnSticker("shadow-match")`, play sticker SFX + sticker unlock animation.
- **FR5.4:** After 3s delay, auto-return to Hub scene.
- **FR5.5:** Parental lock (hold 3s on back button) exits early to Hub at any time (already exists in stub).

## Non-Functional Requirements

- **NFR1:** 60fps during drag interactions (min 30fps).
- **NFR2:** Touch latency < 16ms.
- **NFR3:** All tests pass with >80% coverage on new code.
- **NFR4:** Biome lint/format check passes (`pnpm run check`).
- **NFR5:** Production build succeeds (`pnpm run build`).
- **NFR6:** Accessibility — silhouettes differ by outline shape (color-independent design); gentle animations respecting prefers-reduced-motion; no-fail design (no penalties for mismatches).

## Key Technical Decisions

1. **Drag-and-drop matching** reuses Shape Sorter's proven interaction pattern — lowest risk, consistent UX.
2. **Pre-rendered shadow SVGs** (static files) — matches tech-stack.md §6 documented derivation; silhouettes are crisp at any resolution via SVG rasterization.
3. **6 object-silhouette pairs** — longer engagement than Shape Sorter's 4; single round, no timer, no-fail.
4. **No penalty on mismatch** — gentle bounce-back + soft incorrect tone; progress unchanged (per gentle-feedback principle).
5. **6 new object SVGs** (house, tree, car, boat, ball, umbrella) — maximally distinct outlines satisfying color-independent accessibility; each game keeps its own themed asset set.
6. **Pure game logic in `src/game/shadowMatchLogic.ts`** (pair generation, shuffle, match detection, win detection) — testable without Phaser.
7. **Reuse existing synthesized SFX** — no new AudioManager methods needed.

## Acceptance Criteria

- [ ] `pnpm dev` loads the game; tapping the Shadow Match tile enters the game.
- [ ] 6 colored objects and 6 shadow silhouettes appear on-screen in shuffled positions.
- [ ] Dragging a correct object onto its silhouette snaps it into place with correct SFX + particles.
- [ ] Dragging an object onto the wrong silhouette bounces it back with a gentle tone and no penalty.
- [ ] Matching all 6 pairs triggers win animation + sticker award (first time) + auto-return to Hub after 3s.
- [ ] Replaying does not re-award the sticker.
- [ ] SFX toggle off silences gameplay sounds.
- [ ] `CI=true pnpm test` passes with >80% coverage on new code.
- [ ] `pnpm run check` and `pnpm run build` pass.
</protect>
