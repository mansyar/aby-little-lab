# Plan: Adaptive Literacy & Memory (Six-Game Extension)

**Track ID:** `adaptive-literacy_20260814` · **Type:** Feature · **Status:** in progress
**Spec:** [./spec.md](./spec.md) — Source of Truth for scope
**Workflow:** [../../workflow.md](../../workflow.md) — Source of Truth for process
**Branch:** `feature/adaptive-literacy`

## Goal

Extend the shipped adaptive band system from the four numeracy games to the six
literacy/memory games — Find the Word, Build the Word, First Sounds, Find the Letter,
Memory Match, Musical Memory — reusing `adaptiveLogic`, `getAdaptiveBandShift`, and the
existing `adaptiveDifficulty` toggle. No storage or UI changes; shift 0 is
byte-identical to classic behavior.

## Conventions (per workflow.md)

- Per task: select → mark `[~]` → failing tests → implement → coverage → commit
  (`<type>(<scope>): <desc>`) → `git notes add` summary → record SHA in this plan → plan commit.
- Quality gates before every checkpoint: `pnpm run check` · `CI=true pnpm test` · `pnpm run build`.
- Coverage floors: 95% lines / 90% stmts / 88% funcs / 85% branches.

## Phase 1 — First Words family (Find the Word + Build the Word)

- [x] Task 1.1: `wordLogic` tier-split shift (TDD) (5d2c3c6)
  - Failing tests (`src/__tests__/game/wordLogic.test.ts`): `generateWordPlaythrough(
    roundCount, shift)` tier sequences `[3×6]` / `[3,3,3,3,3,4]` / `[3,3,3,3,4,4]` at
    shift −1/0/+1 with unique targets, 4 unique choices incl. target, no shared first
    letters; `generateWordBuildPlaythrough(wordCount, shift)` tiers `[3,3,3]` / `[3,3,4]` /
    `[3,4,4]`, no repeats; shift-0 fixtures equal the classic `roundCount − 1` split.
- [ ] Task 1.2: Wire `WordMatchScene` + `WordBuilderScene`
  - `WordMatchScene:83` → `generateWordPlaythrough(ROUND_COUNT, getAdaptiveBandShift("word-match"))`;
    `WordBuilderScene:119` → `generateWordBuildPlaythrough(WORD_COUNT, getAdaptiveBandShift("word-builder"))`;
    confirm per-tap recording already wired.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Discrimination guards (First Sounds + Find the Letter)

- [ ] Task 2.1: `firstSoundsLogic` band semantics (TDD)
  - Uniform effective band `clamp(2 + shift, 1, 3)`. Band 1: targets ⊆ phonics letters
    minus {B, P}, classic guards; band 2: byte-identical classic; band 3: sound-confusable
    distractors allowed (B/P, D/T), visual families still excluded.
- [ ] Task 2.2: `alphabetLogic` band semantics (TDD)
  - Band 1: targets ∈ A–J, classic guards; band 2: byte-identical classic; band 3:
    same-family distractors allowed, target never among choices, 4 unique choices.
- [ ] Task 2.3: Wire `FirstSoundsScene` + `AlphabetScene`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Memory family (Memory Match + Musical Memory)

- [ ] Task 3.1: `memoryMatchLogic` ladder shift (TDD)
  - `buildPlaythrough(shift)` = `shiftLadder(BASE_LADDER, shift)` mapped BandId→MemoryBand
    (1→easy, 2→medium, 3→hard); band invariants per round (grid, pairs, layout, pool).
- [ ] Task 3.2: `musicalMemoryLogic` start-length shift (TDD)
  - `startLengthFor(shift)`: 1/2/3; `winLengthFor(start)`: 5/6/7; `MAX_RUN = 2` holds;
    round count stays 5 (`PROGRESS_DOT_COUNT = 5` valid); `isWin` default signature kept.
- [ ] Task 3.3: Wire `MemoryMatchScene` + `MusicalMemoryScene`
  - Musical Memory: store `startLength`/`winTarget` at `create()`, use in
    `generateSequence` and `isWin`; dots unchanged.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Facade coverage, record audit, docs, full verification

- [ ] Task 4.1: Facade tests for the six new game ids (TDD)
  - `getAdaptiveBandShift`: toggle off → 0; ≥ 90% over ≥ 6 taps → +1; < 60% → −1;
    < 6 taps → 0, for each of word-match, word-builder, first-sounds, alphabet-match,
    memory-match, musical-memory.
- [ ] Task 4.2: Record-path audit (no TDD unless a gap is found)
- [ ] Task 4.3: Docs amendments (no TDD)
  - `product.md` §3.2 dated extension to the six games; `tech-stack.md` design update.
- [ ] Task 4.4: Quality gates (full verification)
  - `pnpm run check` · `CI=true pnpm test` · `pnpm run build` + PWA validation · dev-server smoke.
- [ ] Task 4.5: Conductor bookkeeping (review checkpoint → archive on completion)
