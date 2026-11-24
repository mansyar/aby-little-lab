# Review: Reduce Find the Word cold first-tap latency

- **Track:** `20261124-word-match-first-tap`
- **Type:** `bug`
- **Branch:** `fix/20261124-word-match-first-tap`
- **Range:** `537c2351798e06b0c449068692b886507d89272e..4dc593bc`
- **Date:** `2026-11-24T20:48:12+11:00`
- **Verdict:** `PASS`

## Summary

The selective preload implementation preserves Find the Word gameplay and meets the unchanged 400 ms cold first-tap gate: the headed 50-cold run reports Find the Word p95 and worst at 251.2 ms, with every other game also below 400 ms. All configured checks and the full `verify_phase` chain pass. The sole Low documentation finding was fixed in R1, and re-review found no remaining findings.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| test | `pnpm test -- --run` | pass | 158 files / 3,393 tests |
| coverage | `pnpm test:coverage` | pass | Statements 97.10%, branches 90.96%, functions 96.35%, lines 98.23% |
| lint | `pnpm check` | pass | 373 files, no fixes |
| format | `pnpm exec biome format .` | pass | 373 files, no fixes (non-mutating) |
| typecheck | `pnpm typecheck` | pass | App + E2E clean |
| build | `pnpm build` | pass | Vite 8.3.8; 491 modules; shell 197.99 kB |
| integrated | full `verify_phase` chain | pass | `verification/integrated.md`, `INTEGRATED_GATE_EXIT=0`; R1 final tree `R1_VERIFY_PHASE_EXIT=0` |
| performance | headed cold-control 10×5 run | pass | 50 cold / 0 warm; Find the Word p95/worst 251.2 ms; all games <=400 ms |
| scope | package/lock and production diff audit | pass | Package/lock unchanged; production limited to `wordMatchArt.ts` and `WordMatchScene.ts` |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1.T2.1 | deterministic scene and word-logic tests; lifecycle tests | covered |
| FR-2 | P1.T1, P1.T2.2 | selector tests, scene preload spy, headed evidence | covered |
| FR-3 | P1.T2.1, P1.T3.2 | existing scene/integration/word-logic behavior tests | covered |
| FR-4 | P1.T1 | pure helper source guard and selector tests | covered |
| FR-5 | P2.T2 | `verification/first-tap-word-match.json` | covered |
| FR-6 | P3.T1 | `docs/perf-baseline.md` and `validate-docs` 5/5 | covered |
| FR-7 | P3.T2 | `verification/integrated.md` | covered |
| NFR-1 | all phases | empty package/lock diff | covered |
| NFR-2 | P1.T2, P3.T2.1 | production-scope audit | covered |
| NFR-3 | P2.T2, P3.T2.2 | unchanged gate and full `verify_phase` | covered |
| NFR-4 | P1.T3.2 | existing behavior tests and scope audit | covered |
| NFR-5 | P3.T2.2 | module-size/bundle/PWA/docs validators | covered |
| NFR-6 | P2.T1, P2.T2 | local headed Chromium and preview evidence | covered |
| AC-1 | P1.T1, P1.T3.1 | exact-key/order/dedupe/pool/adaptive selector tests | covered |
| AC-2 | P1.T2, P1.T3.2 | scene `load.svg` spy | covered |
| AC-3 | P1.T3.2 | deterministic/adaptive/completion/save tests | covered |
| AC-4 | P1, P3 | package/lock and production-scope audit | covered |
| AC-5 | P2.T2 | raw 50-cold JSON | covered |
| AC-6 | P3.T2.2 | integrated full-chain evidence | covered |
| AC-7 | P3.T1 | dated baseline and docs 5/5 | covered |
| AC-8 | P2 | passing headed run; no fallback used | covered |

## Findings

### Critical

- <none>

### High

- <none>

### Medium

- <none>

### Low

- **F1 — Historical suite rows need an explicit living-value label — resolved in R1**
  - **File:** `docs/perf-baseline.md:3`, with affected rows now at `:471`, `:810`, `:843`, `:904`
  - **What:** The live header and dated section prose said historical records kept their accepted-tree numbers while four suite rows showed current living counts.
  - **Why:** Unlabeled current counts made dated records misleading.
  - **Fix:** R1 labeled all four rows as current living values verified 2026-11-24 and narrowed the header and three historical introductions. No historical measurement value changed.
  - **Requirement:** none
  - **Test gap:** none; `validate-docs.js` passed 5/5 after the fix.

## Overrides

- <none>

## Plan compliance

All three implementation phases and Phase R1 are verified; all 24 planned tasks are complete. The documented test-only `artDeclarations.test.ts` allowlist deviation is narrow and does not weaken assertions. Package/lockfiles remain unchanged and production scope is limited to the approved scene/helper. R1 checkpoint `65144c59` resolves F1 without source or measurement changes.

## Out of scope

- <none>

## Debt

- <none>

## Doc sync

`updated` — R1 clarified living suite-count labels in `docs/perf-baseline.md`; `validate-docs.js` remains 5/5.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | PASS WITH FINDINGS | 0 | 0 | 0 | 1 | 0 |
| 2 | PASS | 0 | 0 | 0 | 0 | 1 |
