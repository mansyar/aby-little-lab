# Release v1.28.0

## Summary

Ship the three improvements merged since v1.27.0 through the existing tag-gated PWA/Coolify path:

- **PR #109 — Repeat Machine:** game 25, an author-then-watch loop game in the Thinking group.
- **PR #110 — wide Hub grid fix:** all 25 tiles and plaques fit the wide board; row 0 clears the interactive chip band; narrow paging is unchanged.
- **PR #111 — narration pace:** Slower / Gentle / Standard presets, per child profile, with Gentle preserving the previous behaviour by default.

This release PR is behavior-neutral: it bumps the version, updates release documentation, records measured candidate performance, and synchronizes the first-tap verification harness with the merged five-row Hub grid. No production source, assets, dependencies, schema, storage, or migration changed.

## Release record

- `package.json`: 1.27.0 → 1.28.0; the existing Vite define exposes the same version in the built shell.
- `docs/release-notes-v1.28.0.md`: DRAFT notes for #109 → #110 → #111 in merge order, with Installation, Release Verification, Known Issues and `SKIPPED — accepted gap` device policy.
- `README.md`: Documentation link and dated Releases row.
- `docs/perf-baseline.md`: dated measured v1.28.0 candidate section; historical measurements preserved.
- `scripts/measure-first-tap.mjs`: five-row grid geometry (`GRID_ROWS = 5`, `TILE_ROW_SPACING = 18`, `WIDE_BOARD_TOP = 108`) so candidate measurement matches the merged app.

## Verification

- Exact full `verify_phase` gate: **PASS** on the candidate and again after measured documentation.
  - Biome: 393 files clean.
  - TypeScript: application and E2E projects clean.
  - Vitest: 165 files / 3,559 tests passed.
  - Coverage: 96.91% statements / 90.23% branches / 96.22% functions / 98.06% lines — above 90/85/88/95 gates.
  - Build: 501 modules; shell `index-B7LXOJIw.js` 194.87 kB / 48.95 kB gzip.
  - Bundle: shell 190.3 kB ≤ 200 kB.
  - Module-size: PASS with three warn-only notes.
  - Textures: 76.42 / 321.00 MiB, ratio 0.238 — PASS.
  - PWA: 16/0; 55 chunks / 55 precached; 67 precache entries.
  - Docs: 5/0.
- Headed first tap: **PASS** — 50 cold / 0 warm, exactly 10 per game; aggregate cold p95 response / finished / total 40.9 / 32.4 / 265.2 ms; worst cold 273.2 ms ≤ 400 ms.
- Local browser matrix: **PASS after one caused rerun** — Chromium 30/30, WebKit 10/10, Firefox 10/10, mobile Chromium 10/10. The first attempt's single boot-toast timeout and successful identical rerun are retained.
- Physical iOS Safari, Android Chrome and Fire tablet testing: **SKIPPED — accepted gap**. No real-device pass is claimed.

Raw evidence is retained under `conductor/tracks/20261128-release-v1-28-0/verification/` and will move with the track archive at completion.

## Required CI

- Quality Gates
- Browser Journeys (all shards/projects)

CI remains authoritative. Do not merge until every required check is green.

## Post-merge boundary

- Merge only after explicit **Merge now** approval, using the configured `merge` method.
- After merge, close issue #108 with a completion comment linking PR #110 and this release PR.
- Tagging/deploy is a separate decision: merge approval does not authorize pushing `v1.28.0` or triggering Coolify.
- Notes remain DRAFT until tag CI, deploy and live verification pass; only then may they become FINAL.

Refs #108. No screenshots are attached because this PR introduces no visual/runtime change; the release documents the already-merged parent-visible features.
