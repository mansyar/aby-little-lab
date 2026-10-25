## Summary

All game-logic randomness now flows through one module. The five byte-identical
`shuffle` copies are gone, every random-dependent export across the 21 per-game
logic modules accepts an injectable `rng`, and the tests draw determinism from a
single shared seeded generator instead of two hand-rolled PRNGs and global
`Math.random` spies.

This retires the last Known Issue and the first Future-Work item in
`docs/roadmap.md`. It is a pure refactor: zero kid-visible behavior change, no
new dependencies, and the shipped bundle is byte-identical in size.

## Track

- **ID:** `20261025-shared-random-helpers`
- **Type:** refactor
- **Spec:** [`conductor/archive/20261025-shared-random-helpers/spec.md`](conductor/archive/20261025-shared-random-helpers/spec.md)
- **Plan:** [`conductor/archive/20261025-shared-random-helpers/plan.md`](conductor/archive/20261025-shared-random-helpers/plan.md)
- **Review:** [`conductor/archive/20261025-shared-random-helpers/review.md`](conductor/archive/20261025-shared-random-helpers/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Shared random module + seeded test helper | `random.ts` with `Rng` + unified `shuffle`; one `mulberry32` test helper | verified | `8f8e2236` | Edge suite covers empty/single/readonly/determinism/boundaries |
| 2: Cut over shuffle consumers | Delete the five copies, re-point 13 importers + `ShapeSorterScene` | verified | `0b4c7b5a` | `shapeSorterLogic` stops being an accidental randomness hub; one off-Touches edit disclosed (`artDeclarations.test.ts` module list) |
| 3: Thread the RNG seam | Trailing optional `rng` through all 21 logic modules; feelingsFaces/storyOrder adopt the shared shuffle | verified | `3d86bf77` | Same-seed sequences preserved; ladder draw order untouched |
| 4: Test migration + docs truth pass | Suites use injected seeded rng; roadmap and product changelog updated | verified | `5db21858` | Roadmap Known Issue and Future-Work item retired |
| R1: Review Fixes | Resolve review findings F1–F9 | verified | `a9c41674` | Two High findings were real: a third Park–Miller survived, and three suites passed on corrupted output |

## Requirements

- [x] `FR-1` — `src/game/random.ts` exports `Rng` and one `shuffle<T>(items, rng?)` with Fisher-Yates copy semantics (test: `src/__tests__/game/random.test.ts`)
- [x] `FR-2` — five duplicate definitions removed; every consumer imports from `./random`; `shapeSorterLogic` exports no randomness
- [x] `FR-3` — every random-dependent export in all 21 logic modules takes a trailing optional `rng` defaulting to `Math.random`
- [x] `FR-4` — feelingsFaces and storyOrder use the shared `shuffle` and keep identical per-`rng` sequences
- [x] `FR-5` — one `mulberry32` helper in `src/__tests__/helpers/`; the LCG and Park–Miller bodies are gone
- [x] `FR-6` — determinism comes from injected seeded rng; remaining global stubs are scoped and commented
- [x] `FR-7` — roadmap entries retired; product changelog added; `validate-docs` passes
- [x] `NFR-1` — behavior-preserving; no kid-visible change
- [x] `NFR-2` — TSDoc states the `[0, 1)` contract on every new export
- [x] `NFR-3` — coverage 97.82 / 91.84 / 96.77 / 98.74 against a 90 / 85 / 88 / 95 gate
- [x] `NFR-4` — no new dependencies; bundle budgets unbroken
- [x] `AC-1`–`AC-6` — see `spec.md`; each is verified by a test or a recorded grep

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| static | `pnpm check` | pass (256 files; two pre-existing diagnostics only) | `conductor/archive/20261025-shared-random-helpers/verification/integrated.md` |
| static | `pnpm typecheck` | pass | same |
| unit | `pnpm test -- --run` | pass — 123 files / 2,691 tests | same |
| unit | `pnpm test:coverage` | pass — 97.82 / 91.84 / 96.77 / 98.74 | same |
| build | `pnpm build` | pass — 54 precache entries, 1,727.27 KiB | same |
| build | `node scripts/validate-bundle.js` | pass — shell entry 138.7 kB ≤ 200 kB | same |
| build | `node scripts/validate-pwa.js` | pass — 16/16, 42 chunks precached | same |
| docs | `node scripts/validate-docs.js` | pass — 5/5 | same |

Greppable proofs, recorded verbatim in the evidence:

- `grep "16807" src/__tests__` → no matches (no hand-rolled PRNG survives).
- `grep "function shuffle" src/game` → three hits, of which two are one-line
  `shuffleWith` delegates; the single algorithm copy is `random.ts:21`.
- `grep "Math\.random" src/game` → 46 hits, all default-parameter initializers
  or inside `random.ts`.

## Review

- **Verdict:** `PASS WITH FINDINGS`
- **Rounds:** 2
- **Fixed:** 9 findings (2 High, 3 Medium, 4 Low)
- **Accepted/deferred:** 0

The round-1 review returned `BLOCK`. Both High findings were genuine defects in
the test migration, not style nits:

1. A third hand-rolled Park–Miller generator survived in
   `storyOrderLogic.test.ts` while the evidence claimed none remained.
2. Three migrated suites supplied fewer scripted draws than the code consumed,
   so `rng()` returned `undefined` and the assertions passed on `NaN`/`undefined`
   output. Reproduced before fixing: the shuffle yielded `[3, null, 1, 6, 2, 4]`.

The round-2 reviewer re-derived the replacement pins independently rather than
accepting them — replaying `mulberry32(77)` against the shared `shuffle` to
confirm the classic-mix sequence is a real consequence of the seed — and
confirmed all seven original findings resolved.

## Deviations and risks

- **`storyOrderLogic.buildPlaythrough` keeps `rng` first**, unlike the
  trailing-rng convention. `StoryOrderScene` already calls
  `buildPlaythrough(Math.random, shift)`, and A4 puts scenes outside the seam, so
  reordering would have been a wider change than the finding asked for. Documented
  in the TSDoc and as Deviation 6 in the evidence.
- **Ten scene-level stubs remain in five flow suites**, each annotated with the
  FR-6/A4 exception. The seam stops at the logic boundary, so a scene's own draw
  calls cannot receive an injected generator. FR-6 and AC-4 were amended in
  `spec.md` to state this exception precisely rather than leaving the evidence to
  overclaim.
- **Two exact intermediate-`y` float pins were dropped** in `animalTraceLogic.test.ts`
  in favour of a draw budget, `Number.isFinite` guards, and the original
  mid-point-differs inequality. Those floats pinned trigonometric arithmetic noise,
  not behaviour; both shuffle cases pin exact permutations.
- **Risk: none identified.** The default parameter preserves production behavior
  exactly, and the tests assert that the no-argument path still works.

## Follow-ups

- none — but worth noting for a future track: ~25 *scene* (not flow) suites still
  stub `Math.random`. They are outside FR-6's "logic and flow tests" wording and
  were out of scope here; extending the seam into scenes would clear them.

## Rollback

```bash
# Merge commit
git revert --no-edit -m 1 <merge-commit>

# Squash commit
git revert --no-edit <squash-commit>
```

No migration, feature flag, or data change is involved — the storage schema is
untouched and no persisted value shape changed. A revert restores the five
duplicate shuffles but cannot corrupt saved profiles.
