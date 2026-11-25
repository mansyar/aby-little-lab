# Release v1.26.0 — Implementation Plan

> **Branch:** `chore/20261125-release-v1-26-0`
> **Base:** `master` @ `b5c18c8a047aaee404920804be635f5a37ea3bd2`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Version metadata and release-note draft

- **Goal:** establish `1.26.0` and a truthful DRAFT note covering the five shipped PRs.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, FR-10, NFR-1, NFR-3, NFR-4, AC-1, AC-2, AC-3, AC-10
- **Touches:** `package.json`, `pnpm-lock.yaml` only if required for consistency, `README.md` (Documentation index link only), `docs/release-notes-v1.26.0.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`; `pnpm install --frozen-lockfile`
- **Status:** verified

- [x] **P1.T1: Bump the release version** — covers: FR-1
  - Run `pnpm version 1.26.0 --no-git-tag-version`.
  - Confirm no dependency or lockfile drift; preserve deterministic frozen installation.
- [x] **P1.T2: Draft the v1.26.0 release notes** — covers: FR-2, FR-3, FR-10
  - Use `Status: DRAFT`, `Tag: (pending)`, and `Base: v1.25.0 (4359667b, 2026-11-23)`.
  - Cover PRs #94–#98 in merge order using their archived `pr.md` and verification evidence.
  - State that profiles, stickers, settings and saves carry over without migration.
  - Leave tag/deploy and device-result claims pending until those gates complete.
  - Add the new notes to the README Documentation index so `validate-docs.js` can pass in this phase.
- [x] **P1.T3: Record phase evidence and task commits** — covers: NFR-3
  - Save actual gate output in `verification/phase-1.md`.
  - Use conventional commits; do not tag.

**Result:** verified
**Checkpoint:** `4f5969a0`
**Evidence:** `conductor/tracks/20261125-release-v1-26-0/verification/phase-1.md`

## Phase 2: README and roadmap truth

- **Goal:** make the release discoverable and correct the completed perf-baseline roadmap entry.
- **Depends on:** Phase 1
- **Covers:** FR-3, FR-4, NFR-4, AC-3, AC-4
- **Touches:** `README.md`, `conductor/roadmap.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`; targeted README link/table inspection
- **Status:** verified

- [x] **P2.T1: Add the README release-table row** — covers: FR-3
  - Add a newest-first `v1.26.0` row dated 2026-11-25.
  - The Documentation index link is added in Phase 1 to satisfy the note-index validator at phase-gate time.
- [x] **P2.T2: Correct roadmap §10.7** — covers: FR-4
  - Mark the headed first-tap p95 baseline as completed on 2026-11-24.
  - Link `docs/perf-baseline.md` and preserve the earlier failed measurement history.
- [x] **P2.T3: Record phase evidence and task commits** — covers: NFR-3

**Result:** verified
**Checkpoint:** `3a28b75e`
**Evidence:** `conductor/tracks/20261125-release-v1-26-0/verification/phase-2.md`

## Phase 3: Release-candidate verification

- **Goal:** prove the exact release candidate is healthy before review and merge.
- **Depends on:** Phase 2
- **Covers:** FR-2, FR-5, NFR-2, NFR-3, AC-2, AC-5, AC-10
- **Touches:** `docs/release-notes-v1.26.0.md`, Conductor verification files
- **Verification:**
  - `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
  - Boot smoke against `vite preview` on port 4173 with `node scripts/validate-boot.js`.
  - `node scripts/validate-headers.js`.
  - `TAP_HEADED=1 TAP_INERT_IDLE=1 node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10`
  - Require exit 0, 50 cold / 0 warm samples, 10 per target game, and every worst cold total ≤400 ms.
- **Status:** verified

- [x] **P3.T1: Run the integrated full gate** — covers: FR-5, AC-5
  - Capture current suite counts, coverage, shell size, module-size, texture, PWA and docs results.
- [x] **P3.T2: Run boot, headers and headed first-tap checks** — covers: NFR-3, AC-5
  - Save raw headed evidence under `verification/`.
  - Block on a failed worst-cold gate; do not substitute headless or warm-only data.
- [x] **P3.T3: Refresh the notes' Release Verification section** — covers: FR-2, AC-2
  - Use measured figures, clearly label CI-only browser journeys, and leave the tag/deploy line pending.
- [x] **P3.T4: Record integrated evidence** — covers: NFR-3

**Result:** verified
**Checkpoint:** `737fd899`
**Evidence:** `conductor/tracks/20261125-release-v1-26-0/verification/integrated.md`, `conductor/tracks/20261125-release-v1-26-0/verification/phase-3.md`

## Phase 4: Review, PR and merge

- **Goal:** pass strict review and merge a green release PR.
- **Depends on:** Phase 3
- **Covers:** FR-6, FR-8, NFR-2, NFR-5, NFR-6, AC-6, AC-8, AC-10
- **Touches:** release notes or docs only if review requires a correction; Conductor review/PR/verification state
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`; CI Quality Gates, Browser Journeys shard 1, shard 2 and rollup; final scope diff inspection
- **Status:** in_progress

- [ ] **P4.T1: Run `conductor-review`** — covers: FR-8
  - Resolve blocking findings; allow at most two review-fix rounds.
  - Record accepted/deferred findings according to workflow policy.
- [ ] **P4.T2: Open the release PR** — covers: FR-8
  - Conventional title: `chore(release): ship v1.26.0`.
  - Media: none; this is metadata/documentation-only.
  - Include requirements coverage, verification summary and the separate human tag gate.
- [ ] **P4.T3: Watch CI and merge after go-ahead** — covers: FR-6, FR-8, AC-6, AC-8
  - Require green Quality Gates and all Browser Journeys jobs.
  - Merge with the configured `merge` method only after the required approval.
- [ ] **P4.T4: Record merge evidence** — covers: NFR-3

**Result:** pending
**Checkpoint:** pending
**Evidence:** `conductor/tracks/20261125-release-v1-26-0/verification/phase-4.md`

## Phase 5: Device policy, tag, deploy and final notes

- **Goal:** satisfy the selected device policy, then ship only after explicit approval and finalize the release record.
- **Depends on:** Phase 4
- **Covers:** FR-7, FR-9, FR-10, NFR-5, AC-7, AC-9
- **Touches:** `docs/release-notes-v1.26.0.md`, `docs/device-testing-checklist.md` if a device pass is executed, Conductor verification/state, git tag
- **Verification:** device result or recorded accepted gap; no tag collision; tag on merged `master` HEAD; tag CI green; live URL/build/version verified; `node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P5.T1: Resolve the targeted device-smoke policy** — covers: FR-7, AC-7
  - If hardware is available, ask the owner to run the focused install/landscape/offline/first-tap-audio smoke against the release candidate over HTTPS.
  - Otherwise record `SKIPPED — accepted gap` before tagging.
- [ ] **P5.T2: Preflight the tag** — covers: FR-9
  - Fetch `master`; confirm the release merge is HEAD and clean.
  - Confirm `v1.26.0` exists neither locally nor on origin.
- [ ] **P5.T3: Create and push the tag after explicit approval** — covers: FR-9, AC-9
  - Annotate `v1.26.0` on merged `master` HEAD.
  - Never move the tag after push.
- [ ] **P5.T4: Verify tag CI and deployment** — covers: FR-9, AC-9
  - Require Quality Gates and Browser Journeys to pass and the Coolify job to fire.
  - Verify the live URL serves the release build and reports `1.26.0`.
- [ ] **P5.T5: Finalize notes and close the ship gate** — covers: FR-9, AC-9
  - Flip `DRAFT` to `FINAL`; record tag commit, CI run, deploy result and device policy.
  - Follow the post-tag finalization procedure below, which is the documented release exception and cites the v1.25.0 precedent.

### Post-tag finalization procedure (release exception)

1. This is a docs/Conductor-only procedure following the v1.25.0 precedent in [Phase 6 verification](../../archive/20261123-release-v1-25-0/verification/phase-6.md).
2. Start only after the release PR is merged, `v1.26.0` is pushed on merged `master` HEAD, tag CI and Coolify verification pass, and the targeted-device result or accepted gap is recorded.
3. The owner's explicit Phase 5 tag/deploy go-ahead must already be recorded; it also authorizes the final notes update. Never finalize autonomously.
4. Fetch `origin/master`, fast-forward local `master` to it, and confirm a clean tree. Do not change the pushed tag or release merge commit.
5. Update only `docs/release-notes-v1.26.0.md` from `DRAFT` to `FINAL` with the tag commit, tag CI run, deploy result and device policy, plus the archived track's ship evidence/state.
6. Run `node scripts/validate-docs.js` and `git diff --check`; inspect that the diff is limited to release notes and Conductor archive/state files.
7. Commit and push `master` with conventional release/Conductor messages. This is the single documented direct-to-`master` exception; never force-push, reset, move or recreate the tag. A failure stops the gate and requires a reviewed follow-up.

**Result:** pending
**Checkpoint:** pending
**Evidence:** `conductor/tracks/20261125-release-v1-26-0/verification/phase-5.md`

## Phase R1: Review fixes

- **Goal:** close all four strict-review findings without expanding release scope.
- **Depends on:** Review round 1
- **Covers:** FR-2, FR-6, FR-9, NFR-2, NFR-5, AC-3, AC-6
- **Touches:** `docs/release-notes-v1.26.0.md`, `conductor/tracks/20261125-release-v1-26-0/spec.md`, `conductor/tracks/20261125-release-v1-26-0/plan.md`, `conductor/tracks/20261125-release-v1-26-0/verification/phase-1.md`, `conductor/tracks/20261125-release-v1-26-0/verification/phase-R1.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`; `git diff --check`; re-review
- **Status:** verified

- [x] **R1.T1: Correct the Known Issues roadmap destination** — covers: FR-2
  - Replace the `conductor/product.md §10` pointer with `conductor/roadmap.md §10`.
- [x] **R1.T2: Correct Phase 1 AC-3 attribution** — covers: AC-3
  - Mark AC-3 partial in Phase 1 evidence; the Documentation index link passed there, while the Releases row passed in Phase 2.
- [x] **R1.T3: Correct CI requirement mapping** — covers: FR-6, AC-6
  - Remove FR-6/AC-6 from Phase 3 `Covers`; add them to Phase 4 `Covers` and P4.T3.
- [x] **R1.T4: Define the post-tag finalization procedure** — covers: FR-9, NFR-5
  - Document the exact docs/Conductor-only direct-to-master finalization procedure in Phase 5 and update the spec/P5.T5 reference to cite it and the v1.25.0 archived precedent.
- [x] **R1.T5: Verify and record the fix round** — covers: NFR-2
  - Run the exact gate and whitespace check, write `verification/phase-R1.md`, and return to review.

**Result:** verified
**Checkpoint:** `5fb25d81`
**Evidence:** `conductor/tracks/20261125-release-v1-26-0/verification/phase-R1.md`

## Phase R2: Final review mapping

- **Goal:** close strict-review round 2 finding F5 and return to review.
- **Depends on:** Review round 2
- **Covers:** NFR-2
- **Touches:** `conductor/tracks/20261125-release-v1-26-0/plan.md`, `conductor/tracks/20261125-release-v1-26-0/verification/phase-R2.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`; `git diff --check`; re-review
- **Status:** verified

- [x] **R2.T1: Add NFR-2 to Phase R1 coverage** — covers: NFR-2
  - Make the plan's phase-level `Covers` list agree with R1.T5 and the reviewer's round-2 finding.
- [x] **R2.T2: Verify and record the final mapping fix** — covers: NFR-2
  - Run the exact gate and whitespace check, record `verification/phase-R2.md`, and return to review.

**Result:** verified
**Checkpoint:** `1342b760`
**Evidence:** `conductor/tracks/20261125-release-v1-26-0/verification/phase-R2.md`

## Rollback Strategy

- **Before tag:** revert the release PR merge; no production impact.
- **After tag/deploy:** never move or delete the published tag. Revert the release merge with a reviewed follow-up and cut a patch release if a shipped defect is found.
- **Data:** no migration, schema change or profile rewrite occurs, so no user-data rollback is required.
