# Spec — Game 14: "Odd One Out" (Visual Discrimination & Categorization)

**Track:** `odd-one-out_20260808` · **Type:** Feature · **Branch:** `feat/game-14`

## 1. Overview

Aby's Little Lab gains a 14th mini-game teaching **visual discrimination and categorization**. Each round shows a 2×2 grid of four cards — three alike and one different; a spoken word tells the child what to find, and they tap the odd one out. 6 rounds per playthrough, win on 6 correct.

## 2. Product Definition Amendment

Extends the existing "zero text dependency" amendments (Games 8/11/12/13): **category, type, and color differences are learning content**, not UI instructions — the TTS prompt keeps the game fully playable without reading anything. Product docs gain the Game 14 row (milestone: *visual discrimination — odd one out*). Hub grid remains 5×3 (14 tiles — rows 5/5/4).

## 3. Functional Requirements

### FR-1 — Playthrough generation (`src/game/oddOneOutLogic.ts`, pure functions)

- 6 rounds per playthrough in **3 progressive bands** (difficulty fixed across replays, per replay-variety principle):
  - Rounds 1–2 (**easy**): odd one is a **different category** — 3 cards of one category + 1 of another (animal / toy / shape mix).
  - Rounds 3–4 (**mid**): same category, **different type** — 3 cards of one item + 1 card of a different item in the same category (e.g., 3 cats + 1 dog; 3 stars + 1 circle; 3 cars + 1 rocket).
  - Rounds 5–6 (**hard**): same item, **different color attribute** — the 3 color frog variants (e.g., 3 green frogs + 1 blue frog).
- Each round has **exactly 4 cards** (2×2 grid): 3 identical textures (the "group") + 1 distinct texture (the odd one). No two cards may share the odd texture within a round; the group texture never equals the odd texture.
- Odd item's **texture key is unique per playthrough** (no odd item repeats across the 6 rounds) — guarantees variety while the group item may repeat (a 3-frog group appears in hard rounds regardless).
- Reuses **existing textures only**: `animal_*` (cat, dog, elephant, monkey, pig, rabbit), `frog_green`/`frog_blue`/`frog_red`, `toy_*` (teddy_bear, car, rocket, drum, ball, block), `shape_*` (circle, square, triangle, star, heart, crescent, diamond, hexagon, octagon, oval, pentagon, plus, rectangle, ring, semicircle, teardrop, trapezoid, arrow). Zero new object art.
- Export a `buildPlaythrough(rng)` generator (band-aware) + `pickOddOne(cards)` + `isCorrect(cards, selectedIndex)` helpers, mirroring `moreLessLogic.ts` purity.

### FR-2 — Round flow (scene `OddOneOutScene.ts`, key `OddOneOut`)

- **2×2 grid** centered (card ~256×256 display, ≥96×96 touch targets with generous hit areas, spacing matching ShadowMatch's grid pattern).
- Round start: odd item's **name spoken once** via TTS (see FR-3).
- **Correct:** tapped card flashes `--success` + chime (`playCorrect`) + mascot cheer + progress dot pops; next round after ~700ms (NEXT_ROUND_DELAY from `GameSceneBase`).
- **Incorrect:** tapped card wiggles ±4° + soft descending tone (`playIncorrect`) + mascot nod; **no penalty** — round stays, child retries.
- After 6 correct: shared win celebration (rays + confetti), sticker award (first time only, `{ justEarned: "odd-one-out" }`), mascot big cheer, auto-return to Hub after 3s.
- Parental lock (hold 3s) exits to Hub at any time; back button via `GameSceneBase.createBackButton`.
- Progress dots (6), corner mascot, speaker button, shutdown cleanup — all inherited from `GameSceneBase`.

### FR-3 — Prompt audio via SpeechSynthesis (`src/utils/speech.ts`)

- Reuses existing `speakWord()` (en-US, rate 0.8) with the odd item's **name** — e.g., "ball", "star", "dog", "blue frog" (hard band uses color + name to disambiguate the frog variants). **No new speech API.**
- Respects the SFX toggle (silent when off); graceful fallback — game fully playable visual-only when SpeechSynthesis is unavailable.
- Speaker button re-hears the prompt on demand; guarded during the win celebration (no speech while input locked).

### FR-4 — Assets (2 new SVGs, storybook style)

- `tile_odd_one_out.svg` — Hub tile icon: 2×2 mini-cards, one visually distinct (arrow/spotlight), flat fills, thick `#2D3748` outline, soft vibrant colors per `docs/SVG_STYLE.md`.
- `sticker_odd_one_out.svg` — completion sticker (cream badge, 2×2 mini-cards with one highlighted).
- Preload SVG count 148 → 150.

### FR-5 — Integration

- `GameId` union + storage sticker key: `odd-one-out` (existing per-key merge migration covers old saves automatically; `GAME_IDS` in `profileLogic.ts` backfills the new key).
- `src/scenes/sceneRegistry.ts`: add `OddOneOut` lazy loader.
- `PreloadScene` loads the 2 new SVGs alongside existing assets.
- Hub `GAME_TILES` gains the 14th tile (sceneKey `OddOneOut`, gameId `odd-one-out`, tileKey `tile_odd_one_out`; iconDisplay/iconOffsetY per tile-icon rules) — grid fills to 5×3 with row 3 at 4 tiles; verify sticker shelf / play-time arc still fit.
- Mascot reactions wired: cheer / nod / big-cheer.

## 4. Non-Functional Requirements

- Touch targets ≥96×96px; all animations via `motion.ts` (reduced-motion: shorter/gentler or disabled; TTS unaffected).
- Pure logic in `oddOneOutLogic.ts` — fully unit-testable without Phaser; coverage target >80% (project currently ~98%).
- No new runtime dependencies (SpeechSynthesis is a platform API).

## 5. Acceptance Criteria

1. Playthroughs are 6 rounds in bands easy/mid/hard (2 each); each round has exactly 3 identical + 1 distinct card; odd texture unique per playthrough; win detected at 6 correct.
2. Tapping the odd card advances the round; wrong taps wiggle with no penalty or progression loss.
3. Odd item's name spoken once at round start; silent when SFX disabled or API unavailable; visual play unaffected; speaker button replays.
4. Win → shared celebration + sticker (first completion only) + auto-return; `justEarned` passed to Hub.
5. Hub shows 14 tiles (5×3, row 3 left-aligned at 4 tiles); `ensureSceneLoaded` fires for `OddOneOut`; pre-existing saves load cleanly.
6. All quality gates pass (`pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`).

## 6. Out of Scope

- New object textures, 5+ card layouts, timed modes, identical-card "trick" rounds, multi-odd rounds, per-band difficulty selection, TTS voice selection UI, shape color variants beyond the 3 frogs, leaderboards or scores.
