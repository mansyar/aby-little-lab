# Track: Build Project Foundation and Core Game Framework

**Track ID:** `foundation_20260728`
**Type:** Feature
**Status:** New
**Created:** 2026-07-28

## Overview

Establish the foundational project scaffolding and core game framework for "Aby's Little Lab" — a Phaser 4 + TypeScript + Vite PWA toddler game suite. This track delivers the project infrastructure, core types/storage layer, audio manager, scene architecture (Boot/Preload/Hub), cross-game systems (sticker collection, parental lock, navigation), and placeholder game scene stubs. Individual game mechanics are out of scope and will be addressed in subsequent tracks.

## Scope

### In Scope

1. **Project Scaffolding** — pnpm project, TypeScript config, Vite + PWA config, Biome config, Vitest config, directory structure, entry files
2. **Core Types & Storage Layer** — AppStorage interface, GameId type, localStorage persistence utilities (stickers, settings)
3. **Audio Manager** — SFX playback (MP3), BGM loop, BGM/SFX toggles, Web Audio API synthesis (frog notes C4/E4/G4)
4. **Scene Architecture & Navigation** — Phaser config, BootScene (orientation lock), PreloadScene (SVG loading + progress bar), HubScene (game tiles, sticker book, settings), ParentLock component, 6 game scene stubs

### Out of Scope

- Individual game logic/mechanics for each of the 6 mini-games
- Actual SVG asset creation (use placeholder SVGs for pipeline testing)
- Actual MP3 audio file creation (use placeholder/silent audio)
- Sticker book visual polish (basic display only)
- PWA deployment to hosting

## Technical Context

Refer to:
- [Product Definition](../../product.md) — Game flow, features, UX principles
- [Tech Stack](../../tech-stack.md) — Verified versions, config details, project structure
- [Product Guidelines](../../product-guidelines.md) — Brand voice, visual style, accessibility
- [Workflow](../../workflow.md) — TDD practices, quality gates, commit guidelines

## Key Technical Decisions

1. **Phaser 4.2.1** — Major version upgrade from Phaser 3; verify API compatibility during implementation
2. **8 Scenes** — BootScene, PreloadScene, HubScene, + 6 game scenes (stubs in this track)
3. **SVG Pipeline** — Load SVGs at 512×512px via Phaser's SVG loader with explicit width/height
4. **localStorage Key** — `abby-little-lab:v1` with AppStorage schema (stickers + settings)
5. **Audio** — HTML5 Audio for MP3 SFX/BGM, Web Audio API for synthesized frog notes
6. **Screen Orientation** — `screen.orientation.lock('landscape')` on BootScene with catch fallback
7. **PWA** — vite-plugin-pwa with embedded manifest, registerType: 'autoUpdate', precache all assets

## Game IDs

```
shape-sorter, animal-trace, pop-freeze, shadow-match, musical-memory, big-small
```

## Success Criteria

- [ ] `pnpm dev` starts without errors
- [ ] `pnpm run build` produces a valid PWA build
- [ ] `CI=true pnpm test` runs all tests and passes with >80% coverage
- [ ] `pnpm run check` (Biome) passes with no errors
- [ ] Boot scene loads, locks orientation, transitions to Preload
- [ ] Preload scene shows progress bar, loads placeholder SVGs, transitions to Hub
- [ ] Hub scene displays 6 game tiles and sticker book
- [ ] Tapping a game tile navigates to the corresponding game scene stub
- [ ] Game scene stubs display basic UI and back button (gated by ParentLock)
- [ ] ParentLock hold-for-3s mechanism works correctly
- [ ] Storage layer correctly persists stickers and settings to localStorage
- [ ] AudioManager plays/pauses BGM, plays SFX, toggles work, settings persist
