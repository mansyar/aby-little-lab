# Conductor Review — Release v1.28.0

- **Track:** `20261128-release-v1-28-0`
- **Branch:** `chore/20261128-release-v1-28-0`
- **Reviewed range:** `39df7f5b7c4fc994475156c9affd1a4da8bec4f1..f93d073a`
- **Date:** 2026-11-28
- **Reviewer:** read-only `conductor-reviewer`
- **Mode:** strict, small-volume, one-pass
- **Verdict:** PASS
- **Round:** 1 (targeted re-review completed)

## Summary

The behavior-neutral v1.28.0 release record is accurate and locally evidenced. Version propagation, DRAFT notes, README indexing, measured performance evidence, first-tap tooling synchronization, and post-merge boundaries match the approved plan. One Low documentation-consistency finding remains.

## Requirements

| Requirement | Status | Evidence |
|---|---|---|
| FR-1 | Covered | `package.json` 1.28.0; built shell reports 1.28.0 |
| FR-2 | Covered pre-ship | DRAFT notes cover #109 → #110 → #111; FINAL remains post-ship |
| FR-3 | Covered | README Documentation + Releases; `validate-docs` 5/0 |
| FR-4 | Covered | Dated v1.28.0 perf section and raw headed first-tap evidence |
| FR-5 | Covered locally | Full gate, 50 cold / 0 warm first tap, browser matrix 60/60 |
| FR-6 | Partial by design | Review/PR runbook prepared; CI and merge follow review |
| FR-7 | Partial by design | #108 closure runbook prepared; closure is post-merge |
| FR-8 | Partial by design | Tag/deploy runbook prepared; separate authorization required |
| FR-9 | Partial by design | Live/FINAL/rollback runbook prepared; execution is post-ship |
| NFR-1 | Covered | Version/docs/verification tooling only; no runtime/assets/deps/schema changes |
| NFR-2 | Covered except F1 | Docs validator passes; one README wording inconsistency found |
| NFR-3 | Covered | Conventional commits; no reset/force-push/tag mutation; caused reruns recorded |
| NFR-4 | Covered | Coverage, bundle, module-size, texture and PWA gates pass |
| NFR-5 | Covered | Rollback runbook preserves published tag; no migration |
| AC-1..AC-5 | Covered locally | Version, DRAFT notes, README, measured perf, full gate/first tap/browser evidence |
| AC-6..AC-9 | Partial by design | Review/CI/merge/ship operations remain explicitly gated |

## Findings

### F1 — Low — README understates completed candidate verification

- **Location:** `README.md:241`, `README.md:292`
- **What:** Both entries say candidate verification is pending even though local gate, headed first tap, and browser matrix evidence are complete.
- **Why:** Contradicts the locally verified DRAFT facts in the release notes and perf baseline (NFR-2 internal consistency).
- **Fix:** State that the candidate is verified locally while CI, tag, deploy, and live verification remain pending; retain DRAFT and the accepted physical-device gap.
- **Requirement:** NFR-2
- **Test gap:** None; documentation consistency check.
- **Decision:** Accept and fix in review round 1.

## Verification Reviewed

- `pnpm check`: PASS, 393 files.
- `pnpm typecheck`: PASS, app + e2e.
- `pnpm test -- --run`: PASS, 165 files / 3,559 tests.
- `pnpm test:coverage`: PASS, 96.91 / 90.23 / 96.22 / 98.06.
- `pnpm build` + bundle/module-size/texture/PWA/docs validators: PASS.
- Headed first tap: PASS, 50 cold / 0 warm; worst cold 273.2 ms ≤ 400 ms.
- Local browser matrix: PASS, 30 + 10 + 10 + 10 = 60/60 after one recorded caused rerun.
- Physical-device smoke: `SKIPPED — accepted gap` per approved spec.

## Fix Loop

| Round | Verdict | Findings | Resolution |
|---|---|---|---|
| 1 | PASS WITH FINDINGS | F1 Low | Fixed in Phase R1 (`f448e29b`); primary full gate passed; targeted re-review returned PASS with no findings |

## Targeted Re-review

The same read-only reviewer inspected `64cdb652..f448e29b` and the R1 evidence after primary acceptance commit `5ca48345`.

- **Verdict:** PASS
- **Findings:** none
- **F1:** resolved; both README entries now distinguish completed local candidate verification from pending CI/tag/deploy/live work.
- **Scope:** only the two intended README status clauses changed; highlights, links, version, date, DRAFT status and Tag pending remained intact.
- **Checks:** full R1 gate remained green (165 files / 3,559 tests; coverage 96.91/90.23/96.22/98.06; all validators passed).
