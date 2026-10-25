# Track: 20261025-storage-schema-version — Specification

> Requirements are stable. Once an FR, NFR, or AC ID is approved, do not renumber it. If a requirement is removed, mark it Withdrawn instead of deleting it.

## Overview

The persisted v2 payload gains an explicit `schemaVersion` field, the read path classifies payloads by that version (known → migrate step; missing → implicit v1; unknown number → write-protect; non-numeric → corrupt), and the legacy `load()`/`save()` compatibility pair is retired, with `AppStorage` narrowing to the v1-migration input type. This resolves the roadmap Known Issue "The stored payload carries no schema version". Kid-visible behaviour is unchanged.

## Problem / Motivation

`src/utils/storage.ts` writes the v2 payload through `saveV2` → `JSON.stringify(v2)` with no `schemaVersion` field — format version is encoded only in the storage key name (`abby-little-lab:v2`). A future in-place format change can therefore only be *inferred*, never recognized, and the legacy `AppStorage` type still lingers in `src/types/index.ts` (line 81) alongside the v2 types. Recon confirms the retirement surface is small and safe: no call site outside `storage.ts` uses `load()`/`save()` — every consumer already uses the granular API (`getSettings`, `getActiveProfile`, …).

Scope guard, decided with the product owner 2026-10-25:

- Unknown versions are **write-protected**, not treated as corrupt.
- Migration machinery is **minimal** (constant + per-version step, no speculative registry).
- Missing version is **implicit v1** so every live install keeps its progress.
- The **`load()`/`save()` pair retires**; the one-time v1→v2 migration is kept so the oldest installs are not orphaned.

## Goals & Success Metrics

- **Goal:** a future format change is recognized, not inferred.
  **Metric:** every persisted v2 payload carries `schemaVersion`; the reader classifies strictly by it; `grep schemaVersion src/utils/storage.ts` finds the contract.
- **Goal:** no live install regresses.
  **Metric:** suites stay green including the legacy-shape cases — a pre-versioning v2 payload reads as v1, and a v1-key-only install still migrates once to a stamped v2.
- **Goal:** the legacy surface retires.
  **Metric:** zero exported `load`/`save` in `storage.ts`; `AppStorage` is referenced only as the migration input type.

## Scope

**In scope**

- Stamp a top-level `schemaVersion: 1` (via a `SCHEMA_VERSION` constant) on every write through the single v2 write path.
- Read-path classification before normalization, per FR-2.
- A minimal per-version migration contract: the constant plus a migrate-from-stored-version step; version 1's step is identity. Future versions add one step each when they actually happen.
- Retire the exported `load()`/`save()` pair; internal callers (`hasSticker`, `getSettings`) switch to direct v2 reads; `AppStorage` survives solely as the `Partial<AppStorage>` migration input feeding `migrateV1`.
- Docs truth: TDD.md's storage section documents the versioning contract (classification table); roadmap.md drops the schema-version Known Issue and Future-Work item 1, renumbers, refreshes the checked-on date; tech-stack changelog entry.

**Out of scope**

- Any kid-visible change.
- Removing the v1 storage key or its read path (that would orphan pre-profile-v2 installs).
- Building migrations for hypothetical future versions, or a migration-registry abstraction beyond the minimal contract.
- Any storage backend change (no IndexedDB, no new keys).

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | Every persisted v2 payload carries a top-level `schemaVersion` number, currently `1`, stamped by the single write path (`saveV2`). | must |
| FR-2 | The read path classifies a stored payload by `schemaVersion` before normalizing: field missing → implicit version 1; the number `1` → known; any other number → unknown; any non-number (e.g. `"1"`, `null`) → corrupt, taking the existing normalize-to-defaults path. | must |
| FR-3 | A minimal versioned migration contract exists: a `SCHEMA_VERSION` constant and a per-version migrate step from the stored version to the current one; version 1's step is identity. | must |
| FR-4 | Unknown-version payloads are write-protected: the raw localStorage value is never modified or removed by this app; the session serves in-memory defaults; the bytes survive until a matching app version reads them. | must |
| FR-5 | The exported `load()`/`save()` pair is removed; `hasSticker`/`getSettings` read v2 state directly; `AppStorage` remains only as the v1 migration input type. | must |
| FR-6 | Documentation truth: TDD.md documents the versioning contract and classification table; roadmap.md no longer lists the schema-version Known Issue or Future-Work item 1 (renumbered); tech-stack changelog carries the entry. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | Zero kid-visible change and zero data loss: pre-versioning v2 payloads and v1-key installs keep their progress; unknown-version payloads survive the session byte-identical. |
| NFR-2 | The full verification chain from `conductor/workflow.md` passes (all configured layers, coverage gates 95/88/85/90). |
| NFR-3 | Bundle discipline: the shell entry stays within the 200 kB gate; net size roughly neutral (retired code offsets the added contract). |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | A payload written by this build parses back with `schemaVersion: 1`; a legacy payload without the field reads as version 1 and gains the stamp on the next write. | FR-1, FR-2 |
| AC-2 | A payload stamped with an unrecognized version (e.g. `99`) is served as defaults, and after any storage-mutating API calls in the same session the raw stored string is byte-identical to what was stored. | FR-2, FR-4 |
| AC-3 | A payload with a non-numeric `schemaVersion` (`"1"`, `null`) follows the corrupt path to defaults, matching today's handling. | FR-2 |
| AC-4 | Grep proof: no `export function load`/`export function save` remains in `storage.ts`; `AppStorage` appears only as the migration input; all suites pass. | FR-5 |
| AC-5 | The migration contract is exercised by a test that pins the version-1 identity step, giving a future version a slot-in template. | FR-3 |
| AC-6 | The full gate is green including the docs validator; roadmap.md carries no schema-version Known Issue; TDD.md states the classification table. | FR-6, NFR-1–3 |

## Edge Cases

- Empty storage → fresh default state (existing behaviour).
- Corrupt JSON → normalize-to-defaults (existing behaviour).
- v1 key present, v2 absent → one-time `migrateV1`, v2 written already stamped `schemaVersion: 1`; the v1 key is left in place (unchanged existing behaviour).
- Both keys present → v2 wins, v1 untouched (existing behaviour).
- `schemaVersion` present but the body damaged → corrupt path (body damage dominates).
- Unknown-version session with mutations: mutations apply to the in-memory default state only and are discarded on reload — the stored bytes are never touched (see A2).
- The module's parse memo must never cause a write-protected payload to be overwritten (plan-level detail).

## Dependencies

**Tracks:** none.

**External:** none.

## Open Questions & Assumptions

- **A1:** `schemaVersion` is a top-level number on the v2 payload; only the v2 key is versioned — the v1 key is legacy migration input, not versioned.
- **A2:** Write-protect mode is silent (no user-facing notice); mutations during such a session stay in-memory and are discarded on reload. Accepted trade-off: the rare older-app-reads-newer-data scenario must not destroy data, and losing one session's in-memory mutations is the cheaper failure.
- **A3:** The v1 key and read path remain exactly as they are.
- **A4:** A non-numeric `schemaVersion` is classified corrupt because it is indistinguishable from damage.

## References

- `docs/roadmap.md` — Known Issue "The stored payload carries no schema version"; Future-Work item 1
- `src/utils/storage.ts` — `V1_KEY`/`V2_KEY`, `readV1`, `ensureV2`, `saveV2`, `load`, `save`
- `src/game/profileLogic.ts` — `migrateV1`, `normalizeV2`
- `src/types/index.ts` (line 81) — the `AppStorage` interface
- `src/__tests__/utils/storage.test.ts`, `src/__tests__/game/profileLogic.test.ts`
