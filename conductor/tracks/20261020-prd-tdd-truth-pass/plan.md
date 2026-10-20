# PRD & TDD Truth Pass — Implementation Plan

> **Branch:** `chore/20261020-prd-tdd-truth-pass`
> **Base:** `master` @ `8cb5de4`
> Phase states are `pending`, `in_progress`, `verified`, `failed`, `blocked`. Only the primary agent writes this file.

## Phase 1: PRD restructure

- **Goal:** `docs/PRD.md` is reorganised around the shipped product and every false claim is gone.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, FR-4, AC-1, AC-2, AC-3
- **Touches:** `docs/PRD.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified

- [x] **P1.T1: Establish the fact base before writing** — covers: FR-1
  - [x] **P1.T1.1: Collect every number the PRD will state** — game count from `GAME_IDS`, adaptive split from `getAdaptiveBandShift` usage, boot SVG count from `SHAPE_ASSETS`, shell size from the latest `validate-bundle` run, test count from the suite. Record command → value in the phase evidence file.
  - [x] **P1.T1.2: Read the current PRD end to end and label every section** — keep, rewrite, or remove, with a one-line reason. Saved in the evidence file so the rewrite is auditable against the original.
- [x] **P1.T2: Restructure the document** — covers: FR-1, FR-4
  - [x] **P1.T2.1: Rewrite the front matter and curriculum map** — product definition, audience, the 22 games grouped by developmental domain, and the cross-game systems summary that the per-game sections lean on.
  - [x] **P1.T2.2: Rewrite the cross-game systems and asset-budget sections** — shared bases, narrator, mascot, stickers, profiles, play time, progress, adaptive difficulty with its 15/7 split, voice selection, and the 178-boot-SVG / 195.4 kB shell / in-chunk game art reality.
- [x] **P1.T3: Rewrite the per-game specifications** — covers: FR-2, AC-2
  - [x] **P1.T3.1: Rework games 1–20 to the new template** — mechanic, rounds and pool, difficulty model, narration type, art specifics; no claim carried over that the source does not support.
  - [x] **P1.T3.2: Add games 21 and 22** — Feelings Faces (contrast ladder, re-speak on wrong, caption fallback) and Story Order (3-panel strips, 8-story pool, retry in place, whole-strip validation).
- [x] **P1.T4: Close the PRD out** — covers: AC-1, AC-3
  - [x] **P1.T4.1: Sweep stale phrasing** — every `twenty`/`20 game` hit read and either corrected or justified as current.
  - [x] **P1.T4.2: Add the table of contents and check anchors** — every entry resolves to a real heading; section numbering is consistent.
**Result:** verified
**Checkpoint:** a5f14e5
**Evidence:** conductor/tracks/20261020-prd-tdd-truth-pass/verification/phase-1.md

## Phase 2: TDD restructure

- **Goal:** `docs/TDD.md` describes the implementation that exists, including everything built since August 2026.
- **Depends on:** Phase 1
- **Covers:** FR-5, FR-6, FR-7, FR-8, AC-4, AC-5, AC-6, AC-7
- **Touches:** `docs/TDD.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** in_progress

- [ ] **P2.T1: Rebuild the structural sections from the filesystem** — covers: FR-6, AC-4, AC-5
  - [ ] **P2.T1.1: Regenerate the directory tree** — walk `git ls-files src` and write the real tree (29 scene files including bases, 15 component files with `settings/`, 30 logic modules, 14 utils, new assets folders).
  - [ ] **P2.T1.2: Rebuild the asset manifest and summary** — per-folder counts (animals 9, feelings 4, items 23, letters 26, numbers 10, shadows 8, shapes 36, stickers 22, stories 24, toys 7, ui 33 = 202, verified with `git ls-files`), the 178 boot entries, texture tiers, and which art loads per game chunk.
- [ ] **P2.T2: Document the runtime architecture** — covers: FR-5
  - [ ] **P2.T2.1: Scene architecture and lazy registry** — `GameSceneBase` → `ChoiceRoundScene` → `GroupMathScene` inheritance, `sceneRegistry` dynamic imports, shell versus game chunk.
  - [ ] **P2.T2.2: Components and shared systems** — `RoundNarrator` (glyph, label, replay, mute, caption state machine), mascot, `ParentLock`, `SettingsPanel` and the `settings/` group, PWA toasts, profile chip, play-time indicator.
- [ ] **P2.T3: Document state, audio and motion** — covers: FR-7, FR-8, AC-6, AC-7
  - [ ] **P2.T3.1: Storage schema v2** — profiles, stickers, progress, `playTime`, `Settings` fields, `GameId` list, v1 → v2 migration, cache behaviour and the unguarded-write limitation at `storage.ts:81-85`.
  - [ ] **P2.T3.2: Audio and motion** — SFX names, BGM, duck and watchdog, visibility pause, never-persisted duck level, `motion.ts` and the reduced-motion contract.
- [ ] **P2.T4: Close the TDD out** — covers: FR-5
  - [ ] **P2.T4.1: Testing, build, PWA and CI sections** — 103 files / 2,208 tests, helpers, coverage thresholds, the three validator scripts, Coolify tag deploy.
  - [ ] **P2.T4.2: Table of contents, cross-links and a final consistency read** — anchors resolve; the TDD links to the PRD instead of restating product intent.

## Phase 3: Cross-document consistency

- **Goal:** every shared number and every duplicated claim agrees across the docs, and `product.md` loses its duplicate changelog.
- **Depends on:** Phase 2
- **Covers:** FR-9, FR-10, AC-8, AC-9, AC-10
- **Touches:** `conductor/product.md`, `docs/PRD.md`, `docs/TDD.md`, `README.md`, `conductor/tech-stack.md`, `conductor/tracks/20261020-prd-tdd-truth-pass/`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** pending

- [ ] **P3.T1: Repair `product.md`** — covers: FR-9, AC-8
  - [ ] **P3.T1.1: Remove the duplicate Game 20 changelog heading** — one heading, both bodies preserved under it; verify no text lost by diffing the removed block.
- [ ] **P3.T2: Build the facts table and reconcile** — covers: FR-10, AC-9
  - [ ] **P3.T2.1: Write the facts table** — game count, adaptive split, boot SVGs, shell size, test count and coverage, each with the document that states it and the command that produced it.
  - [ ] **P3.T2.2: Reconcile every disagreement found** — fix the document that is wrong, and record each correction in the evidence file; do not change a number without re-running the command that produces it.
- [ ] **P3.T3: Verify the whole track** — covers: AC-10
  - [ ] **P3.T3.1: Claim-by-claim audit** — read both rewritten documents against their sources one last time; every count, file path and feature claim traceable.
  - [ ] **P3.T3.2: Confirm the docs-only footprint** — `git diff --stat <base>..HEAD` touches `docs/` and `conductor/` only, the full gate chain passes at the final commit, and the evidence file records both.

<!--
After a phase is accepted the primary appends:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261020-prd-tdd-truth-pass/verification/phase-<n>.md
Review fixes are appended by conductor-review as `## Phase R1: Review Fixes`.
-->
