# Spec — Game 19: "Decode It" (Early Decoding & Word Recognition)

**Track:** `decode-it_20260828` · **Type:** Feature · **Branch:** `feature/decode-it`

## 1. Overview

Aby's Little Lab gains a 19th mini-game teaching **early decoding & word recognition**. Each round shows a **picture prompt** of a familiar word and speaks the word aloud; the child **taps the correct printed word** among 4 word cards. 6 rounds per playthrough, win on 6 correct. This extends the literacy arc (Find the Letter → Find the Word → Build the Word → First Sounds → **Decode It**) as a **blending/decoding** complement to Find the Word: same picture+speech prompt but framed as sounding-out and choosing the decoded form. Hub grid grows 18 → 19 tiles (5×3+3 → 5×3+4, row 4 holds 4 left-aligned tiles).

## 2. Product Definition Amendment

- Games target extends **18 → 19**; Hub grid becomes **5×3+4** (rows 5/5/5/4 — row 4 holds 4 left-aligned tiles; generic modulo layout, no change to grid math beyond tile count and row comment).
- Extends the "zero text dependency" amendments: **decoding is the learning content** — the picture + spoken word are the prompt, printed words on cards are the learning content; no written instructions appear anywhere. Product docs gain the Game 19 row (milestone: *early decoding / word recognition*; mechanic: *see picture + hear word, tap matching printed word among 4*).
- Cross-game systems note: **Replay Variety** continues — items/words shuffle per playthrough; difficulty stays fixed in the initial ship (easy-first bands). Adaptive Difficulty (±1 band via `getAdaptiveBandShift`) is wired plumbing-ready (same toggle as the numeracy/literacy adaptive tracks) but **gated behind the existing `Settings.adaptiveDifficulty` switch** — shift 0 remains byte-identical to classic.
- Word pool expands **18 → 22** (see FR-4): four new CVC decodable words with new item SVGs to enrich the easy tier.

## 3. Functional Requirements

### FR-1 — Playthrough generation (`src/game/decodeLogic.ts`, pure functions)

- **Word pool:** reuses the shared `WORD_POOL` from `src/game/wordLogic.ts` (18 words: 3-letter tier CAT/DOG/PIG/CAR/OWL/SUN/HAT/BUG + 4-letter tier FROG/BALL/FISH/BOAT/TREE/BONE/STAR/DRUM/BEAR/DUCK) **plus 4 new highly-decodable CVC words** — **FOX, CUP, MAP, BED** — each with a new item texture (`sm_fox`, `sm_cup`, `sm_map`, `sm_bed`; `src/assets/svg/items/`). New words are 3-letter to strengthen the easy tier. Pool size 22; texture reuse for prompt images (no new glyph SVGs — letters already exist via `letters/letter_a…z.svg`).
- **Bands (easy-first, fixed within a playthrough, per replay-variety principle):**
  - Rounds 1–3 (**easy**): targets sampled **exclusively from the 3-letter tier** (12 words: 8 original + 4 new).
  - Rounds 4–6 (**hard**): targets sampled **exclusively from the 4-letter tier** (10 words: FROG/BALL/FISH/BOAT/TREE/BONE/STAR/DRUM/BEAR/DUCK).
  - 6 **unique targets** per playthrough (no word repeats within a session); if the easy tier is exhausted, shuffle-ban resets per band logic already in `wordLogic.ts`.
- **Round shape:** each round has `target: string` (uppercase word), `promptTexture: string` (item key, e.g. `sm_fox` → `animal_cat` mapping via `WORD_TO_TEXTURE` helper), `choices: string[4]` — 4 unique strings including target, exactly one correct, positions shuffled per round.
- **Distractor guards (pre-reader safeguards, reuse existing helpers):**
  - No two choices share the same **first letter** (mirrors `wordLogic` / `alphabetLogic` guard — prevents first-letter-only solving; fosters full-word decoding).
  - Confusable-letter-family exclusion for choices via `isConfusableWith` imported from `src/game/alphabetLogic.ts` (families [C,G,O,Q], [I,L,T], [M,W]) — distractors never share a confusable family with the target's first letter when possible; hard-tier allows families only when pool exhaustion forces it (same relaxation precedent as adaptive literacy hard band).
- **Adaptive-ready:** export `buildRound(band, rng)` + `buildPlaythrough(rng, shift = 0)` + `isCorrect(round, choiceIndex)` + `shift` handling via `shiftLadder([1,1,2,2,3,3], shift)` mapped to tiers for future ±1 plumbing (shift 0 = classic fixture above; −1 → easy-heavy [1,1,1,1,2,2] = 4 easy + 2 hard; +1 → hard-heavy [2,2,3,3,3,3] = 2 easy + 4 hard). Guard that shift 0 is byte-identical to pre-adaptive fixture.
- **Purity:** zero Phaser dependency; fully unit-testable with injected `rng` (like `wordLogic` / `countLogic`); 100% deterministic given seed.

### FR-2 — Round flow (scene `DecodeItScene.ts`, key `DecodeIt`, extends `GameSceneBase`)

- **Prompt:** picture image (180px display, centered top) of the target word's texture + target spoken once at round start (see FR-3). Prompt also serves as the large shared word image for pre-readers.
- **Answer:** 4 word cards in a **single row** centered (card 160×160 display minimum, word rendered by composing `letter_a…z` textures at ~80px/letter, card min height 160px per WordMatch precedent; ≥96×96 touch hit area via default frame; spacing mirrors WordMatch layout, sized to fit 1024×768 with progress dots + mascot).
- **Interaction:**
  - **Correct:** tapped card flashes `--success` (`#68D391`) + chime (`playCorrect`) + corner mascot cheer + `recordCorrect()` + progress dot pop (`Back.out`, `DOT_POP_*` from `GameSceneBase`); next round after ~700ms (`NEXT_ROUND_DELAY`).
  - **Incorrect:** tapped card wiggles ±4° + soft descending tone (`playIncorrect`) + mascot nod + `recordWrong()`; **no penalty** — round stays, child retries the same 4 choices.
- **Lifecycle:** after 6 correct: shared win celebration (`createWinCelebration` rays + confetti), first-completion sticker award (`gameId` `decode-it`, key `sticker_decode_it`), mascot big cheer, auto-return to Hub after 3s carrying `{ justEarned: "decode-it" }` (per `GameSceneBase.completeGame`).
- **Controls:** Parental lock (hold 3s) exits to Hub at any time via `createBackButton`; input locked during transitions/celebration (same guard as WordMatch/Alphabet — no double-nav); `progressDots` array reset on `create()` relaunch (Shape Sorter regression precedent); `inputLocked` reset on `create()`.
- **Inherited:** `createBackButton`, `createCornerMascot`, `createProgressDots(6)` / `fillProgressDot`, `completeGame`, `registerShutdownCleanup`, reduced-motion helpers — all from `GameSceneBase`; corner mascot bottom-right, bob+blink idle when not reacting.

### FR-3 — Prompt audio via SpeechSynthesis (`src/utils/speech.ts`)

- Reuses existing `speakWord(word)` helper (en-US locale, rate 0.8) on the shared internal `speakText` (same as Find the Word / Build the Word / First Sounds). **No new speech API.**
- Respects the SFX toggle (silent when `sfxEnabled === false`); graceful silent fallback when SpeechSynthesis is unavailable (game fully playable visual-only via picture + printed cards).
- **Speaker button** re-hears the prompt on demand (frame-based hit area fix precedent from TTS & Speaker Button Fix track); guarded during the win celebration / input-locked window (no speech while celebration active).
- `unlockSpeechForUserGesture()` already wired in Hub first tap — Decode It inherits the iOS unlock without changes; `BootScene` sync of `preferredVoiceURI` ensures TTS voice selection is honored.

### FR-4 — Assets (6 new SVGs, storybook style per `docs/SVG_STYLE.md`)

- `tile_decode_it.svg` — Hub tile icon: 4 mini word cards with a magnifying-glass + sparkle motif, flat fills, thick `#2D3748` 4–6px outline, soft vibrant palette.
- `sticker_decode_it.svg` — completion sticker (cream badge ` #FFF8E7`, decoded word card with star, thick outline).
- `sm_fox.svg`, `sm_cup.svg`, `sm_map.svg`, `sm_bed.svg` — new item SVGs under `src/assets/svg/items/` (512×512 viewBox, storybook flat, 4–6px `#2D3748` stroke, soft/vibrant — fox = orange fox head, cup = teal cup, map = parchment map, bed = wooden bed). Each keyed to its texture name for `PreloadScene` import.
- **Preload:** SVG count 162 → 168 (4 items + tile + sticker). Phaser rasterizes at 512×512; `ensureGlyphFontLoaded()` in `BootScene` guarantees Baloo 2 for letter compositing already.
- **Styling contract:** letter compositing reuses `font-family="'Baloo 2', Arial, …"` via `letters/letter_a…z.svg` already bundled (no new glyph SVGs).

### FR-5 — Integration

- **Types & Storage:** `GameId` union in `src/types/index.ts` / `src/game/profileLogic.ts` (`PROFILE_VERSION`-aware) gains `decode-it`; `GAME_IDS` array gains entry for per-key backfill (additive v2 merge — `load()` backfills `stickers["decode-it"]` as `{ earned:false, earnedAt:null }` for old saves, no storage key change). Each profile's progress/activity maps backfill identically.
- **Scene Registry:** `src/scenes/sceneRegistry.ts` adds lazy loader `DecodeIt` → `() => import("./DecodeItScene.ts")` via `ensureSceneLoaded` (22nd loader; shell scenes remain static).
- **PreloadScene:** imports the 6 new SVGs; tile + sticker keyed `tile_decode_it` / `sticker_decode_it` (gameId `decode-it` → sticker key via `gameId.replace(/-/g,"_")` convention).
- **HubScene:** `GAME_TILES` 19th entry `{ sceneKey:"DecodeIt", gameId:"decode-it", tileKey:"tile_decode_it" }` — **grid becomes 5×3+4**; row 4 holds 4 left-aligned tiles (generic `col = i % 5` / `row = floor(i/5)` layout already handles any remainder; comment + constant update only). Verify sticker shelf (under each tile) and play-time remaining arc (warm at ≤5min) still fit at 1024×768 (tiles 160×150, spacing 40, `startY` 119 precedent). Tile tap calls `ensureSceneLoaded(scene, "DecodeIt")` then `transitionToScene("DecodeIt")`.
- **Mascot & Progress:** reactions wired (cheer / nod / big-cheer via `Mascot`); `recordCorrect()` / `recordWrong()` counters flushed by `completeGame()` → `progressLogic.recordResult` (accuracy meaningful in parent Learning Progress report; mastery ★ after 3 wins).
- **Adaptive plumbing:** scene reads `getAdaptiveBandShift("decode-it")` at `create()` and passes `shift` to `decodeLogic.buildPlaythrough(rng, shift)` — invisible to kids, parent toggle `Settings.adaptiveDifficulty` gates it (same 10-tap window, UP 0.9 / DOWN 0.6). Shift 0 fixture proves byte-identity.

## 4. Non-Functional Requirements

- Touch targets ≥96×96px (cards 160px + generous hit area, speaker ≥96px).
- All animations via `utils/motion.ts` (`isReducedMotion`, `motionDuration`, `motionScale`) — reduced-motion: shorter flips/pops, no loop (bob/blink) — TTS unaffected.
- Pure logic in `decodeLogic.ts` — fully unit-testable without Phaser; coverage target >80% (project currently ~96% lines / 88% stmts / 92% funcs / 98% branches — maintain bar).
- No new runtime dependencies (Phaser Graphics + SpeechSynthesis are platform APIs; Web Audio SFX already synthesized).
- PWA: new SVGs precached via `vite.config.ts` `includeAssets` (already covers `src/assets/svg/**/*`).
- Accessibility: `prefers-reduced-motion` honored; no text-dependent instructions; SFX toggle respected; TTS silent fallback.

## 5. Acceptance Criteria

1. **Playthrough shape:** `buildPlaythrough()` returns 6 rounds in bands easy (3-letter, 3 rounds) / hard (4-letter, 3 rounds) (easy-first), 6 unique targets, each round has exactly 4 unique word choices incl. target, no two choices share a first letter, round evaluation via `isCorrect` returns true only for the target index; shift 0 fixture is byte-identical to classic.
2. **Round flow:** Prompt picture + spoken word appear at round start; tapping the correct card advances after 700ms with success flash/chime/dot-pop; wrong tap wiggles with no penalty; input locked during transitions/celebration; after 6 correct triggers shared win celebration + `decode-it` sticker (first time only) + 3s auto-return with `{ justEarned: "decode-it" }`.
3. **Audio:** Target word spoken once per round (en-US, rate 0.8) when SFX enabled and SpeechSynthesis available; silent when SFX off or API missing; speaker button replays; no speech during win celebration; `preferredVoiceURI` honored via Boot sync.
4. **Hub & persistence:** Hub shows 19 tiles (5×3+4, row 4 = 4 left-aligned, no clipping, no overlap with shelf/arc); 19th tile launches Decode It via `ensureSceneLoaded`; pre-existing saves load cleanly (sticker `decode-it` backfilled, progress/activity maps extended); Learning Progress reports plays/wins/accuracy for `decode-it`.
5. **Assets:** 6 new SVGs (tile, sticker, 4 items) render crisply at 512px rasterization, pass `docs/SVG_STYLE.md` flat + thick-outline contract, preload count 162→168.
6. **Quality gates:** `pnpm run check` clean, `CI=true pnpm test` green (new suites + full ~1680+ tests), `pnpm run build` succeeds, `node scripts/validate-pwa.js` passes, manual smoke (Boot → Hub → Decode It 6 rounds → win → Hub, ParentalLock hold, reduced-motion) passes.

## 6. Out of Scope

- Segmented sounding-out audio (e.g., /m/ /a/ /p/ → "map") — deferred as an optional follow-up scaffold; initial ship uses whole-word `speakWord` only.
- New glyph or letter art, timed modes, score/attempt counters, move limits, hint systems, difficulty selector chips, leaderboards, cloud sync, new BGM/SFX.
- Any change to existing 18 games beyond shared `WORD_POOL` import and registry backfill; no storage schema v3.
- Adaptive UI or labels — adaptivity remains invisible to kids (no tier text, no difficulty badge).
