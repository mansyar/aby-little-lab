# Release Notes - v1.26.1

> Status: DRAFT
> Tag: (pending)
> Base: `v1.26.0` (`3c0cef4a63a779132370fb8ec056a7be55bc56ea`, 2026-11-25)

One reviewed change has merged since v1.26.0. Behind the scenes, the game now gets a repeatable browser-compatibility check on WebKit, Firefox and mobile Chromium before each code change, and three problems that the new checks found are fixed. The games, rules and controls are unchanged, and nothing new is asked of a child. Profiles, stickers, settings and saves carry over without migration.

## What Shipped Since v1.26.0

One PR merged after v1.26.0.

### PR #100 - Browser compatibility matrix

- WebKit, Firefox and a mobile Chromium/touch project now run a focused six-file smoke on each code PR. The smoke covers boot, all 24 launches and returns, three speech rounds, three drag rounds, an earned-sticker reload and an offline relaunch. The full journey suite stays Chromium-only.
- The existing required `Browser Journeys` rollup now fails if any engine or Chromium shard fails, was cancelled or never started, so one red engine cannot hide behind green siblings.
- A strict evidence helper rejects retried, flaky, skipped, unexpected or wrong-project reports and records the exact engine version and profile, attempt count and duration.
- Three smoke-proven portability defects were repaired without new runtime dependencies, assets, save schema, game rules or runtime-network behavior. WebKit's boot no longer crashes when `AudioContext` is absent; game preload and idle Hub prewarm share texture reservation and release so Firefox cannot race into duplicate texture ownership; and the parental long-hold wait now follows actual hold state with canvas-liveness and 90-second backstops, so a high-refresh device cannot exhaust a frame-only deadline.
- This browser coverage is **emulated** WebKit, Firefox and mobile Chromium in CI, not physical iOS Safari, Android Chrome or Fire tablet validation. The first-attempt local matrix proof and the merged work are recorded in the archived [PR #100 record](../conductor/archive/20261125-browser-matrix/pr.md) and its [integrated verification](../conductor/archive/20261125-browser-matrix/verification/integrated.md). The authoritative v1.26.1 PR and tag CI runs are pending this release.
- A release-time fix-forward patch guards `AudioContext.resume()` and `close()` promise rejections, closing the Firefox navigation-time page error that made the post-merge master rerun red. This is the sole runtime change in v1.26.1 beyond PR #100; it adds two regression tests and weakens no assertion, threshold, sample count or gate.
- Archived evidence: [PR #100](https://github.com/mansyar/aby-little-lab/pull/100).

## Installation

Nothing to install by hand: this release is the PWA shell plus its content-addressed chunks, served from the live URL after the tag deploy. Offline play uses the precached entries from the first visit. There is no storage migration: existing profiles, stickers, settings and saves carry over exactly as they were. The live URL and deployed build for v1.26.1 are pending tag verification.

## Release Verification

> **Local release candidate verified; PR/tag CI and deploy pending.** The figures below are measured on the exact candidate tree, not inherited from earlier releases.

- Integrated gate: exit 0 with 158 test files / 3,406 tests in both unit and coverage runs; coverage 97.08–97.09 % statements, 90.89–90.93 % branches, 96.35 % functions and 98.23 % lines; 491 modules built. The shell `index-CzNKiaF1.js` is 199.96 kB raw / 51.15 kB gzip and 195.3 kB under the 200 kB guard; 172 TypeScript files have zero module-size warnings, 319 SVGs pass their budgets, PWA validation is 16/16 with 52 precached chunks and 64 precache entries, and documentation validation is 5/5. `pnpm install --frozen-lockfile` exited 0 with no lockfile drift.
- Boot and strict headers: boot median 0.85 s over three cold loads against the unchanged 3.0 s budget. A Docker image built from the release-candidate commit passed all 28 strict-header checks across the SPA root, shell, service worker, manifest, hashed asset, unknown route and missing hashed asset.
- Headed first tap: the required command exited 0 with exactly 50 cold / 0 warm samples and 10 samples per target game. Aggregate cold p95 response / finished / total was 58.4 / 37.6 / 332.3 ms, cold median total 235.4 ms, and worst cold total 383.8 ms (Memory Match), inside the unchanged 400 ms gate. Headless or warm-only data was not substituted.
- Browser matrix: the local roster is 50 tests in 20 files. Chromium passed 26/26, and WebKit, Firefox and mobile Chromium each passed 8/8, all on the first attempt with zero local retries. This coverage is CI emulation, not physical-device validation. The v1.26.1 PR and tag runs, including the required `Browser Journeys` rollup, both Chromium shards and all three engine jobs, remain pending.
- Fix-forward CI regression: after PR #100 merged, master rerun `45595775568` on `859498a8` went red because Firefox logged three `InvalidStateError: Navigated away from page` page errors in `sticker-persistence`. This release adds a two-line guard so `AudioContext.resume()` and `close()` promise rejections are handled like the existing BGM play path. The focused AudioManager suite passes 93/93 tests, and no assertion, threshold, sample count, retry setting or gate was weakened. Fresh PR CI must be green before merge and tagging.
- Targeted device smoke: **SKIPPED — accepted gap** by owner decision. No physical-device install, landscape, offline-reload or first-tap-audio result is claimed, and no iOS Safari, Android Chrome or Fire tablet pass is claimed. The focused checklist is in [device-testing-checklist.md](device-testing-checklist.md).
- Tag, CI and deploy: pending. No `v1.26.1` tag has been created or pushed, no tag CI run exists, and no Coolify deploy or live-build verification has been performed.

## Known Issues

The full list of known issues lives in the README's [Known Issues](../README.md#known-issues) section, and planned work lives in [conductor/roadmap.md §10](../conductor/roadmap.md#10-roadmap); nothing below duplicates either.

- The three compatibility fixes are verified against emulated WebKit, Firefox and mobile Chromium only. Physical iOS Safari, Android Chrome and Fire tablet behavior remains an accepted gap; see [device-testing-checklist.md](device-testing-checklist.md).
- Non-Chromium physical-device support and production retention evidence are not claimed. The owner accepted this device gap at track creation; it is not presented as a pass.
- PR #100 introduces no new known issue. The fix-forward AudioManager guard closed a CI-only Firefox regression without changing gameplay. Final PR CI, tag, deploy and live-build results are pending.
