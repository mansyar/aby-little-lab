# Integrated verification — 20261027-hub-idle-prewarm

- **Track:** `20261027-hub-idle-prewarm` (Hub Idle Chunk Prewarm)
- **Date:** 2026-10-27
- **Branch:** `feat/20261027-hub-idle-prewarm`
- **Base:** `cb5f713a` (master)
- **Head:** `d4313cfa` (after all three phases verified)
- **Result:** verified

Run once, after every phase was verified, on the integrated branch — not a repeat
of any single phase's gate.

## Command

```
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js
```

Chain exit code: **0**

## Results

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | 260 files checked, no fixes. 1 warning (`musicalMemoryScene.test.ts` `noNonNullAssertion`, pre-existing) |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| unit | `pnpm test -- --run` | 0 | **126 files / 2,753 tests** passed |
| unit | `pnpm test:coverage` | 0 | statements **97.76**, branches **91.84**, functions **96.76**, lines **98.73** — gates 90 / 85 / 88 / 95 held |
| build-artifact | `pnpm build` | 0 | 344 modules; PWA precache **54 entries (1,722.35 KiB)** |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present (`phaser-B_vcVLyb.js`, 1,335.0 kB); shell entry `index-DJ5iAYOR.js` = **140.9 kB** ≤ 200 kB |
| build-artifact | `node scripts/validate-pwa.js` | 0 | **16 passed, 0 failed**; 42 chunks, 42 precached |
| docs | `node scripts/validate-docs.js` | 0 | **6 passed, 0 failed**, including the count-drift guard deriving 126 files / 2,753 tests live |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-1 | Seeded test proves recency-first order at idle pace | `src/__tests__/game/hub/prewarm.test.ts` — recency order, never-played-last, tie-break, first-visit, pacing, one-in-flight | satisfied (Phase 1) |
| AC-2 | Seeded test proves a tap cancels pending imports without affecting the tap path | `prewarm.test.ts` cancel-pending / cancel-in-flight / cancelled-loader-still-usable; `hubScene.test.ts` tap-wins asserts `invocationCallOrder` (cancel before load) | satisfied (Phases 1, 2) |
| AC-3 | Seeded test proves no imports while locked, resume when cleared | `hubScene.test.ts` locked-open / lock-mid-cycle / hidden-tab / resume cases | satisfied (Phase 2) |
| AC-4 | Rejected import swallowed; no unhandled rejection; game still loadable later | `prewarm.test.ts` swallow-rejection + failed-key-retried-next-run | satisfied (Phase 1) |
| AC-5 | `perf-baseline.md` carries a dated first-tap verdict with before/after medians and the open question resolved | `perf-baseline.md:395` pointer + `:432` dated section; open-question text at `:405` preserved and marked closed | satisfied (Phase 3) |
| AC-6 | Full gate green incl. count guard; TDD and tech-stack sections present | this document; `TDD.md:557` §4.7; `tech-stack.md` 2026-10-27 entry | satisfied (Phase 3) |

## Notes

- Zero new dependencies; `package.json` and the lockfile are unchanged across the whole track.
- Boot budget untouched: the prewarm is armed 1200 ms after the entrance settles and runs in idle slots only, so the cold-boot path gains no work.
- Bundle budgets held: shell 140.9 kB against the 200 kB ceiling (the 9.6 kB growth over the 2026-10-22 figure comes from the tracks that landed since, not from this one — the prewarm module is part of the Hub chunk).
- Coverage held above every gate at every phase; denominators did not move in Phase 3, so the living docs' snapshot needed no further refresh.
- The one pre-existing lint warning was left untouched, as in prior tracks.
- The measurement in Phase 3 ran headed Chromium on this host; the device pass remains the workflow's documented manual exception, now for confirmation rather than to settle an unknown.
