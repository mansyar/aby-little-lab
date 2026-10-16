# Track: Adaptive Difficulty — Remaining Games (Pattern Builder, Odd One Out, Color Match)

**ID:** `adaptive-remaining-games_20260828` · **Type:** Feature · **Status:** complete · **Branch:** `feature/adaptive-remaining-games`
**Created:** 2026-08-28

- **Spec:** [./spec.md](./spec.md) — Source of Truth for scope
- **Plan:** [./plan.md](./plan.md) — Execution roadmap (TDD, checkpoints)
- **Workflow:** [../../workflow.md](../../workflow.md) — Process

## Goal

Extend the established ±1 adaptive band ladder (shared `adaptiveLogic.ts` helpers + `getAdaptiveBandShift(gameId)`) to the final three fixed-difficulty games — Pattern Builder, Odd One Out, and Color Match — completing adaptive coverage across all 20 games. Shift 0 must serve the classic ladder each game serves today; no-fail design, easy-first ladders, and parent-gated Settings toggle behavior are unchanged.

## Progress

Tracked in [./plan.md](./plan.md) — phases 1–4 with `[ ]` task boxes, updated per task via `conductor(plan): update track progress`.
