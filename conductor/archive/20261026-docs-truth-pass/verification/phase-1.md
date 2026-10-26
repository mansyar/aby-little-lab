# Phase 1 Evidence — Refresh the living docs

- **Track:** 20261026-docs-truth-pass
- **Phase:** 1
- **Date:** 2026-10-26
- **Branch:** `chore/20261026-docs-truth-pass`
- **Base commit:** `e2de9263` — **Head commit:** `9c67f48d3a9443edd183f2f1fbb7829dc9b94ada`
- **Result:** `verified`

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | 1 pre-existing warning (`musicalMemoryScene.test.ts:296` noNonNullAssertion) and 1 pre-existing info (biome schema 2.5.5 vs CLI 2.5.10). No new findings introduced by this phase. |
| static | `pnpm typecheck` | 0 | clean (`tsc --noEmit` over `src/` incl. tests) |
| unit | `pnpm test -- --run` | 0 | **125 files / 2,729 tests, all passed** (36.51 s, vmThreads) |
| coverage | `pnpm test:coverage` | 0 | 125 files / 2,729 tests all passed. **Statements 97.82 % (5493/5615), Branches 91.96 % (1488/1618), Functions 96.77 % (1141/1179), Lines 98.74 % (5116/5181)** — identical to the brief's measured truth. |
| build-artifact | `pnpm build` | 0 | 344 modules; shell entry `index-COuCveC-.js` 142.04 kB, Phaser vendor `phaser-P1E8uaLi.js` 1,374.82 kB, 42 JS chunks, precache 54 entries (1727.85 KiB) |
| build-artifact | `node scripts/validate-bundle.js` | 0 | "All bundle validation checks passed!" (vendor chunk isolation + shell-entry budget) |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| documents | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed (release-note index, links, game-list parity, roadmap shape, Conductor paths) |

The chain was run twice end-to-end after the final edits; the second run above is the phase's full-gate record on the final tree. Earlier attempts are described under Notes.

## Acceptance criteria / FRs

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-2 | README current-state line states **2,729 tests across 125 files**, verified 2026-10-26 | `README.md:49` now reads "Current state: **2,729 tests across 125 files**, all green (verified 2026-10-26)." | done |
| FR-3 | TDD suite-size claims and coverage snapshot state the true counts and today's coverage values as a dated snapshot | `docs/TDD.md:1015` parenthetical "(125 files / 2,729 tests, measured 2026-10-26)"; `:1029` "125 test files, 2,729 tests (verified 2026-10-26)"; `:1035` coverage sentence with 97.82 (5493/5615) / 91.96 (1488/1618) / 96.77 (1141/1179) / 98.74 (5116/5181) across 125 files and 2,729 tests, verified 2026-10-26 | done |
| FR-4 | perf-baseline Test-suite row states the true counts; performance measurements byte-identical | `docs/perf-baseline.md:411` now "\| Test suite \| 125 files / 2,729 tests \|". Header (:3), the SVG-pipeline row (:25), the Coverage row (:412) and every dated measurement section untouched. | done |
| FR-5 | README `game/` line: 56 files = 34 modules + art/16 + hub/6, with `random.ts` in the module enumeration | `README.md:81` "(56 files = 34 modules + art/ 16 + hub/ 6)" and "… progressLogic, random.ts (the shared Fisher–Yates shuffle + Rng type every logic module and scene draws from), voiceLogic …"; "21 per-game logic modules" left intact (random.ts is not a 22nd logic module). | done |
| FR-6 | `docs/roadmap.md:7` reads "checked against the code on 2026-10-26" | edited; no entry content changed | done |
| AC-3 (partial) | No stale `N tests` / `M files` claims remain in the living docs; release-checklist byte-identical | Post-edit grep sweep over all four Touches files: **zero matches** (verbatim output below). `git diff --stat e2de9263..HEAD` shows only the four Touches files — `docs/release-checklist.md` untouched. | partial (guard-scan clause lands in Phase 2) |
| AC-4 (partial) | Roadmap date reads 2026-10-26 and full `validate-docs` passes | Date line edited; validator exit 0 with "5 passed, 0 failed" | partial (final confirmation re-run at track level) |

## Files touched

- `README.md` (2c9c4b4b)
- `docs/perf-baseline.md` (47092d26)
- `docs/roadmap.md` (a81dd830)
- `docs/TDD.md` (37929551, 9c67f48d)

## Commits

| SHA | Message |
|---|---|
| `2c9c4b4b` | docs(readme): refresh suite counts to 125 files / 2,729 tests and game structure to 34 modules |
| `47092d26` | docs(perf-baseline): refresh test-suite row to 125 files / 2,729 tests |
| `a81dd830` | docs(roadmap): refresh the checked-against-code date to 2026-10-26 |
| `37929551` | docs(tdd): refresh suite counts, coverage snapshot and structure tree to the 2026-10-26 truth |
| `9c67f48d` | docs(tdd): correct decodeLogic coverage figures to the live 2026-10-26 run |

## Grep sweep (verbatim)

Pattern: `2,556|2556|2,488|2488|119 files|118 files|119 test|118 test`

**Before edits** (matches the brief's inventory exactly):

```text
README.md            Line 49: ... Current state: **2,556 tests across 119 files**, all green (verified 2026-10-23).
docs/TDD.md          Line 1013: ... Under `vmThreads` the same full suite ran green twice at 59.4 s and 59.9 s (119 files / 2,556 tests, measured 2026-10-23). ...
docs/TDD.md          Line 1027: 119 test files, 2,556 tests (verified 2026-10-23). ...
docs/TDD.md          Line 1033: ... Current coverage (verified 2026-10-23, the integrated final-tree run) is statements 97.92 (5241/5352) ... across 119 files and 2,556 tests; ...
docs/perf-baseline.md Line 411: | Test suite | 118 files / 2,488 tests | `pnpm test -- --run` |
docs/roadmap.md      (no matches)
```

**After edits:**

```text
README.md: No matches found
docs/TDD.md: No matches found
docs/perf-baseline.md: No matches found
docs/roadmap.md: No matches found
```

Every hit was fixed; no intentional historical mention of the swept patterns remains in the four Touches files.

## decodeLogic verification (for the `:1035` sentence rewrite)

1. **Pool size** — `src/game/decodeLogic.ts:7` declares `DECODE_POOL`, built from `WORD_POOL` plus 4 CVC words (FOX, CUP, MAP, BED). `wordLogic.ts` `WORD_POOL` holds exactly 18 entries (lines 23–40) → **22 decode words**. The source comment at `decodeLogic.ts:64` itself says "should not happen with 22 pool". The old text's "a pool of 22 words" is still true and was kept.
2. **Uncovered line range** — the live v8 coverage run in the phase gate reports `decodeLogic.ts … 66-80` (text reporter). Structural cross-check: the fallback distractor block sits at lines 64–82 (comment at 64, `if (distractors.length < 3)` at 65, body statements 66–80). The old text's 63–77 is the same block on the pre-PR-#67 file, shifted down exactly 3 lines by the `import { type Rng, shuffle } from "./random"` line at line 3.
3. **Per-file percentages** — the gate's coverage table shows decodeLogic **74.54 % statements (41/55), 59.37 % branches (19/32), 83.33 % functions (10/12), 75 % lines (33/44)** (fractions confirmed in the generated HTML report, `coverage/src/game/decodeLogic.ts.html`). The sentence's stale `73.8 % lines` and `56.66 % branches` were corrected to `75 % lines` and `59.37 % branches`; `74.54 % statements` and `83.33 % functions` were confirmed unchanged. decodeLogic remains the lowest file on statements (74.54) and branches (59.37), tied-lowest on lines (75 with AddItUpScene/TakeAwayScene), so "the lowest file" stays true.

## Deviations

- `docs/TDD.md` structure tree: added the `│   ├── GameLoadCue.ts` line (and `│   ├── random.ts` under `game/`). The brief's inventory named the count-line changes and explicitly required "mention random.ts the same way as README"; the GameLoadCue.ts tree line goes one step beyond the literal `:181` instruction because the TDD tree otherwise enumerates exactly its 16 previous component files and would contradict the refreshed "17 files" count. Both lines are within `Touches`.
- Plan P1.T3.1 says "the header's measured date refreshed" for `docs/perf-baseline.md`; the brief's inventory overrides this — the header blockquote (:3) carries no test counts and stays byte-identical. Followed the brief.

## Notes

- **Verification history.** On this host, the first three `pnpm test:coverage` attempts and one diagnostic full-chain run failed with 30 s (one 20 s) `testTimeout` errors in the heavy "many samples" property tests (`addItUpLogic`, `countLogic`, `decodeLogic`, `firstSoundsLogic`, `moreLessLogic`, `numberOrderLogic`, `takeAwayLogic`) under load — 2,722–2,726 of 2,729 tests passed in every attempt and the suite summary always reported **125 files / 2,729 tests**. No source/config change was made (and none is in `Touches`); the flake is host-load-dependent (vmThreads + v8 instrumentation on a contended machine). The final two full-chain runs, a few minutes later, completed cleanly with all 2,729 tests passing and no timeouts — the failing-attempt outputs were not caused by the doc edits (docs-only diff) and are not reproducible on a quiet host.
- The brief's "derive nothing yourself" numbers were confirmed live by the gate: totals 97.82/91.96/96.77/98.74 with the exact numerators/denominators quoted in `docs/TDD.md:1035`, and 125 files / 2,729 tests.
- Asset-count lines (`docs/TDD.md:233/250/305-315`), `scenes/ # 29 files` and `utils/ # 14 files` were left byte-identical per the brief (verified accurate).
- The `:1013` sentence keeps the two historical 59.4 s / 59.9 s vmThreads timings as history; only the parenthetical counts+date were refreshed.

## Rework addendum (post-audit, 2026-10-26)

The primary's independent audit found one remaining gap against the phase Goal: in
`docs/perf-baseline.md`, the Coverage row directly beneath the refreshed Test-suite
row of the same current-figures table still carried the stale 2026-10-22 values
(97.92/91.62/96.58/98.69), contradicting the refreshed `docs/TDD.md:1035` snapshot.
The row is the same "current state" semantics as the Test-suite row, so it was
refreshed in rework:

- `docs/perf-baseline.md:412` → `| Coverage | statements 97.82 % / branches 91.96 % / functions 96.77 % / lines 98.74 % | \`pnpm test:coverage\` |` — no other line, section, or measurement touched.
- `node scripts/validate-docs.js` re-run on the reworked tree: **exit 0** ("5 passed, 0 failed").
- Commit: `docs(perf-baseline): refresh the Coverage row of the current-figures table to the 2026-10-26 snapshot`.

## Primary verification

Primary verification 2026-10-26 (independent of the executor's report):

- Worktree clean; `git log --oneline e2de9263..HEAD` = 8 commits (2c9c4b4b, 47092d26, a81dd830, 37929551, 9c67f48d, b7104cdf, 3d868300, 91dfd9c4), zero merge commits; `git diff --name-only e2de9263..HEAD` = exactly the four Touches docs plus this evidence file. `git diff -- docs/release-checklist.md` = empty (G3 held byte-identical).
- Diff audit line by line: README:49 counts/date; README:79 components 17 + GameLoadCue description; README:81 game/ 56 = 34 modules + art/16 + hub/6 with random.ts inserted; TDD tree lines (:180 GameLoadCue, :199 game/ 56/34, :225 random.ts); TDD:1015 parenthetical counts+date (59.4/59.9 s timings kept as history with their original date); TDD:1029 suite shape; TDD:1035 coverage snapshot 97.82 (5493/5615) / 91.96 (1488/1618) / 96.77 (1141/1179) / 98.74 (5116/5181); TDD decodeLogic sentence corrected to 75 % lines / 74.54 % statements / 83.33 % functions / 59.37 % branches, uncovered 66-80, pool 22; perf-baseline:411 Test-suite row 125/2,729; perf-baseline:412 Coverage row refreshed in rework (97.82/91.96/96.77/98.74); roadmap:7 date 2026-10-26. No measurement section touched.
- Stale-count sweep over README/TDD/perf-baseline for `2,556|2,488|119 files|118 files|119 test files|118 test files` = zero matches.
- Full 8-command chain re-run by the primary on the final tree: all exit 0 (258 files checked, 1 warning + 1 info both pre-existing; tsc clean; 125 files / 2,729 tests passed; coverage 97.82/91.96/96.77/98.74; build 54 precache entries 1727.85 KiB; bundle PASS shell 138.7 kB <= 200 kB; PWA 16/0, 42/42 precached; docs 5/0).
- Flakiness note confirmed from the primary's own runs: three full-suite attempts before the final clean run lost 5-7 property tests each to `Test timed out in 30000ms` under host load (34-66 s per test, zero assertion failures); the same four files pass 83/83 in isolation in 51 s. This matches the executor's documented pattern and predates this track.
- Primary verdict: **verified**.
