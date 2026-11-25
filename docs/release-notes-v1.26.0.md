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
- Archived headed evidence passed the unchanged 400 ms first-tap gate. The release candidate was measured again in Phase 3; the current figures below are release-state evidence, not a reuse of the archived number.
- Archived evidence: [PR #97](../conductor/archive/20261124-word-match-first-tap/pr.md) and the dated [performance baseline](perf-baseline.md#find-the-word-cold-first-tap-fix-2026-11-24).

### PR #98 - Repeatable first-tap performance evidence

- The first-tap harness now reports nearest-rank p95 and supports repeated cold-tap sampling across the same five target games, with raw JSON evidence and a per-release refresh procedure.
- P95 is report-only; the unchanged gate still fails only when a worst cold total exceeds 400 ms. Headless or warm-only data cannot substitute for the required headed cold samples.
- The earlier failed 507.4 ms Find the Word result remains preserved as history beside the passing baseline; the new evidence does not erase it.
- Archived evidence: [PR #98](../conductor/archive/20261124-first-tap-p95-baseline/pr.md) and [First-tap p95 baseline after the Word Match fix](perf-baseline.md#first-tap-p95-baseline-after-the-word-match-fix-2026-11-24).

## Installation

Nothing to install by hand: this release is the PWA shell plus its content-addressed chunks, served from the live URL after the tag deploy. Offline play uses the precached entries from the first visit. There is no storage migration: existing profiles, stickers, settings and saves carry over exactly as they were. Tag and deploy remain pending until the separate approval gate.

## Release Verification

> This is a DRAFT. The figures below were measured on the exact release candidate on 2026-11-25. Release-commit CI, the targeted device smoke, tag and deploy remain separate gates.

- Full gate: `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` exited 0.
- Unit and coverage: 158 test files and 3,395 tests passed; coverage was 97.10% statements, 90.96% branches, 96.35% functions and 98.23% lines.
- Build artifacts: 491 modules; shell entry `index-0f9hfHo0.js` was 197.99 kB raw / 50.40 kB gzip and 193.4 kB under the bundle guard; 172 TypeScript files had zero module-size warnings; 319 SVGs passed the texture budget; PWA validation passed 16/16 with 52 JavaScript chunks and 64 precache entries; documentation validation passed 5/5.
- Boot and headers: the production-preview boot smoke passed with a 0.81 s median over three cold loads against the 3.0 s budget. A freshly built release-candidate container (`sha256:21d3b670ea56da854febaf90f999cbf62c55781e23727e312a20d3582f960b8b`) passed all 28 strict-header checks. The validator's pre-existing immutable-cache quirk on a missing hashed asset remains recorded, unchanged.
- First tap: `TAP_HEADED=1 TAP_INERT_IDLE=1 node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10` exited 0 with exactly 50 cold / 0 warm runs and 10 samples per target game. Aggregate cold p95 was 75.1 ms response, 45.0 ms chunk-finished and 265.9 ms first-frame total; cold median total was 192 ms. The worst cold total was 300.2 ms (Shape Sorter), below the unchanged 400 ms gate.

| Game | Cold samples | p95 response | p95 chunk finished | p95 first-frame total |
| --- | ---: | ---: | ---: | ---: |
| Shape Sorter | 10 | 65.0 ms | 34.9 ms | 300.2 ms |
| Find the Letter | 10 | 45.4 ms | 33.4 ms | 254.5 ms |
| Find the Word | 10 | 93.7 ms | 54.3 ms | 193.9 ms |
| Add It Up | 10 | 75.1 ms | 45.0 ms | 161.1 ms |
| Memory Match | 10 | 75.9 ms | 39.9 ms | 266.9 ms |

- Raw evidence: the exact headed stdout and parseable JSON, plus integrated verification, are preserved in `conductor/archive/20261125-release-v1-26-0/verification/` when this track completes. The archived 2026-11-24 baseline remains in [perf-baseline.md](perf-baseline.md#first-tap-p95-baseline-after-the-word-match-fix-2026-11-24).
- Browser journeys: pending release-commit CI. The automated Playwright Browser Journeys run against the built `dist` in Chromium, in two shards plus a rollup. They exercise pointer input, storage and service-worker behavior, but they are **not real-device coverage** and make no Firefox or WebKit support claim.
- Targeted device smoke: pending Phase 5. No physical-device install, landscape, offline-reload or first-tap-audio result is claimed by this draft.
- Tag, CI and deploy: pending. No `v1.26.0` tag has been created, no release CI run is recorded, and no deployment has been verified.

## Known Issues

The full list of known issues lives in the README's [Known Issues](../README.md#known-issues) section, and planned work lives in [conductor/product.md §10](../conductor/product.md#10-roadmap); nothing below duplicates either.

- Targeted device coverage is still pending. The automated Chromium Browser Journeys are valuable release evidence, but they do not replace the focused physical-device smoke in [device-testing-checklist.md](device-testing-checklist.md).
- Non-Chromium browser support and production retention evidence are not claimed. The browser-matrix and real-family retention work remain separate roadmap items.
- No new known issue is filed by the five reviewed PRs. Final release-state verification and the device-policy decision remain open gates recorded in [release-checklist.md](release-checklist.md).
