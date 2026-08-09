# Plan — Game 17: "Take Away" (Early Subtraction)

**Track:** `take-away_20260810` · **Branch:** `feat/game-17`

## Phase 1 — Pure Game Logic (TDD)

- [x] Task: Write failing tests for `src/game/takeAwayLogic.ts` (Red phase): playthrough generation (6 rounds; 2 per band easy ≤4 / mid ≤6 / hard ≤10; minuend > subtrahend ≥ 1; differences within band; no ordered (minuend, subtrahend) pair repeats; 4 answer cards with distinct totals in [1..bandMax], exactly one = target; prompt cards use two distinct item types; answer cards share one item type), round building, answer evaluation (cf5168f — Red confirmed: module missing, 0 tests)
- [x] Task: Implement `src/game/takeAwayLogic.ts` pure functions to pass (Green phase): `buildPlaythrough`, `buildRound`, `isCorrect` + `TAKE_AWAY_BANDS` / counting-item texture mapping (mirror `addItUpLogic.ts`) (cf5168f — 15 tests green)
- [x] Task: Verify coverage for `takeAwayLogic.ts` (≥95% lines; project runs ~98%) (cf5168f — 100% stmts/branch/funcs/lines)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) — [checkpoint: 5ac22f2]

## Phase 2 — Assets

- [x] Task: Create `src/assets/svg/ui/minus.svg` (symbol cue — plus.svg precedent; chunky `#2B6CB0` fill / `#2D3748` stroke) (dc41b0b)
- [x] Task: Create `src/assets/svg/ui/tiles/tile_take_away.svg` (Hub tile icon: two dot cards joined by a big "−", answer card highlighted; 512×512 storybook style per `docs/SVG_STYLE.md`) (dc41b0b)
- [x] Task: Create `src/assets/svg/stickers/sticker_take_away.svg` (cream badge, dot cards with "−" and "=") (dc41b0b)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) — [checkpoint: 872c2ae]

## Phase 3 — Scene Implementation

- [ ] Task: Write scene tests following `addItUpScene.test.ts` style: round setup (2 prompt dot-cards + "−"/"=" cues + 4 answer cards), correct tap → advance, incorrect tap → wiggle + no penalty, win flow + `{ justEarned: "take-away" }`, parental-lock exit, input-lock reset on relaunch (regression per first-words fix)
- [ ] Task: Implement `TakeAwayScene.ts` (scene key `TakeAway`): 2 prompt cards (~180px) + minus/equals cues, centered row of 4 answer cards (~170px, ≥96px touch targets), pressFeedback, progress dots (6), mascot cheer/nod/big-cheer, shared win celebration, auto-return after 3s, no prompt audio
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Integration

- [ ] Task: Add `take-away` to `GameId` union (`src/types/index.ts`); `GAME_IDS` backfill covers old saves via per-key merge
- [ ] Task: Register `TakeAway` lazy loader in `src/scenes/sceneRegistry.ts` + update registry tests (17 loaders)
- [ ] Task: Load 3 new SVGs in `PreloadScene` (minus + tile + sticker; 156 → 159)
- [ ] Task: Hub grid — 17 tiles in 5×3+2 (row 4: 2 tiles left-aligned; generic modulo layout handles it — verify sticker shelf / play-time arc still fit; update grid comment)
- [ ] Task: Regression tests — old saves migrate cleanly, navigation test covers 17 tiles, sceneRegistry tests updated, progress recording flows into Learning Progress
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5 — Docs & Release Readiness

- [ ] Task: Update `conductor/product.md` (Game 17 row, games target 16 → 17, hub grid 5/5/5/2, subtraction amendment)
- [ ] Task: Update `conductor/tech-stack.md` with dated design note (Game 17, logic tree + asset additions)
- [ ] Task: Update `docs/PRD.md` (Game 17 section) and `docs/TDD.md` as needed
- [ ] Task: Update `README.md` (games table, hub experience notes)
- [ ] Task: Full quality gates — `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
