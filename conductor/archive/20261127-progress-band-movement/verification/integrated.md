# Integrated Verification — Surface adaptive-band movement on the Progress Overview

- Track: `20261127-progress-band-movement`
- Date: 2026-11-27
- Branch: `feat/20261127-progress-band-movement`
- Base: `07d5c108684519581e088abcc9437905d50607ae`
- Head before this record: `5584991b6a8d1d479a2272022c238c20e111308b`
- Range: `07d5c108..5584991b`
- Result: **verified**

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Format/lint | `pnpm check` | 0 | Biome checked 378 files; no fixes applied. |
| Types | `pnpm typecheck` | 0 | App and E2E TypeScript clean. |
| Unit | `pnpm test -- --run` | 0 | 159 files / 3,451 tests passed. |
| Coverage | `pnpm test:coverage` | 0 | 97.12% statements / 91.04% branches / 96.4% functions / 98.25% lines; all above configured gates. |
| Build | `pnpm build` | 0 | 493 modules transformed; built in 1.06 s. Only the pre-existing Phaser chunk-size advisory. |
| Bundle | `node scripts/validate-bundle.js` | 0 | PASS; shell `index-CK_dfCdR.js` 196.2 kB (<= 200 kB); Phaser vendor chunk present. |
| Module size | `node scripts/validate-module-size.js` | 0 | PASS; 174 TypeScript files, zero warnings. |
| Textures | `node scripts/validate-textures.js` | 0 | PASS; 319 SVGs; all budgets passed. |
| PWA | `node scripts/validate-pwa.js` | 0 | 16 passed / 0 failed; 53 JavaScript chunks precached. |
| Docs | `node scripts/validate-docs.js` | 0 | 5 passed / 0 failed. |
| Full gate | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | 0 | Run independently by the primary after both phases; all ten checks green. |

## Acceptance criteria

| ID | Status | Evidence |
| --- | --- | --- |
| FR-1 | verified | `adaptiveSummary.ts` derives assessed/easier/classic/harder counts from normalized progress using `MIN_SAMPLE` and `bandShiftFor`; boundary, malformed-window, and no-mutation tests pass. |
| FR-2 | verified | Explicit mixed, all-classic, sparse, and disabled copy is covered by deterministic unit tests. |
| FR-3 | verified | `ProgressOverlay` derives from `getProgress(viewedId)`; viewed-profile switching test passes. |
| FR-4 | verified | Adaptive-off path returns the disabled state before assessing windows; component and unit tests pass. |
| FR-5 | verified | Dynamic readout renders only on Overview page 0; component test asserts per-game pages retain the static note. |
| FR-6 | verified | Three insight statements, activity strip, paging, per-game rows, and per-game static note remain covered and unchanged in behavior. |
| FR-7 | verified | Unit/component tests cover mixed, sparse, all-classic, disabled, viewed-profile switching, short/malformed windows, thresholds, and no mutation. |
| FR-8 | verified | PRD §4.7 and the dated changelog describe the current snapshot, evidence floor, four states, Overview-only replacement, and preserved pages. |
| FR-9 | verified | README/TDD/perf-baseline living counts and build figures match the gate; historical release notes are unchanged. |
| NFR-1 | verified | Final scope adds no storage, schema, migration, dependency, asset, network, or PII change. |
| NFR-2 | verified | Helper is pure and deterministic; no clock or storage dependency; seeded/deterministic tests pass. |
| NFR-3 | verified | Parent-only, text-first copy with explicit states and no color-only meaning or longitudinal claim. |
| NFR-4 | verified | Reuses adaptive constants/helpers; module-size guard passes with zero warnings. |
| NFR-5 | verified | Exact configured gate and docs validator pass. |
| AC-1 | verified | Mixed fixture returns exact counts and deterministic copy. |
| AC-2 | verified | All-classic fixture renders the explicit all-at-classic state. |
| AC-3 | verified | Fewer than six recent taps renders the not-enough-play state. |
| AC-4 | verified | Adaptive off renders disabled even with sufficient taps. |
| AC-5 | verified | Viewed-profile chip changes the spread to that profile's data. |
| AC-6 | verified | Only Overview note changes; statements and per-game-page note remain. |
| AC-7 | verified | Short/malformed windows are ignored; inputs are not mutated. |
| AC-8 | verified | Full gate passes with 3,451 tests and docs 5/0. |
| AC-9 | verified | PRD/changelog distinguish current spread from unmeasured longitudinal movement; historical release notes unchanged. |

## Evidence

- Phase 1: `conductor/tracks/20261127-progress-band-movement/verification/phase-1.md` — checkpoint `df98e3246122e3f98af41e883d0facd6d061407c`.
- Phase 2: `conductor/tracks/20261127-progress-band-movement/verification/phase-2.md` — checkpoint `40db0123df856890b1e2bf5dd13008ea1ffa5650`.
- Visual smoke: `.conductor/media/20261127-progress-band-movement/progress-band-overview.png` is uncommitted and shows a seeded mixed-state Overview.
- Scope proof: committed range contains Conductor state, two production modules, three test files, and living docs. No asset, schema, dependency, configuration, storage, release-note, or generated-build file changed.
- The post-implementation roadmap §10.3 truth sync was present in the working tree during this integrated gate and is committed separately as doc sync; it changes only “not surfaced” wording and explicitly keeps the two-week target unmeasured.

## Deviations

- `src/__tests__/components/SettingsPanel.test.ts`: one legacy static-Overview-note assertion was updated to the new sparse-state copy; no production code changed. Approved during Phase 1 acceptance.
- Both phase executors were denied the exact chained shell command once. Per brief they did not retry or work around it; the primary ran the exact command unchanged and recorded exit 0 for each phase and this integrated gate.

## Notes

- No stored transition history exists; this track intentionally surfaces current spread only.
- No family data, PII, evidence directory, clock value, telemetry, or longitudinal measurement was introduced.
- Two concerns are reserved for independent review: whether non-adaptive games should count in the spread, and whether the long Overview line remains comfortable on narrow viewports.
- Media under `.conductor/media/` is not committed and must not enter the archive or PR diff.
