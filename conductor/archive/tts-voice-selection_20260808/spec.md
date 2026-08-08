# Specification: TTS Voice Selection (Parental Settings)

**Track type:** Feature (v1.12.0 candidate)
**Track ID:** `tts-voice-selection_20260808`
**Date:** 2026-08-08

## Overview

The #1 accepted known issue is "TTS voice availability varies by device/OS" — 7 of 14 games (Find the Letter, Find the Word, Build the Word, How Many?, First Sounds, More or Less, Odd One Out) speak prompts, letters, and words through `src/utils/speech.ts` with no way to choose which voice pronounces them. On devices where the default en-US voice is robotic or mis-localized, the learning content degrades.

This track adds a **device-level voice preference** in the parental Settings panel, applied transparently to every speech-driven scene through the single `speech.ts` integration point.

## Functional Requirements

- **FR-1 — Schema:** Add `preferredVoiceURI: string | null` to `Settings` (default `null` = "Default (device)"). Stored device-level via the existing `updateSettings`/`getSettings` storage facade. `normalizeV2` additive merge with `defaultSettings()` keeps existing saves working without migration errors.
- **FR-2 — Pure logic module:** New `src/game/voiceLogic.ts`:
  - `availableVoiceOptions(voices: SpeechSynthesisVoice[]): VoiceOption[]` — always lists "Default (device)" first, then every device voice (all languages; no hard en-US gate, per decision) sorted by language then name; each option carries `voiceURI` + display label.
  - `resolveVoice(voices, preferredVoiceURI)` — returns the matching voice, or `null` (fall back to browser default) when the stored URI no longer exists or no voices are available.
- **FR-3 — speech.ts integration:** Add `setPreferredVoiceURI(uri: string | null)`. `speakText` resolves and assigns `utterance.voice` when a matching voice exists. Remains best-effort (never throws; silent fallback to default).
- **FR-4 — SettingsPanel Voice row:** A parental-gated row (same text-chip interaction as Play Time): tap cycles Default → device voices (wrapping); label shows "Voice: Default (device)" or a truncated voice name. A preview button in the row speaks a short sample phrase ("Hi! I can talk.") with the currently selected voice.
- **FR-5 — Async voice loading:** Handle the voices-not-yet-loaded state (show current selection; refresh options on `voiceschanged` where applicable). The row must remain functional when `getVoices()` returns empty.
- **FR-6 — Zero per-scene changes:** All 7 speech-driven scenes inherit the preference automatically.

## Non-Functional Requirements

- **NFR-1 — TDD:** Pure logic and `speech.ts` changes get failing tests first; happy-dom mocks `speechSynthesis.getVoices()`.
- **NFR-2 — Gates:** All quality gates pass in CI order (`pnpm run check` → `CI=true pnpm test` → `pnpm run build`); coverage meets the project threshold.
- **NFR-3 — No new art:** No new SVG assets; reuse existing speaker/UI textures or text-only chip (panel is parent-facing, text acceptable).
- **NFR-4 — Accessibility/motion:** Preview is a single short utterance, no looping; preserves reduced-motion posture.
- **NFR-5 — Device variance:** Works on iPad/Android tablets + phones; must not break when `getVoices()` is empty or voice lists differ.

## Acceptance Criteria

- **AC-1:** Fresh install and existing v1/v2 saves both load with `preferredVoiceURI: null`; old saves survive without migration errors.
- **AC-2:** Picking a voice persists across restart and is used by all speech-driven scenes (unit tests on `speakText` + targeted device test).
- **AC-3:** Selecting "Default (device)" resets to browser-default behavior.
- **AC-4:** A stored URI pointing to a no-longer-available voice falls back to the default silently (no error, no visual regression).
- **AC-5:** Preview button speaks the sample phrase with the currently selected voice; preview honors the SFX toggle (parity with prompt speech).
- **AC-6:** Full suite green, Biome clean, coverage threshold met.

## Out of Scope

- Per-profile voices (device-level only, per decision).
- Language/locale selection (remains en-US).
- Voice selection during kid-facing gameplay (Settings panel is parental-gated).
- Cloud sync of the preference; voice pack downloads; audio engine changes.
- New SVG art.
