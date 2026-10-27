# Phase 4 evidence — Banding, full gate, docs sync

- Track: 20261027-content-expansion — Content Expansion — Words, Stories, Scenarios
- Phase: 4 (FR-5, NFR-1..NFR-5, AC-4, AC-5, AC-6)
- Date: 2026-10-27
- Branch: feat/20261027-content-expansion
- Base: 471eba7b5699e23ad495d1df10d18ee6d666ca5c
- Head: (pre-squash task heads; squashed at acceptance — see Primary verification)
- Result: verified

## What was done

### P4.T1 — Adaptive banding re-verified (by inspection; tests run by primary)

- `src/__tests__/game/adaptiveLogic.test.ts` contains no pool-size pins at all —
  only `WINDOW_SIZE`/`MIN_SAMPLE`/threshold/ladder-shape pins. Untouched.
- `wordLogic.test.ts` already pins `WORD_POOL` = 28 (13 tier-3 + 15 tier-4);
  `decodeLogic.test.ts` already pins `DECODE_POOL` = 28 with `WORD_POOL` parity;
  `feelingsFacesLogic.test.ts` already pins `SCENARIO_POOL` = 32, 8/emotion, delta 16;
  `storyOrderLogic.test.ts` already pins `STORY_POOL` = 15, 45 panels, 7 obvious /
  8 subtle, `mixFor` 5+1 / 3+3 / 1+5. Untouched (already correct from Phases 1–3).
- One stale pin found and fixed: `src/__tests__/game/storyOrderLogic.test.ts:51`
  title said "uses 33 distinct panel keys" while asserting 45 — title only changed
  to "uses 45 distinct panel keys"; the assertions were already correct.
- No ladder, shift, threshold, storage, or asset change made in this phase.
- Left intentionally untouched: `src/game/decodeLogic.ts:58` comment
  "(should not happen with 22 pool, but guard)" — stale number, but it is a
  non-failing comment outside Touches; changing it is not required by the phase
  goal (only failing count pins). Primary may fix at will.

### P4.T2 — Pool counts synced in docs (truth re-verified against code before writing)

- `WORD_POOL` = 28 re-verified in `src/game/wordLogic.ts` (13 tier-3:
  CAT DOG PIG CAR OWL SUN HAT BUG MAP FOX CUP BOX BED; 15 tier-4:
  FROG BALL FISH BOAT TREE BONE STAR DRUM BEAR DUCK KITE SOCK BOOT RING PLUS).
  `DECODE_POOL = [...WORD_POOL]` re-verified in `src/game/decodeLogic.ts`.
- `SCENARIO_POOL` = 32 (8/emotion) re-verified in `src/game/feelingsFacesLogic.ts`.
- `STORY_POOL` = 15 (7 obvious: seed/balloon/duck/ice-cream/cake/snowman/tower;
  8 subtle: banana/cup/foot/rain/clothes/sun/caterpillar/tadpole), 45 panels
  re-verified in `src/game/storyOrderLogic.ts` + 45 `story_*.svg` files on disk.
- New word-picture keys all resolve to existing art-group keys (verified in
  `src/game/art/{items,shapes,toys}.ts`: `sm_map sm_cup sm_fox sm_bed sm_sock
  sm_boot sm_kite toy_box shape_plus shape_ring`) — so no new item SVGs, as stated.
- `conductor/product.md` rows 21–22 NOT edited: write denied in this session
  (see Blockers). Exact strings for the primary are below.
- NFR-5 (no storage migration): verified-by-inspection — this track's touches are
  word/story/feelings logic + art + tests + docs only; no save-schema file
  (`storage`, profile, schemaVersion) was added or edited in any phase.

## Files changed by this session

- `src/__tests__/game/storyOrderLogic.test.ts` (test title only, 33 → 45)
- `docs/PRD.md` (§3.9 rounds-and-pool 18 → 28 with 13/15 split, art-and-assets
  18 → 28 prompt pictures; §3.19 rounds-and-pool 22 → 28, art-and-assets rewritten
  to the shared 28-word pool; §3.21 pool 24 → 32, six → eight per emotion; §3.22
  pool eleven → fifteen with 7-obvious/8-subtle story lists, panels 33 → 45;
  §7.x three 33 → 45 panel-count sentences. §3.10 Build the Word states no pool
  size — verified, no change. Dated historical changelog entries untouched.)
- `docs/TDD.md` (asset tree `stories/` 33 → 45 files; corpus row 33 → 45 /
  11 → 15 strips; storyOrderArt section 33 → 45 panels ×2; boundary-test note
  33 → 45 story panels; Story Order chunk row count 33 → 45 SVGs with the
  ~40.3 kB figure left for the build to re-measure; §7.1 module row 33 → 45;
  decodeLogic coverage note pool 22 → 28. Corpus totals such as the 219-file /
  166-lazy counts intentionally left — the docs themselves state the build
  re-measures them, and they were outside this phase's itemized scope.)

## Commands (run by the primary — green)

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| lint | `pnpm check` | 0 | biome clean, 260 files |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| unit (prewarm re-run after fix) | `pnpm test -- --run src/__tests__/game/hub/prewarm.test.ts` | 0 | 35 passed |
| unit (full) | `pnpm test -- --run` | 0 | 126 files, 2783 tests passed |
| coverage | `pnpm test:coverage` | 0 | 97.73 / 91.71 / 96.88 / 98.70 — above 95/88/85/90 gates |
| build | `pnpm build` | 0 | shell 149.1 kB ≤ 200 kB; precache 59 entries |
| bundle | `node scripts/validate-bundle.js` | 0 | all bundle checks passed |
| PWA | `node scripts/validate-pwa.js` | 0 | 16/16 |
| docs | `node scripts/validate-docs.js` | 0 | 6/6 (after suite-count refresh below) |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| FR-5 | Adaptive ±1 band preserved for affected games | No ladder/shift/threshold touched; only one test *title* fixed (assertions already correct); `mixFor` 5+1/3+3/1+5 pins unchanged; prewarm `STORY_PANEL_KEYS` extended to the 45-panel order so the new stories preload like the old ones; full suite 2783 green | pass |
| AC-4 | Word-pool counts synced | PRD §3.9/§3.19, TDD decode note now state 28 (13+15) | pass (docs validator 6/6) |
| AC-5 | Scenario-pool counts synced | PRD §3.21 now states 32 (8/emotion) | pass (docs validator 6/6) |
| AC-6 | Story-pool counts synced | PRD §3.22 + §7.x, TDD rows now state 15 stories / 45 panels; suite-count pins refreshed to 126/2783 | pass (docs validator 6/6) |
| NFR-1..4 | Full gate + bundle/PWA/docs green | Commands table above: lint, typecheck, 2783 tests, coverage gates, build, bundle/PWA/docs validators all exit 0 | pass |
| NFR-5 | No storage migration | Verified-by-inspection: no save-schema edits anywhere in this track | pass |

## Deviations

- `src/__tests__/game/storyOrderLogic.test.ts` is outside the `src/__tests__/game/adaptive*`
  Touches glob; the one-line test-title fix was required by P4.T1 (stale "33" pin)
  and is the smallest possible change (title only, no assertion touched).
- PRD §3.9 art-and-assets "18 → 28 prompt pictures" goes one line beyond the brief's
  explicit itemization (rounds-and-pool only) but is the same stale pool count in the
  same section; within `docs/*` Touches.
- `src/game/hub/prewarm.ts` (`STORY_PANEL_KEYS` 33 → 45, outside Touches) —
  found by the primary through the full-suite gate: Phase 2's new panels were
  missing from the cold-tap art queue, failing `prewarm.test.ts` key-for-key
  parity. Added the 12 keys in `STORY_PANEL_ASSETS` order; re-run 35/35. Without
  it the 4 new stories would cold-tap without prewarmed art.
- `src/game/decodeLogic.ts:58` stale "22 pool" comment → "28 pool" (primary;
  track already owns this file from Phase 1).
- Corpus totals synced by the primary (same stale-count class, within `docs/*`):
  TDD Total 219 → 231, asset-corpus 219 → 231 (4 spots), PRD "166 of 219" →
  "178 of 231"; suite-count pins refreshed 2,781 → 2,783 (README, TDD ×3,
  perf-baseline ×2) per `validate-docs.js`.
- `conductor/product.md` rows 21–22 applied by the primary (subagent edit denied):
  16→32-scenario pool, 8→15-story pool.

## Blockers (all resolved by the primary)

1. ~~`conductor/product.md` rows~~ — applied by the primary (see Deviations).
2. ~~Verification command~~ — full gate run green (see Commands).
3. ~~Commits~~ — squashed at acceptance (see Primary verification).

## Primary verification

- Working tree at verify time: docs + test + prewarm/comment/count-sync edits listed above; `git status` clean except phase files.
- Full gate (exact Phase 4 verification command) exit 0 in stages: `pnpm check` (biome 260 clean), `pnpm typecheck` (clean), `pnpm test -- --run` (126/2783), `pnpm test:coverage` (above gates), `pnpm build`, `validate-bundle.js`, `validate-pwa.js` (16/16), `validate-docs.js` (6/6 after count refresh; only suite-count pins were stale).
- Prewarm gap found and fixed: `prewarm.test.ts` 1 failed → 35/35 after `STORY_PANEL_KEYS` extension; full suite re-run 2783 green.
- Squash guard: range `471eba7b..HEAD` holds exactly the reported subagent changes plus the primary's verification-driven fixes — no merges, no user commits — squashed to one phase commit.
- Result: verified.

## Notes

- `oddOneOutLogic.test.ts` `ODD_ITEMS = 33` is a different, unrelated pool — left alone.
- Corpus-wide totals (PRD "166 of 219 art files", TDD 219-file corpus rows, PRD/TDD
  kB figures) were deliberately left for the build/validators to re-measure per the
  docs' own statements; flagging in case `validate-docs.js` pins any of them.
