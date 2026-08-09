# Release Notes — v1.14.0 (draft)

> **Status:** SUPERSEDED (2026-08-09) — Parent Progress Insights was folded into the **v1.13.0** release by user decision (the code was already on master when v1.13.0 was cut). The content below is preserved for reference; **no v1.14.0 release is planned** — the v1.13.0 release notes and device-testing checklist now carry the Progress rows.

## What's New

- **See how learning is going.** Parents hold the Hub settings button for 3 seconds, open Settings, and find a new **Progress** row. It opens a per-profile **Learning Progress** report: for each of the 15 games — plays, accuracy (correct answers out of all answers, with a green fill bar), a ★ mastery star once the game is won 3 times, and when it was last played ("Today", "Yesterday", or "3d ago").
- **Every kid gets their own report.** The report follows the active profile automatically, and avatar chips at the top of the overlay let parents peek at a sibling's progress without switching the active profile — stickers, play-time, and the Hub stay exactly as the child left them.
- **See recent play at a glance.** A 7-day activity strip at the bottom of the report shows how many games were played each of the last 7 days, so screen-time patterns are visible in one glance.

## Improvements

- Games are paged 8 + 7 so all 15 rows fit comfortably in landscape on phones and tablets.
- Backing out of a game mid-way still counts the play; only completed rounds are counted as wins (the app has no-fail design, so accuracy is always encouraging).
- Pop & Freeze and Animal Trace have no right/wrong answers by design — they count as plays and wins but show "—" for accuracy.
- Everything is recorded on-device, per profile, with no migration bumps — existing saves gain the new fields automatically.

## Bug Fixes

- None (no regressions; full suite 1260 tests across 54 files).

## Known Issues

- Progress is stored per device per profile — it does not sync across devices (accepted; cloud sync is out of scope).
- Play-time budget is stored per device per profile — it does not sync across devices (accepted; cloud sync is out of scope).
- Letter and numeral artwork uses the system font (per product decision), so glyph rendering varies slightly across devices (accepted).

## Installation

The game is a PWA — update by reopening the app or triggering an update from the install/update prompt. All progress, stickers, profiles, and play-time settings are stored locally on the device.

## Feedback

Report issues via [GitHub Issues](https://github.com/mansyar/aby-little-lab/issues).
