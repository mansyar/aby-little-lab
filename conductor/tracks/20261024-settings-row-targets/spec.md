# Settings Row Targets

> Requirements are stable. Do not renumber them. Mark removed items Withdrawn.

## Overview

The Settings panel stacks eight rows 55-56 px apart, but the interactive areas
are taller than that pitch, so each row owns part of its neighbour and the lower
row wins the tap. The toggles are also tappable only on their label: the switch
graphic - the part that looks like a button - is outside every hit area.

## Problem / Motivation

A parent opens Settings to turn off music and turns off effects instead, or taps
the switch and nothing happens. Both are pure input-routing defects: the visuals,
the persisted values and the state machine are correct.

Measured in the current code:

- Rows sit at `centerY - 45, +11, +67, +123, +178, +234, +290, +345`
  (`src/components/SettingsPanel.ts:144-153`), a pitch of 55-56 px.
- Toggles set a hit area `TOGGLE_WIDTH + 80` = 320 wide by `TOGGLE_HEIGHT` = 96
  tall, centred on a label drawn at `x - 40` (`:238-246`). Ninety-six tall on a
  56 px pitch means **40 px of every toggle overlaps the next row**, and Phaser
  resolves the overlap by display order, so the lower row receives the tap.
- Every other row uses `ROW_HEIGHT` = 64 tall on the same pitch
  (`src/components/settings/primitives.ts:70-78`, `InstallRow.ts:59-67`,
  `VoiceRow.ts:63-71`), an **8 px** overlap with the same resolution.
- The switch is drawn at `centerX + 170` (`SettingsPanel.ts:207-225`) while the
  toggle hit area ends at `centerX + 120`, so the track and knob are dead to
  touch.

### Reproductions

1. **Wrong row.** Open Settings, tap 20 px below the bottom edge of the
   "BGM: ON" card - visually inside BGM - and "SFX" flips instead.
2. **Dead switch.** Tap the music switch's knob. Nothing happens; the label 30 px
   to its left is the only live region.
3. **Seam.** Tap the 8 px strip where the "Profiles" and "Progress" cards meet and
   "Progress" opens.

### Root-cause hypothesis

Two unrelated sizing constants are being asked to serve as a row pitch:
`TOGGLE_HEIGHT = 96` and `ROW_HEIGHT = 64` describe comfortable target sizes, but
the panel packs rows at 56 px, so target and pitch disagree and nothing reconciles
them. There is no single expression of "how far apart rows are", which is why the
conflict survived.

### Regression test that must fail before and pass after

A geometry test that resolves every row's hit rectangle into panel coordinates
and asserts no two of them intersect vertically, plus a test that the toggle's
horizontal extent reaches the switch. Both fail against the current constants.

## Goals & Success Metrics

- **G1:** A tap lands on exactly one row, the one it looks like it hit.
- **G2:** The switch graphic is tappable, like the label.
- **G3:** Row spacing has one source of truth, so this cannot drift again.
- **G4:** Nothing moves visually: row positions, card sizes, fonts and colours are
  unchanged; only hit geometry and the constants behind it change.

## Scope

**In scope**

- The eight main-panel rows: BGM, SFX, Adaptive, Profiles, Progress, Reset,
  Install, Voice.
- `primitives.ts` constants and the shared `createRow` hit geometry.
- The computed exception to the 64 px minimum, recorded in the PRD and the TDD.

**Out of scope**

- The modal and overlay layouts (`ResetModal` buttons, `ProfilesOverlay`,
  `ProgressOverlay`, the iOS how-to overlay, the picker). Their rows are laid out
  by their own spacing and do not share the main panel's pitch; a separate
  measurement would be needed to judge them.
- Growing the panel, paging it, or moving rows into submenus. All three were
  considered and rejected in favour of keeping the layout byte-identical.
- Changing the visuals, the persisted settings, or the audio behaviour.
- The Hub's tiles, which already meet the floor.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | One constant expresses the main-panel row pitch, and every main-panel row's hit area is exactly that tall, so adjacent hit areas abut and never overlap. | Must |
| FR-2 | Each row's hit area spans the row card horizontally, so the label, the switch and the empty card space all activate the same row. | Must |
| FR-3 | Tapping the BGM, SFX or Adaptive switch graphic toggles that row exactly as tapping its label does. | Must |
| FR-4 | Row visuals are unchanged: the same card size, fonts, colours and switch geometry, with row positions allowed to move by at most 2 px so that the pitch can become uniform. | Must |
| FR-5 | The other rows keep their existing behaviour: Profiles, Progress, Reset and Install open what they opened before, and the Voice chip and preview keep their separate jobs. | Must |
| FR-6 | The 64 px minimum stays the default for every control that can meet it, and the main-panel row exception is stated where the guideline lives. | Should |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No new dependency and no change to the shell size budget (200 kB). |
| NFR-2 | The change is confined to settings components and their tests; no scene, storage or engine code is touched. |
| NFR-3 | Hit geometry is derivable and testable without running Phaser's input system, by resolving rectangles from the objects the panel creates. |
| NFR-4 | Reduced motion and press feedback behave as before. |
| NFR-5 | Full gate passes, including the docs validator. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | For all eight rows, no two hit rectangles intersect vertically; each pair of neighbours abuts. | FR-1 |
| AC-2 | Each toggle's hit rectangle spans at least the card width and covers the switch's x position. | FR-2 |
| AC-3 | A tap on the switch region toggles the row once - not twice, not zero times. | FR-3 |
| AC-4 | The object list is otherwise unchanged: cards, labels and switches keep their sizes, fonts and colours, and no row moves by more than 2 px. | FR-4 |
| AC-5 | Profiles, Progress, Reset and Install still open their surfaces from their own labels. | FR-5 |
| AC-6 | The full gate passes; PRD §5.2 and the TDD settings section describe the new geometry and the exception. | FR-6, NFR-5 |

## Edge Cases

- **A row is absent.** When the install row reports `hidden` it draws nothing, so
  the pitch is unaffected but a geometry test must not assume eight rows exist.
- **Display scaling.** Phaser's FIT scale changes rendered size, not the
  coordinate space the hit areas live in, so the geometry is scale-independent.
- **A modal opened from a row.** Reset opens a modal over the panel; the panel's
  rows stay put, and the modal's own buttons are out of scope.
- **Two taps in quick succession.** Unchanged: the handlers are the same, only
  their extent moves.
- **Reduced motion.** Press feedback is disabled there, and the hit geometry must
  not depend on it.

## Dependencies

- **Tracks:** none.
- **External:** none.

## Open Questions & Assumptions

- **Assumption:** 56 px is the pitch. The rows are at 55 px in two gaps and 56 px
  in five, so the closest round pitch is 56; a 55 px band would leave a 1 px dead
  strip in the two tighter gaps. The pitch is therefore derived from the layout
  rather than guessed, and the plan derives it from the actual offsets.
- **Assumption:** the 56 px height is an acceptable exception to the 64 px
  minimum because the target is 400 px wide, the physical limit is the panel not
  the guideline, and the alternative is a target that steals from its neighbour.
- **Deferred:** whether the panel should eventually grow a page or a submenu so
  eight rows can each have 64 px. That is a layout change, not a defect fix.

## References

- `src/components/SettingsPanel.ts:142-153` (row offsets), `:198-247` (toggle
  construction and hit area), `:207-225` (switch drawing)
- `src/components/settings/primitives.ts:19-26` (constants), `:59-83` (`createRow`)
- `src/components/settings/InstallRow.ts:59-67`, `VoiceRow.ts:63-71`
- `docs/PRD.md` §5.2 touch targets, `docs/TDD.md` settings panel section
- `conductor/product.md:66` (touch-first ergonomics)
