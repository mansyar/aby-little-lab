# Track: Coverage-Gate Repair — Test the Untested Glue

**ID:** `coverage-gates_20261017` · **Type:** Chore · **Status:** done · **Branch:** `chore/coverage-gates`
**Created:** 2026-10-17 · **Depends on:** `drop-ligne-mascot_20261016`

- **Spec:** [./spec.md](./spec.md) — Source of Truth for scope
- **Plan:** [./plan.md](./plan.md) — Execution roadmap (TDD phases, checkpoints)
- **Metadata:** [./metadata.json](./metadata.json)
- **Workflow:** [../../workflow.md](../../workflow.md) — Process

## Goal

Turn the since-August global coverage gate green with margin by testing the
untested glue: mocked-import `sceneRegistry` loader tests, `PreloadScene`
raster-flow tests, `pwaBridge`/`PwaToast` path tests, plus a <90% near-miss
sweep — no threshold changes, no production behavior changes.

## Progress

Tracked in [./plan.md](./plan.md) — phases 1–4 with `[ ]` task boxes, updated
per task via `conductor(plan): update track progress`.
