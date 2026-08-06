# Track: iPad Black Screen — Orientation Lock Crash

## Overview

The game shows only a black screen on iPad (both Safari and Chrome). Root cause: `BootScene.create()` calls `screen.orientation.lock("landscape")`, which throws a **synchronous `TypeError`** on iOS WebKit — the partial Screen Orientation API exposes `screen.orientation` but not the `lock()` method. The exception aborts `create()` before `this.scene.start("Preload")` runs, leaving the Phaser canvas permanently black.

## Root Cause Evidence

- All iOS browsers (Safari + Chrome) use WebKit; both lack `screen.orientation.lock()` (it exists only in PWA standalone mode on iPadOS 16.4+).
- `.catch()` handles promise rejections only — a missing method throws before `.catch()` is attached.
- The bug is iPad-only because Android/desktop Chrome have a working `lock()`.

## Functional Requirements

### FR1 - Boot must always proceed

- `BootScene.create()` must transition to the Preload scene regardless of Screen Orientation API support.

### FR2 - Orientation lock preserved where supported

- Landscape orientation lock must still be attempted on browsers that support `screen.orientation.lock()` (Android, PWA standalone on iPadOS 16.4+).

### FR3 - No collateral changes

- No changes to other scenes, audio, storage, or PWA configuration.

## Non-Functional Requirements

- TDD: regression test written first (fails on current code), then minimal fix.
- Match existing style (Biome formatting, JSDoc comments).

## Acceptance Criteria

- [ ] New regression test stubs `screen.orientation` **without** `lock` and asserts `scene.start("Preload")` is called — fails before fix, passes after.
- [ ] Existing BootScene tests (orientation lock attempt, rejection handling, AudioManager init) still pass.
- [ ] Full suite green (`CI=true pnpm test`), Biome clean (`pnpm run check`), build succeeds (`pnpm run build`).
- [ ] User manually verifies on physical iPad (Safari + Chrome): game reaches Hub, no black screen.

## Out of Scope

- Broader iPad hardening (global error surfaces, etc.).
- Changes to game scenes, audio, or PWA configuration.
