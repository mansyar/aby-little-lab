# Phase 3 Evidence — The Hub tells the truth, and the record says so

- **Track:** `20261024-playtime-integrity` — Play-Time Session Integrity
- **Phase:** 3 — The Hub tells the truth, and the record says so
- **Date:** 2026-10-24
- **Branch:** `fix/20261024-playtime-integrity`
- **Base commit:** `d91bc8723997a5efe49fa2c7b306013f01aae6df`
- **Head commit:** `05a0ddf` (code `a79a6f5`, docs `05a0ddf`; evidence follows in its own commit)
- **Result:** blocked — every layer of the gate is green except
  `node scripts/validate-docs.js`, which the environment's command permissions
  denied before the script started (see Blocker). The primary must run that
  layer.

## Commands

The chained gate is denied by the environment's command permissions, so each
layer ran as its own command (the phase brief's gate exception). All layers ran
on the exact tree now committed as `05a0ddf`.

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | Biome clean across 249 files. The one pre-existing warning (`musicalMemoryScene.test.ts:294` non-null assertion) and the pre-existing `biome.json` schema-version info are unchanged by this phase; neither is in a touched file. |
| static | `pnpm typecheck` | 0 | `tsc --noEmit`, no output. |
| unit | `pnpm test -- --run` | 0 | 119 files / 2576 tests passed (Phase 2 baseline: 119 files / 2574 tests — +2 new tests; no existing expectation edited). |
| coverage | `pnpm test:coverage` | 0 | 119 files / 2576 tests passed; 97.95 stmts / 91.84 branch / 96.63 funcs / 98.70 lines, above the 90/85/88/95 gate. `HubScene.ts` 98 stmts / 90.32 branch / 97.14 funcs / 99.31 lines; `playTimeLogic.ts` unchanged at 98.75 / 97.5 / 100 / 100. |
| build-artifact | `pnpm build` | 0 | 342 modules; shell entry `index-DHsWIBg8.js` 138.76 kB (+0.44 kB vs Phase 2, the new listener); Phaser vendor chunk `phaser-P1E8uaLi.js`; PWA `generateSW` precache 54 entries / 1723.20 KiB. |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present (1342.6 kB); shell entry 135.5 kB ≤ 200 kB gate. |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed (manifest, service worker, workbox, icons, BGM, precache 42/42 chunks, navigation route). |
| documents | `node scripts/validate-docs.js` | denied | Rejected by the environment's permission layer (`Permission denied: shell`) before any script output, on both attempts. Not a script failure — nothing started. |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | A fake `pagehide` mid-session banks the visible minutes, for the session's profile, through the same path the Hub uses | `src/__tests__/game/playTimeLogic.test.ts` → `session banking (injected sink) > page exit (pagehide)`: "banks the visible minutes when the page is exited", "clears the session so a later end banks nothing", "banks once even when the page-exit event repeats", "banks only the visible time accrued before the exit", "stays inert where the document has no visibilityState". Integration: `src/__tests__/utils/storage.test.ts:780` "banks a page-exit flush through recordPlayTime" (real facade, `usedMinutes` 3, no session left). Hub sequence: `src/__tests__/scenes/hubPlayTime.test.ts` "banks one session once across a page exit and the hub return". | pass (unchanged by this phase) |
| AC-2 | 45 min 29 s banks 46; zero visible time banks 0 | `src/__tests__/game/playTimeLogic.test.ts` → `minute conversion (ceil)`: "banks 46 minutes for 45 minutes 29 seconds of visible time", "banks zero for a session ended the moment it starts", "banks zero when the clock went backwards", "banks exactly one minute for any visible time under a minute". | pass (unchanged by this phase) |
| AC-3 | A 23:58–00:02 session charges the new day 2 minutes and does not write the old day | `src/__tests__/game/playTimeLogic.test.ts` → `midnight boundary (clamp)`: "charges the new day only for post-midnight time", "banks zero for the new day when the session ends exactly at midnight", "clamps a session paused before midnight and resumed after it", "leaves a session wholly inside one day unaffected". | pass (unchanged by this phase) |
| AC-4 | `startPlaySession` over a running session banks it first, then starts | `src/__tests__/game/playTimeLogic.test.ts` → `session banking (injected sink) > starting over a running session`: "banks the running session, then tracks the new profile", "banks nothing when no session is running", "banks only the first session after a page-exit flush". | pass (unchanged by this phase) |
| AC-5 | A `visibilitychange` to visible re-evaluates the limit visuals, with no per-minute tick | `src/__tests__/scenes/hubPlayTime.test.ts` (new) "re-evaluates the limit visuals when the document becomes visible again": limit 15 with 15 used draws the moon badge (no `slice`); the stored limit is raised to 60, one `visibilitychange` is dispatched, and the badge is destroyed and replaced by a hint arc (`slice` + `fillPath`) with the tile-rectangle count unchanged (no scene re-create) and every game tile restored to alpha 1 and interactive. No timer exists: `grep` for `setInterval`/`time.addEvent` in `HubScene.ts` shows only the pre-existing idle-attract `delayedCall`. | pass (this phase) |
| AC-6 | The full gate passes, and no existing test outcome changes except reviewed re-partitions | Every runnable layer exits 0 (table above); `pnpm test -- --run` reports 119 files / 2576 tests, i.e. the Phase 2 total plus exactly the two new tests. `node scripts/validate-docs.js` could not run (Blocker). | partial — blocked on the denied docs layer |
| FR-5 | Visibility restore re-runs `refreshPlayTimeState`, no timer | `src/scenes/HubScene.ts`: `handleVisibilityChange` field (guards on `visibilityState === "visible"`), `watchPlayTimeVisibility()` (capability guard + `addEventListener` + `events.once("shutdown", …)` detach), called last in `create()`. Second new test: "detaches the visibility listener on shutdown so a re-create leaves exactly one" — after `first.events.emit("shutdown")` and a second `create()`, one dispatch refreshes the live scene once and draws nothing on the dead one. | pass (this phase) |

## Changed pre-existing expectations

None. No pre-existing test body, fixture or assertion was edited. One
pre-existing test did fail on the first implementation attempt and the
*implementation* was changed instead of the test:

- `src/__tests__/scenes/hubScene.test.ts` → "unregisters the resize listener on
  shutdown" reads `eventsHandlers.shutdown?.[0]` — the **first** registered
  `shutdown` handler — and calls it directly. Registering the visibility hook
  next to `createPlayTimeIndicator()` (before the scene's teardown handler) made
  the hook that first handler, so the test called the wrong function and saw no
  `scale.off`. Fix, inside `Touches`: `watchPlayTimeVisibility()` is called at
  the **end** of `create()`, after the teardown `events.on("shutdown", …)`
  block, with a comment saying why. The test is untouched and passes.

`hubPlayTime.test.ts`'s Phase-1 mid-minute fixtures (`2.5` / `1.5` minutes) were
not touched.

## Task notes

- **P3.T1 — visibility hook.** `src/scenes/HubScene.ts` gains a module-level
  `canObserveVisibility()` (the same `typeof document !== "undefined" &&
  typeof document.visibilityState === "string"` guard the play-time module
  uses), an arrow-function class field `handleVisibilityChange` (a stable
  reference so `removeEventListener` receives the function that was added), and
  `watchPlayTimeVisibility()`, which attaches the document listener and
  registers a `once("shutdown")` detach. The handler calls the existing private
  `refreshPlayTimeState()` — no new render path, no timer, no polling.
- **P3.T1.2 — tests.** Two tests appended to `hubPlayTime.test.ts`; no new suite
  file, no new helper.
- **P3.T2 — documents.** PRD §4.6 now states only-visible-time, banking wherever
  a session ends (Hub return, page hide/close, new game start), the ceil, the
  midnight clamp, the process-kill gap, and that the Hub re-reads the budget on
  visibility. TDD gains §7.5 "Play-time sessions" (state machine, the three
  callers of `endPlaySession`, the injected sink, the ceil, the clamp, the
  snapshot-not-delta write, the accepted event-driven limitation, and the scene
  hook), updates the §7.1 parenthetical and the `playTimeLogic.ts` module-table
  row, and adds the §7.5 contents entry. Roadmap drops the "Play time is banked
  only when the child comes back to the Hub" Known Issue and nothing else.
- **P3.T2.4 — docs check.** `node scripts/validate-docs.js` was denied twice by
  the environment (Blocker). The five invariants it asserts were checked by
  hand against this phase's edits; see "Docs invariants" below.
- **P3.T3.1 — AC walk.** The table above; AC-1..AC-4 map to Phase 1/2 tests that
  this phase does not touch, AC-5 to the two new tests, AC-6 to the gate table.
- **P3.T3.2 — gate.** Run layer by layer, results above.

## Docs invariants (manual substitute for the denied layer)

`scripts/validate-docs.js` asserts five things. Checked against this phase's
edits:

1. Release-note index completeness — no release note added or removed.
2. Relative links and anchors — this phase adds one anchor target and two links
   to it: `### 7.5 Play-time sessions` (TDD:832) with slug
   `75-play-time-sessions`, referenced from the contents entry (TDD:52) and the
   module-table row (TDD:764); both occurrences confirmed by search. PRD and
   roadmap edits add no links and no anchors.
3. README / PRD `### 3.N` / TDD §4.5 vs `GAME_REGISTRY` — no game added or
   renamed.
4. Roadmap headings exactly `Known Issues` and `Future Work / Roadmap` — a `###`
   Known-Issue subsection was deleted; both `##` headings are intact.
5. No document points at a nonexistent `conductor/tracks` or `conductor/archive`
   path — no path was added or removed.

## Deviations

| File | Reason |
| --- | --- |
| — | No file outside `Touches` was changed. `git diff --name-only d91bc87` lists exactly `docs/PRD.md`, `docs/TDD.md`, `docs/roadmap.md`, `src/__tests__/scenes/hubPlayTime.test.ts`, `src/scenes/HubScene.ts`. |

Two in-`Touches` decisions worth recording:

1. **The shutdown hook is registered last in `create()`,** not next to
   `createPlayTimeIndicator()`, so the scene's teardown handler stays
   `shutdown[0]` for the pre-existing `hubScene.test.ts` assertion (see above).
   Behaviour is identical; only registration order differs.
2. **The listener test asserts behaviour, not `addEventListener` /
   `removeEventListener` counts.** The brief allowed either. A count over spies
   on `document` was tried first and was unreliable in happy-dom: instrumenting
   `document.removeEventListener` re-entered the spy (`RangeError: Maximum call
   stack size exceeded`), and the raw counts read 0 adds / 2 removes for one
   listener. The final test therefore proves the property directly — after a
   shutdown and a re-create, one dispatch refreshes the live scene exactly once
   and the dead scene draws nothing. A mutation check confirmed it bites:
   deleting the `removeEventListener` call from the shutdown hook makes the test
   fail (`expected 24 to be 23` — the leaked listener refreshed the dead scene).

## Blocker

`node scripts/validate-docs.js` — `Permission denied: shell` on both attempts,
before the script produced any output. `node scripts/validate-bundle.js` and
`node scripts/validate-pwa.js` were allowed and passed, so the denial is
specific to this command rather than to `node` or to the network. Per the phase
brief's permission rule it was not retried, rephrased or routed around; the
primary must run it. The manual invariant check above is a review aid, not a
substitute for the layer.

## Evidence paths

- `src/scenes/HubScene.ts`
- `src/__tests__/scenes/hubPlayTime.test.ts`
- `docs/PRD.md`
- `docs/TDD.md`
- `docs/roadmap.md`
- Commits `a79a6f5` (code + tests) and `05a0ddf` (documents) on
  `fix/20261024-playtime-integrity`

## Primary verification

Run by the primary agent after the subagent's report, which was `blocked` only on
`node scripts/validate-docs.js`. The primary ran the whole gate, including the
layer the phase subagent cannot execute.

| Layer | Command | Exit | Summary |
|---|---|---|---|
| working tree | `git status --porcelain` | 0 | clean before verification |
| diff scope | `git diff --name-only d91bc87..HEAD` | 0 | exactly the five files in `Touches` + this evidence file; no unreported file, no merge commit |
| static | `pnpm check` | 0 | 249 files; the same pre-existing warning + info |
| static | `pnpm typecheck` | 0 | clean |
| unit | `pnpm test -- --run` | 0 | 119 files / 2576 tests passed (+2 vs Phase 2, both new; no pre-existing expectation edited) |
| coverage | `pnpm test:coverage` | 0 | 97.93 / 91.77 / 96.63 / 98.7 — the subagent read 97.95 / 91.84 on the same commit, a known run-to-run variance in instrumented timing paths, well above the 90/85/88/95 gate |
| build | `pnpm build` | 0 | 342 modules; precache 54 entries / 1723.20 KiB |
| bundle | `node scripts/validate-bundle.js` | 0 | phaser 1342.6 kB; shell entry `index-DHsWIBg8.js` 135.5 kB ≤ 200 kB (Vite's own report prints the unminified 138.76 kB for the same file — different measurement, both under the gate) |
| pwa | `node scripts/validate-pwa.js` | 0 | 16 passed / 0 failed |
| docs | `node scripts/validate-docs.js` | **0** | **5 passed / 0 failed — the blocked layer, green under the primary** |

**Result:** gate green end to end, AC-5 and AC-6 now fully demonstrated (AC-6's
docs layer included). Both recorded in-`Touches` decisions are accepted: calling
`watchPlayTimeVisibility()` last in `create()` keeps the pre-existing
`hubScene.test.ts` shutdown-handler assertion valid without editing that test, and
the detach test is stronger for asserting the observable property (one dispatch
refreshes only the live scene) with a mutation check proving it bites. Byte
identity of `docs/roadmap.md`'s remaining entries and the PRD's single-paragraph
rewrite were reviewed line by line; no unrelated documentation changed.
