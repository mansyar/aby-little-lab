# Implementation Plan: Coverage-Gate Repair — Test the Untested Glue

> **Track:** `coverage-gates_20261017` · **Spec:** [spec.md](./spec.md) (Source of Truth)
> TDD-ordered per `conductor/workflow.md`: failing coverage first, then tests
> per module family, then the full gate. Commit style `<type>(<scope>): <desc>`
> with git-note task records.

## Phase 1 — Baseline + highest-deficit scenes

- [x] Task 1.1: Run `pnpm run test:coverage`, record the red baseline
  (1795/1795 green; lines 94.25%, branches 83.51%; deficit spread across
  ~15 scene files, glue suites already exist) in the checkpoint note.
  [baseline: /tmp/cov-baseline.log]
- [ ] Task 1.2: Cover ColorMatch (64%), OddOneOut / PopFreeze (71%),
  AnimalTrace (78%) uncovered branches — wrong-tap variants,
  replay/relaunch paths, guard clauses (RED → GREEN).
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Remaining scene branches + glue

- [ ] Task 2.1: Cover AddItUp / TakeAway / DecodeIt (80–81%) plus the
  remaining ~80s scene files until global branches clear 85.5%.
- [ ] Task 2.2: Cover `PreloadScene` dev-profiling branches (424–433) and
  `pwaBridge` update/offline branches (45–51).
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Registry lines + lines top-up

- [ ] Task 3.1: Cover the 20 `sceneRegistry` dynamic-import one-liners via
  `vi.mock` interception or stubbed-module invocation (no real Phaser in
happy-dom).
- [ ] Task 3.2: If lines still lag 95.5%, cover flagged line gaps
  (NumberOrderScene, decodeLogic) until both numbers clear with margin.
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
