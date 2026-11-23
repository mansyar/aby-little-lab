# Phase 4 evidence — Doc sync (20261124-replay-novelty)

- **Track:** `20261124-replay-novelty`
- **Branch / base:** `feat/20261124-replay-novelty` @ `ae384f12`
- **Head:** this commit (Phase 4 documentation + this evidence; SHA reported in the phase JSON)
- **Scope:** P4.T1 (sync behaviour docs) — documentation only; implementation is complete and verified
- **Requirements:** FR-9, AC-9 (docs describe shipped behaviour; `validate-docs.js` 5/5)

## Files touched

| File | Change |
| --- | --- |
| `README.md` | File-tree line names `replayVariety` (pure visit state / selector) and `hub/replayCue` (in-memory visit, cue, wiggle and spotlight cursors); Hub Experience gains one sentence describing the textless suggestion ring, per-visit sticker spotlight, shared no-repeat rule and per-profile reset |
| `docs/PRD.md` | §1.5 step 3 (Hub) notes the silent suggestion ring and earned-sticker highlight with the no-repeat rule; §4.3 (mascot) notes the silent visual nudge with no new spoken line; §4.4 (stickers) notes one highlighted earned sticker per visit, registry-order wrap-around, empty-slot fallback, reduced-motion static state and no new art |
| `docs/TDD.md` | §7.1 module list adds `replayVariety.ts` and `hub/replayCue.ts` with one-line responsibilities; §4.10 adds a paragraph on the memory-only `ReplayVisit`, the three-level deterministic selector, the static ring, selector-driven idle wiggle, per-profile spotlight cursor and 1,200-visit seeded simulation |
| `conductor/tracks/20261124-replay-novelty/verification/phase-4.md` | new — this evidence (mandated by brief) |

No test, source, `package.json`, `conductor/workflow.md` or other Conductor state file was changed. In
particular `conductor/product.md` is primary-owned and was already updated — it was neither edited
nor staged here. No living test-count number (155 files / 3,362 tests), coverage percentage or date
was changed: only prose and module names were added, so `validate-docs.js` passes without any count
edit.

## Before / after counts

| Metric | Before (base `ae384f12`) | After (this phase) |
| --- | --- | --- |
| Test files / tests (derived truth) | 155 / 3,362 | 155 / 3,362 (unchanged) |
| Production modules / test files changed | 0 | 0 |
| Docs with behaviour prose added | 0 | 3 (`README.md`, `docs/PRD.md`, `docs/TDD.md`) |
| New evidence files | 0 | 1 |

## Acceptance-criteria mapping

| AC / FR | Where proved | Result |
| --- | --- | --- |
| AC-9 / FR-9 | README Hub Experience and file tree, PRD §1.5 / §4.3 / §4.4, TDD §4.10 / §7.1 now describe the no-repeat suggestion cue, selector-driven idle wiggle and per-visit sticker spotlight; `node scripts/validate-docs.js` reports 5 passed / 0 failed (links, anchors, game list, Conductor paths and living test-suite truth) | PASS |
| FR-9 — no stale numbers | Diff contains no change to the 155 / 3,362 count, any coverage percentage or any date; the validator's "living test-suite truth" check stays green | PASS |
| Scope guard (NFR-2 / 4.10) | No new art, save field, audio or game rule was documented into scope; docs describe the shipped static, textless behaviour | PASS |

## Commands and results

| Command | Exit | Result |
| --- | --- | --- |
| `node scripts/validate-docs.js` | 0 | 5 passed / 0 failed |
| `pnpm check` | 0 | clean, 367 files |
| `pnpm typecheck` | 0 | clean (src + e2e) |

All three commands were run separately (no `&&` chains).

## Deviations

- None. Documentation-only phase; no new test file or count-bearing line was introduced, so the
  living docs needed no count edit.
- The primary's uncommitted `conductor/product.md` change was left as-is and deliberately excluded
  from this commit, per the brief.

## Blockers

- None.

## Primary verification (orchestrator, independent)

- Phase subagent commit `fc5fec1f` is conventional and touches only the three
  prose docs plus this evidence file. The primary-owned `conductor/product.md`
  roadmap edit (`20261208-replay-novelty` row marked Done 2026-11-24 with the
  shipped behaviour and exit gate) is included in the squashed Phase 4
  checkpoint below.
- Full `verify_phase` re-run on the final Phase 4 tree exited 0:
  `pnpm check` Biome clean 367 files; `pnpm typecheck` src + e2e clean;
  `pnpm test -- --run` 155 files / 3,362 tests; `pnpm test:coverage` 155 files /
  3,362 tests with 97.09% statements (7,731/7,962), 90.82% branches
  (2,307/2,540), 96.31% functions (1,727/1,793), 98.26% lines (7,173/7,300)
  against gates 95/88/85/90; `pnpm build` 489 modules, shell
  `index-Ddugd55k.js` 197.38 kB Vite / 192.8 kB via validator (≤200 kB), Phaser
  vendor 1,367.08 kB (pre-existing advisory), storyOrderArt 81.84 kB;
  `validate-bundle.js` PASS; `validate-module-size.js` 169 files zero warnings;
  `validate-textures.js` 319 SVGs, 76.07/319.00 MiB, ratio 0.238;
  `validate-pwa.js` 16/16 with 63 precache entries; `validate-docs.js` 5/5.
- AC-9, AC-10 and FR-9 are independently supported by the green validator
  (5/5, including links/anchors, game lists, Conductor paths and living test
  truth) and the documented prose additions. No count number, coverage
  percentage or date was altered.

## Result

Result: verified
