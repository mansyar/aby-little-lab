# Phase 4 — The 23rd game enters the roster

- Track: 20261115-robot-path
- Phase: 4
- Date: 2026-11-16
- Branch: `feat/20261115-robot-path`
- Base / Head: `f2f602a0` / `de311e98`
- Result: verified
- Mode: E3 (the primary implemented; no code subagent in this host)

## Commands

Verification command, copied verbatim from `plan.md` for Phase 4 and run as one
chained job:

```
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js
```

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | Biome: 329 files, no fixes applied |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` plus the e2e project |
| unit | `pnpm test -- --run` | 0 | 150 files, 3,248 tests passed |
| coverage | `pnpm test:coverage` | 0 | 97.21 / 91.69 / 96.28 / 98.3 project-wide |
| build-artifact | `pnpm build` | 0 | shell entry `index-CpYJPu3F.js` = 182.4 kB |
| build-artifact | `node scripts/validate-bundle.js` | 0 | entry 182.4 kB ≤ 200 kB, vendor chunk isolated |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16/16, 49 chunks, 61 precache entries / 1793.79 KiB |
| documents | `node scripts/validate-docs.js` | 0 | 5/5 |

Chain exit code: **0** (final log line `GATE EXIT: 0`).

Two full gate runs happened. The first passed on the tree whose `RobotPathScene`
still carried Phase 3's `"robot-path" as GameId` cast; removing that cast is the
one line Phase 4 makes possible (the union member now exists), so the whole chain
was run again from the top. The table above is that second, final run — the tree
being accepted.

## Acceptance

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-1 | Registry gains a 23rd row after `story-order` with the specified fields; `GameId` gains `"robot-path"`; no earlier entry changes | `src/game/gameRegistry.ts` row 23 (`thinking`, `RobotPath`, `Robot Path`, `tile_robot_path`, `sticker_robot_path`); `src/types/index.ts` union member and `GAME_IDS` tail; `gameRegistry.test.ts` "declares the games in PRD §2.2 order" and "derives the pre-registry tiles unchanged" pass with the earlier 22 rows untouched | pass |
| FR-15 | Hub tile and sticker at icon and card tiers; shell 58 → 60 keys, app 191 → 193 | two new SVGs; `shellOwnership` "ships exactly the 60 documented shell keys", `groupIntegrity` "leaves exactly the 60 shell keys outside the groups, for 193 in total", `preloadScene` "carries exactly the 60 documented shell keys" and "leaves the shell and the groups owning 193 keys in total" | pass |
| FR-1 (groups) | `thinking` holds seven games | `hubGroups` "splits the 23 games 5/5/7/4/2 with none left out and none counted twice"; `gameRegistry` "keeps the 5/5/7/4/2 totals the spec states" | pass |
| AC-6 | Hub draws 23 tiles, phones page 10/10/3, progress report pages 6+6+6+5 | `hubGrid`, `hubScene`, `navigation`, `feelingsFacesFlow`, `firstWordsIntegration` tile counts; `hubPaging` "splits the registry's 23 tiles into 3 pages (10 + 10 + 3)" and the last page as one centred row of three; `SettingsPanel` "pages through all 23 game rows (6+6+6+5)" and `ProgressOverlay` last page of five rows | pass |
| AC-7 | 60 shell keys and 193 app keys, both robot assets resolve at their tiers, guard suites assert the numbers | the four structural suites above plus `textureTiers` "resolves every shell and group key to a known tier size" with `APP_ASSET_COUNT = 193` | pass |
| NFR-3 | Shell entry stays ≤ 200 kB measured | 182.4 kB (was 179.4 kB); the two SVGs add ~3.0 kB to the entry | pass |
| AC-9 (rows only) | README item 23, PRD `### 3.23 Robot Path`, TDD §4.5 row 23 | `validate-docs` "The README, the PRD and the TDD agree with GAME_REGISTRY" passes; PRD prose, adaptive claim and shell figures remain Phase 6's `P6` work | pass |
| AC-10 | Every pre-existing suite passes with only its roster count restated; no assertion deleted, skipped or weakened | the 150-file suite is green; every edit in `e7928fd3` is a number, a name or a comment restated to the new roster — see the deviations for the two structural exceptions (art-declaration allowlist, hub-paging last-page geometry) | pass |

## Evidence

- `src/types/index.ts` — `GameId` gains `"robot-path"`; `GAME_IDS` gains it last,
  which keeps `GAME_IDS` equal to registry order.
- `src/game/gameRegistry.ts` — row 23 appended after `story-order`, no earlier row
  touched; the header comment says 23.
- `src/scenes/sceneRegistry.ts` — `RobotPath` lazy loader between `PopFreeze` and
  `ShadowMatch`, mirroring the registry key set; `RobotPathScene.gameId()` now
  returns the real union member (Phase 3's cast deleted).
- `src/assets/svg/ui/tiles/tile_robot_path.svg` — robot head over two arrow marks
  (icon tier); `src/assets/svg/stickers/sticker_robot_path.svg` — the robot beside
  its star (card tier). Flat fills, `#2D3748` outlines, 512 viewBox, ASCII only.
- `src/game/audioIdentity.ts` — the index-22 identity derived from the documented
  formulas (`square`, −5 semitones, tempo 1, third contour set), which
  `audioIdentity.test.ts` checks for distinctness across all 23.
- `src/game/hub/artGroups.ts`, `src/game/hub/prewarm.ts` — a lazy `robot` group
  loader over `ROBOT_PATH_ASSETS` and six `ROBOT_PATH_KEYS`, mirroring how Story
  Order's panels are prewarmed, so the idle prewarm still covers every game.
- Commits: `b3baca6b` (registration, shell assets, identity, prewarm),
  `e7928fd3` (every count-bearing suite, the three roster rows, suite counts),
  `de311e98` (the cast removal the acceptance commit carries).

## Deviations

1. **Six source files outside `Touches`.** `gameRegistry.ts`, `types/index.ts`
   and the two SVGs are listed; `sceneRegistry.ts` (carried from Phase 3, see its
   deviation 1), `audioIdentity.ts`, `artGroups.ts` and `prewarm.ts` were not.
   Each is forced by an invariant that would otherwise fail: loader keys must
   equal registry scene keys, every registered game needs an identity row and at
   least one prewarmable art key, and the idle prewarm must be able to fetch the
   game's own art module. All four are the mechanical consequence of the new row.
2. **Twelve test files beyond `P4.T2`'s list** carried roster literals and were
   restated: `hubGrid`, `hubPaging`, `hubTiles`, `gameRegistry`, `audioIdentity`,
   `prewarm`, `insightsSummary`, `progressLogic`, `navigation`, `hubScene`,
   `hubEngagement`, `sceneLifecycle`, `feelingsFacesFlow`, `firstWordsIntegration`,
   `artDeclarations`, `preloadScene`, `textureTiers`, `groupIntegrity`,
   `shellOwnership`, `SettingsPanel`, `ProgressOverlay`. AC-10 authorises exactly
   this ("only its roster count restated"); no expectation changed meaning.
3. **Two structural edits, not just numbers.** (a) `artDeclarations.test.ts` had
   one scene-local-preloader exception (`StoryOrderScene`); Robot Path is the
   second, so the exception became `SCENE_LOCAL_PRELOADER_SCENES` with a per-scene
   preload assertion — the same strength, now covering both. (b) `hubScene`'s and
   `hubPaging`'s last-page geometry watched two centred tiles; three tiles are one
   centred row, so the assertions moved to 316/512/708 with the same centre and
   in-canvas checks rather than being dropped.
4. **Not in the plan: Robot Path is grouped `thinking`, not `stories`.** FR-1 says
   `thinking`; while repairing the suites I first moved the Stories assertions,
   which failed, and put them back — Stories still holds two games and Thinking
   holds seven.
5. **Budget deltas.** Shell entry 179.4 → 182.4 kB; precache 59 → 61 entries and
   1776.92 → 1793.79 KiB; chunks 47 → 49 (`RobotPathScene` 8.8 kB, its art module
   its own chunk because the prewarm loader and the scene both import it). The
   ≤ 200 kB gate holds; NFR-3's "≤ 4 kB for the two SVGs" is met by the ~3.0 kB
   entry growth, while the precache total also carries the new game chunk.
6. **`README.md`, `docs/PRD.md`, `docs/TDD.md`, `docs/perf-baseline.md`** are in
   `Touches` for the three rows; the suite-count refresh (3,245 → 3,248) came with
   them, derived from a real run, as in Phases 1–3.

## Notes

- **Not visually inspected.** The two new SVGs pass the art-contract suites and
  resolve at their tiers, but nobody has looked at them rendered. The Hub tile and
  sticker, and the smaller icon offsets a text label needs, are review and Phase 5
  browser territory.
- **Coverage moved by a fraction.** The docs state 97.22 / 91.73 / 96.27 / 98.3
  from the run that set them; this gate's own coverage pass reported 97.21 /
  91.69 / 96.28 / 98.3. `docs/TDD.md` already documents that identical runs vary
  by a fraction of a point, so the documented figures were left alone rather than
  churned on each gate.
- **PRD prose still says 22 in places** (§2.2 heading and list, the "All 22 games
  adapt" sentence, the 58-key and 47-chunk figures). FR-17 assigns exactly that
  prose to Phase 6; Phase 4 only had to satisfy the three-list validator, which it
  does at 23.
