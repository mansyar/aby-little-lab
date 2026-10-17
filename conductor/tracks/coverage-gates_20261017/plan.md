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
- [x] Task 1.2: Cover ColorMatch (64%), OddOneOut / PopFreeze (71%),
  AnimalTrace (78%) uncovered branches — wrong-tap variants,
  replay/relaunch paths, guard clauses (RED → GREEN). [70a45e2, 266817d, c187622 + pop-freeze commit]
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Remaining scene branches + glue

- [x] Task 2.1: Cover AddItUp / TakeAway / DecodeIt (80–81%) plus the
  remaining ~80s scene files until global branches clear 85.5%. [d877148 — trio done; gate measurement 2026-10-17:
  lines 97.43% (≥95.5 ✓), branches 89.38% (≥85.5 ✓), functions 93.34%,
  statements 98.63% — goal met, no further scene work needed for the gate]
- [x] Task 2.0: Repair all tsc errors in test files (review follow-up —
  unblocks every gate run: 474 → 0, zero production changes, zero
  weakened assertions; tsc/vitest/check/build all green). [23a75ec]
- [x] Task 2.2: Cover `PreloadScene` dev-profiling branches (424–433) and
  `pwaBridge` update/offline branches (45–51). [d877148, 5c13e3e]
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Registry lines + lines top-up

- [x] Task 3.1: Cover the 20 `sceneRegistry` dynamic-import one-liners via
  `vi.mock` interception or stubbed-module invocation (no real Phaser in
  happy-dom). [54f52da — registry 100% stmts/branches/funcs/lines; full
  gate 1828/1828, lines 98.2%, branches 89.38%]
- [x] Task 3.2: If lines still lag 95.5%, cover flagged line gaps
  (NumberOrderScene, decodeLogic) until both numbers clear with margin.
  [SKIPPED as unneeded — lines 98.2% already clear 95.5% with margin]
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Gate green with margin

- [x] Task 4.1: Run the full `test:coverage` gate — lines ≥ 95.5%,
  branches ≥ 85.5% — plus full gates (`check`, suite, build, validators).
  [ALL GREEN 2026-10-17: coverage 1828/1828, lines 98.2%, branches 89.38%,
  funcs 97.62%, stmts 99.05%; check clean; CI suite 68 files/1828 tests;
  build ok; bundle validator PASS; PWA validator 15/15]
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Checkpoints

- Phase 1: `[checkpoint: e67e669]`
- Phase 2: `[checkpoint: a95fdd2]`
- Phase 3: `[checkpoint: 242d705]`
- Phase 4: `[checkpoint: 50813ec]`
- Track: `[checkpoint: 50813ec]`

## Verification Notes

- If a threshold is still red after Phases 1–3, STOP and triage — never
  lower a threshold or exclude a module to pass.
- If mocking dynamic imports proves unworkable, STOP and re-scope with the
  user (structural-verification fallback) rather than silently downgrading.
- Local full-suite 5s timeouts are environmental (documented); CI arbitrates.
