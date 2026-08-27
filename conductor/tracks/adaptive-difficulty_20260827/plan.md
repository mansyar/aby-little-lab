# Plan: Adaptive Difficulty (Numeracy Four)

**Track ID:** `adaptive-difficulty_20260827` · **Type:** Feature · **Status:** new
**Spec:** [./spec.md](./spec.md) — Source of Truth for scope
**Workflow:** [../../workflow.md](../../workflow.md) — Source of Truth for process
**Branch:** `feature/adaptive-difficulty`

## Goal

Per-profile adaptive band ladders (max ±1 step) for How Many?, More or Less, Add It Up,
Take Away, driven by a rolling 10-tap window, gated by a parent Settings toggle, invisible
to the child.

## Conventions (per workflow.md)

- Per task: select → mark `[~]` → failing tests → implement → coverage → commit
  (`<type>(<scope>): <desc>`) → `git notes add` summary → record SHA in this plan → plan commit.
- Quality gates before every checkpoint: `pnpm run check` · `CI=true pnpm test` · `pnpm run build`.
- Coverage floors: 95% lines / 90% stmts / 88% funcs / 85% branches.

## Phase 1 — Adaptive Core (logic + storage)

[checkpoint: e824df3]

- [x] Task 1.1: New pure module `src/game/adaptiveLogic.ts` (TDD) (9b5a169)
  - Failing tests (`src/__tests__/game/adaptiveLogic.test.ts`):
    `updateRecentWindow` folds `{correct, wrong}` aggregates (trues then falses) and trims
    to `WINDOW_SIZE = 10`; `bandShiftFor`: `[]` → 0, sample < 6 → 0, 9/10 → +1, 8/10 → 0,
    5/10 → −1, 6/10 → 0; `shiftLadder([1,1,2,2,3,3], −1|0|+1)` → `[1,1,1,1,2,2]` /
    `[1,1,2,2,3,3]` / `[2,2,3,3,3,3]`.
  - Implement with constants `WINDOW_SIZE = 10`, `MIN_SAMPLE = 6`, `UP_THRESHOLD = 0.9`,
    `DOWN_THRESHOLD = 0.6`.
- [x] Task 1.2: Additive `recent: boolean[]` on `GameProgress` (TDD) (61c23ac)
  - Failing tests (`progressLogic`): `normalizeProgress` backfills `recent = []` for old
    saves; sanitizes invalid shapes (non-array, oversized, non-boolean entries);
    `recordResult` folds session aggregates into the window (cap 10); cumulative
    `plays/wins/correct/wrong` untouched. Type added in `src/types.ts`.
- [x] Task 1.3: Settings flag `adaptiveDifficulty` default `true` (TDD) (4f2405d)
  - Failing tests: settings normalize backfill; persistence round-trip via storage facade.
- [x] Task 1.4: Storage facade `getAdaptiveBandShift(gameId)` (TDD) (9c1d893)
  - Failing tests: returns 0 when toggle off; 0 when window empty or sample < 6;
    otherwise `bandShiftFor(window)`.
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Shifted Ladders in Game Logic

[checkpoint: 2c785b6]

- [x] Task 2.1: How Many? — `createPlaythrough(shift?)` (TDD) (520f52d)
  - Failing tests (loop over shifts −1/0/+1, many seeds): 6 rounds; band of each round
    equals shifted ladder; per-band distinct targets with reset-on-exhaustion fallback
    (band 1 serves 4 rounds at shift −1 with pool of 3); group counts distinct, exactly
    one correct group, groups shuffled; all counts ≤ shifted band max.
- [x] Task 2.2: More or Less — `createPlaythrough(shift?)` (TDD) (666efbb)
  - Failing tests: ladder equals shifted base; 3× more / 3× less mix; counts within
    shifted band max; sides never tie.
- [x] Task 2.3: Add It Up — `buildPlaythrough(shift?)` (TDD) (7488320)
  - Failing tests: pair uniqueness across playthrough at all shifts; no pool-exhaustion
    throw at any shifted ladder; options distinct and include target; sums ≤ shifted band max.
- [x] Task 2.4: Take Away — `buildPlaythrough(shift?)` (TDD) (370e755)
  - Failing tests: pair uniqueness at all shifts; subtrahend ≥ 1; difference > 0;
    minuend ≤ shifted band max; options distinct and include target.
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Wiring & Parent Surface

- [x] Task 3.1: Wire the four scenes (TDD) (4370cbd)
  - Failing tests: each scene calls `getAdaptiveBandShift(<gameId>)` at `create()` and
    passes it to its generator (assert via mocked facade + logic spies across
    toggle/window combinations; OFF and fresh-profile produce the classic ladder).
- [x] Task 3.2: SettingsPanel toggle row (TDD) (a69cffd)
  - Failing tests: "Adaptive Difficulty" row renders with the established switch-toggle
    pattern; defaults ON; toggling persists through the storage facade; consistent with
    existing rows (labels, a11y, touch target).
- [x] Task 3.3: Learning Progress explanatory note (TDD) (ddd1ece)
  - Failing tests: report renders the static parent-facing note (what adaptive difficulty
    does + where to disable); child-facing game UI unchanged (textless).
- [x] Task 3.4: Documentation (no TDD) (0278389)
  - `product.md` §3.2 dated amendment (2026-08-27): "difficulty stays fixed" retired for
    the four numeracy games only (start-band adaptation, max ±1).
  - `tech-stack.md` dated Design Update: adaptiveLogic module, additive storage fields
    (`GameProgress.recent`, `Settings.adaptiveDifficulty`), facade, toggle.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Full Verification & Handoff

- [ ] Task 4.1: Quality gates — `pnpm run check`; `CI=true pnpm test`; `pnpm run build`.
- [ ] Task 4.2: Manual verification matrix (dev server, per profile)
  - Toggle OFF → classic ladder in all four games.
  - Toggle ON + high-accuracy window → next playthrough starts one band up.
  - Toggle ON + low-accuracy window → next playthrough starts one band down.
  - Fresh profile / < 6 taps → classic ladder.
  - Pre-feature save loaded → `recent` backfilled, no console/storage errors.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
