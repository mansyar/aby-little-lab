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
  "@biomejs/biome": "^2.5.5"
}
```

## 3. Key Configuration Details

### Vite + PWA (`vite.config.ts`)

- **registerType:** `'autoUpdate'` — service worker updates automatically on new builds
- **Manifest:** Embedded in config (name: "Aby's Little Lab", short_name: "Aby Lab", display: standalone, orientation: landscape, background_color: #FAF9F6, theme_color: #2B6CB0)
- **Precache:** All build assets (HTML, JS, CSS, SVGs, MP3s) precached for full offline play

### Phaser Config (`main.ts`)

> **Note:** Phaser 4 is a major version upgrade from Phaser 3. Verify API compatibility during implementation — some class names, method signatures, or behaviors may have changed. Refer to [Phaser 4 docs](https://docs.phaser.io/) for the latest API.

- **Resolution:** 1024×768 landscape base
- **Scale Mode:** `Phaser.Scale.FIT` + `Phaser.Scale.CENTER_BOTH` — dynamic centered letterboxing
- **Physics:** Arcade Physics, gravity y:0 (top-down/2D, no platformer physics)
- **Scenes:** 8 scenes (Boot, Preload, Hub, 6 game scenes)
- **Input:** Touch-first, single-finger interactions
- **Audio:** Web Audio API for synthesized tones, HTML5 Audio for MP3 SFX/BGM

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

**Game IDs:** `shape-sorter`, `animal-trace`, `pop-freeze`, `shadow-match`, `musical-memory`, `big-small`

## 6. Asset Pipeline

### SVG Assets
- All SVGs at 512×512px viewBox
- Loaded via Phaser's SVG loader with explicit width/height for high-res rasterization
- Shadow assets derived by duplicating paths, unioning fills, setting color to `#2D3748`

### Audio Assets
- SFX: MP3 format (sfx_pop, sfx_correct, sfx_incorrect, sfx_wake, sfx_win, sfx_sticker)
- BGM: Single MP3 loop (bgm.mp3)
- Synthesized: Web Audio API oscillators for Game 5 frog notes (C4, E4, G4)

### PWA Icon
- 512×512 PNG icon for manifest

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
│   └── icons/
└── src/
    ├── main.ts                    # Phaser config + scene registration
    ├── scenes/
    │   ├── BootScene.ts
    │   ├── PreloadScene.ts
    │   ├── HubScene.ts
    │   ├── ShapeSorterScene.ts
    │   ├── AnimalTraceScene.ts
    │   ├── PopFreezeScene.ts
    │   ├── ShadowMatchScene.ts
    │   ├── MusicalMemoryScene.ts
    │   └── BigSmallScene.ts
    ├── components/
    │   └── ParentLock.ts
    ├── types/
    │   └── index.ts               # AppStorage interface, game types
    ├── assets/
    │   ├── audio/                 # MP3 files
    │   └── svg/
    │       ├── shapes/
    │       ├── animals/
    │       ├── items/
    │       ├── stickers/
    │       └── ui/
    ├── styles/
    │   └── style.css
    └── __tests__/
        ├── scenes/
        └── components/
```

## See Also

- [TDD.md](../docs/TDD.md) — Full technical design document with detailed config snippets
- [PRD.md](../docs/PRD.md) — Product requirements including SVG prompt engineering matrix
