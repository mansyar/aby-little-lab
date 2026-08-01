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

- **registerType:** `'autoUpdate'` — service worker updates automatically on new builds
- **Manifest:** Embedded in config (name: "Aby's Little Lab", short_name: "Aby Lab", display: standalone, orientation: landscape, background_color: #FAF9F6, theme_color: #2B6CB0)
- **Precache:** All build assets (HTML, JS, CSS, SVGs, and the BGM MP3) precached for full offline play

### Phaser Config (`main.ts`)

> **Note:** Phaser 4 is a major version upgrade from Phaser 3. Verify API compatibility during implementation — some class names, method signatures, or behaviors may have changed. Refer to [Phaser 4 docs](https://docs.phaser.io/) for the latest API.

- **Resolution:** 1024×768 landscape base
- **Scale Mode:** `Phaser.Scale.FIT` + `Phaser.Scale.CENTER_BOTH` — dynamic centered letterboxing
- **Physics:** Arcade Physics, gravity y:0 (top-down/2D, no platformer physics)
- **Scenes:** 9 scenes (Boot, Preload, Hub, 7 game scenes)
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

**Game IDs:** `shape-sorter`, `animal-trace`, `pop-freeze`, `shadow-match`, `musical-memory`, `big-small`, `pattern-builder`

## 6. Asset Pipeline

### SVG Assets
- All SVGs at 512×512px viewBox
- Loaded via Phaser's SVG loader with explicit width/height for high-res rasterization
- Shadow assets derived by duplicating paths, unioning fills, setting color to `#2D3748`

> **2026-08-01 — Design Update (Replay Variety Expansion):** Item pools expanded for replay variety — Shape Sorter 4→6 shapes (heart, crescent), Animal Trace 4→6 pairs (elephant→peanut, pig→apple), Shadow Match 6→8 objects (airplane, mushroom; rounds select a shared 6-item set for objects and shadows), Big vs. Small 4→6 toys (rocket, drum). Pop & Freeze decoy pool reuses all 6 Game 2 animals. Round sizes unchanged (3-of-6, 3-of-6, 6-of-8, 3-of-6).

> **2026-08-02 — Design Update (Pattern Builder):** Game 7 (Pattern Builder) added — a tap-to-complete pattern game reusing the six Game 1 shape SVGs (only new asset: `sticker_pattern_builder.svg`). Hub grid is now 4×2 (7 tiles); `GameId` includes `pattern-builder`. Pure logic in `src/game/patternBuilderLogic.ts` (ABAB/AABB/ABB rows, gap at end or middle, 3 unique choices, 5-round playthroughs).

### Audio Assets
- **Location:** `public/audio/` — Vite serves `public/` at root, so files are accessible at `/audio/<file>`
- **BGM:** Single MP3 loop (`bgm.mp3`) served at `/audio/bgm.mp3`
- **SFX:** Synthesized via Web Audio API (correct, incorrect, win, sticker, pop, wake) — no MP3 files needed
- **Synthesized:** Web Audio API oscillators for Game 5 frog notes (C4, E4, G4)

> **2026-07-31 — Design Update:** BGM asset relocated from `src/assets/audio/bgm.mp3` to `public/audio/bgm.mp3`. In Vite, `public/` files are served at the root URL, so `public/audio/bgm.mp3` resolves at `/audio/bgm.mp3` — the runtime URL expected by `AudioManager`. This fixes the packaging mismatch where the BGM source lived in `src/assets/` (not served at runtime URLs) while `AudioManager` referenced `/audio/bgm.mp3`.

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
    │   └── PatternBuilderScene.ts
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
    │   └── patternBuilderLogic.ts # Pure game logic (pattern rows, gap placement, choices)
    ├── utils/
    │   ├── storage.ts             # localStorage persistence layer
    │   ├── motion.ts              # reduced-motion helpers (isReducedMotion, durations, scales)
    │   ├── dragJuice.ts           # drag lift/tilt, drop-zone highlight, snap tween
    │   ├── completionEffect.ts    # Graphics-based splash/win effects (no particle emitters)
    │   ├── sceneTransitions.ts    # crossfade transitions (transitionToScene, sceneEntrance)
    │   └── pressFeedback.ts       # press squish + optional spring-back (attachPressFeedback)
    ├── types/
    │   └── index.ts               # AppStorage interface, game types
    ├── assets/
    │   └── svg/
    │       ├── shapes/
    │       ├── cutouts/
    │       ├── animals/
    │       ├── items/
    │       ├── toys/
    │       ├── shadows/
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
        │   └── patternBuilderLogic.test.ts
        ├── scenes/
        │   └── navigation.test.ts
        └── utils/
            ├── storage.test.ts
            ├── motion.test.ts
            ├── dragJuice.test.ts
            ├── pressFeedback.test.ts
            ├── sceneTransitions.test.ts
            └── completionEffect.test.ts
```

## 8. CI/CD

> **2026-08-02 — CI/CD Introduction:** GitHub Actions added as CI tooling (`.github/workflows/ci.yml`). Triggers: `pull_request` (opened/synchronize/reopened) runs the quality gates only; `push` to `master` runs the gates and then triggers the Coolify Deploy Webhook. Runner: `ubuntu-latest`, Node 22, pnpm 11.7.0 via corepack with `--frozen-lockfile` (matching the Dockerfile build). Quality gates, in order: `pnpm run check` → `CI=true pnpm test` → `pnpm run build` → `node scripts/validate-pwa.js`. Deployment requires the `COOLIFY_DEPLOY_WEBHOOK` repository secret; Coolify continues building from the repo Dockerfile (build path unchanged).

## See Also

- [TDD.md](../docs/TDD.md) — Full technical design document with detailed config snippets
- [PRD.md](../docs/PRD.md) — Product requirements including SVG prompt engineering matrix
