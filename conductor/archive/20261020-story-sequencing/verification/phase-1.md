# Phase 1 evidence — Story pool logic

Track: `20261020-story-sequencing` · Branch: `feat/20261020-story-sequencing`
Phase base: `f0532ca` · Date: 2026-10-20

## What changed

New files only; no existing module was touched.

- `src/game/storyOrderLogic.ts` — pure sequencing module (no Phaser, DOM,
  storage or scene/component imports).
  - Exports: `StoryLadder`, `Story`, `STORY_POOL` (8 stories), `STORY_IDS`,
    `OBVIOUS_POOL` (4), `SUBTLE_POOL` (4), `ROUND_COUNT` (6),
    `ROUNDS_PER_BAND` (3), `StoryOrderRound`, `buildRound`,
    `buildPlaythrough`, `isCorrect`.
  - Panel texture keys are exactly the 24 fixed keys from the spec/brief
    (`story_seed_planted` … `story_rain_puddle`), in solution order.
  - RNG is a parameter (`() => number`); `Math.random` is only the default at
    the two public boundaries (`buildPlaythrough`, `buildRound`).
- `src/__tests__/game/storyOrderLogic.test.ts` — 16 tests over pool integrity,
  ladder split, no-repeat draws, seeded determinism, the shuffle guard and
  `isCorrect`.

Behaviour notes:

- `buildPlaythrough` draws 3 of the 4 obvious stories, then 3 of the 4 subtle
  stories, each band order-shuffled, then builds each round's strip. Bands are
  disjoint, so no story can repeat within a playthrough.
- `buildRound` shuffles the panels for the source row; if the shuffle
  reproduces the solution it reshuffles once (mirroring
  `numberOrderLogic.buildRound`). A degenerate RNG that keeps yielding the
  sorted permutation is caught by one extra guard: the row is rotated by one,
  so a round never opens already solved.

## Commands

All run from the repo root, in the single chain the brief specifies:

```
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js
```

| Command | Result |
| --- | --- |
| `pnpm check` | pass — 201 files, no errors (one pre-existing `noNonNullAssertion` warning in `src/__tests__/scenes/musicalMemoryScene.test.ts:294`; one pre-existing biome schema-version info note) |
| `pnpm typecheck` | pass — `tsc --noEmit` clean |
| `pnpm test -- --run` | pass — 101 files, 2165 tests (2149 existing + 16 new) |
| `pnpm test:coverage` | pass — statements 98.09%, branches 90.36%, functions 98.17%, lines 98.94% (gates 90/85/88/95) |
| `pnpm build` | pass — shell `index-DcE17GRj.js` 197.00 kB raw / 192.4 kB measured |
| `node scripts/validate-bundle.js` | pass — phaser vendor chunk present; shell entry 192.4 kB ≤ 200 kB |
| `node scripts/validate-pwa.js` | pass — 15 passed, 0 failed |

Chain exit code: `0`.

## Acceptance criteria

| Criterion | Status | Evidence |
| --- | --- | --- |
| AC-2 — playthrough is 6 rounds, 3 obvious then 3 subtle, no repeated story, deterministic under a seeded RNG | met | `buildPlaythrough` returns exactly `ROUND_COUNT` rounds; tests "returns six rounds: three obvious then three subtle", "never repeats a story, across many seeds" (seeds 1–50), "is deterministic under a seeded rng", "differs between two seeds known to draw different orders" (seeds 1 vs 2) |
| AC-2 (supporting) — every round's strip is a scrambled permutation of that story's solution | met | tests "scrambles the panels into an unsolved permutation of the solution", "gives every round a scrambled strip that is a permutation of its story", "never returns an already-solved row, even when the rng yields the sorted order", "reshuffles exactly once when the first shuffle is already solved" |
| AC-2 (supporting) — `isCorrect` is length- and order-sensitive | met | tests "is true only for an exact match", "is false for a reversed strip", "is false for a short strip", "is false for a long strip", "is false for a strip with one wrong panel" |

NFR-2 coverage for the new module (v8 HTML report,
`coverage/src/game/storyOrderLogic.ts.html`): 100% statements (32/32), 100%
branches (10/10), 100% functions (11/11), 100% lines (26/26). Test count moved
2149 → 2165; no existing test was modified.

FR-2 export surface available to Phase 3: `ROUND_COUNT`, `STORY_POOL`,
`STORY_IDS`, `OBVIOUS_POOL`, `SUBTLE_POOL`, `buildPlaythrough`, `buildRound`,
`isCorrect`, `StoryOrderRound`, `Story`.

## Task commit map

| Task | Commit |
| --- | --- |
| P1.T1 — Story pool and round types | `c1dfb74` |
| P1.T2 — Playthrough generation and shuffle guard | `e0a6277` |
| P1.T3 — Correctness check and unit tests | `f950db4` |

## Deviations

None. Only the two files in `Touches` were created; nothing outside them was
edited.

## Notes for the primary agent

- The brief's guard wording ("reshuffle once") is implemented literally, with
  one extra step: if the second shuffle still reproduces the solution (only
  possible with a degenerate/injected RNG), the row is rotated by one. Without
  it the required test "an RNG that yields the already-sorted permutation still
  produces a non-solved round" cannot pass, since a constant RNG makes a
  Fisher-Yates shuffle an identity every time. Flagging it because it is a small
  addition beyond the written rule, not a scope change.
- `storyOrderLogic.ts` emits no chunk of its own yet: nothing in the app imports
  it until Phase 3 wires `StoryOrderScene`. It is currently tree-shaken out of
  `dist`, which is expected and does not affect AC-7.
- `StoryOrderRound` carries `storyId`, `shuffled` and `solution` only (no
  ladder field); tests resolve the ladder via `STORY_POOL`. If Phase 3 wants the
  ladder on the round, it is a one-field addition, but it was not in the brief.
- Panel keys are exported only inside `STORY_POOL`; Phase 2 should author art
  against exactly those 24 strings (three per story, solution order).

## Primary verification

Run by the primary agent at the phase head (`3e12e9b`), independently of the
executor, using the exact chain the brief specifies.

| Layer | Result |
| --- | --- |
| `pnpm check` | pass - 201 files, 1 pre-existing warning (`musicalMemoryScene.test.ts:294`), 1 schema info note |
| `pnpm typecheck` | pass, no output |
| `pnpm test -- --run` | pass - 101 files / 2,165 tests (2,149 carried + 16 new, none modified) |
| `pnpm test:coverage` | pass - 98.09 statements / 90.36 branches / 98.17 functions / 98.94 lines |
| `pnpm build` | pass - 271 modules, shell `index-DcE17GRj.js` 197.00 kB raw |
| `node scripts/validate-bundle.js` | pass - shell 192.4 kB <= 200 kB |
| `node scripts/validate-pwa.js` | pass - 15 / 15 |

Scope: `git diff --stat f0532ca..HEAD` is exactly the new logic module, the new
logic suite and this evidence file - no existing file touched, no merge commits.
The test diff contains a single new file, so NFR-2's "existing tests unmodified"
holds for this phase.

Module coverage checked directly with
`npx vitest run --coverage --coverage.include=src/game/storyOrderLogic.ts`:
100 % statements (32/32), branches (10/10), functions (11/11), lines (26/26).

AC-2 is met: a playthrough is 3 obvious + 3 subtle rounds, no repeats (asserted
over 50 seeds), every round's row is an unsolved permutation of its story, and
the module is deterministic under a seeded RNG.

Note on the shuffle guard: the executor added a one-step rotation after the
single reshuffle, because a degenerate constant RNG makes Fisher-Yates an
identity no matter how often it runs. The rotation keeps the row a permutation
and keeps the round solvable-by-work, so the phase goal still holds; it is
recorded here so review can judge the extra branch rather than discover it.
