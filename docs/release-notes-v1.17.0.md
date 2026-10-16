# Release Notes - v1.17.0

> **Status:** DRAFT — pending production verification
>
> **Tag:** `v1.17.0`
>
> **Deployment:** https://aby-little-lab.ansyar-world.top

This release completes the 20-game suite and makes difficulty adapt to each
child: two new games (Decode It and Number Order) plus per-profile ±1 adaptive
band ladders across 12 games, on top of the v1.16.0 cohesion foundation.

## What's New

- **Game 19 — Decode It.** Early-decoding game: a picture is shown and the word
  is spoken aloud, and the child taps the matching written word among 4 cards.
  Six rounds per playthrough, easy-first across 3-letter then 4-letter tiers
  with 6 unique targets per session and confusable-family guards. First-time
  sticker, shared win celebration, and 3s auto-return included.
- **Game 20 — Number Order.** Numeral-sequencing game: the child drags shuffled
  numeral cards into empty slots in ascending order. Six rounds per playthrough
  (3 numerals from 1–5, then 4 from 1–8, then 5 from 1–10), auto-validation
  when the last slot fills, tap-a-card-to-hear-it speech, and the full Hub 5×4
  grid (20 tiles, rows 5/5/5/5) with preload 168 → 170.
- **Adaptive Difficulty (12 games).** The easy-first ladder in the numeracy
  four (How Many?, More or Less, Add It Up, Take Away) plus the literacy &
  memory six (Find the Word, Build the Word, First Sounds, Find the Letter,
  Memory Match, Musical Memory) plus Decode It and Number Order may now shift
  one band up or down at the start of a playthrough, based on the child's last
  10 taps in that game (per profile, re-evaluated fresh each session, never
  mid-game). Invisible to kids; parents can turn it off in Settings → Adaptive
  Difficulty. The remaining fixed-difficulty games (Shape Sorter, Shadow Match,
  Big vs. Small, Pop & Freeze, Animal Trace) are unchanged by design.

## Improvements

- Learning Progress covers all 20 games (rows page 6+6+6+2) with per-profile
  plays, accuracy, mastery stars, and the 7-day activity strip.
- The adaptive band shift is computed once per playthrough start and respects
  the device-level Settings toggle (default ON); with too few taps the classic
  ladder is served byte-identically.
- Scene registry grows to 23 lazy loaders; all 20 game scenes stay lazily
  loaded behind the Hub shell, so startup and offline behavior are unchanged.

## Bug Fixes

- Number Order drag handlers are guarded with `inputLocked` (containers wiggle
  only), and the shared `dragJuice` helper supports Container targets.
- Number Order tile SVG re-encoded as ASCII to fix a `btoa` crash in preload.
- Decode It review fixes: confusable-aware fallback, `charAt` guard, Hub
  comment, and 19-tile expectations in `firstWordsIntegration`.

## Known Issues

- Learning progress and play-time budgets are stored per device per profile -
  they do not sync across devices (accepted; cloud sync is out of scope).

## Installation

The game is a PWA - update by reopening the app or triggering an update from
the install/update prompt. All progress, stickers, profiles, and play-time
settings are stored locally on the device.

## Release Verification

> Pending production verification. This section will be completed with the
> deployed run, live checks, and device-class sign-off after release.

## Feedback

Report issues via [GitHub Issues](https://github.com/mansyar/aby-little-lab/issues).
