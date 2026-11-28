# Phase 2 Verification - Release v1.28.0

- Track: `20261128-release-v1-28-0` — Release v1.28.0
- Phase: 2 — README and release documentation truth
- Date: 2026-11-28
- Branch: `chore/20261128-release-v1-28-0`
- Phase base: `742dc9fd178a2b681b3fd97d4d871eb350ae8412`
- Head after task commits: `4c321cb78b9c182005bad58a931fe2bc009c8188` (task commits `772d8c9d` then `4c321cb7`)
- Result: **verified** (exact phase verification command exits 0; no product, CI, tag, deploy or live claim added)

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| Pre-edit diff review | `git diff -- README.md docs/release-notes-v1.28.0.md` | 0 | Exactly four added lines: one README Releases row and three `Archived evidence:` bullets in the v1.28.0 notes. No existing parent-facing copy or placeholder changed. |
| Phase verification | `node scripts/validate-docs.js && pnpm check` | 0 | `validate-docs`: release-note index complete; every relative link and anchor resolves; README/PRD/TDD agree with `GAME_REGISTRY`; no doc points at a missing Conductor path; living test-suite figures current (5 passed / 0 failed). `pnpm check`: Biome checked 393 files, no fixes applied. |
| Git state | `git status --short` | 0 | Clean working tree after the two task commits, before the evidence file was written. |
| Commit history | `git log --oneline --max-count=3 HEAD` | 0 | `4c321cb7` notes links, `772d8c9d` README row, `742dc9fd` phase base — no other commit added by this phase. |
| Phase diff | `git diff 742dc9fd178a2b681b3fd97d4d871eb350ae8412 HEAD` | 0 | Only `README.md` and `docs/release-notes-v1.28.0.md` changed; no Conductor state, product doc, lockfile or runtime source touched. |
| Task commits | `git add README.md`; `git commit -m "docs(release): add v1.28.0 Releases table row"`; `git add docs/release-notes-v1.28.0.md`; `git commit -m "docs(release): link archived records and issue 108 from v1.28.0 notes"` | 0 | `772d8c9d` and `4c321cb7`. No amend, no force, no tag, branch unchanged. |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-3 / FR-3 | README Documentation and Releases entries link to the notes and `validate-docs` passes | Documentation link was added in Phase 1 and preserved; Phase 2 adds a `2026-11-28` v1.28.0 Releases row describing #109 Repeat Machine, #110 wide hub grid/tap fix and #111 per-profile narration pace, linking `docs/release-notes-v1.28.0.md`, with Tag `pending`. `node scripts/validate-docs.js` reports the release-note index complete and 5 passed / 0 failed. | PASS |
| FR-2 / AC-2 | Notes stay DRAFT before ship, keep all three PR sections in merge order and the accepted device gap | `docs/release-notes-v1.28.0.md` retains `Status: DRAFT`, `Tag: pending`, the parent-facing lede, Installation, Release Verification placeholders and `SKIPPED — accepted gap` device policy. No candidate, perf, CI, tag, deploy, ship or live figure was filled in. | PASS |
| FR-2 / FR-3 | Notes link all three archived Conductor track records plus issue #108 with correct relative paths from `docs/` | Three `Archived evidence:` bullets added: `../conductor/archive/20261128-repeat-machine/pr.md`, `../conductor/archive/20261128-wide-hub-grid-overflow/pr.md` (plus external `https://github.com/mansyar/aby-little-lab/issues/108`, labelled RM-11), and `../conductor/archive/20261128-narration-pace/pr.md`. `validate-docs` confirms every relative link resolves and no document points at a nonexistent Conductor path. | PASS |
| NFR-2 | Documentation internally consistent; `validate-docs` exits 0 and relative links resolve | Exact verification command exits 0: 5 document checks passed, 0 failed; Biome clean on 393 files. Living test-suite figures were already current from Phase 1 and were not altered. | PASS |
| P2.T2.2 | Preserve existing parent-facing copy and placeholders | Phase diff is four added lines only; no deletion or modification of existing note text or README copy. | PASS |
| NFR-3 | Conventional commits; no history rewrite | Two conventional `docs(release):` commits, no amend/reset/tag/push; verification passed on the first run so no retry was needed. | PASS |

## Evidence paths

- `README.md` — v1.28.0 Releases row, commit `772d8c9d`.
- `docs/release-notes-v1.28.0.md` — three archived-record links plus issue #108, commit `4c321cb7`.
- `conductor/tracks/20261128-release-v1-28-0/verification/phase-2.md` — this report.
- `conductor/tracks/20261128-release-v1-28-0/verification/phase-1.md` — format reference; unchanged.
- No binary or large log artifacts were produced; nothing was written under `.conductor/evidence/`.

## Deviations

None. All changes stayed inside the Phase 2 `Touches` paths (`README.md`, `docs/release-notes-v1.28.0.md`) plus this evidence file.

## Notes

- The README row deliberately says `DRAFT — candidate verification pending`, claims no CI, tag, deploy or live result, and records physical-device smoke as `SKIPPED — accepted gap`.
- Issue #108 is an external GitHub URL; archived track records use the `../conductor/archive/<track>/pr.md` relative form established by `docs/release-notes-v1.27.0.md`.
- `Status: DRAFT`, `Tag: pending`, Release Verification placeholders and all parent-facing copy were left untouched, as required by P2.T2.2.
- No `plan.md`, `spec.md`, `metadata.json`, `tracks.md`, `conductor/index.md`, product doc, `review.md` or `pr.md` was edited. The branch was not switched.
- Verification was run on the final reviewed working tree before the task commits; the two task commits contain exactly the reviewed file changes.

## Primary verification

- Independent phase verification: `node scripts/validate-docs.js && pnpm check` — PASS (5/0 document checks; Biome 393 files clean).
- Independent full `verify_phase` gate — PASS: `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`.
- Test evidence: 165 files / 3,559 tests passed; coverage 96.91 statements / 90.23 branches / 96.22 functions / 98.06 lines (gates 90/85/88/95).
- Build/guard evidence: 501 modules; shell entry 190.3 kB; module-size PASS with three warning-only notes; textures 76.42/321.00 MiB, ratio 0.238; PWA 16/0; docs 5/0.
- Phase checkpoint after primary squash: `b99e27e5`; diff from `742dc9fd` is three files / 55 insertions; working tree clean.
