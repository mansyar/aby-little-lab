# Shared Random Helpers — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Consolidate all game-logic randomness behind one shared module
(`src/game/random.ts`) and an injectable RNG seam, so all 21 per-game logic
modules become deterministically testable with zero player-visible change.
This track executes `docs/roadmap.md` Future Work #1 ("One shuffle, one RNG
seam") and retires the roadmap's only remaining Known Issue.

## Problem / Motivation

- **Five byte-identical `shuffle` copies** exist in
  `src/game/animalTraceLogic.ts:31`, `src/game/bigSmallLogic.ts:77`,
  `src/game/popFreezeLogic.ts:74`, `src/game/shadowMatchLogic.ts:55`, and
  `src/game/shapeSorterLogic.ts:95` (the roadmap's one Known Issue).
- **`shapeSorterLogic` is an accidental random hub**: twelve more logic
  modules (`addItUp`, `alphabet`, `colorMatch`, `count`, `decode`,
  `firstSounds`, `memoryMatch`, `moreLess`, `numberOrder`, `oddOneOut`,
  `patternBuilder`, `takeAway`, `word`) plus `ShapeSorterScene` import
  `shuffle` from the shapes module.
- **19 of 21 logic modules are not deterministically testable**: randomness
  flows only through the `Math.random` singleton, so tests must globally
  stub or spy on it. Two different hand-rolled seeded PRNGs (an LCG in
  `feelingsFacesLogic.test.ts`, Park-Miller in `shadowMatchLogic.test.ts`)
  are duplicated across test files to work around this.
- Unfixed, every future game or difficulty rebalance compounds the
  duplication and the global-mock flakiness surface.

## Goals & Success Metrics

- **G1 One shuffle:** exactly one `shuffle` implementation in `src/game`.
  Metric: code search finds one definition, the private copies deleted.
- **G2 Full RNG seam:** all 21 logic modules accept injected RNG. Metric:
  `Math.random` in `src/game` appears only as default-parameter
  initializers; no logic/flow test relies on a global `Math.random` stub.
- **G3 One seeded test helper:** the two local test PRNGs are replaced by a
  single shared `mulberry32` helper in `src/__tests__/helpers/`. Metric:
  both inline bodies are gone, one helper definition exists.
- **G4 Zero behavior change:** every existing assertion passes with
  mock-mechanism swaps only. Metric: full `verify_phase` gate green.

## Scope

### In Scope

- New `src/game/random.ts` exporting `Rng` (type alias for `() => number`)
  and `shuffle<T>(items: readonly T[], rng?: Rng): T[]` with the same
  Fisher-Yates copy semantics as the current five copies (default
  `Math.random`).
- Delete the five duplicate `shuffle` definitions.
- Re-point all 13 `shapeSorterLogic`-shuffle importers to `./random` (clean
  cut, no compatibility re-exports; domain types such as `ALL_SHAPES` and
  `ShapeType` stay in `shapeSorterLogic`).
- Thread a trailing optional `rng: Rng = Math.random` parameter through
  every exported function whose result depends on randomness in the 19
  un-seamed logic modules, propagated to all internal random decisions.
- Migrate `feelingsFacesLogic` and `storyOrderLogic` (already seamed) to the
  shared `shuffle`, preserving output sequences for a given `rng`.
- Replace the two local seeded test generators with one shared `mulberry32`
  helper in `src/__tests__/helpers/`, with its own determinism test.
- Migrate logic and flow tests from global `Math.random` stubs/spies to
  injected seeded RNG (mechanism swap only, assertions untouched except
  where expectations encode old PRNG constants — re-derived, not rewritten).
- Truth pass: `docs/roadmap.md` retires the Known Issue + Future-Work item
  (with date refresh and remaining-item renumbering), and
  `conductor/product.md` gains a changelog entry.

### Out of Scope

- `src/components/completionEffect.ts` confetti randomness (visual noise,
  non-deterministic by design, already tested via geometry bounds).
- New random helpers beyond `shuffle`/`Rng` (no `sample`, `weightedPick`,
  or seeded factories — cited helpers may be introduced by a future need).
- Production seeding mechanics: no profile-bound or save-bound seed
  sources; gameplay remains unseeded in production.
- Any gameplay, difficulty, art, audio, UX, or copy change of any kind.
- README Known-Issues fixes beyond what `validate-docs.js` requires for
  this change (tracked separately by the docs-truth-pass candidate).

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | `src/game/random.ts` exports `Rng` and `shuffle<T>(items: readonly T[], rng?: Rng): T[]` with the same Fisher-Yates copy semantics as the current five copies (copy in, iterate `i` from `length - 1` down to `1`, `j = Math.floor(rng() * (i + 1))`, swap; input array never mutated) | must |
| FR-2 | The five duplicate `shuffle` definitions are removed; every shuffle consumer imports from `src/game/random`; `shapeSorterLogic` no longer exports or re-exports randomness | must |
| FR-3 | Every exported function whose result depends on randomness, across all 21 logic modules, accepts a trailing optional `rng: Rng` parameter defaulting to `Math.random`, threaded into every internal random decision (including nested helper calls) | must |
| FR-4 | `feelingsFacesLogic` and `storyOrderLogic` use the shared `shuffle`; their exported functions produce identical output sequences for a given `rng` as today | must |
| FR-5 | One seeded generator (`mulberry32`) is exported from `src/__tests__/helpers/` with a TSDoc seed contract; the two local seeded-generator bodies (LCG, Park-Miller) are removed | must |
| FR-6 | Determinism in logic and flow tests comes from injected seeded rng passed as the new parameter; global `Math.random` stubs/spies are removed, except (a) narrowly scoped stubs whose only purpose is to assert that the default wiring is `Math.random`. Amended 2026-10-26: clause (b) — scoped scene-level stubs in flow suites — was retired by track `20261026-scene-rng-seam` when the scenes gained their own rng seam | must |
| FR-7 | `docs/roadmap.md` no longer lists the duplicate-shuffle Known Issue or the Future-Work item (remaining Future-Work entries renumbered, the "checked against the code on" date refreshed to this track's date); `conductor/product.md` gains a changelog entry; `scripts/validate-docs.js` passes | should |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | Behavior-preserving: identical algorithm and iteration order; existing test assertions are untouched except where they encoded old local PRNG constant sequences, which are re-derived against `mulberry32` (documented in the phase evidence) |
| NFR-2 | TSDoc on every new export states the `rng` contract (`[0, 1)`), following the `feelingsFacesLogic` house wording; `pnpm check` and `pnpm typecheck` clean |
| NFR-3 | Coverage stays at or above lines 95 / functions 88 / branches 85 / statements 90 |
| NFR-4 | No new runtime or dev dependencies; bundle budgets unbroken (validate-bundle/validate-pwa green); the app's runtime behavior (with default `Math.random`) is unchanged |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | `random.ts`'s test suite covers, with a seeded rng: input untouched; empty array → `[]`; single element → copy (not the same reference); two-element ordering; full Fisher-Yates determinism for a fixed seed; boundary rng values `0.0` and `1 - epsilon` keep every index in range for arrays up to realistic pool sizes | FR-1 |
| AC-2 | Static proof from grep: exactly one `function shuffle` definition in `src/game`; zero `shuffle` imports from `shapeSorterLogic`; every occurrence of `Math.random` in non-test `src/game/**` files is a default-parameter initializer or inside `random.ts`'s default | FR-2, FR-3 |
| AC-3 | Each of the 21 logic-module test suites includes at least one seeded-injection determinism case (a migrated existing test qualifies); the `feelingsFaces` and `storyOrder` suites additionally prove same-rng sequence equivalence across the shared-shuffle adoption | FR-3, FR-4 |
| AC-4 | Code search finds zero global `Math.random` stub/mock/spy setups in logic and flow tests, other than (a) narrowly scoped default-wiring assertions (each carrying a comment saying so); exactly one seeded helper definition exists under `src/__tests__/helpers/`; the LCG and Park-Miller bodies are gone. Amended 2026-10-26: clause (b) — scoped scene-level stubs in flow suites — was retired by track `20261026-scene-rng-seam` when the scenes gained their own rng seam | FR-5, FR-6 |
| AC-5 | Full `verify_phase` gate green end-to-end (biome, typecheck, unit, coverage at NFR-3 thresholds, production build, bundle + PWA + docs validators) | NFR-1, NFR-2, NFR-3, NFR-4 |
| AC-6 | `docs/roadmap.md` shows no duplicate-shuffle Known Issue or `shared-random-helpers` Future-Work entry, with remaining Future-Work items renumbered and the check date refreshed; `conductor/product.md` contains this track's changelog entry; `node scripts/validate-docs.js` exits 0 | FR-7 |

## Edge Cases

- Empty array → returns `[]` without calling the rng.
- Single element → returns a copy (never the same array reference).
- `rng` returning `0.0` → `j = 0`; no negative index ever produced.
- `rng` approaching `1.0` (`1 - ε`) → `j <= i`; no out-of-bounds index.
- Same seed → identical output sequences across any number of calls within
  one module and across modules sharing one generator instance.
- `readonly T[]` inputs remain accepted and never mutated.
- Default-parameter wiring: every seamed function still works when called
  with no rng argument (production path).
- `feelingsFaces`/`storyOrder` ladder-draw order (guaranteed first, extras
  after, final shuffle) must keep its exact call order into the rng so a
  given seed produces the same draw as before the adoption.

## Dependencies

- **Tracks:** none (the registry has no open or blocking tracks).
- **External:** none (no services, credentials, APIs, or data sources).

## Open Questions & Assumptions

- **Assumption (A1):** Names `Rng` and `shuffle` are kept, minimizing churn
  across the 18 existing consumer modules and their tests.
- **Assumption (A2):** TSDoc wording follows the
  `feelingsFacesLogic.ts`/`storyOrderLogic.ts` house pattern ("rng must
  return a number in [0, 1); tests pass a seeded generator…").
- **Assumption (A3):** `mulberry32` uses its standard constants; where an
  existing test's expectations baked in old local-PRNG sequences, the
  expectation values are re-derived against the new helper (documented in
  phase evidence per NFR-1).
- **Assumption (A4):** `StoryOrderScene.ts` keeps its explicit
  `Math.random` argument at its single call site — scenes are outside the
  seam scope; the seam lands in logic modules only (ShapeSorterScene's
  shuffle import is re-pointed as part of FR-2, no other scene changes).
- **Assumption (A5):** `generatePlaythrough` in `shapeSorterLogic` carries
  the seam as a trailing `rng: Rng = Math.random` forwarded to the shared
  `shuffle`; the trailing position keeps the two-argument scene call and the
  `shapeSorterScene` `toHaveBeenCalledWith(3, shift)` assertions intact.
  (Amended in the review-fix round: the original wording claimed the seam was
  inherited through `poolFor`/`shuffle` usage, which left the platform source
  reachable and is why F3 required the parameter.)

## References

- `docs/roadmap.md` — Known Issue (duplicate `shuffle` copies) and Future
  Work #1 ("One shuffle, one RNG seam").
- `src/game/feelingsFacesLogic.ts:66-94` and `src/game/storyOrderLogic.ts`
  — the established injectable-rng house convention this track generalizes.
- `src/game/shapeSorterLogic.ts:95` — the canonical (byte-identical)
  shuffle copy.
- `conductor/product-guidelines.md` — style/dx standards for pure logic
  modules and test conventions.
