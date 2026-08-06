# Implementation Plan — v1.6.0 Release Execution

**Track ID:** `release-1.6.0_20260806` · **Type:** Chore
**Methodology:** release process per `docs/release-checklist.md`; phases per `conductor/workflow.md` (checkpoint protocol at each phase end). TDD not applicable — verification via existing gates and checklist execution.

## Phase 1 — Pre-Release Baseline Validation [checkpoint: fc49e7f]

- [x] Task 1.1: Confirm clean working tree and master tip
  - [x] `git status --short` shows no changes
  - [x] `git log -1` confirms HEAD = latest post-polish commit
- [x] Task 1.2: Run full quality gates locally (CI order)
  - [x] `pnpm run check` — Biome clean (1 pre-existing warning: unused `getCardRects` in wordBuilderScene.test.ts)
  - [x] `CI=true pnpm test` — 979/979 passing (38 files)
  - [x] `pnpm run build` — OK (index-Cbz3RFR2.js, 27 precache entries, 1525.47 KiB)
  - [x] `node scripts/validate-pwa.js` — 13/13 passed
- [x] Task 1.3: Capture baseline release metrics (test count 979, precache 27 entries / 1525.47 KiB, main chunk index-Cbz3RFR2.js) for release notes
- [x] Task 1.4: Phase Verification & Checkpoint (Refer to workflow.md) — checkpoint fc49e7f, git note attached

## Phase 2 — Release Branch & Version Bump [checkpoint: e8f16cf]

- [x] Task 2.1: Create release branch `git checkout -b release/v1.6.0` from master
- [x] Task 2.2: Bump version `npm version 1.6.0 --no-git-tag-version`
  - [x] Verify `package.json` version = 1.6.0
  - [x] Verify `__APP_VERSION__` footer source picks it up (vite.config.ts defines it from pkg.version)
- [x] Task 2.3: Commit: `chore(release): Bump version to 1.6.0` (a260b58)
- [x] Task 2.4: Phase Verification & Checkpoint (Refer to workflow.md) — checkpoint e8f16cf, git note attached

## Phase 3 — Release Documentation [checkpoint: a57c258]

- [x] Task 3.1: Draft `docs/release-notes-v1.6.0.md` (template: What's New / Improvements / Bug Fixes / Known Issues / Installation / Feedback) covering: UI/UX Hardening, 18-shape Shape Sorter multi-round, TTS & Speaker fix, SVG Visual Polish (142 assets) — written as DRAFT (FINAL in Phase 7)
- [x] Task 3.2: Update `docs/device-testing-checklist.md` — add v1.6.0 rows (18-shape Shape Sorter rounds, speaker replay/TTS, polished-asset visual pass, PWA update path from v1.5.0); carry pending v1.5.0 execution row into the new record — v1.6.0 record added at top (newest-first), carried v1.5.0 rows included, result pending (Phase 6)
- [x] Task 3.3: Verify knowledge docs synced by prior tracks (`conductor/tech-stack.md`, `conductor/product.md`, `docs/TDD.md` asset manifest); patch only real gaps (SVG count 142, shape pool 18, Baloo 2, TTS gesture unlock) — TDD.md already fully synced (142 total, tiles, SpeakerButton, hit-area notes); patched conductor/product.md Game 1 row (18-shape pool, 3 rounds × 3) and conductor/tech-stack.md (added SVG Visual Polish Design Update entry)
- [x] Task 3.4: Commit: `docs(release): Prepare v1.6.0 release notes and device checklist` (56b52e9)
- [x] Task 3.5: Phase Verification & Checkpoint (Refer to workflow.md) — checkpoint a57c258, git note attached

## Phase 4 — Release Branch Gates + Tag + PR [checkpoint: e20a819]

- [x] Task 4.1: Re-run all four gates on `release/v1.6.0` (check → test → build → validate-pwa) — check PASS (1 pre-existing warning); test 979/979 (1 transient flaky timeout in countLogic 'proceeds easy-first' under load — passed in isolation 407ms and full re-run 62.83s, no code change); build OK (index-UJjn3q9H.js — hash differs from baseline index-Cbz3RFR2.js because bundle embeds __APP_VERSION__ 1.6.0); validate-pwa 13/13
- [x] Task 4.2: Create annotated tag `git tag -a v1.6.0 -m "Release v1.6.0 — UI/UX hardening, 18-shape Shape Sorter, TTS fixes, 142-asset SVG polish"` — created and pushed to origin
- [x] Task 4.3: Push branch + tag; open PR `release/v1.6.0` → `master` (body = release notes summary) — branch + tag pushed; PR #14 opened (https://github.com/mansyar/aby-little-lab/pull/14)
  - [x] Confirm CI "Quality Gates" check passes on the PR (merge-blocking) — PASS 1m24s (run 31108882448); Deploy to Coolify correctly skipped (master-only)
- [x] Task 4.4: Phase Verification & Checkpoint (Refer to workflow.md) — checkpoint e20a819, git note attached

## Phase 5 — Merge, Deploy & Verify [checkpoint: 0790fda]

- [x] Task 5.1: Merge PR to master; push master → triggers Coolify auto-deploy webhook (Bearer `$COOLIFY_TOKEN`) — PR #14 merged 2026-08-06T14:12:45Z; CI run 31109687344: Quality Gates + Deploy to Coolify both green (deploy job 5s)
- [x] Task 5.2: Verify deployment
  - [x] CI run on master green — run 31109687344 success
  - [x] Live `https://aby-little-lab.ansyar-world.top/` serves `index-*.js` hash matching local `dist/` — live index-UJjn3q9H.js = local dist/assets/index-UJjn3q9H.js (confirmed after Coolify rebuild; initial check showed stale index-Cbz3RFR2.js until rebuild finished)
  - [x] `/sw.js` + `/manifest.webmanifest` return 200 — both 200; sw.js precache includes index-UJjn3q9H.js
  - [x] Settings footer shows v1.6.0 — "1.6.0" found in live bundle + visible in Settings panel footer
- [x] Task 5.3: Live smoke test: boot → hub → Shape Sorter (18 shapes, 3 rounds, progress dots) → sticker → hub; settings (play-time limits, profiles) intact — headless Chrome via playwright-cli: hub 11 tiles (5+5+1) storybook icons; Shape Sorter round 1 star/oval/teardrop → dot 1; round 2 rectangle/heart/crescent (new 18-pool shapes confirmed) → dot 2; round 3 diamond/pentagon/square → dot 3 → win → sticker badge on tile → auto-return hub; Settings opens via 3s hold: BGM/SFX ON, Profiles, Reset Progress, footer v1.6.0
- [x] Task 5.4: Record deployment verification in `docs/release-checklist.md` (v1.6.0 row: CI run ID, hash match, version footer, SW/manifest) — Step 7h added (d9a0ddb)
- [x] Task 5.5: Phase Verification & Checkpoint (Refer to workflow.md) — checkpoint 0790fda, git note attached

## Phase 6 — Device Testing Execution

- [x] Task 6.1: Execute the v1.6.0 checklist record (iPad / Android tablet / iPhone / Android phone; includes carried v1.5.0 rows) against the live URL; record pass/issue per item — executed 2026-08-06: all items passed on all 4 device classes, no issues; v1.6.0 + carried v1.5.0 records in docs/device-testing-checklist.md closed as passed
- [ ] Task 6.2: Triage findings — document accepted issues in Known Issues; escalate blockers to user (max 2 fix attempts per workflow if a hotfix is approved)
- [ ] Task 6.3: Commit results: `docs(device): Record v1.6.0 device testing results`
- [ ] Task 6.4: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 7 — Finalize & Archive

- [ ] Task 7.1: Final gates on master if any post-merge changes occurred
- [ ] Task 7.2: Finalize release notes status to FINAL; mark all plan tasks complete
- [ ] Task 7.3: Archive track folder to `conductor/archive/release-1.6.0_20260806/`
  - [ ] Registry: mark entry `[x]` with archive link (dominant convention) — or remove entry (latest svg-visual-polish convention) pending user decision
- [ ] Task 7.4: Commit: `chore(conductor): Archive track 'v1.6.0 Release Execution'`
- [ ] Task 7.5: Phase Verification & Checkpoint (Refer to workflow.md)
