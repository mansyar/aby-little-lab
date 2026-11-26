# Confirm the retention proxy with a handful of real families — Implementation Plan

> **Branch:** `chore/20261126-retention-proxy`
> **Base:** `master` @ `5b9995f07aeeaccbd95221aebf327807f97d0ae0`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Protocol and privacy documentation

- **Goal:** `docs/retention-validation.md` exists with a complete consented protocol, proxy definition, interview guide, privacy rules, and an honest no-data finding.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, NFR-1, NFR-2, NFR-3, NFR-5, AC-1, AC-2, AC-3, AC-4, AC-5, AC-6
- **Touches:** `docs/retention-validation.md`, `README.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P1.T1: Write the pilot protocol** — covers: FR-1, AC-1
- [x] **P1.T2: Define the local proxy** — covers: FR-2, NFR-3, AC-2
- [x] **P1.T3: Write interview guide, privacy rules, and no-data finding** — covers: FR-3, FR-4, FR-5, NFR-2, NFR-3, AC-3, AC-4, AC-5
- [x] **P1.T4: Add the README Documentation index link** — covers: FR-6, AC-6

**Result:** verified
**Checkpoint:** `c295715f`
**Evidence:** `conductor/archive/20261126-retention-proxy/verification/phase-1.md`

## Phase 2: Roadmap linkage

- **Goal:** RM-4 is linked to this track and the §10.9 mitigation points to the protocol.
- **Depends on:** Phase 1
- **Covers:** FR-7, NFR-5, AC-7
- **Touches:** `conductor/roadmap.md`
- **Verification:** `node scripts/validate-docs.js` and `git -c core.whitespace=cr-at-eol diff --check`
- **Status:** verified
- **Result:** Roadmap linkage verified at `675a810b`; RM-4 links to the track and §10.9 links to the protocol; docs validation and CRLF-aware whitespace passed.
- **Checkpoint:** `675a810b7873bed47fdd145674a9c6dc3eaca553`
- **Evidence:** `conductor/archive/20261126-retention-proxy/verification/phase-2.md`

- [x] **P2.T1: Link RM-4 to this track** — covers: FR-7, AC-7
- [x] **P2.T2: Reference the protocol from the §10.9 risk** — covers: FR-7, NFR-5, AC-7

## Phase 3: Integrated verification and handoff

- **Goal:** Full gate, documentation validation, scope audit, and committed integrated evidence pass.
- **Depends on:** Phase 2
- **Covers:** NFR-4, AC-8
- **Touches:** `conductor/archive/20261126-retention-proxy/verification/`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified
- **Result:** Exact configured gate and CRLF-aware whitespace check passed on primary rerun at `ce3768da`; scope audit confirmed documentation/Conductor-only diff; integrated evidence committed.
- **Checkpoint:** `ce3768dab7f27a0725e628d5a15a44a0889740c2`
- **Evidence:** `conductor/archive/20261126-retention-proxy/verification/integrated.md`

- [x] **P3.T1: Run the exact configured gate** — covers: AC-8
- [x] **P3.T2: Run docs validation and CRLF-aware whitespace check** — covers: NFR-4, AC-8
- [x] **P3.T3: Audit diff scope and write integrated evidence** — covers: NFR-1, NFR-4, AC-8

## Phase R1: Review fixes

- **Goal:** Resolve review finding F1 so the Day-7 proxy is computable from collectible exports.
- **Depends on:** Phase 3
- **Covers:** F1, FR-2, AC-2
- **Touches:** `docs/retention-validation.md`, `conductor/archive/20261126-retention-proxy/verification/phase-1.md`, `conductor/archive/20261126-retention-proxy/verification/phase-R1.md`
- **Verification:** Exact configured gate; `node scripts/validate-docs.js`; `git -c core.whitespace=cr-at-eol diff --check`
- **Status:** verified
- **Result:** F1 closed by paired-export proxy definition and field self-check; primary exact gate and CRLF-aware whitespace passed at final head `493c1ca`.
- **Checkpoint:** `493c1ca352703e927ba20424a5d5370a1e833d2b`
- **Evidence:** `conductor/archive/20261126-retention-proxy/verification/phase-R1.md`

- [x] **R1.T1: Redefine the Day-7 proxy using paired Day-7 and close-out exports** — covers: F1, FR-2, AC-2
- [x] **R1.T2: Add a field-by-field proxy input self-check and correct Phase 1 AC-2 evidence** — covers: F1, AC-2
- [x] **R1.T3: Run the exact gate and record R1 verification evidence** — covers: F1, NFR-4

## Phase R2: Review state bookkeeping

- **Goal:** Resolve review finding F2 so Conductor metadata accurately reports the completed task count.
- **Depends on:** Phase R1
- **Covers:** F2
- **Touches:** `conductor/archive/20261126-retention-proxy/metadata.json`, `conductor/archive/20261126-retention-proxy/verification/phase-R2.md`
- **Verification:** `node scripts/validate-docs.js` and `git -c core.whitespace=cr-at-eol diff --check`
- **Status:** verified
- **Result:** F2 closed; metadata reports 5/5 phases and 13/13 tasks matching the plan; docs validation and CRLF-aware whitespace passed.
- **Checkpoint:** `b0a0fd52950d14d923ba3e27de62ab3c5b711b31`
- **Evidence:** `conductor/archive/20261126-retention-proxy/verification/phase-R2.md`

- [x] **R2.T1: Set metadata task counts to the 13 checked plan tasks and record R2 evidence** — covers: F2

## Phase R3: Final evidence correction

- **Goal:** Resolve owner-approved final findings F3 and F4 in `verification/phase-R2.md`.
- **Depends on:** Phase R2
- **Covers:** F3, F4
- **Touches:** `conductor/archive/20261126-retention-proxy/verification/phase-R2.md`, `conductor/archive/20261126-retention-proxy/plan.md`, `conductor/archive/20261126-retention-proxy/metadata.json`
- **Verification:** `node scripts/validate-docs.js` and `git -c core.whitespace=cr-at-eol diff --check`
- **Status:** verified
- **Result:** F3/F4 closed by correcting R2 evidence scope and adding the head commit; docs validation and CRLF-aware whitespace passed.
- **Checkpoint:** `6b7da237859fee76656ea8c339a58083aff349b0`
- **Evidence:** `conductor/archive/20261126-retention-proxy/verification/phase-R2.md`

- [x] **R3.T1: Correct the R2 scope claim and add the R2 head commit, then record verified evidence** — covers: F3, F4
