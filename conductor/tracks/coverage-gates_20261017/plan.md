# Implementation Plan: Coverage-Gate Repair — Test the Untested Glue

> **Track:** `coverage-gates_20261017` · **Spec:** [spec.md](./spec.md) (Source of Truth)
> TDD-ordered per `conductor/workflow.md`: failing coverage first, then tests
> per module family, then the full gate. Commit style `<type>(<scope>): <desc>`
> with git-note task records.

## Phase 1 — Baseline + registry loaders

- [~] Task 1.1: Run `pnpm run test:coverage`, record the red baseline
  (per-module lines/branches for the FR-1–FR-4 targets) in the checkpoint note.
- [ ] Task 1.2: Write `sceneRegistry` loader tests with mocked dynamic
  imports — `ensureSceneLoaded` success, failure, concurrent-call dedup —
  plus registry key completeness (RED → GREEN).
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Preload flow

- [ ] Task 2.1: Write `PreloadScene` raster / texture-registration tests
  with mocked loader primitives, including error paths (RED → GREEN).
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Bridge paths + near-miss sweep

- [ ] Task 3.1: Write `pwaBridge` / `PwaToast` tests — install prompt,
  update flow, controller change — with mocked service-worker globals
  (RED → GREEN).
- [ ] Task 3.2: Sweep every module the baseline flags under 90% lines to
  ≥ 90% (tests only, no refactors).
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Gate green with margin

- [ ] Task 4.1: Run the full `test:coverage` gate — lines ≥ 95.5%,
  branches ≥ 85.5% — plus full gates (`check`, suite, build, validators).
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Checkpoints

- Phase 1: `[checkpoint: pending]`
- Phase 2: `[checkpoint: pending]`
- Phase 3: `[checkpoint: pending]`
- Phase 4: `[checkpoint: pending]`
- Track: `[checkpoint: pending]`

## Verification Notes

- If a threshold is still red after Phases 1–3, STOP and triage — never
  lower a threshold or exclude a module to pass.
- If mocking dynamic imports proves unworkable, STOP and re-scope with the
  user (structural-verification fallback) rather than silently downgrading.
- Local full-suite 5s timeouts are environmental (documented); CI arbitrates.
