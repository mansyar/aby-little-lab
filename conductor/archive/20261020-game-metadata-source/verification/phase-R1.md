# Phase R1 Verification — Review Fixes

**Track:** 20261020-game-metadata-source
**Phase:** R1 — Review Fixes
**Date:** 2026-10-21
**Branch:** refactor/20261020-game-metadata-source
**Base:** 0368d35
**Result:** verified

## Commands

| Command | Exit | Output |
| --- | --- | --- |
| `pnpm check` | 0 | 232 files; 1 pre-existing `noNonNullAssertion` warning + biome schema info |
| `pnpm typecheck` | 0 | silent |
| `pnpm test -- --run` | 0 | 111 files / 2329 tests (phase 5 closed at 2327) |
| `pnpm build` | 0 | `precache 53 entries (1702.99 KiB)`, `dist/sw.js` |
| `node scripts/validate-bundle.js` | 0 | `shell entry index-B6Jt9no6.js = 130.1 kB (<= 200 kB)`, Phaser vendor chunk present |
| `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| `node scripts/validate-boot.js` | 0 | median 0.51 s over 3 cold loads (budget 3.0 s), against the rebuilt `index-B6Jt9no6.js` |

## Findings resolved

| ID | Severity | Resolved by | Proof |
| --- | --- | --- | --- |
| F1 | Medium | `PreloadScene.ts` globs narrowed from `ui/**/*.svg` to `ui/tile_*.svg` + `ui/tiles/*.svg` + `stickers/*.svg` | Entry chunk **133.2 kB → 130.1 kB**; the eight `game/art/glyphs.ts` SVGs (`equals`, `plus`, `minus`, `bubble`, `card_back`, `arrow_up`, `arrow_down`, `sleep_zzz`) no longer ship eagerly; precache 1703.44 → 1702.99 KiB |
| F2 | Medium | `shellAsset` tracks consumed keys and throws `duplicate shell asset key: <key>`; `shellSourceMap` exported for its unit test | Mutation proof: `tileKey: "tile_story_order"` → `"tile_number_order"` made the module evaluate to `Error: duplicate shell asset key: tile_number_order` (reverted). `shellSourceMap` duplicate-stem throw is now covered by a committed test rather than a reverted manual mutation |
| L4 | Low | `GAME_SHELL_KEYS` exported and asserted against the registry key union | `globbed keys and registry keys are the same set, both ways` fails on an orphan `tile_*`/`sticker_*` file and on a registry key with no file |
| L1 | Low | `hubPaging.ts` comment no longer claims the module is dependency-free | Reads "needs no runtime import from `HubScene`" |
| L2 | Low | TDD budget lines corrected | 130.1 KiB / 133.2 kB in the "Measured budgets" paragraph and the gate table, matching this build |
| L3 | Low | Em dashes restored in the two rewritten TDD paragraphs; trailing newline restored | `git diff` on those lines shows only substantive wording |
| L5 | Low | PRD §4.1 sentence now names the scene-loader row and the type-checked id list | Reads "one entry plus its scene, its art and its scene-loader row, with the id list checked by the type checker and the invariant suite" |

## Notes

- F1 makes FR-5's `ui/**/*.svg` wording slightly broader than the implementation. The interaction the requirement was written for — non-tile art living beside the tiles, i.e. `ui/tile_feelings_faces.svg` — is still covered by the `ui/tile_*.svg` pattern, and the resolution is recorded in TDD §3.3 rather than by editing the frozen spec requirement.
- NFR-5 ("the eager glob must not pull game art into the entry chunk") is now met literally: no `game/art/` SVG reaches the shell entry.
- The `ui/tile_*.svg` glob keeps the prefix filter and duplicate check in `shellSourceMap` as defence in depth.
- Pre-existing and untouched: the `noNonNullAssertion` warning in `src/__tests__/scenes/musicalMemoryScene.test.ts:294`, and the `/favicon.ico` 404.

## Evidence paths

- `conductor/tracks/20261020-game-metadata-source/verification/phase-R1.md` (this file)
- `conductor/tracks/20261020-game-metadata-source/verification/phase-3.md`, `phase-5.md` (pre-fix baselines)
