# Implementation Plan — v1.12.0 Release Execution

**Track ID:** `release-1.12.0_20260808` · **Type:** Chore
**Methodology:** release process per `docs/release-checklist.md`; phases per `conductor/workflow.md` (checkpoint protocol at each phase end). TDD not applicable — verification via existing gates and checklist execution.

## Phase 1 — Baseline Validation [checkpoint: 67b8b60]

- [x] Task 1.1: Confirm master state — HEAD = `3f9981d` (TTS Voice Selection archive commit); working tree clean; local ahead of origin by exactly 19 TTS commits (`git status --short --branch`, `git log --oneline origin/master..HEAD`)
  - [x] Confirmed: HEAD 6a8dca7 (in-progress marker, stacked on ca2f041 track init + 3f9981d TTS archive); tree clean; origin/master ahead by 21 (19 TTS commits + 2 conductor commits)
- [x] Task 1.2: Run full quality gates on master (CI order)
  - [x] `pnpm run check` — Biome clean (109 files, 349ms)
  - [x] `CI=true pnpm test` — 1176/1176 passing (50 files, 76.65s)
  - [x] `pnpm run build` — OK (31 precache entries, 1537.89 KiB; chunk-size warning pre-existing)
  - [x] `node scripts/validate-pwa.js` — 13/13 passed
- [x] Task 1.3: Confirm no stale version references (`1.11.0` not lingering in src; `__APP_VERSION__` reads pkg.version)
  - [x] No `1.11.0`/`1.12.0` literals in src; vite.config.ts `__APP_VERSION__: JSON.stringify(pkg.version)`; SettingsPanel footer `v${__APP_VERSION__}`
- [x] Task 1.4: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Release Branch & Version Bump [checkpoint: 5e1d6f0]

- [x] Task 2.1: Create release branch `git checkout -b release/v1.12.0` from master — created from master @ a0b79ea
- [x] Task 2.2: Bump version `npm version 1.12.0 --no-git-tag-version`
  - [x] Verify `package.json` version = 1.12.0 (no lockfile churn) — confirmed, package.json only (diff shows single line change)
  - [x] Verify `__APP_VERSION__` footer source picks it up (vite.config.ts reads pkg.version) — vite.config.ts `__APP_VERSION__: JSON.stringify(pkg.version)` (verified in Phase 1)
- [x] Task 2.3: Commit: `chore(release): Bump version to 1.12.0` (505d0d3)
- [x] Task 2.4: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Release Documentation [checkpoint: 298cab5]

- [x] Task 3.1: Draft `docs/release-notes-v1.12.0.md` (template: What's New / Improvements / Bug Fixes / Known Issues / Installation / Feedback) covering TTS Voice Selection — written as DRAFT (FINAL in Phase 7)
- [x] Task 3.2: Update `docs/device-testing-checklist.md` — add v1.12.0 record at top (newest-first): the 10 TTS voice rows (default voice fresh install; chip cycles all voices no en-US gate wrapping to Default; long-name truncation; preview speaks with SFX on; preview silent with SFX off; persistence device-level; Default restores; all 7 speech games use selected voice; missing-voice silent fallback; ≥64px touch targets) + carried speech-game/regression rows; result pending (Phase 6)
- [x] Task 3.3: Verify knowledge docs already synced by the TTS track (`conductor/tech-stack.md`, `conductor/product.md`, `docs/TDD.md`, `docs/PRD.md`, `README.md`) — patch real gaps only
  - [x] All present: product.md line 47 (TTS Voice Selection entry), tech-stack.md lines 113–115 (Design Update + IMPLEMENTED status), TDD.md/PRD.md speech.ts refs, README.md; no gaps to patch
- [x] Task 3.4: Commit: `docs(release): Prepare v1.12.0 release notes and device checklist` (922a15b)
- [x] Task 3.5: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Release Branch Gates + Tag + PR [checkpoint: <sha>]

- [x] Task 4.1: Re-run all four gates on `release/v1.12.0` (check → test → build → validate-pwa)
  - [x] Biome clean (109 files, 367ms); 1176/1176 tests (50 files, 65.20s); build `index-CRvqpYn-.js` 1511.21 kB (gzip 383.31); validate-pwa 13/13
- [x] Task 4.2: Create annotated tag `git tag -a v1.12.0 -m "Release v1.12.0 — TTS Voice Selection (parental device-level voice picker)"`; push to origin
  - [x] Tag `v1.12.0` pushed; branch `release/v1.12.0` pushed
- [x] Task 4.3: Push branch; open PR `release/v1.12.0` → `master` (body = release notes summary)
  - [x] PR #25 opened (https://github.com/mansyar/aby-little-lab/pull/25)
  - [x] Quality Gates PASS on PR (runs 31251979925 + 31251989129, both 2m+); Deploy to Coolify SKIPPED on PR run (tag run 31251979925 deploy job failed by design — tag-deploy guard "refusing to deploy" since v1.12.0 not yet on master; expected, deploy happens via master merge)
  - [x] PR MERGEABLE (master unprotected — no blocking rules; UNSTABLE state = expected tag-guard failure)
- [x] Task 4.4: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5 — Merge, Deploy & Verify [checkpoint: <sha>]

- [ ] Task 5.1: Merge PR to master; push master → triggers Coolify auto-deploy webhook (Bearer `$COOLIFY_TOKEN`); confirm the 19 TTS commits land on `origin/master`
- [ ] Task 5.2: Verify deployment
  - [ ] CI run on master green (Quality Gates + Deploy to Coolify)
  - [ ] Live `https://aby-little-lab.ansyar-world.top/` serves `index-*.js` hash matching local `dist/`
  - [ ] `/sw.js` + `/manifest.webmanifest` return 200
  - [ ] Settings footer shows v1.12.0 (bundle-level verified; visual panel check folded into Phase 6)
- [ ] Task 5.3: Live smoke test: boot → hub (14 tiles) → Settings (Voice row shows "Default (device)"; chip cycles; Preview speaks "Hi! I can talk." with SFX on) → Find the Letter spot check (speech uses selected voice) → hub; zero console errors
- [ ] Task 5.4: Record deployment verification in `docs/release-checklist.md` (v1.12.0 row: CI run ID, hash match, version footer, SW/manifest)
- [ ] Task 5.5: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 6 — Targeted Device Testing

- [ ] Task 6.1: Prepare the v1.12.0 checklist record for execution (10 TTS rows + carried rows) — conductor-prepared; **user executes** on iPad / Android tablet / iPhone / Android phone against the live URL; record pass/issue per item
- [ ] Task 6.2: Triage findings — document accepted issues in Known Issues; escalate blockers to user (max 2 fix attempts per workflow if a hotfix is approved)
- [ ] Task 6.3: Commit results: `docs(device): Record v1.12.0 device testing results`
- [ ] Task 6.4: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 7 — Finalize & Archive

- [ ] Task 7.1: Final gates on master if any post-merge changes occurred
- [ ] Task 7.2: Finalize release notes status to FINAL; mark all plan tasks complete; update `docs/release-checklist.md` Final Sign-Off block (version v1.12.0, tests, release manager)
- [ ] Task 7.3: Archive track folder to `conductor/archive/release-1.12.0_20260808/` (via git mv)
- [ ] Task 7.4: Commit: `chore(conductor): Archive track 'v1.12.0 Release Execution'`
- [ ] Task 7.5: Phase Verification & Checkpoint (Refer to workflow.md)
