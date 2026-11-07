# Review — Storage Resilience

- Track: `20261107-storage-resilience`
- Range reviewed: `26764e9f..2e1c9557` (round 2 reviewed `8dae4694..2e1c9557` plus the round-1 tail)
- Reviewer: `conductor-reviewer` subagent, two rounds
- Verdict: **pass with findings** — round 1 raised one High, round 2 confirmed it closed and raised seven smaller ones, all now closed

## Round 1 (`26764e9f..8dae4694`)

| ID | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| F1 | High | A refused `getItem` was indistinguishable from an empty store, so a read-blocked/write-open device rewrote its own save with defaults, cleared the degraded flag and hid the notice — and `SettingsPanel` calling `getSettings()` was itself the clearing write | Fixed in Phase R1: `readStorage` reports `{ raw, failed }`, a blocked session is memory-only and writes nothing, healing needs read evidence. The proving test was run against the Phase 1 file first and failed there |
| F2 | Low | `gameSceneBase.test.ts` left the module flag raised for the rest of the file | Fixed: `updateSettings({})` after `repairStorage()` |
| F3 | Low | `getStorage()`'s catch had no test — the third failure mode NFR-5 names | Fixed: a `localStorage` global that throws on access |
| F4 | Low | AC-8 claimed every new test fails pre-fix; 14 of 21 could run | AC-8 reworded with the reason, transcript checked in at `verification/red-run.md`, amendment dated in the spec |
| F5 | Low | The boot smoke gate was missing from the integrated evidence | Recorded in `integrated.md` and in the R1 evidence |

## Round 2 (`8dae4694..2e1c9557`)

| ID | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| F1 | Medium | A blocked boot memoized a placeholder keyed with `null`; a heal onto an empty store matched the cache and never reached `migrateV1(readV1())`, so a v1-only save was shadowed permanently | Fixed in Phase R2: the memo carries `provisional` and cannot satisfy the cache comparison. The new test seeds only `V1_KEY`, blocks reads, heals, earns a sticker and asserts both are persisted; removing the one guard term fails it alone |
| F2 | Medium | `docs/TDD.md` §6.6 still documented the code round 1 removed (the pre-`readsBlocked` snippet, "treats a refusal as an empty store", "the first successful moment heals"); `tech-stack.md` contradicted itself within one paragraph | Regenerated from the shipped file; both sentences corrected; the contradiction removed |
| F3 | Medium | The spec's "Reads fail, writes work" edge case still prescribed a write-heal, and FR-3/AC-3 promised "fresh defaults" without qualification | Edge case rewritten to the read-evidence rule with a dated amendment; FR-3/AC-3 qualified to "on first access" |
| F4 | Low | The `storage.ts` coverage tuple in `tech-stack.md` did not match a run | Replaced with the measurement from this phase's coverage run |
| F5 | Low | The round-1 red run recorded a filter that matches one test producing three failures, and the spec said "two tests" where three ran | Re-recorded with a filter that matches the three review tests; the spec says three |
| F6 | Low | `phase-2.md` still marked AC-7 unrun; severities disagreed between two tables in the R1 evidence | AC-7 points at the integrated run; severities aligned |
| F7 | Low | A journey comment claimed a degradation it never asserted; a helper doc said a failure "is not survivable today" of shipped code | Comment states what write refusal means; helper doc is past tense |

## What the review confirmed

- The guarded layer is total by construction: one `setItem` site, one `getItem`
  route, no `removeItem`/`clear` anywhere, and a refusal can never classify as
  `"missing"` or `"unknown"` without first passing the failure signal.
- The degraded flag is raised on failure only and cleared only inside an accepted
  write, so the notice cannot lie in either direction.
- Both deliberate memory-only paths still write nothing.
- The browser journey is not vacuous: a healthy-context case asserts
  `degraded === false`, and `addInitScript` patches only the two `Storage.prototype`
  methods, leaving the preview server, the service worker and Playwright's own
  instrumentation intact.
- The happy path is byte-identical on a working store, pinned by the existing
  suites plus one assertion that a recovered device receives the same raw string a
  healthy one would have.

## Overrides

None.

## Deferred

Nothing. The two roadmap-shaped suggestions from round 2 — write-read-back
verification for silently discarding stores, and documented precedence for merged
blocked states — are recorded in the round-2 evidence rather than as deferred
findings, because neither is a defect in this change.
