# Release Notes — v1.8.0

> **Status:** FINAL — released 2026-08-08 via the automated pipeline (Quality Gates → Coolify deploy). Live smoke testing + device testing passed on iPad, Android tablet, iPhone, and Android phone against the live URL — no issues found.

## What's New

- **Game 12 — First Sounds, now in the lab.** Professor Hoot speaks a word, and little listeners tap the letter it starts with. Six friendly rounds per play, four letter cards each round, drawn from a curated phonics pool of twelve everyday words (CAT, DOG, PIG, SUN, HAT, BUG, OWL, TREE, STAR, BALL, FROG, FISH) — with the same artwork kids already know from the Word games.
- **Built to avoid trick questions.** The correct letter is never shown alongside a confusable twin: similar-sounding pairs (B/P, D/T) and similar-looking letters (C/G/O/Q, I/L/T, M/W) stay apart from the answer, so every round has one clear choice.
- **Gentle by design.** A correct tap chimes, pulses the letter, and speaks both the letter name and the word. A wrong tap just gives a friendly bounce — no penalty, no pressure, try again.
- **Twelve mini-games complete.** The Hub now shows the full storybook row: all 12 tiles, matching the family's 6-round structure, 96 px touch targets, and just-earned sticker pop after the win.

## Improvements

- Hub grid extends to 12 tiles (row 3: 2 tiles, left-aligned) with no layout changes.
- First Sounds reuses the existing word-picture textures — no new art beyond the tile icon and sticker.

## Bug Fixes

- None — this release adds a game rather than fixing regressions.

## Known Issues

- TTS voice availability varies by device/OS (accepted).
- Play-time budget is stored per device per profile — it does not sync across devices (accepted; cloud sync is out of scope).
- Letter and numeral artwork uses the system font (per product decision), so glyph rendering varies slightly across devices (accepted).
- No other known issues.

## Installation

The game is a PWA — update by reopening the app or triggering an update from the install/update prompt. All progress, stickers, profiles, and play-time settings are stored locally on the device.

## Feedback

Report issues via [GitHub Issues](https://github.com/mansyar/aby-little-lab/issues).
