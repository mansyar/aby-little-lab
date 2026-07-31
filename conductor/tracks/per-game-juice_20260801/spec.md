# Specification: Per-Game Juice

**Track ID:** `per-game-juice_20260801`
**Type:** Feature / Animation depth

## Overview

Deepen each mini-game's feedback moments with per-game reaction animations ("juice"): drag lift and snap-to-slot, box and shadow reactions, animal hops, pop droplets, breathing decoys, and musical ripples. Pure scene-level animation work — zero gameplay-rule changes, zero new assets, all effects Graphics-based, bounded, and reduced-motion-aware.

## Functional Requirements

### 1. Drag lift and snap (ShapeSorter, ShadowMatch, BigSmall)

- On drag start: object scales to 1.1 (1.05 under reduced-motion) with a slight tilt; restores on drop.
- Drop zones highlight on dragover with a soft outline pulse.
- Correct drops animate to the slot center with a 200ms `Back.out` tween instead of an instant `setPosition` snap. Drop logic and match detection are unchanged.
- Existing incorrect bounce-back behavior is preserved.

### 2. BigSmall box reaction

- On correct drop: toy shrinks into the box (150ms), the box lid wiggles (rotation ±3°, yoyo), and the box scales up 1.05 briefly alongside the existing splash.

### 3. ShadowMatch reveal

- On match: the shadow slot "stamps" (scale 1.1 yoyo + brief fill flash), and the matched object dims slightly (lower alpha) to visually "become" the silhouette.

### 4. AnimalTrace movement

- The animal hops between waypoints (small ±6px y arc, ~120ms per hop) instead of sliding.
- The food sprite wiggles on path arrival alongside the existing splash.
- Progress indicator dots pop (scale 1 → 1.4 → 1, `Back.out`) when filled instead of a plain alpha change.

### 5. PopFreeze reactions

- Popping emits 3–4 small droplet circles radiating outward from the pop point (Graphics, self-cleaning, ~300ms) alongside the existing splash.
- Sleeping-animal decoys breathe with a slow 1.0 → 1.03 scale yoyo loop (~1.5s). Reduced-motion: no breathing loop.

### 6. MusicalMemory reactions

- Frog taps emit an expanding ripple ring (Graphics, ~400ms, alpha fade, self-cleaning) alongside the bounce and note.
- Lily pads drift gently (±3px y, 3s loop). Reduced-motion: no drift.
- Progress indicator dots pop on fill (same pattern as AnimalTrace).

## Non-Functional Requirements

- All effects Graphics-based and self-cleaning; no particle emitters.
- Reduced-motion reduces or removes amplitudes/durations per `cross-cutting-motion_20260801` utilities (use `utils/motion.ts` when available).
- No changes to `src/game/*Logic.ts`; all pure-logic tests must pass untouched.
- Maintain 60fps; effects are small and ephemeral.
- Follow Phaser 4, TypeScript, Vitest, Biome conventions; maintain coverage and build.

## Acceptance Criteria

- Each listed reaction is observable on its corresponding interaction in every game.
- Correct-match logic, win detection, and sticker flow are unchanged.
- Every new effect is bounded and destroys itself on completion; no `add.particles` usage.
- Reduced-motion behavior verified for loops (breathing, drift) and amplitudes.
- New scene-level tests cover the effects; full suite, coverage, formatting checks, and build pass.

## Out of Scope

- Gameplay rules, difficulty, timing, scoring
- New assets or audio
- Scene transitions, Hub changes, mascot (see sibling tracks)
- Drag physics changes beyond visual lift/snap
