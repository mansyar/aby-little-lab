# Implementation Plan — Game 7: Pattern Builder

## Phase 1: Pattern Generation Logic (TDD) [checkpoint: b8d3c91]

- [x] Task: Add `pattern-builder` GameId and round types (`PatternType`, `GapPosition`, `PatternRound`) [TDD] [ff2a1c0]
  - [ ] Write failing tests: `GameId` includes `pattern-builder`; round types constrain pattern type, gap, shapes
  - [ ] Implement: extend `src/types/index.ts`
  - [ ] Run tests (red → green), verify coverage
  - [ ] Commit with git note + plan update
- [x] Task: Implement `patternBuilderLogic.ts` — round generation [TDD] [4a061ce]
  - [ ] Write failing tests: `generateRound()` returns a valid ABAB/AABB/ABB row of 4; two distinct pattern elements; gap at end or middle; correct answer present; 3 unique choices (correct + 2 distinct distractors) drawn from the 6-shape pool
  - [ ] Implement: `generateRound()` reusing `ALL_SHAPES`
  - [ ] Run tests (red → green), verify coverage
  - [ ] Commit with git note + plan update
- [x] Task: Replay-variety playthrough generation [TDD] [6b08a82]
  - [ ] Write failing tests: `generatePlaythrough(5)` mixes pattern types, shape pairs, gap positions, and distractor sets across rounds; difficulty fixed
  - [ ] Implement: playthrough generator
  - [ ] Run tests (red → green), verify coverage
  - [ ] Commit with git note + plan update
- [ ] Task: Phase Verification & Checkpoint (refer to workflow.md)

## Phase 2: PatternBuilderScene [checkpoint: 54600fd]

- [x] Task: Scaffold `PatternBuilderScene.ts` — layout & rendering [da54447]
  - [x] 4 slots (3 shapes + marked empty gap), 3 answer cards, progress dots, parental-lock Back button (96×96 hit area), mascot corner
  - [x] Reuse sceneTransitions, pressFeedback, ParentLock, `createCornerMascot`
- [x] Task: Round interaction [TDD where applicable] [da54447]
  - [x] Correct tap: shape snaps into gap with `Back.out` settle + chime, progress dot fills, next round
  - [x] Incorrect tap: card wiggles gently + soft incorrect tone, no penalty, no progression loss
  - [x] Reduced-motion variants for all tweens
- [x] Task: Win flow — after 5 rounds: shared completion effect, sticker award (first completion only), auto-return to Hub with `justEarned` data [da54447]
- [x] Task: Scene tests — navigation (hub ↔ game, completion → hub), tap correctness/incorrectness, sticker handoff [44802ee]
- [ ] Task: Phase Verification & Checkpoint (refer to workflow.md)

## Phase 3: Integration & Assets [checkpoint: 83c3a40]

- [x] Task: Author `sticker_pattern_builder.svg` (512×512 viewBox, storybook style, matches sticker conventions) [8e8200d]
- [x] Task: PreloadScene — load the new sticker (shapes already loaded) [73deb24]
- [x] Task: HubScene — 7th tile + label, sticker shelf slot, entrance/idle config, press feedback [73deb24]
- [x] Task: Storage/types — `pattern-builder` in `GameId`; storage tests for sticker persistence [ff2a1c0]
- [x] Task: Verify mascot + cross-cutting systems in the new scene (cheer/nod/win paths) [6f75fe5]
- [ ] Task: Phase Verification & Checkpoint (refer to workflow.md)

## Phase 4: Documentation & Release Sync [checkpoint: 5d6134e]

- [x] Task: Update `conductor/product.md` — 7-game table, cross-game system references [7cb0f80]
- [x] Task: Update `docs/PRD.md` and `docs/TDD.md` — game 7 requirements, scene count, asset manifest [d0f894e]
- [x] Task: Update `conductor/tech-stack.md` — scenes 8→9, game IDs, structure tree [7cb0f80]
- [x] Task: Update `README.md` — 7th game row, sticker count, test count [d0f894e]
- [x] Task: Update `docs/release-checklist.md` — "six" → "seven" references [d0f894e]
- [ ] Task: Phase Verification & Checkpoint (refer to workflow.md)

## Phase 5: Final Quality & Review [checkpoint: 2cba0cf]

- [x] Task: Full regression — `pnpm run check`, `CI=true pnpm test`, coverage >80%, `pnpm run build`, `node scripts/validate-pwa.js` [257f27b, re-verified at checkpoint]
- [x] Task: Apply review suggestions (conductor-review pass) — destroy snapped card shape + regression test [257f27b]
- [ ] Task: Final Phase Verification & Checkpoint (refer to workflow.md)

**Post-checkpoint fix (found during manual verification):** `load()` returned raw parsed JSON, crashing `hasSticker` in `HubScene.create` for players with a save from before Game 7 shipped (missing `pattern-builder` sticker key). Fixed in [6624e49] by merging saved data over defaults per key; regression test added (592 total tests).
