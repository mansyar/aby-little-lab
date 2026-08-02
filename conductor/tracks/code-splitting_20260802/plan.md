# Plan: Bundle Code Splitting — Lazy-Load Game Scenes

**Track ID:** `code-splitting_20260802`
**Type:** Chore (Performance)

## Phase 1: Verify Phaser 4 Lazy-Scene Support [checkpoint: a13a5db]

- [x] Task: Confirm Phaser 4.2.1 supports lazy scene loading via dynamic-import functions in the `scene` array (check Phaser 4 docs + type definitions in `node_modules/phaser`)
  - **Finding:** NOT supported. `SceneType` includes `Function`, but `SceneManager.createSceneFromFunction` calls `new scene()` synchronously — no promise/await handling exists in `SceneManager.js` (Phaser 4.2.1).
- [x] Task: Document the exact supported syntax in the task summary (pattern to use in `main.ts`)
  - **Pattern:** Runtime registration — `await import()` the scene module, then `scene.add(key, SceneClass)` before `scene.start(key)`. Documented in `spec.md` + `tech-stack.md` (dated deviation notes).
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2: Implement Lazy Scene Loading (TDD) [checkpoint: a515599]

- [x] Task: Create testable scene registry module `src/scenes/sceneRegistry.ts` (55197e5)
  - [ ] Write failing tests `src/__tests__/scenes/sceneRegistry.test.ts`: `sceneLoaders` maps exactly the 7 game keys (ShapeSorter, AnimalTrace, PopFreeze, ShadowMatch, MusicalMemory, BigSmall, PatternBuilder); `ensureSceneLoaded` skips the loader when the scene is already registered; `ensureSceneLoaded` resolves the loader and calls `scene.add(key, cls)` when not registered
  - [ ] Implement `sceneRegistry.ts` (per-key dynamic-import loaders + `ensureSceneLoaded`)
  - [ ] Run tests — confirm green (TDD: tests written before implementation)
- [x] Task: Wire lazy loading into HubScene tile taps (9fd61e0)
  - [ ] Update `HubScene.ts` tile pointerup handler: `startAudio()` then `void ensureSceneLoaded(this, key).then(() => transitionToScene(this, key))`
  - [ ] Update `navigation.test.ts`: mock `../../scenes/sceneRegistry`; assert `ensureSceneLoaded` called for each game key; flush async ticks before fade-out assertions
  - [ ] Run `CI=true pnpm test` — full suite passes (existing `navigation.test.ts` updated)
- [x] Task: Reduce `main.ts` to shell scenes only (dc31dd5)
  - [ ] Remove the 7 static game-scene imports; `scene` array becomes `[BootScene, PreloadScene, HubScene]`
  - [ ] Run `CI=true pnpm test` — full suite passes
- [x] Task: Verify build structure
  - [ ] `pnpm run build`; confirm `dist/assets/` contains entry + 7 game-scene chunks (AC1)
  - [ ] Grep entry chunk for game-scene class names — must be absent (AC2)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3: Validate PWA Precache & Offline Guarantee [checkpoint: aa6c8cb]

- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4: Quality Gates & Manual Verification [checkpoint: ecb6715]

- [x] Task: Run full quality gates: `pnpm run check` && `CI=true pnpm test` && `pnpm run build` (AC6)
  - Gate 1 `pnpm run check`: PASS (59 files, Biome)
  - Gate 2 `CI=true pnpm test`: 651 passed (22 files)
  - Gate 3 `pnpm run build`: PASS (19 precache entries)
  - Bonus Gate 4 `node scripts/validate-pwa.js`: 13/13 PASS (CI pipeline gate)
- [x] Task: Prepare manual verification plan (AC3/AC4): startup network tab shows no game-chunk fetches; tapping each of the 7 tiles loads its chunk and plays; offline mode still plays any game
  - Plan: (1) `pnpm exec vite preview` (serves `dist/`); (2) DevTools Network — startup must fetch only entry/shared chunks, no `*Scene-*.js` before any tile tap (AC3); (3) tap each tile → first tap fetches that game's chunk, game boots/plays/returns to Hub with stickers/audio/parental lock intact (AC4); (4) re-tap same game → no re-fetch; (5) after SW install, set Network to Offline → all games still play.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase: Review Fixes
- [x] Task: Apply review suggestions 0a6ecdb
