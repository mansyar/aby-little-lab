# Phase R2 verification - Review Fixes (round 2)

Track: `20261024-settings-row-targets`
Base: `69f4dc76` (the Phase R1 state commit)
Covered: round-2 findings F1 (High), F2 (Medium), F3 (Medium), F4 (Low), F5 (Low)

## What changed

| File | Change |
| --- | --- |
| `src/components/settings/VoiceRow.ts` | `fitBand` now takes each half's outer edge from the union of the card and the rendered label: `outerLeft = min(cardLeft, chipBounds.left)` and `outerRight = max(cardRight, previewBounds.right)`. The split clamp is unchanged. |
| `src/__tests__/components/SettingsPanel.test.ts` | `configOf` and `engineHits` hoisted to module scope so both describes can drive the real callback. The horizontal case probes the band's own edges (left+1 and right-1 true, left-1 and right+1 false) at display origins 0/65/137. The vertical case now probes one pixel inside and one outside each band edge at origins 0/11/17 across four label sizes. A new voice case drives the chip's real callback and covers the `object.input` mutation path. The split test asserts the preview's rendered extent lies inside its band and only bounds the halves by the panel. |
| `docs/TDD.md` | The `displayOrigin` sentence is scoped to single-control rows and a new clause describes the Voice row's carved band and the union of card and label. |
| `docs/PRD.md` | The Voice row paragraph says a long name is shortened and that each half covers the whole of the word drawn in it. |

## The defect F1 named

"Preview" is drawn at `previewX = x + 170` on a 26 px font, so at the project's own 13 px/char model it is about 91 px wide and ends near `x + 227`, while the card ends at `x + 200`. The band ended at `cardRight`, so the last ~15 px of the visible word belonged to no band and fell through to the backdrop, whose `pointerdown` destroys the panel. Round 1 fixed the split and the frame but left that outer edge on the card.

## Red then green

R2.T1 - restore the card edge:

```
$p='src/components/settings/VoiceRow.ts'
# outerRight: Math.max(cardRight, previewBounds.right)  ->  cardRight
…
FAIL  src/__tests__/components/SettingsPanel.test.ts > SettingsPanel TTS voice selection > splits its band where the rendered labels meet, not at their anchors
 Test Files  1 failed (1)
      Tests  1 failed | 88 skipped (89)
```

Restored: 89 passed.

R2.T2 - remove the vertical subtraction in `centredHitArea`:

```
# const y = localY - (origin.displayOriginY ?? 0);  ->  const y = localY;
FAIL  src/__tests__/components/SettingsPanel.test.ts > SettingsPanel engine hit test > gives every row the same vertical band, whatever its font size is
AssertionError: expected false to be true // Object.is equality
 Test Files  1 failed (1)
      Tests  1 failed | 88 skipped (89)
```

The round-2 review was right that the previous vertical case could not fail this way: it built its subjects from the rectangle under test and called `tapHits`, which models `Rectangle.Contains` rather than the helper's callback. The new case calls the real callback and passes display origins the helper must cancel, so deleting either subtraction now turns the suite red.

## Commands

| Layer | Command | Exit | Result |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | 252 files, 1 warning + 1 info (both pre-existing) |
| types | `pnpm typecheck` | 0 | clean |
| unit | `pnpm test -- --run` | 0 | 121 files / 2640 tests |
| coverage | `pnpm test:coverage` | 0 | 97.98 / 91.9 / 96.71 / 98.75 |
| build | `pnpm build` | 0 | precache 54 entries |
| bundle | `node scripts/validate-bundle.js` | 0 | phaser 1342.6 kB, shell `index-COHKw1P7.js` 138.8 kB |
| pwa | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| docs | `node scripts/validate-docs.js` | 0 | all checks passed |

## Requirement mapping

| Finding | Requirement | Closed by |
| --- | --- | --- |
| F1 | FR-2, FR-5 | the union outer edges in `VoiceRow.fitBand` plus the preview-extent assertion |
| F2 | NFR-3, AC-1 | the vertical case now drives the real callback at three display origins |
| F3 | NFR-3, FR-5 | the new voice case drives the chip callback and asserts the `object.input` mutation with `setInteractive` called once |
| F4 | FR-4, AC-4 | the PRD states the shortening and the whole-word coverage |
| F5 | FR-6 | the TDD scopes the 400 x 56 claim to single-control rows |

## Deviations

None. Every file touched is inside the phase's `Touches`.

## Notes for the next phase

- The default voice label now truncates at the ladder's budget on a narrow panel because the split clamps to `cardRight - 96`. That is the price of the 96 px preview floor and it is documented in the PRD.
- `VoiceRow.applyHitArea` is the only place that mutates `input` in place, because `setInteractive` keeps the first hit area it was given. The new voice case pins that, so a future refactor that replaces it with a second `setInteractive` call will fail.
- Out of this track's scope: the overlays still build centre-based rectangles by hand (`ProfilesOverlay.ts`, `ProgressOverlay.ts`, `PwaToast.ts`) and are wrong by the same mechanism. They are worth their own track.
