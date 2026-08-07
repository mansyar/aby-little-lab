# Plan — Game 12: First Sounds (Phonics)

**Track:** `first-sounds_20260807` · **Branch:** `feat/game-12`

## Phase 1 — Pure Game Logic (TDD) [checkpoint: ceff312]

- [x] Task: Write failing tests for `src/game/firstSoundsLogic.ts` (Red phase): `PHONICS_POOL` (12 curated words, 9 distinct initial letters), playthrough generation (6 rounds, 6 unique target letters, shuffled, no repeats), round generation (4 unique letter choices, target included), sound-confusion guard (B/P and D/T never co-occur), visual-family guard (reuse alphabetLogic confusable-family helper; verify its exported name), `firstLetterOf` mapping *(4f8fd44)*
- [x] Task: Implement `src/game/firstSoundsLogic.ts` pure functions to pass (Green phase): `PHONICS_POOL`, `PHONICS_LETTERS`, `generatePhonicsPlaythrough(roundCount = 6)`, `generatePhonicsRound(target)`, `firstLetterOf(word)` *(ea6c593)*
- [x] Task: Verify coverage for `firstSoundsLogic.ts` (project runs ~98%; threshold >80%) *(ea6c593 — 95% stmts / 87.5% branch; only uncovered line is the defensive init throw; suite 97.12% stmts / 98.18% lines)*
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Assets

- [x] Task: Create `src/assets/svg/ui/tiles/tile_first_sounds.svg` (storybook style — flat fills, 4–6px `#2D3748` strokes, letter "A" + sound-wave motif matching tile family) *(6f44ef3)*
- [x] Task: Create `src/assets/svg/stickers/sticker_first_sounds.svg` (letter + sound wave on cream badge, matching sticker family) *(247f61c)*
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Scene Implementation

- [ ] Task: Write scene tests following `wordMatchScene.test.ts` / `alphabetScene.test.ts` style: round setup (picture + spoken word + 4 letter cards), correct tap → advance + `speakLetter` feedback, incorrect tap → gentle bounce + no penalty + retry, speaker replay button (96×96 hit area, guard when `rounds[roundIndex]` undefined), TTS called on round start, win flow → `{ justEarned: "first-sounds" }` + sticker, 3s auto-return, parental-lock exit, input-lock reset on relaunch, reduced-motion paths
- [ ] Task: Implement `FirstSoundsScene.ts` (scene key `FirstSounds`): prompt picture (~256px, pop-in), speaker replay, 4 letter cards with pressFeedback, progress dots, mascot cheer/nod/big-cheer, shared win celebration, `transitionToScene` idempotency, double-navigation guard
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Integration

- [ ] Task: Add `"first-sounds"` to `GameId` union (`src/types/index.ts`) + sticker key mapping; verify `GAME_IDS` backfill in `profileLogic.ts` covers old saves via per-key merge
- [ ] Task: Register `FirstSounds` lazy loader in `src/scenes/sceneRegistry.ts` + update registry tests
- [ ] Task: Load 2 new SVGs in `PreloadScene` (tile + sticker textures)
- [ ] Task: Add 12th entry to `GAME_TILES` in `HubScene` (sceneKey `FirstSounds`, gameId `first-sounds`, label "First Sounds", tileKey `tile_first_sounds`); confirm 5×3 grid geometry unchanged (row 3 → 2 tiles, left-aligned per existing fill logic)
- [ ] Task: Regression tests — navigation test covers 12 tiles, sticker-shelf renders new sticker, existing 1024 tests stay green
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5 — Docs & Release Readiness

- [ ] Task: Update `conductor/product.md` (Game 12 row, game list 11 → 12)
- [ ] Task: Update `conductor/tech-stack.md` with dated design note (Game 12, phonics logic, asset additions)
- [ ] Task: Update `docs/PRD.md` (Game 12 section) and `docs/TDD.md` (structure/coverage notes) as needed
- [ ] Task: Update `README.md` (games table — 12 games)
- [ ] Task: Full quality gates — `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase: Review Fixes

- [ ] Task: Apply review suggestions
