# Phase 3 Verification — Release-candidate verification (integrated)

- **Track:** `20261127-release-v1-27-0`
- **Phase:** 3
- **Date:** 2026-11-27
- **Branch:** `chore/20261127-release-v1-27-0`
- **Phase base:** `fdaaa8ec262d1ebda89d1b307d8f8245c493c035`
- **Actual candidate head:** `65fe7286f0b0e37493268c0e299c469d47129211`
- **Result:** **verified** — the exact configured gate, frozen install, boot, container/headers, headed first tap, full browser matrix and CRLF-aware whitespace check all passed on the final candidate head above.

## Remaining gates

These are later-phase work and are not claimed here:

- Tag preflight/creation/push and tag CI; Coolify deploy; live URL/build/version/hash verification. The release notes stay `DRAFT` until those pass.
- Physical-device smoke (iOS Safari, Android Chrome, Fire tablet) remains a ship-time gate. No physical-device pass or execution is claimed; the ship-time `SKIPPED — accepted gap` verdict belongs to the ship note, not this phase.
- Retention protocol and blank pilot pack were not executed; no retention result exists.
- Longitudinal band movement is unmeasured; the Progress Overview's current adaptive-band spread is a snapshot, not history.
- The primary independently reran the exact configured gate and whitespace check after the evidence and archive-safety documentation commits; that rerun is recorded under `## Primary verification` below.

## Commands and evidence

Every configured command was run exactly as written, with no retries, substitutions or weakened thresholds. The executor's shell rejected the heavy commands; the primary ran those same commands unchanged and supplied the outputs below (see Deviations). Raw logs under `.conductor/evidence/phase-3/` are local artifacts and are not committed; the two first-tap raw files under `verification/` are committed.

| Layer | Exact command | Exit | Measured summary / raw evidence |
| --- | --- | --- | --- |
| Static/unit/coverage/build/artifact/docs | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | 0 | Biome 378 files / no fixes; app+E2E TypeScript clean; Vitest 159 files / 3,454 tests; coverage 97.11 / 91.01 / 96.4 / 98.25 %; Vite 493 modules; shell `index-DF9s1m1B.js` 196.3 kB via bundle guard (200.98 kB as Vite prints, 51.54 kB gzip); 53 chunks; module-size zero warnings; textures pass; PWA 16/0 with 65 precache entries (1880.45 KiB); docs 5/0. `.conductor/evidence/phase-3/full-gate.log`. |
| Setup / dependency truth | `pnpm install --frozen-lockfile` | 0 | Lockfile up to date, resolution skipped, supply-chain policy verified; no drift. `.conductor/evidence/phase-3/frozen-install.log`. |
| Smoke server | `node node_modules/vite/bin/vite.js preview --port 4173 --strictPort` | started | Served `http://localhost:4173/` on the fixed port; listener stopped and port confirmed free before the first-tap run. |
| Smoke | `node scripts/validate-boot.js` | 0 | 766 / 377 / 397 ms samples; median **0.40 s** ≤ 3.0 s budget. `.conductor/evidence/phase-3/boot.log`. |
| Container | `docker build --build-arg GIT_SHA=65fe7286f0b0e37493268c0e299c469d47129211 -t aby-little-lab:headers .` | 0 | Candidate image built at the actual candidate head. `.conductor/evidence/phase-3/docker-build.log`. |
| Strict headers | `node scripts/validate-headers.js` | 0 | **28 passed / 0 failed** across the observed route matrix. `.conductor/evidence/phase-3/headers.log`. The missing-hash immutable-404 behaviour is a pre-existing, already recorded quirk, not a new failure. |
| First tap | `$env:TAP_HEADED='1'; $env:TAP_INERT_IDLE='1'; node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10` | 0 | Headed cold control: **50 cold / 0 warm**, exactly 10 per game. Aggregate cold p95 response / finished / total 78.5 / 61.1 / 256.4 ms; cold median total 190.8 ms; worst cold total **283.8 ms (Add It Up)** ≤ 400 ms. Raw stdout `.conductor/evidence/phase-3/first-tap.stdout.log`; committed raw JSON `verification/first-tap-headed.json` and stdout `verification/first-tap-headed.stdout.log`. |
| Browser roster | `pnpm exec playwright test --list` | 0 | 50 tests in 20 files: Chromium 26, WebKit 8, Firefox 8, mobile Chromium 8. `.conductor/evidence/phase-3/browser-roster.txt`, `.conductor/evidence/phase-3/list.log`. |
| Browser project | `pnpm test:e2e` | 0 | Chromium 26 passed on first attempt, zero retries. `.conductor/evidence/phase-3/chromium.log`. |
| Browser project | `pnpm test:e2e:webkit` | 0 | WebKit 8 passed on first attempt, zero retries. `.conductor/evidence/phase-3/webkit.log`. |
| Browser project | `pnpm test:e2e:firefox` | 0 | Firefox 8 passed on first attempt, zero retries. `.conductor/evidence/phase-3/firefox.log`. |
| Browser project | `pnpm test:e2e:mobile-chromium` | 0 | Mobile Chromium 8 passed on first attempt, zero retries. `.conductor/evidence/phase-3/mobile-chromium.log`. Matrix total: `.conductor/evidence/phase-3/browser-matrix.log`. |
| Whitespace | `git -c core.whitespace=cr-at-eol diff --check` | 0 | No output, no whitespace errors. |
| Scope proof | `git diff --name-only cf5f5a718133ace0e3d9fe055de29dbedf42107e..HEAD` | 0 | Listed below. |

## Release figures

| Figure | Phase 3 measured value |
| --- | --- |
| Suite | 159 files / 3,454 tests, all green |
| Coverage | statements 97.11 %, branches 91.01 %, functions 96.4 %, lines 98.25 % |
| Build / shell / chunks | Vite 493 modules; shell `index-DF9s1m1B.js` 196.3 kB via bundle guard, 200.98 kB as Vite prints, 51.54 kB gzip; 53 chunks |
| Artifact/document guards | bundle pass (196.3 kB inside 200 kB gate); module-size zero warnings; textures pass; PWA 16 passed / 0 failed, 65 precache entries (1880.45 KiB); docs 5 passed / 0 failed |
| Frozen installation | exit 0, lockfile up to date, no drift, supply-chain policy verified |
| Boot | `validate-boot` 766 / 377 / 397 ms, median 0.40 s; first-tap script's boot 559 / 512 / 459 ms, median 0.51 s; unthrottled median 418.6 ms; 4×-throttled median 1286.6 ms |
| Strict headers | 28 passed / 0 failed |
| First tap | 50 cold / 0 warm; 10 per game; p95 response / finished / total 78.5 / 61.1 / 256.4 ms; cold median total 190.8 ms; worst cold total 283.8 ms (Add It Up) |
| Per-game p95 totals | Shape Sorter 225.9; Find the Letter 218.6; Find the Word 262.0; Add It Up 283.8; Memory Match 185.5 ms |
| Browser roster | 50 tests / 20 files: Chromium 26, WebKit 8, Firefox 8, mobile Chromium 8 |
| Browser first-attempt counts | Chromium 26/26, WebKit 8/8, Firefox 8/8, mobile Chromium 8/8; 50/50 total, zero retries, run sequentially |

No figure above is inherited from an earlier phase or release; every one comes from the final candidate head `65fe7286f0b0e37493268c0e299c469d47129211`. Historical release notes and dated perf sections retain their original figures verbatim.

## Acceptance criteria

| ID | Criterion | Phase 3 evidence | Status |
| --- | --- | --- | --- |
| AC-2 | Notes cover all four PRs, preserve retention/device/longitudinal caveats, reach `FINAL` only after deploy proof | DRAFT notes now carry final candidate figures; tag/deploy/live remain pending; caveats preserved verbatim | satisfied for candidate; FINAL gated on deploy |
| AC-4 | Exact full gate exits 0 on the final candidate; all figures recorded | Exit 0, full figure set above and `full-gate.log` | **met** |
| AC-5 | Boot, headers and headed first tap pass; raw evidence committed; perf truth refreshed if needed | Boot 0.40 s; headers 28/0; first tap 50 cold/0 warm, worst 283.8 ms; raw JSON/stdout committed; live figures refreshed | **met** |
| AC-6 | All four browser projects pass locally on first attempt with zero retries; roster recorded | Roster 50/20; 26/8/8/8 all first attempt, zero retries, sequential | **met** |
| AC-11 | Final diff contains no runtime/asset/dependency/schema/storage change and no unsupported claims | Scope proof below; DRAFT/deploy/device/retention/longitudinal boundaries intact | **met** |

Covered FR/NFR items: FR-2 (candidate boundary), FR-4 (candidate head fixed at the evidence commit), FR-5 (gate/coverage/build figures), FR-6 (boot/header/first-tap gates), FR-7 (browser matrix figures and raw paths), NFR-2 (no threshold, validator, sample count or retry policy was weakened), NFR-3 (all figures measured, none inherited), NFR-4 (historical notes/perf sections/archived tracks untouched), NFR-7 (CRLF-aware whitespace check exit 0).

## Scope proof

`git diff --name-only cf5f5a718133ace0e3d9fe055de29dbedf42107e..5cc6c1247b24740a173d42fb0c7fd041047e11ca` returned:

```
README.md
conductor/tracks.md
conductor/tracks/20261127-release-v1-27-0/index.md
conductor/tracks/20261127-release-v1-27-0/metadata.json
conductor/tracks/20261127-release-v1-27-0/plan.md
conductor/tracks/20261127-release-v1-27-0/spec.md
conductor/tracks/20261127-release-v1-27-0/verification/integrated.md
conductor/tracks/20261127-release-v1-27-0/verification/phase-1.md
conductor/tracks/20261127-release-v1-27-0/verification/phase-2.md
conductor/tracks/20261127-release-v1-27-0/verification/first-tap-headed.json
conductor/tracks/20261127-release-v1-27-0/verification/first-tap-headed.stdout.log
docs/TDD.md
docs/perf-baseline.md
docs/release-notes-v1.27.0.md
package.json
```

This phase additionally updates only `README.md`, `docs/TDD.md`, `docs/perf-baseline.md`, `docs/release-notes-v1.27.0.md`, `verification/integrated.md` and the two committed first-tap raw files — all inside the Phase 3 Touches. No runtime source, test, asset, dependency, lockfile, schema, storage or network behaviour changed. Package version was already `1.27.0` from an earlier phase and was not changed here. No historical release notes, dated perf sections or archived tracks were rewritten.

## Deviations, denials, retries

- **Process deviation:** the executor's shell rejected the heavy commands (`permission.rejected: shell`) once each, including the gate, Docker build, headers, first tap, browser matrix and whitespace check. Per the brief no denial was retried, split, rephrased, substituted or worked around; the primary ran the identical commands unchanged and supplied the results recorded above. A transient background preview listener was stopped by the primary and port 4173 confirmed free before the headed first-tap run.
- **Docker quirk:** the missing-hash immutable-404 behaviour surfaced during header validation is pre-existing and already recorded; it is not a Phase 3 failure and required no change to the app.
- **Permission denials:** all were resolved by the primary's unchanged reruns; none remains open.
- **Retries:** none. Every command passed on its first attempt with zero local retries.
- **No source deviation:** no file outside Touches was modified by this phase.

## Evidence boundary

Local results here are local evidence only. The four browser projects are emulated (including CI-style WebKit, Firefox and mobile Chromium); they are **not** physical-device evidence, and the physical-device gate remains open for ship time. The retention protocol and pilot pack were not executed, so no retention result exists. The Progress Overview's current adaptive-band spread is a present-moment snapshot, not longitudinal band-movement evidence, and no two-week target is claimed as measured. Tag, deploy and live verification remain pending.

## Primary verification

- **Verdict:** accepted for Phase 3 and integrated release-candidate verification.
- **Final evidence head before squash:** `5cc6c1247b24740a173d42fb0c7fd041047e11ca`.
- **Executor commits:** `65fe7286`, `33d060fb`, `5cc6c124`; all reported, no merge or unrelated commit in the phase range.
- **Scope:** the final phase diff contains exactly `README.md`, `docs/TDD.md`, `docs/perf-baseline.md`, `docs/release-notes-v1.27.0.md`, `verification/integrated.md`, `verification/first-tap-headed.json`, and `verification/first-tap-headed.stdout.log`. No runtime source, test, asset, dependency, lockfile, schema, storage or network file changed.
- **Archive safety:** all live `conductor/tracks/20261127-release-v1-27-0/verification/` Markdown links were removed from the release notes and perf baseline before archival. Clickable archive links are deferred to ship-time finalization.
- **Post-finalization exact gate:** exit 0; Biome 378 files; app/E2E TypeScript clean; Vitest 159 files / 3,454 tests; coverage 97.12 % statements / 91.05 % branches / 96.4 % functions / 98.25 % lines; Vite 493 modules; shell `index-DF9s1m1B.js` 196.3 kB / 51.54 kB gzip; module-size zero warnings; textures pass; PWA 16/0; docs 5/0. Raw output: `.conductor/evidence/phase-3/full-gate-final.log`.
- **Coverage variance:** the post-finalization run measured 97.12/91.05 rather than the earlier candidate run's 97.11/91.01. Both are observed runs from unchanged code, both exceed every configured threshold, and `docs/TDD.md` explicitly records per-run instrumentation variance.
- **Whitespace and links:** `git -c core.whitespace=cr-at-eol diff --check` exited 0 with no output; `node scripts/validate-docs.js` independently passed 5/0 after the archive-safety edit.
- **Unchanged heavy evidence:** frozen install, boot, Docker strict headers 28/0, headed first tap 50 cold / 0 warm with worst 283.8 ms, and the sequential 26/8/8/8 browser matrix remain valid because only documentation/evidence prose changed after those measurements.

**Checkpoint:** `74c1618eeb7accc1a4ee4c8a212b6bcec00e6567`
