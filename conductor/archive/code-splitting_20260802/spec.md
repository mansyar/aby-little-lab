# Track: Bundle Code Splitting — Lazy-Load Game Scenes

**Track ID:** `code-splitting_20260802`
**Type:** Chore (Performance)
**Branch:** `feat/code-splitting-bundle`
**Date:** 2026-08-02

## Overview

The production bundle currently emits a single 1,473 kB JS file (380 kB gzip) containing Phaser plus all 10 scenes. This track splits the bundle by lazy-loading the 7 game scenes via dynamic imports, so only the app shell (Phaser + Boot/Preload/Hub + shared modules) is fetched and parsed at startup. Game scene code loads on demand when a child taps a game tile in the Hub. The PWA keeps its full-precache strategy, preserving the offline-first guarantee.

## Functional Requirements

1. **Lazy scene registration:** A new testable module `src/scenes/sceneRegistry.ts` maps the 7 game scene keys to dynamic-import loaders (`() => import("./scenes/<Scene>.ts").then(m => m.<Scene>Class)`) and exposes `ensureSceneLoaded(scene, key)` which no-ops when the scene is already registered, otherwise imports the module and registers it via `scene.add(key, SceneClass)`.
2. **Static shell scenes:** `BootScene`, `PreloadScene`, `HubScene` remain statically imported in `main.ts` and load at startup; the Phaser config `scene` array contains only these 3 scenes.
3. **On-demand loading:** The Hub tile tap handler awaits `ensureSceneLoaded(this, sceneKey)` before the existing `transitionToScene(this, sceneKey)` fade-out/start flow, so the game's chunk is fetched and parsed on first tap of that game.
4. **Shared-code hoisting:** Rollup automatically extracts modules shared between scenes (e.g., `utils/`, `game/*Logic.ts`, components) into shared chunks — no manual chunk config is introduced.

> **2026-08-02 — Design Deviation (Phaser 4 lazy loading):** Phaser 4.2.1 does **not** support dynamic-import lazy loaders in the config `scene` array — `SceneManager.createSceneFromFunction` instantiates entries with `new scene()` (synchronous constructor; no promise handling exists in `SceneManager.js`). The documented Phaser approach for scene code splitting is runtime registration: dynamically `import()` the module, then `scene.add(key, SceneClass)`. FR1/FR3 above are revised accordingly (original FR1 assumed array-level lazy loaders; original FR3 assumed no Hub changes). Acceptance criteria are unaffected.

## Non-Functional Requirements

5. **PWA offline guarantee unchanged:** The service worker must precache all emitted chunks (the default `globPatterns` covers new chunks). No runtime-only caching of game chunks.
6. **Phaser 4 compatibility:** Verify (per `tech-stack.md` note) that Phaser 4.2.1 supports lazy scene loading via dynamic import in the scene array before committing to the approach.

## Acceptance Criteria (Structural Verification)

- **AC1:** `pnpm run build` emits the entry chunk **plus 7 separate game-scene chunks** in `dist/assets/`.
- **AC2:** Game-scene code (e.g., scene class names like `ShapeSorterScene`) is **absent from the entry chunk**.
- **AC3:** Boot → Preload → Hub startup fetches only entry/shared chunks; **no game chunk is requested before a tile tap** (verified via browser network tab / build output).
- **AC4:** All 7 games still boot correctly from the Hub (stickers, audio, transitions intact) — covered by existing `navigation.test.ts` + manual verification.
- **AC5:** `dist/sw.js` precache manifest includes the new chunks (full offline play preserved).
- **AC6:** Quality gates pass: `pnpm run check`, `CI=true pnpm test`, `pnpm run build`.

## Out of Scope

- Manual `manualChunks`/vendor splitting configuration beyond Rollup's automatic shared-chunk hoisting.
- Lazy-loading Boot/Preload/Hub scenes.
- Changing the PWA caching strategy (no runtime caching of game chunks).
- Asset optimization (SVG/image size reduction).
