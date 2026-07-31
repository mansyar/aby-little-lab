# Specification: Mobile PWA Shell, Audio, and Completion Feedback Hardening

**Track ID:** `mobile-pwa-hardening_20260731`
**Type:** Bug Fix
**Status:** New
**Created:** 2026-07-31

## Overview

Resolve production issues reported from the deployed PWA:

- Installed mobile PWA does not use fullscreen display where supported.
- Phone navigation controls remain visible.
- Completion particle effects cause performance problems and can remain on screen.
- BGM does not reliably begin.
- Synthesized SFX still request missing MP3 files and produce 404 errors.

The fix must preserve the existing six-game experience, sticker rewards, parental settings, reduced-motion behavior, and offline PWA support.

## Functional Requirements

### FR1 — Mobile PWA Display

- Configure the PWA to request fullscreen display where the platform supports it, with standalone behavior as fallback.
- Preserve landscape orientation and the existing 1024×768 `Phaser.Scale.FIT` layout.
- Avoid rendering duplicate browser-style navigation controls inside the app.
- Document that OS-level home/back/navigation bars cannot always be hidden by a web application.
- Verify behavior in both installed PWA mode and normal mobile browser mode.

### FR2 — Reliable BGM Startup

- Start BGM after the first valid user interaction when BGM is enabled.
- Resume the audio context as part of that interaction.
- Keep BGM playing while navigating between Hub and games.
- Respect the persisted BGM toggle:
  - Disabled: do not start or continue BGM.
  - Re-enabled: begin playback after the permitted user interaction.
- Ensure playback failures do not silently leave the app permanently muted.
- Continue serving BGM from `/audio/bgm.mp3`.

### FR3 — Remove Stale SFX Requests

- Stop creating or loading MP3 elements for synthesized SFX.
- Preserve the existing Web Audio implementations for pop, correct, incorrect, wake, win, and sticker feedback.
- Keep the SFX settings toggle functional.
- Production checks must no longer produce 404 requests for the six missing SFX files.

### FR4 — Lightweight Completion Feedback

- Replace completion particle bursts in all six games with one brief, single-shot splash or ray-of-light effect.
- The effect must:
  - Have an explicit bounded lifetime.
  - Clean itself up after completion.
  - Never leave a persistent emitter or cloud over the play area.
  - Avoid excessive particle counts and visible frame-rate degradation.
- Respect reduced-motion preferences by disabling the effect or using a minimal non-particle alternative.
- Preserve the existing completion sound, sticker award, and return-to-Hub flow.

## Non-Functional Requirements

- Maintain the existing Phaser, TypeScript, Vite, and PWA stack.
- Do not add new audio assets for synthesized SFX.
- Maintain the project’s 60 FPS target where practical, with no persistent completion-effect objects.
- Keep touch-first behavior and existing visual design guidelines.
- No new gameplay or unrelated visual redesign.

## Acceptance Criteria

1. Installed PWA requests fullscreen display where supported and retains landscape layout.
2. Browser chrome is absent in supported installed modes; platform limitations for system navigation controls are documented.
3. A first user tap starts BGM when enabled, and BGM continues across scene navigation.
4. BGM and SFX toggles remain persisted and functional.
5. `/audio/bgm.mp3` loads successfully.
6. No requests are made for the six missing SFX MP3 files.
7. Completing each game produces only one brief splash/ray effect.
8. Completion effects disappear automatically and do not obscure later gameplay.
9. Reduced-motion mode suppresses or simplifies the completion effect.
10. Existing sticker, audio, navigation, offline, build, lint, and test behavior remains passing.
11. The deployed site is revalidated after build and deployment.

## Out of Scope

- New mini-games or gameplay mechanics.
- Replacing the BGM asset.
- Guaranteeing removal of OS-level navigation bars on every mobile platform.
- A broader visual redesign.
- Adding a full browser E2E framework; production smoke verification may use Playwright CLI.
