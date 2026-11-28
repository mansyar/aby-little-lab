# Phase 5 Verification - Release v1.28.0

- Track: `20261128-release-v1-28-0` — Release v1.28.0
- Phase: 5 — Post-merge ship runbook
- Date: 2026-11-28
- Branch: `chore/20261128-release-v1-28-0`
- Phase base: `3127634fb07d0c8f0168832664c319502cf6c33d`
- Result: **verified** — the exact post-merge runbook is recorded in the DRAFT notes; no external mutation or tag was performed.

## Scope and boundary

Phase 5 prepared documentation only. The notes remain **Status DRAFT**, Tag
**pending**, and every CI/deploy/live field **pending**; this phase does not
claim the release shipped. No merge, issue closure, tag, push, deploy, live
change or Conductor state edit occurred. The two touched files are
`docs/release-notes-v1.28.0.md` and this evidence file.

## Commands and results

| Command | Result |
| --- | --- |
| `git ls-remote --tags origin refs/tags/v1.28.0` | exit 0, **no output** — no remote `v1.28.0` tag exists. PASS. |
| `git tag -l v1.28.0` | **permission denied** (`Permission denied: shell`) — expected empty output. See Blockers; local absence independently confirmed by read-only inspection below. |
| `node scripts/validate-docs.js && pnpm check` | exit 0 — `validate-docs` 5 passed / 0 failed ("All document validation checks passed!"); `pnpm check` → `biome check`, "Checked 393 files in 740ms. No fixes applied." PASS. |

## Tag-collision preflight

- Remote: `git ls-remote --tags origin refs/tags/v1.28.0` returned empty output,
  so origin has no `v1.28.0` tag.
- Local: the `git tag -l v1.28.0` shell command was denied. Per the no-retry
  rule it was not rephrased or split. Read-only inspection confirmed local
  absence instead:
  - `.git/refs/tags` holds no loose tag refs (0 entries).
  - `.git/packed-refs` lists tags only through `refs/tags/v1.27.0`
    (`5d1884a4d2312e8dc47e92aa80cd2f96eaefc4d1`, peeled
    `^019a26cdb3aea11f41b92d02af37374101b57b58`); there is no `v1.28.0` line.
- Conclusion: `v1.28.0` is absent locally and on origin. No tag was created,
  pushed, moved or deleted. The runbook requires this preflight to pass again
  immediately before the authorized tag.

## Runbook content recorded in the DRAFT notes

A `## Post-merge Ship Runbook` section was added to
`docs/release-notes-v1.28.0.md` with three parts:

1. **Merge and issue #108 closure** — only an explicit **Merge now** authorizes
   the merge and local/remote branch cleanup; merge approval does not authorize
   tagging. After `MERGED` is verified, close #108 with the exact prepared
   comment (placeholder `#<release-pr>`), citing PR #110 plus the merged release
   PR as evidence; never close before the merge is confirmed.
2. **Authorized tag, deploy and live verification** — tagging needs a separate
   explicit go-ahead. Ordered steps: (1) merge with configured `merge` method
   only after approval and green required checks, verify `MERGED`, delete local
   and remote release branches; (2) fetch `master`, require clean tree and the
   release merge at HEAD; (3) require no local/remote `v1.28.0` tag, create one
   annotated tag at merged HEAD and push it once, never move/delete/recreate it;
   (4) require tag Quality Gates, both Browser Journeys shards, engine matrix
   and rollup, plus Deploy to Coolify to pass; (5) verify live HTTP 200, title
   `Aby's Little Lab`, embedded `1.28.0`, local/remote shell SHA-256 equality,
   `sw.js` naming the served shell, and `manifest.webmanifest` HTTP 200.
3. **FINAL notes and rollback** — stay DRAFT until all ship evidence exists,
   then flip to FINAL with tag target, CI run IDs, deploy/live URL, served
   shell/hash/version, service-worker/manifest results and
   `SKIPPED — accepted gap`; post-tag finalization is docs/Conductor-only.
   Rollback: revert the release PR before tag; after tag/deploy never move or
   delete the published tag — revert with a reviewed follow-up and cut a patch
   release if needed. No migration means no user-data rollback.

## Requirement matrix

| ID | Status | Evidence / remaining gate |
| --- | --- | --- |
| FR-2 | covered pre-ship | Notes stay DRAFT; FINAL flip is runbooked, not executed. |
| FR-6 | boundary recorded | Explicit **Merge now** gate and configured `merge` method in the runbook; actual merge remains post-phase. |
| FR-7 | prepared | Exact #108 completion comment and evidence requirement recorded; closure occurs only after merge. |
| FR-8 | runbook only | Separate explicit go-ahead, clean merged HEAD, no tag collision, one annotated tag push; no tag created here. |
| FR-9 | runbook only | Tag CI/Coolify/live checks and FINAL flip recorded; execution remains post-authorization. |
| NFR-3 | pass | Conventional `docs` commit only; no force-push, reset, tag mutation or history rewrite. |
| NFR-5 | covered by runbook | Revert before tag; never move/delete a published tag; patch release for shipped defects; no data migration. |
| AC-2 | covered pre-ship | DRAFT-before-ship and FINAL-after-verification rule recorded with accepted device gap. |
| AC-6 | boundary recorded | Green required checks precede the authorized merge. |
| AC-7 | prepared | #108 comment links #110 and the release PR evidence. |
| AC-8 | runbook only | `v1.28.0` on origin only after explicit authorization, pointing to merged HEAD; preflight confirms it does not yet exist. |
| AC-9 | runbook only | Tag CI, Coolify, live HTTP/title/version/hash/service-worker/manifest checks and FINAL notes remain gated. |

## Task matrix

| Task | Status | Evidence |
| --- | --- | --- |
| P5.T1 / P5.T1.1 | done | Merge/issue-closure boundary and verbatim #108 comment in the runbook. |
| P5.T2 / P5.T2.1 | done | Separate go-ahead, clean HEAD, no-collision, one annotated push, green tag CI/Coolify and five live checks recorded. |
| P5.T3 / P5.T3.1 | done | DRAFT→FINAL gate, docs/Conductor-only finalization, never-move-tag rollback and no-migration note recorded. |

## Evidence paths

- `docs/release-notes-v1.28.0.md` — DRAFT notes with the new `Post-merge Ship Runbook` section.
- `conductor/tracks/20261128-release-v1-28-0/verification/phase-4.md` — issue #108 comment template and PR/merge boundary carried forward verbatim.
- `.git/refs/tags` and `.git/packed-refs` — read-only local tag-absence confirmation.

## Deviations

None. Only the two allowed files were changed.

## Blockers

- Command: `git tag -l v1.28.0`
  - Why: required read-only local tag-collision preflight; both local and remote checks must be empty.
  - Expected: empty output (no local `v1.28.0` tag).
  - Result: permission denied (`Permission denied: shell`). Not retried, rephrased or split. Local absence was confirmed with permitted read tools (see above); the primary may run the command directly to reproduce the expected empty output.

## Notes

- The primary runs the full ten-command gate independently; only
  `node scripts/validate-docs.js && pnpm check` was in this phase's brief.
- No external mutation occurred: no issue, PR, tag, deploy or live system was touched, and no tag was created. The `v1.28.0` tag, CI runs, deploy and live verification remain explicitly pending a separate authorization.

## Primary verification

The primary independently reproduced the denied local tag check and ran the complete final gate on `532a7aae`:

| Command | Result |
| --- | --- |
| `git tag -l v1.28.0` | exit 0, **no output** — no local `v1.28.0` tag. PASS. |
| `git ls-remote --tags origin refs/tags/v1.28.0` | exit 0, **no output** — no remote `v1.28.0` tag. PASS. |
| `git -c core.whitespace=cr-at-eol diff --check` | exit 0, no whitespace errors. PASS. |
| Exact ten-command `verify_phase` chain | exit 0 — Biome 393 files; app + e2e typecheck; 165 files / 3,559 tests; coverage 96.91 statements / 90.23 branches / 96.22 functions / 98.06 lines; build 501 modules; bundle, module-size, textures, PWA and docs validators all PASS. |

The subagent's local-tag shell denial is therefore resolved by primary evidence. Phase 5 is accepted at checkpoint `532a7aae`; no external mutation occurred.
