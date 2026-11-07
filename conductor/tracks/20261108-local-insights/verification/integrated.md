# Integrated verification - Local Insights

- **Track:** `20261108-local-insights`
- **Date:** 2026-11-08
- **Branch:** `feat/20261108-local-insights`
- **Base:** `64e35642ad33dbeeeb2ed85507a0c40795d8844d`
- **Head:** `c2c87661`
- **Result:** verified

## Layers, run against the integrated tree

| Layer | Command | Result |
| --- | --- | --- |
| Static | `pnpm check` | `Checked 301 files in 364ms. No fixes applied.` |
| Types | `pnpm typecheck` | `tsc --noEmit` then `tsc --noEmit -p e2e/tsconfig.json`, clean |
| Unit | `CI=true pnpm test -- --run` | 137 files / 2,975 tests passed, 19.20 s |
| Coverage | `pnpm test:coverage` | statements 97.22 / branches 91.12 / functions 96.1 / lines 98.21 - gate 90 / 85 / 88 / 95 |
| Build | `pnpm build` | 365 modules, 47 JS chunks, 59 precache entries (1755.58 KiB) |
| Bundle artifact | `node scripts/validate-bundle.js` | phaser 1335.0 kB; shell `index-C7_3WcjB.js` 158.1 kB <= 200 kB |
| PWA artifact | `node scripts/validate-pwa.js` | 16 passed, 0 failed (47 chunks, 47 precached) |
| Documents | `node scripts/validate-docs.js` | 5 passed, 0 failed |
| Browser | `pnpm test:e2e` | 17 journeys passed, 3.2 min on two workers |

## Cross-phase checks

- **One record, one place.** The five fields live in `ProfileInsights`, are
  created and normalised in `insightsLogic.ts`, and travel through the profile
  normaliser that every stored-shape concern already goes through. `SCHEMA_VERSION`
  stayed at 1 because the field is additive and backfilled; the unknown-version
  write protection is untouched.
- **The write path did not grow.** The streak advances inside the single `mutate`
  that `recordGameResult` already performs, and the cap counter fires from the one
  call site that decides a lock, idempotent per day. No per-tap write exists.
- **The summary reads what the strip reads.** Both windows are derived from
  `todayKey(now)` arithmetic and compared the same way, so the sentence above the
  7-day strip cannot describe a different week from the bars below it.
- **The page did not move the app.** The Overview is page 0 inside the existing
  gate; per-game rows keep six to a page, one page later; the counter totals five;
  both chevrons clamp. The four per-game tests that existed before still pass.
- **The suite proves the parent's path.** The journey holds the 3-second gate,
  taps the published Progress row, and reads the strings the overlay drew - not a
  recomputation of them. A page that rendered the wrong sentence would fail it.
- **No new surface left the device.** No dependency added, no `fetch(` in `src/`,
  no timestamp finer than a local day key, nothing transmitted.

## Scope note

The phase `Touches` lists grew, each with a reason recorded in its evidence file:

- `src/__tests__/components/SettingsPanel.test.ts` and
  `src/__tests__/scenes/hubScene.test.ts` - existing tests asserted the page
  numbering and the settings-state shape that this track changed by one page and
  two keys. No production change.
- `src/__tests__/utils/storage.test.ts`, `src/game/profileLogic.ts`,
  `src/components/PlayTimeIndicator.ts` - the backfill, the streak write and the
  single cap-lock call site.
- `conductor/product.md` §10.3 - the roadmap row and the metric baselines. Edited
  by the primary, not a phase agent, because Conductor state and the roadmap are
  the primary's to write.

## Runtime note

The browser suite grew from 16 to 17 journeys and from 3.6 to 3.2 minutes; the new
journey costs 10.3 s and `launch-all` still owns the critical path at 2.7 minutes.
There is room for roughly four more journeys before the five-minute budget needs
another decision.

## Residual risk

The shell entry grew 3.3 kB across this track, to 158.1 kB of the 200 kB gate. That
is still comfortable, but it is the number to watch: the Overview page added a
module to the boot path's import graph, and the next feature that does the same
should check the budget rather than discover it.
