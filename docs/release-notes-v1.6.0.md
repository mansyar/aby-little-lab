# Release Notes — v1.6.0

> **Status:** FINAL — released on 2026-08-06 via the automated pipeline (Quality Gates → Coolify deploy). Device testing completed on iPad, Android tablet, iPhone, and Android phone — all items passed, no issues.

## What's New

- **Shape Sorter grows into a 3-round adventure with 18 shapes.** The shape pool expands from 6 to 18 (12 new: oval, rectangle, diamond, pentagon, hexagon, octagon, trapezoid, semicircle, arrow, plus, ring, teardrop — each with its own matching cutout slot and color). Every play session is now 3 rounds × 3 shapes with progress dots, and the sticker is awarded after the final round.
- **Full visual polish — all 142 game visuals redrawn.** Every shape, cutout, animal, toy, item, shadow, sticker, Hub tile, and UI icon was redesigned to the "Storybook Flat" style: flat fills, thick dark outlines, and a soft vibrant palette — one consistent look across the whole game.

## Improvements

- Global rounded typography (Baloo 2) replaces the system font everywhere.
- All 11 Hub tiles now show distinct storybook icons (textless differentiators); unearned sticker slots show dashed empty-slot outlines.
- Speaker replay button on Find the Letter, Find the Word, Build the Word, and How Many? — Musical Memory keeps the same replay icon.
- Audio resumes on the first Hub touch, so the idle-attract chime is audible on a fresh load.
- Settings readability: larger fonts, the version footer moved under the title, pinch-zoom allowed while Settings is open.
- Polish pass: branded preload screen, calmer idle attract (two rotating tiles), sticker pops right after the celebration, larger Shadow Match objects, storybook sleep glyph in Pop & Freeze.

## Bug Fixes

- iPad orientation-lock black screen on launch (#12).
- Speaker/avatar buttons could miss taps — hit areas are now frame-based (texture-local rectangles landed off the visible icon).
- iOS SpeechSynthesis could stay silent until a user gesture, and a cancel/speak race could swallow prompts — TTS now unlocks on the first touch and defers replacement speech.

## Known Issues

- TTS voice availability varies by device/OS (accepted).
- Play-time budget is stored per device per profile — it does not sync across devices (accepted; cloud sync is out of scope).
- Letter and numeral artwork uses the system font (per product decision), so glyph rendering varies slightly across devices (accepted).
- No other known issues.

## Installation

The game is a PWA — update by reopening the app or triggering an update from the install/update prompt. All progress, stickers, profiles, and play-time settings are stored locally on the device.

## Feedback

Report issues via [GitHub Issues](https://github.com/mansyar/aby-little-lab/issues).
