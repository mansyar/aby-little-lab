# Phase 1 evidence — Project topology and reusable smoke

- **Track:** `20261125-browser-matrix` — Browser Compatibility Matrix
- **Phase:** 1 — Project topology and reusable smoke
- **Date:** 2026-11-25
- **Branch:** `chore/20261125-browser-matrix`
- **Phase base:** `7c0e5d66cb3c4b0d6f4acbb3d6c3081f9b8df450`
- **Head:** `409981a2` (`fix: repair Firefox holds and texture load ownership`)
- **Result:** **verified** — the final exact gate and all four no-retry browser suites pass against `409981a2`.

## Task commits

| Task | Commit | Result |
|---|---|---|
| P1.T1 — cross-engine projects | `d51bac7f` | Chromium retained as the full suite; WebKit, Firefox, and mobile Chromium added with landscape profiles and genuine mobile touch. |
| P1.T2 — isolated smoke and persistence | `7cc9d1d2` | New projects select boot, all-24 launch/return, First Sounds, Shape Sorter, offline relaunch, and earned-sticker reload persistence. Chromium ignores `e2e/smoke/**`. |
| P1.T3 — local commands | `6e2b4ee9` | `test:e2e` remains full Chromium; per-engine and whole-matrix package scripts added. |
| P1.T4 — portable fixtures | `9f10de0f` | Canvas helpers use real touch input when touch points are exposed, while preserving desktop mouse gestures and bridge-published geometry. Headless speech checks assert visual progress. |
| P1.T5 — initial portability repairs | `f87faae1`, `96cd114e`, `cb419423` | Added the absent-AudioContext guard with TDD, the first frame/time hold budget, and Hub paging through live tile geometry while retaining all 24 launches. |
| P1.T5 — formatting repair | `022f9766` | Applied Biome formatting and import order without behavior changes. |
| P1.T5 — drag signature repair | `9b441f68` | Removed the invalid fourth `dragCanvas` argument; the helper retains its continuous gesture logic. |
| P1.T5 — state/queue repair | `409981a2` | Removed the premature lost-press deadline; added shared texture queue ownership, release/error policy, retryable Hub prewarm, public exports, and focused tests. |
| P1.T6 — living count refresh | `dc0032fa`, `409981a2` | First refreshed the AudioManager regression count, then updated living documentation to 158 files / 3,404 tests. Historical counts were not changed. |
| Approved plan repair | `b011dacd` | Primary-added P1.T5 and authorized the minimal runtime source/test paths; not authored in this execution. |
| Living count refresh | `dc0032fa` | Primary refreshed the documented unit count after the AudioManager regression; not authored in this execution. |
| Plan repair 2 | `12001903`, `54dfc720` | Primary-approved the state-based hold, shared texture queue, and living-count task paths; not authored in this execution. |

## Original failed evidence retained

The primary ran these commands against `9f10de0f` before the rework. They are kept unchanged and were not rerun merely to reproduce known failures.

| Layer | Command | Exit | Summary |
|---|---|---:|---|
| Initial exact gate | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | 0 | Passed before the smoke-proven runtime/e2e repairs. |
| Baseline topology | `pnpm exec playwright test --list` | 0 | 26 tests in 19 files, all under the original Chromium project. |
| Initial full Chromium | `pnpm test:e2e` | 0 | 26/26 passed in 3.9m. |
| Initial WebKit | `pnpm exec playwright test --project=webkit` | 1 | 7 failed / 1 passed in 1.6m. Hub settled on `Recover`; the focused probe recorded `ReferenceError: Can't find variable: AudioContext` from `AudioManager.init()`. |
| Initial Firefox | `pnpm exec playwright test --project=firefox` | 1 | 6 passed / 2 failed in 1.2m. Both launch-all halves exhausted 300 frames at 107–108 fps in 2793/2776 ms, before the real 3000 ms parental hold finished. |
| Initial mobile Chromium | `pnpm exec playwright test --project=mobile-chromium` | 1 | 5 passed / 3 failed in 46.2s. The intentional paged Hub exposed only tiles 0–9; the all-24-visible assertion failed and `launchGame(11, "FirstSounds")` never paged forward. |

## Primary rework handoff 1 results

The primary's clean rerun after the type/format repairs established these results before the second Firefox-specific handoff:

| Layer | Command | Exit | Summary |
|---|---|---:|---|
| Exact configured gate | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | 0 | Passed. |
| Project topology | `pnpm exec playwright test --list` | 0 | Passed with the intended Chromium/full and three-project smoke split. |
| Full Chromium | `pnpm test:e2e` | 0 | 26/26 passed. |
| WebKit | `pnpm exec playwright test --project=webkit` | 0 | 8/8 passed. |
| Firefox | `pnpm exec playwright test --project=firefox` | 1 | Both launch-all halves still lost the back hold; Shape Sorter logged `Texture key already in use: shape_parallelogram`. |
| Mobile Chromium | `pnpm exec playwright test --project=mobile-chromium` | not run | The required sequence correctly stopped at Firefox. |

## Repair verification history

| Layer | Command | Exit | Summary |
|---|---|---:|---|
| AudioManager TDD red | `pnpm test -- --run src/__tests__/audio/AudioManager.test.ts -t "initializes the rest of audio when AudioContext is unavailable"` | 1 | Failed before the guard with `TypeError: AudioContext is not a constructor`; 3395 other tests passed. |
| AudioManager TDD green | `pnpm test -- --run src/__tests__/audio/AudioManager.test.ts -t "initializes the rest of audio when AudioContext is unavailable"` | 0 | All 158 files / 3396 tests passed after the null-context guard. |
| Subagent exact gate attempt | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | denied | `permission.rejected: Permission denied: shell`; no stage ran and the denial was not retried or worked around. |
| Primary post-fix exact gate | Same exact configured gate | 1 | Stopped at `pnpm check` with two Biome-only errors: multiline hold condition and unsorted canvas import. |
| Formatting repair check | `pnpm check` | 0 | Passed after `022f9766`; 374 files checked with no fixes. |
| Primary second exact gate | Same exact configured gate | 1 | Passed `pnpm check`, then failed typecheck at the invalid four-argument `dragCanvas` call. |
| Signature repair check | `pnpm check && pnpm typecheck` | 0 | Passed after `9b441f68`. |
| Shared-queue TDD red | `pnpm exec vitest run src/__tests__/game/art/preloadArtGroups.test.ts src/__tests__/game/hub/hubPrewarm.test.ts` | 1 | Primary supplied 8 failed / 19 passed, matching the intended missing-queue and boolean-contract failures. |
| Shared-queue TDD green attempt | `pnpm exec vitest run src/__tests__/game/art/preloadArtGroups.test.ts src/__tests__/game/hub/hubPrewarm.test.ts src/__tests__/scenes/hubScene.test.ts` | denied; primary later ran | Subagent attempt was denied; primary then supplied 7 failed / 81 passed. |
| Primary green-attempt corrections | Applied | — | Exported `queueArtTexture` and its option type from the public art barrel; removed only the invalid scheduler-size expectation while retaining zero settlement handlers and zero loader starts. |
| Corrected focused green attempt | `pnpm exec vitest run src/__tests__/game/art/preloadArtGroups.test.ts src/__tests__/game/hub/hubPrewarm.test.ts src/__tests__/scenes/hubScene.test.ts` | denied | Permission denial; no retry or workaround. |
| Primary corrected focused green | `pnpm exec vitest run src/__tests__/game/art/preloadArtGroups.test.ts src/__tests__/game/hub/hubPrewarm.test.ts src/__tests__/scenes/hubScene.test.ts` | 0 | Primary supplied 3 files / 88 tests passed. |
| Post-change topology | `pnpm exec playwright test --list` | 0 | Primary rerun passed with the intended project split before the state/queue repair. |
| Post-fix Chromium | `pnpm test:e2e` | 0 | Primary clean no-retry rerun passed 26/26 before the state/queue repair. |
| Post-fix WebKit | `pnpm exec playwright test --project=webkit` | 0 | Primary clean no-retry rerun passed 8/8 before the state/queue repair. |
| Post-fix Firefox | `pnpm exec playwright test --project=firefox` | 1 | Still failed on the back hold and duplicate `shape_parallelogram` loading; this motivated the committed repair. |
| Final local check | `pnpm check && pnpm typecheck` | 1 | Biome found one test call needing multiline formatting and the art barrel exports needing order changes. Typecheck did not start. |
| Formatting correction | Applied | — | Applied only Biome's requested test-call wrapping and type-before-value export order; no behavior changed. |
| Final local check | `pnpm check && pnpm typecheck` | 0 | Biome checked 374 files with no fixes; application and E2E TypeScript both passed. |
| Final local unit suite | `pnpm test -- --run` | 0 | 158 files / 3404 tests passed in 64.31s. |
| Living count refresh | Documentation update | — | Updated README, TDD, and performance baseline living count lines from 3396 to 3404; historical counts were untouched. |
| Final local check after docs | `pnpm check && pnpm typecheck` | 0 | Biome checked 374 files with no fixes; application and E2E TypeScript both passed. |

## Final primary verification against `409981a2`

| Layer | Command | Exit | Result |
|---|---|---:|---|
| Exact configured gate | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | 0 | 374 files linted; app/E2E types passed; 158 files / 3,404 tests passed twice; coverage 97.09% statements / 90.93% branches / 96.35% functions / 98.23% lines; 491 modules; bundle/module/texture/PWA/docs guards passed. |
| Project topology | `pnpm exec playwright test --list` | 0 | 50 tests in 20 files: Chromium 26/19; WebKit, Firefox, mobile Chromium each 8/6. |
| Full Chromium | `pnpm test:e2e` | 0 | 26/26 passed in 3.9m; local retries zero. |
| WebKit | `pnpm exec playwright test --project=webkit` | 0 | 8/8 passed in 1.8m; local retries zero. |
| Firefox | `pnpm exec playwright test --project=firefox` | 0 | 8/8 passed in 1.9m; local retries zero; prior hold and duplicate-texture failures absent. |
| Mobile Chromium | `pnpm exec playwright test --project=mobile-chromium` | 0 | 8/8 passed in 2.5m; local retries zero. |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-1 | Existing full Chromium journey suite remains green and unchanged in scope. | Final `pnpm test:e2e`: 26/26 passed in 3.9m against `409981a2`. | passed |
| AC-2 | WebKit, Firefox, and mobile Chromium run core smoke with intended profiles. | Final no-retry runs: WebKit 8/8, Firefox 8/8, mobile Chromium 8/8; desktop 1280×720 proxies and mobile 844×390 touch/`isMobile` profile. | passed |
| AC-3 | Smoke proves boot, all 24 launches/returns, three speech rounds, three drag rounds, sticker persistence, and offline relaunch. | Six smoke files selected per new engine; exhaustive launch halves cover all 24 games and every engine completed all eight tests. | passed |
| AC-4 | Project list proves new projects do not select the full roster. | Final `pnpm exec playwright test --list`: 50 tests in 20 files; Chromium 26/19, each new engine 8/6. | passed |
| AC-9 | A developer can reproduce each engine locally. | `package.json` retains `test:e2e` and adds per-engine plus matrix commands. | passed |
| AC-10 | Hub and game texture loads do not race for the same TextureManager key. | Focused queue/ownership/error/shutdown tests pass; final Firefox Shape Sorter and launch-all runs pass with no duplicate-key console error. | passed |
| NFR-4 | Use bridge-published state and real canvas geometry, without user-agent branches or copied coordinates. | Mobile paging derives a horizontal drag from the first live `hubTiles()` point; touch dispatch is capability-based; bridge/state helpers remain in use. | passed |
| NFR-6 | Runtime compatibility fixes are minimal and smoke-covered. | Absent-AudioContext guard is WebKit-smoke-covered; state-based hold passes Firefox; shared queue passes focused tests and Firefox smoke. | passed |
| AC-11 | No runtime dependency/asset/schema change; compatibility fix is minimal and smoke-covered. | No dependency, lockfile, asset, or schema changed; final gate and all browser suites pass. | passed |

## Evidence paths

- `.conductor/runs/20261125-browser-matrix/phase-1-brief.md`
- `.conductor/evidence/phase-1-final/gate.log`
- `.conductor/evidence/phase-1-final/list.log`
- `.conductor/evidence/phase-1-final/chromium.log`
- `.conductor/evidence/phase-1-final/webkit.log`
- `.conductor/evidence/phase-1-final/firefox.log`
- `.conductor/evidence/phase-1-final/mobile-chromium.log`
- `.conductor/evidence/phase-1-browser/chromium.log`
- `.conductor/evidence/phase-1-browser/webkit.log`
- `.conductor/evidence/phase-1-browser/firefox.log`
- `.conductor/evidence/phase-1-browser/mobile-chromium.log`
- `.conductor/evidence/phase-1-browser/audio-manager-red.log`
- `.conductor/evidence/phase-1-browser/audio-manager-green.log`
- `.conductor/evidence/probe-webkit.mjs`
- `src/audio/AudioManager.ts`
- `src/__tests__/audio/AudioManager.test.ts`
- `src/game/art/registry.ts` — shared queue ownership and fallback policy.
- `src/game/art/index.ts` — public `queueArtTexture` and option-type exports.
- `src/game/hub/hubPrewarm.ts` — boolean queue result and failure-as-retry handling.
- `src/scenes/HubScene.ts` — shared-queue wiring with idle placeholders disabled.
- `src/__tests__/game/art/preloadArtGroups.test.ts`
- `src/__tests__/game/hub/hubPrewarm.test.ts`
- `src/__tests__/scenes/hubScene.test.ts`
- `e2e/fixtures/canvas.ts` — state-based hold wait with stall and ceiling guards.
- `e2e/fixtures/game.ts`
- `e2e/journeys/launch-all.spec.ts`
- `playwright.config.ts`
- `package.json`
- `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` — refreshed living counts only.
- `conductor/tracks/20261125-browser-matrix/verification/phase-1.md` — this file, intentionally uncommitted for the primary state commit.

## Deviations

None. All repair changes are inside the phase's approved `Touches`, including the additional runtime source/test paths and the public art-barrel export explicitly requested by the primary.

## Outstanding verification

None for Phase 1. CI enforcement is deliberately deferred to Phase 4, and physical-device validation remains a separate manual release gate.

## Notes

- Fourteen conventional commits exist from the phase base through `409981a2`.
- The hold repair does not weaken the parental gate: it waits for the gate's actual state, probes canvas liveness, and fails only on a real stall or the 90 s hard ceiling. Frame count is diagnostic only.
- Shared texture ownership is released on completion, error, or scene shutdown. Game preload retains placeholder-on-error; Hub prewarm opts out so failed idle rasters stay absent and retryable.
- Local Playwright retries remain zero. Only the invalid all-24-visible assumption was replaced with a current-page assertion; every registry launch remains covered by the two exhaustive halves.
