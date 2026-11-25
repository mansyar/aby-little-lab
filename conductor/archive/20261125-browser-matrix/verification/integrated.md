# Integrated verification — Browser Compatibility Matrix

- Track: `20261125-browser-matrix`
- Phase: `5 — Integrated verification and handoff`
- Date: 2026-11-25
- Branch: `chore/20261125-browser-matrix`
- Phase base / verification head: `76790f9fa8fec13a244e274772cee0a1cf00c533`
- Track diff base: `54621f70b5913f8c1b358e25baa212d4d34aa389`
- Status: **verified locally; PR CI and physical-device checks remain separate gates**

## Result

The final exact gate, project roster and all four browser suites passed locally with zero retries. PR CI is the authoritative automated proof for the merge; it has not run yet. Engine emulation does not prove physical-device behavior, and no iOS Safari, Android Chrome, Fire tablet or other hardware pass is claimed.

Phase 5's executor shell was denied before it could run the gate. The primary used the documented fallback. The first primary chain passed the exact gate, roster and Chromium suite, then ended with a tool-level `Shell.NotFoundError` after WebKit's tests had reported success. The primary reran WebKit to obtain a clean exit code, then ran Firefox and mobile Chromium successfully. No source, configuration, dependency or assertion was changed as a workaround.

Post-review update: strict review passed in round 2 at `0baf9d08` after Phase R1 closed the single Low TDD coverage-claim finding. Post-review doc sync is complete with no additional living-document change. PR CI remains the authoritative automated gate.

## Commands and observed results

| Layer | Exact command | Exit | Result |
| --- | --- | --- | --- |
| Final exact gate | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | 0 | All stages passed |
| Project roster | `pnpm exec playwright test --list` | 0 | 50 tests in 20 files |
| Chromium journeys | `pnpm test:e2e` | 0 | 26 passed in 4.1m |
| WebKit smoke | `pnpm exec playwright test --project=webkit` | 0 | 8 passed in 1.8m |
| Firefox smoke | `pnpm exec playwright test --project=firefox` | 0 | 8 passed in 1.9m |
| Mobile Chromium smoke | `pnpm exec playwright test --project=mobile-chromium` | 0 | 8 passed in 2.3m |
| CRLF-aware whitespace | `git -c core.whitespace=cr-at-eol diff --check` | 0 | No whitespace errors |

The first fallback chain's raw logs are under `.conductor/evidence/phase-5/{gate,list,chromium,webkit}.log`. The clean WebKit rerun and remaining suites are under `.conductor/evidence/phase-5/{webkit-rerun,firefox,mobile-chromium}.log`. The original executor denial is preserved in the phase-5 run record.

## Final exact gate

- Biome checked 375 files; application and E2E typechecks passed.
- Unit and coverage runs each passed 158 files / 3,404 tests.
- Coverage: 97.08% statements, 90.89% branches, 96.35% functions, 98.23% lines. Each exceeds the configured 90 / 85 / 88 / 95 gates.
- Vite built 491 modules.
- Bundle guard: shell entry `index-B28KfsPS.js` is 195.2 kB, below the 200 kB limit. Vite reported 199.93 kB raw / 51.16 kB gzip.
- Module-size guard: 172 TypeScript files, zero warnings.
- Texture guard: 319 SVGs; tiered budgets passed.
- PWA validation: 16/16, with 52 precached JavaScript chunks.
- Documentation validation: 5/5.
- The only build warning is the pre-existing Phaser vendor chunk above 500 kB.

## Project roster and smoke selection

The observed roster is exactly **50 tests in 20 files**:

| Project | Tests / files | Scope |
| --- | --- | --- |
| `chromium` | 26 / 19 | Full journeys; `e2e/smoke/**` excluded |
| `webkit` | 8 / 6 | Core smoke |
| `firefox` | 8 / 6 | Core smoke |
| `mobile-chromium` | 8 / 6 | Core smoke |

The shared six-file smoke set proves Hub boot, all 24 game launches and returns, three speech rounds, three drag rounds, earned-sticker persistence across reload, and offline Hub/game relaunch. No project is disabled or quarantined.

## Engine, profile and execution evidence

| Project | Bundled engine | Profile | Duration | Actual retries |
| --- | --- | --- | --- | --- |
| Chromium | Chromium `159.0.8154.6` | Desktop 1280×720; full journeys | 4.1m | 0 |
| WebKit | WebKit `27.2` | Desktop 1280×720; core smoke | 1.8m | 0 |
| Firefox | Firefox `159.0` | Desktop 1280×720; core smoke | 1.9m | 0 |
| Mobile Chromium | Chromium `159.0.8154.6` | 844×390; `isMobile: true`; `hasTouch: true`; core smoke | 2.3m | 0 |

Playwright is `1.65.1`. Local retries are configured to zero. All suites share the production preview on `127.0.0.1:4173` and were run sequentially. CI's configured retry count remains 2, but the strict evidence helper rejects any retried, flaky, skipped, unexpected or wrong-project result.

## Scope and no-weakening inspection

The track diff contains 23 non-Conductor files with 1,155 insertions and 129 deletions. No lockfile, runtime dependency addition, public asset, save-schema/storage file, analytics module, credential or runtime-network service changed. `package.json` adds only four local Playwright scripts; Phaser remains the sole runtime dependency.

Runtime changes are limited to:

- `src/audio/AudioManager.ts` — guarded `AudioContext` construction so WebKit degrades to silent synthesized audio instead of entering recovery.
- `src/game/art/index.ts`, `src/game/art/registry.ts`, `src/game/hub/hubPrewarm.ts`, `src/scenes/HubScene.ts` — one shared texture reservation/release path, boolean prewarm queue result, and placeholder-on-error only for game preload.

E2E changes add real touch/CDP gestures, state-based long holds with a 90-second ceiling and stall detection, paged-Hub swipes, sticker-persistence smoke and a valid narrow-Hub prefix assertion. The exhaustive launch loops still cover all 24 games. Playwright config enables all four projects, isolates smoke from Chromium and keeps the same six smoke files on each new engine. CI adds parallel `e2e-matrix`, strict JSON evidence helper and artifacts, and extends the required `Browser Journeys` rollup to `[quality-gates, e2e-shard, e2e-matrix]`.

No coverage threshold, evidence policy or engine assertion was weakened. The launch-all visibility assertion was corrected, not removed: mobile Chromium intentionally shows 10 of 24 tiles per page, so the test now asserts the current-page prefix while `launchGame()` uses real swipes to reach and launch every registry game.

## Requirements coverage

| ID | Local status | PR CI | Device |
| --- | --- | --- | --- |
| FR-1 through FR-10 | pass through local gate, browser matrix, CI structure and docs | pending | n/a or pending where specified |
| NFR-1 through NFR-7 | pass through scope inspection, local gate and strict evidence policy | pending | pending where specified |
| AC-1 through AC-4 | pass: 26/26 Chromium; 8/8 each engine; roster 50/20 | pending | n/a |
| AC-5, AC-6, AC-8 | CI structure locally inspected and guarded | pending authoritative run | n/a |
| AC-7 | pass locally: versions, profiles, durations and zero retries recorded above | pending | n/a |
| AC-9, AC-10 | pass locally: documented commands and emulation/device boundary | n/a | pending |
| AC-11 | pass through scope inspection and local gate | pending | n/a |

## Remaining gates

1. Strict review must pass with no unresolved blocking findings.
2. PR **Quality Gates**, both Chromium shards and all three engine jobs must pass.
3. The required **Browser Journeys** rollup must pass and reflect every engine and Chromium shard.
4. PR creation and the single completion/archive commit remain primary-owned; merge requires explicit approval.
5. Physical-device HTTPS/PWA install, landscape, offline relaunch, audio/first-tap, iOS Safari, Android Chrome and Fire tablet checks remain manual release gates.

## Deviations

- The phase executor's shell was denied; primary fallback ran the required gate and suites.
- The first primary chain ended with a tool-level `Shell.NotFoundError` after WebKit's tests; WebKit was rerun cleanly and the remaining suites completed with exit 0.
- `conductor/tech-stack.md` uses existing CRLF endings, so `git -c core.whitespace=cr-at-eol diff --check` is the policy-aware whitespace check.
- No physical-device result is claimed and no new dependency, asset, schema, game rule or runtime-network behavior was introduced.
