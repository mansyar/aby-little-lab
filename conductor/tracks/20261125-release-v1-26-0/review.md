# Review — Release v1.26.0

- **Track:** `20261125-release-v1-26-0`
- **Branch:** `chore/20261125-release-v1-26-0`
- **Round:** 2
- **Range:** `b5c18c8a047aaee404920804be635f5a37ea3bd2..20a6951b`
- **Reviewer:** `conductor-reviewer` session `ses_def5e72ebffe8V7jxR1ONQZZVS` (read-only)
- **Mode:** strict
- **Verdict:** **PASS WITH FINDINGS**
- **Permission needs:** none; earlier branch/ancestry denials were resolved by primary checks

## Summary

The release scope remains sound. The non-Conductor diff is limited to the
package version, README release links and the new release notes: three files, 84
insertions and one deletion. No runtime source, dependency, asset, lockfile or
save-schema change exists. The five shipped PRs are documented in verified merge
order (#94 → #95 → #96 → #97 → #98), the roadmap correction preserves the earlier
failure, and the notes separate local Chromium evidence from the still-pending
CI, device, tag and deploy gates.

Round 1 findings F1–F4 are closed. Round 2 found one new Low traceability defect:
Phase R1's `Covers` list omits NFR-2 even though R1.T5 covers it. Strict mode
requires that final mapping correction before the PR.

## Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Exact configured gate | PASS | Primary run after F1–F4 on the same non-Conductor tree: lint 373 files; app/E2E typecheck; 158 files / 3,395 tests; build 491 modules; all guards and docs 5/5. |
| Coverage | PASS | Repeated runs: 97.08–97.10% statements, 90.92–90.96% branches, 96.35% functions, 98.23% lines. |
| Frozen install | PASS | `pnpm install --frozen-lockfile`; no lockfile drift. |
| Docs validator | PASS | Reviewer independently reran at `20a6951b`: 5 passed / 0 failed. |
| Docker headers | PASS | Fresh image `sha256:21d3b670ea56da854febaf90f999cbf62c55781e23727e312a20d3582f960b8b`; 28/28. |
| Boot smoke | PASS | Median 0.81 s over three cold loads against a 3.0 s budget. |
| Headed first tap | PASS | 50 cold / 0 warm; 10 per game; aggregate p95 total 265.9 ms; worst cold 300.2 ms under the unchanged 400 ms gate. |
| Whitespace | PASS | Reviewer reran `git diff --check`; clean. |
| Browser Journeys CI | PENDING | Intentionally deferred to the release PR/merge CI gate (FR-6/AC-6). |
| Physical device | PENDING | Phase 5 device policy (FR-7/AC-7). |

The reviewer's round-1 branch/ancestry commands were denied by its sandbox. The
primary ran them: current branch is correct, `base_sha` is an ancestor, and all
phase checkpoints are in ancestor order (`4f5969a0 → 3a28b75e → 737fd899 → HEAD`).
No command was worked around by the reviewer. Round 2 required no permission
fallback.

## Requirements Coverage

| ID | Status | Coverage |
| --- | --- | --- |
| FR-1 | covered | P1.T1; version/frozen install/lock inspection. |
| FR-2 | covered | P1.T2/P3.T3/R1.T1; structured notes, ordered PR sections, current roadmap link, docs validator. |
| FR-3 | covered | P1.T2/P2.T1; README index and dated release row. |
| FR-4 | covered | P2.T2; roadmap row, evidence link and preserved history. |
| FR-5 | covered | P3.T1/P3.T4/R1.T5; exact gate and integrated evidence. |
| FR-6 | partial | P4.T3/P5.T4; CI intentionally pending. |
| FR-7 | partial | P5.T1; device policy pending. |
| FR-8 | partial | P4.T1–P4.T4; review/PR/merge in progress. |
| FR-9 | partial | P5.T2–P5.T5/R1.T4; approval/tag/deploy/final notes pending. |
| FR-10 | covered | Notes disclaim device/non-Chromium/retention coverage. |
| NFR-1 | covered | Final scope diff. |
| NFR-2 | covered | No gate/script/threshold changes; R1.T5 gate; final scope inspection. |
| NFR-3 | covered | Measured release-state figures and coverage distinction. |
| NFR-4 | covered | Earlier 507.4 ms failure preserved. |
| NFR-5 | partial | Immutable-tag procedure recorded; execution pending. |
| NFR-6 | covered | Reviewed revert plus patch-release rollback. |
| AC-1 | covered | Version, lock diff and frozen install. |
| AC-2 | covered | Ordered PR sections and claims audit. |
| AC-3 | covered cumulatively | Phase 1 index link plus Phase 2 release row; corrected phase attribution recorded. |
| AC-4 | covered | Roadmap completion row and evidence link. |
| AC-5 | covered | Exact gate, boot, headers and headed samples. |
| AC-6 | partial | CI pending. |
| AC-7 | partial | Device pending. |
| AC-8 | partial | Review/merge pending. |
| AC-9 | partial | Tag/deploy/finalization pending. |
| AC-10 | covered | Final diff inspection. |

## Findings

### F1 — Low — stale roadmap destination — closed

- **File:** `docs/release-notes-v1.26.0.md:77`
- **What:** Known Issues pointed to `conductor/product.md §10`, which is now only a relocation pointer.
- **Why:** readers were sent to a notice instead of the current roadmap.
- **Fix:** link directly to `conductor/roadmap.md §10`.
- **Requirement:** FR-2
- **Status:** fixed in Phase R1, commit `9e66db1e`; reviewer confirmed closure.

### F2 — Low — premature Phase 1 AC-3 pass — closed

- **File:** `conductor/tracks/20261125-release-v1-26-0/verification/phase-1.md:45`
- **What:** AC-3 was marked pass while the required Releases-table row belonged to Phase 2.
- **Why:** the phase audit trail overstated acceptance.
- **Fix:** mark AC-3 partial in Phase 1; retain final coverage in Phase 2.
- **Requirement:** AC-3
- **Status:** fixed in Phase R1, commit `90ce4de0`; reviewer confirmed closure.

### F3 — Low — CI requirement mapped to local Phase 3 — closed

- **File:** `conductor/tracks/20261125-release-v1-26-0/plan.md:61`
- **What:** Phase 3 claimed FR-6/AC-6 coverage although it runs no CI; Phase 4 omitted those IDs.
- **Why:** pending CI work was attributed to a completed local phase.
- **Fix:** move FR-6/AC-6 to Phase 4 `Covers` and P4.T3.
- **Requirement:** FR-6, AC-6
- **Status:** fixed in Phase R1, commit `9b323276`; reviewer confirmed closure.

### F4 — Low — finalization exception not defined — closed

- **File:** `conductor/tracks/20261125-release-v1-26-0/spec.md:103` and `plan.md:132`
- **What:** the plan invoked a documented direct-to-master release exception without defining it.
- **Why:** the sensitive post-tag finalization had no authoritative procedure in the current plan.
- **Fix:** define the exact docs/Conductor-only finalization procedure, explicit approval requirement, immutable-tag rule and v1.25.0 precedent; update the spec and P5.T5 references.
- **Requirement:** FR-9, NFR-5
- **Status:** fixed in Phase R1, commit `9b323276`; reviewer confirmed closure.

### F5 — Low — Phase R1 omits NFR-2 from Covers

- **File:** `conductor/tracks/20261125-release-v1-26-0/plan.md:152-165`
- **What:** Phase R1's `Covers` list omits NFR-2 even though R1.T5 explicitly covers it.
- **Why:** the corrected plan retains the same requirement-to-phase traceability defect that F3 addressed for FR-6/AC-6.
- **Fix:** add NFR-2 to the Phase R1 `Covers` list.
- **Requirement:** NFR-2
- **Status:** open; assigned to Phase R2.

## Overrides

None. Strict mode requires F5 to be fixed.

## Plan Compliance

Phases 1–3 and R1 are verified with evidence and ordered checkpoints. Phase 4 is
in progress and Phase 5 is pending. The plan's task count and phase structure are
consistent. F1–F3/F4 corrections are closed; F5 is the sole remaining mapping fix.

## Out of Scope

No runtime, dependency, asset, test-threshold, save-schema or gameplay change is
present or proposed. Browser-matrix automation and real-family retention remain
RM-3/RM-4.

## Debt

No implementation debt identified. F1–F5 are review corrections, not deferred
work.

## Doc Sync

Required after R2: confirm release-note claims, roadmap destination, requirement
mapping and finalization procedure agree with the corrected plan and evidence.
CI/device/tag/deploy claims must remain pending until their gates run.

## History

- Round 1: `PASS WITH FINDINGS`, four Low findings, Phase R1 required.
- Round 2: `PASS WITH FINDINGS`, F1–F4 closed, new Low F5, Phase R2 required.
