# Review — 20261116-fix-it-machine

- Round: 1
- Base / Head: 56779675 / 6a74feae
- Reviewed SHA: 6a74feae
- Independence: cold-read (same session, inputs re-read: spec.md, plan.md, the diff, the style guides, the six evidence files)
- Verdict: FIXABLE

## Mechanical

| Check | Result |
| --- | --- |
| Commands on a clean run | **fail** — see R1-1: the suite is green only while Vite serves a cached transform of `artDeclarations.test.ts`; forced re-transform gives 5 failures (`.conductor/evidence/20261116-fix-it-machine/stale-glob-probe.log`) |
| Evidence for every verified phase | pass — `verification/phase-1..6.md` all present, each with its gate log under `.conductor/evidence/20261116-fix-it-machine/` |
| State honest | pass — plan shows 6 phases `verified`, `metadata.json` `phases_verified: 6`, `tasks_done: 22`, `phases_total: 6` |
| Decisions authorized | pass — every phase's decisions name a `spec.md` `D<n>`; the two runtime deviations (key-count arithmetic, formatted-file re-measure) are logged in `decisions.md` under D7/D9 |
| Scope against Touches | pass — 79 changed paths, all inside `src/`, `e2e/`, `docs/`, `README.md`, `conductor/`; no path outside the union of the phases' `Touches` |
| Tests weakened | pass — the only removed test lines are roster count literals, each re-added at 24 (60 → 62 shell keys, 23 → 24 games/tiles/rows/pages); no `skip`, `only`, deleted `it(` or loosened assertion in the diff |
| No secrets | pass — no key, token, `.env` or credential literal in the diff |
| Dependencies | pass — no lockfile change; `Dependencies: none` on every phase is accurate |

## Coverage

| ID | Implemented | Test | Evidence | Status |
| --- | --- | --- | --- | --- |
| FR-1 | `src/game/gameRegistry.ts:24`, `src/types/index.ts` (`GameId`) | `src/__tests__/gameRegistry.test.ts:52`, `:215` | phase-4.md | pass |
| FR-2 | `fixItMachineLogic.ts` (`ACTION_ICONS`, `ROUND_SPECS`) | `fixItMachineLogic.test.ts` (six icons, three families) | phase-1.md | pass |
| FR-3 | `buildRound` (one substitution, `bugIndex >= 1`) | `fixItMachineLogic.test.ts` + `fixItMachineScene.test.ts` | phase-1.md, phase-3.md | pass |
| FR-4 | `SimilarityBand`, `ROUND_SPECS`, `familyPartner` | `fixItMachineLogic.test.ts` (per-round relation asserted) | phase-1.md | pass |
| FR-5 | `FixItMachineScene.run` (`STEP_MS = 550`, `STEP_REDUCED_MS = 120`, `running` gate) | `fixItMachineScene.test.ts` (lock, tap-during-run ignored) | phase-3.md | pass |
| FR-6 | `finishRun` → `reactWrong`, tape/round untouched | `fixItMachineScene.test.ts` (stopped run keeps the tape) | phase-3.md | pass |
| FR-7 | goal image always on screen, no overlap | `fixItMachineScene.test.ts` (layout test) | phase-3.md | pass |
| FR-8 | `tapCard` → `openTray`, else bounce | `fixItMachineScene.test.ts` | phase-3.md | pass |
| FR-9 | `tapCandidate` → `applyRepair` | `fixItMachineScene.test.ts` | phase-3.md | pass |
| FR-10 | **partial** — wrong taps record through `reactWrong`, but the correct bug card and the correct candidate record nothing (`grep -n recordCorrect src/scenes/FixItMachineScene.ts` is empty) | — | — | **fail (R1-3)** |
| FR-11 | **partial** — thresholds 2/4/6 correct (`hintLevelFor`), but the three representations do not match the spec: level 1 pulses the bug card (spec: soft band from card 0 through the bug card, machine arm pointing), level 2 pulses the tray candidate (spec: the bug card lifts and pulses once), level 3 adds nothing beyond level 2 (spec: the correct candidate pulses once) | `fixItMachineScene.test.ts` asserts levels fire at 2/4/6 | phase-3.md | **fail (R1-2)** |
| FR-12 | `ROUND_SPECS` (3/3/4/4/5/5, bands), `buildPlaythrough` | `fixItMachineLogic.test.ts` | phase-1.md | pass |
| FR-13 | rule line spoken via `RoundNarrator`, replayable | `fixItMachineScene.test.ts` | phase-3.md | **partial (R1-4: text differs)** |
| FR-14 | `fixItMachineArt.ts` (16 keys), scene `preload()` | `fixItMachineArt.test.ts`, `preloadScene.test.ts` | phase-2.md | pass |
| FR-15 | `e2eBridge.fixItMachine()` | `e2eBridge.test.ts` (3 cases) | phase-3.md | partial (R1-5: names) |
| FR-16 | registry → 24 tiles, 6/6/6/6, phones 10+10+4, thinking 8, report 6+6+6+6, 62 shell keys, 195-key union | `hubGrid`, `hubPaging`, `hubGroups`, `hubTiles`, `preloadScene`, `textureTiers`, `SettingsPanel`, `ProgressOverlay` | phase-4.md | pass (R1-6: spec arithmetic) |
| FR-17 | README list, PRD §3.24, TDD §4.5/§4.11, counts | `node scripts/validate-docs.js` 5/5 | phase-4.md, phase-6.md | pass |
| NFR-1 | cards 96×96 @ 12 px, Go 112, tray 96 | `fixItMachineScene.test.ts` layout geometry | phase-3.md | pass |
| NFR-2 | no new dependency, storage key or network call | no manifest/lockfile diff | phase-4.md | pass |
| NFR-3 | entry 186.4 kB ≤ 200 kB; art in the game chunk | `validate-bundle.js`, `fixItMachineArt.test.ts` | phase-4.md, phase-6.md | pass |
| NFR-4 | shape-distinct icons, reduced-motion run at 120 ms, no colour-only information | `fixItMachineScene.test.ts` (reduced motion) | phase-3.md | pass |
| NFR-5 | coverage 97.07/90.73/96.19/98.24; band/never-first/hint/no-op/tray/solve paths tested | `fixItMachineLogic.test.ts` (15), `fixItMachineScene.test.ts` (16) | phase-1.md, phase-3.md | pass |
| NFR-6 | injected `Rng` | `buildRound(0, mulberry32(seed))` cases | phase-1.md | pass |
| NFR-7 | no text during play, no timers | `fixItMachineScene.test.ts` | phase-3.md | pass |
| NFR-8 | prewarm via existing `machine` loader, no new engine | `prewarm.test.ts`, `artGroups.test.ts` | phase-4.md | pass |
| AC-1 | registry/id/keys | `gameRegistry.test.ts`, `sceneRegistry.test.ts` | phase-4.md | pass |
| AC-2 | one wrong card, never index 0, no repeats | `fixItMachineLogic.test.ts` | phase-1.md | pass |
| AC-3 | one card per delay, input locked | `fixItMachineScene.test.ts` | phase-3.md | pass |
| AC-4 | stopped run changes nothing but feedback | `fixItMachineScene.test.ts` | phase-3.md | pass |
| AC-5 | goal on screen whole round | `fixItMachineScene.test.ts` | phase-3.md | pass |
| AC-6 | wrong card opens 3 candidates; other cards bounce | `fixItMachineScene.test.ts` | phase-3.md | pass |
| AC-7 | right candidate repairs, next run solves; distractor bounces | `fixItMachineScene.test.ts` | phase-3.md | pass |
| AC-8 | three hint levels at 2/4/6, no hint places a card | `fixItMachineScene.test.ts` | phase-3.md | **partial (R1-2)** |
| AC-9 | six rounds, rule spoken once and replayable | `fixItMachineScene.test.ts`, journey | phase-3.md | **partial (R1-4)** |
| AC-10 | journey diagnoses/repairs/completes 3 rounds; `launch-all` 24 | `e2e/journeys/fix-it-machine.spec.ts`, `launch-all.spec.ts` | phase-5.md | pass |
| AC-11 | `validate-docs` 5/5 with 24 everywhere | phase-5/6 gate logs | phase-6.md | pass |

## Findings

| ID | Sev | Where | Impact | Fix | Blocks | Status |
| --- | --- | --- | --- | --- | --- | --- |
| R1-1 | High | `src/__tests__/scenes/artDeclarations.test.ts:354-366` | The art-declaration scan still expects 23 game scenes, so the 24th scene escapes every declaration check. The suite only looked green because Vite served a cached transform whose glob predates `FixItMachineScene.ts`; any fresh clone, fresh CI run or `node_modules/.vite` wipe fails 5 tests ("discovers all 23 game scenes", "reads every game module a scene imports", "declares art groups in every game scene but the two with a local preloader", and the two `FixItMachineScene` declaration cases). Evidence: `.conductor/evidence/20261116-fix-it-machine/stale-glob-probe.log`. | Restate the scan at 24: add `fixItMachineArt` to `GAME_MODULES`, add `FixItMachineScene` to `SCENE_LOCAL_PRELOADER_SCENES` and its call to `SCENE_LOCAL_PRELOADER_CALLS`, and move the three count literals and the two comments to 24 — then prove it with a forced re-transform run of that file. | yes | open |
| R1-2 | High | `src/scenes/FixItMachineScene.ts:455-469` (`applyHint`) | FR-11 names three distinct representations (band + pointing arm at 2, bug card lifts and pulses at 4, correct candidate pulses at 6); the scene maps level 1 to a card pulse, level 2 to a tray pulse and level 3 to nothing new, so the ladder the spec designed to escalate least-to-most collapses into two steps and the hardest rounds lose their last cue. AC-8 is therefore only half met. | Implement the three cues as specified: level 1 draws the soft band from card 0 through the bug card plus the machine's pointing arm, level 2 lifts and pulses the bug card, level 3 pulses the correct tray candidate; keep every cue visual and add scene tests for each representation. | yes | open |
| R1-3 | High | `src/scenes/FixItMachineScene.ts:394-420` (`tapCard`, `tapCandidate`) | FR-10 and D11 require **every** diagnosis and tray tap to record exactly one result. Wrong taps record through `reactWrong`, but the two correct taps (the bug card, the right tool) record nothing, so Learning Progress would show this game's accuracy as if every correct move were free — the metric the PRD publishes per game. Plan P3.T3 claimed this and the phase record repeated it. | Call `this.recordCorrect()` when the tapped card is the bug card and when the tapped candidate is the right tool; add scene tests asserting `sessionCorrect`/`sessionWrong` move by exactly one per tap and that a solve adds one win. | yes | open |
| R1-4 | Medium | `src/scenes/FixItMachineScene.ts:27` (`RULE`) | FR-13 fixes the spoken line as "Find the wrong card and fix it."; the scene (and the PRD §3.24, TDD §4.11 and `conductor/product.md` changelog that quote it) use "Watch the machine make the toy. Then tap the card that went wrong." The words are what a pre-reader hears, so the difference is behaviour, not prose. | Use the spec's line, or record a `D<n>`-authorized change; the cheap fix is to adopt the spec's sentence and update the four documents that quote it. | yes | open |
| R1-5 | Medium | `src/game/e2eBridge.ts:250` (`E2EFixItMachineState`) | FR-15 names the published fields `steps`, `tapePoints`, `trayPoints`, `goPoint`; the bridge publishes `solution`, `cards`, `tray`, `go` (plus `tape`, `machine`, `goal`, `failedRuns`). The data is richer and the journey passes, but the contract the spec states is not the contract the hook offers. | Either rename to the spec's field names or record the richer shape as the authorized one in `spec.md`/`decisions.md`; keep the extra fields, which the journey uses. | yes | open |
| R1-6 | Low | `spec.md:FR-16` | FR-16's arithmetic ("app 201, 8 new app keys") contradicts FR-14 (16 new drawings); the implementation derives 195 keys and logs the deviation. The spec should not keep a number the track proved wrong. | Restate FR-16 to the derived counts (62 shell keys; 195 in the shell-plus-groups union) and note that the scene-local sixteen are not part of that union. | no | open |
| R1-7 | Low | `src/__tests__/game/art/groupIntegrity.test.ts:56`, `src/__tests__/game/hubGrid.test.ts:148`, `src/__tests__/scenes/hubEngagement.test.ts:316` | Three comments still describe the roster at 23 (or 22) games / tiles. No assertion is affected. | Restate the three comments at 24. | no | open |

## Debt

- R1-6 (Low) — spec arithmetic; recorded, fixed in the same phase because the file is already in Touches.
- R1-7 (Low) — comments only; fixed in the same phase.
- The browser suite now measures 5.0 min on two workers against NFR-2's 5 min ceiling (`docs/perf-baseline.md`, recorded, not hidden). Not a finding: the phase records it and names `launch-all` as the next thing to reshape.

## Summary

The track is complete in scope and unusually well evidenced: all six phases have gate logs, every AC traces to a test or an artifact, the roster restatement is genuinely mechanical, and the journey proves the game end to end. Three things must change before this ships — the art-declaration scan must actually cover the 24th scene (the green suite was cache-dependent), the hint ladder must implement the three cues FR-11 specifies, and the two correct taps must record results as FR-10 and D11 require — plus the rule line and the bridge field names, which the spec states differently from the code.
