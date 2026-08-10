# Plan — Fix Learning Progress Overlay Row Collision

Track: `progress-overlay-fix_20260810` · Type: Bug · Target release: v1.14.1

Follows `conductor/workflow.md` (TDD first, commit + git note per task, phase
checkpoints with verification protocol).

## Phase 1 — Regression-First Layout Fix (TDD)

- [x] **Task 1.1: Write failing regression tests (Red)**
  - [x] Update `src/__tests__/components/SettingsPanel.test.ts`: first page shows the first **6** game rows (Shape Sorter … Big & Small; Pattern Builder NOT on page 1).
  - [x] Update the pagination test: page 2 = rows 7–12 (Pattern Builder … First Sounds); page 3 = rows 13–17 (More or Less … Take Away, incl. Color Match and Add It Up); wrap-around to page 1 still works.
  - [x] Add a regression test asserting consecutive rows are spaced ≥ 56px apart (based on rendered text `y` positions) — must FAIL at the current pitch of 40.
  - [x] Run `CI=true pnpm test` and confirm the expected failures (Red phase).
  - Evidence (2026-08-10): SettingsPanel suite 61 tests — exactly 3 failed as designed ("opens the Learning Progress overlay", "pages through all 17 game rows", new "spaces consecutive progress rows at least 56px apart"), 58 passed.
- [x] **Task 1.2: Implement the fix (Green)**
  - [x] `src/components/SettingsPanel.ts`: `PROGRESS_ROW_PITCH` 40 → 56; `PROGRESS_PAGE_SIZE` 8 → 6. Constants only; no other code touched.
  - [x] Run `CI=true pnpm test` — all tests pass.
  - Evidence (2026-08-10): SettingsPanel suite 61/61 green; full suite 1310/1310 green (58 files).
- [x] **Task 1.3: Coverage & style checks**
  - [x] `pnpm run check` (Biome lint + format).
  - [x] Coverage report meets configured thresholds.
  - Evidence (2026-08-10): `biome check` — 125 files, no issues. Coverage: Lines 98.05, Stmts 96.72, Funcs 91.86, Branch 88.14 (thresholds 95/90/88/85 — all met). Observation: two sampling-based game-logic tests (take-away/add-it-up "structurally valid rounds") failed once in one full-suite run and passed on immediate re-run — pre-existing flakiness, unrelated to this change.
- [x] **Task 1.4: Commit the fix + git note**
  - [x] Commit as `fix(settings): Increase progress overlay row pitch and reduce page size`.
  - [x] Attach the required Git note and record the SHA in `plan.md`.
  - Evidence (2026-08-10): commits `2944301` (test updates — Red→Green evidence) and `ddcbf4b` (source constants 56/6); git note attached to `ddcbf4b` (task summary, files, why, flakiness observation).
- [x] **Task 1.5: Phase Verification & Checkpoint (Refer to workflow.md)**
  - [x] Diff scope vs previous checkpoint, confirm every changed code file has tests, run the full suite, present a manual verification plan, create the phase checkpoint commit + git note, record the SHA.
  - Evidence (2026-08-10): diff scope `bcff7fe..HEAD` (SettingsPanel.ts, SettingsPanel.test.ts, tracks.md, plan.md) — every code file has tests; full suite 1310/1310; manual verification plan presented to user and confirmed. Checkpoint: `[ecdd0d8]`.

## Phase 2 — Render Verification

- [x] **Task 2.1: Headless render of all three pages**
  - [x] `pnpm exec vite preview --port 4173` + headless Chromium (playwright-cli): open Settings → Progress, capture pages 1/3, 2/3, 3/3.
  - Evidence (2026-08-10): built dist (35 PWA entries), preview on :4173, headless Chromium 1024x768. Navigated Hub → Settings (3s parent hold) → Progress; captured `progress-p1.png` (6 rows), `progress-p2.png` (6 rows), `progress-p3.png` (5 rows). Screenshots excluded from tree per repo practice.
- [x] **Task 2.2: Inspect screenshots for collisions**
  - [x] Check row ↔ row, first row ↔ profile chips, last row ↔ "1 / 3 · More" footer, stats ↔ accuracy bars.
  - [x] If evidence shows residual collisions: adjust constants (max 2 iterations) and re-run Phase 1 tests.
  - Evidence (2026-08-10): visual analysis of all 3 pages — row sets exact (6+6+5, 17/17 games), NO collisions in any of the 4 categories (row↔row, first row↔profile chip, last row↔footer, stats↔accuracy bars). No constant adjustment needed (0 iterations). Observations: rasterized row-name baseline spacing ≈52px (visual tolerance; deterministic test enforces ≥56px on text Y positions — passes); unplayed stats render "0 plays · – – –" (pre-existing unplayed-state format, unrelated to this track).
- [x] **Task 2.3: Commit render evidence + git note** (playwright artifacts excluded from the tree per repo practice; evidence recorded in `plan.md`).
- [x] **Task 2.4: Phase Verification & Checkpoint (Refer to workflow.md)**
  - Evidence (2026-08-10): full suite 1310/1310 still green after Phase 2 (no code changes in this phase); render evidence accepted by user. Checkpoint: `[fc758b0]`.

## Phase 3 — Release v1.14.1

- [x] **Task 3.1: Version bump**
  - [x] `package.json` 1.14.0 → 1.14.1 (`__APP_VERSION__` derives automatically in `vite.config.ts`; Settings footer shows `v1.14.1`).
  - Evidence (2026-08-10): `package.json` `1.14.0` → `1.14.1`; live Settings footer verified `v1.14.1`.
- [x] **Task 3.2: Release notes**
  - [x] Create `docs/release-notes-v1.14.1.md` as DRAFT: Bug Fixes (overlay row collision; pages 8+8+1 → 6+6+5), Known Issues (unchanged accepted items), Installation.
  - Evidence (2026-08-10): `docs/release-notes-v1.14.1.md` DRAFT created (Bug Fixes / Known Issues / Installation / Feedback).
- [x] **Task 3.3: Quality gates**
  - [x] `pnpm run check` · `CI=true pnpm test` · `pnpm run build` · `node scripts/validate-pwa.js` · `node scripts/validate-bundle.js`.
  - Evidence (2026-08-10): biome clean (125 files); `CI=true pnpm test` 1310/1310 (58 files); build OK (35 PWA entries); validate-pwa 13/13; validate-bundle PASS (shell 147.8 kB ≤ 200 kB).
- [x] **Task 3.4: Commit release prep + git note**
  - [x] Commit as `chore(release): Prepare v1.14.1`.
  - Evidence (2026-08-10): commit `8506554` `chore(release): Prepare v1.14.1` + git note (bump, notes DRAFT, gates).
- [x] **Task 3.5: Deploy & verify live**
  - [x] Tag `v1.14.1` on master → CI/CD tag-gated Coolify deployment.
  - [x] Smoke the live URL: boot → Settings → Progress pages 1–3 with no collisions; footer `v1.14.1`; offline relaunch OK.
  - Evidence (2026-08-10): tag `v1.14.1` pushed → CI success → Coolify webhook triggered. Live smoke (headless Chromium 1024x768, https://aby-little-lab.ansyar-world.top/): Settings panel shows `v1.14.1`; Progress pages 6+6+5, all 17 games, zero collisions (rows / chips / footer / bars); footers 1/3 → 2/3 → 3/3; SW activated + controlling; offline reload boots a clean hub from precache. One-time "Ready to play offline!" modal on first SW-claim boot is expected PWA behavior.
- [x] **Task 3.6: Device testing & triage**
  - [x] User verifies on ≥ 1 phone + ≥ 1 tablet (parent Progress view); record results in `docs/device-testing-checklist.md`.
  - [x] Triage findings: no Critical/High → release not blocked; record accepted non-blocking items.
  - Evidence (2026-08-10): device-class execution **deferred by user decision** (non-blocking — desktop live smoke green, no Critical/High). Recorded as pending in `docs/device-testing-checklist.md` (Execution Record — v1.14.1).
- [x] **Task 3.7: Phase Verification & Checkpoint (Refer to workflow.md)**
  - Evidence (2026-08-10): release executed + live smoke green; device testing deferred by user (non-blocking). Checkpoint: `[3941584]`.

## Phase 4 — Finalize & Archive

- [x] **Task 4.1: Finalize release records**
  - [x] `docs/release-notes-v1.14.1.md` → FINAL; `docs/release-checklist.md` sign-off recorded.
  - Evidence (2026-08-10): release notes → FINAL (released 2026-08-10, tag v1.14.1); release-checklist.md Final Sign-Off — v1.14.1 appended (verify-deployment rows + approval).
- [x] **Task 4.2: Complete Conductor state**
  - [x] Mark all plan tasks complete; metadata status `completed` + `archivedAt`; move track to `conductor/archive/`; update the Tracks Registry to the archived relative path.
  - Evidence (2026-08-10): metadata.json `status: completed`, `archivedAt: 2026-08-10T20:41:06.044Z`; track moved to `conductor/archive/progress-overlay-fix_20260810/`; Tracks Registry updated to `./archive/progress-overlay-fix_20260810/index.md` (Archived).
- [x] **Task 4.3: Commit archival + git note**
  - [x] Commit as `chore(conductor): Archive track 'progress-overlay-fix'`; attach the required Git note and record the SHA.
  - Evidence (2026-08-10): commit `a228bf9` + git note (archival summary).
- [ ] **Task 4.4: Phase Verification & Checkpoint (Refer to workflow.md)** — final checkpoint.
