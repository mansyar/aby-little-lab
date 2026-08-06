<protect>
# Implementation Plan: Shape Sorter — Multi-Round Sessions & 18-Shape Variety

**Track ID:** `shape-sorter-rounds-variety_20260806`

---

## Phase 1: Shape & Cutout Asset Creation (24 new SVGs) [checkpoint: 204b36c]

- [x] Task: Read spec.md and workflow.md to refresh context before starting this phase 2678a79
- [x] Task: Author 12 new shape SVGs (512×512 viewBox, flat fill, 5px `#2D3748` stroke, assigned distinct colors) 849a9b2
    - [x] `shape_oval.svg` (`#63B3ED`)
    - [x] `shape_rectangle.svg` (`#48BB78`)
    - [x] `shape_diamond.svg` (`#ED64A6`)
    - [x] `shape_pentagon.svg` (`#B7791F`)
    - [x] `shape_hexagon.svg` (`#4C51BF`)
    - [x] `shape_octagon.svg` (`#D69E2E`)
    - [x] `shape_trapezoid.svg` (`#38B2AC`)
    - [x] `shape_semicircle.svg` (`#F56565`)
    - [x] `shape_arrow.svg` (`#9AE6B4`)
    - [x] `shape_plus.svg` (`#FBB6CE`)
    - [x] `shape_ring.svg` (`#A0AEC0`)
    - [x] `shape_teardrop.svg` (`#B2F5EA`)
- [x] Task: Author 12 cutout SVGs (same path data, `fill-opacity="0.3"` + `stroke-dasharray="12 8"`) 849a9b2
    - [x] `cutout_oval.svg`
    - [x] `cutout_rectangle.svg`
    - [x] `cutout_diamond.svg`
    - [x] `cutout_pentagon.svg`
    - [x] `cutout_hexagon.svg`
    - [x] `cutout_octagon.svg`
    - [x] `cutout_trapezoid.svg`
    - [x] `cutout_semicircle.svg`
    - [x] `cutout_arrow.svg`
    - [x] `cutout_plus.svg`
    - [x] `cutout_ring.svg`
    - [x] `cutout_teardrop.svg`
- [x] Task: Visual/style consistency check against the 6 existing pairs (stroke width, fill opacity, dash pattern, shape silhouette clarity) 849a9b2
- [ ] Task: Conductor - User Manual Verification 'Shape & Cutout Asset Creation' (Protocol in workflow.md)

---

## Phase 2: Pool Expansion & Playthrough Generation (TDD) [checkpoint: 9bd0645]

- [x] Task: Read spec.md and workflow.md to refresh context before starting this phase af519c9
- [x] Task: Write failing tests for playthrough generation in `shapeSorterLogic.test.ts` (Red) a471506
    - [x] Test `ALL_SHAPES` has exactly 18 entries including the 12 new shape types
    - [x] Test `generatePlaythrough(3)` returns 3 rounds × 3 shapes
    - [x] Test no shape repeats across a playthrough (9 unique per session)
    - [x] Test no duplicate shapes within a round
    - [x] Test all drawn shapes belong to `ALL_SHAPES`
    - [x] Test existing `selectThreeShapes` / `shuffle` / `isMatch` behavior unchanged
- [x] Task: Implement `generatePlaythrough(roundCount = 3)` and expand `ALL_SHAPES` to 18 (Green) a471506
- [x] Task: Verify coverage (>80%) and run `CI=true pnpm test` a471506
- [ ] Task: Conductor - User Manual Verification 'Pool Expansion & Playthrough Generation' (Protocol in workflow.md)

---

## Phase 3: Preload Wiring [checkpoint: 81ab2c3]

- [x] Task: Read spec.md and workflow.md to refresh context before starting this phase 888ef88
- [x] Task: Add 24 `?raw` imports + `SHAPE_ASSETS` entries in `PreloadScene.ts` (preload SVG count 118 → 142) 888ef88
- [x] Task: Verify production build + PWA validation (`pnpm run build` + `node scripts/validate-pwa.js`) 888ef88
- [ ] Task: Conductor - User Manual Verification 'Preload Wiring' (Protocol in workflow.md)

---

## Phase 4: Multi-Round Sessions & Progress Dots (TDD)

- [x] Task: Read spec.md and workflow.md to refresh context before starting this phase 888ef88
- [x] Task: Write failing scene tests in `src/__tests__/scenes/shapeSorterScene.test.ts` (Red), mirroring `wordMatchScene.test.ts` 405e669
    - [x] Test scene renders 3 progress dots on create (dimmed) 405e669
    - [x] Test placing all 3 shapes of round 1 advances to round 2 (first dot filled) 405e669
    - [x] Test round 2 rebuilds slots/shapes with fresh playthrough data (teardown of round 1 objects) 405e669
    - [x] Test win celebration + sticker award only after round 3 completes 405e669
    - [x] Test progress dot pops (scale 1 → 1.4 → 1, `Back.out`) on round completion 405e669
- [x] Task: Implement round state (`roundIndex`, `playthrough`), 3 progress dots, round teardown/re-init, completion gated to final round (Green) 405e669
- [x] Task: Regression — existing juice intact (drag lift/tilt, zone highlight, snap tween, silent floor bounce, mascot reactions, reduced-motion) via full suite `CI=true pnpm test` 405e669
- [ ] Task: Conductor - User Manual Verification 'Multi-Round Sessions & Progress Dots' (Protocol in workflow.md)

---

## Phase 5: Documentation & Review

- [x] Task: Read spec.md and workflow.md to refresh context before starting this phase 888ef88
- [ ] Task: Update docs — `docs/PRD.md` (Game 1: 18-shape pool, 3-round sessions, progress dots), `conductor/tech-stack.md` (preload count 118 → 142, pool expansion note), `docs/TDD.md` (shape list + session design)
- [ ] Task: Apply review suggestions for this track
- [ ] Task: Conductor - User Manual Verification 'Documentation & Review' (Protocol in workflow.md)
</protect>
