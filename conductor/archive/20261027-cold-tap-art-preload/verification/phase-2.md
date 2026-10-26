# Phase 2 Evidence — Hub integration

- Track: 20261027-cold-tap-art-preload — Hub Cold-Tap Art Preload
- Phase: 2 — Hub integration
- Date: 2026-10-27
- Branch: feat/20261027-cold-tap-art-preload
- Base: dd5a0764
- Head: (uncommitted — git via shell denied, as in Phase 1; working tree holds exactly the files below)
- Result: **blocked** (all phase work complete and green; `validate-docs` needs the primary's validator-mandated count refresh, same as Phase 1 deviation 4 — see Blockers)

## Summary

`src/scenes/HubScene.ts` now drives the Phase-1 art engine behind the existing
production gates, extending the chunk-prewarm lifecycle instead of inventing a
parallel one:

- **Shared gates**: the single 1200 ms post-entrance timer now arms `startPrewarmPass()`
  *and* `startArtPass()`; `cancelPrewarm()` cancels both passes, the timer, and bumps
  an art generation id; `restartPrewarm()` restarts both. Lock, hidden tab, launch,
  tap, and shutdown therefore pause/cancel art exactly like chunks (FR-2, FR-5).
- **Lazy key→SVG resolver**: `ART_GROUP_LOADERS` (12 art groups + Story Order panels,
  each a dynamic `import()`) and `ART_GROUPS_BY_GAME` (per-game group list mirroring
  each scene's `preloadArt([...])` declaration and `ART_KEYS_BY_GAME` composition).
  Loaded tables stay cached per Hub lifetime; unknown keys resolve to `undefined` and
  are skipped. No static art import exists in the file, so no SVG markup can enter
  the shell entry — pinned by a source-guard test and proven by the build (all art
  tables emitted as separate lazy chunks; shell entry 148.9 kB ≤ 200 kB).
- **Silent loader queueing** (`queueArtKey`): resolves markup, skips keys the
  `TextureManager` already holds, otherwise queues `load.svg(key, toDataUri(svg),
  tierSize)` at the key's texture tier and calls `load.start()`, settling on the
  loader's `complete`/`loaderror` — so the engine paces one raster per idle tick.
  The art cue module is never imported, created, or shown during idle (FR-5). An
  in-flight resolution that settles after cancel/shutdown/tap is discarded via the
  generation id without queueing.
- `src/__tests__/scenes/hubScene.test.ts` gains an 11-test `HubScene idle art prewarm`
  describe (file 37 → 48 tests): shell-diet source guard, pass arming + injected
  options, one-key-per-tick pacing with tier/data-URI/`start` pins, present-skip,
  no-cue-during-idle, lock/hidden suppression + resume (AC-3), tap-cancel ordering,
  shutdown-cancel + cross-visit resume from the shared `artQueued` set, full
  22-game resolver parity (every key of `ART_KEYS_BY_GAME` resolves to markup
  containing `<svg`; unknown key → `undefined`), and the warmed-game zero-queue
  assertion (AC-5).

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | Biome clean (260 files), after fixing import-sort + format findings in the new tests (fix 1) |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean (after two type fixes: `.bind` → method-call form; entries passed through instead of rebuilt — fixes 1–2 of the test file) |
| unit | `pnpm test -- --run` | 0 | 126 files / 2781 tests pass (after hardening 4 tests with a wall-clock `waitForSvg` poll: cold lazy-transform latency exceeds fixed empty rounds — fix 2) |
| coverage | `pnpm test:coverage` | 0 | Same 2781 green; HubScene 96.73% stmts; overall 97.73 / 91.71 / 96.88 / 98.70 |
| build-artifact | `pnpm build` | 0 | 345 modules; art tables emitted as separate lazy chunks (`shapes-*.js`, `storyOrderArt-*.js`, …), none in the shell entry |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Phaser chunk present; shell entry 148.9 kB ≤ 200 kB |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16 passed / 0 failed (47 chunks precached) |
| documents | `node scripts/validate-docs.js` | 1 | 5 passed / 1 failed — the five suite-count snapshots still state 2,770 tests; derived truth is now 126 files / 2,781 tests (my +11). Refresh is primary-owned (see Blockers) |

Full phase gate
`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
exits 1 only at the last segment, solely on stale doc counts. Needed from the
primary, in order: (1) apply the five validator-mandated count refreshes below,
(2) re-run `node scripts/validate-docs.js` to exit 0, (3) commit the working tree
(implementation + tests + this evidence file) with conventional task-level commits.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| FR-2 | Art queue starts after entrance settles; pauses under arc/moon lock or hidden tab; resumes on clear/visible | Shared 1200 ms timer arms both passes; lock/hidden tests assert `startArtPrewarm` uncalled + scheduler empty, resume re-arms; pacing test pins one raster per idle tick at tier size via `toDataUri` + `load.start` | done |
| FR-5 | Shutdown cancels with no dangling timers/loads; idle never creates/shows the art cue | Shutdown test (cancel called, scheduler drained, next visit resumes from shared `artQueued`); cue module unimported (source guard) + mock asserts zero constructions across driven ticks; pass-generation id discards post-cancel resolutions | done |
| AC-3 | Nothing rasterizes while locked/hidden; warming resumes afterwards | Lock test: no pass, no slots while locked; hidden test: controller cancelled, slots drained; both resume with a fresh pass on clear/visible | done |
| AC-5 | Fully warmed game queues zero art keys in `preload()` and shows no cue on entry | Warmed-`music` test: `preloadArtGroups` against a fully present `TextureManager` queues zero svg loads and attaches zero loader listeners; cue half covered by no-cue-during-idle + the unchanged GameSceneBase show→clear-before-first-frame wiring (zero queued files ⇒ synchronous clear on create) | done |
| AC-7 | House style | `pnpm check` + `pnpm typecheck` clean; TSDoc on all new blocks; no `any`/non-null assertions; double quotes; `===`; semicolons | done |

## Evidence paths

- Implementation: `src/scenes/HubScene.ts` (resolver tables + `artPrewarm`/`artQueued`/caches/generation fields + `startArtPass`/`resolveArtSvg`/`queueArtKey` + shared-lifecycle wiring; chunk path untouched)
- Tests: `src/__tests__/scenes/hubScene.test.ts` (new `HubScene idle art prewarm` describe, 11 tests; chunk-prewarm describes untouched except scheduler/mock hygiene)
- Build proof: `dist/` bundle layout (art tables as separate lazy chunks; shell entry ≤ budget) via `validate-bundle` PASS
- No binaries or contact sheets (none produced in Phase 2)

## Deviations

1. `src/__tests__/helpers/phaserMock.ts` — added `start: vi.fn()` to `MockScene.load`.
   Production idle raster must call `load.start()` (the loader only auto-starts inside
   `preload`); the mock exposed `svg`/`on`/`once`/`off` but no `start`, so any idle
   queue would throw in tests. One line in a shared helper; the smallest change that
   keeps the mock faithful to `LoaderPlugin`. The existing `phaserMock.test.ts`
   method-list assertion is unaffected (it checks listed methods exist, not exclusivity).

## Notes

- Shell-budget headroom: entry 145.1 kB (Phase 1) → 148.9 kB — the resolver tables
  + wiring cost ~3.8 kB; all SVG markup stays in lazy chunks (build output confirms).
- Test-timing lesson: the first idle tick pays the lazy-transform cost (tens of ms
  wall clock); fixed microtask-only rounds (`flushArt`) cannot cover it. The four
  tick-driving tests now poll wall-clock (`waitForSvg`, 10 s budget); pure-pacing
  assertions (`fire() === false` while in flight, scheduler size after completion)
  stay deterministic.
- Suite delta: +11 tests (2,770 → 2,781); file count unchanged at 126.
- Nothing was committed: `git` via shell is denied (same as Phase 1). The working
  tree contains exactly four modified/added files: the two Touches files, the
  deviation fix above, and this evidence file.

## Blockers

- `node scripts/validate-docs.js` → exit 1 (5 snapshot lines stale by exactly this
  phase's +11 tests). Fix requires editing primary-owned product docs — forbidden
  to the subagent, same as Phase 1 deviation 4 — so the primary must apply it:
  refresh applied by the primary (see Primary verification).

## Primary verification

Primary ran the exact phase gate on the final tree:

- `pnpm check` → exit 0, 260 files clean. `pnpm typecheck` → exit 0.
- `pnpm test -- --run` → exit 0, 126 files / 2,781 tests.
- `pnpm test:coverage` → exit 0; 97.75 / 91.76 / 96.88 / 98.70 — all gates held
  (95 / 88 / 85 / 90).
- `pnpm build` + `validate-bundle` → PASS (shell entry 148.9 kB ≤ 200 kB; art
  tables in separate lazy chunks). `validate-pwa` → 16 passed / 0 failed.
- `validate-docs` initially 5/1 on stale suite counts (2,770 → 2,781); primary
  refreshed the five validator-mandated snapshot lines (README:49, TDD:1045 /
  :1059 / :1065 with this run's coverage denominators, perf-baseline:421) and
  re-ran: 6 passed / 0 failed.
- Wiring reviewed in diff: `startArtPass` shares `canPrewarm` and the entrance
  timer with the chunk pass; `cancelPrewarm` cancels both and bumps `artPassId`;
  `queueArtKey` discards post-cancel resolutions, unknown keys, and
  meanwhile-present keys, settling on the loader's `complete`/`loaderror`;
  `GameLoadCue` is constructed only on the real-entry path (idle coverage
  asserts zero constructions across driven ticks). FR-2/FR-5/AC-3/AC-5 satisfied
  with tests + green run.
- Deviation accepted: `phaserMock.ts` one-line `load.start` addition — smallest
  faithful-mock change; existing mock test unaffected.
- No squash: the `dd5a0764..HEAD` range holds only the primary's Conductor
  state commit plus uncommitted phase work (the subagent could not commit), so
  the work was committed directly as `f6c9bb52` to preserve the trail.
- Result: **verified**, checkpoint `f6c9bb52`.
