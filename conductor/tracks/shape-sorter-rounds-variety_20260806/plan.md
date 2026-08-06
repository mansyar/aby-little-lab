<protect>
# Implementation Plan: Shape Sorter — Multi-Round Sessions & 18-Shape Variety

**Track ID:** `shape-sorter-rounds-variety_20260806`

---

## Phase 1: Shape & Cutout Asset Creation (24 new SVGs)

- [ ] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [ ] Task: Author 12 new shape SVGs (512×512 viewBox, flat fill, 5px `#2D3748` stroke, assigned distinct colors)
    - [ ] `shape_oval.svg` (`#63B3ED`)
    - [ ] `shape_rectangle.svg` (`#48BB78`)
    - [ ] `shape_diamond.svg` (`#ED64A6`)
    - [ ] `shape_pentagon.svg` (`#B7791F`)
    - [ ] `shape_hexagon.svg` (`#4C51BF`)
    - [ ] `shape_octagon.svg` (`#D69E2E`)
    - [ ] `shape_trapezoid.svg` (`#38B2AC`)
    - [ ] `shape_semicircle.svg` (`#F56565`)
    - [ ] `shape_arrow.svg` (`#9AE6B4`)
    - [ ] `shape_plus.svg` (`#FBB6CE`)
    - [ ] `shape_ring.svg` (`#A0AEC0`)
    - [ ] `shape_teardrop.svg` (`#B2F5EA`)
- [ ] Task: Author 12 cutout SVGs (same path data, `fill-opacity="0.3"` + `stroke-dasharray="12 8"`)
    - [ ] `cutout_oval.svg`
    - [ ] `cutout_rectangle.svg`
    - [ ] `cutout_diamond.svg`
    - [ ] `cutout_pentagon.svg`
    - [ ] `cutout_hexagon.svg`
    - [ ] `cutout_octagon.svg`
    - [ ] `cutout_trapezoid.svg`
    - [ ] `cutout_semicircle.svg`
    - [ ] `cutout_arrow.svg`
    - [ ] `cutout_plus.svg`
    - [ ] `cutout_ring.svg`
    - [ ] `cutout_teardrop.svg`
- [ ] Task: Visual/style consistency check against the 6 existing pairs (stroke width, fill opacity, dash pattern, shape silhouette clarity)
- [ ] Task: Conductor - User Manual Verification 'Shape & Cutout Asset Creation' (Protocol in workflow.md)

---

## Phase 2: Pool Expansion & Playthrough Generation (TDD)

- [ ] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [ ] Task: Write failing tests for playthrough generation in `shapeSorterLogic.test.ts` (Red)
    - [ ] Test `ALL_SHAPES` has exactly 18 entries including the 12 new shape types
    - [ ] Test `generatePlaythrough(3)` returns 3 rounds × 3 shapes
    - [ ] Test no shape repeats across a playthrough (9 unique per session)
    - [ ] Test no duplicate shapes within a round
    - [ ] Test all drawn shapes belong to `ALL_SHAPES`
    - [ ] Test existing `selectThreeShapes` / `shuffle` / `isMatch` behavior unchanged
- [ ] Task: Implement `generatePlaythrough(roundCount = 3)` and expand `ALL_SHAPES` to 18 (Green)
- [ ] Task: Verify coverage (>80%) and run `CI=true pnpm test`
- [ ] Task: Conductor - User Manual Verification 'Pool Expansion & Playthrough Generation' (Protocol in workflow.md)

---

## Phase 3: Preload Wiring

- [ ] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [ ] Task: Add 24 `?raw` imports + `SHAPE_ASSETS` entries in `PreloadScene.ts` (preload SVG count 118 → 142)
- [ ] Task: Verify production build + PWA validation (`pnpm run build` + `node scripts/validate-pwa.js`)
- [ ] Task: Conductor - User Manual Verification 'Preload Wiring' (Protocol in workflow.md)

---

## Phase 4: Multi-Round Sessions & Progress Dots (TDD)

- [ ] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [ ] Task: Write failing scene tests in `src/__tests__/scenes/shapeSorterScene.test.ts` (Red), mirroring `wordMatchScene.test.ts`
    - [ ] Test scene renders 3 progress dots on create (dimmed)
    - [ ] Test placing all 3 shapes of round 1 advances to round 2 (first dot filled)
    - [ ] Test round 2 rebuilds slots/shapes with fresh playthrough data (teardown of round 1 objects)
    - [ ] Test win celebration + sticker award only after round 3 completes
    - [ ] Test progress dot pops (scale 1 → 1.4 → 1, `Back.out`) on round completion
- [ ] Task: Implement round state (`roundIndex`, `playthrough`), 3 progress dots, round teardown/re-init, completion gated to final round (Green)
- [ ] Task: Regression — existing juice intact (drag lift/tilt, zone highlight, snap tween, silent floor bounce, mascot reactions, reduced-motion) via full suite `CI=true pnpm test`
- [ ] Task: Conductor - User Manual Verification 'Multi-Round Sessions & Progress Dots' (Protocol in workflow.md)

---

## Phase 5: Documentation & Review

- [ ] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [ ] Task: Update docs — `docs/PRD.md` (Game 1: 18-shape pool, 3-round sessions, progress dots), `conductor/tech-stack.md` (preload count 118 → 142, pool expansion note), `docs/TDD.md` (shape list + session design)
- [ ] Task: Apply review suggestions for this track
- [ ] Task: Conductor - User Manual Verification 'Documentation & Review' (Protocol in workflow.md)
</protect>
