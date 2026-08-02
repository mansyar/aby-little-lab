# Plan: Bundle Code Splitting — Lazy-Load Game Scenes

**Track ID:** `code-splitting_20260802`
**Type:** Chore (Performance)

## Phase 1: Verify Phaser 4 Lazy-Scene Support [checkpoint: a13a5db]

- [x] Task: Confirm Phaser 4.2.1 supports lazy scene loading via dynamic-import functions in the `scene` array (check Phaser 4 docs + type definitions in `node_modules/phaser`)
  - **Finding:** NOT supported. `SceneType` includes `Function`, but `SceneManager.createSceneFromFunction` calls `new scene()` synchronously — no promise/await handling exists in `SceneManager.js` (Phaser 4.2.1).
- [x] Task: Document the exact supported syntax in the task summary (pattern to use in `main.ts`)
  - **Pattern:** Runtime registration — `await import()` the scene module, then `scene.add(key, SceneClass)` before `scene.start(key)`. Documented in `spec.md` + `tech-stack.md` (dated deviation notes).
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2: Implement Lazy Scene Loading (TDD)

- [ ] Task: Create testable scene registry module `src/scenes/sceneRegistry.ts`
  - [ ] Write failing tests `src/__tests__/scenes/sceneRegistry.test.ts`: `sceneLoaders` maps exactly the 7 game keys (ShapeSorter, AnimalTrace, PopFreeze, ShadowMatch, MusicalMemory, BigSmall, PatternBuilder); `ensureSceneLoaded` skips the loader when the scene is already registered; `ensureSceneLoaded` resolves the loader and calls `scene.add(key, cls)` when not registered
  - [ ] Implement `sceneRegistry.ts` (per-key dynamic-import loaders + `ensureSceneLoaded`)
  - [ ] Run tests — confirm green (TDD: tests written before implementation)
- [ ] Task: Wire lazy loading into HubScene tile taps
  - [ ] Update `HubScene.ts` tile pointerup handler: `startAudio()` then `void ensureSceneLoaded(this, key).then(() => transitionToScene(this, key))`
  - [ ] Update `navigation.test.ts`: mock `../../scenes/sceneRegistry`; assert `ensureSceneLoaded` called for each game key; flush async ticks before fade-out assertions
  - [ ] Run `CI=true pnpm test` — full suite passes (existing `navigation.test.ts` updated)
- [ ] Task: Reduce `main.ts` to shell scenes only
  - [ ] Remove the 7 static game-scene imports; `scene` array becomes `[BootScene, PreloadScene, HubScene]`
  - [ ] Run `CI=true pnpm test` — full suite passes
- [ ] Task: Verify build structure
  - [ ] `pnpm run build`; confirm `dist/assets/` contains entry + 7 game-scene chunks (AC1)
  - [ ] Grep entry chunk for game-scene class names — must be absent (AC2)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3: Validate PWA Precache & Offline Guarantee

- [ ] Task: Inspect generated `dist/sw.js` — precache manifest includes all new chunks (AC5)
- [ ] Task: Confirm no changes to `vite.config.ts` PWA options are needed (default `globPatterns` covers emitted chunks)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4: Quality Gates & Manual Verification

- [ ] Task: Run full quality gates: `pnpm run check` && `CI=true pnpm test` && `pnpm run build` (AC6)
- [ ] Task: Prepare manual verification plan (AC3/AC4): startup network tab shows no game-chunk fetches; tapping each of the 7 tiles loads its chunk and plays; offline mode still plays any game
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
