# Spec: Overlay Hit Areas

> Requirements are stable: IDs are never renumbered. A withdrawn item is
> marked `Withdrawn (reason)` and kept in place.

## Overview

Six interactive controls across three components hand-write custom hit areas in
a frame Phaser's input manager does not use. The same defect was found in the
Settings panel (track `20261024-settings-row-targets`) and fixed there through
`centredHitArea()`. This track applies that proven helper to the six remaining
call sites so every tap a parent makes lands on the control they see.

## Problem / Motivation

Phaser's `InputManager.pointWithinHitArea` (Phaser 4.2.1,
`node_modules/phaser/src/input/InputManager.js:966-967`) adds a GameObject's
`displayOriginX/Y` to the tap before consulting a custom hit-area callback.
Rectangles written *centre-based* (local 0 assumed to be the object's centre)
therefore describe a live zone shifted by the object's own origin - for an
origin-0.5 label, half the rendered word and half the line box. The six sites
below predate the Settings fix and still carry that wrong frame.

Defect inventory:

- `src/components/PwaToast.ts:103` - "Update now", "Later" and "OK" buttons
  (`BUTTON_WIDTH 200` x `BUTTON_HEIGHT 72` around the anchor). Half the drawn
  word's right side is dead; the live zone hangs out into blank space left of it.
- `src/components/settings/ProfilesOverlay.ts:122` - "Delete" (240 x 64). Same
  displacement; the live band reaches across the play-time chip's dead seam.
- `src/components/settings/ProfilesOverlay.ts:147` - the "Play Time: 15m" chip
  (120 x 64). The visible label's right portion fires nothing, so the tap falls
  through to the backdrop and **closes the overlay** instead of cycling the limit.
- `src/components/settings/ProgressOverlay.ts:145` - the "X" close (96 x 96).
- `src/components/settings/ProgressOverlay.ts:168` - the avatar chip (an
  **Image**, 64 px drawn at 0.5 origin, `96 x 96` band). The displayOrigin of a
  scaled image is about half the scaled size, so the band is offset by up to a
  third of its diameter while chips sit only 56 px apart.
- `src/components/settings/ProgressOverlay.ts:269` - the page chevrons (96 x 96).

Every other custom hit area in the codebase is already correct: the Settings
panel rows go through `centredHitArea()`, and the scene-level sites (back
buttons, Memory Match cards, Word Builder tiles, the order-game containers,
Choice round cards) write `(0, 0)`-based rectangles *with comments* that state
the engine frame.

Reproductions (desktop Chromium):

1. Settings > Learning Progress: aim at the right third of a profile avatar -
   the neighbouring avatar (drawn later) is selected instead.
2. Settings > Profiles: aim at the right third of "Play Time: 15m" - the
   overlay closes. The left two-thirds cycles the limit.
3. While a `v*` update has downloaded: aim at the right end of "Update now" -
   nothing happens.

Root-cause hypothesis: the three files were written before the frame was
understood, and the Settings track (which introduced `centredHitArea`) stopped
at its own Touches.

Regression test: an engine-accurate probe (the harness `tapHits` and the
`engineHits` pattern already in `SettingsPanel.test.ts`) at each site's drawn
word/avatar edges, asserted against the callback the code installed. It fails
against the un-fixed code and passes after.

## Goals & Success Metrics

- **G1** - Every custom hit area routes through `centredHitArea()`, whose
  callback cancels `displayOrigin`, so the described rectangle *is* the live zone.
- **G2** - Each band is centred on its drawn control: toast buttons and chips on
  the visible word, the avatar chip on the drawn avatar, chevrons and the close
  glyph on their glyph.
- **G3** - No drawn geometry moves; target sizes, floors and press feedback are
  unchanged.
- **G4** - The engine frame is documented where a reader can find it: the TDD
  component table and the PRD touch-target section.

## Scope

### In

- `src/components/PwaToast.ts` - the `createButton` hit area.
- `src/components/settings/ProfilesOverlay.ts` - the Delete and play-time-chip
  hit areas.
- `src/components/settings/ProgressOverlay.ts` - the close, avatar-chip and
  chevron hit areas.
- Their test suites (`src/__tests__/components/PwaToast.test.ts`,
  `src/__tests__/components/PwaToasts.test.ts`,
  `src/__tests__/components/SettingsPanel.test.ts`).
- `docs/TDD.md` component rows and `docs/PRD.md` section 5.2.

### Out

- The scene-level `Rectangle.Contains` sites (already correct by construction).
- The 96 px avatar-chip floor on a 56 px chip pitch in Learning Progress: the
  seam overlap that floors-and-pitch produce is accepted and documented, not
  redesigned here (later chip wins, matching "inflated collision bounds").
- Chip spacing, toast geometry, modal sizes, overlays' other behaviour.
- A promotion of `centredHitArea` into a shared module (one consumer family is
  enough for now; revisit if a fourth consumer appears).
- `src/__tests__/helpers/*` shared doubles (may be imported, not edited).

## Bug Details

Reproductions and the regression test plan are listed under Problem / Motivation
above.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | The PwaToast button hit area is installed through `centredHitArea(BUTTON_WIDTH, BUTTON_HEIGHT)` with the helper's callback. | Must |
| FR-2 | The ProfilesOverlay Delete button uses `centredHitArea(TOGGLE_WIDTH, ROW_HEIGHT)`; the play-time chip uses `centredHitArea(TOGGLE_WIDTH / 2, ROW_HEIGHT)`. | Must |
| FR-3 | The ProgressOverlay close button and both chevrons use `centredHitArea(TOGGLE_HEIGHT, TOGGLE_HEIGHT)`; the avatar chip uses `centredHitArea(96, 96)`. | Must |
| FR-4 | Every band keeps today's intended width/height so visible target size and floors do not change. | Must |
| FR-5 | A per-site engine-accurate regression test proves each band in the frame the engine hit-tests; the harness-level red proof for at least one site is recorded in phase evidence. | Must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No new dependency, module or shell-budget change: the helper stays in `settings/primitives.ts` and `PwaToast` imports it cross-directory. |
| NFR-2 | No persisted state or storage schema change. |
| NFR-3 | Reduced motion, press feedback and entrance animation behaviour are unchanged. |
| NFR-4 | The full verification gate (nine layers) passes; the documented budgets hold. |
| NFR-5 | Shared test doubles in `src/__tests__/helpers/` and `phaserMock.ts` are imported as-is; any stubbing needed for the engine probe lives in the suites that own it. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | Tapping the drawn word centre and its drawn edges at every toast button, the Profiles Delete button and the play-time chip activates the intended handler; one step outside the band does not. | FR-1, FR-2, FR-5 |
| AC-2 | Tapping the Progress "X", chevrons and an avatar chip inside its band selects that band's target; a tap exactly at the chip seam selects the later chip (accepted overlap); the wrong-profile defect from the reproduction is gone for taps inside a chip's own band. | FR-3, FR-5 |
| AC-3 | Tapping anywhere across the whole visible "Play Time: 15m" label cycles the limit and never closes the overlay. | FR-2, FR-5 |
| AC-4 | The drawn objects (counts, positions, styles) are unchanged; only hit areas move. | FR-4 |
| AC-5 | The regression proof recorded in phase evidence shows the engine probe failing against the un-fixed frame and passing after the change. | FR-5 |
| AC-6 | The full gate is green and the TDD component rows plus PRD 5.2 state the frame rule and the accepted chip overflow. | FR-4, NFR-4 |

## Edge Cases

- Reduced motion: press feedback and entrance tweens still behave; hits are
  unaffected by motion settings.
- Toast buttons near the camera edge: bands stay inside the 520 px panel; no
  clipping risk at fixed y = 100.
- Two rapid taps on the same control: unchanged double-tap semantics.
- The delete-confirmation modal and the iOS how-to overlay already use
  `centredHitArea`/plain interactivity; they are untouched.
- Test doubles that report no `width`/`displayOrigin`: the engine probe deals
  with real numbers explicitly, as the Settings suite does.

## Dependencies

- Tracks: none (the Settings track that introduced the helper is archived).
- External: none.

## Open Questions & Assumptions

- Assumption: each site keeps today's intended rectangle sizes (240 x 64,
  120 x 64, 200 x 72, 96 x 96) - only the frame changes. A visual redesign is
  out of scope.
- Assumption: `PwaToast` importing from `./settings/primitives` is acceptable;
  a shared-module promotion is deferred.
- Assumption: the Learning Progress chip seam stays an accepted overlap (the
  96 px floor exceeds the 56 px chip pitch); the phase documents it rather than
  changing geometry.

## References

- Phaser 4.2.1 `src/input/InputManager.js:963-982` - origin added before the
  custom hit-area callback.
- `src/components/settings/primitives.ts` - `centredHitArea()`.
- `conductor/archive/20261024-settings-row-targets/` - the proof of mechanism,
  including the engine-accurate test pattern and red-then-green.
- Six defect sites listed under Problem / Motivation.
- `src/__tests__/helpers/hitTest.ts` - engine-accurate tap simulation.
- Docs anchors: `docs/TDD.md` component table, `docs/PRD.md` section 5.2.
