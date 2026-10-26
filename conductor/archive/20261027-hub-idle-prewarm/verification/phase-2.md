# Phase 2 — Hub integration

| Field | Value |
| --- | --- |
| Track | `20261027-hub-idle-prewarm` — Hub Idle Chunk Prewarm |
| Phase | 2 — Hub integration |
| Date | 2026-10-27 |
| Branch | `feat/20261027-hub-idle-prewarm` |
| Base | `bba5f7cf` |
| Head | `728bb3a8` (this evidence file follows in its own commit) |
| Result | **verified** |

## Goal

HubScene starts the prewarm after the entrance settles, gates it on the
play-time lock and tab visibility, yields to a tile tap, and cleans up on
shutdown — with no kid-visible change. Covers FR-1 (tap-wins in situ), FR-2,
FR-5, NFR-1 and AC-3.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Lint + format | `pnpm check` | 0 | 260 files checked; one pre-existing warning (`musicalMemoryScene.test.ts:296` non-null assertion), untouched |
| Types | `pnpm typecheck` | 0 | clean, tests included |
| Unit tests | `pnpm test -- --run` | 0 | 126 files, 2,753 tests passed (15.92 s) |
| Coverage | `pnpm test:coverage` | 0 | statements 97.76 % (5589/5717), branches 91.84 % (1532/1668), functions 96.76 % (1166/1205), lines 98.73 % (5209/5276) — gates 90/85/88/95 held |
| Build | `pnpm build` | 0 | shell `index-DJ5iAYOR.js` = 144.23 kB (34.12 kB gzip), Phaser chunk 1367.08 kB, 42 chunks, PWA precache 54 entries (1722.35 KiB) |
| Bundle budget | `node scripts/validate-bundle.js` | 0 | shell 140.9 kB ≤ 200 kB; Phaser vendor chunk present |
| PWA invariants | `node scripts/validate-pwa.js` | 0 | 16/16 — 42 chunks, 42 precached, no Ligne assets |
| Living docs | `node scripts/validate-docs.js` | 0 | 6/6, including the count-drift guard |

The whole chain was run once, in order, as one command; every layer exited 0.

## What changed

`src/scenes/HubScene.ts`

- **Prewarm lifecycle** (`prewarmEntries`, `canPrewarm`, `syncPrewarm`,
  `startPrewarmPass`, `cancelPrewarm`, `restartPrewarm`). `syncPrewarm()` is the
  single reconciliation point: it arms the `PREWARM_START_DELAY` (1200 ms) timer
  when a pass may run and none is pending, and cancels whatever is pending
  otherwise. The timer is armed alongside `scheduleIdleAttract()` in `create()`
  and never inside `sceneEntrance`, so the entrance fade and zoom keep their
  frames (NFR-2).
- **Ordering (FR-1).** `prewarmEntries()` reads `getProgress()` at each pass
  start — never cached — and orders the game ids through the Phase-1
  `recencyFirstOrder` against the `GAME_TILES` grid order, then maps them onto
  the chunks that actually have a loader in `sceneLoaders`. Returning from a
  game therefore re-derives with that game first, and a profile switch
  re-derives for the new profile.
- **Gates (FR-2).** `canPrewarm()` is `!timeUp && !launching &&
  !isDocumentHidden()`. `syncPrewarm()` is called from `refreshPlayTimeState()`
  (both directions: the lock arriving mid-cycle stops the pass, the lock
  clearing starts a fresh one), from the existing `handleVisibilityChange`
  handler (hidden → stop, visible → the existing refresh path, which re-arms),
  and from `create()`. No second `visibilitychange` listener was added: the
  module-level `isDocumentHidden()` builds on the same `canObserveVisibility()`
  guard the scene already uses, so a host with no visibility surface counts as
  visible.
- **Tap wins (FR-1).** `openGame()` cancels the pass immediately after the
  `launching` guard and before `await loadSceneWithRetry(...)`; `launching`,
  `visitToken` and `timeUp` are untouched. A load that fails now also calls
  `syncPrewarm()` after the retry cue is shown, since no game started.
- **Shutdown (FR-5).** The existing `shutdown` handler cancels the prewarm in
  the same block as the `idleCallTimer` cleanup, and `create()` cancels again
  right after `visitToken += 1` so a visit can never inherit the previous one's
  pass even if the handler did not run (NFR-6). `prewarmImported` is shared
  across passes and visits, so a restart skips what already landed without
  spending an idle slot (FR-3).
- **Idempotency (FR-3).** The engine is untouched: `startPrewarm` is called with
  the scene's `imported` set, one import in flight, rejections swallowed.

`src/__tests__/scenes/hubScene.test.ts` — a `HubScene idle prewarm` block with a
manual idle scheduler injected at the `../../game/hub/prewarm` module boundary
(the real engine runs, only the platform clock is stood in for) and three of the
22 loaders spied. Six cases: no pass while the Hub opens locked and a pass once
the cap is raised; a pass stopped when the lock arrives mid-cycle and a fresh one
when it clears; a pause while the document is hidden and a resume on return;
cancellation ordered before the tap's `loadSceneWithRetry` call
(`invocationCallOrder`); shutdown cancellation plus a re-create that starts a
fresh pass skipping the chunk the previous visit imported; recency-first entry
order for the active profile.

`src/__tests__/scenes/hubPlayTime.test.ts`, `src/__tests__/scenes/navigation.test.ts`
— the scene-registry doubles gain an empty `sceneLoaders` map. They stand in for
a registry with nothing to warm, which is what those cases assert; without it the
Hub's prewarm path threw `No "sceneLoaders" export is defined`.

`README.md`, `docs/TDD.md`, `docs/perf-baseline.md` — living count claims only
(2,747 → 2,753 tests, and the coverage denominators/figures from this run).

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-3 / FR-2 | No imports while the play-time lock is active; resumes when it clears | `hubScene.test.ts` "starts no prewarm while the Hub opens locked, and starts one when the lock clears" (`startPrewarm` not called, `idleScheduler.size() === 0`, then armed after the cap is raised and the Hub re-reads it); `canPrewarm()` reads `this.timeUp`; `syncPrewarm()` at the end of `refreshPlayTimeState()` | pass |
| FR-2 | Lock arriving mid-cycle stops the pass | "stops the pass when the lock arrives mid-cycle and starts a fresh one when it clears" — the first controller's `cancel` called, idle queue empty, second pass started after the clear | pass |
| FR-2 | No work while the document is hidden; resumes on visible | "pauses while the document is hidden and resumes on the way back" — `handleVisibilityChange` routes hidden to `syncPrewarm()`, visible to the existing `refreshPlayTimeState()`; one `visibilitychange` listener only (existing teardown test in `hubPlayTime.test.ts` still green) | pass |
| FR-1 | Tap always wins, and wins *before* the load is awaited | "cancels the pass before the tap's load is awaited" — asserts `controller.cancel`'s `invocationCallOrder` is less than `loadSceneWithRetry`'s, not merely that both ran | pass |
| FR-5 | Shutdown cancels the prewarm; no dangling timers or imports across re-creates | "cancels on shutdown and warms the next visit from where the last one stopped" — shutdown handler calls `cancel`, idle queue drained, re-`create()` starts a different controller, and the already-imported chunk is not requested again | pass |
| FR-1 | Recency-first order for the active profile, re-derived per pass | "orders the pass recency-first for the active profile" — a recorded `pop-freeze` play puts `PopFreeze` first, ahead of the grid-order `ShapeSorter`/`AnimalTrace` | pass |
| FR-3 | Engine contract unchanged; shared imported set across visits | `src/game/hub/prewarm.ts` untouched (`git diff bba5f7cf..HEAD -- src/game/hub/prewarm.ts` empty); Phase-1's 18 cases still green | pass |
| NFR-1 | Zero kid-visible change | No new objects, tweens, audio or UI: the only additions are timers and module imports. Shell entry 144.23 kB (was 139.0 kB in Phase 1) — still ≤ 200 kB; 42 chunks and 42/42 precache unchanged; idle-attract untouched | pass |
| NFR-3 | TSDoc with contract wording, `pnpm check` and `typecheck` clean | Every new member carries TSDoc naming the FR it serves and the gate it honours; both commands exit 0 | pass |
| NFR-4 | No new runtime dependencies | `package.json` untouched | pass |

## Evidence paths

- `src/scenes/HubScene.ts` — the wiring (lines 50-54, 76-80, 128-140, 156, 176,
  202-205, 267, 323-325, 364-391, 478-566).
- `src/__tests__/scenes/hubScene.test.ts` — the `HubScene idle prewarm` block and
  the manual scheduler / loader doubles in `vi.hoisted`.
- `src/__tests__/scenes/hubPlayTime.test.ts`, `src/__tests__/scenes/navigation.test.ts`
  — `sceneLoaders: {}` on the registry doubles.
- `conductor/tracks/20261027-hub-idle-prewarm/verification/phase-1.md` — the
  engine contract this phase consumes without changing.

## Deviations

None outside `Touches`. Two files inside the phase's stated test surface were
edited for a reason worth recording: `hubPlayTime.test.ts` and
`navigation.test.ts` are not named in `Touches`, but their `sceneRegistry` mocks
are what the new import path reads, and a mock without `sceneLoaders` makes the
Hub throw. The change is one property (`sceneLoaders: {}`) plus a comment in each
— the smallest edit that keeps those suites asserting what they were written to
assert.

## Notes

- `prewarmEntries()` filters to the games that have a loader rather than trusting
  the registry to match `sceneLoaders` key-for-key. That keeps a host or test
  double with a partial registry from crashing inside an idle callback, and costs
  nothing on the real registry (all 22 match).
- Coverage moved by 0.01 points between two identical runs of the same tree
  (97.77 → 97.76 statements, 91.9 → 91.84 branches), which is the per-run
  instrumentation variance the TDD already documents; the committed figures are
  the gate run's own.
- `src/game/hub/prewarm.ts` is unchanged in this phase (`git diff --stat
  bba5f7cf..HEAD` lists only the seven files above). Its own coverage
  (94.91 % statements / 87.87 % branches, uncovered 111 and 115) is the defensive
  `!next` guard and the cancelled-after-fire return recorded in Phase 1.
- The shell entry grew from 139.0 kB (Phase 1) to 144.23 kB. That is the Hub's
  prewarm wiring plus the chunk-loader table it now reaches; it stays well inside
  the 200 kB budget, and the chunk count and precache manifest are unchanged.
- The pre-existing `musicalMemoryScene.test.ts:296` lint warning is left alone, as
  in Phase 1.
## Primary verification

- Worktree clean at head `d8a1a2bd`; range `bba5f7cf..HEAD` = 5 commits (`25a5ceb4` wiring, `17c7f856` tests, `e4980d6c` counts, `728bb3a8` coverage restate, `d8a1a2bd` evidence), zero merges.
- Files changed = the four Touches paths (HubScene + hubScene.test.ts + three living docs) plus the two disclosed deviations and the evidence file. `src/game/hub/prewarm.ts` is byte-unchanged — the Phase-1 engine contract was not touched.
- Both deviations audited: each adds exactly one property (`sceneLoaders: {}`) plus a comment to an existing `vi.mock("../../scenes/sceneRegistry")` double — the smallest change that keeps those suites asserting what they were written for, now that the Hub imports `sceneLoaders` from that module.
- Production diff audited line by line: prewarm entries derive from `sceneLoaders` filtered to warmable tiles; `recencyFirstOrder(getProgress(), gridOrder, warmable)` re-reads progress at each pass start; `canPrewarm()` = `!timeUp && !launching && !isDocumentHidden()`; `syncPrewarm()` is the single reconciliation point called from create-post-entrance, visibility change, play-time refresh, profile switch, and the failed-launch branch; `cancelPrewarm()` in `openGame` runs BEFORE the `await loadSceneWithRetry`; shutdown cancels alongside `idleCallTimer`; `create()` cancels so a visit never inherits the previous pass.
- AC-3 evidence: six scene-level cases exist and each drives the real engine through an injected manual scheduler — locked-open/lock-clears `:930`, lock-mid-cycle `:951`, hidden/visible `:975`, tap-cancels-before-await `:994` (asserts invocation order), shutdown + next-visit `:1012`, recency order `:1042`.
- Docs truth: README `:49`, TDD `:1015`/`:1029`/`:1035`, perf-baseline `:411` all state 126 files / 2,753 tests verified 2026-10-27 — matching the primary's own run.
- Primary gate re-run, all exit 0: `pnpm check` (260 files, 1 pre-existing warning), `pnpm typecheck` clean, `pnpm test -- --run` 126 files / 2,753 tests, `pnpm test:coverage` 97.77/91.9/96.76/98.73 (gates held), `pnpm build` precache 54 entries (1,722.35 KiB), `validate-bundle` pass (shell entry still under the 200 kB budget), `validate-pwa` pass (42/42), `validate-docs` pass.
- Primary verdict: **verified**.
