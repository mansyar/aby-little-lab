# Implementation Plan: TTS Voice Selection (Parental Settings)

**Track ID:** `tts-voice-selection_20260808`
**Type:** Feature
**Status:** new

---

## Phase 1 — Voice Selection Pure Logic + Schema (TDD)

- [ ] Task: Write failing tests for `src/game/voiceLogic.ts` (Red)
  - [ ] Test `availableVoiceOptions`: "Default (device)" always first; all voices listed (all languages, no hard en-US gate); sorted by language then name
  - [ ] Test `resolveVoice`: matches by `voiceURI`; returns `null` when URI absent or no voices
  - [ ] Test empty voice list → only "Default (device)" option; `resolveVoice` → `null`
- [ ] Task: Implement `voiceLogic.ts` (Green) — `VoiceOption` type, `availableVoiceOptions`, `resolveVoice`
- [ ] Task: Extend `Settings` in `src/types/index.ts` with `preferredVoiceURI: string | null`; update `defaultSettings()` in `profileLogic.ts` + additive `normalizeV2` merge
  - [ ] Tests: default settings include `preferredVoiceURI: null`; v1 migration and v2 normalize preserve old saves without error
- [ ] Task: Verify coverage for Phase 1 code files
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — speech.ts Integration (TDD)

- [ ] Task: Write failing tests for `setPreferredVoiceURI` + voice assignment in `speakText` (Red)
  - [ ] Mock `speechSynthesis.getVoices()` in happy-dom; test utterance receives matching `voice` when URI resolves
  - [ ] Test silent fallback to default when URI missing / voices unavailable / not supported
  - [ ] Test existing behavior unchanged when no preference set (regression)
- [ ] Task: Implement `setPreferredVoiceURI(uri)` and voice resolution in `speakText` (Green) — best-effort, never throws
- [ ] Task: Verify coverage
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — SettingsPanel Voice Row + Preview

- [ ] Task: Add Voice row to `SettingsPanel` (UI; tests alongside implementation)
  - [ ] Row label shows "Voice: Default (device)" or truncated selected voice name; tap cycles options (Default → all device voices → wrap)
  - [ ] Preview button in the row speaks sample phrase with currently selected voice; honors SFX toggle parity (AC-5)
  - [ ] Handle `voiceschanged` async load state; row remains functional when `getVoices()` is empty
  - [ ] Persist via `updateSettings({ preferredVoiceURI })` on selection change
- [ ] Task: Write/extend SettingsPanel tests (row exists, cycling, preview speaks, persistence)
- [ ] Task: Verify coverage
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md) — manual plan: dev server, open Settings via 3s parental hold, cycle voice, preview, restart persistence

## Phase 4 — Full Verification & Documentation

- [ ] Task: Run full quality gates in CI order: `pnpm run check` → `CI=true pnpm test` → `pnpm run build`
- [ ] Task: Update `docs/device-testing-checklist.md` with TTS voice selection rows (targeted device test additions)
- [ ] Task: Final phase verification & checkpoint
- [ ] Task: Summarize feature for future release track (v1.12.0 candidate)

---

**Out of scope:** per-profile voices, locale selection, cloud sync, new SVG art, kid-facing voice UI.
