# Track: Gameplay Hitbox Fixes + Art Readability Pass

**ID:** `gameplay-and-art-pass_20261019` · **Type:** Bug fix + art polish · **Status:** new · **Branch:** `feature/gameplay-and-art-pass`
**Created:** 2026-10-19 · **Depends on:** none

- **Spec:** [./spec.md](./spec.md) — Source of Truth for scope
- **Plan:** [./plan.md](./plan.md) — Execution roadmap (TDD phases, checkpoints)
- **Metadata:** [./metadata.json](./metadata.json)
- **Workflow:** [../../workflow.md](../../workflow.md) — Process

## Goal

Fix three confirmed gameplay defects — Memory Match cards rendering at native
256 px inside a 120–150 px grid, Number Order's hit area shifted one half-card
up-left, and the shared snap tween overshooting its slot — and repair the art
that fails to read: the cat (currently the rabbit's face with leaf ears), the
near-invisible bone, the patchy ball, the face-shaped map, the ambiguous freeze
tile and the dog-like monkey. Regenerate the stale contact sheets and document
the style system so the next asset cannot drift.

## Progress

Tracked in [./plan.md](./plan.md) — phases 1–6 with `[ ]` task boxes, updated
per task via `conductor(plan): update track progress`.
