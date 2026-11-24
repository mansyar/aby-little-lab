# Adaptive Tuning — Implementation Plan

> **Branch:** feat/20261124-adaptive-tuning
> **Base:** master @ 0923e948

## Phase 1: Designed curve and seeded simulation

- **Goal:** A deterministic, seeded model of preschool answer streams exists
  and the designed 70/15/15 (±10pp) band-shift curve is documented and
  reproducible from the real `bandShiftFor` logic, with candidate tuned cut
  points derived from it.
- **Depends on:** none.
- **Covers:** FR-1, FR-2, NFR-1, AC-1, AC-2.
- **Touches:** `src/game/adaptiveCurve.ts` (new pure simulation module),
  `src/game/adaptiveLogic.ts` (additive optional threshold parameters on
  `bandShiftFor` only — default behaviour unchanged),
  `src/__tests__/game/adaptiveCurve.test.ts` (new), `docs/TDD.md` §7.3 curve
  text, `docs/PRD.md` §4.8 curve text, and living test-count claims in
  `README.md` / `docs/TDD.md` / `docs/perf-baseline.md` (validator keeps 5/5).
- **Verification:** `pnpm exec vitest run src/__tests__/game/adaptiveCurve.test.ts`,
  `node scripts/validate-docs.js`, `pnpm check`, `pnpm typecheck`, then the full
  `verify_phase` chain. Commands run separately (no `&&` chains in subagents).
- **Status:** in_progress

- [ ] **P1.T1: Model realistic answer streams** — covers: FR-2, NFR-1, AC-2
  - [ ] P1.T1.1: Build a seeded RNG (mulberry32-style) and a profile generator
        with a latent accuracy spanning struggling / typical / thriving
        profiles; a fixed seed must reproduce the same streams exactly.
  - [ ] P1.T1.2: Keep the module pure — no Phaser, no storage, no network; all
        inputs injectable.
- [ ] **P1.T2: Distribution calculator and designed curve** — covers: FR-1, FR-2, AC-1, AC-2
  - [ ] P1.T2.1: Compute the −1/0/+1 band-shift distribution over ≥1,000
        simulated profiles using the real `bandShiftFor` (add optional up/down
        cut-point parameters defaulting to the shipped constants).
  - [ ] P1.T2.2: Document the designed curve (70% stable, 15% down, 15% up,
        ±10pp) in TDD §7.3 and PRD §4.8; assert a degenerate RNG cannot divide
        by zero.
- [ ] **P1.T3: Derive candidate tuned cut points** — covers: FR-2, AC-2
  - [ ] P1.T3.1: Search cut points and report the pair whose simulated
        distribution lands inside all three target ranges; record the search
        and result in evidence. Do not yet change the shipped constants.

<!--
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261124-adaptive-tuning/verification/phase-1.md
-->

## Phase 2: Apply tuned thresholds and protect existing behaviour

- **Goal:** The tuned up/down thresholds are pinned in `adaptiveLogic.ts`, the
  distribution assertion passes with them, and every existing adaptive
  guarantee remains intact.
- **Depends on:** Phase 1.
- **Covers:** FR-3, FR-4, NFR-4, AC-3, AC-4, AC-5.
- **Touches:** `src/game/adaptiveLogic.ts` (tune `UP_THRESHOLD` /
  `DOWN_THRESHOLD` only), `src/__tests__/game/adaptiveLogic.test.ts`,
  `src/__tests__/game/adaptiveCurve.test.ts` (final pinned-constant assertion).
- **Verification:** targeted vitest on adaptive + curve tests, full
  `pnpm exec vitest run`, `pnpm check`, `pnpm typecheck`, full `verify_phase`.
- **Status:** pending

- [ ] **P2.T1: Pin tuned constants** — covers: FR-3, AC-3
  - [ ] P2.T1.1: Set `UP_THRESHOLD` / `DOWN_THRESHOLD` to the Phase 1 result;
        leave `WINDOW_SIZE = 10`, `MIN_SAMPLE = 6`, and `BASE_LADDER` unchanged.
- [ ] **P2.T2: Boundary and contract tests** — covers: FR-4, AC-3, AC-4
  - [ ] P2.T2.1: Assert 0 below `MIN_SAMPLE`, +1 at/above the up cut point, −1
        below the down cut point, 0 between, with exact-boundary cases.
  - [ ] P2.T2.2: Assert the simulated −1/0/+1 distribution with the pinned
        constants falls inside the FR-1 target ranges.
- [ ] **P2.T3: Preserve classic playthroughs** — covers: NFR-4, AC-5
  - [ ] P2.T3.1: Run all existing band/golden/byte-identity tests; confirm no
        shift-0 playthrough or game rule changed.

<!--
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261124-adaptive-tuning/verification/phase-2.md
-->

## Phase 3: Parent band readout

- **Goal:** A parent sees the effective band of each game in its Learning
  Progress row, derived from the viewed profile and honoring the adaptive
  toggle, with no child-facing change and no module over budget.
- **Depends on:** Phase 2.
- **Covers:** FR-5, NFR-2, NFR-3, AC-6.
- **Touches:** `src/components/settings/ProgressOverlay.ts` (stats-row band
  readout; extract a helper file if needed to stay ≤400 lines),
  `src/__tests__/components/...` or the existing progress overlay test file.
- **Verification:** targeted vitest on the progress overlay tests, full
  `pnpm exec vitest run`, `pnpm check`, `pnpm typecheck`,
  `node scripts/validate-module-size.js`, full `verify_phase`.
- **Status:** pending

- [ ] **P3.T1: Derive the band for the viewed profile** — covers: FR-5, NFR-2, AC-6
  - [ ] P3.T1.1: Read the viewed profile's `recent` window and derive the band
        with `bandShiftFor` (not `getAdaptiveBandShift`, which reads the active
        profile); return 0 when `getSettings().adaptiveDifficulty` is off.
- [ ] **P3.T2: Render in the Learning Progress row** — covers: FR-5, AC-6
  - [ ] P3.T2.1: Append a short band indicator to the existing per-game stats
        text; no new text in any child scene; static (no tween).
- [ ] **P3.T3: Keep the module within budget** — covers: NFR-3
  - [ ] P3.T3.1: If `ProgressOverlay.ts` exceeds 400 lines, extract a pure
        formatting helper; confirm `validate-module-size.js` reports zero
        warnings.

<!--
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261124-adaptive-tuning/verification/phase-3.md
-->

## Phase 4: Doc sync and full gate

- **Goal:** Every count-bearing and behaviour-bearing doc matches the shipped
  tuned thresholds and readout, and the full gate is green.
- **Depends on:** Phase 3.
- **Covers:** FR-6, FR-7, NFR-3, AC-7, AC-8.
- **Touches:** `conductor/product.md` (roadmap row Done), `docs/PRD.md`,
  `docs/TDD.md`, `README.md`, `docs/perf-baseline.md` (living counts if a test
  file was added), any other count-bearing doc.
- **Verification:** `node scripts/validate-docs.js`, then the full
  `verify_phase` chain.
- **Status:** pending

- [ ] **P4.T1: Sync docs** — covers: FR-6, AC-7
  - [ ] P4.T1.1: Record the final tuned thresholds, designed curve result, and
        parent band readout in PRD §4.8 and TDD §7.3; mark the product roadmap
        row Done 2026-11-24 with track `20261124-adaptive-tuning`.
  - [ ] P4.T1.2: Refresh living test counts if a test file was added; keep
        coverage/date/historical narrative unchanged; `validate-docs.js` 5/5.
- [ ] **P4.T2: Full gate** — covers: FR-7, NFR-3, AC-8
  - [ ] P4.T2.1: Run the full `verify_phase` chain and record results in
        `verification/integrated.md`.

<!--
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261124-adaptive-tuning/verification/phase-4.md
-->

<!--
## Phase R1: Review Fixes

**Goal:** Resolve findings from the review round.
**Depends on:** Phase 4
**Covers:** review findings
**Touches:** <as needed>
**Verification:** as directed by the review
**Status:** pending

- [ ] **R1.T1: Resolve finding F1**

**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261124-adaptive-tuning/verification/phase-R1.md
-->
