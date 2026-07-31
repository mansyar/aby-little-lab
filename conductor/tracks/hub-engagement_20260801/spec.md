# Specification: Hub Engagement

**Track ID:** `hub-engagement_20260801`
**Type:** Feature / UX engagement

## Overview

Make the Hub — the first screen a child sees — feel alive and rewarding. Today it is a static grid of rectangles and text. This track adds a staggered entrance, gentle idle life, tactile tile press feedback, a real sticker shelf with newly-earned emphasis, and an idle-attract re-engagement behavior. No gameplay mechanics change; the Hub remains textless for the child.

## Functional Requirements

### 1. Staggered entrance

- On Hub create, tiles and the sticker shelf fade/scale in with a 40ms stagger between elements (300ms each, `Sine.out`).
- Under reduced-motion, elements simply fade in (no stagger distance or scale).

### 2. Idle life

- Tiles gently bob vertically (±4px, 2.5s sine loop, phase-offset per tile so they do not move in unison).
- Add a subtle decorative layer of a few low-contrast floating shapes/dots in the background (slow drift, 4–6s loops).
- Under reduced-motion, everything is static (no bob, no drift).

### 3. Tile press feedback

- Tiles scale to 0.95 on `pointerdown` and spring back with a slight overshoot on `pointerup`/`pointerout`/`pointercancel`.
- Under reduced-motion, no scale change.

### 4. Sticker shelf

- Replace the current ★/☆ text markers with real sticker thumbnails using the existing sticker SVG textures (already loaded by PreloadScene).
- Earned stickers: full alpha + gentle sparkle loop (soft scale/alpha shimmer).
- Unearned stickers: dimmed (low alpha) outline presentation so the collection goal is visible.
- Newly-earned emphasis: the six game scenes pass a `justEarned` game id via scene-start data on auto-return; the Hub gives that sticker a larger bounce + sparkle burst on entrance.
- Sticker shelf remains textless and touch-inert (no interaction required).

### 5. Idle attract

- After ~25s of no pointer input on the Hub, trigger a gentle attention cue: tiles wiggle (small rotation wobble, sequential) paired with a new soft two-tone `playIdleCall()` SFX synthesized in AudioManager.
- Repeats every ~10s while the Hub stays idle; resets on any pointer interaction.
- Timer must be cleared on scene shutdown; under reduced-motion, no wiggle (chime only).

## Non-Functional Requirements

- No new textures — reuse existing sticker SVGs.
- Maintain 60fps; tweens are cheap (6 tiles, 6 stickers, few decorations).
- Follow reduced-motion and no-fail UX principles.
- Follow Phaser 4, TypeScript, Vitest, Biome conventions.
- Maintain coverage thresholds and production build success.

## Acceptance Criteria

- Hub entrance staggers tiles and stickers; reduced-motion fades only.
- Tiles bob gently out of phase; background decorations drift slowly; reduced-motion static.
- Tiles give press feedback on tap-down/release; reduced-motion none.
- Sticker shelf shows real sticker art; earned vs unearned visually distinct; newly-earned sticker is highlighted on return from its game.
- Idle attract fires after ~25s idle with wiggle + `playIdleCall`, repeats every ~10s, resets on input, and cleans up on shutdown.
- New tests cover entrance stagger, idle loops, press feedback, shelf states, just-earned highlight, and idle timer; all existing tests, coverage, formatting checks, and build pass.

## Out of Scope

- Mascot companion (see `mascot-companion_20260801`)
- SettingsPanel animation or interaction changes
- Per-game reaction animations (see `per-game-juice_20260801`)
- Scene transitions and shared motion utilities (see `cross-cutting-motion_20260801`)
- New sticker art, gameplay rules, scoring, audio beyond `playIdleCall`
