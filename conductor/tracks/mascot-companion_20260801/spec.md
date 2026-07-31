# Specification: Mascot Companion

**Track ID:** `mascot-companion_20260801`
**Type:** Feature / Character & engagement

## Overview

Introduce "Professor Hoot" — a round owl in a tiny lab coat — as the friendly, encouraging teacher from the product guidelines, made visual. The mascot lives on the Hub (waves on load, cheers on newly-earned stickers) and appears in all six game scenes (cheers on correct, nods on incorrect, big cheer on win). All reactions are tween-based on two static SVG poses; no sprite sheets, no new audio.

## Functional Requirements

### 1. Mascot SVG assets

- Two new SVGs following the AI-generated SVG pipeline (512×512 viewBox, flat fills, thick `--outline` strokes, storybook style):
  - `mascot_idle.svg` — owl professor base pose (lab coat, round body, big eyes).
  - `mascot_celebrate.svg` — same owl with wings raised (celebration pose).
- Register both textures in PreloadScene (imported like all other SVGs, rasterized at 512×512).
- PWA precache picks them up automatically via the build.

### 2. Mascot component

- Create `src/components/Mascot.ts`:
  - `constructor(scene, x, y, scale)` — creates the idle image.
  - `wave()` — gentle wing/body sway (rotation yoyo), ~400ms.
  - `cheer()` — bounce (scale 1.1 yoyo) + small sparkle ring (Graphics, self-cleaning); switches to the celebrate pose briefly then back.
  - `nod()` — gentle rotate yoyo (no negative connotation; pairs with existing soft `playIncorrect` tone), ~300ms.
  - `idleLoop()` — slow bob (±3px y, 2.5s loop) with periodic squash-blink (scaleY dip, every ~4s).
  - `destroy()` — cleans up image, tweens, and graphics.
- Reduced-motion: no idle loop, minimal amplitudes (wave/nod only, no bounce).
- Reactions pair with existing SFX (`playCorrect`, `playIncorrect`, `playWin`, `playSticker`) — no new audio.

### 3. Hub integration

- Place mascot in a bottom corner at small scale (touch-inert, behind gameplay z-order).
- On Hub create: `wave()`.
- When scene data includes `justEarned` (from `hub-engagement_20260801`): `cheer()` + brief celebrate pose. If the flag is absent (track not yet implemented), mascot still waves — no hard dependency.

### 4. Game integration (all six scenes)

- Place mascot in a corner at small scale (non-interactive, does not block gameplay touch areas).
- Correct action → `cheer()`.
- Incorrect action → `nod()`.
- Round win → big `cheer()` + celebrate pose alongside the shared win celebration (from `cross-cutting-motion_20260801`).
- Mascot destroyed on scene shutdown.

## Non-Functional Requirements

- Two new SVG assets (~few KB each); precached for offline play.
- No new SFX or audio assets.
- 60fps; mascot animations are cheap tweens; no logic-file changes.
- Follow reduced-motion and no-fail principles.
- Follow Phaser 4, TypeScript, Vitest, Biome conventions; maintain coverage and build.

## Acceptance Criteria

- Mascot renders on the Hub and in all six game scenes.
- Distinct reactions: wave on Hub load, cheer on correct, nod on incorrect, big cheer on win, cheer on newly-earned sticker.
- Idle loop runs on the Hub; reduced-motion disables it.
- New SVGs load through PreloadScene and are included in the production build/precache.
- Tests cover component reactions, reduced-motion behavior, and per-scene wiring; full suite, coverage, formatting checks, and build pass.

## Out of Scope

- New SFX, voice, or music
- Sprite-sheet frame animations, mouth shapes, speech bubbles
- Mascot interactivity (tap reactions, dragging)
- Scoring, achievements, or gameplay changes
- Hub idle attract and sticker shelf (see `hub-engagement_20260801`)
