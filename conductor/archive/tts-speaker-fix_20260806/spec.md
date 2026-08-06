# Spec — TTS & Speaker Button Fix

**Track:** `tts-speaker-fix_20260806` | **Type:** Bug fix | **Branch:** `fix/speaker-button-tts`

## Overview

Fix two user-reported audio failures in the speech-driven games (Find the Letter, Find the Word, Build the Word, How Many?):

1. **Speaker button is untappable on every platform** — its custom hit area is specified in the wrong coordinate space for Phaser 4.2.1, so taps never reach it (no press feedback, no replay speech; confirmed on desktop Chrome, Android, and iPad).
2. **TTS is silent on iPad (Chrome)** — WebKit drops `speechSynthesis.speak()` calls until the speech session is unlocked by an utterance dispatched inside a real user gesture; the round-start speak happens asynchronously (scene `create()` after lazy-load), so it never unlocks.

## Background (investigation findings)

- `icon_speaker` is rasterized at **512×512** (`SVG_RASTER_SIZE` in `PreloadScene.ts`), displayed at 96×96 with origin 0.5 → `displayOrigin = 256`.
- Phaser 4.2.1's hit test (`InputManager.pointWithinHitArea`) **adds `displayOriginX/Y` to the tap position** before testing the custom hit area (`Rectangle.Contains`). `SpeakerButton`'s `Rectangle(-48,-48,96,96)` is therefore only satisfied for a ~18×18px dead spot 39–57px up-left of the icon — the visible button never receives `pointerdown`.
- Same misplacement pattern breaks other Image-based interactive objects on 512px textures:
  - Hub avatar chip (`Rectangle(0,0,96,96)`) — opens the profile picker
  - Profile-picker avatars (`Rectangle(0,0,PICKER_AVATAR_DISPLAY,...)`)
  - SettingsPanel Add-Profile avatars (`Rectangle(-50,-50,100,100)`)
- **iPad TTS:** WebKit (`SpeechSynthesis::speak`, iOS family) silently returns when no utterance has been dispatched inside a user gesture (`RequireUserGestureForSpeechStart`). The game's round-start speak runs in scene `create()` — after the Hub tile tap's async `import()` + scene transition — entirely outside the gesture call stack → silently dropped, no error/event.
- **Replay reliability:** `speakText` unconditionally calls `cancel()` then `speak()` synchronously — a documented cross-engine race (WebKit: async cancel callbacks can clear the just-queued utterance; Chromium/Android TTS service variants) that drops utterances triggered while the engine is mid-speech or right after a cancel.

## Functional Requirements

1. **FR-1 (Speaker button):** The speaker button's interactive region must coincide with its visible 96×96 icon (≥64×64px target per product guidelines). Taps anywhere on the icon must trigger `onSpeak` on all platforms.
2. **FR-2 (Avatars):** Hub avatar chip, profile-picker avatars, and SettingsPanel Add-Profile avatars must be tappable across their visible area (same coordinate fix).
3. **FR-3 (iPad round prompts):** Round-start TTS must work on iOS/WebKit after the first user interaction — a silent warm-up utterance unlocks the speech session on the first gesture (Hub tile tap / first pointerdown).
4. **FR-4 (Replay reliability):** A speaker-button tap must produce speech even when the engine is mid-speech or was just cancelled (no dropped utterances from the cancel+speak race).
5. **FR-5 (Unchanged behavior):** TTS remains SFX-gated, en-US, existing rates (0.9 letter/number, 0.8 word), silent no-throw fallback when unsupported.

## Non-Functional Requirements

- No new assets; no changes to rates/language; press feedback unchanged (still reduced-motion-aware).
- Existing touch-target guarantees (64×64 min, 96×96 ideal) preserved.
- All hit-area tests must simulate the engine's real hit-test math (displayOrigin normalization) — static-geometry assertions alone proved insufficient.

## Acceptance Criteria

- New engine-accurate hit-simulation tests: taps on the visible icon/chip/avatar region hit; taps outside miss (all affected components).
- New speech tests: warm-up unlock dispatches a silent utterance exactly once; `speak*` avoids the cancel+speak race (no cancel when engine idle; utterance survives when a prior utterance is pending/speaking); all existing speech + scene tests pass.
- `pnpm run check`, `CI=true pnpm test`, `pnpm run build` all pass.
- Manual desktop verification: speaker button squishes and replays speech in all 4 speech games; Hub avatar chip opens the picker; Settings Add-Profile avatars create profiles.
- **Device verification (iPad + Android) is pending human review** — captured as a checklist item in the plan, not an in-track gate (desktop only available during this track).

## Out of Scope

- Voice selection / `voiceschanged` handling (possible future hardening).
- Any hit-area usages not verified in this investigation.
- Musical Memory replay (uses Web Audio tones, not TTS — unaffected).
