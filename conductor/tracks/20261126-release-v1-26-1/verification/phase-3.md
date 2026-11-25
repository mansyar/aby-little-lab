# Phase 3 Verification — Release-candidate verification

- **Track:** `20261126-release-v1-26-1`
- **Phase:** 3
- **Date:** 2026-11-26
- **Branch:** `chore/20261126-release-v1-26-1`
- **Track base:** `859498a8` (`master`)
- **Implementation head:** `4428d33d71409859c65b8409b492703855a0d251`
- **Result:** **verified** locally; PR CI, merge, tag CI and deploy remain later gates.

## What changed in this phase

| Commit | Scope |
|---|---|
| `26af8541` | Fix-forward for the reproduced post-merge Firefox CI regression: guard `AudioContext.resume()` and `close()` promise rejections; add TDD regression tests. |
| `44fe6450` | Draft phase/integrated evidence from the executor. |
| `c824f7c5` | Refresh living suite counts from 3,404 to 3,406 tests and current coverage figures. |
| `4428d33d` | Track P3.T7 and the authorized touch scope for that refresh. |

The runtime fix is two lines in `src/audio/AudioManager.ts`, matching the existing `playBGM()` best-effort policy, plus two rejection-capturing tests and mock defaults that return resolved promises like the Web Audio API. No assertion, threshold, sample count, retry setting, engine, gate, dependency, lockfile, asset, save schema, game rule or runtime-network behavior was changed. The archived Firefox failure artifact was left untouched.

## Commands and evidence

| Stage | Command / evidence | Exit | Result |
|---|---|---|---|
| Focused TDD regression | `pnpm exec vitest run src/__tests__/audio/AudioManager.test.ts` | 0 | 1 file / 93 tests passed. Raw: `.conductor/evidence/phase-3/audio-focused-final.log`. |
| First exact gate | Exact configured chain, logged to `.conductor/evidence/phase-3/gate.log` | 1 | Only failure was living docs still saying 3,404 tests after the two new tests; 158 files / 3,404 tests then. |
| Final exact gate | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | 0 | Biome 375 files; app/E2E typechecks; 158 files / 3,406 tests in unit and coverage; coverage 97.08 % statements / 90.89 % branches / 96.35 % functions / 98.23 % lines; 491 modules; shell `index-CzNKiaF1.js` 199.96 kB raw / 51.15 kB gzip and 195.3 kB guarded; 172 TypeScript files zero warnings; 319 SVGs; PWA 16/16 with 52 chunks and 64 precache entries; docs 5/5. Raw: `.conductor/evidence/phase-3/gate-final.log`. |
| Frozen install | `pnpm install --frozen-lockfile` | 0 | No lockfile drift. Raw: `.conductor/evidence/phase-3/frozen-install.log`. |
| Roster | `pnpm exec playwright test --list` | 0 | 50 tests in 20 files: Chromium 26/19; each engine 8/6. Raw: `.conductor/evidence/phase-3/list.log`. |
| Chromium | `pnpm test:e2e` | 0 | 26/26 passed in 5.0 m, zero local retries. Raw: `.conductor/evidence/phase-3/chromium.log`. |
| WebKit | `pnpm exec playwright test --project=webkit` | 0 | 8/8 passed in 1.7 m, zero local retries. Raw: `.conductor/evidence/phase-3/webkit.log`. |
| Firefox | `pnpm exec playwright test --project=firefox` | 0 | 8/8 passed in 1.8 m, zero local retries. Raw: `.conductor/evidence/phase-3/firefox.log`. |
| Mobile Chromium | `pnpm exec playwright test --project=mobile-chromium` | 0 | 8/8 passed in 2.6 m, zero local retries. Raw: `.conductor/evidence/phase-3/mobile-chromium.log`. |
| Boot smoke | `node scripts/validate-boot.js` against strict-port preview on 4173 | 0 | Median 0.85 s across three cold loads, <= 3.0 s budget. Raw: `.conductor/evidence/phase-3/boot.log`. |
| Docker image | `docker build --build-arg GIT_SHA=<HEAD> -t aby-little-lab:headers .` | 0 | Image digest `sha256:a6309efab265ade6e3dae6636cfb3d4fb7dbb8f254e223646456f69a0e4dc271`. Raw: `.conductor/evidence/phase-3/docker-build.log`. |
| Strict headers | `node scripts/validate-headers.js` | 0 | 28/28 checks passed across SPA root, shell, service worker, manifest, hashed asset, unknown route and missing hashed asset. Raw: `.conductor/evidence/phase-3/headers.log`. |
| Headed first tap | `TAP_HEADED=1 TAP_INERT_IDLE=1 node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10` | 0 | 50 cold / 0 warm; exactly 10 per target game; aggregate cold p95 response/finished/total 58.4 / 37.6 / 332.3 ms; cold median total 235.4 ms; worst cold total 383.8 ms (Memory Match) <= 400 ms. Raw: `.conductor/evidence/phase-3/first-tap-headed.json` and `.conductor/evidence/phase-3/first-tap-headed.stdout.txt`. |
| Whitespace | `git -c core.whitespace=cr-at-eol diff --check` | 0 | No diagnostics. |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-6 / AC-6 | Exact configured gate exits 0 on the release candidate | Final exact gate above | pass |
| FR-7 / AC-7 | Frozen install, boot, headers and headed first tap pass | Commands above; 50 cold / 0 warm, worst 383.8 ms | pass |
| FR-8 / NFR-2 / AC-8 | Reproduced red master check is closed without weakening the gate | Two-line AudioManager guard; focused 93/93; full four-project matrix green; PR CI still pending | local pass; PR CI pending |
| FR-12 / NFR-3 / NFR-4 / AC-12 | Measured claims, preserved history, no unsupported assertions | Release notes, perf-baseline header, historical sections intact | pass |
| NFR-7 | CRLF-aware whitespace | Exit 0 | pass |

## Deviations and retries

- Phase 1/2 history remains authoritative for PR #100. The post-merge master rerun `45595775568` was red in Firefox `sticker-persistence` with three `InvalidStateError: Navigated away from page` page errors; the approved spec's fix-forward exception was used.
- The first exact-gate rerun after the fix failed only because living docs still reported 3,404 tests. The count and coverage claims were refreshed to current truth; the exact gate then passed.
- The first headed first-tap attempt failed before measuring because port 4173 was still held when the boot preview's parent process had exited. A check confirmed the port free and the standalone rerun passed. Recorded in `.conductor/evidence/phase-3/first-tap-port-race.txt`.
- Phase executors repeatedly had their shell denied. Per the brief they did not retry or work around denials; the primary ran every heavy command and recorded actual results.

## Remaining gates

- Strict review and PR creation.
- Required PR CI: Quality Gates, both Chromium shards, all three engine jobs and the `Browser Journeys` rollup must be green before merge.
- Explicit owner merge answer, then tag preflight, immutable `v1.26.1` tag, tag CI/Coolify and live verification.
- Physical-device smoke remains **SKIPPED — accepted gap**; no device pass is claimed.
