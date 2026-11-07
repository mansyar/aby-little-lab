# Integrated verification - Storage Resilience

- Date: 2026-11-07
- Branch: `fix/20261107-storage-resilience`
- Base: `26764e9f5563b21cc91e8ec2627c1b06d3a616fb`
- Head: `2e1c9557` (both review rounds included)
- Result: verified

## Layers, run against the integrated tree

| Layer | Command | Result |
| --- | --- | --- |
| static | `pnpm check` | exit 0, 293 files, no fixes |
| types | `pnpm typecheck` | exit 0, `src` and `e2e` programs |
| unit | `pnpm test -- --run` | exit 0, 133 files / 2,912 tests, 30.17 s |
| coverage | `pnpm test:coverage` | statements 97.21 (5967/6138) / branches 91.14 (1658/1819) / functions 96.18 (1310/1362) / lines 98.21 (5551/5652) - gate 90 / 85 / 88 / 95 |
| build | `pnpm build` | exit 0, 363 modules, 59 precache entries |
| artifact | `node scripts/validate-bundle.js` | phaser 1335.0 kB; shell `index-CpDFSutQ.js` 153.6 kB <= 200 kB |
| artifact | `node scripts/validate-pwa.js` | 16 passed, 0 failed; 47 chunks, 47 precached |
| documents | `node scripts/validate-docs.js` | 5 passed, 0 failed, including derived suite truth |
| browser | `pnpm test:e2e` | 16 journeys passed in 3.4 min on two workers |
| boot smoke | `node scripts/validate-boot.js` | PASS, median 0.63 s over 3 cold loads (<= 3.0 s) |

## Cross-phase checks

- **The defect is gone at both ends.** Phase 1 proves the save layer cannot throw
  (11 mutators, 7 getters, the `completeGame` path, a missing global) and Phase 2
  proves it in a browser: a child finishes a game while `setItem` throws, the hub
  returns on its own, and a reload boots a playable hub with no page error.
- **The teeth are real.** The red run in `verification/red-run.md` records 14 failures against
  the pre-fix `storage.ts`, every one an unguarded `DOMException` escaping into a
  scene, and the same suite is green after. AC-8 is demonstrated, not asserted.
- **A refused read is no longer an empty store.** The review found that Phase 1
  folded "could not read" into "nothing stored", so a device that blocks `getItem`
  but accepts `setItem` would have written fresh defaults over the real save, then
  cleared the flag and hidden the notice. Phase R1 gives the read a separate
  failure signal, keeps a blocked session memory-only, and heals only when a later
  read returns the raw this session last knew. The test that proves it was run
  against the Phase 1 file first and failed there.
- **A blocked boot cannot shadow a legacy save.** Round 2 found the second half:
  the placeholder a blind boot memoized was keyed with `null`, so a later heal
  onto an empty store matched the cache and never reached `migrateV1(readV1())` —
  a v1-only save would have been overwritten on the first write. The memo now
  carries `provisional` and cannot satisfy the cache comparison, and a test seeds
  only `V1_KEY`, blocks reads, heals, earns a sticker, and asserts the persisted
  v2 payload holds the v1 sticker *and* the new one. Removing the single
  `!v2Cache.provisional` term fails that test alone (1 failed / 137 passed).
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
