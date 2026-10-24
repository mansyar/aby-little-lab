# Phase R1 verification - Review fixes F1-F6

Track: `20261024-settings-row-targets`
Branch: `fix/20261024-settings-row-targets`
Phase base: `e3cb69aa971eda38fe2b46316851ef7475fdc86a`
Executed: 2026-10-24

## Result

The six review findings are implemented: F1 (the voice row's band split), F2
(its test), F3 (the ✕ above the rows that share its corner), F4 and F5 (the two
residuals now stated in the TDD paragraph), F6 (the PRD exception names the
three toggles).

**Nothing in this phase was executed.** The `shell` tool in this environment
permits `git` only; every other command is rejected before it runs:

```json
{"error":{"type":"permission.rejected","message":"Permission denied: shell"}}
```

That refusal is identical for the whole verification chain
(`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage &&
pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js &&
node scripts/validate-docs.js`), for each command run alone, and for
`pnpm --version` and `node --version`. So there is **no red-then-green transcript,
no test count, no coverage figure and no gate result in this file** - only
hand-derived values, labelled as such, and a gate table that says "not run".
Per the brief, the refusal is recorded under Blockers rather than worked around.
The primary must run the gate before this phase can be called verified.

## The fix, and the numbers it produces

`VoiceRow.fitBand()` (new, `src/components/settings/VoiceRow.ts:167-230`) owns the
whole geometry, and `create`, the chip's `pointerdown` cycle and `voiceChanged`
all call it, so the three paths cannot diverge:

1. Both labels are created first (`:99-120`). The chip's label is written at
   `VOICE_LABEL_MAX`, then `fitBand` measures.
2. `splitFor(right)` (`:192-194`) is the brief's boundary: midpoint of the gap
   between `chip.getBounds().right` and `preview.getBounds().left`, clamped into
   `[cardLeft + 96, cardRight - 96]`.
3. While the chip's rendered right edge still crosses that boundary, the
   truncation budget drops 2 characters at a time, floor `VOICE_LABEL_MIN = 8`
   (`:197-206`). The extents are re-measured inside the loop, so the shrink reacts
   to what the shorter label actually renders to.
4. Both hit rectangles are set from the result (`:212-229`). `applyHitArea`
   (`:245-254`) assigns `object.input.hitArea` when the object is already
   interactive, because Phaser's `InputPlugin.enable` only re-enables an existing
   interactive object and never replaces its hit area
   (`node_modules/phaser/src/input/InputPlugin.js:930-951`).
5. `renderedBounds` (`:51-54`) is the capability guard: no `getBounds` on the
   object means the anchor midpoint, the brief's explicit fallback. That is what
   the panel's and the row's existing doubles model, so their suites keep their
   meaning.

Worked values for the panel's 1024x768 scene (centre 512/384, voice row at
`centerY - 47 + 7 * 56 = 729`; card `312..712`; chip anchor `482`, preview anchor
`682`; 26 px labels laid out at 13 px per character by the new test's stub):

| Case | Old split (anchors) | Rendered extents | New split | Bands |
| --- | --- | --- | --- | --- |
| Default voice, 22 char label | `582`; chip `312..582` (270), preview `582..712` (130) | chip `339..625`, preview `636.5..727.5` | gap midpoint `630.75`, clamped to `616`; chip still `625 > 616`, so the budget walks 22 → 20 → 18 → 16 (no change) → 14 → label `Voice: Default (devi…` | chip `312..616` (304), preview `616..712` (96) |
| Short voice, `Voice: en-US — Zoe` | `582` | chip `378..586`, preview `636.5..727.5` | `611.25`, inside the clamp, no shrink | chip `312..611.25` (299.25), preview `611.25..712` (100.75) |
| Doubles (no `getBounds`) | `582` | none | `582` | chip `312..582` (270), preview `582..712` (130) - unchanged |

The old split fails both ways F1 describes: the chip's half ended at `582` while
its own text ran to `625`, so 43 px of the chip's label activated Preview, and
Preview's right edge reached `727.5`, 15.5 px past the card at `712` and onto the
backdrop that closes the panel. The new split puts the boundary in the gap
(`616`, between `612` and `636.5` after the shrink) and both halves stay inside
`312..712` at ≥ 96 px.

### Visual change - the one the brief allows

FR-4 ("no visual change") has exactly one exception here, and it is this: for a
long voice label the chip now renders a **shorter label** than before, because
the fit pass truncates until the text clears the boundary. With the stub's 13 px
advance the default voice becomes `Voice: Default (devi…` where it used to be
`Voice: Default (device)`. Fonts, colours, positions and every other label are
untouched. With the real Baloo advance the same rule applies at whatever width
the font reports; the rule is "shorten only while the measured extent collides",
so a label that already fits is written back unchanged (proved by the second new
test).

### The hit-area frame, and why the rectangle origin moved

`InputManager.pointWithinHitArea` adds the object's `displayOrigin` before
testing a custom area (`node_modules/phaser/src/input/InputManager.js:963-971`),
so a custom rectangle is measured from the object's **top-left**, not its centre.
`getBounds().left` is exactly that origin for an unscaled text object, so the
measured path uses it (`chipLeft`, `previewOrigin`, `:183-211`) and the band a
tap actually hits is `[cardLeft, splitX]` / `[splitX, cardRight]` in scene
coordinates - which is what the brief and the docs describe. The fallback path
keeps the anchor-relative origin the doubles model, byte-identical to the old
rectangles. The vertical origin is left at the row anchor in both paths
(`:209-210`), so this change is horizontal only and does not disturb the pitch
model F5 is about.

## Code diffs

### `src/components/settings/VoiceRow.ts`

```diff
+/** Shortest truncation budget the fit pass may shrink to, and its step. */
+const VOICE_LABEL_MIN = 8;
+const VOICE_LABEL_STEP = 2;
+/**
+ * Narrowest either half of the split band may become. Both halves are clamped
+ * by this, so neither control is starved and neither band leaves the card.
+ */
+const VOICE_MIN_HALF = 96;
+
+/** The row's fixed geometry, captured at create so both paths share it. */
+interface VoiceRowBand {
+  cardLeft: number;
+  cardRight: number;
+  chipX: number;
+  previewX: number;
+}
+
+function renderedBounds(object: Phaser.GameObjects.Text): Phaser.Geom.Rectangle | null {
+  const measure = (object as { getBounds?: () => Phaser.Geom.Rectangle }).getBounds;
+  return typeof measure === "function" ? measure.call(object) : null;
+}
+
+function clampSplit(value: number, min: number, max: number): number {
+  return Math.min(Math.max(value, min), max);
+}
...
   create(x: number, y: number): void {
     this.syncVoiceSelection();
     addRowCard(this.deps.scene, x, y, this.deps.bucket);
-    const chipX = x - 30;
-    const previewX = x + 170;
-    const cardLeft = x - ROW_HIT_WIDTH / 2;
-    const cardRight = x + ROW_HIT_WIDTH / 2;
-    // The row carries two controls, so it shares one band: the split is the
-    // midpoint between the two anchors and both halves stay live.
-    const splitX = (chipX + previewX) / 2;
-    const chip = ... .setOrigin(0.5);
-    chip.setInteractive({ hitArea: new Phaser.Geom.Rectangle(cardLeft - chipX,
-      -ROW_PITCH / 2, splitX - cardLeft, ROW_PITCH), ... });
+    const chipX = x + VOICE_CHIP_OFFSET;
+    const previewX = x + VOICE_PREVIEW_OFFSET;
+    this.band = { cardLeft: x - ROW_HIT_WIDTH / 2, cardRight: x + ROW_HIT_WIDTH / 2, chipX, previewX };
+    // Both labels exist before the band is split: the split follows what they
+    // render to, not where their anchors sit.
+    const chip = ...;
+    const preview = ...;
+    this.chip = chip;
+    this.preview = preview;
+    this.fitBand();
     chip.on("pointerdown", () => {
       ...
       setPreferredVoiceURI(next.voiceURI);
-      chip.setText(`Voice: ${truncateLabel(next.label)}`);
+      this.fitBand();
     });
...
+  private fitBand(): void {
+    ...
+    this.setChipLabel(VOICE_LABEL_MAX);
+    const previewBounds = renderedBounds(preview);
+    const initialChipBounds = renderedBounds(chip);
+    let chipLeft = chipX;
+    let splitX = (chipX + previewX) / 2;
+    if (initialChipBounds && previewBounds) {
+      chipLeft = initialChipBounds.left;
+      let chipRight = initialChipBounds.right;
+      const splitFor = (right: number): number =>
+        clampSplit((right + previewBounds.left) / 2, minSplit, maxSplit);
+      splitX = splitFor(chipRight);
+      let budget = VOICE_LABEL_MAX;
+      while (chipRight > splitX && budget > VOICE_LABEL_MIN) {
+        budget = Math.max(budget - VOICE_LABEL_STEP, VOICE_LABEL_MIN);
+        this.setChipLabel(budget);
+        const measured = renderedBounds(chip);
+        if (!measured) break;
+        chipLeft = measured.left;
+        chipRight = measured.right;
+        splitX = splitFor(chipRight);
+      }
+    }
+    const previewOrigin = previewBounds ? previewBounds.left : previewX;
+    this.applyHitArea(chip, new Phaser.Geom.Rectangle(cardLeft - chipLeft,
+      -ROW_PITCH / 2, splitX - cardLeft, ROW_PITCH));
+    this.applyHitArea(preview, new Phaser.Geom.Rectangle(splitX - previewOrigin,
+      -ROW_PITCH / 2, cardRight - splitX, ROW_PITCH));
+  }
```

### `src/components/SettingsPanel.ts`

```diff
@@ -160,6 +160,12 @@ export class SettingsPanel {
     this.installRow.create(centerX, rowY(6));
     this.voiceRow.create(centerX, rowY(7));
+    // The ✕ box overlaps the BGM band's top-right corner, and the rows are
+    // created after the ✕, so at equal depth the row would win that corner and
+    // toggle music. Raising the ✕ above the rows settles it - and only above
+    // the rows: the overlays open later and must still cover it, which a depth
+    // above theirs would break.
+    this.scene.children.bringToTop(closeButton);
```

`bringToTop` rather than `setDepth(1)`: depth 1 would also outrank the overlays,
which open later and at depth 0, and no depth is used anywhere in
`src/components/settings/`. Display order is raised once, after the last row
exists, so no row created later can cover the ✕.

## Test diffs - `src/__tests__/components/SettingsPanel.test.ts`

- `MockScene` gains `children: { bringToTop: MockFn }` and `createScene` gains
  `children: { bringToTop: vi.fn() }`. Nothing else in the file uses `children`,
  and no other suite builds this double (production constructs the panel only in
  `HubScene.ts:235`), so the change is additive for all 81 panel tests.
- New helpers: `Bounds`/`MeasurableText`, `GLYPH_WIDTH = 13`, `LINE_HEIGHT = 34`,
  `measureVoiceText(scene)` (replaces `scene.add.text` with a double whose
  `getBounds` follows `setText`, for the two voice labels only),
  `measuredHitRect` (resolves a rect the way the engine does, from the extent's
  left/top), and `lastRowCard` (the 400x68 card args, for the card bounds).
- The width-sum test is replaced by **"gives the voice chip and preview halves
  that abut inside the card"**: `chipRect.right === previewRect.left`, each band
  `ROW_PITCH` tall, each `>= 96` wide, both inside the card on both axes.
- **"splits its band where the rendered labels meet, not at their anchors"**
  (R1.T1.2): chip right `>=` its own extent's right, boundary `<=` the preview's
  left, both bands `>= 96` and inside the card, and the chip's extent wholly
  inside the chip's half.
- **"leaves a chip label whole when its extent already fits its half"**: no
  `setText` call ever writes anything but the full label, and the extent sits
  inside its half (the shrink must not fire when it is not needed).
- **"keeps the close button above the rows that share its corner"** (R1.T3.1):
  the BGM band and the ✕ box are asserted to genuinely overlap on both axes
  (`left < ✕.right`, `right > ✕.left`, `top < ✕.bottom`, `bottom > ✕.top`), then
  `children.bringToTop` is asserted to have been called with the ✕ and to have
  been called after the last row's creation.

## Red then green - derived, not executed

No command could be run, so these are hand-derived from the doubles' arithmetic
and the source at each commit. They are the assertions that must flip; they are
**not** quoted output.

| Test | At `e3cb69aa` (with this test file) | At `8fbfe9f3` |
| --- | --- | --- |
| splits its band where the rendered labels meet | chip band resolves to `169..439` (old midpoint origin + pre-fix rect), so `chipRect.right (439) >= chipExtent.right (625)` fails - the chip's own label is three-quarters of a label outside its half - and `left (169) >= cardLeft (312)` fails | chip band `312..616`, extent `352..612`: every assertion holds, and the boundary `616` lies between `612` and `636.5` |
| keeps the close button above the rows | `expect(scene.children.bringToTop).toHaveBeenCalledWith(close)` fails with zero calls; the overlap assertions pass, which is the point - the corner is decided by order | one call, after the voice chip's creation |
| halves that abut inside the card | passes both sides (the doubles take the fallback path, so the bands are `312..582` / `582..712` before and after) | same |

The third row is deliberate: R1.T2.1 replaces an assertion that no longer says
anything F2 cares about, not a defect that was red.

## Gate - not run

| # | Command | Exit | Notes |
| --- | --- | --- | --- |
| 1 | `pnpm check` | - | Not run: `shell` refuses non-git commands (`permission.rejected`). |
| 2 | `pnpm typecheck` | - | Not run, same refusal. |
| 3 | `pnpm test -- --run` | - | Not run, same refusal. |
| 4 | `pnpm test:coverage` | - | Not run, same refusal. |
| 5 | `pnpm build` | - | Not run, same refusal. |
| 6 | `node scripts/validate-bundle.js` | - | Not run, same refusal. |
| 7 | `node scripts/validate-pwa.js` | - | Not run, same refusal. |
| 8 | `node scripts/validate-docs.js` | - | Not run, same refusal. |

Because no command ran, this phase carries no evidence about type, lint,
formatting, tests, coverage or the bundle. What can be checked by reading:
imports are unchanged in kind (`Phaser` stays a value import; `type ObjectBucket`
is inline, matching the file's existing style), no new file was added, no
dependency changed, and the docs edits are inside existing paragraphs (no
heading, list, link or anchor), so `validate-docs`'s invariants have nothing new
to resolve.

## Findings closed

| Finding | Fix | Where |
| --- | --- | --- |
| F1 (High) - the split ignores what the labels render to, so the chip's tail activates Preview and Preview's right edge lands on the backdrop | Boundary from the measured extents, clamped to `[cardLeft + 96, cardRight - 96]`, chip budget shortened only while it collides, both rects recomputed after every label change, measured-extent origins so the band lands on the card | `VoiceRow.ts:167-230`, `:51-54`, `:245-254` |
| F2 (Medium) - the four `>= 64` assertions became a height pair and a width sum | Per-band `>= 96`, abutment, both rects inside the card, label inside its own half, via stubbed `getBounds` | `SettingsPanel.test.ts` "gives the voice chip and preview halves that abut inside the card", "splits its band where the rendered labels meet", "leaves a chip label whole…" |
| F3 (Low) - the ✕ loses a 44x18 corner of its box to the BGM band | `children.bringToTop(closeButton)` after the last row; geometry test proves the overlap and the ordering | `SettingsPanel.ts:163-168` |
| F4 (Low) - the band stops 2 px short of the centred 64 px track | Stated in the TDD paragraph: the track centred `170` reaches 2 px past the band edge, the one part of the row a tap does not reach | `docs/TDD.md:609` |
| F5 (Low) - cards 68 px on a 56 px pitch leave a 6 px strip that activates the upper row | Stated in the TDD paragraph, with the 12 px lap and the reason (the pitch trade) | `docs/TDD.md:609` |
| F6 (Low) - the exception could read as contradicting the protected-control rule | The exception now says it covers the three Settings toggles, Music, Sounds and Adaptive, and that a toggle's target is its row | `docs/PRD.md:466` |

## FR / AC map

| Requirement | Status | Note |
| --- | --- | --- |
| FR-2 (each row's band spans its card; the voice row's two controls share it) | Covered | Voice bands `312..616` / `616..712` inside the `312..712` card, both `>= 96` wide and `ROW_PITCH` tall; asserted in two tests. |
| FR-4 (no visual change) | Covered, one stated exception | Fonts, colours, positions and every other label unchanged; a colliding chip label is truncated shorter, which the brief permits and this file records. |
| FR-5 (Voice chip cycles, preview speaks, separately) | Covered | The two `pointerdown` handlers stay where they were; only the geometry call inside the chip's handler changed. `VoiceRow.test.ts` and the panel's cycle/wrap/Preview tests exercise both. |
| FR-6 (64 px default, exception documented) | Covered | PRD §5.2 states the exception and which toggles it covers. |
| AC-2 (a tap on a row hits that row's control) | Covered by reading, unverified by execution | Boundary now sits in the gap between the labels in the measured path. |
| AC-5 (docs and code agree) | Covered | TDD's voice-row sentence, the 2 px overhang and the 6 px seam; the claim-to-code table for the rest is in `phase-2.md`. |

## Blockers

1. `shell` refuses every non-git command (`permission.rejected`), so the whole
   verification chain, each command alone, and the three doc/bundle validators
   are unrun. This phase cannot be reported verified on evidence; the primary has
   to run the gate.

## Open question for the primary

`src/__tests__/helpers/hitTest.ts` documents, and `SpeakerButton.ts:49` uses, the
convention that a Phaser custom hit area is measured from the object's
**top-left** (`displayOrigin` added before the callback). The panel's
`hitRectFor` helper resolves rects from the object's **centre** instead. If that
helper is the only reason the other seven rows look right, then in the engine
those bands sit half a label width to the left of their cards, which would be a
separate defect from F1-F6 and outside this phase's `Touches`. The voice row is
now measured-extent-based on both axes' origins for x, so it does not depend on
that question; the other seven still do. Worth a check (and a new track if it
holds) rather than a silent change here.

## Rework 2: the hit frame itself was wrong (primary)

The executor's sandbox permitted `git` only - `pnpm`, `node` and the validators were
rejected before execution - so it could not run the gate and could not test its own
frame model. Its `fitBand()` work measured the VoiceRow split from `getBounds()`
horizontally while keeping `-ROW_PITCH / 2` vertically, which mixes two coordinate
frames that only coincide in the test doubles, because those report no extents.

### What the engine actually does

`InputManager.pointWithinHitArea` (`node_modules/phaser/src/input/InputManager.js`,
lines 966-967) adds `gameObject.displayOriginX/Y` to the local pointer before it calls
the hit-area callback. For a `Text` with `setOrigin(0.5)` the display origin is half
the rendered label, so every centre-based rectangle in this panel was really shifted
left by half a label width and up by half a text height. The repository's own
`src/__tests__/helpers/hitTest.ts` models this correctly; the geometry test helper
did not.

Consequence measured against the code: the toggle band written as
`-200..+200` around the row centre was, in the engine, about
`x - 200 - w/2 .. x + 200 - w/2` - which is why the switch at `x + 170` stayed dead
even after the band was widened to the whole card, and why the reviewer's VoiceRow
finding survived a fix that looked right in the tests.

### The fix

`centredHitArea(width, height, offsetX, offsetY)` in `settings/primitives.ts` builds
the same rectangle the panel already used and supplies a callback that subtracts
`displayOrigin` back out before testing. A rectangle written around the object's
position is then the rectangle the player touches, whatever the label says, and
nothing has to be measured at runtime.

Applied at every custom hit area in this track's Touches: `createRow`,
`createModalButton`, the panel close button and toggle, `InstallRow`'s button and
how-to close button, and both `VoiceRow` halves (whose rectangles are now written in
the position frame: `cardLeft - chipX`, `splitX - previewX`). `VoiceRow`'s measured
split and truncation ladder stay - they solve label overlap, which is a different
problem - but the redundant texture-space reasoning is gone.

### Red then green

Removing the two subtractions from the callback fails the new engine test:

```
FAIL  SettingsPanel.test.ts > SettingsPanel engine hit test > puts a band in the same place whatever the label's display origin is
Tests  1 failed | 87 skipped (88)
```

Restoring them passes. The case probes the callback at three points with display
origins of 0, 65 and 137 (a narrow label, a wide one and a wider one) and requires
the same answers, which is exactly the invariance the old code lacked; a second case
walks the three toggle bands through `tapHits` and requires the pixel above each
band's top edge to belong to the upper row only.

### Gate at this HEAD

| # | Layer | Command | Exit | Reading |
|---|-------|---------|------|---------|
| 1 | Static analysis | `pnpm check` | 0 | 252 files; 1 warning + 1 info, both pre-existing |
| 2 | Types | `pnpm typecheck` | 0 | - |
| 3 | Unit | `pnpm test -- --run` | 0 | 121 files / 2639 tests |
| 4 | Coverage | `pnpm test:coverage` | 0 | 97.92 / 91.82 / 96.71 / 98.70 |
| 5 | Build | `pnpm build` | 0 | precache 54 entries (1726.47 KiB) |
| 6 | Bundle | `node scripts/validate-bundle.js` | 0 | phaser 1342.6 kB; shell `index-DPY7TKVu.js` 138.8 kB |
| 7 | PWA | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| 8 | Docs | `node scripts/validate-docs.js` | 0 | 5 passed |

`docs/TDD.md` gained one sentence naming `centredHitArea()` and why the engine needs
it, so the recorded mechanism matches the code.
