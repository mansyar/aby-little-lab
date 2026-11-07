# Phase 4 verification — the proof a parent can reach it

| | |
| --- | --- |
| Track | `20261108-local-insights` |
| Phase | 4 of 4 — the proof a parent can reach it |
| Date | 2026-11-08 |
| Branch | `feat/20261108-local-insights` |
| Base | `39bfc487` |
| Head | `80ddea29` (this file is committed after it) |

## Commands

| Command | Result |
| --- | --- |
| `pnpm test:e2e` | **denied by the permission layer** — recorded under Blocked, not worked around |
| `pnpm check` | exit 0 — "Checked 301 files in 318ms. No fixes applied." |
| `pnpm typecheck` | exit 0 — `tsc --noEmit` then `tsc --noEmit -p e2e/tsconfig.json` |
| `pnpm test -- --run` | exit 0 — 137 test files, 2,975 tests passed, 22.21 s |
| `pnpm test:coverage` | exit 0 — 137 files / 2,975 tests; statements 97.22 (6092/6266), branches 91.12 (1745/1915), functions 96.1 (1334/1388), lines 98.21 (5668/5771); all four gates (95/88/85/90) held |
| `pnpm build` | exit 0 — 365 modules, shell entry `index-C7_3WcjB.js` 161.88 kB (Vite print, 40.18 kB gzip), Phaser vendor 1,367.08 kB, 47 JS chunks, PWA precache 59 entries (1755.58 KiB) |
| `node scripts/validate-bundle.js` | exit 0 — shell entry 158.1 kB (<= 200 kB), Phaser vendor chunk present |
| `node scripts/validate-pwa.js` | exit 0 — 16 passed, 0 failed (47 chunks, 47 precached) |
| `node scripts/validate-docs.js` | exit 0 — 5 passed, 0 failed |

Two supporting checks, both run outside the chain: `grep "\bfetch\(" src` returned
no matches (AC-8), and `package.json` is unchanged, so no dependency was added.

## Acceptance

- **AC-7** — one journey, `e2e/journeys/insights.spec.ts`, seeds an
  `abby-little-lab:v2` payload through `addInitScript` (two completed days,
  three games straddling the ten-tap floor, `limitMinutes: 30` with one
  cap-day), opens the hub, holds the gate with `holdCanvasUntil`, taps the
  published `progressRow`, and polls `progress` to page 0. It then asserts:
  `pageCount === 5`; three statements, none blank; reach mentions "2 days this
  week" and "5 completions in all"; accuracy mentions "64% of answers correct",
  "strongest Color Match" and "hardest Shape Sorter"; habit mentions "2 days in
  a row" and "cap reached on 1 day"; the forward chevron reaches page 1 with an
  empty `lines`; the back chevron returns to page 0 with the same three strings;
  `collectErrors` is empty at the end. No fixed sleeps — every wait is a
  `holdCanvasUntil` poll or an `expect.poll` on published state. **The suite run
  itself is blocked** (see Blocked), so this acceptance is demonstrated by the
  journey's assertions rather than by a recorded green run in this phase.
- **AC-8** — no new dependency (`package.json` untouched), no `fetch(` under
  `src/`, shell entry 158.1 kB against the 200 kB gate, and lazy chunking,
  PWA and documentation validators all green.
- **AC-9** — `docs/TDD.md` §5.9 records the stored shape, why `SCHEMA_VERSION`
  stayed 1, each derived metric with its window and ten-tap floor, the Overview
  page contract and the read-only bridge surface; the roadmap row in
  `conductor/product.md` §10.3 could not be written (Blocked) and the metric
  baselines were not refreshed, so AC-9 is only partly met.

## Evidence paths

- `src/game/e2eBridge.ts` — `E2EProgressState`, `progressRow`, `progress`.
- `src/components/settings/ProgressOverlay.ts` — `e2eState()`, render-time
  `pageLines`, drawn chevron centres.
- `src/components/SettingsPanel.ts` — `e2eProgressRow()`, `e2eProgress()`.
- `src/scenes/HubScene.ts` — `e2eSettings()` publishes both.
- `e2e/fixtures/game.ts` — `progressState()`, widened `settingsState()` fallback.
- `e2e/journeys/insights.spec.ts` — the journey.
- `src/__tests__/game/e2eBridge.test.ts` — frozen-key list unchanged, fallback
  shape, live page/toggle reads, `progressRow` and `progress` pass-through.
- `src/__tests__/components/settings/ProgressOverlay.test.ts` — null while
  closed, page 0 statements equal to `summariseInsights(...).lines`, chevron
  points, page 1 empty, page 0 restored, null after close.
- `docs/TDD.md` §5.9, §10.2, §10.3, §10.5; `README.md` lines 49-51, 120-122, 175.

## Deviations

- `src/__tests__/scenes/hubScene.test.ts` changed although it is outside the
  phase's Touches: its shutdown test asserts the whole `E2ESettingsState`
  literal, so the two new fields forced the smallest possible widening of that
  one object (`progressRow: null, progress: null`).
- `docs/TDD.md` §5.5's `ProgressOverlay.ts` table row was updated to name the
  Overview page and link §5.9, because leaving it as "per-game learning stats"
  would have described the component wrongly; the brief asked only for a new
  subsection.
- The brief's "current truth" (2,972 tests) predated this phase's own two new
  unit tests. The refreshed counts are 137 files / 2,975 tests, and the
  coverage snapshot in `docs/TDD.md` and `docs/perf-baseline.md` moved to
  97.22 / 91.12 / 96.1 / 98.21.
- Journey-count sentences that read "16 journeys" became 17 across 14 spec
  files in `docs/TDD.md` (§10.5 and the container paragraph); the container
  timing sentence lost its count rather than claiming a figure for a suite
  this phase could not run.

## Blocked

- `pnpm test:e2e` — **permission denied** (`Permission denied: shell`). Needed
  to prove AC-7 end to end and to time the new journey. The journey is written,
  typechecked (`tsc -p e2e/tsconfig.json`) and formatted, but no run was
  recorded. Expected result: 17 journeys green, suite inside the 5-minute
  budget.
- `edit conductor/product.md` — **permission denied** (`Permission denied:
  edit`) on two authorised locations, so §10.3 still says the row is a future
  track and its metric table still reads `unknown`:
  - The `20261124-local-insights` row should become **Done 2026-11-08** (track
    `20261108-local-insights`): the Learning Progress panel opens on an Overview
    page — one tap past the gate, three statements (reach: distinct games and
    days in the last seven local days out of 22, plus lifetime completions;
    accuracy: overall share with strongest/hardest named only above a ten-tap
    floor; habit: streak, best streak and cap-days or "no daily limit set")
    above the existing seven-day strip, per-game pages one chevron behind; five
    additive insights fields keep `SCHEMA_VERSION` at 1 and backfill older
    saves; all derived on-device from counters the games already write, so the
    event ring buffer the row scoped was not built; no new dependency, no
    network, shell entry 158.1 kB of the 200 kB gate; TDD §5.9 records the
    shape and each metric's window and floor; the exit gate is **demonstrated**
    by `e2e/journeys/insights.spec.ts` (run pending, see above).
  - The metrics table's five `unknown` baselines should become what the page
    now reports, with "no telemetry" stated: completion rate is read per
    profile from completions against plays; distinct games are reported over
    the last seven local days, not per session; adaptive-band movement remains
    unmeasured (the page reports accuracy, the input a band moves on, not the
    band); uncaught errors remain unmeasured until `20261124-error-capture`;
    day-7 return remains unmeasured, since the save keeps only seven days of
    activity. No figure leaves the device.

## Notes

- The journey's duration against the suite budget is **not measured**: the run
  was denied. It boots one hub, performs one hold and five taps, and polls only
  published state, which puts it well below the per-journey average the
  existing suite sets (measured at roughly 3.0-3.1 min for 16 journeys with two
  workers), but that is an estimate rather than an observation.
- The bridge additions are read-only: no setter, no cache, no write, no storage
  call. `ProgressOverlay` keeps its own `page`; the bridge never copies it.
  Everything stays inert without `?e2e=1`, and the installed bridge object is
  still frozen.
- `e2e/fixtures/game.ts` gained `progressState()` and its `settingsState()`
  fallback grew the two new fields, so a journey reading a vanished bridge gets
  `null` rather than `undefined`.

## Primary verification

Verified 2026-11-08 by the primary agent, independently of the executor.
Phase base `39bfc487`, head `259610cb`.

| Check | Result |
| --- | --- |
| Working tree | clean before the primary's runs |
| Commits in range | 4, no merges, all reported |
| Scope diff | 13 files: 5 `src/` (bridge, overlay, panel, scene, tests), 2 `e2e/`, 4 documents, the evidence file |
| `pnpm test:e2e` | **17 passed (3.2m)**, exit 0 - the new journey 10.3 s, inside the 5-minute budget |
| `pnpm check` | `Checked 301 files in 364ms. No fixes applied.` - exit 0 |
| `pnpm typecheck` | both programs, no output - exit 0 |
| `pnpm test -- --run` | `Tests 2975 passed (2975)`, 19.20 s - exit 0 |
| `pnpm test:coverage` | statements 97.22 / branches 91.12 / functions 96.1 / lines 98.21 - exit 0 |
| `node scripts/validate-bundle.js` | phaser 1335.0 kB; shell `index-C7_3WcjB.js` 158.1 kB <= 200 kB - exit 0 |
| `node scripts/validate-pwa.js` | `Results: 16 passed, 0 failed` - exit 0 |
| `node scripts/validate-docs.js` | `Results: 5 passed, 0 failed` - exit 0 |

### The two blocked items, done

The executor could not run the journey suite or edit `conductor/product.md`.
Both were the primary's to run, and both were run here:

- `pnpm test:e2e` → 17 passed in 3.2 minutes, the insights journey among them:
  `a parent reads the three insight statements on the first Progress page
  (10.3s)`. AC-7 is a green run, not a claim.
- `conductor/product.md` §10.3: the `20261124-local-insights` row now reads
  **Done 2026-11-08** with an honest scope note - the ring buffer in the
  original row was **not** built, because the existing aggregates plus two new
  counters answer the question, and adaptive-band spread is deferred to Phase 4
  rather than pretended. The exit gate is marked **demonstrated**. The metrics
  table's `unknown` baselines now say what the page reports and what it does not,
  with the local-only, no-telemetry rule stated above the table.

### What was read, not assumed

- The bridge publishes the **strings the overlay drew**: `ProgressOverlay`
  records each Overview statement as its `Text` object is created, and the
  bridge hands that array over. It does not recompute the summary, so a page and
  a test cannot agree while the page is wrong.
- `progress` is `null` when the overlay is closed, and the whole surface stays
  behind the existing `?e2e=1` guard: no bridge without the parameter, the
  frozen object shape unchanged apart from the added keys, live reads only.
- The journey computes its day keys **in the page** from the local clock rather
  than pasting literals, which is exactly the defect `20261107-trunk-green`
  removed; it also holds the parental gate with `holdCanvasUntil` rather than a
  fixed duration, the defect the first CI run of `#79` exposed.
- The seed is deliberate rather than incidental: three games straddle the
  ten-tap floor, so the strongest/hardest line has something true to say, and a
  30-minute cap with one recorded cap-day exercises the routine line.

### Acceptance

- **AC-7** — pass, the journey above.
- **AC-8** — pass: `package.json` unchanged (no new dependency), no `fetch(` in
  `src/`, shell 158.1 kB of the 200 kB gate.
- **AC-9** — pass: `docs/TDD.md` records the five fields, the `SCHEMA_VERSION`
  reasoning, the write rules, each metric's window and floor and the bridge
  surface; `README.md` names the Overview page; the roadmap row is Done.

### Deviations accepted

1. `src/__tests__/scenes/hubScene.test.ts` was widened for the new settings
   literal (one shape change, no behaviour).
2. Counts moved to 137 files / 2975 tests and 17 journeys across 14 specs, and
   the living documents say so.

### A note for the review

The shell entry is now 158.1 kB, up 0.7 kB in this phase and 3.3 kB across the
track. Still comfortable, but the budget is now a number worth reading before
the next feature adds a module to the boot path.

