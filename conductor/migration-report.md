# Conductor Migration Report

- **Date:** 2026-10-20T00:30:00+07:00
- **From:** Conductor 1.x
- **To:** Conductor 2.0
- **Mode:** Upgrade in place

## Context

- **Preserved:** `product.md`, `tech-stack.md`, `product-guidelines.md`, and
  `code_styleguides/` (`general.md`, `html-css.md`, `typescript.md`) were carried
  over unchanged.
- **Regenerated:** `workflow.md` with the Workflow Config block and a
  Verification Strategy matching the real CI pipeline (Biome `check`, `tsc`,
  Vitest, coverage gate, build, bundle/PWA validators, boot smoke check).
- **Index:** `index.md` merged in place; the version marker was added and the old
  `## Management` section's links moved under `## Tracks`. A `## Capabilities`
  section now points at the installed subagents.
- **Scaffolding:** `tracks.md` retained as-is (valid registry, 5 archived
  tracks), `tracks/.gitkeep` added, and `.conductor/` added to `.gitignore`.
- **Agents:** installed — OpenCode host confirmed via
  `~/.config/opencode/opencode.json` even though the project has no local
  `.opencode/` config. `conductor-phase` and `conductor-reviewer` were written to
  `.opencode/agents/` with project shell allow rules.

## Tracks

| Track | Status | Missing metadata | Plan v2 | Spec v2 | Recommended action |
| --- | --- | --- | --- | --- | --- |
| `drop-ligne-mascot_20261016` | `new` (never executed) | `base_branch`, `base_sha`, `progress`, `review_verdict`, `doc_sync`, plus all other v2 fields | `no` | `no` | Recreate with `conductor-new-track`, importing the existing `spec.md`; then archive the old track. The dependency `release-1.18.0_20261016` is already archived and shipped, so `depends_on` was recorded as empty. |

## Open Questions & Assumptions

- The legacy track's planned branch `chore/drop-ligne-mascot` does not exist
  locally or remotely, so `branch` was migrated as `null`; the name survives in
  the original commit history and in the backup.
- No local OpenCode project config exists; the subagent install relies on the
  global OpenCode host. If this project is ever used on a different host, those
  profiles are simply ignored.
- Verification layers were derived from `.github/workflows/ci.yml`; no
  integration, E2E, or visual-diff suite exists, so none was invented.

## Limits

- Legacy tracks are blocked by `conductor-implement`, `conductor-review`, and
  phase revert until they are recreated or manually repaired.
- Old specs and plans were not rewritten automatically.
- When a track is repaired, remove `legacy: true` from its metadata and update the
  spec/plan to the v2 contract.
- The pre-migration directory is backed up at
  `.conductor/backups/conductor-v1-20261020-002643/`.
