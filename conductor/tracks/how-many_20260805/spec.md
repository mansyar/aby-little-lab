# Spec — Game 11: "How Many?" (Counting & Numeral Recognition)

**Track:** `how-many_20260805` · **Type:** Feature · **Branch:** `feat/game-11`

## 1. Overview

Aby's Little Lab gains an 11th mini-game teaching **early numeracy** — counting sets of objects (1–10) and connecting spoken numerals to quantities. The child sees a large target numeral (spoken aloud via SpeechSynthesis) and 3–4 groups of objects; they count the objects in each group and tap the group matching the target. 6 rounds per playthrough, win on 6 correct.

## 2. Product Definition Amendment

Extends the existing "zero text dependency" amendment (Game 8): **numerals are learning content**, not UI instructions — the same principle already recorded in `product.md`/`PRD.md`/`TDD.md` for letters. All prompts remain visual/audio. Product docs gain the Game 11 row (milestone: *early numeracy — counting & number recognition*).

## 3. Functional Requirements

### FR-1 — Playthrough generation (`src/game/countLogic.ts`, pure functions)

- 6 rounds per playthrough in **3 progressive bands** (difficulty fixed across replays, per replay-variety principle):
  - Rounds 1–2: target counts from **1–3**, round shows **3 groups** (gentle start)
  - Rounds 3–4: target counts from **1–5**, round shows **4 groups**
  - Rounds 5–6: target counts from **1–10**, round shows **4 groups**
- Within a round: **all group counts are distinct** (a "no duplicate counts" guard, like the no-shared-first-letter guard in word games); exactly one group matches the target; positions shuffled.
- Each group uses **one existing item texture** (star, ball, apple, fish, carrot…), item types distinct across the round's groups and shuffled per playthrough — zero new object assets.

### FR-2 — Round flow (scene `HowManyScene.ts`, key `HowMany`)

- Target numeral shown large top-center (~256px, pop-in) **and spoken once** at round start.
- Group cards below: 2×2 grid (3 cards in band 1), each card ≥96px touch target showing N small item copies (~48px, loose grid) of one type.
- **Correct:** card flashes `--success` + chime (`playCorrect`) + mascot cheer + progress dot pops; next round after ~700ms.
- **Incorrect:** card wiggles ±4° + soft descending tone (`playIncorrect`) + mascot nod; **no penalty** — round stays, child retries.
- After 6 correct: shared win celebration (rays + confetti), sticker award (first time only, `{ justEarned: "how-many" }`), mascot big cheer, auto-return to Hub after 3s.
- Parental lock (hold 3s) exits to Hub at any time.

### FR-3 — Number audio via SpeechSynthesis (`src/utils/speech.ts`)

- `speakNumber(n)` speaks the number word ("three"), reusing the internal `speakText` (en-US, gentle rate ~0.9).
- **Respects the SFX toggle** — silent when SFX is off; **graceful fallback** — game fully playable visual-only when SpeechSynthesis is unavailable.

### FR-4 — Assets

- 10 numeral SVGs: `src/assets/svg/numbers/numeral_0.svg` … `numeral_9.svg` (512×512, flat `#2B6CB0` fill, thick `#2D3748` stroke — identical styling to the letter set so recognition is digit-shape only).
- `sticker_how_many.svg` — "3" with star sparkle on cream badge, matching existing sticker style.

### FR-5 — Integration

- `GameId` union + storage sticker key: `how-many` (existing per-key merge migration covers old saves automatically).
- `src/scenes/sceneRegistry.ts`: add `HowMany` lazy loader.
- `PreloadScene` loads the 11 new SVGs alongside existing assets.
- Hub grid grows **5×2 → 5×3** (11 tiles; `TILE_WIDTH` 160 unchanged — verify vertical fit of tiles/sticker shelf/play-time arc during implementation).
- Mascot reactions wired: cheer / nod / big-cheer.

## 4. Non-Functional Requirements

- Touch targets ≥96×96px; all animations via `motion.ts` (reduced-motion: shorter/gentler or disabled; TTS unaffected).
- Pure logic in `countLogic.ts` — fully unit-testable without Phaser; coverage target >80% (project currently ~98%).
- No new runtime dependencies (SpeechSynthesis is a platform API).

## 5. Acceptance Criteria

1. Playthroughs are 6 rounds in bands 1–3/1–5/1–10 (2 each); round counts always distinct with exactly one correct answer; win detected at 6 correct.
2. Tapping the correct group advances the round; wrong taps wiggle with no penalty or progression loss.
3. Target numeral displayed and spoken once at round start; silent when SFX disabled or API unavailable; visual play unaffected.
4. Win → shared celebration + sticker (first completion only) + auto-return; `justEarned` passed to Hub.
5. Hub shows 11 tiles; `ensureSceneLoaded` fires for `HowMany`; pre-existing saves load cleanly.
6. All quality gates pass (`pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`).

## 6. Out of Scope

- Counting beyond 10, counting down, skip counting, addition/subtraction, comparing quantities (more/less), numeral tracing/writing, per-number progress tracking, difficulty tiers, TTS voice selection UI, new object textures.
