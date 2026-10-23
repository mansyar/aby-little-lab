# Integrated Verification — Play-Time Session Integrity

- **Track:** `20261024-playtime-integrity`
- **Branch:** `fix/20261024-playtime-integrity`
- **Base:** `d14c5e638e3024f46fdc6421e5edfa60c7264263` (`master`)
- **Verified at:** `74e7205` (all code landed by `ec55c57`; the three commits
  after it touch Conductor state only)
- **Date:** 2026-10-24
- **Result:** pass — every gate layer exits 0, and the three phases compose
  without a double-bank or a dropped session.

## Gate, run once at the integrated HEAD

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | 249 files; only the two pre-existing findings |
| static | `pnpm typecheck` | 0 | clean |
| unit | `pnpm test -- --run` | 0 | 119 files / 2576 tests |
| coverage | `pnpm test:coverage` | 0 | 97.95 / 91.84 / 96.63 / 98.7 |
| build | `pnpm build` | 0 | built |
| bundle | `node scripts/validate-bundle.js` | 0 | phaser 1342.6 kB; shell 135.5 kB ≤ 200 kB |
| pwa | `node scripts/validate-pwa.js` | 0 | 16 / 16 |
| docs | `node scripts/validate-docs.js` | 0 | 5 / 5 |

Test count across the track: 2556 on `master` → 2576 (+20: 4 minute-conversion,
4 midnight-boundary, 8 session-banking, 2 Hub visibility, plus 2 that were
re-partitioned inside existing suites). Coverage is unchanged to the tenth of a
point, so the new branches are exercised rather than merely executed.

## What the branch changes

| Area | File | Change |
| --- | --- | --- |
| banking | `src/game/playTimeLogic.ts` | ceil, midnight clamp, injectable sink, `pagehide` flush, bank-before-start |
| wiring | `src/utils/storage.ts` | registers `recordPlayTime` as the sink at module scope |
| scene | `src/scenes/HubScene.ts` | `visibilitychange` → `refreshPlayTimeState()`, detached on `shutdown` |
| tests | `playTimeLogic.test.ts`, `storage.test.ts`, `hubPlayTime.test.ts` | the new coverage above |
| documents | `docs/PRD.md`, `docs/TDD.md`, `docs/roadmap.md` | final rules, §7.5 session state machine, retired Known Issue |

No production dependency was added, the logic module still imports only
`../types`, and no storage key, schema version, or persisted shape changed —
`PlayTime` is still `{limitMinutes, usedMinutes, lastUsedDate}`.

## Cross-phase interaction review

The three phases share one module-level session slot, so the interesting risks
are the edges between them:

1. **Page exit, then Hub return.** Phase 2's `pagehide` handler banks and clears
   the slot; Phase 3's Hub still calls `endPlaySession()` + `recordPlayTime()`
   on `create()`, which now yields `null` and writes nothing. Pinned by
   `hubPlayTime.test.ts` "banks one session once across a page exit and the hub
   return" — exactly one sink call.
2. **Hidden, then visible, then hidden again.** `visibilitychange` accrues and
   pauses in the logic module; the Hub's listener only re-reads the budget. It
   never ends or starts a session, so a foreground transition cannot bank twice.
   Pinned by the new Hub test asserting a refresh (not a session end) and by
   Phase 2's "banks only the visible time accrued before the exit".
3. **Start over a running session after a flush.** `startPlaySession()` banks
   first; after a `pagehide` flush the slot is empty, so the bank is a no-op and
   the new session is not double-charged. Pinned by "banks only the first
   session after a page-exit flush".
4. **Midnight inside a banked window.** The clamp runs before the ceil in the
   single `endPlaySession()` path that all three callers share, so no caller can
   charge a closed day or a pre-midnight minute to the new one.
5. **Two Hub instances.** The visibility listener is a stable instance field and
   is removed by the scene's `shutdown` hook, so a shutdown/re-create cycle
   leaves exactly one live handler — pinned, with a mutation check in the phase
   evidence showing the test fails if the detach is removed.

## Documents

`docs/PRD.md` §4.6, `docs/TDD.md` §7.1 / §7.5 and `docs/roadmap.md` were updated
inside Phase 3, so no separate synchronization commit was needed; the roadmap's
"Play time is banked only when the child comes back to the Hub" Known Issue is
retired with this track and nothing else in that file changed. `validate-docs.js`
passes 5/5 at the integrated HEAD.

## Residual risk

Event-driven banking cannot cover a process killed with no `pagehide` and no
visibility change. That is documented as an accepted limitation in both the PRD
and the TDD, and it is out of scope for this track (fixing it needs periodic
persistence, which would reintroduce the write amplification the design avoids).
