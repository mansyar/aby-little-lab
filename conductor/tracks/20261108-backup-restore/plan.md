# Backup and Restore — Implementation Plan

> **Branch:** `feat/20261108-backup-restore`
> **Base:** `master` @ `8029cfad`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, `blocked`.
> Only the primary agent writes this file. A phase subagent reports, the primary
> verifies and records.

## Phase 1: The file format, as pure logic

- **Goal:** A save becomes a verified envelope and comes back unchanged, and five
  kinds of damage are each refused by name, with no browser API involved.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-4, FR-5, NFR-4, AC-1, AC-2, AC-6, AC-8
- **Touches:** `src/utils/backupFormat.ts`, `src/__tests__/utils/backupFormat.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified
- [x] **P1.T1: Build and read the envelope** - covers: FR-1, FR-2
  - **P1.T1.1:** Write the envelope with `format`, `formatVersion`, `schemaVersion`, `appVersion`, `exportedAt`, `checksum` and the normalised save as `payload`
  - **P1.T1.2:** Hash the canonical `JSON.stringify(payload)` with a 64-bit non-cryptographic hash, documented as corruption detection rather than protection
  - **P1.T1.3:** Parse a candidate file into a value or a named refusal, covering not-JSON, wrong `format`, newer `formatVersion`, newer `schemaVersion` and checksum mismatch
- [x] **P1.T2: Decide what an import would write** - covers: FR-5
  - **P1.T2.1:** Compute the merge as the better of each field per matching profile, and the added profiles whose ids are new, without touching storage
  - **P1.T2.2:** Apply the four-profile cap as a refusal of the whole import when an incoming profile cannot fit
  - **P1.T2.3:** Prove idempotence: merging the same payload twice equals merging it once
- [x] **P1.T3: Prove the format cannot lie about itself** - covers: AC-1, AC-2, AC-6, AC-8
  - **P1.T3.1:** Table-driven test for the five refusals, each asserting its own sentence and an untouched input
  - **P1.T3.2:** A v1-only save exports as a v2 payload carrying the migrated content

**Result:** verified - a save wraps in a versioned envelope whose checksum covers exactly the payload, an import plans a merge best-of-field or a replace, and six named refusals cover every damaged, foreign, newer or oversized file. 40 new tests, 303 files lint-clean, 3,025 tests green, coverage 97.26/91.48/96.18/98.24, shell entry unchanged.
**Checkpoint:** 839fe57b
**Evidence:** conductor/tracks/20261108-backup-restore/verification/phase-1.md

## Phase 2: The browser seam, and the write it performs

- **Goal:** A tap downloads a real file, a chosen file comes back in, and the only
  module that names a DOM global is the one written for it.
- **Depends on:** Phase 1
- **Covers:** FR-3, FR-5, FR-6, FR-7, FR-8, NFR-1, NFR-2, AC-5, AC-7, AC-10
- **Touches:** `src/utils/backupFile.ts`, `src/utils/storage.ts`, `src/__tests__/utils/backupFile.test.ts`, `src/__tests__/utils/storage.test.ts`, `src/__tests__/guard/backupDom.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified
- [x] **P2.T1: One module owns the browser** - covers: FR-3, NFR-1, NFR-2
  - **P2.T1.1:** Export through a Blob and a temporary anchor, with the object URL revoked and the filename dated
  - **P2.T1.2:** Import through a hidden file input, resolving to the file's text, removing the input afterwards, and never asking the parent to type
- [x] **P2.T2: Write through the save layer** - covers: FR-5, FR-6, FR-8
  - **P2.T2.1:** Apply a merge as one write, keeping the device's settings
  - **P2.T2.2:** Apply a replace as one write of the payload, with the same schema-version refusal rules
- [x] **P2.T3: Refuse rather than half-apply** - covers: FR-7, AC-5, AC-7, AC-10
  - **P2.T3.1:** Refuse both imports while persistence is degraded, and leave export working
  - **P2.T3.2:** Guard test: no production module outside `src/utils/backupFile.ts` names `document`, `Blob`, `URL` or `crypto`

**Result:** verified - one module owns every browser call, the save exports as text and imports through a single mutate, and a device that cannot save refuses instead of pretending. 3,044 tests, coverage 97.28/91.52/96.21/98.25, shell entry unchanged at 158.5 kB. The guard enumerates the six modules that may name a DOM global, including the five that already did, and its teeth are proved.
**Checkpoint:** 6f58106b
**Evidence:** conductor/tracks/20261108-backup-restore/verification/phase-2.md

## Phase 3: The second Settings page

- **Goal:** A parent reaches the backup in one tap without a single existing row
  moving, and reads what happened in words.
- **Depends on:** Phase 2
- **Covers:** FR-9, FR-10, NFR-7, AC-9
- **Touches:** `src/components/SettingsPanel.ts`, `src/components/settings/primitives.ts`, `src/__tests__/components/SettingsPanel.test.ts`, `src/game/e2eBridge.ts`, `src/scenes/HubScene.ts`, `src/__tests__/game/e2eBridge.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending
- [ ] **P3.T1: The page and its two actions** - covers: FR-9, FR-10, NFR-7
  - **P3.T1.1:** Add the switch card in the header band and the second page, leaving page one's eight rows at their current coordinates and hit bands
  - **P3.T1.2:** Export and Restore rows with the merge-or-replace confirmation, and a result line that states numbers or the reason for a refusal
- [ ] **P3.T2: Let a journey see it** - covers: FR-9
  - **P3.T2.1:** Publish the current page, the switch card's point, the action rows' points and the result line through the `?e2e=1` bridge, read-only and inert without the parameter

## Phase 4: The round trip, and the record

- **Goal:** One journey proves a save crosses into an empty browser and survives a
  reload, and the documents say how.
- **Depends on:** Phase 3
- **Covers:** FR-11, FR-12, NFR-5, NFR-6, AC-3
- **Touches:** `e2e/journeys/backup.spec.ts`, `e2e/fixtures/`, `README.md`, `docs/TDD.md`, `docs/perf-baseline.md`, `conductor/product.md`
- **Verification:** `pnpm test:e2e && pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending
- [ ] **P4.T1: Export, carry, restore, reload** - covers: FR-11, AC-3
  - **P4.T1.1:** Seed a save, take the real download, and read the file that lands on disk
  - **P4.T1.2:** Import that file into a fresh context with empty storage through the file chooser
  - **P4.T1.3:** Assert profiles, stickers, progress and insights after the reload, and that a second import changes nothing
- [ ] **P4.T2: Say how it works** - covers: FR-12, NFR-5, NFR-6
  - **P4.T2.1:** Document the envelope, the five refusals and the DOM seam in `docs/TDD.md`, and name the backup in `README.md`
  - **P4.T2.2:** Record the roadmap row as done with what shipped and what was deliberately left out, and refresh the living counts

<!-- Review fixes are appended by conductor-review as:

## Phase R1: Review Fixes
- **Goal:** Resolve review findings
- **Depends on:** <last phase>
- **Covers:** <findings>
- **Touches:** <paths>
- **Verification:** <command>
- **Status:** pending
- [ ] **R1.T1: Resolve <finding ID>**
-->
