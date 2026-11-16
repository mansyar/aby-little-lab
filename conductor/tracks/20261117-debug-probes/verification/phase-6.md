# Phase 6 — the hold waits for a ticking canvas

## What was wrong

`Browser Journeys` failed on PR #89 in three runs (43901686670, 43901722594, 43932079796), always on
`e2e/journeys/backup.spec.ts:172`, always with the same message:

```
Error: the press at (972, 29) never reached its state in 20000 ms
  at holdCanvasUntil (e2e/fixtures/canvas.ts:115:11)
  at openBackupPage (e2e/journeys/backup.spec.ts:153:3)
```

The point is the parental gate on the Settings gear. A press only becomes a hold when the game's own
loop advances, because the gate counts three seconds of *frames*; a canvas that has stopped rendering
can never open it, however long the pointer is held. The fixture waited on the state with a 20 s clock
and never asked whether the loop was running, so a stalled renderer was reported as a press that was
never recognised.

## The fix

`e2e/fixtures/canvas.ts`:

- `canvasTicks(page, timeoutMs)` resolves with the elapsed time of two consecutive
  `requestAnimationFrame` callbacks, or `null` when they do not arrive inside the window.
- `FRAME_STALL_MS = 2_000` is the in-loop stall window; the pre-press probe allows three of them so a
  scene that is still booting is not mistaken for a dead one.
- `holdCanvasUntil` probes liveness once before it presses and once per pass of its wait loop, and
  fails as `the canvas stopped ticking <where>: 2 animation frames did not arrive within 2000 ms`.
- The state timeout stays at 20 s and no timeout was raised. Waiting for state rather than a duration
  is still the rule; the probe only makes the failure name its cause.

`docs/TDD.md` gains a "Holds wait for a ticking canvas" paragraph beside the retry policy.

## Evidence

- Guard fires at the real failure point: with `FRAME_STALL_MS` forced to `0`, the backup journey fails
  as `the canvas stopped ticking before the press at (971.5, 29.5) was sent: 2 animation frames did
  not arrive within 0 ms`. Threshold restored afterwards (`.conductor/evidence/20261117-debug-probes/phase-6-gate.log`).
- The hold-heavy journeys pass with the guard in place, `--workers=1`: backup 53.4 s + 11.4 s,
  insights 12.1 s, parental gate 14.8 s + 19.1 s — 5 passed (`.conductor/evidence/20261117-debug-probes/e2e-holds.log`).
- Static gate: `pnpm check`, `pnpm typecheck`, `node scripts/validate-docs.js` all pass; `pnpm build` ok.

## Local limitation (reported, not hidden)

On this Windows host under three workers the full suite no longer reproduces the 3.7 min green run it
had in phase 3: two consecutive full runs took 8.9 min and 9.1 min and failed on host-load timeouts in
`boot.spec.ts` (the hub never finished building its grid) and `backup.spec.ts` (120 s test timeout,
`browserContext.close: Test ended`), with **no** `stopped ticking` failure, so the new probe was not
firing spuriously. CI on 4 vCPU remains the authority for the suite as a whole; this phase's local
claim is limited to the hold journeys above and the guard-fires proof.
