# Specification — UI/UX Hardening (Consolidated Audit Remediation)

**Track ID:** `uiux-hardening_20260805`
**Type:** Feature
**Status:** New

## Overview

The product's interaction foundation is solid (touch ergonomics, no-fail feedback, reduced motion), but its visual identity layer under-delivers: the Hub is text-dependent for pre-readers, all text renders in Phaser's default Courier font, speech-driven games offer no re-listen, and parent settings are hard to read on phones. This track consolidates the UI/UX audit remediation into one shippable feature, including the high, medium, and low-priority findings.

## Functional Requirements

### F1 — Global Typography System

- F1.1 Bundle a rounded, child-friendly font (e.g. Baloo 2) as a local asset in `public/fonts/`, precached by the PWA (no network dependency offline).
- F1.2 Introduce a shared typography constant (font family + size presets) in a new `src/utils/typography.ts`, and apply the font family to every `Text` object in the codebase (Hub, Settings, all 11 scenes, toasts, back buttons, parental lock).
- F1.3 Replace the 🔄 emoji replay button in MusicalMemory with an SVG icon texture (see F3).
- F1.4 Replace the "Zzz" text in PopFreeze with an SVG sleep glyph.
- F1.5 AlphabetScene renders its target letter and answer cards using the preloaded `letter_*` SVG textures instead of system-font text (consistency with Word games).

### F2 — Hub Tile Iconography

- F2.1 Author 11 dedicated flat SVG tile icons (one per game), storybook-style (flat fills, 4-6px dark outlines, 512×512 viewBox) in `src/assets/svg/ui/tiles/`.
- F2.2 Each Hub tile displays its icon (e.g. 96px display) with the existing text label retained as a secondary element.
- F2.3 Unearned sticker state on the shelf becomes a dashed "empty slot" outline; earned state unchanged.

### F3 — Prompt Replay Affordance

- F3.1 Build one shared, textless "hear again" speaker button component (`src/components/SpeakerButton.ts`): SVG icon, ≥96×96 hit target, re-speaks the current round prompt, SFX-gated like speech.ts, reduced-motion aware.
- F3.2 Place the speaker button consistently in AlphabetScene, WordMatchScene, WordBuilderScene, and HowManyScene (adjacent to progress dots).
- F3.3 Also re-use it in MusicalMemory (replacing the emoji) so all five speech-driven games share one affordance.

### F4 — Hub Audio Resume & Parent Settings Readability

- F4.1 Resume the AudioContext on the **first pointerdown anywhere on the Hub** (currently only tile/settings/chip taps resume), fixing the silent idle-attract cue.
- F4.2 Increase Settings panel/overlay font sizes to ~30–36px for readability on phones.
- F4.3 Allow pinch-zoom while the Settings overlay is open only: temporarily relax `user-scalable`/`maximum-scale` while the panel is active, restore on close. (Phaser owns pointer input on the canvas, so zoom is safe only on the overlay.)

### F5 — Polish Items

- F5.1 Delay the win sticker animation ~400ms so it doesn't overlap the fading confetti/rays (or offset it slightly).
- F5.2 Scope the Hub idle-attract wiggle to 1–2 tiles instead of all 11 (phase-based selection).
- F5.3 Preload screen: add brand lockup ("Aby's Little Lab") + mascot wave alongside the progress bar.
- F5.4 Shadow Match objects: 96px → 112px display size (drop zone/layout recomputed).
- F5.5 Settings version footer: reposition so it no longer overlaps the install row.

## Non-Functional Requirements

- N1. All new assets follow the storybook flat rules: flat fills, thick dark outlines 4–6px, soft/vibrant palette, no pure RGB primaries.
- N2. All animations respect `prefers-reduced-motion` via `utils/motion.ts` (no new exceptions).
- N3. Touch targets: every new control ≥96×96px hit area (64px absolute minimum).
- N4. No regression: all existing tests pass, coverage stays ≥80%, `pnpm run check` clean, production build succeeds.
- N5. Font + new SVGs must be precached (fully offline after install); font file weight kept reasonable (subset if needed).
- N6. Zero text dependency for kid-facing gameplay: new affordances are icon-based, not text-based.

## Acceptance Criteria

- A1. Running the app, no Text object renders in Courier (spot-check Hub, Settings, Alphabet, Back buttons, toasts).
- A2. Hub shows 11 distinct, recognizable tile icons; text labels are secondary.
- A3. In Alphabet/WordMatch/WordBuilder/HowMany/MusicalMemory, tapping the speaker button re-speaks the prompt; works first-visit (after F4.1 resume).
- A4. Idle-attract call is audible on a fresh load with no prior interaction (after F4.1).
- A5. On a phone, Settings panel text is readable and pinch-zoom works while open, is disabled once closed.
- A6. Alphabet target + answer cards use SVG letters (visually identical to Word-game letters).
- A7. All polish items visible per F5 (no celebration overlap, subdued idle wiggle, branded preload, 112px shadow objects, no footer/install overlap).
- A8. `pnpm run check`, `CI=true pnpm test`, and `pnpm run build` all pass.

## Out of Scope

- No new mini-games, gameplay rule changes, or new game IDs.
- No changes to storage schema, profiles, or play-time logic.
- No per-game sound/music design changes (only resume + typography).
- No changes to the PWA install/update flow beyond font/assets precaching.
