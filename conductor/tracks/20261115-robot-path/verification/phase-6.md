# Phase 6 — Documents say 23, and say what the game teaches

- Track: 20261115-robot-path
- Phase: 6
- Date: 2026-11-16
- Branch: `feat/20261115-robot-path`
- Base / Head: `f2f602a0` / `877bb496`
- Result: verified
- Mode: E3 (the primary implemented; no code subagent in this host)

## Commands

Verification command, copied verbatim from `plan.md` for Phase 6 and run as one
chained job:

```
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js
```

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | Biome: 330 files, no fixes applied; the one warning is the pre-existing `useImportType` note on `RobotPathScene`'s Phaser import |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` plus the e2e project |
| unit | `pnpm test -- --run` | 0 | 150 files, 3,254 tests passed |
| coverage | `pnpm test:coverage` | 0 | 97.22 / 91.51 / 96.3 / 98.31 project-wide |
| build-artifact | `pnpm build` | 0 | shell entry `index-Cq96urFU.js` = 182.5 kB |
| build-artifact | `node scripts/validate-bundle.js` | 0 | entry 182.5 kB ≤ 200 kB; Phaser chunk `phaser-B_vcVLyb.js` = 1335.0 kB |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16/16, 49 chunks / 49 precached, 61 precache entries / 1794.41 KiB |
| documents | `node scripts/validate-docs.js` | 0 | 5/5 — the release-note index, every link and anchor, the three game lists against `GAME_REGISTRY`, the Conductor paths, and the derived suite counts |

Chain exit code: **0** (final log line `GATE EXIT: 0`).

Two full chains were run, and the second is the accepted one because the first
passed on a tree that was then corrected:

1. First run: every layer green, with coverage at 97.22 / 91.51 / 96.3 / 98.31.
2. The coverage snapshot I had written into TDD §10.3 and the perf baseline came
   from Phase 5's run (97.24 / 91.56), and the perf baseline's live-figures
   header had kept its old sentence after the new one, so it claimed two
   different builds at once. Both were corrected to the figures the first run
   measured, and the whole chain was run again from the top — the table above.
   In this phase the only layers those edits could move are `validate-docs` and
   the build, and both were re-measured, not assumed.

## Acceptance

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-17 (PRD) | `### 3.23 Robot Path` describes the mechanic, the ladder, the no-fail repair loop and why the arrows are absolute; every roster size, adaptive count, paging figure and shell key count states the new truth | PRD §3.23 (mechanic, rounds and rules, feedback with the pulse-then-repair loop and the hint after two stopped runs, fixed difficulty, narration, art); §2 opening, `### 2.2 The 23 games by domain` and its contents anchor, Hub paragraphs (23 tiles, phones 10+10+3), §4.1 (fifteen of 23 on `ChoiceRoundScene`, thirteen directly), §4.8 (fifteen ladder-adaptive games, the seven dimension-adaptive ones, and Robot Path as the one game with no adaptive dimension), §7.1 (60 boot keys, 23 tile and 23 sticker icons), §7.2 (182.5 kB entry, 49 chunks, 23 game scenes), §7.3 (184 of 244 art files, the two scene-local modules) | pass |
| FR-17 (README) | Product summary, Hub paragraph and lazy-scene sentence say twenty-three; the e2e sentence covers 23 launches; the tree and build figures are current | README product summary and Hub paragraph ("twenty-three storybook tiles", "23-tile board"), "all 23 launches", "other twenty-three scenes", project tree (23 scenes, 13 on `ChoiceRoundScene`, 71 game files, 22 per-game logic modules, `robotPathLogic` and `robotPathArt`), build output re-measured 2026-11-16 (182.5 kB, 49 chunks) | pass |
| FR-17 (TDD) | §4.9 "Robot Path" sits beside the hub-groups section with the command model, the placement rule, the run loop and the bridge shape; scene/art inventories and shell figures are current | new `### 4.9 Robot Path` (four paragraphs: `DIRECTIONS`/3×3/`buildPlaythrough`, `canPlace`/`removeFrom`/`runProgram`/`firstDeviation`/`hintFor`, the 112/96 geometry and `STEP_MS`, the run loop's retry-in-place, the `e2eRobotPath()` shape), the hub section renumbered to `### 4.10`; §2.2 tree (71 game files, `RobotPathScene`, 244 illustrations over 12 folders, `robot/` 6, `stickers/` 23, `ui/` 39), §2.3 table (total 244), §3.3 (60 shell keys, 23+23, 193 app keys over 244 art files), §3.5 (Robot Path's own art module), §3.6 (55 boot textures, 182.5 kB, 1335.0 kB, 61 precache), §4.5 (thirteen direct, 22 of 23 sampling the shift), §7.1 (`robotPathLogic`, `robotPathArt`), §7.3, §8.7, §10.2/10.3, §10.5 (22 journeys in 17 spec files, 23 launches) | pass |
| AC-9 | `validate-docs` passes 5/5 with the three game lists and the test-count guard agreeing with the tree; the evidence records the exact figures | the fifth row of the table above; the figures in the PRD/TDD/perf-baseline text are the numbers this run printed | pass |
| NFR-3 | The budget holds and the two new shell SVGs cost no more than 4 kB | shell entry 182.5 kB ≤ 200 kB; Phase 4 measured the two SVGs at 179.4 → 182.4 kB | pass |
| AC-10 | No test was added, weakened, skipped or deleted in this phase | `git diff f96c923e..877bb496 --stat` touches only `README.md`, `docs/PRD.md`, `docs/TDD.md`, `docs/perf-baseline.md`, `conductor/product.md` and `conductor/product-guidelines.md` | pass |

## Deviations a reviewer should disposition

1. **"Robot Path named among the fixed-difficulty seven" is written as the one
   fully fixed game.** The plan's P6.T1 asks for the fifteen adaptive games and
   Robot Path "among the fixed-difficulty seven", but fifteen plus seven is
   twenty-two while the roster is twenty-three, and §4.8 already explains those
   seven (Shape Sorter, Animal Trace, Pop & Freeze, Shadow Match, Big & Small,
   Feelings Faces, Story Order) as games whose *ladder* is fixed while a single
   difficulty dimension still adapts. Robot Path has no adaptive dimension at
   all — it is the only scene that never calls `getAdaptiveBandShift` — so the
   PRD names it as that, in §4.8 and in §3.23, rather than folding it into a
   group whose behaviour differs from its own. The arithmetic and the code both
   agree with that reading; the plan's "seven" does not.
2. **`### 4.9 Hub group chips` became `### 4.10`.** The TDD has no 4.7–4.10 rows
   in its contents list and nothing links to the hub section, so inserting
   Robot Path as 4.9 and renumbering that one heading leaves every other anchor
   untouched; `validate-docs`' anchor scan passes.
3. **TDD §3.3's "236 texture keys in the app" became 193**, the number the suite
   asserts (`APP_ASSET_COUNT`), over the 244-file corpus. The old figure matched
   neither the 193 keys the tests pin nor the corpus, and the phase's brief is to
   make the documents agree with the tree.
4. **The TDD's shell and chunk figures were more than one release stale** (137.8
   kB entry, 42 chunks, 54 precache entries, 53 boot textures). They are now the
   numbers this track's build printed. The dated measurement sections that
   record those older builds are unchanged; the perf baseline's live-figures
   header points at a new dated section instead of rewriting them.
5. **The perf baseline gains a section rather than an edit**: `## Robot Path —
   build and suite figures (2026-11-16)` carries the build, suite, coverage and
   journey measurements, and the header above it now names that section. The
   `docs/perf-baseline.md` rows Phase 5 had refreshed (suite and coverage) are
   the ones this run measures.
6. **`conductor/tech-stack.md` still says "22 lazy game-scene JS chunks"** in a
   dated 2026-10-27 design note. It is outside this phase's Touches list and is a
   historical note, so it was left alone; a later docs pass may want to add
   Robot Path there.

## Evidence

- `README.md` — 23 everywhere it states the roster, the e2e coverage, the scene
  and logic inventories, and the build figures.
- `docs/PRD.md` — §2.2 and its contents anchor, §3.23, §4.1, §4.8 (the fifteen,
  the seven, and Robot Path), §5 Hub paragraphs, §7.1–§7.3.
- `docs/TDD.md` — the new §4.9 and renumbered §4.10, plus §2.2, §2.3, §3.3, §3.5,
  §3.6, §4.1, §4.5, §7.1, §7.3, §8.7, §10.2, §10.3, §10.5.
- `docs/perf-baseline.md` — the live-figures header and the new dated section.
- `conductor/product.md` — §3.1 becomes Twenty-Three Mini-Games with row 23, the
  counts in §1 and §3.2, the replay-variety amendment, the Hub grid paragraph,
  the roadmap sentence, and a `Game 23: Robot Path (2026-11-16)` changelog entry.
- `conductor/product-guidelines.md` — §5 gains **Plan Then Run**.
- `node scripts/validate-docs.js` — 5/5 on the accepted tree.
