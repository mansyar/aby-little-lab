# Phase 2 Evidence — Every exit path banks

- **Track:** `20261024-playtime-integrity` — Play-Time Session Integrity
- **Phase:** 2 — Every exit path banks
- **Date:** 2026-10-24
- **Branch:** `fix/20261024-playtime-integrity`
- **Base commit:** `2c4a8257c2445c8bd879b7682ad78cf029cd9fc9`
- **Head commit:** `6aacb394feb103ad6dadc9a9ab5d62582b49a818`
- **Result:** blocked — every code layer of the gate is green; the `node scripts/validate-docs.js` layer was denied by the environment's command permissions (see Deviations / Blockers) and could not be run.

## Commands

The chained gate command is denied by the environment, so each layer ran as its
own command (the phase brief's gate exception). All were run after the code
commit `6aacb39`.

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | Biome clean across 249 files. One pre-existing warning (`musicalMemoryScene.test.ts:294` non-null assertion) and the pre-existing `biome.json` schema-version info remain unchanged by this phase. |
| static | `pnpm typecheck` | 0 | `tsc --noEmit`, no output. |
| unit | `pnpm test -- --run` | 0 | 119 files / 2574 tests passed (Phase 1 baseline: 119 files / 2564 tests — +10 tests, all new; no new suite file). |
| coverage | `pnpm test:coverage` | 0 | 119 files / 2574 tests passed; 97.96 stmts / 91.95 branch / 96.62 funcs / 98.70 lines, above the 90/85/88/95 gate. `playTimeLogic.ts` 98.75 stmts / 97.5 branch / 100 funcs / 100 lines; `storage.ts` 100 stmts / 85.41 branch / 100 funcs / 100 lines. |
| build-artifact | `pnpm build` | 0 | 342 modules; shell entry `index-WAs2VuUj.js` 138.32 kB; Phaser vendor chunk `phaser-P1E8uaLi.js`; PWA `generateSW` precache 54 entries / 1722.77 KiB. |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present (1342.6 kB); shell entry 135.1 kB ≤ 200 kB gate. |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed (manifest, service worker, workbox, icons, BGM, precache 42/42 chunks, navigation route). |
| documents | `node scripts/validate-docs.js` | denied | The command was rejected by the environment's permission layer (`Permission denied: shell`) twice, before any script output. Not a script failure — the script never started. The primary must run this layer. |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | A fake `pagehide` mid-session banks the visible minutes, for the session's profile, through the same path the Hub uses | `src/__tests__/game/playTimeLogic.test.ts` → `session banking (injected sink) > page exit (pagehide)`: "banks the visible minutes when the page is exited" (2.5 min → 3 ceiled, the sink receives `{p1, 3}`), "clears the session so a later end banks nothing", "banks once even when the page-exit event repeats", "banks only the visible time accrued before the exit" (hidden stretch excluded), "stays inert where the document has no visibilityState". Integration: `src/__tests__/utils/storage.test.ts` → "banks a page-exit flush through `recordPlayTime`" writes `usedMinutes` 3 into the real facade and leaves no session; `src/__tests__/scenes/hubPlayTime.test.ts` → "banks one session once across a page exit and the hub return". | pass |
| AC-4 | `startPlaySession` while a session runs banks the running session first, then starts the new one | `src/__tests__/game/playTimeLogic.test.ts` → `session banking (injected sink) > starting over a running session`: "banks the running session, then tracks the new profile" (one sink call `{p1, 5}`, then the new session ends as `{p2, 3}`), "banks nothing when no session is running", "banks only the first session after a page-exit flush". | pass |
| FR-1 | `pagehide` flushes and banks; the pause/resume watcher keeps running for short app switches | `src/game/playTimeLogic.ts`: `handlePageHide` → `bankSession(Date.now())`; the `visibilitychange` watcher is untouched and still attached in `watchVisibility()`; the "banks only the visible time accrued before the exit" test proves a hidden stretch is still not charged while a page exit banks the visible total. | pass |
| FR-4 | No silent discard of a running session | `startPlaySession` calls `bankSession(now)` before assigning the new slot; its doc comment and inline comment were rewritten from "discards" to "ended and banked". | pass |
| NFR-6 | Every new rule is unit-testable with an injected clock | The page-exit tests drive `window.dispatchEvent(new Event("pagehide"))` with `vi.useFakeTimers()` + `vi.setSystemTime`; no real clock is read by an assertion. | pass |
| NFR-1 | No existing test outcome changed | All 2574 tests pass; the three pre-existing suites in `Touches` gain tests only — no existing expectation was edited. `hubPlayTime.test.ts`'s Phase-1 mid-minute fixtures are untouched. | pass |

## Task notes

- **P2.T1 — injectable sink.** `src/game/playTimeLogic.ts` gains `PlaySessionSink` +
  `sessionSink` + `export function setPlaySessionSink(sink | null)` and the
  internal `bankSession(now)` (ends the session, calls the sink when a session
  existed and a sink is set, returns `{profileId, minutes} | null`). The module
  still imports only `../types`. `src/utils/storage.ts` registers it once at
  module scope (`setPlaySessionSink(recordPlayTime)`) after the declaration;
  `recordPlayTime`'s signature is unchanged.
- **P2.T2 — page-exit flush.** `handlePageHide()` banks and clears the slot.
  `watchVisibility()` attaches `pagehide` on `window`; `unwatchVisibility()`
  removes it. Both the attach and the detach are capability-guarded
  (`canObserveVisibility()` gates the watcher pair; `canObservePageExit()` gates
  the window listener surface) so a non-DOM host — and the repo's many partial
  `window` test doubles — stay inert instead of throwing on the exit path.
  `HubScene.create()`'s `endPlaySession()` + `recordPlayTime()` path is
  untouched and now yields `null` after a flush, so the session cannot bank
  twice.
- **P2.T3 — no discard.** `startPlaySession()` banks before assigning. The
  "new session over a running one" and "page-exit flush then new session" tests
  each assert a single sink call.
- **P2.T3.3 — no rounding.** `Math.round` does not appear anywhere in
  `src/game/playTimeLogic.ts`.

## Evidence paths

- `src/game/playTimeLogic.ts`
- `src/utils/storage.ts`
- `src/__tests__/game/playTimeLogic.test.ts`
- `src/__tests__/utils/storage.test.ts`
- `src/__tests__/scenes/hubPlayTime.test.ts`
- Commit `6aacb39` on `fix/20261024-playtime-integrity`

## Deviations

| File | Reason |
| --- | --- |
| — | No file outside `Touches` was changed. |

Two implementation choices worth recording, both inside `Touches`:

1. **A second capability guard (`canObservePageExit()`).** Guarding the window
   listener on `canObserveVisibility()` alone is not enough: the repo's scene
   suites stub a partial `window` (`{ matchMedia }`) while a real `document`
   still reports a `visibilityState`, so `endPlaySession()` would throw on
   `window.removeEventListener`. `watchVisibility()` therefore keeps the
   `canObserveVisibility()` gate (a host with no visibility API attaches
   nothing) and additionally requires a listener surface on `window`.
   `unwatchVisibility()` uses the same guard, so detaching is only attempted
   where the surface exists — removing an absent listener would be a no-op
   anyway.
2. **The guard is a capability check, not a `try/catch`.** The partial `window`
   is a test double rather than a production host, so wrapping the exit path in
   error handling would hide real failures; the guard names the capability
   instead.

## Notes

- The brief's final check, `Select-String -Path src/game/playTimeLogic.ts
  -Pattern "Math.round"`, was itself denied by the environment. The same
  file/pattern check was run with the native search tool instead and returned no
  matches.
- `node scripts/validate-docs.js` is the only unrun gate layer. It is read-only
  (`scripts/validate-docs.js` reads `docs/` + `conductor/` and asserts link /
  anchor / game-list invariants) and this phase changes no document, but it is a
  required layer and was not executed, so the phase is reported `blocked` rather
  than `verified`.
- New tests: +10 (playTimeLogic 8 — five page-exit, three start-over; storage 1;
  hubPlayTime 1). No existing expectation was edited.

## Primary verification

Run by the primary agent after the subagent's report, which was blocked only on
`node scripts/validate-docs.js`. Each layer was run separately; none was chained.

| Layer | Command | Exit | Summary |
|---|---|---|---|
| working tree | `git status --porcelain` | 0 | clean |
| diff scope | `git diff --name-only 2c4a825..HEAD` | 0 | exactly the five files in `Touches` + this evidence file; no unreported file |
| static | `pnpm check` | 0 | 249 files; 1 warning + 1 info, both pre-existing |
| static | `pnpm typecheck` | 0 | clean |
| unit | `pnpm test -- --run` | 0 | 119 files / 2574 tests passed |
| coverage | `pnpm test:coverage` | 0 | 97.96 / 91.95 / 96.62 / 98.7 |
| build | `pnpm build` | 0 | built |
| bundle | `node scripts/validate-bundle.js` | 0 | shell entry `index-WAs2VuUj.js` = 135.1 kB (≤ 200 kB) |
| pwa | `node scripts/validate-pwa.js` | 0 | 16 passed / 0 failed |
| docs | `node scripts/validate-docs.js` | 0 | 5 passed / 0 failed — the layer the subagent could not run |

**Result:** gate green end to end, including the previously unrun docs layer. The
two in-`Touches` design notes above are accepted: the extra
`canObservePageExit()` capability guard is what keeps the repo's partial-`window`
test doubles from throwing on the exit path, and a guard is preferable to a
`try/catch` that would hide real failures. `Math.round` confirmed absent from
`src/game/playTimeLogic.ts` by the primary as well.
