# Release Notes — v1.4.0

> **Status:** FINAL — Multi-Kid Profiles merged to `master` via the `release/v1.4.0` pull request; released on 2026-08-04 via the automated pipeline (Quality Gates → Coolify deploy). Manual device verification completed 2026-08-04 — all items passed on iPad, Android tablet, iPhone, and Android phone (`docs/device-testing-checklist.md`).

## What's New

- **Up to 4 kid profiles, each with their own sticker collection.** Siblings sharing a device no longer overwrite each other's progress. A kid-tappable avatar chip on the Hub switches profiles instantly — no parental lock needed to switch.
- **Six textless animal avatars** (cat, dog, pig, frog, duck, bear) — reusing existing artwork, so nothing new to download.
- **Parental-gated profile management.** Creating or deleting a profile lives behind the 3-second hold in Settings → Profiles; deletion is a two-step confirmation.
- **Automatic migration.** Existing saves move into the first profile silently — no prompts, no data loss. Settings (BGM/SFX) stay device-level and are shared by all profiles.

## Improvements

- Profile picker uses ≥96px touch targets and closes cleanly (no stale input lock).
- A profile limit message appears once 4 profiles exist.

## Bug Fixes

- None (no regressions known).

## Known Issues

- TTS voice availability varies by device/OS (accepted).
- No other known issues.

## Installation

The game is a PWA — update by reopening the app or triggering an update from the install/update prompt. All progress and stickers are stored locally on the device.

## Feedback

Report issues via [GitHub Issues](https://github.com/mansyar/aby-little-lab/issues).
