# Retention Pilot Pack — Implementation Plan

> **Branch:** `chore/20261126-retention-pilot-pack`
> **Base:** `master` @ `221defe4fbbb197dee1730d22ca2cead45dfcdbf`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Author the pack

- **Goal:** `docs/retention-pilot-pack.md` exists with all six blank components and a no-data attestation.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7, AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, NFR-2, NFR-3, NFR-4
- **Touches:** `docs/retention-pilot-pack.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P1.T1: Write status and overview** — covers: FR-1, AC-2
- [x] **P1.T2: Write recruitment note and blank consent form** — covers: FR-2, FR-3, AC-3
- [x] **P1.T3: Write evidence layout and withdrawal deletion** — covers: FR-4, AC-4
- [x] **P1.T4: Write the 14-day checklist** — covers: FR-5, AC-5
- [x] **P1.T5: Write the proxy worksheet** — covers: FR-6, AC-6
- [x] **P1.T6: Write the non-identifying summary template** — covers: FR-7, AC-7

**Result:** verified
**Checkpoint:** be92d541
**Evidence:** conductor/tracks/20261126-retention-pilot-pack/verification/phase-1.md

## Phase 2: Link and prove

- **Goal:** the protocol and pack link to each other and the docs validator passes with a docs-only diff.
- **Depends on:** Phase 1
- **Covers:** FR-8, FR-9, AC-8, AC-9, NFR-1, NFR-5
- **Touches:** `docs/retention-validation.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P2.T1: Add the pack to protocol §7** — covers: FR-8, AC-8
- [x] **P2.T2: Run the validator and confirm the scope diff** — covers: FR-9, AC-9, NFR-1, NFR-5

**Result:** verified
**Checkpoint:** 04c9eb60
**Evidence:** conductor/tracks/20261126-retention-pilot-pack/verification/phase-2.md
