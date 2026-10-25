# Implementation Plan - 20261025-storage-schema-version

> Phases execute in order. Each phase's Verification command must pass at the
> phase's final commit before the phase is accepted. Touches are disjoint
> across phases.

## Phase 1: Stamp the payload and classify every read

- **Goal:** Every write carries `schemaVersion: 1`; every read classifies the stored payload (missing → implicit v1 and stamped on next write, `1` → known, any other number → unknown, non-number → corrupt) and unknown-version payloads are write-protected byte-for-byte with in-memory defaults served. Established with board-level tests written red-first.
- **Depends on:** —
- **Covers:** FR-1, FR-2, FR-3, FR-4, AC-1, AC-2, AC-3, AC-5, NFR-1, NFR-2, NFR-3
- **Touches:** `src/utils/storage.ts`, `src/__tests__/utils/storage.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P1.T1: Versioning tests, red first** — covers: FR-1, FR-2, FR-4
  - [x] **P1.T1.1: Stamp test** — a fresh `saveV2` write round-trips through `JSON.parse` with top-level `schemaVersion === 1`; a legacy unstamped payload is classified as v1 and carries `schemaVersion: 1` after the next write, with its body otherwise unchanged. Red against the current unstamped writer.
  - [x] **P1.T1.2: Classification tests** — known `1` reads normally; unknown number (`99`) serves in-memory defaults and leaves the raw localStorage bytes byte-identical through mutations and reload; non-number version (`"1"`, `null`) takes the corrupt path (fresh defaults); the memo cache is never allowed to overwrite a write-protected payload. Red where the current reader guesses.
  - [x] **P1.T1.3: Regression guards** — existing precedence tests stay green: corrupt JSON → fresh defaults, v1-only storage still migrates, both keys present → v2 wins with the v1 key left in place.
- [x] **P1.T2: Implement the versioned contract** — covers: FR-1, FR-2, FR-3, FR-4
  - [x] **P1.T2.1: Stamp** — `SCHEMA_VERSION = 1` constant; `saveV2` writes the top-level `schemaVersion` field on the single write path.
  - [x] **P1.T2.2: Classify + protect** — the read path returns the version class (missing/known/unknown/corrupt) per the spec's classification table; unknown payloads are preserved raw and served as defaults in memory, silently (A2).
  - [x] **P1.T2.3: Identity step** — the minimal migration contract: a per-version migrate step where version `1` is the identity, as the template for future versions. No speculative registry.

**Result:** verified
**Checkpoint:** `b05a303a`
**Evidence:** conductor/tracks/20261025-storage-schema-version/verification/phase-1.md

## Phase 2: Retire the legacy load/save pair

- **Goal:** `load()`/`save()` leave the public surface; their internal callers read through the granular path; `AppStorage` narrows to the one-time v1→v2 migration input type. Grep proves the retirement.
- **Depends on:** Phase 1 (classification + stamp landed; tests build on the versioned contract)
- **Covers:** FR-5, AC-4, NFR-1, NFR-2, NFR-3
- **Touches:** `src/utils/storage.ts`, `src/game/profileLogic.ts`, `src/types/index.ts`, `src/__tests__/utils/storage.test.ts`, `src/__tests__/game/profileLogic.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- **Note:** no data-path change — the v1 key, `readV1()` and `migrateV1` stay untouched (A3); only the compatibility pair and the type's dual role go.
- [x] **P2.T1: Retire the pair** — covers: FR-5
  - [x] **P2.T1.1: Redirect internal callers** — `hasSticker` and `getSettings` read through the granular path instead of `load()`.
  - [x] **P2.T1.2: Remove exports, narrow the type** — delete the `load()`/`save()` exports; `AppStorage` in `src/types/index.ts` becomes the migration-input type (`migrateV1`'s parameter), with its doc comment updated.
  - [x] **P2.T1.3: Test updates** — the default-shape tests and the `AppStorage` literal in `storage.test.ts`, and the v1 helpers in `profileLogic.test.ts`, use the narrowed type; behaviour assertions unchanged.
- [x] **P2.T2: Grep proof of retirement** — covers: FR-5, AC-4
  - [x] **P2.T2.1: Zero call sites** — grep shows no `load(`/`save(` storage call sites outside the migration context, and every remaining `AppStorage` reference is the migration input; record the output in the phase evidence. All suites pass.

**Result:** verified
**Checkpoint:** `6fb3ca59`
**Evidence:** conductor/tracks/20261025-storage-schema-version/verification/phase-2.md

## Phase 3: Docs truth — TDD and roadmap

- **Goal:** TDD.md documents the versioned storage contract (stamp, classification table, write-protect); roadmap.md carries neither the schema-version Known Issue nor the Future-Work item, and the checked-on date is refreshed.
- **Depends on:** Phase 2
- **Covers:** FR-6, AC-6
- **Touches:** `docs/TDD.md`, `docs/roadmap.md`
- **Verification:** `pnpm test -- --run && node scripts/validate-docs.js`
- **Status:** in_progress

- [x] **P3.T1: TDD storage section** — covers: FR-6
  - [x] **P3.T1.1: Classification table** — the storage docs gain the version contract: `SCHEMA_VERSION` constant, the four-way read classification, write-protect semantics (silent, raw preserved, in-memory defaults discarded on reload per A2), and the identity migrate step as the pattern for future versions. Engine-accurate against `src/utils/storage.ts`.
- [x] **P3.T2: Roadmap cleanup** — covers: FR-6
  - [x] **P3.T2.1: Removals** — delete the "no schema version" Known Issue and the "Version the stored payload" Future-Work item; renumber the remaining Future-Work entries (shared-random-helpers → 1).
  - [x] **P3.T2.2: Date refresh** — the "checked against the code on" line moves to 2026-10-25.
- [x] **P3.T3: Validator green** — covers: AC-6
  - [x] **P3.T3.1: Docs validation** — `node scripts/validate-docs.js` passes at the phase's final head.

**Result:** verified
**Checkpoint:** `b3e5d9b1`
**Evidence:** conductor/tracks/20261025-storage-schema-version/verification/phase-3.md

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/<track-id>/verification/phase-<n>.md
-->
