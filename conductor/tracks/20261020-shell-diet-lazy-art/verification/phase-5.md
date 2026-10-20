# Phase 5 verification — Precache guarantee, ownership guard, and docs

**Track:** `20261020-shell-diet-lazy-art`
**Branch:** `refactor/20261020-shell-diet-lazy-art`
**Phase base:** `516c14d`
**Verification command:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`, then `node scripts/validate-boot.js` against a preview server.

**Result:** verified for every gate this host can run, with one required artefact
withheld: `conductor/tech-stack.md` could not be written from this phase (every
`edit` attempt returned `permission.rejected: permission denied: edit`, on three
different anchors and both relative and absolute paths, while `README.md`,
`docs/TDD.md` and `docs/perf-baseline.md` were writable in the same session). The
prepared dated blockquote is quoted in full at [§P5.T3](#p5t3--docs) and in
`.conductor/evidence/tech-stack-art-ownership-block.md` for the primary agent to
append after line 381. `node scripts/validate-boot.js` reports `FAIL: boot
measurement could not run: preview server did not become ready at
http://localhost:4173/` because this host refuses commands that start a server;
the boot/tap medians quoted below are the primary agent's run at the Phase 4
checkpoint. The manual offline first-play check is **not run - primary to verify**.

## Tasks and commits

| Task | Commit | What landed |
|---|---|---|
| P5.T1 | `7e7e1a8` | `scripts/validate-pwa.js`: every emitted `dist/assets/*.js` chunk must appear in the precache manifest |
| P5.T2 | `57bdf62` | `src/__tests__/game/art/shellOwnership.test.ts`: the shell may not reach game art |
| P5.T3 | `e101577` | `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` (tech-stack blocked — see below) |
| P5.T4 | this file | Integrated evidence |

## P5.T1 — the precache assertion

`validate-pwa.js` gained one check in the existing `checks` array, so the output
shape is unchanged: a `✓`/`✗` line, an indented note, and the trailing
`Results: N passed, M failed` line. The check reads `dist/assets/*.js` (the
emitted chunks) and every `url:"…"` entry inside the `precacheAndRoute([…])`
manifest, and passes only when all 41 chunk URLs are present. A `PRECACHE_ALLOWLIST`
set exists for files Workbox would refuse to precache; it is empty today, and a
file only lands there with a comment saying why.

Positive direction (real build):

```
✓ Service worker precaches every emitted JavaScript chunk
  41 chunks, 41 precached
Results: 16 passed, 0 failed
```

Negative direction (AC-6, the direction that matters): the built artefact was
doctored, not the source — the single entry
`{url:"assets/items-BRl4aWf0.js",revision:null},` was deleted from `dist/sw.js`
and the validator re-run, without rebuilding:

```
✗ Service worker precaches every emitted JavaScript chunk
  41 chunks, 40 precached, missing: items-BRl4aWf0.js
Results: 15 passed, 1 failed        (exit code 1)
```

`dist/` was then regenerated with `pnpm build` (identical hashes and sizes:
`index-B6MRA70p.js` 132.21 kB, precache 53 entries / 1701.34 KiB) and the
validator returned to 16/16, so the tree was restored by rebuilding rather than
by hand-repairing the doctored file.

## P5.T2 — the ownership guard

`src/__tests__/game/art/shellOwnership.test.ts` reads sources with `?raw` (the
codebase pattern; no test imports `node:fs`). It holds its own 53-key `SHELL_KEYS`
list and derives nothing from `PreloadScene`: a scene that declared its own truth
would be able to bless any import it added, which is the failure mode the test
exists to prevent. Every other fact is derived: the twelve group modules through
`import.meta.glob("../../../game/art/*.ts", { query: "?raw", … })`, their key →
SVG-file maps from the `?raw` import statements, and the SVG corpus through
`import.meta.glob("../../../assets/svg/**/*.svg")` so "the file exists on disk"
is checked too.

Six tests:

| Test | Rule |
|---|---|
| Shell set | exactly the 53 documented keys, unique — compared as sets, so the scene may reorder its table |
| Registry reach | `PreloadScene` imports no module of the art registry; a type-only import of `index`/`types` is the only exception |
| Game-only SVG | no SVG file that backs a game-only key is imported by the shell |
| Counts | 131 group keys, 125 game-only, 24 Story Order panels |
| Shared files | the shell shares exactly the six avatar files with the groups |
| Reach | every group and story key maps to an SVG that exists on disk and in its module |

Both guards were proven by injecting the failure and reverting:

- `import shapeCircleSvg from "../assets/svg/shapes/shape_circle.svg?raw";` added
  to `PreloadScene.ts` → two tests failed, naming `['shape_circle']` and
  `7 shared files` (six avatars plus the intruder). This also exposed a real gap
  in the first draft: the scan had only inspected table-referenced imports, so an
  unused import of game art slipped through. The rule now reads every SVG import
  statement in the shell, registered or not.
- `import { shapes } from "../game/art";` added → the registry test failed with
  `['../game/art']`. The first draft only matched `"../game/art/…"` specifiers
  and missed the bare index import; `isArtRegistryPath()` now matches both forms.

`src/__tests__/game/storyOrderArt.test.ts` is untouched and still green (its 24
panel assertions, ordering, markup contract and Latin-1 checks are unchanged).
`groupIntegrity.test.ts` and `preloadScene.test.ts` are also untouched.

## P5.T3 — docs

`README.md` (bundle section, plus the stale tile-icon size):

- Tile icons corrected 80 px → 64 px (`hubGrid.ts` `TILE_ICON_DISPLAY = 64`).
- "Build output (2026-10-20)": 129.1 KiB shell entry (132.21 kB minified, 30.02 kB
  gzip) against the 200 kB gate, the 1.37 MB Phaser vendor chunk, and 41
  JavaScript chunks (22 game scenes, 12 art groups, shared bases, Phaser, the
  workbox helper).
- "Cold boot (2026-10-20)": 419.5 ms median of three fresh contexts versus 808 ms,
  1697.2 ms at 4× throttle versus ~4.2 s, both inside the 3 s `validate-boot`
  gate; first tap 200.1 ms median / 235.8 ms worst against the 400 ms budget,
  with `scripts/measure-first-tap.mjs --with-preview` named as the evidence and
  explicitly not a gate.
- "Art ownership (2026-10-20)": the 53-key shell set enumerated, the twelve named
  groups, per-scene `preloadArtGroups()`, Story Order's own module, 178 = 53 + 125
  with the six avatars overlapping, `shellOwnership.test.ts` as the guard, and
  `hubTiles.ts` still the roster that a new game extends.
- "Offline is unchanged": 53 precache entries / 1,701.34 KiB and the fact that
  `validate-pwa` fails the build when a chunk is missing.

`docs/TDD.md`:

- §3.3 now documents `SHELL_ASSETS` (53 entries), the three groups that stay eager
  (avatars, mascots, the speaker glyph) and "178 keys in the app, 53 in the shell".
- §3.5 rewritten as in-chunk art: the twelve groups with counts (131 keys, 125
  game-only), `preloadArtGroups(scene, groups)` and its idempotence (`mascot_idle`
  satisfied by an existing texture, in-flight keys skipped), per-scene ownership
  including the shutdown release, the loading cue, the placeholder + one warning
  path, Story Order, the tests that hold the boundary, and the measured budgets.
- §3.6 table: boot textures 53, a game-art row (9 chunks of 3.1–16.5 kB, three
  groups inlined), shell entry 129.1 kB, precache 53 / 1,701.34 KiB.
- §11.3: `validate-pwa.js` 15 → 16 checks, naming the new chunk-coverage rule.
- §2.3: the asset-corpus sentence "`src/assets/svg/stories/` is the only folder
  that is not part of the boot set" was false after Phase 4 and was corrected
  (see deviations).

`docs/perf-baseline.md`: a new dated section appended (history untouched) —
`## Shell Diet — Lazy Art Groups — 2026-10-20` with method, the before/after table
(shell 195.4 → 129.1 KiB, boot textures 178 → 53, 808 → 419.5 ms, ~4.2 s →
1697.2 ms, first tap 200.1 / 235.8 ms, 9 art chunks, precache 42 → 53 entries and
2189.6 → 1701.34 KiB) and notes on the two tap caveats, the unchanged CI gate and
the unchanged texture-tier result.

`conductor/tech-stack.md` — **not written; blocked for the primary.** The
intended entry, to append after the 2026-10-16 Drop Ligne Engine blockquote:

> **2026-10-20 — Design Update (Shell Diet — Art Ownership):** The boot shell and game art are separate budgets. `PreloadScene` ships the 53-key shell set and nothing else (22 tiles, 22 stickers, `mascot_idle`, `mascot_celebrate`, `icon_speaker`, 6 avatars); a game's art belongs to a named group under `src/game/art/` (`shapes` 18, `cutouts` 18, `letters` 26, `numerals` 10, `animals` 6, `food` 6, `items` 16, `shadows` 8, `toys` 7, `faces` 4, `music` 4, `glyphs` 8 = 131 keys, 125 game-only), declared by that scene and rasterized in its own `preload` through `preloadArtGroups(scene, groups)`. Enforcement rule: never import game art in `PreloadScene` — a new game adds a group and a `preloadArtGroups` call in its own scene. `src/__tests__/game/art/shellOwnership.test.ts` fails on a game-only SVG or registry import in the shell, `groupIntegrity.test.ts` fails on a key in two groups, and `scripts/validate-pwa.js` fails when any emitted chunk is missing from the precache manifest. Runtime failure path: the textless loading cue (FR-5) while a group loads, the neutral placeholder plus one `console.warn` for a missing key (FR-6). Measured: shell 195.4 → 129.1 KiB (200 kB gate), cold boot 808 → 419.5 ms, 4×-throttled ~4.2 s → 1697.2 ms, cold first tap 200.1 ms median / 235.8 ms worst (400 ms budget), precache 53 entries / 1701.34 KiB.

## P5.T4 — commands

Run once, in order, no retries.

| Command | Exit | Output |
|---|---|---|
| `pnpm check` | 0 | 230 files; the two pre-existing diagnostics only (biome schema 2.5.5 vs CLI 2.5.10 info; `noNonNullAssertion` warning at `musicalMemoryScene.test.ts:294`) |
| `pnpm typecheck` | 0 | no output |
| `pnpm test -- --run` | 0 | 110 files, 2,304 tests passed |
| `pnpm test:coverage` | 0 | stmts 97.77 / branch 90.73 / funcs 96.24 / lines 98.56 against 90 / 85 / 88 / 95 |
| `pnpm build` | 0 | 315 modules; `index-B6MRA70p.js` 132.21 kB / 30.02 kB gzip; `phaser-P1E8uaLi.js` 1,374.82 kB; `StoryOrderScene` 33.92 kB; 9 art-group chunks 3.09–16.52 kB; precache 53 entries / 1701.34 KiB |
| `node scripts/validate-bundle.js` | 0 | `PASS: Phaser vendor chunk present: phaser-P1E8uaLi.js (1342.6 kB)`; `PASS: shell entry index-B6MRA70p.js = 129.1 kB (<= 200 kB)` |
| `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed; `41 chunks, 41 precached` |
| `node scripts/validate-boot.js` | 1 | `FAIL: boot measurement could not run: preview server did not become ready at http://localhost:4173/` — no server may be started on this host, so no boot median was taken here |

The test count moved 2,298 → 2,304 (the six new ownership tests). Test files moved
109 → 110.

### Manual offline first-play check

**Ran (primary agent), PASS.** `node .conductor/evidence/offline-check.mjs`
(spawns `vite preview --port 4173`, loads the Hub online until
`navigator.serviceWorker.ready`, then `context.setOffline(true)` and reloads):

- precache holds 41 javascript entries before going offline;
- the offline reload repaints the Hub (87,602-byte screenshot; a blank canvas
  compresses to a few hundred bytes, and a WebGL canvas cannot be probed through
  `drawImage` because Phaser does not set `preserveDrawingBuffer`);
- all 41/41 precached chunks - shell, Phaser vendor, nine art-group chunks and
  every game scene - are served from the cache while offline;
- no page errors.

`node scripts/validate-boot.js` also ran against a preview of the same build:
samples 960 / 848 / 950 ms, **median 0.95 s** against the 3.0 s CI budget (the
419.5 ms figure above is the stricter measure: Navigation Timing per fresh
context with no settle allowance; both are cold, both pass).

`conductor/tech-stack.md`: appended by the primary agent (the phase executor was
denied write access to that path) as the dated entry after the 2026-10-16 block.


## Deviations

1. **`conductor/tech-stack.md` not written.** Every write returned
   `permission.rejected`. Listed in Touches and covered by AC-9; the prepared
   entry is above and in `.conductor/evidence/tech-stack-art-ownership-block.md`.
   No code or other doc depends on the gap; the rule is already enforced by the
   tests and documented in TDD §3.5, README and perf-baseline.
2. **`docs/TDD.md` §2.3 corrected** (one sentence) even though the brief named the
   bundle/preload section. It claimed `src/assets/svg/stories/` was "the only
   folder that is not part of the boot set", which Phase 4 made false for eleven
   more folders; leaving it would contradict §3.5 in the same document.
3. **`docs/TDD.md` §11.3 updated** ("15 named checks" → 16, plus the new rule) for
   the same reason: P5.T1 changes what that validator does.
4. **`README.md` tile-icon size corrected** 80 px → 64 px. Pre-existing and
   unrelated to the art split, but the paragraph sits in the Hub section the brief
   asked to bring in line with the code.

## Notes for review

- Numbers quoted as "before" are the track baseline (195.4 KiB, 808 ms, ~4.2 s);
  the Phase 3 checkpoint measured 196.9 KiB because game scenes had grown. The
  deliverable figure is the Phase 4 checkpoint's 129.1 KiB.
- `src/__tests__/game/art/shellOwnership.test.ts` is the only place the 53 shell
  keys are enumerated besides `GroupIntegrity.SHELL_KEYS` and
  `PreloadScene.SHELL_ASSETS`; the duplication is deliberate (see P5.T2).
- TDD §3.6 still quotes the shared-chunk figures from an earlier build
  (`GameSceneBase` 7.98 kB and friends; it is 10.24 kB today). Those live under
  "PRD §7.2 owns them", so they were left for that owner rather than re-measured
  here.
- README's "Offline is unchanged" claims are now backed by a seeded negative test
  rather than by inspection: delete one chunk entry from `dist/sw.js` and
  `validate-pwa.js` fails with the missing chunk named.
