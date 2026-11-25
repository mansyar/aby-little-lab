# Release v1.26.1 — Implementation Plan

> **Branch:** `chore/20261126-release-v1-26-1`
> **Base:** `master` @ `859498a850f729294785453f5884c1915e4071c7`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Version metadata and release-note draft

- **Goal:** establish `1.26.1` and a truthful DRAFT note for the single shipped PR #100.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, FR-10, FR-12, NFR-1, NFR-3, NFR-4, AC-1, AC-2, AC-3, AC-12
- **Touches:** `package.json`, `pnpm-lock.yaml` only if required for consistency, `README.md` (Documentation index link only), `docs/release-notes-v1.26.1.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`; `pnpm install --frozen-lockfile`
- **Status:** verified
- **Result:** version, DRAFT notes and index link verified by the exact gate and frozen install; evidence in `verification/phase-1.md`
- **Checkpoint:** `659ac77175ee8920a2da865fa05355fcff5a87f4`

- [x] **P1.T1: Bump the release version** — covers: FR-1, AC-1, NFR-1
  - Run `pnpm version 1.26.1 --no-git-tag-version`.
  - Confirm no dependency or lockfile drift; preserve deterministic frozen installation.
- [x] **P1.T2: Draft the v1.26.1 release notes** — covers: FR-2, FR-3, FR-10, FR-12, AC-2, AC-3
  - Use `Status: DRAFT`, `Tag: (pending)`, and `Base: v1.26.0 (3c0cef4a, 2026-11-25)`.
  - Cover PR #100 from its archived PR record: cross-engine smoke matrix, blocking rollup, strict evidence helper, and the three smoke-proven compatibility fixes.
  - State that profiles, stickers, settings and saves carry over without migration.
  - Leave tag/deploy and device-result claims pending until those gates complete.
  - Add the new notes to the README Documentation index so `validate-docs.js` can pass in this phase.
- [x] **P1.T3: Record phase evidence and task commits** — covers: NFR-3, NFR-4
  - Save actual gate output in `verification/phase-1.md`.
  - Use conventional commits; do not tag.

## Phase 2: README, roadmap and archived-state truth

- **Goal:** make the release discoverable and correct the browser-matrix roadmap/archived claims.
- **Depends on:** Phase 1
- **Covers:** FR-3, FR-4, FR-5, FR-12, NFR-4, AC-3, AC-4, AC-5, AC-12
- **Touches:** `README.md`, `conductor/roadmap.md`, `conductor/archive/20261125-browser-matrix/metadata.json`, `conductor/archive/20261125-browser-matrix/pr.md`
- **Verification:** the exact configured gate; `node scripts/validate-docs.js`; targeted README/roadmap/archive inspection
- **Status:** verified
- **Result:** local release truth committed at `f6a98249`; exact gate and CRLF-aware whitespace check passed; PR/merge/tag CI remains pending
- **Checkpoint:** `f6a98249`

- [x] **P2.T1: Add the README release-table row** — covers: FR-3, AC-3
  - Add a newest-first `v1.26.1` row dated 2026-11-26.
  - The Documentation index link is already present from Phase 1 for validator ordering.
- [x] **P2.T2: Correct browser-matrix roadmap truth** — covers: FR-4, FR-12, AC-4
  - In the `Next` bucket, mark RM-3 as delivered for WebKit/Firefox/mobile-Chromium emulation while preserving the manual physical-device gate.
  - In §10.7, replace the future-work browser-matrix row with the delivered CI matrix description; do not claim physical iOS Safari, Android Chrome, or Fire tablet coverage.
- [x] **P2.T3: Repair archived browser-matrix state** — covers: FR-5, AC-5
  - Change archived metadata `pr_state` from `open` to `merged`.
  - Repair the malformed `pr.md` URL/head/base header and verify all archived links resolve.
- [x] **P2.T4: Record phase evidence and task commits** — covers: NFR-4
  - Save gate, validator and scoped-diff evidence in `verification/phase-2.md`.

## Phase 3: Release-candidate verification

- **Goal:** prove the exact release candidate is healthy and refresh time-sensitive performance evidence.
- **Depends on:** Phase 2
- **Covers:** FR-2, FR-6, FR-7, FR-8, FR-12, NFR-2, NFR-3, NFR-4, NFR-7, AC-2, AC-6, AC-7, AC-8, AC-12
- **Touches:** `README.md` and `docs/TDD.md` only for living count truth, `docs/release-notes-v1.26.1.md`, `docs/perf-baseline.md` only if measured figures differ, Conductor verification files, and for P3.T6 only the narrowly scoped fix-forward source/test files identified by the reproduced CI failure
- **Verification:**
  - `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
  - `pnpm install --frozen-lockfile`
  - Start `node node_modules/vite/bin/vite.js preview --port 4173 --strictPort`, then run `node scripts/validate-boot.js`.
  - `docker build --build-arg GIT_SHA=<HEAD> -t aby-little-lab:headers .` followed by `node scripts/validate-headers.js`.
  - `TAP_HEADED=1 TAP_INERT_IDLE=1 node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10`
  - Require exit 0, 50 cold / 0 warm samples, exactly 10 per target game, and every worst cold total ≤400 ms.
  - `pnpm exec playwright test --list`, then `pnpm test:e2e`, WebKit, Firefox and mobile Chromium sequentially with zero local retries.
  - `git -c core.whitespace=cr-at-eol diff --check`
- **Status:** verified
- **Result:** Local release candidate passed the exact configured gate, frozen install, boot/headers, headed first tap, and all four browser projects with zero retries. PR CI, merge, tag CI and deploy remain pending.
- **Checkpoint:** `4428d33d71409859c65b8409b492703855a0d251`

- [x] **P3.T1: Run the integrated full gate** — covers: FR-6, AC-6, NFR-2
  - Capture actual suite, coverage, bundle, module-size, texture, PWA and docs figures.
  - Run frozen installation and confirm no lockfile drift.
- [x] **P3.T2: Run boot and header validation** — covers: FR-7, AC-7
  - Require boot median under the 3.0 s budget and every strict-header check to pass.
  - Rebuild the current release-candidate image before header validation.
- [x] **P3.T3: Run the headed first-tap baseline** — covers: FR-7, AC-7
  - Commit raw JSON/stdout evidence under `verification/`.
  - Block on a failed worst-cold gate; never substitute headless or warm-only data.
- [x] **P3.T4: Refresh notes and living performance truth** — covers: FR-2, FR-7, FR-12, NFR-3, NFR-4, AC-2
  - Use measured release-state figures, label CI-only browser coverage, and leave tag/deploy pending.
  - Update the live header/table in `docs/perf-baseline.md` if figures differ, preserving historical sections.
- [x] **P3.T5: Record integrated evidence** — covers: NFR-3, NFR-7
  - Save the exact commands, exit codes, measured figures and raw-evidence paths in `verification/integrated.md`.
  - Use the CRLF-aware whitespace check where needed.
- [x] **P3.T6: Fix forward the red master CI check** — covers: FR-8, NFR-2, AC-8
  - Master rerun `45595775568` on `859498a8` is red because Firefox `sticker-persistence` logged three `InvalidStateError: Navigated away from page` page errors across three attempts.
  - Diagnose and apply one narrowly scoped, reviewed patch that closes the reproduced red check without weakening an assertion, threshold, sample count, or gate; this is the sole exception to NFR-1/AC-12.
  - Add a regression test for the defect where practical, rerun the exact gate and all four browser projects with zero local retries, and record raw evidence.
  - Do not accept retry-only passes or filter generic console errors; PR CI must be green before merge and tagging.
- [x] **P3.T7: Refresh living suite counts after the fix-forward patch** — covers: FR-12, NFR-4, AC-12
  - The two AudioManager regression tests raise living truth from 158 files / 3,404 tests to 158 files / 3,406 tests.
  - Update only living count and coverage claims in `README.md`, `docs/TDD.md` and `docs/perf-baseline.md`; preserve historical records.

## Phase 4: Review, PR and merge

- **Goal:** pass strict review and merge a green release PR.
- **Depends on:** Phase 3
- **Covers:** FR-8, FR-10, NFR-2, NFR-5, NFR-6, AC-8, AC-10, AC-12
- **Touches:** release notes or docs only if review requires a correction; Conductor review/PR/verification state
- **Verification:** the exact configured gate; CI Quality Gates, both Chromium shards, all three engine jobs and the `Browser Journeys` rollup; final scope diff inspection
- **Status:** in_progress

- [x] **P4.T1: Run `conductor-review`** — covers: FR-10, AC-10
  - Resolve blocking findings; allow at most two review-fix rounds.
  - Record the verdict and any accepted findings according to workflow policy.
- [ ] **P4.T2: Open the release PR** — covers: FR-10
  - Conventional title: `chore(release): ship v1.26.1`.
  - Media: none; this is metadata/documentation-only.
  - Include requirements coverage, verification summary, the pre-authorized tag gate, and rollback.
- [ ] **P4.T3: Watch CI and merge after the explicit answer** — covers: FR-8, FR-10, AC-8, AC-10, NFR-5
  - Require green Quality Gates and all Browser Journeys jobs, including engine jobs and rollup.
  - Merge with the configured `merge` method only after the user answers "Merge now".
- [ ] **P4.T4: Record merge evidence** — covers: NFR-3, NFR-6
  - Record merge commit, CI run, cleanup and rollback posture.

## Phase 5: Pre-authorized tag, deploy and final notes

- **Goal:** satisfy the accepted device-gap policy and ship only after all tag preconditions hold, then finalize the release record.
- **Depends on:** Phase 4
- **Covers:** FR-9, FR-11, FR-12, NFR-3, NFR-5, NFR-6, NFR-7, AC-9, AC-11
- **Touches:** `docs/release-notes-v1.26.1.md`, `docs/device-testing-checklist.md` only if a device pass is executed, Conductor verification/state, git tag
- **Verification:** recorded device policy; no tag collision; tag on merged `master` HEAD; tag CI green; live URL/build/version verified; `node scripts/validate-docs.js`; CRLF-aware whitespace check
- **Status:** pending

- [ ] **P5.T1: Record the targeted device-smoke policy** — covers: FR-9, FR-12, AC-9
  - Record `SKIPPED — accepted gap`; no physical-device, iOS Safari, Android Chrome or Fire tablet pass is claimed.
- [ ] **P5.T2: Preflight the tag** — covers: FR-11, NFR-5, AC-11
  - Fetch `master`; confirm the release merge is HEAD and the tree is clean.
  - Confirm `v1.26.1` exists neither locally nor on origin.
- [ ] **P5.T3: Create and push the tag using the recorded pre-authorization** — covers: FR-11, NFR-5, AC-11
  - Annotate `v1.26.1` on merged `master` HEAD.
  - Never move the tag after push; stop if any precondition from P5.T2 fails.
- [ ] **P5.T4: Verify tag CI and deployment** — covers: FR-8, FR-11, AC-8, AC-11
  - Require Quality Gates, both Chromium shards, all three engine jobs, the rollup and Coolify to pass.
  - Verify the live URL serves the release build and reports `1.26.1`.
- [ ] **P5.T5: Finalize notes and close the ship gate** — covers: FR-2, FR-11, FR-12, NFR-3, NFR-7, AC-11
  - Flip `DRAFT` to `FINAL`; record tag commit, CI run, deploy result and device policy.
  - Follow the post-tag finalization procedure below; cite the v1.25.0/v1.26.0 precedents.

### Post-tag finalization procedure (release exception)

1. This is a docs/Conductor-only procedure following the v1.25.0 and v1.26.0 precedents.
2. Start only after the release PR is merged, `v1.26.1` is pushed on merged `master` HEAD, tag CI and Coolify verification pass, and the accepted device gap is recorded.
3. The owner's tag/deploy authorization was recorded at track creation and is sufficient for this finalization; if any precondition fails, stop and require a reviewed follow-up rather than proceeding.
4. Fetch `origin/master`, fast-forward local `master` to it, and confirm a clean tree. Do not change the pushed tag or release merge commit.
5. Update only `docs/release-notes-v1.26.1.md` from `DRAFT` to `FINAL` with the tag commit, tag CI run, deploy result and device policy, plus the archived track's ship evidence/state.
6. Run `node scripts/validate-docs.js` and `git -c core.whitespace=cr-at-eol diff --check`; inspect that the diff is limited to release notes and Conductor archive/state files.
7. Commit and push `master` with conventional release/Conductor messages. This is the single documented direct-to-`master` exception; never force-push, reset, move or recreate the tag. A failure stops the gate and requires a reviewed follow-up.

## Rollback Strategy

- **Before tag:** revert the release PR merge; no production impact.
- **After tag/deploy:** never move or delete the published tag. Revert the release merge with a reviewed follow-up and cut a patch release if a shipped defect is found.
- **Data:** no migration, schema change or profile rewrite occurs, so no user-data rollback is required.
