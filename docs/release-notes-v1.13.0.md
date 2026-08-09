# Release Notes — v1.13.0

> **Status:** DRAFT — Games 15 & 16 (Color Match, Add It Up) + Performance & Bundle Hardening (2026-08-09). Finalized by the v1.13.0 release-execution track.

## What's New

- **Two new games — the suite is now 16.** **Color Match** (Game 15) shows a big colored swatch and four object cards in four different colors; the child taps the object matching the swatch — the color name is spoken aloud. **Add It Up** (Game 16) shows an equation: two dot-group cards joined by a big "+" with an "=" cue, and four answer cards; the child counts both groups and taps the card with the correct total (sums up to 10, easy-first across the playthrough). Both games run 6 rounds per play, award a first-completion sticker, and celebrate with the shared win animation.
- **A leaner, faster load.** The Phaser engine is now split into its own cached vendor chunk — the app shell dropped from ~1.5 MB to ~137 kB (383.5 kB → 25.5 kB gzip). Booting and returning to the Hub feel snappier, and the game-scene chunks are untouched (each game still loads only when tapped).

## Improvements

- Add It Up is fully textless and speech-free — counting and adding is done by eye, with no audio dependency (the only game without a prompt voice).
- Color Match reuses the existing storybook object art (heart, frog, crescent, rectangle, circle, square) in its six colors — zero new object assets.
- The CI pipeline now enforces the bundle split (`validate-bundle.js`) and higher coverage floors (95% lines / 90% statements / 88% functions / 85% branches), keeping future releases fast and well-tested.
- The Hub grid now holds all 16 tiles (5×3 + 1 — row 4 starts with Add It Up, left-aligned).

## Bug Fixes

- No gameplay bug fixes in this release (all 16 games carried from v1.12.0, verified by the full suite — 1284 tests across 56 files).

## Known Issues

- Learning progress and play-time budgets are stored per device per profile — they do not sync across devices (accepted; cloud sync is out of scope).
- Letter and numeral artwork uses the system font (per product decision), so glyph rendering varies slightly across devices (accepted).

## Installation

The game is a PWA — update by reopening the app or triggering an update from the install/update prompt. All progress, stickers, profiles, and play-time settings are stored locally on the device.

## Feedback

Report issues via [GitHub Issues](https://github.com/mansyar/aby-little-lab/issues).
