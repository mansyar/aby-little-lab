# Phase 3 verification — The page

| | |
| --- | --- |
| Track | `20261108-local-insights` |
| Phase | 3 — The page |
| Date | 2026-11-08 |
| Branch | `feat/20261108-local-insights` |
| Phase base | `c14a80de` |
| Head at verification | `fadb077d` (the evidence commit follows this one) |

## Commands

The whole chain was run as the brief writes it, in one invocation, against the
tree that contains the page, the tests and the refreshed counts:

`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`

| Command | Result | Exit |
| --- | --- | --- |
| `pnpm check` | `Checked 300 files in 328ms. No fixes applied.` | 0 |
| `pnpm typecheck` | `tsc --noEmit` plus the e2e project: no output | 0 |
| `pnpm test -- --run` | `Test Files 137 passed (137)`, `Tests 2972 passed (2972)`, 15.93 s | 0 |
| `pnpm test:coverage` | 137 files / 2972 tests; statements 97.24 (6075/6247), branches 91.27 (1737/1903), functions 96.24 (1333/1385), lines 98.24 (5652/5753) against the 95 / 88 / 85 / 90 gate | 0 |
| `pnpm build` | `✓ 365 modules transformed`, `✓ built in 873ms`, `PWA mode generateSW`, `precache 59 entries (1754.92 KiB)` | 0 |
| `node scripts/validate-bundle.js` | `PASS: Phaser vendor chunk present: phaser-B_vcVLyb.js (1335.0 kB)`, `PASS: shell entry index-BnH_jggJ.js = 157.4 kB (<= 200 kB)`, `All bundle validation checks passed!` | 0 |
| `node scripts/validate-pwa.js` | `Results: 16 passed, 0 failed` (47 chunks, 47 precached) | 0 |
| `node scripts/validate-docs.js` | `Results: 5 passed, 0 failed`, including `✓ The living docs state the current test-suite truth` | 0 |

`src/components/settings/ProgressOverlay.ts` in the coverage report: `100`
statements, `92.85` branches, `100` functions, `100` lines; the uncovered
branch lines (116–121) are the `?? getActiveProfile()` fallback for a viewed id
that no longer exists, which the chip renderer cannot reach. The shell entry
grew 154.8 → 157.4 kB, still well inside the 200 kB gate.

## Acceptance

AC-6: "The Overview page is the overlay's first page, shows each statement's
text, still shows the 7-day strip, and leaves the per-game pages, paging and the
parental gate behaving exactly as before."

Page 0 now holds, in this order:

1. the panel title, the close `X`, and the per-profile chips (unchanged), with
   the viewed profile's ring;
2. the three statements from `summariseInsights(viewedProfile, new Date())`,
   derived once per render from the **viewed** profile — not `getActiveProfile()`
   — one text block each, 24 px, wrapped to 430 px (the 480 px panel less a
   20 px margin each side) and top-anchored at the old row band, so a long
   strongest/hardest line wraps instead of overflowing;
3. the same 7-day strip as before, label at `centerY + 230` and bars at
   `centerY + 265` (7 bars, 24 px wide), driven by the viewed profile's
   activity;
4. `1 / 5` plus the `‹` / `›` chevrons at their existing positions.

What page 0 deliberately does not hold: any per-game row, any mastery star, any
accuracy bar, any new texture, asset or scene, and any child-facing string. The
per-game rows are still `PROGRESS_PAGE_SIZE = 6` in registry order, unchanged
internally, one page later; `pageCount` is `OVERVIEW_PAGES + ceil(22 / 6) = 5`
and the clamp handlers are untouched, so neither end can be paged past. There is
no new animation, so reduced motion changes nothing about this page.

Tests carrying AC-6, all green in the run above:

| Test | What it proves |
| --- | --- |
| `ProgressOverlay` › "renders panel, title, close button and the Overview as the first page" | `1 / 5` shown, no `1 / 4`, zero row icons on open, both chevrons present. |
| `ProgressOverlay` › "lists the three insight statements on page 0" | Each of `summary.lines[0..2]` is drawn exactly once on open. |
| `ProgressOverlay` › "renders the 7-day activity strip label and bars on the Overview page" | Label "Last 7 days · 0 plays" and seven 24×4 bars still drawn at `y = 649`. |
| `ProgressOverlay` › "renders the empty sentences for a profile with nothing played" | The three written sparse states, no throw, for a never-played profile. |
| `ProgressOverlay` › "derives its rows from the registry, in hub order, from page 1 onward" | The first game page still draws the first six tile keys and labels in registry order. |
| `ProgressOverlay` › "pages forward through the chevron and clamps at the last page" | `2 / 5` → six rows, `5 / 5` → the remaining four, further forwards clamped. |
| `ProgressOverlay` › "pages back from page 1 to the Overview" | Statements and strip return with `1 / 5` and zero row icons. |
| `ProgressOverlay` › "no-ops the previous chevron on the Overview page" | Back on page 0 does not re-render. |
| `ProgressOverlay` › "re-renders the Overview with the viewed profile's summary" | Chip switch replaces the routine statement with the viewed profile's (`cap not reached yet` ↔ `no daily limit set`). |
| `ProgressOverlay` › "switches the viewed profile via the profile chips without changing active" | The switcher still never calls `switchProfile`. |
| `ProgressOverlay` › "tapping the close button empties the bucket and destroys objects" | The close affordance and the parent-locked overlay are unchanged. |
| `SettingsPanel` › "opens the Learning Progress overlay from the Progress row" | The gate still opens it; Overview first, then the first game page. |
| `SettingsPanel` › "pages through all 22 game rows with explicit chevrons (6+6+6+4)" | Overview + 6 + 6 + 6 + 4 across `1 / 5` … `5 / 5`, clamped at both ends. |
| `SettingsPanel` › "shows Story Order as the 22nd row, reading its own progress record" | The last row is still reachable, now four chevrons away. |
| `SettingsPanel` › "pages the progress report with explicit prev/next chevrons" | Affordance cohesion: the chevrons page 1 ↔ 5 and clamp. |

The suite moved from 2,968 to 2,972 tests in the same 137 files: four net-new
cases in `ProgressOverlay.test.ts`, and the `SettingsPanel.test.ts` report tests
re-pointed at the page after the Overview.

## Evidence paths

- `src/components/settings/ProgressOverlay.ts` — the Overview page, its
  constants (`OVERVIEW_PAGES`, `OVERVIEW_LINE_START_Y`, `OVERVIEW_LINE_PITCH`,
  `OVERVIEW_TEXT_WIDTH`), the `gamePage` offset and the page-count change.
- `src/__tests__/components/settings/ProgressOverlay.test.ts` — four new cases,
  `nextPage()` / `previousPage()` / `statementLines()` helpers, page literals
  moved to `/ 5`.
- `src/__tests__/components/SettingsPanel.test.ts` — the report tests read the
  first game page after the Overview; page literals moved to `/ 5`.
- `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` — refreshed counts.

## Deviations

1. **`src/__tests__/components/SettingsPanel.test.ts` is outside Touches.** The
   brief anticipates it ("If the page count appears in a test today, update the
   expectation and say so in the evidence"): seven of its report tests asserted
   rows and page labels on what is now page 0. Each gained a single `›` tap
   (four in the paging walk), and the `1 / 4` … `4 / 4` literals became
   `1 / 5` … `5 / 5`. No production behaviour changed to satisfy them.
2. **Suite-count refresh in living docs.** `README.md:49`, `docs/TDD.md:1099`
   and `:1105`, and the two `docs/perf-baseline.md` rows moved to
   `137 files / 2,972 tests` and `97.24 / 91.27 / 96.24 / 98.24`, verified
   date unchanged (2026-11-08), as `validate-docs` requires.
3. **`pnpm build` counted 365 modules** (was 364) because the overlay now
   imports `insightsSummary`; no new dependency, no new asset. Recorded as a
   note only, not a scope change.

## Blocked

Nothing.

## Notes

- The summary is computed with `summariseInsights(viewedProfile, new Date())`
  once per render, before the page branch, so both the Overview and the strip
  read one snapshot of the viewed profile; the renderer derives nothing itself.
- `getProfiles()` moved above the chips so the viewed profile is resolved once;
  the strip now reads `viewedProfile.activity` instead of re-looking the id up,
  which also removes a `?? []` that `normalizeV2` already makes unreachable.
- Branch coverage rose 91.25 → 91.27; the four added tests exercised the
  existing row renderer through a second page and the chip re-render path.
- `pnpm exec vitest run <file>` is refused by the permission layer (only the
  brief's commands are allowed), so each failure was diagnosed from the full
  suite run; recorded here for the primary, not as a blocker.

## Primary verification

Verified 2026-11-08 by the primary agent, independently of the executor.
Phase base `c14a80de`, head `8d13a61f`.

| Check | Result |
| --- | --- |
| Working tree | clean before the primary's runs |
| Commits in range | 4, no merges, all reported |
| Scope diff | 7 files: 1 component, 2 test files, 3 living docs, the evidence file |
| `pnpm check` | `Checked 300 files in 326ms. No fixes applied.` - exit 0 |
| `pnpm typecheck` | both programs, no output - exit 0 |
| `pnpm test -- --run` | `Tests 2972 passed (2972)`, 15.65 s - exit 0 |
| `pnpm test:coverage` | statements 97.24 / branches 91.27 / functions 96.24 / lines 98.24 - exit 0 |
| `pnpm build` | `built in 708ms`, 59 precache entries (1754.92 KiB) - exit 0 |
| `node scripts/validate-bundle.js` | phaser 1335.0 kB; shell `index-BnH_jggJ.js` 157.4 kB <= 200 kB - exit 0 |
| `node scripts/validate-pwa.js` | `Results: 16 passed, 0 failed` - exit 0 |
| `node scripts/validate-docs.js` | `Results: 5 passed, 0 failed` (suite truth 137 files / 2972 tests) - exit 0 |

### The difference was read, not the report trusted

- The Overview is page `0` and the per-game window is computed as
  `page - OVERVIEW_PAGES`, so the first game page still starts at row 0 and the
  row band is empty (not misaligned) on the Overview. `pageCount` gained the
  same `OVERVIEW_PAGES`, which is why the counter reads `n / 5` rather than the
  old `n / 4`.
- The summary is derived **once per render** for the **viewed** profile
  (`profiles.find(...) ?? getActiveProfile()`), not the active one — the chip
  switcher is read-only and the Overview follows it.
- The strip's data now comes from the same `viewedProfile` the summary used
  instead of a second `getProfiles()` lookup, removing a chance for the two
  halves of the page to disagree.
- Statements are placed at the layer's existing constants
  (`PROGRESS_ROW_START_Y`), use the shared `textStyle` helper, and wrap to
  430 px inside the 480 px panel so a long strongest/hardest line keeps the
  same type size as its neighbours.
- No production file outside `ProgressOverlay.ts` changed; `insightsSummary.ts`
  was not touched, so the page renders what phase 2 proved rather than a second
  derivation of it.

### Acceptance

AC-6 passes. The page opens on the Overview, shows the three statements and the
seven strip bars, pages six games at a time afterwards, clamps at both ends,
re-renders on a viewed-profile switch, and renders the empty sentences for a
profile that has played nothing. Per-game behaviour is unchanged apart from being
one page later, which the settings-report tests now encode explicitly (`/ 5`
instead of `/ 4`, one extra chevron tap).

### Deviations accepted

1. `src/__tests__/components/SettingsPanel.test.ts` was widened: seven report
   tests asserted row and page labels on what is now page 0, so each gained one
   chevron tap and the `1/4`..`4/4` literals became `1/5`..`5/5`. No production
   behaviour was changed to make them pass.
2. The living-document counts were refreshed to 137 files / 2972 tests.

### A number worth watching

The shell entry grew from 154.8 kB to **157.4 kB** (+2.6 kB) for the summary
module and the page. That is the right trade — the page is the feature — but it
leaves 42.6 kB of the 200 kB budget, so the next phase that adds a scene or a
dependency should look at this figure rather than assume the headroom is
infinite.

