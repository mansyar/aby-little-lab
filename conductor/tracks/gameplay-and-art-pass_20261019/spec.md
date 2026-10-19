# Specification: Gameplay Hitbox Fixes + Art Readability Pass

**Track type:** bug fix + art polish (mixed)
**Branch:** `feature/gameplay-and-art-pass` (cut from `origin/master` @ `6eedfb2`)

## Overview

Three confirmed gameplay defects from manual smoke, plus the findings of a full
audit of all 170 SVGs. Combined into one track by product decision; the art work
is limited to the assets that actively fail to read, plus the documentation that
let the drift happen.

## Gameplay defects (code-verified)

### G1 — Memory Match cards render at 256 px inside a 120–150 px grid

`renderRound()` calls `.setDisplaySize(size, size)` on `card_back` (a 256 px
raster), then `part.setScale(0)`, then tweens `scaleX/scaleY` to **1**. That
discards the display scale.

- Easy: card 150, pitch 168 → renders 256 → **88 px overlap**.
- Medium: 132 / pitch 150 → 256 → 106 px overlap.
- Hard: 120 / pitch 138 → 256 → 118 px overlap.
- `flipCard()` repeats the bug: collapses to `scaleX: 0`, grows back to **1**.

Fix: capture each part's post-`setDisplaySize` scale and tween deal and
flip-back to that value, never to 1.

### G2 — Number Order hit area is shifted one half-card up-left

`createCard()` does `container.setSize(140,160)` then
`hitArea: Rectangle(-70,-80,140,160)`. Phaser adds `displayOrigin` (= 70,80)
before testing, so the live hit region is `[x-140,x] × [y-160,y]` instead of
`[x-70,x+70] × [y-80,y+80]`.

Fix: `Rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT)`, exactly as
`product-guidelines.md` §5 and `src/__tests__/helpers/hitTest.ts` already
document.

### G3 — Snap tween overshoots the slot

`snapToSlot()` uses `Back.out`. Number Order travels 260 px (source y=260 →
slot y=520); ~10 % overshoot puts the card ~26 px below the slot mid-tween,
which is what the screenshot caught. Shared by Shape Sorter, Shadow Match,
Big vs. Small and Number Order.

Decision: switch the shared helper to `Cubic.out` (all four games).

## Art findings in scope

| Asset | Problem | Direction |
|---|---|---|
| `animals/cat.svg` | Same face template as rabbit (identical nose triangle, smile curve, eye spacing); leaf-shaped ears read as rabbit ears | Full redraw: brown tabby, triangular ears, wide low face, cheek-pad muzzle, W mouth, whiskers, forehead M stripes, slit pupils |
| `items/bone.svg` | Fill `#FFF8E7` on white cards → reads as a hollow outline; prompt image for "BONE" | Tan fill + top highlight, keep the 6 px outline |
| `items/ball.svg` | Soccer pentagons on red; at 96 px the white patches read as stickers | Beach-ball segments (alternating warm/cream) |
| `items/map.svg` | Two green islands + route + orange island form a face (eyes + smile); prompt image for "MAP" | Asymmetric islands, S-curve route, X marker + compass rose |
| `ui/tiles/tile_pop_freeze.svg` | Pale disc with short rays reads as sun/snowball | Add a snowflake and frost rim |
| `animals/monkey.svg` | Brown like the dog, no distinct muzzle; both can appear in Odd One Out band 2 | Add a light face patch + protruding muzzle |

## Functional requirements

- **FR1** Memory Match: at every band, `card_back` and face occupy exactly their
  tile; deal and flip preserve display scale; no overlap at any grid.
- **FR2** Number Order: the hit region equals the visible card bounds; tapping
  inside starts a drag, tapping outside does not.
- **FR3** `snapToSlot` never overshoots the slot center; the reduced-motion path
  is unchanged.
- **FR4** Cat redraw uses only flat fills, `#2D3748` outlines at 4–6 px, 512
  viewBox, no filters/gradients; same texture key `animal_cat`; renders in all
  six consumers (Animal Trace, Pop & Freeze, Memory Match, Odd One Out, Word
  Match "CAT", profile avatar).
- **FR5** The five other assets are fixed as described, with no key or manifest
  changes.
- **FR6** `docs/svg-style.md` records: 512 grid + 8 px margin, outline weights
  (6 outer / 4 inner / 3 detail), canonical palette tokens, the "must read at
  96 px" rule, and the full asset inventory.
- **FR7** All 11 committed contact sheets are regenerated from current sources
  and committed.
- **FR8** Regression tests: Memory Match tween targets, Number Order hit math via
  `tapHits`, `snapToSlot` easing. Art verified visually (no unit tests for
  pixels).

## Non-functional requirements

- No game-rule, difficulty, scoring or audio changes.
- No new dependencies; no asset-key renames.
- Suite stays green at ≥ 2,002 tests; `pnpm run check`, `pnpm typecheck`,
  `CI=true pnpm test --testTimeout=30000`, `pnpm run build`, `validate-bundle`,
  `validate-pwa`, `validate-boot` all pass.
- 60 fps unaffected: no extra per-frame objects; the deal adds at most two extra
  tweens per card.

## Acceptance criteria

1. Memory Match: no card overlaps another at easy/medium/hard; `card_back` fills
   its tile; flipping never changes card size.
2. Number Order: `tapHits` confirms center-inside hit, 1 px outside miss, and the
   hit region centred on the card at `(70,80)` display origin.
3. A snap tween's endpoint equals the slot position and its ease is `Cubic.out`.
4. Blind check: a rendered 96 px cat is identified as a **cat** (not rabbit/fox)
   by the vision check, and is clearly distinct from rabbit and fox in a
   side-by-side sheet.
5. bone/ball/map/tile_pop_freeze/monkey are visibly improved in the regenerated
   sheets.
6. `docs/svg-style.md` exists and the committed sheets show items 23, shapes 36,
   stickers 20, tiles 20, ui 11.
7. All gates pass.

## Out of scope

- Game rules, difficulty, scoring, voice, audio.
- Removing the two unused arrow textures; renaming keys.
- Bulk recoloring of all 170 assets (palette tokens are documented; only touched
  assets are corrected).
- Other audit notes that read fine in context (lilypad notch, duck, frog
  variants, `tile_decode_it` colour count).

## Baseline facts

- 170 SVGs, all `viewBox="0 0 512 512"`, all loaded by `PreloadScene`, no orphans.
- 51 distinct hex colours; core palette is coherent, 17 colours used ≤ 2×.
- 31 distinct stroke widths; canonical 3/4/5/6 covers 465 of ~700 stroke ops.
- Committed contact sheets stale for 6 of 11 categories: items 19/23, shapes
  18/36, stickers 11/20, tiles 11/20, ui 5/11.
