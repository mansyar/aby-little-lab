## Summary

Aby's Little Lab now varies play across a visit without changing any game rule or asset. The Hub
suggests a game with a textless ring and idle-wiggles two tiles using a shared no-repeat selector
(unplayed → least-recently played → registry order), and spotlights one already-earned sticker per
visit with a per-profile cursor. All state is memory-only and resets when the child switches profile.

## Track

- **ID:** `20261124-replay-novelty`
- **Type:** feature
- **Spec:** [`conductor/archive/20261124-replay-novelty/spec.md`](conductor/archive/20261124-replay-novelty/spec.md)
- **Plan:** [`conductor/archive/20261124-replay-novelty/plan.md`](conductor/archive/20261124-replay-novelty/plan.md)
- **Review:** [`conductor/archive/20261124-replay-novelty/review.md`](conductor/archive/20261124-replay-novelty/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Visit policy and selector | Per-visit in-memory state and a no-repeat, deterministic suggestion selector | verified | `83818e64` | 1,200 seeded eight-play visits, median distinct ≥ 4; suite truth 155 files / 3,362 tests |
| 2: Hub suggestion and idle cue | Textless suggestion ring, selector-driven idle wiggle, profile-switch reset | verified | `ae37c190` | Ring drawn with existing Graphics helpers; no speech; modulo fallback retained |
| 3: Sticker shelf spotlight | Advance one earned-sticker spotlight per visit with wrap-around and empty-slot fallback | verified | `44be2e4a` | Reads profile sticker flags directly (avoids out-of-scope `hasSticker` call-count break); HubScene held at 400 lines |
| 4: Doc sync and full gate | README/PRD/TDD and product roadmap describe shipped behaviour | verified | `f8f1680a` | Living counts unchanged; full 10-command gate green |
| R1: Review fixes | Resolve round-1 findings F1/F2/F3 | verified | `e2a9bf26` | AC mapping restored; stale-ring refresh + page-flip test; spotlight docs reworded |

## Requirements

- [x] `FR-1` — One in-memory visit state per profile, reset on switch (test: `src/__tests__/game/replayVariety.test.ts`, `src/__tests__/scenes/hubScene.test.ts`)
- [x] `FR-2` — No immediate repeat of played or suggested games (test: `src/__tests__/game/replayVariety.test.ts`)
- [x] `FR-3` — Deterministic ordering: unplayed → least-recently played → registry order (test: `src/__tests__/game/replayVariety.test.ts`)
- [x] `FR-4` — Textless suggestion cue on a visible tile, tapped to launch normally (test: `src/__tests__/scenes/hubScene.test.ts`)
- [x] `FR-5` — Idle wiggle uses the same no-repeat selector (test: `src/__tests__/game/hub/hubAttract.test.ts`)
- [x] `FR-6` — One earned-sticker spotlight per visit, registry-order wrap-around, empty-slot fallback (test: `src/__tests__/game/hubGrid.test.ts`, `src/__tests__/scenes/hubScene.test.ts`)
- [x] `FR-7` — Profile switch clears and re-derives state; switching back starts empty (test: `src/__tests__/scenes/hubScene.test.ts`)
- [x] `FR-8` — Seeded simulation of ≥1,000 eight-play visits, median distinct ≥ 4 (test: `src/__tests__/game/replayVariety.test.ts`)
- [x] `FR-9` — All behaviour-bearing docs synced (test: `node scripts/validate-docs.js`)
- [x] `FR-10` — Full `verify_phase` green (test: `verification/integrated.md`)
- [x] `NFR-1` — No new runtime dependency or save schema; memory-only state
- [x] `NFR-2` — No new SVG/audio/TTS/save field/game rule; existing art reused
- [x] `NFR-3` — Reduced-motion respected; no new tween on the cue/spotlight
- [x] `NFR-4` — Conventional commits, no force-push
- [x] `AC-1` — Empty visit state on entry
- [x] `AC-2` — No immediate repeat unless the eligible pool is a single game
- [x] `AC-3` — Three-level deterministic ordering
- [x] `AC-4` — Cue points at the selected tile; tap launches; no speech
- [x] `AC-5` — Wiggle excludes last played/suggested; reduced motion has no tween
- [x] `AC-6` — One sticker spotlighted with cursor advance/wrap and empty-slot fallback
- [x] `AC-7` — Profile switch clears and re-derives; switch-back starts empty
- [x] `AC-8` — Seeded 1,200-visit simulation, median ≥ 4, zero unexpected repeats
- [x] `AC-9` — `node scripts/validate-docs.js` passes 5/5
- [x] `AC-10` — Full `verify_phase` chain green

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| unit | `pnpm test -- --run` | pass | 155 files / 3,362 tests |
| lint | `pnpm check` | pass | Biome clean, 367 files |
| typecheck | `pnpm typecheck` | pass | src + e2e clean |
| coverage | `pnpm test:coverage` | pass | 97.09 / 90.82 / 96.32 / 98.26 vs gates 95/88/85/90 |
| build | `pnpm build` | pass | 489 modules; shell 197.43 kB Vite / 192.8 kB validator (≤ 200 kB) |
| bundle | `node scripts/validate-bundle.js` | pass | shell ≤ 200 kB |
| module-size | `node scripts/validate-module-size.js` | pass | 169 files, zero warnings; HubScene.ts 399 lines |
| textures | `node scripts/validate-textures.js` | pass | 319 SVGs; typical 76.07 ≤ 80 MiB, full 319.00 ≤ 320 MiB, ratio 0.238 |
| pwa | `node scripts/validate-pwa.js` | pass | 16/16; 63 precache entries, 51/51 JS chunks |
| docs | `node scripts/validate-docs.js` | pass | 5 passed / 0 failed |

Full evidence: [`verification/integrated.md`](conductor/archive/20261124-replay-novelty/verification/integrated.md).

## Review

- **Verdict:** `PASS`
- **Rounds:** 2
- **Fixed:** 3 findings (F1 AC mapping, F2 stale-ring refresh, F3 spotlight docs) in Phase R1; 1 state-count drift corrected in final state.
- **Accepted/deferred:** 0 (see `review.md`)

## Deviations and risks

- Suggestion and spotlight are static textless graphics rings built from existing Graphics helpers; no new SVG, asset, TTS or text object was added. Risk: none — no new runtime payload beyond a few draw calls.
- Phase 3 reads `getActiveProfile().stickers[gameId].earned` directly rather than calling `hasSticker`; same state, chosen because 24 extra `hasSticker` lookups broke call-count assertions in an out-of-scope navigation test.
- The spotlight cursor advances rather than resets on a return visit; round-1 docs that claimed reset were corrected. This is the shipped policy from the approved spec.
- F2 fix clears the ring on a board change (page flip / group filter / viewport change) rather than redrawing it, because `onBoardChange` fires before the board rebuild; the next visit re-derives the cue.
- HubScene.ts was compressed to 399 lines to stay under the strict 400-line module budget.

## Follow-ups

- none

## Rollback

```bash
# Merge commit
git revert --no-edit -m 1 <merge-commit>

# Squash commit
git revert --no-edit <squash-commit>
```

No migration, feature flag, or saved-data change: all replay state is in memory and lost on reload, so
a revert only removes the new cue/spotlight behaviour; existing sticker profiles and progress are untouched.
