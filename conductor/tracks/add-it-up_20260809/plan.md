# Plan — Game 16: "Add It Up" (Early Addition)

**Track:** `add-it-up_20260809` · **Branch:** `feat/game-16`

## Phase 1 — Pure Game Logic (TDD)

- [ ] Task: Write failing tests for `src/game/addItUpLogic.ts` (Red phase): playthrough generation (6 rounds; 2 per band easy ≤4 / mid ≤6 / hard ≤10; addends ≥ 1; sums within band; no order-insensitive (a,b) pair repeats; 4 answer cards with distinct totals in [1..bandMax], exactly one = target; addend cards use two distinct item types; answer cards share one item type), round building, answer evaluation
- [ ] Task: Implement `src/game/addItUpLogic.ts` pure functions to pass (Green phase): `buildPlaythrough`, `buildRound`, `isCorrect` + `ADD_IT_UP_BANDS` / counting-item texture mapping
- [ ] Task: Verify coverage for `addItUpLogic.ts` (>80%; project runs ~98%)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Assets

- [ ] Task: Create `src/assets/svg/ui/tiles/tile_add_it_up.svg` (Hub tile icon: two dot cards joined by a big "+", answer card highlighted; 512×512 storybook style, thick `#2D3748` outline per `docs/SVG_STYLE.md`)
- [ ] Task: Create `src/assets/svg/stickers/sticker_add_it_up.svg` (cream badge, dot cards with "+" and "=")
- [ ] Task: Create `plus.svg` and `equals.svg` symbol cues (check More or Less arrow-asset precedent for naming/location; 152 → 156 preload)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Scene Implementation

- [ ] Task: Write scene tests following `colorMatchScene.test.ts` style: round setup (2 addend dot-cards + "+"/"=" cues + 4 answer cards), correct tap → advance, incorrect tap → wiggle + no penalty, win flow + `{ justEarned: "add-it-up" }`, parental-lock exit, input-lock reset on relaunch (regression per first-words fix)
- [ ] Task: Implement `AddItUpScene.ts` (scene key `AddItUp`): 2 addend cards (~180px) + plus/equals cues, centered row of 4 answer cards (~150px, ≥96px touch targets), pressFeedback, progress dots (6), mascot cheer/nod/big-cheer, shared win celebration, auto-return after 3s, no prompt audio
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Integration

- [ ] Task: Add `add-it-up` to `GameId` union (`src/types/index.ts`); `GAME_IDS` backfill in `profileLogic.ts` covers old saves via per-key merge
- [ ] Task: Register `AddItUp` lazy loader in `src/scenes/sceneRegistry.ts` + update registry tests
- [ ] Task: Load 4 new SVGs in `PreloadScene` (tile + sticker + plus + equals; 152 → 156)
- [ ] Task: Hub grid — 16 tiles in 5×3 + 1 (row 4: 1 tile left-aligned; verify sticker shelf / play-time arc still fit)
- [ ] Task: Regression tests — old saves migrate cleanly, navigation test covers 16 tiles, sceneRegistry tests updated, progress recording (plays/accuracy) flows into Learning Progress
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5 — Docs & Release Readiness

- [ ] Task: Update `conductor/product.md` (Game 16 row, games target 15 → 16, hub grid 5/5/5/1, addition amendment)
- [ ] Task: Update `conductor/tech-stack.md` with dated design note (Game 16, logic tree + asset additions)
- [ ] Task: Update `docs/PRD.md` (Game 16 section) and `docs/TDD.md` as needed
- [ ] Task: Update `README.md` (games table, hub experience notes)
- [ ] Task: Full quality gates — `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
