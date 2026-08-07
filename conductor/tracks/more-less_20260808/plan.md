# Plan — Game 13: "More or Less" (Quantity Comparison)

**Track:** `more-less_20260808` · **Branch:** `feat/game-13`

## Phase 1 — Pure Game Logic (TDD) *[checkpoint: 876dff1]*

- [x] Task: Write failing tests for `src/game/moreLessLogic.ts` (Red phase): playthrough generation (6 rounds; 2 per band 1–3/1–5/1–10; exactly 3 "more" + 3 "less" shuffled; two distinct counts per round), item-type assignment & shuffle, answer evaluation, win detection *(77880ef)*
- [x] Task: Implement `src/game/moreLessLogic.ts` pure functions to pass (Green phase): `createPlaythrough`, `createRound`, `evaluateRound` / `isPlaythroughComplete` *(77880ef)*
- [x] Task: Verify coverage for `moreLessLogic.ts` (>80%; project runs ~98%) *(77880ef — 100% stmts/branch/funcs/lines; full suite 44 files/1079 tests green)*
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Assets & Prompt Audio *[checkpoint: 126b99c]*

- [x] Task: Create `src/assets/svg/ui/arrow_up.svg` + `arrow_down.svg` (512×512 storybook style, thick `#2D3748` outline, soft vibrant fill) *(9b641be)*
- [x] Task: Create `tile_more_less.svg` (Hub tile icon: two dot-groups + arrow) and `sticker_more_less.svg` (cream badge, two groups + arrow) *(9b641be)*
- [x] Task: Verify `speakWord("more"/"less")` (existing speech tests — en-US, rate 0.8, SFX-gated, silent fallback; no code change expected) *(9b641be — speakWord → speakText(word, enabled, 0.8) is fully generic; no code change needed)*
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Scene Implementation

- [ ] Task: Write scene tests following `howManyScene.test.ts` style: round setup (arrow cue, two cards, counts/layout), correct tap → advance, incorrect tap → wiggle + no penalty, prompt on round start, more-vs-less evaluation, win flow + `{ justEarned: "more-less" }`, parental-lock exit, input-lock reset on relaunch (regression per first-words fix)
- [ ] Task: Implement `MoreLessScene.ts` (scene key `MoreLess`): arrow cue (~256px, pop-in, rotated for "less"), two group cards with N item copies (~48px loose grid), pressFeedback, progress dots, mascot cheer/nod/big-cheer, shared win celebration, auto-return after 3s
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Integration

- [ ] Task: Add `more-less` to `GameId` union (`src/types/index.ts`); `GAME_IDS` backfill in `profileLogic.ts` covers old saves via per-key merge
- [ ] Task: Register `MoreLess` lazy loader in `src/scenes/sceneRegistry.ts` + update registry tests
- [ ] Task: Load 4 new SVGs in `PreloadScene` (2 arrows + tile + sticker)
- [ ] Task: Hub grid — 13 tiles in 5×3 (row 3 gains More or Less; verify fill logic left-aligns and sticker shelf / play-time arc still fit)
- [ ] Task: Regression tests — old saves migrate cleanly, navigation test covers 13 tiles, sceneRegistry tests updated
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5 — Docs & Release Readiness

- [ ] Task: Update `conductor/product.md` (Game 13 row, hub grid 13 tiles, quantity-comparison amendment)
- [ ] Task: Update `conductor/tech-stack.md` with dated design note (Game 13, asset pipeline additions)
- [ ] Task: Update `docs/PRD.md` (Game 13 section) and `docs/TDD.md` (scene/structure notes) as needed
- [ ] Task: Update `README.md` (games table, hub experience notes)
- [ ] Task: Full quality gates — `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase: Review Fixes

- [ ] Task: Apply review suggestions
