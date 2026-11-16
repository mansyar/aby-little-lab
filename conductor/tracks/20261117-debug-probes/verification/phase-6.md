# Phase 6 — a hold is counted in frames, not seconds

## What was wrong

`Browser Journeys` failed on PR #89 in four runs (43901686670, 43901722594, 43932079796,
43943297292), always on `e2e/journeys/backup.spec.ts:172`, always with the same message:

```
Error: the press at (972, 29) never reached its state in 20000 ms
  at holdCanvasUntil (e2e/fixtures/canvas.ts:193:11)
  at openBackupPage (e2e/journeys/backup.spec.ts:153:3)
```

The point is the parental gate on the Settings gear. A press only becomes a hold when the
game's own loop advances, because the gate's three seconds are Phaser timer milliseconds
accumulated from a smoothed per-frame delta. The fixture held for a wall-clock budget, which
is a different clock from the one the gate counts, and shrank exactly when the runner got
busy.

## The measurements that decided the fix

The first attempt (a tick probe plus the same 20 s budget) shipped in `fcc60098` and CI run
43940819679 went green — then run 43943297292 failed again with **no** `stopped ticking`
line, which is what ruled the stall theory out: the canvas was rendering for the whole 20 s
and the gate still never opened.

Measured on the built artifact with the CPU throttled through CDP
(`.conductor/tmp/hold-probe.mjs`, scratch, not committed):

| throttle | fps | time to open | frames |
| -------- | --- | ------------ | ------ |
| 1x       | 73.5 | 3.2 s       | ~230   |
| 6x       | 17.5 | 8.2 s       | ~200   |
| 20x      | 18.6 | 10.9 s      | ~200   |

The gate opened every time, and always after roughly the same number of frames. The hold is
frame-driven; 20 s of wall clock is ~2x what a merely busy runner needs and less than a
three-worker 4-vCPU runner can want.

## The fix

`e2e/fixtures/canvas.ts`:

- `HOLD_FRAME_BUDGET = 300` replaces the 20 s deadline: the wait ends when the state arrives
  or when the press has had every frame a hold can need. A hold that is still being counted
  lands in ~230 frames at any speed, so 300 is a bound with headroom, not a longer wait.
- `canvasTicks(page, timeoutMs)` resolves with the time two consecutive `requestAnimationFrame`
  callbacks took, or `null`: `FRAME_STALL_MS = 2_000` is the stall window, probed once before
  the press and on every pass of the wait.
- Three failure messages, each naming a different cause: `the canvas stopped ticking …`;
  `<press> did not reach its state after N frames in X ms (Y fps)`, which is a lost press or a
  state bug rather than a slow runner; and a `HOLD_CEILING_MS = 90_000` backstop so a
  pathological runner fails in frames instead of timing the journey out underneath.

`docs/TDD.md`: the browser-layer paragraph now describes the frame budget and the three
failure modes, with the throttle measurements.

## Evidence

- Frame budget proven to fail honestly: with `HOLD_FRAME_BUDGET` forced to `4`, the parental
  gate fails as `the press at (971.5, 29.5) did not reach its state after 4 frames in 162 ms
  (25 fps)`. Budget restored afterwards.
- Stall branch proven earlier in this phase: with `FRAME_STALL_MS` forced to `0`, the backup
  journey fails as `the canvas stopped ticking before the press at (971.5, 29.5) was sent`.
- Hold journeys green at three workers locally:
  `.conductor/evidence/20261117-debug-probes/e2e-frame-budget.log` — backup 45.3 s + 9.6 s,
  parental gate 15.5 s + 21.2 s, insights 13.9 s; 5 passed (56.5 s), exit 0.
- Static gate: `pnpm check`, `pnpm typecheck`, `node scripts/validate-docs.js` pass.

## Local limitation (reported, not hidden)

This Windows host has been far slower than usual during this work: two full-suite runs took
8.9 and 9.1 minutes against a 3.7-minute baseline and failed on host-load timeouts in
`boot.spec.ts` (the hub never finished building its grid) and `backup.spec.ts`, none of them
a hold. CI on 4 vCPU is the authority for the suite as a whole; this phase's local claim is
limited to the hold journeys and the two mutation proofs above.
