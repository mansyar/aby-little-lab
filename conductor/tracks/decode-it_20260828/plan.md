# Plan: Game 19 — Decode It (Picture + Spoken Word → Tap Written Word)

**Track ID:** `decode-it_20260828` · **Type:** Feature · **Status:** new
**Spec:** [./spec.md](./spec.md) — Source of Truth for scope
**Workflow:** [../../workflow.md](../../workflow.md) — Source of Truth for process
**Branch:** `feature/decode-it`

## Goal

Add Game 19 where the child sees a picture and hears the spoken word (classic prompting) then taps the correct written word among 4 cards. Reuse the 18-word pool + add 4 new CVC words with new item SVGs (pool 18→22, easy-first bands), 6 rounds × 4 choices, 2 bands (rounds 1–3 easy 3-letter / rounds 4–6 hard 4-letter), no-shared-first-letter + confusable guards, speaker replay, SFX-gated TTS, shared win celebration + sticker + auto-return, Hub 5×3+4 (19 tiles).

## Conventions (per workflow.md)

- Per task: select → mark `[~]` → failing tests → implement → coverage → commit (`<type>(<scope>): <desc>`) → `git notes add` summary → record SHA in this plan → plan commit.
- Quality gates before every checkpoint: `pnpm run check` · `CI=true pnpm test` · `pnpm run build` · `node scripts/validate-pwa.js` + dev-server smoke (Boot→Hub→Game→Hub).
- Coverage floors: project current ~96.7% lines / 88% stmts / 92% funcs / 98% branches — maintain; new modules ≥95% lines.

## Phase 1 — Word Pool + Pure Logic (TDD)

- [x] Task 1.1: Expand WORD_POOL 18→22 with 4 new decodable words + item SVGs (TDD fixture update) — e5ed52e
  - Add words FOX, CUP, MAP, BED — new textures `sm_fox`, `sm_cup`, `sm_map`, `sm_bed` under `src/assets/svg/items/` (storybook flat, `#2D3748` 4–6px outline, soft vibrant; FOX = orange fox head, CUP = teal cup, MAP = parchment map, BED = wooden bed) — reuse new textures as prompt images; letters already exist so no new glyph SVGs.
  - Update `src/game/wordLogic.ts` WORD_POOL / pool helpers or new `src/game/decodeLogic.ts` reusing wordLogic pool via import; preload count 162→166 (4 items; tile/sticker counted in Phase 3).
  - Failing tests (`src/__tests__/game/decodeLogic.test.ts`): pool contains 22 words, new words resolve to textures, 3-letter vs 4-letter tier partition (12 vs 10) correct, WORD_TO_TEXTURE mapping covers all 22.

- [x] Task 1.2: `decodeLogic` playthrough generation (TDD) — d417d3f
  - `buildRound(band, rng)` → `{ target, promptTexture, choices: string[4] }` with 4 unique choices incl. target, no two choices share first letter, confusable-family exclusion via `isConfusableWith` (families [C,G,O,Q], [I,L,T], [M,W]), prompt texture via WORD_POOL.
  - `buildPlaythrough(rng, shift = 0)` → 6 rounds: rounds 1–3 sample targets from 3-letter tier pool (12 words), rounds 4–6 from 4-letter tier (10 words), 6 unique targets per playthrough, position shuffle, deterministic given rng.
  - `isCorrect(round, choiceIndex)` → boolean; `shift` handling via `shiftLadder([1,1,2,2,3,3], shift)` mapped to tiers for future ±1 plumbing (shift 0 = classic fixture above; −1 → [1,1,1,1,2,2] = 4 easy + 2 hard; +1 → [2,2,3,3,3,3] = 2 easy + 4 hard). Guard shift 0 byte-identical.
  - Failing tests: all invariants + fixture playthrough at shift 0 locked (mirror `wordLogic.test.ts` / `colorMatchLogic.test.ts` conventions).

- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) — e3b2da6 [checkpoint: e3b2da6]

## Phase 2 — Scene & Prompt Audio

- [x] Task 2.1: `DecodeItScene` (inherits GameSceneBase) — visual flow (TDD where logic, visual verification otherwise) — b61b583
  - `src/scenes/DecodeItScene.ts` key `DecodeIt` extends `GameSceneBase`: `create()` reads `decodeLogic.buildPlaythrough(getAdaptiveBandShift('decode-it'))` (shift pluggable, default 0), renders prompt image (180px) top-center + 4 word cards row (160px cards, 128px letters, ≥96px touch, centered spacing), speaker button (frame hit area) replay, card tap → `isCorrect` → success flash (`--success` `#68D391`) + chime (`playCorrect`) + mascot cheer + `recordCorrect()` + dot pop 700ms (`NEXT_ROUND_DELAY`) / wiggle ±4° + soft tone (`playIncorrect`) + mascot nod + `recordWrong()` no penalty, `inputLocked` during transitions/celebration, `progressDots` 6 via `createProgressDots(6)` / `fillProgressDot`, `createBackButton` / `createCornerMascot` / `completeGame('decode-it')` + `{ justEarned: "decode-it" }`, shutdown cleanup via `registerShutdownCleanup`, relaunch resets `inputLocked` + `progressDots`.
  - Failing tests (`src/__tests__/scenes/decodeItScene.test.ts`): prompt renders, correct advances after 700ms, wrong stays with wiggle, speaker guarded during win, auto-return after 6, ParentLock hold exits to Hub, inputLocked resets on `create()` relaunch.

- [x] Task 2.2: TTS wiring via `src/utils/speech.ts` (no new API) — b61b583 (no new code; verified via DecodeItScene integration — speakWord rate0.8 SFX-gated, 2 scene tests + speech.test.ts)
  - Reuse `speakWord(word)` (rate 0.8, en-US) for target at round start, respects SFX toggle + silent fallback when SpeechSynthesis unavailable, `unlockSpeechForUserGesture` already wired via Hub; speaker button calls same utterance; guard when API missing.
  - Tests: speech mock asserts word spoken once per round, silent when SFX off, no throw when `speechSynthesis` undefined (mirror `speech.test.ts`).

- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Assets, Preload, Hub & Registry

- [ ] Task 3.1: Tile, sticker + preload wiring (no TDD — visual)
  - `src/assets/svg/ui/tile_decode_it.svg` (4 mini word cards, magnifying-glass + sparkle motif, flat fills, thick `#2D3748` 4–6px outline, soft vibrant, per `docs/SVG_STYLE.md`) + `src/assets/svg/stickers/sticker_decode_it.svg` (cream badge `#FFF8E7`, decoded word card with star/magnifier, thick outline) + 4 item SVGs per Phase 1 (if not already created).
  - `PreloadScene` imports the 6 new SVGs; preload count 162 → 168 (4 items + tile + sticker); icons follow SVG contact-sheet style; verify via `pnpm dev` manual + `BootScene.ensureGlyphFontLoaded` guarantees Baloo 2 for letter compositing.
  - Verify: `pnpm run build` precache includes new assets, sticker shelf renders correctly on Hub.

- [ ] Task 3.2: GameId, registry, Hub grid (TDD for storage/registry, visual for layout)
  - `src/types/index.ts` / `src/game/profileLogic.ts` `GameId` += `decode-it`, `GAME_IDS` gains entry for per-key backfill (additive v2 merge — `load()` backfills `stickers["decode-it"]` as `{ earned:false, earnedAt:null }` for old saves, no storage key change). Profile/sticker/progress maps extend identically.
  - `src/scenes/sceneRegistry.ts` add lazy loader `DecodeIt` → `() => import("./DecodeItScene.ts")` via `ensureSceneLoaded` (22nd loader; shell scenes remain static). `HubScene` `GAME_TILES` 19th entry `{ sceneKey: "DecodeIt", gameId: "decode-it", tileKey: "tile_decode_it" }` — **grid becomes 5×3+4 (rows 5/5/5/4, row 4 holds 4 left-aligned tiles, generic `col = i % 5` / `row = floor(i/5)` layout, sticker shelf + play-time arc fit check at 1024×768 — tiles 160×150, spacing 40, startY 119 precedent)**; tile tap awaits `ensureSceneLoaded(scene, "DecodeIt")` then `transitionToScene("DecodeIt")`.
  - Failing tests: `src/__tests__/utils/storage.test.ts` asserts backfill for `decode-it` key, `src/__tests__/scenes/sceneRegistry.test.ts` asserts lazy loader resolves, `src/__tests__/scenes/navigation.test.ts` asserts Hub has 19 tiles and tile tap transitions, `profileLogic.test.ts` covers GAME_IDS.

- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Adaptive, Progress Audit, Docs & Full Verification

- [ ] Task 4.1: Adaptive band wiring (reuse existing plumbing, TDD)
  - Thread `getAdaptiveBandShift('decode-it')` at `create()` into `buildPlaythrough(rng, shift)` via `shiftLadder([1,1,2,2,3,3], shift)` (−1 → [1,1,1,1,2,2], 0 → [1,1,2,2,3,3], +1 → [2,2,3,3,3,3]) mapped to word tiers; shift 0 fixture byte-identical to classic (regression lock); respects `Settings.adaptiveDifficulty` toggle (device-level, default ON, 10-tap window, UP_THRESHOLD 0.9 / DOWN_THRESHOLD 0.6, MIN_SAMPLE 6). No new toggle UI.
  - Failing tests: `src/__tests__/game/adaptiveLogic.test.ts` facade for `decode-it` id (toggle off →0, <6 taps →0, ≥90% over ≥6 →+1, <60% →−1) + `decodeLogic.test.ts` tier-split shift sequences (`earlyCount = roundCount − 1 − shift` style for word tiers).

- [ ] Task 4.2: Record-path & progress audit (no TDD unless gap)
  - Verify `recordCorrect()` / `recordWrong()` counters flushed via `completeGame()` → `recordResult` (accuracy in parent Learning Progress), `recordGamePlay('decode-it')` on Hub tile tap (nav-locked), Learning Progress overlay row for `decode-it` (plays/wins/accuracy bar + %, ★ mastery after 3 wins, relative last-played, 7-day activity strip, paging 6+6+6+1 with 19 games), no mid-game time-limit cutoff (Play-Time Limits never interrupts).
  - If gaps found, add minimal wiring + tests; else PASS with note in git notes.

- [ ] Task 4.3: Docs amendments (no TDD)
  - `conductor/product.md` §3.1 add Game 19 row (milestone: *early decoding / word recognition*, mechanic: *picture+spoken word → tap written word among 4 cards, 6 rounds, easy-first 3→4 letter bands*), §3.2 note adaptive now covers decode-it, add changelog entry dated 2026-08-28.
  - `conductor/tech-stack.md` add Design Update (Game 19 — Decode It) + preload 162→168, scene count 21→22, sceneRegistry note, project structure tree (`DecodeItScene`, `decodeLogic`, new item SVGs).

- [ ] Task 4.4: Quality gates (full verification)
  - `pnpm run check` · `CI=true pnpm test` · `pnpm run build` · `node scripts/validate-pwa.js` + dev-server smoke: Boot → Preload → Hub (19 tiles, 5×3+4, no clipping) → Decode It 6 rounds (picture+speech → 4 word cards) → correct/wrong feedback → win celebration + sticker `decode-it` + 3s auto-return with `justEarned` → Hub shelf shimmer; speaker replay test; ParentLock 3s hold exit; `prefers-reduced-motion` disables loops/shortens pops; offline precache smoke.

- [ ] Task 4.5: Conductor bookkeeping (review checkpoint → archive on completion)

- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
