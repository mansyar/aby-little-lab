# Release Notes — v1.7.0

> **Status:** FINAL — released 2026-08-07 via the automated pipeline (Quality Gates → Coolify deploy). Live smoke testing + device testing passed on iPad, Android tablet, iPhone, and Android phone against the live URL — no issues found.

## What's New

- **Animal Trace guides little fingers.** The next waypoint now pulses with a friendly ring and visited dots light up in success green, so there is always a clear "where next?" cue.
- **Musical Memory stays fair.** The same frog never plays more than twice in a row, and long sequences play at a faster 480 ms per note so later rounds don't drag.
- **Word Match starts easy.** Every playthrough now leads with five 3-letter words and closes with one 4-letter word — same words, friendlier order.
- **More celebration feedback.** Word Match, Find the Letter, and Pattern Builder now burst a correct-answer splash at the tapped card/gap, matching the other games.
- **Word Builder tiles come alive.** A used tile flies its letter into the slot and dims into a ghost; for words with duplicate letters (BALL) the tile stays tappable for the second use and gives a little thunk instead. Letter tiles are also bigger (132 px) so they stay above the 64 px touch floor on small phones.
- **Pattern Builder matches the family.** Six rounds per play, like every other mini-game.
- **No more trick questions.** Alphabet and Pattern Builder never offer a distractor that looks like the answer (C is never offered with G/O/Q, hexagon is never offered with octagon, and so on).
- **How Many? is fairer and tidier.** The two rounds of each band always show different target counts, and a partially-filled last row is centered in its card.
- **Big vs Small mixes it up.** The big and small boxes swap sides on every play.

## Improvements

- Shadow Match drop zones match the other sorting games (160 px target).
- Word Builder's settle-pop and dot-pop effects now respect reduced-motion settings.
- Shape Sorter's back button uses the Baloo 2 rounded font like every other scene.
- Removed dead code and unused state across the codebase (no behavior change).

## Bug Fixes

- **Replay/session bugs after a completed game.** Re-launching Animal Trace, Shape Sorter, or Pattern Builder after finishing a session no longer starts mid-game (Animal Trace could end after a single path, Shape Sorter's progress dots stopped filling, Pattern Builder's dots did the same).
- **Musical Memory replay reset.** Replaying the sequence no longer leaves input progress stale, so the first correct tap after a re-listen isn't judged wrong.
- **Pop & Freeze bubbles bounce at the real edge.** The physics body now matches the 96 px bubble instead of the 512 px artwork frame, so bubbles bounce off the visible wall and taps are no longer blocked by invisible hit areas.
- **Speaker button crash during the win celebration.** Tapping the speaker in the 3-second celebration in Find the Letter, Find the Word, Build the Word, or How Many? no longer throws.
- **Double-navigation race.** Holding Back while the game's auto-return is already fading out can no longer navigate twice in a row.

## Known Issues

- TTS voice availability varies by device/OS (accepted).
- Play-time budget is stored per device per profile — it does not sync across devices (accepted; cloud sync is out of scope).
- Letter and numeral artwork uses the system font (per product decision), so glyph rendering varies slightly across devices (accepted).
- No other known issues.

## Installation

The game is a PWA — update by reopening the app or triggering an update from the install/update prompt. All progress, stickers, profiles, and play-time settings are stored locally on the device.

## Feedback

Report issues via [GitHub Issues](https://github.com/mansyar/aby-little-lab/issues).
