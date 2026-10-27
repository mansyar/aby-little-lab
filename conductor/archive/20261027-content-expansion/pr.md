## Summary

Content expansion for three game pools so repeat play stays fresh: WORD_POOL
18→28 (Find the Word, Build the Word and Decode It share the one pool),
STORY_POOL 11→15 with 12 new Storybook Flat panels, SCENARIO_POOL 24→32
(Feelings Faces). Adaptive ±1 band, round counts, narration and art style are
unchanged — at the classic band every game plays exactly as before. No
storage migration, no engine changes.

## Track

- **ID:** `20261027-content-expansion`
- **Type:** `feature`
- **Spec:** [`conductor/archive/20261027-content-expansion/spec.md`](conductor/archive/20261027-content-expansion/spec.md)
- **Plan:** [`conductor/archive/20261027-content-expansion/plan.md`](conductor/archive/20261027-content-expansion/plan.md)
- **Review:** [`conductor/archive/20261027-content-expansion/review.md`](conductor/archive/20261027-content-expansion/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Words pool expansion | Expand WORD_POOL with phonics-safe band-fitted words | verified | `157d868a` | 10 words reuse existing art keys; DECODE_POOL collapsed to `[...WORD_POOL]` (FR-6 dedupe) |
| 2: Stories pool expansion | Expand STORY_POOL with ladder-contiguous stories + panel art | verified | `7f3d6c43` | 4 new stories, 12 bespoke SVGs in stories lazy chunk, seeded goldens re-derived |
| 3: Feelings scenarios expansion | Expand SCENARIO_POOL with gentle TTS-safe scenarios | verified | `b37de9f1` | 8 scenarios (2/emotion), no new art (4 shared faces reused) |
| 4: Banding, full gate, docs sync | Re-verify banding, sync counts, run full gate | verified | `af095219` | `STORY_PANEL_KEYS` extended to 45 (prewarm parity for new panels); docs synced |

## Requirements

- [x] `FR-1` — 10 new phonics-safe, TTS-safe words in easy-first tiers (test: `src/__tests__/game/wordLogic.test.ts`)
- [x] `FR-2` — 4 new stories ladder-contiguous with bespoke panels (test: `src/__tests__/game/storyOrderLogic.test.ts`)
- [x] `FR-3` — 8 new gentle, everyday, TTS-safe scenarios (test: `src/__tests__/game/feelingsFacesLogic.test.ts`)
- [x] `FR-4` — Tiered-raster Storybook Flat art for new panels (test: `src/__tests__/game/storyOrderArt.test.ts`)
- [x] `FR-5` — Adaptive ±1 band preserved (test: `src/__tests__/game/adaptive*` + full suite)
- [x] `FR-6` — No duplicates; placeholder fallback for missing art
- [x] `NFR-1` — SVG_STYLE compliance for the 12 new SVGs
- [x] `NFR-2` — TTS-safe spoken copy (≤60ch scenarios, phonics-safe words)
- [x] `NFR-3` — Bundle/PWA unregressed (shell 149.1 kB ≤ 200 kB, PWA 16/16)
- [x] `NFR-4` — Narration + a11y unchanged
- [x] `NFR-5` — No storage migration
- [x] `AC-1` — Word-pool target counts (28; 13 three-letter + 15 four-letter)
- [x] `AC-2` — Story-pool target counts (15 stories; 45 panels)
- [x] `AC-3` — Scenario-pool target counts (32; 8 per emotion)
- [x] `AC-4/5/6` — Docs synced, banding preserved, full gate green + `validate-docs` 6/6

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| unit | `pnpm test -- --run` | pass | `conductor/archive/20261027-content-expansion/verification/integrated.md` (126 files / 2783 tests) |
| coverage | `pnpm test:coverage` | pass | 97.73 / 91.71 / 96.88 / 98.70 vs 95/88/85/90 gates |
| lint | `pnpm check` | pass | biome, 260 files clean |
| typecheck | `pnpm typecheck` | pass | clean |
| build | `pnpm build` + `validate-bundle.js` + `validate-pwa.js` + `validate-docs.js` | pass | shell 149.1 kB; PWA 16/16; docs 6/6 |

## Review

- **Verdict:** `PASS`
- **Rounds:** 1
- **Fixed:** 0 findings
- **Accepted/deferred:** 0 (see `review.md`)

## Deviations and risks

- `src/__tests__/game/storyOrderLogic.test.ts` title-only fix (outside the
  adaptive Touches glob; smallest change for a stale "33" pin, assertions
  untouched) — no behavioral risk.
- `src/game/hub/prewarm.ts` `STORY_PANEL_KEYS` 33→45 (outside Touches; found
  via the full gate — without it the 4 new stories would cold-tap without
  prewarmed art; re-verified 35/35).
- `src/game/decodeLogic.ts:58` stale "22 pool" comment → "28" (Phase 1 owns
  this file).
- Content-count pins synced in PRD/TDD/README/perf-baseline/product
  (219→231 corpus, 2,781→2,783 suite) per `validate-docs.js`.
- Risks: none known. New stories/words/scenarios ride existing mechanics;
  adaptive bands and round shapes are byte-for-byte the old behavior.

## Follow-ups

- none

## Rollback

```bash
# Merge commit
git revert --no-edit -m 1 <merge-commit>

# Squash commit
git revert --no-edit <squash-commit>
```

Content-only track: reverting removes the new words/stories/scenarios and
their docs; no save migration to unwind (NFR-5 held, no schema changes).

