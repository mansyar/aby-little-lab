# Spec — Game 20: "Number Order — Line Them Up" (5×4 Grid Completer)

**Track:** `number-order_20260828` · **Type:** Feature · **Branch:** `feature/game20-grid-completer`

## 1. Overview

Aby's Little Lab gains its 20th mini-game teaching **early numeracy ordinality and sequencing**. Each round shows **3–5 shuffled numerals** in a top source row; the child **drags numerals into ascending order** in a bottom slot row (left → right, smallest to largest). Auto-validation fires when the last slot is filled; correct order celebrates and advances, incorrect order wiggles and returns the offending card.

This completes the Hub to a perfect **5×4 grid (20 tiles, 4 full rows of 5)** — resolving the 19-tile 5×3+4 asymmetry left by Game 19 — and closes the numeracy arc: *How Many* counts, *More/Less* compares, *Add It Up* / *Take Away* compute, and **Number Order** sequences. Zero new numeral art (reuses `numeral_0…9` SVGs), zero new runtime dependencies, fully adaptive-ready via the existing `getAdaptiveBandShift` plumbing.

## 2. Product Definition Amendment

- **Games 19 → 20.** Hub grid becomes **5×4** (rows 5/5/5/5 — 4 complete rows, no partial row). Generic `col = i % 5` / `row = floor(i/5)` layout already handles remainder; only tile count, row comment, `startY`, and shelf spacing need verification at 1024×768.
- **Milestone:** *numeral sequencing / ordinality* — mechanic: *drag shuffled numerals (3–5) into ascending slots (1 row source → 1 row slots), 6 rounds, easy-first bands*.
- **Zero-text tenet:** numerals ARE the learning content and remain large + spoken via `speakNumber` on interaction. No written instructions appear; empty slot outlines ARE the prompt.
- **Cross-game systems:** Replay Variety (shuffled per playthrough), Adaptive Difficulty (±1 band via `getAdaptiveBandShift`, gated by `Settings.adaptiveDifficulty`), Tap-to-hear numerals (SFX-gated), per-profile Sticker/Progress with paging `6+6+6+2`, Play-Time Limits never interrupts mid-round.
- **Assets:** +2 SVGs only — `tile_number_order` + `sticker_number_order` — preload 168 → 170. No new numeral/item SVGs.

## 3. Functional Requirements

### FR-1 — Playthrough generation (`src/game/numberOrderLogic.ts`, pure functions)

- **Numeral universe:** 0–10 available (`src/assets/svg/numerals/numeral_0…10` — actually 0–9 + 10 composition; reuse existing 10 numeral SVGs). Bands restrict to contiguous ranges:
  - **Band 1 (easy):** range **1–5**, **3 numerals** per round.
  - **Band 2 (medium):** range **1–8**, **4 numerals** per round.
  - **Band 3 (hard):** range **1–10**, **5 numerals** per round.
- **Easy-first sequencing (6 rounds, replay-variety, per existing numeracy games):**
  - Rounds 1–2 → Band 1 (3 numbers, span 1–5)
  - Rounds 3–4 → Band 2 (4 numbers, span 1–8)
  - Rounds 5–6 → Band 3 (5 numbers, span 1–10)
  - Each round's shuffled order is guaranteed **not-ascending** (if RNG yields sorted, reshuffle once).
  - Numbers within a round are **unique** (no repeats in a single order).
  - Across the 6 rounds, numbers may reappear (small universe); uniqueness only enforced per round.
- **Round shape:** `{ numerals: number[] /* shuffled initial */, solution: number[] /* sorted ascending */, slots: (number|null)[] /* current placement */ }` or simpler `{ numerals: number[] /* solution */, shuffled: number[] }` — chosen to make scene rendering trivial and testing deterministic. Exposes `isCorrect(placed: number[]): boolean` which returns true iff `placed` equals `solution`.
- **Adaptive-ready:** `buildRound(band, rng)` + `buildPlaythrough(rng, shift = 0)` + `isCorrect(placed, solution)`. Mapping via `shiftLadder([1,1,2,2,3,3], shift)`:
  - `shift 0` → `[1,1,2,2,3,3]` = classic easy-first (2×3, 2×4, 2×5) — **byte-identical fixture**.
  - `shift -1` → `[1,1,1,1,2,2]` = 4×easy + 2×medium (struggling).
  - `shift +1` → `[2,2,3,3,3,3]` = 2×medium + 4×hard (thriving).
  - Respects `Settings.adaptiveDifficulty` toggle (device-level, default ON, WINDOW_SIZE 10, MIN_SAMPLE 6, UP 0.9 / DOWN 0.6).
- **Purity:** zero Phaser dependency; injected `rng` for determinism; fully unit-testable (mirror `countLogic` / `decodeLogic`).

### FR-2 — Round flow (`src/scenes/NumberOrderScene.ts`, key `NumberOrder`, extends `GameSceneBase`)

- **Layout (1024×768, FIT):**
  - **Source row** (top, y ≈ 260): 3–5 draggable numeral cards, centered, spacing mirrors `Build the Word` source row; each card displays its numeral via `numeral_<n>` texture at ≥96px hit area, card size ~140×160, `setDisplaySize(140,160)` or proportional to fit 5-wide within 900px content width.
  - **Slot row** (bottom, y ≈ 520): 3–5 empty slot outlines (dashed `0x2D3748` 3px, rounded 12px rect, subtle `#FAF9F6` fill) matching round's count; slot size equals card size; centered.
  - **Progress dots:** 6 via `createProgressDots(6)` / `fillProgressDot` at bottom, mascot corner, Back button top-left.
- **Interaction (drag-to-slots, free correction):**
  - Drag card → `dragJuice`-lifted (1.1× scale, 4° tilt, `isReducedMotion` halves lift), snap to nearest empty slot on drop (`Back.out` 180ms settlement); if dropped outside slots, tween home.
  - **Swap behavior:** dragging a placed card to an occupied slot swaps positions; tapping a placed card bounces it back to the source row (nearest empty source slot).
  - **Tap-to-hear:** on `pointerdown` for any numeral card, call `speakNumber(n)` SFX-gated (SFX ON → rate 0.9 en-US, SFX OFF or unavailable → silent); supports pre-reader confirmation without being required to solve.
  - **Auto-validation:** when `slots.every(s => s !== null)` (last slot filled), evaluate `isCorrect(slots)` automatically — no manual Check button:
    - **Correct:** slot row flashes `--success` `#68D391` + `playCorrect` chime + corner mascot cheer + `recordCorrect()` + dot pop (`Back.out`, `DOT_POP_*`); next round after ~700ms (`NEXT_ROUND_DELAY`); after 6 correct triggers shared win celebration (`createWinCelebration` 10 rays + 10 confetti ~700ms) + mascot big cheer.
    - **Incorrect:** wrong-placed slots wiggle ±4° + `playIncorrect` soft tone + mascot nod + `recordWrong()`; offending cards (those not matching `solution[index]`) bounce home to source after wiggle (250ms); child retries same numerals (reshuffle not needed).
  - **Lifecycle:** `GameSceneBase.completeGame('number-order')` on 6th correct → `sticker_number_order` (first time), auto-return to Hub after `AUTO_RETURN 3000ms` with `{ justEarned: 'number-order' }`. `progressDots` + `inputLocked` reset on `create()` relaunch; `inputLocked` guards during transitions/celebration/wiggle.
  - **Inherited:** `createBackButton`, `createCornerMascot`, `createProgressDots`/`fillProgressDot`, `completeGame`, `registerShutdownCleanup`, `isReducedMotion` — all from `GameSceneBase`; corner mascot bottom-right bob+blink idle.

### FR-3 — Audio via `src/utils/speech.ts` (reuse, no new API)

- Reuse `speakNumber(n: number)` (en-US, rate 0.9) for tap-to-hear numerals — same plumbing as Game 11 How Many. Respects SFX toggle (`sfxEnabled === false` → silent), silent fallback when `speechSynthesis` unavailable, `unlockSpeechForUserGesture` already wired in Hub first tap.
- No persistent spoken instruction ("Put them in order" deferred — visual empty slots ARE the prompt). Speaker button not needed because every card is itself tappable-hear.
- Validation tones use `AudioManager.playCorrect` / `playIncorrect` (synthesized WebAudio), not speech.

### FR-4 — Assets (2 new SVGs, storybook flat)

- `tile_number_order.svg` — Hub tile icon: **ascending staircase** of 3 mini numeral cards (1→2→3) with a rightward arrow + sparkle, flat fills, thick `#2D3748` 4–6px outline, soft vibrant palette (`#2B6CB0` / `#68D391` / `#F6E05E` per palette), 512×512 viewBox.
- `sticker_number_order.svg` — completion sticker: **cream badge `#FFF8E7`** with 1-2-3 stepping blocks + gold star, thick outline, storybook flat.
- **Preload:** 168 → 170 (2 new SVGs). Phaser rasterizes at 512×512; `ensureGlyphFontLoaded` in Boot already guarantees Baloo 2 for any text (not needed — numerals are SVG textures, but font preload remains for HUD).
- **Styling contract:** numeral cards reuse `numeral_0…9` textures directly via `image.setTexture('numeral_'+n)` (no new numerals, no glyph SVGs, no CSS text scaling issues).

### FR-5 — Integration

- **Types & Storage:** `GameId` union in `src/types/index.ts` / `src/game/profileLogic.ts` gains `number-order`; `GAME_IDS` gains entry for additive v2 backfill (`load()` backfills `stickers['number-order']` as `{ earned:false, earnedAt:null }` for old saves). Profile `progress`/`activity` maps extend identically; `PROFILES_VERSION` unchanged (still `abby-little-lab:v2`).
- **Scene Registry:** `src/scenes/sceneRegistry.ts` 23rd loader `NumberOrder → () => import('./NumberOrderScene.ts')` via `ensureSceneLoaded` (Hub remains static, game scenes lazy as before).
- **PreloadScene:** imports the 2 new SVGs (`tile_number_order`, `sticker_number_order`); keys follow `gameId.replace(/-/g,'_')` convention → `sticker_number_order`.
- **HubScene:** `GAME_TILES` 20th entry `{ sceneKey: 'NumberOrder', gameId: 'number-order', tileKey: 'tile_number_order' }` — grid becomes **5×4**; row constant comments updated (4 full rows). Verify sticker shelf (56px) + play-time arc still fit: tiles 160×116 (current size post-hotfix), spacing 22, `startY` ~119 precedent proved for 5×4 at 1024×768 — adjust only if smoke reveals clipping (no speculative resize).
- **Mascot & Progress:** `recordCorrect()` / `recordWrong()` flushed via `completeGame()` → `recordResult` (accuracy in parent Learning Progress); `recordGamePlay('number-order')` on Hub tile tap (nav-locked). Learning Progress overlay: paging `6+6+6+2` (20 games), row for `number-order` (plays/wins/accuracy bar + %, ★ mastery ≥3 wins, relative last-played, 7-day strip additive `activity`).
- **Adaptive plumbing:** scene reads `getAdaptiveBandShift('number-order')` at `create()` into `buildPlaythrough(rng, shift)` via `shiftLadder`; invisible to kids, 부모 toggle `Settings.adaptiveDifficulty` gates it (same 10-tap window, UP 0.9 / DOWN 0.6, MIN_SAMPLE 6). Shift 0 fixture proves byte-identity classic.

## 4. Non-Functional Requirements

- **Touch:** all interactive elements ≥96×96 hit area (cards 140×160, slots sized match, tap-to-return handled via frame hitTest).
- **Motion:** all tweens via `utils/motion.ts` (`isReducedMotion`, `motionDuration`, `motionScale`): `isReducedMotion` true → 40% shorter pops, no bob/drift/burst loops, wiggle reduced to 2°; TTS unaffected.
- **Drag juice:** reuses shared `utils/dragJuice.ts` (lift 1.1× + 4° tilt + snap settle + shadow drop) — reduced-motion aware.
- **Pure logic:** `numberOrderLogic.ts` zero Phaser deps, ≥95% lines covered (project floor ~96.7% lines / 88% stmts / 92% funcs / 98% branches — maintain).
- **No runtime deps:** Phaser Graphics + SpeechSynthesis are platform APIs; WebAudio SFX already synthesized.
- **PWA:** new SVGs precached via `vite.config.ts` `includeAssets` (`src/assets/svg/**/*`).
- **Performance:** scene bundle ≤5kB gzipped (precedent DecodeIt 4.06kB); 60fps drag, <3s boot budget preserved (2 SVG delta negligible).

## 5. Acceptance Criteria

1. **Playthrough:** `buildPlaythrough(rng)` returns 6 rounds in bands easy(1–5×3, r1–2) / medium(1–8×4, r3–4) / hard(1–10×5, r5–6), each round has `shuffled` not-ascending, `solution` ascending, `shuffled` unique per round, `isCorrect(placed)` true iff `placed` equals `solution`; `shift 0` fixture byte-identical to classic; `shift -1` gives 4×easy+2×medium, `shift +1` gives 2×medium+4×hard.
2. **Round flow:** source row (shuffled numerals) + slot row (empty outlines sized to count) render; dragging numerals snaps to slots with juice; swap/tap-to-return works; tapping any numeral speaks its value SFX-gated (silent when off); filling last slot auto-validates — correct flashes green + chime + mascot cheer + dot pop + 700ms advance; wrong wiggles + tone + mascot nod + bounce home, no round advance; input locked during transitions/celebration; after 6 correct: win rays+confetti ~700ms + sticker `number-order` (first time) + 3s auto-return `{ justEarned }` to Hub.
3. **Hub & persistence:** Hub shows **20 tiles in perfect 5×4 (5/5/5/5)** — no clipping, no overlap with sticker shelf or play-time arc at 1024×768; 20th tile launches Number Order via `ensureSceneLoaded`; pre-existing saves backfill cleanly (`number-order` sticker + progress/activity entries default zero); Learning Progress overlay pages `6+6+6+2` and shows `number-order` row (plays/wins/accuracy %, ★ at ≥3 wins, relative last-played, 7-day strip, additive activity).
4. **Assets:** 2 new SVGs (tile staircase + sticker badge) render crisp at 512px, pass `docs/SVG_STYLE.md` flat+thick-outline contract, preload count reflects 170, sticker shelf shows `sticker_number_order` with just-earned bounce 1.15× burst.
5. **Quality gates:** `pnpm run check` clean (≤ decorative warns), `CI=true pnpm test` green (new suites + full ~1700+ tests, coverage ≥95% for new modules), `pnpm run build` succeeds with 23rd game chunk, `node scripts/validate-pwa.js` 15/15, manual smoke (Boot → Hub 20 tiles → Number Order 6 rounds (3/4/5) → correct/wrong feedback → win+3s auto-return → justEarned shimmer, ParentalLock 3s hold, `prefers-reduced-motion` short/no-loop) passes.

## 6. Out of Scope

- No new numeral/item glyph SVGs (numerals 0–10 already exist).
- No persistent ranked difficulty UI (adaptivity invisible — no tier text/badge).
- No manual Check/Verify button, no move counter, no timer, no hint system.
- No segmented spoken counting (e.g., "one, two, three" sequence prompt) — tap-to-hear is the only speech.
- No changes to the 19 existing games beyond storage backfill and registry preload.

## 7. Dependencies & Risks

- `GameSceneBase` drag/spawn/celebration contracts (BACK_OUT, NEXT_ROUND, AUTO_RETURN, DOT_POP) — reuse, not fork.
- `profileLogic` / `progressLogic` additive maps — verify `load()` backfill for `number-order` preserves old saves (no `PROFILE_VERSION` bump needed, test analogous to `decode-it_20260828`).
- Hub 5×4 fit at 1024×768 — verified manually; if tile 20 clips on smallest phone landscape, reduce `tileSpacing` or `tileHeight` by ≤6px as surgical follow-up (not speculative).
