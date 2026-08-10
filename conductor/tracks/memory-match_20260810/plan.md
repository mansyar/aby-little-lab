# Plan — Game 18: "Memory Match" (Visual Working Memory)

**Track:** `memory-match_20260810` · **Branch:** `feat/game-18`

## Phase 1 — Pure Game Logic (TDD) [checkpoint: 001725b]

- [x] Task: Write failing tests for `src/game/memoryMatchLogic.ts` (Red phase): playthrough generation (6 rounds; rounds 1–2 = 2×3 grid / 3 pairs, rounds 3–4 = 3×4 / 6 pairs, rounds 5–6 = 4×4 / 8 pairs; all pair textures distinct within a round; shuffled positions; no texture repeats within a round), round building, match-state helpers (reveal, matched set, round-complete, playthrough-complete) *(f8ba17a — 23 tests, Red confirmed: module missing)*
- [x] Task: Implement `src/game/memoryMatchLogic.ts` pure functions to pass (Green phase): `buildPlaythrough`, `buildRound`, pair/match evaluation helpers + band/POOL constants *(f8ba17a — 23 tests Green)*
- [x] Task: Verify coverage for `memoryMatchLogic.ts` (>80%; project runs ~95% lines) *(100% stmts/branch/funcs/lines)*
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) *(001725b — 23 tests Green, 100% coverage; full-suite timeouts = machine-load flakes, verified 6/6 affected files pass standalone)*

## Phase 2 — Assets (3 SVGs) [checkpoint: a2be712]

- [x] Task: Create `src/assets/svg/ui/tiles/tile_memory_match.svg` (Hub tile icon: mini face-down cards with one pair revealed; 512×512 storybook style, thick `#2D3748` outline per `docs/SVG_STYLE.md`) *(f8bb206 — 3 cards, blue star motif, cream/blue 2-hue)*
- [x] Task: Create `src/assets/svg/stickers/sticker_memory_match.svg` (cream badge, two matching cards) *(f8bb206 — cream circle + scaled tile scene)*
- [x] Task: Create `src/assets/svg/ui/gameplay/card_back.svg` (face-down card back: cream card, star motif, storybook style) *(f8bb206 — placed at `src/assets/svg/ui/card_back.svg`: no ui/gameplay/ dir exists, ui/ is the convention)*
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) *(a2be712 — 3 SVGs well-formed XML, style-spec compliant; no code touched)*

## Phase 3 — Scene Implementation [checkpoint: 1d4b2c3]

- [x] Task: Write scene tests following `colorMatchScene.test.ts` style: deal (face-down cards, grid per band), tap reveal flip, matched pair locks face-up + success flash, mismatch flips back + wiggle + no penalty, input locked during transitions, round advance ~700ms with dot pop, win flow + `{ justEarned: "memory-match" }`, parental-lock exit, input-lock reset on relaunch (regression per first-words fix) *(b4a75e6 — 13 tests; Red confirmed: module missing; sparse-array `every()` hole bug caught + fixed via dense arrays)*
- [x] Task: Implement `MemoryMatchScene.ts` (scene key `MemoryMatch`): rounded-rect card bases + `card_back` texture face-down, flip via scaleX 1→0→1 with face swap, ~140–160px cards (≥96px touch), pressFeedback, progress dots (6), mascot cheer/nod/big-cheer, shared win celebration, auto-return after 3s, no speaker button (no speech) *(b4a75e6 — 13 scene tests Green; GameId "memory-match" pulled forward in src/types/index.ts)*
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) *(1d4b2c3 — 13 scene tests Green; full suite 1344 passed / 2 failed = known machine-load timeouts in countLogic/takeAwayLogic sampling loops, verified pass standalone)*

## Phase 4 — Integration [checkpoint: c8bca98]

- [x] Task: Add `memory-match` to `GameId` union (`src/types/index.ts`); `GAME_IDS` backfill in `profileLogic.ts` covers old saves via per-key merge (pulled forward as scene prerequisite, per color-match precedent) *(b4a75e6 — GameId union + GAME_IDS extended; per-key merge confirmed in profileLogic.createDefaultStickers / progressLogic.normalizeProgress — old saves get default entries automatically)*
- [x] Task: Register `MemoryMatch` lazy loader in `src/scenes/sceneRegistry.ts` + update registry tests *(c7b44e5 — 18th loader; key-list test updated to 18)*
- [x] Task: Load 3 new SVGs in `PreloadScene` (tile + sticker + card back; 159 → 162) *(c7b44e5 — SHAPE_ASSETS + imports; navigation preload-count test 159→162)*
- [x] Task: Hub grid — 18 tiles in 5×3+3 (row 4 = 3 left-aligned tiles; verify sticker shelf / play-time arc still fit; iconDisplay 52/iconOffsetY -44) *(c7b44e5 — 18th GAME_TILES entry; canvas-fit test 17→18; shelf slots 16→17 where one sticker earned)*
- [x] Task: Regression tests — old saves migrate cleanly, navigation test covers 18 tiles, sceneRegistry tests updated *(c7b44e5 — navigation 351/351 incl. GAME_SCENE_KEYS completed to 18 in hub order (also closes pre-existing OddOneOut..TakeAway coverage gap); SettingsPanel 18 rows 6+6+6; hasSticker call counts 34→36; hubScene/firstWordsIntegration 18 tiles)*
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) *(c8bca98 — navigation 351/351 standalone; all 8 changed files green; full-suite baseline unchanged: 2 known machine-load flakes)*

## Phase 5 — Docs & Release Readiness

- [ ] Task: Update `conductor/product.md` (Game 18 row, games target 17 → 18, hub grid 5×3+3, working-memory amendment)
- [ ] Task: Update `conductor/tech-stack.md` with dated design note (Game 18, memoryMatchLogic in logic tree, card/flip design)
- [ ] Task: Update `docs/PRD.md` (Game 18 section) and `docs/TDD.md` as needed
- [ ] Task: Update `README.md` (games table, hub experience notes)
- [ ] Task: Full quality gates — `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
