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

## Phase 3 — Release Documentation [checkpoint: 758796b]

- [x] Task 3.1: Draft `docs/release-notes-v1.8.0.md` (template: What's New / Improvements / Bug Fixes / Known Issues / Installation / Feedback) covering Game 12 — written as DRAFT (FINAL in Phase 7)
- [x] Task 3.2: Update `docs/device-testing-checklist.md` — add v1.8.0 record at top (newest-first): targeted Game 12 rows (6 rounds, 4 letter cards with confusion guards, speaker replay 96px guard, TTS speakLetter/speakWord, sticker award, 3s win auto-return, 12-tile hub, SFX-off, reduced-motion) + carried v1.7.0 rows; result pending (Phase 6)
- [x] Task 3.3: Verify knowledge docs synced by the Game 12 track (`conductor/tech-stack.md`, `conductor/product.md`, `docs/TDD.md`, `docs/PRD.md`) — all present (PRD ×2, TDD ×5, product/tech-stack/README referenced); no gaps to patch
- [x] Task 3.4: Commit: `docs(release): Prepare v1.8.0 release notes and device checklist` (5cab3b7)
- [ ] Task 3.5: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Release Branch Gates + Tag + PR [checkpoint: f2492df]

- [x] Task 4.1: Re-run all four gates on `release/v1.8.0` (check → test → build → validate-pwa)
  - [x] `pnpm run check` — Biome clean (96 files, 370ms)
  - [x] `CI=true pnpm test` — 1065/1065 passing (43 files, 56.28s)
  - [x] `pnpm run build` — OK (main chunk index-Ch7rE_Md.js, 1503.58 KiB / gzip 382.06, FirstSoundsScene-6CL-AZi6.js lazy chunk, 28 precache entries / 1533.95 KiB) — hash changed from index-DZXUyNHv.js (v1.7.0-era) as expected: bundle embeds __APP_VERSION__ 1.8.0
  - [x] `node scripts/validate-pwa.js` — 13/13 passed
- [x] Task 4.2: Create annotated tag `git tag -a v1.8.0 -m "Release v1.8.0 — Game 12 First Sounds (phonics)"`; push to origin — pushed
- [x] Task 4.3: Push branch; open PR `release/v1.8.0` → `master` (body = release notes summary)
  - [x] Confirm CI "Quality Gates" passes on the PR (merge-blocking) — PASS 1m31s (run 31193021189); Deploy to Coolify correctly skipped (master-only); PR #17 https://github.com/mansyar/aby-little-lab/pull/17
- [ ] Task 4.4: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5 — Merge, Deploy & Verify [checkpoint: 93df247]

- [x] Task 5.1: Merge PR to master; push master → triggers Coolify auto-deploy webhook (Bearer `$COOLIFY_TOKEN`)
  - [x] Merged via `gh pr merge 17 --merge` — master 873594e..719dae1 (merge commit 'Merge pull request #17 from mansyar/release/v1.8.0')
  - [x] Master CI run 31193529605: Quality Gates PASS 2m9s (job 92916042170); Deploy to Coolify PASS 7s (job 92916646422) — webhook triggered
- [x] Task 5.2: Verify deployment
  - [x] CI run on master green (Quality Gates + Deploy to Coolify)
  - [x] Live `https://aby-little-lab.ansyar-world.top/` serves `index-*.js` hash matching local `dist/` — live went to `assets/index-Ch7rE_Md.js` at 01:40:57 (polled; transiently served previous `index-DZXUyNHv.js` from the PR #16 merge deploy until Coolify rollout finished)
  - [x] `/sw.js` + `/manifest.webmanifest` return 200
  - [x] Settings footer shows v1.8.0 (verified via playwright hold-3s → Settings panel → `v1.8.0` under title)
- [x] Task 5.3: Live smoke test: boot → hub (12 tiles, row 3 has 2 left-aligned) → First Sounds (6 rounds, 4 letter cards, correct → pulse + speakLetter + speakWord, incorrect → bounce no penalty, win → sticker_first_sounds → 3s auto-return) → sticker badge; settings (profiles, play-time limits) intact
  - [x] Hub: 12 tiles 5×3, row 3 = How Many? + First Sounds left-aligned; no clipping (screenshot-verified)
  - [x] First Sounds round 1: 4 letter cards, 6 progress dots, word picture + speaker button; correct tap (O for OWL) → round advanced (OWL→TREE), dot 1/6 filled; wrong taps → gentle bounce, no progression loss (blind 4-card sweeps advance exactly 1 round each)
  - [x] Full 6-round completion → `first-sounds.earned=true` in localStorage (earnedAt 15:45:55Z) → 3s auto-return to hub → sticker badge rendered on tile (filled vs dashed elsewhere)
  - [x] Replay: fresh session (0/6 dots on re-entry), completion does NOT re-award (earnedAt unchanged)
  - [x] Settings: parental hold-3s opens panel (backdrop dim verified by pixel sampling); version footer `v1.8.0`; BGM/SFX rows present; zero console errors/warnings during the whole session
  - [x] Observation (non-blocking, tested/intended): distractor sets are guarded against the TARGET only (e.g., round B·P·O·H for OWL is legal) — B/P may co-occur as distractors; no product impact for 3–5yo
- [x] Task 5.4: Record deployment verification in `docs/release-checklist.md` (v1.8.0 row: CI run ID, hash match, version footer, SW/manifest)
- [x] Task 5.5: Phase Verification & Checkpoint (Refer to workflow.md)
  - [x] Checkpoint commit `93df247` (empty) + git notes verification report; phase heading marker; commit `e97a9d3`; branch synced to origin

## Phase 6 — Targeted Device Testing [checkpoint: 8299e64]

- [x] Task 6.1: Execute the v1.8.0 checklist record (iPad / Android tablet / iPhone / Android phone — targeted Game 12 rows + carried rows) against the live URL; record pass/issue per item
  - [x] Executed by user on all 4 device classes (iPad, Android tablet, iPhone, Android phone) against the live URL — 2026-08-08
  - [x] All v1.8.0 rows passed (Hub 12 tiles; First Sounds spoken prompt + iOS TTS unlock; 6 rounds; 4 cards; correct-tap feedback; wrong-tap no penalty; confusion guards; speaker replay during win; win celebration + sticker + auto-return; replay; parental Back; SFX-off; reduced-motion) + all carried v1.7.0 rows passed
- [x] Task 6.2: Triage findings — document accepted issues in Known Issues; escalate blockers to user (max 2 fix attempts per workflow if a hotfix is approved)
  - [x] No issues found — nothing to triage (no Critical/High/Medium/Low)
- [x] Task 6.3: Commit results: `docs(device): Record v1.8.0 device testing results`
- [x] Task 6.4: Phase Verification & Checkpoint (Refer to workflow.md)
  - [x] Checkpoint commit `8299e64` (empty) + git notes verification report; phase heading marker; commit `9ace4e7`

## Phase 7 — Finalize & Archive [checkpoint: dc22a5c]

- [x] Task 7.1: Final gates on master if any post-merge changes occurred
  - [x] All 4 gates on release/v1.8.0 (final state): Biome clean 96 files 894ms; CI=true pnpm test 1065/1065 (43 files); build `index-Ch7rE_Md.js` 1,503.58 KiB / gzip 382.06, 28 precache entries 1533.95 KiB — hash IDENTICAL to live deployment (deterministic build confirms deployed source = current tree); validate-pwa 13/13
- [x] Task 7.2: Finalize release notes status to FINAL; mark all plan tasks complete; update `docs/release-checklist.md` Final Sign-Off block (version, test count, release manager)
  - [x] release-notes-v1.8.0.md → FINAL (released 2026-08-08, live smoke + device testing passed, no issues)
  - [x] release-checklist.md Final Sign-Off — v1.8.0 block (Ansyar, 2026-08-08, 1065/1065 tests, all approvals checked)
- [x] Task 7.3: Archive track folder to `conductor/archive/release-1.8.0_20260808/` (via git mv)
  - [x] `git mv conductor/tracks/release-1.8.0_20260808 conductor/archive/release-1.8.0_20260808` — index.md, metadata.json, plan.md, spec.md moved
  - [x] Registry: entry `[x]` with archive link `./archive/release-1.8.0_20260808/index.md` + (Archived) — dominant convention
- [x] Task 7.4: Commit: `chore(conductor): Archive track 'v1.8.0 Release Execution'`
  - [x] Commits: `cc0507d` docs(release): Finalize v1.8.0 release notes (FINAL) and sign-off; `fbb515b` chore(conductor): Archive track 'v1.8.0 Release Execution' (tracks.md registry [x] + archive link, plan 7.3 markers)
- [ ] Task 7.5: Phase Verification & Checkpoint (Refer to workflow.md)
