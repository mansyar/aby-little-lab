# Plan — TTS & Speaker Button Fix

**Track:** `tts-speaker-fix_20260806` | **Branch:** `fix/speaker-button-tts`

## Phase 1 — Speaker button hit-area fix

- [ ] Task: Create engine-accurate hit-test simulation helper for tests (replicates Phaser 4.2.1 `pointWithinHitArea`: local transform → `+displayOriginX/Y` → `Rectangle.Contains`)
- [ ] Task (TDD): Write failing tests for `SpeakerButton` — simulated taps across the visible 96×96 icon hit; taps outside miss
- [ ] Task: Implement fix in `SpeakerButton.ts` (frame-derived hit rect via the texture frame — no magic numbers)
- [ ] Task: Update `navigation.test.ts` / `SpeakerButton.test.ts` assertions that encode the old `(-48,-48)` convention
- [ ] Task: Phase Verification & Checkpoint (refer to workflow.md)

## Phase 2 — Same-family avatar hit-area fixes

- [ ] Task (TDD): Write failing engine-accurate tests for Hub avatar chip, profile-picker avatars, SettingsPanel Add-Profile avatars
- [ ] Task: Implement fixes in `HubScene.ts` (chip + picker avatars) and `SettingsPanel.ts` (Add-Profile avatars) using frame-derived rects
- [ ] Task: Phase Verification & Checkpoint (refer to workflow.md)

## Phase 3 — TTS: iPad gesture unlock + cancel/speak race hardening

- [ ] Task (TDD): Write failing tests for `speech.ts` — warm-up unlock (silent utterance, dispatched once, respects SFX gating), guarded `cancel()` (skip when engine idle; utterance survives mid-speech cancels)
- [ ] Task: Implement `speech.ts` changes (`unlockSpeechForUserGesture` + race-safe speak path)
- [ ] Task (TDD): Wire the unlock into the first user gesture in `HubScene` (tile tap / first pointerdown — alongside `audio.resume()`) + tests
- [ ] Task: Verify no regression in scene tests (round-start `speakX(target, sfxEnabled)` calls unchanged)
- [ ] Task: Phase Verification & Checkpoint (refer to workflow.md)

## Phase 4 — Full verification

- [ ] Task: Run all quality gates — `pnpm run check`, `CI=true pnpm test`, `pnpm run build`
- [ ] Task: Manual desktop verification — speaker squish + replay speech in all 4 speech games; Hub avatar chip opens picker; Add-Profile avatars create profiles
- [ ] Task: Device verification checklist (iPad + Android) — **pending human review** (desktop only available)
