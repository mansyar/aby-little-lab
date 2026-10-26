# Review — 20261027-dependency-majors

**Track:** `20261027-dependency-majors` · **Type:** chore · **Branch:** `chore/20261027-dependency-majors` · **Range:** `72bf861c..a6be5163` (excluding `conductor/`) · **Date:** 2026-10-27 · **Verdict:** PASS

## Summary

The five dev-dependency upgrades landed cleanly: every phase commit pairs `package.json` with `pnpm-lock.yaml`, frozen installs are recorded, the only cross-cutting code change (the count-drift guard's `--no-staticParse` adaptation) is surgical and fails closed, clearMocks is embraced with zero test changes, the happy-dom CSS/IFrame audit found zero re-enables needed, vite-plugin-pwa 2.0 needed zero config adaptation, and the living docs state the new truth. All eight verification commands plus `pnpm outdated` (empty table) are green on the integrated branch. Three Low findings across two rounds, all evidence-prose hygiene; all fixed under strict mode (round 1: F1/F2 via the Review Fixes phase 31afc8fe; round 2: one provenance-wording nit fixed immediately).

## Verification

| # | Command | Result | Evidence |
|---|---|---|---|
| 1 | `pnpm check` | pass (0) | 258 files; 1 pre-existing warning; `$schema` info diagnostic retired |
| 2 | `pnpm typecheck` | pass (0) | clean |
| 3 | `pnpm test -- --run` | pass (0) | 125 files / 2,729 tests (vitest 5.0.5, ~13.9 s) |
| 4 | `pnpm test:coverage` | pass (0) | 97.8/91.9/96.77/98.74; denominators byte-identical |
| 5 | `pnpm build` | pass (0) | vite 8.3.5 + PWA 2.0.0; 54 precache entries |
| 6 | `node scripts/validate-bundle.js` | pass (0) | all passed |
| 7 | `node scripts/validate-pwa.js` | pass (0) | 16/0; 42/42 |
| 8 | `node scripts/validate-docs.js` | pass (0) | 6/6 incl. count-drift guard |
| — | `pnpm outdated` | pass (0) | empty table |

Reviewer's own read-only checks: `git diff --name-status 72bf861c..HEAD` (exactly the five expected files, no `src/**`); per-phase `package.json`+`pnpm-lock.yaml` pairing; repo-wide `clearMocks` grep (none in code/config); version-pin consistency across package.json/lockfile/TDD/tech-stack; `scripts/validate-docs.js:537-618` read (surgical, fails closed).

## Requirements coverage

| ID | Implemented by | Verified by | Status |
|---|---|---|---|
| FR-1 | P1.T1..P4.T1 | per-phase commit pairing + frozen-install records | covered |
| FR-2 | P1.T1, P1.T2 | `^2.6.3`/`^8.3.5` + `$schema` 2.6.3; check exit 0 | covered |
| FR-3 | P2.T1..T3 | lockfile cross-pin 5.0.5 pair; no clearMocks; zero test changes | covered |
| FR-4 | P3.T1, P3.T2 | `^21.0.4`; zero re-enables needed | covered |
| FR-5 | P4.T1..T3 | pwa 2.0.0 + workbox 7.4.1; validate-pwa 16/0, 42/42 | covered |
| FR-6 | P1.T1.3 | `ci.yml:30` node 22 ≥ 22.12, untouched | covered |
| FR-7 | P5.T1..T3 | TDD table + §1.3 + §10.1; tech-stack table + quote block; 6/6 | covered |
| FR-8 | P2, P5 | validator deviation + §1.3 beyond-inventory edit recorded | covered |
| NFR-1..4 | all phases | no src change; gates fixed; budgets held; only five devDeps | covered |
| AC-1..AC-6 | P2..P5 | see `verification/integrated.md` | covered |

## Findings

### Low

**F1** — `conductor/tracks/20261027-dependency-majors/verification/phase-*.md` — the phase evidence files cite executor-worktree commit hashes (`da7bb6d8`, `1fd28538`, `2cf18cae`, `f32f0c92`, `ef4651d3`, `14d8986a`, `d2f5a28a`, `8610fc93`, `4630a71e`) that do not appear in branch history `72bf861c..HEAD`; the branch carries the squashed phase commits. The hashes exist in the object DB (squash orphans, reflog-reachable — confirmed by the primary via `git rev-parse --verify`), but the FR-1 "commit X contains both files" spot-checks cannot be re-verified against the cited hashes from the branch alone. Fix: append a one-line squash-mapping note (evidence hash → final phase commit) to each phase evidence file.

**F2** — `conductor/tracks/20261027-dependency-majors/verification/phase-5.md:101` — typo: "the executor's single dit call" should read "single edit call". Fix: correct the word.

## Overrides

None.

## Plan compliance

All five phases verified with checkpoints `bd8a6c54` / `c0c86ee2` / `ede22b71` / `a66d9367` / `e2893a19`; Result/Checkpoint/Evidence blocks present; every task checked and mapped; disclosed deviations (the P2 validator edit, the P5 §1.3 beyond-inventory fix) match the diff; no scope creep; the diff is exactly the five expected files.

## Out of scope

- The pre-existing `noNonNullAssertion` warning (`musicalMemoryScene.test.ts`) — untouched, per scope.
- `pnpm-lock.yaml` churn — expected generated noise, not a finding.
- CI Node stays at 22 (satisfies ≥ 22.12); no bump needed — recorded, not a finding.

## Debt

None.

## Doc sync

`pending`.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
|---|---|---|---|---|---|---|
| 1 | PASS WITH FINDINGS | 0 | 0 | 0 | 2 | 0 |
| 2 | PASS | 0 | 0 | 0 | 1 | 3 |
### Round 2

Delta `f72dd9d7..31afc8fe` (single evidence-only commit). Both round-1 findings verified resolved: F1 — all five squash-mapping notes present (phase-1..4.md:10, phase-5.md:5), every hash annotation cross-checked against how the hash is used in that file's own body, and all five squash targets confirmed on the branch with corroborating subjects; F2 — word-diff shows the only changed segment is `dit` → `edit` (with the stray ESC control character removed along with it). Weakening audit clean: pure additions plus the one-word fix. One new Low (provenance wording "follows the brief's template verbatim" overstated in phase-R1.md) — fixed immediately under strict mode. The reviewer's remaining `needs` (rev-parse re-verification of the hashes) were already satisfied by the primary's `git rev-parse --verify` run recorded in round 1.
