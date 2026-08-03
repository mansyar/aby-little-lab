# Release Notes — v1.3.0

> **Status:** FINAL — First Words word pool expansion merged to master via PR, released 2026-08-04 via the automated pipeline (Quality Gates then Coolify deploy).

## What's New

- **Find the Word and Build the Word now draw from an 18-word pool** (was 9). New words: **OWL, SUN, HAT, BUG, BONE, STAR, DRUM, BEAR, DUCK** — with a picture for every word. The pool stays balanced (8 three-letter / 10 four-letter words) and each playthrough still samples a unique set, so every session feels a little different.

## Improvements

- **Replay reliability fix.** Re-entering a completed game (Find the Word, Build the Word, Find the Letter, Pattern Builder) could leave the answer cards unresponsive because the input lock from the win celebration carried over. Games now unlock input on every launch — replaying works every time.

## Bug Fixes

- Fixed stale input lock after completion breaking replays in four games (see Improvements).

## Known Issues

- TTS voice availability varies by device/OS (accepted).
- No other known issues.

## Installation

The game is a PWA — update by reopening the app or triggering an update from the install/update prompt. All progress and stickers are stored locally on the device.

## Feedback

Report issues via [GitHub Issues](https://github.com/mansyar/aby-little-lab/issues).
