# Phase 2 Verification — Rewire Story Order onto the shell

- **Track:** 20261021-drag-board-shell
- **Phase:** 2 — StoryOrderScene delegates to DragBoard
- **Date:** 2026-10-21
- **Branch:** `refactor/20261021-drag-board-shell`
- **Base commit:** `e99f302` (phase base; Phase 1 verified at `d0ef7da`)
- **Head commit:** `e6519a1`

## Result

**PASS** — `pnpm check && pnpm typecheck && pnpm test -- --run` exits 0.
112 test files / 2372 tests passed, including the shell suite
(`dragBoard.test.ts`, 69 tests across shell + scene files) and the mechanically
rewired `storyOrderScene.test.ts` (assertions unchanged; only construct/mock
wiring updated).

## Commands

| Command | Result |
| --- | --- |
| `pnpm check && pnpm typecheck && pnpm test -- --run` | exit 0 — 2372 passed / 0 failed |

Pre-existing, non-failing lint output (unchanged by this phase): biome config
schema-version info and a `noNonNullAssertion` warning in
`musicalMemoryScene.test.ts`.

## Acceptance criteria

| AC | Evidence |
| --- | --- |
| AC-1 — no local drop-zone registration, `isOverAnyZone`, or snap logic in StoryOrderScene | `grep` over `src/scenes/StoryOrderScene.ts` for `add\.zone|isOverAnyZone|snapToSlot|setDraggable|dragDistanceThreshold|lastValidatedSignature|bringToTop` → no matches. The scene creates visuals only; the board is constructed once in `create()` with `retry-in-place` / `round-full` / `tapWithdraw: true`. |
| AC-2 — Story Order keeps retry-in-place, round-full validation, tap-withdraw | `storyOrderScene.test.ts`: "leaves a wrong strip exactly in place, unlocks, and accepts one move" (unchanged strip never re-wiggles — `key|key|key` guard intact), "does not validate a partially filled strip", "returns a placed panel on a real tap, then revalidates a refilled strip". All pass. |
| FR-2 — scenes delegate slot mgmt / hover / snap / tap-vs-drag / tap-withdraw to the shell | Scene is 62 insertions / 215 deletions net −153 lines; slot registration, drop/swap/displacement, snap, withdraw, missed-drop correction, and the signature guard all removed from the scene and live in `src/game/dragBoard.ts` (untouched in this phase). |

## Evidence paths

- Scene: `src/scenes/StoryOrderScene.ts` (commit `01949aa`)
- Rewired tests: `src/__tests__/scenes/storyOrderScene.test.ts` (commit `e6519a1`)
- Shell contract suite: `src/__tests__/game/dragBoard.test.ts` (Phase 1, untouched)

## Deviations

- `src/__tests__/scenes/artDeclarations.test.ts` (outside Touches, minimal
  change): the "reads every game module a scene imports" guard flagged the new
  `../game/dragBoard` import. Added a `NON_ART_GAME_MODULES = ["dragBoard"]`
  exclusion (interaction logic, draws no texture keys) to the import scan so
  the guard accepts the shell import. Required for the phase's verification
  gate to pass; also unblocks Phase 3's identical Number Order import.

## Notes

- One assertion-supporting gesture sequence was re-wired to the shell's
  (engine-accurate) tap contract: "returns a placed panel on a real tap" now
  fires `pointerdown` → `pointerup` only. The old sequence also fired
  `dragstart`/`dragend`; the shell's `dragend` marks the gesture as a drag
  (it only fires after the 10 px threshold is exceeded), so a sub-threshold
  tap cannot fire it. The assertion itself (tap withdraws a placed panel, and
  the refilled strip revalidates) is unchanged. The shell suite already pins
  both sides of this contract.
- `validate()` in the tests now fires the shell's `dragend` handler on
  `panels[0]` (the engine path that triggers round-full validation); with no
  registered pieces no gesture can end, so the empty-board "never validates"
  case returns early — same observable outcome as the old direct
  `tryAutoValidate()` call.
- The "stale slot index" edge case is now exercised through the shell's
  guarded `withdraw` (panel `slotIndex` set past the board, tap must not
  throw), replacing the old `slots = []` poke at `returnPanelToSource`.

## Primary verification

- **Command:** `pnpm check && pnpm typecheck && pnpm test -- --run`
- **Exit code:** 0
- **Result:** verified by primary agent
- **Summary:** biome check exit 0 (same two pre-existing findings only); `tsc --noEmit` clean; 112 test files / 2,372 tests passed. Diff `12452af..e6519a1` matches Touches (StoryOrderScene.ts + storyOrderScene.test.ts) plus the one declared deviation (artDeclarations.test.ts NON_ART_GAME_MODULES exclusion — minimal, accepted; also unblocks Phase 3). StoryOrderScene grep for isOverAnyZone/snapToSlot/setDraggable/add.zone returns 0 hits (AC-1). Retry-in-place, round-full validation, signature guard, tap-withdraw, and last-round assertions all pass unchanged (AC-2).
