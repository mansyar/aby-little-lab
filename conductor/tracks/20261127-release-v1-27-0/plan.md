# Release v1.27.0 — Implementation Plan

> **Branch:** `chore/20261127-release-v1-27-0`
> **Base:** `master` @ `cf5f5a718133ace0e3d9fe055de29dbedf42107e`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Version metadata and DRAFT release notes

- **Goal:** establish `1.27.0` and a truthful `DRAFT` note for PRs #102–#105.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, FR-4, NFR-1, NFR-3, NFR-4, AC-1, AC-2, AC-3, AC-11
- **Touches:** `package.json`, `pnpm-lock.yaml` only if required for consistency, `README.md` (Documentation index only), `docs/release-notes-v1.27.0.md`, `conductor/tracks/20261127-release-v1-27-0/verification/phase-1.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`; `pnpm install --frozen-lockfile`
- **Status:** verified

- [x] **P1.T1: Bump the release version** — covers: FR-1, AC-1, NFR-1
  - [x] **P1.T1.1: Run `pnpm version 1.27.0 --no-git-tag-version`.**
  - [x] **P1.T1.2: Confirm no dependency or lockfile drift and preserve frozen installation.**
- [x] **P1.T2: Draft the v1.27.0 release notes** — covers: FR-2, FR-3, FR-4, AC-2, AC-3, AC-11
  - [x] **P1.T2.1: Use `Status: DRAFT`, `Tag: (pending)` and `Base: v1.26.1 (ce88cb7b, 2026-11-26)`.**
  - [x] **P1.T2.2: Lead with the parent-visible #104 content-variant and #105 adaptive-band changes.**
  - [x] **P1.T2.3: Document #102/#103 as internal retention protocol/pack work that was not executed.**
  - [x] **P1.T2.4: State that profiles, stickers, settings and saves carry over without migration.**
  - [x] **P1.T2.5: Leave tag/deploy/device-result claims pending and make no unsupported coverage claim.**
  - [x] **P1.T2.6: Add the notes to the README Documentation index.**
- [x] **P1.T3: Record phase evidence and task commits** — covers: NFR-3, NFR-4
  - [x] **P1.T3.1: Save actual gate and frozen-install output in `verification/phase-1.md`.**
  - [x] **P1.T3.2: Use conventional commits and do not tag.**

**Result:** verified
**Checkpoint:** 8f1134ae
**Evidence:** conductor/tracks/20261127-release-v1-27-0/verification/phase-1.md

## Phase 2: README and release documentation truth

- **Goal:** make v1.27.0 discoverable and correct current README game-count truth.
- **Depends on:** Phase 1
- **Covers:** FR-2, FR-3, FR-4, NFR-3, NFR-4, AC-2, AC-3, AC-11
- **Touches:** `README.md`, `docs/release-notes-v1.27.0.md`, `conductor/tracks/20261127-release-v1-27-0/verification/phase-2.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`; targeted README count/link inspection; `git -c core.whitespace=cr-at-eol diff --check`
- **Status:** in_progress

- [ ] **P2.T1: Add the README release-table row** — covers: FR-3, AC-3
  - [ ] **P2.T1.1: Add a newest-first `v1.27.0` row dated 2026-11-27 with the notes link.**
  - [ ] **P2.T1.2: Summarize all four PRs, leading with #104/#105 and labeling #102/#103 internal.**
- [ ] **P2.T2: Correct current game-count wording** — covers: FR-3, AC-3
  - [ ] **P2.T2.1: Change “Twenty-two mini-games” and the Mini-Games heading to twenty-four.**
  - [ ] **P2.T2.2: Change the Hub “23-tile board” wording to 24 tiles.**
- [ ] **P2.T3: Validate release truth and preserve history** — covers: FR-2, FR-3, FR-4, NFR-4, AC-2, AC-3, AC-11
  - [ ] **P2.T3.1: Verify README links and anchors resolve.**
  - [ ] **P2.T3.2: Preserve historical release rows, notes and evidence verbatim.**
- [ ] **P2.T4: Record phase evidence** — covers: NFR-3, NFR-4
  - [ ] **P2.T4.1: Save gate, validator, scope and whitespace evidence in `verification/phase-2.md`.**

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261127-release-v1-27-0/verification/phase-2.md
-->

## Phase 3: Release-candidate verification

- **Goal:** prove the exact release candidate is healthy and refresh time-sensitive evidence.
- **Depends on:** Phase 2
- **Covers:** FR-2, FR-4, FR-5, FR-6, FR-7, NFR-2, NFR-3, NFR-4, NFR-7, AC-2, AC-4, AC-5, AC-6, AC-11
- **Touches:** `README.md` and `docs/TDD.md` only for living count truth, `docs/perf-baseline.md`, `docs/release-notes-v1.27.0.md`, `conductor/tracks/20261127-release-v1-27-0/verification/*`
- **Verification:**
  - `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
  - `pnpm install --frozen-lockfile`
  - Start `node node_modules/vite/bin/vite.js preview --port 4173 --strictPort`, run `node scripts/validate-boot.js`, then stop the preview.
  - `docker build --build-arg GIT_SHA=<HEAD> -t aby-little-lab:headers .` followed by `node scripts/validate-headers.js`.
  - `$env:TAP_HEADED='1'; $env:TAP_INERT_IDLE='1'; node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10` on Windows PowerShell; require exit 0, 50 cold / 0 warm samples, exactly 10 per target game and every worst cold total ≤400 ms.
  - `pnpm exec playwright test --list`, then `pnpm test:e2e`, `pnpm test:e2e:webkit`, `pnpm test:e2e:firefox` and `pnpm test:e2e:mobile-chromium` sequentially with zero local retries.
  - `git -c core.whitespace=cr-at-eol diff --check`
- **Status:** pending

- [ ] **P3.T1: Run the integrated full gate and frozen install** — covers: FR-5, AC-4, NFR-2
  - [ ] **P3.T1.1: Capture actual suite, coverage, bundle, module-size, texture, PWA and docs figures.**
  - [ ] **P3.T1.2: Confirm frozen installation and no lockfile drift.**
- [ ] **P3.T2: Run boot and strict-header validation** — covers: FR-6, AC-5
  - [ ] **P3.T2.1: Require boot median under the 3.0 s budget.**
  - [ ] **P3.T2.2: Rebuild the current candidate image and require every strict-header check to pass.**
- [ ] **P3.T3: Run the headed first-tap baseline** — covers: FR-6, AC-5
  - [ ] **P3.T3.1: Commit raw JSON/stdout evidence under `verification/`.**
  - [ ] **P3.T3.2: Block on a failed worst-cold gate; never substitute headless or warm-only data.**
- [ ] **P3.T4: Run the complete local browser matrix** — covers: FR-7, AC-6
  - [ ] **P3.T4.1: Record the discovered roster before running projects.**
  - [ ] **P3.T4.2: Run Chromium, WebKit, Firefox and mobile Chromium sequentially with zero local retries.**
  - [ ] **P3.T4.3: Record first-attempt counts and distinguish emulation from physical hardware.**
- [ ] **P3.T5: Refresh notes and living performance truth** — covers: FR-2, FR-6, FR-4, NFR-3, NFR-4, AC-2
  - [ ] **P3.T5.1: Use measured release-state figures and leave tag/deploy pending.**
  - [ ] **P3.T5.2: Update the live header/table in `docs/perf-baseline.md` if figures differ, preserving historical sections.**
  - [ ] **P3.T5.3: Refresh only stale current counts in `README.md` and `docs/TDD.md`.**
- [ ] **P3.T6: Inspect final scope and claims** — covers: FR-4, NFR-1, NFR-3, AC-11
  - [ ] **P3.T6.1: Confirm no runtime, asset, dependency, schema, storage or network change.**
  - [ ] **P3.T6.2: Confirm no physical-device, retention-pass or longitudinal-band claim.**
- [ ] **P3.T7: Record integrated evidence** — covers: NFR-3, NFR-7
  - [ ] **P3.T7.1: Save exact commands, exit codes, measured figures and raw-evidence paths in `verification/integrated.md`.**
  - [ ] **P3.T7.2: Use the CRLF-aware whitespace check and record scope proof.**

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261127-release-v1-27-0/verification/integrated.md
-->

## Phase 4: Strict review, PR and merge gate

- **Goal:** pass strict review and open a green release PR; merge only after explicit approval.
- **Depends on:** Phase 3
- **Covers:** FR-8, NFR-2, NFR-6, AC-7, AC-11
- **Touches:** `docs/release-notes-v1.27.0.md` and `README.md` only if review requires correction; Conductor review/PR/verification state
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`; required PR CI jobs; final scope diff inspection
- **Status:** pending

- [ ] **P4.T1: Run `conductor-review`** — covers: FR-8, AC-7
  - [ ] **P4.T1.1: Resolve blocking findings; allow at most two review-fix rounds.**
  - [ ] **P4.T1.2: Record the verdict and any accepted findings according to workflow policy.**
- [ ] **P4.T2: Open the release PR** — covers: FR-8
  - [ ] **P4.T2.1: Use title `chore(release): ship v1.27.0`.**
  - [ ] **P4.T2.2: Include requirements coverage, measured verification, accepted device gap, pre-authorized tag gate and rollback.**
- [ ] **P4.T3: Watch release PR CI** — covers: FR-8, AC-7
  - [ ] **P4.T3.1: Require Quality Gates, both Chromium shards, all three engine jobs and the Browser Journeys rollup to pass.**
  - [ ] **P4.T3.2: Do not merge while any required check is failed, pending or blocked.**
- [ ] **P4.T4: Merge after the explicit answer and record evidence** — covers: FR-8, NFR-6, AC-7
  - [ ] **P4.T4.1: Merge with the configured `merge` method only after the user answers “Merge now”.**
  - [ ] **P4.T4.2: Record merge commit, CI run, branch cleanup and rollback posture.**

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261127-release-v1-27-0/verification/phase-4.md
-->

## Phase 5: Pre-authorized tag, deploy and final notes

- **Goal:** satisfy the accepted device-gap policy and ship only after all tag preconditions hold, then finalize the release record.
- **Depends on:** Phase 4 merge
- **Covers:** FR-9, FR-10, FR-11, NFR-3, NFR-5, NFR-6, NFR-7, AC-8, AC-9, AC-10
- **Touches:** `docs/release-notes-v1.27.0.md`, Conductor verification/archive state, git tag
- **Verification:** recorded device policy; no tag collision; tag on merged `master` HEAD; tag CI green; live URL/build/version/hash verified; `node scripts/validate-docs.js`; `git -c core.whitespace=cr-at-eol diff --check`
- **Status:** pending

- [ ] **P5.T1: Record the targeted device-smoke policy** — covers: FR-9, AC-8
  - [ ] **P5.T1.1: Record `SKIPPED — accepted gap`; no physical-device, iOS Safari, Android Chrome or Fire tablet pass is claimed.**
- [ ] **P5.T2: Preflight the tag** — covers: FR-10, NFR-5, AC-9
  - [ ] **P5.T2.1: Fetch `master`; confirm the release merge is HEAD and the tree is clean.**
  - [ ] **P5.T2.2: Confirm `v1.27.0` exists neither locally nor on origin.**
- [ ] **P5.T3: Create and push the tag using the recorded pre-authorization** — covers: FR-10, NFR-5, AC-9
  - [ ] **P5.T3.1: Annotate `v1.27.0` on merged `master` HEAD.**
  - [ ] **P5.T3.2: Never move the tag after push; stop if any P5.T2 precondition fails.**
- [ ] **P5.T4: Verify tag CI and deployment** — covers: FR-10, AC-9
  - [ ] **P5.T4.1: Require Quality Gates, both Chromium shards, all three engine jobs, the Browser Journeys rollup and Coolify to pass.**
  - [ ] **P5.T4.2: Verify the live URL serves the release build and reports `1.27.0`; compare the remote and local shell hashes.**
- [ ] **P5.T5: Finalize notes and close the ship gate** — covers: FR-2, FR-10, FR-11, NFR-3, NFR-7, AC-2, AC-9, AC-10
  - [ ] **P5.T5.1: Flip `DRAFT` to `FINAL`; record tag commit, CI run, deploy result, live verification and device policy.**
  - [ ] **P5.T5.2: Update archived ship evidence/state through the documented docs/Conductor-only finalization exception.**

### Post-tag finalization procedure (release exception)

1. This is a docs/Conductor-only procedure following the v1.25.0, v1.26.0 and
   v1.26.1 precedents.
2. Start only after the release PR is merged, `v1.27.0` is pushed on merged
   `master` HEAD, tag CI and Coolify verification pass, and the accepted device
   gap is recorded.
3. The owner's tag/deploy authorization was recorded at track creation and is
   sufficient for this finalization; if any precondition fails, stop and require
   a reviewed follow-up rather than proceeding.
4. Fetch `origin/master`, fast-forward local `master` to it, and confirm a clean
   tree. Do not change the pushed tag or release merge commit.
5. Update only `docs/release-notes-v1.27.0.md` from `DRAFT` to `FINAL` with the tag
   commit, tag CI run, deploy result, live verification and device policy, plus
   the archived track's ship evidence/state.
6. Run `node scripts/validate-docs.js` and
   `git -c core.whitespace=cr-at-eol diff --check`; inspect that the diff is
   limited to release notes and Conductor archive/state files.
7. Commit and push `master` with conventional release/Conductor messages. This is
   the single documented direct-to-`master` exception; never force-push, reset,
   move or recreate the tag. A failure stops the gate and requires a reviewed
   follow-up.

## Rollback Strategy

- **Before tag:** revert the release PR; no production impact.
- **After tag/deploy:** never move or delete the published tag. Revert the release
  merge with a reviewed follow-up and cut a patch release if a shipped defect is
  found.
- **Data:** no migration, schema change or profile rewrite occurs, so no user-data
  rollback is required.
