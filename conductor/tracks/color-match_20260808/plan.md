# Plan — Game 15: "Color Match" (Color Recognition)

**Track:** `color-match_20260808` · **Branch:** `feat/game-15`

## Phase 1 — Pure Game Logic (TDD)

- [ ] Task: Write failing tests for `src/game/colorMatchLogic.ts` (Red phase): playthrough generation (6 rounds; 3 per band easy/hard; rounds 1–3 from 3-color pool red/blue/yellow, rounds 4–6 from 6-color pool + green/orange/purple; exactly 4 distinct colors per round; target = one sampled color; swatch hexes match SVG fill constants), round building, answer evaluation
- [ ] Task: Implement `src/game/colorMatchLogic.ts` pure functions to pass (Green phase): `buildPlaythrough`, `buildRound`, `isCorrect` + `COLOR_POOLS` / `COLOR_CARDS` mappings
- [ ] Task: Verify coverage for `colorMatchLogic.ts` (>80%; project runs ~98%)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Assets & Prompt Audio

- [ ] Task: Create `src/assets/svg/ui/tiles/tile_color_match.svg` (Hub tile icon: color swatches with one highlighted; 512×512 storybook style, thick `#2D3748` outline per `docs/SVG_STYLE.md`)
- [ ] Task: Create `src/assets/svg/stickers/sticker_color_match.svg` (cream badge, color swatches with one highlighted)
- [ ] Task: Verify `speakText` handles color names ("red", "blue", "yellow", "green", "orange", "purple") — existing generic API; no code change expected
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Scene Implementation

- [ ] Task: Write scene tests following `oddOneOutScene.test.ts` style: round setup (swatch prompt + 4 distinct-color cards), correct tap → advance, incorrect tap → wiggle + no penalty, prompt spoken at round start, win flow + `{ justEarned: "color-match" }`, parental-lock exit, input-lock reset on relaunch (regression per first-words fix)
- [ ] Task: Implement `ColorMatchScene.ts` (scene key `ColorMatch`): Graphics-drawn swatch prompt top-center (~180px), 2×2 grid of 4 cards (~256px, ≥96px touch targets), pressFeedback, progress dots (6), mascot cheer/nod/big-cheer, speaker button, shared win celebration, auto-return after 3s
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Integration

- [ ] Task: Add `color-match` to `GameId` union (`src/types/index.ts`); `GAME_IDS` backfill in `profileLogic.ts` covers old saves via per-key merge
- [ ] Task: Register `ColorMatch` lazy loader in `src/scenes/sceneRegistry.ts` + update registry tests
- [ ] Task: Load 2 new SVGs in `PreloadScene` (tile + sticker; 150 → 152)
- [ ] Task: Hub grid — 15 tiles in 5×3 (rows 5/5/5, grid fully populated; verify sticker shelf / play-time arc still fit)
- [ ] Task: Regression tests — old saves migrate cleanly, navigation test covers 15 tiles, sceneRegistry tests updated
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5 — Docs & Release Readiness

- [ ] Task: Update `conductor/product.md` (Game 15 row, games target 14 → 15, hub grid 5/5/5, color-recognition amendment)
- [ ] Task: Update `conductor/tech-stack.md` with dated design note (Game 15, asset pipeline additions)
- [ ] Task: Update `docs/PRD.md` (Game 15 section) and `docs/TDD.md` as needed
- [ ] Task: Update `README.md` (games table, hub experience notes)
- [ ] Task: Full quality gates — `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
