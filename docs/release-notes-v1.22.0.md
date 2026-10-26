# Release Notes - v1.22.0

> Status: FINAL
> Tag: `v1.22.0` (cut 2026-10-27 on `f624884d`, pushed to origin - tag-gated Coolify deploy fired)
> Base: `v1.21.7` (`ee6bb40f`, 2026-10-25)

Seven tracks merged since v1.21.7: **the Hub now uses the quiet moments after you land to get the next game ready (idle game-chunk prewarm), and it draws game art before first paint on a cold tap (art-queue prewarm)** - so taps feel instant whether the game is already in memory or not. Underneath, the codebase gains one shared shuffle and one seeded RNG seam across all 22 scenes and every game-logic helper (the duplicate dice are gone, tests are deterministic), the toolchain moves to its current majors, and the property suites get their flake guard. Nothing changes in what you see when you play - except that the wait is gone.

## What Shipped Since v1.21.7

Merged PRs #67-#73 on master after the v1.21.7 tag, in merge order.

### PR #67 - One shuffle, one RNG seam

- New `src/game/random.ts` is the single home for randomness: it exports `Rng` plus one shared Fisher-Yates `shuffle` used by all games.
- Five hand-rolled duplicate shuffles are deleted and their 13 importers re-pointed; every game-logic helper across the 21 logic modules takes a trailing `rng` parameter defaulting to `Math.random`, so production behaviour is unchanged and tests inject a seed.
- A shared seeded `mulberry32` test helper in `src/__tests__/helpers/` replaces ad-hoc copies; the roadmap Known Issue about scattered dice and the Future Work entry calling for one RNG seam are both retired as done.

### PR #68 - The scenes gain their own RNG seam

- `GameSceneBase` and all 22 game scenes now take a trailing `rng` constructor parameter (defaulting to `Math.random`) stored as a protected field, so each scene owns its dice; scenes forward `this.rng` into their logic calls and `GroupMathConfig.buildPlaythrough` widens to `(shift, rng?)`.
- 52 `Math.random` spy sites across 27 files become seeded construction; Story Order passes `this.rng` with the rng-first argument position preserved (`buildPlaythrough(this.rng, getAdaptiveBandShift("story-order"))`, `StoryOrderScene.ts:91`).
- No player-visible change; the whole suite stays green, which is the point - the seam exists so future tests can freeze luck entirely.

### PR #69 - The docs truth pass, with a count-drift guard

- Docs-only: README, TDD, performance baseline, tech stack, workflow and styleguides refreshed to the then-current truth (125 files, 2,729 tests), with the perf section rewritten around prewarm-aware tap budgets and the device checklist gained its execution record.
- `scripts/validate-docs.js` grows a sixth check (`checkTestCounts`) that re-runs the suite listing itself (`vitest list --report=json --no-staticParse`, collect-only) and fails when the counts the living docs claim drift from the real totals.
- The guard was mutation-proven (a deliberately wrong count fails the check), so the numbers below can never go stale again - they are enforced, not promised.

### PR #70 - The property-test deflake

- The addItUp/count/numberOrder/takeAway/firstSounds seeded-sweep suites (plus decode/word per the audit) each get an explicit 120-second per-test timeout so a loaded CI runner can no longer kill a long sweep mid-stride and report a flake.
- The TDD gains a §10.1 note explaining why the generous timeout is a guard rail rather than a slower test, and `vite.config.ts` is untouched.
- Zero production change, counts unchanged: this track buys quiet CI, not new coverage.

### PR #71 - The dependency majors

- Vite 8.1.5 → 8.3.5, Vitest + coverage 4.1.10 → 5.0.5, happy-dom 18.0.1 → 21.0.4, vite-plugin-pwa 1.3.0 → 2.0.0, Biome 2.5.5 → 2.6.3 - each major landed alone, verified, with its fallout absorbed (Vitest 5's `clearMocks: true` default embraced and redundant manual mock clearing deleted; `vitest list` now runs with `--no-staticParse`).
- The full gates stay green (suite plus coverage in ~13-16 s), the PWA validator stays 16/16 with 42/42 precached entries byte-equivalent, and the release checklist records the new pins.
- No `src/` production change: the games cannot tell the toolchain moved.

### PR #72 - The Hub's idle game-chunk prewarm

- New `src/game/hub/prewarm.ts` teaches the Hub to spend its idle moments wisely: 1,200 ms after you land, each animation frame loads one not-yet-loaded game chunk, most-recently-played first, via `requestIdleCallback` with a `setTimeout` fallback.
- Three gates keep it polite: play-time credit runs uninterrupted (no prewarm while the clock fronts the UI), nothing starts before launch, and `document.hidden` freezes it entirely; tapping a tile runs `cancelPrewarm()` and hands the tap the ready chunk - the prewarm never races the player.
- Warm taps hold at 27.2-64.9 ms medians (verified 2026-10-27): the game you just left is already loaded when you go back.

### PR #73 - The cold-tap art preload

- The same idle prewarm now carries an art queue: a key-plus-tier asset table per game (`ART_KEYS_BY_GAME`, recency-ordered) is rasterised into the `TextureManager` cache while the Hub idles, so cold taps draw from memory instead of the network; `HubScene` gains `ART_GROUP_LOADERS`/`ART_GROUPS_BY_GAME` dynamic imports so the art travels with the game's own chunk.
- A missing key degrades to the same placeholder it always did (silent raster path, no new failure mode), and nothing starts while locked behind play time - the welcomed edge cases (locked tiles, hidden tab) share the chunk gates.
- Fully-cold taps now land inside the 400 ms budget too: worst sampled median is Find the Word at 332.6 ms (verified 2026-10-27).

## Installation

Nothing to install by hand: the release is the PWA shell plus its content-addressed chunks, served from the live URL after the tag deploy; offline play uses the precached entries from the first visit. No storage migration is required: none of these seven tracks changes the saved-progress format (verified by diffing the `v1.21.7..HEAD` range for save, progress and storage-shape changes - no hits), so existing profiles, stickers and play-time carry over untouched.

## Release Verification

- Test suite: **126 files, 2,781 tests, all green** (verified 2026-10-27). Thresholds (lines 95 / functions 88 / branches 85 / statements 90) hold: statements 97.75, branches 91.76, functions 96.88, lines 98.70.
- PWA: `node scripts/validate-pwa.js` 16/16; the boot shell entry stays inside its 200 kB budget at 148.86 kB; build emits 42 chunks with 54 precached entries.
- Prewarm: warm-tap medians 27.2-64.9 ms and fully-cold worst median 332.6 ms (Find the Word), both inside their budgets (verified 2026-10-27; see [perf-baseline.md](perf-baseline.md)).
- Docs: `node scripts/validate-docs.js` 6/6 on the release commit, including the count-drift guard.
- Save schema: no change across PRs #67-#73 (storage files untouched in the range diff).
- Device matrix: **SKIPPED - accepted gap.** This release track deliberately skips the device-class pass per scope (the change surface is idle-time preloading, RNG plumbing and toolchain pins, all covered by the automated gates above); the manual phone/tablet rows in [device-testing-checklist.md](device-testing-checklist.md) remain the checklist to run before any player-facing claim about this version, and CI plus the tag-deploy smoke re-confirm every figure above on the release commit.

## Known Issues

The full list of known issues and planned work lives in [roadmap.md](roadmap.md) - it is the single home for what is outstanding, and nothing below duplicates it.

- The duplicate-shuffle Known Issue and its Future Work entry are resolved by PRs #67-#68 and already retired in the roadmap.
- No new known issues were filed by these seven tracks: the prewarm paths degrade to previous behaviour (placeholder art, on-demand chunk load) rather than new failure modes.
