# Plan — Property-Test Deflake

**Branch:** `chore/20261026-property-test-deflake`
**Base:** `master` @ `c5bb9eca`

Phase states: `pending` → `in_progress` → `verified` | `failed` | `blocked`.
Only the primary writes this file; phases are executed one at a time by a
phase subagent and independently verified by the primary before acceptance.

## Phase 1: Audit the sweeps and raise the budgets

- **Goal:** A measured audit of every sweep test in the 13 `VARIETY_SAMPLES =
  200` suites, with an explicit 120,000 ms per-test budget on every test
  whose worst observed wall time exceeds 20 s — the five proven victims at
  minimum — and the policy recorded in the TDD runner section.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, FR-4, FR-5, NFR-1, NFR-3, AC-2, AC-3, AC-4 (partial), AC-5
- **Touches:** `src/__tests__/game/addItUpLogic.test.ts`,
  `src/__tests__/game/countLogic.test.ts`,
  `src/__tests__/game/numberOrderLogic.test.ts`,
  `src/__tests__/game/takeAwayLogic.test.ts`,
  `src/__tests__/game/firstSoundsLogic.test.ts`,
  plus any additional suite the audit flags (recorded in evidence),
  `docs/TDD.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P1.T1: Audit every sweep test's isolated wall time** — covers: FR-2, FR-3, NFR-3
  - [x] **P1.T1.1:** Run the 13 `VARIETY_SAMPLES = 200` suites individually with a wall-clock timer (`pnpm exec vitest run <file>` per suite, timed), recording each suite's slowest tests. The audit table maps every sweep test (tests whose body loops over shifts or samples) to its worst observed wall time; tests that hit the global 30 s timeout record `>= 30 s (timed out)`.
  - [x] **P1.T1.2:** Confirm the installed vitest 4.1.x per-test timeout syntax from `node_modules/vitest` typings (options object as the second `it()` argument) before writing any option.
- [x] **P1.T2: Apply the explicit budgets** — covers: FR-1, FR-2, FR-5, AC-2
  - [x] **P1.T2.1:** Add `{ timeout: 120000 }` to every sweep test whose worst observed wall time exceeds 20 s — the five proven victims at minimum (`addItUpLogic.test.ts`, `countLogic.test.ts`, `numberOrderLogic.test.ts`, `takeAwayLogic.test.ts`, `firstSoundsLogic.test.ts` shift-sweep tests). No test is renamed, removed, or weakened; sample counts stay 200; no other test carries a timeout unless the audit justified it.
- [x] **P1.T3: Record the policy in the TDD** — covers: FR-4, AC-4
  - [x] **P1.T3.1:** In `docs/TDD.md` §10.1, extend the runner paragraph with the exception policy: the named suites' sweep tests carry an explicit 120 s budget because their 200-sample × 3-shift loops exceed 30 s under host load (worst observed 66 s), while the global 30 s default is unchanged. Keep the vmThreads rationale intact.

**Result:** verified
**Checkpoint:** bf96b31c
**Evidence:** conductor/tracks/20261026-property-test-deflake/verification/phase-1.md

## Phase 2: Verify the deflake

- **Goal:** The full verification chain passes on the final tree, with the
  budgeted sweeps demonstrably inside their new budgets.
- **Depends on:** Phase 1
- **Covers:** NFR-2, AC-1, AC-4, AC-5
- **Touches:** `conductor/tracks/20261026-property-test-deflake/verification/`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P2.T1: Run the full verification chain** — covers: NFR-2, AC-1
  - [x] **P2.T1.1:** Run the phase Verification chain exactly as written (all eight commands, exit 0). Record per-suite wall times of the budgeted suites from the run output as post-change evidence (they must fit inside the new budgets with headroom).
- [x] **P2.T2: Record the evidence** — covers: AC-4, AC-5
  - [x] **P2.T2.1:** Evidence records the chain results, the AC-2 grep proof (explicit timeouts present, `vite.config.ts` untouched), the audit table reference, and the unchanged counts (125 files / 2,729 tests).

**Result:** verified
**Checkpoint:** 6e8a9b9b
**Evidence:** conductor/tracks/20261026-property-test-deflake/verification/phase-2.md

## Phase R1: Review Fixes

- **Goal:** Resolve review findings F1-F3: budget the two unprotected sweeps the historical record implicates, correct the TDD policy note's timeout inventory, and fix the evidence provenance.
- **Depends on:** Phase 2
- **Covers:** F1, F2, F3
- **Touches:** `src/__tests__/game/decodeLogic.test.ts`, `src/__tests__/game/wordLogic.test.ts`, `docs/TDD.md`, `conductor/tracks/20261026-property-test-deflake/verification/phase-1.md`, `conductor/tracks/20261026-property-test-deflake/verification/integrated.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified
- [x] **R1.T1: Resolve F1** — covers: F1
  - [x] **R1.T1.1:** Add `{ timeout: 120_000 }` to "keeps every round valid and uniquely targeted at every shift" in `decodeLogic.test.ts:322` and `wordLogic.test.ts:254`; update the AC-2 grep-proof counts (5 → 7 matches) in `phase-1.md` and `integrated.md`, and the TDD note's test list.
- [x] **R1.T2: Resolve F2** — covers: F2
  - [x] **R1.T2.1:** Reword the `docs/TDD.md:1015` sentence so the pre-existing timeout inventory is accurate (the addItUp/count/takeAway 20 s guards AND the two 20 s sweep guards in `moreLessLogic.test.ts:141-143`/`:159`), plus the new 120 s budgets.
- [x] **R1.T3: Resolve F3** — covers: F3
  - [x] **R1.T3.1:** In `phase-1.md` provenance (~:72), cite `20261026-docs-truth-pass/verification/phase-1.md:93,119` as the sole flake record, reconcile the five-victim framing with its seven-file list, and correct the multiplier range (worst observed ~33× over the 1.98 s victim).

**Result:** verified
**Checkpoint:** 84c0699d
**Evidence:** conductor/tracks/20261026-property-test-deflake/verification/phase-R1.md
