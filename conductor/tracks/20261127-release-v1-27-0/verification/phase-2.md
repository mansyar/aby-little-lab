# Phase 2 Evidence — README and release documentation truth

- **Track:** `20261127-release-v1-27-0` — Release v1.27.0
- **Phase:** 2 — README and release documentation truth
- **Date:** 2026-11-27
- **Branch:** `chore/20261127-release-v1-27-0`
- **Base commit:** `1d8def62c26f8c95bc7555d04cb5e8e285ad38ad`
- **Head commit (at verification):** `b66bfe30` — `docs(conductor): record phase 2 evidence and gate blockers`
  (preceded by `10a2c761` — `docs(readme): add v1.27.0 row and correct 24-game counts`; these are the phase's
  two task commits)
- **Result:** verified — the exact `verify_phase` chain exited 0 when run unchanged by the primary from the
  repository root, and `git -c core.whitespace=cr-at-eol diff --check` exited 0 with no output. All four Phase 2
  tasks (P2.T1–P2.T4) are done. This is a Phase 2 checkpoint result; the final release-candidate gate (AC-4)
  belongs to Phase 3.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Git inspection | `git status --short --branch`, `git diff --stat`, `git diff -- README.md` | 0 | Working tree clean at phase start; final diff was 4 insertions / 3 deletions, all in `README.md`, with no historical row, note or evidence change. |
| Commit | `git commit -m "docs(readme): add v1.27.0 row and correct 24-game counts"` | 0 | `10a2c761`, one file changed. |
| Verify (primary) | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | 0 | Exact command from the brief, run unchanged by the primary from the repository root. All ten steps passed; figures below. The executor's attempt was denied by shell permissions and was not retried or rephrased. `validate-docs.js` is the authoritative link/anchor and game-list check. |
| Whitespace (primary) | `git -c core.whitespace=cr-at-eol diff --check` | 0 | No output. Exact command from the brief, run unchanged by the primary. The executor's attempt was denied and was not retried or rephrased. |
| Commit | `git commit -m "docs(conductor): record phase 2 evidence and gate blockers"` | 0 | `b66bfe30`, evidence file added. |
| Targeted inspection | native `grep` over `README.md` for count wording, new row and trailing whitespace | 0 | Confirms the five expected lines; no `Twenty-two mini-games` or `23-tile board` remains; no trailing whitespace in `README.md`. Supplementary to the primary's gate run. |

### Exact `verify_phase` chain — primary output (exit 0)

Run unchanged from the repository root by the primary after the phase executor's shell denial:

- Biome: 378 files checked, no fixes.
- TypeScript: app and E2E clean.
- Vitest: 159 files / 3,454 tests passed.
- Coverage: statements 97.11%, branches 91.01%, functions 96.4%, lines 98.25%.
- Vite: 493 modules; shell `index-DF9s1m1B.js`; only the pre-existing Phaser chunk advisory.
- Bundle guard: shell 196.3 kB; module-size zero warnings; texture guard passed.
- PWA: 16 passed / 0 failed.
- Docs: 5 passed / 0 failed.

These are the actual measured figures for this phase checkpoint. They are not inherited from Phase 1 or an
earlier release, and they are not a claim about the final release candidate, tag, deployment or live build.

### `git -c core.whitespace=cr-at-eol diff --check` — primary output

Exit 0, no output.

## Targeted README inspection (executor, exit 0)

| Check | Expected | Observed |
| --- | --- | --- |
| Intro game count | Twenty-four | `README.md:3` reads "Twenty-four mini-games". |
| Mini-Games section lead | Twenty-four, hub order | `README.md:118` reads "Twenty-four mini-games in hub order". |
| Hub board count | 24 tiles | `README.md:183` reads "restores the 24-tile board byte-for-byte". |
| Release row | Newest-first `v1.27.0`, 2026-11-27, notes link | `README.md:238`, directly above the `v1.26.1` row; Tag cell marked `(pending)` so no tag is claimed. |
| Notes link target | `docs/release-notes-v1.27.0.md` exists | Present; existing link in the Documentation index (`README.md:288`) unchanged. |
| Historical text | Rows, notes and evidence verbatim | `git diff -- README.md` shows only the four intended changed/added lines; `docs/release-notes-v1.27.0.md` and all prior release notes untouched. |
| Trailing whitespace | none | Native grep for `[ \t]+$` over `README.md`: no matches (supplementary only). |

## Acceptance criteria (Phase 2 scope)

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| FR-3 / AC-3 | README has a newest-first `v1.27.0` row dated 2026-11-27 with the notes link, summarizing all four PRs, leading with #104/#105 and labeling #102/#103 internal. | `README.md:238`: row above `v1.26.1`, 2026-11-27, `[Release notes](docs/release-notes-v1.27.0.md)`, #104 and #105 lead, #102/#103 "internal, unexecuted"; tag marked pending. | pass |
| FR-3 / AC-3 | Current game-count wording is 24 in the intro, Mini-Games heading and Hub board. | `README.md:3`, `:118` and `:183`; targeted grep confirms no stale "Twenty-two mini-games" or "23-tile board" remains. | pass |
| FR-4 / NFR-4 / AC-2 | Release truth: no tag, deploy, live, physical-device, retention or longitudinal claim; DRAFT notes preserved. | New row says "Tag, deploy and device results pending"; Tag cell `(pending)`; `docs/release-notes-v1.27.0.md` untouched and still `Status: DRAFT` with pending/failed-by-design entries; no historical note edited. | pass |
| NFR-4 / AC-11 | README links and anchors resolve; historical notes and evidence preserved verbatim. | Link target exists and existing links untouched; `git diff -- README.md` scoped to four lines; primary's `validate-docs.js` passed 5/0 with full link/anchor and game-list checks. | pass |
| NFR-3 | Exact gate exits 0; whitespace check clean; phase evidence recorded. | Primary's exact `verify_phase` chain exited 0 with the figures above; primary's `git -c core.whitespace=cr-at-eol diff --check` exited 0 with no output; this evidence file records commands, ACs and results. | pass |

## Evidence paths

- `README.md` (committed as `10a2c761`)
- `docs/release-notes-v1.27.0.md` (unchanged this phase; Phase 1 DRAFT)
- `conductor/tracks/20261127-release-v1-27-0/verification/phase-1.md` (prior checkpoint, referenced only — figures not inherited)
- `conductor/tracks/20261127-release-v1-27-0/verification/phase-2.md` (this file)

## Deviations

None. All edits stayed inside `Touches`; `docs/release-notes-v1.27.0.md` required no edit because its Phase 1
DRAFT already satisfies the phase's truth boundaries.

## Notes

- The executor's two denied shell commands were resolved by the primary running both unchanged; each exited 0,
  and the actual output is recorded above. The executor did not retry, rephrase or substitute either command.
- All Phase 2 tasks are done. README work is committed as `10a2c761`; the evidence file was first committed as
  `b66bfe30` and finalized with the primary's verified output in a subsequent evidence-only commit.
- This remains a phase checkpoint; the final release-candidate gate (AC-4) belongs to Phase 3. No physical-device,
  retention, longitudinal, tag, deployment or live-verification result is claimed.

## Primary verification

- **Verdict:** accepted.
- **Working tree:** clean before acceptance; phase diff contains only `README.md` and this evidence file.
- **Scope:** `git diff --name-only 1d8def62..HEAD` returned exactly the two allowed files. All three executor commits were reported; no merge commits or unrelated commits exist in the range.
- **Independent gate:** `node scripts/validate-docs.js` exited 0 with 5 passed / 0 failed. The executor's exact ten-command gate and CRLF-aware whitespace check were independently run by the primary and passed as recorded above.
- **Acceptance criteria:** the new release row is newest-first, linked and truthful; current game and tile counts are 24; DRAFT/tag/deploy/device/retention/longitudinal claims remain correctly pending; historical rows and notes are unchanged.
- **Deviations:** none.
- **Checkpoint:** recorded after the squash.
