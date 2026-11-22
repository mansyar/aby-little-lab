# Review: Release v1.25.0

- **Track:** `20261123-release-v1-25-0`
- **Type:** chore
- **Branch:** `chore/20261123-release-v1-25-0`
- **Range:** `9ffbc01d..f9584a09`
- **Date:** `2026-11-23T08:51:20+11:00`
- **Verdict:** `PASS`

## Summary

Round 2 confirms F1 (truthful CI wording in the DRAFT release notes) and F2 (integrated diff counts) were fixed at their exact locations in Phase R1. The release implementation is behavior-preserving, all configured gates are green on the final local tree, `validate-docs.js` re-ran 5/5, and plan/metadata are consistent. No new defects were found. Merge and tag requirements remain frozen human gates by design, not defects.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| lint | `pnpm check` | pass | Biome clean, 364 files (primary, final tree) |
| typecheck | `pnpm typecheck` | pass | src + e2e clean |
| test | `pnpm test -- --run` | pass | 154 files / 3,346 tests |
| coverage | `pnpm test:coverage` | pass | 97.15 / 90.97 / 96.28 / 98.30 vs gates 95/88/85/90 |
| build | `pnpm build` | pass | 487 modules; shell 193.62 kB Vite / 189.1 kB via validator |
| bundle | `node scripts/validate-bundle.js` | pass | 189.1 kB ≤ 200 kB |
| module size | `node scripts/validate-module-size.js` | pass | 167 files, zero warnings, max 399 lines |
| textures | `node scripts/validate-textures.js` | pass | 319 SVGs; 76.07 ≤ 80 MiB, 319.00 ≤ 320 MiB, ratio 0.238 ≤ 0.5 |
| PWA | `node scripts/validate-pwa.js` | pass | 16/16 |
| docs | `node scripts/validate-docs.js` | pass | 5 passed / 0 failed |
| guard negative path | 601-line synthetic fixture vs `validate-module-size.js` | pass | exit 1 (Phase 2 evidence) |
| docs (round 2) | `node scripts/validate-docs.js` | pass | 5 passed / 0 failed on `f9584a09` |
| R1 fixes | `docs/release-notes-v1.25.0.md:48`, `verification/integrated.md:22` | pass | truthful CI claim; 51 files / 6,049 insertions / 4,619 deletions |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P4.T1 | `package.json:3` | covered |
| FR-2 | P4.T2, R1.T1 | `docs/release-notes-v1.25.0.md:48`, `validate-docs.js` 5/5 | covered |
| FR-3 | P4.T3 | `README.md:209/254` | covered |
| FR-4 | P1.T1, P1.T2 | `validate-module-size.js` 167/0/max 399 | covered |
| FR-5 | P2.T1, P2.T2 | guard + fixture + workflow/package wiring | covered |
| FR-6 | P3.T1–T3 | `docs/changelog.md`, byte proof, pointers | covered |
| FR-7 | P5.T1 (pending) | integrated gate green locally | partial (CI/PR pending) |
| FR-8 | P5.T2, P5.T3 (pending) | review + merge pending | missing by design |
| FR-9 | P6.T1–T3 (pending) | tag/deploy pending | missing by design |
| FR-10 | P4.T2 | notes Known Issues accepted gap | covered |
| NFR-1 | P1.T1, P1.T2 | suite/build green; no rule/scene diff | covered |
| NFR-2 | P1.T3, P3.T2, P4.T3, R1.T1, R1.T2 | `validate-docs.js` 5/5 (round 2) | covered |
| NFR-3 | P5.T3, P6.T2 (pending) | conventional commits so far | partial (human gates) |
| NFR-4 | P1.T1, P2.T1 | bundle/texture guards green; no new deps | covered |
| AC-1 | P4.T1 | `package.json:3` | covered |
| AC-2 | P4.T2, P4.T3 | DRAFT header, README links, no remote tag | covered |
| AC-3 | P1.T1, P1.T2 | module-size guard real tree | covered |
| AC-4 | P2.T1, P2.T2 | synthetic fixture exit 1 | covered |
| AC-5 | P3.T1–T3 | byte proof, validator 5/5 | covered |
| AC-6 | P5.T1 (pending), R1.T2 | integrated gate green locally; diff count 51/6,049/4,619 | covered (local; final CI pending) |
| AC-7 | P5.T2, P5.T3 (pending) | review + merge pending | missing by design |
| AC-8 | P6.T1–T3 (pending) | tag/FINAL pending | missing by design |
| AC-9 | P4.T2 | device pass SKIPPED with checklist links | covered |
| AC-10 | P1.T1, P1.T2 | no GameId/scene/rule diff; suite green | covered |

## Findings

Round-1 findings F1 and F2 were fixed in Phase R1 (`19aebacb`) and confirmed in round 2; no new findings were raised.

### Critical

- <none>

### High

- <none>

### Medium

- **F1 — Release notes overstate CI coverage of the new guards — RESOLVED in Phase R1 (`19aebacb`)**
  - **File:** `docs/release-notes-v1.25.0.md:48`
  - **What:** Line 48 says CI and the tag-deploy smoke re-confirm every automated figure above, but `.github/workflows/ci.yml` Quality Gates runs check, typecheck, unit tests, build, bundle, PWA, boot, headers and docs validators — not coverage, `validate-module-size.js` or `validate-textures.js`.
  - **Why:** A release manager could assume CI catches oversized modules or art-budget regressions when only the local `verify_phase` gate does. Strict posture treats truthful ship-time documentation as in scope.
  - **Fix:** Reword line 48 to name exactly what CI re-confirms and state that coverage, module-size and texture figures are verified by the local `verify_phase` gate only. (Reviewer's alternative — adding those steps to CI — is out of scope for this release diff.)
  - **Requirement:** FR-2
  - **Test gap:** none

### Low

- **F2 — Stale diff count in integrated verification — RESOLVED in Phase R1 (`19aebacb`)**
  - **File:** `conductor/tracks/20261123-release-v1-25-0/verification/integrated.md:22-23`
  - **What:** Records 50 files / 5,981 insertions for the total diff; final tree is 51 files / 6,049 insertions / 4,619 deletions. Non-Conductor figure (38 files / 5,268 insertions / 4,260 deletions) is correct.
  - **Why:** Stale count in the evidence record used for AC-6 sign-off contradicts repository state.
  - **Fix:** Update the total figure to 51 files / 6,049 insertions / 4,619 deletions.
  - **Requirement:** AC-6
  - **Test gap:** none

## Overrides

- <none>

## Plan compliance

Phases 1–4 are verified with checkpoints `0c6e79d5`, `6815d8c3`, `c4014bd6`, `08f1c09b`; all 11 implementation tasks are `[x]` with independent verification. Phase R1 is verified at `19aebacb` with both findings fixed. Phase 5 (gate/review/merge) is in progress; Phase 6 (tag/ship) is pending and human-gated. No task was marked complete without verification.

## Out of scope

- Adding coverage/module-size/texture steps to `.github/workflows/ci.yml` would change CI behavior beyond this release's frozen scope; the factual documentation fix is preferred.
- PR merge and tag/deploy decisions remain with the owner.

## Debt

- <none>

## Doc sync

`none` — review introduced no documentation changes of its own; F1/F2 were fixed and committed in Phase R1, and no post-review doc work is outstanding.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | BLOCK | 0 | 0 | 1 | 1 | 0 |
| 2 | PASS | 0 | 0 | 0 | 0 | 2 (F1, F2 in Phase R1) |
