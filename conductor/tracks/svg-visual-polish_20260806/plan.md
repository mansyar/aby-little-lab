# Plan — SVG Visual Polish: Full Asset Library

**Track:** `svg-visual-polish_20260806` | **Type:** Chore | **Style bar:** product-guidelines §2 (Storybook Flat)

> Every phase ends with the workflow.md Phase Verification & Checkpoint protocol (test suite → manual verification plan → checkpoint commit → git note).

---

## Phase 1: Foundation — Style Spec, Tooling, Baseline

- [x] Task: Write `docs/SVG_STYLE.md` — polish standards doc: outline palette (`#2D3748`, 4–6px @512), soft/vibrant color rotation list, letterform construction technique (thick round-capped paths, `paint-order` outline), silhouette-first rule, per-category composition rules (tiles: icon zone ~70%, readable @48px; stickers: one-glance concept), shape↔cutout hue pairing. (c536445)
- [x] Task: Add `scripts/render-svg-contact-sheets.mjs` — repo tool that renders all SVGs into per-category contact-sheet HTML + screenshots (adapted from the audit tooling; keeps the visual QA loop repeatable). (bd80f61)
- [x] Task: Capture baseline contact sheets into a commit-visible location (e.g., `docs/svg-contact-sheets/baseline/`) for before/after comparison. (026de51)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [checkpoint: b60db06]

## Phase 2: Shapes & Cutouts (36 files)

- [x] Task: Fix broken crescent — redraw `shape_crescent.svg` as a closed crescent-moon path (outer arc + inner arc, filled, thick outline); mirror the same geometry in `cutout_crescent.svg` (dashed, pastel, lockstep hue). (e4bcbc1)
- [x] Task: Recolor `shape_ring.svg` + `cutout_ring.svg` from dull gray to a brand palette color (e.g., soft yellow or teal); recolor `shape_pentagon.svg` + `cutout_pentagon.svg` from muddy brown to a vibrant soft hue. (e4bcbc1)
- [x] Task: Fix `shape_rectangle.svg` + `cutout_rectangle.svg` proportions (match square footprint, horizontal aspect); bump visual mass of `shape_plus.svg` + `cutout_plus.svg` and the ring pair. (e4bcbc1)
- [x] Task: Retune cutout dash pattern (longer dashes, larger gaps for a "stitching" feel); verify every shape↔cutout pair shares the same hue family (solid + pastel). (e4bcbc1)
- [x] Task: Render shapes/cutouts contact sheet and visually confirm: no broken paths, palette-consistent, pairs matched. (e4bcbc1)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [checkpoint: e4bcbc1]

## Phase 3: Letters & Numbers (36 files)

- [x] Task: Build the letterform template — define the construction technique (custom `<path>` strokes, round caps/joins, `#2D3748` outline via stroke or `paint-order`), glyph metrics grid (cap height, baseline, optical overshoot), and the 5–6 color rotation; draft pilots `letter_a`, `letter_b`, `letter_c`. (ec3e113)
- [x] Task: Render pilot letters and review for shape quality, outline weight, and color rotation before mass-producing. (ec3e113)
- [x] Task: Redraw letters `d`–`m` in the pilot style (12 files). (ec3e113)
- [x] Task: Redraw letters `n`–`z` in the pilot style (13 files). (ec3e113)
- [x] Task: Redraw numerals `0`–`9` matching the letter style (10 files) — `1` gets chunky base + flag, `4` open-top, `7` slightly curved; same color rotation so the number line reads as a rainbow set. (ec3e113)
- [x] Task: Verify no `<text>` elements remain in `letters/` or `numbers/` (grep); render letters/numbers contact sheets; check optical size equalization (`i`, `j`, `l`, `1` not tiny) and small-size legibility. (ec3e113)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [checkpoint: ec3e113]

## Phase 4: Animals & Toys (16 files)

- [x] Task: Redesign `elephant.svg` — clearly readable: curled trunk in front, two distinct ears, eye, tusk(s), body posture; no longer a gray sphere. (f264939)
- [x] Task: Redesign `pig.svg` — separate head from body, obvious snout disc with two nostril dots, proper ears, remove the random white cheek circle. (f264939)
- [x] Task: Polish frogs (`frog_blue/green/red`) — enlarge eyes ~20% and lower them for cuteness; optionally add one unique belly marking per frog so variants are distinguishable at silhouette level; refine `cat.svg` ear base (less fox-like). (f264939)
- [x] Task: Fix `toy_rocket.svg` — flames at the BOTTOM, nose cone at top, clearly readable fins. (f264939 — verified already correct in source; audit was a misread)
- [x] Task: Redraw `toy_block.svg` as an actual letter block (cube face + letter, keep filename); `toy_drum.svg` gets drumhead + rim (+ optional crossed sticks); `toy_box.svg` reads as an open toy box (toys peeking or open lid); enlarge `toy_car.svg` wheels slightly. (f264939)
- [x] Task: Render animals/toys contact sheets and confirm recognizability at thumbnail size. (f264939)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [checkpoint: f264939]

## Phase 5: Items (19 files)

- [~] Task: Redesign `bone.svg` (classic dog-bone: two end lobes + narrow waist), `lilypad.svg` (flat oval with side notch — not a wedge/pacman), `peanut.svg` (clear figure-8 two-lobe pinch).
- [ ] Task: Redesign `hat.svg` (wide brim + crown + decorative band/flower so it never reads as food).
- [ ] Task: Fix `airplane.svg` (single wing layer, tail fin, better fuselage) and `umbrella.svg` (remove line through canopy, clear hooked handle).
- [ ] Task: Differentiate `ball.svg` and `car.svg` from `toy_ball.svg`/`toy_car.svg` (line-work consistency + distinct concept, e.g., delivery van vs. sporty toy car) without renaming files.
- [ ] Task: Render items contact sheet; verify every item is recognizable in silhouette.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 6: Shadows (8 files)

- [ ] Task: Redraw `shadow_airplane.svg` — distinct fuselage + wings + tail fin (use shadow_house/car as weight references).
- [ ] Task: Thicken `shadow_umbrella.svg` handle to ~10–15% of canopy width with rounded tip; fatten `shadow_boat.svg` hull so it reads as a hull.
- [ ] Task: Equalize visual weight across all 8 silhouettes (target ~60–70% bounding-box occupancy, consistent darkness).
- [ ] Task: Render shadows contact sheet and confirm all 8 silhouettes are instantly recognizable.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 7: UI Assets (5 files)

- [ ] Task: Redesign `bubble.svg` — add thick dark outline (restores style-system rule), 2 specular highlights (large + small), subtle translucent fill cue; must read as a soap bubble.
- [ ] Task: Redesign `sleep_zzz.svg` — three progressively-sized "Z"s with storybook personality (softer dark-blue tone, gentle motion hint, NOT a black lightning zigzag).
- [ ] Task: Fix `icon_speaker.svg` — consistent stroke weight between speaker body and arcs; tighten arc spacing (emanating from the cone). Mascots (`mascot_idle`, `mascot_celebrate`) stay untouched (reference quality).
- [ ] Task: Render ui contact sheet and confirm bubble/speaker/zzz match the mascot quality bar.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 8: Stickers & Tiles (22 files)

- [ ] Task: Rebuild worst stickers: `sticker_pop_freeze.svg` (popped-bubble moment, not an empty bubble), `sticker_big_small.svg` (two-object size contrast with character, not plain circles), `sticker_how_many.svg` (object group being counted + numeral, centered; remove mystery diamond).
- [ ] Task: Rebuild `sticker_animal_trace.svg` (readable start→end dotted path, centered) and `sticker_pattern_builder.svg` (clear AB-A sequence; replace dashed placeholder with a "missing piece" cue) and `sticker_shadow_match.svg` (real shape + silhouette pairing).
- [ ] Task: Differentiate the three text stickers (`sticker_alphabet_match`, `sticker_word_builder`, `sticker_word_match`) — distinct colors/framing/accents so each has visual identity (ABC vs. built word vs. match layout).
- [ ] Task: Rebuild worst tiles: `tile_pop_freeze.svg` (replace sleep-"Z" with a pop/burst concept), `tile_animal_trace.svg` (clear dotted trace path, larger markers, centered), `tile_word_builder.svg` (show a letter being placed / building progress — no dashed empty box), `tile_shadow_match.svg` (visible shadow pairing), `tile_big_small.svg` (dramatic size contrast, remove unexplained baseline).
- [ ] Task: Fix `tile_musical_memory.svg` music notes (proper eighth-note shapes matching the sticker), `tile_shape_sorter.svg` (consistent fills — no empty white square), and standardize icon mass/placement across all 11 tiles (icon zone ~70%, readable @48px).
- [ ] Task: Render stickers/tiles contact sheets; verify one-glance game concepts and 48px readability.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 9: Final QA & Handoff

- [ ] Task: Full 142-asset contact-sheet review — re-render every category; confirm no broken paths, no `<text>` in letters/numbers, consistent outlines, silhouette recognizability.
- [ ] Task: Run `CI=true npm test` (existing suite must stay green — zero source changes expected).
- [ ] Task: Run `npm run check` (biome) and `npm run build` (production build).
- [ ] Task: Update `docs/SVG_STYLE.md` if the implementation surfaced deviations; ensure no `plan.md`/`spec.md` drift.
- [ ] Task: Phase Verification & Checkpoint — final checkpoint + manual verification plan for human review (Refer to workflow.md)
