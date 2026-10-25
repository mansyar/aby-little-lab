# Review: Shared Random Helpers — one shuffle, one RNG seam

- **Track:** `20261025-shared-random-helpers`
- **Type:** `refactor`
- **Branch:** `refactor/20261025-shared-random-helpers`
- **Range:** `97869ab7..2fec3ac2`
- **Date:** `2026-10-26`
- **Verdict:** `BLOCK`

## Summary

The refactor's production code is faithful: one `shuffle` definition now lives in
`src/game/random.ts`, the five byte-identical copies are gone, all 13 former
`shapeSorterLogic` importers point at `./random`, and the trailing
`rng: Rng = Math.random` seam is threaded through the logic modules with draw
order preserved. Every configured check is green.

The Phase-4 test migration is where the track fails. Three migrated suites
supply fewer scripted draws than the code consumes, so the injected generator
returns `undefined` and the assertions pass on corrupted output — proven below,
not inferred. A third hand-rolled Park–Miller generator survives in
`storyOrderLogic.test.ts` while the phase evidence claims no such body remains,
and `shapeSorterLogic` was left without the rng parameter its own acceptance
criteria require. Two of the 21 logic suites have no seeded-determinism case.

All seven findings are in scope, objective, and mechanically fixable.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| lint | `pnpm check` | pass | 256 files; 1 pre-existing warning (`musicalMemoryScene.test.ts:294`), 1 pre-existing info (`biome.json` schema) |
| typecheck | `pnpm typecheck` | pass | clean |
| test | `pnpm test -- --run` | pass | 123 files / 2689 tests |
| coverage | `pnpm test:coverage` | pass | 97.82 / 91.84 / 96.77 / 98.74 vs gates 90/85/88/95 |
| build | `pnpm build` | pass | 344 modules; 54 precache entries / 1727.25 KiB |
| build | `node scripts/validate-bundle.js` | pass | shell entry 138.7 kB ≤ 200 kB; Phaser vendor chunk present |
| build | `node scripts/validate-pwa.js` | pass | 16 passed, 0 failed |
| docs | `node scripts/validate-docs.js` | pass | 5 passed |

Checks are green; the findings are about what the tests actually prove, not
whether they run.

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1.T1.1 | `src/__tests__/game/random.test.ts` | covered |
| FR-2 | P2.T1.1, P2.T1.2, P2.T2.1, P2.T2.2, P2.T3.1 | grep static proof | covered |
| FR-3 | P3.T1.1, P3.T1.2, P3.T2.1 | per-module suites | **partial** — F3, F6 |
| FR-4 | P3.T3.1 | `feelingsFacesLogic.test.ts`, `storyOrderLogic.test.ts` | covered |
| FR-5 | P1.T2.1, P4.T1.2 | `helpers/randomHelper.test.ts` | **partial** — F1 |
| FR-6 | P4.T1.1, P4.T1.2, P4.T2.1 | `src/__tests__/game/*.test.ts` | **partial** — F4 |
| FR-7 | P4.T3.1, P4.T3.2, P4.T4.1 | `docs/roadmap.md`, `conductor/product.md`, validator | covered |
| NFR-1 | all phases | 2689 tests green | **partial** — F2 |
| NFR-2 | P1.T1.1, P1.T2.1 | `pnpm check`, `pnpm typecheck` | covered |
| NFR-3 | P4 | `pnpm test:coverage` | covered |
| NFR-4 | P1, P4 | build + bundle + PWA validators | covered |
| AC-1 | P1.T1.2 | `random.test.ts` edge suite | covered |
| AC-2 | P2.T3.1, P3.T4.1 | grep static proof | covered |
| AC-3 | P3.T3.1, P4.T1.1, P4.T1.2 | 21 logic suites | **partial** — F5 |
| AC-4 | P4.T1.1, P4.T1.2, P4.T2.1 | grep proofs | **partial** — F1, F4 |
| AC-5 | integrated | `verification/integrated.md` | **partial** — the gate is green but F2/F5 mean it certifies less than claimed |
| AC-6 | P4.T3.1, P4.T3.2 | `docs/roadmap.md`, `conductor/product.md` | covered |

## Findings

### Critical

- none

### High

- **F1 — A third seeded PRNG survives while the evidence claims none remain**
  - **File:** `src/__tests__/game/storyOrderLogic.test.ts:25-33` (11 call sites: 85, 113, 125, 126, 132, 139, 148, 156, 166, 216, 217)
  - **What:** `seededRng` (`state = (state * 16807) % 2147483647`) is still present and used. `git grep "16807" src/__tests__` returns this hit. `verification/phase-4.md:29` states "No `seededRng`/LCG/Park-Miller bodies remain" and marks AC-4 satisfied; that claim is false.
  - **Why:** FR-5/AC-4 are acceptance criteria of this track and are unmet, and the track's own proof of them is wrong — the failure mode verification exists to catch. A future track reading the evidence will believe the seeded-helper consolidation is finished.
  - **Fix:** Migrate the story-order suite to `mulberry32` from `src/__tests__/helpers/randomHelper.ts` and re-derive the affected expectations (the classic-mix pin and the no-repeat seeds change). `grep "16807" src/__tests__` returning nothing is the greppable proof the evidence should carry.
  - **Requirement:** FR-5, AC-4
  - **Test gap:** after migration, every seeded assertion in that suite uses the shared helper.

- **F2 — Under-scripted rngs make three migrated suites vacuous**
  - **File:** `src/__tests__/game/animalTraceLogic.test.ts:66-74, 169-179, 183-190`; `src/__tests__/game/popFreezeLogic.test.ts:246-254`
  - **What:** The scripted rngs supply fewer values than the code consumes, so `rng()` returns `undefined`. `shuffle` on an n-element pool draws n−1 times: the animal-trace pool of 6 pairs needs 10 draws (two calls) and is supplied 4; the pop-freeze pool of 4 needs 6 and is supplied 4; `generatePathPoints` consumes 4 draws per call and the script supplies 4 for **two** calls. Verified by executing the shuffle directly: `{"result":[3,null,1,6,2,4],"drawsConsumed":5}` — the `null` is the `undefined` element written into the result.
  - **Why:** `Math.floor(undefined * (i + 1))` is `NaN`, the swap writes `undefined`, and the path points become `NaN`. The assertions still pass because `expect(result1).not.toEqual(result2)` compares corrupted arrays and `p.y !== result2[i + 1].y` is trivially true when both sides are `NaN`. The suites would pass with the curve and shuffle logic broken. The pre-refactor versions were sound: `mockReturnValueOnce` falls back to real `Math.random` once the queue drains.
  - **Fix:** Budget the draws correctly (10 for the 6-pair shuffles, 8 for the two `generatePathPoints` calls, 6 for the 4-element pop-freeze shuffle) or use a repeating generator (`draws[draw++ % draws.length]`), and assert a concrete expected permutation plus a finite-value guard (`expect(Number.isFinite(result[1])).toBe(true)`) so an under-scripted rng fails loudly instead of silently.
  - **Requirement:** NFR-1, AC-3
  - **Test gap:** a "the injected rng is actually honoured" assertion in each affected suite.

### Medium

- **F3 — `shapeSorterLogic` has no rng parameter, so the platform source is still reachable**
  - **File:** `src/game/shapeSorterLogic.ts:93-96`; `src/__tests__/game/shapeSorterLogic.test.ts:172-182`
  - **What:** `generatePlaythrough(roundCount: number, shift: BandShift = 0)` calls `shuffle(poolFor(shift))` with no rng, so the draw lands on `shuffle`'s own `Math.random` default. Assumption A5's justification ("inherits the seam") is inaccurate — there is no inherited seam, only an inherited default binding.
  - **Why:** FR-3 requires a trailing `rng` on every random-dependent export and AC-3 requires a seeded-injection determinism case in each of the 21 suites. This module has neither, so one module and its suite remain in exactly the pre-track state the track set out to eliminate, and FR-3/AC-3 are internally inconsistent with A5.
  - **Fix:** Add the trailing parameter — `generatePlaythrough(roundCount: number, shift: BandShift = 0, rng: Rng = Math.random)` with `shuffle(poolFor(shift), rng)`. A trailing optional parameter does not disturb the scene's two-argument call or `shapeSorterScene.test.ts:313/:318` (`toHaveBeenCalledWith(3, 1)`). Replace the scoped `Math.random` spy in the suite with an injected seeded generator and amend A5 to describe the real mechanism.
  - **Requirement:** FR-3, AC-3, FR-6
  - **Test gap:** a "same injected rng ⇒ identical playthrough" case replacing the `try/finally` spy.

- **F4 — Two retained flow-suite stubs carry no annotation, and the evidence under-counts**
  - **File:** `src/__tests__/scenes/feelingsFacesFlow.test.ts:183`; `src/__tests__/scenes/musicalMemoryFlow.test.ts:400`
  - **What:** Nine global `Math.random` stubs survive across five flow suites. Four were annotated with the FR-6/A4 note; `feelingsFacesFlow.test.ts:183` — a suite the plan's P4.T2.1 named explicitly — was not touched and has no annotation, and the in-test stub at `musicalMemoryFlow.test.ts:400` has a purpose comment but no FR-6 marker. The Phase-4 "Files touched" list records only the four annotated suites.
  - **Why:** AC-4's exception is worded for "narrowly scoped default-wiring assertions (each carrying a comment)". The retained flow stubs script gameplay randomness, so they sit outside that wording, and an unannotated one is indistinguishable from an oversight. The deviation is defensible under A4 — the seam stops at the logic boundary, so a scene-level stub is the only lever — but the requirement text and the annotations must say so plainly.
  - **Fix:** Annotate both sites with the FR-6/A4 note and restate the exception in FR-6/AC-4 (and the Phase-4 evidence) as "scoped scene-level stubs in flow suites, each carrying a comment".
  - **Requirement:** FR-6, AC-4
  - **Test gap:** none — annotation and requirement-wording fix.

- **F5 — Two suites have no seeded determinism case; eight use constant closures**
  - **File:** `src/__tests__/game/animalTraceLogic.test.ts:63-75, 168-191`; `src/__tests__/game/popFreezeLogic.test.ts:65-75, 104-129, 243-255`
  - **What:** 19 of 21 logic suites contain a same-rng ⇒ identical-result case. `animalTraceLogic` and `popFreezeLogic` do not — their injected-rng tests assert inequality only. Separately, eight suites satisfy determinism with constant closures (`() => 0.5`) rather than a seeded generator, while the Phase-4 evidence states the 11 migrated suites now pass a seeded `mulberry32`.
  - **Why:** AC-3's "each of the 21 logic-module suites has ≥1 seeded-injection determinism case" is not met, and a constant closure pins one draw value, so it cannot catch a draw-order or off-by-one regression in a multi-draw routine.
  - **Fix:** Add a `mulberry32(1234)` same-seed case to `animalTraceLogic` (`generatePathPoints` twice ⇒ equal) and `popFreezeLogic` (`generateInitialBubbles` twice ⇒ equal). Keep the constant closures where a threshold is being pinned, and restate the Phase-4 evidence accordingly.
  - **Requirement:** AC-3
  - **Test gap:** one seeded determinism case in each of the two uncovered suites.

### Low

- **F6 — `storyOrderLogic.buildPlaythrough` keeps the rng as its first parameter**
  - **File:** `src/game/storyOrderLogic.ts:168`
  - **What:** The signature is `buildPlaythrough(rng: Rng = Math.random, shift: BandShift = 0)` while FR-3 mandates a trailing optional rng; every other module complies.
  - **Why:** The pre-existing order is what `src/scenes/StoryOrderScene.ts:90` depends on, and NFR-1/A4 justify keeping it, but the deviation is recorded nowhere, so a mechanical FR-3 audit will flag it as a gap.
  - **Fix:** Record the deviation in the track's deviation list and Phase-4 evidence, and note the reason in the `buildPlaythrough` TSDoc.
  - **Requirement:** FR-3
  - **Test gap:** none.

- **F7 — Phase-4 evidence miscounts and overclaims**
  - **File:** `conductor/tracks/20261025-shared-random-helpers/verification/phase-4.md:29, 32` and the Files-touched list
  - **What:** "19 logic suites migrated" is followed by 20 suite names, `storyOrderLogic.test.ts` is omitted from the list, and the AC-4 row asserts a repo-wide absence of Park–Miller bodies that is false.
  - **Why:** Evidence is the artifact a future track uses to decide what is still open; an overstated "nothing left" is worse than an accurate "one thing left".
  - **Fix:** Restate the AC-4 row with the exact file and line of any surviving copy and make the migrated-suite list match the stated count.
  - **Requirement:** AC-4, AC-5
  - **Test gap:** none.

## Overrides

- none

## Plan compliance

| Phase | Result / Checkpoint / Evidence | Tasks real? | Diff within Touches? |
| --- | --- | --- | --- |
| 1 — shared module + seeded helper | verified / `8f8e2236` / `verification/phase-1.md` | yes (P1.T1.1–P1.T2.2) | yes — 4 files, exactly the Touches list |
| 2 — cutover + delete five copies | verified / `0b4c7b5a` / `verification/phase-2.md` | yes | one disclosed exception: `src/__tests__/scenes/artDeclarations.test.ts` (`NON_ART_GAME_MODULES` gains `"random"`) — acceptable |
| 3 — thread the seam | verified / `3d86bf77` / `verification/phase-3.md` | yes | disclosed exception: two AC-3 golden blocks added to the feelings-faces / story-order suites — acceptable, and the goldens are the right artifact |
| 4 — test migration + docs pass | verified / `5db21858` / `verification/phase-4.md` | **partly** — P4.T1.1 and P4.T2.1 not fully discharged (F2, F4, F5) | `docs/roadmap.md` + `conductor/product.md` in scope; `feelingsFacesFlow.test.ts` was in P4.T2.1 and never touched |

Bookkeeping is sound: all four phases carry a Result, Checkpoint, and Evidence;
the commit ranges line up with the four checkpoints; both out-of-Touches edits
were disclosed. The gaps are in the *content* of P4.T1.1/P4.T2.1, not the plan's
structure. FR-7's "renumber remaining" is vacuous after retirement (both lists
are now "None."), and the "checked against the code on" date was already
`2026-10-25` in the baseline, so no date edit was needed.

## Out of scope

- `src/__tests__/scenes/musicalMemoryScene.test.ts:294` (`noNonNullAssertion`) and
  `biome.json` `$schema` 2.5.5-vs-2.5.10 — pre-existing, unrelated to this diff.
- The ~25 **scene** suites (not flow) that still stub `Math.random`
  (`bigSmallScene`, `decodeItScene`, `alphabetScene`, `wordMatchScene`,
  `sceneLifecycle`, …) — pre-existing, untouched by this diff, outside FR-6's
  "logic and flow tests" wording. Natural candidate for a follow-up track that
  extends the seam into scenes.
- `src/scenes/StoryOrderScene.ts:90` (explicit `Math.random`) and
  `src/utils/completionEffect.ts` confetti — covered by A4 / spec out-of-scope.
- `src/scenes/ShapeSorterScene.ts:127-128` (`shuffle(roundShapes)` with no rng) —
  scene-level, A4.
- `src/game/random.ts` and `src/__tests__/helpers/randomHelper.ts` — reviewed,
  correct, correctly documented, no findings.

## Debt

- none yet; all seven findings go into the Review Fixes phase.

## Doc sync

`pending` — the post-review sync will confirm whether the fix round changed any
documented contract.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | BLOCK | 0 | 2 | 3 | 2 | 0 |
