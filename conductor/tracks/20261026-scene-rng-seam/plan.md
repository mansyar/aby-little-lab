# Implementation Plan: Scene RNG Seam

- **Branch:** `refactor/20261026-scene-rng-seam`
- **Base:** `master` @ `0a6758c0`

Phase states: `pending` | `in_progress` | `verified` | `failed` | `blocked`.
Only the primary agent writes this file.

---

## Phase 1: Base seam

- **Goal:** `GameSceneBase` carries a `protected readonly rng`, and
  `GroupMathScene` forwards it to its config's builder. No scene is changed yet,
  so production behavior is bit-identical and the phase is verifiable on its own.
- **Depends on:** none
- **Covers:** FR-1, FR-3, NFR-2
- **Touches:** `src/scenes/GameSceneBase.ts`, `src/scenes/GroupMathScene.ts`,
  `src/__tests__/scenes/gameSceneBaseRng.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P1.T1: Add the rng seam to GameSceneBase** — covers: FR-1
  - [ ] **P1.T1.1:** Change the constructor to
        `constructor(key: string, rng: Rng = Math.random)`, store
        `protected readonly rng: Rng`, and document the `[0, 1)` contract plus the
        reason it is a constructor parameter (Phaser instantiates with no
        arguments, so the default always applies in production).
  - [ ] **P1.T1.2:** Add `src/__tests__/scenes/gameSceneBaseRng.test.ts` covering:
        the default is `Math.random` when no argument is passed, an injected
        generator is retained unchanged, and the field is not reassigned across a
        shutdown/restart cycle.

- [ ] **P1.T2: Forward the rng through GroupMathScene** — covers: FR-3
  - [ ] **P1.T2.1:** Widen `GroupMathConfig.buildPlaythrough` from
        `(shift: BandShift) => Round[]` to `(shift: BandShift, rng?: Rng) => Round[]`.
        Both consumers (`addItUpLogic`, `takeAwayLogic`) already match this shape,
        so no scene file changes.
  - [ ] **P1.T2.2:** Pass `this.rng` at `GroupMathScene.ts:110`, making the call
        `this.config.buildPlaythrough(getAdaptiveBandShift(this.config.gameId), this.rng)`.

---

## Phase 2: Forward through the sixteen single-draw scenes

- **Goal:** every scene whose randomness is one builder call accepts `rng` and
  passes it in that builder's correct parameter position.
- **Depends on:** Phase 1
- **Covers:** FR-2, FR-4, FR-5, AC-2 (scene half)
- **Touches:** `src/scenes/AddItUpScene.ts`, `src/scenes/TakeAwayScene.ts`,
  `src/scenes/AlphabetScene.ts`, `src/scenes/ColorMatchScene.ts`,
  `src/scenes/DecodeItScene.ts`, `src/scenes/FeelingsFacesScene.ts`,
  `src/scenes/FirstSoundsScene.ts`, `src/scenes/HowManyScene.ts`,
  `src/scenes/MemoryMatchScene.ts`, `src/scenes/MoreLessScene.ts`,
  `src/scenes/NumberOrderScene.ts`, `src/scenes/OddOneOutScene.ts`,
  `src/scenes/PatternBuilderScene.ts`, `src/scenes/ShapeSorterScene.ts`,
  `src/scenes/ShadowMatchScene.ts`, `src/scenes/WordMatchScene.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P2.T1: Constructor forwarding across the sixteen scenes** — covers: FR-2
  - [ ] **P2.T1.1:** Change each scene's existing constructor from
        `constructor() { super("Key"); }` to
        `constructor(rng: Rng = Math.random) { super("Key", rng); }`, importing
        `type Rng` from `../game/random`. Add It Up and Take Away need only this
        step — their builder arrives via the config.

- [ ] **P2.T2: Builder call sites** — covers: FR-4
  - [ ] **P2.T2.1:** Pass `this.rng` at each scene's single call site, matching
        that module's real signature. Known positions:
        `alphabetLogic.generatePlaythrough(roundCount, shift, rng)`,
        `colorMatchLogic.buildPlaythrough(shift, rng)`,
        `decodeLogic.buildPlaythrough(roundCount, shift, rng)`,
        `feelingsFacesLogic.drawScenarios(rng)`,
        `firstSoundsLogic.generatePhonicsPlaythrough(shift, rng)`,
        `countLogic.createPlaythrough(shift, rng)`,
        `memoryMatchLogic.buildPlaythrough(shift, rng)`,
        `moreLessLogic.createPlaythrough(shift, rng)`,
        `numberOrderLogic.buildPlaythrough(shift, rng)`,
        `oddOneOutLogic.createPlaythrough(shift, rng)`,
        `patternBuilderLogic.generatePlaythrough(roundCount, shift, rng)`,
        `shapeSorterLogic.generatePlaythrough(roundCount, shift, rng)`,
        `shadowMatchLogic.generateRound(shift, rng)`,
        `wordLogic.generateWordPlaythrough(roundCount, shift, rng)`.
        Verify each against the module before editing; do not assume a uniform
        shape.

- [ ] **P2.T3: Static sweep** — covers: FR-5, AC-2
  - [ ] **P2.T3.1:** Run `grep "Math\.random" src/scenes` and confirm zero
        matches, then record the verbatim command and output in the evidence file.

---

## Phase 3: The six multi-draw scenes, and the equivalence proof

- **Goal:** thread the rng through scenes that draw more than once, preserving
  `storyOrderLogic`'s rng-first signature, and prove each call site's argument
  position with an equivalence test.
- **Depends on:** Phase 2
- **Covers:** FR-4, FR-5, AC-3, AC-4
- **Touches:** `src/scenes/AnimalTraceScene.ts`, `src/scenes/BigSmallScene.ts`,
  `src/scenes/MusicalMemoryScene.ts`, `src/scenes/PopFreezeScene.ts`,
  `src/scenes/WordBuilderScene.ts`, `src/scenes/StoryOrderScene.ts`,
  `src/__tests__/scenes/sceneRngEquivalence.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P3.T1: Animal Trace and Big & Small** — covers: FR-4
  - [ ] **P3.T1.1:** `AnimalTraceScene` forwards `this.rng` to both
        `generatePathPoints(x, y, x, y, count, rng)` and `selectThreePairs(rng)`.
  - [ ] **P3.T1.2:** `BigSmallScene` forwards `this.rng` to
        `generateRound(factors, rng)` and threads it through
        `createToys()` into `selectToys(rng)` and `createBoxes(factors, rng)`.

- [ ] **P3.T2: Musical Memory and Pop & Freeze** — covers: FR-4
  - [ ] **P3.T2.1:** `MusicalMemoryScene` forwards `this.rng` to
        `generateSequence(length, rng)` and to every `appendNote(sequence, rng)`
        per-tap call.
  - [ ] **P3.T2.2:** `PopFreezeScene` forwards `this.rng` to
        `generateInitialBubbles(..., rng)`, to each
        `generateSpawnConfig(..., rng)`, and to `selectSleepingAnimal(rng)`.

- [ ] **P3.T3: Build the Word and Story Order** — covers: FR-4, FR-5
  - [ ] **P3.T3.1:** `WordBuilderScene` forwards `this.rng` to
        `generateWordBuildPlaythrough(count, shift, rng)` and to
        `generateLetterTiles(word, rng)`.
  - [ ] **P3.T3.2:** `StoryOrderScene` replaces the explicit `Math.random`
        argument at `:90` with `this.rng`, keeping it in **first** position:
        `buildPlaythrough(this.rng, getAdaptiveBandShift("story-order"))`.
        Document why the position differs from every other builder.

- [ ] **P3.T4: Equivalence proof** — covers: AC-3, AC-4
  - [ ] **P3.T4.1:** Add `src/__tests__/scenes/sceneRngEquivalence.test.ts`:
        for every scene, drive the scene with `mulberry32(seed)` and assert its
        rounds equal a direct call to the same builder with the same seed. A
        determinism assertion alone would pass with the generator in the wrong
        parameter slot; this one fails.
  - [ ] **P3.T4.2:** Add seeded determinism cases for Add It Up and Take Away
        driven through `GroupMathScene`, satisfying AC-4.

---

## Phase 4: Test migration

- **Goal:** the 52 `vi.spyOn(Math, "random")` sites across 27 files become
  seeded injections, and no global stub remains.
- **Depends on:** Phase 3
- **Covers:** FR-6, AC-1, AC-2
- **Touches:** `src/__tests__/scenes/*.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P4.T1: Per-game scene suites** — covers: FR-6, AC-1
  - [ ] **P4.T1.1:** In each of the 22 scene suites, construct the scene with
        `mulberry32(seed)` instead of stubbing `Math.random`, delete the stub and
        its `afterEach` restore where nothing else needs it, and re-derive any
        expectation that was pinned to a mocked constant. Do not loosen an
        assertion to make it pass.
  - [ ] **P4.T1.2:** Confirm each suite still fails if the rng is ignored —
        either by construction or by one explicit check per suite.

- [ ] **P4.T2: Flow and integration suites** — covers: FR-6
  - [ ] **P4.T2.1:** Migrate the five flow suites (`animalTraceFlow`,
        `feelingsFacesFlow`, `musicalMemoryFlow`, `patternBuilderFlow`,
        `popFreezeFlow`) plus `sceneLifecycle.test.ts` and
        `firstWordsIntegration.test.ts`, then delete the FR-6/A4 annotation
        comments that no longer apply.

- [ ] **P4.T3: Static proof** — covers: AC-2
  - [ ] **P4.T3.1:** Run `grep "vi.spyOn(Math" src/__tests__/scenes` and
        `grep "Math\.random" src/scenes`, confirm both are empty, and record the
        verbatim commands and output in the evidence file.

---

## Phase 5: Docs truth pass

- **Goal:** delete the FR-6 exception rather than re-documenting it, and record
  the change in the project's living documents.
- **Depends on:** Phase 4
- **Covers:** FR-7, AC-6
- **Touches:** `conductor/tracks/20261026-scene-rng-seam/spec.md`,
  `conductor/tech-stack.md`, `conductor/product.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P5.T1: Retire the FR-6 exception** — covers: FR-7
  - [ ] **P5.T1.1:** Amend this track's `spec.md` FR-6 and AC-4 so the scene
        carve-out is gone, leaving only the narrowly scoped default-wiring clause.

- [ ] **P5.T2: Living documents** — covers: FR-7
  - [ ] **P5.T2.1:** Add a dated design-update blockquote to
        `conductor/tech-stack.md` covering the scene seam, the `GroupMathConfig`
        signature change, and the rng-first `buildPlaythrough` exception.
  - [ ] **P5.T2.2:** Add a `## Changelog - Scene RNG Seam (<date>)` section to
        `conductor/product.md` stating the no-visible-change guarantee.

- [ ] **P5.T3: Validator** — covers: AC-6
  - [ ] **P5.T3.1:** Confirm `node scripts/validate-docs.js` exits 0 and record
        the result in the evidence file.

---

<!-- Review fixes are appended by conductor-review as:

## Phase R1: Review Fixes

- **Goal:** Resolve review findings ...
- **Depends on:** Phase 5
- **Covers:** F1, F2, ...
- **Touches:** ...
- **Verification:** ...
- **Status:** pending

- [ ] **R1.T1: Resolve <finding ID>** — covers: <finding ID>

-->
