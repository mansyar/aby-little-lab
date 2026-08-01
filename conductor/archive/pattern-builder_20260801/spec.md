# Specification — Game 7: Pattern Builder

## Overview

A pattern-completion mini-game for ages 3–5. A row of 4 shapes follows a repeating pattern (ABAB, AABB, or ABB) with one missing piece; the child taps the matching shape from 3 answer cards. Targets **logical reasoning & pattern recognition** — the unclaimed milestone in the suite. This becomes the **official 7th game**: product docs (product.md, PRD.md, TDD.md, tech-stack.md, README.md) are updated from 6 to 7 games.

## Functional Requirements

### FR1 — Pattern generation (pure logic module `game/patternBuilderLogic.ts`)

- FR1.1 Generate a round: pattern type (ABAB, AABB, or ABB), gap position (end or middle — random), shape pair drawn from the 6-shape pool (circle, square, triangle, star, heart, crescent).
- FR1.2 Row length 4 (gap + 3 visible shapes). Pattern elements are always **two distinct shapes**.
- FR1.3 Answer choices: 3 unique cards — the correct shape + 2 distinct distractors.
- FR1.4 Replay variety: pattern types, shape pairs, gap positions, and distractor sets all shuffle per playthrough; difficulty stays fixed.

### FR2 — Gameplay

- FR2.1 Scene renders 4 slots (3 filled + 1 marked empty gap) and 3 answer cards below.
- FR2.2 Correct tap → shape snaps into the gap with a `Back.out` settle, chime plays, progress dot fills, next round after a short delay.
- FR2.3 Incorrect tap → the tapped card wiggles gently ("try again"), soft incorrect tone, no penalty, no progression loss.
- FR2.4 5 rounds per playthrough → shared win celebration, sticker award (first completion only), auto-return to Hub after 3s.
- FR2.5 Parental-lock Back button (hold 3s, 96×96 hit area); answer cards ≥ 64×64px (96px ideal); single-finger tap only.
- FR2.6 Zero text — shapes only (textless per product rule).

### FR3 — Cross-cutting integration

- FR3.1 Hub tile #7 with label + sticker shelf slot (one new asset: `sticker_pattern_builder.svg`).
- FR3.2 Sticker persisted in localStorage under game id `pattern-builder`.
- FR3.3 Professor Hoot in the scene: cheers on correct, nods on incorrect, big cheer on win — reduced-motion aware.
- FR3.4 Shared scene transitions, completion effect, and press feedback with reduced-motion variants.
- FR3.5 Game id `pattern-builder` registered in types, Hub config, and storage docs.

### FR4 — Docs & housekeeping

- FR4.1 Update product.md, PRD.md, TDD.md, tech-stack.md (scenes 8→9, game IDs), README.md, and release-checklist references ("six" → "seven") to reflect the official 7th game.

## Non-Functional Requirements

- NFR1: New logic modules meet the project's coverage threshold (>80%); Biome clean.
- NFR2: No new assets except the sticker SVG.
- NFR3: 60fps, touch latency < 16ms, Graphics-based effects only (no particle emitters).

## Acceptance Criteria

- AC1: Generated rounds are valid ABAB/AABB/ABB with exactly one gap (end or middle) and the correct answer among 3 unique choices.
- AC2: Completing 5 rounds awards the `pattern-builder` sticker on first completion only; persists across sessions.
- AC3: Correct tap snaps into the gap with animation + chime; incorrect tap wiggles with no penalty.
- AC4: Hub shows 7 tiles and 7 sticker slots.
- AC5: Reduced motion: gentler/shorter tweens, no loops; game fully playable.
- AC6: All tests pass, coverage ≥ 80%, `pnpm run check` clean, production build succeeds.
- AC7: Docs consistently describe 7 games.

## Out of Scope

- No new shape items (reuse the existing 6).
- No difficulty progression, timers, scoring, or fail states.
- No new audio files.
- No changes to the other six games' logic.
