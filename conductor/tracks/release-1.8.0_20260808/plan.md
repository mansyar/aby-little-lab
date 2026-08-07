# Implementation Plan — v1.8.0 Release Execution

**Track ID:** `release-1.8.0_20260808` · **Type:** Chore
**Methodology:** release process per `docs/release-checklist.md`; phases per `conductor/workflow.md` (checkpoint protocol at each phase end). TDD not applicable — verification via existing gates and checklist execution.

## Phase 1 — Feature Merge & Baseline Validation

- [x] Task 1.1: Confirm `feat/game-12` clean working tree; `git log -1` verifies HEAD = Game 12 archive commit (5b12c29)
  - [x] `git status --short` shows no changes
  - [x] `git log -1` confirms expected HEAD — HEAD = ac0da92 (in-progress marker; stacked on 9314092 track init, above archive 5b12c29)
- [x] Task 1.2: Run full quality gates on `feat/game-12` (CI order)
  - [x] `pnpm run check` — Biome clean (96 files, 400ms)
  - [x] `CI=true pnpm test` — 1065/1065 passing (43 files, 64.53s) — includes firstSoundsLogic (19) + firstSoundsScene (15)
  - [x] `pnpm run build` — OK (main chunk index-DZXUyNHv.js, 1503.58 KiB / gzip 382.05, FirstSoundsScene-BRPiBd0Z.js lazy chunk, 28 precache entries / 1533.95 KiB)
  - [x] `node scripts/validate-pwa.js` — 13/13 passed
- [ ] Task 1.3: Push `feat/game-12`; open PR → `master` (body = Game 12 summary)
  - [ ] Confirm CI "Quality Gates" check passes on the PR (merge-blocking)
- [ ] Task 1.4: Merge PR to master; confirm master now contains all Game 12 code (`git ls-tree -r master --name-only | grep -i firstsounds` non-empty)
- [ ] Task 1.5: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Release Branch & Version Bump [checkpoint: c024437]

- [x] Task 2.1: Create release branch `git checkout -b release/v1.8.0` from master — created from origin/master @ 873594e (PR #16 merge)
- [x] Task 2.2: Bump version `npm version 1.8.0 --no-git-tag-version`
  - [x] Verify `package.json` version = 1.8.0 — confirmed (only file changed; no lockfile churn)
  - [x] Verify `__APP_VERSION__` footer source picks it up (vite.config.ts defines it from pkg.version) — vite.config.ts:10 `__APP_VERSION__: JSON.stringify(pkg.version)`
- [x] Task 2.3: Commit: `chore(release): Bump version to 1.8.0` (6654582)
- [ ] Task 2.4: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Release Documentation

- [ ] Task 3.1: Draft `docs/release-notes-v1.8.0.md` (template: What's New / Improvements / Bug Fixes / Known Issues / Installation / Feedback) covering Game 12 — written as DRAFT (FINAL in Phase 7)
- [ ] Task 3.2: Update `docs/device-testing-checklist.md` — add v1.8.0 record at top (newest-first): targeted Game 12 rows (6 phonics rounds, 4-letter choices with confusion guards, speaker replay 96px guard, TTS speakLetter/speakWord, sticker award, 3s win auto-return, 12-tile hub) + carried rows; result pending (Phase 6)
- [ ] Task 3.3: Verify knowledge docs synced by the Game 12 track (`conductor/tech-stack.md`, `conductor/product.md`, `docs/TDD.md`, `docs/PRD.md`) — patch only real gaps
- [ ] Task 3.4: Commit: `docs(release): Prepare v1.8.0 release notes and device checklist`
- [ ] Task 3.5: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Release Branch Gates + Tag + PR

- [ ] Task 4.1: Re-run all four gates on `release/v1.8.0` (check → test → build → validate-pwa); note expected build hash change vs Phase 1 (bundle embeds `__APP_VERSION__` 1.8.0)
- [ ] Task 4.2: Create annotated tag `git tag -a v1.8.0 -m "Release v1.8.0 — Game 12 First Sounds (phonics)"`; push to origin
- [ ] Task 4.3: Push branch; open PR `release/v1.8.0` → `master` (body = release notes summary)
  - [ ] Confirm CI "Quality Gates" passes on the PR (merge-blocking); Deploy to Coolify correctly skipped (master-only)
- [ ] Task 4.4: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5 — Merge, Deploy & Verify

- [ ] Task 5.1: Merge PR to master; push master → triggers Coolify auto-deploy webhook (Bearer `$COOLIFY_TOKEN`)
- [ ] Task 5.2: Verify deployment
  - [ ] CI run on master green (Quality Gates + Deploy to Coolify)
  - [ ] Live `https://aby-little-lab.ansyar-world.top/` serves `index-*.js` hash matching local `dist/`
  - [ ] `/sw.js` + `/manifest.webmanifest` return 200
  - [ ] Settings footer shows v1.8.0
- [ ] Task 5.3: Live smoke test: boot → hub (12 tiles, row 3 has 2 left-aligned) → First Sounds (6 rounds, 4 letter cards, correct → pulse + speakLetter + speakWord, incorrect → bounce no penalty, win → sticker_first_sounds → 3s auto-return) → sticker badge; settings (profiles, play-time limits) intact
- [ ] Task 5.4: Record deployment verification in `docs/release-checklist.md` (v1.8.0 row: CI run ID, hash match, version footer, SW/manifest)
- [ ] Task 5.5: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 6 — Targeted Device Testing

- [ ] Task 6.1: Execute the v1.8.0 checklist record (iPad / Android tablet / iPhone / Android phone — targeted Game 12 rows + carried rows) against the live URL; record pass/issue per item
- [ ] Task 6.2: Triage findings — document accepted issues in Known Issues; escalate blockers to user (max 2 fix attempts per workflow if a hotfix is approved)
- [ ] Task 6.3: Commit results: `docs(device): Record v1.8.0 device testing results`
- [ ] Task 6.4: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 7 — Finalize & Archive

- [ ] Task 7.1: Final gates on master if any post-merge changes occurred
- [ ] Task 7.2: Finalize release notes status to FINAL; mark all plan tasks complete; update `docs/release-checklist.md` Final Sign-Off block (version, test count, release manager)
- [ ] Task 7.3: Archive track folder to `conductor/archive/release-1.8.0_20260808/` (via git mv)
  - [ ] Registry: mark entry `[x]` with archive link + (Archived) — dominant convention
- [ ] Task 7.4: Commit: `chore(conductor): Archive track 'v1.8.0 Release Execution'`
- [ ] Task 7.5: Phase Verification & Checkpoint (Refer to workflow.md)
