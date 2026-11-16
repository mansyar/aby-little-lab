# Review — 20261117-debug-probes

- Round: 1
- Base / Head: e6315890 / 49bec555
- Reviewed SHA: 49bec555
- Independence: cold-read
- Verdict: PASS

Cold read of the whole diff against `spec.md`, not a re-run of the phases' own
claims. The code commit under review is `49bec555`; the two commits after it are
Conductor state only.

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
| R1-1 | Low | `src/components/settings/ProgressOverlay.ts:258` | `probesText` is a closure rebuilt for every row and defined in the middle of drawing code; a reader has to scroll past it to find the row's shape | hoist it to module scope beside the other row helpers | no | open |
| R1-2 | Low | `conductor/archive/20261116-fix-it-machine/spec.md` FR-10 / D11 | the archived Fix-It spec still states that every tap records one result, which is no longer true | archives are frozen by convention; this track's spec supersedes them, and the TDD paragraph is the live rule | no | open |

## Debt

- R1-1 — recorded, not blocking: the closure is created once per visible row (six
  per page, on a page a parent opens deliberately) and the behaviour is tested.
- R1-2 — accepted: editing an archive would destroy the record of what was
  planned; the supersession is written in `docs/TDD.md` and this track's spec.

## Summary

The defect is closed at the recorder rather than in one scene: a probe is a real
counter that reaches no accuracy figure, no window and no win, and the Fix-It
journey proves the whole path into the saved profile. The two remaining notes are
readability and archive-freshness, neither of which changes behaviour.
