# Release Notes — v1.12.0

> **Status:** DRAFT — release in progress (2026-08-08, tag `v1.12.0`).

## What's New

- **Pick the voice that speaks.** The top accepted known issue — "TTS voice availability varies by device/OS" — is fixed. Parents hold the Hub settings button for 3 seconds, open Settings, and find a new **Voice** row. Tap the chip to cycle through every voice installed on the device ("Default (device)" first, wrapping), and every speech-driven game uses the chosen voice from then on — no per-game settings, no hunting through OS menus.
- **Hear it before you pick it.** The Voice row has a **Preview** button that speaks a friendly sample — "Hi! I can talk." — with the currently selected voice, so parents can tell exactly how the learning prompts will sound (it goes quiet with the SFX toggle, matching gameplay).
- **Device-level, shared by everyone.** The voice choice is stored at the device level (not per profile), so it applies consistently across all profiles on the same device and persists after closing and reopening the app.

## Improvements

- All 7 speech-driven games (Find the Letter, Find the Word, Build the Word, How Many?, First Sounds, More or Less, Odd One Out) inherit the selected voice automatically through the single speech pipeline — zero per-game configuration.
- All device voices are listed (all languages, no English-only gate), sorted by language then name; long voice names are truncated in the chip so nothing overflows.
- Choosing "Default (device)" restores the browser's default voice; if a stored voice no longer exists on the device, speech falls back to the default silently — no errors, no visual regression.

## Bug Fixes

- Resolves the accepted known issue **"TTS voice availability varies by device/OS"** — voice selection is now user-controllable from the parental Settings panel.

## Known Issues

- Play-time budget is stored per device per profile — it does not sync across devices (accepted; cloud sync is out of scope).
- Letter and numeral artwork uses the system font (per product decision), so glyph rendering varies slightly across devices (accepted).

## Installation

The game is a PWA — update by reopening the app or triggering an update from the install/update prompt. All progress, stickers, profiles, and play-time settings are stored locally on the device.

## Feedback

Report issues via [GitHub Issues](https://github.com/mansyar/aby-little-lab/issues).
