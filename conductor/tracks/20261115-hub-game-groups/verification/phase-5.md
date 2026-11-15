# Phase 5 — The journey, and the record

- Track: 20261115-hub-game-groups
- Branch: feat/20261115-hub-game-groups
- Base / Head: `703b12ad` / `b378e05b`
- Date: 2026-11-15
- Result: verified

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| browser | `pnpm test:e2e` | 0 | 22 Playwright journeys passed (4.0m), the new `hub-groups` one included |
| static | `pnpm check` | 0 | Biome: 323 files checked (the new spec is the extra file), no fixes applied |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` plus the e2e project |
| unit | `pnpm test -- --run` | 0 | 147 files, 3,203 tests passed |
| coverage | `pnpm test:coverage` | 0 | statements 97.39 / branches 92.07 / functions 96.4 / lines 98.35, above 90/85/88/95 |
| build-artifact | `pnpm build` | 0 | built; shell entry `index-DULMoZ9v.js` = 179.5 kB |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk isolated; shell entry 179.5 kB ≤ 200 kB |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed; precache 59 entries / 1776.95 KiB |
| documents | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed |

Run as one chain in this turn (as a background job, since `pnpm test:e2e` alone
runs four minutes); the chain's final exit was 0, logged as `GATE EXIT: 0`. The
first attempt stopped at `pnpm check` on formatting in the new spec, which
`biome check --write` fixed; every earlier layer — the 22 journeys included —
passed on both attempts.

## What the journey proves

`e2e/journeys/hub-groups.spec.ts` opens the built app at `?e2e=1` and:

1. asserts the opening board is All with six chips in draw order and every chip
   in the top band (`y < 108`);
2. loops `HUB_SELECTIONS`, taps each chip's published centre, waits for the
   selection to report that id, waits for the rebuilt board to accept taps, and
   asserts the drawn tile ids equal `visibleTileIndexes(selection)` — imported
   from the same table the grid draws from, so a drift between the board and its
   report fails here;
3. taps Numbers, launches Add It Up (index 15) from that filtered board, answers
   its published correct card, and waits for the round to advance;
4. holds the back control, returns to the Hub, and asserts the selection is All
   again with all 22 tiles drawn;
5. asserts no page or console errors.

## Acceptance

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-3 | A filtered board launches a game, and All restores the 22-tile board | the journey's steps 3–4: Add It Up plays from the Numbers board, and the returned Hub draws 22 tiles on All | pass |
| AC-10 | The documents name the groups and the new shell count, and `validate-docs` passes | the doc rewrite below; `validate-docs` 5/5 | pass |
| FR-6 | The chip row groups the games by learning domain, All first | README "Hub Experience", PRD §1.5, product.md §6 and the 2026-11-15 changelog | pass |
| FR-12 | README, PRD, TDD, `conductor/product.md` and `product-guidelines.md` describe the groups, six chips, two-tap rule and the new shell key count | the five documents below | pass |

## Decisions

| ID | Taken | Authority |
|---|---|---|
| D1 | Five learning-domain groups, in the order All, Letters, Numbers, Thinking, Play, Stories, with registry order inside each group | spec D1 |

D1's earlier entries (Phase 1) stand; the journey loops `HUB_SELECTIONS`, so a
sixth group would be driven the moment it is declared. Logged in
`.conductor/runs/20261115-hub-game-groups/freebuff/decisions.md`.

## Evidence

- `e2e/journeys/hub-groups.spec.ts` — the journey above.
- `e2e/fixtures/game.ts` — `hubGroups(page)`, the fixture that reads the row.
- `README.md` — the Hub Experience paragraph now describes the six chips, the
  filtered board, the two-tap rule and the All landing state; the source tree
  names `hubGroups`, `groupChips` and `groupLayout` and states the real file
  counts (69 files = 39 modules + art/ 16 + hub/ 14); the build paragraph carries
  the 2026-11-15 shell figures (179.5 kB, 47 chunks).
- `docs/PRD.md` — §1.5 gains the chip row and the two-tap rule; §7.1 states 58
  boot keys with the five group glyphs and the `group_*` icon rule; §7.2 states
  58 textures, 179.5 kB shell, 1335.0 kB Phaser chunk and 47 chunks; §7.3 pins
  58 shell keys.
- `docs/TDD.md` — §2.2 tree gains `hubGroups.ts`, `hub/groupChips.ts` and
  `hub/groupLayout.ts`; §2.3/§3.3/§3.4/§3.6 state 58 shell keys, 236 art files
  and 236 texture keys, the fourteen literal non-game rows (nine UI keys plus the
  five group glyphs) and the `group_*` icon tier; §4.9 is new: the group field,
  `hubGroups.ts`, the chip band geometry (96×84, 10px, y=66, centres
  247/353/459/565/671/777), the filtered board geometry (176×196, 20px, n≤3
  columns, rows centred), the hit-zone/repaint rule and the glyph ownership rule
  (explicit rows, drawn All grid, no missing-texture path); §7.1 states the
  `group` field and the `hubGroups.ts` row.
- `conductor/product.md` — the HubScene line in §6 and a 2026-11-15 changelog
  entry.
- `conductor/product-guidelines.md` — one line under the paged-grid guidance:
  grouping is a layout concern, the chips are top-band chrome on the 96×84 band,
  the 64px floor still governs game tiles, and the selection is never stored.

## Deviations

- **`e2e/fixtures/game.ts` — outside this phase's `Touches`.** The journey needs
  a typed reader for the new accessor, and every other journey reaches the bridge
  through this fixture module rather than calling `page.evaluate` inline. The
  addition is one function (`hubGroups`) and one type import; no existing fixture
  changed behaviour.
- **Numbers beyond the plan's wording.** P5.T2 asks for the six chips, the five
  groups, the two-tap rule and the 58-key count. The same rewrite corrected
  figures that were already stale before this track — the README's `hub/` file
  count (6 → 14) and the 2026-10-24 build figures, the PRD's §7.2 measurement and
  the TDD's 231-file corpus (now 236: five glyphs) — because FR-12 asks the
  documents to describe what shipped, and leaving them would state a shell that
  no longer exists. No claim was added beyond the shipped behaviour.
- **No unit test was added in this phase**, so the living suite counts stay at
  147 files / 3,203 tests; `validate-docs` agrees.

## Notes

`run_file_change_hooks` reported that file-change hooks are not supported in this
environment; the phase gate covers the same ground.

The journey imports `HUB_SELECTIONS` and `visibleTileIndexes` from `src/` rather
than retyping the expected id lists. That is deliberate: the spec's point is that
the drawn board and the bridge's report agree, and a journey with its own copy of
the table could pass while both drifted together.
