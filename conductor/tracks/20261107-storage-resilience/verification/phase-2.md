# Phase 2 — The parent is told, and the browser proves it

- **Track:** 20261107-storage-resilience
- **Phase:** 2 of 4
- **Date:** 2026-11-07
- **Branch:** `fix/20261107-storage-resilience`
- **Phase base:** `6414c2e52667b0951a421dc92d18feda7a518df5`
- **Head:** `9ab4e649`
- **Result:** **blocked** — every layer that could run is green; the browser layer
  (`pnpm test:e2e`) is refused by the harness and `conductor/product.md` §10.2 is
  primary-owned, so the roadmap row is the one edit left for the primary.

## Verification

The phase gate is:

```
pnpm test:e2e && pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js
```

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | Checked 293 files in 660 ms. No fixes applied. |
| types | `pnpm typecheck` | 0 | `tsc --noEmit` clean for the app and `tsc --noEmit -p e2e/tsconfig.json` clean for the suite. |
| unit | `pnpm test -- --run` | 0 | 133 passed (133) files / 2906 passed (2906) tests, 47.50 s. Four new cases; the suite was 2,902 before this phase. |
| coverage | `pnpm test:coverage` | 0 | statements 97.18 (5946/6118), branches 91.07 (1633/1793), functions 96.17 (1309/1361), lines 98.18 (5533/5635). `SettingsPanel.ts` 98.21 statements / 100 branches / 100 functions / 100 lines; `src/utils/storage.ts` unchanged at 98.5 / 91.42 / 100 / 98.18. |
| build | `pnpm build` | 0 | 363 modules, PWA `generateSW`, 59 precache entries (1750.62 KiB). Shell entry `index-C02FLzKT.js` = 156.81 kB as Vite prints it. |
| artifact | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk `phaser-B_vcVLyb.js` 1335.0 kB; **shell entry 153.1 kB ≤ 200 kB**. |
| artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed; 47 chunks emitted, 47 precached. |
| docs | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed, including the derived suite truth (133 files / 2,906 tests). |
| browser | `pnpm test:e2e` | — | **Not run.** The harness refused the command (`Permission denied: shell`); see Blocked. The new spec is prepared and type-checked but its runtime is unmeasured. |

## Acceptance

| AC | What it requires | Proving test(s) | Status |
|---|---|---|---|
| AC-5 | Settings renders the notice while the store refuses, renders nothing while it works, and the eight rows keep their positions | `SettingsPanel.test.ts` → *SettingsPanel degraded persistence notice*: "states the fact while the device cannot save, and says nothing otherwise", "leaves the title, the version footer and the eight rows exactly where they were", "keeps the notice informational: no hit area and no tap handler", "reads the flag once, at open time, and never polls it" | pass |
| AC-7 | A browser journey with `setItem` throwing completes a game, returns to the hub, reloads into a booted hub and collects no page error | `e2e/journeys/storage.spec.ts` → "a child finishes a game on a device that cannot save, and the parent is told"; plus "a device that blocks storage entirely still boots a playable hub" and "a working device sees no notice" | **prepared, unrun** (blocker) |

## The notice's geometry

The panel is `PANEL_WIDTH` × `PANEL_HEIGHT` (480 × 760) centred on the canvas
centre (512, 384), so its box spans y 4 → 764. Nothing on the panel moved: the
notice is the only object whose y differs from a healthy panel, and the unit
test compares every label's y between a degraded and a healthy panel.

| Object | y | Source |
|---|---|---|
| Panel top edge | 4 | 384 − 380 |
| **Notice** | **234** | `centerY + NOTICE_OFFSET` = 384 − 150 |
| Title "Settings" | 279 | 384 − 105 |
| Version footer `v<version>` | 309 | 384 − 75 |
| First row card | 337 | 384 − 47 |
| Last (eighth) row card | 729 | 337 + 7 × 56; card bottom 763 ≤ 764 |
| Panel bottom edge | 764 | 384 + 380 |

The notice sits 45 px above the title's centre and 230 px below the panel's top
edge, in the band that held nothing before. It is 24 px, `DISABLED_COLOR`
(`#a0aec0`, the version footer's own muted colour) and `textStyle()`, with no
`setInteractive`, no hit area and no handler — the test asserts both.

## Evidence paths

- Commits: `9f4ed5c2` (panel, bridge, unit tests), `7b6af1a2` (journey),
  `9ab4e649` (docs and counts).
- Working tree clean at head; no untracked evidence files were needed.

## Deviations

| File | Why it was required |
|---|---|
| `src/game/e2eBridge.ts` | Outside Touches. The published settings shape lives here; `degraded: boolean` is added to `E2ESettingsState` and to the no-hook fallback, additively, so the journey reads the flag rather than guessing at pixels. |
| `src/scenes/HubScene.ts` | Outside Touches. `e2eSettings()` is the publisher: it now returns `panel.e2eDegraded()` while the panel is up, the same snapshot that decides whether the notice is drawn. |
| `src/__tests__/game/e2eBridge.test.ts` | Outside Touches. Its literal expectations of the settings shape; the flag is also asserted to follow the scene's published state rather than a constant. |
| `src/__tests__/scenes/hubScene.test.ts` | Outside Touches. One `toEqual` of the closed-panel shape. |

`src/__tests__/helpers/throwingStorage.ts` is imported but not modified. The
panel suite flips the real flag through it rather than mocking
`isPersistenceDegraded`: the panel imports the binding, so a module spy cannot
reach it, and a refused write is the condition the flag exists to record.

## Blocked

| Command / file | Why | Expected |
|---|---|---|
| `pnpm test:e2e` | Refused by the harness (`Permission denied: shell`), as in Phase 1. It builds `dist` and drives Chromium; nothing in this session can run it. | Three journeys in `storage.spec.ts` pass, the suite stays green, and the wall clock stays inside the 5 min budget (the suite measured 3.0 min on two workers before this spec; the new spec adds one game, one reload and two panel opens, ~20-30 s of work). |
| `conductor/product.md` §10.2 | Refused (`Permission denied: edit`) — the file is primary-owned. | The `20261110-storage-resilience` row rewritten as **Done 2026-11-07** (track `20261107-storage-resilience`), describing the guarded save layer, the in-memory change, the session flag and the one-line notice, with the exit gate **demonstrated** by the 14 red tests against the pre-fix `storage.ts` and the browser journey. The exact replacement line is in the phase report's notes. |

## Notes

- The flag is read once, in the panel's constructor. A panel opened while
  degraded keeps saying so after the store heals, and the next panel opened
  does not — that snapshot is asserted, not assumed.
- The journey patches only `Storage.prototype.getItem` / `setItem`, never
  `window.localStorage`, so the preview server, the service worker and
  Playwright's instrumentation keep working; `addInitScript` re-applies on the
  reload, which is what makes "survive a reload with storage still refusing"
  mean anything.
- Console errors are excluded from the journey's collected failures, matching
  `offline.spec.ts`: a refused write is the condition under test; only an
  uncaught page error is a defect. The unit layer is where console silence is
  not enough.
- Counts refreshed in the same commit as the tests that moved them:
  `README.md:49`, `docs/TDD.md:1069`, `:1083`, `:1089`,
  `docs/perf-baseline.md:421-422`, plus the journey counts in `README.md:51`
  and `docs/TDD.md` §10.5 (13 → 16 journeys, 12 → 13 specs). `docs/TDD.md` §6.6
  is rewritten in place, heading and TOC entry together, because "its
  limitation" is no longer true.

## Primary verification

Verified 2026-11-07 by the primary agent, independently of the executor's report.
Phase base `6414c2e5`, head `9ab4e649`.

| Check | Result |
| --- | --- |
| Working tree | clean except evidence and the primary's `product.md` row |
| Commits in range | 3, no merges, no amend |
| `pnpm test:e2e` | exit 0, **16 passed in 3.8 m** on two workers - the three new journeys included, inside the 5 min budget |
| `pnpm check` | exit 0, 293 files, no fixes |
| `pnpm typecheck` | exit 0, both programs |
| `pnpm test -- --run` | exit 0, 133 files / 2,906 tests, 57.23 s |
| `pnpm test:coverage` | exit 0, statements 97.18 (5946/6118), branches 91.07 (1633/1793), functions 96.17 (1309/1361), lines 98.18 (5533/5635) |
| `pnpm build` | exit 0 |
| `validate-bundle` | exit 0, phaser 1335.0 kB, shell `index-C02FLzKT.js` 153.1 kB <= 200 kB |
| `validate-pwa` | exit 0, 16 passed, 47 chunks all precached |
| `validate-docs` | exit 0, 5 passed |

Both blockers were the primary's to clear, and both cleared without touching
code. `pnpm test:e2e` ran green first time: **AC-7 is a passing browser journey,
not a prepared one** - a child finishes a game while every write throws, the hub
returns on its own, a reload boots a playable hub, and a parent who holds the
settings gate reads the notice. The `product.md` §10.2 row was rewritten by the
primary as the executor specified.

Runtime is worth watching: 13 journeys took 3.0 min and 16 take 3.8 min. That is
inside the 5 min ceiling with 1.2 min left, and each journey added has cost about
15 s of wall clock. The suite is still bounded below by `launch-all` (2.6 min on
its own), so the headroom is real, but the next phase to add journeys should
measure rather than assume.

I read the notice's construction rather than trusting the geometry table: the
text is created in the constructor from `isPersistenceDegraded()`, carries no
`setInteractive`, and sits at `centerY + NOTICE_OFFSET` while every other label
keeps its literal offset. The unit test that compares all label positions between
a degraded and a healthy panel is the check that "moved nothing" survives the
next edit.

