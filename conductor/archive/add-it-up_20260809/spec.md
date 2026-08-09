# Spec — Game 16: "Add It Up" (Early Addition)

**Track:** `add-it-up_20260809` · **Type:** Feature · **Branch:** `feat/game-16`

## 1. Overview

Aby's Little Lab gains a 16th mini-game teaching **early addition within 10**. Each round shows two
dot-group cards joined by a big "+" cue; the child counts the dots and taps the answer card (of 4)
whose dot-group matches the total. 6 rounds per playthrough, win on 6 correct. Hub grid grows to
16 tiles (5×3 + 1, row 4 left-aligned).

## 2. Product Definition Amendment

- Games target extends **15 → 16**; Hub grid becomes 5×3 + 1 (rows 5/5/5/1 — one tile on row 4).
- Extends the "zero text dependency" amendments: **dot-counting addition is the learning content** —
  the game is fully playable without reading anything (answer cards are dot-groups, not numerals).
  Product docs gain the Game 16 row (milestone: *early arithmetic — addition within 10*).

## 3. Functional Requirements

### FR-1 — Playthrough generation (`src/game/addItUpLogic.ts`, pure functions)

- 6 rounds per playthrough in **3 progressive bands** (difficulty fixed across replays, per replay-variety principle):
  - Rounds 1–2 (**easy**): sums ≤ 4 (addends ≥ 1, so sums 2–4).
  - Rounds 3–4 (**mid**): sums ≤ 6.
  - Rounds 5–6 (**hard**): sums ≤ 10.
- Each round draws an **addend pair (a, b)** with a+b = target; addends ≥ 1; **no (a,b) pair repeats**
  across a playthrough (order-insensitive).
- Each round has **exactly 4 answer cards with distinct totals** (1–bandMax), exactly one equal to the
  target; distractors drawn from [1..bandMax] excluding the target, all distinct.
- Dot-groups: addend cards use **two distinct item types** (so the two groups read as separate addends);
  the 4 answer cards share one item type within a round. Reuses the existing counting-item texture set
  from How Many? / More or Less (items ~48px, partial last rows centered).
- Export `buildPlaythrough(rng)` (band-aware) + `buildRound(band, rng)` + `isCorrect(selectedIndex, options, target)`
  helpers, mirroring `colorMatchLogic.ts` / `moreLessLogic.ts` purity.

### FR-2 — Round flow (scene `AddItUpScene.ts`, key `AddItUp`)

- **Prompt:** two addend dot-group cards side by side (~180×180 display) with a large "+" between them
  and an "=" before the answer row; all cards ≥96×96 touch targets.
- **Answer:** 4 dot-group cards in a centered row (4 × ~150×150 + gaps fits 1024×768).
- **Correct:** tapped card flashes `--success` + chime (`playCorrect`) + mascot cheer + progress dot pops;
  next round after ~700ms (`NEXT_ROUND_DELAY` from `GameSceneBase`).
- **Incorrect:** tapped card wiggles ±4° + soft descending tone (`playIncorrect`) + mascot nod;
  **no penalty** — round stays, child retries.
- After 6 correct: shared win celebration (rays + confetti), sticker award (first time only,
  `{ justEarned: "add-it-up" }`), mascot big cheer, auto-return to Hub after 3s.
- Parental lock (hold 3s) exits to Hub at any time; back button via `GameSceneBase.createBackButton`.
- Progress dots (6), corner mascot, shutdown cleanup — all inherited from `GameSceneBase`.
- **No prompt audio** (visual counting only — mirrors speechless games like Shape Sorter / Pattern Builder).

### FR-3 — Assets (4 new SVGs, storybook style)

- `tile_add_it_up.svg` — Hub tile icon: two small dot cards joined by a big "+", answer card highlighted,
  flat fills, thick `#2D3748` outline, soft vibrant colors per `docs/SVG_STYLE.md`.
- `sticker_add_it_up.svg` — completion sticker (cream badge, dot cards with "+" and "=").
- `plus.svg` + `equals.svg` — chunky symbol cues for the prompt area.
- Preload SVG count 152 → 156.

### FR-4 — Integration

- `GameId` union + storage sticker key: `add-it-up` (existing per-key merge migration covers old saves
  automatically; `GAME_IDS` in `profileLogic.ts` backfills the new key).
- `src/scenes/sceneRegistry.ts`: add `AddItUp` lazy loader (16th).
- `PreloadScene` loads the 4 new SVGs alongside existing assets.
- Hub `GAME_TILES` gains the 16th tile (sceneKey `AddItUp`, gameId `add-it-up`, tileKey `tile_add_it_up`;
  iconDisplay/iconOffsetY per tile-icon rules) — grid becomes 5×3 + 1 (row 4: 1 tile left-aligned);
  verify sticker shelf / play-time arc still fit.
- Mascot reactions wired: cheer / nod / big-cheer. Correct/wrong taps flow into per-profile progress
  automatically (progress insights show accuracy, not dash).

## 4. Non-Functional Requirements

- Touch targets ≥96×96px; all animations via `motion.ts` (reduced-motion: shorter/gentler or disabled).
- Pure logic in `addItUpLogic.ts` — fully unit-testable without Phaser; coverage target >80% (project currently ~98%).
- No new runtime dependencies (existing textures, no speech).

## 5. Acceptance Criteria

1. Playthroughs are 6 rounds in bands easy (≤4) / mid (≤6) / hard (≤10) (2 each); each round has 2 addend
   cards with distinct item types + 4 answer cards with distinct totals; no addend-pair repeats; win detected at 6 correct.
2. Tapping the matching total card advances the round; wrong taps wiggle with no penalty or progression loss.
3. Win → shared celebration + sticker (first completion only) + auto-return; `justEarned` passed to Hub.
4. Hub shows 16 tiles (5×3 + 1, row 4 single tile left-aligned, no clipping); `ensureSceneLoaded` fires for
   `AddItUp`; pre-existing saves load cleanly.
5. Correct/wrong taps recorded into per-profile progress (plays + accuracy in Learning Progress).
6. All quality gates pass (`pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`).

## 6. Out of Scope

- Subtraction, addend 0, sums > 10, numeral answer cards, typed/constructed answers, spoken equation
  reinforcement, timed modes, 2×2 answer grids, per-band difficulty selection, new object textures,
  leaderboards or scores.
