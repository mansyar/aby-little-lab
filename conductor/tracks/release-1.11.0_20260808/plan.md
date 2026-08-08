# Implementation Plan — v1.11.0 Release Execution

**Track ID:** `release-1.11.0_20260808` · **Type:** Chore
**Methodology:** release process per `docs/release-checklist.md`; phases per `conductor/workflow.md` (checkpoint protocol at each phase end). TDD not applicable — verification via existing gates and checklist execution.

## Phase 1 — Baseline Validation [checkpoint: b4a7f8a]

- [x] Task 1.1: Confirm master state — HEAD = `0bfa8e8` (Game 14 archive commit); working tree clean; origin/master in sync (`git status --short --branch`)
  - [x] Confirmed: HEAD 3fc78d0 (in-progress marker, stacked on 6502eda track init + 0bfa8e8 Game 14); tree clean; origin/master ahead 2 (conductor-only commits)
- [x] Task 1.2: Run full quality gates on master (CI order)
  - [x] `pnpm run check` — Biome clean (106 files, 385ms)
  - [x] `CI=true pnpm test` — 1145/1145 passing (48 files, 66.06s)
  - [x] `pnpm run build` — OK (index-H4IegXRl.js, 1509.08 KiB / gzip 382.77, OddOneOutScene-C1DqT6-T.js lazy chunk, 31 precache entries)
  - [x] `node scripts/validate-pwa.js` — 13/13 passed
- [x] Task 1.3: Verify CI "Quality Gates" run on the earlier master push (76887e8..0bfa8e8) is green (check run status); Deploy correctly skipped (no tag)
  - [x] Run 31242855792 on master: completed success; Deploy not fired (tag-gated)
- [x] Task 1.4: Phase Verification & Checkpoint (Refer to workflow.md) *(b4a7f8a)*

## Phase 2 — Release Branch & Version Bump [checkpoint: 5e43459]

- [x] Task 2.1: Create release branch `git checkout -b release/v1.11.0` from master — created from master @ a509931
- [x] Task 2.2: Bump version `npm version 1.11.0 --no-git-tag-version`
  - [x] Verify `package.json` version = 1.11.0 (no lockfile churn) — confirmed, package.json only
  - [x] Verify `__APP_VERSION__` footer source picks it up (vite.config.ts reads pkg.version) — vite.config.ts `__APP_VERSION__: JSON.stringify(pkg.version)`
- [x] Task 2.3: Commit: `chore(release): Bump version to 1.11.0` (3a9f26e)
- [x] Task 2.4: Phase Verification & Checkpoint (Refer to workflow.md) *(5e43459)*

## Phase 3 — Release Documentation [checkpoint: c90e782]

- [x] Task 3.1: Draft `docs/release-notes-v1.11.0.md` (template: What's New / Improvements / Bug Fixes / Known Issues / Installation / Feedback) covering Game 14 — written as DRAFT (FINAL in Phase 7)
- [x] Task 3.2: Finalize dangling v1.10.0 docs: `docs/release-notes-v1.10.0.md` DRAFT → FINAL (note: verification folded into v1.11.0, since v1.10.0 is superseded live); mark v1.10.0 pending items in `docs/release-checklist.md` as folded/superseded (footer check, live smoke, device testing)
- [x] Task 3.3: Update `docs/device-testing-checklist.md` — add v1.11.0 record at top (newest-first): targeted Game 14 rows (hub 14 tiles 5×3 row 3 = 4 left-aligned; 2×2 grid 3 identical + 1 distinct; spoken prompt + speaker replay; 6 rounds easy-first bands cross-category / same-category / frog colors; correct tap flash/chime/dot pop 700ms; wrong tap wiggle no penalty; sticker first-only; replay no re-award; SFX-off; reduced-motion) + carried v1.10.0/Game 13 rows; result pending (Phase 6)
- [x] Task 3.4: Verify knowledge docs already synced by the Game 14 track (`conductor/tech-stack.md`, `conductor/product.md`, `docs/TDD.md`, `docs/PRD.md`, `README.md`) — all present; no gaps to patch
- [x] Task 3.5: Commit: `docs(release): Prepare v1.11.0 release notes and device checklist` (b73ce9d)
- [x] Task 3.6: Phase Verification & Checkpoint (Refer to workflow.md) *(c90e782)*

## Phase 4 — Release Branch Gates + Tag + PR

- [ ] Task 4.1: Re-run all four gates on `release/v1.11.0` (check → test → build → validate-pwa)
- [ ] Task 4.2: Create annotated tag `git tag -a v1.11.0 -m "Release v1.11.0 — Game 14 Odd One Out (visual discrimination)"`; push to origin
- [ ] Task 4.3: Push branch; open PR `release/v1.11.0` → `master` (body = release notes summary)
  - [ ] Confirm CI "Quality Gates" passes on the PR (merge-blocking); Deploy to Coolify correctly skipped
- [ ] Task 4.4: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5 — Merge, Deploy & Verify [checkpoint: dd97b49]

- [x] Task 5.1: Merge PR to master; push master → triggers Coolify auto-deploy webhook (Bearer `$COOLIFY_TOKEN`) — PR #24 merged `f6b386d` (CI run 31243588460 Quality Gates PASS, Deploy skipped on PR); annotated tag `v1.11.0` created on master merge commit + pushed → CI run 31243738792 Quality Gates + Deploy to Coolify PASS, webhook fired
- [x] Task 5.2: Verify deployment
  - [x] CI run on master green (Quality Gates + Deploy to Coolify) — run 31243738792
  - [x] Live `https://aby-little-lab.ansyar-world.top/` serves `index-*.js` hash matching local `dist/` — `index-BjUJ-Rpw.js` matched local v1.11.0 build
  - [x] `/sw.js` + `/manifest.webmanifest` return 200
  - [x] Settings footer shows v1.11.0 — bundle-level verified (`1.11.0` embedded, no stale `1.10.0`/`1.8.0`); visual Settings-panel check folded into Phase 6 device testing
- [x] Task 5.3: Live smoke test: boot → hub (14 tiles 5×3, row 3 = 4 left-aligned; no clipping) → Odd One Out (6 rounds easy-first bands, spoken prompt + speaker replay, 3 identical + 1 distinct, correct flash/chime/dot pop 700ms, wrong wiggle no penalty, win → sticker_odd_one_out → 3s auto-return, replay no re-award) → Game 13 More or Less spot check → settings (profiles, play-time limits, footer) intact; zero console errors — executed 2026-08-08; all passed incl. sticker earned live; **arrow defect found & hotfixed** (see below)
- [x] Task 5.4: Record deployment verification in `docs/release-checklist.md` (v1.11.0 row: CI run ID, hash match, version footer, SW/manifest) — Step 7k v1.11.0 section added (incl. hotfix record); also recorded in `docs/release-notes-v1.11.0.md` (Bug Fixes) and `docs/device-testing-checklist.md` (hotfix note)
- [x] **Hotfix — More or Less arrow (2026-08-08):** arrow rendered as small square — textures registered as `arrow_up`/`arrow_down` while `MoreLessScene` looks up `arrow_more`/`arrow_less`. Fixed in `828f9e0` (keys registered under scene lookups + regression test; 49 files/1150 tests, Biome clean). Tag `v1.11.0` amended (delete + recreate on `828f9e0`); CI run 31247079734 Quality Gates + Deploy PASS; live serves `index-d3aQJys-.js` matching local fix build; arrow verified rendering live
- [x] Task 5.5: Phase Verification & Checkpoint (Refer to workflow.md) — *(dd97b49)*

## Phase 6 — Targeted Device Testing

- [ ] Task 6.1: Execute the v1.11.0 checklist record (iPad / Android tablet / iPhone / Android phone — targeted Game 14 rows + carried rows) against the live URL; record pass/issue per item
- [ ] Task 6.2: Triage findings — document accepted issues in Known Issues; escalate blockers to user (max 2 fix attempts per workflow if a hotfix is approved)
- [ ] Task 6.3: Commit results: `docs(device): Record v1.11.0 device testing results`
- [ ] Task 6.4: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 7 — Finalize & Archive

- [ ] Task 7.1: Final gates on master if any post-merge changes occurred
- [ ] Task 7.2: Finalize release notes status to FINAL; mark all plan tasks complete; update `docs/release-checklist.md` Final Sign-Off block (version v1.11.0, 1145 tests, release manager)
- [ ] Task 7.3: Archive track folder to `conductor/archive/release-1.11.0_20260808/` (via git mv)
- [ ] Task 7.4: Commit: `chore(conductor): Archive track 'v1.11.0 Release Execution'`
- [ ] Task 7.5: Phase Verification & Checkpoint (Refer to workflow.md)
