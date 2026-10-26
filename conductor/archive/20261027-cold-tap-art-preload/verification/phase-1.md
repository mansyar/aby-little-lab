# Phase 1 Evidence — Art-key queue engine

- Track: 20261027-cold-tap-art-preload — Hub Cold-Tap Art Preload
- Phase: 1 — Art-key queue engine
- Date: 2026-10-27
- Branch: feat/20261027-cold-tap-art-preload
- Base: be1ec1fa
- Head: (uncommitted — shell denied, so no `git rev-parse`/commit; working tree holds exactly the files below)
- Result: **blocked** (code fix applied; suite + full gate + commit need the primary's shell — see Blockers)

## Summary

`src/game/hub/prewarm.ts` now carries a scene-less art-key companion beside the
JS chunk engine, using the same injection pattern and contracts:

- `ART_KEYS_BY_GAME` — key-only per-game source for all 22 games (key + tier
  size), transcribed from each scene's declared `preloadArt([...])` groups
  (`story-order` from `preloadStoryOrderArt`). Key-only strings keep every
  game's SVG markup out of the shell bundle. Shell-owned `tile_*`/`sticker_*`
  keys are excluded.
- `artKeysInRecencyOrder` — pure recency-first flattening with cross-game
  dedupe; first-visit fallback to grid order.
- `startArtPrewarm` — one `queueKey` per idle tick via the injected scheduler
  (rIC with timer fallback), order recomputed from `getProgress()` every tick,
  `isPresent` skip without queueing, per-key failures swallowed with no
  in-pass retry (pass-local failure set; next pass re-attempts), tap-cancel
  drops pending keys without touching already-queued ones. Mirrors the JS
  path's pacing/cancel/idempotence rules; the JS path itself is untouched.
- `src/__tests__/game/hub/prewarm.test.ts` extended with 14 seeded tests:
  parity of the table against the live art groups, sizes pinned to
  `textureSizeFor`, order/pacing/skip/recompute-per-tick, tap-cancel, and
  failure-swallow with retry-on-next-pass.

## Rework (attempt 1 of 2)

The primary ran `pnpm vitest run src/__tests__/game/hub/prewarm.test.ts` for
me: **35 passed, 1 failed** — `matches each game's declared groups key-for-key
in order` for game `story-order`.

Root cause (test bug, not implementation bug): the suite's `EXPECTED_GROUPS`
map listed `"story-order": []`, while `ART_KEYS_BY_GAME["story-order"]`
correctly holds the 33 story-panel keys. Story-order declares its art through
`preloadStoryOrderArt(this)` (`src/scenes/StoryOrderScene.ts:63`), backed by
`STORY_PANEL_ASSETS` in `src/game/storyOrderArt.ts` — that source was missing
from the expected-groups map. Fix applied (test file only, no implementation
change):

- `EXPECTED_GROUPS` is now keyed by a key-only `DeclaredSource` structural type
  (`{ readonly assets: readonly { readonly key: string }[] }`, so the suite
  stays decoupled from SVG markup), and `"story-order"` maps to
  `[{ assets: STORY_PANEL_ASSETS }]` — story-order's true declared source.
- The now-redundant standalone `matches the story panels for story-order`
  test was removed (fully subsumed by the unified key-for-key test).
- The unused `ArtGroup` type import was removed.

The implementation (`STORY_PANEL_KEYS`, 33 keys in `STORY_PANEL_ASSETS` order)
was already correct — the removed standalone story-panels test passed in the
primary's run, proving key-for-key equality including order. I could not
re-run the suite myself (shell denied); the primary must confirm green.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | Biome clean (260 files), after fixing 2 format/import-sort findings in the new code |
| static | `pnpm format` | 0 | Reformatted 1 file (`src/game/hub/prewarm.ts`); no collateral changes |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| unit | `pnpm vitest run src/__tests__/game/hub/prewarm.test.ts` (primary-run, attempt 0) | 1 | 35 passed, 1 failed (`story-order` expected-groups map held `[]`; fixed since, needs re-run) |
| unit | `pnpm vitest run src/__tests__/game/hub/prewarm.test.ts` (re-run after fix) | denied | Not executed (see Blockers) |
| unit | `pnpm test -- --run` | denied | Not executed (see Blockers) |
| coverage | `pnpm test:coverage` | denied | Not executed (see Blockers) |
| build-artifact | `pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js` | denied | Not executed (see Blockers) |
| documents | `node scripts/validate-docs.js` | denied | Not executed (see Blockers) |

Full phase gate
`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
could therefore NOT be completed by me: the first two segments pass; the rest
need the primary's shell. Needed from the primary, in order: (1) re-run the
targeted suite above, (2) run the full 8-command gate, (3) commit the working
tree (implementation + tests + deviation fix + this evidence file) with
conventional task-level commits.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | Seeded fake-scheduler test: keys rasterize in recency order, one per idle tick | `startArtPrewarm — idle art queue` describes: order/one-per-slot, in-flight pacing, present-skip, per-tick reorder; `artKeysInRecencyOrder` flatten/dedupe/fallback tests | partial — primary-run 35/36 (single test-map bug, fixed), re-run pending |
| AC-2 | Tap cancels pending keys; tap path loads and plays exactly as without prewarm | Cancel describes (pending drop, in-flight discard, cancelled key directly loadable); JS path untouched | partial — primary-run passed, re-run pending |
| AC-4 | Rejected svg load is swallowed (no unhandled rejection); a later tap loads that key through the placeholder path | Failure describes (reject → continue + next-pass retry; sync throw → no storm; sync queueKey + all-present drain) | partial — primary-run passed, re-run pending |

FR-1 is covered by `ART_KEYS_BY_GAME` + `artKeysInRecencyOrder` (+ parity tests);
FR-3 by the skip/swallow/cancel semantics (+ tests). FR-2/AC-3/AC-5 belong to Phase 2.

## Evidence paths

- Implementation: `src/game/hub/prewarm.ts` (art-key section appended; JS engine untouched)
- Tests: `src/__tests__/game/hub/prewarm.test.ts` (14 new tests; existing 20 untouched)
- No binaries or contact sheets (none produced in Phase 1)

## Deviations

1. `src/__tests__/scenes/musicalMemoryScene.test.ts` — one-line equivalent fix
   (non-null assertion → throw-narrowed lookup) required because `pnpm check`
   failed on this pre-existing lint error at HEAD (file untouched by this
   phase; verified via `git status` that only phase files were otherwise
   modified). Smallest change preserving test semantics; needed for a clean
   static gate.
2. Tests live in `src/__tests__/game/hub/prewarm.test.ts`, not the literal
   `src/game/hub/*.test.ts` Touches glob — that is where this repo keeps all
   hub tests (including the existing prewarm suite); creating a parallel
   location would break convention.
3. No "asset syllabus" document exists in the repo (searched the whole tree —
   zero matches). Each game's key list was derived from its scene's declared
   art groups in `src/game/art/` (single source; story panels from
   `src/game/storyOrderArt.ts`), and the derivation is machine-pinned by the
   parity tests (key-for-key equality with the live group objects, sizes pinned
   to `textureSizeFor`, shell-key exclusion asserted).

## Notes

- Key counts per game (change-detector summary): shape-sorter 36, animal-trace
  12, pop-freeze 14, shadow-match 32, musical-memory 4, big-small 7,
  pattern-builder 18, alphabet-match 26, word-match/word-builder/first-sounds/decode-it
  87 each, how-many 54, more-less/add-it-up/take-away 52 each, odd-one-out 35,
  color-match 22, memory-match 41, number-order 10, feelings-faces 4,
  story-order 33. Tiers used: icon 160 (12 shadows + equals/plus/minus/sleep_zzz),
  card 256 (everything else); no game group holds a hero key.
- Design point worth reviewing in Phase 2: `nextPending()` probes `isPresent`
  synchronously during the slot scan, so one tick can skip many present keys
  but queues at most one raster — "one key per idle tick" holds for the
  expensive operation. Failed keys are excluded for the rest of the pass via a
  pass-local set (prevents a rescan retry storm) and retried by the next pass
  through the shared `queued` set, matching the JS engine's retry shape.
- Nothing was committed: committing requires shell (`git commit`), which was
  denied in the same way as test execution. The working tree contains exactly
  three modified files (two phase files + the deviation fix above).

## Blockers

- `pnpm vitest run src/__tests__/game/hub/prewarm.test.ts` → `permission denied:
  shell`. Needed to execute the seeded engine tests (and, by extension, the
  full phase gate and task commits). Expected: Vitest run of the extended
  prewarm suite, exit 0 with all tests passing. Full gate + `git commit` need
  the same permission restored.

## Primary verification

Primary ran the exact phase gate on the final tree (code unchanged since the
rework fix; only living-doc count snapshots changed after):

- `pnpm vitest run src/__tests__/game/hub/prewarm.test.ts` → exit 0, 35/35 pass.
- Full gate `pnpm check && pnpm typecheck && pnpm test -- --run &&
  pnpm test:coverage && pnpm build && node scripts/validate-bundle.js &&
  node scripts/validate-pwa.js && node scripts/validate-docs.js` → the first
  seven segments exit 0 (check: 260 files clean; typecheck clean; test: 126
  files / 2,770 tests; coverage 97.77 / 91.79 / 96.78 / 98.72, gates held;
  build precache 54 entries; bundle PASS shell 145.1 kB ≤ 200 kB; PWA 16/0);
  `validate-docs` initially failed 5/1 on stale suite counts (2,753 → 2,770 in
  README:49, TDD:1045/:1059/:1065 incl. this run's coverage denominators, and
  perf-baseline:421). Primary applied those five validator-mandated snapshot
  refreshes — the smallest necessary change, outside Touches — and re-ran
  `validate-docs`: 6 passed / 0 failed.
- AC-1/AC-2/AC-4 each have seeded tests plus a green run: satisfied.
- Deviations accepted: (1) musicalMemoryScene one-line equivalent fix —
  verified in diff, semantics unchanged; (2) test location follows repo
  convention; (3) no syllabus doc exists — derivation pinned by parity tests;
  (4) primary's five doc-count refreshes (validator-mandated).
- Result: **verified**, checkpoint `a1a2a6d5`.
