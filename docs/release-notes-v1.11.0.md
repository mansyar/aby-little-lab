# Release Notes — v1.11.0

> **Status:** DRAFT — release in progress (2026-08-08). Version bump to 1.11.0; final status and verification recorded after deploy.

## What's New

- **Game 14 — Odd One Out, now in the lab.** A 2×2 grid of cards appears with three identical cards and one different card — and Professor Hoot speaks the odd item's name aloud ("dog", "star", "blue frog"). The child finds and taps the card that doesn't belong. Six friendly rounds per play, easy-first: cross-category pairs, then same-category different items, then tricky frog color variants.
- **Progressive difficulty, gently.** Rounds 1–2 mix categories (one animal among toys, one shape among animals); rounds 3–4 stay in one category but swap the item (three cats and a dog, three stars and a circle); rounds 5–6 get very subtle — three green frogs and a blue frog. The odd item is always unique per play, so every session is a fresh puzzle.
- **Gentle by design.** A correct tap flashes the card green, chimes, and pops a progress dot (700 ms to the next round). A wrong tap just wiggles with a friendly mascot nod — no penalty, no pressure, try again. A speaker button re-hears the odd item's name on demand.
- **Fourteen mini-games complete.** The Hub now shows 14 tiles in a 5×3 grid (row 3: How Many?, First Sounds, More or Less, and Odd One Out), matching the family's 6-round structure, 96 px touch targets, and just-earned sticker pop after the win.

## Improvements

- Odd One Out reuses existing animal, toy, and shape textures — no new object art, only the hub tile and sticker.
- Spoken prompts are SFX-gated with a silent fallback, and a speaker button re-hears the odd item's name on demand.
- v1.10.0 (Game 13 — More or Less) is fully live; its verification was folded into this release's testing since the live site now ships both games.

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
