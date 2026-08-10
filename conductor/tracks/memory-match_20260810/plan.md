# Plan — Game 18: "Memory Match" (Visual Working Memory)

**Track:** `memory-match_20260810` · **Branch:** `feat/game-18`

## Phase 1 — Pure Game Logic (TDD)

- [x] Task: Write failing tests for `src/game/memoryMatchLogic.ts` (Red phase): playthrough generation (6 rounds; rounds 1–2 = 2×3 grid / 3 pairs, rounds 3–4 = 3×4 / 6 pairs, rounds 5–6 = 4×4 / 8 pairs; all pair textures distinct within a round; shuffled positions; no texture repeats within a round), round building, match-state helpers (reveal, matched set, round-complete, playthrough-complete) *(f8ba17a — 23 tests, Red confirmed: module missing)*
- [x] Task: Implement `src/game/memoryMatchLogic.ts` pure functions to pass (Green phase): `buildPlaythrough`, `buildRound`, pair/match evaluation helpers + band/POOL constants *(f8ba17a — 23 tests Green)*
- [x] Task: Verify coverage for `memoryMatchLogic.ts` (>80%; project runs ~95% lines) *(100% stmts/branch/funcs/lines)*
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Assets (3 SVGs)

- [ ] Task: Create `src/assets/svg/ui/tiles/tile_memory_match.svg` (Hub tile icon: mini face-down cards with one pair revealed; 512×512 storybook style, thick `#2D3748` outline per `docs/SVG_STYLE.md`)
- [ ] Task: Create `src/assets/svg/stickers/sticker_memory_match.svg` (cream badge, two matching cards)
- [ ] Task: Create `src/assets/svg/ui/gameplay/card_back.svg` (face-down card back: cream card, star motif, storybook style)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Scene Implementation

- [ ] Task: Write scene tests following `colorMatchScene.test.ts` style: deal (face-down cards, grid per band), tap reveal flip, matched pair locks face-up + success flash, mismatch flips back + wiggle + no penalty, input locked during transitions, round advance ~700ms with dot pop, win flow + `{ justEarned: "memory-match" }`, parental-lock exit, input-lock reset on relaunch (regression per first-words fix)
- [ ] Task: Implement `MemoryMatchScene.ts` (scene key `MemoryMatch`): rounded-rect card bases + `card_back` texture face-down, flip via scaleX 1→0→1 with face swap, ~140–160px cards (≥96px touch), pressFeedback, progress dots (6), mascot cheer/nod/big-cheer, shared win celebration, auto-return after 3s, no speaker button (no speech)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Integration

- [ ] Task: Add `memory-match` to `GameId` union (`src/types/index.ts`); `GAME_IDS` backfill in `profileLogic.ts` covers old saves via per-key merge (pulled forward as scene prerequisite, per color-match precedent)
- [ ] Task: Register `MemoryMatch` lazy loader in `src/scenes/sceneRegistry.ts` + update registry tests
- [ ] Task: Load 3 new SVGs in `PreloadScene` (tile + sticker + card back; 159 → 162)
- [ ] Task: Hub grid — 18 tiles in 5×3+3 (row 4 = 3 left-aligned tiles; verify sticker shelf / play-time arc still fit; iconDisplay 52/iconOffsetY -44)
- [ ] Task: Regression tests — old saves migrate cleanly, navigation test covers 18 tiles, sceneRegistry tests updated
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5 — Docs & Release Readiness

- [ ] Task: Update `conductor/product.md` (Game 18 row, games target 17 → 18, hub grid 5×3+3, working-memory amendment)
- [ ] Task: Update `conductor/tech-stack.md` with dated design note (Game 18, memoryMatchLogic in logic tree, card/flip design)
- [ ] Task: Update `docs/PRD.md` (Game 18 section) and `docs/TDD.md` as needed
- [ ] Task: Update `README.md` (games table, hub experience notes)
- [ ] Task: Full quality gates — `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
