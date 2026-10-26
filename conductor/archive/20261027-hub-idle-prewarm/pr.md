## Summary

The Hub now warms the lazy game chunks while a child idles, so a first tap can find its game already imported. A warm first tap costs 27–65 ms against the 400 ms budget; cold taps are unchanged. Nothing a child sees, hears, or taps changes — games open the same way, just sooner.

## Track

- **ID:** `20261027-hub-idle-prewarm`
- **Type:** `feature`
- **Spec:** [`conductor/archive/20261027-hub-idle-prewarm/spec.md`](conductor/archive/20261027-hub-idle-prewarm/spec.md)
- **Plan:** [`conductor/archive/20261027-hub-idle-prewarm/plan.md`](conductor/archive/20261027-hub-idle-prewarm/plan.md)
- **Review:** [`conductor/archive/20261027-hub-idle-prewarm/review.md`](conductor/archive/20261027-hub-idle-prewarm/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Prewarm module with an injected scheduler | self-contained prewarm engine under `src/game/hub/`, proven by seeded unit tests | verified | `6a50ff5b` | no Hub wiring yet, by design |
| 2: Hub integration | HubScene starts the prewarm after entrance, gates on lock/visibility, yields to taps, cleans up on shutdown | verified | `0369f7b0` | `hubPlayTime`/`navigation` `sceneLoaders: {}` test doubles required by the engine contract (accepted deviation) |
| 3: First-tap verdict and docs truth | measured dated verdict + TDD/tech-stack record | verified | `34131419` | verdict closes the perf-baseline open question |

Post-review doc sync: `conductor/product.md` changelog entry (`971841e9`); review recorded as PASS round 1.

## Requirements

- [x] `FR-1` — idle-paced, one-at-a-time, recency-first prewarm of the 22 `sceneLoaders`; tap cancels and wins (test: `src/__tests__/game/hub/prewarm.test.ts`, `src/__tests__/scenes/hubScene.test.ts:994`)
- [x] `FR-2` — starts after entrance settles, skips play-time lock and hidden tabs, resumes on clear (test: `hubScene.test.ts:930,951,975`)
- [x] `FR-3` — idempotent and silent: skips imported, swallows failures, registration stays tap-driven (test: `prewarm.test.ts` swallow + retry tests)
- [x] `FR-4` — dated first-tap verdict, before/after medians, open question resolved (evidence: `docs/perf-baseline.md:432`, `.conductor/evidence/phase-3/`)
- [x] `FR-5` — shutdown cancels; TDD §4.7 + tech-stack Design Update recorded (test: `hubScene.test.ts:1012`)
- [x] `NFR-1` — zero kid-visible change (no visuals/sounds/UI in diff; suite green)
- [x] `NFR-2` — budgets hold: boot path gains no work, shell 140.9 kB ≤ 200 kB, 42/42 precache
- [x] `NFR-3` — house style: TSDoc, `pnpm check` / `pnpm typecheck` clean
- [x] `NFR-4` — no new runtime dependencies (`package.json`/lockfile untouched)
- [x] `AC-1` — recency order at idle pace, seeded fake scheduler
- [x] `AC-2` — cancel pending, tap path unaffected
- [x] `AC-3` — no imports while locked, resume on clear
- [x] `AC-4` — rejection swallowed, no unhandled rejection, game still loads
- [x] `AC-5` — dated verdict with before/after medians
- [x] `AC-6` — full gate green incl. count guard (126 files / 2,753 tests)

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| lint | `pnpm check` | pass | `conductor/archive/20261027-hub-idle-prewarm/verification/integrated.md` |
| format | `pnpm format` | pass | same |
| typecheck | `pnpm typecheck` | pass | same |
| unit | `pnpm test -- --run` | pass | 126 files / 2,753 tests |
| coverage | `pnpm test:coverage` | pass | 97.76 / 91.84 / 96.76 / 98.73, gates held |
| build | `pnpm build` | pass | precache 54 entries (1,722.35 KiB) |
| build-artifact | `node scripts/validate-bundle.js` | pass | shell 140.9 kB ≤ 200 kB |
| build-artifact | `node scripts/validate-pwa.js` | pass | 16/0, 42/42 precached |
| documents | `node scripts/validate-docs.js` | pass | 6/0, counts derive 126 / 2,753 |

## Review

- **Verdict:** `PASS`
- **Rounds:** 1
- **Fixed:** 0 findings
- **Accepted/deferred:** 0 (see `review.md`)

## Deviations and risks

- P2 test doubles: `hubPlayTime.ts` and `navigation.ts` gained `sceneLoaders: {}` doubles so the prewarm engine contract compiles in scene tests. Required, minimal, accepted during phase verification. No production behavior change.
- P3: tech-stack Design Update entry landed alongside the TDD record during the phase-3 verification run (see integrated.md deviation R-INT-01). Tracked and accepted; no behavior change.
- Honest scope limit: the verdict measures JS import + scene registration only; art-texture rasterization is deferred to a scene-less preload track, and cold taps remain over budget worst-case. Documented in `perf-baseline.md:414,421-422`.

## Follow-ups

- none

## Rollback

```bash
# Merge commit
git revert --no-edit -m 1 <merge-commit>

# Squash commit
git revert --no-edit <squash-commit>
```

No migrations, feature flags, or data changes. Reverting restores cold-tap behavior; the Hub, games, and saves are otherwise untouched.

