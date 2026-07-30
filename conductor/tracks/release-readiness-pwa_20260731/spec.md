# Track: Release Readiness & PWA Validation

**Track ID:** `release-readiness-pwa_20260731`
**Type:** Chore
**Status:** New
**Created:** 2026-07-31

## Overview

Prepare Aby's Little Lab for a private PWA release. Integrate the existing BGM asset at `src/assets/audio/bgm.mp3` into the app's production-served audio path, validate PWA install/offline behavior and the complete child/caregiver experience on target devices, and document a repeatable private static-host release process.

## Scope

### In Scope

1. **BGM integration**
   - Relocate or otherwise package the existing `src/assets/audio/bgm.mp3` so it resolves through the current `/audio/bgm.mp3` runtime URL.
   - Verify looping playback, comfortable volume, independent BGM/SFX toggles, persisted preferences, and safe browser-autoplay behavior.

2. **PWA production validation**
   - Verify a production build generates a valid manifest and service worker.
   - Verify installed, standalone landscape behavior and full offline gameplay after the first load.
   - Validate the configured `autoUpdate` service-worker behavior.

3. **Mobile, accessibility, and performance validation**
   - Exercise boot → Hub → each game → sticker award → Hub.
   - Validate phone/tablet landscape behavior, touch/drag/hold interactions, parental lock, and settings/sticker persistence.
   - Verify reduced-motion support and no-fail feedback behavior.
   - Record results against stated boot-time, frame-rate, memory, touch-latency, and audio-latency targets where practical.

4. **Release documentation**
   - Add a private static-host deployment guide.
   - Add a repeatable release checklist for build, install/offline behavior, device validation, and update/rollback handling.

### Out of Scope

- Selecting, configuring, or deploying to a specific hosting provider.
- Creating, licensing, or replacing the supplied BGM asset.
- New gameplay, analytics, or unrelated visual redesign.

## Acceptance Criteria

- `bgm.mp3` is served at the expected runtime path, loops correctly, and respects persisted BGM preferences.
- Production build, lint/format checks, tests, and coverage thresholds pass.
- A valid manifest and service worker are generated; the app can be installed and used offline after its initial load.
- All six mini-games, sticker persistence, settings, and parental lock work on representative phone and tablet devices.
- The repository contains clear private-static-host deployment and release-verification instructions.

## Technical Context

Refer to:
- [Product Definition](../../product.md)
- [Product Guidelines](../../product-guidelines.md)
- [Tech Stack](../../tech-stack.md)
- [Workflow](../../workflow.md)
