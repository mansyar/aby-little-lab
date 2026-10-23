# Review — Play-Time Session Integrity

- **Track:** `20261024-playtime-integrity` (bug, high)
- **Branch:** `fix/20261024-playtime-integrity`
- **Range:** `d14c5e638e3024f46fdc6421e5edfa60c7264263..4a4d123` (`master..HEAD`)
- **Date:** 2026-10-24
- **Round:** 1
- **Verdict:** **BLOCK** — one High finding (F1) remains open.

## Summary

The structure of the track is sound and its seams are in the right places: the
injected sink keeps `playTimeLogic.ts` importing only `../types`, the visibility
and page-exit subscriptions are attach/detach symmetric and capability-guarded,
the page-exit flush cannot double-bank against `HubScene.create()`'s
`endPlaySession()` + `recordPlayTime()` path, and the Hub listener's lifetime
across `shutdown`/re-`create()` is pinned by a mutation-checked test. Eighteen of
nineteen requirements are covered with named tests.

One High correctness defect blocks: the midnight clamp bounds *total visible
time* by *wall-clock since midnight*, so a session that is hidden across the
boundary attributes pre-midnight — and hidden — minutes to the new day. That is
the defect FR-3 was raised to remove, and one Phase 1 test currently asserts the
wrong number for the paused-across-midnight case (3 where the visible
post-midnight time is 2). Three Low findings accompany it: a `pagehide` flush
that ignores bfcache persistence, a PRD sentence that claims hiding banks, and a
mascot wave that repeats on every foreground return at the cap.

## Verification

Run at HEAD `4a4d123` by the primary (the phase subagents were denied the docs
layer; the primary ran it).

| Layer | Command | Result |
| --- | --- | --- |
| static | `pnpm check` | exit 0 — 249 files, only the two pre-existing findings |
| static | `pnpm typecheck` | exit 0 |
| unit | `pnpm test -- --run` | exit 0 — 119 files / 2576 tests |
| coverage | `pnpm test:coverage` | exit 0 — 97.95 / 91.84 / 96.63 / 98.7 |
| build | `pnpm build` | exit 0 |
| bundle | `node scripts/validate-bundle.js` | exit 0 — shell 135.5 kB ≤ 200 kB |
| pwa | `node scripts/validate-pwa.js` | exit 0 — 16 / 16 |
| docs | `node scripts/validate-docs.js` | exit 0 — 5 / 5 |

## Requirements

| ID | Status | Evidence |
| --- | --- | --- |
| FR-1 | covered | `handlePageHide` → `bankSession`; five page-exit tests; storage integration; Hub page-exit-then-return banks once |
| FR-2 | covered | `Math.ceil` behind the `<= 0` guard; 1 ms → 1, 59 s → 1, 45 m 29 s → 46, backwards clock → 0 |
| FR-3 | **partial** | continuous-visibility clamp correct and tested; paused-across-midnight path mis-charges (F1) |
| FR-4 | covered | `bankSession(now)` before the new slot; three start-over tests |
| FR-5 | covered | `visibilitychange` → `refreshPlayTimeState()`, detached on `shutdown`; two new Hub tests |
| NFR-1 | covered | four changed expectations, all listed with reasons in the phase evidence |
| NFR-2 | covered | no dependency, key or schema change; module still imports only `../types` |
| NFR-3 | covered | all eight layers green; checkpoints are ancestors of HEAD |
| NFR-4 | covered | no gameplay scene touched |
| NFR-5 | **partial** | no audio/flow change, but the mascot cue now repeats per foreground return (F4) |
| NFR-6 | covered | fake timers + `setSystemTime`, injected visibility state, no assertion reads the real clock |
| AC-1 | covered | page-exit banking, single bank, storage integration, Hub sequence |
| AC-2 | covered | 45 m 29 s → 46; immediate end → 0 |
| AC-3 | covered | 23:58 → 00:02 → 2 (continuous case only; see F1) |
| AC-4 | covered | start-over banks `{p1,5}` then tracks `p2` |
| AC-5 | covered | moon badge → arc, no scene re-create, tiles re-interactive; no timer added |
| AC-6 | covered | full gate green at HEAD plus the reviewed expectation changes |

## Findings

### F1 — High — the midnight clamp charges hidden and pre-midnight time to the new day

- **File:** `src/game/playTimeLogic.ts:265`
- **What:** `Math.min(visibleMs, Math.max(0, now - localMidnight(now)))` bounds
  total visible time by wall-clock since midnight. The two are comparable only
  when the session was continuously visible across the boundary. With
  `start(23:50) → pause(23:55) → resume(00:01) → end(00:03)`, `visibleMs` is
  7 min and the span is 3 min, so 3 is banked for the 2 minutes actually visible
  after midnight. With `resume(08:00) → end(08:05)` the span is 8 h and the
  clamp never binds, so all 10 visible minutes — 5 of them played yesterday —
  are charged to the new day.
- **Why:** FR-3 requires the new day to be charged only the visible time accrued
  after local midnight. Both shapes overcharge the child in the one number that
  locks their tiles, and the second is the original misattribution surviving on
  the most plausible path (backgrounded before bed, reopened in the morning).
  `verification/integrated.md`'s cross-phase claim that no caller can charge a
  pre-midnight minute is therefore false, and `docs/TDD.md` §7.5 documents the
  wall-clock formula as the rule.
- **Fix:** Accrue the post-midnight portion per stretch rather than clamping the
  total. Add `sinceMidnightMs` to `ActiveSession`; on pause and on end add
  `max(0, stretchEnd - max(stretchStart, localMidnight(stretchEnd)))` for the
  running stretch; bank `ceil(sinceMidnightMs / 60_000)` with the existing `<= 0`
  guard and drop the wall-clock clamp. Correct FR-3 in `spec.md` and the clamp
  sentence in `docs/TDD.md` §7.5.
- **Requirement:** FR-3
- **Test gap:** `playTimeLogic.test.ts:273-281` must expect 2, not 3. Add
  pause 23:55 / resume 00:01 / end 00:03 → 2; pause 23:55 / resume 08:00 /
  end 08:05 → 5; and a hidden-at-end variant proving hidden minutes are never
  billed.

### F2 — Low — a `pagehide` into the back/forward cache stops accrual for good

- **File:** `src/game/playTimeLogic.ts:149`
- **What:** `handlePageHide()` banks unconditionally and takes no event.
  `pagehide` also fires with `persisted: true` when a document merely enters the
  bfcache; nothing re-arms on restore, so the restored page runs on with
  `activeSession === null` and the rest of the stretch banks nothing.
- **Why:** For a restorable exit this converts "banked late" into "not banked at
  all", the class of gap this track exists to close. Narrow in practice (no
  in-app navigation away), hence Low.
- **Fix:** Take the event and return early on `persisted`; the session, its
  listeners and its paused state then survive the restore. Note the case in the
  TDD's accepted-limitation paragraph.
- **Requirement:** FR-1
- **Test gap:** dispatch `pagehide` with `persisted: true` and assert no sink
  call and that `endPlaySession()` still returns the session.

### F3 — Low — the PRD claims hiding banks, and understates the residual gap

- **File:** `docs/PRD.md:391`
- **What:** "banked wherever it ends — on the return to the Hub, when the page is
  hidden or closed, or when a new game starts". Hiding only pauses; the sink is
  reached by `pagehide`, the Hub return and a new start.
- **Why:** This is the parent-facing promise the track exists to make honest; as
  written it over-claims persistence and under-states the kill-after-hide gap.
- **Fix:** Drop "hidden", describe the three real exits, and say hiding pauses
  the clock; restate the gap as "a process killed without a page-exit event
  banks nothing, even if it was hidden first".
- **Requirement:** FR-1
- **Test gap:** documentation only.

### F4 — Low — the mascot waves on every foreground return at the cap

- **File:** `src/scenes/HubScene.ts:90`
- **What:** every `visible` transition re-runs `refreshPlayTimeState()` →
  `createPlayTimeIndicator()` → `onLimitReached()` → `mascot.wave()`, so at the
  cap the wave repeats on each app switch.
- **Why:** the PRD promises the mascot waves **once** at the cap, and NFR-5
  requires the motion rules to hold; the new trigger is the most frequent of the
  refresh paths.
- **Fix:** capture `wasTimeUp` before the refresh resets it and suppress the wave
  when the lock state did not change; keep `applyTimeUpLock()` / `restoreTiles()`
  unconditional so the visuals still converge.
- **Requirement:** NFR-5
- **Test gap:** create at the cap, dispatch two `visibilitychange` events, assert
  one wave while the badge/arc state still matches the stored budget.

## Plan compliance

Compliant. All three phases carry `Result`, `Checkpoint` and `Evidence`; every
`[x]` task is present in the diff; the final diff is exactly the union of the
phases' `Touches` (9 files, no dependency or schema change); the one out-of-phase
file (`hubPlayTime.test.ts` in Phase 1) is reported and acceptable (two start
offsets moved to mid-minute, no expectation value changed); the Phase 3
registration-order adjustment is documented and behaviourally neutral.

## Out of scope

- Periodic persistence for the process-kill gap (would reintroduce the write
  amplification the design avoids).
- Any change to the `PlayTime` record shape or storage schema.
- The two pre-existing repository findings (Biome schema version, one non-null
  assertion in `musicalMemoryScene.test.ts`).

## Debt

None yet — all four findings are assigned to Phase R1.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | BLOCK | 0 | 1 | 0 | 3 | — |

## Doc sync

`pending` — the post-review sync updates this to `updated` or `none`.
