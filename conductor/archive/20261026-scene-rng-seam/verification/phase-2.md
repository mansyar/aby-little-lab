# Phase 2 — Forward through the sixteen single-draw scenes

- **Track:** `20261026-scene-rng-seam`
- **Phase:** 2 — Forward through the sixteen single-draw scenes
- **Date:** 2026-10-26
- **Branch:** `refactor/20261026-scene-rng-seam`
- **Base commit:** `8e57df19`
- **Head commit:** `67e6ca34`
- **Result:** **verified** — the full gate exits 0.

Phase 2 was first reported `blocked`: the scene changes invalidated twelve
exact-arity assertions in test files the phase was not allowed to touch. The
plan was amended (`77a410d0`) to give Phase 2 an "Also touches (arity repairs
only)" scope and task P2.T4.1. That repair landed as `67e6ca34` and the gate is
now green.

## Commands

Final run of the configured chain, all steps in one invocation:

```powershell
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js
```

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | 257 files checked; 1 warning + 1 info, both pre-existing (`musicalMemoryScene.test.ts:294` `noNonNullAssertion`; `biome.json` `$schema` 2.5.5 vs CLI 2.5.10). No new diagnostics. |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| unit | `pnpm test -- --run` | 0 | **124 files / 2694 tests — all passed.** Was 12 failed before P2.T4.1. |
| unit | `pnpm test:coverage` | 0 | 124 files / 2694 tests passed. Statements 97.82 % (5493/5615), branches 91.93 % (1482/1612), functions 96.77 % (1141/1179), lines 98.74 % (5116/5181) — every gate cleared (95 / 85 / 88 / 90). |
| build-artifact | `pnpm build` | 0 | 344 modules transformed; PWA `generateSW` 54 precache entries (1727.68 KiB) |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present (1342.6 kB); shell entry `index-DkGx4iMc.js` 138.7 kB ≤ 200 kB |
| smoke | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed — 42 chunks, 42 precached |
| docs | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed |

The only failure seen during the phase was a mid-phase `pnpm check` on my own
formatting: three builder calls exceeded the 100-column limit and two `Rng`
imports were out of Biome's sort order. Both were corrected before the run
recorded above.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| FR-2 | All game scenes accept a trailing optional `rng` and forward it to `super(...)` | Sixteen constructors are now `constructor(rng: Rng = Math.random) { super("<Key>", rng); }`: `AddItUpScene.ts:27`, `TakeAwayScene.ts:28`, `AlphabetScene.ts:48`, `ColorMatchScene.ts:55`, `DecodeItScene.ts:38`, `FeelingsFacesScene.ts:91`, `FirstSoundsScene.ts:55`, `HowManyScene.ts:64`, `MemoryMatchScene.ts:84`, `MoreLessScene.ts:62`, `NumberOrderScene.ts:49`, `OddOneOutScene.ts:39`, `PatternBuilderScene.ts:87`, `ShapeSorterScene.ts:76`, `ShadowMatchScene.ts:98`, `WordMatchScene.ts:55`. The remaining six scenes are Phase 3. | satisfied (scene half) |
| FR-4 | Every builder call site passes `this.rng` in that builder's **actual** parameter position | Third position: `AlphabetScene.ts:75`, `DecodeItScene.ts:64`, `FirstSoundsScene.ts:85`, `PatternBuilderScene.ts:106`, `ShapeSorterScene.ts:117`, `WordMatchScene.ts:85`. Second position: `ColorMatchScene.ts:82`, `HowManyScene.ts:91`, `MemoryMatchScene.ts:99`, `MoreLessScene.ts:89`, `NumberOrderScene.ts:89`, `OddOneOutScene.ts:66`, `ShadowMatchScene.ts:141`. First and only argument: `FeelingsFacesScene.ts:107`. Each verified against the live signature in `src/game/*Logic.ts` before editing. The twelve arity assertions now pin the forwarded generator too. | satisfied (scene half) |
| FR-5 | No `Math.random` remains in `src/scenes/**` outside a default-parameter initializer | Sweep below: 18 default-parameter initializers, 2 TSDoc prose mentions, and one live draw at `StoryOrderScene.ts:90` (Phase 3). No scene-side call site draws from `Math.random`. | satisfied for the sixteen; `StoryOrderScene` deferred |
| NFR-1 | Behavior-preserving; production always takes the default | Phaser instantiates scenes with zero arguments, so every scene gets `Math.random`. Argument positions match the live signatures, so the same generator reaches the parameter the logic module already defaulted to. 2694 tests pass, including the whole scene and flow suites. | satisfied |
| NFR-4 | No new dependencies; shell ≤ 200 kB, 42 chunks precached | `package.json` untouched. `validate-bundle.js` reports 138.7 kB shell; `validate-pwa.js` reports 42 chunks, 42 precached. | satisfied |
| AC-2 (scene half) | `grep "Math\.random" src/scenes` returns zero matches | Not yet zero — 20 matches, of which 18 are the new default initializers, 2 are TSDoc prose, and 1 is `StoryOrderScene.ts:90` (Phase 3). The whole-tree criterion completes in Phase 3; the Phase-2 half is clean of every non-initializer occurrence. | not met by design — Phase 3 completes it |

## Files touched

Scene changes (`ff4e9bb8`):

- `src/scenes/AddItUpScene.ts` — `Rng` import, constructor parameter, forwards to `super`
- `src/scenes/TakeAwayScene.ts` — same
- `src/scenes/AlphabetScene.ts` — same, plus `this.rng` third at `:75`
- `src/scenes/ColorMatchScene.ts` — same, plus `this.rng` second at `:82`
- `src/scenes/DecodeItScene.ts` — same, plus third at `:64`
- `src/scenes/FeelingsFacesScene.ts` — same, plus `drawScenarios(this.rng)` at `:107`
- `src/scenes/FirstSoundsScene.ts` — same, plus third at `:85`
- `src/scenes/HowManyScene.ts` — same, plus second at `:91`
- `src/scenes/MemoryMatchScene.ts` — same, plus second at `:99`
- `src/scenes/MoreLessScene.ts` — same, plus second at `:89`
- `src/scenes/NumberOrderScene.ts` — same, plus second at `:89`
- `src/scenes/OddOneOutScene.ts` — same, plus second at `:66`
- `src/scenes/PatternBuilderScene.ts` — same, plus third at `:106`
- `src/scenes/ShapeSorterScene.ts` — same, plus third at `:117` and `this.rng` on the two per-round `shuffle` calls at `:130-131`
- `src/scenes/ShadowMatchScene.ts` — same, plus `generateRound(shift, this.rng)` at `:141`
- `src/scenes/WordMatchScene.ts` — same, plus third at `:85`

Arity repair (P2.T4.1, `67e6ca34`) — one line each, `expect.any(Function)` appended:

- `src/__tests__/scenes/alphabetScene.test.ts` — `:673`, `:679`
- `src/__tests__/scenes/colorMatchScene.test.ts` — `:661`, `:667`
- `src/__tests__/scenes/firstSoundsScene.test.ts` — `:672`, `:678`
- `src/__tests__/scenes/oddOneOutScene.test.ts` — `:613`, `:619`
- `src/__tests__/scenes/patternBuilderScene.test.ts` — `:485`, `:491`
- `src/__tests__/scenes/shapeSorterScene.test.ts` — `:313`, `:318`

## Deviations

**Arity repair in six test files — now in scope, recorded because it is unusual.**
Phase 2 changes the *call arity* of every builder call site, so it necessarily
breaks assertions that pin the old argument list. The first report of this phase
was `blocked` on exactly that conflict. The plan was amended (`77a410d0`) to add
"Also touches (arity repairs only)" and P2.T4.1, so the repair is an in-scope
change and not a scope expansion. It is recorded here anyway because a phase
owning edits to test files it does not otherwise migrate is worth flagging: the
twelve assertions are arity repairs only, and the seeding migration in those same
six files remains Phase 4.

The repair appends `expect.any(Function)` as the final expected argument and
changes nothing else. Each assertion still checks the shift value in its own
position — `(6, 1)` became `(6, 1, expect.any(Function))`, never a rewrite — so
the test's original subject is intact and the new argument is additionally
pinned as a generator. No stub was removed, no other assertion in those files was
touched, and `git diff --stat` on the six files reads exactly `12 insertions,
12 deletions`.

Nothing outside the plan's `Touches` and its "Also touches" list was modified.

## Notes

### Builder signatures — all verified against source

Every builder in `src/game/*Logic.ts` was re-read before editing. The brief's
table was correct on all sixteen rng positions. Two details worth keeping:

- `shapeSorterLogic.generatePlaythrough(roundCount: number, shift = 0, rng = Math.random)`
  — `roundCount` is **required** here, unlike the other third-position builders.
  `ShapeSorterScene` already passes `ROUND_COUNT`, so the call shape is unchanged.
- `shadowMatchLogic.generateRound(shift = 0, rng = Math.random)` returns an inline
  object type, not a named one. Second position confirmed.

### One call site beyond the brief's table: `ShapeSorterScene`'s per-round shuffles

`ShapeSorterScene.initRound` (`:130-131`) calls the shared
`random.shuffle(roundShapes)` twice to build slot order and shape order. Those are
gameplay draws in the same scene, so FR-4's "every builder call site" and FR-5's
intent both reach them: left bare, a seeded scene would still deal its shapes from
`Math.random` and the phase's own seam would leak. Both now pass `this.rng`. This
is inside the same file, so it is not a deviation — but it is beyond the brief's
single-call-site table and is called out deliberately.

`ShapeSorterScene` therefore has three draws, not one, and is not strictly a
"single-draw" scene. It still belongs to Phase 2: all three draws are the same
builder family in the same file, and splitting them would have left FR-5 untrue
for a file this phase owns.

### P2.T3.1 — static sweep, verbatim

The brief specifies:

```powershell
Select-String -Path src\scenes\*.ts -Pattern "Math\.random"
```

`shell` refused that command (`permission.rejected`), so the sweep was run with
the native `grep` tool — same pattern, same path glob, same semantics. The
primary has since confirmed the sweep independently. Raw matches, 20 total:

```text
src/scenes/AddItUpScene.ts:27       constructor(rng: Rng = Math.random) {
src/scenes/AlphabetScene.ts:48      constructor(rng: Rng = Math.random) {
src/scenes/ColorMatchScene.ts:55    constructor(rng: Rng = Math.random) {
src/scenes/FirstSoundsScene.ts:55   constructor(rng: Rng = Math.random) {
src/scenes/FeelingsFacesScene.ts:91 constructor(rng: Rng = Math.random) {
src/scenes/DecodeItScene.ts:38      constructor(rng: Rng = Math.random) {
src/scenes/GroupMathScene.ts:79     * `Math.random` default. It is optional so a rule set may ignore it.
src/scenes/HowManyScene.ts:64       constructor(rng: Rng = Math.random) {
src/scenes/GameSceneBase.ts:65      * draw is reproducible, while production gets `Math.random`. It is a
src/scenes/GameSceneBase.ts:167     constructor(key: string, rng: Rng = Math.random) {
src/scenes/MoreLessScene.ts:62      constructor(rng: Rng = Math.random) {
src/scenes/NumberOrderScene.ts:49   constructor(rng: Rng = Math.random) {
src/scenes/MemoryMatchScene.ts:84   constructor(rng: Rng = Math.random) {
src/scenes/OddOneOutScene.ts:39     constructor(rng: Rng = Math.random) {
src/scenes/PatternBuilderScene.ts:87 constructor(rng: Rng = Math.random) {
src/scenes/ShapeSorterScene.ts:76   constructor(rng: Rng = Math.random) {
src/scenes/ShadowMatchScene.ts:98   constructor(rng: Rng = Math.random) {
src/scenes/TakeAwayScene.ts:28      constructor(rng: Rng = Math.random) {
src/scenes/StoryOrderScene.ts:90    this.rounds = buildPlaythrough(Math.random, getAdaptiveBandShift("story-order"));
src/scenes/WordMatchScene.ts:55     constructor(rng: Rng = Math.random) {
```

Breakdown: 18 default-parameter initializers (allowed by FR-5), 2 TSDoc prose
mentions (`GameSceneBase`, `GroupMathScene` — neither is code), and **one live
draw**: `StoryOrderScene.ts:90`.

**`StoryOrderScene` still contains `Math.random`, and that is expected.** It is
Phase 3 (`P3.T3.2`), which is also where the rng-**first** position gets
documented. It was not edited here. AC-2's whole-tree grep therefore cannot be
zero until Phase 3 lands; the Phase-2 half — the sixteen single-draw scenes — is
clean of every non-initializer occurrence.

### Other observations

- `ChoiceRoundScene` and `GroupMathScene` declare no constructor, so they inherit
  `GameSceneBase`'s directly. Nothing to forward there; `AddItUpScene` and
  `TakeAwayScene` reach the seam through `GroupMathScene` exactly as Phase 1
  arranged.
- No scene's constructor did anything beyond `super(key)`, so no behaviour needed
  preserving.
- No scene had a constructor comment convention, so per the brief no TSDoc was
  added - the long explanation stays on `GameSceneBase.rng` only.
- Branch coverage rose 91.85 % → 91.93 % against Phase 1, from the new optional
  parameter paths being exercised by the existing scene suites.

## Primary verification

The primary independently verified the phase against checkpoint-range
`8e57df19..HEAD` on 2026-10-26.

- **Worktree clean; diff vs Touches**: `git diff --name-only 8e57df19..HEAD`
  returns exactly the 16 scene files, the six "Also touches" test files, and the
  two conductor paths (plan.md, this evidence file). No off-Touches file.
- **Arity repair audited by diff**: the six test files contain exactly 12
  insertion / 12 deletion pairs, each replacing `toHaveBeenCalledWith(a, b)` with
  `toHaveBeenCalledWith(a, b, expect.any(Function))` — the shift-position
  expectation is preserved verbatim in every one. No other assertion changed.
- **Call sites audited by diff**: all 16 constructors read
  `constructor(rng: Rng = Math.random) { super("<Key>", rng); }`. The four
  multi-line call sites (`FirstSoundsScene`, `PatternBuilderScene`,
  `WordMatchScene`, `ShapeSorterScene`) place `this.rng` as the third argument,
  matching `generatePhonicsPlaythrough(roundCount, shift, rng)`,
  `generatePlaythrough(roundCount, shift, rng)` (both patternBuilder and
  shapeSorter), and `generateWordPlaythrough(roundCount, shift, rng)`. The seven
  two-argument sites and the one single-argument site (`drawScenarios(rng)`)
  match their live signatures. `ShapeSorterScene`'s two per-round `shuffle`
  calls take `this.rng` as the second argument of `shuffle(items, rng)`.

| Layer | Command | Exit | Primary result |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | 257 files; 1 warning + 1 info, both the pre-existing diagnostics |
| static | `pnpm typecheck` | 0 | clean |
| unit | `pnpm test -- --run` | 0 | 124 files / 2694 tests passed |
| unit | `pnpm test:coverage` | 0 | 97.82 st / 91.93 br / 96.77 fn / 98.74 ln — all gates clear |
| build-artifact | `pnpm build` | 0 | 344 modules; 54 precache entries |
| build-artifact | `node scripts/validate-bundle.js` | 0 | shell `index-DkGx4iMc.js` 138.7 kB ≤ 200 kB; Phaser chunk present |
| build-artifact | `node scripts/validate-pwa.js` | 0 | all PWA validation checks passed |
| smoke/docs | `node scripts/validate-docs.js` | 0 | all document validation checks passed |

**Primary verdict: verified.** The squash guard over `8e57df19..HEAD` found five
commits and no merge commits.
