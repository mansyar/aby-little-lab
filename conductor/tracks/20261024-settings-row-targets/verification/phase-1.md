# Phase 1 verification - One pitch, one band

Track: `20261024-settings-row-targets`
Branch: `fix/20261024-settings-row-targets`
Phase base: `a5df1dcb5d2872473cdb1fb9bfe710f2ce2272d1`
Executed: 2026-10-24

## Result

The eight main-panel rows now share one band: `ROW_PITCH = 56` is both the row
spacing and the height of every row's hit rectangle, `ROW_HIT_WIDTH` (the card
width) makes the whole card live, and the eight offsets derive from
`FIRST_ROW_OFFSET + n * ROW_PITCH`. The toggle band now reaches the switch, and
neighbouring bands abut with no overlap in either direction. No visual moved by
more than 2 px.

## What changed, per file

### `src/components/settings/primitives.ts`

- `:27-36` - added `ROW_PITCH = 56` with the "why" comment (eight rows plus the
  title and footer cannot each carry a 64 px band inside the 760 px panel, so
  the pitch is the only non-overlapping height; the 400 px width carries the
  target instead), and `ROW_HIT_WIDTH = ROW_CARD_WIDTH`.
- `:79-86` - `createRow`'s shared hit area is now `ROW_HIT_WIDTH` x
  `ROW_PITCH` (was `TOGGLE_WIDTH` x `ROW_HEIGHT` = 240 x 64).
- `TOGGLE_HEIGHT` (`:20`) and `ROW_HEIGHT` (`:21`) are **kept**: both are still
  used outside the main panel - `createModalButton` (`:121-123`),
  `ProfilesOverlay.ts:124-151` and the iOS overlay's Close button in
  `InstallRow.ts:121-123` (via `TOGGLE_HEIGHT`), `ProgressOverlay.ts:146-149`.

### `src/components/SettingsPanel.ts`

- `:37-41` - new module constant `FIRST_ROW_OFFSET = -47` with a comment tying it
  to the panel edges.
- `:149-161` - the eight offsets are derived, not written out:
  `const rowY = (index) => centerY + FIRST_ROW_OFFSET + index * ROW_PITCH`,
  giving `-47, +9, +65, +121, +177, +233, +289, +345`. The stale
  "Row pitch ~56px ... matching v1.16.0" comment is replaced by one that states
  the pitch, the start offset and the bottom-card clearance.
- `:22-24` / `:32` - imports: `ROW_HIT_WIDTH`, `ROW_PITCH` in; `TOGGLE_HEIGHT`
  and `TOGGLE_WIDTH` out (no longer used here).
- `:247-259` - `createToggle`'s hit area is `ROW_HIT_WIDTH` x `ROW_PITCH` with
  origin `-ROW_HIT_WIDTH / 2 + 40` (the label sits 40 px left of the row centre,
  so the origin shifts by 40 to keep the rectangle centred on the card). The
  rectangle is now 400 x 56 spanning `centerX - 200 .. centerX + 200`; the switch
  is at `centerX + 170` and its knob at `+186` / `+154`, all inside it.
- Business logic, drawn switch geometry, title, version footer and close button
  are untouched.

### `src/components/settings/InstallRow.ts`

- `:12-18` - imports `ROW_HIT_WIDTH` / `ROW_PITCH`, drops `ROW_HEIGHT`
  (`TOGGLE_HEIGHT` / `TOGGLE_WIDTH` stay for the iOS overlay's Close button).
- `:60-67` - the install row's hit area is `ROW_HIT_WIDTH` x `ROW_PITCH`
  (was 240 x 64). Same handler, same object, same visual position.

### `src/components/settings/VoiceRow.ts`

- `:20-22` - the chip and preview label offsets are now named constants
  (`VOICE_CHIP_OFFSET = -30`, `VOICE_PREVIEW_OFFSET = 170`) so the band can be
  derived from their visual positions.
- `:54-61` - the row's one band is computed from the card edges, and the split
  point is the midpoint between the two labels. Comment records why.
- `:73-80` (chip) and `:104-111` (preview) - each control's hit area is
  `ROW_PITCH` tall; the two widths partition `ROW_HIT_WIDTH` exactly
  (chip 270, preview 130). Handlers stay on the objects they were on; visuals
  did not move. See deviation 2 for why the band is split rather than duplicated.

### `src/__tests__/components/SettingsPanel.test.ts`

- `:1-3` - imports `ROW_HIT_WIDTH` / `ROW_PITCH` for the updated expectations.
- `:198-229` - `hitRectFor(scene, label)`: resolves a created text object's
  custom hit rectangle into scene coordinates from the object's own position and
  rectangle (no layout constants involved).
- `:390-449` - new `describe("SettingsPanel row geometry")`:
  - `gives every row one band, so neighbours abut and never overlap` (`:408`) -
    for all eight rows it asserts the vertical gap between neighbours is `>= 0`
    (no overlap) and `<= 1` (no dead seam), and that every band has one height.
  - `spans each toggle's card and reaches its switch` (`:425`) - each toggle's
    rectangle covers the card's left and right edges and contains the track
    centre in both axes.
- `:555-578` - new `toggles once when the switch region is tapped`: the knob's
  centre lies inside the BGM band, and one dispatch flips the state once
  (`setBGMEnabled` once with `false`, no `setSFXEnabled`, one label rewrite).
- Five existing expectations updated (see the table below).

### `src/__tests__/components/settings/primitives.test.ts` (outside `Touches`)

- `:76-93` - `createRow`'s shared hit area expectation now pins
  `-200 / -28 / 400 / 56` (was `-120 / -32 / 240 / 64`), with a comment naming
  the documented exception. Necessary because this test pins the exact code
  P1.T2.1 changes; leaving it would fail the gate. See deviation 1.

## Red then green (P1.T3.2)

The geometry tests were written first and run against the pre-change constants
(`a5df1dcb` + the new tests only). Both failed, for the two documented reasons:

```
FAIL src/__tests__/components/SettingsPanel.test.ts > SettingsPanel row geometry > gives every row one band, so neighbours abut and never overlap
AssertionError: expected -40 to be greater than or equal to 0
 ❯ src/__tests__/components/SettingsPanel.test.ts:413:19
    413|       expect(gap).toBeGreaterThanOrEqual(0); // no overlap: the lower row cannot steal the tap
```

(`-40` = the 96 px toggle band on a 56 px pitch: 40 px of every toggle sat on
its neighbour, which is reproduction 1.)

```
FAIL src/__tests__/components/SettingsPanel.test.ts > SettingsPanel row geometry > spans each toggle's card and reaches its switch
AssertionError: expected 632 to be greater than or equal to 712
 ❯ src/__tests__/components/SettingsPanel.test.ts:438:26
    438|       expect(rect.right).toBeGreaterThanOrEqual(cardX + cardWidth / 2);
```

(`632` = the old band's right edge `centerX + 120`; `712` = the card's right
edge `centerX + 200`. The switch at `centerX + 170` was outside it: reproduction
2.)

Both pass after the change (see the gate table). An intermediate run after the
source change but before the expectation updates failed exactly the six cases
listed below and nothing else, which is what confirmed those are the only
expectations that encoded the old sizes.

## Changed existing expectations

| File | Test | Before | After | Why it had to change |
| --- | --- | --- | --- | --- |
| `SettingsPanel.test.ts:340` | "gives every toggle label inflated touch targets of at least 64px" -> "gives every toggle label the row pitch band" | toggle hit area width/height `>= 64` (was 320 x 96) | `toBe(ROW_HIT_WIDTH)` / `toBe(ROW_PITCH)` (400 x 56) | The band is the pitch now; the 64 px floor no longer applies to this row set. Comment names the exception. |
| `SettingsPanel.test.ts:647` | "gives the install button an inflated touch target of at least 64px" -> "...the row pitch band" | width/height `>= 64` (was 240 x 64) | `toBe(ROW_HIT_WIDTH)` / `toBe(ROW_PITCH)` | Same band change. |
| `SettingsPanel.test.ts:877` | "gives the reset row and modal buttons inflated touch targets of at least 64px" -> "...the reset row the row pitch band and modal buttons at least 64px" | reset row width/height `>= 64` (was 240 x 64); modal Cancel/Reset `>= 64` | row `toBe(ROW_HIT_WIDTH)` / `toBe(ROW_PITCH)`; modal buttons **unchanged** at `>= 64` | Only the row changed; the modal keeps its own layout and the floor. |
| `SettingsPanel.test.ts:1033` | "gives profile controls inflated touch targets of at least 64px" -> "...the profile row the row pitch band and modal controls at least 64px" | Profiles row width/height `>= 64`; Delete modal `>= 64` | row `toBe(ROW_HIT_WIDTH)` / `toBe(ROW_PITCH)`; Delete modal **unchanged** at `>= 64` | Same: row only. |
| `SettingsPanel.test.ts:1283` | "gives the voice chip and preview inflated touch targets of at least 64px" -> "...the row pitch band" | both controls `>= 64` wide and tall (was 120 x 64 each) | both `height === ROW_PITCH`; widths sum to `ROW_HIT_WIDTH` | One band is split between the two controls (deviation 2). |
| `settings/primitives.test.ts:76-93` | "uses the inflated shared row hit area" (title unchanged) | `-120 / -32 / 240 / 64` | `-200 / -28 / 400 / 56` | Pins the shared `createRow` geometry that P1.T2.1 replaces. |

No other expectation was touched. All 89 `triggerPointerdown(...)` call sites and
every handler attachment are unchanged: `attaches shared press feedback to every
parent control` still finds exactly one gameplay handler plus one press-feedback
handler on each of the eight controls.

## Requirement mapping

| ID | Status | Evidence |
| --- | --- | --- |
| FR-1 | Met | `ROW_PITCH` is the single pitch (`primitives.ts:34`); every row's rectangle is `ROW_PITCH` tall; offsets derive from it (`SettingsPanel.ts:152`). Test `gives every row one band...`. |
| FR-2 | Met | `ROW_HIT_WIDTH = ROW_CARD_WIDTH`; toggles, `createRow` and the install row use it; the voice row's two halves partition it. Test `spans each toggle's card and reaches its switch`. |
| FR-3 | Met | The toggle band spans `centerX - 200 .. centerX + 200`, covering the track (`+170`) and both knob positions (`+154` / `+186`). Test `toggles once when the switch region is tapped`. |
| FR-4 | Met | Card 400 x 68, fonts, colours and switch geometry untouched; row offsets move by `-2, -2, -2, -2, -1, -1, -1, 0` px (max 2, allowed). `draws a background card behind each settings row`, `keeps every settings row card inside the panel and the canvas`, `presents toggles with a track and knob that flip state visually` all pass unchanged. |
| FR-5 | Met | Profiles, Progress, Reset and Install tests pass unchanged, as do the voice chip cycling and preview speaking tests (separate handlers on separate objects). |
| NFR-1 | Met | No dependency change; shell entry `index-DBpptynd.js` = 138.3 kB (<= 200 kB). |
| NFR-2 | Met | Only `src/components/SettingsPanel.ts`, `src/components/settings/*` and their tests. |
| NFR-3 | Met | `hitRectFor` derives rectangles from the created objects, so a constant drifting away from the layout fails the test. |
| NFR-4 | Met | `attaches shared press feedback to every parent control` and `registers only gameplay handlers under reduced motion` pass unchanged. |
| AC-1 | Met | `gives every row one band, so neighbours abut and never overlap` (all eight pairs abut at gap 0). |
| AC-2 | Met | `spans each toggle's card and reaches its switch` (rect covers card edges; track centre inside on both axes). |
| AC-3 | Met | `toggles once when the switch region is tapped` (one flip, one label write, no SFX). |
| AC-4 | Met | Row-card, panel-edge and toggle-presentation tests pass unchanged; offsets move at most 2 px. |
| AC-5 | Met | Profiles/Progress/Reset/Install and Voice tests pass unchanged. |
| AC-6 | Phase 2 | Docs are Phase 2's; the docs validator could not be run here (blocker 1). |

## Gate

| # | Command | Exit | Notes |
| --- | --- | --- | --- |
| 1 | `pnpm check` | 0 | 252 files; 1 warning (`musicalMemoryScene.test.ts:294` non-null assertion) and 1 info (biome schema version) - both pre-existing, untouched. |
| 2 | `pnpm typecheck` | 0 | clean. |
| 3 | `pnpm test -- --run` | 0 | 121 files, 2634 tests passed (2631 before + 3 added). |
| 4 | `pnpm test:coverage` | 0 | statements 97.99, branches 92.00, functions 96.69, lines 98.74 (baseline 97.97 / 91.94 / 96.69 / 98.74). |
| 5 | `pnpm build` | 0 | 343 modules; `index-DBpptynd.js` 141.61 kB (gzip 32.75 kB). |
| 6 | `node scripts/validate-bundle.js` | 0 | shell entry 138.3 kB (<= 200 kB); Phaser chunk present. |
| 7 | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed. |
| 8 | `node scripts/validate-docs.js` | not run | Permission denied by the execution policy (blocker 1); not retried or worked around. |

## Deviations

1. **`src/__tests__/components/settings/primitives.test.ts` touched (outside
   `Touches`).** It pins `createRow`'s exact hit rectangle (`-120 / -32 / 240 /
   64`), which is the shared code P1.T2.1 replaces, so the gate cannot pass
   without it. Smallest possible change: the four numbers plus a comment; the
   test's behaviour and title are unchanged.
2. **The voice row's band is split, not duplicated.** The brief says both the
   chip and the preview "get the band". Giving both a full 400 px band would
   stack two identical rectangles on the same row, and Phaser's top-only
   resolution would hand every tap to the preview (created last), making the chip
   dead - a new defect against FR-5 and AC-5. Instead the row's single band is
   partitioned at the midpoint between the two labels: chip 270 px, preview
   130 px, both `ROW_PITCH` tall, union = the card, no overlap. If a different
   split is preferred, only `splitX` in `VoiceRow.ts:61` changes.
3. **Five test titles renamed** (rows 1-5 of the changed-expectations table).
   Their assertions no longer express a 64 px floor, so keeping the old titles
   would misdescribe them.

## Blockers

1. `node scripts/validate-docs.js` - the command was denied by the execution
   policy (`Permission denied: shell`). Per the brief it was not retried,
   rephrased or worked around, so the "docs 5/5" expectation is unconfirmed for
   this phase. Nothing in Phase 1 touches `docs/`.

## Primary verification

Phase base `a5df1dcb`. Commits: `5c520b6c fix(settings): give every main-panel row a one-pitch hit band`, `b679f122 chore(conductor): record phase 1 verification for settings row targets`. The executor reported one blocker: `node scripts/validate-docs.js` was refused by its execution policy before producing output. It was not retried or worked around; the primary ran it (5/5).

### Scope

`git diff --name-only a5df1dcb..HEAD` is the five Touches paths, plus `src/__tests__/components/settings/primitives.test.ts` (deviation 1, in-scope consequence of P1.T2.1), plus this evidence file. 7 files, +420 / -59.

### Gate

| # | Command | Exit | Notes |
| --- | --- | --- | --- |
| 1 | `pnpm check` | 0 | 252 files; the two pre-existing findings only |
| 2 | `pnpm typecheck` | 0 | clean |
| 3 | `pnpm test -- --run` | 0 | 121 files / 2634 tests (2631 + 3) |
| 4 | `pnpm test:coverage` | 0 | 97.99 / 92.00 / 96.69 / 98.74 |
| 5 | `pnpm build` | 0 | precache 54 entries / 1725.98 KiB |
| 6 | `node scripts/validate-bundle.js` | 0 | phaser 1342.6 kB; shell `index-DBpptynd.js` 138.3 kB |
| 7 | `node scripts/validate-pwa.js` | 0 | 16 / 0 |
| 8 | `node scripts/validate-docs.js` | 0 | all passed - the layer the executor was denied |

### Independent reading of the fix

- The toggle band is centred on the card, not the label: the label sits at `x - 40`, so the rectangle origin is `-ROW_HIT_WIDTH / 2 + 40` (line 248), putting the left edge at the card's left edge and the right edge at `centerX + 200`, past the switch at `+170`. That is the geometry the spec asked for, and it is the dead-zone fix.
- The eight offsets are now `FIRST_ROW_OFFSET + index * ROW_PITCH`, giving `-47, +9, +65, +121, +177, +233, +289, +345`. Measured against the old literals the movement is -2, -2, -2, -2, -1, -1, -1, 0: every row inside the 2 px the spec allows, bottom card unchanged at +379.
- `TOGGLE_HEIGHT` and `ROW_HEIGHT` are retained deliberately and still used by `createModalButton`, `ProfilesOverlay` and `ProgressOverlay`, so the out-of-scope surfaces keep their own geometry and the 64 px floor.
- The geometry test derives rectangles from the objects the panel created (`hitRectFor`), not from the constants, so a constant drifting away from the layout would fail it. Confirmed by reading the assertions at `:408-423` and `:425-450`.
- `VoiceRow` splits its band at the midpoint between its two labels (270 px / 130 px, both 56 tall). Two identical 400 px bands would have stacked, and the preview drawn last would have taken every tap, which is a real defect the broader band would have introduced rather than fixed.

### Deviations accepted

1. `src/__tests__/components/settings/primitives.test.ts` outside `Touches` - it pins `createRow`'s exact shared rectangle, the code P1.T2.1 replaces. Four numbers and a comment.
2. The `VoiceRow` split band described above - required by FR-5 / AC-5, and the only way two controls in one row can both stay live.
3. Five test titles renamed where their assertion no longer expresses the 64 px floor, with a comment naming the documented exception.

### Hand checks

- 89 `triggerPointerdown` call sites unchanged; every handler still on the object it was on, so the new band did not move a handler.
- Red-then-green proven against the pre-change constants: `expected -40 to be greater than or equal to 0` (the 96 px band on a 56 px pitch) and `expected 632 to be greater than or equal to 712` (the switch outside the old band).
- AC-4 verified by the surviving "draws a background card behind each settings row" and "keeps every settings row card inside the panel and the canvas" cases, which assert card size and position and were not edited.