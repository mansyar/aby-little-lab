# Implementation Plan — v1.13.0 Release Execution

**Track ID:** `release-1.13.0_20260809` · **Type:** Chore
**Methodology:** release process per `docs/release-checklist.md`; phases per `conductor/workflow.md` (checkpoint protocol at each phase end). TDD not applicable — verification via existing gates and checklist execution.

## Phase 1 — Baseline Validation

- [x] Task 1.1: Confirm master state — HEAD = add-it-up archive commit; working tree clean; push state recorded (`git status --short --branch`, `git log --oneline origin/master..HEAD`)
  - [x] HEAD = 2b2c9ec (in-progress marker); tree clean; local master **97 commits ahead of origin/master** (entire unreleased delta unpushed: color-match, add-it-up, perf-bundle-hardening, parent-progress-insights + conductor commits)
- [x] Task 1.2: Run full quality gates on master (CI order): `pnpm run check` → `CI=true pnpm test` → `pnpm run build` → `node scripts/validate-pwa.js` → `node scripts/validate-bundle.js`
  - [x] Biome clean (121 files, 411ms); 1284/1284 tests (56 files, 83.66s); build OK (shell index-Ctz6486l.js 148.04 kB / gzip 27.72; phaser vendor chunk 1,375.72 kB); validate-pwa 13/13; validate-bundle PASS (vendor chunk present, shell 144.6 kB ≤ 200 kB)
- [x] Task 1.3: Confirm no stale version references (`1.12.0` not lingering in src beyond pkg.version; `__APP_VERSION__` reads pkg.version; SettingsPanel footer `v${__APP_VERSION__}`)
  - [x] No `1.12.0`/`1.13.0` literals in src; vite.config.ts line 10 `__APP_VERSION__: JSON.stringify(pkg.version)`; SettingsPanel.ts line 211 footer `v${__APP_VERSION__}`
- [x] Task 1.4: Phase Verification & Checkpoint (Refer to workflow.md) — [checkpoint: 9d92d69]

## Phase 2 — Release Branch & Version Bump

- [x] Task 2.1: Create release branch `git checkout -b release/v1.13.0` from master
  - [x] Branch `release/v1.13.0` created from master @ 158016b; clean
- [x] Task 2.2: Bump version `npm version 1.13.0 --no-git-tag-version`
  - [x] `package.json` version = 1.13.0 (verified via `node -p`); only package.json changed — zero lockfile churn
  - [x] `__APP_VERSION__` footer source picks it up (vite.config.ts reads pkg.version)
- [x] Task 2.3: Commit: `chore(release): Bump version to 1.13.0` (579cd21)
- [x] Task 2.4: Phase Verification & Checkpoint (Refer to workflow.md) — [checkpoint: 950f92c]

## Phase 3 — Release Documentation

- [x] Task 3.1: Draft `docs/release-notes-v1.13.0.md` (template: What's New / Improvements / Bug Fixes / Known Issues / Installation / Feedback) covering Game 15 (Color Match), Game 16 (Add It Up), and Performance & Bundle Hardening — written as DRAFT (FINAL in Phase 7); carried known issues (cross-device sync, system-font letterforms); must not cover Parent Progress Insights
  - [x] DRAFT written per the v1.12.0 template; covers both new games + bundle split; carried known issues; no Parent Progress Insights content
- [x] Task 3.2: Update `docs/device-testing-checklist.md` — extend the existing v1.13.0 record with Game 15 (Color Match) rows + Game 16 (Add It Up) rows alongside the perf rows; result marked pending user execution (Phase 6)
  - [x] Record retargeted to live URL; scope includes both games; full Color Match + Add It Up rows drafted (grid 5×3+1, swatch prompt, 6 rounds easy-first, feedback chains, stickers, no-speech Add It Up, carried v1.12.0 rows); result = reference-profile done, device-class pending user-led
- [x] Task 3.3: Verify knowledge docs already synced by the three tracks (`conductor/tech-stack.md`, `conductor/product.md`, `docs/TDD.md`, `docs/PRD.md`, `README.md`) — patch real gaps only
  - [x] Audit found 2 stale refs, patched: product.md "14 distinct mini-games" → 16; TDD.md "fifteen game Back buttons" → sixteen. tech-stack/PRD/README already synced by the game tracks
- [x] Task 3.4: Commit: `docs(release): Prepare v1.13.0 release notes and device checklist` (510bf34)
- [x] Task 3.5: Phase Verification & Checkpoint (Refer to workflow.md) — [checkpoint: 9a33824]

## Phase 4 — Release Branch Gates + Tag + PR

- [x] Task 4.1: Re-run all five gates on `release/v1.13.0` (check → test → build → validate-pwa → validate-bundle)
  - [x] Biome clean (121 files); 1284/1284 tests (56 files, 82.18s); build OK — shell `index-C8KSx-ay.js` 148.04 kB / gzip 27.72, phaser vendor `phaser-CYX5YQB3.js` 1,375.72 kB, 16 lazy game chunks (ColorMatchScene-B6LalKu6.js, AddItUpScene-DR7U0WBN.js), precache 34 entries; validate-pwa 13/13; validate-bundle PASS (vendor present, shell 144.6 kB ≤ 200 kB)
- [x] Task 4.2: Create annotated tag `git tag -a v1.13.0 -m "Release v1.13.0 — Games 15 & 16 (Color Match, Add It Up) + Performance & Bundle Hardening"`; push tag to origin
  - [x] Tag created locally (annotated, message as planned). **Push deferred to Phase 5 after the PR merge** — the CI tag-guard only deploys tags pointing at a commit on `master` (master-lineage guard; same pattern as v1.11.0/v1.12.0 tag amendment). Pushing it on the release branch would fail the guard by design
- [x] Task 4.3: Push branch; open PR `release/v1.13.0` → `master` (body = release notes summary); confirm Quality Gates PASS on PR, Deploy skipped (tag-guard by design)
  - [x] Branch pushed (`origin/release/v1.13.0`); **PR #26** opened (https://github.com/mansyar/aby-little-lab/pull/26); Quality Gates **PASS** (2m16s, run 31316546105); Deploy to Coolify **skipping** (correct — tag-guard)
- [x] Task 4.4: Phase Verification & Checkpoint (Refer to workflow.md) — [checkpoint: 48e5f2b]

## Phase 5 — Merge, Deploy & Verify

> **Amendment (post-merge, user-approved 2026-08-09):** Parent Progress Insights (archived track `parent-progress-insights_20260809`) is **folded into the v1.13.0 announcement** — the code was already on master when `release/v1.13.0` was cut, so the bundle includes it. Release notes v1.13.0 updated with a Progress section; device-testing-checklist v1.13.0 record gained the progress rows; the v1.14.0 draft notes + checklist record are marked SUPERSEDED. Committed directly to master (docs-only change; CI gates run on the master push, no deploy without a tag).

- [x] Task 5.1: Merge PR #26 (`e530a1b` on origin/master); confirm all three tracks' commits on origin/master; tag-gated deploy triggers after tag push
- [x] Task 5.2: Verify deployment (master CI + tag CI Quality Gates PASS, Deploy to Coolify PASS; live `index-*.js` SHA256 matches local dist/; `/sw.js` + `/manifest.webmanifest` 200; Settings footer `v1.13.0`; no stale `1.12.0` strings)
  - [x] Tag runs 31317159116 (1981b35) + 31320046231/31320051000 (0e14060 amended) Quality Gates + Deploy PASS; live serves `index-_bk4Yf06.js`, SHA256 `C26410A6…` matches local dist; sw.js/manifest 200; footer v1.13.0 present; no stale 1.12.0
- [~] Task 5.3: Live smoke — boot → Hub (16 tiles 5×3+1) → Color Match spot check (swatch + spoken color, 2×2 grid, 6 rounds) → Add It Up spot check (equation row + "+" cue + 4 answer cards, no speech) → Progress overlay spot check (Settings → Progress → 16 rows paged 8+8) → Settings footer v1.13.0 → Hub; zero console errors
  - [x] Playwright headless live smoke executed (2026-08-09): zero console/page errors; Color Match scene PASS (swatch + speaker + 2×2 grid); Add It Up scene PASS (equation row + "+"/"=" cues + 4 answer cards 1/2/4/3); Settings panel PASS (footer v1.13.0, Progress row present, Voice row)
  - [x] **DEFECT FOUND:** 16th Hub tile (Add It Up) clipped at canvas bottom — `GRID_ROWS = 3` leftover from the 15-tile era; row 3 (index 15) center y = 764, bottom 839 > 768 (~71px overflow). Hotfix approved by user (2026-08-09)
  - [x] **Hotfix `f049fdf`:** HubScene grid metrics → `TILE_HEIGHT` 150→116, `TILE_SPACING` 40→22, `GRID_ROWS` 3→4 (4×116+3×22 = 530 → startY stays 119, clearing avatar chip/Settings band at 116; row 4 center 591, bottom 649). Regression test added (hubScene.test.ts — all 16 tile rects fully inside 1024×768). Gates: Biome clean, 1285/1285 tests (56 files), build shell index-_bk4Yf06.js 144.6 kB, validate-pwa 13/13, validate-bundle PASS
  - [x] Post-hotfix re-verification live: `index-_bk4Yf06.js` served (SHA match), footer v1.13.0, zero console errors, Hub re-screenshot confirmed 16/16 tiles fully on-canvas (image-reader: PASS — 5+5+5+1, Add It Up tile + label intact; only a cosmetic dashed entrance decoration under the tile is shaved at the canvas edge, non-blocking)
- [x] Task 5.4: Record deployment verification in `docs/release-checklist.md` (Step 7m + Final Sign-Off v1.13.0 block; device testing marked pending user execution)
  - [x] Step 7m added (PR #26 merge e530a1b, tag runs, hotfix record, hash match `C26410A6…`, footer, smoke summary, device testing pending); Final Sign-Off v1.13.0 block added (1285/1285, 56 files, shell/vendor sizes, hotfix amendment)
- [x] Task 5.5: Phase Verification & Checkpoint (Refer to workflow.md) — [checkpoint: db00c67]

## Phase 6 — Targeted Device Testing (user-led, async)

- [x] Task 6.1: Prepare the v1.13.0 checklist record for execution (Game 15 rows + Game 16 rows + perf rows + carried rows) — conductor-prepared in Phase 3; **user executes** on iPad / Android tablet / iPhone / Android phone against the live URL at their convenience
  - [x] Record fully drafted in `docs/device-testing-checklist.md` (v1.13.0 Execution Record: Target live URL, Scope = Game 15 + Game 16 + Perf/Bundle Hardening + Parent Progress Insights; Checks = perf rows (boot <3s, shell ≤200 kB + vendor chunk, game launch/return, PWA update flow, offline re-play, precache 34 entries) + full Color Match rows (16-tile grid, spoken prompt, 4/6-color pools, feedback chains, sticker) + full Add It Up rows (equation row, no speech, bands, distinct totals, sticker) + Parent Progress rows (Progress row, 16 rows paged 8+8, mastery star, 7-day strip, avatar chip) + carried v1.12.0 TTS Voice rows; Result: reference-profile executed 2026-08-09 desktop, device-class execution pending user-led)
- [x] Task 6.2: Record results when the user reports them; triage findings — document accepted issues in Known Issues; escalate blockers to user (max 2 fix attempts per workflow if a hotfix is approved)
  - [x] User reported (2026-08-09): all device checks passed, no issues found. Triage: none to record
- [x] Task 6.3: Commit results: `docs(device): Record v1.13.0 device testing results` (when the user reports)
  - [x] Commit `1747639` — device-testing-checklist v1.13.0 Result updated (user-executed, all passed); release notes v1.13.0 FINAL; release-checklist Step 7m + Final Sign-Off device rows completed
- [x] Task 6.4: Phase Verification & Checkpoint (Refer to workflow.md) — [checkpoint: b207ee6]

## Phase 7 — Finalize & Archive

- [x] Task 7.1: Final gates on master if any post-merge changes occurred
  - [x] No source changes since hotfix `f049fdf` (only docs); gates already green at 1285/1285, Biome clean, build/validate PASS — no re-run needed
- [x] Task 7.2: Finalize release notes status to FINAL; mark all plan tasks complete; update `docs/release-checklist.md` Final Sign-Off block (version v1.13.0, tests, release manager)
  - [x] Release notes FINAL (1747639); Final Sign-Off v1.13.0 block complete incl. device testing passed
- [x] Task 7.3: Archive track folder to `conductor/archive/release-1.13.0_20260809/` (via git mv)
  - [x] git mv completed; commit `50fd365` (5 files renamed; stray `.playwright-cli/` test logs removed)
- [x] Task 7.4: Commit: `chore(conductor): Archive track 'v1.13.0 Release Execution'`; registry updated to (Archived)
  - [x] Registry `[x] (Archived)` at `./archive/release-1.13.0_20260809/index.md`; metadata.json status 'archived'
- [x] Task 7.5: Phase Verification & Checkpoint (Refer to workflow.md) — [checkpoint: 100e573]

## Phase: Review Fixes

- [x] Task: Apply review suggestions 952ceec
  - [x] conductor-review (2026-08-09): no Critical/High issues; plan compliance full, suite green (hubScene 4/4 re-run, 1285/1285 full), security scan clean
  - [x] Fixed Low: SUPERSEDED v1.14.0 record Result parenthetical → 'executed by user 2026-08-09 — all items passed, no issues found' (docs/device-testing-checklist.md line 23)
  - [x] Deferred (pre-existing, out of scope): v1.10.0 record lines 47-48 still 'pending' — covered by v1.11.0 execution; untouched per surgical-changes rule
