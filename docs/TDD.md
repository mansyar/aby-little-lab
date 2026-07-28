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
| PWA | vite-plugin-pwa | 1.3.0 | Auto-generated service worker + manifest, precaching, auto-update |
| Testing | Vitest | 4.1.10 | Native Vite integration, fast test runner |
| Coverage | @vitest/coverage-v8 | 4.1.10 | V8-based code coverage provider |
| Test Environment | happy-dom | 18.0.1 | Lightweight DOM implementation for unit tests |
| Linting/Formatting | Biome | 2.5.5 | All-in-one linter and formatter |
| Package Manager | pnpm | 11.17.0 | Fast, disk-efficient, strict dependency resolution |
| Audio | Web Audio API | Browser native | Synthesized tones for Game 5 frog notes + gameplay SFX (correct, incorrect, win, sticker) — no file overhead |

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
│   └── icons/                      # PWA icons (icon-512.png)
└── src/
    ├── main.ts                     # Phaser 4 game config & global scene register
    ├── vite-env.d.ts               # Vite type declarations
    ├── scenes/
    │   ├── BootScene.ts            # Orientation lock & system initialization
    │   ├── PreloadScene.ts         # Progress bar & asset preloading
    │   ├── HubScene.ts             # Game selection grid, sticker book & parental lock
    │   ├── ShapeSorterScene.ts     # Mini-Game 1
    │   ├── AnimalTraceScene.ts     # Mini-Game 2
    │   ├── PopFreezeScene.ts       # Mini-Game 3
    │   ├── ShadowMatchScene.ts     # Mini-Game 4
    │   ├── MusicalMemoryScene.ts   # Mini-Game 5
    │   └── BigSmallScene.ts        # Mini-Game 6
    ├── components/
    │   └── ParentLock.ts           # Long-press escape UI component (hold 3s)
    ├── audio/
    │   └── AudioManager.ts         # BGM/SFX playback (HTML5 Audio) + frog note synthesis + gameplay SFX synthesis (Web Audio API); singleton via getInstance()
    ├── game/
    │   └── shapeSorterLogic.ts    # Pure game logic (Fisher-Yates shuffle, shape selection, match detection)
    ├── types/
    │   └── index.ts                # Shared interfaces (GameId, StickerData, Settings, AppStorage)
    ├── utils/
    │   └── storage.ts              # localStorage CRUD (load, save, earnSticker, hasSticker, getSettings, updateSettings)
    ├── assets/
    │   ├── audio/                  # Audio assets (sfx_pop.mp3, sfx_win.mp3, bgm.mp3)
    │   └── svg/                    # AI-Generated SVG Assets
    │       ├── shapes/             # Circle, Square, Triangle, Star SVGs
    │       ├── animals/            # Monkey, Frog, Cat SVGs
    │       ├── items/              # Car, Duck, Apple, Teddy, Toy Car SVGs
    │       ├── stickers/           # Reward stickers (one per mini-game)
    │       └── ui/                 # Tiles, Star, Lock, Box, Shelf, Bubbles, Path SVGs
    ├── styles/
    │   └── style.css               # Touch locks (-webkit-user-select, touch-action: none)
    └── __tests__/
        ├── audio/                  # AudioManager tests (BGM/SFX/synthesis + singleton)
        ├── components/             # ParentLock tests
        ├── game/                   # Game logic tests (shapeSorterLogic)
        ├── scenes/                 # Scene-level tests (navigation, drag/drop, completion)
        └── utils/                  # Storage tests
```

---

## 3. PWA Configuration (`vite.config.ts`)

The PWA manifest and service worker are configured via `vite-plugin-pwa`. No separate `manifest.json` or `sw.js` files are needed — the plugin auto-generates them at build time with default precaching for all static assets.

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Aby's Little Lab",
        short_name: "Aby Lab",
        start_url: "./index.html",
        display: "standalone",
        orientation: "landscape",
        background_color: "#FAF9F6",
        theme_color: "#2B6CB0",
        icons: [
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
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

---

## 4. Phaser Scale Manager Configuration (`src/main.ts`)

```typescript
import "./styles/style.css";
import Phaser from "phaser";
import { AnimalTraceScene } from "./scenes/AnimalTraceScene";
import { BigSmallScene } from "./scenes/BigSmallScene";
import { BootScene } from "./scenes/BootScene";
import { HubScene } from "./scenes/HubScene";
import { MusicalMemoryScene } from "./scenes/MusicalMemoryScene";
import { PopFreezeScene } from "./scenes/PopFreezeScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { ShadowMatchScene } from "./scenes/ShadowMatchScene";
import { ShapeSorterScene } from "./scenes/ShapeSorterScene";

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
  scene: [
    BootScene,
    PreloadScene,
    HubScene,
    ShapeSorterScene,
    AnimalTraceScene,
    PopFreezeScene,
    ShadowMatchScene,
    MusicalMemoryScene,
    BigSmallScene,
  ],
};

new Phaser.Game(config);
```

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
  | "big-small";

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

### Game IDs

| Game ID | Game |
|---|---|
| `shape-sorter` | Game 1 |
| `animal-trace` | Game 2 |
| `pop-freeze` | Game 3 |
| `shadow-match` | Game 4 |
| `musical-memory` | Game 5 |
| `big-small` | Game 6 |

### Example State

```json
{
  "stickers": {
    "shape-sorter": { "earned": true, "earnedAt": "2024-08-01T00:00:00.000Z" },
    "animal-trace": { "earned": false, "earnedAt": null },
    "pop-freeze": { "earned": true, "earnedAt": "2024-08-02T00:00:00.000Z" },
    "shadow-match": { "earned": false, "earnedAt": null },
    "musical-memory": { "earned": false, "earnedAt": null },
    "big-small": { "earned": false, "earnedAt": null }
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
| `cutout_circle.svg` | 512×512 | Game 1 | 30% opacity fill, dashed `#2D3748` stroke |
| `cutout_square.svg` | 512×512 | Game 1 | 30% opacity fill, dashed `#2D3748` stroke |
| `cutout_triangle.svg` | 512×512 | Game 1 | 30% opacity fill, dashed `#2D3748` stroke |
| `cutout_star.svg` | 512×512 | Game 1 | 30% opacity fill, dashed `#2D3748` stroke |

### SVG Assets — Animals (`assets/svg/animals/`)

| File | Dimensions | Game | Notes |
|---|---|---|---|
| `monkey.svg` | 512×512 | Game 2 | Character sprite (left side) |
| `frog_green.svg` | 512×512 | Game 5 | Note: C4 (261.63 Hz) |
| `frog_blue.svg` | 512×512 | Game 5 | Note: E4 (329.63 Hz) |
| `frog_red.svg` | 512×512 | Game 5 | Note: G4 (392.00 Hz) |
| `cat_sleeping.svg` | 512×512 | Game 3 | Cat inside sleeping bubble |

### SVG Assets — Items (`assets/svg/items/`)

| File | Dimensions | Game | Notes |
|---|---|---|---|
| `banana.svg` | 512×512 | Game 2 | Food target (right side) |
| `car_color.svg` | 512×512 | Game 4 | Color variant |
| `car_shadow.svg` | 512×512 | Game 4 | Shadow variant (`#2D3748`) |
| `duck_color.svg` | 512×512 | Game 4 | Color variant |
| `duck_shadow.svg` | 512×512 | Game 4 | Shadow variant (`#2D3748`) |
| `apple_color.svg` | 512×512 | Game 4 | Color variant |
| `apple_shadow.svg` | 512×512 | Game 4 | Shadow variant (`#2D3748`) |
| `teddy_bear.svg` | 512×512 | Game 6 | Sorted by scale (big/small) |
| `toy_car.svg` | 512×512 | Game 6 | Sorted by scale (big/small) |
| `toy_box.svg` | 512×512 | Game 6 | Container (1.5× and 0.7× scale) |

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
| `dotted_path.svg` | 512×512 | Game 2 | Trace path guide |
| `bubble_soap.svg` | 512×512 | Game 3 | Standard bubble |
| `pop_particle.svg` | 512×512 | Game 3 | Pop particle effect |
| `lilypad.svg` | 512×512 | Game 5 | Frog platform |

### SVG Assets — Stickers (`assets/svg/stickers/`)

| File | Dimensions | Game | Notes |
|---|---|---|---|
| `sticker_shape_sorter.svg` | 512×512 | Game 1 | Unique themed sticker |
| `sticker_animal_trace.svg` | 512×512 | Game 2 | Unique themed sticker |
| `sticker_pop_freeze.svg` | 512×512 | Game 3 | Unique themed sticker |
| `sticker_shadow_match.svg` | 512×512 | Game 4 | Unique themed sticker |
| `sticker_musical_memory.svg` | 512×512 | Game 5 | Unique themed sticker |
| `sticker_big_small.svg` | 512×512 | Game 6 | Unique themed sticker |

### Audio Assets (`assets/audio/`)

| File | Format | Used In | Notes |
|---|---|---|---|
| `sfx_pop.mp3` | MP3 | All / Game 3 | Generic tap + bubble pop |
| `sfx_correct.mp3` | MP3 | Games 1, 2, 4, 6 | Ascending 2-note chime |
| `sfx_incorrect.mp3` | MP3 | Games 1, 4, 6 | Gentle descending tone |
| `sfx_wake.mp3` | MP3 | Game 3 | Funny animal wake-up |
| `sfx_win.mp3` | MP3 | All games | Win fanfare |
| `sfx_sticker.mp3` | MP3 | All games | Sticker earned sparkle |
| `bgm.mp3` | MP3 | All scenes | Ambient loop, low volume |

### PWA Icons (`public/icons/`)

| File | Dimensions | Notes |
|---|---|---|
| `icon-512.png` | 512×512 | App icon for PWA manifest |

### Asset Summary

| Type | Count |
|---|---|
| SVG — shapes | 8 (4 shapes + 4 cutouts) |
| SVG — animals | 5 |
| SVG — items | 10 |
| SVG — UI | 14 |
| SVG — stickers | 6 |
| Audio (MP3) | 7 |
| PWA icons (PNG) | 1 |
| **Total** | **51** |
