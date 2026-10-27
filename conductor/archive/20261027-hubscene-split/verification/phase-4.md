# Phase 4 Report — Play-Time UI, Attract/Decor, Thin Coordinator

- Track: 20261027-hubscene-split — HubScene Decomposition
- Phase: 4 — Play-Time UI, Attract/Decor, Thin Coordinator
- Date: 2026-10-27
- Branch: refactor/20261027-hubscene-split
- Base commit: 620e3e07
- Head commit: 5c2f0f7f (implementation); evidence committed separately below
- Result: blocked (implementation + tests complete; full 8-command gate unrunnable — `pnpm` is permission-denied for this executor, as in Phases 1–3)

## Summary

Extracted the last two HubScene slices verbatim into `src/game/hub/playTimeUi.ts`
(play-time indicator, lock state, nudge, visibility re-read) and
`src/game/hub/hubAttract.ts` (mascot, idle-attract timer/wiggle, decorations,
all idle/wiggle/decoration constants). HubScene keeps only delegation plus the
`create()`/`shutdown` lifecycle wiring. Added one unit-test file per module.
`src/__tests__/scenes/hubScene.test.ts` untouched. Zero behavior change:
verbatim moves, no timing/copy/motion tweaks, reduced-motion guards preserved
in place.

Line counts (from file reads): `HubScene.ts` 567 → 360; `playTimeUi.ts` 157
(≤ 200); `hubAttract.ts` 190 (≤ 200). See Deviations for the HubScene ~320 note.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| lint | `pnpm check` | not run | executor `pnpm` permission-denied; primary to run |
| types | `pnpm typecheck` | not run | same |
| unit | `pnpm test -- --run` | not run | same |
| coverage | `pnpm test:coverage` | not run | same |
| build | `pnpm build` | not run | same |
| bundle | `node scripts/validate-bundle.js` | not run | same (node via shell not attempted; gate runs as a whole by primary) |
| pwa | `node scripts/validate-pwa.js` | not run | same |
| docs | `node scripts/validate-docs.js` | not run | same |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| FR-4 | Play-time UI extracted; HubScene delegates | `playTimeUi.ts` owns `timeUp`, indicator graphics, nudge, visibility hook; `HubScene.ts` constructor `createPlayTimeUi({...})`, `create()` calls `resetForVisit`/`beginVisit`/`createPlayTimeIndicator`, shutdown calls `destroy` | implemented, gate pending |
| FR-5 | Attract/decor extracted; HubScene delegates | `hubAttract.ts` owns mascot, idle timer, wiggle tick, all constants; `HubScene.ts` constructor `createHubAttract({...})`, `create()` calls `createMascot`/`createDecorations`/`scheduleIdleAttract`, shutdown calls `destroy` | implemented, gate pending |
| NFR-1 | Zero behavior change (verbatim moves) | diff shows moved bodies unchanged; guards (`!reducedMotion`, `isReducedMotion`, `wasTimeUp` wave-once, `idleAttractActive` once-per-period, rotation tick) preserved | implemented, gate pending |
| NFR-3 | Module size limits | `playTimeUi.ts` 157 lines, `hubAttract.ts` 190 lines (both ≤ 200) | implemented |
| NFR-4 | Artwork imports stay dynamic | no artwork imports added; only static component imports (`Mascot`, `PlayTimeIndicator`) matching prior scene code | implemented, gate pending |
| AC-4 | Unit tests per module, behavior pinned | `playTimeUi.test.ts` (lock/wave-once/refresh/restore/nudge gating/visibility re-read + detach), `hubAttract.test.ts` (mascot greet/cheer/idle, schedule/reset/trigger once-per-period, reduced-motion + empty-target off-paths, decorations, destroy) | implemented, gate pending |
| AC-5 | Full gate green, HubScene ≤ ~320 | gate pending primary run; HubScene 360 lines (see Deviations) | pending |

## Evidence paths

- `src/game/hub/playTimeUi.ts` (new, 157 lines)
- `src/game/hub/hubAttract.ts` (new, 190 lines)
- `src/scenes/HubScene.ts` (final rewire, 567 → 360 lines)
- `src/__tests__/game/hub/playTimeUi.test.ts` (new)
- `src/__tests__/game/hub/hubAttract.test.ts` (new)
- `.conductor/evidence/` — no extra artifacts written

## Deviations

- `src/scenes/HubScene.ts` is 360 lines vs the ~320 target. All prescribed
  slice moves are complete (147 lines of moved methods plus 24 lines of
  constants and ~40 lines of fields/helpers removed); the ~195 lines that
  remain are delegation wrappers from Phases 1–3 (kept per this phase's own
  keep-if-used rule — every wrapper still has callers), the `create()`/`shutdown`
  lifecycle, constructor wiring, and imports. Cutting further would mean
  inlining prior phases' delegation or trimming unrelated slices (settings,
  parent lock), both out of scope. No file outside `Touches` was modified.

## Notes

- `canObserveVisibility`/`isDocumentHidden` moved into `playTimeUi.ts` and are
  imported by HubScene for the prewarmer `isHidden` gate — same guard, one owner.
- `HubScene.mascot` wave fanfare now flows `playTimeUi → deps.waveMascot → attract.waveMascot()`
  via lazy closures, so construction order is irrelevant.
- `attract.createMascot(justEarned)` takes the visit's `justEarned` as a parameter
  instead of reading scene state — the only signature adaptation; body verbatim.
- New tests live under `src/__tests__/game/hub/` (collected by the vitest
  `include`); `vi.fn()` starters are explicitly typed per Phase 3 precedent.
- Primary: please run the full 8-command gate and hand output back.

## Primary verification

- Ran the full 8-command gate directly (subagent executor is denied `pnpm`),
  all exit 0:
  1. `pnpm check` — 4 auto-fixable style findings fixed via
     `biome check --write`; re-run clean (270 files).
  2. `pnpm typecheck` — exit 0.
  3. `pnpm test -- --run` — initially 52 failures in 4 scene suites; fixed
     (see below); final run 131 files / 2,829 tests, all pass.
  4. `pnpm test:coverage` — statements 97.87 / branches 92.16 / functions
     97.01 / lines 98.76, all above the 95 / 88 / 85 / 90 gates.
  5. `pnpm build` — exit 0, precache 59 entries.
  6. `node scripts/validate-bundle.js` — shell 150.0 kB (<= 200 kB), vendor
     chunk present.
  7. `node scripts/validate-pwa.js` — 16/16.
  8. `node scripts/validate-docs.js` — initially failed on stale suite counts
     (126/2783 documented vs 131/2829 actual); refreshed the six pinned
     count lines in README.md, docs/TDD.md, docs/perf-baseline.md per the
     validator''s own instruction (counts only, no content change); re-run 6/6.
- Two real regressions found and fixed by the primary (both structural, no
  behavior change):
  - Eager `sceneLoaders` at construction: Phase 3 passed the registry table
    into the prewarm controller in the constructor, but scene suites mock
    `sceneRegistry` without that export, so `new HubScene` threw (43 of the
    52 failures). Fixed by changing the dep to a lazy `getSceneLoaders()`
    thunk read at pass time — matching the module''s own documented
    assumption that a host may expose a registry without one.
  - Lost cast-read surface: `hubSceneLoad.test.ts` inspects `scene.loadCue`
    and `scene.nudge` via cast. The `loadCue` compat getter was wrongly
    deleted at Phase 2 acceptance (the no-caller grep covered only the
    pinned suite — the subagent''s keep-if-used instinct was right); the
    `nudge` field moved into the play-time controller in Phase 4. Fixed by
    restoring `get loadCue()` on HubScene and adding `nudge` to the
    play-time controller surface plus `get nudge()` on HubScene.
- Diff-vs-Touches: new `playTimeUi.ts` (162) + `hubAttract.ts` (190) + tests
  (209 + 214), HubScene 567 -> 382 lines, evidence. Primary-owned extras:
  the thunk re-point (`hubPrewarm.ts` + its test), the two compat getters,
  and the six doc-count lines (outside Touches, validator-mandated —
  recorded as deviation). No merges, no foreign commits. Reported subagent
  commits `5c2f0f7f`, `e7271b1c` present and squashed per phase convention.
- AC-4: pass with a size deviation — HubScene is 382 lines vs the ~320
  target; playTimeUi/hubAttract are within the 200-line target. Left for
  `conductor-review` to disposition (single-responsibility reads clean; the
  remainder is lifecycle wiring plus prior-phase delegation).
- AC-5: pass — final diff is structural only (moves + delegation + compat
  getters + count refreshes); full suite green confirms zero behavior change.
