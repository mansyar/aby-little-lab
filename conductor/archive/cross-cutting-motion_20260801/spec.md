# Specification: Cross-Cutting Motion

**Track ID:** `cross-cutting-motion_20260801`
**Type:** Feature / Motion infrastructure

## Overview

Build shared motion infrastructure that lifts every scene of Aby's Little Lab: gentle scene transitions, a centralized reduced-motion-aware motion utility, a choreographed win celebration, and press feedback on interactive controls. This track does not change any gameplay rules or assets; it improves perceived polish and guideline compliance (Motion-Friendly §3) across Hub, Preload, and all six game scenes.

## Functional Requirements

### 1. Scene transition utility

- Create `utils/sceneTransitions.ts` providing a scene-start helper that runs a crossfade + slight zoom: 300ms camera fade through a soft color with a 1.02x zoom on the incoming scene (`Sine.out` easing).
- Under `prefers-reduced-motion`, use a 180ms fade only (no zoom).
- Replace every gameplay-facing `scene.start(...)` call: Hub tile → game, every game Back → Hub, every game auto-return → Hub, Preload → Hub. Boot → Preload remains instant (system-level bootstrap).
- Transitions must never delay or block input for longer than the fade duration and must not leave display objects behind.

### 2. Central motion utility

- Create `utils/motion.ts` exposing:
  - `isReducedMotion(): boolean` — resolves `prefers-reduced-motion` once per call via `matchMedia`.
  - `motionDuration(normal: number, reduced: number): number` — duration selection.
  - `motionScale(normal: number, reduced: number): number` — amplitude scaling.
- Refactor `utils/completionEffect.ts` to consume the utility with behavior unchanged.
- All existing gameplay tweens (win scale yoyo, sticker pop, wobble/bounce-back, wake wobble, frog bounce) must consult the utility so reduced-motion shortens durations and reduces amplitudes.

### 3. Choreographed win celebration

- Add `createWinCelebration(scene, x, y)` producing a star-burst ray flash + soft confetti bits drifting downward.
- Must be Graphics-based, bounded, and self-cleaning (destroy on tween completion). Must NOT use `add.particles` (preserves the existing test contract asserting particle emitters are never used for effects).
- Reduced-motion variant: fewer rays, no confetti drift (or minimal static burst), shorter duration.
- Wire into all six `handleComplete` flows, replacing the uniform 300ms scale-yoyo on game objects. Sticker reveal flow stays unchanged.

### 4. Press feedback on controls

- Add a press-feedback helper (in `utils/motion.ts` or a small dedicated module): target scales to 0.95 on `pointerdown` and springs back to 1.0 on `pointerup`/`pointerout`/`pointercancel`.
- Disabled under reduced-motion (no scale change).
- Applied to: all six game Back controls, Musical Memory Replay, and Hub Settings control.

## Non-Functional Requirements

- Maintain 60fps; all effects Graphics-based (no particle emitters).
- Durations within guidelines: 200–500ms UI, 300–800ms celebration.
- No gameplay-rule changes; `src/game/*Logic.ts` files untouched.
- Follow Phaser 4, TypeScript, Vitest, Biome conventions.
- Maintain coverage thresholds and production build success.

## Acceptance Criteria

- No instant scene cuts remain across Hub, games, auto-returns, and Preload→Hub.
- All gameplay/UI tweens consult the motion utility; reduced-motion shortens durations and reduces amplitudes.
- Win flow plays the choreographed celebration in all six games; sticker reveal unchanged.
- Back, Replay, and Settings controls scale on press and restore on release/out; reduced-motion disables scale feedback.
- New unit tests cover the motion utility, transition configs (including reduced-motion), celebration boundedness/cleanup, and press feedback; all existing tests, coverage, formatting checks, and build pass.

## Out of Scope

- Hub idle life, tile press feedback, or sticker shelf changes (see `hub-engagement_20260801`)
- Per-game reaction animations (see `per-game-juice_20260801`)
- Mascot companion (see `mascot-companion_20260801`)
- New audio, new assets, SettingsPanel animation, gameplay rules, scoring
