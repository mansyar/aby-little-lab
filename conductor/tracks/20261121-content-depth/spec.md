# Content Depth — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Expand the four thin content pools behind the word, story, emotion-scenario and
shape games, add two signature content variants per pool, make the art budget
machine-checkable, and sync every count-bearing doc. This delivers the first
player-visible Phase 4 work after v1.24.0 without new games, rules, scenes or
input models.

## Problem / Motivation

v1.24.0 shipped 24 games and reliability tooling, but pools remain shallow:
28 words, 15 stories, 32 scenarios (8 per emotion), 18 shapes. Kids see repeats
within playthroughs, and the roadmap's exit gate "no pool repeats within a
session; art-chunk budget held" is not machine-checkable. The texture figure is
39 MiB typical / 178 MiB full tiered, and `src/game/hub/prewarm.ts` is already
693 lines, so growth must be budgeted. Without this, retention is optimised
against a noisy proxy and content debt accumulates.

## Goals & Success Metrics

- **Goal:** at least double each pool while holding texture and shell budgets.
- **Metric:** words ≥60, stories ≥30, scenarios ≥48 (12 per emotion), shapes ≥24;
  two content variants per pool; zero repeats per playthrough; typical ≤39 MiB,
  full ≤178 MiB, shell entry ≤200 kB; `node scripts/validate-docs.js` 5/5.

## Scope

### In Scope

- Four pool expansions (words, stories, scenarios, shapes).
- Two signature themed/subset content variants per pool reusing existing rules.
- No-repeat playthrough scheduling preserved and proven.
- `scripts/validate-textures.js` art-budget guard wired into `verify_phase`.
- Full doc truth-pass across count-bearing docs.
- Tests for counts, tiers, variants and budgets.

### Out of Scope

- New games, scenes, game rules or `GameId` changes.
- i18n / second locale / RTL.
- Keyboard/switch input or OS zoom.
- Store packaging / TWA / Capacitor.
- `docs/changelog.md` split (P6 item).
- Dependency upgrades; new external assets/services/licences; runtime AI content.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | `WORD_POOL` grows from 28 to ≥60, preserving 3-/4-letter tiers and confusable-family guards | must |
| FR-2 | `STORY_POOL` grows from 15 to ≥30, preserving the `OBVIOUS_POOL`/`SUBTLE_POOL` ladder | must |
| FR-3 | `SCENARIO_POOL` grows from 32 to ≥48 with 12 per emotion and the safe-content guard intact | must |
| FR-4 | `ALL_SHAPES` grows from 18 to ≥24, preserving `EASY_SHAPE_POOL`/`HARD_SHAPE_POOL` | must |
| FR-5 | Each of the four pools exposes two signature themed/subset content variants without changing game rules | must |
| FR-6 | Each game schedules its expanded pool with no repeats within a playthrough, including under degenerate RNG | must |
| FR-7 | A machine-checkable art budget guard exists and runs in `verify_phase`; it fails above 39 MiB typical / 178 MiB full | must |
| FR-8 | All count-bearing docs (`product.md`, PRD, TDD, README, `perf-baseline.md`) match the shipped pools and budget gate | must |
| FR-9 | Changes stay within pool data, variant selection, no-repeat scheduling, budget guard and docs — no rules, scenes, `GameId`, i18n or input changes | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | New art reuses existing SVGs where possible; any new keys are sized through `textureTiers.ts`; typical ≤39 MiB, full ≤178 MiB, shell ≤200 kB |
| NFR-2 | Content remains gentle, textless and age-appropriate; existing safe-content and tier ladders are preserved |
| NFR-3 | RNG remains injectable/deterministic; budget and pool tests are repeatable |
| NFR-4 | `node scripts/validate-docs.js` passes with all links, anchors and living test counts green |
| NFR-5 | No new runtime dependencies, licences or external services; any new art has a traceable right |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | Test asserts `WORD_POOL.length ≥ 60` and tier/confusable invariants | FR-1 |
| AC-2 | Test asserts `STORY_POOL.length ≥ 30` and obvious/subtle ladder intact | FR-2 |
| AC-3 | Test asserts `SCENARIO_POOL.length ≥ 48`, 12 per emotion, safe-content guard intact | FR-3 |
| AC-4 | Test asserts `ALL_SHAPES.length ≥ 24` and easy/hard partition intact | FR-4 |
| AC-5 | Tests assert two variants per pool and that variant selection does not alter rule logic | FR-5 |
| AC-6 | Seeded-RNG tests assert no repeated item per playthrough in all four games | FR-6 |
| AC-7 | `node scripts/validate-textures.js` passes on real assets and fails a synthetic over-budget fixture; it is in `verify_phase` | FR-7 |
| AC-8 | Validator 5/5 green; count-bearing docs and product roadmap exit gate updated | FR-8 |
| AC-9 | Diff contains no `src/scenes/`, `GameId`, i18n or input changes; full `verify_phase` green | FR-9 |

## Edge Cases

- Degenerate/constant RNG; tier exhaustion.
- Word confusable families; emotion imbalance.
- Old saves with existing item IDs.
- Texture key missing or mistiered; budget just over threshold.
- Docs count drift; preload count increase; low-memory devices.

## Dependencies

- **Tracks:** none (`v1.24.0` merged, P3 closed).
- **External:** none.

## Open Questions & Assumptions

- **Question:** none — all four decision rounds answered.
- **Assumption:** floors (60/30/48/24) not exact targets; art reuse + tiering;
  "session" means per playthrough; two variants mean content subsets, not new
  rules; full doc sync; P6 changelog split stays out.
- **Gap:** `conductor/product.md` has no "Open Questions & Assumptions" section
  (pre-existing project gap, not introduced by this track).

## References

- `conductor/product.md` §10.5 / §10.8 / §10.9.
- `docs/perf-baseline.md:206` (39 MiB typical / 178 MiB full).
- `docs/TDD.md:414` (262 art files, 195 texture keys).
- `src/game/wordLogic.ts`, `src/game/storyOrderLogic.ts`,
  `src/game/feelingsFacesLogic.ts`, `src/game/shapeSorterLogic.ts`.
- `src/utils/textureTiers.ts`; `scripts/validate-bundle.js`.
