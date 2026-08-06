# Spec — SVG Visual Polish: Full Asset Library

**Track:** `svg-visual-polish_20260806` | **Type:** Chore

## Overview

Polish **all 142 SVG assets** in `src/assets/svg/` to a consistent "Storybook Flat" quality bar (product-guidelines §2: flat fills, thick `#2D3748` outlines, no gradients/shadows/3D, soft vibrant palette, 512×512 viewBox). The current library is functional but inconsistent: several assets are unrecognizable (elephant, bone, lilypad, peanut, hat, airplane silhouette), two categories (letters, numbers) are plain system-font text instead of custom letterforms, one asset has a logic error (rocket flames at top), one shape is broken (crescent), and the sticker/tile reward sets have placeholder-grade compositions.

## Background (visual audit findings)

All 142 SVGs were rasterized to contact sheets and reviewed visually. Category-by-category findings:

| Category | Score | Key problems |
|---|---|---|
| Shapes (18) | 7/10 | **Crescent is broken** (thin curve, no fill body); ring is dull gray (off-palette); pentagon muddy brown; rectangle undersized vs square; plus has low visual mass. Reference bar: heart, star, teardrop, diamond, triangle. |
| Cutouts (18) | 6/10 | Same crescent/rectangle/pentagon bugs as shapes (must be fixed in lockstep — matched pairs); dash pattern slightly tight. |
| Letters (26) | 3/10 | **System-font `<text>` glyphs (Arial), not custom paths**; no thick outline; single flat blue; `I`/`J`/`Q` weak. |
| Numbers (10) | 3/10 | Same font problem; `1` is a bare stroke, `4` closed-top reads ambiguously, `7` has no character. |
| Animals (9) | 5.5/10 | **Elephant unrecognizable** (gray sphere); **pig is a pink blob** with a random white cheek circle and horn-like ears; frog eyes too small/high; cat ears too fox-like. Reference bar: dog, monkey, rabbit. |
| Toys (7) | 6/10 | **`toy_rocket` flames at the TOP** (inverted bug); `toy_block` is actually a closed book; drum reads as tin can; toy_box reads as barrel; car wheels small. Reference bar: teddy_bear, toy_ball, toy_car. |
| Items (19) | 4.5/10 | Bone = barbell; lilypad = pacman; peanut = deflated blob; hat = hamburger/flying saucer; airplane = stacked discs (no tail fin); umbrella has a line through the canopy + unclear handle; `ball`/`car` duplicate toy counterparts with inconsistent line work. Reference bar: apple, bug, duck, fish, house, mushroom, sun, tree. |
| Shadows (8) | 5/10 | Airplane silhouette unrecognizable; umbrella handle needle-thin; boat hull too thin; visual weight varies across set. Reference bar: house, car, tree, mushroom. |
| UI (5) | 6.5/10 | `bubble` has **no dark outline** (breaks the style system) and no highlights; `sleep_zzz` is a black zigzag; `icon_speaker` arcs float + inconsistent weight. Reference bar: mascot_idle, mascot_celebrate. |
| Stickers (11) | 5/10 | pop_freeze/big_small/how_many placeholder-grade; animal_trace & pattern_builder off-center with unreadable metaphors; ABC/DOG/CAT text stickers are visually identical (no differentiation); dashed "placeholder" motif reads as debug artifact. Reference bar: sticker_musical_memory. |
| Tiles (11) | 4.5/10 | **`tile_pop_freeze` shows "Z" — reads as sleep, contradicts "pop"**; animal_trace scattered/tiny; word_builder looks like a broken half-built asset; shadow_match shows no shadow concept; big_small has unexplained baseline; musical_memory notes are malformed (font glitch); icon mass inconsistent. Reference bar: tile_word_match. |

## Functional Requirements

1. **FR-1 (Full coverage):** All 142 SVGs in `src/assets/svg/**` polished in place. No asset is left in its audited-broken state.
2. **FR-2 (Letters & numbers):** Replace font-based `<text>` elements with **custom-drawn path letterforms/numerals**: chunky, round-capped strokes; thick `#2D3748` outline; per-glyph color rotation across the soft/vibrant palette; optical size equalization (`I`, `J`, `L`, `1` must not look tiny). Numerals: `1` gets base + flag, `4` open-top, `7` slightly curved.
3. **FR-3 (Error fixes):** Fix the broken crescent (shape + cutout, in lockstep), the inverted rocket flames, and the unrecognizable silhouettes (elephant, bone, lilypad, peanut, hat, shadow_airplane). Replace the sleep-"Z" in `tile_pop_freeze` with a popping/burst concept.
4. **FR-4 (Style system):** Outlines `#2D3748`, 4–6px at 512 base; flat fills only; palette per product.md §7 (no gradients, no neon, no pure RGB primaries). Shape↔cutout pairs keep matching hues (solid + pastel).
5. **FR-5 (Filename stability):** **No file renames or deletions.** Every SVG is wired by file name to a texture key in `PreloadScene.ts` (e.g., `letter_a`, `toy_block`, `numeral_3`). Redesign in place; `toy_block` becomes a real block while keeping its name.
6. **FR-6 (Readability):** Tiles must read at ~48px; stickers must read as thumbnails; letters/numerals must read at in-game display sizes (~128–200px). Silhouette-first rule: every asset recognizable in solid black.
7. **FR-7 (Code untouched):** No `.ts` source changes required. If an SVG change reveals a code dependency issue, STOP and document (workflow step 7).

## Non-Functional Requirements

- TDD is impractical for pure asset work → verification is: existing test suite stays green, `biome check` passes, production build succeeds, plus per-phase contact-sheet visual review.
- Consistency: a written style spec (`docs/SVG_STYLE.md`) anchors colors, stroke weights, letterform construction, and per-category composition rules so the 142 files look like one library, not eleven authors.
- Accessibility: color never the sole differentiator (letters/numbers/shapes remain distinct by form); no animated/flashing content introduced.

## Acceptance Criteria

- Re-rendered contact sheets show no broken glyphs/paths; all audited issues from the table above resolved.
- Letters/numbers are custom-drawn paths (no `<text>`), outlined, palette-rotated, optically sized.
- `CI=true npm test`, `npm run check`, and `npm run build` all pass with zero source-code changes.
- Reference-quality assets (mascots, heart/star shapes, `tile_word_match`, `sticker_musical_memory`) remain the quality bar and are matched by the rest of the library.
- Manual verification plan produced for the human reviewer (contact-sheet review + `npm run dev` visual pass through Hub and one game per category).

## Out of Scope

- No new SVG categories or new files; no file renames/deletions.
- No gameplay logic, scene code, or test code changes.
- No style-direction change (remains Storybook Flat — no gradients, 3D, or neon).
- No new rasterization pipeline changes (`SVG_RASTER_SIZE` and texture keys stay as-is).
