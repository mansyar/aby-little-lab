# Specification: Coverage-Gate Repair — Test the Untested Glue

> **Track:** `coverage-gates_20261017` · **Type:** Chore (test coverage) · **Status:** new

## Overview

The global coverage gate (`test:coverage`: lines 95, statements 90,
functions 88, branches 85) has been red since August 2026 on untested glue
code — no feature track has owned it (documented in the 2026-08-28
tech-stack note: lines 94.2% / branches 82.14%, driven by `sceneRegistry`
21.73% lines / 12.19% functions, `PreloadScene` 77.77% lines,
`pwaBridge`/`PwaToast` ~87% lines). This track earns the missing coverage
with real tests so the gate goes green with margin.

## Functional Requirements

- **FR-1 — Registry loader tests.** Mock dynamic scene imports to exercise
  `ensureSceneLoaded` end-to-end: successful load, load failure, and
  concurrent-call dedup (if present). Assert registry key completeness
  against the shipped scenes.
- **FR-2 — Preload tests.** Cover the `PreloadScene` raster and
  texture-registration flow with mocked loader primitives, including error
  paths.
- **FR-3 — Bridge tests.** Cover the install-prompt, update-flow, and
  controller-change paths of `pwaBridge` / `PwaToast` with mocked
  service-worker globals.
- **FR-4 — Near-miss sweep.** Any module the baseline report flags under
  90% lines gets tests to ≥ 90%. No drive-by refactors of covered code.

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
