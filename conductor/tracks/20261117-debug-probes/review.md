# Review — 20261117-debug-probes

- Round: 2
- Base / Head: e6315890 / b308ae20
- Reviewed SHA: b308ae20
- Independence: cold-read
- Verdict: PASS

Cold read of the whole diff against `spec.md`, not a re-run of the phases' own
claims. Round 1 reviewed `49bec555` and recorded two Low findings; round 2 reviews
the fix commit `b308ae20` — the two commits after it are Conductor state only.

## Round 2

| Check | Result |
| --- | --- |
| Every R1 finding addressed | R1-1 **fixed** (`probesText` is a module helper at `ProgressOverlay.ts:94`); R1-2 **accepted as debt** (archive frozen by convention) |
| The fix changed no behaviour | pass — the overlay test asserting `3 plays · 67% · 3 looks` is unchanged and green; the built entry is the same 186.7 kB |
| Nothing outside the phase's `Touches` moved | pass — `progressText`'s file only, plus Conductor state |
| Gates | pass — `phase-5-gate.log` exit **0**: 3,322 tests over 153 files, coverage 97.12 / 90.90 / 96.21 / 98.31, entry ≤ 200 kB, PWA 16/16, docs 5/5 |

## Mechanical

| Check | Result |
|---|---|
| Commands on a clean run | pass — `phase-4-gate.log` chain exit **0**: 3,322 unit tests over 153 files, coverage 97.12 / 90.90 / 96.21 / 98.31 against 95 / 88 / 85 / 90, entry 186.7 kB ≤ 200 kB, PWA 16/16, docs 5/5; the browser suite passed 26 cases in 3.7 min in the phase-3 chain |
| Evidence for every verified phase | pass — `verification/phase-1.md` … `phase-4.md`, each with a command table and real exit codes |
| Scope against Touches | pass — `src/types/`, `src/game/progressLogic.ts`, `src/utils/storage.ts`, `src/utils/backupFormat.ts` (disclosed deviation), `src/scenes/GameSceneBase.ts`, `src/scenes/FixItMachineScene.ts`, `src/components/settings/ProgressOverlay.ts`, `src/game/insightsSummary.ts` (test only), `e2e/`, `docs/`, `README.md`, `conductor/product.md`, the track files |
| Tests weakened | pass — no `skip`, `only`, deleted case or loosened matcher. Two Fix-It assertions that encoded the defect were rewritten to assert a probe instead, and a new case pins that a distractor tool is still a wrong answer, so the change could not wash the scoring out. Signature-driven `(gameId, correct, wrong)` → `(…, probes)` updates in two spec files add an argument and keep every existing expectation |
| State honest | pass — plan shows four phases `verified`, `metadata.json` `phases_verified: 4`, `tasks_done: 15`, `phases_total: 4` |
| Base ancestry | pass — `e6315890` is an ancestor of HEAD; no rewrite |

## Coverage

| ID | Implemented | Test | Evidence | Status |
|---|---|---|---|---|
| FR-1 | `src/types/index.ts` (`probes`), `progressLogic.ts:normalizeProgress` | `progressLogic.test.ts` (probes › backfills an old save, normalises bad values) | phase-1.md | pass |
| FR-2 | `progressLogic.ts:recordResult/recordTaps` | `progressLogic.test.ts` (accumulates probes without moving accuracy or the adaptive window) | phase-1.md | pass |
| FR-3 | `progressLogic.ts` result objects take `probes?` | same case, plus "treats an omitted probe count as zero" | phase-1.md | pass |
| FR-4 | `storage.ts:recordGameResult/recordGameTaps(…, probes = 0)` | `storage.test.ts` (stores probes without scoring them; flushes an abandoned session's probes) | phase-1.md | pass |
| FR-5 | `GameSceneBase.sessionProbes`, `recordProbe`, flush on both paths | `gameSceneBase.test.ts` (flushes probes as their own count; abandoned-session probes) | phase-2.md | pass |
| FR-6 | `FixItMachineScene.tapCard` → `reactProbe`; tray unchanged | `fixItMachineScene.test.ts` (records a look, not a miss; still scores a distractor) | phase-2.md | pass |
| FR-7 | `noteMissedTap` feeds `wrongTaps` from every miss | `fixItMachineScene.test.ts` (hints at two, four and six missed taps) | phase-2.md | pass |
| FR-8 | `ProgressOverlay.probesText` | `ProgressOverlay.test.ts` (shows a game's looks beside its accuracy) | phase-3.md | pass |
| FR-9 | `insightsSummary` — no code change needed; ranks on `correct`/`wrong` | `insightsSummary.test.ts` (ranks on answers, so probes never move strongest or hardest) | phase-3.md | pass |
| FR-10 | `e2e/journeys/fix-it-machine.spec.ts` | the journey itself: one probe saved, six misses in the window, counters untouched | phase-3.md | pass |
| AC-1 … AC-7 | as listed in the spec | mapped above | phases 1–4 | pass |
| NFR-1 … NFR-5 | bundle 186.7 kB, one write per session, shared feedback, 26 e2e cases, no network | phase gates | phases 1–4 | pass |

## Findings

| ID | Sev | Where | Impact | Fix | Blocks | Status |
|---|---|---|---|---|---|---|
| R1-1 | Low | `src/components/settings/ProgressOverlay.ts:258` | `probesText` was a closure rebuilt for every row, defined in the middle of drawing code | hoisted to a module helper at `ProgressOverlay.ts:94` in Phase 5 | no | fixed |
| R1-2 | Low | `conductor/archive/20261116-fix-it-machine/spec.md` FR-10 / D11 | the archived Fix-It spec still states that every tap records one result, which is no longer true | archives are frozen by convention; this track's spec supersedes them, and the TDD paragraph is the live rule | no | open |

## Debt

- R1-1 — fixed in Phase 5; recorded here rather than removed, so the round's
  finding history stays readable.
- R1-2 — accepted: editing an archive would destroy the record of what was
  planned; the supersession is written in `docs/TDD.md` and this track's spec.

## Summary

The defect is closed at the recorder rather than in one scene: a probe is a real
counter that reaches no accuracy figure, no window and no win, and the Fix-It
journey proves the whole path into the saved profile. Round 2 closes the one
code finding; the only note left is the frozen archive, which changes nothing at
runtime. Verdict for the track: **PASS**, pinned to `b308ae20`.

## Addendum — a test-only change after the pin

`c20cea29` adds one overlay case (a one-probe game renders `1 look · `, never
`1 looks`) and restates the suite count in three documents. No source file changed
in that commit, and the file that matters was proved by removing the singular
branch: the new case fails against an always-plural label and passes against the
shipped one.

Re-gate: `phase-5-singular-gate.log` — exit **0**, 3,323 tests over 153 files,
coverage 97.12 / 90.94 / 96.21 / 98.31, entry 186.7 kB ≤ 200 kB, PWA 16/16,
documents 5/5. The verdict stays **PASS**; the pin moves to `c20cea29`, and the
reviewed behaviour is byte-identical because no source line moved.

## Addendum — the CI harness, not the product

`fcc60098` changes no product code: `holdCanvasUntil` in `e2e/fixtures/canvas.ts` now
proves the canvas is ticking (two consecutive animation frames, `FRAME_STALL_MS = 2_000`)
before pressing and on every pass of its wait loop, and a stall fails as
`the canvas stopped ticking`. The 20 s state timeout is unchanged. The reproduced
defect was `Browser Journeys` failing on `backup.spec.ts:172` in three runs
(43901686670, 43901722594, 43932079796) with `the press at (972, 29) never reached its
state in 20000 ms`, on a journey whose parental gate counts frames, not seconds.

Proof: with the threshold forced to `0` the journey fails as `the canvas stopped ticking
before the press at (971.5, 29.5) was sent`; restored, the hold journeys pass locally
(backup 53.4 s, parental gate 14.8 s, insights 12.1 s) and CI run 43940819679 is green —
Quality Gates 2m48s, Browser Journeys **26 passed (4.9m)**, first attempt, no retries.

The verdict stays **PASS**; the pin moves to `fcc60098`. Details in
`verification/phase-6.md`.
