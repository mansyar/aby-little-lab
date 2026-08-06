# SVG Style Spec — Aby's Little Lab

**Purpose:** Single source of truth for the visual quality bar of every asset in `src/assets/svg/`. All 142 SVGs must conform to the rules below so the library reads as one consistent set. Style system: **Storybook Flat** (see `conductor/product-guidelines.md` §2).

**Canvas contract:** Every SVG is 512×512 viewBox, rasterized at 512px by the game (`SVG_RASTER_SIZE` in `PreloadScene.ts`). **Never rename or delete files** — filenames are texture keys.

---

## 1. Core Style Rules

| Rule | Spec |
|---|---|
| **Fills** | Flat, solid colors only. **No gradients, no 3D, no shadows** (the `shadows/` set is the one exception — it IS the shadow). |
| **Outlines** | `#2D3748`, 4–6px wide at 512 base. Every hero element carries the dark outline. Outline is the primary style signal — assets without it look broken (see old `bubble`). |
| **Palette** | Soft vibrant hues (below). Never neon, never pure RGB primaries, never muddy/dark desaturated fills. |
| **Background** | Transparent unless an asset is inherently a badge/tile (stickers, tiles), which use cream `#FFF8E7`. |
| **Silhouette-first** | Every asset must be **recognizable as a solid `#2D3748` silhouette**. If it fails this test, the composition is wrong. |
| **Color independence** | Color is never the sole differentiator (letter shapes, animal variants must differ by form too). |
| **Min element size** | No design element smaller than ~10% of canvas (≈50px @512). Tiny details disappear after rasterization. |
| **Targeting** | Assets are seen by 3–5 year-olds at small sizes: tiles at ~48px, stickers as thumbnails, game pieces at ~128–200px. Composition must survive downscaling. |

## 2. Color Palette

Brand anchors (from product.md §7):
- Outline `#2D3748` · Cream bg `#FFF8E7` · Base bg `#FAF9F6` · Primary blue `#2B6CB0` · Success `#68D391` · Error `#FC8181`

Soft vibrant rotation (for letters, numerals, and variety fills):

| Name | Hex | Notes |
|---|---|---|
| Blue | `#2B6CB0` | primary; used for letters A/B/C by default |
| Coral | `#FC8181` | warm accent, toys/items |
| Orange | `#F6AD55` | sun, orange family |
| Yellow | `#D69E2E` | sunny, high contrast with outline |
| Green | `#68D391` | nature, success |
| Purple | `#9F7AEA` | playful accent |
| Teal | `#4FD1C5` | water, sky |
| Pink | `#F687B3` | sweet accent |

Pastel variants (for cutouts / secondary elements): `#FEEBC8` (cream-yellow), `#FED7D7` (blush), `#BEE3F8` (sky), `#C6F6D5` (mint), `#E9D8FD` (lavender), `#B2F5EA` (seafoam).

**Rule:** max 3 hues per asset (outline excluded). One dominant hue + one accent + one neutral.

## 3. Outline Technique

Primary elements: **two-pass stroke** — draw the shape with `stroke="#2D3748" stroke-width="W" stroke-linecap="round" stroke-linejoin="round" fill="none"`, then re-draw the identical path with `stroke="<fill>" stroke-width="0.68 × W"`. Result: chunky colored core with dark halo.

Filled shapes (circles, hearts, animal bodies): fill + outer stroke in one pass (`fill="<color>" stroke="#2D3748" stroke-width="5"` at 512 base; 4px only for dense compositions).

## 4. Letterforms & Numerals (letters/, numbers/)

**Replace all `<text>` elements with custom stroked paths.**

| Metric | Value |
|---|---|
| Glyph canvas | 512×512, art centered |
| Cap height | ≈ 330px (letters), digits ≈ 320px |
| Baseline | y ≈ 400 |
| Outer stroke (outline) | 52–56px, round caps/joins |
| Inner stroke (color) | 36–38px (≈0.68 outer) |
| Color rotation | Palette order (Blue, Coral, Orange, Yellow, Green, Purple, Teal, Pink) cycling by alphabetical/numeric index |

Construction: each glyph is 1–4 stroke paths (vertical, diagonal, arc segments). Optical sizing — `I`, `J`, `L`, `1` get chunky flags/bases; `4` open-top; `7` curved; counters (A, B, D, O, P, Q, R, 0, 6, 8, 9) large enough to stay open at small sizes.

## 5. Category Rules

| Category | Composition | Special rules |
|---|---|---|
| `shapes/` | shape fills ≈ 65–75% of canvas (r ≈ 175–200) | Every shape must have a clearly readable mass; crescent is a closed moon (outer + inner arc), ring is a thick annulus (stroke ≥ 70px) |
| `shapes/cutout_*` | identical geometry to `shape_*`, **same hue family** (pastel tint) | `stroke-dasharray="10 24"`, stroke width ≈ 12–14, transparent fill |
| `letters/`, `numbers/` | §4 above | No `<text>` allowed (grep-verified) |
| `animals/` | character fills ≈ 80–85% of canvas | Head ≥ 40% of canvas; eyes ≥ 24px diameter each; species-identifying feature must be silhouette-visible (trunk, snout, ears, whiskers) |
| `toys/` | object fills ≈ 75–85% | Gravity: flame/rocket oriented **downward-launch** (rocket: nose up, flames at bottom) |
| `items/` | object fills ≈ 65–75% | Object must be identifiable at 64px; duplicates (ball, car) differ from toy versions in line work + concept |
| `shadows/` | solid `#2D3748` silhouette, ≈ 60–70% occupancy | Recognizable as the paired `items/` asset in solid black; handle/limbs ≥ 10% of width |
| `ui/` | per-asset (see below) | Mascots are the reference quality bar — do not regress them |
| `stickers/` | cream circle `#FFF8E7` (r≈240) + concept scene | One-glance game concept; balanced margins; dashed "placeholder" motif is **banned** |
| `ui/tiles/` | tile bg + icon zone ≈ central 70% (≈358px) | Must read at **48px**: 1 concept, max 3 elements, no tiny text |

### ui/ specifics
- `bubble.svg`: thick outline (style rule), 2 specular highlights (large + small ellipse, white `#FFFFFF`), reads as a soap bubble.
- `icon_speaker.svg`: consistent stroke width across body and arcs; arcs emanate from the cone; fits 96px display.
- `sleep_zzz.svg`: three "Z"s sized progressively (small→large, top-right), soft blue `#63B3ED`, dark outline, round caps.

## 6. Shape ↔ Cutout Pairing (reference)

Each `cutout_X` mirrors `shape_X` geometry in the same hue family:
- Solid pair hue → cutout pastel: Orange `#F6AD55` ↔ `#FEEBC8` · Blue `#2B6CB0` ↔ `#BEE3F8` · Green `#68D391` ↔ `#C6F6D5` · Purple `#9F7AEA` ↔ `#E9D8FD` · Coral `#FC8181` ↔ `#FED7D7` · Yellow `#D69E2E` ↔ `#FEFCBF` · Teal `#4FD1C5` ↔ `#B2F5EA` · Pink `#F687B3` ↔ `#FED7E2`

## 7. Verification

- Re-render contact sheets: `node scripts/render-svg-contact-sheets.mjs` → `docs/svg-contact-sheets/` (HTML for humans, PNG via headless Chrome when available).
- Silhouette test: mentally replace every fill with `#2D3748`; asset must stay identifiable.
- Small-size test: scale to 48–64px; concept must survive.
- No `<text>` in `letters/` or `numbers/`; no gradient/`<defs>` misuse; outlines present on hero elements.
