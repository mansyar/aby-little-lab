# Phase 2 Verification — Cut over shuffle consumers, delete the five copies

- **Track:** 20261025-shared-random-helpers — Shared Random Helpers (one shuffle, one RNG seam)
- **Phase:** 2
- **Date:** 2026-10-25
- **Branch:** `refactor/20261025-shared-random-helpers`
- **Base commit:** `fbac8da6`
- **Head commit:** `d3efbdee`
- **Result:** verified

## Summary

Every `shuffle` consumer now imports from `src/game/random.ts`. The four
private copies (`animalTraceLogic`, `bigSmallLogic`, `popFreezeLogic`,
`shadowMatchLogic`) and the exported copy in `shapeSorterLogic` are deleted;
`shapeSorterLogic.generatePlaythrough` draws its shuffle from `./random` via
the internal `poolFor` call path (spec A5, no redundant public `rng`
parameter). All 12 hub importer logic modules (`addItUp`, `alphabet`,
`colorMatch`, `count`, `decode`, `firstSounds`, `memoryMatch`, `moreLess`,
`numberOrder`, `oddOneOut`, `takeAway`, `word`) plus `patternBuilderLogic`
(keeps `ALL_SHAPES`/`ShapeType` from `shapeSorterLogic`) and
`ShapeSorterScene` (keeps `generatePlaythrough`, `isMatch`, `ShapeType`) were
re-pointed. No compatibility re-export was added. Five test suites had
import-line swaps only (`animalTraceLogic.test`, `bigSmallLogic.test`,
`popFreezeLogic.test`, `shadowMatchLogic.test`, `shapeSorterLogic.test`);
no assertions changed.

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | Biome clean (256 files; 1 pre-existing unrelated warning in `musicalMemoryScene.test.ts`, 1 pre-existing schema-version info) |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| unit | `pnpm test -- --run` | 0 | 123 files / 2687 tests passed |
| coverage | `pnpm test:coverage` | 0 | 97.81% stmts (≥90), 91.57% branch (≥85), 96.77% funcs (≥88), 98.74% lines (≥95) — gate passes |
| build-artifact | `pnpm build` | 0 | vite build ok; `random` emits a shared `random-DG-lNcLb.js` chunk consumed by importers |
| build-artifact | `node scripts/validate-bundle.js` | 0 | vendor chunk + shell ≤200 kB budgets pass |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16/16 checks pass |
| documents | `node scripts/validate-docs.js` | 0 | 5/5 checks pass |

Full chain run once, as written:
`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` — exit 0.

Boot smoke check not applicable: the phase touches neither boot, preload, PWA
configuration, nor assets.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-2 | Five shuffle copies removed; all consumers import from `./random`; no re-export | P2.T3.1 grep (below): exactly one `function shuffle` definition in `src/game` (inside `random.ts`); zero shuffle imports from `shapeSorterLogic`; diff 474ef08a..d3efbdee removes 5 definitions | pass |
| AC-2 (shuffle half) | Exactly one `function shuffle` in `src/game`; zero `shuffle` imports from `shapeSorterLogic` | P2.T3.1 grep (below) | pass |
| NFR-1 | No behavior change | Fisher-Yates byte-identical (verified Phase 1 → `random.ts`); all 2687 tests pass unchanged on assertions; coverage gate green | pass |
| NFR-2 | Lint/typecheck clean | `pnpm check` / `pnpm typecheck` exit 0 | pass |
| NFR-3 | Coverage ≥ 95 L / 88 F / 85 B / 90 S | 98.74 / 96.77 / 91.57 / 97.81 | pass |
| Phase contract — no test or scene behavior changes | Test diffs are import swaps only; `artDeclarations.test.ts` change is an import-graph classification (see deviations), asserting no new texture-key behavior | git diff; unit suite green | pass |

## P2.T3.1 — grep proof (verbatim)

Proof A — exactly one `shuffle` definition in all of `src` (the grep tool
pattern is a regex; `[^Ww]` excludes the unrelated private `shuffleWith`
helpers in `feelingsFacesLogic.ts`/`storyOrderLogic.ts`, which are Phase 3
scope, not `shuffle`):

```
pattern: function shuffle[^Ww]
path:    src
Found 1 matches
C:\Users\Ansyar\Documents\Upskilling\games\aby-little-lab\src\game\random.ts:
  Line 21: export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
```

Proof B — zero shuffle imports from `shapeSorterLogic` in all of `src`:

```
pattern: shuffle.*from "\./shapeSorterLogic"|shuffle.*from "\.\./game/shapeSorterLogic"|shuffle.*from "\.\./\.\./game/shapeSorterLogic"
path:    src
No matches found
```

Proof C — the raw un-anchored pattern `function shuffle` in `src/game` shows
the only near-misses are the Phase 3 seamed helpers (not `shuffle` names):

```
Found 3 matches
src\game\feelingsFacesLogic.ts:  Line 67:  function shuffleWith<T>(...)
src\game\storyOrderLogic.ts:     Line 128: function shuffleWith<T>(...)
src\game\random.ts:              Line 21:  export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
```

Proof D — one-time pre-commit verification through the hub (now resolved):
`pnpm check` flagged one import-order fix in `shadowMatchLogic.test.ts`
(`random` sorts before `shadowMatchLogic`); fixed in this phase before the
gate run.

## Evidence paths

- This report: `conductor/tracks/20261025-shared-random-helpers/verification/phase-2.md`
- Diff: `git diff 474ef08a..d3efbdee` (25 files: 28 insertions, 70 deletions)

## Deviations

- `src/__tests__/scenes/artDeclarations.test.ts` — outside the brief's
  Touches list. The architecture tripwire "reads every game module a scene
  imports" scans every scene's raw source for `from "../game/<name>"` and
  requires each import to be classified as art-bearing
  (`GAME_MODULES`) or non-art (`NON_ART_GAME_MODULES`). The contract-mandated
  `ShapeSorterScene` re-point created an import edge to `/game/random`, which
  failed the tripwire (`expected [] to deeply equal ["ShapeSorterScene:
  random"]`). Smallest necessary change: added `"random"` to
  `NON_ART_GAME_MODULES` (alongside `dragBoard`) — a fact about the module
  (it names no texture keys), not new behavior; the test's checks otherwise
  run unchanged and now pass.

## Notes

- Task-level commit: `d3efbdee` `refactor: cut all shuffle consumers over to
  the shared random module` (covers P2.T1 + P2.T2 together — deleting the
  five exports and re-pointing the 15 importers are one atomic cutover; an
  intermediate commit would not typecheck).
- `patternBuilderLogic.test.ts` needed no swap: it never imported `shuffle`.
- No blocker at any point; both gate failures observed during the phase (the
  biomes import-order nit and the artDeclarations tripwire) were fixed within
  the allowed two-retry budget.
