# Phase 2 verification — Story & scenario depth

- Phase base: `c8f88883`
- Branch: `feat/20261121-content-depth`
- Result: **PASS** — full suite green (153 files / 3,340 tests), all five verification commands exit 0.

## Verification commands (each run separately, no `&&` chains)

| Command | Exit code | Evidence |
|---|---|---|
| `pnpm exec vitest run src/__tests__/game/storyOrderLogic.test.ts src/__tests__/game/storyOrderArt.test.ts src/__tests__/game/feelingsFacesLogic.test.ts` | 0 | 3 files passed, 80 tests passed (run twice — before and after final import-order fixes) |
| `pnpm exec vitest run` | 0 | 153 files passed, 3,340 tests passed (run three times: initial full sweep found one stale count, fixed, then green twice — including after randomness-bearing golden updates) |
| `node scripts/validate-docs.js` | 0 | Results: 5 passed, 0 failed (includes "The living docs state the current test-suite truth") |
| `pnpm check` | 0 | Checked 341 files. No fixes applied. (Two import-order findings were fixed manually before the final green run.) |
| `pnpm typecheck` | 0 | `tsc --noEmit && tsc --noEmit -p e2e/tsconfig.json` clean |

## Exact pool counts (derived from source)

- `STORY_POOL`: **30** stories — 15 obvious (7 original + 8 new) and 15 subtle (8 original + 7 new).
- `STORY_PANEL_ASSETS`: **90** panels (3 per story), strict bijection with `STORY_POOL.flatMap(s => s.panels)`; 45 new original in-repo SVGs added under `src/assets/svg/stories/`.
- `SCENARIO_POOL`: **48** scenarios — exactly 12 per emotion (happy/sad/angry/scared).
- Variants: 2 story variants (`growing-things`, `everyday-changes`) and 2 scenario variants (`outdoors-and-play`, `home-and-friends`), all pure opt-in selectors over non-empty strict subsets with unique ids; no rule function altered.

## Acceptance criteria

| AC | Verdict | Evidence |
|---|---|---|
| AC-2 (story pool floor, ladder, hard-coded goldens) | PASS | 30 stories, 15/15 band split, 90 panels; `storyOrderLogic.test.ts` seed goldens re-derived and passing |
| AC-3 (scenario pool floor, 12/emotion, safety) | PASS | 48 scenarios, 12 per emotion, unique ids/text, ≤60 chars, unsafe-word guard intact; seed goldens re-derived |
| AC-5 (two variants per pool, rules unchanged) | PASS | 8 new variant tests across the three phase test files assert exactly two variants, strict-subset purity, unique ids, selector errors, and rule functions byte-identical |

## Implementation notes

- Added 45 original flat storybook SVGs (512×512 viewBox, pastel fills, `stroke="#2D3748"`, no gradients/filters/text), registered in `src/game/storyOrderArt.ts` (90 imports/rows) and `src/game/hub/prewarm.ts` `STORY_PANEL_KEYS` (90 `[key, CARD]` rows).
- Fixed stale counts in `storyOrderLogic.test.ts` (counts, panel totals, band split, four seed golden blocks), `storyOrderArt.test.ts` (45→90 in four places), `feelingsFacesLogic.test.ts` (counts, extension history, three seed goldens), `shellOwnership.test.ts` (45→90 story panels), and `storyOrderScene.test.ts` (three 45→90 assertions).
- Updated living test counts 3,332 → 3,340 in `README.md`, `docs/TDD.md`, `docs/perf-baseline.md`; file count 153 unchanged.
- New modules: `src/game/storyVariants.ts`, `src/game/scenarioVariants.ts`.

## Deviations

- `src/__tests__/scenes/storyOrderScene.test.ts` was not named in the brief/plan Touches, but its three hard-coded "45 story panels" assertions had to be updated (45→90) for the full suite to be green. It is a stale-count-only change (test name + two assertions); no behavior or rule change.
- `src/game/hub/prewarm.ts` and `src/__tests__/game/art/shellOwnership.test.ts` are named ripple files in the brief and were updated accordingly.

## Blockers

None.

## Primary verification (orchestrator, independent)

- Working tree clean before verification; `git diff --name-only c8f88883..HEAD` confined to
  authorized Phase 2 Touches (story/scenario logic + art + variants + 45 SVGs + ripple count tests +
  living test-count docs + this evidence). Three commits: `aaafed1e`, `68102fa8`, `ca93249c`.
- Full `verify_phase` chain re-run by the primary and passed (exit 0):
  `pnpm check` (Biome clean, 341 files) → `pnpm typecheck` (src + e2e `tsc --noEmit` clean) →
  `pnpm test -- --run` (153 files / 3,340 tests) → `pnpm test:coverage` (153 files / 3,340 tests;
  97.14% stmts / 90.97% branches / 96.25% funcs / 98.31% lines, all above gates 95/88/85/90) →
  `pnpm build` (462 modules; shell `index-Bkt6cIfM.js` 192.39 kB Vite / 187.9 kB via validator ≤ 200 kB;
  Phaser vendor 1,367.08 kB pre-existing advisory; storyOrderArt chunk 81.84 kB) →
  `node scripts/validate-bundle.js` (PASS, shell 187.9 kB) → `node scripts/validate-pwa.js`
  (16/16, BGM precached, 51/51 JS chunks) → `node scripts/validate-docs.js` (5/5).
- Pool counts re-confirmed from source by the primary: 30 `STORY_POOL` ids, 90 `story_*.svg` panel
  files, 48 scenarios (tests assert 12/emotion), `STORY_VARIANTS` + `SCENARIO_VARIANTS` present.
- Deviation accepted: `storyOrderScene.test.ts` stale-count-only update (45→90) is in scope.
- Result: **verified**.
