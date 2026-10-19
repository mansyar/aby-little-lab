# Implementation Plan: Gameplay Hitbox Fixes + Art Readability Pass

## Phase 1 — Memory Match card scale [checkpoint: 78dce15]

- [x] Task: Write failing tests for display-scale preservation *(d56b7b6)*
    - [x] Deal tween ends at each part's post-`setDisplaySize` scale: rect 1, `card_back` `size / 256`, face `size * ITEM_FILL / 256`
    - [x] Flip-back restores the same per-part scale, never 1 for an image part
    - [x] Cover all three bands (150 / 132 / 120)
- [x] Task: Implement scale capture and per-part tween targets in `renderRound()` and `flipCard()` *(3dbb5bc)*
- [x] Task: Verify the targeted Memory Match suite is green and `pnpm typecheck` is clean
- [x] Task: Commit (`fix(memory-match): preserve card display scale through deal and flip`) *(3dbb5bc)*
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Number Order hit area + snap easing

- [x] Task: Write failing hit-area tests using `src/__tests__/helpers/hitTest.ts` *(3107dc1)*
    - [x] A tap at the container centre hits
    - [x] A tap 1 px outside the visible card misses
    - [x] A tap in the old up-left quadrant (e.g. `x-100, y-100`) misses
- [x] Task: Write a failing test asserting `snapToSlot` uses `Cubic.out` and targets the slot position *(3107dc1)*
- [x] Task: Fix the hit area to `Rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT)` *(b3e13c8)*
- [x] Task: Change `snapToSlot` to `Cubic.out` and update its doc comment (shared by Shape Sorter, Shadow Match, Big vs. Small, Number Order) *(b3e13c8)*
- [x] Task: Verify the Number Order and `dragJuice` suites are green and `pnpm typecheck` is clean
- [x] Task: Commit (`fix(number-order): align the card hit area and stop the snap overshoot`) *(b3e13c8)*
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Cat head redraw

- [ ] Task: Collect a cat-face reference and write the silhouette checklist (triangular ears, wide low head, cheek-pad muzzle, W mouth, whiskers, forehead M, slit pupils)
    - [ ] Render the reference beside the current rabbit and fox at 96 px for comparison
- [ ] Task: Redraw `animals/cat.svg`
    - [ ] Brown tabby palette with `#2D3748` outlines at 6 / 4 / 3
    - [ ] Head wider than tall; sharp triangular ears; stripes and whiskers
- [ ] Task: Verify the redraw at 56 / 96 / 160 / 256 px
    - [ ] Blind identification: the vision check answers "cat"
    - [ ] Side-by-side with rabbit and fox shows no shared silhouette
    - [ ] All six consumers still load `animal_cat`
- [ ] Task: Commit (`feat(art): redraw the cat head so it reads as a cat`)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Remaining art assets

- [ ] Task: Fix `items/bone.svg` contrast (tan fill + top highlight, keep the 6 px outline)
- [ ] Task: Redraw `items/ball.svg` as a beach ball (alternating segments)
- [ ] Task: Rework `items/map.svg` to remove the face pareidolia (asymmetric islands, S-curve route, X + compass)
- [ ] Task: Add a freeze cue to `ui/tiles/tile_pop_freeze.svg` (snowflake + frost rim)
- [ ] Task: Differentiate `animals/monkey.svg` with a light face patch and a protruding muzzle
- [ ] Task: Render a working contact sheet and verify each asset at 96 px
- [ ] Task: Commit (`fix(art): improve readability of bone, ball, map, tile and monkey`)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5 — Style guide + contact sheets

- [ ] Task: Write `docs/svg-style.md` (512 grid, 8 px margin, 6/4/3 outline weights, palette tokens, 96 px rule, asset inventory)
- [ ] Task: Regenerate all 11 sheets with `node scripts/render-svg-contact-sheets.mjs --png`
- [ ] Task: Verify the counts (items 23, shapes 36, stickers 20, tiles 20, ui 11) and that the changed assets appear
- [ ] Task: Commit (`docs(art): add the SVG style guide and refresh contact sheets`)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 6 — Gates and manual smoke

- [ ] Task: Run all gates: `pnpm run check`, `pnpm typecheck`, `CI=true pnpm test --testTimeout=30000`, `pnpm run build`, `validate-bundle`, `validate-pwa`, `validate-boot`
- [ ] Task: Manual smoke on the dev server: Memory Match all three bands, Number Order drag/drop, cat in Animal Trace / Pop & Freeze / Memory Match / Odd One Out / Word Match, profile avatar
- [ ] Task: Fix any fallout and commit
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

---

## Progress Notes

- Track created 2026-10-19 on branch `feature/gameplay-and-art-pass` off
  `origin/master` (`6eedfb2`).
- Baseline: 94 test files / 2,002 tests (last archived run).
- Audit source: fresh renders of all 170 SVGs; the committed sheets are stale for
  items, shapes, stickers, tiles and ui.
- Art tasks are exempt from TDD per `workflow.md` step 3 (visual changes);
  verification is render + blind identification + side-by-side review.
- Environment note: this machine is CPU-loaded during passes; full-suite runs can
  report unrelated 5 s timeouts. Use `--testTimeout=30000` and re-run a timed-out
  file alone before calling it a regression.
