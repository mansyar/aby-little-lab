# Implementation Plan — Game 8: "Find the Letter" (Alphabet Recognition)

**Track:** `alphabet-match_20260802` · **Type:** Feature · **Branch:** `feat/game-8`

## Phase 1: Pure Game Logic — `src/game/alphabetLogic.ts` (TDD) `[checkpoint: 8deca9e]`

- [x] Task: Write failing unit tests for `alphabetLogic` — playthrough draws 6 unique letters uniformly from A–Z (no duplicates); each round has 4 unique cards (1 target + 3 distinct distractors) with exactly one correct answer; answer evaluation; win detection at 6 correct `08775fd`
- [x] Task: Implement `src/game/alphabetLogic.ts` until tests pass (Red → Green) `08570ee`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) `8deca9e`

## Phase 2: TTS Utility — `src/utils/speech.ts` (TDD) `[checkpoint: dd58153]`

- [x] Task: Write failing unit tests for `speakLetter` — support detection; en-US utterance with gentle rate; cancels prior utterances; respects enabled flag (SFX toggle); never throws when API unavailable `f4fc40b`
- [x] Task: Implement `src/utils/speech.ts` until tests pass (Red → Green) `1b9c2b0`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) `dd58153`

## Phase 3: Assets, Registry & Storage Integration `[checkpoint: baafb07]`

- [x] Task: Author 26 uppercase letter SVGs (`src/assets/svg/letters/letter_a.svg` … `letter_z.svg`, 512×512, flat `#2B6CB0` fill, thick `#2D3748` stroke, identical styling) + `sticker_alphabet.svg` `7dabd1b`
- [x] Task: Add `alphabet-match` to `GameId` union + storage sticker key in `src/types/index.ts`; update storage tests (defaults, reset) and add old-save migration coverage for Game 8 `2fa2469`
- [x] Task: Preload the 27 new SVGs in `PreloadScene`; update the preload SVG-count assertion in `navigation.test.ts` (61 → 88) `5b0d26a`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) `baafb07`
- [ ] Task: Register `Alphabet` lazy loader in `src/scenes/sceneRegistry.ts` *(moved from Phase 3 → Phase 4: Vitest fails to resolve the dynamic import until `AlphabetScene.ts` exists, so registration ships with the scene in Phase 4)*

## Phase 4: AlphabetScene — `src/scenes/AlphabetScene.ts` (TDD) `[checkpoint: 9bc9b2f]`

- [x] Task: Write failing scene tests `src/__tests__/scenes/alphabetScene.test.ts` — target + 4 cards rendered; correct tap advances round with chime/mascot cheer/dot pop; incorrect tap wiggles, no penalty, no advance; TTS per round start respecting SFX toggle; win at 6 → celebration + sticker first-completion-only + `justEarned: 'alphabet-match'` + auto-return 3s; parental lock exit; reduced-motion variants `f4faf01`
- [x] Task: Implement `AlphabetScene` until tests pass (Red → Green); register `Alphabet` lazy loader in `src/scenes/sceneRegistry.ts` `2bef73e`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) `9bc9b2f`

## Phase 5: Hub Integration, Docs & Quality Gates

- [ ] Task: Add 8th Hub tile (4×2 grid), wire scene start, sticker shelf, mascot
- [ ] Task: Update `src/__tests__/scenes/navigation.test.ts` for 8 tiles + `ensureSceneLoaded("Alphabet")`
- [ ] Task: Update docs — `docs/PRD.md` (Game 8 section + product amendment note), `docs/TDD.md`, `conductor/tech-stack.md` (scene count, GameId, assets), `conductor/product.md`, release notes
- [ ] Task: Run quality gates — `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
