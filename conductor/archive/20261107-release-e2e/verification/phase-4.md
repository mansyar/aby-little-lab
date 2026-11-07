# Phase 4 — Shell journeys: parental gate, settings, daily cap, offline relaunch

- **Track:** `20261107-release-e2e`
- **Phase:** 4 (Shell journeys)
- **Date:** 2026-11-07
- **Branch:** `chore/20261107-release-e2e`
- **Phase base:** `0c4df10cc0274a9a1e9dd25db27c46012268423c`
- **Head:** `87f08642`
- **Result:** **blocked on the browser suite.** Every gate this executor is allowed
  to run is green, but `pnpm test:e2e` is refused by the shell permission layer
  (as in Phases 1–3), so the three journeys written here have not been executed
  by their author. The primary runs them and reports failures back.

## Goal

FR-5 / FR-6 / FR-7 / FR-8 each get a passing journey: the parental gate opens
settings on a three-second hold and does nothing on a one-second press; a
settings toggle survives a reload; a spent daily budget refuses to launch; and
with the worker installed the hub plus one game relaunch with the network cut.

## What was added

### Bridge (read-only, gated on `?e2e=1`, inert otherwise)

Two accessors, both live getters with defaults outside the hub, no caches and no
setters:

| Accessor | Publishes | Source of truth |
|---|---|---|
| `settings()` | `{ gate: {x,y} \| null, open, toggles[] }` | the live centre of the hub's "Settings" label; the panel's own liveness flag; the toggle rows the panel created |
| `hubPlayTime()` | `{ timeUp, nudging }` | the same flag that dims and disables the tiles, and the nudge the launch flow shows |

`SettingsPanel` publishes its toggle rows (`id`, band centre, live `on`) and
`e2eOpen()`; `HubScene` publishes the gate centre and the two play-time flags.
The type-only import direction is unchanged (`components`/`scenes` → `game/e2eBridge`),
so nothing new is bundled for a real player.

`open` is asked of the panel rather than of `HubScene.settingsPanel`, because a
backdrop tap destroys the panel without the scene clearing its field — the
reference alone would keep reporting a panel that is gone.

### Journeys

| File | Title | What it drives | What it asserts | Why it is not vacuous |
|---|---|---|---|---|
| `e2e/journeys/parental-gate.spec.ts` | a three-second hold opens settings and a one-second press does not | presses the published gate centre for 1 s, then for 3.4 s in the same visit | the panel stays closed while the scene is sampled every 250 ms for 3 s — a hold timer that was never cancelled would fire 2 s after release, inside that window; the hub is still the active scene; the gate is still published at the same point; the 3.4 s hold then opens a panel publishing `bgm`, `sfx`, `adaptive` | FR-5 needs both directions. The short-press watch runs *past* the three-second mark, so "it did not open" cannot pass by sampling too early. |
| `e2e/journeys/parental-gate.spec.ts` | a settings toggle survives a reload and the game still boots | holds the gate, taps the published Adaptive row, reloads, holds the gate again | the row flips to `off`; `settings.adaptiveDifficulty` is `false` in the app's own persisted payload; after a real reload the hub still boots with tiles, the panel does not come back open, and the rebuilt panel reports the toggle still `off` | The value is read back through the app after a reload, not from the panel that wrote it; storage is checked separately so a visual flip without persistence fails. |
| `e2e/journeys/time-limit.spec.ts` | a spent daily budget locks the hub and never launches | seeds the persisted v2 payload to three minutes left, reloads, taps the first tile; then seeds the cap, reloads, taps again | near the limit the nudge is raised and the scene is still `Hub` while it is up; at the cap `timeUp` is true, `nudging` is false, the tiles are still published, and twelve samples over three seconds are all `Hub` | Two thresholds the code actually enforces. The refusal is sampled across a window longer than the nudge's own two-second hand-off, so a launch that merely starts late still fails. The seed reuses the day stamp the app wrote itself, so `normalizePlayTime` cannot quietly zero the usage. |
| `e2e/journeys/offline.spec.ts` | the hub and a game still relaunch with the network offline | waits for the worker to install and control the document, cuts the network for the whole browser context, reloads, launches AnimalTrace | the hub boots with tiles from cache; the launched scene key is `AnimalTrace`; the network is restored in a `finally` | The network is cut at the context, so nothing can reach the preview server; the scene key is read after the launch, not from the tile that was tapped. |

Fixtures: `settleHub`/`reloadHub` (the same shell wait for a navigation the
journey starts, so a reload cannot race the toast or the entrance stagger), the
two new bridge reads, `collectErrors(page, { console: false })`, and
`e2e/fixtures/shell.ts` (persisted payload, play-time seed, service-worker
readiness).

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| Lint + format | `pnpm check` | 0 | 291 files checked, no fixes |
| Types (app + e2e project) | `pnpm typecheck` | 0 | both projects clean |
| Unit | `pnpm test -- --run` | 0 | 133 files, 2,881 tests |
| Coverage | `pnpm test:coverage` | 0 | statements 97.14, branches 91.07, functions 96.02, lines 98.16 |
| Build | `pnpm build` | 0 | 363 modules, 47 chunks, SW generated |
| Bundle | `node scripts/validate-bundle.js` | 0 | shell entry 152.7 kB (≤ 200 kB) |
| PWA | `node scripts/validate-pwa.js` | 0 | 16 passed; 47/47 chunks precached, navigation route present |
| Docs | `node scripts/validate-docs.js` | 0 | 5 passed (first run failed on the moved suite count; docs refreshed, re-run green) |
| Journeys | `pnpm test:e2e` | — | **not run**: `Permission denied: shell` |

`node scripts/validate-boot.js` was not run: boot, preload, PWA plumbing and
assets are unchanged (UI probes and one test-only accessor only), which is the
condition the workflow attaches to that smoke. The e2e suite itself builds and
serves `dist` through `vite preview`, so the primary's `pnpm test:e2e` covers
the boot path the new journeys depend on.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-5 | three-second hold opens settings; one-second press leaves the hub unchanged | `parental-gate.spec.ts` (first journey) | implemented, awaiting the primary's run |
| AC-6 | a toggle set before a reload is still set after | `parental-gate.spec.ts` (second journey) | implemented, awaiting the primary's run |
| AC-7 | with seeded usage at the cap, tapping a tile shows the budget signal and does not transition | `time-limit.spec.ts` | implemented, awaiting the primary's run — see finding 1 |
| AC-8 | offline after install, the hub reloads and one game launches | `offline.spec.ts` | implemented, awaiting the primary's run |

## Findings worked around

1. **The cap shows a lock, not the nudge.** `isNearLimit` requires minutes
   remaining `> 0`, so a spent budget never raises the nudge; the hub dims and
   disables the tiles and shows the moon badge instead. The journey therefore
   asserts the nudge where it exists (three minutes left, where it also hands
   off to the game) and the lock with no transition at the cap. Worth a product
   decision later: a spent budget's only feedback is a dimmed board and a
   silhouette, with no text a parent can read.
2. **The gate point is the label's live centre, not the 96 px hit box.** The
   label is right-origin at the canvas corner; publishing `getCenter()` keeps
   the journey from re-deriving font metrics, and the point sits inside the
   centred hit box regardless of the rendered text width.
3. **A foreign release is harmless only because the hold already resolved.**
   The gate's release at 3.4 s lands on the panel's backdrop, which closes on
   `pointerdown` only. This is the Phase 3 back-control finding in another
   place; it happens to be benign here, and is not fixed.
4. **The offline case asserts page errors only.** A relaunch with no network may
   legitimately log a failed optional fetch; the claim under test is that the
   shell and a game still work, not that offline has no noisy edges.
5. **The worker may not control the first document.** If the app's worker
   activates after the first navigation, one reload (the navigation a relaunch
   performs anyway) adopts it; the journey does that once and then requires
   control before cutting the network.

## Deviations

| File | Reason |
|---|---|
| `src/game/e2eBridge.ts` | Two read-only accessors; the brief permits bridge extensions gated on `?e2e=1` with live getters and no cache/setter. Preferred over asserting private scene fields. |
| `src/scenes/HubScene.ts` | Holds the Settings label and publishes the gate centre plus the play-time flags. One extra field, one assignment, one shutdown clear. |
| `src/components/SettingsPanel.ts` | Publishes its toggle rows and its own liveness. `createToggle` gained an `id` parameter; three call sites updated. |
| `src/__tests__/game/e2eBridge.test.ts` | Keeps the frozen-key list and the new accessors' defaults in step (six tests). |
| `src/__tests__/components/SettingsPanel.test.ts` | Three probes: liveness after destroy, published points inside their own row bands, state after a tap. |
| `src/__tests__/scenes/hubScene.test.ts` | Three probes: the gate is published while closed, it disappears on shutdown, and an unlimited profile reports no budget state. |
| `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` | `validate-docs` derives the suite truth; the counts moved from 2,869 to 2,881 and coverage denominators with them. |

## Notes for the primary

- Unit counts moved 2,869 → 2,881 (six bridge tests, three panel probes, three
  hub-scene probes), so README/TDD/perf-baseline were refreshed in the first
  commit and `validate-docs` is green again.
- Runtime: the three journeys add roughly a minute of wall clock (two boots and
  two 3.4 s holds in the gate file, three boots in the time-limit file, one
  worker install in the offline file). Phase 3 measured 4.0 min locally with a
  minute of headroom; this phase should be checked against NFR-2 (≤ 5 min CI,
  ≤ 6 min local) on the primary's run rather than assumed.
- The gate hold is 3.4 s and the short press 1.0 s; both are fixture constants
  (`SETTINGS_HOLD_MS`, `SETTINGS_SHORT_PRESS_MS`) so a change to
  `DEFAULT_HOLD_DURATION` shows up in one place.
- If a journey fails, the first things to check are the ones this phase cannot
  observe: (a) whether the label's live centre is inside the hit box at the
  rendered font size, (b) whether the PWA toast was up when a tile was tapped
  after a reload, and (c) whether the worker had claimed the document before the
  network was cut — each failure message names its stage.

## Primary verification

Verified by the primary agent independently on 2026-11-07, phase base
`0c4df10c`, head `7086388b`. The primary ran the browser suite the executor was
refused: **13 of 13 journeys green in 4.9 m**, including the three this phase
added, with no retries and no edits between the last commit and the run.

### The journeys, as actually run

| Journey | Duration | What it proves |
| --- | --- | --- |
| `parental-gate.spec.ts` - three-second hold | 12.4 s | A 3.4 s hold opens settings; a 1.0 s press does not, watched past the 3 s mark so it cannot pass by being early |
| `parental-gate.spec.ts` - toggle survives reload | 15.6 s | Toggling a setting, reloading and reading it back through the rebuilt panel |
| `time-limit.spec.ts` - spent budget locks the hub | 15.4 s | Seeded cap through the real storage payload: twelve samples, scene never leaves `Hub` |
| `offline.spec.ts` - relaunch with the network cut | 12.2 s | Worker controls the page, offline reload boots the hub from cache, `AnimalTrace` launches from cache |
| `launch-all.spec.ts` - every game launches | 2.6 m | Unchanged from Phase 3; still the dominant cost |
| the other eight | 4.3-14.1 s | Unchanged from Phase 3 |

### Gate

| Layer | Command | Exit | Evidence |
| --- | --- | --- | --- |
| Static | `pnpm check` | 0 | 291 files, no findings |
| Types | `pnpm typecheck` | 0 | both programs (`src`, `e2e`) clean |
| Unit | `$env:CI='true'; pnpm test -- --run` | 0 | 133 files / 2,881 tests, 17.79 s |
| Coverage | `pnpm test:coverage` | 0 | statements 97.16 / branches 91.12 / functions 96.02 / lines 98.16 |
| Build | `pnpm build` (via `test:e2e`) | 0 | 59 precache entries, 1,750.16 KiB |
| Bundle | `node scripts/validate-bundle.js` | 0 | phaser 1,335.0 kB; shell `index-CwRDX7PP.js` 152.7 kB <= 200 kB |
| PWA | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| Documents | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed |

### NFR-2 is at its limit, not inside it

The suite now takes **4.9 min** locally against a `<= 5 min` CI budget, with
`launch-all` alone consuming 2.6 of it. Phase 3 finished at 4.0 min; the three
new journeys cost 43 s and the rest is the 22-game loop, which is 75 s of
parental holds and 24 s of hub entrances before a single game is counted.

So the budget is met on this host and would not survive a slower runner or one
more shell journey. This is recorded rather than waved through, and Phase 5
(`NFR-3`, ten consecutive runs) is where it must be decided: either the loop
gets cheaper - `workers > 1` for the non-conflicting files is the obvious lever,
since one shared preview serves all of them - or `NFR-2` is amended with a
measured number instead of a guessed one.

### AC check

| AC | Verdict | Basis |
| --- | --- | --- |
| AC-5 | met | both directions of the gate run, short press watched past the threshold |
| AC-6 | met | toggle, reload, read back through the panel the app rebuilt |
| AC-7 | met at both thresholds | near-limit shows the nudge and does not launch; a spent cap locks and twelve samples stay on `Hub` |
| AC-8 | met | offline reload plus a cache-served launch, network restored in `finally` |

### Findings this phase produced for the roadmap, not for this track

- **The daily cap does not nudge, it locks.** `isNearLimit` requires remaining
  minutes `> 0`, so the nudge only exists in the last five minutes; at the cap
  the tiles dim and refuse without the nudge ever appearing. The journey
  therefore drives both thresholds explicitly. Whether a three-year-old should
  get the nudge at the cap is a product question, not a harness one.
- **A settings toggle is durable but a setting is not observable** unless the
  panel publishes it; that is why the bridge gained `settings()` rather than the
  journey reaching into storage to assert. Reading storage after reload would
  have proven the payload, not the behaviour.

