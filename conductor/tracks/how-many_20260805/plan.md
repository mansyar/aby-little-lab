# Plan — Game 11: "How Many?" (Counting & Numeral Recognition)

**Track:** `how-many_20260805` · **Branch:** `feat/game-11`

## Phase 1 — Pure Game Logic (TDD)

- [x] Task: Write failing tests for `src/game/countLogic.ts` (Red phase): playthrough generation (6 rounds; 2 per band 1–3/1–5/1–10; round group counts 3/4/4), distinct-counts guard, item-type assignment & shuffle, answer evaluation, win detection *(7c84cb9)*
- [x] Task: Implement `src/game/countLogic.ts` pure functions to pass (Green phase): `createPlaythrough`, `createRound`, `evaluateRound` / `isPlaythroughComplete` *(817522a)*
- [x] Task: Verify coverage for `countLogic.ts` (>80%; project runs ~98%) *(817522a)*
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) - [checkpoint: 3ac0910]

## Phase 2 — Assets & Number Speech

- [x] Task: Create 10 numeral SVGs `src/assets/svg/numbers/numeral_0.svg`…`numeral_9.svg` (512×512, `#2B6CB0` fill, `#2D3748` stroke, identical styling) *(4d61c82)*
- [x] Task: Create `sticker_how_many.svg` (numeral "3" + star sparkle on cream badge) *(4d61c82)*
- [x] Task: Write failing test for `speakNumber(n)` in `src/utils/speech.ts` (number words, SFX-gated, silent fallback) *(4501c6b)*
- [x] Task: Implement `speakNumber` via shared `speakText` (en-US, rate ~0.9, cancels prior utterances) *(7c69b54)*
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) *[checkpoint: a55f2d7]*

## Phase 3 — Scene Implementation

- [x] Task: Write scene tests following `alphabetScene.test.ts` style: round setup (target numeral, group counts, layout), correct tap → advance, incorrect tap → wiggle + no penalty, TTS called on round start, win flow + `{ justEarned: "how-many" }`, parental-lock exit, input-lock reset on relaunch (regression per first-words fix) *(ab90dd0)*
- [x] Task: Implement `HowManyScene.ts` (scene key `HowMany`): target numeral card (~256px, pop-in), group cards 2×2 (3 in band 1) with N item copies, pressFeedback, progress dots, mascot cheer/nod/big-cheer, shared win celebration, auto-return after 3s *(5e6c9c2)*
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Integration

- [ ] Task: Add `how-many` to `GameId` union (`src/types/index.ts`) + sticker key mapping
- [ ] Task: Register `HowMany` lazy loader in `src/scenes/sceneRegistry.ts` + update registry tests
- [ ] Task: Load 11 new SVGs in `PreloadScene` (numeral + sticker textures)
- [ ] Task: Grow Hub grid 5×2 → 5×3 (11 tiles, `TILE_WIDTH` 160 unchanged); verify sticker-shelf and play-time arc fit vertically
- [ ] Task: Regression tests — old saves migrate cleanly (per-key merge), navigation test covers 11 tiles
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5 — Docs & Release Readiness

- [ ] Task: Update `conductor/product.md` (Game 11 row, hub grid 5×3, numeral-as-content amendment)
- [ ] Task: Update `conductor/tech-stack.md` with dated design note (Game 11, hub grid, asset pipeline additions)
- [ ] Task: Update `docs/PRD.md` (Game 11 section) and `docs/TDD.md` (scene/structure/coverage notes) as needed
- [ ] Task: Update `README.md` (games table, hub experience notes)
- [ ] Task: Full quality gates — `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
