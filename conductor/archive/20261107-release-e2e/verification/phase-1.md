# Phase 1 evidence — The read-only bridge

- **Track:** `20261107-release-e2e`
- **Phase:** 1 — The read-only bridge
- **Date:** 2026-11-07
- **Branch:** `chore/20261107-release-e2e`
- **Phase base:** `b3733a16`
- **Head:** `b4be93a85a274418624efaaeee07efd096f48690`
- **Result:** verified — the full configured chain exits 0, the shell is 150.6 kB of its 200 kB gate, and the suite is 133 files / 2,845 tests green.

## What changed, file by file

| File | Change |
| --- | --- |
| `src/game/e2eBridge.ts` (new) | `E2ERoundTarget`, `E2ERoundGeometry`, `E2EBridge` and `initE2EBridge(game)`. The gate is `new URLSearchParams(location.search).get("e2e") === "1"`; without it the function returns before touching `window`. With it, a frozen object is assigned to `window.__abyE2E` whose five accessors read live state on every call: active scene key via `game.scene.getScenes(true)[0]?.scene.key`, `profileCount` from `getProfiles()`, `stickerCount` from the active profile's earned stickers, `roundIndex` from the active scene's filled progress dots, and `roundGeometry` by duck-typing a `e2eRoundGeometry` hook on the active scene. No setter, no storage write, no scene import (the dependency points scenes → bridge types only). |
| `src/main.ts` | Keeps the `Phaser.Game` instance (`const game = new Phaser.Game(config)`) and calls `initE2EBridge(game)`. The diff is the import, the two lines and a two-line comment. |
| `src/scenes/GameSceneBase.ts` | New `protected e2eRoundGeometry()` hook returning `null`, plus the type-only import. |
| `src/scenes/ShapeSorterScene.ts` | Override: every shape's current position as a target (id = shape type) and every slot (id = shape type, static coordinates) as a slot. |
| `src/scenes/AddItUpScene.ts` | Override: the correct answer option found through `isChoiceCorrect`, reported with its `choiceTargets` card position; id = the round's numeric target. |
| `src/scenes/MemoryMatchScene.ts` | Override: one target per dealt card, id = face texture key, so equal ids are a pair; coordinates read from `cardRects` at call time. |
| `src/scenes/StoryOrderScene.ts` | Override: each solution panel as a target with the position it currently occupies (id = panel key) and the ordinal slots in solution order (id = the panel that belongs there). |
| `src/scenes/AnimalTraceScene.ts` | Override: only the unfinished waypoint tail, in trace order (ids `waypoint-<n>`), so a journey never re-touches a visited point; `round` = completed paths. |
| `src/scenes/FirstSoundsScene.ts` | Override: the correct letter card through `isChoiceCorrect`, with its `choiceTargets` position; id = the target letter. |
| `src/__tests__/game/e2eBridge.test.ts` (new) | Twelve tests over hand-built fakes (no Phaser boot): no bridge without the parameter, none for `e2e=true`, an installed bridge left untouched when the parameter is removed, a frozen window with exactly the five accessors, and each accessor observed changing between calls (scene swap, `addProfile`, `earnSticker`, dot fill, hook swap). `roundGeometry()` returns `null` with no scene and with a scene that has no hook. |
| `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` | **Deviation:** suite truth refreshed (132 files / 2,833 tests → 133 files / 2,845 tests, plus the measured coverage figures) because `validate-docs` fails when the living docs disagree with the derived suite counts. No code or behaviour change. |

## Commands

| Command | Exit | Key output |
| --- | --- | --- |
| `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | 0 | `biome check`: 273 files, no fixes. `tsc --noEmit`: clean. Unit: **133 files / 2,845 tests passed** (24.01 s). Coverage: statements 97.09 % (5839/6014), branches 91.09 % (1595/1751), functions 95.95 % (1281/1335), lines 98.12 % (5434/5538) — all four thresholds met. Build: 363 modules, `index-BjIHdBtn.js` 154.18 kB, `phaser-B_vcVLyb.js` 1,367.08 kB. Bundle: `PASS: shell entry index-BjIHdBtn.js = 150.6 kB (<= 200 kB)` and the vendor chunk present. PWA: 16 passed, 0 failed (47 chunks, 47 precached). Docs: 5 passed, 0 failed. |
| `pnpm test -- --run` (first run, pre-doc-fix) | 0 | 133 files / 2,845 tests — same suite the chain later re-ran. |
| `node scripts/validate-boot.js` (workflow's boot smoke) | — | **Not run:** the preview-plus-smoke composition was refused by the shell permission layer (`Permission denied: shell`). The script needs `vite preview --port 4173` already serving `dist` (it does not spawn one). Left for the primary to run. Independent evidence that boot is unchanged in shape: `main.ts` gained only an import and two statements after the same `new Phaser.Game(config)`. |

## Acceptance

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| FR-1 | `window.__abyE2E` exists only with `?e2e=1`; reports active scene key, profile count, sticker count, round index and read-only geometry for the six sampled scenes; absent and inert without the parameter | `src/game/e2eBridge.ts` gate + frozen assignment; `src/main.ts` registration; six scene overrides; `src/__tests__/game/e2eBridge.test.ts` (no bridge without the parameter, none for `e2e=true`, installed bridge untouched after the parameter is removed, frozen window, live values for every accessor) | met |
| AC-1 | Bridge reports the active scene with `?e2e=1`, undefined without, shell within the bundle gate | The gate tests above; `validate-bundle` shell 150.6 kB ≤ 200 kB | met |
| NFR-1 | No product behaviour change; the bridge is inert without the parameter; shipped shell inside the 200 kB gate | Without the parameter `initE2EBridge` returns before any assignment (test-asserted); the shell grew 150.0 → 150.6 kB, still 49.4 kB under the gate | met |

## Deviations

1. `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` — outside `Touches`. `node scripts/validate-docs.js` derives the suite counts from the tree and fails while the living docs still say 132 files / 2,833 tests. Updated the counts (and the adjacent coverage figures) to the measured truth; no code change.

## Notes for the next phase

- **Geometry contract:** `targets` are the correct answers for the current round; `slots` (drag games only) are drop positions. Pairing is by `id`:
  - Shape Sorter — target id and slot id are both the shape type.
  - Story Order — target id and slot id are the panel texture key, and the slot's id is the panel that belongs there; target coordinates are the panel's *current* position, so read geometry again after a drop.
  - Memory Match — one target per card, id = face texture key; two cards share an id and are a pair.
  - Add It Up / First Sounds — a single target: the correct card's centre.
  - Animal Trace — the unfinished waypoint tail in order; call `roundGeometry()` again between touches to get the next point (the tail shrinks as the trail advances). `round` counts *completed paths* here, not finished rounds.
- **`roundIndex()` counts filled progress dots.** A dot is filled when `alpha === 1`; the pop tween's scale is not a state signal. Every game scene fills one dot per completed round, so the suite can poll it for any game. Add It Up and First Sounds report dots from the base class the same way.
- **Scene visibility:** the bridge reads `game.scene.getScenes(true)[0]`, i.e. the first *active* scene. During a transition there may be a gap where it reports `null` — the suite should poll rather than assume one call succeeds.
- **Type-only dependency:** scenes import `E2ERoundGeometry` from `src/game/e2eBridge.ts`. That module imports `../utils/storage` but no Phaser runtime, so scenes pull in no extra runtime cost from the type.
- **Gate parameter:** only the exact value `1` installs the bridge; `e2e=true` and `e2e=0` do not.
- **Docs:** the suite truth in `README.md`, `docs/TDD.md` and `docs/perf-baseline.md` is now 133 files / 2,845 tests. Any later phase that adds test files must refresh those three documents or `validate-docs` fails.
- **Coverage:** 97.09 / 91.09 / 95.95 / 98.12 against thresholds 90 / 85 / 88 / 95 (statements / branches / functions / lines). Headroom is 2.1 points on branches — keep new e2e helpers small or add unit coverage for them.

## Primary verification

Verified 2026-11-07 by the primary agent, independently of the phase executor.
Phase base `b3733a16`, head `58475aff`.

| Check | Command | Result |
|---|---|---|
| Tree clean | `git status --porcelain` | empty |
| Commits in range | `git log --oneline b3733a16..HEAD` | 4 commits, no merges |
| Scope | `git diff --stat b3733a16..HEAD` | 10 `src/` files + 3 living docs + this evidence file |
| Gate, by reading the code | `src/game/e2eBridge.ts` | `bridgeRequested()` reads `location.search`; returns before any assignment; `Object.freeze` on the window object; no setter, no storage mutator |
| Bridge is one-way | imports in `src/game/e2eBridge.ts` | `phaser` (type only) and `../utils/storage`; no scene imported |
| Static | `pnpm check` | exit 0 - 273 files, no fixes |
| Static | `pnpm typecheck` | exit 0 |
| Unit | `CI=true pnpm test -- --run` | exit 0 - 133 files / 2,845 tests, 29.67 s |
| Coverage | `CI=true pnpm test:coverage` | exit 0 - 97.09 / 91.09 / 95.95 / 98.12 |
| Build | `pnpm build` | exit 0 - `dist/sw.js`, `dist/workbox-2fbc6a65.js` |
| Bundle budget | `node scripts/validate-bundle.js` | exit 0 - shell `index-BjIHdBtn.js` 150.6 kB <= 200 kB, phaser 1335.0 kB |
| PWA | `node scripts/validate-pwa.js` | exit 0 - 16 passed, 0 failed |
| Documents | `node scripts/validate-docs.js` | exit 0 - 5 passed, 0 failed |
| Boot smoke | `node scripts/validate-boot.js` against `vite preview` | exit 0 - median 0.84 s over 3 cold loads (samples 1739 / 762 / 843 ms) |

**The blocked boot smoke was run and passed.** The executor reported the
preview-plus-`validate-boot` composition as a shell permission denial. The
primary ran it directly: `vite preview --port 4173 --strictPort` in the
background against the freshly built `dist`, then `validate-boot.js`. It is
green, so the gap in the executor's evidence is closed here and the phase does
not carry it forward.

**NFR-1 read from the source, not from the report.** The only production
behaviour that changed is `main.ts` keeping the instance it used to discard, and
a `protected` method on `GameSceneBase` that returns `null` unless a subclass
overrides it. Without `?e2e=1` the bridge returns before assigning anything, so
the shipped path is behaviourally identical.

**Deviation accepted:** the three living documents (`README.md`,
`docs/TDD.md`, `docs/perf-baseline.md`) lie outside Phase 1's declared Touches.
`scripts/validate-docs.js` derives the suite counts from the tree and fails any
document that disagrees, so a new test file makes those edits mandatory for the
phase gate to be reachable - the same tension recorded as R4 in the previous
track and resolved the same way. Counts refreshed; no prose rewritten.
