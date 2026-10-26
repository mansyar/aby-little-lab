# Review: Hub Cold-Tap Art Preload — Warm the Game Art While Children Idle

- **Track:** `20261027-cold-tap-art-preload`
- **Type:** `feature`
- **Branch:** `feat/20261027-cold-tap-art-preload`
- **Range:** `360bf145..9ae33c53`
- **Date:** `2026-10-27`
- **Verdict:** `PASS WITH FINDINGS`

## Summary

The art-queue prewarm is correctly engineered and honestly evidenced: 22 games' art keys stream one-per-idle-tick in recency-first order behind the same gates as the JS chunk pass, a warmed game queues zero keys and shows no cue, and the headed before/after comparison shows the queue driving post-tap raster blockage to ~zero at 6 s settle with the worst sampled fully-cold tap at 332.6 ms (inside budget). Review round 1 found one Medium (AC-6 claimed all 22 games, rig samples 5) and one Low (stale perf-baseline live header); both were fixed docs-only in Phase R1 under user-approved re-scope. No Critical/High findings; no new dependencies; full gate green.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| lint | `pnpm check` | pass | exit 0, 260 files |
| typecheck | `pnpm typecheck` | pass | exit 0 |
| test | `pnpm test -- --run` | pass | 126 files / 2781 tests |
| coverage | `pnpm test:coverage` | pass | 97.75 / 91.76 / 96.88 / 98.70 vs gates 95 / 88 / 85 / 90 |
| build | `pnpm build` | pass | precache 59 entries; shell `index-DCKgoc2n.js` 148.9 kB ≤ 200 kB |
| bundle | `node scripts/validate-bundle.js` | pass | shell entry PASS |
| pwa | `node scripts/validate-pwa.js` | pass | 16/16 |
| docs | `node scripts/validate-docs.js` | pass | 6/6 (incl. R1 delta) |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1.T1, P1.T2 | `src/__tests__/game/hub/prewarm.test.ts` (recency order, one-per-tick, tap-cancel) | covered |
| FR-2 | P2.T1 | `src/__tests__/scenes/hubScene.test.ts` (lock/hidden/resume) | covered |
| FR-3 | P1.T2, P2.T1.2, P2.T2 | seeded swallow/skip tests + zero-queue + no-cue tests | covered |
| FR-4 | P3.T1 | `docs/perf-baseline.md` art verdict (16 headed runs, C/D medians, raw JSON in `.conductor/evidence/tap-runs/`) | covered (as re-scoped) |
| FR-5 | P2.T1.2, P3.T2 | shutdown-cancel test + TDD §4.8 + tech-stack Design Update | covered |
| NFR-1 | P2.T1 | no-cue assertion; `GameSceneBase` unchanged; gate | covered |
| NFR-2 | P3.T1 | validate-bundle 148.9 kB, validate-pwa 16/16, validate-docs 6/6; boot < 3 s carried by prior figures + untouched Boot path | covered |
| NFR-3 | P1, P2, P3 | `pnpm check` + `typecheck` clean; TSDoc contracts | covered |
| NFR-4 | — | `package.json` unchanged (still `phaser` only) | covered |
| AC-1 | P1.T3 | seeded fake-scheduler engine tests | covered |
| AC-2 | P1.T3, P2.T1 | tap-cancel test; `openGame` cancels before `loadSceneWithRetry` | covered |
| AC-3 | P2.T2 | lock/hidden suppression + resume tests | covered |
| AC-4 | P1.T3 | failure-swallow test (pass-local set, next-pass retry) | covered |
| AC-5 | P2.T2 | warmed-game zero-queue + no-cue tests | covered |
| AC-6 | P3.T1 | worst sampled fully-cold median 332.6 ms (Find the Word) ≤ 400 ms | covered (as re-scoped in R1) |
| AC-7 | P3.T2 | full gate green + TDD §4.8 + tech-stack entry | covered |

## Findings

### Critical

- <none>

### High

- <none>

### Medium

- **F1 — AC-6 verdict scope exceeded the measured sample**
  - **File:** `docs/perf-baseline.md:696-708` (verdict) + `spec.md` AC-6 row
  - **What:** AC-6 claimed worst-case ≤ 400 ms "across all 22 games" while the verdict measured the rig's 5 sampled games.
  - **Why:** The 17 unmeasured games' art unions were unproven; the victory claim exceeded the sample (mitigated: widest 83-key union in-sample, slowest tile in every prior run).
  - **Fix:** Re-scoped AC-6 and the verdict line to the 5-game sample incl. the widest union; 17-game gap noted explicitly (user-approved, R1.T1).
  - **Requirement:** AC-6 (FR-4)
  - **Test gap:** Headed 22-game cold-tap run — recorded as Debt, not claimed.
  - **Status:** fixed in R1 (`9ae33c53`).

### Low

- **F2 — Stale perf-baseline live header**
  - **File:** `docs/perf-baseline.md:3`
  - **What:** Header pinned the chunk-prewarm build as live (144.23 kB shell, `index-DJ5iAYOR.js`) after this track grew the shell to 148.86 kB.
  - **Why:** Readers take the header as current truth; it understated the shell by ~4.6 kB.
  - **Fix:** Header re-pointed at the art-verdict section with art-build figures (R1.T2).
  - **Requirement:** none (docs accuracy)
  - **Test gap:** none
  - **Status:** fixed in R1 (`9ae33c53`).

## Overrides

- <none>

## Plan compliance

All 3 phases + Phase R1 verified with Result/Checkpoint/Evidence; every task checkbox [x] with evidence in `verification/phase-{1,2,3}.md` (R1 verified via `validate-docs` 6/6 on a docs-only delta; full gate green on identical code/tests). Touches respected; deviations (musicalMemory one-line equivalent fix, phaserMock `load.start` mock line, validator-mandated count refreshes, rig stage-D extension, on-disk size correction, R1 re-scope) all reported in evidence and minimal. No dropped tasks.

## Out of scope

- <none>

## Debt

- Full 22-game headed cold-tap sweep (F1 residual): user chose the 5-game sampling re-scope over extending the rig; the same queue mechanics cover all 22 games but only 5 have headed numbers. No issue created — the measurement path was explicitly declined in favor of the re-scope, and this entry is the record. Revisit if a future track touches per-game art unions.

## Doc sync

`updated` — product changelog entry added pre-review; R1 touched `spec.md` (AC-6), `docs/perf-baseline.md` (verdict scope + live header), and `conductor/product.md` (changelog sample wording). `validate-docs` 6/6 after.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | PASS WITH FINDINGS | 0 | 0 | 1 | 1 | 2 |
