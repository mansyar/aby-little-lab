# Phase 2 — Art and asset preload

- **Track:** 20261020-feelings-faces — Feelings Faces — Game 21 (Social-Emotional Learning)
- **Phase:** 2 — Art and asset preload
- **Date:** 2026-10-20
- **Branch:** `feat/20261020-feelings-faces`
- **Base commit:** `0097cf74564ebb685724c9c495be31d7e80c6de8`
- **Head commit (verified):** `1c0f42e` (revision 1 art; original phase commits `d8a160e` art, `0771b79` preload + tests)
- **Result:** verified

## Commands

Verification command run verbatim as one chain:

`pnpm check && pnpm typecheck && pnpm test -- --run src/__tests__/scenes/preloadScene.test.ts src/__tests__/assets && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | Biome clean. 1 pre-existing warning (`src/__tests__/scenes/musicalMemoryScene.test.ts:294` `noNonNullAssertion`, untouched) + 1 info (biome.json schema declares 2.5.5, CLI is 2.5.10) |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean (strict) |
| unit | `pnpm test -- --run src/__tests__/scenes/preloadScene.test.ts src/__tests__/assets` | 0 | 4 files / 133 tests passed — `preloadScene.test.ts`, `assets/feelingsFacesSvg.test.ts` (new), `assets/letterNumeralFonts.test.ts`, `assets/arrowSvgPaths.test.ts` |
| build | `pnpm build` | 0 | 266 modules transformed; entry `index-DJMwYOoz.js` 194.91 kB, Phaser chunk 1,374.82 kB |
| gate | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present (1342.6 kB); shell entry 190.3 kB ≤ 200 kB |
| gate | `node scripts/validate-pwa.js` | 0 | 15/15 checks passed |
| full chain | all of the above | 0 | every layer green in a single run |

## Assets delivered

All six SVGs are flat vector, 512×512 viewBox, `#2D3748` outlines, palette fills, art inside the 8 px safe margin, and use only `M`/`L`/`Q`/`C`/`Z` path commands plus `rect`/`circle`/`ellipse` primitives (no `H`/`V` shorthand — Phaser 4's rasterizer falls back to the 32 px missing-texture square on it, per `src/__tests__/assets/arrowSvgPaths.test.ts`).

| File | Texture key | Bytes | Purpose |
| --- | --- | --- | --- |
| `src/assets/svg/feelings/face_happy.svg` | `face_happy` | 1714 | Aby happy — arched smiling eyes + wide open smile |
| `src/assets/svg/feelings/face_sad.svg` | `face_sad` | 2250 | Aby sad — outward-drooping brows, round eyes, downturned mouth, single teal tear |
| `src/assets/svg/feelings/face_angry.svg` | `face_angry` | 2205 | Aby angry — brows pressed toward the nose, narrow eyes, flat pressed mouth, blush reinforcement only |
| `src/assets/svg/feelings/face_scared.svg` | `face_scared` | 1997 | Aby scared — raised brows, wide eyes with small pupils, small open mouth |
| `src/assets/svg/ui/tile_feelings_faces.svg` | `tile_feelings_faces` | 955 | Hub tile — two face cards, one smiling one frowning (the round's choice) |
| `src/assets/svg/stickers/sticker_feelings_faces.svg` | `sticker_feelings_faces` | 1115 | Heart badge — cream circle `#FFF8E7` + coral-red heart with a happy face |

**Total added SVG payload: 10,236 bytes (9.99 KiB)** — 25.6 % of the 40 KB NFR-7 budget.

Raster tiers need no new rule: `tile_feelings_faces` inherits the `^tile_` icon tier (160 px), and the faces + sticker fall through to the `card` tier (256 px), which covers the 180 px face cards and the sticker thumbnail.

## Acceptance criteria

| ID | Requirement | Evidence | Status |
| --- | --- | --- | --- |
| FR-9 (sticker asset) | A heart sticker asset exists for the win award | `sticker_feelings_faces.svg` — cream badge + red heart with a face; key `sticker_feelings_faces` registered in `SHAPE_ASSETS` (fresh-award wiring is Phase 3) | pass |
| NFR-4 | All new assets precached by the existing PWA pipeline and offline-capable | SVG `?raw` imports are inlined into the shell bundle, which the Workbox precache list covers; `validate-pwa.js` 15/15 green after build | pass |
| NFR-5 | Expressions distinguishable by shape, not colour; flat style, thick outlines, palette-compliant | `assets/feelingsFacesSvg.test.ts` — identical shared framing block in all four faces; each expression's cue appears in that face only; happy has no eye-whites (arcs only); no gradient/filter/raster/`<text>`; `#2D3748` outline on every asset | pass |
| NFR-7 | New SVG payload ≤ 40 KB | 10,236 bytes across the six files; asserted in `feelingsFacesSvg.test.ts` ("keeps the six new assets inside the 40 KB payload budget") | pass |

## Preload registration

`src/scenes/PreloadScene.ts` gained six `?raw` imports and six `SHAPE_ASSETS` entries under the exact texture keys above (appended after `tile_number_order`); imports are kept in the file's alphabetical order and the tile import sits before the `ui/tiles/` block because `ui/tile_` sorts before `ui/tiles/` (Biome `organizeImports`).

## Tests

- `src/__tests__/scenes/preloadScene.test.ts` — new `describe("PreloadScene feelings faces textures")`: all six keys registered exactly once, and each resolves to real 512 px SVG markup.
- `src/__tests__/assets/feelingsFacesSvg.test.ts` (new, 8 tests) — 512 canvas + outline colour on all six; flat-vector ban list; identical shared framing across the four faces; per-expression exclusive cues; happy uses arched eyes only; tile pairs a smile card with a frown card; sticker is a cream badge around a red heart; 40 KB payload budget.

## Evidence paths

- Art: `src/assets/svg/feelings/face_{happy,sad,angry,scared}.svg`, `src/assets/svg/ui/tile_feelings_faces.svg`, `src/assets/svg/stickers/sticker_feelings_faces.svg`
- Wiring: `src/scenes/PreloadScene.ts`
- Tests: `src/__tests__/scenes/preloadScene.test.ts`, `src/__tests__/assets/feelingsFacesSvg.test.ts`, `src/__tests__/utils/textureTiers.test.ts`
- Task commits: `d8a160e` (six SVGs), `0771b79` (preload registration + tests)
- Local preview page (git-ignored, not part of the branch): `.conductor/evidence/feelings-faces-preview.html`

## Deviations

| File | Reason |
| --- | --- |
| `src/__tests__/utils/textureTiers.test.ts` | Outside `Touches`, but it asserts `SHAPE_ASSETS` has exactly 170 entries. The six new textures make that assertion false, so the count was updated to 176. Only that integer changed; the tier-coverage and half-baseline assertions still hold (new keys resolve to `icon`/`card`). |

`src/scenes/PreloadScene.ts`, `src/__tests__/scenes/preloadScene.test.ts` and the new `src/__tests__/assets/feelingsFacesSvg.test.ts` are all inside `Touches`.

## Notes

- **Tile path:** the plan and brief both place the tile at `src/assets/svg/ui/tile_feelings_faces.svg`, while the other 20 tiles live in `src/assets/svg/ui/tiles/`. That path was followed as written (the texture key is what Phase 3 consumes); if the primary prefers folder consistency, moving it is an import-path + `git mv` change with no key, test, or behaviour impact.
- **Character:** the four faces share one byte-identical framing block (hair `#A0522D`, skin `#F0D5B4`, blue `#2B6CB0` shirt with collar, same ears/neck/head), so identity cannot drift between rounds. Expression cue summary — happy: `∩ ∩` eyes + wide `∪` smile; sad: outward-drooping brows + round eyes + `∩` mouth + one tear; angry: brows angled down to the nose + narrow eyes + flat mouth (+ blush, reinforcement only); scared: raised brows + wide eyes with small pupils + small open mouth. All four differ in silhouette at 180 px and survive grayscale.
- **No colour-only cue:** the angry blush (`#FED7D7`) and the sad tear (`#90CDF4`) are the only expression-specific colours, and both sit beside a shape cue that carries the meaning alone.
- **Visual QC:** the allowed command set has no render step, so the assets were not rasterized here. Geometry was checked arithmetically against the 512 grid / 8 px margin, and `.conductor/evidence/feelings-faces-preview.html` is a ready visual check (180 px, 96 px, 48 px, grayscale) for the primary or the user to open; the blind-identification test in `docs/SVG_STYLE.md` §7 is still worth running by eye once.
- **Docs left untouched:** `docs/SVG_STYLE.md` §8 still lists 170 SVGs and 20 tiles/stickers — product/docs updates belong to the primary/Phase 4, and the file is outside `Touches`.
- **Stale comment:** `src/utils/textureTiers.ts`'s header still cites "170 × 512²" as the historical baseline. It is illustrative pre-existing prose outside `Touches`, so it was left alone rather than widened into this phase.
- **Not done (Phase 3):** no `GameId`, `GAME_IDS`, `GAME_TILES`, `hubTiles`, scene registry, or scene changes — per the plan's 2026-10-20 adjustment.

## Revision 1

Art revision after the orchestrator reviewed the rendered assets at 180 px, grayscale, 96 px and 48 px. Commit `1c0f42e` — `style(feelings): refine Aby proportions and expression cues`. Same six texture keys, same six file paths, same `PreloadScene` wiring.

### What changed

| Problem raised | Change made |
| --- | --- |
| Aby read as an adult (angular jaw, visible neck, collar, sharp side-parted hair) | Head is now 320 × 328 px on the 512 canvas (64 % of the canvas height, up from 59 %, and wider than before) as one round ellipse with a chubby-cheek silhouette; the neck and the whole chest block are gone. The torso is a single blue shape whose top edge sweeps up to disappear behind the cheeks, giving a rounded crew neckline with no collar points and no buttons. Hair is one soft bowl cap with a high, evenly rounded fringe and no part line; ears removed. |
| Angry was the weakest expression — neutral-reading eyes and a flat "unimpressed" mouth, ambiguous with sad at 48 px | Steep brow V (a 46 px drop over 58 px toward the nose, 12 px stroke) plus an open shouting mouth: a rounded inverted-D, 104 × 58 px, that the flat bar is replaced by. Narrow eyes remain, blush kept as reinforcement only. The open mouth is the shape that separates it from sad at 48 px. |
| Tile muddy at 48 px — two small framed faces | Frames and the two-face split dropped. One large Aby face (176 px-radius head, hair cap, 12–13 px eye arcs and smile) filling most of the tile, plus a single small heart at bottom right. No `<rect>` remains. |
| Sticker red darker than the palette's `#FC8181` role | Heart is now `#FC8181`. Sparkles dropped entirely, so the badge is cream circle + heart + a simple dot-eyed smile. |
| Face read small; eyes needed to be larger and wider apart | Eye centres moved to x 178 / 334 (156 px apart, up from 120) and eye whites to r 30 (scared: r 38); nose redrawn as a small rounded stroke. Eyes sit below the head's midline (y 272) for toddler proportions. |

Every path still uses only `M`/`L`/`Q`/`C`/`Z` (no `H`/`V` shorthand), all art stays inside the 8 px safe margin, and the four faces keep one byte-identical framing block: shirt + crew neckline path, head ellipse `cx="256" cy="248" rx="160" ry="164"`, hair path, nose path.

### Per-file byte counts

| File | Before (revision 0) | After (revision 1) | Delta |
| --- | --- | --- | --- |
| `src/assets/svg/feelings/face_happy.svg` | 1714 | 1365 | −349 |
| `src/assets/svg/feelings/face_sad.svg` | 2250 | 1878 | −372 |
| `src/assets/svg/feelings/face_angry.svg` | 2205 | 1958 | −247 |
| `src/assets/svg/feelings/face_scared.svg` | 1997 | 1643 | −354 |
| `src/assets/svg/ui/tile_feelings_faces.svg` | 955 | 1009 | +54 |
| `src/assets/svg/stickers/sticker_feelings_faces.svg` | 1115 | 783 | −332 |
| **Total** | **10,236** | **8,636** | **−1,600** |

**Total added SVG payload after revision 1: 8,636 bytes (8.43 KiB)** — 21.1 % of the 40 KB NFR-7 budget.

### Guards kept and extended

`src/__tests__/assets/feelingsFacesSvg.test.ts` was updated where the geometry invalidated a string, and every guard the direction named still holds:

- identity framing — the shared block is now shirt/neckline, head, hair, nose, asserted byte-identical across all four faces;
- per-face exclusive cues — happy `M 198 342 Q 256 408 314 342`; sad `M 206 386 Q 256 336 306 386` + `#90CDF4`; angry the inverted-D shout path + `#FED7D7`; scared `r="38"` eye + `rx="22" ry="26"` mouth, each asserted absent from the other three faces;
- no colour-only cues — happy still carries no eye whites at all, and both expression colours sit beside a shape cue that reads alone;
- flat-vector bans — no gradient/filter/raster/image/`<text>`;
- payload budget — 40 KB over the six assets;
- **new:** a proportions guard asserting the head ellipse is 60–65 % of the canvas height and that no face file contains a `<rect>` (the old neck/chest block cannot come back), plus tile assertions that the frames are gone (`no <rect>`), the smile path is present and the heart is `#FC8181`, and a sticker assertion that the sparkles (`#F6E05E`) are gone.

### Revision verification

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | Biome clean; only the pre-existing `musicalMemoryScene.test.ts:294` warning + biome.json schema info |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| unit | `pnpm test -- --run src/__tests__/scenes/preloadScene.test.ts src/__tests__/assets` | 0 | 4 files / 134 tests passed (one more than revision 0: the proportions guard) |
| build | `pnpm build` | 0 | 266 modules; entry `index-DHjW9-AH.js` 193.31 kB |
| gate | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present; shell entry 188.8 kB ≤ 200 kB |
| gate | `node scripts/validate-pwa.js` | 0 | 15/15 checks passed |
| full chain | as written in the brief | 0 | every layer green in one run |

Preload wiring and the `preloadScene` expectations were untouched by the revision (the six keys and their sizes did not change), and `.conductor/evidence/feelings-faces-preview.html` needed no regeneration — it references the SVG files by path with no embedded geometry, so it shows the revised art at 180/140/96/48 px and in grayscale.

