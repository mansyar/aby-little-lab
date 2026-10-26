# Shared Random Helpers — Implementation Plan

> **Branch:** `refactor/20261025-shared-random-helpers`
> **Base:** `master` @ `97869ab7`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Shared random module + seeded test helper

- **Goal:** `src/game/random.ts` exists with the unified Fisher-Yates
  `shuffle` (TSDoc'd, fully edge-case-tested) and one seeded `mulberry32`
  helper lives in `src/__tests__/helpers/` — nothing else imports it yet.
- **Depends on:** none
- **Covers:** FR-1, FR-5, NFR-2, NFR-4, AC-1 (helper half of AC-4)
- **Touches:** `src/game/random.ts`, `src/__tests__/game/random.test.ts`,
  `src/__tests__/helpers/randomHelper.ts`,
  `src/__tests__/helpers/randomHelper.test.ts`
- **Verification:** the full `verify_phase` chain
  (`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`)
  plus targeted `pnpm test -- --run src/__tests__/game/random.test.ts src/__tests__/helpers/randomHelper.test.ts`
- **Status:** verified

- [x] **P1.T1: Create `src/game/random.ts` and its suite** — covers: FR-1, NFR-4
  - [x] **P1.T1.1: Module + TSDoc** — export the `Rng` type alias and
    `shuffle<T>(items: readonly T[], rng?: Rng): T[]` copying the exact
    Fisher-Yates body from `shapeSorterLogic.ts` with `Math.random` replaced
    by the `rng` parameter; TSDoc per NFR-2/a house wording (returns a copy,
    input untouched, rng contract `[0, 1)`).
  - [x] **P1.T1.2: Edge + determinism tests (red → green not applicable; new
    file)** — per AC-1: input untouched, empty → `[]`, single → copy not
    reference, two-element swap, fixed-seed determinism, boundary rng
    `0.0` and `1 - Number.EPSILON` keep indices in range over a realistic
    pool (≥ 24 items).
- [x] **P1.T2: Create the shared seeded test helper** — covers: FR-5
  - [x] **P1.T2.1: `randomHelper.ts`** — export `mulberry32(seed: number):
    () => number` with a TSDoc seed contract; no dependencies.
  - [x] **P1.T2.2: Helper test** — fixed seed reproduces the documented
    sequence property (same seed → same sequence; different seed →
    different sequence; output always in `[0, 1)`).

**Result:** verified
**Checkpoint:** 8f8e2236
**Evidence:** conductor/tracks/20261025-shared-random-helpers/verification/phase-1.md

## Phase 2: Cut over shuffle consumers, delete the five copies

- **Goal:** exactly one `shuffle` definition remains in `src/game`; all 13
  `shapeSorterLogic`-shuffle importers point at `./random`; the four private
  copies are deleted; no test or scene behavior changes.
- **Depends on:** Phase 1
- **Covers:** FR-2, NFR-1, AC-2 (shuffle half)
- **Touches:** `src/game/animalTraceLogic.ts`, `src/game/bigSmallLogic.ts`,
  `src/game/popFreezeLogic.ts`, `src/game/shadowMatchLogic.ts`,
  `src/game/shapeSorterLogic.ts`, `src/game/addItUpLogic.ts`,
  `src/game/alphabetLogic.ts`, `src/game/colorMatchLogic.ts`,
  `src/game/countLogic.ts`, `src/game/decodeLogic.ts`,
  `src/game/firstSoundsLogic.ts`, `src/game/memoryMatchLogic.ts`,
  `src/game/moreLessLogic.ts`, `src/game/numberOrderLogic.ts`,
  `src/game/oddOneOutLogic.ts`, `src/game/patternBuilderLogic.ts`,
  `src/game/takeAwayLogic.ts`, `src/game/wordLogic.ts`,
  `src/scenes/ShapeSorterScene.ts`, and the test files that import `shuffle`
  from those modules (import-line swaps only)
- **Verification:** full `verify_phase` chain (as Phase 1)
- **Status:** verified

- [x] **P2.T1: Delete the four private copies** — covers: FR-2
  - [x] **P2.T1.1: Remove `shuffle` from** `animalTraceLogic`, `bigSmallLogic`,
    `popFreezeLogic`, `shadowMatchLogic`; their internal callers import from
    `./random`.
  - [x] **P2.T1.2: Remove the copy in `shapeSorterLogic`** and its own
    internal usage — `generatePlaythrough`/`poolFor` call paths import from
    `./random` (A5: `generatePlaythrough` inherits the seam via this path).
- [x] **P2.T2: Re-point the import-hub consumers** — covers: FR-2
  - [x] **P2.T2.1: The 12 logic importers** (`addItUp`, `alphabet`,
    `colorMatch`, `count`, `decode`, `firstSounds`, `memoryMatch`,
    `moreLess`, `numberOrder`, `oddOneOut`, `takeAway`, `word`) import
    `shuffle` from `./random`; no other line changes.
  - [x] **P2.T2.2: `ShapeSorterScene` and `patternBuilderLogic`** —
    ShapeSorterScene swaps the shuffle part of its shapeSorterLogic import
    (keeps `generatePlaythrough`, `isMatch`, `ShapeType`);
    patternBuilderLogic keeps `ALL_SHAPES`/`ShapeType` from shapeSorterLogic
    and takes `shuffle` from `./random`.
- [x] **P2.T3: Grep proof of one definition** — covers: FR-2, AC-2
  - [x] **P2.T3.1: Static sweep** — one `function shuffle` definition in
    `src/game` (inside `random.ts`), zero `shuffle` imports from
    `shapeSorterLogic`; record the grep output in the phase evidence.

**Result:** verified
**Checkpoint:** 0b4c7b5a
**Evidence:** conductor/tracks/20261025-shared-random-helpers/verification/phase-2.md

## Phase 3: Thread the RNG seam through the logic modules

- **Goal:** every random-dependent export in the 21 logic modules accepts a
  trailing optional `rng: Rng = Math.random`, threaded to every internal
  random decision; feelingsFaces/storyOrder adopt the shared shuffle with
  sequence-equivalence proven.
- **Depends on:** Phase 2
- **Covers:** FR-3, FR-4, NFR-1, AC-2 (Math.random-defaults-only half), AC-3
- **Touches:** `src/game/animalTraceLogic.ts`, `src/game/bigSmallLogic.ts`,
  `src/game/popFreezeLogic.ts`, `src/game/shadowMatchLogic.ts`,
  `src/game/shapeSorterLogic.ts`, `src/game/patternBuilderLogic.ts`,
  `src/game/musicalMemoryLogic.ts`, `src/game/colorMatchLogic.ts`,
  `src/game/countLogic.ts`, `src/game/numberOrderLogic.ts`,
  `src/game/oddOneOutLogic.ts`, `src/game/feelingsFacesLogic.ts`,
  `src/game/storyOrderLogic.ts`, and the shuffle-import flows from Phase 2
  that must now forward `rng` (`addItUpLogic.ts`, `alphabetLogic.ts`,
  `colorMatchLogic.ts`, `countLogic.ts`, `decodeLogic.ts`,
  `firstSoundsLogic.ts`, `memoryMatchLogic.ts`, `moreLessLogic.ts`,
  `numberOrderLogic.ts`, `oddOneOutLogic.ts`, `takeAwayLogic.ts`,
  `wordLogic.ts`) — matching test files for signature adoption only
  (determinism migration is Phase 4)
- **Verification:** full `verify_phase` chain (as Phase 1)
- **Status:** verified

- [x] **P3.T1: Seam the five shuffle-carrying draw functions** — covers: FR-3
  - [x] **P3.T1.1:** Add trailing `rng: Rng = Math.random` to the exported
    draw/build functions of animalTrace, bigSmall, popFreeze, shadowMatch,
    shapeSorter (via `poolFor`/`shuffle` internal threading per A5), each
    propagated to every internal random call and nested helper.
  - [x] **P3.T1.2:** Same treatment for the seven shuffle-importing modules
    of Phase 2 that make their own random choices beyond shuffle
    (`addItUp`, `decode`, `moreLess`, `takeAway`, `word`, `memoryMatch`,
    `firstSounds`, `alphabet`) — signature + threading only.
- [x] **P3.T2: Seam the remaining direct-Math.random modules** — covers: FR-3
  - [x] **P3.T2.1:** `patternBuilder`, `musicalMemory`, `colorMatch`,
    `count`, `numberOrder`, `oddOneOut` gain the trailing optional rng;
    internal `Math.random` call sites take the parameter.
- [x] **P3.T3: feelingsFaces + storyOrder adopt the shared shuffle** —
  covers: FR-4
  - [x] **P3.T3.1:** Both modules' private `shuffleWith` bodies delegate to
    `shuffle` from `./random`; rng contract and call order preserved so a
    given seed yields the identical draw (suite adds a same-rng
    sequence-equivalence case per AC-3).
- [x] **P3.T4: Static sweep** — covers: FR-3, AC-2
  - [x] **P3.T4.1:** Every `Math.random` occurrence in non-test `src/game/**`
    is a default-parameter initializer or inside `random.ts`; record the
    grep in phase evidence.

**Result:** verified
**Checkpoint:** 3d86bf77
**Evidence:** conductor/tracks/20261025-shared-random-helpers/verification/phase-3.md

## Phase 4: Test migration + docs truth pass

- **Goal:** logic and flow tests draw determinism from injected seeded rng
  (one shared helper), no global `Math.random` stubs remain (outside
  documented default-wiring cases), and the roadmap + product changelog
  reflect completion.
- **Depends on:** Phase 3
- **Covers:** FR-5, FR-6, FR-7, NFR-3, NFR-4, AC-3, AC-4, AC-5, AC-6
- **Touches:** `src/__tests__/game/*.test.ts` (logic suites),
  `src/__tests__/scenes/*.test.ts` (flow suites touching randomness),
  `src/__tests__/helpers/randomHelper.ts` (consumed), `docs/roadmap.md`,
  `conductor/product.md`
- **Verification:** full `verify_phase` chain (as Phase 1)
- **Status:** verified

- [x] **P4.T1: Migrate logic suites** — covers: FR-6
  - [x] **P4.T1.1:** The 11 formerly direct-Math.random logic suites pass
    seeded `mulberry32` output as the new rng argument; global mocks/spies
    deleted; expectations untouched except old-PRNG constant sequences
    re-derived per NFR-1/A3 (document in evidence).
  - [x] **P4.T1.2:** feelingsFaces + shadowMatch suites switch their local
    seeded generators (LCG, Park-Miller) to the shared helper; the
    shadowMatch spy-on-Math.random pattern is deleted.
- [x] **P4.T2: Migrate flow suites** — covers: FR-6
  - [x] **P4.T2.1:** Flow tests (`animalTraceFlow`, `bigSmallFlow`,
    `musicalMemory`, `feelingsFacesFlow`, and any other suite stubbing
    `Math.random`) seed via the helper and pass rng through the scene/logic
    call they exercise; the default-wiring stubs keep a scoped comment.
- [x] **P4.T3: Docs truth pass** — covers: FR-7
  - [x] **P4.T3.1: Roadmap** — retire the duplicate-shuffle Known Issue and
    the "One shuffle, one RNG seam" Future-Work entry; renumber remaining
    Future-Work items; refresh the "checked against the code on" date.
  - [x] **P4.T3.2: Product changelog** — add the
    "Changelog — Shared Random Helpers (<date>)" entry to
    `conductor/product.md` summarizing the consolidation.
- [x] **P4.T4: Validator green** — covers: AC-5, AC-6
  - [x] **P4.T4.1:** `node scripts/validate-docs.js` exits 0 with the
    updated docs.

**Result:** verified
**Checkpoint:** 5db21858
**Evidence:** conductor/tracks/20261025-shared-random-helpers/verification/phase-4.md

## Phase R1: Review Fixes

- **Goal:** Resolve review findings F1–F7 so the test migration proves what it
  claims: one seeded generator, honoured injected rngs, and a seam on every
  random-dependent export.
- **Depends on:** Phase 4
- **Covers:** F1, F2, F3, F4, F5, F6, F7
- **Touches:** `src/__tests__/game/storyOrderLogic.test.ts`,
  `src/__tests__/game/animalTraceLogic.test.ts`,
  `src/__tests__/game/popFreezeLogic.test.ts`,
  `src/__tests__/game/shapeSorterLogic.test.ts`,
  `src/__tests__/scenes/feelingsFacesFlow.test.ts`,
  `src/__tests__/scenes/musicalMemoryFlow.test.ts`,
  `src/game/shapeSorterLogic.ts`, `src/game/storyOrderLogic.ts`,
  `conductor/tracks/20261025-shared-random-helpers/spec.md`,
  `conductor/tracks/20261025-shared-random-helpers/verification/phase-4.md`
- **Verification:** full `verify_phase` chain (as Phase 1), plus the greppable
  proofs `grep "16807" src/__tests__` → empty and
  `grep "function shuffle" src/game` → one hit
- **Status:** verified

- [x] **R1.T1: Replace the surviving Park–Miller generator** — covers: F1
  - [x] **R1.T1.1:** Migrate `storyOrderLogic.test.ts`'s `seededRng` to
    `mulberry32` from the shared helper; re-derive the classic-mix pin and the
    no-repeat seeds; record `grep "16807" src/__tests__` as empty in evidence.
- [x] **R1.T2: Fix the under-scripted rngs** — covers: F2
  - [x] **R1.T2.1:** `animalTraceLogic.test.ts` — budget 10 draws for the
    6-pair shuffle and 8 for the two `generatePathPoints` calls (or cycle the
    script), assert a concrete permutation plus a `Number.isFinite` guard.
  - [x] **R1.T2.2:** `popFreezeLogic.test.ts` — budget 6 draws for the
    4-element shuffle; same finite-value guard.
- [x] **R1.T3: Give `shapeSorterLogic` the seam** — covers: F3
  - [x] **R1.T3.1:** Add trailing `rng: Rng = Math.random` to
    `generatePlaythrough` and forward it to `shuffle(poolFor(shift), rng)`;
    confirm the scene's two-argument call and `toHaveBeenCalledWith(3, 1)`
    assertions still hold.
  - [x] **R1.T3.2:** Replace the scoped `Math.random` spy in
    `shapeSorterLogic.test.ts` with a seeded same-rng determinism case; amend
    assumption A5 in `spec.md` to describe the real mechanism.
- [x] **R1.T4: Annotate the retained flow stubs** — covers: F4
  - [x] **R1.T4.1:** Add the FR-6/A4 comment to
    `feelingsFacesFlow.test.ts:183` and `musicalMemoryFlow.test.ts:400`;
    restate the exception in FR-6/AC-4 and the Phase-4 evidence as "scoped
    scene-level stubs in flow suites, each carrying a comment".
- [x] **R1.T5: Add the missing seeded determinism cases** — covers: F5
  - [x] **R1.T5.1:** `animalTraceLogic` — `generatePathPoints(..., mulberry32(1234))`
    twice ⇒ equal. `popFreezeLogic` — `generateInitialBubbles(..., mulberry32(1234))`
    twice ⇒ equal. Restate the Phase-4 evidence about constant closures.
- [x] **R1.T6: Record the signature deviations** — covers: F6, F7
  - [x] **R1.T6.1:** Document the rng-first `buildPlaythrough` signature as a
    deliberate FR-3 deviation (scene-call compatibility) in the TSDoc and the
    evidence; correct the Phase-4 suite count, add the omitted
    `storyOrderLogic.test.ts`, and replace the repo-wide AC-4 claim with an
    exact grep result.


**Result:** verified
**Checkpoint:** a9c41674
**Evidence:** conductor/tracks/20261025-shared-random-helpers/verification/phase-R1.md
