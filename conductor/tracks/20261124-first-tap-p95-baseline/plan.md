# Measure first-tap p95 headed and refresh the perf baseline each release - Implementation Plan

> **Branch:** `chore/20261124-first-tap-p95-baseline`
> **Base:** `master` @ `04f14631`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Pure p95 helper and measurement-script integration

- **Goal:** `measure-first-tap.mjs` reports a deterministic cold stage-C p95 in text and JSON from a configurable number of fresh-context taps per game, while its worst-cold 400 ms exit gate and all existing outputs remain unchanged.
- **Depends on:** none
- **Covers:** FR-1, FR-5, NFR-1, NFR-2, NFR-3, NFR-4, NFR-5, AC-1, AC-6, AC-7, AC-9, AC-10
- **Touches:** `scripts/firstTapStats.mjs` (new), `scripts/firstTapStats.d.mts` (new), `scripts/measure-first-tap.mjs`, `src/__tests__/guard/firstTapStats.test.ts` (new), `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` (count-only only), `conductor/tracks/20261124-first-tap-p95-baseline/verification/phase-1.md`
- **Verification:** `pnpm exec vitest run src/__tests__/guard/firstTapStats.test.ts`, `pnpm check`, `pnpm typecheck`, `pnpm test -- --run`, `pnpm test:coverage`, `pnpm build`, `node scripts/validate-bundle.js`, `node scripts/validate-module-size.js`, `node scripts/validate-textures.js`, `node scripts/validate-pwa.js`, `node scripts/validate-docs.js`, `node scripts/measure-first-tap.mjs --with-preview --samples 1 --json`, then the full `verify_phase` chain on the final tree.
- **Status:** verified

**Result:** verified
**Checkpoint:** eaea065a
**Evidence:** conductor/tracks/20261124-first-tap-p95-baseline/verification/phase-1.md

- [x] **P1.T1: Add a pure nearest-rank p95 helper** - covers: FR-1, NFR-1, AC-1
  - [x] **P1.T1.1:** Implement `percentile(values, q)` in `scripts/firstTapStats.mjs` with nearest-rank index `ceil(q * n) - 1`, returning `null` for empty input and preserving input order.
  - [x] **P1.T1.2:** Add `scripts/firstTapStats.d.mts` so the helper is typed for the Vitest guard test without a new dependency.
- [x] **P1.T2: Guard the helper with a unit test** - covers: FR-1, AC-1, AC-9
  - [x] **P1.T2.1:** Add `src/__tests__/guard/firstTapStats.test.ts` covering empty, single-value, even/odd sample sets, nearest-rank interpolation and unsorted input.
  - [x] **P1.T2.2:** Refresh living suite-count claims only if the added test file changes `vitest list` truth, then require `validate-docs.js` 5/5.
- [x] **P1.T3: Wire p95 into the measurement script** - covers: FR-1, FR-5, AC-6, AC-10
  - [x] **P1.T3.1:** Add `--samples <n>` with default 10 and loop each target in fresh contexts; keep stages A–D, warm-aware classification and the service-worker block unchanged.
  - [x] **P1.T3.2:** Report `cold.p95Ms` and per-game p95 in JSON and the text table, leaving `median`, `worst`, `budgetMs` and the `worst.totalMs > 400` exit gate intact.
  - [x] **P1.T3.3:** Run a single-sample preview smoke to prove the loop and JSON shape without the full headed cost.
- [x] **P1.T4: Verify Phase 1** - covers: FR-4, NFR-2, NFR-3, NFR-4, AC-7, AC-8
  - [x] **P1.T4.1:** Run all Phase 1 verification commands separately, re-running any permission-denied command from the primary, and write `verification/phase-1.md` ending with an empty `## Primary verification` section.

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261124-first-tap-p95-baseline/verification/phase-1.md
-->

## Phase 2: Headed 10x5 measurement evidence

- **Goal:** Produce committed raw JSON evidence from a headed Chromium run with 10 fresh-context taps per game across the five established targets, with warm-aware comparison run headed on both passes.
- **Depends on:** Phase 1
- **Covers:** FR-2, FR-7, AC-2, AC-3
- **Touches:** `conductor/tracks/20261124-first-tap-p95-baseline/verification/phase-2.md`, `conductor/tracks/20261124-first-tap-p95-baseline/verification/first-tap-headed.json` (new)
- **Verification:** `pnpm exec playwright --version`, `node --version`, `TAP_HEADED=1 node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10`, `pnpm check`, `pnpm typecheck`, `pnpm test -- --run`, `pnpm test:coverage`, `pnpm build`, `node scripts/validate-bundle.js`, `node scripts/validate-module-size.js`, `node scripts/validate-textures.js`, `node scripts/validate-pwa.js`, `node scripts/validate-docs.js`, then the full `verify_phase` chain on the final tree.
- **Status:** pending

- [ ] **P2.T1: Confirm the headed environment** - covers: FR-2, FR-7
  - [ ] **P2.T1.1:** Record Node and Playwright versions, confirm a local display session and that port 4173 is free.
  - [ ] **P2.T1.2:** If headed Chromium or the preview cannot start, block with the exact command and error; do not substitute headless or historical data.
- [ ] **P2.T2: Execute the evidence run** - covers: FR-2, AC-2, AC-3
  - [ ] **P2.T2.1:** Run `TAP_HEADED=1 node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10` and capture stdout into `verification/first-tap-headed.json`.
  - [ ] **P2.T2.2:** Confirm 50 samples, five games, per-game p95 values, warm-aware headed tap kinds, and an exit code governed only by the worst-cold 400 ms gate.
- [ ] **P2.T3: Verify Phase 2** - covers: FR-4, NFR-3, NFR-4, AC-8
  - [ ] **P2.T3.1:** Run all Phase 2 verification commands separately, record the real numbers and command lines, and write `verification/phase-2.md` ending with an empty `## Primary verification` section.

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261124-first-tap-p95-baseline/verification/phase-2.md
-->

## Phase 3: Baseline doc sync and integrated gate

- **Goal:** The live baseline publishes the measured headed p95, the per-release refresh procedure is recorded, and the full gate is green on the final tree.
- **Depends on:** Phase 2
- **Covers:** FR-3, FR-4, FR-6, NFR-3, NFR-4, AC-4, AC-5, AC-8
- **Touches:** `docs/perf-baseline.md`, `README.md`, `docs/TDD.md` (count-only only), `conductor/tracks/20261124-first-tap-p95-baseline/verification/phase-3.md`, `conductor/tracks/20261124-first-tap-p95-baseline/verification/integrated.md`
- **Verification:** `node scripts/validate-docs.js`, `pnpm check`, `pnpm typecheck`, `pnpm test -- --run`, `pnpm test:coverage`, `pnpm build`, `node scripts/validate-bundle.js`, `node scripts/validate-module-size.js`, `node scripts/validate-textures.js`, `node scripts/validate-pwa.js`, then the full `verify_phase` chain once on the final tree.
- **Status:** pending

- [ ] **P3.T1: Publish the dated p95 result** - covers: FR-3, FR-6, AC-4, AC-5
  - [ ] **P3.T1.1:** Replace the live header in `docs/perf-baseline.md` with the 2026-11-24 headed figures, per-game p95 table, exact command, sample count, target set and link to `verification/first-tap-headed.json`.
  - [ ] **P3.T1.2:** If worst per-game p95 exceeds 400 ms while the gate passes, record the breach and a concrete follow-up in the baseline and roadmap instead of failing the run.
- [ ] **P3.T2: Add the per-release refresh procedure** - covers: FR-3, AC-4
  - [ ] **P3.T2.1:** Add a short `Per-release first-tap refresh` section to `docs/perf-baseline.md` with the headed requirement, `--samples 10`, the five targets, the report-only p95 semantics and the worst-cold gate.
  - [ ] **P3.T2.2:** Keep README/TDD edits count-only and require `validate-docs.js` 5/5.
- [ ] **P3.T3: Record the integrated gate** - covers: FR-4, NFR-3, NFR-4, AC-8
  - [ ] **P3.T3.1:** Run the full `verify_phase` chain once on the final tree, write `verification/phase-3.md` and `verification/integrated.md`, and leave the empty `## Primary verification` / `## Integrated verification (Section 5)` sections for the primary.

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261124-first-tap-p95-baseline/verification/phase-3.md
-->

<!--
Review fixes are appended by `conductor-review` as:

## Phase R1: Review Fixes

- **Goal:** Resolve review findings ...
- **Depends on:** Phase 3
- **Covers:** review findings
- **Touches:** ...
- **Verification:** ...
- **Status:** pending

- [ ] **R1.T1: Resolve <finding ID>** - covers: <finding ID>
-->
