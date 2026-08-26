# Release Notes - v1.16.0

> **Status:** DRAFT — pending production verification
>
> **Tag:** `v1.16.0`
>
> **Deployment:** https://aby-little-lab.ansyar-world.top

This release tightens the whole app into one consistent, guided feel and makes
Professor Hoot's animated mascot available offline from the very first visit.

## What's New

- **UI/UX Cohesion.** Every tappable child control now responds with the same
  gentle press feedback, and the Hub, parent Settings, and Learning Progress
  share a consistent visual language so parents and kids always know where they
  are and what's available.
- **Shared press feedback.** Back, Replay, Settings, and Hub tiles squish on
  press and spring back on release in every game - matching how the rest of the
  app already felt.
- **Speaker visual states.** The speaker/replay button now shows its real
  availability at a glance: it is highlighted while speech is playing, dimmed
  when sound effects are off, and dimmed when the device has no speech voice.
- **Settings & Learning Progress affordances.** Parent Settings and the
  per-profile Learning Progress report use clearer row cards, switch toggles,
  and chevron paging, so the parent controls are easier to read and navigate.
- **Hub tile hierarchy + active-profile rings.** Hub tiles are graded by visual
  weight so the most important actions stand out, and the active profile is
  marked with a clear ring on the Hub and in the profile picker.
- **Offline-first Professor Hoot.** The Ligne animation engine is now precached
  during installation, so the animated Hoot mascot is available offline the
  very first time the app opens (accepted behavior: devices with Reduce Motion
  enabled still use the lightweight tween Hoot).

## Improvements

- The Ligne WASM engine is part of the PWA installation payload (precache), so
  no network round-trip is needed before the animated Hoot can appear offline.
- The game shell still loads before the animation engine, preserving the fast,
  boot-critical path; the mascot remains decorative and touch-inert.
- All 1565 automated tests pass, together with PWA, bundle, formatting, and
  production-build validation.

## Bug Fixes

- Fixed the v1.15.0 known issue where the animated Hoot was unavailable on a
  device's first visit while already offline. The Ligne engine is precached, so
  the animated mascot now appears offline on first launch (when motion is not
  reduced).

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