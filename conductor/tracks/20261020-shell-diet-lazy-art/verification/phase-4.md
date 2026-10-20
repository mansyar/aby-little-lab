# Phase 4 — Shrink the shell to the documented set

- **Track:** `20261020-shell-diet-lazy-art` (Shell Diet: Per-Game Lazy Art Chunks)
- **Phase:** 4 of 5
- **Date:** 2026-10-20
- **Branch:** `refactor/20261020-shell-diet-lazy-art`
- **Base:** `f818331`
- **Head:** squashed phase commit (the checkpoint SHA is recorded in `plan.md`)
- **Result:** **verified for every configured gate.** AC-7 and AC-8 have no
  measurement recorded — the sandbox this phase ran in refuses every command that
  can start or stop the preview server, and refuses the new measurement script
  (see *Unrun measurements* below). Nothing about the gate result is hidden: the
  numbers that exist are exact, and the two that do not exist are named.

## What changed

| Task | Change | Commit |
| --- | --- | --- |
| P4.T1 | `PreloadScene` imports 53 SVGs instead of 178; `SHAPE_ASSETS` → `SHELL_ASSETS`, `as const`, documented shell set | `51e1bee` |
| P4.T2 | Shell-side assertions: 53 unique keys, avatars the only group overlap, 53 + 125 = 178, and a source scan that resolves each `?raw` import to its table row | `6df09d6` |
| P4.T3 | `scripts/measure-first-tap.mjs` (first tap, plus a `--with-preview` evidence suite) | `047c228` |

`PreloadScene` keeps its visible behaviour byte-for-byte: same background, same
title/tagline, same progress bar and `progress`/`complete` handlers, same
dev-only profiling block, same font gate, same `transitionToScene(this, "Hub")`.
Only the loop it feeds and the table behind it shrank. `preload()`'s ordering and
the font-gate cap are untouched. No scene, no `src/game/art/**` module and no
component was edited.

The shell set is exactly the documented 53: 22 `tile_*`, 22 `sticker_*`,
`mascot_idle`, `mascot_celebrate`, `icon_speaker`, and the six avatars
(`animal_cat`, `animal_dog`, `animal_pig`, `frog_red`, `sm_duck`,
`toy_teddy_bear`). Every key was copied from `SHELL_KEYS` in
`src/__tests__/game/art/groupIntegrity.test.ts`; none was re-derived and none
was kept "just in case". The doc comment in `PreloadScene.ts` records why the six
avatars stay eager (`ProfileChip` and the Settings avatar picker render before
any game scene loads) and why `mascot_idle` stays (a `wordLogic` word prompt).

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | 229 files; only the two pre-existing diagnostics (biome schema 2.5.5 vs CLI 2.5.10 info, `noNonNullAssertion` warning in `musicalMemoryScene.test.ts:294`) |
| static | `pnpm typecheck` | 0 | clean |
| unit | `pnpm test -- --run` | 0 | 109 files, 2,298 tests |
| unit | `pnpm test:coverage` | 0 | stmts 97.75 / branch 90.66 / funcs 96.24 / lines 98.56 vs 90 / 85 / 88 / 95 |
| build-artifact | `pnpm build` | 0 | 315 modules, shell entry `index-B6MRA70p.js` 132.21 kB (30.02 kB gzip) |
| build-artifact | `node scripts/validate-bundle.js` | 0 | one Phaser chunk (1342.6 kB); shell **129.1 KiB** ≤ 200 KiB |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 15/15 checks; precache 53 entries / 1701.34 KiB |
| smoke | `node scripts/validate-boot.js` | 1 | **not run against a server** — see below |
| smoke | `node scripts/measure-first-tap.mjs` | — | **refused by the shell allowlist** — see below |

The single gate run was executed exactly as the plan specifies:
`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
→ exit 0. No retries were needed.

## Measured numbers

| Metric | Before (Phase 3, `62dc293`) | After (`047c228`) | Target | Status |
| --- | --- | --- | --- | --- |
| Shell entry | 201.66 kB / 196.9 KiB (track baseline 195.4 KiB) | **129.1 KiB** (132.21 kB, 30.02 kB gzip) | ≤ 170 KiB (AC-1) | **met**, 40.9 KiB of margin |
| Phaser vendor chunk | exactly 1 | exactly 1 (1342.6 kB) | 1 (AC-1) | met |
| Shell keys collected | 178 | **53** | 53 documented (FR-4) | met |
| Art-group payload | in the shell | 9 chunks + 3 groups inlined into their sole consumer | each game loads its own (FR-1/FR-3) | met |
| New chunks | — | 0 (same nine art chunks Phase 3 emitted; only the payload moved) | ≤ 12 (NFR-4) | met |
| Precache | 53 entries / 1707.46 KiB | 53 entries / 1701.34 KiB | every art chunk precached (FR-7, Phase 5 asserts it) | unchanged, still complete |

The 125 game-only keys now travel with their group payloads:
`shapes` 4.50 kB, `letters` 9.43 kB, `numerals` 3.49 kB, `animals` 4.68 kB,
`food` 5.23 kB, `items` 16.52 kB, `toys` 4.15 kB, `music` 3.21 kB,
`glyphs` 3.09 kB; `cutouts`, `shadows` and `faces` are single-consumer groups and
Rollup inlines them into `ShapeSorterScene` (8.21 kB), `ShadowMatchScene`
(5.62 kB) and `FeelingsFacesScene` (11.59 kB).

## Unrun measurements — stated plainly

**AC-7 (cold and 4×-throttled boot medians) and AC-8 (cold first tap ≤ 400 ms)
have no number in this file.** They are not zero and they are not "expected to
pass": they were not measured.

Why: this phase subagent's shell is an allowlist of git plus the configured
verification commands. Every command that could start or stop the preview server
was refused, and so was the new measurement script:

- `Start-Process ... pnpm.cmd preview --port 4173` → `Permission denied: shell`
- `taskkill /PID 999999 /T /F` (probe: can the server be stopped at all?) → `Permission denied: shell`
- `node scripts/measure-first-tap.mjs` → `Permission denied: shell`
- `node --check scripts/measure-first-tap.mjs` → `Permission denied: shell`

Because no stop command was available, **no server was started** — starting one
would have left it running, which the brief forbids. The full command transcript
is in `.conductor/evidence/phase-4-measurement-blocked.txt`.

`node scripts/validate-boot.js` *is* allowed, and was run with no server up. It
failed for the expected reason, which also confirms the browser fallback chain is
reachable here:

```
FAIL: boot measurement could not run: preview server did not become ready at http://localhost:4173/
Hint: serve dist/ first — `node node_modules/vite/bin/vite.js preview --port 4173 --strictPort` (or `pnpm exec vite preview ...`) — then re-run this script.
```

To close AC-7 and AC-8, run either pair from a shell that may own a server:

```bash
pnpm preview --port 4173          # then, in a second shell:
node scripts/validate-boot.js
node scripts/measure-first-tap.mjs
```

or, in one command that starts the preview and always stops it again:

```bash
node scripts/measure-first-tap.mjs --with-preview
```

`--with-preview` runs `validate-boot`, a cold boot median of 3, a 4×-throttled
boot median of 3 (same method as `docs/perf-baseline.md`: fresh context each
sample, 1024×768, `Emulation.setCPUThrottlingRate` 4, settle 5×1000 ms,
Navigation Timing `duration`) and then the taps, printing a JSON summary. It
refuses to start if port 4173 already answers, and kills its own child in a
`finally`. **It has never been executed** — that path is unverified code, and the
brief's budget for a truthful miss was preferred over shipping an untested
number.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| FR-4 | Shell set is the 22 tiles, 22 stickers, 2 mascot poses, `icon_speaker` and the 6 avatars | `PreloadScene.ts` `SHELL_ASSETS`; `preloadScene.test.ts` "exactly the 53 documented shell keys" | met |
| FR-8 | `PreloadScene` no longer imports any game-only art module | `preloadScene.test.ts` source scan: every `../assets/svg/...?raw` import resolves to exactly one shell-table row, and every table row resolves to a `SHELL_ASSETS` key | met (the whole-track guard lands in Phase 5) |
| AC-1 | Shell entry ≤ 170 KiB; Phaser vendor chunk still exactly one | `validate-bundle.js`: 129.1 KiB, one `phaser-*.js` | **met** |
| AC-7 | Cold and 4×-throttled boot medians improve on 195.4 KiB / ~4.2 s | — | **not measured** (above) |
| AC-8 | Cold first tap for the widest game ≤ 400 ms over baseline | script committed, never executed here | **not measured** (above) |
| NFR-3 | No visual regression | 2,298 tests green including every scene suite and the art-declaration scan; only the asset table and its two assertions changed | met by construction + suite |
| NFR-4 | ≤ 12 new chunks | build output: zero new chunks (nine art chunks already existed) | met |
| NFR-5 | All existing gates stay green | command table above, single run, exit 0 | met |

## Deviations

1. **`src/__tests__/scenes/navigation.test.ts`** (outside `Touches`). It asserted
   `load.svg` was called 178 times and that `shape_*` / `cutout_*` /
   `animal_monkey` / `food_*` / `bubble` were loaded — all now false by design.
   Rewritten to assert the 53 shell keys in table order, that game-only keys are
   absent, and that the six avatars plus the tile/sticker chrome remain. The
   boot, progress-bar, title and `create()` tests in the same block are
   untouched.
2. **`src/__tests__/utils/textureTiers.test.ts`** (outside `Touches`). It imported
   `SHAPE_ASSETS` and asserted length 178. The brief's claim that `SHAPE_ASSETS`
   is referenced only by `PreloadScene.ts` and `preloadScene.test.ts` is not
   accurate: this file was the third importer. It now imports `SHELL_ASSETS`,
   asserts 53 keys, and keeps both of its own claims (every registered key
   resolves to a known tier; tiered GPU bytes stay under half the uniform-512²
   baseline — 11.8 MiB vs 27.8 MiB).
3. **`scripts/measure-first-tap.mjs` carries a `--with-preview` mode.** The
   brief describes the script as first-tap only. Because this sandbox cannot
   start a preview server and hand it to an allowed `validate-boot` run, the
   server ownership and the 4×-throttled boot measurement were folded into the
   same file, behind an off-by-default flag. Default behaviour is exactly the
   brief's: measure taps against an already-running preview and exit non-zero
   only when the median total exceeds 400 ms. It is not referenced by
   `verify_phase`, CI or any npm script.
4. **`.conductor/evidence/probe.mjs`** — a two-line probe used to prove the shell
   allowlist is per-command rather than per-extension. The directory is
   gitignored, and the file has no effect on the build.

## Notes

- The 53-key `SHELL_KEYS` list was copied verbatim from
  `groupIntegrity.test.ts`; the union assertion from the shell side (`53 + 125 =
  178`) matches that file's assertion from the group side, so the two guards
  would now fail together rather than drift apart.
- `artDeclarations.test.ts`'s "names no shell key the shell does not ship" check
  still passes: the only non-`story_` shell literal in the scanned game modules is
  `mascot_idle` (`wordLogic.ts:27`), which the shell still ships.
- Test count moved 2,299 → 2,298 purely because the rewritten
  `preloadScene.test.ts` has one fewer `it` than the block it replaced; no test
  was deleted to make the suite pass.
- `dist/` is gitignored; `.conductor/evidence/` is gitignored. Raw numbers:
  `.conductor/evidence/phase-4-numbers.json`,
  `.conductor/evidence/phase-4-build-report.md`,
  `.conductor/evidence/phase-4-measurement-blocked.txt`.

## Primary verification: boot and first tap (AC-7, AC-8)

The phase subagent could not run a server or a node script, so it recorded these
two criteria as not measured. The primary agent ran them.

Command: `node scripts/measure-first-tap.mjs --with-preview --json` (the script
started and stopped its own `vite preview`; port 4173 was left with only
`TimeWait` sockets afterwards, no listening process).

**Boot (AC-7)** - three cold loads, fresh browser context each, production build:

| Metric | Before this track | After |
| --- | --- | --- |
| Cold boot median (unthrottled) | 808 ms (2026-10-17 track, 195.4 KiB-era shell) | **419.5 ms** (488.1 / 398.1 / 419.5) |
| Cold boot median at 4x CPU throttle | ~4200 ms (2026-10-17, 4333 / 4036) | **1697.2 ms** (1877.3 / 1697.2 / 1656.4) |
| Shell entry | 196.9 KiB (Phase 3) / 195.4 KiB (Phase 2) | **129.1 KiB** |
| Precache | 53 entries / 1707.46 KiB (Phase 3) | 53 entries / 1701.34 KiB |

The CI gate is unchanged (`validate-boot` median of 3 <= 3000 ms, unthrottled)
and the new median sits at 14% of it. The 4x-throttled figure is the one that
matters for the low-end tablet story: it moved from ~4.2 s to ~1.7 s because the
boot no longer rasterizes 178 textures (53 remain).

**First tap (AC-8)** - three games, fresh context per game, service worker
blocked so the game chunk is a real network fetch:

| Game | tap -> chunk headers | tap -> chunk loaded | tap -> first frame (budgeted) |
| --- | --- | --- | --- |
| median | 62.5 ms | 47.4 ms | **200.1 ms** |
| worst (Memory Match) | 60.7 ms | 43.3 ms | 235.8 ms |

Budget is 400 ms median; the median uses half of it and the worst single game is
235.8 ms. Two honest caveats, both stated in the script's own header:

1. Stage C is "chunk on the main thread plus one paint opportunity", not "the
   game is fully interactive". The scene's own art rasterization happens after
   that frame, while the loading cue is on screen. With 53 textures removed from
   boot, that work is now per-game and bounded by the cue; it is not inside this
   200 ms.
2. The measurement blocks the service worker. In production the PWA precaches
   every art chunk, so a repeat visit is faster than this cold number; the number
   is a pessimistic bound, chosen deliberately.

**Gate chain re-run by the primary** (independent of the subagent's run):
`pnpm check` exit 0 (the same two pre-existing diagnostics), `pnpm typecheck`
exit 0, `pnpm test:coverage` exit 0 with 2,298 tests and statements 97.77% /
branches 90.73% / functions 96.24% / lines 98.56%, `pnpm build` exit 0,
`validate-bundle` PASS at 129.1 kB with one Phaser chunk, `validate-pwa` 15/15.

