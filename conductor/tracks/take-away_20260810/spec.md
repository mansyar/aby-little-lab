# Spec — Game 17: "Take Away" (Early Subtraction)

**Track:** `take-away_20260810` · **Branch:** `feat/game-17` · **Type:** feature

## Overview

Add a 17th mini-game, **Take Away**, teaching early subtraction to preschoolers (3–5). The child sees an equation row — two dot-group cards joined by a big "−" cue with an "=" cue — counts the first group, "takes away" the second, and taps the answer card whose dot-group matches the difference. Fully textless and speech-free (mirrors Add It Up): counting by eye, no prompt voice, no speaker button.

## Functional Requirements

### Gameplay (mirrors Add It Up, subtraction-flipped)

- **Equation row:** `[minuend card] [− cue] [subtrahend card] [= cue]` — both prompt cards non-interactive (180px), cues pop in (96px display, `Back.out`).
- **Answer row:** 4 interactive cards (170px, ≥96px touch) showing dot-groups of candidate differences; exactly one equals the target.
- **6 rounds per playthrough**, easy-first bands (mirror Add It Up): rounds 1–2 minuend ≤ 4, rounds 3–4 ≤ 6, rounds 5–6 ≤ 10.
- **Pair rules:** minuend > subtrahend ≥ 1 (differences always ≥ 1, never 0); the ordered pair `(minuend, subtrahend)` never repeats within a playthrough (`usedPairs` set, keyed `"a-b"`); both prompt cards use **two distinct** `COUNT_ITEMS` textures; the 4 answer cards share **one** texture with **4 distinct totals** in `[1..bandMax]`, exactly one equal to the target (distractors exclude the target only — mirror Add It Up exactly).
- **Feedback:** Correct → success flash + chime + mascot cheer + progress-dot pop, 700ms advance (`NEXT_ROUND_DELAY`), `recordCorrect()`. Wrong → wiggle (targets answer rect + its own items) + mascot nod, no penalty, `recordWrong()`. After 6 correct: shared win celebration + first-time sticker + 3s auto-return with `{ justEarned: "take-away" }`.
- **Audio:** None (no prompt, no speaker button) — pairing with Add It Up as the only speech-free games.

### Integration (all patterns already established)

- **Logic:** `src/game/takeAwayLogic.ts` — `TAKE_AWAY_BANDS`, `buildRound(band, usedPairs)`, `buildPlaythrough()`, `isCorrect(options, index, target)`.
- **Scene:** `src/scenes/TakeAwayScene.ts` extends `GameSceneBase` (AddItUpScene layout family); input-lock reset on relaunch; ParentLock exit; reduced-motion aware.
- **Assets:** `minus.svg` (`src/assets/svg/ui/`, plus.svg precedent — chunky `#2B6CB0` fill / `#2D3748` stroke), `tile_take_away.svg` (two dot-cards + chunky minus, highlighted answer card), `sticker_take_away.svg` (cream badge). Zero new object art (reuses the 8 `COUNT_ITEMS` textures). Preload SVG count 156 → 159.
- **Registry:** `GameId` includes `take-away` (per-key backfill for old saves via `GAME_IDS`); `sceneRegistry.ts` 17th lazy loader `TakeAway`; Hub `GAME_TILES` 17th entry → **rows 5/5/5/2** (row 4 gets 2 left-aligned tiles; generic modulo layout handles it, comment update only).
- **Progress Insights:** automatic (GAME_IDS-driven) — plays, accuracy, mastery star, activity.

## Non-Functional Requirements

- Touch targets ≥ 96px; all juice reduced-motion-aware via `motionDuration`/`isReducedMotion`.
- Test coverage: `takeAwayLogic` ≥ 95% lines (TDD first), `TakeAwayScene` scene suite following MoreLess/AddItUp conventions; full suite + Biome clean + build green.
- No storage schema change (v2 additive per-key merge handles the new sticker key).

## Acceptance Criteria

1. `buildPlaythrough()` returns 6 rounds: bands 1/1/2/2/3/3, minuend > subtrahend ≥ 1, no repeated ordered pair, 4 distinct answer totals with exactly one target, two distinct prompt textures, one shared answer texture.
2. Scene renders equation row + cues with pop-in; correct tap advances with flash/chime/dot-pop; wrong tap wiggles with no penalty; win → celebration + `take-away` sticker + auto-return.
3. Hub shows 17 tiles (5/5/5/2), all on-canvas; 17th tile launches the game; sticker shelf + play-time arc unaffected.
4. Old saves migrate cleanly (new sticker key backfilled); progress insights record plays/accuracy.
5. Full suite green at configured thresholds; Biome clean; production build succeeds.

## Out of Scope

- Zero-difference rounds (3−3=0) — excluded per product decision (empty card confusing to count).
- Spoken prompt / speaker button — excluded per product decision (speech-free like Add It Up).
- Cloud sync, new object art, difficulty variation across replays (replay-variety = item/pair shuffle only, difficulty fixed).
- Any change to existing games, storage schema v3, or Hub layout code (beyond the comment).
