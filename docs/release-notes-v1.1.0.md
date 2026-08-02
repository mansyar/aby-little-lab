# Release Notes — v1.1.0

> **Status:** Final — Game 8 merged to `master` (PR #7, `3544a0e`); released as v1.1.0 on 2026-08-02 via the automated pipeline (Quality Gates → Coolify deploy). Manual device verification completed 2026-08-03 — all items passed (`docs/device-testing-checklist.md`).

## What's New

1. **Find the Letter (Game 8)** — new mini-game teaching uppercase letter recognition (A–Z). A big target letter is shown and spoken aloud (browser SpeechSynthesis); the child taps the matching letter card among 4 options. 6 rounds per playthrough; each playthrough draws 6 unique letters from the full alphabet. 26 new letter SVGs + a new alphabet sticker.

## Improvements

- Hub grid grows to 4×2 with an 8th game tile ("Find the Letter").
- Letter names are spoken via SpeechSynthesis (respects the SFX toggle; falls back to visual-only silently when unsupported).

## Bug Fixes

- None.

## Known Issues

- Physical-device verification was completed **2026-08-03** — `docs/device-testing-checklist.md` executed against the live URL: PWA install (Android + iOS), offline, TTS voice, and performance targets all passed; no issues found.
- TTS voice availability varies by device/OS; children on devices without a speech voice still play visually with no error.

## Installation

Same as before: install the PWA from the live URL (Add to Home Screen / Install App) and play offline.

## Feedback

Via https://github.com/mansyar/aby-little-lab/issues
