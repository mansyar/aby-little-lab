<protect>
# Implementation Plan: Settings UI Panel

**Track ID:** `settings-ui_20260730`

---

## Phase 1: SettingsPanel Component — Creation & Display [TDD] [checkpoint: b15fc07]

- [x] Task: Read spec.md and workflow.md to refresh context before starting this phase [9b3b146]
- [x] Task: Write tests for SettingsPanel creation and display [TDD-Red] [bc73ccb]
    - [ ] Test SettingsPanel creates a semi-transparent backdrop (black ~0.6 alpha) covering full screen
    - [ ] Test SettingsPanel creates a centered flat-fill panel (#FFF8E7) with #2D3748 outline
    - [ ] Test SettingsPanel displays "Settings" title text
    - [ ] Test BGM toggle text reflects initial state from getSettings (ON if bgmEnabled=true, OFF if false)
    - [ ] Test SFX toggle text reflects initial state from getSettings (ON if sfxEnabled=true, OFF if false)
    - [ ] Test toggle text uses correct colors (green #68D391 for ON, gray #A0AEC0 for OFF)
    - [ ] Test toggle interactive zones have hit areas >=64x64px (inflated beyond visual text size)
- [x] Task: Implement SettingsPanel component — creation and rendering [TDD-Green] [15e8682, b6af905]
    - [ ] Create `src/components/SettingsPanel.ts`
    - [ ] Constructor takes a Phaser.Scene parameter
    - [ ] Render semi-transparent backdrop rectangle (full screen, black ~0.6 alpha)
    - [ ] Render centered panel rectangle (#FFF8E7 fill, #2D3748 outline stroke 4-6px)
    - [ ] Render "Settings" title text centered at top of panel
    - [ ] Read initial state via `getSettings()` from storage
    - [ ] Render BGM toggle text ("BGM: ON" or "BGM: OFF") with correct color
    - [ ] Render SFX toggle text ("SFX: ON" or "SFX: OFF") with correct color
    - [ ] Set up interactive zones on toggle text with inflated hit areas (>=64x64px)
- [x] Task: Conductor - User Manual Verification 'SettingsPanel Component — Creation & Display' (Protocol in workflow.md)

---

## Phase 2: Toggle Interaction, Audio Integration & HubScene Wiring [TDD]

- [ ] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [ ] Task: Write tests for toggle interaction, audio feedback, persistence, and close [TDD-Red]
    - [ ] Test tapping BGM toggle when ON calls `AudioManager.setBGMEnabled(false)` and `pauseBGM()`
    - [ ] Test tapping BGM toggle when OFF calls `AudioManager.setBGMEnabled(true)` and `playBGM()`
    - [ ] Test tapping BGM toggle updates text to "BGM: OFF" with gray color when disabling
    - [ ] Test tapping BGM toggle updates text to "BGM: ON" with green color when enabling
    - [ ] Test tapping SFX toggle when ON calls `AudioManager.setSFXEnabled(false)` (no sound plays)
    - [ ] Test tapping SFX toggle when OFF calls `AudioManager.setSFXEnabled(true)` then `playCorrect()` (test chime)
    - [ ] Test tapping SFX toggle updates text to "SFX: OFF" with gray color when disabling
    - [ ] Test tapping SFX toggle updates text to "SFX: ON" with green color when enabling
    - [ ] Test tapping backdrop (outside panel) destroys the panel and all its game objects
    - [ ] Test SettingsPanel `destroy()` removes all game objects and restores HubScene interaction
- [ ] Task: Implement toggle handlers, audio integration, close behavior, and HubScene wiring [TDD-Green]
    - [ ] Implement BGM toggle handler: flip state, call `setBGMEnabled(newVal)`, call `playBGM()` if enabling, update toggle text/color
    - [ ] Implement SFX toggle handler: flip state, call `setSFXEnabled(newVal)`, call `playCorrect()` if enabling, update toggle text/color
    - [ ] Implement close handler: tap backdrop calls `destroy()` to remove panel + backdrop + toggle objects
    - [ ] Integrate SettingsPanel into HubScene `onSuccess` callback (replace empty comment)
    - [ ] Ensure HubScene `shutdown` event destroys SettingsPanel if open
- [ ] Task: Conductor - User Manual Verification 'Toggle Interaction, Audio Integration & HubScene Wiring' (Protocol in workflow.md)

---

## Phase: Review Fixes

- [ ] Task: Apply review suggestions
</protect>
