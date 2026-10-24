# Review - Settings Row Targets

**Track:** `20261024-settings-row-targets` (bug, high)
**Branch:** `fix/20261024-settings-row-targets`
**Range:** `107404c6f34d8ed7b75688efc30780057b1384f1..703c3e83`
**Date:** 2026-10-24
**Round:** 1
**Verdict:** **BLOCK** - one High open

## Summary

The pitch work is correct. `ROW_PITCH = 56` is both the row spacing and the band
height, the eight offsets derive from one first-row offset, the toggle's band is
centred on the card rather than on its off-centre label, and the geometry test
resolves rectangles from the created objects so a drifted constant would fail it.
Seven of the eight rows now behave. The modals and overlays correctly keep their
own 240 x 64 geometry and the 64 px floor.

The blocking defect is on the eighth row. `VoiceRow` splits its band at the
midpoint of the two label *anchors*, which says nothing about how wide the labels
actually are. The chip's half ends 100 px right of its anchor while
`"Voice: Default (device)"` at 26 px runs well past that, so the tail of the chip
sits in the preview band; and the preview's half ends only 30 px right of its
anchor while `"Preview"` is roughly 90 px wide, so its right edge falls outside the
card and therefore outside every band - onto the backdrop, which closes the panel.
That second half is a regression: the pre-track band reached `previewX + 120` and
covered the whole word.

This is the very defect class the track exists to remove, introduced by the
deviation that changed this row's geometry. The deviation reasoned only about two
full-width bands stacking; it never checked the labels against the halves it chose.

## Verification relied upon

| Layer | Result | Where |
| --- | --- | --- |
| `pnpm check` | 0 | phase 1 and 2 evidence |
| `pnpm typecheck` | 0 | phase 1 and 2 evidence |
| `pnpm test -- --run` | 0 - 121 files / 2634 tests | phase 1 and 2 evidence |
| `pnpm test:coverage` | 97.99 / 92.00 / 96.69 / 98.74 | phase 1 and 2 evidence |
| `pnpm build` | 0 | phase 2 evidence |
| `validate-bundle` | 0 - shell 138.3 kB | phase 2 evidence |
| `validate-pwa` | 0 - 16 / 0 | phase 2 evidence |
| `validate-docs` | 0 - 5 / 0 | phase 2 evidence, run by the primary |

The reviewer could not run any command: shell access was refused, so the
above is taken from the evidence files and the geometry was re-derived by hand.

## Requirements

| ID | Status | Note |
| --- | --- | --- |
| FR-1 | covered | one pitch, one band, neighbours abut |
| FR-2 | **partial** | the toggle band spans the card, but `VoiceRow`'s chip label does not fit its half (F1) |
| FR-3 | covered | switch region toggles once |
| FR-4 | covered | max row movement 2 px, cards and fonts untouched |
| FR-5 | **partial** | chip and preview do not keep clean separate jobs (F1) |
| FR-6 | covered | TDD `:609`, PRD `:466`; two overstatements noted in F4, F6 |
| NFR-1 | covered | shell 138.3 kB |
| NFR-2 | covered | settings components and tests only |
| NFR-3 | covered | geometry test is object-derived |
| NFR-4 | covered | press feedback and reduced motion cases unchanged |
| NFR-5 | covered | full gate, docs included |
| AC-1 | covered | abut test, red first |
| AC-2 | covered | card span and switch reach |
| AC-3 | covered | one toggle per tap |
| AC-4 | covered | arithmetic plus untouched card cases |
| AC-5 | **partial** | the Voice row's two jobs are not clean (F1) |
| AC-6 | covered | gate plus both documents |

## Findings

### F1 - High - the Voice row's labels do not fit the bands the split gives them

`src/components/settings/VoiceRow.ts:54-61, 74-82, 105-113`

`splitX` is the midpoint of the two anchors (`x + 70`) and both bands are clamped
to the card. The chip band leaves 100 px right of its anchor; the preview band
leaves 30 px right of its anchor. So the tail of the chip's own text activates
Preview, and the right edge of "Preview" falls through to the backdrop and closes
Settings. `docs/TDD.md:609`'s "the label, the switch and the empty card space all
activate the same row" is false for this row.

**Fix:** derive the split from rendered extents (`chip.getBounds()` and
`preview.getBounds()`), placing the boundary at the midpoint of the gap between
them, clamped so each band stays inside the card and at least 96 px wide; shorten
the chip's truncation budget if the extents collide; recompute after every
`setText` on cycle; keep an anchor-midpoint fallback for doubles that report no
metrics.

### F2 - Medium - the voice assertion was weakened, not re-expressed

`src/__tests__/components/SettingsPanel.test.ts:1283-1301`

Four independent `>= 64` assertions became one height pair plus a width sum, so a
390/10 split would pass and nothing bounds either control or proves the halves
abut.

**Fix:** assert each band `>= 96`, abutment, both inside the card, and - with a
stubbed `scene.add.text` returning controllable `getBounds` - that each label's
extent lies inside its own band.

### F3 - Low - the close button's box now loses a corner to BGM

`src/components/SettingsPanel.ts:131-148`

The ✕ box spans `x+156..x+252, y-153..-57`; the BGM band reaches `x+156..x+200,
y-75..-57`. Rows are created after the ✕, so that 44 x 18 corner toggles music
instead of closing. The visible glyph is unaffected.

**Fix:** let the ✕ win its own box (depth above the rows), and add a geometry test
that no row band intersects it.

### F4 - Low - the band stops 2 px short of the switch's drawing

`src/components/settings/primitives.ts:36`, `SettingsPanel.ts:216`

The 64 px track centred at `+170` reaches `+202` while the band ends at `+200`.

**Fix:** state the overhang in the TDD paragraph; the drawing is out of scope under
FR-4.

### F5 - Low - cards are 68 px on a 56 px pitch

`docs/TDD.md:609`

Cards overlap 12 px, so the visible seam sits at `+22` while the band boundary is
at `+28`; a 6 px strip that reads as the lower card still hits the upper row. That
is the residual of spec reproduction 3 and neither document says so.

**Fix:** one clause in the TDD naming the six-pixel residual and why the pitch
trade buys it.

### F6 - Low - the exception can be read as contradicting protected controls

`docs/PRD.md:466`

The exception sentence sits directly above "Protected controls ... always use the
larger target", and the three Settings toggles change state.

**Fix:** say in the exception sentence that it covers the three toggles.

## Plan compliance

Compliant. All ten tasks `[x]`, both phases `verified`, checkpoints `c645b4fe` and
`f221ccd0` match `metadata.json`. The diff is the five Touches files plus one
accepted out-of-phase file (`settings/primitives.test.ts`, which pins the shared
rectangle P1.T2.1 replaces) plus the evidence files.

## Out of scope

The modal and overlay layouts and their own spacing; a pager or submenu that would
let eight rows keep a 64 px band; the drawing change that would end the track's
2 px overhang.

## Debt

None yet - all six findings are assigned to Phase R1.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed before PR |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | BLOCK | 0 | 1 | 1 | 4 | - |

## Doc sync

`complete` for the track's own documents (TDD `:609`, PRD `:466`); F4, F5 and F6
add clauses to those same two paragraphs in Phase R1.
