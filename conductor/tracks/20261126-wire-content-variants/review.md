# Review: Wire the four signature content variants into real playthroughs

- **Track:** `20261126-wire-content-variants`
- **Type:** `feature`
- **Branch:** `feat/20261126-wire-content-variants`
- **Range:** `f328437f4ac464a5bde808c8dc4cdf058c77d130..01faa59dec21ec3605c0b9050b7c56d907f04685`
- **Date:** `2026-11-26T22:10:33+11:00`
- **Verdict:** `PASS`

## Summary

The four signature content variants are now reachable in real playthroughs: a
pure selector draws one slide per playthrough and each generator applies a
full-pool fallback when a thin variant cannot satisfy its invariants. All four
scenes forward the slide while round counts, scoring, completion and adaptive
bands remain unchanged. FR-1..FR-9, NFR-1..NFR-5 and AC-1..AC-9 are covered;
the exact configured gate passed with exit 0, and the read-only reviewer
independently re-ran the docs validator at 5 passed / 0 failed in both rounds.
The first review reported one Low spec/plan inconsistency (F1); strict mode
requires no deferrals, so F1 and two adjacent evidence inaccuracies were fixed
in one round and the reviewer returned `PASS` with no findings.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| format/lint | `pnpm check` | pass (376 files) | `verification/integrated.md` |
| typecheck | `pnpm typecheck` | pass (app + E2E) | `verification/integrated.md` |
| unit/e2e tests | `pnpm test -- --run` | pass (158 files / 3435 tests) | `verification/integrated.md` |
| coverage | `pnpm test:coverage` | pass (97.11 % stmts / 90.97 % branches / 96.39 % funcs / 98.24 % lines) | `verification/phase-R1.md` |
| build | `pnpm build` | pass (492 modules; pre-existing chunk advisory) | `verification/integrated.md` |
| bundle/module/texture/PWA guards | `node scripts/validate-bundle.js`, `validate-module-size.js`, `validate-textures.js`, `validate-pwa.js` | pass (195.3 kB shell; zero module warnings; PWA 16 / 0) | `verification/integrated.md` |
| docs | `node scripts/validate-docs.js` | pass (5 / 0), re-run by reviewer in both rounds | `verification/integrated.md`, reviewer reports |
| scope | `git diff --name-only f328437f..HEAD` | pass (source, tests, living docs and Conductor state only) | `verification/integrated.md` |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1.T1 | `src/game/contentVariants.ts`, seeded `pickVariantId` tests in `wordLogic.test.ts` | covered |
| FR-2 | P1.T2 | `src/game/wordLogic.ts`, `wordLogic.test.ts` | covered |
| FR-3 | P1.T3 | `src/game/storyOrderLogic.ts`, `storyOrderLogic.test.ts` | covered |
| FR-4 | P1.T4 | `src/game/shapeSorterLogic.ts`, `shapeSorterLogic.test.ts` | covered |
| FR-5 | P1.T5 | `src/game/feelingsFacesLogic.ts`, `feelingsFacesLogic.test.ts` | covered |
| FR-6 | P2.T1–T3 | four scenes + six scene/flow tests | covered |
| FR-7 | P1.T2–T5 | no-variant parity tests and unchanged seeded goldens | covered |
| FR-8 | P1.T2–T5, P2.T1–T3 | seeded two-slide tests, full gate | covered |
| FR-9 | P3.T1–T3 | `docs/PRD.md` §4.11, `docs/TDD.md`, `docs/changelog.md` | covered |
| NFR-1 | P1.T1, P2.T2, P3.T3 | base-to-HEAD scope proof | covered |
| NFR-2 | P1.T1–T5 | pure selector/filters, seeded determinism tests | covered |
| NFR-3 | P2.T1–T3 | round counts, scoring, completion and adaptive-band tests | covered |
| NFR-4 | P1.T6, P2.T3, P3.T3, R1.T1 | phase evidence and exact gate exit 0 | covered |
| NFR-5 | P3.T3 | docs validator 5 / 0 | covered |
| AC-1 | P1.T1–T5 | seeded selector and generator tests | covered |
| AC-2 | P1.T2 | word tier/mix/no-repeat tests | covered |
| AC-3 | P1.T3 | story mix/no-repeat and fallback tests | covered |
| AC-4 | P1.T4 | three-round, nine-shape uniqueness tests | covered |
| AC-5 | P1.T5 | one-emotion-per-scenario tests | covered |
| AC-6 | P2.T1–T3 | both-slide scene/flow completion tests | covered |
| AC-7 | P1.T2–T5 | no-variant parity tests | covered |
| AC-8 | P1.T1, P2.T1–T3 | seeded determinism and RNG pass-through | covered |
| AC-9 | P3.T1–T3 | docs validator and PRD/TDD/changelog sync | covered |

## Findings

### Critical

- <none>

### High

- <none>

### Medium

- <none>

### Low

- **F1 — Spec scope named an unimplemented generator argument**
  - **File:** `conductor/tracks/20261126-wire-content-variants/spec.md:44-48`
  - **What:** the In-Scope bullet promised an optional variant id on `generateWordBuildPlaythrough`, while FR-2/AC-2, plan P1.T2.1 and the implementation cover only `generateWordPlaythrough`; that generator has no in-scope caller.
  - **Why:** a literal reading could mislead a future reviewer into treating it as a missed task.
  - **Fix:** removed the promise and stated explicitly that `generateWordBuildPlaythrough` has no in-scope caller and is not changed (commit `62ecfb94`).
  - **Requirement:** FR-2
  - **Test gap:** none.

## Overrides

- <none — F1 was fixed, not deferred>

## Plan compliance

Phases 1–3 and review-fix phase R1 are all marked `[x]`/`verified`, each with
`Result`, a checkpoint that resolves in history, and an evidence file. Metadata
reports 4/4 phases and 13/13 tasks. The final diff stays inside the union of the
three implementation Touches lists plus the approved deviations: the living
suite-count refresh in `README.md`, `docs/TDD.md` and `docs/perf-baseline.md`;
the two test-support edits; PRD §4.11; and the final build-figure sync. No
source, test, config, asset, schema, dependency or release-note change fell
outside the plan. No task was marked complete without verification.

## Out of scope

- Historical release notes, including v1.25.0's "opt-in" wording, were left
  untouched.
- Device evidence and retention-pilot work remain separate concerns.
- Generated bundles and lockfiles were not reviewed as source.

## Debt

- <none>

## Doc sync

`updated` — the post-implementation sync refreshed live build figures in
`README.md` and `docs/perf-baseline.md`; the review fix reconciled `spec.md`
and `verification/integrated.md`. No runtime documentation changed after the
review.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | PASS WITH FINDINGS | 0 | 0 | 0 | 1 | 1 |
| 2 | PASS | 0 | 0 | 0 | 0 | 0 |
