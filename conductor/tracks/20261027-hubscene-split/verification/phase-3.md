# Phase 3 Verification — Prewarm Orchestration Extraction

- Track: 20261027-hubscene-split — HubScene Decomposition
- Phase: 3 — Prewarm Orchestration Extraction (FR-3, AC-3)
- Date: 2026-10-27
- Branch: refactor/20261027-hubscene-split
- Base: 661fa7b5
- Head: 5ea4379e
- Result: **blocked** (implementation + tests complete; `pnpm` is
  permission-denied for the executor, so the three verification commands below
  were not run — the primary runs them and hands output back)

## What changed

- `src/game/hub/hubPrewarm.ts` (new, commit `251dfbb7`): `createHubPrewarm(deps)`
  owns recency-first entry selection (`prewarmEntries` verbatim, including the
  warmable-loader filter), the `canPrewarm` gates (play-time lock, hidden tab,
  launch in flight), `syncPrewarm`/`startPrewarmPass`/`startArtPass`,
  `queueArtKey` with the `artPassId` generation guard, and
  `cancelPrewarm`/`restartPrewarm`. Owns `PREWARM_START_DELAY` (1200),
  the shared `imported`/`queued` sets, both pass controllers, the entrance
  timer, and the generation. All Phaser surfaces arrive via structural deps
  (`delayStart`, `isPresent`, `queueSvg`, `onLoadSettled`/`offLoadSettled`,
  `startLoad`, gate probes); chunk/art starters and schedulers are overridable
  (defaulting to the real `prewarm.ts` engines) for testability.
- `src/scenes/HubScene.ts` (commit `251dfbb7`): keeps only delegation —
  `syncPrewarm`/`cancelPrewarm`/`restartPrewarm` forward to the controller and
  `resolveArtSvg` still delegates to `artResolver` (pinned by
  `hubScene.test.ts`). Deleted `prewarmEntries`, `canPrewarm`,
  `startPrewarmPass`, `startArtPass`, `queueArtKey`, the
  `prewarm`/`artPrewarm`/`prewarmStartTimer`/`artQueued`/`artPassId`/`prewarmImported`
  fields, the `PREWARM_START_DELAY` const, and the now-unused
  `prewarm.ts`/`svgDataUri` imports. Still passes `sceneLoaders`, `GAME_TILES`,
  `getProgress`, and the `time`/`textures`/`load` handles in as deps, so the
  scene still owns its engine handles.
- `src/__tests__/game/hub/hubPrewarm.test.ts` (new, commit `5ea4379e`): covers
  the entrance delay (1200, both passes start together, sync idempotence),
  all three gates blocking the pass, gate-arrival cancelling the armed start,
  recency-first chunk order with loader-less tiles skipped, `ART_KEYS_BY_GAME`
  passed by reference with a shared `queued` set, cancel bumping the
  generation so a late art resolution queues nothing, one-key-per-settled-load
  raster queueing at the key's tier, and restart resuming with warm keys
  skipped.
- `src/game/hub/artGroups.ts` (one clause, see Deviations): ownership comment
  updated — the pass generation now lives in `hubPrewarm.ts`.

## Commands

| Layer | Command | Exit | Summary |
| ----- | ------- | ---- | ------- |
| test | `pnpm vitest run src/__tests__/game/hub/hubPrewarm.test.ts src/__tests__/scenes/hubScene.test.ts` | not run | executor `pnpm` denied — primary to run |
| types | `pnpm typecheck` | not run | executor `pnpm` denied — primary to run |
| checks | `pnpm check` | not run | executor `pnpm` denied — primary to run |

Behavioral compatibility with `hubScene.test.ts` was preserved by
construction: the controller reuses the same engines (the test's
`startPrewarm`/`startArtPrewarm` mocks keep intercepting, since `hubPrewarm`
imports them from the same `prewarm.ts` module), the 1200 ms `delayedCall`
still goes through `scene.time`, `options.queued` is still a shared `Set`,
`options.keysByGame` is still `ART_KEYS_BY_GAME` by reference, `isPresent`
still probes `textures.exists`, and `hub.resolveArtSvg` still resolves through
`artResolver`. No static game-art/component imports were added to the Hub path
(`hubPrewarm` imports only `prewarm.ts` + `svgDataUri`, mirroring the scene's
old imports).

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| -- | --------- | -------- | ------ |
| FR-3 | Prewarm orchestration lives in a `src/game/hub/` controller; HubScene delegates | `hubPrewarm.ts` owns selection/gates/lifecycle; `HubScene.ts` keeps 3 delegating methods + `resolveArtSvg` | done (unverified by runner) |
| AC-3 | Gates block under lock/hidden/launch; cancel bumps generation; restart skips warm keys | New `hubPrewarm.test.ts` (8 tests); existing `hubScene.test.ts` untouched | done (unverified by runner) |
| NFR | Zero behavior change; `prewarm.ts` and `hubScene.test.ts` untouched | `git status` shows neither modified | done |

## Evidence paths

- `src/game/hub/hubPrewarm.ts`
- `src/__tests__/game/hub/hubPrewarm.test.ts`
- Commits `251dfbb7`, `5ea4379e` on `refactor/20261027-hubscene-split`

## Deviations

- `src/game/hub/artGroups.ts` (outside Touches): updated one clause of the
  module doc comment — the pass generation (`artPassId`) moved from `HubScene`
  into `hubPrewarm.ts`, so the ownership note would otherwise lie. No logic
  touched.

## Notes

- `pnpm` was not attempted (brief Rule: KNOWN permission-denied; primary runs
  verification). No other denied tool calls.
- Risk for the primary's run: none anticipated beyond normal typecheck nits;
  the module mirrors the deleted scene code verbatim and the test suite follows
  the `prewarm.test.ts` FakeScheduler/settle patterns.

## Primary verification

- Ran the delegated commands directly (subagent executor is denied `pnpm`):
  - `pnpm vitest run src/__tests__/game/hub/hubPrewarm.test.ts` — exit 0, 10/10 pass.
  - `pnpm vitest run src/__tests__/scenes/hubScene.test.ts` — exit 0, 48/48 pass.
  - `pnpm typecheck` — initially 8 TS errors in the new test: `vi.fn(() => ...)`
    mocks infer `calls: []`, so `mock.calls[0]?.[0]` failed to compile. Fixed
    (retry 1) by typing both starters with `StartPrewarmOptions` /
    `StartArtPrewarmOptions` (imports added to the test). Re-run exit 0.
  - `pnpm check` — 1 `useImportType` warning + 2 import-sort findings fixed via
    `biome check --write` (retry 2). Re-run exit 0 (266 files); both suites
    re-run green after all fixes.
- Diff-vs-Touches: `hubPrewarm.ts` (+275 new), `HubScene.ts` (700 -> 567
  lines), new collected test (+359), evidence. One-clause doc-comment touch
  to `artGroups.ts` recorded as the phase''s sole deviation. Forbidden files
  (`hubScene.test.ts`, `prewarm.ts`) untouched, confirmed by diff. No merges,
  no foreign commits. Reported subagent commits `251dfbb7`, `5ea4379e`,
  `dcff9b8a` present and squashed per phase convention.
- AC-3: pass — prewarm orchestration extracted with gates; gate, generation
  guard, and restart tests green; pinned suite green.
- Tracked concern for final review: `hubPrewarm.ts` is 275 lines, over the
  NFR-3 200-line helper target. Left as an explicit deviation for
  `conductor-review` to disposition (split vs. accept) rather than expanding
  Phase 3 scope unreviewed.
