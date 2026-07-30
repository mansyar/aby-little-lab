<protect>
# Track: Musical Memory Simon Mini-Game

**Track ID:** `musical-memory_20260729`
**Type:** Feature
**Status:** New
**Created:** 2026-07-29

## Overview

Implement Game 5 — Musical Memory Simon, the fifth playable mini-game for Aby's Little Lab. A toddler (ages 3-5) repeats growing note sequences tapped on 3 frogs (C4/E4/G4), exercising working memory and auditory recall. This track introduces a new interaction paradigm (sequence-memory: input locking, growing sequences, on-demand replay) distinct from the drag-and-drop games. It reuses the existing `AudioManager.playFrogNote(frequency)` method — already implemented in the foundation track — for frog notes, and existing synthesized SFX (correct, incorrect, win, sticker) for round/win/sticker feedback.

## Scope

### In Scope

1. **Frog & lily pad assets** — 3 frog SVGs (green/blue/red) at 512×512 viewBox, storybook flat style with thick dark outlines + soft/vibrant fills. 1 lily pad SVG. 1 sticker SVG.
2. **PreloadScene SVG loading** — load and rasterize the 3 frog SVGs and the lily pad SVG at high resolution.
3. **MusicalMemoryScene gameplay** — 3 frogs on lily pads; sequence grows from 2 notes; child repeats the sequence by tapping frogs.
4. **Sequence-memory interaction** — sequence auto-plays at round start (input locked); child taps frogs to repeat; a replay button re-plays the current sequence on demand.
5. **Round progression** — start at length 2; +1 note per successful round; win at length 6 (5 rounds).
6. **Mistake handling** — wrong tap plays a gentle incorrect tone, re-plays the sequence, and retries the same round (no progress lost; no-fail design).
7. **Progress indicator** — 5 round dots fill as rounds complete (matching Animal Trace's progress pattern).
8. **Completion flow** — reach length 6 → win animation → sticker award (first time only) → auto-return to Hub after 3s.
9. **Tests** — unit tests for pure game logic (sequence generation, round progression, input validation, win detection) + integration tests for scene flow.

### Out of Scope

- Other mini-games (Games 1-4 done; Game 6 remains a stub).
- New AudioManager methods (`playFrogNote` already exists; correct/incorrect/win/sticker reused as-is).
- BGM changes (existing handling reused).
- Sticker book visual polish on Hub (basic display exists from foundation).
- PWA deployment.
- Difficulty scaling beyond fixed length-2-start / length-6-win.
- Multiple difficulty levels or timed mode (no timer; no-fail design).

## Functional Requirements

### FR1 — Asset Pipeline
- **FR1.1:** Create 3 frog SVGs in `src/assets/svg/animals/`: `frog_green.svg`, `frog_blue.svg`, `frog_red.svg` (512×512 viewBox, flat fills, thick #2D3748 outlines 4-6px, storybook style; green=#48BB78, blue=#3182CE, red=#E53E3E). Each frog clearly distinct by color.
- **FR1.2:** Create a lily pad SVG in `src/assets/svg/items/`: `lilypad.svg` (512×512, flat green pad that sits beneath each frog).
- **FR1.3:** Extend PreloadScene to load and rasterize the 3 frog SVGs + lily pad SVG with explicit width/height for high-res rasterization.
- **FR1.4:** Create a `musical-memory` sticker SVG (`src/assets/svg/stickers/sticker_musical_memory.svg`).

### FR2 — Round Initialization
- **FR2.1:** On scene create, initialize round state: current sequence (`number[]` of frog indices 0-2), start length 2, win target length 6, input index 0, progress dots (5, all empty).
- **FR2.2:** Generate a random sequence of frog indices (each note randomly one of 3 frogs). Sequence grows by appending one random index per successful round.
- **FR2.3:** Round count and progress dots initialize to 0 / empty.

### FR3 — Sequence Playback
- **FR3.1:** At round start, auto-play the current sequence: each frog in sequence order scales up + glows + plays its note (`playFrogNote` with C4/E4/G4), with a timed delay between notes. Input is locked during playback.
- **FR3.2:** A replay button is visible during the child's turn; tapping it re-plays the current sequence (input locked during replay).
- **FR3.3:** After sequence playback completes, unlock input for the child's turn.

### FR4 — Child Input & Validation
- **FR4.1:** Child taps frogs to repeat the sequence. Each tap scales up the frog + plays its note + registers the input at the current index.
- **FR4.2:** Validate each tap against the sequence at the current index. On correct: advance the index. On completing the full sequence correctly: round success.
- **FR4.3:** On wrong tap: play incorrect SFX (soft descending tone), re-play the current sequence (auto), reset input index, retry same round. No progress lost (round count unchanged).
- **FR4.4:** Touch targets ≥ 64×64px (ideal 96×96px); frogs sized/laid out for easy tapping.
- **FR4.5:** Input ignored during sequence playback / replay (locked).

### FR5 — Round Progression
- **FR5.1:** On round success: fill the next progress dot. If the just-completed sequence was length 6 → trigger completion (win). Otherwise grow the sequence by 1 (append a random frog index) and start the next round (auto-play).

### FR6 — Feedback & Audio
- **FR6.1:** Frog notes via existing `AudioManager.playFrogNote(frequency)`: green=C4 (261.63Hz), blue=E4 (329.63Hz), red=G4 (392.00Hz). No new AudioManager methods.
- **FR6.2:** Reuse existing synthesized SFX: correct (ascending chime) on round success, incorrect (soft descending tone) on wrong tap, win (celebratory arpeggio) on completion, sticker (sparkle) on first completion.
- **FR6.3:** Respect the SFX toggle (no sound when `sfxEnabled` is false).
- **FR6.4:** Gentle, non-penalizing audio; no harsh sounds. No-fail design.

### FR7 — Completion & Sticker
- **FR7.1:** Detect completion when the length-6 sequence is completed correctly.
- **FR7.2:** On completion: play win animation + win SFX.
- **FR7.3:** If first completion (`hasSticker === false`): award sticker via `storage.earnSticker("musical-memory")`, play sticker SFX + sticker unlock animation.
- **FR7.4:** After 3s delay, auto-return to Hub scene.
- **FR7.5:** Parental lock (hold 3s) exits to Hub at any time (exists in stub).

## Non-Functional Requirements

- **NFR1:** 60fps during animations (min 30fps).
- **NFR2:** Touch latency < 16ms.
- **NFR3:** All tests pass with >80% coverage on new code.
- **NFR4:** Biome lint/format check passes (`pnpm run check`).
- **NFR5:** Production build succeeds (`pnpm run build`).
- **NFR6:** Accessibility — frogs are distinguished by color AND position AND note (not color-only); gentle animations respecting `prefers-reduced-motion`; no-fail design (no penalties for wrong taps).

## Key Technical Decisions

1. **Sequence-memory paradigm** — new interaction type (input locking, growing sequence, on-demand replay); distinct from the drag-and-drop games.
2. **Reuse existing `AudioManager.playFrogNote(frequency)`** — already implemented in foundation; no new audio methods needed. Frog notes: C4/E4/G4.
3. **Reuse existing synthesized SFX** (correct, incorrect, win, sticker) — no new AudioManager work.
4. **Auto-play sequence at round start + replay button** for on-demand re-listening (per user decision).
5. **Win at length 6 (5 rounds)** — balanced challenge for ages 3-5.
6. **No-fail design** — wrong tap replays the sequence and retries the same round; no progress lost.
7. **Progress dots (5)** — matches Animal Trace's progress indicator pattern.
8. **Pure game logic in `src/game/musicalMemoryLogic.ts`** (sequence generation, round progression, input validation, win detection) — testable without Phaser.
9. **Frogs distinguished by color + position + note** — accessible (not color-only differentiation).

## Acceptance Criteria

- [ ] `pnpm dev` loads the game; tapping the Musical Memory tile enters the game.
- [ ] 3 frogs on lily pads appear on-screen.
- [ ] Sequence auto-plays at round start (frogs scale up + play notes), starting at length 2.
- [ ] Tapping frogs in the correct order advances; completing the sequence advances to the next round (sequence grows by 1, progress dot fills).
- [ ] Tapping the wrong frog plays a gentle tone, replays the sequence, and retries the same round with no progress lost.
- [ ] A replay button re-plays the current sequence on demand.
- [ ] Reaching sequence length 6 triggers win animation + sticker award (first time) + auto-return to Hub after 3s.
- [ ] Replaying does not re-award the sticker.
- [ ] SFX toggle off silences frog notes and SFX.
- [ ] `CI=true pnpm test` passes with >80% coverage on new code.
- [ ] `pnpm run check` and `pnpm run build` pass.
</protect>
