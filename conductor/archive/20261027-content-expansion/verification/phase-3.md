# Phase 3 Evidence — Feelings scenarios expansion

- Track: 20261027-content-expansion — Content Expansion — Words, Stories, Scenarios
- Phase: 3 — Feelings scenarios expansion
- Date: 2026-10-27
- Branch: feat/20261027-content-expansion
- Base commit: d8cfb8b823a62706dc4cb81aaa9b6b042cd627bc
- Head commit: (pre-squash task head; squashed at acceptance — see Primary verification)
- Result: verified

## Summary

Added 8 new scenarios (exactly 2 per emotion, 24 → 32 pool) in
`src/game/feelingsFacesLogic.ts`, grouped with their emotion block. Updated
`src/__tests__/game/feelingsFacesLogic.test.ts` counts and the shipped-pool
derivation (shipped 16 + prior extension 8 + this extension 8 = 32, shipped-16
pin intact). No ladder, adaptive, draw, or art changes. P3.T2 satisfied by
reuse: `FeelingsFacesScene` maps every emotion to the 4 shared face cards via
`` `face_${emotion}` `` (`src/scenes/FeelingsFacesScene.ts:59`, art group
`faces` from `src/game/art/faces.ts` preloaded at line 96); the scene has no
slot for per-scenario or variant art, so no `faces.ts`/SVG change was made.

New scenarios (all ≤60 chars, uppercase-first, period-terminated, no
UNSAFE_WORDS tokens, unique ids/texts):

| id | emotion | text (chars) |
| --- | --- | --- |
| happy-cookies | happy | Aby shares cookies with friends at snack time. (46) |
| happy-ducks | happy | Aby sings a sweet song for the baby ducks. (42) |
| sad-kite | sad | Aby's kite gets stuck in the tall tree. (39) |
| sad-story | sad | Aby misses the morning story circle. (36) |
| angry-cup | angry | Aby wants the blue cup but gets the green one. (46) |
| angry-slide | angry | Aby waits while others finish the slide. (40) |
| scared-owl | scared | Owls hoot softly outside the tent at night. (43) |
| scared-wind | scared | Aby hears the wind tap the window. (30) |

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| unit | `pnpm test -- --run src/__tests__/game/feelings` | 0 | 1 file, 42 tests passed (32-entry pool, guards, re-derived goldens) |
| unit (scene/flow/svg guard) | `pnpm test -- --run src/__tests__/scenes/feelingsFacesScene.test.ts src/__tests__/scenes/feelingsFacesFlow.test.ts src/__tests__/assets/feelingsFacesSvg.test.ts` | 0 | 3 files, 40 tests passed — no pool-count pins outside logic tests |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| lint | `pnpm check` | 0 | biome clean, 260 files, no fixes |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-3 | Feelings pool count increases on the contrast ladder; rounds build correctly | `SCENARIO_POOL` 24→32, 8 per emotion; per-emotion count + uniqueness + derivation tests updated; `drawScenarios`/`buildRoundChoices`/`contrastSplitFor`/`ROUND_CONTRASTS` untouched; seeded goldens re-derived | pass |
| FR-3 | Scenario pool grows by a moderate batch on the contrastive→confusable ladder | 8 gentle everyday resolvable SPOKEN lines, 2 per emotion; ladder code unchanged so band placement is preserved | pass |
| FR-4 | Every new visual ships Storybook Flat SVG art with tiered raster | Satisfied by reuse: scenarios render only the 4 shared `face_*` cards (scene line 59 maps `` `face_${emotion}` ``); existing faces already comply with SVG_STYLE (pinned by `feelingsFacesSvg.test.ts`); no new visual needed, none added | done |
| NFR-1 | All new art complies with SVG_STYLE | No new art; shared faces unchanged | done |
| NFR-4 | Accessibility unchanged | No scene/logic behavior change; spoken-line shape (short, uppercase-first, period) preserved | done |

## Evidence paths

- `src/game/feelingsFacesLogic.ts` (pool + doc comment)
- `src/__tests__/game/feelingsFacesLogic.test.ts` (counts + derivation)
- Scene call-site check: `src/scenes/FeelingsFacesScene.ts` lines 57–59, 96, 106–107, 151 (read-only)

## Deviations

None — stayed within `Touches` (`src/game/feelingsFacesLogic.ts`,
`src/__tests__/game/feelings*`). `src/game/art/faces.ts` and SVGs untouched
(read-only per brief). No files outside `Touches` modified.

## Notes

- STALE PIN RESOLVED (primary re-derived from real runs): the three seeded goldens in the AC-3 test were regenerated against the 32-entry pool — seed-1 → happy-sticker/sad-home/angry-line/scared-wind/sad-ice-cream/scared-owl; seed-77 → scared-swing/angry-line/happy-ducks/happy-sticker/sad-story/angry-tower; seed-2026 → happy-cookies/happy-plant/scared-vacuum/sad-home/angry-slide/sad-kite. New outputs satisfy no-repeat + all-emotions coverage (asserted by neighboring tests). Seeds failed one at a time via abort-before-reach; all three fixed sequentially.
- No other pool-count pins found: `feelingsFacesScene.test.ts` and
  `feelingsFacesFlow.test.ts` mock `drawScenarios` and assert round counts (6),
  not pool size; `feelingsFacesSvg.test.ts` pins the 4 shared faces only.
- Style: double quotes, semicolons, named exports, no `any`, `===` — matches
  surrounding code; 2-space indent.
- Commits: made by the primary (no shell in subagent session) — squashed at acceptance (see Primary verification).

## Primary verification

- Working tree at verify time: only the phase files (logic + tests) uncommitted; spec count fix committed earlier in `1b4f4815`.
- Commands (all exit 0): `pnpm test -- --run src/__tests__/game/feelings` (42/42), scene/flow/svg guard suites (40/40), `pnpm typecheck` (clean), `pnpm check` (biome, 260 files, clean).
- Squash guard: range `d8cfb8b8..HEAD` holds exactly the reported task commits plus the subagent's uncommitted work transcribed by the primary — no merges, no user commits — squashed to one phase commit.
- Golden transcriptions by the primary use only received values from real runs (seeds 1, 77, 2026 fixed sequentially after abort-before-reach exposed each in turn).
- Result: verified.
