# Phase 6 verification — Tag and ship (20261123-release-v1-25-0)

- **Tag:** `v1.25.0` (lightweight, on merge commit `4359667b`)
- **Tagged with owner go-ahead:** 2026-11-23
- **Date:** 2026-11-23
- **Result:** verified

## Tag facts

| Check | Evidence |
|---|---|
| No tag existed before | `git describe --tags --abbrev=0` → `v1.24.0`; `git tag --list 'v1.25*'` empty; `git ls-remote origin refs/tags/v1.25*` empty |
| Tag is on merged master HEAD | `git rev-parse v1.25.0` → `4359667bbeea5a774efe5675fd6cc62069c96dc0`; PR #93 merge commit matches |
| Tag pushed to origin | `git push origin v1.25.0` → `* [new tag] v1.25.0 -> v1.25.0`; `git ls-remote origin refs/tags/v1.25.0` → `4359667b…` |
| Tag points to master lineage | Tag CI job "Ensure tag points to a master commit" passed |
| Tag never moved | no force-push, no tag delete/recreate |

## Tag CI and deploy

`gh run watch 45124846826 --interval 20 --exit-status` — **v1.25.0 CI**, triggered
by the tag push, all green:

- Quality Gates — pass in 2m23s (docs, lint, typecheck, tests, production build,
  bundle, PWA, boot-time and security-headers validation)
- Browser Journeys (shard 1 of 2) — pass in 3m33s (annotation: 13 passed, 2.1m)
- Browser Journeys (shard 2 of 2) — pass in 4m41s
- Browser Journeys rollup — pass in 2s
- Deploy to Coolify — pass in 5s ("Ensure tag points to a master commit" ✓;
  "Trigger Coolify deploy webhook" ✓; secrets check shown as skipped, matching
  the v1.24.0 tag run). This is the evidence that pushing the tag fired deploy.

## Notes finalisation

`docs/release-notes-v1.25.0.md` header now reads `Status: FINAL` and
`Tag: \`v1.25.0\` (\`4359667b\`, 2026-11-23)`. Its Release Verification section
records the tag, the tag CI run and the Coolify webhook, and notes that the tag
must not be moved. `node scripts/validate-docs.js` → 5 passed, 0 failed.

## Acceptance criteria

| Criterion | Result |
|---|---|
| FR-9 / AC-8 — tag on merged master HEAD, pushed only after go-ahead, notes FINAL | Pass — owner chose "Tag v1.25.0 now"; local and remote tags resolve to `4359667b`; notes FINAL |
| FR-10 / AC-9 — skipped device pass recorded as accepted gap | Pass — release notes Known Issues, unchanged from Phase 4 |

No deviations. No blockers.
