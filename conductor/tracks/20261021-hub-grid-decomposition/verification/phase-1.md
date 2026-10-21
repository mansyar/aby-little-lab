# Phase 1 Verification — Hub Grid Decomposition

- **Track:** 20261021-hub-grid-decomposition — Hub Grid Decomposition
- **Phase:** 1 — Map concerns & establish the hub module foundation
- **Date:** 2026-10-21
- **Branch:** `refactor/20261021-hub-grid-decomposition`
- **Base commit:** `fd389db`
- **Head commit (code):** `e2b3a7b` (evidence committed separately afterwards)
- **Result:** **verified**

## Result summary

`src/game/hub/` created with the shared constants module; grid layout math and
the entrance pop / breathe-bob animations extracted into
`src/game/hub/gridLayout.ts` behind the `hubGrid.ts` orchestrator. Public
exports of `hubGrid.ts` (`HubGrid`, `HubGridDeps`) unchanged; `HubScene.ts`
untouched; every pre-existing test assertion kept (only new tests added).
Full verification chain green.

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| Static lint/format | `pnpm check` | 0 | Biome clean for all changed files; 1 pre-existing warning (`musicalMemoryScene.test.ts` noNonNullAssertion) and 1 pre-existing schema-version info, both present at base. |
| Static types | `pnpm typecheck` | 0 | `tsc --noEmit` clean (strict, `noUnusedLocals` on). |
| Unit tests | `pnpm test -- --run` | 0 | 113 files / 2390 tests passed, including 11 new `gridLayout` module tests and all pre-existing hub suites unchanged. |

The brief's chain `pnpm check && pnpm typecheck && pnpm test -- --run` was run
as a single command; final run exited 0.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-1 | Concerns live in `src/game/hub/` modules, none inline in the orchestrator | Phase scope: concern 1 (grid layout + entrance bob) fully extracted to `src/game/hub/gridLayout.ts` + `src/game/hub/hubGridConstants.ts`; concerns 2–4 intentionally remain inline per plan (Phases 2–3) | verified (phase scope) |
| FR-2 | `hubGrid.ts` remains the single module HubScene imports; public exports/behavior preserved | `HubGrid` + `HubGridDeps` exports unchanged (only importer outside tests is `src/scenes/HubScene.ts` line 9, unchanged); `git status` shows HubScene.ts not modified; all hub suites pass with original assertions | verified |
| FR-3 | Every non-extraction change maps to an approved cleanup class | Itemized table below — 1 named constant, 1 dead-code removal, 2 comment-accuracy edits; no timing dedup, no renames of exported identifiers | verified |
| FR-4 | Extracted module has unit tests incl. reduced-motion | `src/__tests__/game/hub/gridLayout.test.ts`: 11 tests — geometry (4), entrance pop incl. reduced-motion alpha-only variant (4), breathe pulse incl. reduced-motion no-op + stagger (3) | verified |
| AC-1 | Concern modules own logic; orchestrator has no mixed-concern implementation | Orchestrator now delegates geometry (`wideGridOrigin`/`wideTileCenter`), entrance (`animateEntrance`) and bob (`addBreatheTweens`) to the module; it keeps only object creation, input wiring, and phase-2/3 concern delegation (grep of `hubGrid.ts` shows no inline geometry/entrance/bob math remains) | verified (phase scope) |
| AC-3 | Every cleanup itemized in evidence | Table below | verified |

## Concern inventory / module map (P1.T1.1)

Line references are for `src/game/hubGrid.ts` at phase base `fd389db`
(822 lines actual; the spec's "~773" is stale). This map is the input for
Phases 2–4.

### Concern 1 — grid layout + entrance bob (extracted in this phase)

- **Constants:** `TILE_WIDTH` (L11), `TILE_HEIGHT` (L12–19 with the 6x4
  geometry rationale), `TILE_SPACING` (L20), `GRID_COLS` (L21), `GRID_ROWS`
  (L22), `TILE_ICON_DISPLAY` (L23–24), `TILE_ICON_TEXTURE_SIZE` (L25–26),
  `TILE_ICON_Y_OFFSET` (L27–28), `TILE_LABEL_Y_OFFSET` (L29–30),
  `ENTRANCE_STAGGER` (L32–33), `ENTRANCE_DURATION` (L34–35),
  `BOB_AMPLITUDE` (L36–41), `BOB_DURATION` (L42–43), `BOB_PHASE_OFFSET`
  (L44–45). Paged tile furniture: `PAGED_ICON_DISPLAY` (L81–82),
  `PAGED_ICON_Y_OFFSET` (L83–84), `PAGED_LABEL_Y_OFFSET` (L85–86),
  `PAGED_LABEL_FONT_SIZE` (L87–88).
- **Logic:**
  - Wide-grid origin/centering math — inline in `buildWideGrid` (L265–274)
    and duplicated in `rerenderStickerShelf` (L695–703).
  - Paged tile furniture placement — inline in `buildPageGrid`
    (L396–410: icon at `y + PAGED_ICON_Y_OFFSET`, label at
    `y + PAGED_LABEL_Y_OFFSET`, 20px font).
  - Entrance pop (fade + scale with shared stagger counter) — private method
    `animateEntrance` (L781–821) plus the `entranceIndex` counter field
    (L163–164; reset in `resetForVisit` L182, `buildWideGrid` L264,
    `buildPageGrid` L371).
  - Breathe bob — the `if (!reducedMotion)` tween blocks in `buildWideGrid`
    (L317–343) and `buildPageGrid` (L429–452).
- **Now lives in:** `src/game/hub/hubGridConstants.ts` (constants, with doc
  comments verbatim) and `src/game/hub/gridLayout.ts`
  (`wideGridOrigin`, `wideTileCenter`, `animateEntrance`, `addBreatheTweens`).
  The orchestrator retains tile/icon/label object creation and input wiring
  (orchestration), delegating math + animation to the module.
- **Shared-infra note:** `entranceIndex` remains a numeric field on `HubGrid`
  and is handed to the module per call (`this.entranceIndex++`); concern-3
  code still inline (`drawEmptySlot` L657–658, `animateJustEarned` L734–735)
  uses the same counter — Phase 3 must carry it along.

### Concern 2 — paged phone layout (stays inline; Phase 2)

- **Constants:** `PAGE_SLIDE_DURATION` (L95–96), `SWIPE_MIN_DISTANCE`
  (L97–98), `PAGE_DOTS_Y` (L99–100), `PAGE_DOTS_SPACING` (L101–102),
  `PAGE_DOTS_RADIUS` (L103–104), `PAGE_DOT_ACTIVE_ALPHA` (L105–106),
  `PAGE_DOT_INACTIVE_ALPHA` (L107–108), `PAGE_DOT_HIT` (L109–110).
- **State:** `paged` (L144), `hubPage` (L146), `pageDots` (L158),
  `swiping` (L165–166), `swipeStart` (L167–168), `swipeWired` (L169–170).
- **Methods:** `classifyViewport` (L191–198), `handleViewportChange`
  (L200–223), `flipTo` (L480–516), `updatePageDots` (L518–523),
  `createPageDots` (L525–552), `wireSwipeGestures` (L554–597).
- **Inline fragments inside other methods:** page slide-in tween block in
  `buildPageGrid` (L417–427) and shelf-slide block (L455–470); page-grid
  build itself (`buildPageGrid` L355–478) is the paged rendering body.
- Relies on `src/game/hubPaging.ts` (pure paging math — unchanged, adjacent
  context).

### Concern 3 — sticker shelf (sparkle/burst) (stays inline; Phase 3)

- **Constants:** `STICKER_DISPLAY_SIZE` (L46–56 with shelf-band rationale),
  `STICKER_SHELF_INSET` (L57–58), `EMPTY_SLOT_ALPHA` (L59–60),
  `EMPTY_SLOT_LINE_WIDTH` (L61–62), `EMPTY_SLOT_DASH_COUNT` (L63–64),
  `JUST_EARNED_SCALE` (L65–66), `SPARKLE_DURATION` (L67–68),
  `SPARKLE_ALPHA` (L69–70), `BURST_SCALE` (L71–72), `BURST_DURATION`
  (L73–74), `PAGED_STICKER_DISPLAY_SIZE` (L89–94).
- **State:** `stickerImages` (L152), `emptySlotGraphics` (L154),
  `justEarned` (L162).
- **Methods:** `createShelfSticker` (L599–637), `drawEmptySlot` (L639–673),
  `rerenderStickerShelf` (L675–706 — its wide-grid loop is geometry-only and
  was already re-pointed at the extracted `wideGridOrigin`/`wideTileCenter`),
  `animateJustEarned` (L729–751), `addSparkle` (L753–764),
  `addJustEarnedBurst` (L766–779).

### Concern 4 — time-up dimming (stays inline; Phase 3)

- **Constants:** `TIME_UP_TILE_ALPHA` (L112–113), `TIME_UP_TILE_SCALE`
  (L115–116).
- **Methods:** `applyTimeUpLock` (L708–718), `restoreTiles` (L720–727).
- **Inline fragments:** time-up early-return guards in the tile pointerup
  handlers (L283–288 wide, L387–393 paged) and post-build lock calls
  (L348–352 wide, L473–477 paged).

### Shared scaffolding (orchestrator-owned)

- `HubGridDeps` (L118–132), class doc (L134–141), object lists `wideObjects`
  (L148) / `pageObjects` (L150), `attractTargets` (L156), `navLocked`
  (L160), destroy trio `destroyWideGrid` (L225–233) / `destroyPageGrid`
  (L235–243) / `destroy` (L245–251), `resetForVisit` (L176–189),
  constructor (L172–174).

## Cleanup itemization by class (FR-3 / AC-3)

| Class | Change | Where | Behavior impact |
|---|---|---|---|
| Named constants | New `BOB_SETTLE_DELAY = 50` naming the previous inline magic `ENTRANCE_DURATION + 50` breathe-settle gap | `src/game/hub/hubGridConstants.ts`; consumed in `gridLayout.addBreatheTweens` | None — value identical, delay math unchanged (`300 + 50 + i*200`) |
| Dead-code removal (test-confirmed) | Removed `const reducedMotion = isReducedMotion();` from `buildWideGrid` — its only consumer (the breathe guard) moved into `addBreatheTweens` | `src/game/hubGrid.ts` | None — full suite green; reduced-motion wide-grid behavior covered by `hubGrid.test.ts` breathe assertions and `gridLayout.test.ts` |
| Internal renames | None — all moved constants keep their names; no identifiers renamed | — | None |
| Timing dedup | None performed — no equivalent-timing tween configs were merged | — | None |

Accompanying comment-accuracy edits tied to the moves (no behavior):

1. The paged-constants block doc (former L76–80) reworded to point at
   `hubPaging.ts` and `hub/hubGridConstants.ts` after the furniture constants
   moved out.
2. The two inline breathe-comment blocks replaced with one-line pointers;
   their full rationale moved verbatim into `addBreatheTweens`'s doc.

Implementation detail of the extraction (behavior-identical, noted for
reviewers): `addBreatheTweens` checks `isReducedMotion()` per call instead of
reading a per-build snapshot; both run synchronously inside one build loop, so
the answer cannot differ mid-build.

## Files

- **Created:** `src/game/hub/hubGridConstants.ts`, `src/game/hub/gridLayout.ts`,
  `src/__tests__/game/hub/gridLayout.test.ts`
- **Modified:** `src/game/hubGrid.ts` (822 → 708 lines)
- **Untouched (per contract):** `src/scenes/HubScene.ts`,
  `src/game/hubPaging.ts`, `src/game/hubTiles.ts`,
  `src/__tests__/game/hubGrid.test.ts`

## Evidence paths

- This report: `conductor/tracks/20261021-hub-grid-decomposition/verification/phase-1.md`
- Module tests: `src/__tests__/game/hub/gridLayout.test.ts`
- No binary artifacts under `.conductor/evidence/` were needed this phase.

## Deviations

- None. All changes are inside the declared `Touches` paths
  (`src/game/hub/**` new, `src/game/hubGrid.ts`,
  `src/__tests__/game/hub/**` new). No file outside `Touches` was modified.

## Notes

- The spec's "773 lines" for `hubGrid.ts` is stale — the base file is 822
  lines (821 content + trailing). Phase 4's ≤200-line target still has ample
  headroom: 822 → 708 after Phase 1.
- Two initial `pnpm check`/`pnpm test` failures were fixed within the allowed
  two-retry budget: a formatter complaint on a new import, and two wrong
  hand-computed expectations in the new geometry tests (row pitch is
  116+22=138; the first run's 343/675 were authoring errors, module output was
  correct).
- Pre-existing `pnpm check` noise (biome schema-version info;
  `musicalMemoryScene.test.ts` non-null-assertion warning) exists at base and
  was not touched.
- Phase 2 should extract concern 2 (paged layout) taking `PAGE_SLIDE_*`,
  `SWIPE_*`, `PAGE_DOT_*` constants plus `classifyViewport`,
  `handleViewportChange`, `flipTo`, `updatePageDots`, `createPageDots`,
  `wireSwipeGestures` and the slide fragments inside `buildPageGrid`.
