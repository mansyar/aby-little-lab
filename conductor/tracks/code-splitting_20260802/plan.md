# Plan: Bundle Code Splitting — Lazy-Load Game Scenes

**Track ID:** `code-splitting_20260802`
**Type:** Chore (Performance)

## Phase 1: Verify Phaser 4 Lazy-Scene Support

- [ ] Task: Confirm Phaser 4.2.1 supports lazy scene loading via dynamic-import functions in the `scene` array (check Phaser 4 docs + type definitions in `node_modules/phaser`)
- [ ] Task: Document the exact supported syntax in the task summary (pattern to use in `main.ts`)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2: Implement Lazy Scene Loading (TDD)

- [ ] Task: Create testable scene registry module `src/sceneRegistry.ts`
  - [ ] Write failing tests `src/__tests__/scenes/sceneRegistry.test.ts`: shell scenes (Boot/Preload/Hub) are static classes; the 7 game scenes are lazy loader functions returning promises; registry has exactly 10 entries
  - [ ] Implement `sceneRegistry.ts` exporting the scene array (static shell + lazy game loaders)
  - [ ] Run tests — confirm green (TDD: tests written before implementation)
- [ ] Task: Wire registry into `src/main.ts`
  - [ ] Remove the 7 static game-scene imports; consume `sceneRegistry` in the Phaser config
  - [ ] Run `CI=true pnpm test` — full suite passes (existing `navigation.test.ts` unaffected)
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
