# Spec — Game 12: First Sounds (Phonics)

**Track:** `first-sounds_20260807` · **Type:** Feature · **Date:** 2026-08-07

## Overview

A phonics mini-game for the Aby's Little Lab suite: the child hears a spoken
word and taps the uppercase letter that makes the word's **first sound**. This
fills the missing literacy milestone between letter recognition (Game 8) and
sight words (Games 9–10). Zero-text gameplay consistent with the suite; all
prompts are spoken via TTS with picture support.

## Functional Requirements

### FR-1 — Curated word pool (12 words, zero new picture assets)

`PHONICS_POOL` in `src/game/firstSoundsLogic.ts` reuses existing `WORD_POOL`
prompt textures (no new word-picture SVGs):

- 3-letter: CAT (C), DOG (D), PIG (P), SUN (S), HAT (H), BUG (B), OWL (O)
- 4-letter: TREE (T), STAR (S), BALL (B), FROG (F), FISH (F)

9 distinct initial letters: C, D, P, O, S, H, B, F, T.

### FR-2 — Playthrough & round generation (pure logic, TDD)

- `generatePhonicsPlaythrough(roundCount = 6)`: 6 rounds, **6 unique target
  letters** (no letter repeats), shuffled order.
- `generatePhonicsRound(target)`: 4 unique letter choices (target + 3
  distractors drawn from the 9-letter set).
- **Sound-confusion guard:** B/P never co-occur and D/T never co-occur in one
  round's choices (3–5yo phoneme confusion).
- **Visual-confusion guard:** reuse the existing alphabet confusable-family
  helper (families `[C,G,O,Q]`, `[I,L,T]`, `[M,W]`) so visually confusable
  letters never co-occur — consistent with Game 8's v1.7.0 guard.
- `firstLetterOf(word)` mapping helper.

### FR-3 — Scene (`FirstSoundsScene`, key `FirstSounds`)

- Round start: word picture prompt (existing texture) + TTS `speakWord` +
  speaker replay button (96×96 hit area, guarded while speaking and when
  `rounds[roundIndex]` is undefined — v1.7.0 hardening lesson).
- 4 uppercase letter cards (existing `letter_*` textures), press feedback 95%
  squish, tap navigates on release.
- Correct: `playCorrect` + letter pulse (1.1×) + `speakLetter` + `speakWord`;
  progress dots fill.
- Incorrect: no-fail design — gentle bounce + soft descending tone (no harsh
  sounds); round retries.
- After 6 rounds: standard win celebration + first-time sticker
  `sticker_first_sounds` + 3s auto-return.
- Hardening lessons applied: double-navigation guard, `transitionToScene`
  idempotency (WeakMap), input-lock reset on relaunch/replay.

### FR-4 — Integration

- `GameId` union + sticker persistence: new `"first-sounds"` id via existing
  `earnSticker`/`hasSticker`; `GAME_IDS` backfill covers old saves via per-key
  merge (no schema migration).
- `sceneRegistry.ts`: 12th lazy loader (`FirstSounds`).
- `HubScene` `GAME_TILES`: 12th tile (sceneKey `FirstSounds`, gameId
  `first-sounds`, label "First Sounds", tileKey `tile_first_sounds`). Grid is
  already 5×3 (15 slots); row 3 becomes 5+5+2 — no geometry change, partial
  rows are left-aligned by the existing fill logic.
- `PreloadScene`: register 2 new SVGs — `tile_first_sounds.svg`,
  `sticker_first_sounds.svg`.

## Non-Functional Requirements

- All `product-guidelines.md` rules: no-fail design, 64px min / 96px ideal
  touch targets, reduced-motion support, audio-visual pairing, motion
  200–500ms (300–800ms celebratory).
- Coverage: new logic ≥ project threshold (~98% project norm); tests in
  `src/__tests__/game/` and `src/__tests__/scenes/`.

## Acceptance Criteria

1. Logic tests: unique targets per playthrough; 4 unique choices per round;
   B/P and D/T never co-occur; visual-family guard respected; word→initial
   letter mapping correct; all logic functions covered.
2. Scene tests: happy path → sticker awarded once; incorrect → retry with no
   state corruption; speaker replay works and is guarded; win celebration +
   3s auto-return; reduced-motion paths; parental-lock exit.
3. Integration: Hub shows 12 tiles; sticker shelf renders `first-sounds`
   sticker; existing 1024 tests stay green; Biome clean; production build
   passes; `validate-pwa.js` passes.
4. Manual: `pnpm dev` — playthrough speaks each word, tapping the correct
   letter celebrates, relaunching gives a fresh letter set.

## Out of Scope

- Lowercase letters.
- Reverse mechanic (hear a sound → tap the picture).
- New word-picture assets.
- Isolated phoneme TTS (unreliable cross-device; feedback speaks letter name
  + word instead).
- Multi-language support.
- Release execution (follow-up release track, v1.8.0).
