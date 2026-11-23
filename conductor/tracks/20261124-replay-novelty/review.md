# Review: Replay Novelty

- **Track:** `20261124-replay-novelty`
- **Type:** feature
- **Branch:** `feat/20261124-replay-novelty`
- **Range:** `57389e8f..cf82d9c5`
- **Date:** `2026-11-24T02:23:43+11:00`
- **Verdict:** `BLOCK`

## Summary

All four phases implement and test the frozen requirements with a green final gate. The read-only
reviewer found no Critical/High defects, but three findings (two Medium, one Low) must be resolved
in a fix round because `review.strict` is true: a renumbered AC row in the integrated evidence, a
suggestion ring that goes stale after an in-visit page flip or group filter, and behaviour-bearing
docs that overstate the spotlight. None is a design decision; all are concrete fixes.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| lint | `pnpm check` | pass | Biome clean, 367 files |
| typecheck | `pnpm typecheck` | pass | src + e2e clean |
| unit | `pnpm test -- --run` | pass | 155 files / 3,362 tests |
| coverage | `pnpm test:coverage` | pass | 97.09 / 90.82 / 96.31 / 98.26 vs gates 95/88/85/90 |
| build | `pnpm build` | pass | 489 modules; shell 197.38 kB Vite / 192.8 kB validator |
| bundle | `node scripts/validate-bundle.js` | pass | shell ≤ 200 kB |
| module-size | `node scripts/validate-module-size.js` | pass | 169 files, zero warnings |
| textures | `node scripts/validate-textures.js` | pass | 319 SVGs, ratio 0.238 |
| pwa | `node scripts/validate-pwa.js` | pass | 16/16 |
| docs | `node scripts/validate-docs.js` | pass | reviewer re-run 5/5 |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1.T1, P2 | replayVariety.test.ts, hubScene.test.ts | covered |
| FR-2 | P1.T2 | replayVariety.test.ts, 1,200-visit simulation | covered |
| FR-3 | P1.T2.1 | replayVariety.test.ts ordering suite | covered |
| FR-4 | P2.T1 | hubScene.test.ts (ring, no speech) | covered, see F2 for stale-after-navigation gap |
| FR-5 | P2.T2 | hubAttract.test.ts, hubEngagement.test.ts | covered |
| FR-6 | P3.T1, P3.T2 | hubGrid.test.ts, hubScene.test.ts | covered, see F3 |
| FR-7 | P2.T3, P3 | hubScene.test.ts profile-switch case | covered |
| FR-8 | P1.T3 | replayVariety.test.ts seeded simulation | covered |
| FR-9 | P4.T1 | validate-docs 5/5; README/PRD/TDD/product.md | partial, see F3 |
| FR-10 | P4.T2 | phase/integrated verification tables | covered |
| NFR-1 | P1, P2 | validate-module-size 169 files zero warnings | covered |
| NFR-2 | P3, P4 | diff scope, bundle/texture guards | covered |
| NFR-3 | P2.T2, P3.T2 | reduced-motion/no-new-tween tests | covered |
| NFR-4 | workflow | conventional commits, evidence files | covered |
| AC-1 | P1.T1 | replayVariety.test.ts | covered |
| AC-2 | P1.T2, P2.T2 | replayVariety.test.ts, hubEngagement.test.ts | covered |
| AC-3 | P1.T2.1 | replayVariety.test.ts ordering | covered |
| AC-4 | P2.T1 | hubScene.test.ts | covered, see F2 |
| AC-5 | P2.T2 | hubAttract.test.ts, hubScene.test.ts | covered |
| AC-6 | P3.T1, P3.T2 | hubGrid.test.ts, hubScene.test.ts | covered |
| AC-7 | P2.T3, P3 | hubScene.test.ts | covered |
| AC-8 | P1.T3 | replayVariety.test.ts simulation | covered |
| AC-9 | P4.T1 | validate-docs 5/5 | covered, see F3 |
| AC-10 | P4.T2 | phase/integrated green tables | covered |

## Findings

### Critical

- <none>

### High

- <none>

### Medium

- **F1 — Integrated evidence renumbers frozen AC-3 and AC-8**
  - **File:** `conductor/tracks/20261124-replay-novelty/verification/integrated.md:51,56`
  - **What:** AC-3 is labelled "≥4 median distinct games" (that is AC-8) and AC-8 is labelled "no new SVG/audio/TTS/save field/game rule" (NFR-2/FR-10 scope). The frozen `spec.md` fixes AC-3 = three-level ordering and AC-8 = seeded simulation; `plan.md` and `phase-1.md` map them correctly.
  - **Why:** The integration artifact contradicts the frozen spec, so a reader cannot trust the evidence mapping even though the requirements are genuinely proved elsewhere.
  - **Fix:** Swap the AC-3 and AC-8 rows to their frozen meanings (AC-3 ordering via replayVariety.test.ts; AC-8 seeded 1,200-visit simulation); move the "no new art/audio/save/rule" claim to the NFR-2 row.
  - **Requirement:** evidence integrity (AC mapping)
  - **Test gap:** none — documentation-only correction.

- **F2 — Suggestion ring goes stale after an in-visit page flip or group filter**
  - **File:** `src/game/hub/replayCue.ts:88-100`
  - **What:** `showCue()` draws the ring once at `beginVisit()` (HubScene.ts:245) and there is no further `replayCue` call until `destroy()`. `HubGrid.flipTo()` → `buildPageGrid()` and `setGroup()` → `buildFilteredGrid()` destroy the old tiles and draw different games at the same coordinates, but `onBoardChange` (HubScene.ts:145) only hides the load cue, so the ring keeps pointing at a tile that now launches a different game.
  - **Why:** FR-4 requires the cue to point at the selected tile; after navigation it silently points at the wrong game. No test covers navigation after the cue is drawn.
  - **Fix:** Add a lightweight `replayCue.refreshCue()` (or `clearCue()`) that re-runs `showCue` against current `getVisibleGames()` / clears the ring, and call it from the `onBoardChange` path in HubScene (and/or `HubGrid.flipTo`). Add a test that flips a page or switches a group and asserts the ring moves to or is removed from the correct tile.
  - **Requirement:** FR-4, AC-4
  - **Test gap:** navigation-after-cue test in `hubScene.test.ts` / `hubEngagement.test.ts`.

### Low

- **F3 — Docs overstate the sticker spotlight**
  - **File:** `README.md:156`, `docs/PRD.md:106`
  - **What:** README says "the suggestion, wiggle and spotlight avoid the games just played or suggested and reset when the child switches profile"; PRD §1.5 says of ring and highlight "neither repeats the game just played or just suggested". The spotlight is a per-profile registry-order cursor (`replayCue.ts:103-113`) with no played/suggested exclusion, and it advances (not resets) on a profile switch.
  - **Why:** Behaviour-bearing docs describe shipped behaviour inaccurately, so FR-9/AC-9 narrative is not fully synced.
  - **Fix:** Reword README.md:156 and PRD.md:106 so only the suggestion cue and idle wiggle are said to avoid just-played/just-suggested games; describe the spotlight as advancing one earned sticker per visit in registry order with wrap-around, re-derived per profile, with an empty-slot fallback.
  - **Requirement:** FR-9, AC-9
  - **Test gap:** none — prose-only correction.

## Overrides

- <none>

## Plan compliance

All four planned phases are verified with per-phase evidence and checkpoints; 9/9 tasks are `[x]`.
No task was marked complete without verification. Review round 1 adds Phase R1 for the three findings.

## Out of scope

- Pre-existing "23 games"/"23-tile board" prose staleness elsewhere in README/PRD is unrelated to this
  track and is not touched.
- Reworking the selector or visit-state design: F2 is a wiring/refresh fix, not a policy change.

## Debt

- <none> — all findings are fixed in Phase R1 under strict mode.

## Doc sync

`pending` — F1/F3 documentation corrections are applied in Phase R1; post-review sync after round 2.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | BLOCK | 0 | 0 | 2 | 1 | 0 |
