# Specification: Settings UI Panel

**Track Type:** Feature

## Overview

Implement a parental settings panel as a modal overlay within the HubScene. The panel appears when the existing ParentLock (hold-for-3-seconds on the Settings button) succeeds. It provides two text-based toggle controls for BGM and SFX, with immediate audio feedback and persistence via the existing storage layer.

## Context

- **HubScene** (`src/scenes/HubScene.ts`) already has a Settings button gated by `ParentLock`. The `onSuccess` callback is currently empty: `// Settings UI will be implemented in a future track.`
- **Storage layer** (`src/utils/storage.ts`) already implements `getSettings` and `updateSettings` with localStorage persistence
- **AudioManager** (`src/audio/AudioManager.ts`) already manages BGM play/pause and SFX playback, respecting settings toggles
- Settings schema: `{ bgmEnabled: boolean, sfxEnabled: boolean }` (both default to `true`)

## Functional Requirements

### FR1: Modal Overlay Appearance
- When ParentLock succeeds, a semi-transparent dark backdrop (black ~0.6 alpha) covers the entire HubScene
- A centered flat-fill panel (warm cream `#FFF8E7` or off-white `#FAF9F6`) with thick dark outline (`#2D3748`, 4-6px) is rendered on top of the backdrop
- The panel contains a title "Settings" and two toggle rows

### FR2: BGM Toggle
- Displays as text: "BGM: ON" (green `#68D391`) when enabled, "BGM: OFF" (gray `#A0AEC0`) when disabled
- Tapping the text toggles the BGM enabled state
- When toggled ON: BGM starts playing immediately via AudioManager
- When toggled OFF: BGM stops immediately via AudioManager
- The new state is persisted to localStorage via `updateSettings`

### FR3: SFX Toggle
- Displays as text: "SFX: ON" (green `#68D391`) when enabled, "SFX: OFF" (gray `#A0AEC0`) when disabled
- Tapping the text toggles the SFX enabled state
- When toggled ON: a short test sound (correct chime) plays immediately via AudioManager
- When toggled OFF: no sound plays (SFX is now disabled)
- The new state is persisted to localStorage via `updateSettings`

### FR4: Close Behavior
- Tapping anywhere on the semi-transparent backdrop (outside the panel) closes the panel
- The panel, backdrop, and all toggle objects are destroyed
- The HubScene returns to its normal interactive state

### FR5: Touch Ergonomics
- Each toggle text is a touch target with minimum 64x64px hit area (ideal 96x96px)
- Hit areas are inflated beyond the visual text size to reduce fine-motor frustration
- Single-finger tap interaction only

## Non-Functional Requirements

### NFR1: Visual Consistency
- Panel uses the storybook flat design: flat fills, thick dark outlines (`#2D3748`), soft/vibrant palette
- No gradients, no 3D effects, no shadows
- Toggle "ON" state uses `--success` (`#68D391`), "OFF" state uses muted gray (`#A0AEC0`)

### NFR2: Parental Interface
- The settings panel is a parental interface, not child gameplay. Text is acceptable here per the product guidelines (textless design applies to child-facing gameplay only).

### NFR3: Audio Integration
- All audio changes route through the existing AudioManager singleton
- Settings persistence uses the existing storage layer — no new localStorage keys

### NFR4: Performance
- Panel creation/destroy is instantaneous (no animation required)
- No impact on game scene performance

## Acceptance Criteria

1. Holding the Settings button for 3 seconds (via ParentLock) opens the settings modal overlay
2. The overlay shows a centered panel with BGM and SFX toggle text
3. BGM toggle reflects current localStorage state on open (ON if `bgmEnabled=true`)
4. SFX toggle reflects current localStorage state on open (ON if `sfxEnabled=true`)
5. Tapping BGM toggle starts/stops BGM immediately and persists the new state
6. Tapping SFX toggle plays a test chime when enabling, persists the new state
7. Tapping outside the panel closes the overlay and restores HubScene interaction
8. All toggle touch targets meet >=64x64px minimum
9. Unit tests cover: panel creation, toggle state changes, persistence, close behavior
10. All existing tests continue to pass

## Out of Scope

- **BGM audio asset** — `bgm.mp3` does not exist yet. The BGM toggle will correctly control AudioManager state and persist settings, but actual BGM audio playback requires the audio file (separate future track)
- Exit app functionality (PRD mentions parental lock gating app exit — deferred)
- Reset stickers functionality
- Settings panel accessible from within game scenes (Hub access only)
- Animated panel transitions
- Additional settings options (difficulty, language, etc.)
