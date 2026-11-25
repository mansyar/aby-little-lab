# Release Notes - v1.26.0

> Status: DRAFT
> Tag: (pending)
> Base: `v1.25.0` (`4359667bbeea5a774efe5675fd6cc62069c96dc0`, 2026-11-23)

Five reviewed changes have merged since v1.25.0. For families, the Hub now offers a fresh textless suggestion and an earned-sticker spotlight, the adaptive challenge is better balanced, and Find the Word gets to its first round faster. Behind the scenes, the development tools are current and first-tap performance now has repeatable evidence. The games keep the same rules and controls, and nothing new is asked of a child. Profiles, stickers, settings and saves carry over without migration.

## What Shipped Since v1.25.0

Five PRs merged after v1.25.0, in this order.

### PR #94 - A fresh suggestion on each visit

- The Hub suggests a game with a textless ring and gives idle tiles a gentle wiggle, using one shared no-repeat selector: unplayed games first, then least-recently played, then registry order.
- One already-earned sticker is spotlighted per visit, with a per-profile cursor that advances and wraps around.
- All of this visit state is memory-only and resets when the child switches profiles. Reduced-motion preferences are respected, and no new artwork, speech, save field or runtime dependency was added.
- Archived evidence: [PR #94](../conductor/archive/20261124-replay-novelty/pr.md).

### PR #95 - Better-balanced challenge, visible to parents

- The adaptive difficulty cut points were retuned against the designed mix of mostly steady challenge, with gentler and stretch adjustments around the edges. The change keeps the existing sample floor and one-band limit.
- Parents can now see the viewed profile's current band on each Learning Progress row. The readout respects the adaptive-difficulty setting and does not change the child-facing screens.
- No game rule or save schema changed. The tuning comes from a deterministic simulation of realistic answer streams, not production retention data.
- Archived evidence: [PR #95](../conductor/archive/20261124-adaptive-tuning/pr.md).

### PR #96 - Current development tools, same game

- The November maintenance pass updated Biome to 2.6.8, Vite to 8.3.8, Vitest and its coverage package to 5.1.1, and the Playwright pair to 1.65.1.
- The manifest and lockfile stayed aligned, every quality gate remained green, and no runtime dependency or production-source behavior changed.
- This is behind-the-scenes maintenance for a healthier build and test pipeline, not a new feature for families.
- Archived evidence: [PR #96](../conductor/archive/20261124-dependency-majors/pr.md).

### PR #97 - Faster first tap in Find the Word

- Find the Word now generates its deterministic six-round playthrough before preload, then rasterizes only the letters and prompt assets that run can draw. Unused art groups stay empty.
- The seeded rounds, adaptive difficulty, prompts, cards, speech, input, completion and saves are unchanged.
- Archived headed evidence passed the unchanged 400 ms first-tap gate. The release candidate will be measured again in Phase 3 rather than reusing the archived figure as a release-state claim.
- Archived evidence: [PR #97](../conductor/archive/20261124-word-match-first-tap/pr.md) and the dated [performance baseline](perf-baseline.md#find-the-word-cold-first-tap-fix-2026-11-24).

### PR #98 - Repeatable first-tap performance evidence

- The first-tap harness now reports nearest-rank p95 and supports repeated cold-tap sampling across the same five target games, with raw JSON evidence and a per-release refresh procedure.
- P95 is report-only; the unchanged gate still fails only when a worst cold total exceeds 400 ms. Headless or warm-only data cannot substitute for the required headed cold samples.
- The earlier failed 507.4 ms Find the Word result remains preserved as history beside the passing baseline; the new evidence does not erase it.
- Archived evidence: [PR #98](../conductor/archive/20261124-first-tap-p95-baseline/pr.md) and [First-tap p95 baseline after the Word Match fix](perf-baseline.md#first-tap-p95-baseline-after-the-word-match-fix-2026-11-24).

## Installation

Nothing to install by hand: this release is the PWA shell plus its content-addressed chunks, served from the live URL after the tag deploy. Offline play uses the precached entries from the first visit. There is no storage migration: existing profiles, stickers, settings and saves carry over exactly as they were. Tag and deploy remain pending until the separate approval gate.

## Release Verification

> This is a DRAFT. Final release-state figures are refreshed on the exact release candidate in Phase 3; archived PR figures are evidence for the shipped changes, not substitutes for that measurement.

- Full gate: the configured `verify_phase` chain covers lint, typecheck, unit tests, coverage, production build, the bundle, module-size, texture, PWA and docs validators. Final release-state results are pending Phase 3.
- Unit and coverage: suite counts and coverage percentages are pending the Phase 3 release-state run.
- Build artifacts: shell size, module-size, texture and PWA validator figures are pending the Phase 3 release-state run.
- Boot and headers: the built-app boot smoke and strict header checks are pending Phase 3.
- First tap: the exact headed cold-control command, sample counts, p95 table and worst-cold gate result are pending the Phase 3 release-candidate run. The archived passing baseline and its refresh procedure live in [perf-baseline.md](perf-baseline.md#per-release-first-tap-refresh).
- Browser journeys: CI runs the automated Playwright Browser Journeys against the built `dist` in Chromium, in two shards plus a rollup. Those jobs exercise pointer input, storage and service-worker behavior, but they are **not real-device coverage** and make no Firefox or WebKit support claim. Release-commit CI results are pending.
- Targeted device smoke: pending Phase 5. No physical-device install, landscape, offline-reload or first-tap-audio result is claimed by this draft.
- Tag, CI and deploy: pending. No `v1.26.0` tag has been created, no release CI run is recorded, and no deployment has been verified.

## Known Issues

The full list of known issues lives in the README's [Known Issues](../README.md#known-issues) section, and planned work lives in [conductor/product.md §10](../conductor/product.md#10-roadmap); nothing below duplicates either.

- Targeted device coverage is still pending. The automated Chromium Browser Journeys are valuable release evidence, but they do not replace the focused physical-device smoke in [device-testing-checklist.md](device-testing-checklist.md).
- Non-Chromium browser support and production retention evidence are not claimed. The browser-matrix and real-family retention work remain separate roadmap items.
- No new known issue is filed by the five reviewed PRs. Final release-state verification and the device-policy decision remain open gates recorded in [release-checklist.md](release-checklist.md).
