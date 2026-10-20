# Phase R2 Verification — Review Fixes

**Track:** 20261020-game-metadata-source
**Phase:** R2 — Review Fixes
**Date:** 2026-10-21
**Branch:** refactor/20261020-game-metadata-source
**Base:** 6bee740
**Result:** verified

## Commands

| Command | Exit | Output |
| --- | --- | --- |
| `pnpm check` | 0 | 232 files; 1 pre-existing `noNonNullAssertion` warning + biome schema info |
| `pnpm typecheck` | 0 | silent |
| `pnpm test -- --run` | 0 | 111 files / 2333 tests (R1 closed at 2329) |
| `pnpm build` | 0 | `precache 53 entries (1703.01 KiB)`, entry `index-BDRPNNSx.js` |
| `node scripts/validate-bundle.js` | 0 | shell entry 130.1 kB (<= 200 kB), Phaser vendor chunk present |
| `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| `node scripts/validate-boot.js` | 0 | median cold boot within the 3.0 s budget |

## Findings resolved

| ID | Severity | Resolved by | Proof |
| --- | --- | --- | --- |
| R2-F1 | Medium | TDD §3.3 now names the three narrow globs and why `ui/**` is wrong; the source scan pins the shape | `docs/TDD.md:342` describes `ui/tile_*.svg` + `ui/tiles/*.svg` + `stickers/*.svg` and states that `ui/**` would inline the lazy `game/art/glyphs.ts` group; new test `pins the narrow globs so game-only glyphs stay in their chunk` fails on `ui/**` and on a `sleep_zzz` key |
| R2-F2 | Low | The shell table now builds through an exported `buildShellAssets(keys, sources)` with a call-local `used` set | Three committed tests: one row per key, `duplicate shell asset key: tile_a` on a repeat, `no shell SVG for registry asset key: …` on a miss. Both module-eval throws are now reached through a function a unit test can call, so neither depends on a reverted mutation |
| R2-F3 | Low | Precache row no longer pins a byte-exact figure that moves with every bundle | `docs/TDD.md:393` reads `53 (about 1,703 KiB)` |
| R2-F4 | Low | Remaining ASCII hyphens in the two rewritten TDD paragraphs replaced with em dashes | `docs/TDD.md:342`, `:380`, `:716` now use ` — ` throughout |

## Notes

- Extracting `buildShellAssets` also removed the module-scope `usedShellKeys` set, so the duplicate guard's state is created per call and cannot leak between evaluations. `SHELL_ASSETS` is unchanged in content: 44 derived rows in registry order plus the nine literal rows.
- Two comments left corrupted by an earlier encoding round-trip (`key  SVG source string`, `512�`) were repaired to `key → SVG source string` and `512px`. This is cleanup of this track's own damage, not a new change.
- The precache figure is now an approximation on purpose: it moved 1702.99 → 1703.01 KiB between R1 and R2 for a change that ships no asset.

## Evidence paths

- `conductor/tracks/20261020-game-metadata-source/verification/phase-R2.md` (this file)
- `conductor/tracks/20261020-game-metadata-source/verification/phase-R1.md`
