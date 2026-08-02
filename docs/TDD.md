# Technical Design Document (TDD)

**Project:** Aby's Little Lab
**Companion document:** [PRD.md](./PRD.md)

---

## 1. Technology Stack

| Component | Technology | Version | Rationale |
|---|---|---|---|
| Game Engine | Phaser 4 | 4.2.1 | Latest stable 2D framework with SVG rasterization, Arcade Physics, scene management |
| Language | TypeScript | 7.0.2 | Type safety for scenes, components, shared interfaces |
| Build Tool | Vite | 8.1.5 | Fast HMR dev server, ES module bundling, plugin ecosystem |
| PWA | vite-plugin-pwa | 1.3.0 | Auto-generated service worker + manifest, precaching, prompt-based updates |
| Testing | Vitest | 4.1.10 | Native Vite integration, fast test runner |
| Coverage | @vitest/coverage-v8 | 4.1.10 | V8-based code coverage provider |
| Test Environment | happy-dom | 18.0.1 | Lightweight DOM implementation for unit tests |
| Linting/Formatting | Biome | 2.5.5 | All-in-one linter and formatter |
| Package Manager | pnpm | 11.7.0 | Fast, disk-efficient, strict dependency resolution — pinned via corepack in the Dockerfile and `pnpm/action-setup` in CI (2026-08-02) |
| Audio | Web Audio API | Browser native | Synthesized tones for Game 5 frog notes + gameplay SFX (correct, incorrect, win, sticker) + Game 3 pop/wake sounds + idle-attract chime — no file overhead |

### Dependencies (`package.json`)

```json
{
  "dependencies": {
    "phaser": "^4.2.1"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.5.5",
    "@vitest/coverage-v8": "^4.1.10",
    "happy-dom": "^18.0.1",
    "typescript": "^7.0.2",
    "vite": "^8.1.5",
    "vite-plugin-pwa": "^1.3.0",
    "vitest": "^4.1.10"
  }
}
```

---

## 2. Project Directory Structure

```
aby-little-lab/
├── index.html                      # Vite entry point
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript compiler config
├── vite.config.ts                  # Vite + vite-plugin-pwa + Vitest configuration
├── biome.json                      # Biome linter/formatter config (double quotes, 2-space)
├── public/
│   ├── audio/                      # Runtime audio served at /audio/ (BGM)
│   └── icons/                      # PWA icons (192px, 512px, maskable)
└── src/
    ├── main.ts                     # Phaser 4 game config & shell scene register (game scenes lazy-loaded via sceneRegistry)
    ├── vite-env.d.ts               # Vite type declarations
    ├── scenes/
    │   ├── BootScene.ts            # Orientation lock & system initialization
    │   ├── PreloadScene.ts         # Progress bar & asset preloading
    │   ├── HubScene.ts             # Game selection grid, sticker shelf, idle attract & settings parental lock; tile taps lazy-load game scenes
    │   ├── sceneRegistry.ts        # Lazy scene registry (per-key dynamic-import loaders + ensureSceneLoaded runtime registration, 2026-08-02)
    │   ├── ShapeSorterScene.ts     # Mini-Game 1
    │   ├── AnimalTraceScene.ts     # Mini-Game 2
    │   ├── PopFreezeScene.ts       # Mini-Game 3
    │   ├── ShadowMatchScene.ts     # Mini-Game 4
    │   ├── MusicalMemoryScene.ts   # Mini-Game 5
    │   ├── BigSmallScene.ts        # Mini-Game 6
    │   └── PatternBuilderScene.ts  # Mini-Game 7
    ├── components/
    │   ├── ParentLock.ts           # Hardened long-press gate (hold 3s, one hold at a time, pointercancel-safe, circular progress ring, full cleanup)
    │   ├── SettingsPanel.ts        # Parental BGM/SFX modal overlay + context-aware install control (Install App / How to Install / hidden)
    │   ├── PwaToast.ts             # Hub lifecycle toast (update-ready + offline-ready, app-styled, reduced-motion-aware)
    │   └── Mascot.ts               # Professor Hoot mascot (wave/nod/cheer/idleLoop + createCornerMascot factory; tween-only, reduced-motion-aware)
    ├── audio/
    │   └── AudioManager.ts         # BGM/SFX playback (HTML5 Audio) + frog note synthesis + gameplay SFX synthesis + Game 3 pop/wake synthesis (Web Audio API); singleton via getInstance()
    ├── game/
    │   ├── shapeSorterLogic.ts    # Pure game logic (Fisher-Yates shuffle, shape selection, match detection)
    │   ├── animalTraceLogic.ts    # Pure game logic (pair selection/shuffle, path progress, completion detection, waypoint generation)
    │   ├── popFreezeLogic.ts     # Pure game logic (round state, bubble type selection, spawn config, pop/wake registration)
    │   ├── shadowMatchLogic.ts   # Pure game logic (independent shuffle, round generation, match detection, win detection)
    │   ├── musicalMemoryLogic.ts # Pure game logic (sequence generation, note appending, input validation, round/win detection)
    │   ├── bigSmallLogic.ts     # Pure game logic (toy selection, dual-scale instance creation, round generation, scale-category match detection, win detection)
    │   └── patternBuilderLogic.ts # Pure game logic (pattern row generation, gap placement, 3-unique-choice generation, playthrough generation)
    ├── types/
    │   └── index.ts                # Shared interfaces (GameId, StickerData, Settings, AppStorage)
    ├── utils/
    │   ├── storage.ts              # localStorage CRUD (load, save, earnSticker, hasSticker, getSettings, updateSettings, resetProgress)
    │   ├── motion.ts               # Reduced-motion helpers (isReducedMotion, motionDuration, motionScale)
    │   ├── sceneTransitions.ts     # Crossfade scene transitions (transitionToScene, sceneEntrance)
    │   ├── completionEffect.ts     # Bounded success effects (createCompletionSplash, createWinCelebration)
    │   ├── dragJuice.ts            # Per-game drag juice (attachDragLift, attachDropZoneHighlight, snapToSlot)
    │   ├── pressFeedback.ts        # Press squish + optional spring-back feedback (attachPressFeedback)
    │   ├── pwaBridge.ts            # Testable wrapper around virtual:pwa-register (needRefresh/offlineReady events, Hub-active queue, updateNow)
    │   └── pwaInstall.ts           # Install-state machine (installable/ios-howto/hidden), beforeinstallprompt capture, iOS UA detection
    ├── assets/
    │   └── svg/                    # AI-Generated SVG Assets
    │       ├── shapes/             # Circle, Square, Triangle, Star, Heart, Crescent SVGs + cutouts
    │       ├── animals/            # Monkey, Rabbit, Cat, Dog, Elephant, Pig (Game 2 + reused as Game 3 sleeping-animal content) + Frog variants (Game 5)
    │       ├── items/              # Banana, Carrot, Fish, Bone, Peanut, Apple (Game 2 food) + House, Tree, Car, Boat, Ball, Umbrella, Airplane, Mushroom (Game 4 objects) + Lily Pad (Game 5)
    │       ├── toys/               # Teddy Bear, Toy Car, Toy Ball, Toy Block, Toy Rocket, Toy Drum, Toy Box (Game 6)
    │       ├── shadows/            # Shadow silhouettes for Game 4 (shadow_house, shadow_tree, shadow_car, shadow_boat, shadow_ball, shadow_umbrella — #2D3748 fill)
    │       ├── stickers/           # Reward stickers (one per mini-game)
    │       └── ui/                 # Tiles, Star, Lock, Box, Shelf, Bubbles, Path SVGs + Mascot poses
    ├── styles/
    │   └── style.css               # Touch locks (-webkit-user-select, touch-action: none)
    └── __tests__/
        ├── audio/                  # AudioManager tests (BGM/SFX/synthesis + singleton)
        ├── components/             # ParentLock, Mascot tests
        ├── game/                   # Game logic tests (shapeSorterLogic, animalTraceLogic, popFreezeLogic, shadowMatchLogic, musicalMemoryLogic, bigSmallLogic, patternBuilderLogic)
        ├── scenes/                 # Scene-level tests (navigation incl. lazy scene registration, drag/drop, completion, registry)
        └── utils/                  # Storage, motion, sceneTransitions, completionEffect, dragJuice, and pressFeedback tests
```

---

## 3. PWA Configuration (`vite.config.ts`)

The PWA manifest and service worker are configured via `vite-plugin-pwa`. No source `manifest.json` or `sw.js` files are maintained; production builds generate `manifest.webmanifest`, `sw.js`, and the Workbox runtime. Emitted build assets are precached, and `includeAssets` explicitly adds the runtime BGM file from `public/`. `registerType: "prompt"` means updates are deferred until the user taps "Update now" on the Hub toast (`src/components/PwaToast.ts` via `src/utils/pwaBridge.ts`).

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "prompt",
      includeAssets: ["audio/bgm.mp3"],
      manifest: {
        name: "Aby's Little Lab",
        short_name: "Aby Lab",
        start_url: "./index.html",
        display: "standalone",
        orientation: "landscape",
        background_color: "#FAF9F6",
        theme_color: "#2B6CB0",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
    }),
  ],
  test: {
    environment: "happy-dom",
    globals: true,
    include: ["src/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/__tests__/**", "src/main.ts", "src/types/**"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

After `pnpm run build`, run `node scripts/validate-pwa.js` to verify the generated manifest, service worker, icon, BGM asset, and precache entries. Phone/tablet installation and offline checks must use an HTTPS private static host or tunnel.

---

## 4. Phaser Scale Manager Configuration (`src/main.ts`)

```typescript
import "./styles/style.css";
import { registerSW } from "virtual:pwa-register";
import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { HubScene } from "./scenes/HubScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { initPwaBridge } from "./utils/pwaBridge";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: "game-container",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
    },
  },
  // Shell scenes only — the 7 game scenes are lazy-loaded and registered
  // at runtime via ensureSceneLoaded() when a Hub tile is tapped.
  scene: [BootScene, PreloadScene, HubScene],
};

new Phaser.Game(config);
```

### Bundle Code Splitting & Lazy Scene Loading (2026-08-02)

**Design decision:** only the shell scenes (`BootScene`, `PreloadScene`, `HubScene`) are statically registered; the seven game scenes are lazy-loaded so the startup bundle excludes their code (track `code-splitting_20260802`, archived at `conductor/archive/code-splitting_20260802/`).

**Phaser 4.2.1 limitation (verified in `SceneManager.js`):** the `scene` array does **not** support async/lazy loaders. `SceneType` includes `Function`, but `createSceneFromFunction` invokes `new scene()` synchronously — no promise is awaited, so a dynamic-import function cannot be used as an array entry. The supported pattern is runtime registration: `await import()` the scene module, then `scene.add(key, SceneClass)` before `scene.start(key)`.

**`src/scenes/sceneRegistry.ts`:**

```typescript
export const sceneLoaders: Record<string, () => Promise<Phaser.Types.Scenes.SceneType>> = {
  ShapeSorter: () => import("./ShapeSorterScene").then((m) => m.ShapeSorterScene),
  // ...same pattern for AnimalTrace, PopFreeze, ShadowMatch, MusicalMemory, BigSmall, PatternBuilder
};

export async function ensureSceneLoaded(scene, key, loaders = sceneLoaders): Promise<void> {
  if (scene.scene.get(key)) return; // already registered
  const sceneClass = await loaders[key]();
  if (!scene.scene.get(key)) scene.scene.add(key, sceneClass); // idempotent under concurrent taps
}
```

**Hub wiring:** the tile `pointerup` handler runs `void ensureSceneLoaded(this, GAME_TILES[i].sceneKey).then(() => transitionToScene(this, GAME_TILES[i].sceneKey))` — the chunk loads before the fade-out starts the target scene.

**Race safety:** `SceneManager.add` on an already-registered key does **not** throw for instances — it silently pushes a duplicate instance into `this.scenes`. `ensureSceneLoaded` therefore re-checks registration after the import resolves, and the review-fix test covers two concurrent loads registering exactly once.

**Build output:** the entry chunk (~1.44 MB / 372 KB gzip, dominated by Phaser) contains only the shell; each game scene ships as its own 3–5 KB chunk (`dist/assets/<SceneName>-*.js`). Rollup auto-hoists shared modules (`shapeSorterLogic`, `dragJuice`, `completionEffect`) into common chunks — no `manualChunks` config. PWA precache is unchanged: `generateSW` precaches every emitted chunk (19 entries), preserving full offline play.

**Structural acceptance checks:** the entry chunk contains zero game-scene constructor registrations (`super({ key: ... })` grep over `dist/assets` finds only `Boot`, `Preload`, `Hub` in the entry; each scene chunk contains exactly its own key).

---

## 5. Screen Orientation Auto-Rotate (`src/scenes/BootScene.ts`)

On phone launch, attempt to lock the screen to landscape orientation. The manifest `orientation: landscape` serves as the primary hint; this JS call provides an additional programmatic lock for installed PWAs.

```typescript
// Attempt programmatic landscape lock (works in standalone/installed PWA mode)
if (screen.orientation) {
    screen.orientation.lock("landscape").catch(() => {
        // Not all browsers/devices support programmatic orientation lock.
        // The manifest `orientation: landscape` acts as a fallback.
    });
}
```

---

## 6. localStorage Schema

All app state is stored under a single localStorage key as a JSON object.

**Key:** `abby-little-lab:v1`

```typescript
type GameId =
  | "shape-sorter"
  | "animal-trace"
  | "pop-freeze"
  | "shadow-match"
  | "musical-memory"
  | "big-small"
  | "pattern-builder";

interface StickerData {
  earned: boolean;
  earnedAt: string | null; // ISO timestamp, null if not earned
}

interface Settings {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
}

interface AppStorage {
  stickers: Record<GameId, StickerData>;
  settings: Settings;
}
```

**Migration (2026-08-02):** `load()` merges saved data over defaults per key (`stickers` and `settings`), so saves created before a game shipped keep working — every `GameId` always resolves to an entry (new games backfill as unearned) and existing progress/settings are preserved. Empty storage and corrupted JSON fall back to defaults.

### Settings Panel

`SettingsPanel` is created by `HubScene` after the Settings `ParentLock` succeeds. It renders a black 0.6-alpha backdrop and a cream, outlined modal. Its 96px-high BGM and SFX text hit areas exceed the 64px touch-target minimum.

Each control delegates to the `AudioManager` singleton: BGM toggles persist through `setBGMEnabled()` and start or pause playback; SFX toggles persist through `setSFXEnabled()` and play `playCorrect()` only when enabled. Tapping the backdrop destroys every panel object. `HubScene` also destroys an open panel during shutdown.

Below the toggles, an install row renders based on `InstallTracker.getState()` (see `src/utils/pwaInstall.ts`): **"Install App"** (state `installable`) calls `tracker.prompt()` on tap to trigger the deferred `beforeinstallprompt`; **"How to Install"** (state `ios-howto`) opens an iOS instructions overlay (Share → Add to Home Screen steps + Close); state `hidden` (installed/standalone) renders nothing. The tracker is injectable in tests and defaults to real browser event wiring.

A danger-colored **"Reset Progress"** row (24px text, 240×64 hit area) sits between the install row and the footer. Tapping it opens a two-step confirm modal ("Reset all stickers?" with Cancel / Reset buttons, both 240×64): Cancel destroys the overlay without changes; Reset calls `resetProgress()` from `src/utils/storage.ts`, closes the overlay, and updates the row in place to "Progress cleared" (muted). The panel shows a muted, non-interactive version footer (`v${__APP_VERSION__}`, 18px, `#A0AEC0`) at the bottom; `__APP_VERSION__` is injected by Vite's `define` from `package.json` `version`.

`resetProgress()` (2026-08-02) clears every sticker (`earned: false`, `earnedAt: null`) while preserving `settings`; it reuses `load()`'s migration-safe merging, so it also repairs corrupt storage. The panel's optional third constructor argument `onProgressReset` fires after a confirmed reset; `HubScene` passes a callback that destroys and re-creates the sticker shelf images (`createShelfSticker()` / `rerenderStickerShelf()`), re-reading storage so the Hub reflects the reset immediately. Tests cover the callback contract and the re-render (old thumbnails destroyed, 7 fresh dimmed thumbnails).

### ParentLock (hardened, 2026-08-01)

`ParentLock` gates Hub Settings and every game Back control behind a 3-second hold (`DEFAULT_HOLD_DURATION = 3000`). Hardening decisions:

- **Single hold per active pointer:** a second `pointerdown` while a hold is active is ignored (`holdActive` guard).
- **Cancellation:** `pointerup`, `pointerout`, and `pointercancel` all cancel the hold and fire `onFailure` exactly once; `destroy()` (scene shutdown) cancels without firing callbacks.
- **Exactly-once success:** the delayed-call callback checks `holdActive`, nulls the timer, clears the ring, then invokes `onSuccess()`; stale callbacks after cancel/destroy/shutdown are no-ops.
- **Circular progress ring:** on `pointerdown`, a `Graphics` ring (48px radius, `#68D391` at 0.6 alpha, depth 10000) is drawn around the target center via `slice()` + `fillPath()`, animated with a `tweens.add` value tween over the hold duration. The ring and tween are destroyed on cancel, completion, and `destroy()` — no display objects leak.
- **Hit areas:** protected controls (7 Back buttons, Hub Settings, Musical Memory Replay) use `setInteractive({ hitArea: new Phaser.Geom.Rectangle(0, 0, 96, 96), hitAreaCallback: Phaser.Geom.Rectangle.Contains })`. Phaser anchors custom hit areas at the **top-left of the display bounds** (`pointWithinHitArea` adds `displayOriginX/Y`), independent of `setOrigin` — hence `Rectangle(0, 0, 96, 96)` for every protected control.

### Game IDs

| Game ID | Game |
|---|---|
| `shape-sorter` | Game 1 |
| `animal-trace` | Game 2 |
| `pop-freeze` | Game 3 |
| `shadow-match` | Game 4 |
| `musical-memory` | Game 5 |
| `big-small` | Game 6 |
| `pattern-builder` | Game 7 |

### Example State

```json
{
  "stickers": {
    "shape-sorter": { "earned": true, "earnedAt": "2024-08-01T00:00:00.000Z" },
    "animal-trace": { "earned": false, "earnedAt": null },
    "pop-freeze": { "earned": true, "earnedAt": "2024-08-02T00:00:00.000Z" },
    "shadow-match": { "earned": false, "earnedAt": null },
    "musical-memory": { "earned": false, "earnedAt": null },
    "big-small": { "earned": false, "earnedAt": null },
    "pattern-builder": { "earned": false, "earnedAt": null }
  },
  "settings": {
    "bgmEnabled": true,
    "sfxEnabled": true
  }
}
```

---

## 7. Asset Manifest

### SVG Assets — Shapes (`assets/svg/shapes/`)

| File | Dimensions | Game | Notes |
|---|---|---|---|
| `shape_circle.svg` | 512×512 | Game 1 | Colored fill (`#F6AD55`), thick `#2D3748` outline |
| `shape_square.svg` | 512×512 | Game 1 | Colored fill (`#9F7AEA`), thick `#2D3748` outline |
| `shape_triangle.svg` | 512×512 | Game 1 | Colored fill (`#4FD1C5`), thick `#2D3748` outline |
| `shape_star.svg` | 512×512 | Game 1 | Colored fill (`#F687B3`), thick `#2D3748` outline |
| `shape_heart.svg` | 512×512 | Game 1 | Colored fill (`#E53E3E`), thick `#2D3748` outline |
| `shape_crescent.svg` | 512×512 | Game 1 | Colored fill (`#ECC94B`), thick `#2D3748` outline |
| `cutout_circle.svg` | 512×512 | Game 1 | 30% opacity fill, dashed `#2D3748` stroke |
| `cutout_square.svg` | 512×512 | Game 1 | 30% opacity fill, dashed `#2D3748` stroke |
| `cutout_triangle.svg` | 512×512 | Game 1 | 30% opacity fill, dashed `#2D3748` stroke |
| `cutout_star.svg` | 512×512 | Game 1 | 30% opacity fill, dashed `#2D3748` stroke |
| `cutout_heart.svg` | 512×512 | Game 1 | 30% opacity fill, dashed `#2D3748` stroke |
| `cutout_crescent.svg` | 512×512 | Game 1 | 30% opacity fill, dashed `#2D3748` stroke |

### SVG Assets — Animals (`assets/svg/animals/`)

| File | Dimensions | Game | Notes |
|---|---|---|---|
| `monkey.svg` | 512×512 | Game 2 | Character sprite (left side) — brown (#A0522D) |
| `rabbit.svg` | 512×512 | Game 2 | Character sprite (left side) |
| `cat.svg` | 512×512 | Game 2 | Character sprite (left side) |
| `dog.svg` | 512×512 | Game 2 | Character sprite (left side) |
| `elephant.svg` | 512×512 | Game 2 | Character sprite (left side) — gray (#A0AEC0), curled trunk |
| `pig.svg` | 512×512 | Game 2 | Character sprite (left side) — pink (#F687B3), snout (#FBB6CE), curly tail |
| `elephant.svg` | 512×512 | Game 2 | Character sprite (left side) — gray (#A0AEC0), curled trunk |
| `pig.svg` | 512×512 | Game 2 | Character sprite (left side) — pink (#F687B3), snout (#FBB6CE), curly tail |
| `frog_green.svg` | 512×512 | Game 5 | Note: C4 (261.63 Hz) |
| `frog_blue.svg` | 512×512 | Game 5 | Note: E4 (329.63 Hz) |
| `frog_red.svg` | 512×512 | Game 5 | Note: G4 (392.00 Hz) |

> **Note:** Game 3 (Pop & Freeze!) reuses the 4 existing animal SVGs (`monkey.svg`, `rabbit.svg`, `cat.svg`, `dog.svg`) as sleeping-animal content inside translucent bubbles — no separate sleeping-animal SVGs were created.

### SVG Assets — Items (`assets/svg/items/`)

| File | Dimensions | Game | Notes |
|---|---|---|---|
| `banana.svg` | 512×512 | Game 2 | Food target (right side) — pairs with monkey |
| `carrot.svg` | 512×512 | Game 2 | Food target (right side) — pairs with rabbit |
| `fish.svg` | 512×512 | Game 2 | Food target (right side) — pairs with cat |
| `bone.svg` | 512×512 | Game 2 | Food target (right side) — pairs with dog |
| `peanut.svg` | 512×512 | Game 2 | Food target (right side) — pairs with elephant |
| `apple.svg` | 512×512 | Game 2 | Food target (right side) — pairs with pig |
| `house.svg` | 512×512 | Game 4 | Colored object — yellow walls (#F6E05E), orange roof (#F6AD55), thick `#2D3748` outline |
| `tree.svg` | 512×512 | Game 4 | Colored object — green canopy (#48BB78), brown trunk (#A0522D), thick `#2D3748` outline |
| `car.svg` | 512×512 | Game 4 | Colored object — red body (#F56565), thick `#2D3748` outline |
| `boat.svg` | 512×512 | Game 4 | Colored object — blue hull (#4299E1), thick `#2D3748` outline |
| `ball.svg` | 512×512 | Game 4 | Colored object — yellow (#ECC94B), thick `#2D3748` outline |
| `umbrella.svg` | 512×512 | Game 4 | Colored object — purple (#9F7AEA), thick `#2D3748` outline |
| `airplane.svg` | 512×512 | Game 4 | Colored object — fuselage (#BEE3F8), fin/wings (#3182CE), thick `#2D3748` outline |
| `mushroom.svg` | 512×512 | Game 4 | Colored object — red cap (#E53E3E) with white spots, cream stem (#FFF8E7), thick `#2D3748` outline |

### SVG Assets — Toys (`assets/svg/toys/`)

| File | Dimensions | Game | Notes |
|---|---|---|---|
| `teddy_bear.svg` | 512×512 | Game 6 | Golden brown body (#D69E2E), inner ears/muzzle (#F6AD55), sorted by scale (big/small) |
| `toy_car.svg` | 512×512 | Game 6 | Coral body (#FC8181), light blue windows (#BEE3F8), sorted by scale (big/small) |
| `toy_ball.svg` | 512×512 | Game 6 | Teal base (#4FD1C5), orange center circle (#F6AD55), sorted by scale (big/small) |
| `toy_block.svg` | 512×512 | Game 6 | Purple body (#9F7AEA), yellow star (#ECC94B), sorted by scale (big/small) |
| `toy_rocket.svg` | 512×512 | Game 6 | Blue body (#3182CE), red nose/fins (#E53E3E), flame (#F6AD55), sorted by scale (big/small) |
| `toy_drum.svg` | 512×512 | Game 6 | Yellow body (#ECC94B), cream top (#FFF8E7), brown bottom (#D69E2E), sorted by scale (big/small) |
| `toy_box.svg` | 512×512 | Game 6 | Orange body (#F6AD55), yellow opening (#ECC94B) — rendered at both 1.5× (big) and 0.7× (small) scales |

### SVG Assets — UI (`assets/svg/ui/`)

| File | Dimensions | Usage | Notes |
|---|---|---|---|
| `wooden_tray.svg` | 512×512 | Hub | Game tile frame |
| `tile_shape_sorter.svg` | 512×512 | Hub | Game 1 tile icon |
| `tile_animal_trace.svg` | 512×512 | Hub | Game 2 tile icon |
| `tile_pop_freeze.svg` | 512×512 | Hub | Game 3 tile icon |
| `tile_shadow_match.svg` | 512×512 | Hub | Game 4 tile icon |
| `tile_musical_memory.svg` | 512×512 | Hub | Game 5 tile icon |
| `tile_big_small.svg` | 512×512 | Hub | Game 6 tile icon |
| `shelf.svg` | 512×512 | Game 4 | Shadow display shelf |
| `lock_icon.svg` | 512×512 | Global | Parental lock indicator |
| `star.svg` | 512×512 | Game 3 / Global | Bonus star, rating |
| `dotted_path.svg` | 512×512 | Game 2 | Trace path guide *(superseded — path now generated at runtime via `Phaser.Curves.Path` + Graphics)* |
| `bubble.svg` | 512×512 | Game 3 | Translucent round bubble (`#BEE3F8`, fill-opacity 0.4) with `#2D3748` outline and highlight |
| `lilypad.svg` | 512×512 | Game 5 | Frog platform |

### SVG Assets — Shadows (`assets/svg/shadows/`)

| File | Dimensions | Game | Notes |
|---|---|---|---|
| `shadow_house.svg` | 512×512 | Game 4 | Silhouette — `#2D3748` fill, derived from `house.svg` paths |
| `shadow_tree.svg` | 512×512 | Game 4 | Silhouette — `#2D3748` fill, derived from `tree.svg` paths |
| `shadow_car.svg` | 512×512 | Game 4 | Silhouette — `#2D3748` fill, derived from `car.svg` paths |
| `shadow_boat.svg` | 512×512 | Game 4 | Silhouette — `#2D3748` fill, derived from `boat.svg` paths |
| `shadow_ball.svg` | 512×512 | Game 4 | Silhouette — `#2D3748` fill, derived from `ball.svg` paths |
| `shadow_umbrella.svg` | 512×512 | Game 4 | Silhouette — `#2D3748` fill (handle as stroke), derived from `umbrella.svg` paths |
| `shadow_airplane.svg` | 512×512 | Game 4 | Silhouette — `#2D3748` fill, derived from `airplane.svg` paths |
| `shadow_mushroom.svg` | 512×512 | Game 4 | Silhouette — `#2D3748` fill, derived from `mushroom.svg` paths |

### SVG Assets — Stickers (`assets/svg/stickers/`)

| File | Dimensions | Game | Notes |
|---|---|---|---|
| `sticker_shape_sorter.svg` | 512×512 | Game 1 | Unique themed sticker |
| `sticker_animal_trace.svg` | 512×512 | Game 2 | Unique themed sticker |
| `sticker_pop_freeze.svg` | 512×512 | Game 3 | Unique themed sticker |
| `sticker_shadow_match.svg` | 512×512 | Game 4 | Unique themed sticker |
| `sticker_musical_memory.svg` | 512×512 | Game 5 | Unique themed sticker |
| `sticker_big_small.svg` | 512×512 | Game 6 | Unique themed sticker |
| `sticker_pattern_builder.svg` | 512×512 | Game 7 | Unique themed sticker — ABAB row (orange circle + teal rounded square) with dashed gap slot on the cream badge |

### Mascot Poses (`src/assets/svg/ui/`)

| File | Dimensions | Used In | Notes |
|---|---|---|---|
| `mascot_idle.svg` | 512×512 | Hub + all seven games | Professor Hoot neutral pose (idle bob + blink loop on Hub) |
| `mascot_celebrate.svg` | 512×512 | Hub + all seven games | Arms-up cheer pose (bounce + sparkle ring via Graphics) |

> **Note:** The mascot is **tween-only** — no sprite sheets or particle emitters. Poses are rasterized at 512×512 from `?raw` SVG imports; reactions (wave, nod, cheer, big cheer) are animations over these two static poses. The sparkle ring is a self-cleaning Phaser Graphics circle.

### Audio Assets (`public/audio/`)

| File | Format | Used In | Notes |
|---|---|---|---|
| `bgm.mp3` | MP3 | All scenes | Ambient loop at 0.3 volume, served at `/audio/bgm.mp3` and precached for offline play |

> **Note:** Game 3's bubble pop and sleeping-animal wake sounds are **synthesized via Web Audio API** (`AudioManager.playPop()` at 800 Hz / 0.08s, `AudioManager.playWake()` with E4 + A4 dual oscillators) — no MP3 files needed for these.
>
> **Note:** Gameplay SFX (correct, incorrect, win, sticker) used by Games 1, 2, 4, and 6 are **synthesized via Web Audio API** (`AudioManager.playCorrect()`, `playIncorrect()`, `playWin()`, `playSticker()`) — no MP3 files needed for these. Game 4 reuses these existing synthesized methods; no new audio synthesis was added for the Shadow Match track. Game 6 similarly reuses these existing synthesized methods; no new audio synthesis was added for the Big vs. Small Cleaner track. Game 7 similarly reuses these existing synthesized methods; no new audio synthesis was added for the Pattern Builder track.

### PWA Icons (`public/icons/`)

| File | Dimensions | Notes |
|---|---|---|
| `icon-192.png` | 192×192 | App icon for manifest + `apple-touch-icon` |
| `icon-512.png` | 512×512 | App icon for PWA manifest |
| `icon-maskable-512.png` | 512×512 | Maskable variant (`purpose: "any maskable"`), content within the safe zone |

### Asset Summary

| Type | Count |
|---|---|
| SVG — shapes | 12 (6 shapes + 6 cutouts) |
| SVG — animals | 9 |
| SVG — items | 14 (6 Game 2 food + 8 Game 4 objects) |
| SVG — toys | 7 (6 toys + 1 box, Game 6) |
| SVG — shadows | 8 (Game 4 silhouettes) |
| SVG — UI | 15 (13 shared + 2 mascot poses) |
| SVG — stickers | 7 |
| Audio (MP3) | 1 |
| PWA icons (PNG) | 3 |
| **Total** | **76** |

---

## 8. Motion & Feedback System

All animation and feedback utilities live in `src/utils/` and are wired into every scene. They were introduced by the Cross-Cutting Motion track (2026-08-01, archived at `conductor/archive/cross-cutting-motion_20260801/`).

### `motion.ts`

Single source of truth for reduced-motion behavior:

- `isReducedMotion()` — reads `window.matchMedia("(prefers-reduced-motion: reduce)")`.
- `motionDuration(normal, reduced)` — returns `reduced` when reduced motion is active, else `normal`.
- `motionScale(normal, reduced)` — same pattern for scale amplitudes.

Every tween in the app consults these helpers **at call time** (not module load), so a mid-session OS setting change takes effect immediately.

### HubScene engagement systems

The Hub implements the engagement track (FR1–FR5):

- **Entrance & idle life:** tiles/labels/stickers enter with a 40ms stagger (`ENTRANCE_STAGGER`), 300ms `Sine.out` alpha + scale; tiles and labels then bob on a 2.5s ±4px `Sine.inOut` loop (200ms phase offsets). Four low-contrast dots drift behind the grid (4000–6000ms loops, depth −1). All skipped or alpha-only under reduced motion.
- **Sticker shelf:** real sticker textures (`sticker_<gameId>` keys, rasterized at 512px) rendered at `STICKER_SCALE = 56/512`:
  - Earned: full alpha, 800ms shimmer loop (`SPARKLE_ALPHA 0.75`).
  - Unearned: alpha 0.3, scale 0.85×.
  - Just earned: `Back.out` entrance to 1.15× + 500ms sparkle burst (scale pulse to 1.25× + shimmer). Triggered via `init({ justEarned })` from scene-start data; game scenes pass it only when the sticker was earned that session (replays pass no data). The shelf is touch-inert (no `setInteractive`).
- **Idle attract:** `scheduleIdleAttract()` arms a 25s timer; `triggerIdleAttract()` plays `AudioManager.playIdleCall()` (E5+G5, gain 0.12), starts a 4° rotation wiggle on all tiles (350ms `Sine.inOut` yoyo, 120ms offsets, once per idle period), and re-arms at 10s intervals. Any `input.on("pointerdown")` calls `resetIdleAttract()` (removes the pending timer, re-arms 25s). Shutdown removes the timer; reduced motion plays the chime only (no wiggle).

### `sceneTransitions.ts`

- `transitionToScene(scene, key, data?)` — 300ms fade-out to the app background `0xfaf9f6`, starts the target scene (with `data` when provided), then 180ms fade-in. Used for every navigation path (boot → preload → hub, hub → game, game → hub, parental-lock exits). Game scenes pass `{ justEarned: gameId }` to the Hub on first-time sticker earns.
- `sceneEntrance(scene)` — 180ms fade-in with a subtle zoom from 1.02 → 1 at scene start. The zoom ease is the canonical EaseMap key `"Sine"` — camera **Zoom effects resolve ease strings against their own EaseMap**, so dotted keys like `"Sine.out"` are not found and leave the effect's ease undefined (runtime crash).
- The only remaining bare `scene.start` call is BootScene's initial launch (intentional — there is nothing to fade from).

### `completionEffect.ts`

- `createCompletionSplash(scene, x, y)` — bounded success effect for correct in-game actions; self-cleaning (destroys on tween complete), never clouds the play area.
- `createWinCelebration(scene, x, y)` — the shared completion effect used by all seven games (replaces per-game bespoke win tweens):
  - 10 rays + 10 drifting confetti bits (`WIN_CONFETTI_COUNT = 10`), `WIN_STANDARD_DURATION = 700ms`, ray burst scale 1.25×.
  - Colors: `0x68d391`, `0x4fd1c5`, `0xf687b3`, `0xf6ad55`, `0x9f7aea`.
  - Reduced motion: `WIN_REDUCED_DURATION = 300ms`, 6 rays, burst scale 1.0×, **no particles**.
  - Fully self-cleaning; uses Graphics, never `add.particles`.

### `pressFeedback.ts`

- `attachPressFeedback(obj, options?)` — captures `obj.scaleX` at attach time; `pointerdown` squishes to `baseScale × 0.95`; `pointerup`/`pointerout`/`pointercancel` restore `baseScale` — instantly by default, or with a 150ms `Back.out` spring when `options.spring` is set. No-op under reduced motion.
- Wired to the seven game Back controls, Musical Memory Replay, Hub Settings, and every Hub game tile (with `{ spring: true }`, attached on entrance completion so the base scale is captured at 1.0). Registered **after** the primary handlers (ParentLock/hold, replay, audio), so listener order preserves control behavior. Hub tiles navigate on `pointerup` so the press squish stays visible while holding.

### Gameplay tween values (normal → reduced)

| Tween | Normal | Reduced |
|---|---|---|
| Bounce-backs (Shape Sorter, Shadow Match, Big vs. Small) | 300 ms | 180 ms |
| Bubble pop shrink (Pop & Freeze!) | 200 ms | 120 ms |
| Wake wobble (Pop & Freeze!) | 300 ms, 1.15× base | 180 ms, 1.05× base |
| Frog bounce (Musical Memory) | 200 ms, 1.2× base | 120 ms, 1.05× base |
| Sticker pops (all seven games) | 300 ms | 180 ms |

### Per-game juice (2026-08-01)

The Per-Game Juice track (archived at `conductor/archive/per-game-juice_20260801/`) added scene-level juice to every game — zero gameplay-rule changes, zero new assets, Graphics-only effects (the app never uses `add.particles`). Every value below consults `motionDuration`/`motionScale` at call time.

#### `dragJuice.ts`

- `attachDragLift(obj, options?)` — on `dragstart` tweens the object to `base × motionScale(1.1, 1.05)` scale and `motionScale(4, 0)` degrees tilt (`Sine.out`, 120ms/80ms); on `dragend` restores base scale and 0° (150ms/100ms). `options.skipRestore` lets a scene suppress the restore (Big vs. Small, whose toy already shrank into the box).
- `attachDropZoneHighlight(scene, zones)` — registers `dragenter`/`dragleave`/`dragend` on `scene.input`; on enter creates a Graphics outline (`lineStyle(6, 0x2b6cb0, 0.9)`, `strokeRect` around the zone) and pulses it on a `repeat: -1` `Sine.inOut` yoyo (400ms/240ms, scale `motionScale(1.06, 1.02)`), destroying it on leave/end.
- `snapToSlot(scene, obj, x, y)` — 200ms/120ms `Back.out` tween that replaces the old instant `setPosition` on correct drops.

#### Per-game reactions (normal → reduced)

| Game | Reaction | Values |
|---|---|---|
| Shape Sorter / Shadow Match / Big vs. Small | Drag lift + tilt, zone highlight, snap tween | lift 1.1×/1.05× + 4°/0°, snap 200ms/120ms `Back.out` |
| Big vs. Small | Toy shrink into box, lid wiggle, box bump | shrink 150ms/90ms `Sine.in`, wiggle ±3° 200ms/120ms ×3 yoyo, bump 1.05×/1.02× 250ms/150ms |
| Shadow Match | Silhouette stamp + fill flash, matched-object dim | stamp 1.1×/1.05× 200ms/120ms yoyo, flash white fill 150ms/90ms alpha fade self-cleaning, dim → 0.5 alpha 200ms/120ms |
| Animal Trace | Hop arc, food wiggle, progress-dot pop | hop 60+60ms/36+36ms `Sine.inOut`, apex −6px/0px; wiggle ±4°/±2° 200ms/120ms ×3 yoyo; dot pop 1.4×/1.2× 250ms/150ms `Back.out` yoyo |
| Pop & Freeze | Pop droplets, sleeping breathing | 3 teal droplets grow 1.2×/1.05×, fade 300ms/180ms, self-cleaning; breathing 1.0→1.03 yoyo 750ms/phase `repeat: -1`, disabled under reduced motion, `tween.remove()` on shutdown |
| Musical Memory | Ripple ring, lily pad drift, dot pop | ripple grow 1.6×/1.3×, fade 400ms/240ms, self-cleaning; drift ±3px y 1500ms yoyo loop, disabled under reduced motion; dot pop 1.4×/1.2× 250ms/150ms `Back.out` |

Shape Sorter also adopted the silent-bounce rule already used by Shadow Match and Big vs. Small: the incorrect SFX only plays when the piece was dropped on a zone; dropping on empty floor bounces back silently.

### Mascot companion (2026-08-01)

The Mascot Companion track (archived at `conductor/archive/mascot-companion_20260801/`) added Professor Hoot — a static-pose, tween-only teacher owl. Two SVGs (`mascot_idle.svg`, `mascot_celebrate.svg`, 512×512, `?raw` imports rasterized in PreloadScene as `mascot_idle`/`mascot_celebrate`). No sprite sheets, no particle emitters, no new audio — reactions reuse `AudioManager`'s shared synthesized SFX.

#### `Mascot.ts`

- `new Mascot(scene, x, y, scale)` — creates the sprite at `MASCOT_DEPTH = -1` (behind gameplay z-order), touch-inert (no interactive listeners; scene input isn't affected).
- `wave()` — gentle left-right angle tween (8°, 200ms `Sine.inOut`; reduced 4°, 120ms).
- `nod()` — forward tilt (6°, 150ms; reduced 3°, 90ms).
- `cheer(big = false)` — swap to the celebrate pose, wings-up scale pop (1.1×/1.2×, 180ms/260ms `Back.out`; reduced: pose swap only, no bounce) plus a self-cleaning Graphics sparkle ring (r 32/48) on `big`. An in-flight cheer is **retired** (its tween is removed) before a new one starts, so rapid correct taps never stack scale tweens; the blink loop pauses during a cheer and resumes on complete.
- `idleLoop()` — Hub-only: 3px vertical bob (`Sine.inOut`, 2500ms yoyo, `repeat: -1`) + periodic squash-blink (`scaleY 0.92`, 150ms, `repeatDelay 3700ms`). No-op under reduced motion.
- `destroy()` — removes the sprite, any active cheer/blink tweens, and the sparkle ring.
- `createCornerMascot(scene)` — shared factory: bottom-right corner via `MASCOT_SCALE = 0.2` / `MASCOT_CORNER_MARGIN = 90`, fires `wave()` after the scene entrance, `cheer()` when scene data `justEarned` is set (Hub), and `idleLoop()` on the Hub.
- **Scene wiring:** Hub waves on load, cheers on `justEarned`; all seven games cheer on correct actions (beside `playCorrect`/`playPop`/round-success), nod on incorrect (`playIncorrect`/`playWake`; Animal Trace has no nod — it's a no-fail game), big cheer on win (beside `playWin`), and destroy on shutdown. Shape Sorter's nod is gated to zone drops, matching the silent-bounce rule.

Covered by 27 component tests (`src/__tests__/components/Mascot.test.ts`: reactions, big cheer, reduced-motion paths, retire-in-flight-cheer, blink pause/resume, cleanup) plus 37 integration tests in `src/__tests__/scenes/navigation.test.ts` (7 Hub + 29 game-scene + 1 mid-air edge case).

### Test coverage

667 tests across 22 files; all motion, transitions, completion-effect, drag-juice, press-feedback, and mascot utilities at 100% coverage; scenes ≥ 93.27% lines (PopFreezeScene 93.27%, remainder ≥ 95%); PatternBuilderScene 100% lines / 92.85% branches; `sceneRegistry.ts` reports 30% lines because the seven dynamic-import loader wrappers are not invoked in unit tests (they would pull real Phaser scenes into happy-dom) — the `ensureSceneLoaded` logic itself is 100% function-covered and the loaders are structurally verified against the production build. Total project 96.69% lines / 87.53% functions / 92.05% branches / 98.18% statements. Coverage thresholds remain 80% for lines, functions, branches, and statements.

---

## 9. CI/CD Pipeline (2026-08-02)

Production is hosted on a private VPS (Docker + Nginx) managed by **Coolify**, which builds the image from the repo's `Dockerfile`. Since 2026-08-02, deployments are gated by **GitHub Actions** (`.github/workflows/ci.yml`):

### Workflow

| Event | Runs | Result |
|---|---|---|
| `pull_request` (opened/synchronize/reopened) | **Quality Gates** job | Status check on the PR; deploy job structurally skipped |
| `push` to `master` (post-merge) | **Quality Gates** job → **Deploy to Coolify** job | On green, fires the Coolify Deploy Webhook; Coolify rebuilds from the repo Dockerfile and redeploys |

- **Quality Gates** (ubuntu-latest, Node 22, pnpm 11.7.0 via `pnpm/action-setup@v6`, pnpm store cached via `setup-node` `cache: pnpm`, `pnpm install --frozen-lockfile`), sequential steps: `pnpm run check` → `CI=true pnpm test` → `pnpm run build` → `node scripts/validate-pwa.js`.
- **Deploy to Coolify** (`needs: quality-gates`, `if: github.event_name == 'push' && github.ref == 'refs/heads/master'`): fails fast if secrets are missing, then `curl --fail-with-body` GET to the webhook URL with `Authorization: Bearer $COOLIFY_TOKEN`.
- **Secrets** (repository settings → Secrets and variables → Actions):
  - `COOLIFY_DEPLOY_WEBHOOK` — Deploy Webhook URL from Coolify → the app → Webhooks.
  - `COOLIFY_TOKEN` — Coolify API token (Keys & Tokens → API Tokens) with the `deploy` permission. The webhook endpoint returns 401 without a Bearer token.
- **Docs-only pushes** (`conductor/**`, `docs/**`, `README.md`, `**/*.md`) skip CI via `paths-ignore` — no needless production rebuilds.
- **Branch protection:** recommended on `master`, requiring the "Quality Gates" status check before merge (set in GitHub → Settings → Branches; not enforced from the repo).
- The workflow declares explicit `permissions: contents: read` and pins action majors (`checkout@v7`, `setup-node@v7`, `pnpm/action-setup@v6`) to avoid deprecated runner runtimes.
