# Phase 3 — The six multi-draw scenes, and the equivalence proof

- **Track:** `20261026-scene-rng-seam`
- **Phase:** 3 — The six multi-draw scenes, and the equivalence proof
- **Date:** 2026-10-26
- **Branch:** `refactor/20261026-scene-rng-seam`
- **Base commit:** `c7cc4314`
- **Head commit:** `1582329f`
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | 258 files; 1 warning + 1 info, both pre-existing (`musicalMemoryScene.test.ts:294` `noNonNullAssertion`; `biome.json` `$schema` 2.5.5 vs CLI 2.5.10) |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| unit | `pnpm test -- --run` | 0 | 125 files / 2702 tests passed (2694 before this phase; +8 from the new equivalence suite) |
| unit | `pnpm test:coverage` | 0 | 97.82 statements / 91.96 branches / 96.77 functions / 98.74 lines against 90 / 85 / 88 / 95 |
| build-artifact | `pnpm build` | 0 | 344 modules; PWA `generateSW` 54 precache entries (1727.85 KiB) |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present (1342.6 kB); shell entry `index-COuCveC-.js` 138.7 kB ≤ 200 kB |
| smoke | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed (42 chunks, 42 precached) |
| docs | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| FR-4 | Every builder call site in `src/scenes/**` passes `this.rng` in that builder's actual parameter position, including nested draws | `AnimalTraceScene.ts:134` (`selectThreePairs(this.rng)` — rng first and only), `:171` (`generatePathPoints(…, this.rng)` — sixth position); `BigSmallScene.ts:149` (`generateRound(this.factors, this.rng)` — rng second); `MusicalMemoryScene.ts:124` (`generateSequence(startLength, this.rng)` — second), `:280` (`appendNote(this.sequence, this.rng)` — second); `PopFreezeScene.ts:134` (`generateInitialBubbles(…, this.rng)` — fifth), `:294` (`selectBubbleType(sleepingCount, this.sleepBounds, this.rng)` — third), `:300` (`generateSpawnConfig(…, this.rng)` — fifth); `WordBuilderScene.ts:129` (`generateWordBuildPlaythrough(WORD_COUNT, getAdaptiveBandShift("word-builder"), this.rng)` — third), `:176` (`generateLetterTiles(word.word, this.rng)` — second); `StoryOrderScene.ts:91` (`buildPlaythrough(this.rng, getAdaptiveBandShift("story-order"))` — rng **first**, substitution not reorder). Nested draws: `BigSmallScene.createToys` calls no logic function (it consumes `this.round.toys` produced by `generateRound`, whose internals chain `selectToys`/`shuffle`/`createBoxes` through the one rng — proven by the Big & Small equivalence case); `PopFreezeScene` initial configs are one `generateInitialBubbles` call whose internals chain `selectBubbleType`+`generateSpawnConfig` through the same rng (proven by the Pop & Freeze equivalence case), and the respawn path threads `this.rng` into both explicitly (`:294`, `:300`) | satisfied |
| FR-5 | No `Math.random` remains in `src/scenes/**` outside a default-parameter initializer | Static sweep (see Notes): 25 matches, all 23 default-parameter constructor initializers + 2 TSDoc prose mentions (`GameSceneBase.ts:65`, `GroupMathScene.ts:79`); zero live draws. The Phase 2 deferred live draw `StoryOrderScene:90` is now `this.rng` (`:91`) | satisfied |
| NFR-1 | Behavior-preserving; production keeps the `Math.random` default | Every scene constructor takes `rng: Rng = Math.random` (e.g. `AnimalTraceScene.ts:112`), and Phaser instantiates scenes with zero arguments, so production always takes the default — identical behavior to the pre-seam calls. Build artifacts unchanged: 344 modules, 54 precache entries, shell entry 138.7 kB | satisfied |
| AC-3 | A seeded scene produces output equal to calling the same builder directly with the same seed — argument **position**, not merely presence | `src/__tests__/scenes/sceneRngEquivalence.test.ts` — 8 passing cases, each replaying the builders directly with one shared `mulberry32(SEED)` instance in the scene's draw order and comparing against the scene's state. Teeth proven by mutation: with `StoryOrderScene.ts:91` temporarily swapped to `buildPlaythrough(shift, this.rng)`, the Story Order case failed (`TypeError: rng is not a function`); reverted and green again | satisfied |
| AC-4 | Add It Up and Take Away each have a seeded determinism case driven through `GroupMathScene` | `sceneRngEquivalence.test.ts` — `new AddItUpScene(mulberry32(SEED))` + `create()` vs `addItUpLogic.buildPlaythrough(SHIFT, rng)`; `new TakeAwayScene(mulberry32(SEED))` + `create()` vs `takeAwayLogic.buildPlaythrough(SHIFT, rng)`; both construct through `GroupMathScene` → `ChoiceRoundScene` → `GameSceneBase`, proving the Phase 1 `GroupMathScene.ts:117` forwarding end-to-end | satisfied |

## Files touched

- `src/scenes/AnimalTraceScene.ts` — `Rng` import, `constructor(rng: Rng = Math.random)`, `selectThreePairs(this.rng)` (`:134`), `generatePathPoints` sixth arg (`:171`)
- `src/scenes/BigSmallScene.ts` — `Rng` import, constructor, `generateRound(this.factors, this.rng)` (`:149`)
- `src/scenes/MusicalMemoryScene.ts` — `Rng` import, constructor, `generateSequence(startLength, this.rng)` (`:124`), `appendNote(this.sequence, this.rng)` (`:280`)
- `src/scenes/PopFreezeScene.ts` — `Rng` import, constructor, `generateInitialBubbles(…, this.rng)` (`:134`), `selectBubbleType(…, this.rng)` (`:294`), `generateSpawnConfig(…, this.rng)` (`:300`)
- `src/scenes/WordBuilderScene.ts` — `Rng` import, constructor, `generateWordBuildPlaythrough(…, this.rng)` (`:129`), `generateLetterTiles(word.word, this.rng)` (`:176`)
- `src/scenes/StoryOrderScene.ts` — `Rng` import, constructor, `buildPlaythrough(this.rng, getAdaptiveBandShift("story-order"))` (`:91`, rng stays first)
- `src/__tests__/scenes/sceneRngEquivalence.test.ts` — new, 8 equivalence cases
- `src/__tests__/scenes/bigSmallScene.test.ts` — three arity repairs (see Deviations)

Commits: `89392f26` (scene forwarding), `1582329f` (equivalence test + arity repairs).

## Deviations

- `src/__tests__/scenes/bigSmallScene.test.ts` (outside Touches): the scene now forwards `this.rng`, so the three `generateRoundMock` assertions at `:110`, `:118`, `:125` broke on arity. Repaired by appending `expect.any(Function)` — the same non-weakening repair pattern Phase 2 used for twelve exact-arity assertions (P2.T4.1). The original subject (the factors argument) is unchanged; only the new generator position is pinned. The musical-memory and word-builder wrappers record only the leading arguments (their mock signatures predate the rng seam), so their existing assertions pass unchanged.

## Notes

**Static sweep (FR-5), verbatim counts.** `rtk git grep -n "Math.random" -- src/scenes/` returns 25 matches: 23 default-parameter constructor initializers (`AddItUpScene:27`, `AlphabetScene:48`, `AnimalTraceScene:112`, `BigSmallScene:105`, `ColorMatchScene:55`, `DecodeItScene:38`, `FeelingsFacesScene:91`, `FirstSoundsScene:55`, `GameSceneBase:167`, `HowManyScene:64`, `MemoryMatchScene:84`, `MoreLessScene:62`, `MusicalMemoryScene:105`, `NumberOrderScene:49`, `OddOneOutScene:39`, `PatternBuilderScene:87`, `PopFreezeScene:101`, `ShadowMatchScene:98`, `ShapeSorterScene:76`, `StoryOrderScene:58`, `TakeAwayScene:28`, `WordBuilderScene:99`, `WordMatchScene:55`) plus 2 TSDoc prose mentions (`GameSceneBase:65`, `GroupMathScene:79`). Zero live draws remain.

**Per-scene equivalence outcomes (all 8 cases pass).** Each case constructs the scene with `mulberry32(2026)`, drives `create()`, reads private state via `as unknown as` casts (no production API widened — recorded choice), and replays the builders with one fresh `mulberry32(2026)` so draws chain exactly as the scene consumed them:

- Animal Trace — scene pairs + first pair's path points vs `selectThreePairs(rng)` chained into `generatePathPoints(200, 384, 824, 384, waypointsFor(SHIFT), rng)`. **Driven** end-to-end; no drive-or-document decision needed.
- Big & Small — scene `factors` + `round` (toys + boxes) vs `generateRound(scaleFactorsFor(SHIFT), rng)`. **Driven**.
- Musical Memory — initial sequence vs `generateSequence(startLengthFor(SHIFT), rng)`, then `handleRoundSuccess()` driven through the scene and the replay's `appendNote(sequence, rng)` compared against the grown sequence. **Driven**, not documented.
- Pop & Freeze — initial bubble configs vs `generateInitialBubbles(1024, 768, 96, sleepingBoundsFor(SHIFT), rng)` (mock scale is 1024×768), then one real pop driven via `handleTap` on a poppable bubble, and the respawned (last) config compared against `selectBubbleType(sleepingCount, bounds, rng)` → `generateSpawnConfig(…, type, rng)`. **Driven**, not documented.
- Build the Word — scene words + first round's tiles vs chained `generateWordBuildPlaythrough(3, SHIFT, rng)` + `generateLetterTiles(firstTarget, rng)` on the shared instance. **Driven**.
- Story Order — scene rounds vs `buildPlaythrough(rng, SHIFT)` with rng **first** (AC-3 centerpiece; the only case that fails if the argument order is later "normalized" — verified by the mutation check).
- Add It Up / Take Away (AC-4) — seeded rounds through `GroupMathScene` vs `buildPlaythrough(SHIFT, rng)` from `addItUpLogic` / `takeAwayLogic`.

No unlisted extra draws were discovered: every `create()` consumes exactly the draws the replay restates, and the two growth-path scenes (`MusicalMemory.appendNote`, `PopFreeze` respawn) were driven rather than documented.

**Other observations.** `wordBuilderScene.test.ts:87` and `wordMatchScene.test.ts:87` mock wrappers have two-parameter signatures that drop a third rng argument when the scene calls with `(wordCount, shift, rng)` - their assertions still pass because the recorded args are unchanged, but the rng path is silently stripped in those suites. Left untouched (pre-existing shape, same accepted state as Phase 2); flagging as a Phase 4 candidate. Shell entry stayed at 138.7 kB and the precache count at 54; branches rose 91.93 → 91.96.

## Primary verification

The primary independently verified the phase against checkpoint-range `c7cc4314..HEAD` on 2026-10-26.

- **Worktree clean; diff vs Touches**: `git diff --name-only c7cc4314..HEAD` returns exactly the six scene files, the new `sceneRngEquivalence.test.ts`, `bigSmallScene.test.ts` (the disclosed deviation), and the evidence file. No off-Touches file beyond the disclosed one.
- **Story Order preserved**: `StoryOrderScene.ts:91` reads `buildPlaythrough(this.rng, getAdaptiveBandShift("story-order"))` — rng first, substitution not reorder.
- **All eleven call sites audited by diff**: each constructor forwards, each site passes `this.rng` at the position the live signature dictates (`selectThreePairs(rng)` first; `generatePathPoints(..., rng)` sixth; `generateRound(factors, rng)` second; `generateSequence(length, rng)` / `appendNote(seq, rng)` second; `generateInitialBubbles(..., rng)` / `generateSpawnConfig(..., rng)` fifth; `selectBubbleType(count, bounds, rng)` third; `generateWordBuildPlaythrough(count, shift, rng)` third; `generateLetterTiles(word, rng)` second).
- **bigSmallScene arity repair audited**: exactly 3 insertion/deletion pairs, each appending `expect.any(Function)` after the unchanged factors object — no other assertion touched.
- **Equivalence suite audited**: 8 cases (6 scenes + Add It Up + Take Away), each replaying the builder sequence through one shared `mulberry32(2026)` instance in the scene's draw order, reading scene state via `as unknown as` casts. The two growth paths were driven, not documented.

| Layer | Command | Exit | Primary result |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | 258 files; 1 warning + 1 info, both pre-existing |
| static | `pnpm typecheck` | 0 | clean |
| unit | `pnpm test -- --run` | 0 | 125 files / 2702 tests passed |
| unit | `pnpm test:coverage` | 0 | 97.82 st / 91.96 br / 96.77 fn / 98.74 ln — all gates clear |
| build-artifact | `pnpm build` | 0 | 344 modules; 54 precache entries |
| build-artifact | `node scripts/validate-bundle.js` | 0 | all bundle validation checks passed |
| build-artifact | `node scripts/validate-pwa.js` | 0 | all PWA validation checks passed |
| smoke/docs | `node scripts/validate-docs.js` | 0 | all document validation checks passed |

**Primary verdict: verified.** The squash guard over `c7cc4314..HEAD` found three commits and no merge commits.
