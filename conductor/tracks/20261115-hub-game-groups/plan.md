# Hub Game Groups — Implementation Plan

> **Branch:** `feat/20261115-hub-game-groups`
> **Base:** `master` @ `703b12ad`
> **Autonomy:** ready
> **Decisions:** D1–D9
> **Effort:** 4

Every phase runs the project's full pre-acceptance gate as its `Verification`,
because the Hub is the boot path: a regression here is a dead app on every
device, and the narrow checks cannot see a shell that failed to rasterize.

## Phase 1: The groups, as data

- **Goal:** every game belongs to exactly one of five named groups, and the group
  table can answer "which tiles does this chip show?" without any Phaser object.
- **Depends on:** none
- **Covers:** FR-1, FR-5, AC-1
- **Touches:** `src/types/index.ts`, `src/game/gameRegistry.ts`, `src/game/hubGroups.ts`, `src/__tests__/game/hubGroups.test.ts`, `src/__tests__/gameRegistry.test.ts`
- **Dependencies:** none
- **Decisions:** D1, D5
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P1.T1: Type the group and declare it per game** — covers: FR-1
  - [x] Add `HubGroupId` (`letters | numbers | thinking | play | stories`) to `src/types/index.ts` as a value-free union, so the registry gains a field without an import cycle.
  - [x] Add `group` to all 22 `GAME_REGISTRY` entries per FR-1, leaving order, keys and icon overrides byte-identical.
- [x] **P1.T2: Give the groups their words and their tiles** — covers: FR-1, FR-5, FR-6
  - [x] Create `src/game/hubGroups.ts` with the `HUB_GROUPS` table (id, chip label, spoken name, glyph key), `ALL_GROUP_ID`, `groupForGame`, `tilesInGroup(selection)` and `visibleTileIndexes(selection)` — all derived from `GAME_REGISTRY`.
  - [x] Keep registry order inside a group and the declared order across chips, and pin the spoken names: "All games", "Letters and sounds", "Numbers and counting", "Thinking and matching", "Play and memory", "Feelings and stories".
- [x] **P1.T3: Prove the decomposition** — covers: AC-1
  - [x] New `hubGroups.test.ts`: 5/5/6/4/2 membership, every `GameId` in exactly one group, no empty group, each group's indexes ascending and contiguous to its own list, `visibleTileIndexes("all")` equal to `[0..21]`, and one entry per `HUB_GROUPS` row with a unique `group_*` glyph key.
  - [x] Extend `gameRegistry.test.ts`: the two-way coverage proof (every entry's `group` is a `HUB_GROUPS` id; every group is claimed by at least one entry) while the pre-registry tile golden test stays untouched.

**Result:** verified — the 22 games are declared once and grouped 5/5/6/4/2 by a type-checked `group` field, and `src/game/hubGroups.ts` turns a chip id into that group's registry indexes, its chip word, its spoken sentence and its glyph key. 3,169 tests in 145 files; gate exit 0.
**Checkpoint:** 5a78c970
**Evidence:** conductor/tracks/20261115-hub-game-groups/verification/phase-1.md

## Phase 2: The chips, and the board they draw

- **Goal:** a chip tap turns the 22-tile board into that group's larger board on
  both layouts, and All restores today's board exactly.
- **Depends on:** Phase 1
- **Covers:** FR-2, FR-3, FR-4, FR-7, FR-9, NFR-1, NFR-2, NFR-4, AC-2, AC-3, AC-4, AC-7
- **Touches:** `src/game/hub/groupLayout.ts`, `src/game/hub/groupChips.ts`, `src/game/hub/gridBuilder.ts`, `src/game/hubGrid.ts`, `src/__tests__/game/hub/groupLayout.test.ts`, `src/__tests__/game/hub/groupChips.test.ts`, `src/__tests__/game/hubGrid.test.ts`
- **Dependencies:** none
- **Decisions:** D2, D3, D4, D8
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P2.T1: Lay out chips and group tiles as pure geometry** — covers: FR-2, FR-4, NFR-1
  - [x] `groupLayout.ts`: `chipCenter(index)` for six 96×84 chips 10px apart centred in the top band, and `groupTilePosition(index, count)` for 176×196 tiles with 20px spacing, n columns up to 3, each row centred.
  - [x] Tests: chip centres land on 247/353/459/565/671/777 with a y of 66, every chip rect clears x=116 and x=908, and 1–6 tiles produce the documented boxes with every tile inside the canvas between y=108 and y=620.
- [x] **P2.T2: Draw the chips and own the selection** — covers: FR-2, FR-7, NFR-4
  - [x] `groupChips.ts`: create one chip per `HUB_GROUPS` row plus All, each a 96×84 rounded rect with a glyph image (or the drawn 2×2 grid for All) and a 14px label, a 96×84 hit area, `attachPressFeedback`, and an alpha/stroke-only selected state.
  - [x] `HubGrid`: hold `selection`, expose `setGroup(selection)`, build/destroy the chips with the board, reset the selection in `resetForVisit()`, and call the new optional `onSelectGroup` dep with the chosen id.
  - [x] Tests with plain mock objects: six chips created, the selected chip painted active, a tap calls `onSelectGroup` with its id and rebuilds, a visit reset returns to All, and no storage call is made.
- [x] **P2.T3: Build a filtered board in both layouts** — covers: FR-3, FR-4, FR-9, AC-2, AC-3, AC-4, AC-7
  - [x] `gridBuilder`: a filtered build that draws that group's tiles at the group geometry with the same icon/label/shelf treatment, re-arms `beginEntrances`, repopulates `attractTargets`, and applies the time-up lock; the paged layout uses the same filtered build and hides the page dots, restoring them on All.
  - [x] Keep the All path untouched: no change to `buildWideGrid`'s or `buildPageGrid`'s All geometry, stagger or breathe values.
  - [x] Tests: a golden position table for the All board both layouts; a filtered board's slot-to-registry-index mapping; the lock applied to a filtered board; the cue teardown fired on a chip tap.
- [x] **P2.T4: Keep the selection across a viewport flip** — covers: FR-3
  - [x] `handleViewportChange` rebuilds the current selection in the new layout instead of resetting it, and re-creates page dots only for All.
  - [x] Test: flip wide→paged with Numbers selected, then back, asserting the drawn game ids both times.

**Result:** verified — six chips in the top band carry the selection, and a chip tap redraws the board as that group's 176×196 tiles on both layouts (n≤3 columns, each row centred, page dots hidden) while All restores the 22-tile board unchanged; the selection resets per visit, survives a viewport flip and never touches storage. 3,195 tests in 147 files; gate exit 0.
**Checkpoint:** 2da5a60d
**Evidence:** conductor/tracks/20261115-hub-game-groups/verification/phase-2.md

## Phase 3: Five glyphs, and the inventory that counts them

- **Goal:** the shell ships the five group glyphs at the icon tier, and every
  guard that states the shell inventory states the new numbers.
- **Depends on:** Phase 1
- **Covers:** FR-10, NFR-3, AC-8
- **Touches:** `src/assets/svg/ui/group_letters.svg`, `src/assets/svg/ui/group_numbers.svg`, `src/assets/svg/ui/group_thinking.svg`, `src/assets/svg/ui/group_play.svg`, `src/assets/svg/ui/group_stories.svg`, `src/scenes/PreloadScene.ts`, `src/utils/textureTiers.ts`, `src/__tests__/game/art/shellOwnership.test.ts`, `src/__tests__/game/art/groupIntegrity.test.ts`, `src/__tests__/scenes/preloadScene.test.ts`, `src/__tests__/scenes/navigation.test.ts`, `src/__tests__/utils/textureTiers.test.ts`
- **Dependencies:** none
- **Decisions:** D7
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P3.T1: Draw the five glyphs** — covers: FR-10
  - [x] `group_letters` (one letter card), `group_numbers` (one numeral card), `group_thinking` (a star beside a rounded square), `group_play` (a green music note over a face-down card), `group_stories` (a smiling round face), each on a transparent 512 viewBox with the 4–6px `#2D3748` outline and palette colours only.
  - [x] Verify each file parses through `toDataUri` and shows its intended shape at 40px, recorded as an evidence note.
- [x] **P3.T2: Put them in the shell at the icon tier** — covers: FR-10, NFR-3
  - [x] Import the five SVGs and append five explicit `SHELL_ASSETS` rows after the registry-derived block, with a comment saying why they are explicit (the shell glob keeps only `tile_`/`sticker_` keys).
  - [x] Add `[/^group_/, "icon"]` to `TIER_RULES`, and extend `textureTiers.test.ts` to assert the tier and the 40px display scale.
- [x] **P3.T3: Restate the inventory, do not loosen it** — covers: AC-8, NFR-3
  - [x] Update `shellOwnership.test.ts` (53 → 58 keys, the five `group_*` rows added to its literal list), `groupIntegrity.test.ts` (53/186 → 58/191 and the union assertion), `preloadScene.test.ts` (53 → 58, 186 → 191) and `navigation.test.ts`'s 53-svg count, each with the new number and the reason.
  - [x] Record the measured shell entry size and precache count before/after in the phase evidence, against the 200 kB gate and the 5 kB art budget.

**Result:** verified — five flat group glyphs ship as explicit shell rows at the icon tier, the shell grew 176.9 → 179.0 kB and the precache 54 → 59 entries against a 200 kB gate and a 5 kB art budget (the files total 2.0 kB), and the four inventory guards state 58 shell keys / 191 app keys rather than being loosened. 3,196 tests in 147 files; gate exit 0.
**Checkpoint:** cf47ccb1
**Evidence:** conductor/tracks/20261115-hub-game-groups/verification/phase-3.md

## Phase 4: The scene speaks the group

- **Goal:** a chip tap is audible, and a journey can see and drive the selection
  through the read-only bridge.
- **Depends on:** Phase 2, Phase 3
- **Covers:** FR-8, FR-11, AC-5, AC-9
- **Touches:** `src/scenes/HubScene.ts`, `src/game/e2eBridge.ts`, `src/__tests__/scenes/hubScene.test.ts`, `src/__tests__/game/e2eBridge.test.ts`
- **Dependencies:** none
- **Decisions:** D6, D9
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P4.T1: Speak the group's name** — covers: FR-8, AC-5
  - [ ] Pass `onSelectGroup` into `HubGrid` and implement it as `speakSentence(HUB_GROUPS[selection].spokenName, getSettings().sfxEnabled)`, All included as "All games".
  - [ ] Test with a mocked `speakSentence`: the right name per chip, the current SFX flag, and no call at all when the toggle is off.
- [ ] **P4.T2: Publish the selection and the chips** — covers: FR-11, AC-9
  - [ ] Add `E2EHubGroups` to `e2eBridge.ts` and `e2eHubGroups()` to `HubScene`, reading the live chip centres and the grid's selection; keep the bridge inert without `?e2e=1`.
  - [ ] Keep `e2eHubTiles()` truthful on a filtered board by mapping drawn slots through the selection's visible indexes.

**Result:**
**Checkpoint:**
**Evidence:** conductor/tracks/20261115-hub-game-groups/verification/phase-4.md

## Phase 5: The journey, and the record

- **Goal:** a browser proves a child can pick a group, launch a game from it, come
  back, and that the documents describe what shipped.
- **Depends on:** Phase 4
- **Covers:** FR-6, FR-12, AC-3, AC-10
- **Touches:** `e2e/journeys/hub-groups.spec.ts`, `README.md`, `docs/PRD.md`, `docs/TDD.md`, `conductor/product.md`, `conductor/product-guidelines.md`
- **Dependencies:** none
- **Decisions:** D1
- **Verification:** `pnpm test:e2e && pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P5.T1: Drive every chip and play from one** — covers: FR-6, AC-3
  - [ ] `hub-groups.spec.ts`: wait for the board, read `e2eHubGroups()`, tap each chip and assert the drawn tile ids equal that group's registry indexes, tap All and assert 22 tiles, then select Numbers, launch a game tile, play it, and assert the Hub returns on All.
- [ ] **P5.T2: Write it down** — covers: FR-12, AC-10
  - [ ] `README.md` and `docs/PRD.md`: the six chips, the five groups, the two-tap rule and All as the landing state, with the 58-key shell count replacing 53 wherever it is stated.
  - [ ] `docs/TDD.md`: the group field, `hubGroups.ts`, `groupLayout.ts`, the chip band geometry, the filtered board geometry and the glyph ownership rule.
  - [ ] `conductor/product.md`: a dated changelog entry and the Hub line in §6; `conductor/product-guidelines.md`: one line under the Hub/paging guidance that grouping is a layout concern and the 64px floor still governs game tiles, not the top-band chrome.

**Result:**
**Checkpoint:**
**Evidence:** conductor/tracks/20261115-hub-game-groups/verification/phase-5.md
