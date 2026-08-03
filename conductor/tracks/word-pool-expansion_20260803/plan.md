# Implementation Plan — First Words Word Pool Expansion

> Track id: `word-pool-expansion_20260803` · Workflow: `conductor/workflow.md` (TDD, phase checkpoints, git notes, quality gates)

## Phase 1 — Pool Data & Pure Logic (TDD)

- [ ] Task: Write failing tests for the expanded word pool
  - [ ] In `src/__tests__/game/wordLogic.test.ts` (or a new focused describe block), assert `WORD_POOL` has exactly 18 entries
  - [ ] Assert tier counts: 8× 3-letter, 10× 4-letter; all words unique
  - [ ] Assert every `promptTexture` is a known PreloadScene texture key (list: `animal_cat`, `animal_dog`, `animal_pig`, `sm_car`, `mascot_idle`, `sm_sun`, `sm_hat`, `sm_bug`, `frog_red`, `sm_ball`, `food_fish`, `sm_boat`, `sm_tree`, `food_bone`, `shape_star`, `toy_drum`, `toy_teddy_bear`, `sm_duck`)
  - [ ] Run the targeted tests and confirm the new assertions fail (Red phase) — `CI=true pnpm test -- wordLogic`
- [ ] Task: Expand `WORD_POOL` in `src/game/wordLogic.ts`
  - [ ] Add the 9 new entries per the approved pool (OWL→`mascot_idle`, SUN/HAT/BUG→`sm_sun`/`sm_hat`/`sm_bug`, BONE→`food_bone`, STAR→`shape_star`, DRUM→`toy_drum`, BEAR→`toy_teddy_bear`, DUCK→`sm_duck`)
  - [ ] Run the targeted tests and confirm green (Green phase)
- [ ] Task: Verify round/builder generation across the full pool
  - [ ] Add/extend tests: `generateWordPlaythrough(6)` returns 6 unique targets; no round shares a first letter among the 4 choices; target included exactly once
  - [ ] Add/extend tests: builder playthroughs (3 words) are easy-first, unique, and draw from the expanded pool
  - [ ] Run the full game-logic test files green
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — SVG Assets & Preload Registration

- [ ] Task: Author 4 new picture SVGs
  - [ ] Create `src/assets/svg/items/sun.svg`, `hat.svg`, `bug.svg`, `duck.svg` (512×512 viewBox, flat fills, thick `#2D3748` strokes 4–6px, soft/vibrant, tight bounding box — per PRD design rules)
  - [ ] Visually spot-check each SVG renders cleanly (dev server or image view)
- [ ] Task: Register new textures in PreloadScene
  - [ ] Add `?raw` imports for the 4 new SVGs in `src/scenes/PreloadScene.ts`
  - [ ] Add `SHAPE_ASSETS` entries: `sm_sun`, `sm_hat`, `sm_bug`, `sm_duck`
  - [ ] Update any preload texture-key assertions in tests (e.g., navigation/preload key lists) to include the 4 new keys
  - [ ] Run the affected test files green
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Scene Integration Verification

- [ ] Task: Extend first-words integration coverage for new words
  - [ ] In `src/__tests__/scenes/firstWordsIntegration.test.ts`, add a playthrough case covering at least one reused-texture word (e.g., OWL/BONE) and one new-SVG word (e.g., SUN/DUCK) — prompt picture renders from the right texture key, rounds/answers behave as existing cases
  - [ ] Confirm no scene-rule code changes were needed (data-driven scenes)
  - [ ] Run `CI=true pnpm test` full suite green
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Documentation & Quality Gates

- [ ] Task: Update documentation
  - [ ] `docs/PRD.md` — Game 9/10 sections: pool size 9 → 18, new words, new asset list
  - [ ] `conductor/tech-stack.md` — dated design-update note (pool, new `sm_` textures)
  - [ ] README — game rows if they enumerate the word pool
  - [ ] `docs/device-testing-checklist.md` — new-word spot checks (e.g., SUN/DUCK rounds render and play)
- [ ] Task: Run full quality gates
  - [ ] `pnpm run check`
  - [ ] `CI=true pnpm test` (coverage ≥ 80%)
  - [ ] `pnpm run build`
  - [ ] `node scripts/validate-pwa.js`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Completion

- [ ] Task: Final review against spec acceptance criteria (1–8) and Definition of Done in workflow.md
- [ ] Task: Mark track complete, archive to `conductor/archive/word-pool-expansion_20260803/`, update `conductor/tracks.md`
