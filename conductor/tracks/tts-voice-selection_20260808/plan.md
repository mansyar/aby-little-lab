# Implementation Plan: TTS Voice Selection (Parental Settings)

**Track ID:** `tts-voice-selection_20260808`
**Type:** Feature
**Status:** new

---

## Phase 1 — Voice Selection Pure Logic + Schema (TDD)

- [x] Task: Write failing tests for `src/game/voiceLogic.ts` (Red) (75a183a)
  - [x] Test `availableVoiceOptions`: "Default (device)" always first; all voices listed (all languages, no hard en-US gate); sorted by language then name
  - [x] Test `resolveVoice`: matches by `voiceURI`; returns `null` when URI absent or no voices
  - [x] Test empty voice list → only "Default (device)" option; `resolveVoice` → `null`
- [x] Task: Implement `voiceLogic.ts` (Green) — `VoiceOption` type, `availableVoiceOptions`, `resolveVoice` (75a183a)
- [x] Task: Extend `Settings` in `src/types/index.ts` with `preferredVoiceURI: string | null`; update `defaultSettings()` in `profileLogic.ts` + additive `normalizeV2` merge (75a183a)
  - [x] Tests: default settings include `preferredVoiceURI: null`; v1 migration and v2 normalize preserve old saves without error
- [x] Task: Verify coverage for Phase 1 code files (voiceLogic 100%, profileLogic 100%)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [checkpoint: 0db7000]

## Phase 2 — speech.ts Integration (TDD)

- [x] Task: Write failing tests for `setPreferredVoiceURI` + voice assignment in `speakText` (Red) (7fb5f90)
  - [x] Mock `speechSynthesis.getVoices()` in happy-dom; test utterance receives matching `voice` when URI resolves
  - [x] Test silent fallback to default when URI missing / voices unavailable / not supported
  - [x] Test existing behavior unchanged when no preference set (regression)
- [x] Task: Implement `setPreferredVoiceURI(uri)` and voice resolution in `speakText` (Green) — best-effort, never throws (7fb5f90)
- [x] Task: Verify coverage (speech.ts 97.4% lines)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [checkpoint: 5302606]

## Phase 3 — SettingsPanel Voice Row + Preview

- [x] Task: Add Voice row to `SettingsPanel` (UI; tests alongside implementation) (a745cef)
  - [x] Row label shows "Voice: Default (device)" or truncated selected voice name; tap cycles options (Default → all device voices → wrap)
  - [x] Preview button in the row speaks sample phrase with currently selected voice; honors SFX toggle parity (AC-5)
  - [x] Handle `voiceschanged` async load state; row remains functional when `getVoices()` is empty
  - [x] Persist via `updateSettings({ preferredVoiceURI })` on selection change
- [x] Task: Write/extend SettingsPanel tests (row exists, cycling, preview speaks, persistence) (a745cef) — 8 new tests in `SettingsPanel TTS voice selection` describe + 1 BootScene sync test in navigation.test.ts
- [x] Task: Verify coverage (SettingsPanel 98.72% lines, BootScene 100%, voiceLogic 100%)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [checkpoint: f022704] — manual plan: dev server, open Settings via 3s parental hold, cycle voice, preview, restart persistence

## Phase 4 — Full Verification & Documentation

- [x] Task: Run full quality gates in CI order: `pnpm run check` → `CI=true pnpm test` → `pnpm run build` (check clean 109 files, 50 files / 1176 tests, build OK with pre-existing chunk-size warning)
- [x] Task: Update `docs/device-testing-checklist.md` with TTS voice selection rows (targeted device test additions) (03ef786)
- [x] Task: Final phase verification & checkpoint [checkpoint: e2338cc]
- [x] Task: Summarize feature for future release track (v1.12.0 candidate) (see below)

---

**Feature summary (v1.12.0 candidate):** Device-level TTS voice selection in the parental Settings panel. New `src/game/voiceLogic.ts` (pure: `availableVoiceOptions`, `resolveVoice`), `Settings.preferredVoiceURI` (string | null, additive migration, default null), `setPreferredVoiceURI` in `speech.ts` applying the voice to every speech-driven scene (7 games), SettingsPanel Voice chip row (cycles Default → installed voices, truncated labels, persists via `updateSettings`) + Preview button speaking "Hi! I can talk." honoring the SFX toggle, `voiceschanged` async refresh, BootScene sync on start. Addresses known issue #1 "TTS voice availability varies by device/OS". Out of scope: per-profile voices, locale selection, cloud sync.

---

**Out of scope:** per-profile voices, locale selection, cloud sync, new SVG art, kid-facing voice UI.
