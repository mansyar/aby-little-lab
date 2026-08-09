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

- [x] Task: Write scene tests following `addItUpScene.test.ts` style: round setup (2 prompt dot-cards + "−"/"=" cues + 4 answer cards), correct tap → advance, incorrect tap → wiggle + no penalty, win flow + `{ justEarned: "take-away" }`, parental-lock exit, input-lock reset on relaunch (regression per first-words fix) (8a1b5c6 — Red confirmed: module missing, 0 tests; 9 tests in final suite)
- [x] Task: Implement `TakeAwayScene.ts` (scene key `TakeAway`): 2 prompt cards (~180px) + minus/equals cues, centered row of 4 answer cards (~170px, ≥96px touch targets), pressFeedback, progress dots (6), mascot cheer/nod/big-cheer, shared win celebration, auto-return after 3s, no prompt audio (8a1b5c6 — equation row [A][−][B][=], dot-group layout per AddItUpScene, no speaker button; 'take-away' GameId added to src/types/index.ts as scene prerequisite)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) — [checkpoint: 67ceea2]

## Phase 4 — Integration

- [x] Task: Add `take-away` to `GameId` union (`src/types/index.ts`); `GAME_IDS` backfill covers old saves via per-key merge (8a1b5c6 — pulled forward as Phase 3 scene prerequisite per add-it-up precedent; old-save merge covered by normalizeProgress per-key tests)
- [x] Task: Register `TakeAway` lazy loader in `src/scenes/sceneRegistry.ts` + update registry tests (17 loaders) (d298759)
- [x] Task: Load 3 new SVGs in `PreloadScene` (minus + tile + sticker; 156 → 159) (d298759)
- [x] Task: Hub grid — 17 tiles in 5×3+2 (row 4: 2 tiles left-aligned; generic modulo layout handles it — verify sticker shelf / play-time arc still fit; update grid comment) (d298759 — grid comment updated to 5×3+2; hubScene test asserts all 17 tiles on-canvas)
- [x] Task: Regression tests — old saves migrate cleanly, navigation test covers 17 tiles, sceneRegistry tests updated, progress recording flows into Learning Progress (d298759 — preload 159, tile icons 17, hasSticker 17/34, slots 17; full suite 58 files/1309 tests green)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) — [checkpoint: 5f0af11]

## Phase 5 — Docs & Release Readiness

- [x] Task: Update `conductor/product.md` (Game 17 row, games target 16 → 17, hub grid 5/5/5/2, subtraction amendment) (f615529 — 17 mini-games, table row 17, mascot/progress 17, zero-text amendment, HubScene 5×3+2, Changelog Game 17)
- [x] Task: Update `conductor/tech-stack.md` with dated design note (Game 17, logic tree + asset additions) (f615529 — 20 scenes, GameSceneBase 17, Game 17 dated note)
- [x] Task: Update `docs/PRD.md` (Game 17 section) and `docs/TDD.md` as needed (f615529 — GAME 17 section, 17 refs; TDD scene tree/GameId/asset tables + seventeen prose refs)
- [x] Task: Update `README.md` (games table, hub experience notes) (f615529 — seventeen, table row 17, replay variety, controls/win/mascot/lazy-load 17)
- [x] Task: Full quality gates — `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js` (f615529 — Biome 125 files clean, 58 files/1309 tests, build OK PWA 35 entries, validate-pwa 13/13)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) — [checkpoint: d7a6898]
