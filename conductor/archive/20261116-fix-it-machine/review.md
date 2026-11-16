# Review — 20261116-fix-it-machine

- Round: 3
- Base / Head: 56779675 / c78c47d6
- Reviewed SHA: c78c47d6
- Independence: cold-read (same session, different turn; inputs re-read from the repository — spec, plan, the diff, the styleguides, all seven evidence files — not from memory)
- Verdict: PASS

Round 1 is preserved in history (`7d1d2103`, `review.md` at that commit): verdict `FIXABLE`, three High
findings (R1-1 art-declaration scan, R1-2 hint ladder, R1-3 per-tap recording) plus two Medium and two
Low. Round 2 passed at `918403c7`. Round 3 covers the follow-up the user asked for after that pass —
the browser suite back inside NFR-2's budget — as Phase 8, and re-derives the trace on the new tree.

## Mechanical

| Check | Result |
| --- | --- |
| Commands on a clean run | pass — round 3's gate is `.conductor/evidence/20261116-fix-it-machine/phase-8-gate.log`: 26 browser tests in 4.3 min, 153 files / 3,306 unit tests, gate exit **0**; round 2's chain is `.conductor/evidence/20261116-fix-it-machine/review-r2-gate.log`: `pnpm check`, `pnpm typecheck` (both projects), `pnpm test -- --run` 153 files / 3,306 tests, `pnpm test:coverage` 97.12 / 90.93 / 96.20 / 98.31, `pnpm build` + `validate-bundle.js` (186.4 kB ≤ 200 kB), `validate-pwa.js` 16/16, `validate-docs.js` 5/5, gate exit **0** |
| The stale-transform trap is closed | pass — `artDeclarations.test.ts` now transforms to 24 scenes on its own content; the file runs 54 cases green after a content change (the condition that exposed R1-1), and the phase-7 log records it |
| Evidence for every verified phase | pass — `verification/phase-1..7.md`, each with its gate log in `.conductor/evidence/20261116-fix-it-machine/` |
| State honest | pass — plan shows eight phases `verified`, `metadata.json` `phases_verified: 8`, `tasks_done: 31`, `phases_total: 8` |
| Decisions authorized | pass — every phase's `Decisions` names a `spec.md` `D<n>`; Phase 7's four choices are logged in `.conductor/runs/20261116-fix-it-machine/freebuff/decisions.md` under D5/D11/D9 |
| Scope against Touches | pass — the changed set stays inside the union of the phases' `Touches` (`src/`, `e2e/`, `playwright.config.ts`, `docs/`, `README.md`, `conductor/product.md`, `conductor/product-guidelines.md`, the track files) |
| Tests weakened | pass — Phase 8 *restructures* `launch-all` (the single `test(` body moves inside a `for (const slice of SLICES)` loop and runs twice); every assertion — `profileCount` 1, the tile-id list, round 0, the held return, the error array — is still executed for all 24 launches, and a new guard asserts the two slices partition the registry. The only other removed lines in the track are roster count literals and `fixItMachineScene.test.ts`'s `sessionCorrect` 1 → 3 (FR-10). No `skip`, `only`, deleted `it(` or loosened matcher anywhere |
| No secrets | pass |
| Dependencies | pass — no lockfile change; `Dependencies: none` accurate on all seven phases |

## Coverage

| ID | Implemented | Test | Evidence | Status |
| --- | --- | --- | --- | --- |
| FR-1 | `src/game/gameRegistry.ts:24`, `GameId` | `gameRegistry.test.ts`, `sceneRegistry.test.ts` | phase-4.md | pass |
| FR-2 | `fixItMachineLogic.ts` (`ACTION_ICONS`, `ACTION_FAMILY`) | `fixItMachineLogic.test.ts` | phase-1.md | pass |
| FR-3 | `buildRound` (one substitution, `bugIndex >= 1`) | `fixItMachineLogic.test.ts`, scene tests | phase-1.md | pass |
| FR-4 | `SimilarityBand` + `ROUND_SPECS` relation, asserted per round | `fixItMachineLogic.test.ts` | phase-1.md | pass |
| FR-5 | `run()` at 550/120 ms through one token, `running` gate | `fixItMachineScene.test.ts` | phase-3.md | pass |
| FR-6 | `finishRun` → puzzled pose, ring, tape and round untouched | `fixItMachineScene.test.ts` | phase-3.md | pass |
| FR-7 | goal image whole round, no overlap | layout case | phase-3.md | pass |
| FR-8 | `tapCard` → tray or bounce | `fixItMachineScene.test.ts` | phase-3.md | pass |
| FR-9 | `tapCandidate` → `applyRepair` | `fixItMachineScene.test.ts` | phase-3.md | pass |
| FR-10 | **fixed** — `recordCorrect()` on the bug card and the right tool, `reactWrong` for misses, one win per solve | `records one result for every tap, and one win for the solve` | phase-7.md | pass |
| FR-11 | **fixed** — band + arm at 2, lift + pulse at 4, tray pulse at 6; band cleared by a redraw | four new scene cases | phase-7.md | pass |
| FR-12 | `ROUND_SPECS` 3/3/4/4/5/5 and the three bands | `fixItMachineLogic.test.ts` | phase-1.md | pass |
| FR-13 | **fixed** — "Find the wrong card and fix it." in the scene and in PRD §3.24, TDD §4.11 and `product.md` | `shows and speaks the rule once` | phase-7.md | pass |
| FR-14 | `fixItMachineArt.ts` (16 keys), scene `preload` | `fixItMachineArt.test.ts`, `preloadScene.test.ts`, `artDeclarations.test.ts` (now 24 scenes) | phase-2.md, phase-7.md | pass |
| FR-15 | `e2eBridge.fixItMachine()`; the field list is now the spec's own | `e2eBridge.test.ts`, the journey | phase-3.md, phase-7.md | pass |
| FR-16 | registry → 24 tiles 6/6/6/6, 10+10+4, thinking 8, report 6+6+6+6, 62 shell keys, 195-key union; spec restated to the derived counts | `hubGrid`, `hubPaging`, `hubGroups`, `hubTiles`, `preloadScene`, `textureTiers`, `SettingsPanel`, `ProgressOverlay` | phase-4.md, phase-7.md | pass |
| FR-17 | README list, PRD §2.2/§3.24/§4.1/§7, TDD §2.2/§2.3/§3/§4.5/§4.11/§7/§10.5 | `validate-docs.js` 5/5 | phase-4.md, phase-6.md | pass |
| NFR-1 | 96 px cards @ 12 px, 112 Go, 96 tray, no overlap | layout case | phase-3.md | pass |
| NFR-2 (browser budget) | 24 launches in two parallel halves; three workers | `pnpm test:e2e` 26 passed in 3.8-4.3 min | phase-8.md | pass |
| NFR-3 | entry 186.4 kB ≤ 200 kB; art in the game chunk | `validate-bundle.js` | phase-6.md, phase-7.md | pass |
| NFR-4 | shape-distinct icons, reduced-motion run, no colour-only cue (the band is a filled shape with an arm, not a colour wash alone) | scene tests | phase-3.md, phase-7.md | pass |
| NFR-5 | coverage 97.12/90.93/96.20/98.31; every named logic path tested | `fixItMachineLogic.test.ts` (15) | phase-1.md | pass |
| NFR-6 | injected `Rng` | seeded cases | phase-1.md | pass |
| NFR-7 | no text during play, no timers, immediate response | scene tests | phase-3.md | pass |
| NFR-8 | prewarm through the existing `machine` loader | `prewarm.test.ts` | phase-4.md | pass |
| AC-1 | registry, id, keys, 24 everywhere | roster suites | phase-4.md | pass |
| AC-2 | one wrong card, never index 0, no repeats | logic suite | phase-1.md | pass |
| AC-3 | one card per delay, input locked | scene suite | phase-3.md | pass |
| AC-4 | stopped run changes nothing but feedback | scene suite | phase-3.md | pass |
| AC-5 | goal on screen whole round | layout case | phase-3.md | pass |
| AC-6 | wrong card opens 3 candidates; other cards bounce | scene suite | phase-3.md | pass |
| AC-7 | right candidate repairs and the next run solves; distractor bounces | scene suite | phase-3.md | pass |
| AC-8 | three hint levels at 2/4/6 with the specified cues, none placing a card | four phase-7 cases | phase-7.md | pass |
| AC-9 | six rounds, rule spoken once and replayable | scene suite | phase-3.md | pass |
| AC-10 | journey diagnoses/repairs/completes three rounds; 24 launches | `fix-it-machine.spec.ts`, `launch-all.spec.ts` | phase-5.md | pass |
| AC-11 | `validate-docs` 5/5 with 24 games and current counts | validator runs | phase-6.md, phase-7.md | pass |

## Findings

| ID | Sev | Where | Impact | Fix | Blocks | Status |
| --- | --- | --- | --- | --- | --- | --- |
| R1-1 | High | `src/__tests__/scenes/artDeclarations.test.ts` | the scan missed the 24th scene; green suite was cache-dependent | restate at 24 with the art module and preloader entry | yes | fixed |
| R1-2 | High | `src/scenes/FixItMachineScene.ts` (`applyHint`) | two of FR-11's three cues were missing | three cues implemented and tested | yes | fixed |
| R1-3 | High | `src/scenes/FixItMachineScene.ts` (`tapCard`, `tapCandidate`) | the two correct taps recorded nothing | `recordCorrect()` on both, per-tap case added | yes | fixed |
| R1-4 | Medium | `src/scenes/FixItMachineScene.ts:27` | the spoken line differed from FR-13 | spec's sentence in the scene and three documents | yes | fixed |
| R1-5 | Medium | `src/game/e2eBridge.ts:250` | the published field names differed from FR-15 | spec restated to the hook's fields, logged | yes | fixed |
| R1-6 | Low | `spec.md` FR-16 | stale key arithmetic | restated to the derived counts | no | fixed |
| R1-7 | Low | three test comments | roster described at 23/22 | restated at 24 | no | fixed |

No finding regressed, and nothing new blocks.

## Debt

- R1-6, R1-7 (Low) — fixed in Phase 7 rather than deferred, because both files were already inside the phase's Touches.
- The browser suite measures 5.0 min against NFR-2's 5 min ceiling, with `launch-all` at 3.3 min. Recorded in `docs/perf-baseline.md` and in phase-5.md, not hidden; reshaping `launch-all` is the next game's decision, not a defect in this one.
- The Vite `import.meta.glob` transform cache can outlive the file list it was expanded from (the mechanism behind R1-1). Nothing in the repository needs changing for it, but a future glob-bearing suite file should be edited — or its cache cleared — before trusting a green run.

## Summary

Every requirement and acceptance criterion now traces to code, a test and an evidence file, the three blocking findings are fixed with tests that would have caught them, and the gate is green on the pinned tree. The track is ready to ship.

## Round 3 — Phase 8, the browser budget

| Check | Result |
| --- | --- |
| The 24 launches are all still driven | pass — `SLICES` derives its boundary from `GAME_REGISTRY.length` and the partition guard asserts the indexes equal `[...GAME_REGISTRY.keys()]`, so a launch cannot fall between halves |
| Nothing was shortened to buy the time | pass — the three-second held return, the round-0 check and the error collection are unchanged and run for every launch |
| The budget is met on measurement, not on argument | pass — 5.0 min (one serial file, two workers) → 5.1 min (split, two workers) → 3.8 min (split, three workers) → 4.3 min in the phase gate; every figure is in the phase-8 evidence and in the documents |
| The documents carry the range, not the best run | pass — README, TDD §10.5, the perf baseline and the config comment all say 3.8-4.3 min across two runs |
| Unit suite and artifact untouched | pass — 153 files / 3,306 tests, coverage 97.12/90.93/96.20/98.31 and the entry hash are identical to Phase 7's |

Findings this round: none new. All seven R1 IDs remain `fixed`; the ceiling noted as debt in round 2 is
now closed with a measurement, and the note that survives is the reason a third worker was needed
(a two-worker floor is total work ÷ 2, and the launches are only about a third of it).

Verdict for the track as a whole: **PASS**, pinned to `c78c47d6`.
