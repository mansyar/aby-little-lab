# Phase 3 — Declare art groups in all 22 game scenes

- **Track:** `20261020-shell-diet-lazy-art` (Shell Diet: Per-Game Lazy Art Chunks)
- **Phase:** 3 of 5 — Declare art groups in all 22 game scenes
- **Date:** 2026-10-20
- **Branch:** `refactor/20261020-shell-diet-lazy-art`
- **Base:** `8d94b5a`
- **Head:** squashed phase commit (the checkpoint SHA is recorded in `plan.md`; the three task commits and this file's commit were squashed per `phase_squash`)
- **Result:** verified

## Summary

One protected helper on `GameSceneBase`, one `preload()` per game, one source
scan that keeps the two honest:

- **`GameSceneBase.preloadArt(groups)`** creates the visit's cue through
  `createArtLoadingCue(this)`, shows it, then calls
  `preloadArtGroups(this, groups)`. The cue is taken down on the loader's
  `complete` **and** on the scene's `create`, so a scene whose art is already in
  the TextureManager — every key, in this phase — cannot leave the cue on screen.
  A second call reuses the same cue (`private artCue`), and `shutdown` forgets it
  so the next visit builds a fresh one. Destroy stays with the cue's own
  `events.once("shutdown", destroy)`; `registerShutdownCleanup` is unchanged.
- **21 of 22 game scenes** call `this.preloadArt([...])` from `preload()`.
  `StoryOrderScene` keeps `preloadStoryOrderArt(this)` and declares no groups.
- **`src/__tests__/scenes/artDeclarations.test.ts`** reads all 22 scene sources
  plus the 23 game modules they import as `?raw` text and fails if a scene draws
  a group it does not declare, or declares one it never draws.
- **`src/__tests__/scenes/preloadArt.test.ts`** proves the cue shows, clears, is
  created once, and is rebuilt on a second visit.

Shipped behaviour is unchanged: every key still ships in the shell, so
`preloadArtGroups`' `textures.exists` short-circuit queues nothing, the loader
never emits `complete`, and the cue is retired by `create` before the round is
drawn — no visible cue in practice. The bundle numbers below are that same fact
from the other side: no SVG payload moved.

## Declaration table (verified against source)

The brief's table was the starting point; the scan and a source read corrected it
in five places (marked ⚠). "Evidence" is the literal the scan resolves.

| Scene | Declared groups | Evidence |
| --- | --- | --- |
| ShapeSorterScene | `cutouts`, `shapes` | `` `cutout_${slotType}` ``, `` `shape_${shapeType}` `` |
| AnimalTraceScene | `animals`, `food` | `` `animal_${pair.animal}` ``, `` `food_${pair.food}` `` |
| PopFreezeScene | `animals`, `glyphs` | `` `animal_${config.animal}` ``, `"bubble"`, `"sleep_zzz"` |
| ShadowMatchScene | `items`, `shadows` | `` `sm_shadow_${shadowType}` `` (longest prefix wins), `` `sm_${objectType}` `` |
| MusicalMemoryScene | `music` | `FROG_TEXTURES = ["frog_green", "frog_blue", "frog_red"]`, `"lilypad"` |
| BigSmallScene | `toys` | `"toy_box"`, `` `toy_${toy.type}` `` |
| PatternBuilderScene | `shapes` | `circle: "shape_circle"` and its two siblings |
| AlphabetScene | `letters` | `` `letter_${letter.toLowerCase()}` `` |
| ⚠ WordMatchScene | `animals`, `food`, `items`, `letters`, `music`, `shapes`, `toys` | `letter_` plus `wordLogic.WORD_POOL`'s 18 `promptTexture` keys |
| ⚠ WordBuilderScene | same seven | `letter_` twice plus the same `promptTexture` field |
| ⚠ HowManyScene | `food`, `items`, `numerals`, `shapes` | `` `numeral_${round.target}` `` plus `countLogic.COUNT_ITEMS` |
| ⚠ FirstSoundsScene | `animals`, `food`, `items`, `letters`, `music`, `shapes`, `toys` | `letter_` plus `firstSoundsLogic`'s `getWord()` prompts |
| ⚠ MoreLessScene | `food`, `glyphs`, `items`, `shapes` | `` `arrow_${round.mode}` ``, `textureSizeFor("arrow_more")`, `moreLessLogic` → `countLogic` |
| ⚠ OddOneOutScene | `animals`, `music`, `shapes`, `toys` — **no `glyphs`** | `oddOneOutLogic.ODD_ITEMS`; its `shape_plus` is a spoken label in `PROMPT_WORDS`, not a draw |
| ColorMatchScene | `music`, `shapes` | `colorMatchLogic` (`shape_*`, `frog_blue`) |
| AddItUpScene | `food`, `glyphs`, `items`, `shapes` | `operationCue: "plus"`, `addItUpLogic` → `countLogic` |
| TakeAwayScene | `food`, `glyphs`, `items`, `shapes` | `operationCue: "minus"`, `takeAwayLogic` → `countLogic` |
| MemoryMatchScene | `animals`, `glyphs`, `items`, `toys` | `"card_back"` plus `memoryMatchLogic` |
| DecodeItScene | `animals`, `food`, `items`, `letters`, `music`, `shapes`, `toys` | `letter_` plus `decodeLogic.DECODE_POOL` (= `WORD_POOL` + `sm_fox|cup|map|bed`) |
| NumberOrderScene | `numerals` | `` `numeral_${numeral}` `` |
| FeelingsFacesScene | `faces` | `` `face_${emotion}` `` |
| StoryOrderScene | none | `preloadStoryOrderArt(this)`; `story_*` is shell-allowlisted |

## The scan

`artDeclarations.test.ts` (50 tests) works in three layers:

1. **Resolution is derived from the tables, never hardcoded.** `KEY_OWNER` maps
   every `assets[].key` to its group; `PREFIX_OWNER` is built from the keys
   themselves by cutting each at its last `_`, so `sm_shadow_house` yields
   `sm_shadow_ → shadows` and `sm_house` yields `sm_ → items`. A literal resolves
   by exact key first, then by the **longest** matching prefix.
2. **Only resolvable strings are judged.** A literal must be lower snake case and
   ≤ 40 chars, and a literal with no `_` counts as a texture only when it sits
   inside a draw call (`.image(`, `textureSizeFor(`, `displayScale(`,
   `createSymbol(`, `operationCue:`). Arbitrary prose — `"a cat"`, `"green frog"`,
   a label table — is silently ignored, and comments are stripped first so a doc
   line naming `shape_star` is not read as a draw.
3. **The scan follows the scene's imports.** Every `../game/<module>` import, then
   each module's own `./<module>` imports, so `moreLessLogic → countLogic` and
   `decodeLogic → wordLogic` are scanned too. A scene importing a game module the
   test does not know about fails with `"<Scene>: <module>"`.

Per scene it asserts both directions (`describe.each`, 44 tests) plus six file
level tests: 22 scenes scanned, every imported module known, only
`StoryOrderScene` may omit `preloadArt`, Story Order keeps
`preloadStoryOrderArt(this)` and never calls `preloadArt`, the allowlist is
exactly `mascot_`/`sticker_`/`story_`/`tile_` + `icon_speaker`, and every shell
key a game names really exists — `story_*` in `storyOrderArt.ts`, the rest in
`PreloadScene.ts`. The last one is live rather than vacuous: it asserts it saw
`mascot_idle` before asserting nothing is missing.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Lint/format | `pnpm check` | 0 | 229 files checked; only the pre-existing biome schema-version info and the pre-existing `noNonNullAssertion` warning in `src/__tests__/scenes/musicalMemoryScene.test.ts` |
| Types | `pnpm typecheck` | 0 | clean |
| Unit tests | `pnpm test -- --run` | 0 | 109 files, 2,299 tests passed (Phase 2: 107 / 2,244; this phase adds 2 files / 55 tests) |
| Coverage | `pnpm test:coverage` | 0 | statements 97.77%, branches 90.73%, functions 96.24%, lines 98.56% (thresholds 90 / 85 / 88 / 95) |
| Gate chain | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage` | 0 | run once, no retry |
| Supplementary | `pnpm build` | 0 | see below; `dist/` is gitignored |

Focused runs used while developing (not part of the gate):
`pnpm test --run src/__tests__/scenes/artDeclarations.test.ts src/__tests__/scenes/preloadArt.test.ts`
— 55 passed after the two fixes described under Notes.

New-file coverage:

| File | Statements | Branches | Functions | Lines |
| --- | --- | --- | --- | --- |
| `src/scenes/GameSceneBase.ts` | 100% | 92.3% | 100% | 100% |
| `src/__tests__/scenes/artDeclarations.test.ts` | covered by its own 50 cases | | | |
| `src/__tests__/scenes/preloadArt.test.ts` | 5 cases over the base helper | | | |

## Bundle measurement

Measured with `pnpm build`; the full chunk list is in
`.conductor/evidence/phase-3-build-report.md`.

| Metric | Before (Phase 2) | After | Delta |
| --- | --- | --- | --- |
| Shell entry `index-*.js` | 200.12 kB (195.4 KiB), 39.44 kB gzip | 201.66 kB (196.9 KiB), 40.25 kB gzip | +1.54 kB |
| Largest game chunk | `StoryOrderScene` 33.92 kB (own art since Phase 1) | unchanged at 33.92 kB | 0 |
| Largest chunk this phase grew | — | `MemoryMatchScene` 4.86 kB | — |
| Nine new group-table chunks | none (groups were reachable only from tests, so tree-shaken out) | 4.61 kB total: `music` 0.23, `food` 0.30, `animals` 0.31, `toys` 0.32, `glyphs` 0.33, `numerals` 0.42, `items` 0.59, `shapes` 0.73, `letters` 1.38 | +4.61 kB |
| Precached files | — | 53 entries, 1707.46 KiB | +9 files |

The growth is **not** the SVG strings, which is what the brief expected and what
the measurement contradicts: `PreloadScene` still imports all 178 SVGs, and Vite
emits one module per `?raw` file, so every `<svg xmlns=…>` literal is still in
`index-DpzVMWcN.js` (`grep xmlns dist/assets/*.js` matches that file only). This
phase moved no payload at all. What it added is the nine group tables (key→asset
maps, 4.61 kB) plus 1.54 kB in the entry from wiring the cue and the registry into
`GameSceneBase`; I did not bisect the entry's 1.54 kB module by module beyond
confirming the payloads are still there. Phase 4 is the change that moves the
payloads into these chunks and takes the entry under 170 KiB.

Shipped behaviour is unchanged for the reason the numbers imply: every key
`preloadArt` asks for already exists, so `preloadArtGroups` queues no `load.svg`
call, the loader never starts, and `complete` never fires — the cue is cleared by
`create` alone. That ordering is what `preloadArt.test.ts` pins.

## Acceptance criteria

| Criterion | Statement | Proving tests |
| --- | --- | --- |
| FR-3 | All 22 game scenes declare their art groups in `preload`; no game reads undeclared art. | `artDeclarations.test.ts` → `declares art groups in every game scene but Story Order`, plus the 22 per-scene `draws only groups it declares` cases |
| AC-4 | A source scan fails when a scene omits a group it draws, and the declaration table stays honest. | `artDeclarations.test.ts` → the same 22 `draws only groups it declares` cases, the 22 `declares only groups it draws` cases, `reads every game module a scene imports`, `keeps Story Order on its own preloader`, `allowlists exactly the shell keys a game may name`, `names no shell key the shell does not ship` |
| FR-5 (wiring) | The shared cue is shown while a declared load is pending and clears itself. | `preloadArt.test.ts` → `shows the shared cue while the art loads`, `clears the cue when the loader finishes`, `clears the cue on create, so an already-loaded scene shows nothing` |
| NFR-3 | No visual regression. | 2,299 tests pass, including every existing scene suite; `preloadArtGroups` no-ops on the shipped shell textures |

## Evidence paths

- `src/scenes/GameSceneBase.ts` — `preloadArt` + `createArtCue`
- 21 game scene files under `src/scenes/` (all except `StoryOrderScene.ts`)
- `src/__tests__/scenes/artDeclarations.test.ts`
- `src/__tests__/scenes/preloadArt.test.ts`
- `.conductor/evidence/phase-3-build-report.md` — raw build report
- Commits: `81ad674` (squashed phase commit: base helper, 21 scene declarations,
  the cue test, the source scan and this evidence file)

`git diff --stat 8d94b5a -- src` is 24 files, 765 insertions, no deletions:
`src/scenes/**` and the two new test files, nothing else.
`git diff --stat 8d94b5a -- src/scenes/PreloadScene.ts src/scenes/sceneRegistry.ts src/game src/components`
is empty — `PreloadScene.ts` is byte-identical, as this phase requires.

## Deviations

Five corrections to the brief's ground-truth table, each verified against the
source and enforced by the scan rather than absorbed silently:

1. **`OddOneOutScene` needs no `glyphs`.** The brief derived it from
   `oddOneOutLogic`; that module's `shape_plus` appears only as a *spoken label*
   in `PROMPT_WORDS`, never at a draw site.
2. **`WordMatchScene` and `WordBuilderScene` need six groups beyond `letters`.**
   Both draw `word.promptTexture`, and `wordLogic.WORD_POOL` spans
   `animal_*`, `sm_*`, `frog_red`, `food_*`, `shape_star` and `toy_*`.
   `mascot_idle` is the one prompt the shell already ships.
3. **`FirstSoundsScene` and `DecodeItScene` need the same seven.** Both resolve
   their prompts through `wordLogic`'s pool (`decodeLogic.DECODE_POOL` extends it
   with four `sm_*` keys).
4. **`HowManyScene` needs `shapes`, `items` and `food`,** not just `numerals`:
   `countLogic.COUNT_ITEMS` is the picture set its dot groups and answer cards
   use.
5. **`MoreLessScene`, `AddItUpScene` and `TakeAwayScene` need `shapes`, `items`
   and `food`** in addition to their glyph, because `moreLessLogic`,
   `addItUpLogic` and `takeAwayLogic` all draw through `countLogic`.

Everything written is inside the phase Touches globs (`src/scenes/**`,
`src/__tests__/scenes/**`) plus this file and the build report under
`.conductor/`. No file outside them changed.

## Notes

- **`preloadArt` creates the cue in `preload`, not `create`.** The brief asked for
  it that way and the cue tolerates it: `texturePresent` guards a TextureManager
  that has not rasterized `mascot_idle` yet (dots-only), and `build()` reads the
  camera centre at show time, so a scene that starts mid-flight still centres.
  Phase 2's cases already cover a scene with no TextureManager at all.
- **Cleared on `create` as well as `complete`.** With the shell still holding
  every key, `complete` never fires — the loader has nothing queued — so `create`
  is the only event that retires the cue in production today. Keeping both means
  Phase 4 needs no second change here.
- **`shutdown` forgets `artCue`.** Phaser reuses scene instances, so a cue
  destroyed by its own shutdown hook would otherwise be remembered as live and
  `show()` on the reused instance would no-op against a destroyed cue. The
  `builds a fresh cue on the next visit` case pins that.
- **Two scan iterations were needed, both in the scan's own logic.** First real
  run: 49/50 passed and the shell check failed on 24 `story_*` keys, because
  Story Order's panels live in `storyOrderArt.ts`, not `PreloadScene.ts` — the
  check now proves story keys against that module (which is exactly why it must
  stay out of the shell). The 22 per-scene declaration cases passed on the first
  run, which is the cross-check on the table above.
- **Coverage side effect.** `AddItUpScene` and `TakeAwayScene` read 75% statements
  (their single uncovered line is the new `preload`): the group-math suites drive
  `create()` directly and never run the Phaser lifecycle. Overall coverage still
  clears every threshold, and the shared helper itself is at 100% lines.
- The nine `src/game/art/<group>.ts` modules only now appear in the bundle as
  their own chunks — before this phase nothing in the app imported them, so they
  were tree-shaken out entirely. That is what the +9 precache entries are.
- Pre-existing diagnostics, unchanged by this phase: biome reports `biome.json`
  pinning schema 2.5.5 while the CLI is 2.5.10 (informational), and warns about a
  non-null assertion in `src/__tests__/scenes/musicalMemoryScene.test.ts`.

## Primary verification

The gate chain above was run once, end to end, after the three task commits and
before this evidence file was written; no retry was needed. `pnpm build` was run
once as a supplementary measurement. The working tree held nothing but `dist/`
(gitignored) when the chain started.

## Primary verification (independent re-run)

- **Verified by:** primary agent on 2026-10-20 from a clean tree, running the
  gates and the build-artifact layer itself.
- **Scope:** `git diff --name-only fa17031..HEAD` touched only `src/scenes/*.ts`
  (the base plus 21 game scenes), the two new scene tests and this evidence file.
  `src/scenes/PreloadScene.ts`, `sceneRegistry.ts`, `src/game/art/**`,
  `src/components/**` and `src/game/hubTiles.ts` are byte-identical, confirmed
  with an empty `git diff --stat` rather than from the report.
- **Commands:** `pnpm check` exit 0 (two pre-existing diagnostics only),
  `pnpm typecheck` exit 0, `pnpm test -- --run` exit 0 with 109 files / 2,299
  tests, `pnpm build` exit 0, `node scripts/validate-bundle.js` exit 0 with the
  shell entry at 196.9 kB against the 200 kB gate.
- **The gate that mattered:** the entry grew from 195.4 to 196.9 KiB, which is
  inside the budget but leaves only ~3 KiB of headroom. This is exactly why
  Phase 4 is next: it is the phase that removes the 125 game-only keys from the
  shell instead of adding to it. A phase that consumed budget without freeing any
  would be a red flag; this one is the wiring step before the release.
- **Review findings, none blocking:** the scan test is not vacuous - it asserts
  both directions per scene ("draws only groups it declares" and "declares only
  groups it draws"), resolves keys against the group tables rather than a
  hand-written prefix list, and checks that all 22 scenes but Story Order declare
  something. `preloadArt` tolerates a mock scene with no TextureManager, which is
  what let the five new base-level tests run without touching the harness.
- **Accepted deviation:** the brief predicted SVG payload would migrate into game
  chunks in this phase. It did not, because `PreloadScene` still imports all 178
  SVGs and Vite emits one module per `?raw` import. Measured, not assumed: only
  `index-*.js` contains the payloads. Phase 4 performs the move.

