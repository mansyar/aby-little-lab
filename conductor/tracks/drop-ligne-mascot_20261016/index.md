# Track: Drop Ligne Engine — Tween/SVG-Only Mascot

**ID:** `drop-ligne-mascot_20261016` · **Type:** Chore · **Status:** new · **Branch:** `chore/drop-ligne-mascot`
**Created:** 2026-10-16 · **Depends on:** `release-1.18.0_20261016` (archived)

- **Spec:** [./spec.md](./spec.md) — Source of Truth for scope
- **Plan:** [./plan.md](./plan.md) — Execution roadmap (TDD phases, checkpoints)
- **Metadata:** [./metadata.json](./metadata.json)
- **Workflow:** [../../workflow.md](../../workflow.md) — Process

## Goal

Delete the Ligne WASM animation engine (~1.74 MB raw / ~545 KB gzip, ~50% of
the precache) and make the tween-over-SVG-poses mascot the only Professor
Hoot: engine + deps + dual-path code removed, `curious()` tilt-hop and
`flapGreeting()` wave-hop added, validators and docs swept, precache halved.

## Progress

Tracked in [./plan.md](./plan.md) — phases 1–4 with `[ ]` task boxes, updated
per task via `conductor(plan): update track progress`.
