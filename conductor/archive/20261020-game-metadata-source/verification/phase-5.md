# Phase 5 Evidence — Docs and the full gate

- **Track:** 20261020-game-metadata-source — Game Metadata Single Source of Truth
- **Phase:** 5 — Docs and the full gate
- **Date:** 2026-10-21
- **Branch:** refactor/20261020-game-metadata-source
- **Base:** 4c956b8 (companion commit `conductor(plan): Mark phase 'Docs and the full gate' as in progress`)
- **Head:** working tree at time of verification (committed as the phase checkpoint)
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | 232 files; the one pre-existing `noNonNullAssertion` warning and the biome.json schema info, unchanged |
| static | `pnpm typecheck` | 0 | silent |
| unit | `pnpm test -- --run` | 0 | 111 files / **2327 tests** (pre-track 110 / 2305) |
| unit | `pnpm test:coverage` | 0 | statements **97.77 %**, branches **90.69 %**, functions **96.37 %**, lines **98.55 %** — all above the 90 / 85 / 88 / 95 gates |
| build-artifact | `pnpm build` | 0 | `precache 53 entries (1703.44 KiB)`, unchanged from pre-track |
| build-artifact | `node scripts/validate-bundle.js` | 0 | shell entry `index-Dfp7XCGc.js` = **133.2 kB** (<= 200 kB); Phaser vendor chunk present |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| smoke | `node scripts/validate-boot.js` | 0 | median cold boot **0.59 s** (Phase 3 run, unchanged by docs) |

## Requirements met

| ID | Requirement | Evidence | Status |
| --- | --- | --- | --- |
| FR-10 | The docs describe the registry and stop claiming the lists are hand-maintained | `docs/TDD.md` §7.1 gains the `gameRegistry.ts` row and its `hubPaging`/`hubTiles` rows now say they derive; §2.1 tree lists `gameRegistry.ts`; §3.3 describes the glob-plus-registry derivation and the throw-on-mismatch contract; the shell-boundary paragraph now explains that the 53-key pin is read from `SHELL_ASSETS` at runtime. `README.md` names the registry in the `game/` line. `docs/PRD.md` §4.1 gains one paragraph that identity is declared once. | met |
| NFR-2 | Entry chunk stays under budget | 133.2 kB measured after the docs change (build output above). | met |
| NFR-4 | No CI layer added | `.github/workflows/ci.yml` untouched; the Hub walkthrough is a local capture, not a gate. | met |
| AC-5 | `check && typecheck && test` passes at or above the pre-track count | 2327 tests vs 2305 pre-track, all green. | met |
| AC-6 | Full `verify_phase` passes, within existing thresholds | every command in the table above exited 0. | met |
| AC-7 | A Hub walkthrough shows 22 tiles on all three pages plus wide, every icon rendering, an earned sticker shown as earned | Four captures in `.conductor/evidence/hub/`: page 1 (10 tiles), page 2 (10 tiles), page 3 (2 tiles), wide (6 + 6 + 6 + 4). Every tile renders its icon and label; page dots show the active page. The capture seeds three earned stickers (`shape-sorter`, `more-less`, `story-order`); their tiles show the sticker thumbnail on the shelf where the other 19 show the dashed empty slot - clearest in `hub-wide.png`. | met |
| AC-8 | The docs mention the registry and no longer claim hand maintenance | same edits as FR-10; grep for the old wording found no remaining claim. | met |

## AC-1 grep sweep (recorded here for the spec's grep-level criterion)

Searched `src` excluding `__tests__`:

| Pattern | Matches | Where |
| --- | --- | --- |
| `sceneKey: "` | 22 | `src/game/gameRegistry.ts` only |
| `PROGRESS_GAME_ROWS` | 0 | removed in Phase 2 |
| `HUB_TILE_COUNT` | 0 | removed in Phase 2 |
| `PAGE_COUNT` | 0 | removed in Phase 2 |
| `key: "tile_…"` / `key: "sticker_…"` in `PreloadScene.ts` | 0 | derive in Phase 3 |
| `sticker_${…}` template literal | 0 | `stickerKeyForGame` in Phase 2 |

## Evidence paths

- `conductor/tracks/20261020-game-metadata-source/verification/phase-5.md` (this file)
- `.conductor/evidence/hub/hub-phone-page1.png`, `hub-phone-page2.png`, `hub-phone-page3.png`, `hub-wide.png`
- `.conductor/evidence/capture-hub.mjs` — the capture script (playwright-core, `chrome` with an `msedge` fallback, service worker blocked so the canvas offline toast does not cover the top tile row)
- `.conductor/evidence/preview-p5.log` — the preview server used for the walkthrough

## Deviations

None in code. The capture script blocks the service worker in its browser context: the offline
toast is canvas-drawn and sits over the top tile row, and the PWA behaviour it reports is
already covered by `validate-pwa.js`. Blocking it changes nothing the walkthrough asserts
(tiles, icons, paging, sticker shelf).

## Notes

- One console 404 during the walkthrough is the app's pre-existing missing `/favicon.ico`
  (`Invoke-WebRequest http://localhost:4173/favicon.ico` → 404), unrelated to this track.
- The first page-2 capture looked mid-stagger (seven labelled tiles plus a blank slot); a
  second frame 2.5 s later shows all ten. The animation was still running, not a gap — the
  settled frame is the one kept.
- `PreloadScene.ts` line coverage is 94.4 % with 75 % branches: the two glob-filter guards
  (`tile_`/`sticker_` prefix skip and the duplicate throw) only run on malformed trees. The
  project-wide gates are what the workflow enforces and they pass; no per-file threshold was
  introduced.
