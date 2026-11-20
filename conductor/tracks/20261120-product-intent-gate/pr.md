## Summary

This track closes the Phase 3 product-intent gate. It records the four product
decisions with rationale and consequences, adds the public-release legal
artifacts (MIT license, audio attribution, third-party notices, child privacy
and store privacy labels), replaces the untraceable BGM with a verified CC0
loop, and publishes the documented accessibility stance in the README while
marking the roadmap outcome. Phase 5 reach is cancelled; Phase 4 depth and
Phase 6 sustainability are the path forward.

## Track

- **ID:** `20261120-product-intent-gate`
- **Type:** chore (high)
- **Spec:** [`conductor/archive/20261120-product-intent-gate/spec.md`](conductor/archive/20261120-product-intent-gate/spec.md)
- **Plan:** [`conductor/archive/20261120-product-intent-gate/plan.md`](conductor/archive/20261120-product-intent-gate/plan.md)
- **Review:** [`conductor/archive/20261120-product-intent-gate/review.md`](conductor/archive/20261120-product-intent-gate/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Record the four decisions | Create the durable decision record | verified | `2a171939` | `docs/product-intent.md`; four decisions dated 2026-11-20 |
| 2: Close the legal gaps | Add the public-release legal artifacts | verified | `2fcb8f5e` | MIT `LICENSE` plus four prepared-not-submitted docs |
| 3: Resolve BGM rights | Replace the untraceable loop with a verifiable CC0 one | verified | `9fc3e1a5` | "Calm Loop" by wipics (CC0 1.0 Universal), same path; PWA precache intact |
| 4: Publish and sync docs | Publish the stance and record the roadmap outcome | verified | `0cc94d18` | README accessibility/license, roadmap §10.4/§10.6/§10.8, Baloo 2 OFL text |
| R1: Review Fixes | Resolve the four review findings | verified | `d131e55d` | F1–F4 stale rights wording corrected; four decisions unchanged |

## Requirements

- [x] `FR-1` — Four decisions recorded with value, date, rationale and consequence (`docs/product-intent.md`)
- [x] `FR-2` — Family-only recorded; Phase 5 cancelled; Phase 4 is next (`docs/product-intent.md`, `conductor/product.md`)
- [x] `FR-3` — Touch-only/sighted/textless/landscape stance published in the README (`README.md`)
- [x] `FR-4` — English permanently; i18n and a second locale are not goals (`docs/product-intent.md`)
- [x] `FR-5` — Full public-release posture with five artifacts prepared, not submitted (`docs/product-intent.md`)
- [x] `FR-6` — Five legal artifacts exist (`LICENSE`, `docs/audio-attribution.md`, `docs/third-party-notices.md`, `docs/child-privacy.md`, `docs/store-privacy-labels.md`)
- [x] `FR-7` — BGM rights resolved by replacement with a CC0 loop; investigation and no-claim on the old file recorded (`docs/audio-attribution.md`)
- [x] `FR-8` — Roadmap records Phase 3 done, README links the decision record, and docs validation passes (`conductor/product.md`, `README.md`)
- [x] `NFR-1` — Only BGM asset/wiring and documentation changes; no runtime feature work
- [x] `NFR-2` — Every decision is dated and rationalized
- [x] `NFR-3` — All governed docs pass `node scripts/validate-docs.js`
- [x] `AC-1` — Decision record complete (`docs/product-intent.md`)
- [x] `AC-2` — Family-only consequence recorded (`conductor/product.md`)
- [x] `AC-3` — Accessibility stance visible to a user (`README.md`)
- [x] `AC-4` — English-only decision recorded (`docs/product-intent.md`)
- [x] `AC-5` — Legal posture is prepared-not-submitted across all five artifacts
- [x] `AC-6` — Five legal artifacts present with no claim of submission
- [x] `AC-7` — BGM shipped rights are verifiable CC0; PWA precache intact
- [x] `AC-8` — Roadmap and README synced; docs validator green

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| static | `pnpm check` | pass | Biome clean, 337 files |
| static | `pnpm typecheck` | pass | src and e2e `tsc --noEmit` clean |
| unit | `pnpm test -- --run` | pass | 153 files, 3,323 tests |
| coverage | `pnpm test:coverage` | pass | 97.12 / 90.94 / 96.21 / 98.31 % (gates 95 / 88 / 85 / 90) |
| build | `pnpm build` | pass | 411 modules; shell entry 191.16 kB; Phaser vendor 1,367.08 kB (pre-existing advisory) |
| build artifact | `node scripts/validate-bundle.js` | pass | shell entry 186.7 kB ≤ 200 kB |
| build artifact | `node scripts/validate-pwa.js` | pass | 16/16, BGM present and precached |
| docs | `node scripts/validate-docs.js` | pass | 5/5 checks |
| aggregate | full `verify_phase` chain | pass | exit 0; `conductor/archive/20261120-product-intent-gate/verification/integrated.md` |

## Review

- **Verdict:** `PASS`
- **Rounds:** 2
- **Fixed:** 4 findings (F1–F4, Phase R1)
- **Accepted/deferred:** none (see `review.md`)

## Deviations and risks

- The upstream Baloo 2 SIL OFL 1.1 text is shipped at `public/fonts/OFL.txt`
  (4,384 bytes) to clear the missing-license notice for the bundled font.
- The BGM was replaced in place at `public/audio/bgm.mp3`, so no wiring, config
  or precache test changes were needed. The old loop's origin remains
  untraceable but it is no longer shipped and no right is claimed for it.
- `docs/product-intent.md` Overview note was refreshed in Phase 4 and its three
  stale rights statements in Phase R1; the four decisions were never changed.
- All five legal artifacts are prepared, not submitted. No store listing, TWA,
  or store assets were created; Phase 5 reach is cancelled.

## Follow-ups

- none

## Rollback

```bash
# Merge commit
git revert --no-edit -m 1 <merge-commit>

# Squash commit
git revert --no-edit <squash-commit>
```

No migration, feature flag, or data change is involved. Rollback would restore
the previous untraceable BGM and remove the documentation artifacts, so it is
not recommended without a replacement rights resolution.
