# Implementation Plan — Glyph Font Consistency: Baloo 2 Letters & Numerals

**Track:** `baloo2-glyphs_20260811` · **Type:** Bug fix · **Branch:** `fix/baloo2-glyphs`

## Phase 1 — Font-Load Gate (TDD)

- [x] Task 1.1: Write failing tests for `src/utils/fonts.ts` — `ensureGlyphFontLoaded()` resolves when `document.fonts` is missing, when load throws, when load rejects, when load succeeds, and the timeout guard fires (Red) `5af6561`
- [~] Task 1.2: Implement `src/utils/fonts.ts` minimal no-throw helper (Green)
- [ ] Task 1.3: Write failing BootScene test — Preload starts only after the font promise resolves (navigation.test.ts pattern; Red)
- [ ] Task 1.4: Wire `BootScene.create()` to await the helper before `this.scene.start("Preload")` (Green)
- [ ] Task: Phase Verification & Checkpoint (refer to workflow.md)

## Phase 2 — SVG Glyph Font Update (38 files, tests-first)

- [ ] Task 2.1: Write failing asset regression tests — `letterNumeralFonts.test.ts` asserts all 38 raw SVGs carry `font-family="'Baloo 2', Arial, Helvetica, sans-serif"`, the old Arial-only string is absent, and the styling contract (`fill`/`stroke`/`stroke-width`/`paint-order`/`font-size`) is preserved (Red)
- [ ] Task 2.2: Update 26 letter SVGs (`letters/letter_a.svg`…`letter_z.svg`)
- [ ] Task 2.3: Update 10 numeral SVGs (`numbers/numeral_0.svg`…`numeral_9.svg`)
- [ ] Task 2.4: Update 2 accents (`ui/tiles/tile_first_sounds.svg`, `stickers/sticker_first_sounds.svg`) (Green — full suite green)
- [ ] Task: Phase Verification & Checkpoint (refer to workflow.md)

## Phase 3 — Docs & Quality Gates

- [ ] Task 3.1: Update `docs/SVG_STYLE.md` §4 — letters/numerals now use bundled Baloo 2 (bold, 400px, `#2B6CB0`/`#2D3748` styling unchanged) with Arial fallback; note the BootScene rasterization gate; keep the no-custom-paths-without-sign-off rule
- [ ] Task 3.2: Add dated design update to `conductor/tech-stack.md` — resolves the accepted known issue; gate behavior + timeout rationale; fallback rationale; zero new assets
- [ ] Task 3.3: Update `docs/PRD.md` letter-set and numeral styling lines ("bold sans-serif" → bundled Baloo 2)
- [ ] Task 3.4: Add glyph-consistency check row to `docs/device-testing-checklist.md` — letters/numerals render the rounded Baloo 2 style consistently across devices (for the next release record)
- [ ] Task 3.5: Run full quality gates — `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`
- [ ] Task: Phase Verification & Checkpoint (refer to workflow.md)

## Phase 4 — Review & Archive

- [ ] Task 4.1: Self-review against spec acceptance criteria + code review checklist (workflow.md)
- [ ] Task 4.2: Apply review suggestions (if any)
- [ ] Task 4.3: Mark track complete, archive to `conductor/archive/baloo2-glyphs_20260811/`, update registry
