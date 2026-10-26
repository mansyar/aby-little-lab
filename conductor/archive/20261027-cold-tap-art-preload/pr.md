## Summary

The Hub now rasterizes each game's SVG art groups into the shared texture store while a child idles, beside the idle JS chunk imports — so a tap can find both its game already imported and its art ready to paint. The headed before/after verdict shows the art queue driving post-tap raster blockage to ~zero at 6 s settle in all five sampled games, with the worst sampled fully-cold tap at 332.6 ms (inside the 400 ms budget). Nothing a child sees, hears, or taps changes.

## Track

- **ID:** `20261027-cold-tap-art-preload`
- **Type:** `feature`
- **Spec:** [`conductor/archive/20261027-cold-tap-art-preload/spec.md`](conductor/archive/20261027-cold-tap-art-preload/spec.md)
- **Plan:** [`conductor/archive/20261027-cold-tap-art-preload/plan.md`](conductor/archive/20261027-cold-tap-art-preload/plan.md)
- **Review:** [`conductor/archive/20261027-cold-tap-art-preload/review.md`](conductor/archive/20261027-cold-tap-art-preload/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Art-key queue engine | `prewarm.ts` streams art keys one-per-idle-tick, recency-first, proven by seeded tests | verified | `a1a2a6d5` | Key-only `ART_KEYS_BY_GAME` (no SVG in shell entry); musicalMemory one-line equivalent test fix |
| 2: Hub integration | HubScene drives the art queue behind the shared gates; warmed games queue zero keys, no cue | verified | `f6c9bb52` | `phaserMock` `load.start` one-line addition; 11 new hubScene tests |
| 3: Cold-tap verdict + records | Dated before/after verdict + TDD §4.8 + tech-stack entry | verified | `7764666b` | Rig grew an app-untouched stage-D diagnostic (C can't see raster); 16 headed runs |
| R1: Review fixes | Re-scope AC-6 to the 5-game sample; refresh live header | verified | `9ae33c53` | Docs-only; user-approved re-scope |

## Requirements

- [x] `FR-1` — Idle-paced, recency-first art raster; tap cancels (test: `src/__tests__/game/hub/prewarm.test.ts`)
- [x] `FR-2` — Settle/lock/hidden gates with resume (test: `src/__tests__/scenes/hubScene.test.ts`)
- [x] `FR-3` — Idempotent + silent: skip-present, swallow-fail, no cue, no race
- [x] `FR-4` — Dated cold-tap verdict, same host back-to-back, median-of-three
- [x] `FR-5` — Shutdown cancels; TDD walkthrough + tech-stack entry
- [x] `NFR-1` — Zero kid-visible change beyond faster starts
- [x] `NFR-2` — Budgets hold: shell 148.9 kB ≤ 200 kB, PWA 16/16, docs 6/6
- [x] `NFR-3` — check/typecheck clean, TSDoc contracts
- [x] `NFR-4` — No new runtime dependencies
- [x] `AC-1` — Seeded order + pacing tests
- [x] `AC-2` — Tap-cancel; tap path unaffected
- [x] `AC-3` — Lock/hidden suppression + resume
- [x] `AC-4` — Failure swallowed, tap path covers via placeholder
- [x] `AC-5` — Warmed game queues zero keys, no cue
- [x] `AC-6` — Worst sampled fully-cold median 332.6 ms ≤ 400 ms (as re-scoped)
- [x] `AC-7` — Full 8-command gate green (126 files / 2781 tests)

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| lint | `pnpm check` | pass | exit 0, 260 files |
| typecheck | `pnpm typecheck` | pass | exit 0 |
| unit | `pnpm test -- --run` | pass | 126 files / 2781 tests |
| coverage | `pnpm test:coverage` | pass | 97.75 / 91.76 / 96.88 / 98.70 vs 95 / 88 / 85 / 90 |
| build | `pnpm build` | pass | precache 59 entries |
| bundle | `node scripts/validate-bundle.js` | pass | shell 148.9 kB ≤ 200 kB |
| pwa | `node scripts/validate-pwa.js` | pass | 16/16 |
| docs | `node scripts/validate-docs.js` | pass | 6/6 |
| headed | rig `--warm-aware` ×16 | pass | C/D medians + raw JSON in verdict |

## Review

- **Verdict:** `PASS WITH FINDINGS`
- **Rounds:** 1
- **Fixed:** 2 findings (F1 Medium AC-6 scope, F2 Low stale header)
- **Accepted/deferred:** 0 (see `review.md`; 17-game sweep noted as Debt without issue — measurement path explicitly declined for the re-scope)

## Deviations and risks

- Baseline built in-tree (two-line art-pass removal, reverted) instead of a copied tree — same isolation (0.04 kB shell delta), less machinery.
- Rig stage-D extension (in-page rAF sampling, app-untouched): stage C fires before game `preload` raster, so the art half needed its own diagnostic. Budget gate stays on C.
- Shell figures corrected to on-disk sizes mid-phase; the 0.04 kB isolation delta is unchanged.
- Risk: only 5 of 22 games have headed cold-tap numbers (widest union in-sample); the rest ride identical queue mechanics but are unmeasured.

## Follow-ups

- none (17-game sweep recorded as Debt in `review.md`, no issue per user re-scope decision)

## Rollback

```bash
# Merge commit
git revert --no-edit -m 1 <merge-commit>

# Squash commit
git revert --no-edit <squash-commit>
```

No migrations, flags, or data changes — pure client-side idle pacing plus docs.
