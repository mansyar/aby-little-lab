<protect>
# Track: Shape Sorter — Multi-Round Sessions & 18-Shape Variety

**Track ID:** `shape-sorter-rounds-variety_20260806`
**Type:** Feature
**Status:** New
**Created:** 2026-08-06

## Overview

Upgrade Game 1 (Shape Sorter) into **multi-round sessions** (3 rounds × 3 shapes = 9 placements) and expand the shape pool from 6 to **18 shapes** (12 new hand-authored geometric variants + 12 cutouts with 12 new distinct colors). Sessions draw **9 unique shapes** (no repeats across rounds), maximizing learning variety per playthrough. This closes Game 1's session-length gap versus newer games (Pattern Builder 5 rounds, Find the Word / How Many 6 rounds) and aligns it with the suite's established progress-dots design language.

## Scope

### In Scope

1. **24 new SVG assets (hand-authored)** — 12 shape SVGs + 12 cutout SVGs in `src/assets/svg/shapes/`, matching the existing style exactly: 512×512 viewBox, single path/primitive, flat fill, 4–6px `#2D3748` stroke; cutouts = same path with `fill-opacity="0.3"` + `stroke-dasharray="12 8"` (matching the 6 existing pairs).
2. **New shape set (geometric):** `oval, rectangle, diamond, pentagon, hexagon, octagon, trapezoid, semicircle, arrow, plus, ring, teardrop`.
3. **12 new distinct colors** (soft/vibrant non-primary, distinct from the existing 6 and each other): sky blue `#63B3ED`, green `#48BB78`, rose `#ED64A6`, golden brown `#B7791F`, indigo `#4C51BF`, amber `#D69E2E`, turquoise `#38B2AC`, coral `#F56565`, mint `#9AE6B4`, blush `#FBB6CE`, soft gray-blue `#A0AEC0`, aqua `#B2F5EA`.
4. **Logic (`src/game/shapeSorterLogic.ts`):** `ALL_SHAPES` expands 6 → 18. New `generatePlaythrough(roundCount = 3): ShapeType[][]` — per-round 3-shape draws with **no repeats across the playthrough** (9 unique per session). Existing `selectThreeShapes`, `shuffle`, `isMatch` retained unchanged.
5. **Scene (`src/scenes/ShapeSorterScene.ts`):** `ROUND_COUNT = 3`; 3 progress dots at top (dim → pop `1 → 1.4 → 1` `Back.out` on round completion, per PatternBuilder/HowMany pattern); round transition with teardown/re-init of shapes, slots, and drop zones; win celebration + sticker only after the **final** round; auto-return unchanged. All existing juice preserved: drag lift/tilt, drop-zone highlight, snap-to-slot tween, silent floor bounce, mascot reactions, reduced-motion awareness, parental lock.
6. **Preload (`src/scenes/PreloadScene.ts`):** 24 new `?raw` imports + `SHAPE_ASSETS` entries (preload SVG count 118 → 142).
7. **Tests:** extend `shapeSorterLogic.test.ts` (playthrough generation: 18-pool, 3×3, no cross-round repeats, no in-round duplicates, valid-set membership); new `src/__tests__/scenes/shapeSorterScene.test.ts` mirroring `wordMatchScene.test.ts` (round progression, completion only on round 3, progress dots, first-completion sticker).

### Out of Scope

- Difficulty scaling / round-count progression (difficulty stays fixed per PRD).
- Pattern Builder shape pool (owns a separate 6-shape map; intentionally unaffected).
- Hub, sticker art, audio, or settings changes.
- AI asset generation pipeline (hand-authored per Game 1 convention).

## Functional Requirements

### FR1 — Assets
- **FR1.1:** 12 new shape SVGs (`shape_<name>.svg`) at 512×512 viewBox, flat fill, 5px `#2D3748` stroke, each with its assigned distinct color.
- **FR1.2:** 12 new cutout SVGs (`cutout_<name>.svg`) — same path data, `fill-opacity="0.3"` + `stroke-dasharray="12 8"`.
- **FR1.3:** All shapes visually distinct by form (color-independent design preserved).

### FR2 — Logic
- **FR2.1:** `ALL_SHAPES` contains exactly 18 shape types (original 6 + 12 new).
- **FR2.2:** `generatePlaythrough(3)` returns 3 rounds × 3 shapes.
- **FR2.3:** No shape repeats across a playthrough (9 unique per session).
- **FR2.4:** No duplicate shapes within a round.
- **FR2.5:** Every drawn shape belongs to `ALL_SHAPES`.

### FR3 — Scene
- **FR3.1:** Round renders 3 slots (shuffled positions) + 3 shapes (independently shuffled).
- **FR3.2:** 3 progress dots at top, dimmed by default; dot fills with a `1 → 1.4 → 1` `Back.out` pop when its round completes.
- **FR3.3:** After the final placement of a non-final round: short delay, then teardown of the round's images/zones and re-init of the next round (fresh slots/shapes).
- **FR3.4:** Win animation + sticker award (first time only) + auto-return after 3s fire **only** after round 3.
- **FR3.5:** All existing drag/juice/mascot/reduced-motion/parental-lock behavior unchanged.

### FR4 — Preload
- **FR4.1:** All 24 new SVGs loaded and rasterized at 512px (`SHAPE_ASSETS` entries + raw imports).

## Non-Functional Requirements

- **NFR1:** `CI=true pnpm test` passes; >80% coverage on new code.
- **NFR2:** `pnpm run check` (Biome lint + format) passes.
- **NFR3:** `pnpm run build` succeeds; `node scripts/validate-pwa.js` passes.
- **NFR4:** 60fps during drag; no new audio; touch targets unchanged (128px shapes, 160px zones).
- **NFR5:** Reduced-motion respected for all new animations (progress dot pop via `motion.ts` helpers).

## Acceptance Criteria

- [ ] 18 shapes load; each session = 3 rounds × 3 shapes, 9 unique shapes per session.
- [ ] 3 progress dots fill with pop on round completion.
- [ ] Win + sticker fire only after round 3; replay does not re-award the sticker.
- [ ] All existing drag/juice/mascot behavior intact; reduced-motion respected.
- [ ] All tests pass; `pnpm run check` and `pnpm run build` pass.
</protect>
