# Implementation Plan: Adaptive Difficulty — Remaining Games

> **Track:** `adaptive-remaining-games_20260828` · **Spec:** [spec.md](./spec.md) (Source of Truth)
> TDD per task: announce failing test → confirm red → minimum green → coverage → commit → git note → mark `[x]`.
> Commands: `CI=true pnpm test` · `pnpm run check` · `pnpm run build`. Commit style `<type>(<scope>): <desc>`.

## Phase 1: Pure logic — Pattern Builder

- [ ] Task 1.1 — Band-aware round generation (`patternBuilderLogic.ts`): `generateRound(band)` per-band table (1: ABAB+end; 2: any+end; 3: any+end/middle); keep confusable distractor guard in all bands; all structural invariants preserved (6 rounds via ladder, 4-shape rows, gap ≠ 0, 3 unique choices, exactly one correct).
- [ ] Task 1.2 — Ladder shift (`generatePlaythrough(shift = 0)`): `shiftLadder(BASE_LADDER, shift)` per-round bands; drop `roundCount` param (verify no caller/test uses it); shift 0 easy-first `[1,1,2,2,3,3]` (documented § 3.1 exception).
- [ ] Task 1.3 — Coverage + red-green evidence for tasks 1.1–1.2; commit `feat(game07): band-aware pattern builder rounds` + git note; mark tasks `[x]` + SHA.

## Phase 2: Pure logic — Odd One Out

- [ ] Task 2.1 — Ladder shift (`createPlaythrough(shift = 0)`): band ladder from `shiftLadder` with band-3 cap ≤ 3 per playthrough (frog pool guard, § 3.2); `createRound`, `isCorrect`, `promptFor` unchanged; odds remain unique within a playthrough.
- [ ] Task 2.2 — Coverage + red-green evidence; commit `feat(game14): band ladder for odd one out` + git note; mark tasks `[x]` + SHA.

## Phase 3: Pure logic — Color Match

- [ ] Task 3.1 — Split-point playthrough (`buildPlaythrough(shift = 0)`): `3 - shift` easy rounds, rest hard pool; shift 0 byte-identical; `buildRound`, `COLOR_POOLS`, `COLOR_CARDS`, `isCorrect`, `promptFor` unchanged.
- [ ] Task 3.2 — Coverage + red-green evidence; commit `feat(game15): split-point color match ladder` + git note; mark tasks `[x]` + SHA.

## Phase 4: Scene wiring

- [ ] Task 4.1 — Wire the three scenes to `getAdaptiveBandShift` (one line each, mirroring existing call sites); confirm shift computed once in `create`.
- [ ] Task 4.2 — Coverage; commit `feat(scenes): pass adaptive shift to games 07/14/15` + git note; mark tasks `[x]` + SHA.

## Phase 5: Verification & checkpoint

- [ ] Task 5.1 — Full gates: `CI=true pnpm test`, `pnpm run check`, `pnpm run build`; coverage floors hold; all changed code files test-covered.
- [ ] Task 5.2 — Manual verification plan (dev server → play 3 games → assert behavior per spec § 6); propose to user; interactive pause for yes/feedback.
- [ ] Task 5.3 — Checkpoint commit `conductor(checkpoint): adaptive remaining games complete` + verification report git note; record `[checkpoint: <sha>]` here; `conductor(plan)` commit.
- [ ] Task 5.4 — Update product definition amendment note (§ 2) in `tech-stack.md` if deviation occurred (else skip); final registry entry in `conductor/tracks.md` linking this folder.

## Checkpoints

- Phase 1: `[checkpoint: pending]`
- Phase 2: `[checkpoint: pending]`
- Phase 3: `[checkpoint: pending]`
- Phase 4: `[checkpoint: pending]`
- Phase 5: `[checkpoint: pending]`

## Verification Notes

- Shift 0 fixtures must assert: Pattern Builder rounds `[1,1,2,2,3,3]` easy-first; Odd One Out classic `[1,1,2,2,3,3]`; Color Match 3 easy + 3 hard.
- Frog-cap test: shift +1 playthrough has ≤ 3 band-3 rounds, all band-3 odds distinct frogs.
- Distribution tests run ≥ 200 iterations; assert 0 invariant violations, no flaky thresholds.
- Deviation protocol: any departure → STOP, document in `tech-stack.md` (dated), then continue per user direction.
