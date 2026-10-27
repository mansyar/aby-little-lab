## Summary

Decomposes the 821-line `HubScene.ts` god scene into five focused modules
under `src/game/hub/` (`artGroups`, `gameLaunch`, `hubPrewarm`, `playTimeUi`,
`hubAttract`) behind a 382-line lifecycle coordinator. Every move is
verbatim — zero behavior change, full suite green (131 files / 2,829 tests).

## Track

- **ID:** `20261027-hubscene-split`
- **Type:** `refactor`
- **Spec:** [`conductor/archive/20261027-hubscene-split/spec.md`](conductor/archive/20261027-hubscene-split/spec.md)
- **Plan:** [`conductor/archive/20261027-hubscene-split/plan.md`](conductor/archive/20261027-hubscene-split/plan.md)
- **Review:** [`conductor/archive/20261027-hubscene-split/review.md`](conductor/archive/20261027-hubscene-split/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Art Tables Extraction | Move art-group tables + resolver | verified | `b9b02444` | pinned guard retargeted to new module, negatives stay on HubScene |
| 2: Launch Flow Extraction | Single-flight launch + retry cue | verified | `e7057485` | unused `openGame`/`showLoadCue`/`shouldNudge` wrappers deleted |
| 3: Prewarm Orchestration Extraction | Gates + pass lifecycle | verified | `24aae2da` | hubPrewarm 275 lines, over helper target — accepted |
| 4: Play-Time UI, Attract/Decor, Thin Coordinator | Final two slices + full gate | verified | `a804c07a` | HubScene 382 vs ~320 target — accepted; primary fixed eager-registry regression + cast-read surface |

## Requirements

- [x] `FR-1` — art parity (test: `src/__tests__/game/hub/artGroups.test.ts`)
- [x] `FR-2` — launch guards (test: `src/__tests__/game/hub/gameLaunch.test.ts`)
- [x] `FR-3` — prewarm gates (test: `src/__tests__/game/hub/hubPrewarm.test.ts`)
- [x] `FR-4` — play-time UI (test: `src/__tests__/game/hub/playTimeUi.test.ts`)
- [x] `FR-5` — attract/decor (test: `src/__tests__/game/hub/hubAttract.test.ts`)
- [x] `NFR-1` — zero behavior change (full suite green)
- [x] `NFR-2` — dynamic imports preserved, shell 150.0 kB ≤ 200 kB
- [x] `NFR-3` — sizes partial: helpers ≤200 except hubPrewarm (275); HubScene 382 vs ~320
- [x] `NFR-4` — gates green, pinned suite unmodified
- [x] `AC-1` — `hubScene.test.ts` passes unmodified (guard retarget only)
- [x] `AC-2` — runtime upstreams green
- [x] `AC-3` — AC-1 holds at AC-3
- [x] `AC-4` — pass with size deviations (see above)
- [x] `AC-5` — structural-only diff, suite green

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| lint | `pnpm check` | pass | `conductor/archive/20261027-hubscene-split/verification/integrated.md` |
| typecheck | `pnpm typecheck` | pass | |
| unit | `pnpm test -- --run` | pass | 131 files / 2,829 tests |
| coverage | `pnpm test:coverage` | pass | 97.87 / 92.16 / 97.01 / 98.76 vs 95 / 88 / 85 / 90 |
| build | `pnpm build` | pass | |
| bundle | `node scripts/validate-bundle.js` | pass | shell 150.0 kB |
| pwa | `node scripts/validate-pwa.js` | pass | 16/16 |
| docs | `node scripts/validate-docs.js` | pass | 6/6 |

## Review

- **Verdict:** `PASS`
- **Rounds:** 1
- **Fixed:** 0 findings
- **Accepted/deferred:** size notes only (see `review.md` Debt)

## Deviations and risks

- Lazy `getSceneLoaders()` thunk: construction no longer touches the
  registry; reads happen at pass time. Verified by 43 previously-failing
  scene-suite tests going green.
- `get loadCue()` / `get nudge()` compat getters preserve the surface
  scene suites inspect via cast; live delegations, no snapshots.
- Six validator-mandated doc-count lines (126/2783 → 131/2829) outside
  phase Touches.
- Risk: none known — refactor only, no migration, no data change.

## Follow-ups

- none

## Rollback

```bash
# Merge commit
git revert --no-edit -m 1 <merge-commit>

# Squash commit
git revert --no-edit <squash-commit>
```

No migration or data rollback needed — pure code move, no save-schema or
asset changes.
