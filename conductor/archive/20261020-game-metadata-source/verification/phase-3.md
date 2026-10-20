# Phase 3 Evidence — Shell preload derives

- **Track:** 20261020-game-metadata-source — Game Metadata Single Source of Truth
- **Phase:** 3 — Shell preload derives
- **Date:** 2026-10-21
- **Branch:** refactor/20261020-game-metadata-source
- **Base:** d56fd3a (companion commit `conductor(plan): Mark phase 'Shell preload derives' as in progress`)
- **Head:** working tree at time of verification (committed as the phase checkpoint)
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | 232 files; 1 pre-existing `noNonNullAssertion` warning (`src/__tests__/scenes/musicalMemoryScene.test.ts:294`) and the pre-existing biome.json schema info |
| static | `pnpm typecheck` | 0 | silent |
| unit | `pnpm test -- --run` | 0 | 111 files / 2321 tests (pre-track baseline 110 / 2305, after Phase 2 2317) |
| build-artifact | `pnpm build` | 0 | exit 0; `precache 53 entries (1703.44 KiB)` — identical to the pre-track precache |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk 1342.6 kB; shell entry `index-*.js` = **133.2 kB** (<= 200 kB) |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| smoke | `node scripts/validate-boot.js` (vite preview :4173) | 0 | median cold boot **0.59 s** over 3 loads (<= 3.0 s) |

Chunk inventory after the change: **41 JS chunks**, 1.63 MiB total, matching the pre-track
count, so the derivation did not split or merge any chunk.

## Requirements met

| ID | Requirement | Evidence | Status |
| --- | --- | --- | --- |
| FR-5 | Tile and sticker shell entries derive from the registry; art groups stay declared per scene | `PreloadScene.ts` composes `SHELL_ASSETS` as `GAME_REGISTRY.map(tileKey)` then `GAME_REGISTRY.map(stickerKey)` from two eager `?raw` globs (`ui/**/*.svg`, `stickers/*.svg`), plus the nine literal non-game rows. Every game scene still declares its own `preloadArt(...)` groups; no group module or `preloadArt` call site changed. | met |
| FR-9 | A registry key with no file, or two files claiming one key, throws at module evaluation naming the key | Proven by temporary mutations, both reverted: (a) renaming `stickers/sticker_story_order.svg` failed the suite with `Error: no shell SVG for registry asset key: sticker_story_order`; (b) copying `ui/tiles/tile_story_order.svg` to `ui/tile_story_order.svg` failed with `Error: duplicate shell asset: tile_story_order (../assets/svg/ui/tiles/tile_story_order.svg)`. | met |
| NFR-1 | No new dependency | `package.json` and `pnpm-lock.yaml` untouched; the globs and the test's disk-truth map both use `import.meta.glob`, so the suite needs no `node:fs`/`@types/node`. | met |
| NFR-2 | Entry chunk stays under the 200 kB gate | 133.2 kB measured by `validate-bundle.js` (was 129.1 KiB pre-track — the difference is inline SVG markup already shipped, plus glob key mapping). | met |
| NFR-5 | Derivation happens at build time, not at runtime | `import.meta.glob(..., { eager: true, query: "?raw" })` is resolved by Vite at build time; the browser receives the same inlined strings as before, so there is no runtime fetch and no new request. | met |
| AC-3 | Shell set unchanged and complete | `SHELL_ASSETS` is 53 keys: 44 derived (22 tiles + 22 stickers) in registry order, then the nine unchanged non-game rows. Two independent suites pin it: `preloadScene.test.ts` compares the runtime table key-for-key and SVG-for-SVG against an independently globbed disk map, and `shellOwnership.test.ts` compares the registered keys against its own literal 53-key golden list. | met |
| AC-6 | `pnpm build` succeeds | exit 0 with the precache entry count and byte total unchanged. | met |

## Behavior preservation

- The 44 game keys and the SVG markup behind each one are identical to the pre-track
  table; only the *load order* changed, from the old hand-written literal order to
  registry order (`tile_first_sounds` used to precede `tile_pattern_builder`). Load order
  has no observable effect: entries are independent `load.svg` calls and the boot gate
  measures the same 0.59 s median.
- The nine non-game rows (mascot x2, `icon_speaker`, six avatars) stay literal in the
  table and stay in their original positions at the end.
- `ui/tile_feelings_faces.svg`, which lives outside `ui/tiles/`, is picked up by the
  `ui/**/*.svg` glob and is covered by the disk-truth comparison.

## Evidence paths

- `conductor/tracks/20261020-game-metadata-source/verification/phase-3.md` (this file)
- `.conductor/evidence/preload-block.txt` — the generated `SHELL_ASSETS` block spliced into the scene
- `.conductor/evidence/preload-test-tail.txt` — the rewritten test tail
- `.conductor/evidence/preview.log` — vite preview output used by the boot gate

## Deviations

1. **`src/__tests__/game/art/shellOwnership.test.ts` was updated.** Its 53-key pin read
   the literal `key:`/`svg:` rows out of `PreloadScene.ts`; those rows no longer exist for
   game assets. The suite now imports the runtime `SHELL_ASSETS` (with a minimal
   `vi.mock("phaser")`) and still compares against its own independent literal 53-key
   list, so the guard kept its strength rather than being deleted. The file is inside
   Phase 3 `Touches` (`src/__tests__/**`).
2. **`tileCount` parameters are annotated `number`.** `GAME_REGISTRY.length` narrows to the
   literal type `22` under `as const`, which made `pageCount(23)` a type error in the new
   forward-compatibility test; explicit `number` annotations fixed it without changing
   behaviour.
3. **Phase 2 work was completed by the primary, not a subagent** — the `conductor-phase`
   subagent could not start (platform seat error). Phase 3 followed the same path after a
   second launch attempt failed identically.

## Notes

- One full-suite run reported a single 5 s timeout in
  `src/__tests__/scenes/hubEngagement.test.ts` ("keeps tile taps navigating to games after
  press feedback is attached", 5431 ms). The suite passes in isolation (66/66) and passed
  on the next full run (2321/2321), so it is a load-sensitive flake unrelated to this
  phase; no code was changed for it.
- The duplicate-key guard proof initially overwrote a tracked asset
  (`ui/tiles/tile_story_order.svg`) because that file already existed; it was restored with
  `git checkout --` and the proof was repeated against `ui/tile_story_order.svg`. No asset
  content changed in this phase.
