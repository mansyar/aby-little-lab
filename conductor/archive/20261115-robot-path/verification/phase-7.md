# Phase 7 — Review Fixes (R1): verification

**Track:** `20261115-robot-path` · **Branch:** `feat/20261115-robot-path` · **Verification run:** 2026-11-16
**Command:** `pnpm test:e2e && pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
**Log:** `.conductor/evidence/phase-7/gate.log` — **GATE EXIT: 0**

## What this phase closed

| Finding | Severity | What changed | Where |
|---|---|---|---|
| R1-2 | Medium | the stale journey counts were replaced with the numbers measured on this tree — **23 journeys across 18 spec files** (`ls e2e/journeys/*.spec.ts` = 18; the run reports `23 passed`) — in the TDD's browser-layer section and its container note ("the same 23 journeys"), and in the perf baseline's live-figures header and 2026-11-16 table | `docs/TDD.md`, `docs/perf-baseline.md` |
| R1-3 | Medium | FR-10's "at most once per round" is now true in the shipped behaviour: `RobotPathScene` keeps `hintOffered`, reset by `renderRound` and `clearRoundContent`, and pulses the hint only while it is false. A third stopped run in the same round pulses nothing. A new scene test covers stops one, two and three; the existing two-stop assertion is unchanged and still passes | `src/scenes/RobotPathScene.ts`, `src/__tests__/scenes/robotPathScene.test.ts` |
| R1-6 | Low | plan P6.T1 no longer calls Robot Path one of "the fixed seven"; it names it as the one game no adaptive dimension reaches, with the 15 + 7 + 1 = 23 arithmetic and a pointer to review R1-6. Phase 6's status, checkpoint and verification file are untouched | `plan.md` |
| R1-7 | Low | `conductor/tech-stack.md`'s **current-state** bullets now describe this tree: 26 scenes (Boot, Preload, Hub, 23 game scenes) and a 23-journey budget (4.6 min, `launch-all` 2.9 min, measured 2026-11-16). The dated `2026-10-27` design-update notes keep their "22 lazy game-scene JS chunks" wording, because they record what the prewarm engine did when it shipped, not what the tree holds now — the decision is logged in the run's decisions file | `conductor/tech-stack.md` |

Left as recorded debt, deliberately: **R1-1** (the plan's `Touches` lists under-declare invariant-forced files — a state-file pass, not a code change), **R1-4** (FR-7's "turns to face" needs directional art, which is a design decision the spec's D7 did not take), **R1-5** (the `.dev-server.log` removal belongs in `pr.md`, not in code).

## Verification results

| Step | Result |
|---|---|
| `pnpm test:e2e` | **23 passed (4.6m)**, `launch-all` 2.9 min — 18 spec files |
| `pnpm check` | 330 files, 0 errors, 1 pre-existing warning (`RobotPathScene.ts:1 useImportType`) |
| `pnpm typecheck` | clean |
| `pnpm test -- --run` | **150 files / 3255 tests passed** (3,254 before this phase) |
| `pnpm test:coverage` | 97.24 % statements / 91.61 % branches / 96.3 % functions / 98.31 % lines |
| `pnpm build` | entry `index-9iYt2XVh.js` 186.85 kB (47.59 kB gzip), 49 chunks |
| `validate-bundle` | **PASS** — shell entry 182.5 kB ≤ 200 kB |
| `validate-pwa` | all checks pass — 61 precache entries (1794.50 KiB), 49 chunks / 49 precached |
| `validate-docs` | **5 passed, 0 failed** |

## Test integrity

- One unit test **added** (`offers the round's hint once, so a third stopped run pulses nothing`); none removed, skipped, retitled in a weakening direction or deleted, and no threshold or assertion relaxed.
- The new test was proved to fail against the unfixed behaviour: removing the `!this.hintOffered` guard makes it report `expected 2 to be 1` for the third stop, and restoring the guard makes it pass. The existing two-stop test and the journey both still pass.
- The suite went 3,254 → 3,255 tests and 150 files stayed 150; every governed document now states 3,255 (the docs validator refused the tree until it did — that refusal is why the counts were refreshed inside this phase rather than after it).
- The hint assertion identifies a hint pulse by its **palette target**, not by tween shape: the stopped-run wiggle also tweens two objects with `repeat: 2`, so a shape-only check would count the wiggle as a hint.

## Deviations, logged

1. **Two doc figures were refreshed after the gate run**, not during it: the shell entry's hash (`index-Cq96urFU.js` → `index-9iYt2XVh.js`) and the precache size (1794.41 → 1794.50 KiB) are the build's own output names and both moved because the scene changed. `node scripts/validate-docs.js` was re-run on the final text: 5/5. No code changed after the exit-0 run.
2. **The phase also refreshed `README.md`'s suite snapshot** (3,254 → 3,255 tests, stamp 2026-11-16) though it sits outside the plan's `Touches` list: the docs validator treats that sentence as governed truth and the tree cannot be green without it. Recorded rather than hidden.
3. **The tech-stack call (R1-7) went to the current-state bullets only**; see the table above and the decisions log for the reason.
