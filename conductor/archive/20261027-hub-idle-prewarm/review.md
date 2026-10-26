# Review: Hub Idle Chunk Prewarm — warm the lazy game chunks while children idle

- **Track:** `20261027-hub-idle-prewarm`
- **Type:** `feature`
- **Branch:** `feat/20261027-hub-idle-prewarm`
- **Range:** `cb5f713a..971841e9`
- **Date:** `2026-10-26`
- **Verdict:** `PASS`

## Summary

The track is ready. All three phases verified with checkpoints and evidence, the integrated gate is green end to end (126 files / 2,753 tests, coverage gates held, bundle/PWA/docs validators pass), and the read-only reviewer found zero findings across the full diff. The prewarm engine is self-contained, the Hub wiring is gated on the three required conditions with tap-wins ordering asserted by test, and the dated first-tap verdict honestly reports both the warm-tap win (27.2–64.9 ms) and the unchanged cold path. Strict mode is satisfied: no Critical or High findings exist to defer.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| lint | `pnpm check` | pass | 260 files, 1 pre-existing warning (`musicalMemoryScene.test.ts` `noNonNullAssertion`, untouched) |
| format | `pnpm format` | pass | 260 files, no fixes; tree clean afterwards |
| typecheck | `pnpm typecheck` | pass | `tsc --noEmit` clean |
| test | `pnpm test -- --run` | pass | 126 files / 2,753 tests passed |
| coverage | `pnpm test:coverage` | pass | statements 97.76 / branches 91.84 / functions 96.76 / lines 98.73 — gates 90 / 85 / 88 / 95 held |
| build | `pnpm build` | pass | 344 modules; precache 54 entries (1,722.35 KiB) |
| build-artifact | `node scripts/validate-bundle.js` | pass | Phaser vendor present; shell 140.9 kB ≤ 200 kB |
| build-artifact | `node scripts/validate-pwa.js` | pass | 16 passed / 0 failed; 42/42 precached |
| documents | `node scripts/validate-docs.js` | pass | 6 passed / 0 failed, count-drift guard derives 126 / 2,753 live |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1.T1 engine + P2.T1 Hub wiring | `src/__tests__/game/hub/prewarm.test.ts` (recency, pacing, one-in-flight); `hubScene.test.ts:994` tap-wins ordering | covered |
| FR-2 | P2.T1 gates + `syncPrewarm` | `hubScene.test.ts:930,951,975` locked-open / lock-mid-cycle / hidden-tab | covered |
| FR-3 | P1.T1 idempotent-silent engine | `prewarm.test.ts` swallow-rejection + retry-next-run + cancel tests | covered |
| FR-4 | P3.T1 `--warm-aware` + dated verdict | `docs/perf-baseline.md:432`; raw runs `.conductor/evidence/phase-3/*.json` | covered |
| FR-5 | P2.T1 shutdown + P3.T2 docs | `hubScene.test.ts:1012`; `TDD.md:557` §4.7; tech-stack Design Update entry | covered |
| NFR-1 | no visuals/sounds/UI in diff | full suite green + code inspection | covered |
| NFR-2 | boot path gains no work | shell 140.9 kB; 42/42 precache; validators green | covered |
| NFR-3 | TSDoc + clean gates | `pnpm check` / `pnpm typecheck` | covered |
| NFR-4 | no new dependencies | `package.json` / lockfile diff empty | covered |
| AC-1 | P1.T1 | `prewarm.test.ts` recency-first + idle pacing | covered |
| AC-2 | P1.T1 + P2.T1 | `prewarm.test.ts` cancel tests; `hubScene.test.ts` cancel-before-load ordering | covered |
| AC-3 | P2.T2 | `hubScene.test.ts` lock/hidden cases | covered |
| AC-4 | P1.T1 | `prewarm.test.ts` rejected-import swallowed, game still loadable | covered |
| AC-5 | P3.T1 | `perf-baseline.md:395` pointer + `:432` dated section; open text preserved at `:405` | covered |
| AC-6 | P3.T3 | integrated gate green; TDD + tech-stack present | covered |

## Findings

### Critical

- <none>

### High

- <none>

### Medium

- <none>

### Low

- <none>

## Overrides

- <none>

## Plan compliance

All 3 phases verified with checkpoints (`6a50ff5b`, `0369f7b0`, `34131419`) and evidence files. Touches respected: P1 prewarm engine + tests + count rows; P2 HubScene wiring + scene tests (the `hubPlayTime`/`navigation` `sceneLoaders: {}` doubles are required in-scope test-double updates, recorded as deviations); P3 measurement flag + docs verdict. No scope creep, no dependency changes, no unrelated refactors. Volume strategy: large (1,687 changed lines excl. conductor) — reviewed per-phase then cross-phase; no duplicate findings to merge.

## Out of scope

- <none>

## Debt

- <none> — no findings to defer, no issues to file (`review.issues.min_severity: medium`, zero findings at any severity).

## Doc sync

`updated` — `conductor/product.md` changelog entry for this track added post-integration (`971841e9`) and `validate-docs` re-run green. TDD §4.7, tech-stack Design Update, and the perf-baseline dated verdict were already present at review time.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | PASS | 0 | 0 | 0 | 0 | 0 |
