# Phase R1 evidence - Review Fixes

- Track: `20261020-story-sequencing`
- Branch: `feat/20261020-story-sequencing`
- Phase base: `7b03dc6`
- Date: 2026-10-20
- Findings: M1, M2, M3, L1, L2, L3, L4

## What changed

| Finding | File(s) | Change |
| --- | --- | --- |
| M1 | `src/scenes/StoryOrderScene.ts`, `src/__tests__/scenes/storyOrderScene.test.ts` | `justDropped` is now set by real movement (`drag`) and by `handleDrop`, and cleared on `pointerdown`; `dragend` no longer marks every gesture as a drag, because Phaser fires `dragstart`/`dragend` for a tap too. Tap-to-return is therefore reachable, and two tests drive the container's real `drag`/`drop` wires plus the full tap sequence. |
| M2 | `conductor/tracks/20261020-story-sequencing/spec.md` | FR-3 amended with a dated note: slots above, shuffled tray below (thumb-side), pips-only ordering unchanged. |
| M3 | `spec.md`, `conductor/product.md` | AC-3 amended to separate the two miss cases (tray panel returns home; placed panel springs back to its slot), and the changelog wording updated to match. |
| L1 | `README.md` | Shell figure corrected to 195.4 kB against the 200 kB gate. |
| L2 | `conductor/product.md` | "eleven rule-narrators" → "twelve"; the Game 22 blockquote moved under its own `## Changelog — Game 22 (2026-10-20)` heading. |
| L3 | `src/assets/svg/stories/story_foot_sock.svg`, `docs/svg-contact-sheets/stories.png` | The sock now has a cuff wider than the ankle with five rib lines and a toe seam, so silhouette (not fill) separates it from the bare foot; contact sheet re-rendered and inspected. |
| L4 | `verification/phase-2.md` | The art-rework rows now point at `d167eb2` with a note that the phase was squashed. |

## Commands

| Command | Result |
| --- | --- |
| `pnpm check` | **was red at this checkpoint** - the new test block was left unformatted, so the command exited 1 while this row claimed exit 0. Corrected in Phase R2 (F1); check is green from `ca3e71b`'s successor. |
| `pnpm typecheck` | exit 0 |
| `pnpm test -- --run` | 103 files / 2,206 tests (2,205 + the new drop-wire case) |
| `pnpm test:coverage` | 98.13 statements / 90.54 branches / 98.14 functions / 98.96 lines |
| `pnpm build` | `StoryOrderScene-CVD3qRwC.js` 33.88 kB; shell `index-DNVeO3-t.js` 200.12 kB raw |
| `node scripts/validate-bundle.js` | PASS - 195.4 kB ≤ 200 kB |
| `node scripts/validate-pwa.js` | 15 passed / 0 failed |

## Acceptance criteria

| ID | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| M1 | Tap returns a placed panel; a real drop does not | Met | `StoryOrderScene.ts` `drag`/`handleDrop` set the flag, `pointerdown` clears it; new suite case drives `drop` through the container wire, tap case runs the full `pointerdown → dragstart → dragend → pointerup` sequence |
| M2 | Spec matches the built board | Met | dated FR-3 amendment |
| M3 | Spec matches the two miss behaviours | Met | dated AC-3 amendment + product changelog |
| L1-L4 | Record and art nits closed | Met | see table |

M1 note: on a **complete** strip a tap necessarily resolves the round, because the tap's own `dragend` runs `tryAutoValidate` before the `pointerup`. Tap-to-return is therefore an incomplete-board gesture, which is the only state where withdrawing a panel is meaningful; the revised test states that explicitly.

## Deviations

None. The spec was amended rather than the build re-laid out for M2/M3, deliberately:
the built board (slots above, tray at thumb height) and the spring-back are the
better interactions, and the spec is supposed to describe the shipped game.

## Notes for the primary agent

- Suite count 2,205 → 2,206 and shell 195.4 kB unchanged (the scene grew 33.36 →
  33.88 kB).
- The sock change is visual only; no test asserts art pixels, so the contact
  sheet is the evidence (re-rendered at `docs/svg-contact-sheets/stories.png`).
