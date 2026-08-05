# Release Notes — v1.5.0

> **Status:** FINAL — Play-Time Limits and Game 11 (How Many?) released on 2026-08-05 via the automated pipeline (Quality Gates → Coolify deploy).

## What's New

- **Game 11 — How Many? (early numeracy).** A counting game for ages 3–5: a large numeral pops in at the top and is spoken aloud; the child taps the group of objects whose count matches (3 cards for counts 1–3, then 4 cards up to 5, then up to 10 — 6 rounds, 2 per band, win on 6 correct). Wrong taps wiggle gently with no penalty; the first completion awards the "How Many?" sticker.
- **Play-Time Limits (per profile).** Parents can cap daily play per kid profile: Off, 15, 30, 45, or 60 minutes. The Hub shows a remaining-budget arc (warm color when ≤5 minutes left), warns with a 2-second hourglass nudge before starting a game near the limit, and locks tiles with a moon badge once the daily budget is spent — the cap resets each day and never cuts off a game mid-play. Off by default.

## Improvements

- Hub grid grows to 11 tiles (5×3) — tile sizes and touch targets unchanged.
- Ten new numeral SVGs (0–9) share the letter set's flat styling; the new sticker matches the existing sticker family; no new object textures (all group items reuse existing artwork).
- Spoken numbers respect the SFX toggle and degrade gracefully to visual-only when speech is unavailable.

## Bug Fixes

- None (no regressions known).

## Known Issues

- TTS voice availability varies by device/OS (accepted).
- Play-time budget is stored per device per profile — it does not sync across devices (accepted; cloud sync is out of scope).
- No other known issues.

## Installation

The game is a PWA — update by reopening the app or triggering an update from the install/update prompt. All progress, stickers, profiles, and play-time settings are stored locally on the device.

## Feedback

Report issues via [GitHub Issues](https://github.com/mansyar/aby-little-lab/issues).
