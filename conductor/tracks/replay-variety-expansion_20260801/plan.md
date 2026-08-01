# Implementation Plan — Replay Variety Expansion

## Phase 1: New SVG Assets [checkpoint: d72b501]

- [x] Task: Author Shape Sorter assets — `shape_heart.svg`, `cutout_heart.svg`, `shape_crescent.svg`, `cutout_crescent.svg` (512×512 viewBox, flat fills, 4–6px `#2D3748` strokes; heart `#E53E3E`, crescent `#ECC94B`) [f837be5]
- [x] Task: Author Animal Trace assets — `elephant.svg`, `pig.svg`, `peanut.svg`, `apple.svg` [f837be5]
- [x] Task: Author Shadow Match assets — `airplane.svg`, `mushroom.svg`, `shadow_airplane.svg`, `shadow_mushroom.svg` (shadow = derived dark `#2D3748` silhouettes) [f837be5]
- [x] Task: Author Big vs. Small assets — `toy_rocket.svg` (`#3182CE`), `toy_drum.svg` (`#ECC94B`) [f837be5]
- [x] Task: Verify asset consistency — every new SVG matches storybook style, tight bounding box, and existing asset conventions [f837be5]
- [ ] Task: Phase Verification & Checkpoint (refer to workflow.md)

## Phase 2: Game Logic Expansion (TDD) [checkpoint: a67e09f]

- [x] Task: Expand `shapeSorterLogic` pools [TDD] [ccfd4fe]
  - [ ] Write failing tests: `ShapeType` includes heart/crescent; selection returns 3 of 6 with only valid types
  - [ ] Implement: extend `ShapeType` and `ALL_SHAPES`
  - [ ] Run tests (red → green), verify coverage
  - [ ] Commit with git note + plan update
- [x] Task: Expand `animalTraceLogic` pairs [TDD] [ccfd4fe]
  - [ ] Write failing tests: pair pool = 6; selection 3 of 6; new pairs (elephant→peanut, pig→apple) valid
  - [ ] Implement: extend `AnimalType`, `FoodType`, `PAIRS`
  - [ ] Run tests (red → green), verify coverage
  - [ ] Commit with git note + plan update
- [x] Task: Expand `shadowMatchLogic` objects + round selection [TDD] [ccfd4fe]
  - [ ] Write failing tests: `ObjectType` includes airplane/mushroom; round selects exactly 6 of 8, no duplicates
  - [ ] Implement: extend `ObjectType`/`ALL_OBJECTS`; add 6-of-8 round selection
  - [ ] Run tests (red → green), verify coverage
  - [ ] Commit with git note + plan update
- [x] Task: Expand `bigSmallLogic` toys [TDD] [ccfd4fe]
  - [ ] Write failing tests: `ToyType` includes rocket/drum; selection 3 of 6
  - [ ] Implement: extend `ToyType`/`ALL_TOYS`
  - [ ] Run tests (red → green), verify coverage
  - [ ] Commit with git note + plan update
- [x] Task: Expand `popFreezeLogic` decoy pool [TDD] [ccfd4fe]
  - [ ] Write failing tests: `ALL_ANIMALS` includes elephant/pig; decoy selection uses all 6
  - [ ] Implement: extend `AnimalType`/`ALL_ANIMALS`
  - [ ] Run tests (red → green), verify coverage
  - [ ] Commit with git note + plan update
- [ ] Task: Phase Verification & Checkpoint (refer to workflow.md)

## Phase 3: Scene & Preload Wiring [checkpoint: d06d344]

- [x] Task: PreloadScene — load the 14 new assets at 512×512 (verify no 404s; add/extend load tests where applicable) [9cd626d]
- [x] Task: ShapeSorterScene — consume expanded shape pool (no layout/mechanics changes) [9cd626d]
- [x] Task: AnimalTraceScene — consume expanded pair pool (no layout/mechanics changes) [9cd626d]
- [x] Task: ShadowMatchScene — consume 6-of-8 round selection (6-slot layout unchanged) [9cd626d]
- [x] Task: BigSmallScene — consume expanded toy pool (no layout/mechanics changes) [9cd626d]
- [x] Task: PopFreezeScene — decoys can render the 2 new animals (preload already covered) [9cd626d]
- [ ] Task: Phase Verification & Checkpoint (refer to workflow.md)

## Phase 4: Documentation

- [ ] Task: Update `docs/PRD.md` — SVG requirements, item/color tables for all four games + Pop & Freeze decoy pool
- [ ] Task: Update `docs/TDD.md` — asset manifest additions
- [ ] Task: Update `conductor/tech-stack.md` — asset structure notes
- [ ] Task: Update `README.md` — game description/variety notes
- [ ] Task: Phase Verification & Checkpoint (refer to workflow.md)

## Phase 5: Final Quality & Review

- [ ] Task: Full regression — `pnpm run check`, `CI=true pnpm test` (all 555+ tests), coverage >80%, `pnpm run build`
- [ ] Task: Apply review suggestions (conductor-review pass)
- [ ] Task: Final Phase Verification & Checkpoint (refer to workflow.md)
