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
- **Status:** in_progress

- [ ] **P1.T1: Write the pilot protocol** — covers: FR-1, AC-1
- [ ] **P1.T2: Define the local proxy** — covers: FR-2, NFR-3, AC-2
- [ ] **P1.T3: Write interview guide, privacy rules, and no-data finding** — covers: FR-3, FR-4, FR-5, NFR-2, NFR-3, AC-3, AC-4, AC-5
- [ ] **P1.T4: Add the README Documentation index link** — covers: FR-6, AC-6

## Phase 2: Roadmap linkage

- **Goal:** RM-4 is linked to this track and the §10.9 mitigation points to the protocol.
- **Depends on:** Phase 1
- **Covers:** FR-7, NFR-5, AC-7
- **Touches:** `conductor/roadmap.md`
- **Verification:** `node scripts/validate-docs.js` and `git -c core.whitespace=cr-at-eol diff --check`
- **Status:** pending

- [ ] **P2.T1: Link RM-4 to this track** — covers: FR-7, AC-7
- [ ] **P2.T2: Reference the protocol from the §10.9 risk** — covers: FR-7, NFR-5, AC-7

## Phase 3: Integrated verification and handoff

- **Goal:** Full gate, documentation validation, scope audit, and committed integrated evidence pass.
- **Depends on:** Phase 2
- **Covers:** NFR-4, AC-8
- **Touches:** `conductor/tracks/20261126-retention-proxy/verification/`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P3.T1: Run the exact configured gate** — covers: AC-8
- [ ] **P3.T2: Run docs validation and CRLF-aware whitespace check** — covers: NFR-4, AC-8
- [ ] **P3.T3: Audit diff scope and write integrated evidence** — covers: NFR-1, NFR-4, AC-8
