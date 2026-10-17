# Specification: Coverage-Gate Repair — Test the Untested Glue

> **Track:** `coverage-gates_20261017` · **Type:** Chore (test coverage) · **Status:** new

## Overview

The global coverage gate (`test:coverage`: lines 95, statements 90,
functions 88, branches 85) has been red since August 2026 — no feature track
has owned it (documented in the 2026-08-28 tech-stack note). The October 17
baseline (1795/1795 green; lines 94.25%, branches 83.51%) shows the deficit
is spread across ~15 scene files at ~80% branches each — not concentrated in
glue (all glue suites now exist: registry 100% branches, preload 25%, bridge
71%). This track earns the missing branch coverage file-by-file so the gate
goes green with margin.

## Functional Requirements

- **FR-1 — Scene branch sweep (highest deficit first).** Cover the
  uncovered branches flagged in the baseline: ColorMatch (64%),
  OddOneOut / PopFreeze (71%), AnimalTrace (78%), AddItUp / TakeAway /
  DecodeIt (80–81%), then the remaining ~80s scene files — wrong-tap
  variants, replay/relaunch paths, guard clauses — until the global branch
  number clears 85.5%.
- **FR-2 — Glue branches.** `PreloadScene` dev-profiling branches (lines
  424–433), `pwaBridge` update/offline branches (lines 45–51), and any other
  glue branch the report flags.
- **FR-3 — Registry loader lines.** Cover the 20 dynamic-import one-liners
  (`sceneRegistry.ts` lines 12–31) via `vi.mock` module interception or
  per-loader invocation with stubbed scene modules — without pulling real
  Phaser scenes into happy-dom.
- **FR-4 — Lines top-up.** If lines (94.25% → need 95.5%) still lag after
  FR-1–FR-3, cover flagged line gaps (e.g. NumberOrderScene 44%, decodeLogic
  branches 56%) until both numbers clear with margin.

## Non-Functional Requirements

- Zero gameplay, asset, storage, or threshold-config changes.
- New tests run in the existing happy-dom suite within normal full-suite time.
- No test may weaken an existing assertion to pass.

## Acceptance Criteria

1. `pnpm run test:coverage` passes with margin: lines ≥ 95.5%,
   branches ≥ 85.5%, functions and statements at or above threshold.
2. Full gates green (`check`, full suite, build, both validators).
3. No coverage threshold value is lowered; no production behavior changes.

## Out of Scope

- Raising thresholds further (ratchet), visual/manual QA, release process.
- Refactoring the modules under test beyond what testability requires.
