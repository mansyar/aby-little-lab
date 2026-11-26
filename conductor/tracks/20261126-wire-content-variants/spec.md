# Wire the four signature content variants into real playthroughs — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Ship the four signature content variant sets — `animals-and-food` and
`everyday-objects` words, `growing-things` and `everyday-changes` stories, `curvy`
and `angular` shapes, and `outdoors-and-play` and `home-and-friends` scenarios —
into real playthroughs. The
variant tables already exist as pure data with selectors, but no production
gameplay code imports them, so children always see the classic pools. This track
wires a per-playthrough variant choice into the four rule generators and the
four scenes that call them, with a full-pool fallback wherever a thin variant
cannot satisfy the existing playthrough guarantees.

## Problem / Motivation

`docs/release-notes-v1.25.0.md` described the variants as opt-in, but nothing in
the shipped play path ever opts in: the four `*Variants.ts` modules are imported
only by their own tests. The deeper pools from Phase 4 are therefore invisible
to children, and the "no more games before deeper pools" stance in
`docs/PRD.md` §10.10 has no payoff. Without this work, the variant data is dead
weight and a future 25th game would ship on top of shallow content. This track
is the depth work that realises the content already paid for.

## Goals & Success Metrics

- **Goal:** Each of the four signature games draws from both of its variants
  across repeated playthroughs without changing round counts, tier order,
  adaptive bands, scoring, completion, or no-repeat guarantees.
- **Metric:** Seeded tests prove both variants are reachable in all four games,
  the full configured verification gate exits 0, and no new asset, schema,
  storage, dependency, or persisted setting is introduced.

## Scope

### In Scope

- A pure variant selector in `src/game/contentVariants.ts` that chooses one of
  two named slide ids from an injected RNG with no state.
- An optional variant id on `generateWordPlaythrough`, `buildPlaythrough`,
  `generatePlaythrough`, and `drawScenarios`, using the variant's pool when it
  preserves the game's guarantees and falling back to the full classic pool
  otherwise. `generateWordBuildPlaythrough` has no in-scope caller and is not
  changed.
- Per-playthrough 50/50 variant selection in `WordMatchScene`,
  `StoryOrderScene`, `ShapeSorterScene`, and `FeelingsFacesScene`, passed
  through to the generator with no UI or persistence.
- Unit and invariant tests for both slides, thin-pool fallback, no-variant
  defaults, tier/shift behavior, unique shapes, and one-per-emotion draws.
- Updates to `docs/PRD.md`, `docs/TDD.md`, and `docs/changelog.md`; the
  v1.25.0 release note stays historical and unchanged.

### Out of Scope

- New settings rows, parent UI, persisted preferences, storage, schema, or
  profile changes.
- New assets, textures, audio, fonts, dependencies, or service/API calls.
- New games, game id changes, hub groups, or changing the 24-game count.
- Changes to round counts, tier ladders, adaptive bands, scoring, completion,
  or existing no-repeat invariants.
- Refactors beyond the four generators, the four scenes, and their tests.
- Contacting families, reading exports, creating `.conductor/evidence/`, or
  committing any PII.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | A pure selector chooses one of the two named variant slide ids from an injected RNG with a 50/50 distribution and no retained state. | must |
| FR-2 | `generateWordPlaythrough` accepts an optional variant id and uses that word pool while preserving the 3-letter/4-letter tier split, the adaptive shift, and no repeats within a run; it falls back to the full classic pool when the variant cannot satisfy the draw. | must |
| FR-3 | The story-order generator accepts an optional variant id and uses that pool while preserving the obvious/subtle mix for the active shift and no repeats; `growing-things` falls back to the full classic pool because its obvious pool has only two stories. | must |
| FR-4 | The shape-sorter generator accepts an optional variant id and uses that pool while preserving three unique shapes per round and no repeats across the run; `curvy` falls back to the full classic pool because eight shapes cannot fill a three-round, nine-shape run. | must |
| FR-5 | The feelings-faces generator accepts an optional variant id and uses that pool while preserving one scenario per emotion and no repeats. | must |
| FR-6 | WordMatch, StoryOrder, ShapeSorter, and FeelingsFaces each select a slide per playthrough with the existing RNG and pass it to the generator, with no UI or persisted setting. | must |
| FR-7 | Existing callers that supply no variant keep the exact prior behavior for a seeded RNG; defaults and public signatures remain backward compatible. | must |
| FR-8 | Tests cover both slides per game, fallback paths, and the preserved invariants, using seeded RNGs. | must |
| FR-9 | PRD, TDD, and changelog describe the wiring and fallback; the v1.25.0 release note is unchanged. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No new runtime dependency, asset, schema, storage, persisted setting, or PII is introduced, and no evidence directory is committed. |
| NFR-2 | The selector and variant pool logic are pure and deterministic with an injected RNG; they have no side effects. |
| NFR-3 | Shipped playthrough length, scoring, completion, and adaptive-band behavior are unchanged. |
| NFR-4 | The full configured `verify_phase` chain exits 0 for every phase and the integrated gate. |
| NFR-5 | `node scripts/validate-docs.js` reports 5 passed / 0 failed, with valid relative links and anchors. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | Seeded selector tests yield both slide ids and show no retained state across calls. | FR-1 |
| AC-2 | Word tests draw both variants; tier split, shift behavior, and no-repeat invariants hold with and without a variant. | FR-2, FR-7 |
| AC-3 | Story tests draw both variants, honor the obvious/subtle mix per shift, and fall back safely for the two-obvious-story variant. | FR-3 |
| AC-4 | Shape tests draw both variants, keep three unique shapes per round with no global repeats, and fall back safely for the eight-shape variant. | FR-4 |
| AC-5 | Scenario tests draw both variants and keep one scenario per emotion with no repeats. | FR-5 |
| AC-6 | Scene tests prove each of the four games reaches both slides and that existing completion flows still pass. | FR-6 |
| AC-7 | No-variant calls with a seeded RNG match the pre-change playthrough output for all four generators. | FR-7 |
| AC-8 | New tests pass the full gate including configured coverage thresholds, with no fixture or snapshot churn outside touched files. | FR-8 |
| AC-9 | PRD, TDD, and changelog record the wiring and fallback, v1.25.0 is untouched, and the docs validator reports 5 passed / 0 failed. | FR-9 |

## Edge Cases

- A seeded RNG returns exactly 0 or a value just below 1 at the selector boundary.
- A thin variant cannot fill the requested round count or an adaptive mix, so the generator uses the full classic pool for that draw.
- Adaptive shift `-1`, `0`, and `+1` with every variant id.
- A caller omits the variant argument entirely.
- Shape draws need more unique shapes than the variant provides.
- Scenario draws must still cover all four emotions when the variant has few scenarios.
- Repeated seeded playthroughs vary by slide but never repeat an item within one run.
- Documentation links remain relative and anchors still match headings.

## Dependencies

- **Tracks:** none
- **External:** none

## Open Questions & Assumptions

- **Assumption:** A 50/50 per-playthrough choice is sufficient reachability; no parent-facing theme control is needed.
- **Assumption:** Falling back to the full classic pool for a thin variant is acceptable; the variant may not appear in that particular playthrough, but the invariants are preserved.
- **Assumption:** No persistence is needed because children see both slides across ordinary play.

## References

- `docs/PRD.md` §10.2, §10.5, §10.10
- `docs/TDD.md`
- `docs/release-notes-v1.25.0.md`
- `conductor/roadmap.md` row `RM-5`
- `src/game/wordVariants.ts`, `storyVariants.ts`, `shapeVariants.ts`, `scenarioVariants.ts`
