# Release Notes — v1.2.0

> **Status:** Final — First Words (Games 9 & 10) merged to `master` via the `release/v1.2.0` pull request; released on 2026-08-03 via the automated pipeline (Quality Gates → Coolify deploy). Manual device verification completed 2026-08-03 — all items passed (`docs/device-testing-checklist.md`).

## What's New

1. **Find the Word (Game 9)** — sight-word recognition. A picture prompt appears with the word spoken aloud (browser SpeechSynthesis, rate 0.8); the child taps the matching printed word among 4 cards in a 2×2 grid. 6 rounds per playthrough, drawing from a 9-word pool; no two choices ever share a first letter (a pre-reader guard so children can match by first letter).
2. **Build the Word (Game 10)** — spelling. The child spells the pictured/spoken word by tapping letter tiles in order into the word slots. 3 words per playthrough, easy-first (3-letter words before 4-letter words); each round shows 6 letter tiles — the word's unique letters plus 2–3 distractors.

## Improvements

- Hub grid grows to 5×2 with a 10th tile (tiles resized to 160px, labels to 18px).
- Words are rendered by composing the existing letter SVGs — no new art pipeline, no new audio files.
- Word prompts are spoken via SpeechSynthesis (respects the SFX toggle; falls back to visual-only silently when unsupported or disabled).
- Two new stickers: `sticker_word_match` (CAT) and `sticker_word_builder` (DOG); old saves migrate automatically (new sticker entries backfilled on load).

## Bug Fixes

- None.

## Known Issues

- TTS voice availability varies by device/OS; children on devices without a speech voice still play visually with no error.
- Physical-device verification was completed **2026-08-03** — `docs/device-testing-checklist.md` executed on tablet + phone: Hub 5×2 grid, both new games' mechanics, SFX-off TTS silence, parental lock, sticker persistence, and reduced-motion behavior all passed; no issues found.

## Installation

Same as before: install the PWA from the live URL (Add to Home Screen / Install App) and play offline.

## Feedback

Via https://github.com/mansyar/aby-little-lab/issues
