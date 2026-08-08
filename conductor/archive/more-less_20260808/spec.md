# Spec — Game 13: "More or Less" (Quantity Comparison)

**Track:** `more-less_20260808` · **Type:** Feature · **Branch:** `feat/game-13`

## 1. Overview

Aby's Little Lab gains a 13th mini-game teaching **early numeracy — quantity comparison**. Each round shows two groups of objects; a large arrow cue (up = MORE, down = LESS) plus a spoken word tells the child what to find, and they tap the group with more/fewer objects. 6 rounds per playthrough, win on 6 correct.

## 2. Product Definition Amendment

Extends the existing "zero text dependency" amendments (Games 8/11/12): **quantities and the comparison concepts are learning content**, not UI instructions — the arrow cue + TTS keep the game fully playable without reading anything. Product docs gain the Game 13 row (milestone: *early numeracy — quantity comparison*).

## 3. Functional Requirements

### FR-1 — Playthrough generation (`src/game/moreLessLogic.ts`, pure functions)

- 6 rounds per playthrough in **3 progressive bands** (difficulty fixed across replays, per replay-variety principle):
  - Rounds 1–2: counts from **1–3**
  - Rounds 3–4: counts from **1–5**
  - Rounds 5–6: counts from **1–10**
- Each round shows **exactly 2 groups with distinct counts** (a "no duplicate counts" guard like How Many; exactly one group satisfies the comparison).
- Comparison mode per round: `more` | `less` — **exactly 3 of each per playthrough**, positions shuffled (guaranteed variety, no mode runs).
- Each group uses **one existing `COUNT_ITEMS` texture** (star, ball, apple, fish, carrot, sun, house, duck), item types distinct across the round's two cards — zero new object assets.

### FR-2 — Round flow (scene `MoreLessScene.ts`, key `MoreLess`)

- Round start: **large arrow cue top-center** (~256px, pop-in) — up-arrow = "more", down-arrow = "less" — **spoken once** via TTS.
- **Two group cards** side by side (each ≥96px touch target, N small item copies ~48px loose grid).
- **Correct:** card flashes `--success` + chime (`playCorrect`) + mascot cheer + progress dot pops; next round after ~700ms.
- **Incorrect:** card wiggles ±4° + soft descending tone (`playIncorrect`) + mascot nod; **no penalty** — round stays, child retries.
- After 6 correct: shared win celebration (rays + confetti), sticker award (first time only, `{ justEarned: "more-less" }`), mascot big cheer, auto-return to Hub after 3s.
- Parental lock (hold 3s) exits to Hub at any time.

### FR-3 — Prompt audio via SpeechSynthesis (`src/utils/speech.ts`)

- Reuses existing `speakWord("more"/"less")` (en-US, rate 0.8) — **no new speech API**. Respects the SFX toggle (silent when off); graceful fallback — game fully playable visual-only when SpeechSynthesis is unavailable.

### FR-4 — Assets (4 new SVGs, storybook style)

- `src/assets/svg/ui/arrow_up.svg` + `arrow_down.svg` (512×512, flat fills, thick `#2D3748` outline, soft vibrant color — consistent with the existing ui set).
- `tile_more_less.svg` — Hub tile icon (two dot-groups with arrow).
- `sticker_more_less.svg` — completion sticker (cream badge, two groups + arrow).

### FR-5 — Integration

- `GameId` union + storage sticker key: `more-less` (existing per-key merge migration covers old saves automatically; `GAME_IDS` in `profileLogic.ts` backfills the new key).
- `src/scenes/sceneRegistry.ts`: add `MoreLess` lazy loader.
- `PreloadScene` loads the 4 new SVGs alongside existing assets (preload SVG count 144 → 148).
- Hub grid stays **5×3** (13 tiles — rows 5/5/3; row 3 gains More or Less; verify fill logic left-aligns the 3 tiles and sticker shelf / play-time arc still fit).
- Mascot reactions wired: cheer / nod / big-cheer.

## 4. Non-Functional Requirements

- Touch targets ≥96×96px; all animations via `motion.ts` (reduced-motion: shorter/gentler or disabled; TTS unaffected).
- Pure logic in `moreLessLogic.ts` — fully unit-testable without Phaser; coverage target >80% (project currently ~98%).
- No new runtime dependencies (SpeechSynthesis is a platform API).

## 5. Acceptance Criteria

1. Playthroughs are 6 rounds in bands 1–3/1–5/1–10 (2 each); the two counts are always distinct; exactly one card satisfies the comparison; exactly 3 "more" + 3 "less" rounds per playthrough; win detected at 6 correct.
2. Tapping the correct group advances the round; wrong taps wiggle with no penalty or progression loss.
3. Arrow cue displayed each round and spoken once at round start; silent when SFX disabled or API unavailable; visual play unaffected.
4. Win → shared celebration + sticker (first completion only) + auto-return; `justEarned` passed to Hub.
5. Hub shows 13 tiles; `ensureSceneLoaded` fires for `MoreLess`; pre-existing saves load cleanly.
6. All quality gates pass (`pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`).

## 6. Out of Scope

- 3+ card comparisons, equal-count rounds, counting beyond 10, subtraction/division, comparing written numerals without objects, per-band difficulty selection, TTS voice selection UI, new object textures, timed modes.
