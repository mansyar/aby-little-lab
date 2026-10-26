# Phase 4 Verification — Test migration (scene suites → injected seeded rng)

- **Track:** 20261026-scene-rng-seam
- **Phase:** 4 of 5
- **Date:** 2026-10-26
- **Branch:** `refactor/20261026-scene-rng-seam`
- **Base:** `5900e51a` (phase base) — **Head:** `5b2d4014`
- **Result:** ✅ verified

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| lint/format | `pnpm check` | 0 | Biome check clean; 1 pre-existing-style warning (noNonNullAssertion in musicalMemoryScene.test.ts:297) + biome schema-version info, both non-blocking |
| types | `pnpm typecheck` | 0 | tsc --noEmit clean |
| tests | `pnpm test -- --run` | 0 | 125 files / **2729 tests passed** (52 migrated spy sites + 27 new tests named `(AC-1)`; pre-phase-4 baseline was 2702 — the Phase 3 gate — plus 27) |
| coverage | `pnpm test:coverage` | 0 | lines 98.74 / functions 96.77 / branches 91.96 / statements 97.82 — all NFR-3 gates met |
| build | `pnpm build` | 0 | vite build ok (phaser vendor chunk 1342.6 kB, shell 138.7 kB ≤ 200 kB) |
| bundle | `node scripts/validate-bundle.js` | 0 | all checks passed |
| pwa | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| docs | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed |

Fix attempts during the gate: first run failed on biome import-order/format diagnostics from the new `mulberry32` imports (fix 1: `pnpm format` + `pnpm check -- --write src/__tests__/scenes`, 17 files auto-fixed, committed `c44753f2`); second run green. A later formatting wrap on the newly added popFreezeFlow AC-1 case was fixed and committed (`a2730a4c`) before the final green gate. After the rework below, one more fix attempt: the shadowMatchFlow AC-1 case needed import-order + line-wrap fixes via `pnpm check -- --write src/__tests__/scenes/shadowMatchFlow.test.ts`, committed `5b2d4014`; the final rework gate ran green.

## ACs

| AC | Criterion | Status | Evidence |
|---|---|---|---|
| FR-6 | Every `vi.spyOn(Math, "random")` in scene/flow suites replaced by injected seeded rng; FR-6/A4 annotation comments deleted with their stubs | ✅ | Sweep 1 below (0 matches); 8 FR-6/A4 comments removed (animalTraceFlow ×1, feelingsFacesFlow ×1, musicalMemoryFlow ×3, popFreezeFlow ×3) |
| NFR-3 | Coverage gates lines 95 / functions 88 / branches 85 / statements 90 | ✅ | 98.74 / 96.77 / 91.96 / 97.82 |
| AC-1 | Construct each scene twice with `mulberry32(1234)`, identical rounds/state | ✅ | All 22 game scenes have a two-construction determinism case named `(AC-1)`: 21 in their own per-game suite (the 19 migrated during the main phase, plus popFreezeScene and shapeSorterScene added in the rework) and ShadowMatchScene in `shadowMatchFlow.test.ts` (its scene coverage is flow-only — there is no `shadowMatchScene.test.ts`). Plus 5 flow-suite cases (animalTraceFlow, feelingsFacesFlow, musicalMemoryFlow, patternBuilderFlow, popFreezeFlow), for 27 named `(AC-1)` tests total. Cross-cutting sceneLifecycle / firstWordsIntegration intentionally add no duplicates — every scene they exercise already has an AC-1 case in its own suite ("don't duplicate existing"). |
| AC-2 | Static proof sweeps (see Notes) | ✅ | FR-5 reading honored; wording conflict with AC-2's "zero matches" noted below for Phase 5 |
| AC-5 | `verify_phase` green | ✅ | Full gate green at head `5b2d4014` |

## Files touched (30 test files: the 27 census files + 3 rework additions)

addItUpScene, alphabetScene, animalTraceFlow, animalTraceScene, bigSmallScene,
colorMatchScene, decodeItScene, feelingsFacesFlow, feelingsFacesScene,
firstSoundsScene, firstWordsIntegration, howManyScene, memoryMatchScene,
moreLessScene, musicalMemoryFlow, musicalMemoryScene, numberOrderScene,
oddOneOutScene, patternBuilderFlow, patternBuilderScene, popFreezeFlow,
popFreezeScene, sceneLifecycle, storyOrderScene, takeAwayScene,
wordBuilderScene, wordMatchScene — all under `src/__tests__/scenes/`.

Rework additions beyond the 27-file census enumeration (all inside the plan's
`src/__tests__/scenes/*.test.ts` Touches glob; one-line reason: AC-1 applies
to every scene, and these three had no census stub to migrate):

- `popFreezeScene.test.ts` — seeded throughout during the main phase, but had
  no two-construction identical case.
- `shapeSorterScene.test.ts` — never stubbed `Math.random` (its
  `shapeSorterLogic` wrapper already forwards all args), so it never entered
  the census; no `mulberry32` usage at all before the rework.
- `shadowMatchFlow.test.ts` — ShadowMatchScene's scene coverage is flow-only
  (no `shadowMatchScene.test.ts` exists); it constructs `new
  ShadowMatchScene()` bare at 22 sites and was never in the census.

No production files touched.

## Deviations

- Census-scope additions inside the `Touches` glob: `popFreezeScene.test.ts`,
  `shapeSorterScene.test.ts`, and `shadowMatchFlow.test.ts` were not among the
  27 census files but are required for AC-1 ("a test constructs each scene
  twice...") — popFreezeScene lacked a two-construction case despite being
  seeded, shapeSorterScene never stubbed `Math.random` so it never entered the
  census, and ShadowMatchScene has no per-game suite at all (flow-only
  coverage). See the Files-touched list for details.
- None outside `Touches` except this evidence file. `src/__tests__/helpers/gameScenes.ts` was NOT edited: `sceneLifecycle`'s `it.each(GAME_SCENES)` shutdown case seeds via `new SceneClass(mulberry32(1234))` in the test file itself (all 12 game-scene constructors accept an optional rng, so this typechecks without touching the helper).

## Commits (task-level, conventional, no amends)

- `3b8984c9` test(scenes): Seed the scene suites through the injected rng (animalTraceScene, addItUpScene, takeAwayScene)
- `ba5d7a7c` test(scenes): Seed the per-game suites through the injected rng (10 files)
- `b68d1bd1` test(scenes): Seed the remaining game suites through the injected rng (6 files)
- `2dab6b90` test(scenes): Seed the flow suites through the injected rng (5 files)
- `9554e66c` test(scenes): Seed the lifecycle and integration suites through the injected rng (sceneLifecycle, firstWordsIntegration)
- `c44753f2` test(scenes): Sort imports and wrap line formatting after rng seeding (biome auto-fix across 18 files)
- `dc63b19e` test(scenes): Add the AC-1 determinism case to the PopFreeze flow suite
- `a2730a4c` test(scenes): Wrap the AC-1 bubble layout comparison for biome formatting
- `066e5375` test(scenes): Add the missing AC-1 determinism cases for PopFreeze, ShapeSorter, and ShadowMatch (rework)
- `5b2d4014` test(scenes): Sort imports and wrap the ShadowMatch AC-1 comparison for biome (rework)

### Rework (post-review): three missing AC-1 cases

Independent verification found AC-1 unmet for three scenes. Added:

- `popFreezeScene.test.ts` — "spawns identical bubble layouts from two
  mulberry32(1234) constructions (AC-1)": constructs twice, `create()` both,
  compares the per-scene `physics.add.image` call args (x, y) of the 5 spawn
  draws. Suite: 15 → 16 passed.
- `shapeSorterScene.test.ts` — "builds an identical playthrough from two
  mulberry32(1234) constructions (AC-1)": `createScene()` seeded
  (`new ShapeSorterScene(mulberry32(1234))`), compares `getInternals(...).playthrough`.
  Suite: 12 → 13 passed. `mulberry32` import added.
- `shadowMatchFlow.test.ts` — "builds an identical round from two
  mulberry32(1234) constructions (AC-1)": constructs twice, `create()` both,
  compares the scene's `round` (`{objects, shadows}` of `ObjectType`) via typed
  `as unknown as` casts (no `any`). Suite: 23 → 24 passed. Imports: `mulberry32`
  + `type ObjectType`. The file's 22 bare `new ShadowMatchScene()` constructor
  sites were left unseeded — the suite was never Math.random-stubbed, and only
  the AC-1 case requires determinism; changing the other 22 sites is out of the
  rework's scope and is not needed for FR-6 or AC-1.

Evidence arithmetic corrected: pre-phase-4 baseline is 2702 (Phase 3 gate),
not 2700; only tests named `(AC-1)` are counted as AC-1 cases — 27 total
(24 before rework + 3). Final gate at `5b2d4014`: 2729 tests passed.

## Notes

### Per-file stub→seed mapping (52 spy sites → 0)

All 27 census files migrated by hand with targeted edits (no bulk regex), suite
re-run after each file. Uniform pattern: `import { mulberry32 } from
"../helpers/randomHelper";`, remove every `vi.spyOn(Math,
"random").mockReturnValue(0.5)` line (and its FR-6/A4 comment where present),
replace every `new XScene()` with `new XScene(mulberry32(1234))`, add one AC-1
determinism test, keep `vi.unstubAllGlobals()` in afterEach wherever
`stubMatchMedia` / `speechSynthesis` stubs remain (matchMedia restoration is
required between tests); only pure-Math.random `vi.restoreAllMocks()` lines
were droppable. Site counts per census were confirmed; per-file construction
replacement counts: animalTraceScene 11, addItUpScene 17, takeAwayScene 17,
alphabetScene 19, bigSmallScene 1 (via createScene helper + direct sites),
colorMatchScene 20, decodeItScene 23, feelingsFacesScene 21, firstSoundsScene
21, howManyScene 21, memoryMatchScene 19, moreLessScene 20, musicalMemoryScene
8, numberOrderScene 23, oddOneOutScene 20, patternBuilderScene 6 (+createScene
helper), popFreezeScene 15, storyOrderScene 30, wordBuilderScene 24,
wordMatchScene 22, animalTraceFlow 27, feelingsFacesFlow 4, musicalMemoryFlow
29, patternBuilderFlow 7, popFreezeFlow 29, sceneLifecycle 6 build closures +
1 standalone + it.each SceneClass, firstWordsIntegration 2+2.

### Mock-wrapper rng forwarding (Phase-3 evidence follow-up)

Nine `vi.mock` wrappers had two-parameter signatures that silently dropped the
forwarded rng argument; all fixed to forward every argument (recorder mocks
keep recording only the old args so existing `toHaveBeenCalledWith`
assertions are unchanged):

- addItUpScene.test.ts (`buildPlaythrough(shift, rng)`)
- takeAwayScene.test.ts (`buildPlaythrough(shift, rng)`)
- decodeItScene.test.ts (`buildPlaythrough(roundCount, shift, rng)`)
- howManyScene.test.ts (`createPlaythrough(shift, rng)`; production
  `createRound(band, target?, rng)` middle optional param untouched)
- memoryMatchScene.test.ts (`buildPlaythrough(shift, rng)`)
- moreLessScene.test.ts (`createPlaythrough(shift, rng)`)
- musicalMemoryScene.test.ts (`generateSequence(length, rng)`)
- wordBuilderScene.test.ts (`generateWordBuildPlaythrough(wordCount, shift, rng)`)
- wordMatchScene.test.ts (`generateWordPlaythrough(roundCount, shift, rng)`)

Already-forwarding wrappers (spread `(...args: Parameters<typeof actual.X>)`):
alphabetLogic, bigSmallLogic, colorMatchLogic, oddOneOutLogic,
patternBuilderLogic, firstSoundsLogic, feelingsFacesLogic — verified, no
change needed. **No unreachable-consumer stubs found** (no stub site existed
where the scene never consumed the rng); the wrapper-drop cases above are the
inverse finding (rng silently stripped while assertions passed).

### Re-derived expectations (previously pinned to `mockReturnValue(0.5)` draws)

- **popFreezeScene / popFreezeFlow** (seed 1234): classic band opens with
  **2** sleeping bubbles (b0 band-forced, b1 wins the 50/50 roll at 0.073),
  hard band **3** (two forced + one rolled), easy band **1**. Poppable taps
  moved from bubbles[1] to bubbles[2]; respawn indices shifted (3 pops →
  respawns at 5-7; the 6-pop round completes via taps 2,3,4 then 5,6,7);
  respawns keep the sleeper count at the classic max (2) so all respawns are
  poppable. Comment-only `Math.random` prose at popFreezeScene 148/309/317 and
  popFreezeFlow rewritten to describe the seeded layout; assertions only ever
  strengthened/retargeted, none weakened or deleted.
- **musicalMemoryFlow** (seed 1234): sequence = **[0, 2]** (green C4=261.63,
  red G4=392.00 — not the stub's [1,1] blue/E4=329.63); round growth by
  appendNote: [0,2] → [0,2,2] → [0,2,2,1] → [0,2,2,1,0] → [0,2,2,1,0,0] (run
  cap respected, 1 draw per note). The "correct tap advances" / "wrong tap"
  / "replay resets input progress" tests now read `scene.sequence` and tap
  from scene state (sequence-agnostic); the two tap-a-frog animation tests
  were retargeted from frog 1 to the seeded first note (frog 0, 261.63) —
  under the seed frog 1 is a wrong tap whose extra wiggle/nod/replay tweens
  sat after the bounce tween, changing "latest tween"; the stale-inputIndex
  bug test keeps its semantics with sequence [0,2] (distinct adjacent notes).
  The `mockReturnValueOnce(0.0).mockReturnValueOnce(0.5).mockReturnValue(0.5)`
  chained stub was deleted with its FR-6 comment.
- **animalTraceFlow / sceneLifecycle (AnimalTrace sim)**: the helper cannot
  share the scene's rng instance (sharing CONTINUES the draw sequence instead
  of replaying the scene's path window). `pathRngForPair(pairIndex)` replays a
  fresh `mulberry32(1234)` past `selectThreePairs`' 5 shuffle draws plus one
  `generatePathPoints` (4 draws: archAmplitude, archDirection, sAmplitude,
  sDirection) per already-rendered pair, landing exactly on the scene's
  draw window for that pair. First attempt (fresh rng per call) failed 20/28
  with y-mismatch; second attempt (shared instance) failed identically;
  replay pattern → 28 passed. sceneLifecycle uses the same replay inline.
- **wordBuilderScene**: the "renders 6 letter tiles" test compares against a
  direct `generateLetterTiles` call; under seeding the scene's rng is
  consumed by `generateWordBuildPlaythrough`'s shuffles first, so the replay
  is draw-order: `const replay = mulberry32(1234);
  generateWordBuildPlaythrough(3, 0, replay);
  generateLetterTiles(entry.word, replay)`.
- **patternBuilderFlow**: multi-round tests picked up destroyed round-N
  shapes through the no-filter `getCardShapes`/`getCardRects` helpers (masked
  before because the 0.5 stub made every round identical). Helpers now filter
  destroyed objects like the scene suite does — helper correctness fix;
  assertions unchanged and not weakened.
- All other suites' expectations were structural (lengths, contains, counts,
  call orders) and needed no re-derivation.

### P4.T3 static proof (recorded verbatim)

- `grep "vi.spyOn(Math" src/__tests__/scenes` → **0 matches**.
- `grep "Math\.random" src/scenes` → **25 matches**:
  - 22 game-scene constructor defaults (`constructor(rng: Rng = Math.random)`):
    AddItUpScene.ts:27, AlphabetScene.ts:48, AnimalTraceScene.ts:112,
    BigSmallScene.ts:105, ColorMatchScene.ts:55, DecodeItScene.ts:38,
    FeelingsFacesScene.ts:91, FirstSoundsScene.ts:55, HowManyScene.ts:64,
    MemoryMatchScene.ts:84, MoreLessScene.ts:62, MusicalMemoryScene.ts:105,
    NumberOrderScene.ts:49, OddOneOutScene.ts:39, PatternBuilderScene.ts:87,
    PopFreezeScene.ts:101, ShadowMatchScene.ts:98, ShapeSorterScene.ts:76,
    StoryOrderScene.ts:58, TakeAwayScene.ts:28, WordBuilderScene.ts:99,
    WordMatchScene.ts:55
  - GameSceneBase.ts:167 `constructor(key: string, rng: Rng = Math.random)`
  - **2 comment-only prose references** (not code draws):
    GroupMathScene.ts:79 ("`Math.random` default" TSDoc) and
    GameSceneBase.ts:65 (TSDoc mentioning `Math.random`).
  - The spec's AC-2 wording ("23 matches") counts the 23 code defaults above;
    the 2 comment lines make the raw grep return 25. Per the brief's honest
    reading, FR-5's sanctioned-default framing governs; this discrepancy is
    recorded here for Phase 5 P5.T1 clarification. Spec not edited.
- `grep "Math\.random" src/__tests__/scenes` → **2 matches**, both
  `gameSceneBaseRng.test.ts` lines 45/47 — the sanctioned FR-5
  default-wiring assertion ("defaults to Math.random when no generator is
  supplied"). Not a spy; left untouched by design.

## Primary verification

Primary verification performed 2026-10-26 by the primary after the rework round.

- Tree clean; range 5900e51a..HEAD = 12 commits, no merge commits. 30 test
  files changed (the 27 census files + shapeSorterScene, shadowMatchFlow,
  popFreezeScene AC-1 additions) plus this evidence file.
- **AC-1 gap found and reworked (1 rework round):** the executor's first pass
  reported AC-1 satisfied, but only 24 of 27 named (AC-1) cases existed and
  three scenes had none: popFreezeScene (seeded but no two-construction case),
  shapeSorterScene (never in the census - no stub to migrate), and
  ShadowMatchScene (no per-game suite exists at all; flow-only coverage with
  bare construction). The executor added all three cases
  ( 66e5375, 5b2d4014); the evidence's arithmetic ("2700 baseline + 26")
  was corrected to 2702 + 27. All 22 game scenes now carry a two-construction
  AC-1 case.
- Spot audits: zero i.spyOn(Math left in src/__tests__/scenes; only 2
  Math.random matches there (the sanctioned default-wiring assertion in
  gameSceneBaseRng.test.ts:45/:47); src/scenes sweep = 25 matches (23 code
  default initializers + 2 TSDoc prose), zero live draws; the 9 mock-wrapper
  fixes forward all arguments (wordBuilderScene wrapper verified forwarding
  ng to ctual.generateWordBuildPlaythrough); FR-6/A4 annotation comments
  deleted (zero matches).
- Command table re-run by the primary at head 5b2d4014: all exit 0.

| Layer | Command | Exit | Summary |
|---|---|---|---|
| lint/format | pnpm check | 0 | 258 files; 1 warning + 1 info (both pre-existing) |
| types | pnpm typecheck | 0 | tsc --noEmit clean |
| tests | pnpm test -- --run | 0 | 125 files / 2729 tests passed |
| coverage | pnpm test:coverage | 0 | 97.82 st / 91.96 br / 96.77 fn / 98.74 ln |
| build | pnpm build | 0 | 54 precache entries (1727.85 KiB) |
| bundle | 
ode scripts/validate-bundle.js | 0 | shell 138.7 kB <= 200 kB; Phaser vendor present |
| pwa | 
ode scripts/validate-pwa.js | 0 | all checks passed |
| docs | 
ode scripts/validate-docs.js | 0 | all checks passed |

Primary verdict: **verified**.
