# Phase 1 Evidence — Author the pack

- **Track:** 20261126-retention-pilot-pack
- **Phase:** 1 — Author the pack
- **Date:** 2026-11-26
- **Branch:** `chore/20261126-retention-pilot-pack`
- **Base commit:** `d433e9f8b6cb249bb588580282b78b59c20de714`
- **Head commit (authoring):** `f3041476`
- **Prior evidence commit:** `f2aa6a8b`
- **Result:** verified — the full configured gate passed with exit 0 (run by the
  primary after the executor's shell permission denial; output appended to the
  phase brief).

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| full `verify_phase` (primary run) | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | 0 | Full chain passed. Biome: `Checked 375 files in 486ms. No fixes applied.` TypeScript: `tsc --noEmit` plus e2e project, no output. Vitest: `Test Files 158 passed (158)`, `Tests 3406 passed (3406)`; coverage: Statements 97.09% (7821/8055), Branches 90.93% (2347/2581), Functions 96.35% (1746/1812), Lines 98.23% (7251/7381). Vite: `✓ built in 2.63s` (pre-existing Phaser chunk-size warning only). Bundle, module-size, texture and PWA guards all passed (`Results: 16 passed, 0 failed` for PWA). Document validation: `Results: 5 passed, 0 failed`. |
| static (inspection) | native `read` of `docs/retention-pilot-pack.md` | 0 | All seven sections present; status, no-data attestation, blank fields, and relative links verified by inspection. |
| static (line endings) | native `grep` for `\r` in `docs/retention-pilot-pack.md` | 0 | No matches — LF-only, satisfying NFR-4. |
| git | `git status --short --branch`, `git log --oneline --max-count=5 HEAD` | 0 | Branch as briefed; base commit confirmed. |
| git | `git add docs/retention-pilot-pack.md`, `git commit -m "docs(retention): add blank retention pilot pack with no-data attestation"` | 0 | Authoring commit `f3041476`, one new file, 206 insertions. |

The executor's original attempt at the same command was denied by the shell
permission layer before execution; the primary ran it unchanged and supplied the
passing output recorded above. No command in the chain failed, and no retry or
workaround was used.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | Pack exists with status, recruitment, consent, evidence, checklist, worksheet and summary components | `docs/retention-pilot-pack.md` (status block plus §§2–7) | met |
| AC-2 | Status reads "Not run" and denies contact, interviews and export reads | `docs/retention-pilot-pack.md` lines 3 and 13–16 | met |
| AC-3 | Consent form blank, three evidence sources, withdrawal, signature/date lines | `docs/retention-pilot-pack.md` §3 | met |
| AC-4 | `.conductor/evidence/` named as gitignored, deletion on withdrawal | `docs/retention-pilot-pack.md` §4; `.gitignore` line 8 ignores all of `.conductor/` | met |
| AC-5 | Checklist covers Day 0/7/14, withdrawal and incomplete branches, no instrumentation step | `docs/retention-pilot-pack.md` §5 | met |
| AC-6 | Worksheet defines `E`, `R`, exclusions and ≥ 40 % as a directional benchmark only | `docs/retention-pilot-pack.md` §6 | met |
| AC-7 | Summary has counts, direction and incomplete cases with no identifier fields | `docs/retention-pilot-pack.md` §7 | met |
| FR-8 / AC-8 | Protocol and pack link to each other; validator 5 passed / 0 failed | Outbound link present in the pack; document validator `5 passed, 0 failed`. Inbound link is Phase 2 scope. | outbound link and validator met; inbound link deferred to Phase 2 |
| FR-9 | `node scripts/validate-docs.js` reports 5 passed / 0 failed | Primary-run gate output: `Results: 5 passed, 0 failed` | met |
| NFR-2 | No PII in tracked files | Document inspection: only blank fields and prohibition statements | met |
| NFR-3 | No collection, upload or network promise | Document inspection of §§1–7 | met |
| NFR-4 | LF line endings preserved | `grep` for `\r`: no matches | met |

## Evidence paths

- `docs/retention-pilot-pack.md` — the authored pack (authoring commit `f3041476`).
- `conductor/tracks/20261126-retention-pilot-pack/verification/phase-1.md` — this report.

## Deviations

None. Only `docs/retention-pilot-pack.md` was changed inside the phase `Touches`;
this evidence file is the one permitted extra path.

## Notes

- All six tasks were authored atomically as one new document and committed in a
  single conventional docs commit (`f3041476`); the primary may squash it with the
  evidence commits on acceptance.
- `docs/retention-validation.md` was deliberately left untouched: Phase 2 adds the
  inbound link. The pack links out to the protocol with a relative path only.
- No family was contacted, no interview held, no export read, and no raw evidence
  directory was created.
- The earlier permission blocker is resolved: the primary ran the exact command
  and it completed with exit 0. The only warning was a pre-existing Vite advisory
  about chunks larger than 500 kB; no guard failed.

## Primary verification

Independent verification by the orchestrator after the executor's report:

| Check | Command | Exit | Result |
| --- | --- | --- | --- |
| Working tree | `git status --porcelain --untracked-files=no` | 0 | Clean — no uncommitted changes. |
| Scope | `git diff --name-only d433e9f8..HEAD` | 0 | Exactly `docs/retention-pilot-pack.md` and this evidence file; matches `Touches` plus the permitted evidence path. |
| Commits | `git log --oneline d433e9f8..HEAD` | 0 | Three commits, all reported by the executor; no merge or user commits, so the squash guard passes. |
| Full gate (primary) | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | 0 | Already run by the primary after the executor's permission denial: 158 files / 3406 tests passed, coverage 97.09 % statements, all guards green, docs 5 passed / 0 failed. |
| Re-check after final evidence commit | `node scripts/validate-docs.js` | 0 | `Results: 5 passed, 0 failed`. |
| AC inspection | native read of `docs/retention-pilot-pack.md` | 0 | AC-1 through AC-7, AC-9, FR-9 and NFR-2–NFR-4 satisfied; AC-8's inbound link is Phase 2 scope as planned. |

Verdict: **accepted**. Phase 1 is verified. The delegated AC-8 remainder is covered by
Phase 2, so no phase criterion is silently dropped.
