# Release Notes — v1.14.0

> **Status:** FINAL — released 2026-08-10 (tag `v1.14.0`, deployed live at https://aby-little-lab.ansyar-world.top/, device testing passed on all 4 device classes).

## What's New

- **Game 17 — Take Away.** The first **early subtraction** game: two prompt cards show items being taken away (the first card is the group to start with, the second the group being removed, joined by a "take away" cue), and four answer cards show the possible differences as dot groups. The child counts both groups and taps the card with the correct answer. Six rounds per play, **easy-first**: minuends up to 4 (rounds 1–2), then up to 6 (rounds 3–4), then up to 10 (rounds 5–6). Differences never reach 0, and no subtraction pair repeats within a playthrough. Correct taps chime and cheer; a wrong tap is met with gentle, encouraging feedback — never a penalty. Winning awards the first-completion **sticker** and the shared win celebration, then returns to the Hub after 3 seconds. Replays shuffle cards and options so the game stays fresh.
- **The 17-game suite is complete.** Take Away joins Color Match and Add It Up as the third math game, rounding out the full learning path — colors, shapes, letters, first words, phonics, counting, comparing, and now adding and taking away.

## Improvements

- Take Away is fully textless and speech-free — subtraction is done by eye, with no audio dependency (the third game alongside Add It Up that needs no prompt voice).
- The Hub grid now holds all 17 tiles (5×3 + 2 — the fourth row starts with Add It Up and ends with Take Away, left-aligned).
- Difficulty is fixed across replays per the replay-variety principle: every playthrough is easy-first, but no round ever repeats the same minuend-subtrahend pair.

## Bug Fixes

- The Learning Progress report listed only 15 games — **Add It Up** had been missing since v1.13.0 and **Take Away** would have been missing here. Both rows are now included, so the parent report covers all 17 games (pages 8 + 8 + 1).
- No other regressions; full suite 1309 tests across 58 files.

## Known Issues

- Learning progress and play-time budgets are stored per device per profile — they do not sync across devices (accepted; cloud sync is out of scope).
- Letter and numeral artwork uses the system font (per product decision), so glyph rendering varies slightly across devices (accepted).

## Installation

The game is a PWA — update by reopening the app or triggering an update from the install/update prompt. All progress, stickers, profiles, and play-time settings are stored locally on the device.

## Feedback

Report issues via [GitHub Issues](https://github.com/mansyar/aby-little-lab/issues).
