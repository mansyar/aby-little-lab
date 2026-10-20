# Review: Shell Diet: Per-Game Lazy Art Chunks

- **Track:** `20261020-shell-diet-lazy-art`
- **Type:** `refactor`
- **Branch:** `refactor/20261020-shell-diet-lazy-art`
- **Range:** `f377bf8..a27e933`
- **Date:** 2026-10-20
- **Verdict:** `BLOCK`

## Summary

The lazy-art split itself holds up: the twelve group modules are frozen, key-unique
and complete (131 keys, 125 game-only), `preloadArtGroups` is genuinely
per-scene owned with a `shutdown` release path traced against Phaser's own loader,
all 21 game scenes declare the groups they actually draw (checked transitively
through `wordLogic`, `countLogic`, `memoryMatchLogic`, `shapeSorterLogic`), and the
shell really did shrink from 195.4 KiB to 129.1 KiB with tier assignments
unchanged.

Two deliverables do not survive scrutiny. The FR-6 placeholder path is **dead
code**: nothing in `src/` calls `ensureArtTexture`, it is not re-exported from
`src/game/art/index.ts`, and no load failure ever draws it, yet three documents
describe it as shipped. And the AC-8/NFR-1 measurement measures neither the
widest group union nor the worst case: it taps four games and gates on their
median, so a single game can blow the 400 ms budget while the script exits 0.
Because `review.strict` is `true`, both blocking findings are fixed in this track
rather than deferred.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| static | `pnpm check` | pass (1 pre-existing warning, 1 pre-existing info) | `verification/integrated.md` |
| static | `pnpm typecheck` | pass | `verification/integrated.md` |
| unit | `pnpm test -- --run` | pass, 110 files / 2,304 tests | `verification/integrated.md` |
| coverage | `pnpm test:coverage` | pass, 97.75 / 90.66 / 96.24 / 98.56 | `verification/integrated.md` |
| build | `pnpm build` | pass | `verification/integrated.md` |
| build-artifact | `node scripts/validate-bundle.js` | pass, 129.1 kB shell, one Phaser chunk | `verification/integrated.md` |
| build-artifact | `node scripts/validate-pwa.js` | pass, 16/16, 41 chunks precached | `verification/integrated.md` |
| smoke | `node scripts/validate-boot.js` | pass, median 1.06 s (gate 3.0 s) | `verification/integrated.md` |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1.T2, P4.T1 | `groupIntegrity.test.ts`, `shellOwnership.test.ts` | covered |
| FR-2 | P1.T1.1 | `preloadArtGroups.test.ts` | covered |
| FR-3 | P3.T1, P3.T2 | `artDeclarations.test.ts`, `preloadArt.test.ts` | covered |
| FR-4 | P4.T1 | `preloadScene.test.ts`, `shellOwnership.test.ts`, `navigation.test.ts` | covered |
| FR-5 | P2.T1 | `ArtLoadingCue.test.ts`, `preloadArt.test.ts` | covered |
| FR-6 | P2.T2 | `placeholder.test.ts` — no production caller | **missing** (F1) |
| FR-7 | P5.T1 | `validate-pwa.js` + negative proof | covered |
| FR-8 | P4.T1, P5.T2 | `shellOwnership.test.ts` | covered |
| FR-9 | P5.T3 | README, tech-stack, TDD, perf-baseline | covered (restates the FR-6 claim - F1) |
| NFR-1 | P4.T3 | `measure-first-tap.mjs` — wrong worst game, median gate | **partial** (F2) |
| NFR-2 | P5.T1 | 41/41 precached; offline check run | covered |
| NFR-3 | P4.T1 | `textureSizeFor` unchanged; corpus assertion narrowed | partial (F7) |
| NFR-4 | P4.T1 | `package.json` untouched; 9 art chunks | covered |
| NFR-5 | P5.T4 | `integrated.md` gate table | covered |
| AC-1 | P4.T1 | 129.1 KiB + one `phaser-*.js` | covered |
| AC-2 | P1.T3.1 | `groupIntegrity.test.ts` | covered |
| AC-3 | P1.T3.2 | `preloadArtGroups.test.ts` | covered |
| AC-4 | P3.T3, P5.T2 | `artDeclarations.test.ts` (hand-maintained scene list - F3), `shellOwnership.test.ts` | covered (F3 caveat) |
| AC-5 | P2.T3.2 | none | **missing** (F1) |
| AC-6 | P5.T1 | negative proof in `phase-5.md` | covered |
| AC-7 | P4.T3.1 | 808 → 419.5 ms; ~4.2 s → 1697.2 ms | covered |
| AC-8 | P4.T3.2 | `measure-first-tap.mjs` | **partial** (F2) |
| AC-9 | P5.T3 | four docs | covered |

## Findings

### Critical

- none

### High

- **F1 - The FR-6 placeholder is dead code, and three docs claim it ships**
  - **File:** `src/game/art/placeholder.ts:32`, `src/game/art/index.ts:9`, `src/game/art/registry.ts:70`
  - **What:** `ensureArtTexture()` has no production call site. `index.ts` does not
    re-export it, and `preloadArtGroups`'s only failure handling is
    `onLoadError: (file) => releaseKey(file.key)`, which returns the key to the pool
    for a later retry and never draws anything. A key that fails to rasterize
    therefore renders Phaser's `__MISSING` frame with no warning.
  - **Why:** FR-6 is unimplemented and AC-5 is "proven" only by a unit test of code
    production never reaches — a test that cannot fail. `docs/TDD.md:374`,
    `conductor/tech-stack.md:383` and `verification/integrated.md` all describe the
    placeholder as shipped, so a maintainer debugging a blank shape is misled.
  - **Fix:** Have the registry remember per-scene failed keys on `loaderror` and draw
    them from the load-complete path (`ensureArtTexture` for each, once), and add a
    scene-level test: a declared SVG fails, the scene asserts exactly one
    `console.warn` for that key, a placeholder texture exists at the tier size, and
    the round still completes.
  - **Requirement:** FR-6, AC-5
  - **Test gap:** scene-level missing-key test (warn once, placeholder drawn, round
    completable).

- **F2 - The first-tap measurement taps the wrong worst game and gates on the median**
  - **File:** `scripts/measure-first-tap.mjs:77-82`, `:452-472`
  - **What:** `TARGETS` is `ShapeSorter, Alphabet, AddItUp, MemoryMatch`, and the
    comment calls Memory Match "the widest union". After Phase 3 the widest unions
    are `WordMatch`/`WordBuilder`/`DecodeIt`/`FirstSounds` (seven groups, 83 keys);
    Memory Match is 37 keys and Add It Up 48. Separately, the budget check compares
    the **median across games** (`taps.medians.totalMs`) rather than `taps.worst`,
    so one game can exceed 400 ms and the script still prints PASS and exits 0.
  - **Why:** AC-8/NFR-1 are the only criteria that justify deferring 125
    rasterizations behind a tap, and the recorded 200.1/235.8 ms figures are cited
    as their proof in `README.md:220`, `docs/perf-baseline.md:248` and
    `integrated.md`.
  - **Fix:** add `WordMatch` (largest union) to the targets, correct the comment,
    gate on the worst game's total while still reporting medians, re-record the
    numbers in `phase-4.md`, `integrated.md`, README and perf-baseline.
  - **Requirement:** NFR-1, AC-8
  - **Test gap:** the evidence must cover the largest-union game and fail on the
    worst case, not the average.

### Medium

- **F3 - The art-declaration scan cannot see a new game scene**
  - **File:** `src/__tests__/scenes/artDeclarations.test.ts` (`SCENES` table)
  - **What:** the scan reaches scenes through a hand-written list of 22 `?raw`
    imports. A 23rd scene file added to `src/scenes/` is never scanned and the
    suite stays green. (`GAME_MODULES` is protected by an unknown-import failure;
    the scene list is not.)
  - **Why:** the guard exists for "the next game adds art" and cannot see exactly
    that change.
  - **Fix:** derive the scene list with `import.meta.glob(...{ query: "?raw",
    eager: true })`, exclude `Preload`/`Hub`, and assert the discovered count.
  - **Requirement:** FR-3, AC-4
  - **Test gap:** yes — prove it by adding a scene file without listing it.

### Low

- **F4 - `SHELL_ASSET_COUNT = 178` documents the pre-track truth inside the guard**
  - **File:** `src/__tests__/game/art/groupIntegrity.test.ts:118`
  - **What:** the constant is commented "How many SVGs the boot preloader carries
    today"; the boot preloader now carries 53.
  - **Why:** the guard that documents the shell diet invites a future edit to
    restore 178 to the shell.
  - **Fix:** rename to `TOTAL_APP_ASSETS`, reword as 53 shell keys plus 125
    game-only keys.
  - **Requirement:** FR-4
  - **Test gap:** none.

- **F5 - The cue-disposal test cannot fail for the property it names**
  - **File:** `src/__tests__/scenes/preloadArt.test.ts:130-139`
  - **What:** the comment says the destroyed cue's three dots are gone, but the
    assertion expects six objects in the mock registry — it proves a second cue was
    built, not that the first was destroyed.
  - **Why:** a regression in `ArtLoadingCue.destroy()` would leak objects silently.
  - **Fix:** assert `destroy` on the first cue's mascot and dots, then that exactly
    three dots belong to the live cue.
  - **Requirement:** FR-5
  - **Test gap:** yes.

- **F6 - Three documents disagree on the art-chunk count**
  - **File:** `README.md:219`, `docs/perf-baseline.md:249`
  - **What:** README says 41 chunks "(22 game scenes, 12 art groups, ...)" and the
    perf delta says "9 new", while only nine art chunks are emitted (cutouts,
    shadows and faces inline into their sole consumer) and phase 4 recorded "new
    chunks: 0".
  - **Why:** conflicting build facts, one of them contradicting NFR-4's accounting.
  - **Fix:** say nine art-group chunks with three inlined, and set the delta to
    "9 art chunks, none added after Phase 3".
  - **Requirement:** FR-9, AC-9
  - **Test gap:** none.

- **F7 - The texture-tier budget assertion no longer covers the whole corpus**
  - **File:** `src/__tests__/utils/textureTiers.test.ts:83-97`
  - **What:** the tier-coverage and GPU-byte assertions now iterate the 53 shell
    keys, while `docs/perf-baseline.md` still claims the corpus-wide "−78%" result
    holds.
  - **Why:** the 125 moved keys keep no byte accounting, so that claim loses its
    backing test.
  - **Fix:** iterate `[...SHELL_ASSETS, ...GROUPS.flatMap(g => g.assets)]` in both
    assertions.
  - **Requirement:** NFR-3
  - **Test gap:** yes.

## Overrides

- none

## Plan compliance

All five phases carry `Status: verified` with `Result`, `Checkpoint` and `Evidence`;
the five evidence files match the recorded checkpoints (`4423b11`, `af436bf`,
`62dc293`, `4f0a47c`, `b63af7b`). Every `[x]` task was implemented and spot-checked
against the diff. Each phase commit stayed inside its declared `Touches`. Reported
deviations (the Phase-1 registry rework, the widened Phase-4 `Touches`, the
`tech-stack.md` write the phase executor was denied, the TDD corrections) are
accurate. The two unreported deviations - P2.T2 shipping a helper with no caller
and P4.T3 measuring the median instead of the worst case - are F1 and F2.

## Out of scope

- `docs/TDD.md` §3.6's per-file chunk sizes are stale relative to today's build;
  already recorded as debt in `integrated.md` and owned by PRD §7.2.
- `validate-pwa.js`'s string-scan of `precacheAndRoute` and its two `.ligne`
  checks now test nothing — pre-existing weaknesses of that script, not introduced
  here.
- `src/__tests__/scenes/musicalMemoryScene.test.ts:294` (`noNonNullAssertion`) and
  the biome schema-version info are pre-existing on `master`.
- The "before" figures (808 ms, ~4.2 s, 42 precache entries) come from an earlier
  baseline than the immediately-preceding checkpoint (196.9 KiB, 53 entries);
  mixing baselines in one table is a documentation choice, not a regression.

## Debt

- none (strict mode: every finding is fixed in Phase R1)

## Doc sync

`pending`

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | BLOCK | 0 | 2 | 1 | 4 | 0 |
