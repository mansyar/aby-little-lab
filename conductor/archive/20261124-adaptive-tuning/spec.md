# Adaptive Tuning — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

This track closes the last Phase 4 depth item: it replaces the hand-picked
adaptive difficulty thresholds with values derived from a deterministic,
seeded simulation of preschool answer streams, and it gives parents a
per-game band readout in the existing Learning Progress overlay. The result
is an adaptive system whose thresholds are evidenced by a machine-checkable
"designed curve" (70% of simulated profiles stay at the classic band, 15% step
down, 15% step up, each ±10 percentage points) rather than asserted, without
changing the rolling-window mechanics, the save schema, or anything a child
sees. It is shipped with replay novelty in the v1.26.0 release.

## Problem / Motivation

`src/game/adaptiveLogic.ts` ships `UP_THRESHOLD = 0.9` and
`DOWN_THRESHOLD = 0.6` with `WINDOW_SIZE = 10`, `MIN_SAMPLE = 6` and the
`[1, 1, 2, 2, 3, 3]` ladder. Twenty-two games sample `getAdaptiveBandShift()`;
those numbers decide whether a child's game gets easier or harder over days,
yet no record explains why those two cut points were chosen. The roadmap
(`conductor/product.md` §10.5, `20261208-adaptive-tuning`) asks to "retune the
bands against Phase 2 data" with exit gate "band distribution matches the
designed curve" — but this is an offline, family-only app with no aggregate
Phase 2 dataset, and no designed-curve artifact exists. Left unresolved, the
thresholds are unfalsifiable and the roadmap exit gate cannot be met. A parent
also cannot see which band a game is currently serving; the Overview carries
only a static "difficulty adapts" note.

## Goals & Success Metrics

- **Goal:** Make the adaptive thresholds evidence-backed and verifiable, and
  expose the resulting band to parents without touching child-facing behaviour.
- **Metric:** A seeded simulation of ≥1,000 simulated profiles produces a
  band-shift distribution of ≈70% at shift 0, 15% at −1 and 15% at +1 (each
  ±10 percentage points) with the tuned thresholds; the full `verify_phase`
  gate stays green and no child-facing or save-schema change ships.

## Scope

### In Scope

- A deterministic seeded simulation of realistic 3–5-year-old answer streams
  and a band-shift distribution calculator, as pure logic with injectable RNG.
- A documented designed curve (target distribution + tolerance) and a
  machine-checkable assertion that the tuned thresholds meet it.
- Retuning `UP_THRESHOLD` and `DOWN_THRESHOLD` only; `WINDOW_SIZE` and
  `MIN_SAMPLE` stay fixed at 10 and 6.
- A parent-facing per-game band readout in the Learning Progress stats row,
  derived from the **viewed** profile's `recent` window and honoring the
  adaptive on/off setting.
- Full doc sync: PRD §4.8, TDD §7.3, the product roadmap row, and living
  test-count claims.

### Out of Scope

- Changing `WINDOW_SIZE`, `MIN_SAMPLE`, `BASE_LADDER`, or any game's own band
  ladder / tier-split formula.
- Any new game, scene, rule, `GameId`, art, audio, TTS, or input mode.
- Save-schema changes, new dependencies, or new services (everything stays
  local and offline).
- New child-facing text or any change to a game's child UI.
- Aggregate data collection, telemetry, or network calls.
- A second locale, keyboard/switch input, or OS zoom (Phase 3 decisions stand).

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | A designed band-shift distribution is defined and documented: 70% of simulated profiles at shift 0, 15% at −1, 15% at +1, each with ±10 percentage-point tolerance. | must |
| FR-2 | A deterministic seeded simulation models realistic per-profile answer streams and computes the −1/0/+1 band-shift distribution for a given pair of thresholds; it uses an injectable RNG and no production behaviour. | must |
| FR-3 | `UP_THRESHOLD` and `DOWN_THRESHOLD` in `src/game/adaptiveLogic.ts` are set to the values the simulation shows meet FR-1; `WINDOW_SIZE` and `MIN_SAMPLE` remain 10 and 6. | must |
| FR-4 | `bandShiftFor` keeps its contract — 0 below `MIN_SAMPLE`, +1 at/above the up threshold, −1 below the down threshold, else 0 — and a simulation assertion proves the tuned distribution meets FR-1. | must |
| FR-5 | A parent-only per-game band readout appears in the Learning Progress stats row, derived from the **viewed** profile's `recent` window via `bandShiftFor` and returning 0 when adaptive difficulty is off; child-facing UIs are untouched. | must |
| FR-6 | All count-bearing and behaviour-bearing docs (PRD §4.8, TDD §7.3, product roadmap row, living test counts) are synced with the shipped tuned values and readout. | must |
| FR-7 | The full configured `verify_phase` gate is green on the final tree. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No new runtime dependency or service; the simulation is pure TypeScript logic with an injectable RNG, consistent with the project's seeded-RNG testing pattern. |
| NFR-2 | No save-schema, game-rule, scene, or child-facing change; parent text lives only inside the parent-gated Progress overlay. |
| NFR-3 | Production modules stay within the 400-line budget (`validate-module-size.js` green) and `validate-docs.js` stays 5/5. |
| NFR-4 | At the classic band (shift 0) every game's playthrough stays byte-identical; existing golden/byte-identity tests remain green. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | The designed curve and its ±10-point tolerance are recorded in the spec and mirrored in TDD §7.3 / PRD §4.8. | FR-1 |
| AC-2 | A seeded simulation of ≥1,000 profiles is deterministic (same seed → same distribution) and exposes a distribution calculator that imports the real `bandShiftFor`. | FR-2, NFR-1 |
| AC-3 | With tuned thresholds applied, the simulated −1/0/+1 distribution falls inside the FR-1 target ranges; `WINDOW_SIZE=10` and `MIN_SAMPLE=6` are unchanged. | FR-3, FR-4 |
| AC-4 | All existing `bandShiftFor` / `getAdaptiveBandShift` tests pass, plus new boundary tests at the tuned up/down cut points. | FR-4 |
| AC-5 | Shift-0 golden/byte-identity tests remain green for every game whose playthrough is built from the base ladder or a classic tier split. | NFR-4 |
| AC-6 | The Learning Progress row shows a band indicator for the viewed profile that matches `bandShiftFor(viewedProfile.progress[gameId].recent)`, shows 0 when adaptive is off, and adds no text to any child scene. | FR-5, NFR-2 |
| AC-7 | `node scripts/validate-docs.js` is 5/5 and the roadmap row is marked Done with the track id; no stale test-count or threshold claim remains. | FR-6, NFR-3 |
| AC-8 | The full `verify_phase` chain passes on the final tree, including bundle, module-size, texture, PWA and docs guards. | FR-7, NFR-3 |

## Edge Cases

- **Adaptive disabled:** `getAdaptiveBandShift()` returns 0; the parent readout must likewise show the classic band (0) regardless of the viewed profile's window.
- **Thin window:** a profile with fewer than `MIN_SAMPLE` (6) taps yields shift 0 and no misleading "strongest/hardest" style claim.
- **Viewed vs active profile:** the Progress overlay can view a profile other than the active one; deriving the band from `getAdaptiveBandShift()` would read the wrong profile — the readout must use `bandShiftFor(viewedProfile.progress[gameId].recent)` and the adaptive toggle explicitly.
- **Exact threshold boundary:** accuracy exactly equal to the up threshold shifts up; accuracy exactly equal to the down threshold stays at 0 (below the down threshold shifts down).
- **Degenerate RNG in simulation:** a const/degenerate RNG must not produce a division-by-zero or NaN distribution; the simulator guards denominators and is seed-reproducible.
- **Module budget:** `ProgressOverlay.ts` is already near the 400-line limit; adding the readout must not push any production module over the budget (extract a helper if needed).

## Dependencies

- **Tracks:** none. `20261124-replay-novelty` and `20261121-content-depth` are already merged and complete; this track ships alongside replay novelty in v1.26.0 but does not depend on their code.
- **External:** none.

## Open Questions & Assumptions

- **Assumption:** "Phase 2 data" means the per-profile answer data the Overview already surfaces; no aggregate dataset exists in a family-only offline app, so the simulation models realistic 3–5yo answer streams rather than replaying stored records.
- **Assumption:** "Designed curve" is the band-shift distribution target defined in FR-1; it is authored by this track because no such artifact existed.
- **Assumption:** Only the two thresholds are tunable (owner decision 2026-11-24); `WINDOW_SIZE` and `MIN_SAMPLE` are fixed to protect the documented 10-tap insights floor.
- **Assumption:** The answer-stream model (latent accuracy per simulated profile, seeded) is a design choice of the implementation phase, recorded in evidence; it need not match any real child exactly, only plausibly span struggling / typical / thriving profiles.
- **Assumption:** "Optional parent view" is in scope (owner decision 2026-11-24) and lives on the existing per-game Learning Progress row.

## References

- `conductor/product.md` §10.5 (`20261208-adaptive-tuning`) and §10.8 (sequence).
- `src/game/adaptiveLogic.ts` — shipped constants and pure helpers.
- `docs/TDD.md` §7.3 Adaptive banding; `docs/PRD.md` §4.8 Adaptive difficulty.
- `src/game/insightsSummary.ts` — local, per-profile answer data (the only "Phase 2 data").
- `src/components/settings/ProgressOverlay.ts` — parent Learning Progress overlay and per-game stats row.
- `src/utils/storagePlay.ts` — `getAdaptiveBandShift()` and the adaptive on/off rule.
