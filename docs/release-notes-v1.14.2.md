# Release Notes - v1.14.2

> **Status:** DRAFT - pending tag `v1.14.2` deployment (will be finalized with live URL and verification results after CI/CD deploy).

This patch release fixes a navigation bug that could leave the game hub unresponsive after finishing a game, and also ships two completed feature tracks that were finished after v1.14.1 was cut: the eighteenth learning game (**Memory Match**) and consistent **Baloo 2** letter/numeral artwork.

## Bug Fixes

- **Hub tiles no longer go dead after completing a game.** Previously, after finishing any game and auto-returning to the hub, tapping another game tile did nothing - the child had to reload the app to play a different game. The cause was a launch-guard flag (`navLocked`) that Phaser keeps alive across visits because the hub scene instance is reused rather than recreated; the flag is now reset every time the hub rebuilds. A regression test replays a full "play → auto-return → start a different game" cycle on the same scene instance, and the full suite passes (1468 tests).

## New Features

- **Game 18: Memory Match.** A visual working-memory game of flipping cards to find matching pairs, with progressively larger grids as rounds advance. It adds an 18th tile to the hub grid plus a new collectible sticker, following the same tap-friendly, no-text UI conventions as the other games.
- **Consistent Baloo 2 letter and numeral artwork.** All letter and numeral glyph SVGs (38 assets) are now rendered in the bundled Baloo 2 font instead of falling back to whatever system font each device has, including the First Sounds tile and sticker accents. The boot sequence now explicitly waits for the font before rasterizing glyphs, so artwork looks identical on every device.

## Known Issues

- Learning progress and play-time budgets are stored per device per profile - they do not sync across devices (accepted; cloud sync is out of scope).

## Installation

The game is a PWA - update by reopening the app or triggering an update from the install/update prompt. All progress, stickers, profiles, and play-time settings are stored locally on the device.

## Feedback

Report issues via [GitHub Issues](https://github.com/mansyar/aby-little-lab/issues).
