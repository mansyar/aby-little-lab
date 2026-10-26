# Track Review — 20261026-scene-rng-seam

- **Track:** 20261026-scene-rng-seam
- **Type:** refactor
- **Branch:** `refactor/20261026-scene-rng-seam`
- **Range:** `0a6758c0..92409d0a` (excluding `conductor/`: 55 files, +1,661/−761)
- **Date:** 2026-10-26
- **Verdict:** PASS WITH FINDINGS

## Summary

The seam is real and correctly wired: every one of the 24 touched scene files
forwards `this.rng` in its builder's live parameter position (verified against
`src/game/*Logic.ts` signatures, including the rng-first
`storyOrderLogic.buildPlaythrough` and the middle-optional
`createRound(band, usedOddTextures?, rng?)` shapes, which the scenes reach
only through playthrough-level wrappers). All 52 `vi.spyOn(Math, "random")`
census sites are migrated to `mulberry32` seeding with zero spy sites
remaining; all nine formerly rng-dropping mock wrappers now forward every
argument; the 8-case equivalence proof replays each scene's builder sequence
through one shared rng instance and is mutation-backed. Requirements
coverage is complete. Two non-blocking findings remain: one latent
test-helper defect (F1) and one assertion-strength consistency gap (F2) —
both objective, local, and in scope, so under this project's strict mode they
are fixed before the PR rather than deferred.

## Verification

| Layer | Command | Result | Evidence |
|---|---|---|---|
| lint/format | `pnpm check` | pass (exit 0; 1 pre-existing warning + 1 pre-existing info) | integrated.md |
| types | `pnpm typecheck` | pass | integrated.md |
| tests | `pnpm test -- --run` | pass — 125 files / 2,729 tests | integrated.md |
| coverage | `pnpm test:coverage` | pass — 97.82 / 91.96 / 96.77 / 98.74 vs gates 90/85/88/95 | integrated.md |
| build | `pnpm build` | pass — 54 precache entries | integrated.md |
| bundle | `node scripts/validate-bundle.js` | pass — shell 138.7 kB ≤ 200 kB | integrated.md |
| pwa | `node scripts/validate-pwa.js` | pass — 16/16 | integrated.md |
| docs | `node scripts/validate-docs.js` | pass — 5/5 | integrated.md |

Reviewer's own checks (read-only): census recount at base = exactly 52 spy
sites across 27 files; current tree 0 spy sites in `src/__tests__/scenes`;
`src/scenes` = 25 `Math.random` matches (23 constructor defaults + 2 TSDoc
prose), zero live draws; 27 `(AC-1)` cases covering all 22 scenes; all
mock wrappers forward the rng argument.

## Requirements coverage

| ID | Implemented by | Verified by | Status |
|---|---|---|---|
| FR-1 | P1.T1 | `gameSceneBaseRng.test.ts` (3 cases) | covered |
| FR-2 | P2.T1, P3.T1 | 27 `(AC-1)` cases; constructor audit = 22 scenes + base | covered |
| FR-3 | P1.T2 | `sceneRngEquivalence.test.ts:297/:311` (AC-4) | covered |
| FR-4 | P2.T2, P3.T1 | call-site audit vs live signatures; StoryOrder rng-first pinned | covered |
| FR-5 | P2, P3, P4.T3 | reviewer recount: 25 = 23 defaults + 2 prose, 0 live draws | covered |
| FR-6 | P4.T1, P4.T2 | census 52→0; 9 wrapper drops fixed | covered |
| FR-7 | P5.T1, P5.T2 | archive spec amended; tech-stack + product accurate; validate-docs 5/5 | covered |
| NFR-1 | P1.T1, P2, P3 | Phaser zero-arg rationale; gate green | covered |
| NFR-2 | P1.T1 | `GameSceneBase.ts` TSDoc `[0,1)` house wording | covered |
| NFR-3 | P4, integrated | 97.82/91.96/96.77/98.74 | covered |
| NFR-4 | integrated | no new deps; shell 138.7 kB; 42/42 precached | covered |
| AC-1 | P4 (+ rework) | 27 two-construction cases, all 22 scenes | covered |
| AC-2 | P4.T3, P5.T1 | reviewer recount of both greps | covered |
| AC-3 | P3.T2 | equivalence suite, shared-instance chaining, mutation-proven | covered |
| AC-4 | P3.T2 | equivalence `:297/:311` through GroupMathScene | covered |
| AC-5 | integrated | chained verify_phase exit 0 | covered |
| AC-6 | P5 | docs diff reviewed; validate-docs 0 | covered |

## Findings

### Critical

None.

### High

None.

### Medium

**F1 — `src/__tests__/scenes/animalTraceFlow.test.ts:111` (latent helper defect).**
The first describe block's `pathRngForPair` passes `pathRngForPair(0)` — a
fresh throwaway generator positioned for pair 0 — instead of `rng` inside its
warm-up `generatePathPoints` loop. For `pairIndex ≥ 1` the returned generator
never consumes the earlier pairs' path draws and stays positioned for pair 0.
Latent only: every current block-1 call site uses `pairIndex = 0` (verified),
and the second block's copy at `:604` is correct. The duplication is what
allowed the divergence. **Fix:** pass `rng` at line 111 (mirroring the
`:608-611` copy), or hoist one shared `pathRngForPair`/`completePath` helper
so the two blocks cannot diverge again. Requirement: AC-1/AC-3 adjacent (test
honesty). Test gap: none current; the fix prevents a future mispositioned
replay.

### Low

**F2 — recorder-mock assertion strength (eight suites).** The band-shift
wiring assertions in howMany (`:715/:721`), memoryMatch (`:746/:752`),
wordMatch (`:784/:792`), addItUp (`:665/:672`), takeAway (`:666/:673`),
decodeIt (`:747/:754`), wordBuilder (`:841/:848`), musicalMemory (`:282`)
record/pin only the pre-seam leading arguments, unlike the seven suites
repaired with `expect.any(Function)` in the rng slot. Behavior is covered
either way (wrappers forward rng; AC-1 would catch a drop) — a consistency
gap in assertion strength. **Fix:** have the recorder mocks record all
arguments and append `expect.any(Function)` to those eight assertions.
Requirement: FR-4 (assertion strength only).

## Overrides

None.

## Plan compliance

All five phase evidence files plus `integrated.md` exist with
Commands/ACs/Files-touched/Deviations/Primary-verification blocks; every
phase `Result: verified`; checkpoints `0dc331fd`, `385395da`, `31e4283c`,
`ae0ccaa2`, `59b81b3b` present and matching the git history. The five
disclosed deviations (12 authorized arity repairs under plan amendment
`77a410d0`; 3 bigSmall repairs; 3 beyond-census AC-1 additions within the
Touches glob; the patternBuilderFlow destroyed-object filter; the phase-5
permission-denied edits applied by the primary) are all recorded in the
evidence and match the actual diff. The 55-file src diff = 24 scene files +
31 test files, exactly as enumerated. Phase 4's rework round (3 missing AC-1
cases found and added; arithmetic corrected from "2700+26" to 2702+27) is
recorded honestly.

## Out of scope

- `shadowMatchFlow.test.ts`'s 22 remaining bare `new ShadowMatchScene()`
  sites run on `Math.random` — pre-existing (the file never stubbed
  `Math.random`), unchanged by this diff, disclosed in the phase-4 rework
  notes. Candidate for a future polish track.
- `musicalMemoryScene.test.ts` `noNonNullAssertion` warning and the
  `biome.json` schema-version info — pre-existing, out of scope.
- Phase-3 evidence cites the warning at `:294`; the integrated record says
  `:297` — trivial line drift from added tests, not a defect.

## Debt

None yet — both findings go into the Review Fixes phase (strict mode).

## Doc sync

`pending`

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
|---|---|---|---|---|---|---|
| 1 | PASS WITH FINDINGS | 0 | 0 | 1 | 1 | 0 |
