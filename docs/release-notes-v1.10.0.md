# Release Notes — v1.10.0

> **Status:** FINAL — released 2026-08-08 (tag v1.10.0, deployed and live). Post-deploy verification (footer check, live smoke, device testing) was folded into the v1.11.0 release execution — the live site now serves v1.11.0, which covers Game 13 and Game 14 together; no issues found.

## What's New

- **Game 13 — More or Less, now in the lab.** A big storybook arrow pops in — pointing UP for "which group has MORE?" and DOWN for "which group has LESS?" — while Professor Hoot speaks the comparison word aloud. The child taps the group card that answers the prompt. Six friendly rounds per play, easy-first: counts 1–3, then 1–5, then 1–10.
- **Mixed-up prompts keep it interesting.** Every play asks three "more" questions and three "less" questions in shuffled order, with two cards that always hold different counts — so it's a true comparison, never a guess.
- **Gentle by design.** A correct tap flashes the card green, chimes, and pops a progress dot (700 ms to the next round). A wrong tap just wiggles with a friendly mascot nod — no penalty, no pressure, try again.
- **Thirteen mini-games complete.** The Hub now shows 13 tiles in a 5×3 grid (row 3: How Many?, First Sounds, and More or Less), matching the family's 6-round structure, 96 px touch targets, and just-earned sticker pop after the win.

## Improvements

- More or Less reuses the counting-item textures from How Many? — no new object art, only the arrow cue, hub tile, and sticker.
- Spoken prompts are SFX-gated with a silent fallback, and a speaker button re-hears the comparison word on demand.
- **Safer release pipeline.** Production deploys now trigger only when a strict version tag (`v1.10.0`-style) is pushed from a commit on `master` — pull requests and plain master pushes run quality gates but never auto-deploy.

## Bug Fixes

- None — this release adds a game and hardens the deploy pipeline rather than fixing regressions.

## Known Issues

- TTS voice availability varies by device/OS (accepted).
- Play-time budget is stored per device per profile — it does not sync across devices (accepted; cloud sync is out of scope).
- Letter and numeral artwork uses the system font (per product decision), so glyph rendering varies slightly across devices (accepted).
- No other known issues.

## Installation

The game is a PWA — update by reopening the app or triggering an update from the install/update prompt. All progress, stickers, profiles, and play-time settings are stored locally on the device.

## Feedback

Report issues via [GitHub Issues](https://github.com/mansyar/aby-little-lab/issues).
