# PR — 20261127-parent-help-overlay

## Summary

Add a static, offline, parent-gated, read-only Help overlay inside Settings: eight topics (parental lock, profiles/play-time, progress/adaptive, privacy, backup/restore, diagnostics, install/offline, updates) in a 2x4 menu with detail cards, a persistent header Help button on both Settings pages, and an additive null-safe E2E contract. Hub tile gestures gain modal-ownership and matching-press guards with a Settings-lifecycle correction; Help ships in its own synchronous `parent-help` chunk and joins the cross-engine smoke roster.

## Track

- **ID:** 20261127-parent-help-overlay
- **Type:** feature / medium
- **Spec:** `conductor/archive/20261127-parent-help-overlay/spec.md`
- **Plan:** `conductor/archive/20261127-parent-help-overlay/plan.md`
- **Review:** `conductor/archive/20261127-parent-help-overlay/review.md`
- **Pull request:** [#107](https://github.com/mansyar/aby-little-lab/pull/107)

## What happened

- Phase 1 `a8ec01d5`: Help content module + standalone overlay, 13/13 focused tests.
- Phase 2 `99ff5572`: Settings/E2E/Hub integration, gesture lifecycle + matching-press guards, four-engine Help journey.
- Phase 3 `d1db4cb1`: PRD §4.12, TDD, README, changelog, device-checklist truth sync.
- Phase R1 `d9f450d4`: review fixes F1 (shared gesture helper) + F2 (inert disabled controls).
- Integrated evidence `e7c7bf93`; review PASS rounds=2; acceptance `9fb8c01c`, `fb133942`.

## Requirements

All FR-1..FR-13, NFR-1..NFR-6, AC-1..AC-13 covered: entry/close/traversal on both pages; eight pinned topics; read-only boundaries (no storage/settings/download/audio/network/navigation side effects); 96x96 targets with wrapping; null-boundary controls; docs truth with historical records preserved and device/retention/longitudinal gaps explicit.

## Verification

Exact gate exit 0: Biome 385 files; app/E2E TypeScript clean; Vitest 162 files / 3492 tests; coverage 97.14/91.01/96.46/98.23; Vite 496 modules; shell `index-BDbRmAgr.js` 190.32 kB printed / 48.42 kB gzip (185.9 kB guard pass); parent-help 19.40 kB / 7.37 kB; module-size zero warnings; textures pass; PWA 16/0; docs 5/0. Four-engine Help journey 8/8 with unchanged saves and zero retries. Media capture pass (844x390 topics + backup detail). Whitespace clean.

![Parent Help topics](../../../.conductor/media/20261127-parent-help-overlay/parent-help-topics.png)

![Parent Help backup guidance](../../../.conductor/media/20261127-parent-help-overlay/parent-help-backup-restore.png)

## Review

Verdict PASS, 2 rounds. Round 1: PASS WITH FINDINGS (F1 shared-helper dedup, F2 inert disabled controls — both Low). Round 2: PASS, zero findings. No overrides, no accepted debt.

## Deviations and risks

- Executor shell denials: primary ran every exact command unchanged; recorded as process history.
- Test-only repairs (matcher assertions, tap simulations, E2E nullability, zero-listener assertion) — no production behavior change.
- Gesture guards + `e2eOpen()` lifecycle + parent-help chunk + roster inclusion — the product fix, all covered by tests and the 8/8 journey.
- One user-directed commit rides the branch (reviewer-model pin `c45954ad`); outside product scope.
- Risk: low. Hub tile activation now requires a matching press; covered by unit + journey tests in all four engines.

## Follow-ups

- None. RM-7 retires with this track. RM-8 (narration pace), RM-9 (Repeat Machine), RM-10 (sticker album) remain independent `Later` ideas.

## Rollback

Revert the feature checkpoints in reverse order (squash commits `d9f450d4` R1, `d1db4cb1` Phase 3 docs, `99ff5572` Phase 2, `a8ec01d5` Phase 1), e.g. `git revert --no-edit d9f450d4 d1db4cb1 99ff5572 a8ec01d5`. Never move or recreate a published tag; this track publishes none.
