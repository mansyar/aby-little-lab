# Specification — First Words Word Pool Expansion

> Track id: `word-pool-expansion_20260803` · Type: Feature · Branch: `feat/word-pool-expansion`

## Overview

Games 9 (Find the Word) and 10 (Build the Word) share a single 9-word pool defined in
`src/game/wordLogic.ts`. This track expands that pool to **18 words** to increase replay
variety — a core product principle — while leaving gameplay mechanics, difficulty, and the
storage schema untouched. The pool is the single source of truth for both scenes: prompts
resolve via `promptTexture` keys and words compose from the already-loaded `letter_a`…`letter_z`
textures, so the scenes are data-driven and require no rule changes.

The First Words spec explicitly deferred this as future work ("word pool expansion or new
prompt art"; pool was deliberately the 9 words with existing art).

## Decisions (confirmed 2026-08-03)

- **Pool size:** +9 words → 18 total.
- **Asset strategy:** reuse existing textures where they fit; author new SVGs for the rest.
- **Tier balance:** balanced growth — +4 three-letter, +5 four-letter (final 8 / 10, same
  44/56 ratio as today).
- **Mechanics:** unchanged — Find the Word stays 6 unique rounds; Build the Word stays 3 words
  easy-first.
- **OWL illustration:** reuses `mascot_idle` (Professor Hoot is an owl; the lab coat does not
  obscure owl recognition). No new owl asset.

## Proposed Pool (18 words)

### 3-letter tier (8)

| Word | promptTexture | Source |
|---|---|---|
| CAT | `animal_cat` | existing |
| DOG | `animal_dog` | existing |
| PIG | `animal_pig` | existing |
| CAR | `sm_car` | existing |
| OWL | `mascot_idle` | reuse — mascot is an owl |
| SUN | `sm_sun` | new SVG `sun.svg` |
| HAT | `sm_hat` | new SVG `hat.svg` |
| BUG | `sm_bug` | new SVG `bug.svg` |

### 4-letter tier (10)

| Word | promptTexture | Source |
|---|---|---|
| FROG | `frog_red` | existing |
| BALL | `sm_ball` | existing |
| FISH | `food_fish` | existing |
| BOAT | `sm_boat` | existing |
| TREE | `sm_tree` | existing |
| BONE | `food_bone` | reuse — Game 2 food texture |
| STAR | `shape_star` | reuse — Game 1 shape texture |
| DRUM | `toy_drum` | reuse — Game 6 toy texture |
| BEAR | `toy_teddy_bear` | reuse — teddy bear is a bear |
| DUCK | `sm_duck` | new SVG `duck.svg` |

**New assets (4):** `src/assets/svg/items/sun.svg`, `hat.svg`, `bug.svg`, `duck.svg` —
512×512 viewBox, flat fills, thick `#2D3748` strokes (4–6px at 512px base), soft/vibrant
non-primary palette, tight bounding box (per the SVG pipeline rules in the PRD). Registered in
PreloadScene as `sm_sun` / `sm_hat` / `sm_bug` / `sm_duck` via `?raw` import + `toDataUri`,
matching the existing prompt-picture convention.

## Functional Requirements

- **FR1 — Pool data.** `WORD_POOL` in `src/game/wordLogic.ts` contains exactly 18 entries:
  8× 3-letter, 10× 4-letter. Every entry has `word`, `letters`, `promptTexture`, `tier`; all
  words unique; every `promptTexture` is a key registered by PreloadScene.
- **FR2 — Find the Word (unchanged rules, larger pool).** 6 unique target words per playthrough
  (`generateWordPlaythrough`); each round has 4 unique choices; the pre-reader guard (no two
  choices share a first letter) still holds for every possible round. Pool first letters:
  {B, C, D, F, H, O, P, S, T} — 9 groups, sufficient for all 6-round playthroughs.
- **FR3 — Build the Word (unchanged rules, larger pool).** 3 words per playthrough, easy-first
  (2× 3-letter then 1× 4-letter), no repeats; 6 letter tiles per word with 2–3 distractors not
  in the word.
- **FR4 — Feedback & accessibility (unchanged).** Correct/incorrect chimes, mascot cheer/nod,
  dot pops, settle/wiggle tweens, TTS (`speakWord`, en-US, rate 0.8, SFX-gated, silent
  fallback), reduced-motion behavior, sticker + win celebration + auto-return — all identical.
- **FR5 — Persistence.** No storage keys or schema changes; pool is playthrough-time data only.
  Old saves load unchanged.

## Non-Functional Requirements

- **NFR1 — Asset pipeline:** new SVGs follow the PRD SVG design rules and rasterize at 512×512;
  no gradients, no neon, no pure RGB primaries.
- **NFR2 — Quality gates:** `pnpm run check`, `CI=true pnpm test` (coverage ≥ 80% overall),
  `pnpm run build`, `node scripts/validate-pwa.js` all green; PWA offline precache still valid
  (new SVGs are bundled and precached by the existing pipeline).
- **NFR3 — No tech-stack change:** Phaser 4, Vite 8, no new dependencies.
- **NFR4 — TDD:** pool/logic changes are test-first; scene integration covered by existing
  first-words integration test patterns.

## Acceptance Criteria

1. `WORD_POOL` has 18 entries; tier counts are exactly 8 and 10; every entry's
   `promptTexture` resolves to a PreloadScene-registered texture key.
2. `generateWordPlaythrough(6)` works across the full pool: 6 unique targets, no round has two
   choices sharing a first letter, target always included exactly once.
3. Build-the-word playthrough generation works across the full pool: 3 unique words, easy-first
   ordering, no repeats.
4. Find the Word and Build the Word scenes render each new word's prompt picture at ~180px from
   its texture with no scene-rule changes (verified via unit + integration tests; manually on
   the dev server).
5. New SVGs (`sun`, `hat`, `bug`, `duck`) are registered and rasterize correctly in the
   preload; the preload texture-key test list is updated.
6. Reduced-motion and SFX-off behavior unchanged; TTS speaks new words via `speakWord` with no
   changes to `speech.ts`.
7. Full CI quality-gate suite passes.
8. Docs updated: `PRD.md` (Game 9/10 pool), `tech-stack.md` (design-update note: pool size,
   new assets), README (game rows if they enumerate words), device-testing checklist (new-word
   spot checks).

## Out of Scope

- Gameplay mechanic changes (round counts, difficulty, tile layouts).
- Lowercase / mixed case words; new letter-length tiers (5+ letters).
- New stickers, storage schema changes, analytics, new settings.
- Multi-child profiles / per-child progress.
- Word-audio pronunciation variants; replacing the mascot as the OWL illustration.
