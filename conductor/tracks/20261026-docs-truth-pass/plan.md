# Implementation Plan — 20261026-docs-truth-pass

- **Branch:** `chore/20261026-docs-truth-pass`
- **Base:** `master` @ `127cd8c6`

> Phase states: `pending` | `in_progress` | `verified` | `failed` | `blocked`.
> Only the primary writes this file. The primary appends after acceptance:
> **Result:** verified/failed, **Checkpoint:** short-sha, **Evidence:** path.
> Review fixes are appended by conductor-review as a `## Phase R1` block.

## Phase 1: Refresh the living docs

- **Goal:** Every living-doc current-state claim states the true suite numbers
  (125 files / 2,729 tests), today's coverage snapshot (97.82/91.96/96.77/98.74),
  today's verified date, and the corrected `game/` structure — with
  release-checklist.md byte-identical.
- **Depends on:** none
- **Covers:** FR-2, FR-3, FR-4, FR-5, FR-6, AC-3 (partial), AC-4 (partial)
- **Touches:** `README.md`, `docs/TDD.md`, `docs/perf-baseline.md`, `docs/roadmap.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P1.T1: Refresh README's current-state claims** — covers: FR-2, FR-5
  - [x] **P1.T1.1:** `README.md:49` — replace "**2,556 tests across 119 files**, all green (verified 2026-10-23)" with "**2,729 tests across 125 files**, all green (verified 2026-10-26)".
  - [x] **P1.T1.2:** `README.md` `game/` line — "55 files = 33 modules + art/ 16 + hub/ 6" → "56 files = 34 modules + art/ 16 + hub/ 6"; add `random.ts` (the shared Fisher–Yates shuffle + `Rng` type every logic module and scene draws from) to the module enumeration alongside the 21 per-game logic modules.
- [x] **P1.T2: Refresh docs/TDD.md's claims** — covers: FR-3
  - [x] **P1.T2.1:** `:1013` and `:1027` — 119 files / 2,556 tests → 125 files / 2,729 tests, with the "measured/verified" dates refreshed to 2026-10-26 where the sentence carries one.
  - [x] **P1.T2.2:** `:1033` — coverage snapshot → statements 97.82 (5493/5615), branches 91.96 (1488/1618), functions 96.77 (1141/1179), lines 98.74 (5116/5181) across 125 files and 2,729 tests, verified 2026-10-26.
- [x] **P1.T3: Refresh docs/perf-baseline.md's count rows** — covers: FR-4
  - [x] **P1.T3.1:** header figure block and the `:411` Test-suite row — 118 files / 2,488 tests → 125 files / 2,729 tests, with the header's measured date refreshed; every boot/first-tap measurement, bundle figure, and precache figure stays byte-identical.
- [x] **P1.T4: Refresh the roadmap check date** — covers: FR-6
  - [x] **P1.T4.1:** `docs/roadmap.md:7` — "checked against the code on 2026-10-25" → "2026-10-26"; no entry content changes.

**Result:** verified

**Checkpoint:** c0d92eed

**Evidence:** conductor/tracks/20261026-docs-truth-pass/verification/phase-1.md

## Phase 2: Add the count-drift guard

- **Goal:** `scripts/validate-docs.js` derives the true suite numbers from one
  collect-only `vitest list` run and fails any living-doc claim that
  mismatches, with a message naming file → claimed vs derived; proven by a
  recorded mutation.
- **Depends on:** Phase 1
- **Covers:** FR-1, FR-7, NFR-1, NFR-2, NFR-3, AC-1, AC-2, AC-3 (partial)
- **Touches:** `scripts/validate-docs.js`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P2.T1: Implement `checkTestCounts`** - covers: FR-1, FR-7, NFR-1, NFR-2, NFR-3
  - [x] **P2.T1.1:** Spawn one collect-only `vitest list` (non-interactive; no watch; no test execution) via `child_process`, capture stdout, and derive the distinct test-file count (distinct source paths) and the total test-case count (lines matching the `path > suite > test` shape). Parse defensively: if the output yields zero files, fail with a clear derivation message rather than a false pass.
  - [x] **P2.T1.2:** Scan `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` for count claims with a pattern that matches `N tests` + `M files` pairs (and `M test files`) but cannot match unrelated prose (e.g. "22 games"). Every match must equal the derived truth or the check fails naming `file → claimed vs derived`. Only those three files are scanned.
  - [x] **P2.T1.3:** Register the check in the `checks` list so it reports in the standard results format, and confirm the full validator still exits 0 against the refreshed docs from Phase 1.
- [x] **P2.T2: Mutation proof** — covers: AC-2
  - [x] **P2.T2.1:** In the working tree (never committed), corrupt README's count to a wrong value, run `node scripts/validate-docs.js`, confirm exit ≠ 0 and the output names README with claimed vs derived; record the verbatim output in evidence; revert the corruption and confirm the validator is green again.
- [x] **P2.T3: Full verification** — covers: AC-1, AC-4
  - [x] **P2.T3.1:** Run the phase Verification chain exactly as written; record all eight exit codes in the evidence.

**Result:** verified

**Checkpoint:** 74a07e3a

**Evidence:** conductor/tracks/20261026-docs-truth-pass/verification/phase-2.md

## Phase R1: Review Fixes

- **Goal:** Resolve review findings F1 and F2 so the count guard has no
  phrasing hole and every current-state figure in perf-baseline carries an
  unambiguous date.
- **Depends on:** Phase 2
- **Covers:** F1, F2
- **Touches:** `scripts/validate-docs.js`, `docs/perf-baseline.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **R1.T1: Resolve F1 — guard the "N test cases" phrasing** — covers: F1
  - [ ] **R1.T1.1:** Add a third claim pattern `TEST_CASES_CLAIM_RE = /\b\d[\d,]*\s+test\s+cases\b/g` in `scripts/validate-docs.js` and check it against `truth.tests` in `checkTestCounts` alongside `TESTS_CLAIM_RE`; extend the mutation proof in the evidence with a "2,999 test cases" mutation (working tree only, reverted) proving the new pattern fails.
- [ ] **R1.T2: Resolve F2 — date the two refreshed perf-baseline rows** — covers: F2
  - [ ] **R1.T2.1:** Add one sentence directly under the "### Build figures (2026-10-22)" table in `docs/perf-baseline.md` stating that the Test-suite and Coverage rows were verified 2026-10-26 while the build figures above are the 2026-10-22 measurement. No other change.
