# Spec — Glyph Font Consistency: Baloo 2 Letters & Numerals

**Track:** `baloo2-glyphs_20260811` · **Type:** Bug fix · **Branch:** `fix/baloo2-glyphs`

## 1. Overview

Resolves the accepted known issue carried in every release since v1.7.0: *"Letter and numeral artwork uses the system font (per product decision), so glyph rendering varies slightly across devices."* Letters and numerals are **learning content** (Find the Letter, First Sounds, Build the Word, How Many?), so glyph consistency across devices matters pedagogically. The fix: render all 38 glyph SVGs with the **already-bundled Baloo 2 font** (WOFF2 at `public/fonts/baloo2-latin.woff2`, declared in `src/styles/style.css`, PWA-precached — zero new assets), and gate font loading before Phaser rasterizes them.

## 2. Functional Requirements

### FR-1 — SVG font-family update (38 files, zero geometry changes)

- `letters/letter_a.svg` … `letters/letter_z.svg` (26), `numbers/numeral_0.svg` … `numbers/numeral_9.svg` (10), `ui/tiles/tile_first_sounds.svg` + `stickers/sticker_first_sounds.svg` (2 accents — they display the same letter "A" kids learn; must match the in-game glyph).
- Change `font-family="Arial, Helvetica, sans-serif"` → `font-family="'Baloo 2', Arial, Helvetica, sans-serif"`.
- Everything else stays byte-identical: bold, 400px, `#2B6CB0` fill, `#2D3748` 14px stroke, `paint-order="stroke fill"`, centered at 256/256, `text-anchor="middle"` / `dominant-baseline="central"`. The Arial fallback guarantees worst-case behavior equals today's rendering (zero regression risk).

### FR-2 — Font-load gate (`src/utils/fonts.ts` + BootScene)

- New pure helper `ensureGlyphFontLoaded(): Promise<void>` — no-throw by design:
  - Guards missing `document.fonts` (old/limited engines) → resolves immediately.
  - Catches load rejection (font fetch failure) → resolves (fallback stack renders, identical to today).
  - Races a ~2.5s timeout so a stalled network can never block boot (protects the <3s boot target).
  - On success → resolves after `document.fonts.load('700 400px "Baloo 2"')` completes.
- `BootScene.create()` awaits the helper **before** `this.scene.start("Preload")` (async `create()` or promise chain; must not start Preload earlier).
- Rationale: Phaser's SVG loader rasterizes `<text>` elements **once at load time** into textures. Without a gate, the first-visit rasterization could complete before Baloo 2 finishes loading, silently producing Arial glyphs — the exact bug being fixed.

### FR-3 — Regression tests (Red → Green)

- `src/__tests__/assets/letterNumeralFonts.test.ts` (pattern: `arrowSvgPaths.test.ts` — imports via `?raw`):
  - All 38 SVGs assert the new `font-family="'Baloo 2', Arial, Helvetica, sans-serif"` string is present.
  - The exact old `font-family="Arial, Helvetica, sans-serif"` string is absent (guards partial replacement).
  - Styling contract preserved: `fill="#2B6CB0"`, `stroke="#2D3748"`, `stroke-width="14"`, `paint-order="stroke fill"`, `font-size="400"` for each file.
- `src/__tests__/utils/fonts.test.ts`: helper resolves when `document.fonts` is missing, when load throws, when load rejects, when load succeeds, and the timeout guard resolves.
- BootScene test (pattern: `navigation.test.ts` scene-boot flow): Preload starts only after the font promise resolves; scene test suite stays green.

## 3. Non-Functional Requirements

- No new dependencies, no new assets, no new audio; preload SVG count unchanged (162).
- Boot time target <3s preserved: the font is precached after first PWA install; first visit worst case adds one small woff2 fetch.
- New modules meet the project coverage bar (>95% lines); Biome clean.
- No runtime API changes; no storage schema changes; no user-visible behavior change beyond glyph rendering.

## 4. Acceptance Criteria

1. All 38 SVGs declare `'Baloo 2'` first in their font stack with Arial fallback; geometry and styling untouched.
2. Boot never starts Preload before the font is available — or the gate times out safely; never hangs.
3. Regression suite is red before the change and green after; full suite + quality gates pass (`pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`).
4. Docs updated: `docs/SVG_STYLE.md` §4, `conductor/tech-stack.md` (dated design update), `docs/PRD.md` letter/numeral styling lines, `docs/device-testing-checklist.md` gains a glyph-consistency check row for the next release record.

## 5. Out of Scope

- Custom-path letterforms (still requires product sign-off per the 2026-08-06 decision).
- Cross-device progress sync (separate accepted known issue).
- Any Arial usage outside these 38 files (none exists in the SVG library).
- BGM/SFX, storage, profiles, game logic — untouched.
