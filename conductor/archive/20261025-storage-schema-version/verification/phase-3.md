# Phase 3 Verification — Docs truth — TDD and roadmap

- **Track:** `20261025-storage-schema-version` — Storage Schema Version (chore, high)
- **Phase:** 3 — Docs truth — TDD and roadmap
- **Date:** 2026-10-25
- **Branch:** `chore/20261025-storage-schema-version`
- **Phase base:** `3d2692cc2d276c2d834b3655580e32220c91f542`
- **Head:** `0760b219` — `docs(roadmap): drop the delivered schema-version entries` (docs commits `271e4f89` + `0760b219`; the evidence commit for this file follows)
- **Result:** **verified** — docs work complete and engine-accurate; unit suite green; docs validator sandbox-denied and handed to the primary per the phase brief (see Commands and Notes).

## Tasks

| Task | Status | Commit |
| --- | --- | --- |
| P3.T1 — TDD storage section documents the versioned contract (FR-6) | done | `271e4f89` |
| P3.T2 — Roadmap cleanup (KI + FW-1 deleted, renumbered, date verified current) | done | `0760b219` |
| P3.T3 — Validator green | partial — `node scripts/validate-docs.js` denied by sandbox; handed to primary | — |

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| chained (exact brief form) | `pnpm test -- --run && node scripts/validate-docs.js` | denied | permission denied at shell — same known pattern as phase 2; run step-by-step in the same order below |
| unit | `pnpm test -- --run` | 0 | 121 test files / 2673 tests passed |
| docs validator | `node scripts/validate-docs.js` | denied | permission denied — **handed to the primary**; expected: "All document validation checks passed!" and exit 0 (invariant 4 requires both `## Known Issues` and `## Future Work / Roadmap` headings in `docs/roadmap.md`; both remain present, lines 11 and 23) |

**Handoff to primary:** run `node scripts/validate-docs.js` and append the exit/output under Primary verification. Nothing in this phase's edits removes either required roadmap heading, and all internal anchors (`#65-schema-versioning`, `#66-the-write-path-and-its-limitation`) were added together with their targets, so the expected result is exit 0.

## FR/AC coverage

| Item | Evidence (new wording / line numbers in `docs/TDD.md` at head `0760b219`) |
| --- | --- |
| FR-6 — TDD documents versioning contract | §6.5 "Schema versioning" (lines 733–748; ToC line 46): stamp paragraph line 735; classification table lines 737–742; unparseable-JSON sentence line 744; write-protect paragraph line 746; migrations paragraph line 748 |
| FR-6 — stamp, single write path | line 735: "stamped by the single write path (`saveV2`) from the `SCHEMA_VERSION` constant (currently `1`)"; §6.6 code block (lines 754–761) shows `JSON.stringify({ ...v2, schemaVersion: SCHEMA_VERSION })` at `src/utils/storage.ts:151-156` |
| FR-6 — classification table | lines 737–742 (quoted under Docs truth) |
| FR-6 — write-protect + A2 silence | line 746 (quoted under Docs truth) |
| FR-6 — identity migrate step, no registry | line 748: "`migrateFromVersion1()`, is the identity and stands as the template — each future version adds one step that accepts its stored shape and returns the current one." |
| FR-6 — facade table row retired `load`/`save` | §6.3 line 710: `| Read/write state | `ensureV2` (internal), `mutate` (internal) |` |
| FR-6 — `AppStorage` sentence rewritten | §6.2 line 702 (quoted under Docs truth) |
| FR-6 — §6.5 unguarded-`setItem` discussion stays truthful | §6.6 keeps the stamped code block (source comment `// FR-1: ...` quoted verbatim) and the unchanged unguarded-`setItem` paragraph (line 763); no invented try/catch |
| AC-6 — full gate green incl. docs validator | unit suite green (2673 passed); validator handoff to primary (above) |
| AC-6 — roadmap has no schema-version KI / FW-1 | Docs truth section below — heading list after edits |

## Docs truth

### New classification table (docs/TDD.md §6.5, lines 737–742)

| Stored `schemaVersion` | Classification | What the reader does |
| --- | --- | --- |
| field missing | implicit version 1 | served; stamped on the next write |
| `1` | known | served |
| any other number | unknown | write-protected — in-memory defaults are served, the stored bytes are never touched |
| `"1"`, `null`, any non-number | corrupt | the existing normalise-to-defaults path |

Rewritten `AppStorage` sentence (docs/TDD.md §6.2, line 702):

> `AppStorage` (`{ stickers, settings }`) survives only as the one-time v1→v2 migration input type — the `Partial<AppStorage>` shape `migrateV1()` consumes — not as a stored format.

### Post-edit roadmap heading list (docs/roadmap.md at head `0760b219`)

```
line  1: # Aby's Little Lab — Known Issues and Roadmap
line  7: Every entry below was checked against the code on 2026-10-25.   ← date already current (P3.T2.2, no edit)
line 11: ## Known Issues
line 13: ### Five copies of the same shuffle, and an RNG seam in only two modules   ← the only Known Issue; "The stored payload carries no schema version" KI is gone
line 23: ## Future Work / Roadmap
line 28: 1. **One shuffle, one RNG seam.** ... Track: *shared-random-helpers*.   ← renumbered from 2; "Version the stored payload." (Track: *storage-schema-version*) is gone
```

## Deviations

None. Only `docs/TDD.md` and `docs/roadmap.md` were edited, via the `edit` tool only (CRLF preserved), plus this evidence file.

## Notes

- Edits (7 in `docs/TDD.md`, 2 in `docs/roadmap.md`): ToC gained `6.5 Schema versioning` and renumbered the write-path entry to 6.6 (lines 46–47); §6.2 AppStorage sentence; §6.3 facade row; §6.4 ensureV2 list gained the classification step 2; new §6.5 (intro, table, write-protect, migrations); §6.6 renumbered heading with the stamped `saveV2` block at `src/utils/storage.ts:151-156` and the source's `// FR-1:` comment quoted verbatim; roadmap KI deletion and FW deletion + renumbering.
- Content was written engine-accurate against `src/utils/storage.ts` at the phase base (`3d2692cc`): `SCHEMA_VERSION = 1`, `classifyStoredV2` four-way classification, unknown write-protect + in-memory `mutate` path (A2, silent), cache keyed by the protected raw string, identity `migrateFromVersion1`, unguarded `setItem` in `saveV2`.
- A read-only `git diff` preview command was also denied at shell; per the no-retry rule it was skipped (it was informational — edit verification used the native read/grep tools instead). Not a verification check; not blocking.
- P3.T3 is partial pending the primary's validator run; the exact command and expected output are recorded in the Commands section.

## Primary verification

Independent verification by the primary (2026-10-25): working tree clean;
git diff --name-only 3d2692cc..HEAD = docs/TDD.md + docs/roadmap.md +
evidence only (within Touches); commit chain matches the report with no
merges (squash guard pass). Roadmap confirmed: the schema-version Known Issue
and Future-Work item are gone, "One shuffle, one RNG seam" is the only Known
Issue and Future-Work item 1, and line 7 still reads "checked against the code
on 2026-10-25". TDD confirmed: new section 6.5 "Schema versioning" with the
four-way classification table exactly per FR-2, write-protect paragraph per
FR-4 with the A2 trade-off verbatim, identity migrate step per FR-3,
stamped saveV2 block at storage.ts:151-156 per FR-1, AppStorage sentence
rewritten as the migration input per FR-5, facade table row without
load/save, ToC updated. Docs validator run by the primary after sandbox
denial: node scripts/validate-docs.js exit 0, "All document validation
checks passed!". Unit suite 2673/2673 (executor run). Result: accepted;
squashed to checkpoint b3e5d9b1.

## Phase R1 (review fixes)

- Goal: resolve F1 (stale Phase 3 Status field) and F2 (TDD migration sentence).
- F2: docs/TDD.md section 6.5 migration sentence now states that a future
  version bump must also extend classifyStoredV2 to recognize the older
  stamped version as a known older version, otherwise existing payloads
  classify as unknown and stay write-protected with the new step unreachable.
  Docs validator: exit 0 (run by the primary).
- F1: Phase 3 Status set to verified in the R1 state commit (conductor state,
  primary-owned).
- Checkpoint: e61a7d8d (docs(storage-schema): resolve review findings F1 and F2).
- Result: verified - both findings resolved; suite unaffected (docs-only).
