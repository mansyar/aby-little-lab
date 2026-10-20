# Shell Diet: Per-Game Lazy Art Chunks — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Move every texture that only a game draws out of the boot shell and into
lazily-loaded, named art groups that each game scene rasterizes in its own
`preload`. The boot shell keeps only what the Hub and the shared game chrome
draw. This generalises the pattern Story Order already proved
(`src/game/storyOrderArt.ts`) across the remaining 21 games.

## Problem / Motivation

`PreloadScene` imports **178 SVGs as `?raw` and rasterizes all of them before
the Hub paints** (`src/scenes/PreloadScene.ts:1-369`). The base64 SVG payload
lives inside the shell entry, which measures **195.4 KiB against a hard 200 KiB
gate** — 4.6 KiB of headroom. Consequences today:

- No new shell-side feature and no new game's boot art can land without
  breaking `validate-bundle`.
- The child pays 178 SVG rasterizations on every cold boot (~641 ms measured on
  dev, and the 4x-throttled boot remains ~4.2 s against a 3 s budget).
- `PreloadScene` is a 24 kB file whose only job is a hand-maintained asset
  table; every new game edits it.

## Goals & Success Metrics

- **Goal:** shell entry <= **170 KiB**; boot rasterizations <= ~55 keys; every
  game's art loaded by its own chunk.
- **Metric:** `node scripts/validate-bundle.js` shell size;
  `docs/perf-baseline.md` before/after cold and 4x-throttled boot medians;
  `validate-pwa` precache assertion; measured cold first-tap cost.

## Scope

### In Scope

- `src/game/art/` with named groups plus an idempotent
  `preloadArtGroups(scene, groups)` registry.
- Per-scene `preload` wiring for all 22 games.
- One shared `createArtLoadingCue(scene)` — textless, reduced-motion aware.
- Shrinking `PreloadScene` to a documented shell set.
- Test guards: group integrity, art-ownership static scan, precache assertion.
- Docs sync: README, `tech-stack.md`, `TDD.md`, `perf-baseline.md`.

### Out of Scope

- Any texture tier or display-size change; visuals must be pixel-identical.
- Any gameplay, copy, navigation, progress, or settings behaviour change.
- New art, new games, Hub/sticker art relocation.
- New dependencies; changes to CI gate thresholds.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | Art groups live in `src/game/art/`, each exporting its key-to-SVG table; no group module is reachable from the shell entry. | must |
| FR-2 | `preloadArtGroups(scene, groups)` registers only keys absent from the TextureManager, at `textureSizeFor(key)`, and is safe to call repeatedly and concurrently. | must |
| FR-3 | All 22 game scenes declare their groups and load them in `preload`; no game reads a texture it did not declare. | must |
| FR-4 | The shell set is explicitly documented: 22 tile icons, 22 stickers, 2 mascot poses, `icon_speaker`, and the 6 avatar keys (`animal_cat`, `animal_dog`, `animal_pig`, `frog_red`, `sm_duck`, `toy_teddy_bear`). | must |
| FR-5 | A shared loading cue renders during a pending art load and clears itself; no text; reduced-motion variant. | must |
| FR-6 | A missing key logs one warning and renders a neutral placeholder; it never throws and never blocks the round. | must |
| FR-7 | `validate-pwa` asserts every emitted art chunk appears in the precache manifest. | must |
| FR-8 | `PreloadScene` no longer imports any game-only art module; a static scan enforces this for all scenes. | must |
| FR-9 | Documentation states the new art-ownership rule and the shell budget headroom. | should |

### Art Group Inventory

| Group | Keys | Primary consumers |
| --- | --- | --- |
| `shapes` | 18 `shape_*` | Shape Sorter, Pattern Builder, Color Match, Odd One Out, How Many? |
| `cutouts` | 18 `cutout_*` | Shape Sorter |
| `letters` | 26 `letter_*` | Find the Letter, Find the Word, Build the Word, Decode It, First Sounds |
| `numerals` | 10 `numeral_*` | How Many?, Number Order |
| `animals` | 6 `animal_*` | Animal Trace, Pop & Freeze, Memory Match, Odd One Out, Find the Word |
| `food` | 6 `food_*` | Animal Trace, How Many? |
| `items` | 16 `sm_*` | Shadow Match, Memory Match, Decode It, Odd One Out, How Many? |
| `shadows` | 8 `sm_shadow_*` | Shadow Match |
| `toys` | 7 `toy_*` | Big & Small, Memory Match, Odd One Out |
| `faces` | 4 `face_*` | Feelings Faces |
| `music` | 3 `frog_*` + `lilypad` | Musical Memory, Color Match, Odd One Out |
| `glyphs` | `bubble`, `sleep_zzz`, `card_back`, `arrow_more`, `arrow_less`, `equals`, `plus`, `minus` | Pop & Freeze, Memory Match, More or Less, Add It Up, Take Away |

Shell set: 22 `tile_*`, 22 `sticker_*`, `mascot_idle`, `mascot_celebrate`,
`icon_speaker`, and the 6 avatar keys listed in FR-4. `mascot_idle` is also a
word prompt in `wordLogic`, which is why the registry must treat an
already-present texture as satisfied.

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | Cold first tap of any game adds <= **400 ms** on the dev machine versus the same tap today, measured for the worst game (largest group union). |
| NFR-2 | Offline first play of any game still works after one online visit (precache), with no runtime network dependency beyond precached chunks. |
| NFR-3 | No visual regression: same textures, same tiers, same display sizes; the only new visual is the loading cue. |
| NFR-4 | No new dependency; code-splitting adds at most 12 chunks. |
| NFR-5 | All existing gates stay green: `pnpm check`, `typecheck`, 2,208+ tests, coverage thresholds, build, bundle, PWA, boot median <= 3000 ms. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | Built shell entry <= 170 KiB and the Phaser vendor chunk is still exactly one chunk. | FR-1, FR-4 |
| AC-2 | A unit test proves each declared group is key-unique, non-empty, and free of duplicate keys across groups. | FR-1, FR-2 |
| AC-3 | A unit test proves repeated/concurrent `preloadArtGroups` calls rasterize each key once at its tier size. | FR-2 |
| AC-4 | A source-scan test proves no game scene omits a group it draws from and no game-only art import reaches `PreloadScene`. | FR-3, FR-8 |
| AC-5 | A scene test proves a missing key yields a placeholder and a single warning, with the round still completable. | FR-6 |
| AC-6 | `validate-pwa` fails when an art chunk is removed from the precache list, and passes on the real build. | FR-7 |
| AC-7 | Recorded cold and 4x-throttled boot medians improve versus the 195.4 KiB / ~4.2 s baseline, with the CI gate unchanged. | NFR-1, NFR-5 |
| AC-8 | Cold first tap for the worst game is <= 400 ms over the pre-track measurement, evidence recorded in the phase file. | NFR-1 |
| AC-9 | README, `tech-stack.md`, `TDD.md` and `perf-baseline.md` describe the new ownership rule and the measured result. | FR-9 |

## Edge Cases

- Two games sharing `sm_*`, `frog_*` or `shape_*` keys — the second load must
  not re-rasterize or collide.
- Double-tapping a Hub tile — `ensureSceneLoaded` guard plus registry
  idempotence.
- Replaying a game in one session — no second raster pass.
- Reduced motion — the cue animates opacity only.
- The device goes offline or online mid-session — the cue never waits on the
  network; art chunks are precached.
- A corrupted or missing SVG key — placeholder path (FR-6).
- `mascot_idle` is used as a word prompt — already loaded by the shell; the
  registry must treat an existing texture as satisfied.

## Dependencies

- **Tracks:** none.
- **External:** none.

## Open Questions & Assumptions

- **Assumption:** the 6 avatar textures stay in the shell because `ProfileChip`
  renders before any game loads; they may alias game art.
- **Assumption:** texture tiers are untouched, so `textureSizeFor` results are
  identical before and after.
- **Assumption:** the 400 ms budget is measured on the dev machine with a cold
  chunk cache, worst game, and recorded as evidence rather than a CI gate.
- **Assumption:** Phaser's `preload` is synchronous, so scenes import their
  group modules statically; Vite hoists shared groups into shared chunks rather
  than requiring a dynamic registry.

## References

- `src/scenes/PreloadScene.ts`, `src/game/storyOrderArt.ts`,
  `src/utils/textureTiers.ts`
- `docs/perf-baseline.md`, `docs/TDD.md` (bundle/boot), `docs/PRD.md` (bundle)
- `scripts/validate-bundle.js`, `scripts/validate-pwa.js`,
  `scripts/validate-boot.js`
