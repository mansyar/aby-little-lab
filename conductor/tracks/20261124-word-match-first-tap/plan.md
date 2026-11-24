# Reduce Find the Word cold first-tap latency — Implementation Plan

> **Branch:** `fix/20261124-word-match-first-tap`
> **Base:** `chore/20261124-first-tap-p95-baseline` @ `537c2351`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Selective preload implementation

- **Goal:** Find the Word queues only the letters and prompt assets its deterministic six-round run can draw, with seeded gameplay and adaptive behavior unchanged.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, FR-4, NFR-1, NFR-2, NFR-3, NFR-4, NFR-5, NFR-6, AC-1, AC-2, AC-3, AC-4
- **Touches:** `src/game/wordMatchArt.ts` (new), `src/scenes/WordMatchScene.ts`, `src/__tests__/game/wordMatchArt.test.ts` (new), `src/__tests__/scenes/wordMatchScene.test.ts`, `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` (count-only only), `conductor/tracks/20261124-word-match-first-tap/verification/phase-1.md`
- **Verification:** `pnpm exec vitest run src/__tests__/game/wordMatchArt.test.ts src/__tests__/scenes/wordMatchScene.test.ts`, `pnpm check`, `pnpm typecheck`, `pnpm test -- --run`, `pnpm test:coverage`, `pnpm build`, `node scripts/validate-bundle.js`, `node scripts/validate-module-size.js`, `node scripts/validate-textures.js`, `node scripts/validate-pwa.js`, `node scripts/validate-docs.js`, then the full `verify_phase` chain on the final tree.
- **Status:** verified

- [x] **P1.T1: Add a pure Find the Word art selector** — covers: FR-2, FR-4, AC-1
  - [x] **P1.T1.1:** Accept the selected word rounds and return only the letter group plus prompt assets referenced by those rounds.
  - [x] **P1.T1.2:** Deduplicate keys, preserve deterministic group/asset order, and keep the helper free of Phaser, storage, DOM and network dependencies.
- [x] **P1.T2: Integrate selective preload into WordMatchScene** — covers: FR-1, FR-2, FR-3, AC-2, AC-3
  - [x] **P1.T2.1:** Generate the playthrough before art selection using the existing RNG and adaptive-band inputs, preserving the exact seeded sequence.
  - [x] **P1.T2.2:** Queue only the selected art in `preload()` and reuse the generated rounds in `create()` without generating them twice.
- [x] **P1.T3: Add deterministic regression coverage** — covers: FR-1, FR-3, FR-4, AC-1, AC-2, AC-3, AC-4
  - [x] **P1.T3.1:** Test the pure selector for exact keys, deduplication, order, adaptive `+1` prompt coverage and no unused groups.
  - [x] **P1.T3.2:** Spy on scene preload to prove full unused groups are not queued, and pin identical seeded rounds, prompts, choices, completion and save behavior.

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261124-word-match-first-tap/verification/phase-1.md
-->

**Result:** verified
**Checkpoint:** 4ead5e0d
**Evidence:** conductor/tracks/20261124-word-match-first-tap/verification/phase-1.md

## Phase 2: Headed performance proof

- **Goal:** A fresh headed 50-cold five-game run proves Find the Word p95 and worst are ≤400 ms and no other measured game regresses beyond the existing gate.
- **Depends on:** Phase 1
- **Covers:** FR-5, NFR-3, NFR-6, AC-5, AC-8
- **Touches:** `conductor/tracks/20261124-word-match-first-tap/verification/phase-2.md`, `conductor/tracks/20261124-word-match-first-tap/verification/first-tap-word-match.json` (new)
- **Verification:** `node --version`, `pnpm exec playwright --version`, `TAP_HEADED=1 TAP_INERT_IDLE=1 node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10`, `pnpm check`, `pnpm typecheck`, `pnpm test -- --run`, `pnpm test:coverage`, `pnpm build`, `node scripts/validate-bundle.js`, `node scripts/validate-module-size.js`, `node scripts/validate-textures.js`, `node scripts/validate-pwa.js`, `node scripts/validate-docs.js`, then the full `verify_phase` chain on the final tree.
- **Status:** in_progress

- [ ] **P2.T1: Confirm the headed environment** — covers: FR-5, NFR-6, AC-8
  - [ ] **P2.T1.1:** Record Node and Playwright versions, confirm an interactive display session and free port 4173; block on unavailable headed Chromium or preview.
- [ ] **P2.T2: Execute the headed 50-cold run** — covers: FR-5, AC-5, AC-8
  - [ ] **P2.T2.1:** Run the exact cold-control headed command and capture raw stdout as `verification/first-tap-word-match.json`.
  - [ ] **P2.T2.2:** Prove 50 cold samples, 10 per game, five per-game p95 rows, Find the Word p95 and worst ≤400 ms, all other worst values ≤400 ms, and exit code 0.
- [ ] **P2.T3: Record performance evidence** — covers: FR-5, AC-5, AC-8
  - [ ] **P2.T3.1:** Write `verification/phase-2.md` with exact command, environment, raw numbers, scope audit and a blocking verdict if the gate fails.

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261124-word-match-first-tap/verification/phase-2.md
-->

## Phase 3: Baseline publication and integrated gate

- **Goal:** The live performance baseline publishes the passing headed result and the final tree passes the complete configured gate with a clean scope audit.
- **Depends on:** Phase 2
- **Covers:** FR-6, FR-7, NFR-1, NFR-2, NFR-3, NFR-5, AC-4, AC-6, AC-7
- **Touches:** `docs/perf-baseline.md`, `README.md`, `docs/TDD.md` (count-only only), `conductor/tracks/20261124-word-match-first-tap/verification/phase-3.md`, `conductor/tracks/20261124-word-match-first-tap/verification/integrated.md`
- **Verification:** `node scripts/validate-docs.js`, `pnpm check`, `pnpm typecheck`, `pnpm test -- --run`, `pnpm test:coverage`, `pnpm build`, `node scripts/validate-bundle.js`, `node scripts/validate-module-size.js`, `node scripts/validate-textures.js`, `node scripts/validate-pwa.js`, then the full `verify_phase` chain once on the final tree.
- **Status:** pending

- [ ] **P3.T1: Publish the passing dated baseline** — covers: FR-6, AC-7
  - [ ] **P3.T1.1:** Update the live `docs/perf-baseline.md` section with the 2026-11-24 headed result, exact command, sample count, target set and per-game p95 table.
  - [ ] **P3.T1.2:** Link the raw JSON evidence and retain the per-release first-tap refresh procedure.
- [ ] **P3.T2: Audit scope and record the integrated gate** — covers: FR-7, NFR-1, NFR-2, NFR-3, NFR-5, AC-4, AC-6
  - [ ] **P3.T2.1:** Prove package/lock are unchanged and production source changes are limited to the approved Find the Word scene/helper paths.
  - [ ] **P3.T2.2:** Run the full `verify_phase` chain on the final tree and write `verification/integrated.md` with the exact results.

<!--
Review fixes are appended by `conductor-review` as:

## Phase R1: Review Fixes

- **Goal:** Resolve review findings ...
- **Depends on:** Phase 3
- **Covers:** review findings
- **Touches:** ...
- **Verification:** ...
- **Status:** pending

- [ ] **R1.T1: Resolve <finding ID>** — covers: <finding ID>
-->
