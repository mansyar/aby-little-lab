# Plan — Fix Learning Progress Overlay Row Collision

Track: `progress-overlay-fix_20260810` · Type: Bug · Target release: v1.14.1

Follows `conductor/workflow.md` (TDD first, commit + git note per task, phase
checkpoints with verification protocol).

## Phase 1 — Regression-First Layout Fix (TDD)

- [ ] **Task 1.1: Write failing regression tests (Red)**
  - [ ] Update `src/__tests__/components/SettingsPanel.test.ts`: first page shows the first **6** game rows (Shape Sorter … Big vs Small; e.g. Pattern Builder NOT on page 1).
  - [ ] Update the pagination test: page 2 = rows 7–12 (Pattern Builder … First Sounds); page 3 = rows 13–17 (More or Less … Take Away, incl. Color Match and Add It Up); wrap-around to page 1 still works.
  - [ ] Add a regression test asserting consecutive rows are spaced ≥ 56px apart (based on rendered text `y` positions) — must FAIL at the current pitch of 40.
  - [ ] Run `CI=true pnpm test` and confirm the expected failures (Red phase).
- [ ] **Task 1.2: Implement the fix (Green)**
  - [ ] `src/components/SettingsPanel.ts`: `PROGRESS_ROW_PITCH` 40 → 56; `PROGRESS_PAGE_SIZE` 8 → 6. Constants only; no other code touched.
  - [ ] Run `CI=true pnpm test` — all tests pass.
- [ ] **Task 1.3: Coverage & style checks**
  - [ ] `pnpm run check` (Biome lint + format).
  - [ ] Coverage report meets configured thresholds.
- [ ] **Task 1.4: Commit the fix + git note**
  - [ ] Commit as `fix(settings): Increase progress overlay row pitch and reduce page size`.
  - [ ] Attach the required Git note and record the SHA in `plan.md`.
- [ ] **Task 1.5: Phase Verification & Checkpoint (Refer to workflow.md)**
  - [ ] Diff scope vs previous checkpoint, confirm every changed code file has tests, run the full suite, present a manual verification plan, create the phase checkpoint commit + git note, record the SHA.

## Phase 2 — Render Verification

- [ ] **Task 2.1: Headless render of all three pages**
  - [ ] `pnpm exec vite preview --port 4173` + headless Chromium (playwright-cli): open Settings → Progress, capture pages 1/3, 2/3, 3/3.
- [ ] **Task 2.2: Inspect screenshots for collisions**
  - [ ] Check row ↔ row, first row ↔ profile chips, last row ↔ "1 / 3 · More" footer, stats ↔ accuracy bars.
  - [ ] If evidence shows residual collisions: adjust constants (max 2 iterations) and re-run Phase 1 tests.
- [ ] **Task 2.3: Commit render evidence + git note** (playwright artifacts excluded from the tree per repo practice; evidence recorded in `plan.md`).
- [ ] **Task 2.4: Phase Verification & Checkpoint (Refer to workflow.md)**

## Phase 3 — Release v1.14.1

- [ ] **Task 3.1: Version bump**
  - [ ] `package.json` 1.14.0 → 1.14.1 (`__APP_VERSION__` derives automatically in `vite.config.ts`; Settings footer shows `v1.14.1`).
- [ ] **Task 3.2: Release notes**
  - [ ] Create `docs/release-notes-v1.14.1.md` as DRAFT: Bug Fixes (overlay row collision; pages 8+8+1 → 6+6+5), Known Issues (unchanged accepted items), Installation.
- [ ] **Task 3.3: Quality gates**
  - [ ] `pnpm run check` · `CI=true pnpm test` · `pnpm run build` · `node scripts/validate-pwa.js` · `node scripts/validate-bundle.js`.
- [ ] **Task 3.4: Commit release prep + git note**
  - [ ] Commit as `chore(release): Prepare v1.14.1`.
- [ ] **Task 3.5: Deploy & verify live**
  - [ ] Tag `v1.14.1` on master → CI/CD tag-gated Coolify deployment.
  - [ ] Smoke the live URL: boot → Settings → Progress pages 1–3 with no collisions; footer `v1.14.1`; offline relaunch OK.
- [ ] **Task 3.6: Device testing & triage**
  - [ ] User verifies on ≥ 1 phone + ≥ 1 tablet (parent Progress view); record results in `docs/device-testing-checklist.md`.
  - [ ] Triage findings: no Critical/High → release not blocked; record accepted non-blocking items.
- [ ] **Task 3.7: Phase Verification & Checkpoint (Refer to workflow.md)**

## Phase 4 — Finalize & Archive

- [ ] **Task 4.1: Finalize release records**
  - [ ] `docs/release-notes-v1.14.1.md` → FINAL; `docs/release-checklist.md` sign-off recorded.
- [ ] **Task 4.2: Complete Conductor state**
  - [ ] Mark all plan tasks complete; metadata status `completed` + `archivedAt`; move track to `conductor/archive/`; update the Tracks Registry to the archived relative path.
- [ ] **Task 4.3: Commit archival + git note**
  - [ ] Commit as `chore(conductor): Archive track 'progress-overlay-fix'`; attach the required Git note and record the SHA.
- [ ] **Task 4.4: Phase Verification & Checkpoint (Refer to workflow.md)** — final checkpoint.
