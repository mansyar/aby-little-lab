# Implementation Plan - Settings Row Targets

Branch: `fix/20261024-settings-row-targets`
Base: `master` @ `107404c6`

> Only the primary agent writes this file.

## Phase 1: One pitch, one band

**Goal:** Give every main-panel row a hit area exactly one pitch tall, spanning the
whole card, and derive the row positions from that pitch so the three conflicting
constants can never disagree again. A tap then lands on the row it looks like it
hit, and the switch becomes live.

**Depends on:** none

**Covers:** FR-1, FR-2, FR-3, FR-4, FR-5, AC-1, AC-2, AC-3, AC-4, AC-5

**Touches:** `src/components/settings/primitives.ts`, `src/components/SettingsPanel.ts`, `src/components/settings/InstallRow.ts`, `src/components/settings/VoiceRow.ts`, `src/__tests__/components/SettingsPanel.test.ts`

**Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`

**Status:** verified

- [x] **P1.T1: The pitch is the pitch** - covers: FR-1, FR-4
  - [x] **P1.T1.1:** In `primitives.ts` add `ROW_PITCH = 56` as the main-panel row spacing and hit height, and `ROW_HIT_WIDTH = ROW_CARD_WIDTH`, with a comment saying why: eight rows in a 760 px panel cannot each be 64 px tall, so the pitch is the only non-overlapping band available, and the width is what keeps the target generous.
  - [x] **P1.T1.2:** In `SettingsPanel.ts` derive the eight row offsets from a single first-row offset and `ROW_PITCH` (`-47, +9, +65, +121, +177, +233, +289, +345`) instead of eight literals at 55-56 px spacing. The top row moves 2 px and the bottom stays where it is; replace the stale comment at `:142-143` with one that states the pitch and the bottom-row constraint.
- [x] **P1.T2: Every row owns exactly its band** - covers: FR-1, FR-2, AC-1, AC-2
  - [x] **P1.T2.1:** Change `createRow` in `primitives.ts` to a `ROW_HIT_WIDTH` x `ROW_PITCH` hit rectangle, and change `createToggle`, `InstallRow.create` and both `VoiceRow` controls from `TOGGLE_HEIGHT`/`ROW_HEIGHT` to the same band. Keep each control's handler on the same object it is on today, so the 89 existing pointerdown taps keep working; shift only the rectangle's horizontal origin so the band is centred on the row rather than on the label (the toggle label sits at `x - 40`, so its rectangle origin moves by +40).
- [x] **P1.T3: Prove the geometry** - covers: AC-1, AC-2, AC-3
  - [x] **P1.T3.1:** Add a geometry test to `SettingsPanel.test.ts` that resolves every row's hit rectangle into panel coordinates from the objects the panel created and asserts no two rects intersect vertically (neighbours abut within 1 px), and that each toggle's rect spans the card and reaches the switch's x.
  - [x] **P1.T3.2:** Confirm the tests added in P1.T3.1 fail against the pre-change constants (record the assertion text in the evidence), then pass.
  - [x] **P1.T3.3:** Update only the assertions that encode the old sizes: the three "inflated touch targets of at least 64px" cases for toggles, rows and the install button now assert the pitch band, with a comment naming the exception and pointing at the spec. Record every changed expectation in the evidence.
- [x] **P1.T4: Nothing else changed** - covers: FR-3, FR-5, AC-4, AC-5
  - [x] **P1.T4.1:** Add a test that a tap on the switch region toggles the row exactly once — assert the handler receives it through the widened band and that the state flips once, not twice.
  - [x] **P1.T4.2:** Confirm the Profiles, Progress, Reset and Install rows still open their surfaces, and that the Voice chip and preview keep separate handlers, by running their existing tests unchanged.

**Result:** verified
**Checkpoint:** c645b4fe
**Evidence:** conductor/tracks/20261024-settings-row-targets/verification/phase-1.md
**Note:** One file outside `Touches` changed (`src/__tests__/components/settings/primitives.test.ts`) because it pins the exact shared `createRow` rectangle this phase replaces. `VoiceRow` splits its band between its two controls instead of stacking two full-width bands, which would have made the preview take every tap.

## Phase 2: The documents state the exception

**Goal:** Record what the shipped geometry is and why it departs from the 64 px
minimum, so the next reader neither "fixes" it back into overlap nor treats the
exception as an accident.

**Depends on:** Phase 1

**Covers:** FR-6, AC-6

**Touches:** `docs/TDD.md`, `docs/PRD.md`

**Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`

**Status:** in_progress

- [ ] **P2.T1: The technical record** - covers: FR-6
  - [ ] **P2.T1.1:** Rewrite the settings-row paragraph in `docs/TDD.md` (the one that currently calls `TOGGLE_HEIGHT` a hit height and `ROW_HEIGHT` a pitch): rows are `ROW_PITCH = 56` apart, each row's hit area is `ROW_HIT_WIDTH` x `ROW_PITCH` centred on the row card, the switch is inside it, and the offsets derive from the first row plus the pitch. State the reason the band is 56 tall rather than 64.
- [ ] **P2.T2: The product record** - covers: FR-6
  - [ ] **P2.T2.1:** In `docs/PRD.md` §5.2, keep 64x64 as the minimum and add the single documented exception: the eight Settings rows, where the pitch caps the band at 56 px and the 400 px width is what carries the target. One sentence, no new heading.
- [ ] **P2.T3: Gate** - covers: AC-6
  - [ ] **P2.T3.1:** Run the full chain and write `conductor/tracks/20261024-settings-row-targets/verification/phase-2.md` with the two doc diffs and the gate table.

<!--
Phase completion is recorded by the primary agent only:

**Result:** verified | failed | blocked
**Checkpoint:** <commit>
**Evidence:** conductor/tracks/20261024-settings-row-targets/verification/phase-<n>.md

`conductor-review` appends a `## Phase R1: Review Fixes` block here if needed.
-->
