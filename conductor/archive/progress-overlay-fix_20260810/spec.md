# Spec — Fix Learning Progress Overlay Row Collision

- **Track:** `progress-overlay-fix_20260810`
- **Type:** Bug
- **Date:** 2026-08-10
- **Target release:** v1.14.1 (patch)

## Overview

In Settings → Progress, each game row renders a 30px game name at `y` and a
26px stats line at `y + 26`. With `PROGRESS_ROW_PITCH = 40`, the stats text of
every row visually collides with the next row's game name. This is a
parent-facing readability defect only (kids never see this view), pre-existing
since v1.13.0 (commit `61708b3`), recorded as an accepted non-blocking issue in
the v1.14.0 release triage (release-1.14.0 plan Task 7.3) and proposed there as
a separate follow-up track.

**Root cause (verified against the code):** collision-free spacing requires a
row pitch of ≥ ~54px, but a full 8-row page at that pitch cannot fit inside the
overlay's vertical band (profile chips at ~y - 195 above, page footer at ~y + 175
below, 760px panel). The fix therefore adjusts two constants:

- `PROGRESS_ROW_PITCH`: 40 → **56**
- `PROGRESS_PAGE_SIZE`: 8 → **6** (17 games → pages **6+6+5**, still 3 pages)

Font sizes are unchanged (30px name / 26px stats) to preserve readability.

## Functional Requirements

- **FR-1** Consecutive rows must not collide: a row's stats text bottom must
  clear the next row's game name top (≥ 2px at Phaser line-height metrics).
- **FR-2** `SettingsPanel.ts` constants: `PROGRESS_ROW_PITCH = 56`,
  `PROGRESS_PAGE_SIZE = 6`.
- **FR-3** All 17 games remain reachable across 3 pages (6 + 6 + 5); page
  wrap-around from page 3 ("Back") to page 1 is preserved.
- **FR-4** Layout verified by actual rendering: headless screenshots of pages
  1–3 show zero text collisions (row ↔ row, first row ↔ profile chips, last row
  ↔ page footer "1 / 3 · More", stats ↔ accuracy bars).
- **FR-5** Existing `SettingsPanel.test.ts` assertions updated to the 6-per-page
  layout, plus a new regression test asserting a row pitch of ≥ 56.

## Non-Functional Requirements

- **NFR-1** Zero kid-facing changes: no gameplay, scene, storage, or audio code
  touched. Change surface is limited to `SettingsPanel.ts` constants + tests +
  release docs.
- **NFR-2** All five quality gates pass: `pnpm run check`, `CI=true pnpm test`,
  `pnpm run build`, `node scripts/validate-pwa.js`,
  `node scripts/validate-bundle.js`; coverage thresholds maintained (current
  suite ~98% lines).
- **NFR-3** Ships as patch **v1.14.1** through the repo's tag-gated release
  pipeline (`package.json` bump; `__APP_VERSION__` auto-derives from it in
  `vite.config.ts`, so the Settings footer shows `v1.14.1`).

## Acceptance Criteria

- **AC-1** Automated tests pass; the new pitch regression test fails on the old
  value (40) and passes on 56.
- **AC-2** Headless render screenshots show no text collisions on any of the
  three progress pages.
- **AC-3** Settings footer shows `v1.14.1`; `docs/release-notes-v1.14.1.md`
  FINAL; `docs/release-checklist.md` sign-off recorded.
- **AC-4** User device verification on ≥ 1 phone and ≥ 1 tablet: parent
  Progress view readable, no collisions.

## Out of Scope

- Font size/style changes (30px/26px retained).
- Overlay redesign beyond pitch/page-size adjustment.
- Cloud sync and all other accepted known issues.
- Any kid-facing or gameplay changes.
