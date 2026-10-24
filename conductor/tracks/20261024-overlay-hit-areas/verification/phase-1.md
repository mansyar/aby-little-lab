# Phase 1 Verification — "The bands land where the drawing is"

## Base

- Phase base: `485970d2` on `fix/20261024-overlay-hit-areas`.
- Code + tests commit: `247c8567` — `fix(components): land overlay hit areas in the engine frame`.
- Evidence commit: the commit that adds this file (`docs(conductor): record overlay hit areas phase 1 evidence`).

## What changed, per file

### `src/components/PwaToast.ts`

- Imports: `import Phaser from "phaser"` → `import type Phaser from "phaser"`, plus
  `import { centredHitArea } from "./settings/primitives"` (after biome's organizeImports).
- `createButton` (~line 102): the hand-written frame was

  ```ts
  button.setInteractive({
    hitArea: new Phaser.Geom.Rectangle(
      -BUTTON_WIDTH / 2,
      -BUTTON_HEIGHT / 2,
      BUTTON_WIDTH,
      BUTTON_HEIGHT,
    ),
    hitAreaCallback: Phaser.Geom.Rectangle.Contains,
  });
  ```

  and is now

  ```ts
  button.setInteractive(centredHitArea(BUTTON_WIDTH, BUTTON_HEIGHT));
  ```

  with a comment stating that `InputManager` adds the displayOrigin before the
  callback. No button/text constants, positions, handlers or press feedback
  changed; `Phaser.Types.Tweens.TweenBuilderConfig` type uses were untouched.

### `src/components/settings/ProfilesOverlay.ts`

- Imports: value `Phaser` → `import type Phaser`; `centredHitArea` added to the
  existing `./primitives` import block (alphabetical).
- Delete button (~line 121): `new Phaser.Geom.Rectangle(-TOGGLE_WIDTH/2, -ROW_HEIGHT/2, TOGGLE_WIDTH, ROW_HEIGHT)` +
  `Phaser.Geom.Rectangle.Contains` → `remove.setInteractive(centredHitArea(TOGGLE_WIDTH, ROW_HEIGHT))` with the engine-frame comment.
- Play-time chip (~line 146): the `(-TOGGLE_WIDTH/4, -ROW_HEIGHT/2, TOGGLE_WIDTH/2, ROW_HEIGHT)` rectangle +
  `Contains` → `chip.setInteractive(centredHitArea(TOGGLE_WIDTH / 2, ROW_HEIGHT))`.
- No bands' sizes changed (240×64 and 120×64 preserved); positions, handlers,
  cycling, `onProgressReset` and press feedback untouched.

### `src/components/settings/ProgressOverlay.ts`

- Imports: value `Phaser` → `import type Phaser`; `centredHitArea` added to the
  `./primitives` import block.
- Close (~line 144): `Rectangle(-TOGGLE_HEIGHT/2, -TOGGLE_HEIGHT/2, TOGGLE_HEIGHT, TOGGLE_HEIGHT)` + `Contains`
  → `close.setInteractive(centredHitArea(TOGGLE_HEIGHT, TOGGLE_HEIGHT))`.
- Avatar chip (~line 167): the chip scale was hoisted to
  `const chipScale = 64 / AVATAR_TEXTURE_SIZE;` (same value, `chip.setScale(chipScale)`),
  and `Rectangle(-48, -48, 96, 96)` + `Contains` →
  `chip.setInteractive(centredHitArea(96 / chipScale, 96 / chipScale))`
  with a comment on the image-local frame (see Deviations — the literal
  `centredHitArea(96, 96)` keeps a 24px live zone at scale 0.25).
- Chevrons (~line 268, `addPageChevron` closure): `Rectangle(-48, -48, 96, 96)` + `Contains`
  → `chevron.setInteractive(centredHitArea(96, 96))` (unscaled Text — literal).
- Chip drawn scale, positions (`centerY - 195`, 56px pitch), handlers, paging,
  activity strip and press feedback unchanged.

### `src/__tests__/components/PwaToast.test.ts`

- New describe `PwaToast engine hit test` with the `configOf`/`engineHits`
  pattern (brought in from `SettingsPanel.test.ts`): localX/Y are computed as
  `pointer − object + displayOrigin` and the callback is called exactly as
  `InputManager.pointWithinHitArea` calls it, with `{ displayOriginX, displayOriginY }`
  as the 4th argument. Three cases (Update now / Later / OK) each assert, over
  displayOrigin triples `[0,0]`, `[wordHalf, lineHalf]`, `[137,13]`: drawn
  centre + word edges live, full 200×72 band live (inclusive edges), one pixel
  outside dead; and the 200×72 size is pinned. No mocks were edited.

### `src/__tests__/components/SettingsPanel.test.ts`

- Module scope: added helpers `engineHitsScaled` (TransformXY model: local =
  `(pointer − object) / scale + displayOrigin`, for the scaled chip image),
  `textCallArgs`, `imageCallArgs`; `AVATAR_TEXTURE_SIZE`, `PANEL_HEIGHT`
  added to the primitives import.
- Profile-management describe: new `installs the Delete band around the drawn
  word in the engine frame` (240×64 pinned; centre/word edges/band edges live,
  ±1px dead, over three displayOrigin triples).
- Play-time describe: new `cycles the limit from the whole visible chip label
  in the engine frame without closing the overlay` (120×64 pinned; engine
  probe, then a real `pointerdown` on the chip: `setText("Play Time: 30m")`,
  backdrop and panel not destroyed).
- New describe `SettingsPanel progress overlay bands`:
  - `selects a chip from a tap inside its own band (wrong-profile
    reproduction fixed)` — the live band measures local width × scale = 96
    scene px (scale 64/256); a point on cat's left flank hits cat's band and
    not dog's; the ring moves to cat; then the seam tap `seamX = (catX + dogX)/2`
    lands inside BOTH bands and the later-drawn chip (dog, `callIndex` greater)
    wins the intersection, moving the ring to dog only.
  - `covers the drawn X glyph across its 96px band with one pixel outside dead` —
    probe triples + the X still closes the overlay.
  - `covers the drawn chevron glyphs across their 96px bands with one pixel
    outside dead` — both `‹` and `›`.
- No existing test was modified; all 2640 pre-existing cases pass unchanged
  (`Changed expectations: none`).

## Commands

| # | Command | Exit | Summary |
| --- | --- | --- | --- |
| 1 | `pnpm check` | 0 | biome clean; 2 pre-existing notices (schema-version info, musicalMemory warning) |
| 2 | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| 3 | `pnpm test -- --run` (pre-fix, red proof) | 1 | 8 new failures across 2 files; 2640 existing tests pass |
| 4 | `pnpm test -- --run` (post-fix) | 0 | 121 files / 2648 tests, all pass |
| 5 | `pnpm test:coverage` | 0 | 97.98 stmts / 91.9 branch / 96.71 funcs / 98.76 lines |
| 6 | `pnpm build` | 0 | 343 modules, built in 5.35s |
| 7 | `node scripts/validate-bundle.js` | 0 | shell `index-BdGRHjBx.js` = 138.4 kB ≤ 200 kB (new fingerprint, see Notes) |
| 8 | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| 9 | `node scripts/validate-docs.js` | denied | sandbox refused — blocker below; primary runs it |

Targeted (`pnpm exec vitest run <single-file>`) runs and the requested
`pnpm exec biome check --write` were also refused by the sandbox — blockers
below; the red proof was captured through layer 3 (whole-suite run) instead.

## Red then green

Run against the **un-fixed** code with the new tests already in place
(`pnpm test -- --run`, exit 1 — 8 failed / 2640 passed):

- Toast (`PwaToast engine hit test`, all three cases, first assertion of
  `expectButtonBand`):

  ```
  AssertionError: expected undefined to be true // Object.is equality
  ```

  (the un-fixed config's `hitAreaCallback` is the mocked
  `Phaser.Geom.Rectangle.Contains`, which returns `undefined` — the displaced
  frame is hot-wired to the engine's origin-adding behaviour and never consults
  the probe's arithmetic.)

- Profiles Delete
  (`installs the Delete band around the drawn word in the engine frame`):

  ```
  AssertionError: expected undefined to be true // Object.is equality
  ```

- Profiles play-time chip (`cycles the limit ... without closing the overlay`):

  ```
  AssertionError: expected undefined to be true // Object.is equality
  ```

- Progress avatar chip
  (`selects a chip from a tap inside its own band ...`):

  ```
  AssertionError: expected 384 to be close to 96, received difference is 288, but expected 0.005
  ```

  (the un-fixed 96×96 rectangle in the image-local frame never describes a
  96px scene-space band at scale 0.25 — the displaced frame signature).

- Progress X close (`covers the drawn X glyph ...`):

  ```
  AssertionError: expected undefined to be true // Object.is equality
  ```

- Progress chevrons (`covers the drawn chevron glyphs ...`):

  ```
  AssertionError: expected undefined to be true // Object.is equality
  ```

Green after `247c8567` (`pnpm test -- --run`, exit 0):
**121 test files / 2648 tests, 0 failures** (baseline 121 / 2640, +8 new).

## FR / AC mapping

| ID | Code | Test |
| --- | --- | --- |
| FR-1 | `PwaToast.ts:102-104` — `button.setInteractive(centredHitArea(BUTTON_WIDTH, BUTTON_HEIGHT))` | `PwaToast.test.ts` › `PwaToast engine hit test` (3 cases; band pinned 200×72) |
| FR-2 | `ProfilesOverlay.ts` Delete ~:121, chip ~:146 — `centredHitArea(TOGGLE_WIDTH, ROW_HEIGHT)` / `centredHitArea(TOGGLE_WIDTH / 2, ROW_HEIGHT)` | `SettingsPanel.test.ts` › `installs the Delete band...`; › `cycles the limit...`; band sizes pinned 240×64 / 120×64 |
| FR-3 | `ProgressOverlay.ts` close ~:144, chevrons ~:268 — `centredHitArea(TOGGLE_HEIGHT, TOGGLE_HEIGHT)` / `centredHitArea(96, 96)`; chip ~:167 — `centredHitArea(96 / chipScale, 96 / chipScale)` (Deviation 1) | `SettingsPanel.test.ts` › `SettingsPanel progress overlay bands` (3 cases; X/chevron bands pinned 96×96; chip live zone 96 scene px) |
| FR-4 | All bands keep today's intended sizes (200×72, 240×64, 120×64, 96×96 live zone); every size used by the helper call is recomputed from the same constants | Size pins in each new test; existing 64px-floor tests unmodified and passing |
| FR-5 | Engine probes model `InputManager.pointWithinHitArea` (origin added pre-callback) and `TransformXY` (scale divided) | Red proof above per site group; green counts; helpers `engineHits`/`engineHitsScaled` |
| AC-1 | Toast/Delete/chip word edges inside, ±1 outside | `PwaToast engine hit test` ×3; Delete case; chip-cycle case |
| AC-2 | Chip own-band probe hits only that chip; seam hits both bands and the later-drawn chip wins (verified: `dogNow.callIndex > catNow.callIndex`); X/chevron bands across drawn glyph, ±1 outside dead | `selects a chip from a tap inside its own band...`; X case; chevron case |
| AC-3 | Chip engine probe cycles; then a dispatched `pointerdown` calls `setText("Play Time: 30m")` and the backdrop/panel rectangles were never destroyed | `cycles the limit...without closing the overlay` |
| AC-4 | Only hit-area wiring changed; constants/positions/handlers/press feedback untouched | `git diff 485970d2..247c8567` shows no geometry constant moved; all drawing assertions in existing tests pass unchanged |
| AC-5 | Red-then-green recorded above for all six sites | `## Red then green` |

NFR-1: no new dependency; helper stays in `settings/primitives.ts`; PwaToast
imports it cross-directory (`import { centredHitArea } from "./settings/primitives"`).
NFR-2: no storage change. NFR-3: entrance/press feedback code untouched
(PwaToast animateEntrance unchanged, `attachPressFeedback` calls unchanged).
NFR-5: no shared helper edited — `engineHits`/`engineHitsScaled`/arg-readers
are defined inside the two suites that use them.

## Deviations

1. **Avatar chip hit-area units** — P1.T3.1, FR-3 and the spec table say the
   chip uses the literal `centredHitArea(96, 96)`. Phaser 4.2.1's hit test
   (`InputManager.hitTest` → `TransformXY`, `node_modules/phaser/src/input/InputManager.js:935`,
   `src/math/TransformXY.js:47`) divides the tap by the drawn scale before
   `pointWithinHitArea` adds the unscaled `displayOriginX/Y` (`Origin.js:196`).
   At the chip's drawn scale `64 / AVATAR_TEXTURE_SIZE = 0.25` a literal 96×96
   local rectangle yields a **24px** live zone (half of the 64px drawn avatar),
   the seam overlap the spec accepts (96 floor > 56 pitch) would not exist, and
   the repro "right third selects the neighbour" would still reproduce. The
   chip therefore uses `centredHitArea(96 / chipScale, 96 / chipScale)` — the
   same 96×96 band measured in the frame the engine actually hit-tests, which
   is exactly FR-4's "today's intended width/height". The literal instruction
   is followed at all five scale-1 Text sites. Flags for phase 2:
   `docs/TDD.md`/`docs/PRD.md` wording for the chip should say the chip's
   rectangle lives in the image's local (pre-scale) frame.
2. **Sandbox refusals of targeted commands** — `pnpm exec vitest run
   src/__tests__/components/PwaToast.test.ts` (wanted for a per-file red run)
   and `pnpm exec biome check --write ...` (requested as `pnpm check`'s
   documented autofix) were refused by the sandbox. The red proof was captured
   through the brief's own gate layer `pnpm test -- --run` (identical
   assertions, whole suite), and `pnpm check`'s printed autofixes were applied
   to my Touches by hand, then re-verified green.

## Blockers

- `pnpm exec vitest run src/__tests__/components/PwaToast.test.ts` →
  `Permission denied: shell` (recorded after one attempt; not worked around
  beyond switching to the permitted whole-suite layer).
- `pnpm exec biome check --write src/components/PwaToast.ts src/__tests__/components/PwaToast.test.ts src/__tests__/components/SettingsPanel.test.ts src/components/settings/ProfilesOverlay.ts src/components/settings/ProgressOverlay.ts` →
  `Permission denied: shell`.
- `node scripts/validate-docs.js` → `Permission denied: shell` (expected per
  the brief; primary runs it — docs themselves are phase 2's job, so this
  gates AC-6/NFR-4, not this phase's code).

## Notes for the primary agent

- The full gate on this end: 8/9 layers green, `validate-docs.js` denied.
  Suites: 121 files / 2648 tests (+8). Coverage 97.98 / 91.9 / 96.71 / 98.76
  (lines ticked 98.75 → 98.76). Shell fingerprint is now
  `index-BdGRHjBx.js` at 138.4 kB (≤ 200 kB gate; the entry hash changed
  because the three production files moved to `import type Phaser`).
- The chip seam semantics under the fixed code: each band measures 96 scene
  px, pitch is 56, so adjacent bands overlap by 40 px; a seam tap is inside
  both bands and the later-drawn (topmost) chip wins — asserted in
  `selects a chip from a tap inside its own band...`. Phase 2's PRD wording
  ("later-drawn chip wins") stays accurate.
- The helper's callback signature is exercised with the object's
  displayOrigin supplied explicitly by the tests (the doubles report no
  `displayOrigin`), exactly as the Settings track's `engineHits` does.
- `pnpm exec biome check --write` is worth adding to the deny/deny rationale:
  precise autofixes are printed by `pnpm check` anyway, so hand-applying them
  is a deterministic fallback, but the primary may prefer to allow the
  write form.
## Primary verification

Primary append after independent re-verification (executor session
`ses_e924e982fffez28D2vqwJFGLJl`).

Base `485970d2`. Commits in range: `247c8567 fix(components): land overlay hit
areas in the engine frame` and this file's evidence commit. `git status` clean;
`git diff --name-only 485970d2..HEAD` is exactly the six Touches files plus
this evidence document.

### Gate layers (run by the primary, fullest form)

| # | Layer | Exit | Reading |
| --- | --- | --- | --- |
| 1 | `pnpm check` | 0 | 252 files; only the two pre-existing findings |
| 2 | `pnpm typecheck` | 0 | clean |
| 3 | `pnpm test -- --run` | 0 | 121 files / 2648 tests (**+8** over the 2640 baseline) |
| 4 | `pnpm test:coverage` | 0 | 97.98 / 91.9 / 96.71 / 98.76 |
| 5 | `pnpm build` | 0 | precache 54 entries, 1726.08 KiB |
| 6 | `node scripts/validate-bundle.js` | 0 | phaser vendor present; shell `index-BdGRHjBx.js` 138.4 kB <= 200 kB |
| 7 | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| 8 | `node scripts/validate-docs.js` | 0 | **All document validation checks passed** (the blocked layer) |

### Independent code read

- All six sites route through `centredHitArea()`; the five scale-1 Text sites
  take the literal perimeter sizes (240x64, 120x64, 200x72, 96x96), and every
  drawn position, handler and press-feedback call is byte-identical to before.
- Deviation 1 was re-derived from Phaser source before acceptance, not taken on
  trust: `InputManager.hitTest` runs `TransformXY` with the object's scale
  (`node_modules/phaser/src/input/InputManager.js:935`) so an Image tap is
  divided by the drawn scale before `pointWithinHitArea` adds the unscaled
  origin. At chipScale 64/256 = 0.25, a literal 96x96 local rectangle *is* the
  old defect in a new costume (24 px live zone inside a 64 px avatar). The
  implemented `centredHitArea(96 / chipScale, ...)` yields exactly 96 scene px
  per side; the new test pins it by arithmetic
  (`config.hitArea.width * scale` close to `96`).
- Test architecture: `engineHitsScaled` models both engine steps (TransformXY
  scale divide, then origin add) and the origin-variation loops (0 / realistic
  / 137x13) make the frame correctness origin-invariant rather than
  coincidence-at-one-value.

### Mutation check (beyond the executor's red proof)

`centredHitArea(BUTTON_WIDTH + 4, BUTTON_HEIGHT)` in `PwaToast.ts` ->
`PwaToast.test.ts` fails 3/14 with
`AssertionError: expected 204 to be 200` x3; restored byte-identical
(`git diff --stat` empty). The suite observes the production config, not its own
stubs.

### Red proof (pre-fix, whole-suite run, 8 failed / 2640 passed)

Verbatim, from the executor's evidence (reproduced here for the phase record):
toast / Delete / chip / X / chevron cases all failed
`AssertionError: expected undefined to be true` (the un-fixed config carries
the mocked `Contains`, so the displaced frame never consults the probe), and
the progress chip failed `AssertionError: expected 384 to be close to 96`
(the un-fixed 96x96 local rectangle never describes a 96 px scene-space band).

### Spec nuance to correct (AC-3 wording, in phase 2 alongside the docs)

The 120 px chip band intentionally ends inside the ~182 px drawn
"Play Time: 15m" label (FR-4 keeps today's size), so "the whole visible label"
over-promises: what the fix guarantees is the drawn label's right-third aim
point (45 px of half-width - where a thumb lands) is live and the seam does
not close the overlay, which is exactly what AC-3's test asserts. The spec's
AC-3 gets a one-clause Correction (R1) during phase 2 rather than a rewritten
guarantee.

### Accepted deviations

1. Avatar chip units (above) - accepted; flagged to phase 2 wording.
2. Red proof captured through the whole-suite layer because targeted vitest
   was sandbox-denied - allowed by the brief's own gate layers.
3. `pnpm exec biome check --write` denied; autofixes hand-applied from
   `pnpm check` output and re-verified - acceptable, deterministic.
