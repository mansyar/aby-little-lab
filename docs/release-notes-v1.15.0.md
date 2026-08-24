# Release Notes - v1.15.0

> **Status:** FINAL - released 2026-08-24
>
> **Tag:** `v1.15.0`
>
> **Deployment:** https://aby-little-lab.ansyar-world.top

This release gives Professor Hoot a new child-friendly design and a richer set
of character animations powered by the Ligne runtime, while preserving the
existing lightweight mascot as a safe fallback.

## What's New

- **A redesigned Professor Hoot.** Hoot now has a warmer, more recognizable owl
  silhouette, expressive amber eyes and spectacles, feathered wings and feet,
  and a fitted professor's lab coat with lapels, buttons, pocket notes, and pen.
- **Seven character animations.** Hoot can idle, wave, nod, cheer, celebrate
  more enthusiastically, react with curiosity when a game starts, and flap a
  greeting on the Hub. The character remains decorative and never intercepts
  taps or other game input.
- **Smoother scene reactions.** Reactions requested while the animation engine
  is still loading are queued and replayed after Hoot becomes ready.

## Improvements

- Ligne loads asynchronously after the game shell, leaving the boot-critical
  path unchanged. A production reference run completed navigation in 2065 ms,
  inside the 3000 ms target; the first Ligne request began after page load.
- The 29.31 kB Hoot asset is included in the PWA precache. The larger Ligne
  engine is loaded only when needed and stored in a CacheFirst runtime cache,
  avoiding a 1.68 MB WASM download during initial PWA installation.
- The existing tween mascot remains available throughout startup and is used
  automatically if Ligne cannot load, times out, or reduced motion is enabled.
- All 1481 automated tests pass, together with PWA, bundle, formatting, and
  production-build validation.

## Bug Fixes

- Fixed browser animation-frame calls that could leave a blank Ligne canvas
  and prevent the new Hoot from replacing the fallback mascot.
- Fixed browser stacking so the Ligne canvas renders above Phaser while
  remaining touch-inert.
- Development loads now bypass stale asset caching, preventing an older Hoot
  binary from appearing after artwork updates.

## Known Issues

- On a device's first visit while already offline, the Ligne WASM engine is not
  yet cached, so the lightweight fallback owl is shown. After one successful
  online load, the animated Hoot is available on subsequent offline visits.
- Learning progress and play-time budgets are stored per device per profile -
  they do not sync across devices (accepted; cloud sync is out of scope).

## Installation

The game is a PWA - update by reopening the app or triggering an update from
the install/update prompt. All progress, stickers, profiles, and play-time
settings are stored locally on the device.

## Release Verification

- GitHub Actions run `32676437437` passed all quality gates and triggered the
  Coolify deployment.
- The live app, manifest, service worker, Hoot asset, and Ligne WASM all
  returned HTTP 200; the served application bundle reported version `1.15.0`.
- Live Hub and Shape Sorter checks confirmed the animated Ligne mascot replaces
  the fallback, remains touch-inert, and reacts correctly. Reduced-motion mode
  retained the lightweight fallback as designed.

## Feedback

Report issues via [GitHub Issues](https://github.com/mansyar/aby-little-lab/issues).
