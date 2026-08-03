# Implementation Plan — Game 9 & 10: First Words (Find the Word + Build the Word)

**Track ID:** `first-words_20260803`
**Type:** Feature
**Status:** New

Follow `conductor/workflow.md` strictly: plan.md is the source of truth; TDD
for all logic; two commits per task (implementation commit + `conductor(plan)`
completion commit with the 7-char SHA and a `git notes` summary); phase
checkpoints commit `conductor(checkpoint): Checkpoint end of Phase N` and mark
the phase heading with `[checkpoint: <sha>]`.

Pre-commit gates: `pnpm run check`, `CI=true pnpm test`, `pnpm run build`.

---

## Phase 1: Foundations — word logic, speech, storage

### Task 1.1 — Word pool and shared types
- [x] TDD: write failing tests for `src/game/wordLogic.ts` — the 9-word pool
      (cat, dog, pig, car, frog, ball, fish, boat, tree) with word text,
      letter count, prompt texture key, and 3/4-letter tier classification
- [x] Implement the pool and types (uppercase words, `PromptTexture` keyed to
      existing PreloadScene textures)
- [x] Commit `feat(logic): Add First Words word pool` + `conductor(plan)` task
      commit; record SHA — `4209b1c`

### Task 1.2 — Find the Word round generation
- [x] TDD: failing tests for round generation — unique target words across a
      playthrough, 4 unique choices per round, **no two choices share a first
      letter**, choices always include the target
- [x] Implement `generateWordRound` / `generateWordPlaythrough(6)` and
      `isCorrectWord` helpers in `wordLogic.ts`
- [x] Commit `feat(logic): Add Find the Word round generation` + plan commit
      — `850ca9d`

### Task 1.3 — Build the Word generation
- [x] TDD: failing tests for builder generation — **easy-first ordering**
      (3-letter words before 4-letter words, random within tier, no repeats in
      a playthrough of 3), 6 letter tiles per word (word's unique letters +
      2–3 distractors not in the word, shuffled, always ≥ the needed letters)
- [x] Implement `generateWordBuildPlaythrough(3)` / `generateLetterTiles` in
      `wordLogic.ts`
- [x] Commit `feat(logic): Add Build the Word tile generation` + plan commit
      — `2b68a6f`

### Task 1.4 — Speech: speakWord
- [ ] TDD: failing tests for `speakWord` in `src/__tests__/utils/speech.test.ts`
      (rate 0.8, SFX-gated, silent fallback, cancels prior utterance — mirror
      existing `speakLetter` tests); refactor `speakLetter` onto a shared
      internal `speakText` so existing behavior is unchanged
- [ ] Implement in `src/utils/speech.ts`
- [ ] Commit `feat(utils): Add speakWord for First Words prompts` + plan commit

### Task 1.5 — Types and storage
- [ ] TDD: failing tests for `GameId` including `word-match`/`word-builder`,
      default storage entries, merge-on-load for pre-existing saves, and
      Reset Progress clearing the new stickers
- [ ] Update `src/types/index.ts` and `src/utils/storage.ts`
- [ ] Commit `feat(storage): Register word-match and word-builder stickers` +
      plan commit

### Phase 1 checkpoint
- [ ] Announce phase end; `git diff --name-only` vs previous checkpoint;
      ensure test files exist for all changed files
- [ ] Run automated tests; record `conductor(checkpoint)` commit + `git notes`;
      mark Phase 1 heading `[checkpoint: <sha>]`; plan commit

---

## Phase 2: Game 9 — Find the Word (WordMatchScene)

### Task 2.1 — Scene shell
- [ ] Write scene tests alongside: `src/__tests__/scenes/wordMatchScene.test.ts`
      (shell elements: entrance, mascot, parent-locked Back, 6 progress dots)
- [ ] Implement `src/scenes/WordMatchScene.ts` shell mirroring AlphabetScene
      (sceneEntrance, corner mascot, ParentLock + 96px Back, progress dots)
- [ ] Commit `feat(scenes): Add Find the Word scene shell` + plan commit

### Task 2.2 — Round rendering
- [ ] Tests: prompt picture (~180px) top-center from `wordLogic` texture key;
      2×2 word-card grid composed of letter textures (~80px/letter, min
      card height 160px); `speakWord` invoked with SFX flag
- [ ] Implement `renderRound` + `createCards` (letter images from
      `letter_<c>` textures)
- [ ] Commit `feat(scenes): Render Find the Word rounds` + plan commit

### Task 2.3 — Interaction
- [ ] Tests: correct tap → chime + Hoot cheer + progress dot pop + next round
      in ~0.7s; wrong tap → gentle reduced-motion-aware wiggle + soft tone,
      no penalty, input locked during transitions
- [ ] Implement `handleChoice`/`handleCorrect`/`handleIncorrect`
- [ ] Commit `feat(scenes): Wire Find the Word interaction` + plan commit

### Task 2.4 — Completion
- [ ] Tests: win SFX + shared celebration; `earnSticker("word-match")` on
      first completion only; auto-return to Hub in ~3s with `justEarned`
- [ ] Implement `handleComplete` + sticker reveal (texture
      `sticker_word_match`)
- [ ] Commit `feat(scenes): Complete Find the Word flow` + plan commit

### Phase 2 checkpoint
- [ ] Phase-end protocol (diff vs checkpoint, tests, manual verification plan
      presented to user for confirmation before checkpoint commit)
- [ ] `conductor(checkpoint)` commit + `git notes`; mark Phase 2 heading

---

## Phase 3: Game 10 — Build the Word (WordBuilderScene)

### Task 3.1 — Scene shell
- [ ] Scene tests: `src/__tests__/scenes/wordBuilderScene.test.ts` (entrance,
      mascot, parent-locked Back, 3 progress dots)
- [ ] Implement `src/scenes/WordBuilderScene.ts` shell
- [ ] Commit `feat(scenes): Add Build the Word scene shell` + plan commit

### Task 3.2 — Round rendering
- [ ] Tests: prompt picture top-center; slot row (one ~120px empty box per
      letter); 6 letter tiles (~110px) from `letter_<c>` textures with
      distractors; `speakWord` invoked
- [ ] Implement `renderRound` (slots + tiles)
- [ ] Commit `feat(scenes): Render Build the Word rounds` + plan commit

### Task 3.3 — Interaction (sequential spelling)
- [ ] Tests: correct letter fills the next empty slot (settle pop + soft
      tick) and locks in; wrong tile wiggles + soft tone, no penalty; slots
      fill strictly left-to-right; input locked during transitions
- [ ] Implement tap handling and slot/tile state
- [ ] Commit `feat(scenes): Wire Build the Word spelling interaction` +
      plan commit

### Task 3.4 — Completion (word + playthrough)
- [ ] Tests: finished word lingers ~1.2s, chime + Hoot cheer, progress dot
      pops; after 3 words: win SFX + celebration + `earnSticker("word-builder")`
      once + auto-return ~3s with `justEarned`
- [ ] Implement `handleWordComplete` / `handleComplete`
- [ ] Commit `feat(scenes): Complete Build the Word flow` + plan commit

### Phase 3 checkpoint
- [ ] Phase-end protocol + `conductor(checkpoint)` commit + `git notes`; mark
      Phase 3 heading

---

## Phase 4: Integration — Hub, registry, assets

### Task 4.1 — Sticker assets
- [ ] Add `src/assets/svg/stickers/sticker_word_match.svg` and
      `sticker_word_builder.svg` in the existing style (primary #2B6CB0,
      outline #2D3748)
- [ ] Register both in `PreloadScene` `SHAPE_ASSETS` (512×512 raster)
- [ ] Commit `feat(assets): Add First Words stickers` + plan commit

### Task 4.2 — Scene registry
- [ ] Update `src/__tests__/scenes/sceneRegistry.test.ts` (new loaders)
- [ ] Add `WordMatch` and `WordBuilder` dynamic-import loaders to
      `sceneRegistry.ts`
- [ ] Commit `feat(scenes): Register First Words lazy loaders` + plan commit

### Task 4.3 — Hub: 10 tiles, 5×2 grid
- [ ] Update `src/__tests__/scenes/navigation.test.ts` and hub tests for the
      new tiles/grid
- [ ] `GAME_TILES` += Find the Word / Build the Word entries; rework grid to
      `GRID_COLS = 5`, `TILE_WIDTH = 160`, `TILE_SPACING = 40` (5×160 + 4×40
      = 960 ≤ 1024); verify no tile/label clipping, sticker shelf positions
      derive from constants
- [ ] Commit `feat(hub): Add First Words tiles in 5x2 grid` + plan commit

### Task 4.4 — Integration tests
- [ ] Add/extend integration tests: boot → hub → Find the Word → sticker →
      hub; boot → hub → Build the Word → sticker; PWA offline/localStorage
      persistence for both new ids
- [ ] Commit `test(scenes): Cover First Words integration flows` + plan commit

### Phase 4 checkpoint
- [ ] Phase-end protocol + `conductor(checkpoint)` commit + `git notes`; mark
      Phase 4 heading

---

## Phase 5: Quality gates, docs, manual verification

### Task 5.1 — Quality gates
- [ ] `pnpm run check`, `CI=true pnpm test`, `pnpm run build`,
      `node scripts/validate-pwa.js` all green; coverage ≥ 80%
- [ ] Commit `chore(quality): Pass First Words quality gates` + plan commit

### Task 5.2 — Docs sync
- [ ] `product.md`: 10 mini-games (Games 9 & 10 first-words milestones)
- [ ] `tech-stack.md`: new scenes/loaders, game ids, Hub grid constants
- [ ] README game rows; `PRD.md` Game 9/10 milestones;
      `docs/device-testing-checklist.md` sections for both games
- [ ] Commit `docs: Document First Words games` + plan commit

### Task 5.3 — Manual verification
- [ ] Present manual verification plan (tablet + phone, per
      device-testing-checklist) and pause for user confirmation
- [ ] Execute verification, record results
- [ ] Commit `docs(device): Record First Words device verification` +
      plan commit

### Phase 5 checkpoint
- [ ] Phase-end protocol + `conductor(checkpoint)` commit + `git notes`; mark
      Phase 5 heading

---

## Phase 6: Track completion & archive

### Task 6.1 — Completion
- [ ] Final review against spec Acceptance Criteria (all 8 items)
- [ ] Mark track complete in `metadata.json` (status `complete`, items
      totals), archive folder to `conductor/archive/first-words_20260803/`,
      update `tracks.md` registry entry to `[x] ... (Archived)`
- [ ] Commit `chore(conductor): Mark track 'first-words' as complete and archive`
- [ ] Release notes for the upcoming release are handled by the release
      mechanics track (out of scope here)
