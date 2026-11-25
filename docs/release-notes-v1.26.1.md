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
- Archived evidence: [PR #100](https://github.com/mansyar/aby-little-lab/pull/100).

## Installation

Nothing to install by hand: this release is the PWA shell plus its content-addressed chunks, served from the live URL after the tag deploy. Offline play uses the precached entries from the first visit. There is no storage migration: existing profiles, stickers, settings and saves carry over exactly as they were. The live URL and deployed build for v1.26.1 are pending tag verification.

## Release Verification

> **DRAFT — pending.** The checks below have not yet run on the v1.26.1 release candidate. This section will be completed with measured release-state figures once the release tree is verified. No tag, deploy, final-CI or physical-device result is claimed here.

- Integrated gate, coverage, build artifacts, documentation validation, frozen installation, boot and strict-header checks: pending on the exact release candidate.
- Headed first tap: pending. The unchanged 400 ms worst-cold gate and the 50 cold / 0 warm sample requirement still apply; headless or warm-only data cannot substitute.
- Browser journeys and engine matrix: the WebKit, Firefox and mobile Chromium smoke coverage is CI-only and emulated. The v1.26.1 PR and tag runs, including the required `Browser Journeys` rollup, both Chromium shards and all three engine jobs, are pending. Emulated engines are not real-device coverage.
- Targeted device smoke: **pending** (planned as `SKIPPED — accepted gap`). No physical-device install, landscape, offline-reload or first-tap-audio result is claimed. The focused checklist is in [device-testing-checklist.md](device-testing-checklist.md).
- Tag, CI and deploy: pending. No `v1.26.1` tag has been created or pushed, no tag CI run exists, and no Coolify deploy or live-build verification has been performed.

## Known Issues

The full list of known issues lives in the README's [Known Issues](../README.md#known-issues) section, and planned work lives in [conductor/roadmap.md §10](../conductor/roadmap.md#10-roadmap); nothing below duplicates either.

- The three compatibility fixes are verified against emulated WebKit, Firefox and mobile Chromium only. Physical iOS Safari, Android Chrome and Fire tablet behavior remains an accepted gap; see [device-testing-checklist.md](device-testing-checklist.md).
- Non-Chromium physical-device support and production retention evidence are not claimed. The accepted device-gap decision is pending this release's gate.
- PR #100 introduces no new known issue. Final tag, CI, deploy and device-policy results are pending.
