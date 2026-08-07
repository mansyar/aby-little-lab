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

### Phaser Config (`main.ts`)

> **Note:** Phaser 4 is a major version upgrade from Phaser 3. Verify API compatibility during implementation — some class names, method signatures, or behaviors may have changed. Refer to [Phaser 4 docs](https://docs.phaser.io/) for the latest API.

- **Resolution:** 1024×768 landscape base
- **Scale Mode:** `Phaser.Scale.FIT` + `Phaser.Scale.CENTER_BOTH` — dynamic centered letterboxing
- **Physics:** Arcade Physics, gravity y:0 (top-down/2D, no platformer physics)
- **Scenes:** 12 scenes (Boot, Preload, Hub, 10 game scenes)

> **2026-08-02 — Design Update (Bundle Code Splitting):** Game scenes are lazy-loaded via runtime registration. `src/scenes/sceneRegistry.ts` maps each game scene key to a dynamic-import loader and exposes `ensureSceneLoaded(scene, key)` (no-op if already registered, else `import()` + `scene.add(key, SceneClass)`); HubScene awaits it before transitioning into a game. Phaser 4.2.1 does **not** support dynamic-import lazy loaders in the `scene` array — functions there are invoked with `new` (constructor form only, no promise handling in `SceneManager`). Shell scenes (Boot/Preload/Hub) remain statically registered in `main.ts`. Rollup hoists shared modules into shared chunks automatically; no `manualChunks` config.
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
    │   ├── ShapeSorterScene.ts
    │   ├── AnimalTraceScene.ts
    │   ├── PopFreezeScene.ts
    │   ├── ShadowMatchScene.ts
    │   ├── MusicalMemoryScene.ts
    │   ├── BigSmallScene.ts
    │   ├── PatternBuilderScene.ts
    │   ├── AlphabetScene.ts
    │   ├── WordMatchScene.ts
    │   └── WordBuilderScene.ts
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
    │   └── wordLogic.ts           # Pure game logic (word pool, round/builder generation, win detection)
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
        ├── scenes/
        │   ├── navigation.test.ts
        │   ├── sceneRegistry.test.ts
        │   ├── alphabetScene.test.ts
        │   ├── wordMatchScene.test.ts
        │   ├── wordBuilderScene.test.ts
        │   └── firstWordsIntegration.test.ts
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
