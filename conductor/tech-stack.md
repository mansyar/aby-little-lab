# Technology Stack

## 1. Core Technologies

| Category | Technology | Version | Rationale |
|---|---|---|---|
| **Language** | TypeScript | 7.0.2 | Type safety for complex game state; catches errors at compile time |
| **Game Engine** | Phaser | 4.2.1 | Latest stable HTML5 framework; built-in physics, scene management, SVG rasterization, audio, input handling |
| **Build Tool** | Vite | 8.1.5 | Fast HMR, modern ESM bundling, plugin ecosystem |
| **PWA** | vite-plugin-pwa | 1.3.0 | Auto-generates service worker + manifest; precache for offline play |
| **Testing** | Vitest | 4.1.10 | Vite-native, fast, Jest-compatible API, ESM support |
| **Linting/Formatting** | Biome | 2.5.5 | Fast all-in-one linter and formatter; zero config needed for sensible defaults |
| **Package Manager** | pnpm | 11.17.0 | Fast, disk-efficient, strict dependency resolution |

## 2. Dependencies

### Runtime Dependencies

```json
{
  "phaser": "^4.2.1"
}
```

### Dev Dependencies

```json
{
  "typescript": "^7.0.2",
  "vite": "^8.1.5",
  "vite-plugin-pwa": "^1.3.0",
  "vitest": "^4.1.10",
  "@vitest/coverage-v8": "^4.1.10",
  "@biomejs/biome": "^2.5.5",
  "happy-dom": "^18.0.1"
}
```

## 3. Key Configuration Details

### Vite + PWA (`vite.config.ts`)

- **registerType:** `'prompt'` — service worker updates are deferred to user choice via the Hub update toast
- **Manifest:** Embedded in config (name: "Aby's Little Lab", short_name: "Aby Lab", display: standalone, orientation: landscape, background_color: #FAF9F6, theme_color: #2B6CB0)
- **Precache:** All build assets (HTML, JS, CSS, SVGs, and the BGM MP3) precached for full offline play

> **2026-08-05 — Design Update (UI/UX Hardening):** Bundled **Baloo 2** variable font (WOFF2, wght 100–800) at `public/fonts/baloo2-latin.woff2`, declared via `@font-face` in `src/styles/style.css` and added to `vite.config.ts` `includeAssets` so it is PWA-precached. All Text objects share the family through `src/utils/typography.ts` (`FONT_FAMILY`, size presets, and a `textStyle()` helper). Typography-related UI assets added under `src/assets/svg/ui/`: 11 storybook-style `tile_*` icons (Hub tile differentiators), `icon_speaker` (replay/speaker control shared by the speech-driven games), and `sleep_zzz` (Pop & Freeze sleep glyph). Preload SVG count 105 → 118.

> **2026-08-11 — Design Update (Glyph Font Consistency — Baloo 2):** The 38 glyph SVGs (26 letters, 10 numerals, 2 First Sounds accents) now declare `font-family="'Baloo 2', Arial, Helvetica, sans-serif"` (was Arial-only) so Phaser rasterizes learning-content glyphs with the bundled Baloo 2 font on every device — resolving the accepted known issue "Letter and numeral artwork uses the system font (per product decision), so glyph rendering varies slightly across devices". `src/utils/fonts.ts` adds `ensureGlyphFontLoaded()` (no-throw, 2.5s timeout race, guards missing `document.fonts`) and `BootScene.create()` (now async) awaits it before `this.scene.start("Preload")` — the font must be ready before Preload rasterizes the SVGs; on any failure the Arial fallback renders identically to the pre-fix look. Styling contract unchanged (bold 400px, `#2B6CB0` fill, `#2D3748` 14px stroke, `paint-order="stroke fill"`, centered 256/256). Regression guards: `src/__tests__/assets/letterNumeralFonts.test.ts` (114 assertions across all 38 SVGs), `src/__tests__/utils/fonts.test.ts` (6 tests), BootScene async-boot coverage in `navigation.test.ts` / `firstWordsIntegration.test.ts`. Full suite 62 files / 1467 tests green; Biome clean; zero new assets/dependencies (Baloo 2 already bundled since 2026-08-05).

### Phaser Config (`main.ts`)

> **Note:** Phaser 4 is a major version upgrade from Phaser 3. Verify API compatibility during implementation — some class names, method signatures, or behaviors may have changed. Refer to [Phaser 4 docs](https://docs.phaser.io/) for the latest API.

- **Resolution:** 1024×768 landscape base
- **Scale Mode:** `Phaser.Scale.FIT` + `Phaser.Scale.CENTER_BOTH` — dynamic centered letterboxing
- **Physics:** Arcade Physics, gravity y:0 (top-down/2D, no platformer physics)
- **Scenes:** 23 scenes (Boot, Preload, Hub, 20 game scenes)

> **2026-08-02 — Design Update (Bundle Code Splitting):** Game scenes are lazy-loaded via runtime registration. `src/scenes/sceneRegistry.ts` maps each game scene key to a dynamic-import loader and exposes `ensureSceneLoaded(scene, key)` (no-op if already registered, else `import()` + `scene.add(key, SceneClass)`); HubScene awaits it before transitioning into a game. Phaser 4.2.1 does **not** support dynamic-import lazy loaders in the `scene` array — functions there are invoked with `new` (constructor form only, no promise handling in `SceneManager`). Shell scenes (Boot/Preload/Hub) remain statically registered in `main.ts`. Rollup hoists shared modules into shared chunks automatically; no `manualChunks` config.

> **2026-08-08 — Design Update (Game Scene Scaffold Extraction):** All 13 game scenes now extend the shared abstract base `src/scenes/GameSceneBase.ts` (`GameSceneBase extends Phaser.Scene`, constructor takes the scene key). The base owns the duplicated per-scene skeleton: `createBackButton()` (text "← Back" + 96×96 hit area + `ParentLock` hold-to-exit transitioning to Hub + press feedback), `createCornerMascot()` (Professor Hoot bottom-right), `createProgressDots(count)` / `fillProgressDot(index)` (top-of-screen dots, pop tween, reduced-motion aware; `count` parameterized — 6 default games, 5 Musical Memory, 3 Shape Sorter/Animal Trace, 0 for Shadow Match/Big Small/Pop Freeze), `completeGame(gameId)` (win SFX, mascot big cheer, `createWinCelebration`, first-completion sticker award + reveal animation with the key derived from `gameId` via `stickerKeyFor` (`-` → `_`), 3s `AUTO_RETURN_DELAY` auto-return to Hub carrying `{justEarned}` when earned), `registerShutdownCleanup()` (destroys parentLock/mascot/speaker on scene `shutdown`), and shared protected constants (`NEXT_ROUND_DELAY` 700, `AUTO_RETURN_DELAY` 3000, `WIGGLE_*`, `OUTLINE_WIDTH`, `PROGRESS_DOT_*`, `DOT_POP_*`, `STICKER_*`, `WIN_TWEEN_DURATION`, `SUCCESS_COLOR`, `CARD_BG_COLOR`, `OUTLINE_COLOR`, `SPEAKER_OFFSET`). Subclasses keep their per-game mechanics (rounds, cards, drag, scoring, Arcade physics) and may redeclare protected constants to override defaults (e.g. `ShapeSorterScene`: `PROGRESS_DOT_Y` 100 / `RADIUS` 18 / `SPACING` 64, `DOT_POP_REDUCED_SCALE` 1.15, `DOT_POP_DURATION` 220 / `REDUCED` 140, `NEXT_ROUND_DELAY` 1200). `progressDots` is intentionally reassignable so scenes can reset the array on `create()` relaunch (Shape Sorter, Pattern Builder). `sceneRegistry.ts` unchanged — all 13 loaders still map to the same scene classes. Test coverage: `src/__tests__/scenes/gameSceneBase.test.ts` (11 tests); full suite 46 files / 1112 tests green; Biome clean. Zero user-visible behavior change.
- **Input:** Touch-first, single-finger interactions
- **Audio:** Web Audio API for synthesized tones and SFX, HTML5 Audio for the MP3 BGM only
- **Motion:** All juice animations respect `prefers-reduced-motion` via `utils/motion.ts` (reduced amplitudes/durations; loops like breathing/drift disabled)

### TypeScript (`tsconfig.json`)

- **target:** ES2023+
- **strict:** true
- **moduleResolution:** bundler (Vite-compatible)
- **types:** includes vitest/globals for test type support

### Biome (`biome.json`)

- **Formatter:** 2-space indent, double quotes, semicolons
- **Linter:** Recommended ruleset
- **Assists:** organizeImports enabled

## 4. Screen Orientation

- Phones: `screen.orientation.lock('landscape')` called on BootScene with catch fallback
- PWA manifest declares `orientation: "landscape"`
- Tablets: landscape assumed as natural orientation

## 5. localStorage Schema

**Key:** `abby-little-lab:v1`

```typescript
interface AppStorage {
  stickers: {
    [gameId: string]: {
      earned: boolean;
      earnedAt: string | null; // ISO timestamp
    };
  };
  settings: {
    bgmEnabled: boolean;
    sfxEnabled: boolean;
  };
}
```

**Game IDs:** `shape-sorter`, `animal-trace`, `pop-freeze`, `shadow-match`, `musical-memory`, `big-small`, `pattern-builder`, `alphabet-match`, `word-match`, `word-builder`

> **2026-08-04 — Design Update (Multi-Kid Profiles):** Storage moves to schema **v2** (key `abby-little-lab:v2`) to support up to 4 kid profiles, each with its own sticker collection. The **public facade API is unchanged** — `load()`/`save()`/`earnSticker()`/`hasSticker()`/`getSettings()`/`updateSettings()`/`resetProgress()` now transparently operate on the **active profile** (stickers) and the **global settings** (BGM/SFX stay device-level, unchanged). `resetProgress()` clears the active profile's stickers only. Migration: on first v2 load, an existing v1 save becomes profile `p1` (default avatar `cat`) with settings preserved; the v1 key is read but never destroyed (additive migration, safe rollback). Fresh installs auto-create `p1` so gameplay is immediately available. New functions: `getProfiles()`, `getActiveProfile()`, `addProfile(avatarId)` (new profile becomes active), `deleteProfile(profileId)` (active falls back to first remaining; last deletion recreates a fresh default), `switchProfile(profileId)`, `getAvailableAvatars()`. Avatars are textless animal picks reusing existing textures — `cat`→`animal_cat`, `dog`→`animal_dog`, `pig`→`animal_pig`, `frog`→`frog_red`, `duck`→`sm_duck`, `bear`→`toy_teddy_bear` (zero new SVG assets); each avatar is usable by one profile only. Pure logic (migration, CRUD, per-profile sticker backfill) lives in `src/game/profileLogic.ts`; `src/utils/storage.ts` stays a thin persistence facade. Old v2 saves migrate automatically via the same per-key merge pattern (each profile's stickers backfilled per game id).
>
> **Status: IMPLEMENTED (2026-08-04).** UI: `HubScene` renders a 96×96 touch-target avatar chip (top-left) that opens a textless profile picker (≥96px avatars, active scaled 1.15×, tap switches and re-renders the sticker shelf, overlay tap closes without switching); `SettingsPanel` (panel height 500→560) gains a parental-gated **Profiles** row opening a manager overlay — one row per profile (96px avatar + two-step-confirmed Delete), an Add Profile row of unused avatars (100px hit targets), a "Profile limit reached" state at 4 profiles, and overlay refresh after add/delete. Both Hub shelf and settings stay in sync through the existing `onProgressReset` callback.

> **2026-08-05 — Design Update (Play-Time Limits):** Each profile gains a daily play-time budget — `playTime: { limitMinutes: number | null, usedMinutes: number, lastUsedDate: string }` (additive v2 field; `null` = unlimited, off by default). `lastUsedDate` is a local "YYYY-MM-DD" key; usage resets to zero when the day changes. Pure logic in `src/game/playTimeLogic.ts` (`todayKey`, `createDefaultPlayTime`, `normalizePlayTime`, `getRemainingMinutes`, `isLimitReached`, `isNearLimit` (default 5-min threshold), `addPlayTime`, `setLimit`); `normalizeV2`/`migrateV1` backfill the field per profile (same per-key merge pattern as stickers — no storage key change, old saves migrate cleanly). New facade functions in `src/utils/storage.ts`: `getPlayTime(profileId?)` (normalizes, day-rollover aware), `setPlayTimeLimit(profileId, minutes|null)`, `recordPlayTime(profileId, minutes)`.
>
> **Status: IMPLEMENTED (2026-08-05).** Settings → Profiles Play Time chip (Off/15/30/45/60 cycle), Hub session accounting (startPlaySession on tile tap → endPlaySession/recordPlayTime on return), Time's Up state (dimmed + locked tiles, moon badge, mascot wave), hint arc (cool/warm at ≤5 min, hidden when no limit), pre-game nudge (2s hourglass overlay), live refresh on profile switch / settings change.

> **2026-08-08 — Design Update (TTS Voice Selection):** Device-level TTS voice preference addressing known issue "TTS voice availability varies by device/OS". `Settings` gains `preferredVoiceURI: string | null` (additive; `null` = browser default, off by default; v1/v2 saves migrate via the existing additive merge). Pure logic in `src/game/voiceLogic.ts` (`availableVoiceOptions(voices)` — "Default (device)" first, then all installed voices sorted by lang/name, no en-US gate; `resolveVoice(voices, uri)` — `null` fallback when URI missing or voices unavailable). `src/utils/speech.ts` gains `setPreferredVoiceURI(uri)`; `speakText` assigns `utterance.voice` via `resolveVoice(speechSynthesis.getVoices?.(), preferredVoiceURI)` — best-effort, never throws, silent fallback. `BootScene.create()` syncs the stored preference at startup so all 7 speech-driven scenes inherit it before any prompt. UI: `SettingsPanel` (panel height 560→640, rows re-spaced 185/245/305) gains a Voice chip row ("Voice: <label>", cycles Default → installed voices with 24-char truncation, persists via `updateSettings`, ≥64px hit areas) + Preview button speaking "Hi! I can talk." honoring the SFX toggle; a `voiceschanged` listener refreshes the chip when voices load late (removed on destroy). Tests: voiceLogic 100%, BootScene 100%, SettingsPanel 98.7% lines; full suite 1176.
>
> **Status: IMPLEMENTED (2026-08-08).** Feature complete; device-testing-checklist.md gained 10 TTS voice selection rows for the v1.12.0 release pass.

> **2026-08-27 — Design Update (Adaptive Difficulty — Numeracy Four):** The four early-numeracy games (How Many?, More or Less, Add It Up, Take Away) gain per-profile adaptive difficulty: at each playthrough start the easy-first ladder `[1,1,2,2,3,3]` may shift one band up or down from the kid's recent per-game accuracy — never mid-session, invisible to the child. New pure module `src/game/adaptiveLogic.ts` (`WINDOW_SIZE` 10, `MIN_SAMPLE` 6, `UP_THRESHOLD` 0.9, `DOWN_THRESHOLD` 0.6, `updateRecentWindow` — folds a session's {correct, wrong} aggregate trues-then-falses and trims to the last 10; `bandShiftFor` — 0 below sample floor, +1 at ≥90%, −1 below 60%, else 0; `shiftLadder` — clamps each band to 1..3, −1 → `[1,1,1,1,2,2]`, +1 → `[2,2,3,3,3,3]`). `GameProgress` gains additive `recent: boolean[]` (window folded by `recordResult` at the session flush point; cumulative counters untouched; `normalizeProgress` backfills/sanitizes missing or invalid windows as `[]` — old saves migrate on read, no storage-key change). New storage facade `getAdaptiveBandShift(gameId)` returns the shift for the active profile, 0 when the new device-level `Settings.adaptiveDifficulty` flag (default ON, normalized backfill) is off or the sample is too small. All four generators gained an optional `shift` param (default 0 = byte-identical classic ladder; per-band invariants hold — How Many? resets its per-band target pool on exhaustion so band 1 can serve 4 rounds at −1; Add It Up/Take Away pair pools suffice at every ladder). Scenes pass the shift at `create()`. `SettingsPanel` gains a third switch-toggle row ("Adaptive", persists via `updateSettings`, rows re-pitched) and the Learning Progress overlay a static muted note ("Difficulty adapts to your kid's recent answers · disable in Settings") — child UIs stay textless. Product §3.2 amended (Replay Variety "difficulty stays fixed" retired for these four games only). Tests: adaptiveLogic 15, progressLogic/window +12, profileLogic/storage settings +7, storage facade +8, four generator suites +200-samples-per-shift invariants, four scene wiring suites, SettingsPanel 74. Full suite 65 files / 1627 tests green; Biome clean; zero new dependencies/assets, preload unchanged.

> **2026-08-27 — Design Update (Adaptive Literacy & Memory — Six-Game Extension):** The adaptive ±1 band system extends from the four numeracy games to six literacy & memory games — Find the Word, Build the Word, First Sounds, Find the Letter, Memory Match, Musical Memory — reusing the existing plumbing (`adaptiveLogic`, `getAdaptiveBandShift`, the `Settings.adaptiveDifficulty` toggle) with NO new UI, storage, or toggle changes; the toggle gates the whole feature and shift 0 stays byte-identical to classic (fixture-proven). Per-game semantics: Find the Word / Build the Word — tier-split shift via `earlyCount = roundCount − 1 − shift` (−1 → all tier-3; 0 → classic `[3,3,3,3,3,4]`; +1 → two tier-4 rounds; unique targets preserved). First Sounds — uniform effective band `shiftLadder([2,2,2,2,2,2], shift)[0]`: easy drops B/P targets (7 letters), classic byte-identical, hard allows sound-confusable distractors (B/P, D/T) while visual-family exclusion always holds. Find the Letter — easy targets A–J, classic uniform A–Z, hard allows same-family distractors (C next to G/O/Q); target/choice structure unchanged. Memory Match — `buildPlaythrough(shift)` derives round bands from `shiftLadder(BASE_LADDER, shift)` mapped BandId→MemoryBand (−1 → `[easy ×4, medium ×2]`; +1 → `[medium ×2, hard ×4]`); grid/pair/pool invariants untouched. Musical Memory — start-length shift: `startLengthFor(shift)` → 1/2/3, `winLengthFor(start)` → 5/6/7; playthrough stays 5 rounds so `PROGRESS_DOT_COUNT = 5` remains exact; `MAX_RUN = 2`, no-fail replay, and `isWin`'s classic default signature untouched; the scene derives and stores the win length at `create()`. Record-path audit re-confirmed: all six scenes fire `recordCorrect()`/`recordWrong()` per tap, so windows fill from real play. Tests: per-game shift suites (word/phonics/letter/memory/frog logic) + scene wiring describes + facade contract for the six ids; full suite 1679+ green.
>
> **Status: IMPLEMENTED (2026-08-27).**

> **2026-08-09 — Design Update (Parent Progress Insights):** Each profile gains additive v2 fields `progress: Record<GameId, GameProgress>` (`{plays, wins, correct, wrong, lastPlayedAt}`) and `activity: DayActivity[]` (`{day, plays}`, pruned to 7 days) — backfilled per profile by `normalizeV2`/`createDefaultProfile` (same per-key merge pattern as stickers/playTime, no storage-key change). Pure logic in `src/game/progressLogic.ts` (`MASTERY_WINS` 3, `ACTIVITY_DAYS` 7, `createDefaultProgress(Map)`, `normalizeProgress(Map)`, `recordPlay`, `recordResult`, `getAccuracy`, `formatAccuracyPercent`, `isMastered`, `addActivity`, `pruneActivity`, `relativeLastPlayed`); `GAME_IDS` is now exported from `profileLogic.ts`. New storage facade functions: `recordGamePlay(gameId)` (Hub tile-tap choke point, nav-locked), `recordGameResult(gameId, correct, wrong)` (wins + counters), `getProgress(profileId?)`. Scene instrumentation: `GameSceneBase` gains `recordCorrect()`/`recordWrong()` counters flushed by `completeGame()`; all 15 scenes call them at their single `playCorrect()`/`playIncorrect()` site (Pop & Freeze and Animal Trace have no right/wrong taps by design). UI: `SettingsPanel` (panel height 640→760, rows re-spaced 185/245/305/355) gains a **Progress** row opening a per-profile Learning Progress overlay (avatar-chip switcher that never changes the active profile, paged 8+7 game rows with tile icons, accuracy bar, ★ mastery star, relative last-played, 7-day bar strip, X/backdrop close, ≥64px targets). Tests: full suite 1260 (54 files); coverage 96.74/88.58/92.14/98.

## 6. Asset Pipeline

### SVG Assets
- All SVGs at 512×512px viewBox
- Loaded via Phaser's SVG loader with explicit width/height for high-res rasterization
- Shadow assets derived by duplicating paths, unioning fills, setting color to `#2D3748`

> **2026-08-01 — Design Update (Replay Variety Expansion):** Item pools expanded for replay variety — Shape Sorter 4→6 shapes (heart, crescent), Animal Trace 4→6 pairs (elephant→peanut, pig→apple), Shadow Match 6→8 objects (airplane, mushroom; rounds select a shared 6-item set for objects and shadows), Big vs. Small 4→6 toys (rocket, drum). Pop & Freeze decoy pool reuses all 6 Game 2 animals. Round sizes unchanged (3-of-6, 3-of-6, 6-of-8, 3-of-6).

> **2026-08-02 — Design Update (Pattern Builder):** Game 7 (Pattern Builder) added — a tap-to-complete pattern game reusing the six Game 1 shape SVGs (only new asset: `sticker_pattern_builder.svg`). Hub grid is now 4×2 (7 tiles); `GameId` includes `pattern-builder`. Pure logic in `src/game/patternBuilderLogic.ts` (ABAB/AABB/ABB rows, gap at end or middle, 3 unique choices, 5-round playthroughs).

> **2026-08-02 — Design Update (Find the Letter):** Game 8 (Find the Letter) added — a tap-to-match uppercase letter recognition game. New assets: 26 letter SVGs (`src/assets/svg/letters/letter_a.svg`…`letter_z.svg`, identical `#2B6CB0` fill / `#2D3748` stroke styling so recognition is shape-only) + `sticker_alphabet_match.svg` (keyed `sticker_alphabet_match` to match the shelf's `gameId.replace(/-/g, "_")` convention). New dependency: browser SpeechSynthesis (`src/utils/speech.ts` — en-US, rate 0.9, respects the SFX toggle, silent no-throw fallback). Hub grid is 4×2 (8 tiles); `GameId` includes `alphabet-match`; scene registry has 8 lazy loaders. Pure logic in `src/game/alphabetLogic.ts` (6 unique targets per playthrough drawn uniformly from A–Z, 4 unique choices per round, evaluation + win detection). Old saves migrate automatically via the per-key storage merge.

> **2026-08-04 — Design Update (First Words pool expansion):** The shared word pool grew from 9 to 18 words — 3-letter tier: CAT/DOG/PIG/CAR/OWL/SUN/HAT/BUG; 4-letter tier: FROG/BALL/FISH/BOAT/TREE/BONE/STAR/DRUM/BEAR/DUCK. 13 of 18 prompts reuse existing textures (`animal_cat/dog/pig`, `sm_car`, `frog_red`, `sm_ball`, `food_fish`, `sm_boat`, `sm_tree`, `mascot_idle`→OWL, `food_bone`→BONE, `shape_star`→STAR, `toy_drum`→DRUM, `toy_teddy_bear`→BEAR); 4 new SVGs (`items/sun.svg`, `hat.svg`, `bug.svg`, `duck.svg`) registered as `sm_sun`/`sm_hat`/`sm_bug`/`sm_duck` (preload SVG count 90 → 94). Gameplay rules unchanged (6 unique rounds with the no-shared-first-letter guard; easy-first builder with 3 words; 6 tiles with distractors). Verification also fixed a latent replay bug: `inputLocked` was not reset when WordMatch/WordBuilder/Alphabet/PatternBuilder scenes relaunch on the same Phaser instance (regression tests re-run `create()` after completion); MusicalMemory proven self-recovering because `playSequence()` re-locks and unlocks every `create()`.
>
> **2026-08-03 — Design Update (First Words):** Games 9 & 10 added — Find the Word (`WordMatchScene`, id `word-match`) and Build the Word (`WordBuilderScene`, id `word-builder`), both early-literacy games on a 9-word pool that reuses **existing** textures only (`animal_cat/dog/pig`, `sm_car`, `frog_red`, `sm_ball`, `food_fish`, `sm_boat`, `sm_tree`; 3-letter tier: CAT/DOG/PIG/CAR, 4-letter tier: FROG/BALL/FISH/BOAT/TREE). Words render by composing the already-loaded `letter_a`…`letter_z` textures (~80px/letter, card min height 160px). Pure logic in `src/game/wordLogic.ts` (6-round playthroughs with no two choices sharing a first letter — pre-reader guard; easy-first builder playthroughs — 2× 3-letter + 1× 4-letter for the default 3 words, no repeats; 6-tile letter sets with the word's unique letters + 2–3 distractors not in the word). TTS: `speakWord` (en-US, rate 0.8) added alongside `speakLetter` on a shared internal `speakText` in `src/utils/speech.ts`, still SFX-gated with a silent no-throw fallback. New stickers `sticker_word_match.svg` (CAT) and `sticker_word_builder.svg` (DOG) registered in PreloadScene (preload SVG count 88 → 90). Hub grid is 5×2 (10 tiles, `TILE_WIDTH` 160, `TILE_SPACING` 40 — 5×160+4×40 = 960 ≤ 1024, tile labels 18px); `GameId` includes `word-match`/`word-builder`; scene registry has 10 lazy loaders. Old saves migrate automatically via the existing per-key storage merge (`load()` backfills both new sticker keys).

> **2026-08-05 — Design Update (Game 11 — How Many?):** Game 11 (How Many?) added — early numeracy counting game: a large target numeral pops in top-center and is spoken aloud (SpeechSynthesis), and the child taps the object group whose count matches. New assets: 10 numeral SVGs (`src/assets/svg/numbers/numeral_0.svg`…`numeral_9.svg`, identical `#2B6CB0` fill / `#2D3748` stroke styling to the letter set so recognition is digit-shape only) + `sticker_how_many.svg` (keyed `sticker_how_many`). Preload SVG count 94 → 105. Group items reuse existing textures only (`shape_star`, `sm_ball`, `food_apple`, `food_fish`, `food_carrot`, `sm_sun`, `sm_house`, `sm_duck` — zero new object assets). Pure logic in `src/game/countLogic.ts` (6-round playthroughs, 2 rounds per progressive band 1–3 / 1–5 / 1–10 with 3/4/4 group cards; distinct-counts guard per round, exactly one group matches the target, positions and item types shuffled). TTS: `speakNumber` (en-US, rate 0.9, 0–10 word mapping) added on the shared `speakText` in `src/utils/speech.ts`, still SFX-gated with a silent no-throw fallback. Hub grid is now 5×3 (11 tiles, `TILE_WIDTH` 160, `TILE_SPACING` 40; startY = (768 − 3×150 − 2×40)/2 = 119 — sticker shelf and play-time arc verified to fit); `GameId` includes `how-many`; scene registry has 11 lazy loaders. Old saves migrate automatically via the existing per-key storage merge (`GAME_IDS` backfill covers the new sticker key).

> **2026-08-06 — Design Update (TTS & Speaker Button Fix):** Fixed two audio bugs. (1) The speaker replay button (and Hub avatar chip, profile-picker avatars, Settings Add-Profile avatars) used custom hit areas in texture-local coordinates that missed the visible icon on 512px rasterized textures — `setInteractive()` now uses the frame-based default hit area; regression coverage via `src/__tests__/helpers/hitTest.ts` (engine-accurate tap simulation). (2) iOS/WebKit silently drops `speechSynthesis.speak()` until an utterance is dispatched inside a user gesture — `speech.ts` gained `unlockSpeechForUserGesture()`, called from the Hub's first tap/pointerdown alongside `AudioManager.resume()`. `speakText` also cancels only when the engine is speaking/pending and defers the replacement utterance 100ms, avoiding the cancel/speak race where WebKit/Chromium's async cancel wipes a synchronously queued utterance.

> **2026-08-08 — Design Update (Game 13 — More or Less):** Game 13 (More or Less) added — early numeracy quantity comparison: each round shows two dot-group cards and a large arrow cue (up = MORE, down = LESS) with the comparison word spoken aloud (`speakWord("more"/"less")` at rate 0.8, SFX-gated, silent fallback, speaker replay). The child taps the group with more/fewer items. New assets: `arrow_up.svg` + `arrow_down.svg` (cue, chunky storybook arrows `#2B6CB0` fill / `#2D3748` stroke 26), `tile_more_less.svg` (two dot-cards + up arrow), `sticker_more_less.svg` (cream badge, two mini-cards + arrow). Preload SVG count 144 → 148. Item dots reuse existing textures only (`COUNT_ITEMS` from `countLogic.ts` — 8 textures, zero new object assets). Pure logic in `src/game/moreLessLogic.ts` (6-round playthroughs, 2 per band 1–3 / 1–5 / 1–10 easy-first, exactly 3 "more" + 3 "less" shuffled, distinct counts per round via `createRound(band, mode)`, `evaluateRound(round, side)` comparison evaluation). `GameId` includes `more-less`; `GAME_IDS` in `profileLogic.ts` covers the new sticker key for old saves; scene registry has 13 lazy loaders; Hub grid stays 5×3 with row 3 now holding 3 tiles (How Many?, First Sounds, More or Less — left-aligned per fill logic). Scene: `MoreLessScene` (HowManyScene layout family — 220px cards, 48px item copies in a loose 4-per-row grid, arrow cue pop-in, speaker guard during celebration).

> **2026-08-07 — Design Update (Game 12 — First Sounds):** Game 12 (First Sounds) added — early-literacy phonemic awareness: a pictured word is spoken aloud (rate 0.8, SFX-gated) and the child taps the letter card of its first sound; the correct letter is then spoken back (`speakLetter`). Word pool: curated 12-word subset of `WORD_POOL` (`CAT DOG PIG SUN HAT BUG OWL TREE STAR BALL FROG FISH`) with 9 distinct first letters (C D P O S H B F T), zero new object assets. Round logic: 3 distractor letters per round excluded by the sound-confusable pairs (B/P, D/T) and the Alphabet visual families ([C,G,O,Q], [I,L,T], [M,W] — `isConfusableWith` now exported from `src/game/alphabetLogic.ts`); 6 unique target letters per playthrough drawn uniformly from the 9. Pure logic in `src/game/firstSoundsLogic.ts` (pool derivation from `WORD_POOL`, round/playthrough generation). New assets: `tile_first_sounds.svg` + `sticker_first_sounds.svg` (letter "A" + `#68D391` sound-wave arcs in the two-pass stroked style). Preload SVG count 142 → 144. `GameId` includes `first-sounds`; `GAME_IDS` in `profileLogic.ts` covers the new sticker key for old saves; scene registry has 12 lazy loaders; Hub grid stays 5×3 with row 3 holding 2 tiles (How Many?, First Sounds — left-aligned per fill logic). Scene: `FirstSoundsScene` (AlphabetScene card-row layout with WordMatch prompt pattern; 180px prompt, 160px cards, 128px letters, speaker guard during celebration).

### Audio Assets
- **Location:** `public/audio/` — Vite serves `public/` at root, so files are accessible at `/audio/<file>`
- **BGM:** Single MP3 loop (`bgm.mp3`) served at `/audio/bgm.mp3`
- **SFX:** Synthesized via Web Audio API (correct, incorrect, win, sticker, pop, wake) — no MP3 files needed
- **Synthesized:** Web Audio API oscillators for Game 5 frog notes (C4, E4, G4)

> **2026-07-31 — Design Update:** BGM asset relocated from `src/assets/audio/bgm.mp3` to `public/audio/bgm.mp3`. In Vite, `public/` files are served at the root URL, so `public/audio/bgm.mp3` resolves at `/audio/bgm.mp3` — the runtime URL expected by `AudioManager`. This fixes the packaging mismatch where the BGM source lived in `src/assets/` (not served at runtime URLs) while `AudioManager` referenced `/audio/bgm.mp3`.

### PWA Icon
- 192×192 + 512×512 PNG icons for manifest, plus a 512×512 maskable variant (`purpose: "any maskable"`)
- iOS install support: `apple-touch-icon` link and `apple-mobile-web-app-capable` meta tag in `index.html`

> **2026-08-02 — Design Update (PWA Install & Update UX):** SW registration moved from `registerType: 'autoUpdate'` to `'prompt'`; updates now surface as a parent-facing Hub toast ("New version ready!") instead of installing silently. New modules: `src/utils/pwaBridge.ts` (testable wrapper around `virtual:pwa-register`; queues update/offline events until the Hub is active), `src/utils/pwaInstall.ts` (install-state machine — `installable` / `ios-howto` / `hidden` — with `beforeinstallprompt` capture and iOS UA detection), `src/components/PwaToast.ts` (Hub lifecycle toast UI). The Settings panel gained a context-aware install row: "Install App" where a browser prompt is available, "How to Install" (Share → Add to Home Screen overlay) on iOS Safari, hidden once installed. `workbox-window` added as a direct devDependency (pnpm strict resolution).

> **2026-08-02 — Design Update (Parental Settings Expansion):** The Settings panel now shows the app version in a muted footer (`v{version}`, 18px, non-interactive), sourced from `package.json` `version` via a Vite `define` (`__APP_VERSION__`, declared in `src/vite-env.d.ts`) — the client never imports package.json, and the display updates automatically on version bumps. Below the install row, a danger-colored "Reset Progress" row (64px hit area, behind the parental hold) opens a two-step confirm modal ("Reset all stickers?" with Cancel/Reset). Reset calls the pure `resetProgress()` in `src/utils/storage.ts`, which clears all seven stickers (`earned: false`, `earnedAt: null`) while preserving BGM/SFX settings, then the row in place shows "Progress cleared". `SettingsPanel` accepts an optional `onProgressReset` callback; `HubScene` passes one that re-renders the sticker shelf (new `createShelfSticker()` / `rerenderStickerShelf()` methods), so the Hub reflects the reset without a reload. Panel height grew 460 → 500 to fit the new rows.

## 7. Project Structure

```
aby-little-lab/
├── index.html
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── biome.json
├── public/
│   ├── icons/
│   └── audio/                     # MP3 files served at /audio/ (BGM only)
└── src/
    ├── main.ts                    # Phaser config + scene registration
    ├── vite-env.d.ts              # Vite client type declarations
    ├── scenes/
    │   ├── BootScene.ts
    │   ├── PreloadScene.ts
    │   ├── HubScene.ts
    │   ├── GameSceneBase.ts         # Shared scaffold for all 20 game scenes (back button, mascot, progress dots, win/sticker/auto-return)
    │   ├── ShapeSorterScene.ts
    │   ├── AnimalTraceScene.ts
    │   ├── PopFreezeScene.ts
    │   ├── ShadowMatchScene.ts
    │   ├── MusicalMemoryScene.ts
    │   ├── BigSmallScene.ts
    │   ├── PatternBuilderScene.ts
    │   ├── AlphabetScene.ts
    │   ├── WordMatchScene.ts
    │   ├── WordBuilderScene.ts
    │   ├── HowManyScene.ts
    │   ├── MoreLessScene.ts
    │   ├── OddOneOutScene.ts
    │   ├── ColorMatchScene.ts
    │   ├── AddItUpScene.ts
    │   ├── TakeAwayScene.ts
    │   ├── MemoryMatchScene.ts
    │   └── DecodeItScene.ts
    ├── components/
    │   ├── Mascot.ts              # Tween-only owl mascot (wave/cheer/nod/idleLoop)
    │   ├── ParentLock.ts
    │   └── SettingsPanel.ts
    ├── audio/
    │   └── AudioManager.ts        # SFX, BGM, Web Audio API synthesis
    ├── game/
    │   ├── shapeSorterLogic.ts    # Pure game logic (shuffle, match detection)
    │   ├── animalTraceLogic.ts    # Pure game logic (path tracing, pair selection)
    │   ├── popFreezeLogic.ts      # Pure game logic (spawn scheduling, pop counting)
    │   ├── shadowMatchLogic.ts    # Pure game logic (shuffle, round generation, match/win detection)
    │   ├── musicalMemoryLogic.ts  # Pure game logic (sequence generation, round/win detection)
    │   ├── bigSmallLogic.ts       # Pure game logic (dual-scale toys, size match detection)
    │   ├── patternBuilderLogic.ts # Pure game logic (pattern rows, gap placement, choices)
    │   ├── alphabetLogic.ts       # Pure game logic (letter playthroughs, round choices, win detection)
    │   ├── wordLogic.ts           # Pure game logic (word pool, round/builder generation, win detection)
    │   ├── countLogic.ts          # Pure game logic (counting bands, group cards, win detection)
    │   ├── firstSoundsLogic.ts    # Pure game logic (phonics pool, first-letter rounds, win detection)
    │   ├── moreLessLogic.ts       # Pure game logic (quantity comparison, more/less rounds, win detection)
    │   ├── colorMatchLogic.ts     # Pure game logic (color pools, 4-card rounds, swatch target, win detection)
    │   └── oddOneOutLogic.ts      # Pure game logic (odd-one-out pools, bands, round/playthrough generation, evaluation)
    ├── utils/
    │   ├── storage.ts             # localStorage persistence layer
    │   ├── motion.ts              # reduced-motion helpers (isReducedMotion, durations, scales)
    │   ├── dragJuice.ts           # drag lift/tilt, drop-zone highlight, snap tween
    │   ├── completionEffect.ts    # Graphics-based splash/win effects (no particle emitters)
    │   ├── sceneTransitions.ts    # crossfade transitions (transitionToScene, sceneEntrance)
    │   ├── pressFeedback.ts       # press squish + optional spring-back (attachPressFeedback)
    │   └── speech.ts              # TTS letter/word pronunciation wrapper (SpeechSynthesis, iOS gesture unlock, graceful fallback)
    ├── types/
    │   └── index.ts               # AppStorage interface, game types
    ├── assets/
    │   └── svg/
    │       ├── shapes/            # Game 1 shape + cutout SVGs (18 + 18, single folder)
    │       ├── animals/
    │       ├── items/
    │       ├── toys/
    │       ├── shadows/
    │       ├── letters/           # Game 8 uppercase letter SVGs (letter_a..letter_z)
    │       ├── stickers/
    │       └── ui/
    ├── styles/
    │   └── style.css
    └── __tests__/
        ├── audio/
        │   └── AudioManager.test.ts
        ├── components/
        │   ├── Mascot.test.ts
        │   ├── ParentLock.test.ts
        │   └── SettingsPanel.test.ts
        ├── game/
        │   ├── shapeSorterLogic.test.ts
        │   ├── animalTraceLogic.test.ts
        │   ├── popFreezeLogic.test.ts
        │   ├── shadowMatchLogic.test.ts
        │   ├── musicalMemoryLogic.test.ts
        │   ├── bigSmallLogic.test.ts
        │   ├── patternBuilderLogic.test.ts
        │   ├── alphabetLogic.test.ts
        │   └── wordLogic.test.ts
        │   └── moreLessLogic.test.ts
        ├── scenes/
        │   ├── navigation.test.ts
        │   ├── sceneRegistry.test.ts
        │   ├── alphabetScene.test.ts
        │   ├── wordMatchScene.test.ts
        │   ├── wordBuilderScene.test.ts
        │   └── firstWordsIntegration.test.ts
        │   └── moreLessScene.test.ts
        └── utils/
            ├── storage.test.ts
            ├── motion.test.ts
            ├── dragJuice.test.ts
            ├── pressFeedback.test.ts
            ├── sceneTransitions.test.ts
            ├── speech.test.ts
            └── completionEffect.test.ts
```

## 8. CI/CD

> **2026-08-02 — CI/CD Introduction:** GitHub Actions added as CI tooling (`.github/workflows/ci.yml`). Triggers: `pull_request` (opened/synchronize/reopened) runs the quality gates only; `push` to `master` runs the gates and then triggers the Coolify Deploy Webhook. Runner: `ubuntu-latest`, Node 22, pnpm 11.7.0 via corepack with `--frozen-lockfile` (matching the Dockerfile build). Quality gates, in order: `pnpm run check` → `CI=true pnpm test` → `pnpm run build` → `node scripts/validate-pwa.js`. Deployment requires the `COOLIFY_DEPLOY_WEBHOOK` repository secret; Coolify continues building from the repo Dockerfile (build path unchanged).

> **2026-08-02 — CI/CD Deviation Note:** In CI, pnpm is installed via `pnpm/action-setup@v4` pinned to `version: 11.7.0` instead of a raw `corepack prepare` step. Same version pin as the Dockerfile (`pnpm@11.7.0`), but the action is the recommended, more reliable install path on GitHub runners. The pnpm store is cached via `actions/setup-node@v4` `cache: pnpm` (keyed on `pnpm-lock.yaml`).

> **2026-08-02 — CI/CD Amendment (Coolify webhook auth):** The Coolify deploy webhook endpoint requires Bearer authentication — the URL alone returns `401 Unauthenticated`. The deploy job therefore requires **two** repository secrets: `COOLIFY_DEPLOY_WEBHOOK` (Application → Webhooks → Deploy Webhook URL) and `COOLIFY_TOKEN` (Keys & Tokens → API token with `deploy` permission). The webhook is triggered with a **GET** request plus `Authorization: Bearer $COOLIFY_TOKEN` (per Coolify's official GitHub Actions docs) with `--fail-with-body`; a guard step fails fast if either secret is missing. Verified live on the first merged master push.

> **2026-08-06 — Design Update (Shape Sorter Variety & Multi-Round):** Game 1 shape pool expanded 6 → 18 shapes (12 new hand-authored geometric shapes: oval, rectangle, diamond, pentagon, hexagon, octagon, trapezoid, semicircle, arrow, plus, ring, teardrop — each with its own distinct soft/vibrant color) plus 12 matching `cutout_*` SVGs, all in `src/assets/svg/shapes/` (no separate cutouts folder). Preload SVG count 118 → 142 (24 new `?raw` imports + `SHAPE_ASSETS` entries; `SHAPE_ASSETS` is now exported for testability). Sessions became 3 rounds × 3 shapes — `generatePlaythrough(roundCount)` in `src/game/shapeSorterLogic.ts` shuffles the 18-pool once and slices 3 per round (9 unique shapes per session, difficulty fixed); `ShapeSorterScene` renders 3 progress dots above the slots that fill with a 1 → 1.4 → 1 `Back.out` pop on round completion, tears down and re-inits rounds after ~1.2s, and gates the win/sticker/auto-return to the final round. Pattern Builder is intentionally unaffected (its `SHAPE_TEXTURES` map still uses the original 6 shape textures). New scene tests: `src/__tests__/scenes/shapeSorterScene.test.ts` (8 tests); navigation suite updated for round-aware completion.

> **2026-08-06 — Design Update (SVG Visual Polish):** All 142 SVGs in `src/assets/svg/` redrawn to the "Storybook Flat" quality bar (flat fills, `#2D3748` 4–6px outlines, soft-vibrant palette, silhouette-first) across 9 phases + 2 user-feedback rounds. `docs/SVG_STYLE.md` added as the asset style source of truth, with a contact-sheet renderer (`scripts/render-svg-contact-sheets.mjs`) and rendered sheets in `docs/svg-contact-sheets/`. Per user decision (Phase 9d), the 26 letter + 10 numeral SVGs were **reverted** to system-font Arial `<text>` versions (bold 400px, `#2B6CB0` fill, `#2D3748` 14px stroke, `paint-order="stroke fill"`) — custom-path letterforms are not to be reintroduced without product sign-off; stroked-text metrics are retained for sticker/tile accents only. No file renames/deletions (filenames = texture keys), no TS/source changes; 979/979 tests green.

## See Also

- [TDD.md](../docs/TDD.md) — Full technical design document with detailed config snippets
- [PRD.md](../docs/PRD.md) — Product requirements including SVG prompt engineering matrix

## Changelog — v1.7.0 (2026-08-07)

> **2026-08-07 — Design Update (Gameplay Hardening):** Replay/session-state fixes: `AnimalTraceScene.create()` resets `currentPairIndex`/`completedPaths`/`currentPair`/`progressDots`; `ShapeSorterScene` and `PatternBuilderScene` reset their `progressDots` arrays before rebuilding (stale destroyed-dot references). Speaker guards: `onSpeak` in Alphabet/HowMany/WordMatch/WordBuilder returns early when `rounds[roundIndex]`/`words[wordIndex]` is undefined (win-celebration window). `MusicalMemoryScene.handleReplay()` resets `inputIndex = 0`. `PopFreezeScene.spawnBubble()` calls `setCircle(BUBBLE_DISPLAY_SIZE / 2)` so the Arcade body matches the 96px display (was 512px SVG frame). Navigation guard: `transitionToScene` in `src/utils/sceneTransitions.ts` is now idempotent per scene instance via a `WeakMap<Phaser.Scene, boolean>` flag cleared on `shutdown` — Back-hold during auto-return can no longer double-navigate.

> **2026-08-07 — Design Update (Gameplay Depth):** Animal Trace: next waypoint gets a pulsing primary ring (`redrawPathGuide` + looping `onUpdate` tween, reduced-motion aware) and visited dots turn success-green. Musical Memory: `MAX_RUN = 2` caps consecutive same-frog notes (`pickNote` draws from other frogs); `playSequence` uses 480ms per note for sequences of length ≥ 5 (`FAST_NOTE_DELAY`, `FAST_NOTE_DELAY_LENGTH`). Word Match: `generateWordPlaythrough` mirrors the builder — 5 tier-3 rounds then 1 tier-4 at default 6 (easy-first). Correct-answer splashes (`createCompletionSplash`) added at the tapped card in Word Match + Find the Letter (`handleCorrect(choiceIndex)`) and at the target gap in Pattern Builder. Word Builder: used tiles fly into their slot (x/y tween `TILE_FLY_DURATION` 300/180 reduced) and ghost (`TILE_GHOST_ALPHA` 0.25 + `disableInteractive` + cleared letter value); duplicate-letter words (BALL) keep the tile tappable with a fresh copy settle-pop + thunk tween (`TILE_THUNK_*`); `TILE_SIZE` 110 → 132 (64.7px on screen at 0.49 FIT scale, above the 64px touch floor). Pattern Builder: `ROUND_COUNT`/`generatePlaythrough` 5 → 6 (matches the other games). Confusable-distractor guards: `CONFUSABLE_LETTER_FAMILIES` ([C,G,O,Q], [I,L,T], [M,W]) in `alphabetLogic.ts` and `CONFUSABLE_SHAPE_FAMILIES` ([pentagon,hexagon,octagon], [circle,oval,ring,semicircle], [square,rectangle]) in `patternBuilderLogic.ts` — distractors never share a family with the target. How Many: `createPlaythrough` draws 2 distinct targets per band (shuffle-based, avoids constant-random infinite loops), `createRound(band, target?)` gained an optional target; `createCardItems` centers each row on its own width (partial last rows). Big vs Small: `createBoxes` shuffles the two boxes (no fixed big-left).

> **2026-08-07 — Consistency & Dead Code:** `ShadowMatchScene` `DROP_ZONE_SIZE` 120 → 160; Word Builder settle-pop and dot-pop use `motionDuration`/`motionScale` + `scaleX`/`scaleY` (reduced-motion aligned); Shape Sorter back button uses `textStyle()` (Baloo 2). Removed dead exports `selectThreeShapes` (shapeSorterLogic), `isCorrectWord` (wordLogic), `isCorrectLetter` + `hasCompletedPlaythrough` (alphabetLogic), `isPlaythroughComplete` (countLogic), unused `Phaser.Curves.Path` construction + `PairState.path` (AnimalTrace), Word Builder `slotRects` array, Big Small `ToyData.baseScale`. New scene suites: `src/__tests__/scenes/popFreezeScene.test.ts` (11 tests) and `patternBuilderScene.test.ts` (8 tests) close the missing-suite gaps (Animal Trace suite was added in Phase 1). Full suite: 41 files / 1024 tests green; coverage 98.2% lines / 97.16% stmts / 92.94% funcs / 89.87% branch; Biome clean.

> **2026-08-08 — Design Update (Game 14 — Odd One Out):** Visual discrimination & categorization game added: each round shows a 2×2 grid of 4 cards (256px, ≥96px touch) — 3 identical textures + 1 distinct; the odd item is named by TTS (`promptFor(texture)` word map, `speakWord` rate 0.8, SFX-gated, speaker replay). New assets: `tile_odd_one_out.svg` (2×2 mini-cards, one orange triangle among blue circles) + `sticker_odd_one_out.svg` (cream badge). Preload SVG count 148 → 150. Item art reuses existing textures only (`ANIMAL_ITEMS` 6, `FROG_ITEMS` 3, `TOY_ITEMS` 6, `SHAPE_ITEMS` 18 — 33 total, zero new object assets). Pure logic in `src/game/oddOneOutLogic.ts` (6-round playthroughs, 2 per band easy-first: band 1 cross-category, band 2 same-category different item, band 3 frog color variants; unique odd texture per playthrough; frog pool reserved for band 3; `isCorrect(round, slot)` evaluation; 97.22% stmts coverage). `GameId` includes `odd-one-out`; `GAME_IDS` in `profileLogic.ts` covers the new sticker key for old saves; scene registry has 14 lazy loaders; Hub grid stays 5×3 with row 3 now holding 4 tiles (How Many?, First Sounds, More or Less, Odd One Out — left-aligned per fill logic). Scene: `OddOneOutScene` (MoreLessScene layout family — 2×2 card grid, 150px item images, prompt speech + speaker replay, success flash/chime/dot-pop 700ms, wiggle no-penalty, shared win celebration + `odd-one-out` sticker + 3s auto-return, ParentLock exit, input-lock reset on relaunch).

> **2026-08-08 — Design Update (Game 15 — Color Match):** Color recognition game added: each round shows a large prompt swatch (Phaser Graphics, `fillRoundedRect`/`strokeRoundedRect`, 110px, 8px `#2D3748` outline) filled with the target color, and a 2×2 grid of 4 cards (220px, ≥96px touch; GRID_SPACING 20, GRID_Y_OFFSET 140, ITEM_SIZE 130 — swatch + grid sized to fit 1024×768, documented deviation from the spec's ~180/~256px) each showing an object texture of a distinct color. The target color's name is spoken by TTS (`speakWord` rate 0.8, SFX-gated, speaker replay). New assets: `tile_color_match.svg` (2×2 swatch cards, white star on the red card) + `sticker_color_match.svg` (cream badge). Preload SVG count 150 → 152. Object art reuses existing textures only via `COLOR_CARDS` mapping (red → `shape_heart` #E53E3E, blue → `frog_blue` #3182CE, yellow → `shape_crescent` #ECC94B, green → `shape_rectangle` #48BB78, orange → `shape_circle` #F6AD55, purple → `shape_square` #9F7AEA — swatch hexes equal the source SVG fills so the child matches by eye; zero new object assets). Pure logic in `src/game/colorMatchLogic.ts` (6-round playthroughs, 3 per band: rounds 1–3 draw 4 distinct colors from the 4-color pool, rounds 4–6 from the 6-color pool; `buildRound(pool)` samples 4 shuffled distinct colors, target = one sampled color; `isCorrect(cards, index, target)` evaluation; 95.45% stmts coverage). `GameId` includes `color-match`; `GAME_IDS` in `profileLogic.ts` covers the new sticker key for old saves; scene registry has 15 lazy loaders; **Hub grid completes 5×3 (rows 5/5/5 — all 15 slots filled)**. Scene: `ColorMatchScene` (OddOneOutScene layout family — Graphics swatch prompt, 2×2 card grid, prompt speech + speaker replay, success flash/chime/dot-pop 700ms, wiggle no-penalty, shared win celebration + `color-match` sticker + 3s auto-return, ParentLock exit, input-lock reset on relaunch).

> **2026-08-09 — Design Update (Game 16 — Add It Up):** Early-addition game added: each round shows an equation row — two addend dot-group cards (180px, non-interactive) joined by a big "+" cue with an "=" cue (96px pop-in images, `plus.svg` + `equals.svg` at `src/assets/svg/ui/`, keyed `plus`/`equals` — arrow_up.svg precedent) — and a centered row of 4 interactive answer cards (170px, ≥96px touch) showing dot-groups of the candidate totals. Purely visual counting: no prompt audio, no speaker button (first game without one). New assets: `tile_add_it_up.svg` (two dot-cards + chunky plus, highlighted answer card) + `sticker_add_it_up.svg` (cream badge). Preload SVG count 152 → 156. Item dots reuse existing `COUNT_ITEMS` textures only (8 textures, zero new object assets). Pure logic in `src/game/addItUpLogic.ts` (6-round playthroughs, 2 per band easy-first: sums ≤ 4 / ≤ 6 / ≤ 10; addend pairs (a,b ≥ 1) never repeat order-insensitively within a playthrough via a `usedPairs` set; two distinct addend textures per round, one shared answer texture; 4 distinct answer totals in [1..bandMax] incl. target; `isCorrect(options, index, target)` evaluation; 100% stmts coverage). `GameId` includes `add-it-up`; `GAME_IDS` in `src/types/index.ts` covers the new sticker key for old saves; scene registry has 16 lazy loaders; **Hub grid becomes 5×3 + 1 (rows 5/5/5/1 — tile 16 left-aligned on row 4 via generic modulo layout; sticker shelf is per-game, not positional, so it still fits)**. Scene: `AddItUpScene` (MoreLessScene layout family — dot-group rendering with centered partial rows, success flash/chime/dot-pop 700ms, wiggle no-penalty (targets answer rect + its own items), shared win celebration + `add-it-up` sticker + 3s auto-return, ParentLock exit, input-lock reset on relaunch).

> **2026-08-10 — Design Update (Game 17 — Take Away):** Early-subtraction game added: each round shows an equation row — two prompt dot-group cards (180px, non-interactive) joined by a big "−" cue with an "=" cue (96px pop-in images, `minus.svg` at `src/assets/svg/ui/` keyed `minus` — plus.svg precedent) — and a centered row of 4 interactive answer cards (170px, ≥96px touch) showing dot-groups of the candidate differences. Purely visual counting: no prompt audio, no speaker button (second game without one, pairing with Add It Up). New assets: `minus.svg` (chunky horizontal bar `#2B6CB0` fill / `#2D3748` stroke 24), `tile_take_away.svg` (two dot-cards + chunky minus, highlighted answer card) + `sticker_take_away.svg` (cream badge). Preload SVG count 156 → 159. Item dots reuse existing `COUNT_ITEMS` textures only (8 textures, zero new object assets). Pure logic in `src/game/takeAwayLogic.ts` (6-round playthroughs, 2 per band easy-first mirroring Add It Up: minuend ≤ 4 / ≤ 6 / ≤ 10; subtraction pairs (minuend > subtrahend ≥ 1, differences never 0) never repeat order-sensitively within a playthrough via a `usedPairs` set keyed `"a-b"`; two distinct prompt textures per round, one shared answer texture; 4 distinct answer totals in [1..bandMax] incl. target; `isCorrect(options, index, target)` evaluation; 100% stmts coverage). `GameId` includes `take-away`; `GAME_IDS` in `src/types/index.ts` covers the new sticker key for old saves (per-key merge backfills); scene registry has 17 lazy loaders; **Hub grid becomes 5×3 + 2 (rows 5/5/5/2 — tiles 16–17 left-aligned on row 4 via generic modulo layout; grid comment updated; sticker shelf is per-game, not positional, so it still fits)**. Scene: `TakeAwayScene` (AddItUpScene layout family — `TakeAwayRound` prompt cards [minuend][−][subtrahend][=], dot-group rendering with centered partial rows, success flash/chime/dot-pop 700ms, wiggle no-penalty (targets answer rect + its own items), shared win celebration + `take-away` sticker + 3s auto-return, ParentLock exit, input-lock reset on relaunch).

> **2026-08-11 — Design Update (Game 18 — Memory Match):** First pure visual-working-memory game added (no prompt, no speech — third speech-free game): each round deals a face-down grid of paired cards; the child flips two at a time and matches identical textures. Progressive grids, easy-first: rounds 1–2 = 2×3 grid / 3 pairs (150px cards), rounds 3–4 = 3×4 / 6 pairs (132px), rounds 5–6 = 4×4 / 8 pairs (120px) — all cards ≥ 96px touch. Cards are rounded-rect `Graphics` bases with the `card_back.svg` texture face-down (`src/assets/svg/ui/card_back.svg` — placed in `ui/`, no `ui/gameplay/` dir exists) and the face texture (`layout[i]`) scaled to 58% of the card; flips animate `scaleX` 1 → 0 → 1 (180ms / 120ms reduced motion, `Sine.in`/`Sine.out`), deal pop-in staggers 40ms per card (240ms / 120ms reduced). Pure logic in `src/game/memoryMatchLogic.ts` (6-round playthroughs, 2 per band via `bandForRound`; `MEMORY_POOL` 16 mixed-category textures — 6 animals, 6 toys, 4 small items — zero new object assets; `buildRound` = shuffle pool → slice pairs → double + shuffle layout; `isPair(layout, a, b)`, `isRoundComplete(matched)`; 100% coverage). Match: success flash (250ms green revert) + chime + mascot cheer; mismatch: wiggle ±4° (2°/200ms reduced) + nod + soft tone, both cards flip back after 800ms — no penalty; input locked during transitions; wrong taps count via `recordWrong`, matches via `recordCorrect` so parent Learning Progress accuracy stays meaningful (plays/wins flow unchanged via Hub tile-tap + `completeGame`). Win: shared celebration + `memory-match` sticker + 3s auto-return. `GameId` includes `memory-match`; `GAME_IDS` backfill covers old saves (per-key merge); scene registry has 18 lazy loaders; preload SVG count 159 → 162 (`tile_memory_match.svg`, `sticker_memory_match.svg`, `card_back.svg`); **Hub grid becomes 5×3 + 3 (rows 5/5/5/3 — tile 18 left-aligned on row 4 via generic modulo layout)**; Settings Learning Progress rows 17 → 18 (pages 6+6+6). Noted bug fixed during development: sparse `matched[]` arrays make `Array.prototype.every` skip holes and report a 1-pair round complete — arrays are now dense (`new Array(n).fill(false)`).

> **2026-08-08 — Design Update (Game 13 — More or Less):** Quantity comparison game added (full details in the §3 design note above). `src/game/moreLessLogic.ts` (100% coverage: `ROUND_BANDS`, `createRound(band, mode)`, `createPlaythrough` — 6 rounds, 2 per band 1–3/1–5/1–10 easy-first, exactly 3 more + 3 less shuffled, `evaluateRound`, distinct-counts guard) and `src/scenes/MoreLessScene.ts` (94.5% lines: arrow cue pop-in, 220px cards, 48px items 4-per-row loose grid, speakWord prompt + speaker replay, success flash/chime/dot-pop 700ms, wiggle no-penalty, shared win celebration + `more-less` sticker + 3s auto-return, ParentLock exit, input-lock reset on relaunch). Scene test suite `src/__tests__/scenes/moreLessScene.test.ts` (14 tests) closes with the how-many scene conventions; `GameId` union + `GAME_IDS` backfill; scene registry 13 lazy loaders; preload 148 SVGs; Hub 13 tiles 5×3. Full suite: 45 files / 1101 tests green; Biome clean.

> **2026-08-09 — Design Update (Bundle & Coverage Hardening):** `vite.config.ts` gained `build.rolldownOptions.output.codeSplitting` isolating the Phaser engine into its own vendor chunk (`phaser-*.js`, group `test: /[\\/]node_modules[\\/]phaser[\\/]/`). Shell entry chunk dropped 1,513 kB → 137.16 kB minified (383.5 → 25.5 kB gzip); all 15 lazy game-scene chunks unchanged; PWA precache now 33 entries incl. the vendor chunk. New `scripts/validate-bundle.js` enforces the split (phaser chunk present; shell `index-*.js` ≤ 200 kB) and is wired into CI quality gates after `pnpm run build`. Coverage thresholds raised from 80/80/80/80 to lines 95 / statements 90 / functions 88 / branches 85 (vitest `test.coverage.thresholds`); suite verified green at new thresholds — All files 96.72% stmts / 88.85% branch / 91.87% funcs / 98.1% lines, 52 files / 1207 tests. Zero user-visible behavior change.

> **2026-08-28 — Design Update (Game 19 — Decode It):** Early-decoding game added — picture + spoken word (classic prompting) → tap written word among 4 cards. Prompt image 180px top-center (texture from `WORD_POOL` via `getDecodeWord`), 4 cards row 160px (128px letters, ≥96px touch, 2×2 grid 160×150/40/119). 6 rounds per playthrough, easy-first bands: rounds 1–3 sample 3-letter tier (12 words), rounds 4–6 sample 4-letter tier (10 words); 6 unique targets, no shared first letter and no confusable-family overlap (`isConfusableWith` families [C,G,O,Q],[I,L,T],[M,W]) within round. Adaptive ±1 band via existing `getAdaptiveBandShift("decode-it")` (10-tap window, 0.9/0.6) — early tier split 4+2 / 3+3 / 2+4; shift 0 byte-identical to classic. Pure logic `src/game/decodeLogic.ts` (DECODE_POOL 22 = 18 + FOX/CUP/MAP/BED `sm_fox/sm_cup/sm_map/sm_bed`, `buildRound`/`buildPlaythrough`/`isCorrect` with guards, 100% lines). Scene `src/scenes/DecodeItScene.ts` key `DecodeIt` extends `GameSceneBase` (180px prompt + 160px cards, `SpeakerButton` SFX-gated `speakWord` rate 0.8, success flash `#68D391` + chime + cheer + dot pop 700ms, wiggle ±4° + nod on wrong, `inputLocked`, `progressDots`6, `completeGame("decode-it")` + auto-return). New assets: `src/assets/svg/items/fox.svg`/cup/map/bed (4 CVC, storybook flat `#2D3748` 4–6px), `tile_decode_it.svg` (4 mini cards + magnifier + sparkle), `sticker_decode_it.svg` (cream badge), preload 162→168, `GameId` includes `decode-it`, `GAME_IDS` per-key backfill, sceneRegistry 22 lazy loaders, Hub 19 tiles 5×3+4 (rows 5/5/5/4), Settings Progress rows 18→19 (pages 6/6/6/1), adaptive facade covers decode-it.

> **2026-08-27 - Design Update (UI/UX Cohesion):** Cross-cutting interaction & hierarchy polish across the 18-game experience, preserving the textless no-fail model. (1) **Shared press grammar** — `src/utils/pressFeedback.ts` widened to Image (type-only; real call sites already passed Images at SpeakerButton/Hub) and `attachPressFeedback()` now covers every child tap control: Alphabet/WordMatch/WordBuilder/HowMany/FirstSounds/PatternBuilder cards + tiles, Musical Memory frogs, all SettingsPanel controls, Profile-picker avatars, modal buttons; gameplay handlers stay registered first (down-vs-up semantics and `inputLocked` guards unchanged); consistent squish (0.95) with instant restore on up/out/cancel; spring variant (150ms Back.out) remains on Hub tiles/Back. (2) **Hub hierarchy** — tiles gained a 4px `#2D3748` stroke + 17px labels (offset 20) for 1024×768 and narrow landscape FIT; persistent active-profile ring (92px stroke ring behind profile chip) and picker ring (112px behind active avatar) — scale is no longer the only cue; daily-limit unavailable state adds scale 0.97 + dim 0.45 + moon badge with full restore; empty-slot fade is now reduced-motion-gated (previously ungated). (3) **Parent Settings/Progress affordances** — 400×68 row cards behind all rows; BGM/SFX switch presentation (64×32 track + 24×24 knob slides; knob position + track fill = non-color cue); explicit ✕ close on the main panel; Learning Progress gains viewed-profile ring (80px) + clamped ‹ › chevron pager (dimmed at bounds) replacing the ambiguous More/Back wrap; Profiles manager gains active-row ring (112px); destructive Delete/Reset get stroked emphasis cards (3px `#fc8181`) inside two-step confirm modals (bucket-aware `createModalButton`). (4) **Speaker/audio-visual states** — `src/utils/speech.ts` adds a minimal lifecycle bridge: `onSpeechLifecycle(listener)` + token-guarded `speech:start/end/error` utterance events (superseded/cancelled utterances are inert — no stale active state; warm-up unlock emits nothing). `SpeakerButton` gains dimmed muted/unavailable presentation (`muted` option wired from `sfxEnabled` in the 8 speech games; unsupported engines degrade identically), an active green pulse (alpha breathing tween, static tint under reduced motion — never color-alone), idempotent external `setActive()` driving Musical Memory's note replay via a `sequencePlayId` overlap guard. Zero new dependencies; no storage schema change; no new navigation framework; PWA/lazy-load/offline untouched. Tests: 64 files / 1568, thresholds met (Lines 96.63 / Stmts 95.44 / Branch 87.61 / Funcs 90.78); Biome clean.

> **2026-08-28 — Design Update (Game 20 — Number Order):** Numeral-sequencing / ordinality game added — drag shuffled numeral cards into empty slots in ascending order. Each round shows an aligned pair of rows: dashed slot outlines on top (Graphics, `lineStyle(4)`, 8-dash rounded rects, one per card) and shuffled numeral cards below (140×160, ≥96px touch, Phaser text numerals — no prompt voice; tapping a card speaks its numeral via `speakNumber`, SFX-gated, silent fallback). 6 rounds per playthrough, easy-first bands: rounds 1–2 = 3 numerals from 1–5, rounds 3–4 = 4 from 1–8, rounds 5–6 = 5 from 1–10 (`BAND_RANGES`/`BAND_COUNTS`). Pure logic `src/game/numberOrderLogic.ts` (`buildRound` samples unique numerals from the inclusive band range, sorts ascending for the solution, shuffles for the source row with an ascending-guard reshuffle so a round is never pre-solved; `buildPlaythrough(shift = 0)` maps `shiftLadder(BASE_LADDER, shift)`; `isCorrect(placed, solution)` exact-order check). Adaptive ±1 band via existing `getAdaptiveBandShift("number-order")` threaded at `NumberOrderScene.create()` (10-tap window, 0.9/0.6, twelfth adaptive game; −1 → [1,1,1,1,2,2], 0 → [1,1,2,2,3,3] byte-identical to classic, +1 → [2,2,3,3,3,3]). Scene `src/scenes/NumberOrderScene.ts` key `NumberOrder` extends `GameSceneBase` (drag lift/tilt + snap via `dragJuice`, auto-validation when the last slot fills — correct: success flash + chime + cheer + dot pop, 700ms advance; wrong: wiggle + nod + bounce-back, no penalty; `inputLocked` during transitions, `progressDots` 6, `completeGame("number-order")` + 3s auto-return with `{ justEarned: "number-order" }`, ParentLock exit, input-lock reset on relaunch). New assets: `tile_number_order.svg` (ascending staircase 1→2→3 + arrow + sparkle), `sticker_number_order.svg` (cream badge, 1-2-3 stepping blocks + gold star); preload 168 → 170; `GameId` includes `number-order`, `GAME_IDS` per-key backfill, sceneRegistry 23 lazy loaders, **Hub grid completes 5×4 (20 tiles, rows 5/5/5/5)**, Settings Progress rows 19 → 20 (pages 6+6+6+2), adaptive facade covers number-order.