# Review — Release v1.26.0

- **Track:** `20261125-release-v1-26-0`
- **Branch:** `chore/20261125-release-v1-26-0`
- **Round:** 1
- **Range:** `b5c18c8a047aaee404920804be635f5a37ea3bd2..92c466c9`
- **Reviewer:** `conductor-reviewer` session `ses_def5e72ebffe8V7jxR1ONQZZVS` (read-only)
- **Mode:** strict
- **Verdict:** **PASS WITH FINDINGS**
- **Permission needs:** resolved by primary checks recorded below

## Summary

The release scope is sound and the local evidence is strong. The non-Conductor
diff is limited to the package version, README release links and the new release
notes: three files, 84 insertions and one deletion. No runtime source, dependency,
asset, lockfile or save-schema change exists. The five shipped PRs are documented
in verified merge order (#94 → #95 → #96 → #97 → #98), the roadmap correction
preserves the earlier failure, and the notes separate local Chromium evidence
from the still-pending CI, device, tag and deploy gates.

Four Low traceability/documentation findings must be corrected under strict mode.
None undermines the release implementation, but all four must close before the PR.

## Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Exact configured gate | PASS | Primary run on the same non-Conductor tree: lint 373 files; app/E2E typecheck; 158 files / 3,395 tests; build 491 modules; all guards and docs 5/5. |
| Coverage | PASS | Repeated runs: 97.08–97.10% statements, 90.92–90.96% branches, 96.35% functions, 98.23% lines. |
| Frozen install | PASS | `pnpm install --frozen-lockfile`; no lockfile drift. |
| Docs validator | PASS | Reviewer independently reran: 5 passed / 0 failed. |
| Docker headers | PASS | Fresh image `sha256:21d3b670ea56da854febaf90f999cbf62c55781e23727e312a20d3582f960b8b`; 28/28. |
| Boot smoke | PASS | Median 0.81 s over three cold loads against a 3.0 s budget. |
| Headed first tap | PASS | 50 cold / 0 warm; 10 per game; aggregate p95 total 265.9 ms; worst cold 300.2 ms under the unchanged 400 ms gate. |
| Whitespace | PASS | Reviewer reran `git diff --check`; clean. |
| Browser Journeys CI | PENDING | Intentionally deferred to the release PR/merge CI gate (FR-6/AC-6). |
| Physical device | PENDING | Phase 5 device policy (FR-7/AC-7). |

The reviewer's direct branch/ancestry commands were denied by its sandbox. The
primary ran them: current branch is correct, `base_sha` is an ancestor, and all
phase checkpoints are in ancestor order (`4f5969a0 → 3a28b75e → 737fd899 → HEAD`).
No command was worked around by the reviewer.

## Requirements Coverage

| ID | Status | Coverage |
| --- | --- | --- |
| FR-1 | covered | P1.T1; version/frozen install/lock inspection. |
| FR-2 | covered | P1.T2/P3.T3; structured notes, ordered PR sections, docs validator. |
| FR-3 | covered | P1.T2/P2.T1; README index and dated release row. |
| FR-4 | covered | P2.T2; roadmap row, evidence link and preserved history. |
| FR-5 | covered | P3.T1/P3.T4; exact gate and integrated evidence. |
| FR-6 | partial | P4.T3/P5.T4; CI intentionally pending. |
| FR-7 | partial | P5.T1; device policy pending. |
| FR-8 | partial | P4.T1–P4.T4; review/PR/merge in progress. |
| FR-9 | partial | P5.T2–P5.T5; approval/tag/deploy/final notes pending. |
| FR-10 | covered | Notes disclaim device/non-Chromium/retention coverage. |
| NFR-1 | covered | Final scope diff. |
| NFR-2 | covered | No gate/script/threshold changes. |
| NFR-3 | covered | Measured release-state figures and coverage distinction. |
| NFR-4 | covered | Earlier 507.4 ms failure preserved. |
| NFR-5 | partial | Immutable-tag procedure recorded; execution pending. |
| NFR-6 | covered | Reviewed revert plus patch-release rollback. |
| AC-1 | covered | Version, lock diff and frozen install. |
| AC-2 | covered | Ordered PR sections and claims audit. |
| AC-3 | covered cumulatively | Phase 1 index link plus Phase 2 release row; Phase 1 record needs correction (F2). |
| AC-4 | covered | Roadmap completion row and evidence link. |
| AC-5 | covered | Exact gate, boot, headers and headed samples. |
| AC-6 | partial | CI pending. |
| AC-7 | partial | Device pending. |
| AC-8 | partial | Review/merge pending. |
| AC-9 | partial | Tag/deploy/finalization pending. |
| AC-10 | covered | Final diff inspection. |

## Findings

### F1 — Low — stale roadmap destination

- **File:** `docs/release-notes-v1.26.0.md:77`
- **What:** Known Issues points to `conductor/product.md §10`, which is now only a relocation pointer.
- **Why:** readers are sent to a notice instead of the current roadmap.
- **Fix:** link directly to `conductor/roadmap.md §10`.
- **Requirement:** FR-2
- **Status:** open; assigned to Phase R1.

### F2 — Low — premature Phase 1 AC-3 pass

- **File:** `conductor/tracks/20261125-release-v1-26-0/verification/phase-1.md:45`
- **What:** AC-3 is marked pass while the required Releases-table row is deferred to Phase 2.
- **Why:** the phase audit trail overstates acceptance.
- **Fix:** mark AC-3 partial in Phase 1; retain final coverage in Phase 2.
- **Requirement:** AC-3
- **Status:** open; assigned to Phase R1.

### F3 — Low — CI requirement mapped to local Phase 3

- **File:** `conductor/tracks/20261125-release-v1-26-0/plan.md:61`
- **What:** Phase 3 claims FR-6/AC-6 coverage although it runs no CI; Phase 4 omits those IDs.
- **Why:** pending CI work is attributed to a completed local phase.
- **Fix:** move FR-6/AC-6 to Phase 4 `Covers` and P4.T3.
- **Requirement:** FR-6, AC-6
- **Status:** open; assigned to Phase R1.

### F4 — Low — finalization exception not defined

- **File:** `conductor/tracks/20261125-release-v1-26-0/spec.md:103` and `plan.md:132`
- **What:** the plan invokes a documented direct-to-master release exception without defining it.
- **Why:** the sensitive post-tag finalization has no authoritative procedure in the current plan.
- **Fix:** define the exact docs/Conductor-only finalization procedure, explicit approval requirement, immutable-tag rule and v1.25.0 precedent; update the spec and P5.T5 references.
- **Requirement:** FR-9, NFR-5
- **Status:** open; assigned to Phase R1.

## Overrides

None. Strict mode requires all four findings to be fixed.

## Plan Compliance

Phases 1–3 are verified with evidence and ordered checkpoints. Phase 4 is in
progress and Phase 5 is pending. The plan's task count and phase structure are
otherwise consistent. F3 corrects the only requirement-to-phase attribution
error; F4 makes the post-tag procedure executable without inventing authority.

## Out of Scope

No runtime, dependency, asset, test-threshold, save-schema or gameplay change is
present or proposed. Browser-matrix automation and real-family retention remain
RM-3/RM-4.

## Debt

No implementation debt identified. F1–F4 are review corrections, not deferred
work.

## Doc Sync

Required after the fix round: confirm release-note claims, roadmap destination,
requirement mapping and finalization procedure agree with the corrected plan and
evidence. CI/device/tag/deploy claims must remain pending until their gates run.

## History

- Round 1: `PASS WITH FINDINGS`, four Low findings, Phase R1 required.
