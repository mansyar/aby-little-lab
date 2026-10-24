# Integrated verification - Settings Row Targets

Base: `107404c6` (`master` at track start)
Verified at: `0bcfd9a1` (code and docs HEAD `49861d15`, after review rounds 1 and 2)
Range: 16 commits, 8 files, +737 / -129

## What changed, by area

| Area | Before | After |
| --- | --- | --- |
| Row spacing | eight literals at 55-56 px apart, plus a comment claiming the pitch | `FIRST_ROW_OFFSET = -47` plus `index * ROW_PITCH`, giving `-47, +9, +65, +121, +177, +233, +289, +345` |
| Toggle hit band | 320 x 96 centred on a label drawn at `x - 40`, ending at `centerX + 120` | 400 x 56 centred on the card, spanning `centerX ± 200` and covering the switch at `+170` |
| Other row bands | `TOGGLE_WIDTH` x `ROW_HEIGHT` (240 x 64) | `ROW_HIT_WIDTH` x `ROW_PITCH` (400 x 56) |
| Voice row | two overlapping 120 x 64 rectangles | one band split at the midpoint: 270 px chip, 130 px preview, both 56 tall |
| Constants | `TOGGLE_HEIGHT` and `ROW_HEIGHT` served as row geometry | `ROW_PITCH` and `ROW_HIT_WIDTH` own the rows; the old two remain for modal buttons and the overlays |
| Records | TDD described the old geometry as a hit height and a pitch; PRD stated a 64 px minimum with no exception | TDD `:609` and PRD `:466` state the shipped band and why it is 56 |

## Gate

Run at `f221ccd0`, every layer exit 0:

| # | Command | Exit | Result |
| --- | --- | --- | --- |
| 1 | `pnpm check` | 0 | 252 files; the two pre-existing findings only |
| 2 | `pnpm typecheck` | 0 | clean |
| 3 | `pnpm test -- --run` | 0 | 121 files / 2634 tests (2631 before the track) |
| 4 | `pnpm test:coverage` | 0 | 97.99 / 92.00 / 96.69 / 98.74 |
| 5 | `pnpm build` | 0 | precache 54 entries |
| 6 | `node scripts/validate-bundle.js` | 0 | phaser 1342.6 kB; shell `index-DBpptynd.js` 138.3 kB |
| 7 | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| 8 | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed |

Both phase subagents were denied the docs layer; the primary ran it in both phases. No layer was skipped or assumed.

## Cross-phase interaction review

- **The band and the pitch are the same constant, by construction.** Phase 1 derived the offsets from `ROW_PITCH` and used the same value as the band height, so the geometry test cannot pass while the two disagree. That is the property the defect lacked.
- **The switch is inside the band, not next to it.** The toggle's band is centred on the card while its label is 40 px off centre; the +40 in the rectangle origin is what makes the two coincide. If a later change moves the label, the band stays on the card and the switch stays covered.
- **The Voice row is the one place the band is divided.** Two full-width bands would have stacked, and the preview (drawn last) would have received every tap on the chip - a new defect created by the wider band rather than fixed by it. The split is what keeps FR-5 true.
- **The rows that did not change still meet the floor.** `createModalButton`, `ProfilesOverlay` and `ProgressOverlay` still use `TOGGLE_HEIGHT` and `ROW_HEIGHT`, and their tests still assert at least 64 px. The exception is confined to the eight main-panel rows, which is what both documents now say.
- **Layout movement is inside the budget.** The top three rows moved up 2 px and three middle rows 1 px to make the pitch uniform; no row moved more than the 2 px the spec allows, and the bottom card still ends at `+379` inside the 760 px panel.
- **Persistence, audio and the state machine are untouched.** Every handler stays on the object it was on, so the 89 existing `triggerPointerdown` taps and the eight persisted settings behave identically; only the extent of the rectangles changed.

## Acceptance criteria

| ID | Criterion | Evidence |
| --- | --- | --- |
| AC-1 | no two row rectangles intersect; neighbours abut | "gives every row one band, so neighbours abut and never overlap" (gap 0..1, one height for the stack) |
| AC-2 | toggle band spans the card and reaches the switch | "spans each toggle's card and reaches its switch" |
| AC-3 | the switch region toggles once | "toggles once when the switch region is tapped" |
| AC-4 | no visual change beyond 2 px | the untouched card, label and switch cases plus the pitch derivation |
| AC-5 | the other rows keep their behaviour | Profiles, Progress, Reset, Install and Voice suites unchanged apart from their band assertions |
| AC-6 | full gate passes; both documents describe the geometry | gate table above; TDD `:609`, PRD `:466` |

## Documents synchronised

- `docs/TDD.md` settings section: pitch, offsets, band, card-centred toggle, `VoiceRow` split, retained constants, and the 56-not-64 reason.
- `docs/PRD.md` §5.2: the 64 x 64 minimum kept, with one sentence naming the eight Settings rows as the only exception.

`docs/roadmap.md` and `README.md` needed no change: this defect was never a roadmap entry.

## Residual risk

- **The band is 56 px tall, below the documented 64 px minimum.** That is the deliberate trade recorded in both documents: eight rows cannot each carry 64 px inside the panel, and a 400 px wide band that always hits the intended row was chosen over a 96 px tall one that steals 40 px from its neighbour. A pager or a submenu would remove the trade and remains available as future work.
- **The modals and overlays were not measured.** Their own spacing may have a similar overlap; this track deliberately did not audit them.
- **The switch's track overhangs the card by 2 px** at `centerX + 202` against a card edge at `+200`. That is pre-existing drawing, unchanged here, and the band covers the visible switch except for that 2 px sliver.

## Post-review state

The review rounds changed two things this file's first version did not know about,
and both are load-bearing rather than cosmetic.

| Round | Change | Why it matters |
| --- | --- | --- |
| R1 | `centredHitArea()` in `settings/primitives.ts`, applied to all six custom hit areas; the Voice rectangles rewritten in the position frame | Phaser adds `displayOriginX/Y` before testing a custom area, so the centre-based rectangles this track shipped first were half a label to the left and half a line up. The band *numbers* did not change; the frame they are expressed in did. |
| R2 | Each Voice half's outer edge is the union of the card and the rendered label; the engine cases drive the real callback | "Preview" at 26 px reaches ~27 px past the card edge, so the tail of the visible word fell on the backdrop and closed the panel - the same class of defect, one level down. |

Final gate at `49861d15`: `pnpm check` 0, `typecheck` 0,
`test -- --run` 0 (121 files / 2640 tests), `test:coverage` 0
(97.98 / 91.9 / 96.71 / 98.75), `build` 0, `validate-bundle` 0
(phaser 1342.6 kB, shell `index-COHKw1P7.js` 138.8 kB),
`validate-pwa` 0 (16/16), `validate-docs` 0 (5/5).

The interaction review above still holds: one pitch, eight rows, the switch inside
its band, the modal and overlay rows untouched at the 64 px floor, and nothing
outside the settings components changed. What the rounds added is the evidence
that the bands are in the frame the engine uses, which is stronger than the
rectangle arithmetic the first version relied on.

Residual, recorded as future work rather than debt inside this track: the overlays
(`ProfilesOverlay.ts`, `ProgressOverlay.ts`, `PwaToast.ts`) still build
centre-based rectangles by hand and are wrong by the same mechanism.
