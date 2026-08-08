# Spec — Game 15: "Color Match" (Color Recognition)

**Track:** `color-match_20260808` · **Type:** Feature · **Branch:** `feat/game-15`

## 1. Overview

Aby's Little Lab gains a 15th mini-game teaching **color recognition**. Each round shows a large color swatch with its name spoken aloud; the child taps the matching colored object among 4 cards. 6 rounds per playthrough, win on 6 correct. This completes the Hub grid to a full 5×3 (rows 5/5/5).

## 2. Product Definition Amendment

- Games target extends **14 → 15**; Hub grid becomes fully populated (5×3, rows 5/5/5 — no empty slot).
- Extends the "zero text dependency" amendments: **color names are learning content**, not UI instructions — the TTS prompt + visual swatch keep the game fully playable without reading anything. Product docs gain the Game 15 row (milestone: *color recognition*).

## 3. Functional Requirements

### FR-1 — Playthrough generation (`src/game/colorMatchLogic.ts`, pure functions)

- 6 rounds per playthrough in **2 progressive bands** (difficulty fixed across replays, per replay-variety principle):
  - Rounds 1–3 (**easy**): 3-color pool — red, blue, yellow.
  - Rounds 4–6 (**hard**): 6-color pool — red, blue, yellow, green, orange, purple.
- Each round has **exactly 4 cards, all distinct colors** (sampled from the band's pool, shuffled); the **target** is one of the sampled colors; the prompt is the target color's swatch. No two cards share a color within a round.
- **Color → texture mapping** (reuses existing textures only; swatch hexes MUST equal the source SVG fills so the child matches by eye):
  - red → `shape_heart` (#E53E3E) · blue → `frog_blue` · yellow → `shape_crescent` (#ECC94B)
  - green → `shape_rectangle` (#48BB78) · orange → `shape_circle` (#F6AD55) · purple → `shape_square` (#9F7AEA)
- Export a `buildPlaythrough(rng)` generator (band-aware) + `buildRound(colorPool, rng)` + `isCorrect(cards, selectedIndex, targetColor)` helpers, mirroring `moreLessLogic.ts` / `oddOneOutLogic.ts` purity.

### FR-2 — Round flow (scene `ColorMatchScene.ts`, key `ColorMatch`)

- **Prompt:** large color swatch (runtime Graphics rounded rect, ~180px, thick `#2D3748` outline) top-center; target color's name spoken once (see FR-3).
- **Answer:** 4 cards in a **2×2 grid** centered (card ~256×256 display, ≥96×96 touch targets with generous hit areas, spacing matching ShadowMatch's grid pattern).
- **Correct:** tapped card flashes `--success` + chime (`playCorrect`) + mascot cheer + progress dot pops; next round after ~700ms (`NEXT_ROUND_DELAY` from `GameSceneBase`).
- **Incorrect:** tapped card wiggles ±4° + soft descending tone (`playIncorrect`) + mascot nod; **no penalty** — round stays, child retries.
- After 6 correct: shared win celebration (rays + confetti), sticker award (first time only, `{ justEarned: "color-match" }`), mascot big cheer, auto-return to Hub after 3s.
- Parental lock (hold 3s) exits to Hub at any time; back button via `GameSceneBase.createBackButton`.
- Progress dots (6), corner mascot, speaker button, shutdown cleanup — all inherited from `GameSceneBase`.

### FR-3 — Prompt audio via SpeechSynthesis (`src/utils/speech.ts`)

- Reuses existing `speakText()` (en-US, rate 0.8) with the color name — e.g., "red", "blue", "yellow", "green", "orange", "purple". **No new speech API.**
- Respects the SFX toggle (silent when off); graceful fallback — game fully playable visual-only when SpeechSynthesis is unavailable.
- Speaker button re-hears the prompt on demand; guarded during the win celebration (no speech while input locked).

### FR-4 — Assets (2 new SVGs, storybook style)

- `tile_color_match.svg` — Hub tile icon: color swatch cards with one highlighted, flat fills, thick `#2D3748` outline, soft vibrant colors per `docs/SVG_STYLE.md`.
- `sticker_color_match.svg` — completion sticker (cream badge, color swatches with one highlighted).
- Preload SVG count 150 → 152.

### FR-5 — Integration

- `GameId` union + storage sticker key: `color-match` (existing per-key merge migration covers old saves automatically; `GAME_IDS` in `profileLogic.ts` backfills the new key).
- `src/scenes/sceneRegistry.ts`: add `ColorMatch` lazy loader (15th).
- `PreloadScene` loads the 2 new SVGs alongside existing assets.
- Hub `GAME_TILES` gains the 15th tile (sceneKey `ColorMatch`, gameId `color-match`, tileKey `tile_color_match`; iconDisplay/iconOffsetY per tile-icon rules) — **grid completes to 5×3 with rows 5/5/5**; verify sticker shelf / play-time arc still fit.
- Mascot reactions wired: cheer / nod / big-cheer.

## 4. Non-Functional Requirements

- Touch targets ≥96×96px; all animations via `motion.ts` (reduced-motion: shorter/gentler or disabled; TTS unaffected).
- Pure logic in `colorMatchLogic.ts` — fully unit-testable without Phaser; coverage target >80% (project currently ~98%).
- No new runtime dependencies (Graphics + SpeechSynthesis are platform APIs).

## 5. Acceptance Criteria

1. Playthroughs are 6 rounds in bands easy (3 colors) / hard (6 colors) (3 each); each round has exactly 4 distinct-color cards; target color matches the swatch; win detected at 6 correct.
2. Tapping the matching card advances the round; wrong taps wiggle with no penalty or progression loss.
3. Color name spoken once at round start; silent when SFX disabled or API unavailable; visual play unaffected; speaker button replays.
4. Win → shared celebration + sticker (first completion only) + auto-return; `justEarned` passed to Hub.
5. Hub shows 15 tiles (5×3, rows 5/5/5, grid fully populated); `ensureSceneLoaded` fires for `ColorMatch`; pre-existing saves load cleanly.
6. All quality gates pass (`pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`).

## 6. Out of Scope

- New object textures, drag interactions, timed modes, color mixing, shape+color combined prompts, pools beyond 6 colors, per-band difficulty selection, TTS voice selection UI, leaderboards or scores.
