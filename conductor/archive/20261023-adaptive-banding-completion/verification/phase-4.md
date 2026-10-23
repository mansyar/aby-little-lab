# Phase 4 — The documentation truth pass

- **Track:** 20261023-adaptive-banding-completion (Adaptive Difficulty Completion)
- **Phase:** 4 of 5
- **Date:** 2026-10-23
- **Branch:** `feat/20261023-adaptive-banding-completion`
- **Phase base:** `d4bd606`
- **Head commit:** `7e48bcf` (docs) — evidence committed separately after this file
- **Result:** blocked (single blocker: `node scripts/validate-docs.js` denied by the subagent shell allowlist; every other command in the chain exited 0)

## Commands

| Command | Exit | Notes |
| --- | --- | --- |
| `pnpm check` | 0 | two pre-existing findings only (musicalMemoryScene noNonNullAssertion warning; biome.json schema-version info) |
| `pnpm typecheck` | 0 | |
| `pnpm test -- --run` | 1 | 2555/2556 passed; wall-clock timeout in the untouched `hubEngagement.test.ts` (same host flake as phases 1–3); no test edited |
| `pnpm test -- --run --maxWorkers=1` | 0 | sanctioned retry: 119 files, 2,556 tests, all green |
| `pnpm test:coverage -- --maxWorkers=1` | 0 | statements 97.94 / branches 91.88 / functions 96.6 / lines 98.7 vs gates 90/85/88/95 |
| `pnpm build` | 0 | 342 modules; 54 precache entries (1,722.25 KiB); 42 JS chunks |
| `node scripts/validate-bundle.js` | 0 | shell 134.6 kB ≤ 200 kB; Phaser 1,342.6 kB |
| `node scripts/validate-pwa.js` | 0 | 16/16; 42 chunks, 42 precached |
| `node scripts/validate-docs.js` | denied | permission denied by shell allowlist — recorded under blockers, no workaround |

The four check commands before the test layers ran before the final figure-bearing doc edits
(test counts, chunk sizes); only `*.md` files changed after those runs, which the tests, build
and bundle validators do not read. `node scripts/validate-docs.js` is the one link/anchor check
and it is the blocker above.

## AC-4

| Criterion | State |
| --- | --- |
| PRD §4.8 and TDD §7.3 describe all 22 adaptive games, with the seven new games' table rows | Done — PRD §4.8 rewritten to "All 22 games adapt" with a per-game paragraph for the seven; TDD §4.5 rows 1/2/3/4/6/21/22 flipped `fixed` → `adaptive`; TDD §7.3 rewritten to "All 22 games read the shift" with the six ladder routes plus seven single-dimension bullets |
| Roadmap: resolved Known Issue and Future Work item removed, entries re-flow | Done — Known Issue "Seven games never shift their difficulty" deleted (8 → 7 entries); Future Work item 1 (adaptive-banding-completion) deleted, list renumbered 1–5 |
| README headline Known Issues list at seven | Done — the "Seven of the 22 games" bullet deleted; "eight of them" → "seven of them" (matches the 7 `###` entries in roadmap Known Issues) |
| `conductor/product.md` changelog entry | Primary's job (executor may not edit `conductor/**` except this evidence file) |
| `validate-docs` green | Blocked in subagent — permission denied; primary must run it (it ran exit 0 in phases 1–3) |

## Fact table — every figure changed, with derivation

| # | File · location | Old → New | Derivation |
| --- | --- | --- | --- |
| 1 | PRD §3.1 Shape Sorter Difficulty | "Fixed. Three rounds of three, no band ladder." → "Adaptive. The band selects the shape pool… nine ornamental / all 18 / ten confusable geometric families." | `shapeSorterLogic.poolFor(shift)` (phase-1 tests) |
| 2 | PRD §3.2 Animal Trace Difficulty | "Fixed. Three pairs, no band ladder." → "Adaptive. Three pairs at every shift; … four, six or eight waypoints" | `animalTraceLogic.waypointsFor(shift)` 4/6/8 |
| 3 | PRD §3.3 Pop & Freeze Rounds + Difficulty | "one or two of them sleeping animals" → "…in the classic band"; "Fixed. Six pops, one to two sleeping decoys, no band ladder." → "Adaptive. Six pops at every shift; none or one / one or two / two or three" | `popFreezeLogic.sleepingBoundsFor(shift)` {0,1}/{1,2}/{2,3} |
| 4 | PRD §3.4 Shadow Match Rounds/Difficulty/Art | pool of eight → pool of twelve (+ sock, boot, kite, bell); "Six of eight objects" → "Six of the twelve objects… one per confusable pair / any six / three full confusable pairs"; Eight object+shadow SVGs → Twelve | `shadowMatchLogic.generateRound(shift)`; `CONFUSABLE_CLUSTERS` = 12 objects in 6 pairs; shadows/ = 12 files |
| 5 | PRD §3.6 Big & Small Difficulty | "Fixed. Big toys render at 1.5 times… 0.7…" → "Adaptive. … 1.6/0.68, 1.5/0.7, 1.35/0.8" | `bigSmallLogic.scaleFactorsFor(shift)` |
| 6 | PRD §3.21 Feelings Faces Rounds/Difficulty | "pool of 16 scenarios, four per emotion" → "pool of 24 scenarios, six per emotion"; "Fixed ladder, with a built-in contrast ramp…" → "Adaptive. The band sets the contrast ramp: all distinct / three-and-three / all confusable" | `feelingsFacesLogic.SCENARIO_POOL` = 24 (6 per emotion); `contrastSplitFor(shift)` |
| 7 | PRD §3.22 Story Order Rounds/Difficulty/Art | "pool of eight… four obvious… four subtle" → "pool of eleven… five obvious (…whole cake to candles to slices)… six subtle (…wet clothes…, sunrise to sunset)"; "Fixed ladder…" → "Adaptive. … five and one / three and three / one and five"; 24 panel SVGs → 33 | `storyOrderLogic.STORY_POOL` = 11 stories (5+6), 33 panels; `mixFor(shift)` 5+1/3+3/1+5 |
| 8 | PRD §4.8 lead | "Fifteen of the 22 games adapt. The other seven are fixed: …" → "All 22 games adapt. When a game's difficulty moves, it moves for the whole playthrough…" | all 22 scenes sample `getAdaptiveBandShift` once in `create()` |
| 9 | PRD §4.8 | "The fifteen adaptive games are…" → "The first fifteen adaptive games are…" + new paragraph naming the seven and their single dimensions | phase 1–3 shipped knobs |
| 10 | PRD §7.2 Story Order panels | "Story Order's 24 panels" → 33 | `storyOrderArt`/`STORY_PANEL_ASSETS` = 33; `shellOwnership.test.ts` asserts storyKeyToFile.size 33 |
| 11 | PRD §7.2 chunk figures | "about 32 kB… 24 panel drawings" → "about 40 kB… 33 panel drawings" | build output: `StoryOrderScene-*.js` = 40.32 kB |
| 12 | PRD §7.2 lazy-art coverage | "149 of the app's 202 art files" → "166 of the app's 219 art files" | 133 game-only group keys + 33 story panels = 166; 219 − 166 = 53 shell files |
| 13 | PRD §7.2 twelve groups | "131 keys in all… 125 of them game-only" → "139 keys… 133 of them game-only" | `shellOwnership.test.ts` asserts groupKeyToFile.size 139 and gameOnlyKeys 133 (131 + 4 items + 4 shadows = 139) |
| 14 | TDD §2.2 tree | svg/ "202 tracked illustrations" → 219; items 23→27, shadows 8→12, stories 24→33 | `git ls-files src/assets/svg` per-folder counts |
| 15 | TDD §2.3 intro | "202 `.svg` files" → 219 | same |
| 16 | TDD §2.3 corpus table | items row 23→27 (added bell, kite, sock, boot to the name list, alphabetical); shadows row 8→12 (added _bell, _boot, _kite, _sock); stories row "8 story strips" → "11 story strips of 3 panels"; Total 202 → 219 | folder listings + stories/ = 11 strips × 3 |
| 17 | TDD §3.3 | "208 texture keys in the app… 202 art files" → "219 texture keys… 219 art files" | 219 = 186 canonical keys (53 shell + 139 group − 6 shared; pinned by `CANONICAL_ASSET_COUNT`/`APP_ASSET_COUNT` = 186) + 33 story panels; every SVG file maps to exactly one key |
| 18 | TDD §3.5 history line | "202 art files and 208 texture keys" → 219/219 | same |
| 19 | TDD §3.5 twelve groups | items (16)→(20), shadows (8)→(12), "131 keys" → "139 keys", "125" → "133" | group tables: items group 27 folder files − 6 food-group foods − ball (toy group) = 20 keys; shellOwnership.test.ts |
| 20 | TDD §3.5 Story Order | "the 24 panels"/"the 24 SVG strings" → 33 | storyOrderArt.ts |
| 21 | TDD §3.5 boundary test | "131 group keys, 125 game-only, 24 story panels" → "139 group keys, 133 game-only, 33 story panels" | shellOwnership.test.ts assertions |
| 22 | TDD §3.6 budget table | "nine emit chunks of 3.1–16.5 kB" → "3.1–19.4 kB" | build: items chunk 19.39 kB is the largest art chunk |
| 23 | TDD §3.6 budget table | "Story Order chunk ~31.8 kB, includes all 24 panel SVGs" → "~40.3 kB, includes all 33 panel SVGs" | build: 40.32 kB |
| 24 | TDD §3.6 shared-logic sizes | `shapeSorterLogic` 0.45 kB → 0.68 kB | build: `shapeSorterLogic-*.js` 0.68 kB (grew with `poolFor`) |
| 25 | TDD §4.5 table rows 1,2,3,4,6,21,22 | `fixed` → `adaptive` | phases 1–3 shipped the knobs |
| 26 | TDD §4.5 tail | "Fifteen games call getAdaptiveBandShift; the seven fixed ones are…" → "All twenty-two games call getAdaptiveBandShift." | 22 scenes each sample the shift once |
| 27 | TDD §8 module table | `storyOrderArt.ts` "24 story panel SVGs" → 33 | storyOrderArt.ts |
| 28 | TDD §7.3 module table | `art/` "131 keys" → "139 keys" | shellOwnership.test.ts |
| 29 | TDD §7.3 prose | "Fifteen of the 22 games read the shift. The seven that do not… fixed ladder" → "All 22 games read the shift… sampled exactly once in create()"; "The same shift reaches the fifteen games" → "The fifteen band-ladder games receive the shift"; new seven-bullet list of the single-dimension selectors (`poolFor`, `waypointsFor`, `sleepingBoundsFor`, `generateRound(shift)`, `scaleFactorsFor`, `contrastSplitFor`, `mixFor`) | phases 1–3 shipped knobs |
| 30 | TDD §10.2 suite shape | "118 test files, 2,488 tests (verified 2026-10-22)" → "119 test files, 2,556 tests (verified 2026-10-23)" | measured today |
| 31 | TDD §10.3 coverage | "97.92 / 91.62 / 96.58 / 98.69 across 118 files and 2,488 tests" → "97.94 / 91.88 / 96.6 / 98.7 across 119 files and 2,556 tests (verified 2026-10-23)" | measured today |
| 32 | TDD §11 manual-check list | "real rasterisation of the 202 SVGs" → 219 | folder count |
| 33 | roadmap Known Issues | "### Seven games never shift their difficulty" + paragraph deleted; 8 entries → 7 | track resolves the issue |
| 34 | roadmap Future Work | item 1 "Let the seven fixed games adapt… Track: adaptive-banding-completion" deleted; list renumbered 1–5 (was 1,3,4,7,8,9) | track delivers the item |
| 35 | README Known Issues | "The full list - eight of them" → "seven of them"; the "Seven of the 22 games never shift difficulty" bullet deleted | 7 `###` entries remain in roadmap |
| 36 | README coverage snapshot | "2,488 tests across 118 files… (verified 2026-10-22)" → "2,556 tests across 119 files… (verified 2026-10-23)" | measured today |
| 37 | SVG_STYLE purpose | "All 202 SVGs" → "All 219 SVGs" | folder count |
| 38 | SVG_STYLE §8 inventory | "202 SVGs" → 219; items 23→27 (note + bell, kite, sock, boot), shadows 8→12, stories 24→33 | folder counts |

Deliberately left untouched: dated/historical sections — README release-notes table rows
(v1.18.0 "15 games", v1.19.0 "16-scenario pool", v1.20.0 "8-story pool", line 158's 2026-10-22
bundle snapshot), `docs/release-notes-*.md`, `docs/device-testing-checklist.md` and
`docs/release-checklist.md` (outside Touches), PRD §4.8's six existing strategy bullets, and
`docs/perf-baseline.md`.

## Evidence paths

- `conductor/tracks/20261023-adaptive-banding-completion/verification/phase-4.md` (this file)
- `.conductor/evidence/20261023-adaptive-banding-completion/phase-4-commands.md` (raw command output; gitignored)

## Deviations

- README line 49, TDD §10.2 and §10.3 suite/coverage snapshots, TDD §3.6 chunk figures and
  `shapeSorterLogic` chunk size were refreshed beyond the brief's listed anchors: they are
  count-bearing claims that this track's shipped code (68 new tests, new chunks) invalidates,
  and every replacement number was re-measured in this phase's runs. No edit outside the five
  `Touches` paths and this evidence file. No test file was edited this phase.

## Blockers

- `node scripts/validate-docs.js` — permission denied by the subagent shell allowlist
  (same denial as phases 2 and 3). Exact command recorded; no workaround used. The primary
  ran this validator exit 0 in phases 1–3 and should re-run it to close AC-4.

## Notes

- The plain `pnpm test -- --run` failure is the documented host flake (untouched
  `hubEngagement.test.ts` wall-clock timeout); the sanctioned `--maxWorkers=1` retry passed
  fully, as in phases 1–3.
- The 42-chunk figure and the nine-art-group/inline split are unchanged by this track;
  only the items and Story Order chunk sizes moved (19.39 kB and 40.32 kB).
- `conductor/product.md` changelog and any version bump / release notes remain the primary's
  decisions; nothing under `conductor/**` besides this evidence file was written.

## Primary verification

Verified independently by the primary (2026-10-23). The phase's one blocker was cleared by the primary: `node scripts/validate-docs.js` exit 0 (5/5, "All document validation checks passed!").

| Check | Result |
|---|---|
| Working tree | Clean (evidence file committed by the phase) |
| Commits since phase base `d4bd606` | `7e48bcf` (the five documents), `676eec0` (the evidence) - exactly as reported, no merges |
| Files changed vs Touches | The five Touches paths + the evidence file, nothing else |
| Doc diff review | PRD: per-game Difficulty lines for the seven new participants ("Adaptive." with the concrete band behaviour - pool/waypoints/sleeping bounds/clusters/scale factors/contrast split/story mix), §4.8 rewritten to 22/22; TDD: §4.5 rows and the shift chapter updated, suite/coverage/chunk figures refreshed to re-measured values; roadmap: the resolved Known Issue and Future Work item deleted, 7 Known Issues remain, Future Work renumbered 1-5; README: the headline bullet removed, the roadmap summary count matches; SVG_STYLE: 219 total with items 27 / shadows 12 / stories 33 re-derived |
| Deviations reviewed | The refreshed count-bearing snapshots (2,488/118 to 2,556/119 tests, coverage figures, chunk sizes 0.45 to 0.68 kB shapeSorterLogic / 31.8 to 40.3 kB StoryOrderScene) - beyond the brief's anchors but required because the shipped code invalidates them; every replacement re-measured in this phase's runs. Accepted |
| `pnpm check` | exit 0 - 249 files, the two pre-existing findings only |
| `pnpm typecheck` | exit 0 |
| `pnpm test -- --run --maxWorkers=1` | exit 0 - 119 files / 2556 tests |
| `pnpm test:coverage -- --maxWorkers=1` | first attempt exit 1 on a single 5,000 ms wall-clock timeout (`patternBuilderLogic.test.ts`, an untouched pure-logic file, under coverage instrumentation); retry with `--testTimeout=30000` exit 0 - 119 files / 2556 tests, statements 97.92 / branches 91.81 / functions 96.6 / lines 98.7 (gates 90/85/88/95) - accepted under the workflow's retry policy, no test edited |
| `pnpm build` + `validate-bundle.js` + `validate-pwa.js` | exit 0 - 342 modules; shell `index-5BMI4mqt.js` 134.6 kB; 54 precache entries (1722.25 KiB); 16/16 |
| `node scripts/validate-docs.js` | exit 0 - 5/5 (primary's own run) |

**Primary result:** verified.
