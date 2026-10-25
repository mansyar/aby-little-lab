# Phase 1 Verification — Stamp the payload and classify every read

- Track: `20261025-storage-schema-version` — Storage Schema Version (chore, high)
- Phase: 1
- Date: 2026-10-25
- Branch: `chore/20261025-storage-schema-version`
- Base: `d114d679b0be8818c4c82415256a4f1114378af8`
- Code head: `cbf858e7` (implementation); evidence commits follow
- Result: **verified** — all 8 verification layers green. `node scripts/validate-docs.js` was denied by the sandbox for this subagent (known pattern from the brief) and was run by the primary, which handed the passing output back.

## Red-first proof

- Evidence: `.conductor/evidence/phase-1-red.md` (committed in `998f60ab` with the tests).
- Red run: `pnpm test -- --run src/__tests__/utils/storage.test.ts` → exit 1, **6 failed / 107 passed** — all six failures are the new versioning tests failing for the right reason (unstamped writes ×3; unknown-version payload served from its data; memo cache overwriting a protected payload; non-number version served from its data). All pre-existing tests stayed green.
- Green run (after `cbf858e7`): same command → exit 0, **113 passed**.

## Commands table

| Layer | Command | Exit | Summary |
|---|---|---|---|
| unit (red) | `pnpm test -- --run src/__tests__/utils/storage.test.ts` | 1 (expected red) | 6 failed / 107 passed — see red evidence |
| static | `pnpm check` | 0 | 1 pre-existing warning (`musicalMemoryScene` non-null assertion) + 1 biome schema info — the benign noise named in the brief, untouched |
| static | `pnpm typecheck` | 0 | clean |
| unit | `pnpm test -- --run` | 0 | 121 files / 2673 tests passed |
| coverage | `pnpm test:coverage` | 0 | Gates all green: lines 98.75 ≥ 95, functions 96.8 ≥ 88, branches 91.52 ≥ 85, statements 97.84 ≥ 90; `storage.ts` 99.18 stmts / 88.23 branch / 100 funcs / 98.96 lines |
| build | `pnpm build` | 0 | Shell entry `index-ClSTbkRf.js` 142.13 kB (gzip 33.36 kB), phaser vendor chunk emitted, PWA generated |
| smoke | `node scripts/validate-bundle.js` | 0 | PASS — shell entry 138.8 kB ≤ 200 kB (NFR-3) |
| smoke | `node scripts/validate-pwa.js` | 0 | 16 passed / 0 failed |
| smoke | `node scripts/validate-docs.js` | 0 | **passed — run by primary after sandbox denial, output handed back** ("All document validation checks passed!") |

Note: the full `&&`-chained verification command as written was denied by the sandbox in one call; each step was then run individually in the exact prescribed order. Every step above that was permitted ran and passed.

## Acceptance criteria

| AC | Requirement | Tests (src/__tests__/utils/storage.test.ts, "schema versioning" describe at L1174) | FR mapping |
|---|---|---|---|
| AC-1 | Fresh write parses back `schemaVersion: 1`; legacy payload reads as v1 and gains the stamp on the next write; migrated v1→v2 write is stamped | `stamps a fresh write with schemaVersion 1` (L1216); `classifies a legacy unstamped payload as version 1 and stamps it on the next write` (L1225 — body otherwise unchanged via `toEqual`); `stamps the migrated v2 payload when a v1-only install first migrates` (L1244) | FR-1 (`SCHEMA_VERSION` src/utils/storage.ts:46, stamped on the single write path `saveV2` :151) |
| AC-2 | Unknown version (99) served in-memory defaults; raw stored string byte-identical through mutations and reload; memo cache never overwrites a protected payload | `serves in-memory defaults for an unknown version and never touches the stored bytes` (L1284 — includes `vi.resetModules()` reload proof); `never lets the memo cache overwrite a write-protected payload` (L1316) | FR-2 (`classifyStoredV2` :59), FR-4 (unknown branch in `ensureV2` :126; in-memory-only guard in `mutate` :162) |
| AC-3 | Non-numeric version (`"1"`, `null`) takes the corrupt path (fresh defaults, A4) | `treats a non-number schemaVersion as corrupt and serves fresh defaults` (L1328) | FR-2 (`unusable` → pre-existing corrupt handling, byte-compatible with today's behavior) |
| AC-5 | Test pins the version-1 identity migrate step as the template | `pins the version-1 identity migrate step` (L1265); `reads a payload stamped with the known version normally` (L1258) | FR-3 (`migrateFromVersion1` identity step :83, documented as the per-version template; no registry) |
| Guards | Corrupt JSON → defaults; v1-only migrates; both keys → v2 wins, v1 key left in place | Pre-existing tests stay green (corrupt: "returns default AppStorage when storage contains invalid JSON", "falls back to defaults when the stored v2 JSON becomes corrupt after a cached read"; v1-only: "migrates a v1 save into profile p1", "keeps the v1 key untouched after migration"); new: `prefers v2 when both keys exist and leaves the v1 key in place` (L1339) | NFR-1 (zero kid-visible change, zero data loss) |

Implementation notes for the record:

- FR-1: `saveV2` serializes `{ ...v2, schemaVersion: SCHEMA_VERSION }` — one stamp site, the single write path; `ensureV2`'s migrate path and `mutate` both go through it.
- FR-4: two guards were needed — the `ensureV2` unknown branch (serve cached defaults keyed to the protected raw string) **and** a `mutate` guard that skips `saveV2` and re-keys the cache when the stored payload classifies as `unknown` (caught by the green run of tests L1284/L1316 after the first implementation cut).
- `readV2` now refuses `unknown`/`unusable` classifications; `unusable` falls through to the pre-existing migrate/overwrite path exactly as corrupt payloads behaved before (A4, byte-compatible behavior change scope).
- Legacy `load()`/`save()` untouched (Phase 2); `AppStorage` untouched; no files outside the Touches set modified.

## Evidence paths

- `.conductor/evidence/phase-1-red.md` (committed with the red tests)
- This file

## Deviations

- None outside the Touches set (`src/utils/storage.ts`, `src/__tests__/utils/storage.test.ts`).

## Blockers

- None. The one sandbox-denied step (`node scripts/validate-docs.js`) was run
  by the primary with exit code 0 — "All document validation checks passed!" —
  completing the 8-layer gate.

## Notes

- Red-first protocol followed strictly: tests committed red (`998f60ab`) before the implementation commit (`cbf858e7`); both captured.
- NFR-3: shell entry 142.13 kB (was 138.4 kB at last note) — +3.7 kB from the versioning contract; well under the 200 kB gate.
- Boot smoke not required this phase (no boot/preload/PWA/assets changes).
- The only uncovered line in `storage.ts` is the defensive `catch` in `readV2` (L121), which is unreachable since `classifyStoredV2` has already parsed the same raw string; kept intentionally as a safety net. Coverage gates remain green project-wide.
