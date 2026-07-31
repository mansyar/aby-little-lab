# Implementation Plan: Release Readiness & PWA Validation

**Track ID:** `release-readiness-pwa_20260731`

---

## Phase 1: BGM Production Integration [checkpoint: b48fde0]

- [x] Task: Establish BGM packaging regression coverage [241929e]
   - [x] Add/update tests covering BGM initialization, looping, enabled/disabled behavior, and the `/audio/bgm.mp3` runtime URL.
   - [x] Run the tests and confirm the pre-change failure where applicable.
- [x] Task: Package the existing BGM asset for runtime delivery [7bb3046]
  - [x] Move/package `src/assets/audio/bgm.mp3` at the served `/audio/bgm.mp3` path.
  - [x] Preserve the current `AudioManager` API and BGM/SFX preference behavior.
  - [x] Run BGM and full test suites.
- [x] Task: Verify BGM user experience [af79eee]
  - [x] Confirm playback begins only after an eligible user interaction.
  - [x] Confirm looping, independent toggles, persisted settings, and comfortable playback volume.
- [x] Task: Phase Verification & Checkpoint [b48fde0]

## Phase 2: Production PWA and Offline Validation

- [x] Task: Verify release-build PWA artifacts [532d874]
  - [x] Run the production build.
  - [x] Confirm manifest, service worker, icon, BGM, and game assets are present in generated output/precache artifacts.
- [~] Task: Validate installation, standalone, update, and offline behavior
  - [x] Serve the production build locally.
  - [x] Verify installation and standalone landscape launch.
  - [x] Verify every game remains playable after an initial online load and subsequent offline launch.
  - [x] Verify the configured service-worker auto-update behavior.
- [x] Task: Phase Verification & Checkpoint [0889f80]

## Phase 3: Device Quality Validation and Release Documentation

- [~] Task: Perform phone and tablet acceptance testing
  - [x] Exercise boot → Hub → all six games → sticker award → Hub.
  - [x] Verify touch/drag/hold controls, parental lock, settings persistence, sticker persistence, and reduced-motion behavior.
  - [x] Record practical measurements/observations against boot, frame-rate, memory, touch, and audio targets.
- [x] Task: Document private-PWA release procedure [b307905]
  - [x] Add concise static-host deployment instructions.
  - [x] Add a release checklist for automated checks, PWA/offline validation, device testing, and update/rollback handling.
- [x] Task: Execute final quality gates [b307905]
  - [x] Run `pnpm run check`, `CI=true pnpm test`, coverage, and `pnpm run build`.
  - [x] Record results and any target limitations in release documentation.
- [x] Task: Phase Verification & Checkpoint [549dd12]

## Phase: Review Fixes

- [x] Task: Apply review suggestions 7bd40ae
