# Phase 1 Evidence — Version metadata and DRAFT release notes

- **Track:** `20261127-release-v1-27-0` — Release v1.27.0
- **Phase:** 1 — Version metadata and DRAFT release notes
- **Date:** 2026-11-27
- **Branch:** `chore/20261127-release-v1-27-0`
- **Base commit:** `bc3508d252361b748047c802504d6f1e2943bcdf`
- **Head commit (at verification):** `abcc28fe` — `docs: finalize v1.27.0 phase 1 gate evidence`
  (preceded by `faa0fd2a` — DRAFT notes/index entry, and `d7e7ad85` — version bump)
- **Result:** verified — the exact `verify_phase` chain exited 0 when run unchanged by the primary
  from the repository root, and `pnpm install --frozen-lockfile` exited 0 with no dependency drift.
  No gate was skipped, split, rephrased or replaced. All Phase 1 tasks (P1.T1, P1.T2, P1.T3) are
  done. This is a Phase 1 checkpoint result; the final release-candidate gate (AC-4) belongs to
  Phase 3.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Version | `pnpm version 1.27.0 --no-git-tag-version` | denied (`permission.rejected: shell`) | Required by P1.T1.1. Not retried or rephrased. The permitted `edit` tool applied the equivalent single-field `package.json` change; `pnpm-lock.yaml` has no root package-version field, so no lockfile edit was needed. |
| Setup | `pnpm install --frozen-lockfile` | 0 | Lockfile up to date, resolution skipped, no dependency drift. Output below. |
| Verify (primary) | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | 0 | Exact command from the brief, run unchanged by the primary from the repository root. All ten steps passed; figures below. |
| Git inspection | `git status --short`, `git diff --stat` | 0 | Clean tree after frozen install; confirms no lockfile or dependency drift. |
| Commit | `git commit -m "chore: bump release version to 1.27.0"` | 0 | `d7e7ad85`, one file changed. |
| Commit | `git commit -m "docs: draft v1.27.0 release notes and index entry"` | 0 | `faa0fd2a`, two files changed, 62 insertions. |

### `pnpm install --frozen-lockfile` — actual output

```
Agent skills awaiting approval: phaser.
Run "pnpm approve" to review them.
✓ Lockfile passes supply-chain policies (verified 3d ago)
Lockfile is up to date, resolution step is skipped
Done in 274ms using pnpm v12.16.1
```

### Exact `verify_phase` chain — primary output (exit 0)

Run unchanged from the repository root by the primary after the phase executor's shell denial:

- Biome: 378 files checked, no fixes.
- TypeScript: app and E2E clean.
- Vitest: 159 files / 3,454 tests passed.
- Coverage: statements 97.12%, branches 91.05%, functions 96.4%, lines 98.25%.
- Vite: 493 modules; shell `index-DF9s1m1B.js`; only the pre-existing Phaser chunk advisory.
- Bundle guard: shell 196.3 kB; module-size zero warnings; texture guard passed.
- PWA: 16 passed / 0 failed, 53 chunks precached.
- Docs: 5 passed / 0 failed.

These are the actual measured figures for this checkpoint. They are not inherited from prior
releases, and they are not a claim about the final release candidate, tag, deployment or live build.

## Acceptance criteria (Phase 1 scope)

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| FR-1 / AC-1 | `package.json` is `1.27.0`; frozen install passes with no lockfile drift. | `package.json` reads `"version": "1.27.0"`; frozen-install output above; `git diff --stat` clean after install; lockfile has no root version field. | pass |
| FR-2 / AC-2 | Notes follow the established structure, cover #102–#105, lead with #104/#105, label #102/#103 internal and unexecuted. | `docs/release-notes-v1.27.0.md`: title, Status/Tag/Base block, intro, What Shipped Since v1.26.1, Installation, Release Verification, Known Issues; PR #104 then #105 lead; #102/#103 marked internal and not executed. `FINAL` is explicitly gated on deploy proof (later phases). | pass (DRAFT scope) |
| FR-3 / AC-3 | README links the notes; release row and 24-game wording. | Documentation index now links `docs/release-notes-v1.27.0.md` newest-first. Releases table row and game-count wording are outside this phase's `Touches` and remain for Phase 2. | partial by phase scope |
| FR-4 / NFR-3 | Distinguish measured local checks, CI-emulated browsers, physical-device coverage and retention evidence; no unsupported claim. | `Release Verification` separates the measured local checkpoint gate (exit 0, figures above), emulated CI browsers (not device evidence), physical device (`pending — SKIPPED — accepted gap`), retention (`none`), and tag/deploy/live (pending). No device, retention, tag, deploy or live result is claimed. | pass |
| NFR-1 / AC-11 | No runtime, asset, dependency, schema, storage or network change; no unsupported claims. | Phase diff is `package.json` version, one README index line and one new doc. No source/asset/dependency/schema/storage file changed. Final whole-branch diff check belongs to Phase 5. | pass (phase scope) |
| NFR-4 | Historical notes, perf records, browser evidence and archived tracks intact. | No historical document modified; new notes added beside them. | pass |
| FR-5 gate checkpoint (final AC-4 deferred to Phase 3) | Exact full gate exits 0 at this phase checkpoint; the final-release-candidate AC-4 verdict belongs to Phase 3 and is not claimed here. | Exact configured chain run unchanged by the primary exited 0 with the measured figures recorded above. No final-candidate, tag or live verdict is implied. | pass (checkpoint only) |

## Evidence paths

- `package.json` — version `1.27.0` (commit `d7e7ad85`)
- `docs/release-notes-v1.27.0.md` — DRAFT notes (commit `faa0fd2a`)
- `README.md` — Documentation index link (commit `faa0fd2a`)
- Task commits: `d7e7ad85`, `faa0fd2a`, `abcc28fe` (no tag created)

## Deviations

- `package.json`: `pnpm version 1.27.0 --no-git-tag-version` was permission-denied. The permitted
  `edit` tool applied the same one-line version change instead. `pnpm-lock.yaml` needs no change;
  frozen installation confirms no dependency drift.
- `README.md`: only the Documentation index line was added. The Releases table and game-count
  wording were left untouched because they are outside this phase's `Touches` (Phase 2 scope).

## Notes

- The phase executor's shell denied the exact gate command; the primary ran it unchanged from the
  repository root and it exited 0. No gate was skipped, split, rephrased or replaced, and the
  denial is retained in the Commands table and Deviations for auditability.
- P1.T1, P1.T2 and P1.T3 are all done. Task commits are `d7e7ad85` and `faa0fd2a`; this
  finalization commit updates only the release notes and this evidence file. No tag was created.
- The release notes reference this evidence by plain code-form path rather than a markdown link,
  because the track moves to `conductor/archive/` in the completion commit and a live link to the
  active track would break after archival.
- No tag, deployment, live check, physical-device pass, retention result or longitudinal-band
  measurement is claimed anywhere in this phase. The final release-candidate gate (AC-4) remains
  a Phase 3 responsibility.

## Primary verification

- **Verdict:** accepted.
- **Final executor head:** `abcc28fe`; all three executor commits (`d7e7ad85`, `faa0fd2a`, `abcc28fe`) were reported, and the phase range contains no merge or unrelated commit.
- **Scope:** `git diff --name-only bc3508d252361b748047c802504d6f1e2943bcdf..HEAD` contains only `package.json`, `README.md`, `docs/release-notes-v1.27.0.md`, and this evidence file, matching Phase 1 Touches.
- **Gate:** the primary ran the exact configured chain unchanged and it exited 0 (3,454 tests; coverage 97.12 / 91.05 / 96.4 / 98.25; build and all guards passed; docs 5/0).
- **Frozen install:** executor evidence records `pnpm install --frozen-lockfile` exit 0 with no lockfile drift.
- **Acceptance:** version is `1.27.0`; notes remain DRAFT, cover #102–#105 in the required order and truth boundaries, and README links the notes. The release-notes evidence path is plain code text so archival cannot break a link.
- **Deviations accepted:** equivalent one-field version edit after the denied `pnpm version` command; README limited to the Documentation index as required by Phase 1 Touches.
- **Checkpoint:** 8f1134ae (recorded after the primary squash).
