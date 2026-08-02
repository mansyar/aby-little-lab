# Track: Game 9 & 10 — First Words (Find the Word + Build the Word)

**Track ID:** `first-words_20260803`
**Type:** Feature
**Status:** New
**Created:** 2026-08-03

## Overview

Two new mini-games extending the Game 8 literacy milestone (uppercase letter
recognition) into first-word reading and spelling, for ages 3–5:

- **Game 9 — Find the Word** (scene `WordMatch`, game id `word-match`): a
  picture of a familiar animal/object is shown and its name is spoken aloud;
  the child taps the matching printed word among 4 word cards.
- **Game 10 — Build the Word** (scene `WordBuilder`, game id `word-builder`):
  a picture is shown and its name spoken; the child spells the word by tapping
  letter tiles in order into word slots.

Both games reuse **only existing rasterized textures** — the 26 letter SVGs
(`letter_a`…`letter_z`, already loaded in PreloadScene) composed into words,
and 9 existing prompt pictures (`animal_cat`, `animal_dog`, `animal_pig`,
`frog_red`, `food_fish`, `sm_car`, `sm_boat`, `sm_ball`, `sm_tree`). The only
new art is two sticker SVGs. No storage migration is required: new game ids
ride the existing merge-on-load pattern in `storage.ts`.

## Word Pool (v1, uppercase)

9 words, all spellable with existing prompt art:

| Word  | Letters | Prompt texture      |
|-------|---------|---------------------|
| cat   | 3       | `animal_cat`        |
| dog   | 3       | `animal_dog`        |
| pig   | 3       | `animal_pig`        |
| car   | 3       | `sm_car`            |
| frog  | 4       | `frog_red`          |
| ball  | 4       | `sm_ball`           |
| fish  | 4       | `food_fish`         |
| boat  | 4       | `sm_boat`           |
| tree  | 4       | `sm_tree`           |

All words are rendered **uppercase** (consistent with Game 8). Words are
composed on cards by placing the already-loaded letter textures side by side
(display size ~80px per letter, e.g. `this.add.image(x, y, "letter_c")`).

## Functional Requirements

### FR1 — Shared round shell (both games)
- FR1.1 Both games follow the AlphabetScene shell: scene entrance, corner
  mascot (Professor Hoot), parent-locked Back button (96px hit area), progress
  dots, no-fail pedagogy, chime + Hoot cheer on correct, gentle wiggle + soft
  tone on incorrect (no penalty, no progression loss), reduced-motion aware.
- FR1.2 TTS prompt: the word name is spoken via the Web Speech API (en-US,
  rate 0.8) only when the SFX toggle is enabled, with a silent no-throw
  fallback when unsupported — the picture/printed word always remain visible.
- FR1.3 Completion: win SFX, shared win celebration, sticker awarded on first
  completion only, auto-return to Hub after ~3s with `justEarned` hint.

### FR2 — Game 9: Find the Word (scene `WordMatch`)
- FR2.1 Round layout: prompt picture top-center (~180px display), 4 word cards
  in a 2×2 grid below. Card width = letter count × 80px + padding (min height
  160px — exceeds the 96px touch target).
- FR2.2 Round content: 6 rounds per playthrough; each round has a unique word
  from the pool. The 4 choices are unique words; **no two choices in a round
  share a first letter** (pre-reader confusion guard).
- FR2.3 Correct: chime, Hoot cheer, progress dot pops, next round after ~0.7s.
  Incorrect: wiggle (reduced-motion aware), soft tone, round stays.
- FR2.4 Sticker `sticker_word_match` earned on first completion.

### FR3 — Game 10: Build the Word (scene `WordBuilder`)
- FR3.1 Round layout: prompt picture top-center, a row of word slots (one
  empty box per letter, ~120px), and 6 letter tiles (~110px) in a bottom row.
- FR3.2 Round content: 3 words per playthrough; words are drawn **easy-first**
  — 3-letter words (cat, dog, pig, car) before 4-letter words (frog, ball,
  fish, boat, tree), random within each tier, no repeats in a playthrough.
- FR3.3 Letter tiles: the word's unique letters plus 2–3 distractor letters
  (letters not in the word), shuffled; uppercase textures.
- FR3.4 Interaction: taps fill slots **sequentially** (slot N accepts the
  word's Nth letter). Correct tap: letter pops into the slot with a settle
  tween + soft tick; wrong tap: tile wiggles (reduced-motion aware), soft
  tone, no penalty. Filled letters are locked.
- FR3.5 Word complete: chime, Hoot cheer, progress dot pops, next word after
  ~1.2s (word display lingers briefly so the child sees the finished word).
- FR3.6 Sticker `sticker_word_builder` earned on first completion.

### FR4 — Hub, registry, storage, assets
- FR4.1 `GAME_TILES` gains `{ sceneKey: "WordMatch", gameId: "word-match",
  label: "Find the Word" }` and `{ sceneKey: "WordBuilder", gameId:
  "word-builder", label: "Build the Word" }`.
- FR4.2 Hub grid becomes **5 columns × 2 rows** with `TILE_WIDTH = 160`,
  `TILE_SPACING = 40` (5×160 + 4×40 = 960 ≤ 1024px). Tile labels stay
  readable at the reduced width; sticker shelf layout derives from the same
  constants (no hardcoded positions).
- FR4.3 `sceneRegistry.ts` gains `WordMatch` and `WordBuilder` lazy loaders
  (dynamic import; both scenes stay out of the Phaser config array, matching
  the Phaser 4 limitation documented there).
- FR4.4 `GameId` type and `createDefaultStorage()` gain `word-match` and
  `word-builder`; the existing merge-on-load keeps old saves working (no
  migration).
- FR4.5 `PreloadScene` loads 2 new stickers (`sticker_word_match`,
  `sticker_word_builder`) rasterized at 512×512; new SVG files live in
  `src/assets/svg/stickers/` following the existing style (primary #2B6CB0,
  outline #2D3748).

### FR5 — Speech
- FR5.1 `speech.ts` gains `speakWord(word: string, enabled: boolean): boolean`
  — same contract as `speakLetter` (SFX-gated, cancel-prior, never throws) at
  rate 0.8. `speakLetter` is refactored to delegate to a shared internal
  `speakText` so behavior is unchanged.

## Non-Functional Requirements

- **Performance:** 60fps target; both scenes lazy-loaded via sceneRegistry
  (no boot-time cost); new assets total 2 small SVGs.
- **Touch:** all interactive targets ≥ 96px (cards 160px+, tiles 110px+,
  slots 120px, back button 96px hit area).
- **Accessibility:** reduced-motion compliance via `motion.ts` utils (smaller
  wiggle, gentler pops, no extra motion); uppercase letters distinguished by
  shape (identical fill/stroke — no color-as-cue); TTS never required.
- **Pedagogy:** no-fail (wrong answers never penalize); prompts always visual
  + spoken-when-available; 6/3-round lengths sized to the 3–5 attention span.
- **Data:** localStorage only, `abby-little-lab:v1` schema unchanged (merged
  defaults); no new keys beyond the two sticker ids; no analytics.
- **Quality:** TDD-first logic; unit + scene + integration tests
  (boot → hub → game → sticker); coverage ≥ 80%; `pnpm run check`,
  `CI=true pnpm test`, `pnpm run build` green; PWA offline still valid.

## Acceptance Criteria

1. From the Hub (5×2 grid, 10 tiles), both new tiles launch their games and
   every existing tile still works; no tile overlaps or clipping at
   1024×768.
2. Find the Word: 6 unique-word rounds; prompt picture + spoken word (silent
   when SFX off / TTS unsupported); 2×2 word cards composed of letter
   textures; no same-first-letter duplicates in a round; correct/wrong
   feedback per FR2.3; sticker + celebration on first completion; auto-return.
3. Build the Word: 3 words per playthrough, easy-first ordering; 6 letter
   tiles incl. distractors; sequential fill with lock-in; correct/wrong
   feedback per FR3.4; sticker + celebration on first completion; auto-return.
4. Storage: `word-match`/`word-builder` stickers persist across reloads, earn
   exactly once, and Reset Progress clears them while preserving settings.
5. Old saves (v1 without the new ids) load without error and gain the new
   entries.
6. Reduced-motion mode and SFX-off behave per FR1.2/FR1.3/FR2.3/FR3.4.
7. All new logic is covered by tests (≥80% coverage overall); the full CI
   quality gate suite passes; PWA build validates.
8. Docs updated: `product.md` (10 games), `tech-stack.md` (scenes, game ids,
   grid), README (game rows), PRD (Game 9/10 milestones), device-testing
   checklist (both games).

## Out of Scope

- Lowercase words / mixed case; word pool expansion or new prompt art
  (noted as future work; pool is deliberately the 9 words with existing art)
- Multi-child profiles / per-child progress
- Drag-based or free-form spelling; word audio pronunciation variants
- Analytics, new settings, or storage schema v2
