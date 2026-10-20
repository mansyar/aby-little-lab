# Phase R2 evidence - Re-review Fixes

- Track: `20261020-story-sequencing`
- Branch: `feat/20261020-story-sequencing`
- Phase base: `ca3e71b`
- Date: 2026-10-20
- Findings: F1 (High), F2 (Medium), F3, F4, F5 (Low)

## What changed

| Finding | File(s) | Change |
| --- | --- | --- |
| F1 | `src/__tests__/scenes/storyOrderScene.test.ts` | The new drop-wire block was left unformatted, so `pnpm check` was red at `e83f692` while the evidence claimed it green. Ran `biome format --write`, re-ran the check, and corrected the phase-R1 row. |
| F2 | `src/scenes/StoryOrderScene.ts`, scene suite | `this.input.dragDistanceThreshold = 10` in `create()`. Phaser starts a drag on the first pointermove (threshold 0), so a preschooler's slightly wobbly tap was being turned into a drag and self-dropped onto the panel's own slot, which made tap-to-return flaky on a real finger. With the threshold, under-10 px jitter produces no drag, no drop target and no drop, so the tap still withdraws the panel. Two tests pin it: the threshold value, and the tap tail (no drag move) returning a placed panel. |
| F3 | `spec.md`, scene suite | FR-3 and AC-3 no longer state the old behaviour and then contradict it in an amendment: the sentences now read the shipped behaviour (strip above, tray below; tray panel home, placed panel back to its slot; a <10 px wobble is a tap) with the dated note kept as provenance. New assertion that every slot sits above the tray row. |
| F4 | `conductor/product.md`, `plan.md` | The changelog line now matches AC-3 ("a tray panel dropped outside the slots returns to the tray, a missed drag on a placed panel springs back to its slot so a near miss costs nothing, and tapping a placed panel withdraws it"), so the ticked R1.T3.2 is true. R1.T1.1 now says the flag is cleared on `pointerdown`, which is what shipped. |
| F5 | scene suite | The tap case now fires `dragstart` before `pointerdown` (engine order, matching the sibling case) and says the strip must be incomplete because a completed strip has already resolved - not because a tap resolves it. |

## Commands (at the fix commit)

| Command | Result |
| --- | --- |
| `pnpm check` | exit 0 - 206 files, 1 pre-existing warning, 1 schema info |
| `pnpm typecheck` | exit 0 |
| `pnpm test -- --run` | 103 files / 2,208 tests |
| `pnpm test:coverage` | 98.13 statements / 90.54 branches / 98.14 functions / 98.96 lines |
| `pnpm build` | `StoryOrderScene-CKQk8PA6.js` 33.92 kB; shell `index-CDJCEBU9.js` 200.12 kB raw |
| `node scripts/validate-bundle.js` | PASS - 195.4 kB ≤ 200 kB |
| `node scripts/validate-pwa.js` | 15 passed / 0 failed |
| dist grep | 0 panel keys in the shell |

## Acceptance criteria

| Finding | Status | Evidence |
| --- | --- | --- |
| F1 | Met | check green, phase-R1 row corrected |
| F2 | Met | `dragDistanceThreshold = 10`; threshold test + tap-tail test |
| F3 | Met | rewritten FR-3 / AC-3; orientation assertion |
| F4 | Met | product changelog wording; R1.T1.1 retitled |
| F5 | Met | engine-order tap case with corrected rationale |

## Deviations

None.

## Notes for the primary agent

- Test count 2,206 → 2,208 (threshold + orientation assertions).
- Shell hash changed (`index-CDJCEBU9.js`) but the measured figure is unchanged at
  195.4 kB; panel keys remain absent from the boot shell.
- This phase exists because the round-2 re-review found the round-1 evidence had
  claimed a gate result that the commit did not earn. The rule that follows: run
  every gate after the last edit, not before it.
