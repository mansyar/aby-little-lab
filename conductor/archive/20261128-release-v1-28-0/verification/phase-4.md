# Phase 4 Verification - Release v1.28.0

- Track: `20261128-release-v1-28-0` — Release v1.28.0
- Phase: 4 — Review, PR, and issue-closure readiness
- Date: 2026-11-28
- Branch: `chore/20261128-release-v1-28-0`
- Phase base: `de9ebdfc05675b17b9173cae76b573a7e8031031`
- Result: **verified** — evidence pack and PR/merge runbook prepared; exact final gate passed.

## Merged evidence cross-check

| Item | GitHub state | Merged at (UTC) | Merge commit |
| --- | --- | --- | --- |
| PR #109 — Add game 25: a Repeat Machine for loops | MERGED | 2026-11-27T22:56:40Z | `896d455ee2e6196a1d83cdd7525102678bbefa28` |
| PR #110 — Fix wide hub grid overflow with 25th game tile | MERGED | 2026-11-28T01:08:49Z | `effc18fb99313d8d915d706fea185f6e528d916b` |
| PR #111 — Add a parent control for narration pace | MERGED | 2026-11-28T04:16:53Z | `39df7f5b7c4fc994475156c9affd1a4da8bec4f1` |
| Issue #108 — Wide hub grid overflow | OPEN | — | Fixed by PR #110; closure is post-merge work |

The release notes list #109 → #110 → #111 in actual merge order and link all three archived track records. Issue #108 is referenced as the report addressed by #110; it is not closed by this preparation phase.

## Final candidate diff

Compared with `origin/master`, excluding Conductor state:

| File | Change |
| --- | --- |
| `package.json` | Version 1.27.0 → 1.28.0 |
| `README.md` | Documentation link and Releases row |
| `docs/release-notes-v1.28.0.md` | New DRAFT release record for #109–#111 |
| `docs/perf-baseline.md` | Dated measured v1.28.0 candidate section; history preserved |
| `scripts/measure-first-tap.mjs` | Verification harness synchronized to the merged five-row grid |

Diff volume: 5 files, 137 insertions / 9 deletions before Phase 4 documentation corrections. No production source, asset, dependency, schema, or storage file changed.

## Requirement matrix

| ID | Status | Evidence / remaining gate |
| --- | --- | --- |
| FR-1 | covered | `package.json` and built shell report 1.28.0; Phase 1 evidence. |
| FR-2 | covered pre-ship | DRAFT notes use the established structure and #109–#111 order; FINAL remains post-ship. |
| FR-3 | covered | README Documentation and Releases entries resolve; `validate-docs` 5/0. |
| FR-4 | covered | Dated measured perf section and retained raw first-tap evidence; historical rows unchanged. |
| FR-5 | covered locally | Exact full gate, headed 50/0 first tap and local 60/60 browser matrix passed; PR CI remains pending. |
| FR-6 | in progress | Strict review, PR to `master`, CI watch and explicit merge boundary prepared in `pr.md`; execution follows review. |
| FR-7 | prepared | #108 closure comment template links PR #110 and the release PR; closure occurs only after merge. |
| FR-8 | runbook only | Separate explicit tag/deploy authorization required after merge; no tag exists or is created here. |
| FR-9 | runbook only | Tag CI/Coolify/live checks and FINAL notes remain post-authorization ship work. |
| NFR-1 | pass | Diff is version/docs/verification-tooling only. |
| NFR-2 | pass | `validate-docs` 5/0; measured living figures match final gate output. |
| NFR-3 | pass | Conventional commits; no reset, force-push or tag mutation; caused reruns recorded in Phase 3. |
| NFR-4 | pass | Bundle 190.3 kB; module-size PASS with 3 warnings; textures 76.42/321.00 MiB; PWA 16/0; coverage above gates. |
| NFR-5 | covered by runbook | Revert before tag; never move/delete a published tag; no data migration. |
| AC-1–AC-5 | covered locally | Phases 1–3 evidence and raw measurements. |
| AC-6 | pending review/CI | Strict review and green required PR checks precede merge. |
| AC-7–AC-9 | post-merge | Issue closure, authorized immutable tag, deploy/live verification and FINAL notes. |

## Strict-review evidence pack

- Review mode: strict; medium-or-higher findings auto-create issues; at most two fix rounds.
- Review diff: small-volume one-pass review of 5 non-Conductor files (+137/−9 before Phase 4 copy correction).
- Gate baseline: 165 files / 3,559 tests; coverage 96.91 statements / 90.23 branches / 96.22 functions / 98.06 lines; 501 modules; all validators green.
- First tap: 50 cold / 0 warm; worst cold 273.2 ms ≤ 400 ms.
- Browser: Chromium 30/30, WebKit 10/10, Firefox 10/10, mobile Chromium 10/10; one caused rerun retained.
- Accepted gap: physical iOS Safari, Android Chrome and Fire tablet testing remains `SKIPPED — accepted gap`.
- Known external boundary: PR CI, merge, issue closure, tag, Coolify and live verification are not claimed by the local candidate.

## PR and merge runbook

- PR title: `chore(release): ship v1.28.0`.
- PR base: `master`; merge method: `merge`; required checks: Quality Gates and Browser Journeys.
- CI watch: enabled, 15-minute configured timeout. Diagnose track-caused failures on this branch; never merge red.
- Merge boundary: stop at `awaiting-merge` and ask **Merge now / Leave open / Stop**. Only an explicit **Merge now** authorizes merge and branch cleanup.
- After merge: verify `MERGED`, delete local and remote release branches, then close #108 with the prepared comment.
- Tag/deploy boundary: merge approval does not authorize tagging. A separate explicit go-ahead is required before any immutable `v1.28.0` tag push or Coolify trigger.

## Issue #108 closure comment template

> Fixed by #110 and included in the v1.28.0 release PR #<release-pr>. The wide-grid regression is covered by the 25-tile/25-plaque bounds tests, the chip-clearance guard, the green release-candidate gate and browser journeys. Closing as completed after the release PR merge.

## Evidence paths

- `verification/phase-1.md` — version and DRAFT notes.
- `verification/phase-2.md` — README and evidence links.
- `verification/phase-3.md` — full gate, first tap, browser matrix and measured docs.
- `verification/first-tap-headed.json` and `first-tap-headed.stdout.log` — raw corrected headed evidence.
- `pr.md` — PR body and post-merge boundary.
- `docs/release-notes-v1.28.0.md` — DRAFT release record.
- `docs/perf-baseline.md#v1280-release-candidate-2026-11-28` — measured candidate baseline.

## Primary verification

The exact ten-command `verify_phase` chain passed on the final Phase 4 tree:

- `pnpm check` — 393 files clean.
- `pnpm typecheck` — application and E2E projects clean.
- `pnpm test -- --run` — 165 files / 3,559 tests passed.
- `pnpm test:coverage` — statements 96.91% (8355/8621), branches 90.23% (2523/2796), functions 96.22% (1860/1933), lines 98.06% (7742/7895); all gates met.
- `pnpm build` — 501 modules; shell `index-B7LXOJIw.js` 194.87 kB / 48.95 kB gzip.
- `validate-bundle` — PASS; shell 190.3 kB.
- `validate-module-size` — PASS with three warn-only notes.
- `validate-textures` — PASS; 76.42 / 321.00 MiB, ratio 0.238.
- `validate-pwa` — 16/0; 55 chunks / 55 precached; 67 entries.
- `validate-docs` — 5/0.

Raw output: `.conductor/evidence/phase-4-final-gate.log`.
