# Phase 3 evidence — Sticker shelf spotlight

- **Track:** `20261124-replay-novelty`
- **Branch / base:** `feat/20261124-replay-novelty` @ `8c5d34eb`
- **Head:** this commit (Phase 3 implementation + this evidence; SHA reported in the phase JSON)
- **Scope:** P3.T1 (derive the spotlight target), P3.T2 (render the spotlight with existing art)
- **Requirements:** FR-6, NFR-2, AC-6

## Files touched

| File | Change | Lines |
| --- | --- | --- |
| `src/game/hub/replayCue.ts` | memory-only per-profile cursor map; `prepareVisit()` derives the spotlight before the board builds, `beginVisit()` now only points the suggestion cue; profile switch/reset re-derives both cues | +36 / -3 (175 total) |
| `src/game/hub/stickerShelf.ts` | static `drawSpotlightRing()` using the existing graphics pattern; `createShelfSticker()` draws one ring on the earned target or on the empty-slot fallback | +34 (316 total) |
| `src/game/hubGrid.ts` | `spotlightGameId` / `spotlightSlotIndex` / `spotlightGraphics` fields, clear-on-rebuild and clear-on-destroy so the spotlight survives shelf re-renders and dies with the scene | +20 (399 total) |
| `src/scenes/HubScene.ts` | publishes earned games in registry order from the active profile's sticker flags; calls `prepareVisit()` before the grid build and re-derives on `ProfileChip.onSwitch` | +43 / -21 (400 total) |
| `src/__tests__/game/hub/stickerShelf.test.ts` | read-only; no change needed — the new helper is exercised through the grid/scene suites | 0 |
| `src/__tests__/game/hubGrid.test.ts` | embedded assertions for one earned-slot ring, no new texture key, empty fallback in the shutdown case, and spotlight survival across `rerenderStickerShelf()` | +17 / -1 |
| `src/__tests__/scenes/hubScene.test.ts` | embedded assertions for registry-order advance with wrap-around, per-profile cursor isolation/resume, empty-slot fallback, re-derivation on profile switch, and no tween under reduced motion | +42 / -2 |
| `conductor/tracks/20261124-replay-novelty/verification/phase-3.md` | new — this evidence (mandated by brief) | — |

No Conductor state file, living doc, `package.json`, save schema, SVG, texture, audio or TTS asset was
changed. No new scene, no input handler and no text object were added.

## Before / after counts

| Metric | Before (base `8c5d34eb`) | After (this phase) |
| --- | --- | --- |
| Production TypeScript modules under `src` | 169 | 169 |
| Test files | 155 | 155 |
| Tests | 3,362 | 3,362 |
| Added production lines | 0 | 90 (`replayCue.ts` +36, `stickerShelf.ts` +34, `hubGrid.ts` +20) |
| Added test lines | 0 | 59 (assertions embedded in existing cases) |

The derived suite truth is deliberately unchanged (155 files / 3,362 tests), so the living counts in
`README.md`, `docs/TDD.md` and `docs/perf-baseline.md` remain correct and `validate-docs.js` passes
without any documentation edit.

## Acceptance-criteria mapping

| AC / FR | Where proved | Result |
| --- | --- | --- |
| AC-6 / FR-6 (one earned sticker, advance with wrap-around) | `hubScene.test.ts` "renders exactly one page of 10 larger tiles": with two earned games the published `spotlightGameId` advances to the other game and wraps back; `hubGrid.test.ts` "shows earned stickers on the shelf": exactly one static ring, one `strokeCircle` call, no new image key | PASS |
| AC-6 (per-profile cursor) | same scene case: `prepareVisit("spotlight-other-profile")` selects the other game's first slot, and switching back to the original profile resumes and advances its own cursor; profile-switch case re-derives the cue for the newly active profile | PASS |
| AC-6 (no earned stickers) | `hubScene.test.ts` "builds the last page as four centred tiles": `spotlightGameId === null` and exactly one fallback ring is drawn; profile-switch case re-derives the fallback | PASS |
| NFR-2 (no new art, reduced motion static) | `hubGrid.test.ts` counts only existing `sticker_` textures and a `Graphics` outline; reduced-motion case asserts no tween targets the spotlight object; spotlight is redrawn from grid state after `rerenderStickerShelf()`, not animated | PASS |
| NFR-2 (no input/text/speech change) | no `setInteractive`, text object, `speakSentence` call or hit-area change in the new code; the existing Hall of Fame and tile tap suites remain green in the full run | PASS |
| Shutdown / rebuild | `hubGrid.test.ts` "releases every grid object on shutdown": the spotlight ring is among the objects asserted destroyed; page flips and shelf re-renders clear the old ring before rebuilding | PASS |

## Commands and results

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm exec vitest run src/__tests__/game/hub/stickerShelf.test.ts src/__tests__/game/hubGrid.test.ts src/__tests__/scenes/hubScene.test.ts` | 0 | 3 files passed, 105 tests passed |
| `pnpm exec vitest run` | 0 | 155 files passed, 3,362 tests passed |
| `node scripts/validate-docs.js` | 0 | 5 passed / 0 failed |
| `pnpm check` | 0 | clean, 367 files |
| `pnpm typecheck` | 0 | clean (src + e2e) |
| `node scripts/validate-module-size.js` | 0 | 169 modules, zero warnings; largest touched module `HubScene.ts` = 400 lines (≤400) |

In-iteration fixes (not blockers): the first full run failed four pre-existing `navigation.test.ts`
assertions that count `hasSticker` calls (24 on entry, 48 after a profile switch). The spotlight
derivation had added a second round of 24 lookups; it now reads the active profile's sticker flags
directly from the same state `hasSticker` reads, so those call counts are unchanged. `pnpm typecheck`
also caught three type/shape mistakes in the new assertions and `HubScene` import, all fixed before
the final runs above.

## Deviations

- Earned games are read from `getActiveProfile().stickers[game.gameId].earned` instead of calling
  `hasSticker(gameId)`: the two are the same state, but calling `hasSticker` twice per visit broke
  four existing call-count assertions in `src/__tests__/scenes/navigation.test.ts`, which is outside
  Phase 3 Touches.
- No new `it()` cases were added. AC assertions live in existing mandated cases so the derived
  suite truth stays 155 files / 3,362 tests and `validate-docs.js` exits 0 without editing the
  forbidden living docs.
- The spotlight is a static ring in all motion modes (no tween at all), which satisfies the
  reduced-motion requirement by construction.
- The ring is drawn around the slot centre with `strokeCircle(0, 0, radius)` + `setPosition(x, y)`;
  it is recreated by `createShelfSticker()` whenever the board rebuilds, and its graphics object is
  destroyed with the board. It is not included in the slide-in/slide-out arrays of a non-reduced
  page flip, so it snaps to the rebuilt page rather than sliding with it.
- `HubScene.ts` comment blocks were compressed again to hold the file at exactly 400 lines after
  the new wiring; no behavior changed.

## Blockers

- None.

## Primary verification (orchestrator, independent)

- Working tree was clean; `git diff --name-only 8c5d34eb..HEAD` returned exactly
  the seven files listed above — all inside Phase 3 Touches. No Conductor state,
  README, `docs/**`, `package.json` or `conductor/workflow.md` changed.
- Phase subagent commit `4b609a55` is conventional. The profile-level sticker
  read deviation is accepted: it reads the same `getActiveProfile().stickers`
  state as `hasSticker` and preserves the call-count contract of
  `navigation.test.ts` (outside Touches).
- Full `verify_phase` re-run exited 0: `pnpm check` Biome clean 367 files;
  `pnpm typecheck` src + e2e clean; `pnpm test -- --run` 155 files / 3,362 tests;
  `pnpm test:coverage` 155 files / 3,362 tests with 97.11% statements
  (7,732/7,962), 90.86% branches (2,308/2,540), 96.31% functions
  (1,727/1,793), 98.26% lines (7,173/7,300) against gates 95/88/85/90;
  `pnpm build` 489 modules, shell `index-Ddugd55k.js` 197.38 kB Vite / 192.8 kB
  via validator (≤200 kB), Phaser vendor 1,367.08 kB (pre-existing advisory),
  storyOrderArt 81.84 kB; `validate-bundle.js` PASS; `validate-module-size.js`
  169 files zero warnings (`HubScene.ts` at exactly 400 lines);
  `validate-textures.js` 319 SVGs, 76.07/319.00 MiB, ratio 0.238;
  `validate-pwa.js` 16/16 with 63 precache entries; `validate-docs.js` 5/5.
- AC-6 and NFR-2 are independently supported by the green targeted tests
  (105 tests across the three Hub suites) and the documented assertions for
  cursor advance/wrap, per-profile cursors, empty-slot fallback, no new art,
  static reduced-motion highlight, rebuild and shutdown cleanup.

## Result

Result: verified
