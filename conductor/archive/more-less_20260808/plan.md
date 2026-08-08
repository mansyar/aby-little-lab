# Plan — Game 13: "More or Less" (Quantity Comparison)

**Track:** `more-less_20260808` · **Branch:** `feat/game-13`

## Phase 1 — Pure Game Logic (TDD) *[checkpoint: 876dff1]*

- [x] Task: Write failing tests for `src/game/moreLessLogic.ts` (Red phase): playthrough generation (6 rounds; 2 per band 1–3/1–5/1–10; exactly 3 "more" + 3 "less" shuffled; two distinct counts per round), item-type assignment & shuffle, answer evaluation, win detection *(77880ef)*
- [x] Task: Implement `src/game/moreLessLogic.ts` pure functions to pass (Green phase): `createPlaythrough`, `createRound`, `evaluateRound`; win detection lives in-scene (`roundIndex >= rounds.length`, per `countLogic`/HowManyScene convention — no standalone `isPlaythroughComplete` export) *(77880ef)*
- [x] Task: Verify coverage for `moreLessLogic.ts` (>80%; project runs ~98%) *(77880ef — 100% stmts/branch/funcs/lines; full suite 44 files/1079 tests green)*
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Assets & Prompt Audio *[checkpoint: 126b99c]*

- [x] Task: Create `src/assets/svg/ui/arrow_up.svg` + `arrow_down.svg` (512×512 storybook style, thick `#2D3748` outline, soft vibrant fill) *(9b641be)*
- [x] Task: Create `tile_more_less.svg` (Hub tile icon: two dot-groups + arrow) and `sticker_more_less.svg` (cream badge, two groups + arrow) *(9b641be)*
- [x] Task: Verify `speakWord("more"/"less")` (existing speech tests — en-US, rate 0.8, SFX-gated, silent fallback; no code change expected) *(9b641be — speakWord → speakText(word, enabled, 0.8) is fully generic; no code change needed)*
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Scene Implementation *[checkpoint: a186525]*

- [x] Task: Write scene tests following `howManyScene.test.ts` style: round setup (arrow cue, two cards, counts/layout), correct tap → advance, incorrect tap → wiggle + no penalty, prompt on round start, more-vs-less evaluation, win flow + `{ justEarned: "more-less" }`, parental-lock exit, input-lock reset on relaunch (regression per first-words fix) *(0ca2859)*
- [x] Task: Implement `MoreLessScene.ts` (scene key `MoreLess`): arrow cue (~256px, pop-in, arrow_down texture for "less"), two group cards with N item copies (~48px loose grid), pressFeedback, progress dots, mascot cheer/nod/big-cheer, shared win celebration, auto-return after 3s *(0ca2859 — 14 tests, full suite 45 files/1093 green, scene coverage 94.5% lines)*
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Integration *[checkpoint: 17e00dc]*

- [x] Task: Add `more-less` to `GameId` union (`src/types/index.ts`); `GAME_IDS` backfill in `profileLogic.ts` covers old saves via per-key merge *(0ca2859 — pulled forward into Phase 3; `hasSticker("more-less")` is called by the scene's win flow, same as how-many)*
- [x] Task: Register `MoreLess` lazy loader in `src/scenes/sceneRegistry.ts` + update registry tests *(d056f21)*
- [x] Task: Load 4 new SVGs in `PreloadScene` (2 arrows + tile + sticker) *(d056f21 — 144 → 148)*
- [x] Task: Hub grid — 13 tiles in 5×3 (row 3 gains More or Less; verify fill logic left-aligns and sticker shelf / play-time arc still fit) *(d056f21 — `col = i % GRID_COLS` left-aligns row 3 automatically; shelf slot counts 12 → 13 in tests)*
- [x] Task: Regression tests — old saves migrate cleanly, navigation test covers 13 tiles, sceneRegistry tests updated *(d056f21 — navigation 350 tests, full suite 45 files/1101 green; new v1 migration test backfills `more-less`)*
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5 — Docs & Release Readiness *[checkpoint: 2d521b2]*

- [x] Task: Update `conductor/product.md` (Game 13 row, hub grid 13 tiles, quantity-comparison amendment) *(2335df1)*
- [x] Task: Update `conductor/tech-stack.md` with dated design note (Game 13, asset pipeline additions) *(2335df1)*
- [x] Task: Update `docs/PRD.md` (Game 13 section) and `docs/TDD.md` (scene/structure notes) as needed *(2335df1)*
- [x] Task: Update `README.md` (games table, hub experience notes) *(2335df1)*
- [x] Task: Full quality gates — `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js` *(2335df1 — check clean (Biome fixed 3 organizeImports), full suite 45 files/1101 tests, build OK, validate-pwa 13 passed)*
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase: Review Fixes

- [x] Task: Apply review suggestions *(01bd524 — clarified plan.md Task wording: win detection is in-scene per countLogic/HowManyScene convention; no code changes needed — 2 informational Low findings only)*
