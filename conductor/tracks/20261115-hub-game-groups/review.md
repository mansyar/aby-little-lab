# Review: Hub Game Groups

- **Track:** `20261115-hub-game-groups`
- **Type:** `feature`
- **Branch:** `feat/20261115-hub-game-groups`
- **Range:** `703b12ad..64268065`
- **Date:** `2026-11-15T23:40:00+11:00`
- **Verdict:** `PASS WITH FINDINGS` (round 1 — two findings, both fixable; see History)

## Summary

Every requirement in the spec is implemented, mapped to a phase, and backed by a
test or a browser journey. The heading, chip band, filtered board, glyphs, speech
and bridge all match the plan's pre-authorized decisions, and the All board is
untouched apart from the chip row. Two defects surfaced in review: a re-tap on
the already-selected chip was silent, which contradicts FR-8 read plainly, and
`HubGrid.refreshChips()` is dead code. Both are fixed in Phase 6 and re-verified.

## Verification

Reviewer runs on the reviewed range (`64268065`):

| Layer | Command | Result |
| --- | --- | --- |
| browser | `pnpm test:e2e` | pass — 22 journeys, the new `hub-groups` one included |
| test | `pnpm test -- --run` | pass — 147 files / 3,203 tests |
| coverage | `pnpm test:coverage` | pass — statements 97.39 / branches 92.07 / functions 96.4 / lines 98.35 |
| lint | `pnpm check` | pass — 323 files |
| typecheck | `pnpm typecheck` | pass |
| build | `pnpm build` + `validate-bundle.js` + `validate-pwa.js` | pass — shell entry 179.5 kB ≤ 200 kB, precache 59 entries / 1776.95 KiB, PWA 16/16 |
| docs | `node scripts/validate-docs.js` | pass — 5/5 |

Each figure is the phase-5 gate run recorded in `verification/phase-5.md`.

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1 | `hubGroups.test.ts`, `gameRegistry.test.ts` (5/5/6/4/2, two-way coverage) | covered |
| FR-2 | P2, P3 | `groupLayout.test.ts`, `groupChips.test.ts`, `hubScene.test.ts` (six chips, glyph + word, drawn All glyph) | covered |
| FR-3 | P2 | `hubGrid.test.ts` ("restores the 22-tile All board, byte-identical…", "keeps the selected group across a viewport flip") | covered |
| FR-4 | P2 | `groupLayout.test.ts` (176×196, 20px, n≤3 columns, rows centred) | covered |
| FR-5 | P1, P2 | `hubGroups.test.ts` (registry order inside a group), `hubGrid.test.ts` filtered membership | covered |
| FR-6 | P5 | `e2e/journeys/hub-groups.spec.ts` (chip, then game) | covered |
| FR-7 | P2 | `hubGrid.test.ts` ("starts the next visit on All"), no storage call asserted | covered |
| FR-8 | P4 | `hubScene.test.ts` speech test — **finding R1-F1** on a re-tap; fixed in P6 | covered after fix |
| FR-9 | P2 | `hubGrid.test.ts` (lock, page dots, board-changed notice, entrance re-arm, shelf) | covered |
| FR-10 | P3 | five SVGs, explicit shell rows, `textureTiers.test.ts`, four inventory guards restated | covered |
| FR-11 | P4 | `hubScene.test.ts` filtered ids on both layouts, `e2eBridge.test.ts` `hubGroups` | covered |
| FR-12 | P5 | README, PRD, TDD, product.md, product-guidelines.md; `validate-docs` 5/5 | covered |
| NFR-1 | P2 | `groupLayout.test.ts` (96×84 chip band, 176×196 vs 144×116, canvas bounds) | covered |
| NFR-2 | P2 | the pre-track hub/navigation assertions all still pass unchanged | covered |
| NFR-3 | P3 | 179.5 kB shell, 2.0 kB of new art, both recorded | covered |
| NFR-4 | P2 | no tween targets a chip object; selection swap is instant | covered |
| NFR-5 | P1–P5 | no dependency, storage key or network request added | covered |
| NFR-6 | P2–P5 | coverage gates hold | covered |
| AC-1..AC-10 | P1–P5 | per-phase evidence; AC-2 golden table in `hubGrid.test.ts`, AC-3/6 in the journey, AC-8 in the guards, AC-9 in the bridge tests | covered |

## Findings

### Critical

- <none>

### High

- <none>

### Medium

- **R1-F1 — the chip that is already selected went silent**
  - **File:** `src/game/hubGrid.ts` (`setGroup`), with `src/scenes/HubScene.ts` as the consumer
  - **What:** `setGroup` returned before calling `onSelectGroup` when the
    selection did not change. Tapping the current chip — including All on a
    freshly opened Hub — therefore spoke nothing, though FR-8 says a chip tap
    speaks the group's name and AC-5 is not conditioned on a change. A
    pre-reader who taps the current chip is exactly the child who wants to hear
    the name again, and the plan's "re-selecting changes nothing" line is about
    the rebuild, not about the announcement.
  - **Fix:** report the selection to the owner before the no-op guard, so the
    name is spoken on every tap while the board is still rebuilt only on a real
    change. The Phase 2 test is restated from "changes nothing" to "speaks again
    but rebuilds nothing", and a HubScene test asserts the second tap speaks.

### Low

- **R1-F2 — dead `HubGrid.refreshChips()`**
  - **File:** `src/game/hubGrid.ts`
  - **What:** no caller in `src/` or the suites; `ensureGroupChips()` already
    repaints, so the method is unreachable surface that a future reader would
    take for a supported path.
  - **Fix:** remove it.

## Accepted deviations

- **D7 says the All glyph is drawn with `Graphics`; the implementation draws
  four 12px squares.** Deliberate and documented in
  `verification/phase-2.md`: the Hub's sticker-slot and play-time suites
  recognise their own drawing surfaces as "a `Graphics` object with arcs /
  slices", and a glyph `Graphics` calling `fillStyle` would join that set. Four
  rectangles keep those predicates true and keep the chip invisible to the nav
  -tile predicates. The visual result (a 2×2 grid in outline ink) is what D7
  asks for.
- **Chip taps go through a `Zone` over a non-interactive plate**, and the chips
  carry no press squish. Logged in Phase 2: the plate-plus-`pointerup` shape is
  how five suites and the e2e bridge recognise a launchable tile, and NFR-4
  forbids the row adding a tween. Release-to-select is preserved.

## Plan compliance

All five phases executed with checkpoints `5a78c970`, `2da5a60d`, `cf47ccb1`,
`648cf374` and `b378e05b`; 14/14 tasks done, every phase gate run in its own turn
and exited 0. The deviations recorded in `decisions.md` (living-doc counts, the
`hubSceneLoad` cue filter, the fixture reader, the stale shell figures the doc
rewrite corrected) were reviewed and accepted: none changed behaviour, and none
loosened an assertion.

## Out of scope

- A sixth group or per-child ordering: the journey loops `HUB_SELECTIONS`, so a
  new group is driven automatically.
- Chip press animation: excluded by NFR-4.

## Debt

- <none>

## Doc sync

`done` — the five documents describe the groups, the chips, the two-tap rule and
the 58-key shell (Phase 5, `b378e05b`); the review fixes change behaviour only
and need no doc change.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 (full track) | PASS WITH FINDINGS | 0 | 0 | 1 | 1 | 0 |
