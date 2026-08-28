# Plan: Game 20 — Number Order — Line Them Up (5×4 Grid Completer)

**Track ID:** `number-order_20260828` · **Type:** Feature · **Status:** new
**Spec:** [./spec.md](./spec.md) — Source of Truth for scope
**Workflow:** [../../workflow.md](../../workflow.md) — Source of Truth for process
**Branch:** `feature/game20-grid-completer`

## Goal

Add Game 20 where kids **drag shuffled numerals into ascending order** — 6 rounds (3/4/5 numerals, ranges 1–5/1–8/1–10, easy-first), auto-validate on last slot fill (green flash + chime / wiggle + bounce-home), tap-to-hear numerals SFX-gated, 2 new SVGs only (tile staircase + sticker badge), Hub becomes perfect **5×4 (20 tiles, 5/5/5/5)** with preload 168→170, adaptive ±1 via existing `getAdaptiveBandShift` plumbing, per-profile progress paging `6+6+6+2`.

## Conventions (per workflow.md)

- Per task: select → mark `[~]` → failing tests (TDD Red) → implement (Green) → refactor → verify coverage → commit (`<type>(<scope>): <desc>`) → `git notes add` summary → record SHA in this plan → plan commit (`conductor(plan): update track progress`).
- Quality gates before every checkpoint: `pnpm run check` · `CI=true pnpm test` · `pnpm run build` · `node scripts/validate-pwa.js` + dev-server smoke (Boot→Hub→Game→Hub).
- Coverage floors: project current ~96.7% lines / ~88% stmts / ~92% funcs / ~98% branches — maintain; new modules (`numberOrderLogic`, `NumberOrderScene` logic) ≥95% lines.

## Phase 1 — Pure Logic (TDD)

- [x] Task 1.1: `numberOrderLogic` — round/playthrough generation (TDD) [f5ef42e]
  - Create `src/game/numberOrderLogic.ts` with pure functions: `bands` constants (`BAND_RANGES = {1:[1,5], 2:[1,8], 3:[1,10]}`, `BAND_COUNTS = {1:3, 2:4, 3:5}`), `buildRound(band, rng): { shuffled: number[], solution: number[] }` (sample `count` unique numbers from range, `solution = sorted`, `shuffled = shuffle(solution, rng)` with not-ascending guard reshuffle once), `buildPlaythrough(rng, shift=0): 6×rounds` using `shiftLadder([1,1,2,2,3,3], shift)` mapped to bands, `isCorrect(placed: number[], solution: number[]): boolean` (length+value equality), `solutionFor(range,count,rng)` helper private.
  - Failing tests (`src/__tests__/game/numberOrderLogic.test.ts`): bands produce correct count+range, shuffled not-ascending, solution ascending, isCorrect true only for exact match, shift 0 = classic fixture (lock 6-round bands `[1,1,2,2,3,3]`), shift −1 = `[1,1,1,1,2,2]` (4×3,2×4), shift +1 = `[2,2,3,3,3,3]` (2×4,4×5), uniqueness per round, determinism given seed.

- [x] Task: Phase Verification & Checkpoint [58d3b45]

## Phase 2 — Scene & Prompt Audio

- [ ] Task 2.1: `NumberOrderScene` (inherits GameSceneBase) — drag-to-slots + auto-validate (TDD where logic, visual verification otherwise)
  - `src/scenes/NumberOrderScene.ts` key `NumberOrder` extends `GameSceneBase`: `create()` reads `numberOrderLogic.buildPlaythrough(getRng(), getAdaptiveBandShift('number-order'))` (RNG seeded from `Math.random` or test-injected helper; shift pluggable default 0), renders top source row of draggable numeral images (`numeral_<n>` texture, 140×160, scale from 512), bottom slot row of 3–5 empty outlines (rounded rect Graphics, `lineStyle(4, 0x2D3748)`, matching count), `progressDots` 6 via `createProgressDots(6)` / `fillProgressDot`, `createBackButton` / `createCornerMascot` / `registerShutdownCleanup`, drag handling via shared `utils/dragJuice.ts` (lift 1.1× + 4° tilt + shadow, `isReducedMotion` halves), snap to nearest slot (`Back.out` 180ms), swap occupied slots, tap-to-return via `pointerup` on placed card, tap-to-hear via `pointerdown` → `speakNumber(n)` SFX-gated on every card, auto-validate on `slotsFull` → correct: flash `#68D391` + `playCorrect` + mascot cheer + `recordCorrect()` + 700ms `NEXT_ROUND_DELAY` advance / wrong: wiggle ±4° (`isReducedMotion` →2°) + `playIncorrect` + mascot nod + `recordWrong()` + bounce-home offending cards (250ms), `inputLocked` during transitions/celebration/wiggle, win: `createWinCelebration` rays+confetti ~700ms + big cheer + `completeGame('number-order')` sticker + `AUTO_RETURN 3000` with `{ justEarned: 'number-order' }`, relaunch resets `inputLocked`+`progressDots`+`slots`.
  - Failing tests (`src/__tests__/scenes/numberOrderScene.test.ts`): prompt renders source+slots count per band, drag-to-slot snaps, swap works, tap-to-return bounces home, speakNumber called on tap when SFX on (silent when off), auto-validate correct advances after 700ms, wrong stays with wiggle + bounce-home, inputLocked blocks double-nav, win after 6 triggers celebration + completeGame + 3s auto-return, ParentLock exits to Hub, reduced-motion shortens/no-loops, relaunch resets.

- [ ] Task 2.2: TTS wiring audit (reuse, no new API)
  - Reuse `speakNumber` from `src/utils/speech.ts` (rate 0.9, en-US, SFX-gated, silent fallback) — already verified in Task 2.1 tests; add mirror assertions to `src/__tests__/utils/speech.test.ts` if gap (speakNumber called with numeral, respects SFX toggle, no throw when `speechSynthesis` undefined). Verify `unlockSpeechForUserGesture` inherited via Hub first tap (no scene change).

- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Assets, Preload, Hub & Registry

- [ ] Task 3.1: Tile + sticker + preload wiring (no TDD — visual)
  - `src/assets/svg/ui/tile_number_order.svg` — 4 mini numeral cards stepping 1→2→3 with right arrow + sparkle, flat fills, thick `#2D3748` 4–6px outline, soft palette (`--primary #2B6CB0`, `--success #68D391`, accent `#F6E05E`), 512×512 viewBox per `docs/SVG_STYLE.md`.
  - `src/assets/svg/stickers/sticker_number_order.svg` — cream badge `#FFF8E7` with 1-2-3 stepping blocks + gold star, thick outline, 512×512.
  - `PreloadScene` imports the 2 new SVGs (`tile_number_order`, `sticker_number_order`); preload count 168 → 170; verify crisp rasterization at 512 via `pnpm dev` manual + ensure no Baloo2 font regression (numerals are SVG textures, not glyph compositing, but HUD still uses Baloo2).
  - Verify: `pnpm run build` precache includes new assets, sticker shelf renders correctly on Hub (56px display, just-earned 1.15× burst).

- [ ] Task 3.2: GameId, registry, Hub 5×4 grid (TDD for storage/registry, visual for layout)
  - `src/types/index.ts` / `src/game/profileLogic.ts` `GameId` `+= 'number-order'`, `GAME_IDS` gains entry (additive v2 merge — `load()` backfills `stickers['number-order']` as `{ earned:false, earnedAt:null }`, `progress['number-order']` default, `activity` pruned to 7 days).
  - `src/scenes/sceneRegistry.ts` 23rd loader `NumberOrder → () => import('./NumberOrderScene.ts')` via `ensureSceneLoaded` (shell remains static: Boot/Preload/Hub static, game scenes lazy).
  - `HubScene` `GAME_TILES` 20th entry `{ sceneKey: 'NumberOrder', gameId: 'number-order', tileKey: 'tile_number_order' }` — grid becomes **5×4** (rows 5/5/5/5, row comment update, generic `col = i % 5` / `row = floor(i/5)` handles remainder; verify `startY` 119 + `tileHeight` 116 + spacing 22 still fit sticker shelf + play-time arc at bottom at 1024×768 — adjust only if manual smoke reveals clip, else keep).
  - Failing tests: `src/__tests__/utils/storage.test.ts` asserts backfill for `number-order` key, `src/__tests__/scenes/sceneRegistry.test.ts` asserts 23rd loader resolves, `src/__tests__/scenes/navigation.test.ts` asserts Hub has 20 tiles in 5×4 and tile tap calls `ensureSceneLoaded` → `transitionToScene('NumberOrder')`, `src/__tests__/game/profileLogic.test.ts` covers GAME_IDS paging `6+6+6+2`.

- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Adaptive, Progress Audit, Docs & Full Verification

- [ ] Task 4.1: Adaptive band wiring (reuse existing plumbing, TDD)
  - Thread `getAdaptiveBandShift('number-order')` at `NumberOrderScene.create()` into `numberOrderLogic.buildPlaythrough(rng, shift)` via `shiftLadder([1,1,2,2,3,3], shift)` (−1→`[1,1,1,1,2,2]`, 0→`[1,1,2,2,3,3]`, +1→`[2,2,3,3,3,3]`) mapped to numeral bands; shift 0 fixture proves byte-identity vs classic fixtures; respects `Settings.adaptiveDifficulty` toggle (device-level, default ON, WINDOW_SIZE 10, MIN_SAMPLE 6, UP 0.9 / DOWN 0.6).
  - Failing tests: `src/__tests__/game/adaptiveLogic.test.ts` facade for `number-order` id (toggle OFF→0, <6 taps→0, ≥90% over ≥6→+1, <60%→−1) + `numberOrderLogic.test.ts` shift sequences assert count/range per round under ±1.

- [ ] Task 4.2: Record-path & progress audit (no TDD unless gap)
  - Verify `recordCorrect()` / `recordWrong()` counters flushed via `completeGame()` → `progressLogic.recordResult` (per-profile plays/wins/correct/wrong/lastPlayedAt/recent window accuracy, ★ mastery at ≥3 wins), `recordGamePlay('number-order')` on Hub tile tap (nav-locked so duplicate launch can't double-count), Learning Progress overlay: row for `number-order` (accuracy bar + %, relative last-played, 7-day activity strip additive `activity`, paging `6+6+6+2` with 20 games), no mid-game time-limit cutoff, play-time `addPlayTime` only on `endPlaySession`.
  - If gaps found, add minimal wiring + tests; else PASS with note in git notes.

- [ ] Task 4.3: Docs amendments (no TDD)
  - `conductor/product.md` § Games table add Game 20 row (milestone: *numeral sequencing / ordinality*, mechanic: *drag shuffled numerals 3–5 into ascending slots, 6 rounds, easy-first 1–5/1–8/1–10 incl. adaptive ±1*), Hub note 19→20 tiles 5×3+4→5×4, progress note 6+6+6+1→6+6+6+2, changelog add 2026-08-28 Game 20 entry, adaptive note numeracy 4→5 (or 5+6 literacy-memory if counting new game in numeracy).
  - `conductor/tech-stack.md` Design Update add Game 20 entry, scenes 22→23, sceneRegistry 22→23 loaders, preload 168→170, project structure tree add `NumberOrderScene.ts` + `numberOrderLogic.ts` + `tile_number_order`/`sticker_number_order`, update tech-stack change log.
  - `README.md` (optional if release-signalled) bump Hub tile count / mini-game count 19→20; otherwise leave for release track.

- [ ] Task 4.4: Quality gates (full verification)
  - `pnpm run check` · `CI=true pnpm test` · `pnpm run build` · `node scripts/validate-pwa.js` + dev-server smoke: Boot → Preload → Hub (**20 tiles 5×4, no clipping**, play-time arc/justEarned still fit) → Number Order 6 rounds (verify bands r1–2×3@1-5, r3–4×4@1-8, r5–6×5@1-10, tap-to-hear numerals, drag-swap+tap-return, auto-validate correct 700ms advance / wrong wiggle+bounce-home) → win celebration (rays+confetti ~700ms, 3000ms auto-return with `justEarned:'number-order'` → Hub shelf shimmer) → ParentLock 3s hold exit; `prefers-reduced-motion` disables bob/drift/burst + shortens pops/wiggle; offline precache smoke.

- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
