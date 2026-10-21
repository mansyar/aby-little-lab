# Pull Request — Session Lifecycle Integrity

- **Track:** 20261022-session-lifecycle
- **Branch:** `fix/20261022-session-lifecycle` → `master`
- **Base:** `master` @ cbf017ecf9eaf65e4fda5a1e8a2efc635193cc5d
- **Type:** bug · **Priority:** high
- **Review:** PASS (round 2) — `conductor/tracks/20261022-session-lifecycle/review.md`

## What this changes

Three defects in the game-session lifecycle, all owned by the shared
`GameSceneBase`, that made the second and every later visit to a game wrong in
small, invisible ways.

**FR-1 — the progress dots never filled after the first visit.**
`createProgressDots` appended to a `protected` array that was never cleared.
Phaser destroys the display-list children on shutdown and reuses the scene
instance on the next visit, so the fill landed on a destroyed `Arc` and the
visible dot stayed empty. The base now owns the lifecycle: `createProgressDots`
replaces the set, the shutdown path releases it, and the four per-scene
workarounds are gone.

**FR-2 — two implementations of the wrong-answer reaction.**
`GameSceneBase.reactWrong` (6 games) and `ChoiceRoundScene.handleIncorrect`
(14 games) did the same four things in two places. The base helper is now the
only implementation; `ChoiceRoundScene` keeps its own choice of wiggle
targets, its overridable `onWrong` hook and its `onWiggleComplete` completion,
and delegates the tone, the wrong-tap count, the mascot's nod and the wiggle
tween. The order the child hears is unchanged: tone → record → nod → the
scene's extras → the wiggle → its completion.

**FR-3 — an abandoned game fed the adaptive window nothing.**
The rolling 10-tap window was only fed on completion, so a game the child
backed out of contributed nothing. The base now flushes an abandoned session's
taps into the window on shutdown and zeroes the session counters, so a reused
scene instance cannot report the same taps twice. The flush writes the window
only: the accuracy and the win count a parent sees still describe completed
sessions, and the play count still counts every game the child starts.

**FR-4 — the shutdown handler accumulated.**
`registerShutdownCleanup` used `events.on`, so the handler list grew by one per
visit. It is now `events.once`.

## Verification

The full configured gate passes on the final state:

| Layer | Result |
| --- | --- |
| `pnpm check` | pass — 247 files; 1 pre-existing warning and 1 pre-existing info, both in files this track does not touch |
| `pnpm typecheck` | pass |
| `pnpm test -- --run --maxWorkers=2` | **118 files / 2488 tests passed, 0 failed** |
| `pnpm test:coverage -- --maxWorkers=2` | pass — Statements 97.92% (gate 90), Branches 91.62% (85), Functions 96.58% (88), Lines 98.69% (95) |
| `pnpm build` | pass |
| `node scripts/validate-bundle.js` | pass — Phaser vendor chunk 1342.6 kB; shell entry 134.6 kB (limit 200 kB) |
| `node scripts/validate-pwa.js` | pass — 16/16 |

The plain `pnpm test -- --run` fails only on wall-clock timeouts in files this
track does not touch; the failing set differs between runs. `--maxWorkers=2` is
the stabilized form on this machine. No test code was changed to work around a
timeout.

Evidence: `conductor/tracks/20261022-session-lifecycle/verification/`
(`phase-1.md`, `phase-2.md`, `phase-3.md`, `phase-R1.md`, `integrated.md`).

## Review

Two rounds. Round 1 returned PASS WITH FINDINGS with five findings — the
consolidation had moved the scene's `onWrong` hook ahead of the shared
feedback, so Feelings Faces re-spoke the scenario before the incorrect tone
instead of after it. All five were fixed in Phase R1, and round 2 confirmed
each one is genuinely resolved. The review found no Critical, High or Medium
finding.

## Notes for the reviewer

- The base helper gained exactly one optional callback (`onPreWiggle`) and the
  wiggle spec (angle 4 / 2 reduced, duration 350 / 200 reduced, yoyo, repeat
  3, ease "Sine.inOut") is byte-identical to before.
- `Number Order` and `Story Order` lock their board in `onWrong` and unlock it
  in `onWiggleComplete`; a missed release would freeze the game for the child.
  The ordering is pinned by a test on both paths.
- The abandoned-session flush is registered per visit and only writes when the
  scene resolved to a game in the registry and the session actually had taps.
- Docs touched: `docs/PRD.md` §4.8 and `docs/TDD.md` §7.3, §4.5.
