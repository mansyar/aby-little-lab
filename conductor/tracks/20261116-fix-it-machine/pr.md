## Summary

Adds **Fix-It Machine** as game 24 — the suite's first debugging game, and the
half of programming Robot Path does not teach. A friendly machine runs a tape of
tool-instruction cards to repair one toy; exactly one card is a substitution, so
the machine does something silly at that step. The child taps the card they think
is wrong, picks the right tool from a three-card repair tray, and presses Go again
to watch the toy come out right. Six fixed rounds of 3–5 cards over six toys, a
three-level visual hint ladder on missed taps, the game's own audio identity, and
a browser journey that diagnoses, repairs and completes three rounds.

## Track

- **ID:** `20261116-fix-it-machine`
- **Type:** `feature`
- **Spec:** [`conductor/tracks/20261116-fix-it-machine/spec.md`](conductor/tracks/20261116-fix-it-machine/spec.md)
- **Plan:** [`conductor/tracks/20261116-fix-it-machine/plan.md`](conductor/tracks/20261116-fix-it-machine/plan.md)
- **Review:** [`conductor/tracks/20261116-fix-it-machine/review.md`](conductor/tracks/20261116-fix-it-machine/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Rules and rounds | Pure `fixItMachineLogic`: six tools in three families, six authored rounds, the substitution bug, repair, hint levels, solve | verified | `b80ea550` | Rounds are authored, not generated, so every round is a plausible job; the wrong card is never first and never repeats a tool |
| 2: Workshop art | Sixteen SVGs plus `fixItMachineArt` and its preloader | verified | `d0b96881` | Four machine poses on one shared anchor, six tool pictograms, six toy goals; all scene-local |
| 3: The scene | `FixItMachineScene` on `ChoiceRoundScene`, the tape run, the tray, the hints, the bridge hook | verified | `6f227043` | A stopped run locks nothing: the tape, the round and the child's input survive it |
| 4: The roster | Registry row, tile and sticker, audio identity, art group, prewarm, every count-bearing suite and document at 24 | verified | `e12a500c` | Hub rows 6/6/6/6, phones 10+10+4, `thinking` holds 8, report pages 6+6+6+6 |
| 5: The browser proof | A journey that diagnoses, repairs and solves three rounds; roster literals | verified | `b7f27c09` | Played only through the published bridge; 24 launches inside `launch-all` |
| 6: Documents | PRD §3.24, TDD §4.11 and the restated counts, product record, guidelines, measured baseline | verified | `6a74feae` | `validate-docs` 5/5 |
| 7: Review fixes | The art-declaration scan, the hint ladder, per-tap recording, the spoken rule, the bridge contract | verified | `918403c7` | Round 1 found three High gaps; all fixed with tests that would have caught them |
| 8: The browser budget | 24 launches as two parallel halves, plus the worker count and documents to match | verified | `c78c47d6` | Suite back inside NFR-2: 5.0 min → **3.8-4.3 min**, `launch-all` 3.3 min → 1.8 min, nothing dropped |

## Requirements

- [x] `FR-1..FR-4` — registry row and id, six action pictograms in three families, one authored substitution never at index 0, the three-band similarity ladder (`fixItMachineLogic.test.ts`)
- [x] `FR-5..FR-6` — the 550 ms tape run (120 ms reduced motion) with input locked, and a stopped run that changes nothing but feedback (`fixItMachineScene.test.ts`)
- [x] `FR-7..FR-9` — the goal stays on screen, the wrong card opens a three-tool tray, the right tool repairs one card in place (`fixItMachineScene.test.ts`)
- [x] `FR-10..FR-11` — one recorded result per tap and one win per solve; hints at 2, 4 and 6 missed taps as band, lift and tray pulse, never placing a card (`fixItMachineScene.test.ts`, phase-7 evidence)
- [x] `FR-12..FR-13` — six rounds of 3/3/4/4/5/5 with fixed bands, and one spoken rule line through the shared narrator (`fixItMachineLogic.test.ts`, scene tests)
- [x] `FR-14..FR-15` — sixteen scene-local drawings plus the two shell keys; the `?e2e=1` hook publishes the tape, the bug, the counters and every tap point (`fixItMachineArt.test.ts`, `e2eBridge.test.ts`)
- [x] `FR-16..FR-17` — 24 tiles across the Hub, paging, groups, report rows and shell keys; README, PRD and TDD describe 24 games and the current suite truth (`validate-docs` 5/5)
- [x] `NFR-1..NFR-8` — touch geometry, no new dependency or storage key, shell entry 186.4 kB ≤ 200 kB, shape-distinct icons and reduced motion, coverage floors, injected RNG, no text or timers, prewarm through the existing loader
- [x] `AC-1..AC-11` — mapped per phase; see `review.md`'s coverage table

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| unit | `pnpm test -- --run` | pass — 153 files / 3,306 tests | `phase-7-gate.log`, `review-r2-gate.log` |
| coverage | `pnpm test:coverage` | pass — statements 97.12 / branches 90.93 / functions 96.20 / lines 98.31 | `phase-7-gate.log` |
| lint + types | `pnpm check`, `pnpm typecheck` | pass (both projects) | `phase-7-gate.log` |
| build | `pnpm build` + `validate-bundle.js` + `validate-pwa.js` | pass — shell entry 186.4 kB ≤ 200 kB, 51 chunks, 63 precache entries | `phase-7-gate.log` |
| docs | `node scripts/validate-docs.js` | pass — 5/5 | `phase-7-gate.log` |
| browser | `pnpm test:e2e` | pass — 26 browser tests in 19 spec files (24 launches as two parallel halves), **4.3 min** on three workers, `launch-all` 1.8 min | `phase-8-gate.log` |
| journey (after the fixes) | `npx playwright test e2e/journeys/fix-it-machine.spec.ts` | pass — 31.3 s | `phase-7-e2e.log` |

## Review

- **Verdict:** `PASS` (round 3, pinned `c78c47d6`)
- **Rounds:** 3 — round 1 `FIXABLE` (7 findings), round 2 `PASS`, round 3 `PASS` after the browser-budget follow-up
- **Fixed:** 7 findings (3 High, 2 Medium, 2 Low) in Phase 7
- **Accepted/deferred:** 0 blocking; the Vite glob-cache trap stays noted in `review.md` as a hazard to remember, and the 5 min browser ceiling is now closed by measurement

## Deviations and risks

- **App texture keys move 193 → 195, not the 201 the plan first estimated.** The union the docs,
  the tier table and the ownership test describe is the shell plus the twelve `game/art` groups;
  the sixteen workshop drawings are scene-local like Robot Path's six. Logged in `decisions.md` and
  restated in `spec.md` FR-16.
- **The bridge's field names follow the suite's vocabulary**, not the invented set in the first
  draft of FR-15; the spec now states the fields the hook offers. Logged in `decisions.md`.
- **A solved round now records three correct results** (bug card, right tool, solve) instead of one,
  because FR-10 and D11 require per-tap recording; the scene's own `sessionCorrect` case was
  restated with the reason inline.
- **The browser suite was on NFR-2's 5 min ceiling** and Phase 8 fixed it: the 24 launches are now two
  asserted halves in parallel workers and the suite runs on three workers, measuring 3.8-4.3 min with
  `launch-all` at 1.8 min. The split alone was not enough (5.1 min at two workers, because the floor is
  total work ÷ workers), which is why the worker count changed too — both numbers are in the
  baseline and in `playwright.config.ts`.
- **A stale Vite `import.meta.glob` transform can hide a suite change.** It hid the 24th scene from
  the art-declaration scan until the file's content changed; review round 1 caught it and Phase 7
  proved the fix by forcing the transform. Worth remembering for any future glob-bearing suite.

## Rollback

```bash
# Squash-merge commit
git revert --no-edit <merge-commit>
```

No migrations or data changes: the new `fix-it-machine` key backfills into the existing per-profile
sticker and progress records on load, and no stored id, sticker or profile changes meaning.
