# Integrated verification - Storage Resilience

- Date: 2026-11-07
- Branch: `fix/20261107-storage-resilience`
- Base: `26764e9f5563b21cc91e8ec2627c1b06d3a616fb`
- Head: `55651a75`
- Result: verified

## Layers, run against the integrated tree

| Layer | Command | Result |
| --- | --- | --- |
| static | `pnpm check` | exit 0, 293 files, no fixes |
| types | `pnpm typecheck` | exit 0, `src` and `e2e` programs |
| unit | `pnpm test -- --run` | exit 0, 133 files / 2,906 tests, 57.23 s |
| coverage | `pnpm test:coverage` | statements 97.18 (5946/6118) / branches 91.07 (1633/1793) / functions 96.17 (1309/1361) / lines 98.18 (5533/5635) - gate 90 / 85 / 88 / 95 |
| build | `pnpm build` | exit 0, 363 modules, 59 precache entries |
| artifact | `node scripts/validate-bundle.js` | phaser 1335.0 kB; shell `index-C02FLzKT.js` 153.1 kB <= 200 kB |
| artifact | `node scripts/validate-pwa.js` | 16 passed, 0 failed; 47 chunks, 47 precached |
| documents | `node scripts/validate-docs.js` | 5 passed, 0 failed, including derived suite truth |
| browser | `pnpm test:e2e` | 16 journeys passed in 3.8 min on two workers |

## Cross-phase checks

- **The defect is gone at both ends.** Phase 1 proves the save layer cannot throw
  (11 mutators, 7 getters, the `completeGame` path, a missing global) and Phase 2
  proves it in a browser: a child finishes a game while `setItem` throws, the hub
  returns on its own, and a reload boots a playable hub with no page error.
- **The teeth are real.** The red run in `phase-1.md` records 14 failures against
  the pre-fix `storage.ts`, every one an unguarded `DOMException` escaping into a
  scene, and the same suite is green after. AC-8 is demonstrated, not asserted.
- **The happy path did not move.** The bytes written on a working store are
  pinned by an existing test set plus one new assertion that a recovered device
  receives exactly the raw string a healthy one would have.
- **The two deliberate memory-only paths stayed deliberate.** The unknown
  `schemaVersion` write-protection branch and a declined mutator still write
  memory-only and neither raises the flag, so the parent notice means what it says.
- **The panel moved nothing.** Notice at `centerY - 150`, title at `-105`, footer
  at `-75`, rows at `-47 + i x 56`, asserted equal between a degraded and a
  healthy panel.
- **No child-facing change.** The notice lives behind the 3 second parental hold;
  it has no hit area and cannot be dismissed.

## Scope note

Touches began as `src/utils/storage.ts`, the two test files, the panel, one e2e
spec and three living documents. Three files were added with reason:

- `src/__tests__/helpers/throwingStorage.ts` - happy-dom binds `Storage` methods
  onto the instance as own properties, so a `Storage.prototype` spy silently
  misses and the first red attempt proved the tests were passing vacuously. The
  working harness is shared by both touched test files.
- `src/game/e2eBridge.ts` and `src/scenes/HubScene.ts` - the settings bridge had
  to publish `degraded` for the journey to read the parent-facing half rather
  than guess at pixels. Additive only.
- `conductor/product.md` §10.2 - primary-owned, edited for the roadmap row.

## Runtime note

The browser suite grew 13 -> 16 journeys and 3.0 -> 3.8 min. Still inside the
5 min budget, but each journey costs about 15 s of wall clock and `launch-all`
alone is 2.6 min, so the next phase that adds journeys should measure first.
