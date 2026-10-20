# Integrated Verification — Shell Diet: Per-Game Lazy Art Chunks

- **Track:** `20261020-shell-diet-lazy-art`
- **Branch:** `refactor/20261020-shell-diet-lazy-art`
- **Base:** `f377bf8` (master at track creation)
- **Head at verification:** `43a8b7f` (all five phases verified)
- **Date:** 2026-10-20
- **Result:** verified

## Summary

The shell no longer carries game-only art. `PreloadScene` rasterizes 53 textures
(22 tile icons, 22 stickers, `mascot_idle`, `mascot_celebrate`, `icon_speaker`, and
the six profile avatars that render before any game chunk loads); the remaining
125 keys live in twelve group modules under `src/game/art/` and are queued by each
game scene's own `preload` through the idempotent `preloadArtGroups` registry. The
shell entry fell from **195.4 KiB to 129.1 KiB** and cold boot from **808 ms to
419.5 ms**, with the CI boot gate unchanged at 3 s.

## Gate run (full `verify_phase` chain, run once, sequentially)

| Command | Exit | Evidence |
| --- | --- | --- |
| `pnpm check` | 0 | 230 files; 1 warning (`noNonNullAssertion`, `src/__tests__/scenes/musicalMemoryScene.test.ts:294`) + 1 info (biome schema 2.5.5 vs CLI 2.5.10) — both pre-existing |
| `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| `pnpm test -- --run` | 0 | 110 files / 2,304 tests passed |
| `pnpm test:coverage` | 0 | statements 97.75%, branches 90.66%, functions 96.24%, lines 98.56% (gates 95/85/88/90) |
| `pnpm build` | 0 | shell `index-B6MRA70p.js` 132.21 kB; precache 53 entries / 1,701.34 KiB |
| `node scripts/validate-bundle.js` | 0 | shell 129.1 kB ≤ 200 kB; exactly one `phaser-*.js` chunk |
| `node scripts/validate-pwa.js` | 0 | 16/16 checks, "41 chunks, 41 precached" |
| `node scripts/validate-boot.js` | 0 | **median 1.06 s** ≤ 3.0 s (3 cold loads, fresh context each; samples include 1,063 ms and 873 ms) |

## Acceptance criteria

| ID | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| AC-1 | Shell entry ≤ 170 KiB, one Phaser chunk | **PASS** | 129.1 KiB; `validate-bundle` |
| AC-2 | Group integrity (keys, ownership, 178 union) | **PASS** | `groupIntegrity.test.ts` |
| AC-3 | Each key rasterized once per tier, repeat-safe registry | **PASS** | `preloadArtGroups.test.ts` |
| AC-4 | Every scene declares what it draws; shell draws no game-only art | **PASS** | `artDeclarations.test.ts`, `shellOwnership.test.ts` |
| AC-5 | Missing key warns once and draws a placeholder, never throws | **PASS** | `placeholder.test.ts` |
| AC-6 | `validate-pwa` fails when an art chunk is absent from the manifest | **PASS** | proven by deleting one `sw.js` entry in phase 5 |
| AC-7 | Boot medians improve; CI gate unchanged | **PASS** | 808 → 419.5 ms; 4×-throttled ~4.2 s → 1,697.2 ms; gate still 3 s |
| AC-8 | Cold first tap ≤ 400 ms | **PASS** | median 200.1 ms, worst game 235.8 ms |
| AC-9 | Docs match shipped behaviour | **PASS** | README, `tech-stack.md`, `TDD.md` §3.3/§3.5/§3.6/§11.3, `perf-baseline.md` addendum |

## Cross-phase checks

- **Pixel identity:** texture tiers untouched (`textureSizeFor` unchanged, same
  160/256/512 assignment per key); no asset edited, added or removed — the 178
  keys are the 178 that shipped at v1.20.0.
- **Offline first play:** with the service worker installed, going offline and
  reloading repaints the Hub and serves 41/41 chunks from cache; opening a
  partially-loaded game shows the cue and lands its art (`.conductor/evidence/offline-check.mjs`).
- **`storyOrderArt.ts` untouched:** Story Order still owns its 24 panels inside
  its lazy chunk; its guard test is intact and unweakened.
- **No new dependency:** `package.json` unchanged; no art chunk exceeds 5 kB
  (each group is SVG source strings, not a runtime).

## Deviations recorded during implementation

1. **Phase 1 registry rework.** The first version tracked queued keys module-wide
   and never released keys for a load interrupted by scene shutdown, which would
   have poisoned later visits for the whole session. Rewritten to per-scene
   ownership with `shutdown` release, with a failing-first test.
2. **Phase 3 plan edit.** A malformed edit deleted the `P3.T1` task line while
   marking phase start; restored in the same commit range.
3. **Phase 4 scope.** `navigation.test.ts` and `textureTiers.test.ts` imported the
   shell asset table directly and asserted 178 entries; both were rewritten to the
   53-key set and `Touches` was widened accordingly.
4. **Phase 4 measurement.** The phase executor could not spawn or kill a local
   server; the primary ran `measure-first-tap.mjs --with-preview` and
   `validate-boot.js`, and its numbers are recorded in `phase-4.md`.
5. **Phase 5 permissions.** The executor was denied writes to
   `conductor/tech-stack.md`; the primary appended the prepared block, and ran the
   offline check the phase could not.
6. **Pre-existing, not introduced:** the biome schema-version info and the
   `noNonNullAssertion` warning in `musicalMemoryScene.test.ts` were already
   present on `master` before this track; they are non-blocking and were left
   untouched to keep the diff surgical.

## Notes

- The shell has ~70 KiB of headroom under the 200 KiB gate, so a new game's tile
  icon and sticker cost the boot payload roughly nothing beyond their own art.
- `docs/TDD.md` §3.6 still quotes a few per-file chunk sizes from before the
  split; the bundle-level figures in that section and in README are current. Left
  for the review pass to decide rather than widening this track's scope.
