# Implementation Plan — First Words Word Pool Expansion

> Track id: `word-pool-expansion_20260803` · Workflow: `conductor/workflow.md` (TDD, phase checkpoints, git notes, quality gates)

## Phase 1 — Pool Data & Pure Logic (TDD) [checkpoint: 1849a4c]

- [x] Task: Write failing tests for the expanded word pool (24e92a3)
  - [x] In `src/__tests__/game/wordLogic.test.ts` (or a new focused describe block), assert `WORD_POOL` has exactly 18 entries
  - [x] Assert tier counts: 8× 3-letter, 10× 4-letter; all words unique
  - [x] Assert every `promptTexture` is a known PreloadScene texture key (list: `animal_cat`, `animal_dog`, `animal_pig`, `sm_car`, `mascot_idle`, `sm_sun`, `sm_hat`, `sm_bug`, `frog_red`, `sm_ball`, `food_fish`, `sm_boat`, `sm_tree`, `food_bone`, `shape_star`, `toy_drum`, `toy_teddy_bear`, `sm_duck`)
  - [x] Run the targeted tests and confirm the new assertions fail (Red phase) — `CI=true pnpm test -- wordLogic`
- [x] Task: Expand `WORD_POOL` in `src/game/wordLogic.ts` (585909e)
  - [x] Add the 9 new entries per the approved pool (OWL→`mascot_idle`, SUN/HAT/BUG→`sm_sun`/`sm_hat`/`sm_bug`, BONE→`food_bone`, STAR→`shape_star`, DRUM→`toy_drum`, BEAR→`toy_teddy_bear`, DUCK→`sm_duck`)
  - [x] Run the targeted tests and confirm green (Green phase)
- [x] Task: Verify round/builder generation across the full pool (585909e)
  - [x] Add/extend tests: `generateWordPlaythrough(6)` returns 6 unique targets; no round shares a first letter among the 4 choices; target included exactly once
  - [x] Add/extend tests: builder playthroughs (3 words) are easy-first, unique, and draw from the expanded pool
  - [x] Run the full game-logic test files green
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) (1849a4c)

## Phase 2 — SVG Assets & Preload Registration [checkpoint: cc5587e]

- [x] Task: Author 4 new picture SVGs (b045de0)
  - [x] Create `src/assets/svg/items/sun.svg`, `hat.svg`, `bug.svg`, `duck.svg` (512×512 viewBox, flat fills, thick `#2D3748` strokes 4–6px, soft/vibrant, tight bounding box — per PRD design rules)
  - [x] Visually spot-check each SVG renders cleanly (dev server or image view)
- [x] Task: Register new textures in PreloadScene (d2e05c4)
  - [x] Add `?raw` imports for the 4 new SVGs in `src/scenes/PreloadScene.ts`
  - [x] Add `SHAPE_ASSETS` entries: `sm_sun`, `sm_hat`, `sm_bug`, `sm_duck`
  - [x] Update any preload texture-key assertions in tests (e.g., navigation/preload key lists) to include the 4 new keys
  - [x] Run the affected test files green
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) (cc5587e)

## Phase 3 — Scene Integration Verification [checkpoint: ea06941]

- [x] Task: Fix input lock persisting across scene re-launch (bug found in manual verification) (09a60b0)
- [x] Task: Fix input lock in Alphabet/Pattern Builder scenes; verify Musical Memory recovers (c0b53ea)
  - [x] Regression test in `src/__tests__/scenes/wordMatchScene.test.ts`: complete 6 rounds (input locked), call `create()` again on the same instance, assert `inputLocked` resets to `false` and a card tap registers a correct answer
  - [x] Regression test in `src/__tests__/scenes/wordBuilderScene.test.ts`: same re-launch pattern after completing all 3 words
  - [x] Fix: reset `inputLocked = false` in `create()` of `WordMatchScene.ts` and `WordBuilderScene.ts`
  - [x] Run the affected test files green
- [x] Task: Extend first-words integration coverage for new words (16a6551)
  - [x] In `src/__tests__/scenes/firstWordsIntegration.test.ts`, add a playthrough case covering at least one reused-texture word (e.g., OWL/BONE) and one new-SVG word (e.g., SUN/DUCK) — prompt picture renders from the right texture key, rounds/answers behave as existing cases
  - [x] Confirm no scene-rule code changes were needed (data-driven scenes)
  - [x] Run `CI=true pnpm test` full suite green
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) (ea06941)

## Phase 4 — Documentation & Quality Gates [checkpoint: 32c98a0]

- [x] Task: Update documentation (12fdf8b)
  - [x] `docs/PRD.md` — Game 9/10 sections: pool size 9 → 18, new words, new asset list
  - [x] `conductor/tech-stack.md` — dated design-update note (pool, new `sm_` textures)
  - [x] README — game rows if they enumerate the word pool
  - [x] `docs/device-testing-checklist.md` — new-word spot checks (e.g., SUN/DUCK rounds render and play)
- [x] Task: Run full quality gates (671f77f)
  - [x] `pnpm run check`
  - [x] `CI=true pnpm test` (coverage ≥ 80%)
  - [x] `pnpm run build`
  - [x] `node scripts/validate-pwa.js`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) (32c98a0)

## Completion

- [ ] Task: Final review against spec acceptance criteria (1–8) and Definition of Done in workflow.md
- [ ] Task: Mark track complete, archive to `conductor/archive/word-pool-expansion_20260803/`, update `conductor/tracks.md`
