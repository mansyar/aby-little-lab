<protect>
# Implementation Plan: Musical Memory Simon Mini-Game

**Track ID:** `musical-memory_20260729`

---

## Phase 1: SVG Assets & Preload Pipeline

- [x] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [x] Task: Create frog & lily pad SVG assets
    - [x] Create 3 frog SVGs in `src/assets/svg/animals/`: `frog_green.svg`, `frog_blue.svg`, `frog_red.svg` (512×512 viewBox, flat fills, thick #2D3748 outlines 4-6px, storybook style; green=#48BB78, blue=#3182CE, red=#E53E3E; each frog clearly distinct by color)
    - [x] Create `lilypad.svg` in `src/assets/svg/items/` (512×512, flat green pad that sits beneath each frog)
    - [x] Create `musical-memory` sticker SVG in `src/assets/svg/stickers/sticker_musical_memory.svg`
- [x] Task: Extend PreloadScene to load and rasterize the 3 frog SVGs + lily pad SVG with explicit width/height for high-res rasterization [d99ed07]
- [x] Task: Conductor - User Manual Verification 'SVG Assets & Preload Pipeline' (Protocol in workflow.md)

---

## Phase 2: Sequence Generation & Round Logic

- [ ] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [ ] Task: Write tests for sequence generation and round logic [TDD-Red]
    - [ ] Test `generateSequence(length)` produces a sequence of the given length (start length 2) where every index is in range 0-2
    - [ ] Test `appendNote(sequence)` returns a new sequence grown by exactly 1 (random index 0-2 appended; original unchanged)
    - [ ] Test `validateInput(sequence, inputIndex, tappedFrog)` returns correct=true and advances index when tap matches sequence at current index
    - [ ] Test `validateInput` returns correct=false when tap does not match (mistake; no index advance)
    - [ ] Test `isRoundComplete(sequence, inputIndex)` returns true when inputIndex reaches sequence length
    - [ ] Test `isWin(sequenceLength, target=6)` returns true only when sequence length reaches the win target (6)
    - [ ] Test mistake handling resets inputIndex to 0 without changing the sequence or round count (no-fail, no progress lost)
- [ ] Task: Implement sequence generation & round logic in `src/game/musicalMemoryLogic.ts` (pure functions: generateSequence, appendNote, validateInput, isRoundComplete, isWin) [TDD-Green]
- [ ] Task: Conductor - User Manual Verification 'Sequence Generation & Round Logic' (Protocol in workflow.md)

---

## Phase 3: Sequence Playback & Child Input Interaction

- [ ] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [ ] Task: Write tests for sequence playback and child input interaction [TDD-Red]
    - [ ] Test sequence auto-plays at round start: each frog scales up + plays its note (`playFrogNote`) in sequence order with a timed delay between notes
    - [ ] Test input is locked during sequence playback (taps ignored)
    - [ ] Test child tap on a frog scales it up + plays its note + registers input at the current index
    - [ ] Test correct tap advances the input index; completing the full sequence triggers round success
    - [ ] Test wrong tap plays incorrect SFX, re-plays the current sequence, resets input index, and retries the same round (no progress lost)
    - [ ] Test replay button re-plays the current sequence on demand (input locked during replay; unlocked after)
    - [ ] Test input is unlocked after sequence playback/replay completes
    - [ ] Test touch targets meet ≥64×64px (ideal 96×96px) with inflated hit areas
- [ ] Task: Implement sequence auto-play (timed note + scale-up + glow), child input, replay button, and mistake handling in `MusicalMemoryScene` (calls existing `AudioManager.playFrogNote` + correct/incorrect SFX) [TDD-Green]
- [ ] Task: Conductor - User Manual Verification 'Sequence Playback & Child Input Interaction' (Protocol in workflow.md)

---

## Phase 4: Round Progression, Progress Dots & Completion

- [ ] Task: Read spec.md and workflow.md to refresh context before starting this phase
- [ ] Task: Write tests for round progression, progress dots, and completion flow [TDD-Red]
    - [ ] Test round success fills the next progress dot (5 dots total)
    - [ ] Test sequence grows by 1 on round success and the next round auto-plays
    - [ ] Test completion is triggered only when the length-6 sequence is completed correctly
    - [ ] Test win animation + win SFX play on completion
    - [ ] Test sticker awarded on first completion only via `storage.earnSticker("musical-memory")` (with sticker SFX + unlock animation)
    - [ ] Test auto-return to Hub scene after 3s delay
    - [ ] Test parental lock (hold 3s) exits to Hub at any time
- [ ] Task: Implement round progression, progress dots (5), completion flow (win animation + sticker award + auto-return) in `MusicalMemoryScene` [TDD-Green]
- [ ] Task: Conductor - User Manual Verification 'Round Progression, Progress Dots & Completion' (Protocol in workflow.md)
</protect>
