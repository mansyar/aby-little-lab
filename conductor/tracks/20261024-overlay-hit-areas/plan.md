# Implementation Plan: Overlay Hit Areas

Branch: `fix/20261024-overlay-hit-areas`
Base: `master`

> This file is the execution roadmap. Only the primary agent writes it —
> executors work from phase briefs and never edit this file.

## Phase 1: The bands land where the drawing is

**Goal** - Route all six defect sites through `centredHitArea()` so the
described rectangle is the live zone in the engine's frame, and pin each site
with an engine-accurate regression test (word/avatar edges live, one step
outside dead, red proof recorded).

**Depends on**: none.

**Covers**: FR-1, FR-2, FR-3, FR-4, FR-5; AC-1, AC-2, AC-3, AC-4, AC-5;
NFR-1, NFR-2, NFR-3, NFR-5.

**Touches**: `src/components/PwaToast.ts`,
`src/components/settings/ProfilesOverlay.ts`,
`src/components/settings/ProgressOverlay.ts`,
`src/__tests__/components/PwaToast.test.ts`,
`src/__tests__/components/PwaToasts.test.ts`,
`src/__tests__/components/SettingsPanel.test.ts`,
`conductor/tracks/20261024-overlay-hit-areas/verification/*`.

**Verification** - `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm
test:coverage && pnpm build && node scripts/validate-bundle.js && node
scripts/validate-pwa.js && node scripts/validate-docs.js`

**Status: verified**

- [x] **P1.T1: The toast buttons sit in the engine frame**
  - [x] **P1.T1.1:** Replace `PwaToast.createButton`'s hand-written rectangle
        with `centredHitArea(BUTTON_WIDTH, BUTTON_HEIGHT)` (import from
        `./settings/primitives`); remove the now-unused direct `Phaser.Geom`
        wiring if it has no other consumer in the file. *(Landed; file now
        type-imports Phaser only.)*
  - [x] **P1.T1.2:** In `PwaToast.test.ts` add an engine-accurate regression
        describe: probe each button's drawn word centre and drawn edges live,
        one pixel outside the intended band dead; prove at least one assertion
        red against the un-fixed code first and record the fixture. *(Three
        cases over origin triples; red = `expected undefined to be true`.)*
- [x] **P1.T2: The Profiles overlay rows sit in the engine frame**
  - [x] **P1.T2.1:** Route the Delete button through
        `centredHitArea(TOGGLE_WIDTH, ROW_HEIGHT)` and the play-time chip
        through `centredHitArea(TOGGLE_WIDTH / 2, ROW_HEIGHT)`, keeping
        handlers, press feedback and drawn positions untouched.
  - [x] **P1.T2.2:** In `SettingsPanel.test.ts` extend the overlay cases: the
        whole visible "Play Time: 15m" label cycles the limit and never closes
        the overlay (AC-3), and the Delete band is the installed rectangle in
        the engine frame; keep the existing handler-based cases untouched.
        *(Landed as the right-third aim point: the 120 px band ends inside the
        ~182 px drawn label by design; DISPATCHED pointerdown sets
        `setText("Play Time: 30m")` and the backdrop survives. Spec AC-3 gets
        a Correction (R1) clause in phase 2.)*
- [x] **P1.T3: The Progress overlay rows sit in the engine frame**
  - [x] **P1.T3.1:** Route the "X" close and both chevrons through
        `centredHitArea(TOGGLE_HEIGHT, TOGGLE_HEIGHT)` and the avatar chip
        through `centredHitArea(96, 96)` — same rule for the Image: band
        centred on the drawn avatar. *(Landed as Deviation 1: the chip's
        rectangle lives in the image-local frame, so the call is
        `centredHitArea(96 / chipScale, 96 / chipScale)` — the engine divides
        the tap by drawn scale (InputManager.js:935 TransformXY) before the
        callback, and a literal 96x96 local rect on a 0.25-scaled image leaves
        a 24px live zone inside the drawn avatar. The scene-space band is the
        intended 96x96. Accepted after primary re-derivation from Phaser
        source.)*
  - [x] **P1.T3.2:** In `SettingsPanel.test.ts` add the chip-band probes: a tap
        inside one chip's band selects that chip (wrong-profile reproduction
        fixed), a tap exactly at the seam selects the later chip (accepted
        overlap), and the X/chevron bands respond across their drawn glyph.
        *(Landed: `engineHitsScaled` models TransformXY + origin; own-band vs
        seam both asserted with the later-drawn chip winning; X closes the
        overlay after probes.)*
- [x] **P1.T4: Gate and evidence**
  - [x] **P1.T4.1:** Run the nine-layer verification chain, record the
        red-then-green proof and the per-site mapping in
        `verification/phase-1.md`; layers blocked by the sandbox are named in
        the report so the primary can run them. *(8/9 green for the executor;
        the primary ran all — docs 5/5 — and added a mutation check:
        `BUTTON_WIDTH + 4` fails 3/14 with `expected 204 to be 200`.)*

**Result: verified**
**Checkpoint: 88207888**
**Evidence: conductor/tracks/20261024-overlay-hit-areas/verification/phase-1.md**

<!-- primary-note: Phase 1 numbers: 121 files / 2648 tests (+8); coverage
97.98 / 91.9 / 96.71 / 98.76; shell index-BdGRHjBx.js 138.4 kB <= 200 kB; PWA
16/16; docs 5/5 (the executor was denied that layer; primary ran it). -->


## Phase 2: The record says what the frame is

**Goal** - Documents describe the rule behind the fix: custom hit areas go
through the origin-cancelling helper, and the accepted chip overlap states its
mechanism, not just its symptom.

**Depends on**: Phase 1.

**Covers**: AC-6; NFR-4.

**Touches**: `docs/TDD.md`, `docs/PRD.md`,
`conductor/tracks/20261024-overlay-hit-areas/verification/*`.

**Verification** - `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm
test:coverage && pnpm build && node scripts/validate-bundle.js && node
scripts/validate-pwa.js && node scripts/validate-docs.js`

**Status: pending**

- [ ] **P2.T1: The documents name the frame rule**
  - [ ] **P2.T1.1:** Update the affected `docs/TDD.md` component rows
        (`PwaToast.ts`, `ProfilesOverlay.ts`, `ProgressOverlay.ts`) with one
        sentence establishing that every custom hit area of these controls
        goes through `centredHitArea()`; keep row format and column alignment.
  - [ ] **P2.T2.1:** Extend `docs/PRD.md` section 5.2 minimally: all custom
        hit areas in the app use the origin-cancelling helper, and the
        Learning Progress chip seam's overlap (96 px floor on a 56 px pitch)
        is accepted; later-drawn chip wins.
  - [ ] **P2.T3.1:** Run the nine-layer verification chain and record the AC-6
        evidence in `verification/phase-2.md`.

## Notes for the primary agent

- Executor sandboxes routinely refuse `node scripts/validate-docs.js` (and
  sometimes the whole chained gate): run each layer as a separate command when
  a chain is denied, and continue with the remaining layers; the primary
  closes the gaps.
- `centredHitArea` already compensates `displayOrigin` inline (it does not
  call `Phaser.Geom.Rectangle.Contains`); the suites' Phaser mock makes the
  helper's callback return values observable only through the real arithmetic
  — mirror the `engineHits` pattern that Settings used.
- The helper lives in `src/components/settings/primitives.ts`; `PwaToast` is
  one directory up (`../settings/primitives`). Do not move the helper.
- The Settings suite mocks `scene.add.image` too; chip-band probes need the
  same `getBounds`-style stubbing discipline as text probes if positions are
  read from created objects.
- Expected suite baseline at track start: 121 files / 2640 tests; the bundle
  shell fingerprint may change with any production edit — a changed fingerprint
  alone is not a regression, re-measure against the 200 kB gate.
