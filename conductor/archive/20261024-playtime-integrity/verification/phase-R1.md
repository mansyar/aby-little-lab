# Phase R1 Evidence — Review fixes (F1–F4)

- **Track:** `20261024-playtime-integrity` — Play-Time Session Integrity
- **Phase:** R1 — Review fixes for round 1
- **Date:** 2026-10-24
- **Branch:** `fix/20261024-playtime-integrity`
- **Phase base:** `ef575fab1a2e78db1bf85390c9ac7a79831b24ce`
- **Code commit:** `bc2ee99` (code, tests and docs in one commit; this evidence follows in its own)
- **Result:** every runnable layer of the gate is green. `node scripts/validate-docs.js`
  was denied by the environment's command permissions before the script started
  (see Blocker), so the primary must run that layer. No code, test or doc result
  is outstanding.

## Findings

| ID | Severity | What changed | Where | Tests |
| --- | --- | --- | --- | --- |
| F1 | High | The wall-clock clamp is gone. `ActiveSession` carries `sinceMidnightMs` (the post-midnight accumulator) plus the local midnight it is measured from, and no longer carries `visibleMs`; `visibleElapsedMs` is deleted as dead code. `visibleAfterMidnight(start, end)` returns `max(0, end - max(start, localMidnight(end)))`; `accrueSinceMidnight` adds one closed stretch's tail, rebasing the accumulator to zero first when the stretch is charged in a later day than the accumulator was opened in; `rebaseMidnight` is also applied by `endPlaySession` so a session that ends while hidden drops the previous day's share. `pausePlaySession` accrues the stretch it closes, `endPlaySession` accrues a still-running one, and the bank is `ceil(sinceMidnightMs / 60_000)` behind the existing `<= 0` guard. | `src/game/playTimeLogic.ts:98-113`, `:203-244`, `:271-276`, `:288-318` | `playTimeLogic.test.ts` → `midnight boundary (per-stretch accrual)`: the corrected paused-across-midnight case (2, not 3), the morning-resume case (5, not 10), the hidden-at-end case (0), the two-midnight stretch (60), plus the three Phase 1 cases unchanged. |
| F2 | Low | `handlePageHide(event)` returns early when `event.persisted === true`, read through a structural cast (`event as { persisted?: boolean }`) so the module still imports nothing but `../types` and stays host-agnostic. A real exit still banks once. | `src/game/playTimeLogic.ts:149-160` | `playTimeLogic.test.ts` → `page exit (pagehide)`: "does not bank a restorable exit into the back/forward cache" (no sink call, `endPlaySession()` still returns the session, a later real exit banks the whole stretch) and "banks a real exit even after a restorable one". |
| F3 | Low | PRD §4.6 now says hiding **only pauses** the clock and names the three banks (Hub return, page close/navigation away via the page-exit event, new game start); the gap is "a process killed without a page-exit event, which banks nothing, even if the page was hidden first". TDD §7.5 replaces the `min(visibleMs, now - localMidnight(now))` sentence with per-stretch accrual (with both worked numbers), updates the session paragraph to the accumulator, adds the `persisted` exception to the accepted-limitation paragraph, and the §7 module table no longer says "midnight clamp". | `docs/PRD.md:391`, `docs/TDD.md:764`, `docs/TDD.md:832-840` | documentation only; `node scripts/validate-docs.js` covers links, anchors and Conductor paths (denied here — see Blocker). |
| F4 | Low | `refreshPlayTimeState()` captures `const wasTimeUp = this.timeUp` before it resets the lock, and passes it to `createPlayTimeIndicator(wasTimeUp)` (default `false` for the initial `create()`). `onLimitReached` still sets `timeUp` and calls `applyTimeUpLock()` unconditionally; only `mascot.wave()` is gated on the lock being newly reached. `restoreTiles()` stays unconditional. | `src/scenes/HubScene.ts:271-311` | `hubPlayTime.test.ts` → "waves the mascot once when the cap is re-read on foreground returns": create at the cap waves once, two `visibilitychange` dispatches add no wave, and the refresh still redraws the moon badge and re-locks the tiles (both proved on the same scene). |

### One shape note for F1

The brief's three-field shape (`profileId`, `runningSince`, `sinceMidnightMs`) cannot
produce its own required numbers. Accruing `visibleAfterMidnight` at pause time adds
the *whole* stretch when it is closed before midnight (5 min for 23:50→23:55, whose
day's midnight is still yesterday's), so 23:50 / pause 23:55 / resume 00:01 / end 00:03
would bank 7 — the number the review rejects. The accumulator therefore also records
the local midnight it is measured from (`accruedMidnight`) and rebases to zero at the
first accrual in a new day. That single field is what makes the corrected cases
(2, 5, 0, 60) fall out; it is recorded under Deviations.

## Red then green (the corrected midnight numbers)

Run against the committed implementation with the **review's** expectations restored
(`3` and `10`), so the failing run is the review's claim and the passing run is the fix:

```
$ pnpm test -- --run src/__tests__/game/playTimeLogic.test.ts -t "midnight boundary"

 ❯ src/__tests__/game/playTimeLogic.test.ts (65 tests | 2 failed | 58 skipped) 34ms
       × charges only the post-midnight stretch of a session paused before midnight
       × drops pre-midnight visible time when the session resumes the next morning

 FAIL … > charges only the post-midnight stretch of a session paused before midnight
 AssertionError: expected 2 to be 3 // Object.is equality
   - Expected: 3
   + Received: 2

 FAIL … > drops pre-midnight visible time when the session resumes the next morning
 AssertionError: expected 5 to be 10 // Object.is equality
   - Expected: 10
   + Received: 5

 Test Files  1 failed (1)
      Tests  2 failed | 5 passed | 58 skipped (65)
Exited with code 1
```

Red: the old expectations (3 minutes for the paused case, 10 for the morning case —
exactly the two overcharges the review documents) do not hold. With the corrected
expectations in place the same block is green, and the whole suite is green:

```
$ pnpm test -- --run src/__tests__/game/playTimeLogic.test.ts src/__tests__/scenes/hubPlayTime.test.ts
 Test Files  2 passed (2)
      Tests  84 passed (84)
```

The numbers the block now pins, each from `playTimeLogic.test.ts`:

| Session | Expected | Why |
| --- | --- | --- |
| 23:58 → 00:02 (continuous) | 2 | post-midnight tail only (AC-3) |
| 23:50 → pause 23:55 → resume 00:01 → end 00:03 | 2 | the 5 pre-midnight minutes belong to the closed day |
| 23:50 → pause 23:55 → resume 08:00 → end 08:05 | 5 | 10 visible minutes, 5 of them yesterday; the span is 8 h, so no clamp would bind |
| 23:50 → pause 23:59 → end 00:05 while still hidden | 0 | hidden minutes are never billed; the accumulator rebases at end |
| 23:00 on the 4th → 01:00 on the 6th (continuous) | 60 | only the last day's portion |
| end exactly at midnight | 0 | boundary is exclusive |
| whole-day session (noon + 45 min) | 45 | unaffected |
| start → end 60 s earlier (backwards clock) | 0 | accrual refuses a negative stretch |

## Commands

The chained gate is denied by the environment's command permissions, so each layer
ran as its own command. All layers ran on the tree committed as `bc2ee99`.

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | Biome across 249 files. Only the two pre-existing findings (the `biome.json` schema-version info, the `musicalMemoryScene.test.ts:294` non-null warning); neither is in a touched file. |
| static | `pnpm typecheck` | 0 | `tsc --noEmit`, no output. |
| unit | `pnpm test -- --run` | 0 | 119 files / 2582 tests passed (Phase 3 baseline 2576 — +6 new tests: +3 midnight cases, +2 page-exit cases, +1 Hub wave case; one pre-existing expectation corrected, listed below). |
| coverage | `pnpm test:coverage` | 0 | 119 files / 2582 tests; 97.94 stmts / 91.82 branch / 96.63 funcs / 98.71 lines, above the 95/88/85/90 gate. `playTimeLogic.ts` 98.9 / 97.67 / 100 / 100; `HubScene.ts` 98.02 / 91.17 / 97.14 / 99.31. |
| build-artifact | `pnpm build` | 0 | 342 modules; shell entry `index-XCX6J19U.js` 138.96 kB; Phaser vendor chunk `phaser-P1E8uaLi.js`; PWA `generateSW` precache 54 entries / 1723.39 KiB. |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present (1342.6 kB); shell entry 135.7 kB ≤ 200 kB gate (Phase 3: 135.5 kB). |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed (precache 42/42 chunks). |
| documents | `node scripts/validate-docs.js` | denied | Rejected by the environment's permission layer (`Permission denied: shell`) before the script produced any output. Not a script failure. The primary must run this layer. |

## Changed pre-existing expectation

One, and it is the finding itself:

- `src/__tests__/game/playTimeLogic.test.ts` — `midnight boundary` →
  "clamps a session paused before midnight and resumed after it" expected **3** and now
  expects **2** (renamed "charges only the post-midnight stretch of a session paused
  before midnight"). 3 is the number the review identifies as wrong: the session was
  visible for 7 minutes, only 2 of them after midnight, and the wall-clock span since
  midnight (3) is neither. Reason recorded here per NFR-1.

No other existing test body, fixture or assertion in the touched files was edited: the
five other midnight cases, the four visibility cases, the page-exit cases and the Hub
cases keep their expectations, and the Hub wave test is new.

## Deviations

- **`ActiveSession.accruedMidnight` (the F1 shape).** The brief specified three fields;
  the fourth is required to reach the brief's own numbers, as explained above. It is a
  private field of a module-local interface, a few lines in `rebaseMidnight`; no
  exported signature changed.
- **`createPlayTimeIndicator(wasTimeUp = false)` is a private `HubScene` method
  parameter, not a change to `src/components/PlayTimeIndicator.ts`.** The component is
  outside `Touches` and its `PlayTimeIndicatorDeps` surface is unchanged; the wave is
  suppressed inside the `onLimitReached` closure the scene already passes, which is the
  behaviour the finding asks for.
- **The Hub wave test counts calls per mascot instance** (`wave.mock.contexts`) rather
  than asserting `toHaveBeenCalledTimes(1)` on the prototype spy. Scenes created by
  earlier cases in the same file are still subscribed to the shared `document`, so a
  bare prototype count also sees *their* refreshes; the test isolates this scene's
  mascot, which is what "waves once" means.

## Blocker

`node scripts/validate-docs.js` — `Permission denied: shell` from the environment's
command permission layer, before the script started. Not retried or rephrased per the
phase brief; the docs edits are prose plus one table cell inside the two files that were
already governed, with no new links, anchors, headings, game rows or Conductor paths.

## Files changed

- `src/game/playTimeLogic.ts` — F1, F2.
- `src/__tests__/game/playTimeLogic.test.ts` — F1 tests (corrected + new), F2 tests.
- `src/scenes/HubScene.ts` — F4.
- `src/__tests__/scenes/hubPlayTime.test.ts` — F4 test.
- `docs/PRD.md` — F3.
- `docs/TDD.md` — F3.
- `conductor/tracks/20261024-playtime-integrity/verification/phase-R1.md` — this file.

## Primary verification

Run by the primary agent after the subagent's report, which was `blocked` only on the
docs layer it cannot execute. The primary ran the whole gate, including that layer.

| Layer | Command | Exit | Summary |
|---|---|---|---|
| working tree | `git status --porcelain` | 0 | clean before verification |
| diff scope | `git diff --name-only ef575fa..HEAD` | 0 | the six Touches files + this evidence; nothing else |
| static | `pnpm check` | 0 | 249 files; the same two pre-existing findings |
| static | `pnpm typecheck` | 0 | clean |
| unit | `pnpm test -- --run` | 0 | 119 files / 2582 tests (+6 vs the reviewed HEAD) |
| coverage | `pnpm test:coverage` | 0 | 97.94 / 91.82 / 96.63 / 98.71 |
| build | `pnpm build` | 0 | built |
| bundle | `node scripts/validate-bundle.js` | 0 | phaser 1342.6 kB; shell `index-XCX6J19U.js` 135.7 kB |
| pwa | `node scripts/validate-pwa.js` | 0 | 16 / 16 |
| docs | `node scripts/validate-docs.js` | **0** | **5 / 5 — the layer the subagent was denied** |

**F1 re-derived by the primary, independently of the report.** The fix is correct, and the
extra `accruedMidnight` field the subagent added is necessary rather than incidental: the
brief's simpler three-field shape charges a stretch that *ends* before midnight to that
day's midnight, so the 23:50-23:55 pause would have contributed 5 minutes and the
paused-across-midnight case would have banked 7. Rebase-on-new-day drops the closed day's
accrual, which is exactly what the record's single-day shape can honour. The primary walked
seven cases by hand against the code — 23:55/00:01/00:03 → 2; 23:55/08:00/08:05 → 5;
23:58→00:02 → 2; end exactly at midnight → 0; a paused-across-midnight end → 0; a same-day
45-minute session → 45; a 26-hour continuous stretch → its last day's 60 — and every one
matches the implemented arithmetic.

The F4 default (`wasTimeUp = false`) is also right: the first `create()` at the cap must
still wave, and only a re-read of an already-locked Hub stays quiet. The two other recorded
deviations are accepted as in-`Touches` and behaviour-preserving.

Cache-busted build fingerprint moved to `index-XCX6J19U.js`, which is expected from the
changed module graph.
