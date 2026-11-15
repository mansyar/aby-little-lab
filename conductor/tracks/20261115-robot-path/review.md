# Review — 20261115-robot-path

## Mission state

```
STATE: review R1 — PASS · 2 Medium, 5 Low · 10/10 AC traced · pinned b0d19844 · independence: cold-read
NEXT: conductor-implement Phase 7 (optional Review Fixes: R1-2, R1-3)
STOP: no
```

- **Track:** Robot Path (Game 23), track `20261115-robot-path`
- **Branch / base:** `feat/20261115-robot-path` / `f2f602a0`
- **Commit examined:** `b0d19844` (tree clean; the code under review is `877bb496`, and `b0d19844` adds only the Phase 6 acceptance record)
- **Verdict:** **PASS** — no Critical or High finding, every acceptance criterion traced to a changed file, a test or a named evidence artifact
- **Independence:** cold-read (E3). Same session as the implementation, so this review read only `spec.md`, `plan.md`, the diff `f2f602a0..HEAD`, the verification files, the code styleguides and the ran checks — it did not use the implementation turns' narration, and it re-derived the trace from the spec's own FR/NFR/AC list.
- **Evidence captured:** `.conductor/evidence/review-r1/gate.log` (integrated verification, run by this review on the committed tree)

## Pass A — mechanical

| Check | Result | Evidence |
|---|---|---|
| Commands pass on a clean run | **pass** | the track's full integrated chain, `pnpm test:e2e && pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`, exited **0** on `b0d19844` with a clean tree: 23 browser journeys in 4.6 min (`launch-all` 2.9 min), Biome 330 files (one pre-existing warning), 150 files / 3,254 tests, coverage 97.24 / 91.56 / 96.3 / 98.31, shell entry 182.5 kB ≤ 200 kB, PWA 16/16 (49 chunks), docs 5/5 |
| Evidence exists | **pass** | `verification/phase-1.md` … `phase-6.md`, one for each of the six phases marked verified |
| State honest | **pass** | plan: six `Status: verified`, checkpoints `26a05551`, `1898f5cc`, `c4197970`, `de311e98`, `f96c923e`, `877bb496`; metadata: `phases_verified: 6`, `tasks_done: 17` of `tasks_total: 17`, `last_checkpoint: 877bb496` = Phase 6's checkpoint; 17 checked tasks, 0 unchecked |
| Decisions authorized | **pass, with a note** | every decision the work applied is one of `spec.md`'s D1–D12, and each is logged with its rationale in `.conductor/runs/20261115-robot-path/freebuff/decisions.md` (the run's decisions file, gitignored). The verification files carry no `## Decisions` section of their own, so this check is satisfied by the plan's `Decisions:` line plus the run log rather than by an evidence section |
| Scope | **fail — R1-1 (Low)** | 52 of the 71 changed files are inside the union of the phases' `Touches`; 19 are not (listed in R1-1). All but one are forced by the roster invariants the suite enforces, and phases 3–4 disclosed them at acceptance |
| Tests weakened | **pass** | no added `skip`/`only`/`xit` in any test or spec diff; 25 removed lines that contain `it(`/`test(` against 74 added; unit cases 3,248 → 3,254 and journeys 22 → 23, both up. Every removed assertion is a count or name restated to 23, and the two structural edits (`artDeclarations` scene-local allowlist, `hubPaging` three-tile last page) keep every assertion and add one |
| No secrets | **pass** | the whole diff has no `sk-…`, `API_KEY=`, private-key header, `.env*` or credential literal |
| Dependencies | **pass** | `package.json` and `pnpm-lock.yaml` are unchanged; no phase declared a dependency, and none was taken |

## Pass B — judgment

### Trace: every FR, NFR and AC

| ID | What it requires | Where it lands | Status |
|---|---|---|---|
| FR-1 | 23rd registry row after `story-order`, `GameId` member, no earlier entry moved | `src/game/gameRegistry.ts`, `src/types/index.ts`; `gameRegistry.test.ts` ("declares the games in PRD §2.2 order", "derives the pre-registry tiles unchanged") | pass |
| FR-2 | 3×3 board of 112 px tiles, 12 px gaps, robot on a bottom tile, star not under it, everything inside the canvas | `robotPathLogic` `GRID_SIZE`/`buildRound` (start row `GRID_SIZE-1`, route walk of ≥2 steps); `RobotPathScene` `TILE_SIZE`/`TILE_GAP`/`tileCenter`; `robotPathLogic.test.ts` "starts on the bottom row and never parks the star under the robot" | pass |
| FR-3 | Exactly four absolute commands, one tile each | `DIRECTIONS`, `DIRECTION_DELTA`, `step`; "steps one tile per direction and knows the edges", "offers four commands in compass order" | pass |
| FR-4 | Placement-time legality: off-board, rock and a seventh command refused with a nudge | `canPlace`; "refuses a step off the board or into a rock", "closes the strip at six commands"; the scene nudges through `place()` | pass |
| FR-5 | Tapping a filled slot truncates to a prefix | `removeFrom`; "removes a command and every command after it"; scene `removeAt` | pass |
| FR-6 | Dotted ghost trail follows the program, redrawn on every change, nothing moves before Go | `ghostPath` + scene `redrawTrail()` called from `place` and `removeAt`; "draws a ghost trail identical to the route it would take" | pass |
| FR-7 | Go runs at 450 ms per step, highlights each slot, hops, input locked, reduced motion shortens it | scene `run()` (`STEP_MS`, `delayedCall` per visited tile, `highlightSlot`), `running` guard, `moveRobotTo` via `motionDuration(HOP_MS, 120)`; **"turns to face the direction it moves" is not implemented — R1-4 (Low)** | pass with R1-4 |
| FR-8 | Star completes the round through the shared chime, dot, `NEXT_ROUND_DELAY`, sticker and auto-return; leftovers ignored | `runProgram` stops at the star; `resolveWholeRound(true)`; "stops at the star and never runs the leftovers"; journey fills three dots and returns | pass |
| FR-9 | A stopped run keeps every command, does not advance, pulses the offending arrow, plays the gentle tone | scene `run()` stopped branch, `onWrong`, `onWiggleComplete`; "keeps every command after a stopped run and stays on the round" | pass |
| FR-10 | Hint after two stopped runs, never auto-placed, **at most once per round**, withdrawn on round change | `hintFor` + scene `pulseHint`; "hints the first solution arrow only after the second stopped run". **The "at most once per round" clause is not held — R1-3 (Medium)** | fail on one clause → R1-3 |
| FR-11 | Empty Go records nothing, re-speaks the rule, nudges the strip | scene `run()` empty branch; "re-speaks the rule on an empty Go without running" | pass |
| FR-12 | One result per finished run: correct for a solve, wrong for a stop; no per-arrow result, no adaptive shift | `resolveWholeRound(true/false)` through the base's recorder; the scene never calls the tap recorder | pass |
| FR-13 | One spoken rule line, replayable, silent when SFX is off | `createSpokenInstruction(RULE)`; the rule string matches the PRD verbatim | pass |
| FR-14 | Art in `robotPathArt.ts`, rasterized in the scene's `preload`; arrows and strip `Graphics` | both files; `robotPathArt.test.ts`; `robotPathArt.ts` coverage 100 % | pass |
| FR-15 | Tile and sticker shell keys at icon and card tiers; shell 58 → 60, app 191 → 193 | two SVGs; `shellOwnership`, `groupIntegrity`, `preloadScene`, `textureTiers` (`APP_ASSET_COUNT = 193`) | pass |
| FR-16 | The bridge hook with the exact field list, read live | `E2ERobotPathState`, `robotPath()` in `e2eBridge.ts`; `RobotPathScene.e2eRobotPath()`; three bridge tests and three scene tests; the journey consumes it | pass |
| FR-17 | README, PRD §3.N and TDD §4.5 list 23 games with the right names and anchors; roster, adaptive count, paging and shell counts updated; "All 22 games adapt" corrected | `README.md`, `docs/PRD.md` §2.2/§3.23/§4.1/§4.8/§5/§7, `docs/TDD.md` §2.2/§2.3/§3.3/§3.6/§4.1/§4.5/§4.9/§7.1/§7.3/§8.7/§10.5; `validate-docs` 5/5. **Two residual count errors remain in §10.5 — R1-2 (Medium)** | pass with R1-2 |
| NFR-1 | Palette and Go 112×112, slots 96×96 with 8 px gaps (616 px), 64 px floor, no overlap | scene constants; "layout publishes the phase's geometry" scene test; the Go hit area was **repaired in Phase 5** after the journey proved a centred custom rect was unreachable | pass |
| NFR-2 | No new dependency, storage key, schema or network call | lockfile and `src/types` schema untouched; the game reads no storage except `getSettings()` for SFX | pass |
| NFR-3 | Shell entry ≤ 200 kB, the two SVGs ≤ 4 kB | 182.5 kB measured; 179.4 → 182.4 kB in Phase 4 | pass |
| NFR-4 | Existing motion idioms only; reduced motion shortens the hop | `motionDuration` on hop, highlight, nudge, pulse; no new motion system | pass |
| NFR-5 | A run is bounded (six × 450 ms) and the board is never left locked | `STEP_MS × visited` and `running`/`inputLocked` released in `onWiggleComplete`; a superseded run is dropped by `runToken` | pass |
| NFR-6 | Coverage ≥ 95/88/85/90 with the named branch paths covered | project-wide 97.24 / 91.56 / 96.3 / 98.31; the refused command, empty strip, rock, board edge and hint paths each have a named test. `robotPathLogic.ts` is 94.62 / 97.77 / 92 / 94.8 with `fallbackRng` (lines 262–265) uncovered, and `RobotPathScene.ts` 93.15 / 69.56 / 91.89 / 97.9 — per-file figures are not gated, and the NFR's list is met | pass |
| NFR-7 | No on-screen text during play | arrows, tiles and the robot carry meaning; the rule is a narrator line only | pass |
| AC-1 | Stepping exact; ghost path equals the visited prefix | "walks the documented tiles and arrives", "draws a ghost trail identical to the route it would take" | pass |
| AC-2 | Illegal commands never reach the strip; a seventh is refused | three logic tests above | pass |
| AC-3 | Slot tap removes that command and its successors; trail shortens | `removeFrom` test + scene `removeAt` redrawing the trail; "removes a command and every command after it" | pass |
| AC-4 | Input locked during a run, advance after the delay, stopped run keeps everything and records one wrong | "locks the strip while a run is in flight and ignores taps", "keeps every command after a stopped run and stays on the round", "advances a solved round and fills its dot" | pass |
| AC-5 | Two stopped runs → exactly one hint pulse, never placed | scene test asserting the 2-stop tween and that `place` is not called from the hint path | pass |
| AC-6 | Roster 23, `thinking` 7, phones 10/10/3, report 6+6+6+5 | `hubGroups` 5/5/7/4/2, `hubPaging` "3 pages (10 + 10 + 3)", `SettingsPanel` 23 rows in 6+6+6+5, `hubScene`/`navigation` tile counts | pass |
| AC-7 | 60 shell keys, 193 app keys, both robot assets resolve, guards assert the numbers | four structural suites; `textureTiers` `APP_ASSET_COUNT` | pass |
| AC-8 | A journey programs, repairs in place, completes three rounds and leaves; `launch-all` covers 23 | `e2e/journeys/robot-path.spec.ts` plus `launch-all.spec.ts` (`EXPECTED_GAME_COUNT = 23`); this review's own run: 23 journeys passed, `launch-all` 2.9 min | pass |
| AC-9 | README, PRD and TDD list 23 games in order with matching names; stated counts are the new ones; `validate-docs` 5/5 | the doc diff; the fifth check of this review's run. R1-2 is a non-roster count in TDD §10.5 that this criterion does not cover | pass |
| AC-10 | Every pre-existing suite green with only its roster count restated; nothing deleted, skipped or weakened | the Pass A row; the two structural edits keep every assertion | pass |

### Correctness on the edges

- A run superseded by a round change cannot touch the board: `runToken` is incremented in `clearRoundContent` and every delayed callback returns early on a stale token.
- `onWrong` leaves `inputLocked` set only when there is no deviation to blame, and that cannot happen on a stopped run: a program equal to the route reaches the star, and a prefix reports its own length. `onWiggleComplete` always unlocks.
- `removeAt` and `place` both refuse while a run is in flight, and `removeAt` refuses an empty slot, so the strip cannot be edited mid-walk.
- `buildRound` retries 40 times and then falls back to a deterministic generator, so a pathological `Rng` still yields a legal round (tested); the fallback body itself is the uncovered code noted under NFR-6.
- `e2eRobotPath()` reports `{x: 0, y: 0}` for the robot and star before a round is drawn rather than throwing — a journey that reads it too early gets a wrong-looking point, not a crash, and the journey waits on `solution.length` first.

### Security on changed lines

Nothing on the changed lines takes input, reads a URL, writes storage or renders user text. The bridge remains read-only and gated by `?e2e=1`; it copies state and exposes no setter.

### Style

Biome reports exactly one warning on the changed lines: `src/scenes/RobotPathScene.ts:1:8 useImportType` for `import Phaser from "phaser"`. The file's first line is unchanged since Phase 3, the import is only used for types, and the fix is `import type Phaser`; Biome counts it as a warning, not the error that fails `pnpm check`. It is recorded under Debt rather than as a finding, because it is not new work and it does not fail a gate.

### Decisions

No decision in the diff changes an AC or the public contract: the registry id, group, scene key, tile and sticker keys are exactly FR-1's; the board and palette constants are the spec's; the bridge shape is FR-16's; no adaptive shift was added (D6). The two Phase 5 repairs (Go hit area, three FR-16-only scene fields) were disclosed in `verification/phase-5.md` and are the authorised reading of FR-7/NFR-1 and FR-16.

## Findings

| ID | Sev | Where | Impact | Fix | Blocks | Status |
|---|---|---|---|---|---|---|
| R1-1 | Low | `conductor/tracks/20261115-robot-path/plan.md` (Touches lists) | 19 of the 71 changed files are outside the union of the phases' `Touches`: `.gitignore`, `.dev-server.log`, `src/game/audioIdentity.ts`, `src/game/hub/artGroups.ts`, `src/game/hub/prewarm.ts`, `src/scenes/PreloadScene.ts`, `src/assets/svg/ui/tiles/tile_robot_path.svg`, and eleven suites that restate roster counts (`insightsSummary`, `progressLogic`, `artDeclarations`, `feelingsFacesFlow`, `firstWordsIntegration`, `hubEngagement`, `hubScene`, `navigation`, `preloadScene`, `sceneLifecycle`, `sceneRegistry`, `textureTiers`). Phases 3–4 disclosed the code ones at acceptance; the plan's lists were not updated to match | add the invariant-forced paths to the plan's `Touches` in a later state pass; no code change | no | open |
| R1-2 | Medium | `docs/TDD.md:1271` (`22 journeys across 17 spec files`), `docs/TDD.md:1293` (`the same 21 journeys`), `docs/perf-baseline.md:760` (`22 journeys in 17 spec files`) | the journey counts are wrong: `e2e/journeys/` holds **18** spec files and the suite runs **23** journeys (this review's run: `23 passed (4.6m)`). A reader comparing the doc to a run sees a mismatch | restate to `23 journeys across 18 spec files` in both documents (and `the same 23 journeys` at TDD:1293) | no | open |
| R1-3 | Medium | `src/scenes/RobotPathScene.ts:393-401` (`onWiggleComplete` → `hintFor(round, this.stoppedRuns)`) | FR-10 says the hint is "offered at most once per round", but `hintFor` returns the first solution command for every `stoppedRuns >= 2`, so a third and fourth stopped run pulse the same arrow again. AC-5 (two stops, one pulse, never placed) still holds | keep a per-round `hintOffered` flag reset in `buildRoundContent`/`clearRoundContent`, pulse only when it is false, and add one scene test that a third stopped run pulses nothing | no | open |
| R1-4 | Low | `src/scenes/RobotPathScene.ts:520-540` (`moveRobotTo`), `src/assets/svg/robot/robot_walk.svg` | FR-7's "turning to face the direction it moves" is not implemented. The pose is symmetric, so there is no facing to turn; direction is carried by the strip arrows and the ghost trail. Phase 3 disclosed this at acceptance | if a facing is wanted, add directional walk art or flip X for horizontal moves plus a tween assertion; otherwise strike the clause from FR-7 in a later spec pass | no | open |
| R1-5 | Low | commit `26a05551` | it deletes the tracked `.dev-server.log` and adds a `.gitignore` line for it, inside a commit whose subject is a suite-count refresh. It is a sensible cleanup (a local server log never belonged in the tree) but it is out of every phase's `Touches` and was not disclosed | mention it in `pr.md` so a reviewer sees it; no code change | no | open |
| R1-6 | Low | `conductor/tracks/20261115-robot-path/plan.md` P6.T1 wording | the task says "with Robot Path named among the fixed-difficulty seven", but fifteen ladder-adaptive + seven dimension-adaptive + Robot Path is 23, and `RobotPathScene` is the only scene that never calls `getAdaptiveBandShift` (every other scene does — verified by `grep -rl getAdaptiveBandShift src/scenes`). The shipped PRD §3.23/§4.8 and TDD §7.3 state the code's truth: Robot Path is the one game with no adaptive dimension | reword the plan task (state file, no code change) | no | open |
| R1-7 | Low | `conductor/tech-stack.md:68` and `:113` | a dated 2026-10-27 design note still says "22 lazy game-scene JS chunks" and "13 journeys in 3.0 min". Outside every phase's `Touches` and outside `validate-docs`' governed set (README, PRD, TDD, perf baseline, suite counts), and it is a history entry, so it does not make a living document false | refresh the two figures, or date-stamp the note as historical, in a later docs pass | no | open |

### Disposition of the two doubts raised before this review

- **(a) "Robot Path among the fixed-difficulty seven" vs 23 games.** The plan's phrasing is the only place that says seven; the code and the shipped documents agree with each other and with the arithmetic. `src/scenes/RobotPathScene.ts` never samples `getAdaptiveBandShift`; the other 22 scenes do, and the seven named in PRD §4.8 are fixed *ladders* whose single difficulty dimension still adapts. The review therefore records R1-6 as a Low state-file wording fix, not a code defect, and does not treat FR-17 or D6 as unmet.
- **(b) `conductor/tech-stack.md`'s "22 lazy game-scene JS chunks".** R1-7. It is a dated design note, not a living roster statement: it sits outside the files `validate-docs` governs and outside this track's `Touches`, and the roster is stated correctly in every document AC-9 names. Low, non-blocking, with the concrete fix above.

## Debt (recorded, not blocking)

- **R1-3's sibling:** `robotPathLogic.ts`'s `fallbackRng` body (lines 262–265) is the only uncovered code in the new logic module; the degenerate-generator test exercises the retry loop, not the final fallback.
- **Biome warning:** `RobotPathScene.ts:1`'s `import Phaser` could be `import type Phaser`; it is pre-existing and non-blocking.
- **Evidence files have no `## Decisions` section** of their own; the decision trail lives in the plan's `Decisions:` lines and `.conductor/…/decisions.md`.

## What this review did not do

- It appended no Review Fixes phase and changed no plan status or metadata field: this pass's write scope was `review.md`, the run's decisions log and the commit that adds them. `metadata.json`'s `review_verdict` / `review_rounds` / `reviewed_head_sha` are therefore still `null` / `0` / `null`; the pinned commit for this verdict is **`b0d19844`**, recorded here.
- It fixed nothing — R1-2 and R1-3 are one-line fixes that belong in an implement pass with their own evidence file, per conductor-review's rule that a reviewer that edits is no longer a reviewer.
- It did not re-run any phase, did not push, did not merge and weakened no test.
