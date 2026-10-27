# Phase 2 — Stories pool expansion — Evidence

- Track: 20261027-content-expansion — Content Expansion — Words, Stories, Scenarios
- Phase: 2 — Stories pool expansion (FR-2, FR-4, NFR-1, NFR-2, AC-2)
- Date: 2026-10-27
- Branch: feat/20261027-content-expansion
- Base: 1423f28c49c5ee9d76be64266204959bfcbfae8d
- Head: 35dc3436 (pre-squash task head; squashed at acceptance — see Primary verification)
- Result: verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| unit | `pnpm test -- --run src/__tests__/game/story` | 0 | 2 files, 30 tests passed (15-story pool, tiers, rounds, goldens re-derived) |
| unit (deviation guard) | `pnpm test -- --run src/__tests__/scenes/storyOrderScene.test.ts src/__tests__/game/art/shellOwnership.test.ts` | 0 | 2 files, 37 tests passed — scene preload + shell-ownership pins at 45 panels |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| lint | `pnpm check` | 0 | biome clean, 260 files, no fixes |

No verification command could be executed in this session. No check was attempted twice; nothing is claimed as passing.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-2 | Story pool count increases; new stories ordered obvious→subtle with 3 panels each rendering | `src/game/storyOrderLogic.ts`: STORY_POOL 11→15 (added `snowman`, `tower` to the obvious block; `caterpillar`, `tadpole` appended to the subtle block; obvious 5→7, subtle 6→8; ladder-contiguity preserved). `src/game/storyOrderArt.ts`: 12 new bespoke panel entries in pool solution order (33→45). Count assertions updated in `storyOrderLogic.test.ts`, `storyOrderArt.test.ts`, `storyOrderScene.test.ts` (preload), `shellOwnership.test.ts`. **Exact-draw goldens re-derived from real runs against the 15-story pool (seed-77 classic mix, seed-1 order + [0]/[5] strips, seed-11 strips, seed-2026 order + [1] strip); suite green. | pass |
| FR-2 | Moderate batch of stories in obvious→subtle order, 3 panels each | Same pool edits as AC-2. New stories are cause→effect builds (snowman, block tower) for rounds 1–3 and metamorphoses (caterpillar→butterfly, frogspawn→frog) for rounds 4–6. Stable unique ids; `mixFor` unchanged and feasible (easy shift needs ≥5 obvious: 7 ✓; hard shift needs ≥5 subtle: 8 ✓). `buildRound`/`buildPlaythrough`/`mixFor`/`isCorrect` signatures untouched. | done (pending test gate) |
| FR-4 | Every new visual ships Storybook Flat SVG + tiered raster | 12 new bespoke SVGs under `src/assets/svg/stories/` (no key reuse across stories). Each follows the existing panel pattern: `viewBox 0 0 512 512`, `#2D3748` outlines (4–6px), palette fills, ground bar, no gradients/filters/bitmaps/text, ASCII-only, `story_*` keys (card tier via `textureSizeFor`, unchanged). Registered only through `preloadStoryOrderArt` (story scene's own preload; `PreloadScene` untouched). | done (pending test gate) |

## Evidence paths

- `src/game/storyOrderLogic.ts` (pool + header comments)
- `src/game/storyOrderArt.ts` (12 imports + 12 table entries, pool order)
- `src/assets/svg/stories/story_snow_pile.svg`, `story_snowman.svg`, `story_snowman_hat.svg`
- `src/assets/svg/stories/story_blocks_scattered.svg`, `story_tower_half.svg`, `story_tower_tall.svg`
- `src/assets/svg/stories/story_caterpillar.svg`, `story_cocoon.svg`, `story_butterfly.svg`
- `src/assets/svg/stories/story_frogspawn.svg`, `story_tadpole.svg`, `story_frog.svg`
- `src/__tests__/game/storyOrderLogic.test.ts` (counts updated; goldens pending)
- `src/__tests__/game/storyOrderArt.test.ts` (33→45)
- `src/__tests__/scenes/storyOrderScene.test.ts` (preload 33→45)
- `src/__tests__/game/art/shellOwnership.test.ts` (story panel count 33→45)
- `.conductor/evidence/`: none (no binaries/screenshots produced)

## Deviations

- `src/__tests__/scenes/storyOrderScene.test.ts` — outside the strict `Touches` glob (`src/__tests__/game/story*`) but explicitly anticipated by the brief ("update `storyOrderScene.test.ts` only if it asserts pool counts" — it does: preload count 33→45). Smallest possible change (one number + test title).
- `src/__tests__/game/art/shellOwnership.test.ts` — outside `Touches`; asserts `storyKeyToFile.size` 33 as a non-vacuity pin, which the pool growth necessarily invalidates. Smallest possible change (one number + title + the `33 + 12 = 45` comment derivation).
- 12 new `.svg` files under `src/assets/svg/stories/` — explicitly allowed by the brief (art owned by `storyOrderArt.ts`).

## Notes

1. **Goldens re-derived (done).** All five stale exact-draw assertions in `src/__tests__/game/storyOrderLogic.test.ts` were re-derived from real runs against the 15-story pool by the primary: seed-77 classic mix → tower/cake/snowman/foot/clothes/cup; seed-1 order → balloon/snowman/tower/caterpillar/banana/rain with balloon `[0]` strip and rain `[5]` strip; seed-11 full strips; seed-2026 order → snowman/cake/seed/foot/rain/caterpillar with cake `[1]` strip. Suite green (30/30) plus scene/shell guards (37/37).
   The stale-value list and run instructions from the blocked draft are superseded by the Commands table above.
2. **Commits made by the primary** (subagent session has no shell/git): `01425e5f feat(story)`, `35dc3436 test(story)` — squashed at acceptance (see Primary verification).
3. **TTS-safe (NFR-2):** no spoken copy touched — only pool data (ids/panel keys) and art; the scene still speaks only the unchanged rule sentence.
4. **No engine/adaptive changes (FR-5):** `buildPlaythrough(rng, shift)` keeps rng-first; `mixFor` and round structure (6 rounds, 3+3 classic) unchanged. `StoryOrderScene.preload` delegates to `preloadStoryOrderArt` — no scene change needed.
5. **Prewarm/hub tests** (`prewarm.test.ts`, `hubScene.test.ts`) derive from `STORY_PANEL_ASSETS` / assert the dynamic import — no changes needed.
6. Docs count sync (README/TDD/perf-baseline story counts, contact sheets, `validate-docs`) belongs to Phase 4 per the plan; intentionally untouched.

## Primary verification

- Working tree at verify time: only the phase files above uncommitted; spec.md clean (count fix committed in `646eeca1`).
- Commands (all exit 0): `pnpm test -- --run src/__tests__/game/story` (30/30), `pnpm test -- --run src/__tests__/scenes/storyOrderScene.test.ts src/__tests__/game/art/shellOwnership.test.ts` (37/37), `pnpm typecheck` (clean), `pnpm check` (biome, 260 files, clean).
- Squash guard: range `1423f28c..HEAD` holds exactly the 2 reported task commits (`01425e5f`, `35dc3436`) plus the subagent's uncommitted work transcribed by the primary — no merges, no user commits — squashed to one phase commit.
- Deviations accepted: `storyOrderScene.test.ts` + `shellOwnership.test.ts` (brief-anticipated count pins, smallest changes); 12 new SVGs (brief-allowed). Golden transcriptions by the primary use only received values from real runs.
- Result: verified.
