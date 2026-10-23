# Phase 1 Verification Report — The three compose-only knobs

| Field | Value |
|---|---|
| Track | 20261023-adaptive-banding-completion (Adaptive Difficulty Completion) |
| Phase | 1 — The three compose-only knobs |
| Date | 2026-10-23 |
| Branch | feat/20261023-adaptive-banding-completion |
| Base commit | 7e1e726 |
| Head commit | a18858c (feat(game): adaptive band knobs for the three compose-only games) |
| Result | **blocked** — 7 of 8 verification layers green; `node scripts/validate-docs.js` was denied by the permission system and could not run (unretryable per phase rules) |

## What was built

Pure, composing-only knobs — no content, art, audio, or interaction changes:

- **Shape Sorter (FR-1):** `poolFor(shift) : readonly ShapeType[]` in
  `src/game/shapeSorterLogic.ts`. Easy band = 9-shape pool of bold ornamental
  silhouettes (star, heart, crescent, ring, arrow, plus) plus three maximally
  distinct primitives (circle, square, triangle); hard band = 10-shape pool of
  confusable rounded/rectilinear families (circle/oval/semicircle,
  square/rectangle/diamond/trapezoid, pentagon/hexagon/octagon); classic band
  returns `ALL_SHAPES` unchanged, so shift-0 draws are byte-identical to
  shipped. `generatePlaythrough(roundCount, shift = 0)` shuffles the selected
  pool and slices it into roundCount triples. `shuffle`'s export untouched.
- **Animal Trace (FR-2):** `waypointsFor(shift) : number` in
  `src/game/animalTraceLogic.ts` (4 / 6 / 8). Scene drops the constant
  `PATH_POINTS`, samples `waypointsFor(getAdaptiveBandShift("animal-trace"))`
  once per session, and uses the value for path generation, progress and every
  read/advance. The two-harmonic curve generator is waypoint-count agnostic,
  endpoints stay pinned, and pairs/round count are untouched.
- **Pop & Freeze (FR-3):** `SleepingBounds` + `sleepingBoundsFor(shift)` in
  `src/game/popFreezeLogic.ts` ({0,1} / {1,2} / {2,3}). `selectBubbleType` and
  `generateInitialBubbles` take optional bounds (classic default), so the
  floor/max guards follow the band; at the {0,1} floor an all-poppable opening
  is legal and the fixed wake flow simply never triggers. `registerWake`
  remains a no-penalty no-op. Spawn physics, win target, wake behaviour and
  `MIN_SLEEPING`/`MAX_SLEEPING` constants unchanged.
- **Scene wiring:** each of the three scenes samples
  `getAdaptiveBandShift("<game id>")` exactly once inside `create()` and
  threads the value into the logic calls that build playthrough/state —
  mirroring the 14 shipped call-site pattern (e.g. ColorMatchScene). No
  mid-game re-sampling.

## Tests added (23; TDD — failing-first confirmed at every layer)

- `src/__tests__/game/shapeSorterLogic.test.ts` (+5): classic band = full
  18-shape pool; pool invariants at every band (≥9 pool entries, roundCount·3
  uniqueness, every drawn shape in the band pool); easy and hard pools
  distinguishable; hard-draw excludes easy-only ornaments; band-pool draw
  yields 3 unique shapes per round.
- `src/__tests__/game/animalTraceLogic.test.ts` (+4): classic 6 / easy 4 /
  hard 8 waypoints; three bands produce three distinct counts.
- `src/__tests__/game/popFreezeLogic.test.ts` (+8): classic 1-2; easy 0-1
  (with 0-floor all-poppable legality and no sleeping forced); hard 2-3 (both
  guard arms seeded); `generateInitialBubbles` honours the band (all-poppable
  opening at easy; ≥2 sleeping at hard under seed 0.5); spawn mix observably
  differs between bands under identical seed; bounds object itself pinned.
- `src/__tests__/scenes/shapeSorterScene.test.ts` (+3, nested
  "adaptive band wiring"): facade called once with "shape-sorter" and the
  shift forwarded to `generatePlaythrough` (hard + classic arms); three
  progress dots on every band.
- `src/__tests__/scenes/animalTraceScene.test.ts` (+2): shift sampled once
  with "animal-trace"; hard path carries 8 waypoints and `totalPoints` 8;
  easy path carries 4 waypoints, fully traceable, next pair loads, no early win.
- `src/__tests__/scenes/popFreezeScene.test.ts` (+2): shift sampled once with
  "pop-freeze"; hard band opens with exactly 2 sleeping animals (seed 0.5);
  easy band opens all-poppable (0 overlays) and a tap on bubble 0 pops
  (playPop once, playWake never — wake flow inert).

Pre-existing tests kept their outcomes with **zero edits** (105 targeted +
2,493 elsewhere).

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | Clean after fixing own findings; the two pre-existing findings remain unchanged (musicalMemoryScene noNonNullAssertion warning; biome.json schema-version info) |
| static | `pnpm typecheck` | 0 | Clean (after dropping two unused test-local bindings) |
| unit | `pnpm test -- --run` | 1 | 2515/2516 passed; sole failure = wall-clock timeout (5000 ms) in **untouched** `hubEngagement.test.ts` — the machine-noted host flake |
| unit (sanctioned retry) | `pnpm test -- --run --maxWorkers=1` | 0 | **118 files / 2516 tests, all pass**; ≥ 2,488-test gate cleared |
| unit | `pnpm test:coverage -- --maxWorkers=1` | 0 | Statements 97.91 ≥ 90; Branches 91.66 ≥ 85; Functions 96.59 ≥ 88; Lines 98.69 ≥ 95 |
| build-artifact | `pnpm build` | 0 | 325 modules; Phaser vendor chunk intact; PWA 54 precache entries |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Vendor chunk present; shell 134.6 kB ≤ 200 kB |
| smoke | `node scripts/validate-pwa.js` | 0 | 16/16 passed |
| smoke | `node scripts/validate-docs.js` | **n/a** | **Permission denied** — `{"error":{"type":"permission.rejected","message":"Permission denied: shell"}}`; denied calls are never retried per phase rules |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-1 | Every band shift produces observably different presentation for the adaptive games' key customization dimension | Logic tests: easy vs classic vs hard pools distinguishable (shape sorter), 4/6/8 waypoints (animal trace), 1-2 vs 0-1 vs 2-3 sleeping mix incl. seeded band-vs-band difference (pop & freeze); scene tests prove shift sampled once per band | pass |
| AC-2 | Every adaptive game still defaults to shipped behavior when the parent has never touched the toggle or profile | shift-0 regression arms in all three logic suites (`poolFor(0) === ALL_SHAPES` draw, `waypointsFor(0) === 6`, `sleepingBoundsFor(0) === {1,2}`) plus `generatePlaythrough(3, 0)`, `generatePathPoints(..., 6)` and classic `generateInitialBubbles` pins reproduce the pre-phase behaviour bit-for-bit; storage.test.ts already pins toggle-off → 0 | pass |
| NFR-1 (secondary) | Classic-default band parameters keep existing call sites neutral | All pre-existing logic/scene tests pass without edits; scene call sites compile as-is with defaults | pass |

## Evidence paths

- `.conductor/evidence/20261023-adaptive-banding-completion/full-suite-first-attempt.txt`
- `.conductor/evidence/20261023-adaptive-banding-completion/full-suite-maxWorkers1.txt`
- `.conductor/evidence/20261023-adaptive-banding-completion/coverage.txt`
- `.conductor/evidence/20261023-adaptive-banding-completion/static-gates.txt`
- `.conductor/evidence/20261023-adaptive-banding-completion/build-and-validators.txt`
- `.conductor/evidence/20261023-adaptive-banding-completion/tdd-targeted-runs.txt`

## Deviations

1. **Test layer invocations used the sanctioned worker flag** — the machine
   note's approved override. Plain `pnpm test -- --run` died on the known
   untouched-file timeout (`hubEngagement.test.ts`, 5000 ms) and coverage was
   run as `pnpm test:coverage -- --maxWorkers=1`. Both runs recorded in the
   commands table; no test edited to dodge the timeout. (Same deviation
   accepted by the primary in the two preceding tracks.)
2. **Two mid-authoring fixes inside newly written tests only** (a missing
   seeded roll; a hoisted-mock `mockClear()`), plus dropping two unused
   bindings and re-sorting one import — all inside this phase's test files
   and the new wiring, before commit. Zero edits to pre-existing tests.

## Notes / blockers

- **Blocker (why phase is `blocked`, not `verified`):** the verification
  chain's final command `node scripts/validate-docs.js` returned a permission
  envelope `{"error":{"type":"permission.rejected","message":"Permission denied: shell"}}`.
  Phase rules forbid retrying, rephrasing or working around a denied call.
  The command is part of the brief's verify chain (docs-consistency gate;
  the spec expects it green after counts move in Phase 4). Expected result if
  permitted: a green counts/links/docs consistency pass like the adjacent
  validators. Re-running this one command would unblock the phase result to
  `verified`.
- Everything else is green, including the two shipped-pre-existing Biome
  findings (message unchanged) and the shipped >500 kB Phaser chunk notice in
  `pnpm build` output.
- `conductor/tracks/20261023-adaptive-banding-completion/verification/phase-1.md`
  (this file) deliberately left uncommitted for the primary's state commit,
  alongside the one structural deviation queued for Phase 4: docs that record
  per-game adaptive coverage may need the count line updated once
  validate-docs runs.
- Next blocked step for the primary: `node scripts/validate-docs.js`.

## Primary verification

Verified independently by the primary (2026-10-23).

| Check | Result |
|---|---|
| Working tree | Clean except the phase-evidence file (declared: left uncommitted for the primary's state commit) |
| Commits since phase base `7e1e726` | `a18858c feat(game): adaptive band knobs for the three compose-only knobs` - exactly the one reported commit, no merges, no foreign commits |
| Files changed vs Touches | Exactly the 12 Touches paths - logic modules, scenes, and the 6 test files; nothing outside Touches |
| Source diff review | `poolFor` (easy ornamental 9 / classic ALL_SHAPES full 18 / hard confusable 10) with classic byte-identical draws; `waypointsFor` 4/6/8 with the scene's `PATH_POINTS` constant removed; `sleepingBoundsFor` + `SleepingBounds` threaded through `selectBubbleType` and `generateInitialBubbles` with default parameters preserving every existing call signature; `registerWake` and `shuffle` untouched; all three scenes sample `getAdaptiveBandShift` exactly once in `create()` in the shipped pattern |
| Targeted tests | 6 test files / 122 tests pass (including the 23 new ones) |
| `pnpm check` | exit 0 - only the two pre-existing findings (musicalMemoryScene.test.ts:294 warning, biome.json $schema info) |
| `pnpm typecheck` | exit 0 |
| `pnpm test -- --run --maxWorkers=1` | exit 0 - 118 files / 2516 tests (341.62 s) |
| `pnpm test:coverage -- --maxWorkers=1` | exit 0 - statements 97.91 / branches 91.66 / functions 96.59 / lines 98.69 (gates 90/85/88/95) |
| `pnpm build` | exit 0 - 54 precache entries; shell within gate |
| `node scripts/validate-bundle.js` | exit 0 |
| `node scripts/validate-pwa.js` | exit 0 - 16 passed |
| `node scripts/validate-docs.js` | exit 0 - run directly by the primary; the phase's permission-denied blocker did not reproduce outside the subagent's allowlist |

### Deviations reviewed

1. The `--maxWorkers=1` form for both test layers - accepted under the workflow's fallback ladder, consistent with the two preceding tracks on this host; no test was edited to work around a timeout.
2. Two mid-authoring fixes confined to newly written tests - reviewed in the diff; correct.
3. The evidence file written outside Touches - expected; committed by the primary with the phase state.

**Primary result:** verified. The reported blocker is resolved by direct execution.
