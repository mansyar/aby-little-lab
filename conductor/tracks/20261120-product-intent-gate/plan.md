# Product Intent Gate — Implementation Plan

> **Branch:** `chore/20261120-product-intent-gate`
> **Base:** `master` @ `85c5f16f`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Record the four decisions

- **Goal:** `docs/product-intent.md` exists and records audience, accessibility,
  language and legal posture with value, date, rationale and consequence.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, FR-4, FR-5, AC-1, AC-2, AC-3, AC-4, AC-5
- **Touches:** `docs/product-intent.md`
- **Verification:** `node scripts/validate-docs.js`
- **Status:** verified

- [x] **P1.T1: Create the decision record** — covers: FR-1
  - [x] **P1.T1.1: Add overview and one section per decision with explicit values**
  - [x] **P1.T1.2: Add date, rationale and consequence to each decision**
- [x] **P1.T2: Record the sequencing consequences** — covers: FR-2, FR-4
  - [x] **P1.T2.1: State Phase 5 cancelled and Phase 4 next; i18n not a goal**

<!--
**Result:** verified
**Checkpoint:** 2a171939
**Evidence:** conductor/tracks/20261120-product-intent-gate/verification/phase-1.md
-->

## Phase 2: Close the legal gaps

- **Goal:** `LICENSE` and the four legal documents exist with the stated content.
- **Depends on:** Phase 1
- **Covers:** FR-5, FR-6, AC-5, AC-6
- **Touches:** `LICENSE`, `docs/audio-attribution.md`, `docs/third-party-notices.md`, `docs/child-privacy.md`, `docs/store-privacy-labels.md`
- **Verification:** `node scripts/validate-docs.js`
- **Status:** verified

- [x] **P2.T1: Add the MIT LICENSE** — covers: FR-6
- [x] **P2.T2: Add the audio attribution and third-party notices** — covers: FR-6
  - [x] **P2.T2.1: Inventory shipped assets and record the BGM investigation status**
- [x] **P2.T3: Add the child-privacy statement and store privacy labels** — covers: FR-5, FR-6
  - [x] **P2.T3.1: Mark the labels as prepared, not submitted**

<!--
**Result:** verified
**Checkpoint:** 2fcb8f5e
**Evidence:** conductor/tracks/20261120-product-intent-gate/verification/phase-2.md
-->

## Phase 3: Resolve BGM rights

- **Goal:** `bgm.mp3` has a traceable right — replaced with a known-licensed loop
  and attributed, or removed together with its precache wiring.
- **Depends on:** Phase 2
- **Covers:** FR-7, NFR-1, AC-7
- **Touches:** `docs/audio-attribution.md`, `public/audio/bgm.mp3`, `vite.config.ts`, `scripts/validate-pwa.js`, `src/audio/AudioManager.ts`
- **Verification:** `pnpm build && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P3.T1: Record the investigation outcome in the attribution file** — covers: FR-7
- [x] **P3.T2: Replace or remove the loop and update its wiring** — covers: FR-7
  - [x] **P3.T2.1: If removed, drop the precache entry and confirm the PWA validator passes**

<!--
**Result:** verified
**Checkpoint:** 9fc3e1a5
**Evidence:** conductor/tracks/20261120-product-intent-gate/verification/phase-3.md
-->

## Phase 4: Publish and sync docs

- **Goal:** The stance is visible to a user and the roadmap records the gate.
- **Depends on:** Phase 3
- **Covers:** FR-2, FR-3, FR-8, AC-2, AC-3, AC-8
- **Touches:** `README.md`, `conductor/product.md`
- **Verification:** `node scripts/validate-docs.js`
- **Status:** verified

- [x] **P4.T1: Publish the accessibility stance and link the decision record in README** — covers: FR-3, FR-8
- [x] **P4.T2: Mark Phase 3 complete and Phase 5 cancelled in product.md** — covers: FR-2, FR-8

<!--
**Result:** verified
**Checkpoint:** 0cc94d18
**Evidence:** conductor/tracks/20261120-product-intent-gate/verification/phase-4.md
-->

## Phase R1: Review Fixes

- **Goal:** Resolve review findings F1, F2, F3 and F4.
- **Depends on:** Phase 4
- **Covers:** F1, F2, F3, F4
- **Touches:** `docs/third-party-notices.md`, `docs/product-intent.md`, `docs/store-privacy-labels.md`, `conductor/product.md`
- **Verification:** `node scripts/validate-docs.js` plus the full configured `verify_phase` chain
- **Status:** pending

- [ ] **R1.T1: Correct the BGM license row in third-party notices** — covers: F1
- [ ] **R1.T2: Correct the three stale BGM-rights statements in the decision record** — covers: F2
- [ ] **R1.T3: Correct the stale audio phrasing in store privacy labels** — covers: F3
- [ ] **R1.T4: Update the distribution planning assumption in product.md** — covers: F4

<!--
**Result:** pending
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261120-product-intent-gate/verification/phase-R1.md
-->
