# Implementation Plan: Build Project Foundation and Core Game Framework

**Track ID:** `foundation_20260728`

---

## Phase 1: Project Scaffolding [checkpoint: df28f09]

- [x] Task: Initialize pnpm project and install dependencies [ad136d4]
    - [x] Create `package.json` with pnpm
    - [x] Install runtime dependency: `phaser@^4.2.1`
    - [x] Install dev dependencies: `typescript@^7.0.2`, `vite@^8.1.5`, `vite-plugin-pwa@^1.3.0`, `vitest@^4.1.10`, `@biomejs/biome@^2.5.5`
- [x] Task: Configure TypeScript [ad136d4]
    - [x] Create `tsconfig.json` (target: ES2023+, strict: true, moduleResolution: bundler, types: vitest/globals)
- [x] Task: Configure Vite + PWA [ad136d4]
    - [x] Create `vite.config.ts` with VitePWA plugin
    - [x] Configure manifest (name: "Aby's Little Lab", short_name: "Aby Lab", display: standalone, orientation: landscape, background_color: #FAF9F6, theme_color: #2B6CB0)
    - [x] Set registerType: 'autoUpdate', precache all build assets
- [x] Task: Configure Biome [ad136d4]
    - [x] Create `biome.json` (2-space indent, double quotes, semicolons, recommended linter, organizeImports enabled)
- [x] Task: Configure Vitest [ad136d4]
    - [x] Add Vitest configuration (environment: happy-dom for DOM/Phaser mock tests)
    - [x] Add test scripts to `package.json` (`test`, `test:coverage`)
- [x] Task: Create project structure and entry files [ad136d4]
    - [x] Create `index.html` with root div and script import
    - [x] Create `src/styles/style.css` (base reset, body styling)
    - [x] Create directory structure (`src/scenes/`, `src/components/`, `src/types/`, `src/assets/audio/`, `src/assets/svg/`, `src/__tests__/scenes/`, `src/__tests__/components/`)
    - [x] Create placeholder PWA icon in `public/icons/` (512×512 PNG)
- [x] Task: Verify scaffolding works [ad136d4]
    - [x] Run `pnpm dev` — dev server starts without errors
    - [x] Run `pnpm run build` — production build succeeds
    - [x] Run `CI=true pnpm test` — test runner executes (even with no tests)
- [x] Task: Conductor - User Manual Verification 'Project Scaffolding' (Protocol in workflow.md) [df28f09]

---

## Phase 2: Core Types & Storage Layer [checkpoint: a44d7f5]

- [x] Task: Write tests for storage utilities [a410b2f]
    - [x] Test reading empty storage (returns default AppStorage)
    - [x] Test writing and reading back storage data
    - [x] Test earning a sticker (sets earned: true, earnedAt: ISO timestamp)
    - [x] Test checking if a sticker is earned (hasSticker)
    - [x] Test reading settings (bgmEnabled defaults to true, sfxEnabled defaults to true)
    - [x] Test updating settings (bgmEnabled, sfxEnabled)
- [x] Task: Implement types and storage utilities [7a72ef0]
    - [x] Create `src/types/index.ts` (AppStorage, GameId, StickerData, Settings interfaces)
    - [x] Create `src/utils/storage.ts` (load, save, earnSticker, hasSticker, getSettings, updateSettings)
    - [x] Run tests — all pass (Green phase)
- [x] Task: Conductor - User Manual Verification 'Core Types & Storage Layer' (Protocol in workflow.md) [a44d7f5]

---

## Phase 3: Audio Manager

- [ ] Task: Write tests for AudioManager
    - [ ] Test initialization (loads audio context)
    - [ ] Test BGM play/pause
    - [ ] Test SFX playback (pop, correct, incorrect, wake, win, sticker)
    - [ ] Test BGM toggle (enabled/disabled respects settings)
    - [ ] Test SFX toggle (enabled/disabled respects settings)
    - [ ] Test settings persistence integration (toggling updates localStorage)
    - [ ] Test Web Audio API synthesis (frog notes C4=261.63Hz, E4=329.63Hz, G4=392.00Hz)
- [ ] Task: Implement AudioManager
    - [ ] Create `src/audio/AudioManager.ts`
    - [ ] Implement SFX playback (MP3 loading and playing via Phaser audio or HTML5 Audio)
    - [ ] Implement BGM loop (play/pause single ambient track)
    - [ ] Implement BGM/SFX toggle management (reads/writes settings via storage utils)
    - [ ] Implement Web Audio API oscillator synthesis for frog notes (C4, E4, G4)
    - [ ] Run tests — all pass (Green phase)
- [ ] Task: Conductor - User Manual Verification 'Audio Manager' (Protocol in workflow.md)

---

## Phase 4: Scene Architecture & Navigation

- [ ] Task: Write tests for ParentLock component
    - [ ] Test hold detection (3s threshold triggers success)
    - [ ] Test success callback fires after 3s hold
    - [ ] Test reset on release before 3s (no success callback)
    - [ ] Test reset on pointer up/leave
- [ ] Task: Implement ParentLock component
    - [ ] Create `src/components/ParentLock.ts`
    - [ ] Implement hold-for-3s timer logic using Phaser input events
    - [ ] Implement success/failure callbacks
    - [ ] Run tests — all pass (Green phase)
- [ ] Task: Write tests for scene navigation flow
    - [ ] Test BootScene starts and transitions to PreloadScene
    - [ ] Test PreloadScene loads assets and transitions to HubScene
    - [ ] Test HubScene displays 6 game tiles
    - [ ] Test HubScene displays sticker book (earned/uneared stickers)
    - [ ] Test navigation from Hub to game scene stub and back to Hub
- [ ] Task: Implement Phaser config and core scenes
    - [ ] Create `src/main.ts` (typed Phaser.Types.Core.GameConfig, 1024×768, Scale.FIT + CENTER_BOTH, Arcade physics gravity y:0, 8 scene registration)
    - [ ] Create `src/scenes/BootScene.ts` (screen.orientation.lock('landscape') with catch fallback, transition to Preload)
    - [ ] Create `src/scenes/PreloadScene.ts` (load placeholder SVGs at 512×512, progress bar, transition to Hub)
    - [ ] Create `src/scenes/HubScene.ts` (6 game tiles grid, sticker book display, settings button gated by ParentLock)
    - [ ] Run tests — all pass (Green phase)
- [ ] Task: Create game scene stubs
    - [ ] Create `src/scenes/ShapeSorterScene.ts` (placeholder UI + back button with ParentLock)
    - [ ] Create `src/scenes/AnimalTraceScene.ts` (placeholder UI + back button with ParentLock)
    - [ ] Create `src/scenes/PopFreezeScene.ts` (placeholder UI + back button with ParentLock)
    - [ ] Create `src/scenes/ShadowMatchScene.ts` (placeholder UI + back button with ParentLock)
    - [ ] Create `src/scenes/MusicalMemoryScene.ts` (placeholder UI + back button with ParentLock)
    - [ ] Create `src/scenes/BigSmallScene.ts` (placeholder UI + back button with ParentLock)
    - [ ] Run tests — all pass (Green phase)
- [ ] Task: Conductor - User Manual Verification 'Scene Architecture & Navigation' (Protocol in workflow.md)
