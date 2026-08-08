# Plan — Game 14: "Odd One Out" (Visual Discrimination & Categorization)

**Track:** `odd-one-out_20260808` · **Branch:** `feat/game-14`

## Phase 1 — Pure Game Logic (TDD) [checkpoint: f67bfb3]

- [x] Task: Write failing tests for `src/game/oddOneOutLogic.ts` (Red phase): playthrough generation (6 rounds; 2 per band easy/mid/hard; exactly 3 identical + 1 distinct card per round; odd texture unique per playthrough; group texture never equals odd texture), band rules (easy = cross-category, mid = same-category different item, hard = frog color variants), odd-item selection, answer evaluation *(44c4506)*
- [x] Task: Implement `src/game/oddOneOutLogic.ts` pure functions to pass (Green phase): `createPlaythrough`, `createRound`, `evaluateRound` (or `isCorrect`); win detection lives in-scene (`roundIndex >= rounds.length`, per countLogic/HowManyScene convention) *(44c4506 — createPlaythrough/createRound/isCorrect + promptFor; 21 tests green)*
- [x] Task: Verify coverage for `oddOneOutLogic.ts` (>80%; project runs ~98%) *(44c4506 — 97.22% stmts / 90.9% branch / 100% funcs / 97.05% lines; full suite 47 files/1133 tests green)*
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) *(f67bfb3)*

## Phase 2 — Assets & Prompt Audio [checkpoint: 460f6b5]

- [x] Task: Create `src/assets/svg/ui/tile_odd_one_out.svg` (Hub tile icon: 2×2 mini-cards with one visually distinct; 512×512 storybook style, thick `#2D3748` outline, soft vibrant fills per `docs/SVG_STYLE.md`) *(680793e — created at `src/assets/svg/ui/tiles/tile_odd_one_out.svg`)*
- [x] Task: Create `src/assets/svg/stickers/sticker_odd_one_out.svg` (cream badge, 2×2 mini-cards with one highlighted) *(680793e — created at `src/assets/svg/stickers/sticker_odd_one_out.svg`)*
- [x] Task: Verify `speakWord` handles item names ("ball", "star", "dog", "blue frog") — existing generic `speakText(word, enabled, 0.8)`; no code change expected *(680793e — verified; speech tests 19/19 green)*
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) *(460f6b5)*

## Phase 3 — Scene Implementation [checkpoint: 7977c34]

- [x] Task: Write scene tests following `shadowMatchScene.test.ts` (2×2 grid) / `moreLessScene.test.ts` style: round setup (4 cards, 3 identical + 1 odd), correct tap → advance, incorrect tap → wiggle + no penalty, prompt spoken at round start, win flow + `{ justEarned: "odd-one-out" }`, parental-lock exit, input-lock reset on relaunch (regression per first-words fix) *(4d4dc5a — 11 tests)*
- [x] Task: Implement `OddOneOutScene.ts` (scene key `OddOneOut`): 2×2 grid centered (~256px cards, ≥96px touch targets), pressFeedback, progress dots (6), mascot cheer/nod/big-cheer, speaker button, shared win celebration, auto-return after 3s *(4d4dc5a — completeGame('odd-one-out') win flow; GameId union + GAME_IDS add pulled forward as scene prerequisite)*
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) *(7977c34)*

## Phase 4 — Integration

- [x] Task: Add `odd-one-out` to `GameId` union (`src/types/index.ts`); `GAME_IDS` backfill in `profileLogic.ts` covers old saves via per-key merge *(4d4dc5a — pulled forward: required by GameSceneBase.completeGame/hasSticker)*
- [ ] Task: Register `OddOneOut` lazy loader in `src/scenes/sceneRegistry.ts` + update registry tests
- [ ] Task: Load 2 new SVGs in `PreloadScene` (tile + sticker; 148 → 150)
- [ ] Task: Hub grid — 14 tiles in 5×3 (row 3 = 4 tiles; verify fill logic left-aligns and sticker shelf / play-time arc still fit)
- [ ] Task: Regression tests — old saves migrate cleanly, navigation test covers 14 tiles, sceneRegistry tests updated
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5 — Docs & Release Readiness

- [ ] Task: Update `conductor/product.md` (Game 14 row, hub grid 14 tiles, visual-discrimination amendment)
- [ ] Task: Update `conductor/tech-stack.md` with dated design note (Game 14, asset pipeline additions)
- [ ] Task: Update `docs/PRD.md` (Game 14 section) and `docs/TDD.md` (scene/structure notes) as needed
- [ ] Task: Update `README.md` (games table, hub experience notes)
- [ ] Task: Full quality gates — `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
