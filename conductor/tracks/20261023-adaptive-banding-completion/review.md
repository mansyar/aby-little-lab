# Review: Adaptive Difficulty Completion

- **Track:** 20261023-adaptive-banding-completion
- **Type:** feature
- **Branch:** `feat/20261023-adaptive-banding-completion`
- **Range:** `a054e5a86af2790cafad68b9121afcd23c5aa046..76968c2`
- **Date:** 2026-10-23
- **Verdict:** `PASS` (round 2 — round 1 returned PASS WITH FINDINGS; both findings fixed in Phase R1, one new Low fixed in the round-2 acceptance)

## Summary

The track delivers what the spec promised: seven games that never consumed the
band shift now each expose one difficulty dimension selected by
`getAdaptiveBandShift`, wired once in `create()` per the shipped fourteen-call-site
pattern; classic (shift 0) draws are pinned byte-identical (or by identical
draw shape where the pool itself is the knob); the grown content pools
(12 shadow-match objects in six confusable pairs, 5+6 stories over 33 panels,
24 scenarios) conform to `docs/SVG_STYLE.md`, live in the lazy art groups and
Story Order's own chunk, passed the user's visual review, and leave the boot
shell at exactly 53 keys. The reviewer re-ran static checks and the 19 changed
test files (364 tests, all green) and verified the SVG files directly against
the style guide (512 viewBox, 8px safe margin, flat fills, #2D3748 outlines,
no gradients). Two Low findings remain, both prose corrections: a stale
ownership figure in the phase-3 evidence (the primary's own record, fixed by
the primary) and a coverage snapshot in the TDD that disagrees with the
integrated run's figures by instrumentational fractions of a point.

## Verification

| Layer | Command | Result | Evidence |
|---|---|---|---|
| static | `pnpm check` | pass (re-run by reviewer) | 249 files, exit 0; the two pre-existing findings only (`src/__tests__/scenes/musicalMemoryScene.test.ts:294` noNonNullAssertion; `biome.json` `$schema` info) |
| static | `pnpm typecheck` | pass (re-run by reviewer) | `tsc --noEmit` clean |
| unit (changed files) | `pnpm test -- --run <19 changed test files> --maxWorkers=1` | pass (re-run by reviewer) | 19 files / 364 tests, all green |
| unit (full) | `pnpm test -- --run --maxWorkers=1` | pass (primary) | 119 files / 2,556 tests; plain `pnpm test -- --run` times out on this host in untouched files — sanctioned form recorded |
| coverage | `pnpm test:coverage -- --maxWorkers=1` | pass (primary) | statements 97.92 / branches 91.81 / functions 96.6 / lines 98.7 vs gates 90/85/88/95 |
| build-artifact | `pnpm build` | pass (primary) | 342 modules; shell `index-5BMI4mqt.js` 134.6 kB; 54 precache entries |
| build-artifact | `node scripts/validate-bundle.js` | pass (re-run by reviewer) | shell 134.6 kB ≤ 200 kB; Phaser vendor chunk present |
| build-artifact | `node scripts/validate-pwa.js` | pass (re-run by reviewer) | 16/16; 42 chunks / 42 precached |
| documents | `node scripts/validate-docs.js` | pass (primary) | 5/5 — denied in the reviewer session; the primary's run on the final tree is the record |
| smoke | `node scripts/validate-boot.js` (Phase 3) | pass (primary) | 1547/1036/1104 ms, median 1.10 s ≤ 3.0 s — required, the phase added assets |

## Requirements

| ID | Implemented by | Verified by | Status |
|---|---|---|---|
| FR-1 | P1 — `poolFor(shift)` (9 ornamental / ALL_SHAPES 18 / 10 confusable geometric) + `generatePlaythrough(roundCount, shift)`; every band's pool ≥ 9 so a playthrough has no repeats | `src/__tests__/game/shapeSorterLogic.test.ts`, `src/__tests__/scenes/shapeSorterScene.test.ts` | covered |
| FR-2 | P1 — `waypointsFor(shift)` 4/6/8; `PATH_POINTS` removed; drawing, `createPathProgress` and completion all consume the sampled count | `src/__tests__/game/animalTraceLogic.test.ts`, `src/__tests__/scenes/animalTraceScene.test.ts` | covered |
| FR-3 | P1 — `sleepingBoundsFor(shift)` {0,1}/{1,2}/{2,3} threaded through `selectBubbleType` + `generateInitialBubbles`; the wake flow untouched | `src/__tests__/game/popFreezeLogic.test.ts`, `src/__tests__/scenes/popFreezeScene.test.ts` | covered |
| FR-4 | P3 — `generateRound(shift)` over the 12-object / 6-confusable-cluster corpus; `isMatch`/`isWin`/`ROUND_SIZE` unchanged | `src/__tests__/game/shadowMatchLogic.test.ts`, `src/__tests__/scenes/shadowMatchFlow.test.ts` | covered |
| FR-5 | P2 — `scaleFactorsFor` (1.6/0.68 easy, 1.5/0.7 classic byte-identical, 1.35/0.8 hard); factors stamped per scale category | `src/__tests__/game/bigSmallLogic.test.ts` (touch-floor + in-canvas assertions per band), `src/__tests__/scenes/bigSmallScene.test.ts` | covered |
| FR-6 | P2 — `contrastSplitFor` (6 distinct / shipped 3+3 ladder / 6 confusable); `SCENARIO_POOL` 16→24; wrong-tap-stays and `drawScenarios` untouched | `src/__tests__/game/feelingsFacesLogic.test.ts`, `src/__tests__/scenes/feelingsFacesScene.test.ts` | covered |
| FR-7 | P3 — `mixFor` 5+1/3+3/1+5 from pools grown to 5 obvious + 6 subtle; `buildRound` guards untouched | `src/__tests__/game/storyOrderLogic.test.ts`, `src/__tests__/scenes/storyOrderScene.test.ts`, `src/__tests__/game/storyOrderArt.test.ts` | covered |
| FR-8 | P3 — 17 new SVGs (4 items, 4 shadows, 9 story panels) per SVG_STYLE; contact sheets regenerated and committed | reviewer inspection of all 17 SVGs; `shellOwnership.test.ts` (shell stays 53); `groupIntegrity.test.ts`; the user's visual review (PASSED) | covered |
| NFR-1 | Classic-identity pins per game (classic == default call under seeded RNG) | the seven logic suites | covered |
| NFR-2 | No dependency or network change (`package.json` absent from the diff) | diff file list | covered |
| NFR-3 | Full `verify_phase` chain on the final tree | the integrated run + the reviewer's re-runs | covered |
| NFR-4 | Scene diffs limited to the seven `create()` wirings + content constants; base classes, storage and reaction flows untouched | diff file list (no base-class/storage file in range) | covered |
| NFR-5 | No new audio/motion; toggle off or <6-tap window yields shift 0 = the shipped game | `adaptiveLogic.ts` untouched; pop-freeze easy-band test | covered |
| NFR-6 | New logic testable pool-level or seeded; the two RNG-injected modules keep injection; Math.random knobs covered via seeded spies | `shadowMatchLogic.test.ts` (Park–Miller spy), `bigSmall`/`feelingsFaces`/`storyOrder` seeded tests | covered |
| AC-1 | One seeded shifted-vs-classic difference test per game (seven) | phase 1–3 failing-first records + logic suites | covered |
| AC-2 | Existing tests keep their outcomes; only sanctioned count literals edited | full suite 2,556 green; classic pins per game | covered |
| AC-3 | New content landed; ownership counts 139/133/33/186; shell 53; sheets regenerated | `shellOwnership`/`groupIntegrity`/`preloadScene`/`textureTiers`/`storyOrderArt` tests (248 tests re-run by the reviewer) | covered |
| AC-4 | The documents describe the shipped system; roadmap entry removed; README headline updated; `validate-docs` green | PRD §3.x/§4.8, TDD §4.5/§7.3/§10.x, roadmap, README, SVG_STYLE inspected; `validate-docs` 5/5 | covered |
| AC-5 | The full `verify_phase` including the boot smoke check passes | the commands table | covered |

## Findings

### Critical

None.

### High

None.

### Medium

None.

### Low

**F1 — A stale ownership figure survives in the phase-3 evidence.**
- **File:** `conductor/tracks/20261023-adaptive-banding-completion/verification/phase-3.md:180`
- **What:** the primary-verification "Source diff review" row still reads "group keys 131 to 148, game-only 125 to 141" — the subagent report's figures the primary later corrected to 139/133 (the fact table at line 80 and the committed `shellOwnership.test.ts` assertions both say 139/133).
- **Why:** the evidence contradicts itself and the tests; in a track whose product theme is documentation truth, a stale figure in the phase record invites the next reader to distrust the rest. The file is Conductor prose the phase executor cannot edit, so the correction belongs to the primary.
- **Fix:** correct the row to "group keys 131 to 139, game-only 125 to 133".
- **Requirement:** AC-4.
- **Test gap:** none (documentation record only).

**F2 — The TDD's coverage snapshot disagrees with the integrated run's figures.**
- **File:** `docs/TDD.md:989`
- **What:** §10.3 states "statements 97.94, branches 91.88" (verified 2026-10-23) while the integrated run recorded in `verification/integrated.md` measured statements 97.92 (5241/5352) and branches 91.81 (1312/1429) on the same tree the same day — two "measured today" figures that disagree.
- **Why:** both pass the gates, but a truth-pass document should quote one reconciled final-tree measurement, or say why two runs differ.
- **Fix:** update §10.3 to the integrated run's figures (97.92 / 91.81 / 96.6 / 98.7) and note that per-run coverage instrumentation varies by a fraction of a point between identical runs.
- **Requirement:** AC-4, NFR-4.
- **Test gap:** none (documentation only).

## Overrides

None. The project's `review.strict` is `true`, so every finding above is fixed rather than filed or deferred.

## Plan compliance

| Phase | Checkpoint | Evidence |
|---|---|---|
| 1 — The three compose-only knobs | `3629a81` | `verification/phase-1.md` |
| 2 — The scale and scenario games | `5dd22fb` | `verification/phase-2.md` |
| 3 — The two art games | `6aed316` | `verification/phase-3.md` |
| 4 — The documentation truth pass | `e437dcd` | `verification/phase-4.md` |

Every task was implemented and verified; no task was dropped. The diff stays
within the union of the phases' `Touches` except the recorded deviations
(the art-group modules `items.ts`/`shadows.ts` omitted from Phase 3's Touches;
the count-literal test files; the `--maxWorkers=1` test form). The integrated
run in `verification/integrated.md` records all eight gate segments plus the
boot smoke check, exiting 0.

## Out of scope

- The version bump, the release notes and the tag — human release decisions.
- The real-device pass and the remaining roadmap items (drag-board
  consolidation, storage schema version, install prompt, chunk-load failure
  path, play-time banking, the five `shuffle` copies, repository hygiene).
- Any change to the fifteen pre-existing adaptive strategies.

## Debt

None deferred. Round 1's two Low findings were fixed in Phase R1 (F2 in
`docs/TDD.md`, F1 by the primary as the owner of the Conductor evidence).
Round 2 raised one new Low (F3 — the phase-R1 evidence cited the pre-squash
commit hashes `af03881`/`5b7ed7d` instead of the shipped `a4a4592`), fixed by
the primary during the round-2 acceptance.

## Doc sync

`updated` — the post-review documentation sync ran with the fix phase itself:
`docs/TDD.md` §10.3 now quotes the integrated run's reconciled coverage
figures (F2), and the primary's corrections closed the two evidence-record
defects (F1 in `verification/phase-3.md`, F3 in `verification/phase-R1.md`).
No other shipped document changes after the review.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
|---|---|---|---|---|---|---|
| 1 | PASS WITH FINDINGS | 0 | 0 | 0 | 2 | 2 |
| 2 | PASS | 0 | 0 | 0 | 1 | 3 |

### Round 2

The round-2 review re-read the Phase R1 delta (`d370347..HEAD`) and confirmed
both round-1 findings genuinely fixed: F1's two stale ownership rows corrected
to 139/133, consistent with the committed `shellOwnership.test.ts`
(139/133) and `groupIntegrity.test.ts` (186) assertions; F2's `docs/TDD.md`
§10.3 quoting the integrated run's figures with denominators plus an accurate
variance clause — the phase's own fresh coverage run (97.94/91.88) against the
integrated 97.92/91.81 empirically confirming the variance the clause
describes. Round 2 raised one new Low finding, F3: the phase-R1 evidence's
primary-verification table cited the pre-squash commit hashes `af03881`/
`5b7ed7d`, which the acceptance squash left unreachable; fixed by the primary
(phase-R1.md now records the squash explicitly). Verdict after round 2: PASS.
