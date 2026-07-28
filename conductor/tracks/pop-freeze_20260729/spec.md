<protect>
# Track: Pop & Freeze! Mini-Game

**Track ID:** `pop-freeze_20260729`
**Type:** Feature
**Status:** New
**Created:** 2026-07-29

## Overview

Implement Game 3 — Pop & Freeze!, the third playable mini-game for Aby's Little Lab. A toddler (ages 3-5) taps floating bubbles to pop them, exercising reflexes, while *avoiding* waking sleeping-animal bubbles — exercising inhibitory control. This track delivers a new tap-to-pop interaction architecture (distinct from Shape Sorter's drag/drop and Animal Trace's path-tracing), built on Arcade Physics for floating bubble motion. It reuses the established completion → sticker → auto-return loop and extends the AudioManager with synthesized pop & wake SFX.

## Scope

### In Scope

1. **Bubble & sleeping-animal assets** — 1 translucent bubble SVG (poppable, with highlight) + reuse of the 4 existing animal SVGs (monkey, rabbit, cat, dog) composited inside a bubble with a "Zzz" indicator at runtime (no new animal art).
2. **PreloadScene SVG loading** — load and rasterize the new bubble SVG at high resolution (animals already loaded by animal-trace).
3. **PopFreezeScene gameplay** — bubbles float via Arcade Physics (world-bounds bounce); a fixed target of 6 poppable bubbles must be popped to win; sleeping-animal decoys float alongside and must be avoided.
4. **Tap-to-pop interaction** — Phaser pointer tap on a poppable bubble → pop animation + pop SFX + particle burst + increment count; tap on a sleeping-animal bubble → wake SFX + brief wake animation, no penalty.
5. **Spawn management** — maintain a concurrent on-screen bubble count (mix of poppable + sleeping); respawn poppable bubbles as they are popped until the win target is reached.
6. **Synthesized SFX** — extend AudioManager with Web Audio API synthesis for pop (short percussive blip) and wake (soft rousing chime). Reuse existing correct/win/sticker SFX.
7. **Completion flow** — 6 pops → win animation → sticker award (first time only) → auto-return to Hub after 3s.
8. **Tests** — unit tests for pure game logic (spawn scheduling, pop counting, win detection) + integration tests for scene flow.

### Out of Scope

- Other mini-games (Games 1-2 done; Games 4-6 remain stubs).
- Real MP3 audio (all SFX synthesized via Web Audio API).
- BGM changes (existing handling reused as-is).
- Sticker book visual polish on Hub (basic display exists from foundation).
- PWA deployment.
- Difficulty scaling / multiple rounds (single round = 6 pops).
- Timed mode (no timer; no-fail design).

## Functional Requirements

### FR1 — Asset Pipeline
- **FR1.1:** Create 1 bubble SVG: `bubble.svg` (512×512 viewBox, translucent round bubble with highlight, soft/vibrant, storybook style).
- **FR1.2:** Reuse existing 4 animal SVGs (`monkey.svg`, `rabbit.svg`, `cat.svg`, `dog.svg`) as sleeping-animal content; composite each inside a translucent bubble container with a small "Zzz" indicator at runtime (no new animal SVGs).
- **FR1.3:** Extend PreloadScene to load the new bubble SVG with explicit width/height for high-res rasterization (animals already loaded).
- **FR1.4:** Create a `pop-freeze` sticker SVG (`stickers/sticker_pop_freeze.svg`).

### FR2 — Round Initialization
- **FR2.1:** On scene create, initialize pop count to 0 and win target to 6 poppable bubbles.
- **FR2.2:** Spawn an initial set of concurrent bubbles (e.g., 5): a randomized mix of poppable bubbles and 1-2 sleeping-animal bubbles, at random positions with random drift velocities.
- **FR2.3:** Bubble types, positions, and velocities are randomized per playthrough (replay variety).

### FR3 — Floating Bubbles & Tap Interaction
- **FR3.1:** Bubbles float via Arcade Physics with random velocity; collide with world bounds (bounce), keeping them on-screen.
- **FR3.2:** Tapping a poppable bubble: play pop animation (scale-up + fade burst) + pop SFX + particle burst; increment pop count; remove bubble; spawn a replacement poppable bubble if win target not yet reached.
- **FR3.3:** Tapping a sleeping-animal bubble: play wake SFX + brief wake animation (animal stirs, then returns to sleep); bubble is NOT removed; pop count unchanged (no penalty).
- **FR3.4:** Touch targets ≥ 64×64px (ideal 96×96px); inflated hit areas for toddler ergonomics.
- **FR3.5:** When pop count reaches the win target (6), stop spawning; trigger completion.

### FR4 — Feedback & Audio
- **FR4.1:** Extend AudioManager with Web Audio API synthesis for: pop (short percussive blip), wake (soft rousing tone). Reuse existing correct/win/sticker synthesized SFX.
- **FR4.2:** Respect SFX toggle (no sound when `sfxEnabled` is false).
- **FR4.3:** Particle burst on pop: soft, slow-dissipating (per accessibility guidelines).
- **FR4.4:** No harsh/penalizing audio on wake (gentle rousing tone only).

### FR5 — Completion & Sticker
- **FR5.1:** Detect completion when pop count reaches 6.
- **FR5.2:** On completion: play win animation + win SFX.
- **FR5.3:** If first completion (`hasSticker === false`): award sticker via `storage.earnSticker("pop-freeze")`, play sticker SFX + sticker unlock animation.
- **FR5.4:** After 3s delay, auto-return to Hub scene.
- **FR5.5:** Parental lock (hold 3s on back button) exits early to Hub at any time (already exists in stub).

## Non-Functional Requirements

- **NFR1:** 60fps during bubble motion & tap interactions (min 30fps).
- **NFR2:** Touch latency < 16ms.
- **NFR3:** All tests pass with >80% coverage on new code.
- **NFR4:** Biome lint/format check passes (`pnpm run check`).
- **NFR5:** Production build succeeds (`pnpm run build`).
- **NFR6:** Accessibility — gentle animations respecting `prefers-reduced-motion`; no-fail design (no penalties for waking sleeping animals).

## Key Technical Decisions

1. **Synthesized pop & wake SFX** via Web Audio API — consistent with Games 1 & 2; no MP3 files.
2. **Floating bubbles via Arcade Physics** (velocity + world-bounds bounce) — emphasizes reflexes; sleeping animals mixed in tests inhibitory control.
3. **Fixed pop count (6) = complete** — single round, no timer, no-fail (matches Games 1 & 2 single-round pattern).
4. **No penalty on wake** — gentle wake SFX + brief animation, animal returns to sleep, progress unchanged (per gentle-feedback principle).
5. **Reuse existing 4 animal SVGs** as sleeping-animal content (composited in a bubble container with "Zzz" at runtime) — no new animal art.
6. **Pure game logic in `src/game/popFreezeLogic.ts`** (spawn scheduling, pop counting, win detection) — testable without Phaser.

## Acceptance Criteria

- [ ] `pnpm dev` loads the game; tapping the Pop & Freeze tile enters the game.
- [ ] Bubbles float across the play area and bounce off screen edges.
- [ ] Tapping a poppable bubble pops it with pop SFX + particles and increments the count.
- [ ] Tapping a sleeping-animal bubble plays a gentle wake animation + wake SFX with no penalty (count unchanged, bubble remains).
- [ ] Popping 6 poppable bubbles triggers win animation + sticker award (first time) + auto-return to Hub after 3s.
- [ ] Replaying does not re-award the sticker.
- [ ] SFX toggle off silences gameplay sounds.
- [ ] `CI=true pnpm test` passes with >80% coverage on new code.
- [ ] `pnpm run check` and `pnpm run build` pass.
</protect>
