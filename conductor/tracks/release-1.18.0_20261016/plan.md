# Implementation Plan: v1.18.0 Release Execution

> **Track:** `release-1.18.0_20261016` · **Spec:** [spec.md](./spec.md) (Source of Truth)
> Release chore — TDD N/A per workflow §Task Workflow step 3 (no logic-bearing code; version string + prose + git operations). Verification via gates + live checks: `pnpm run check` · `CI=true pnpm test` · `pnpm run build` · `node scripts/validate-pwa.js` + tag lineage guard + live-hash match + device matrix.
> Commit style `<type>(<scope>): <desc>` (`chore(release)` for version/tag, `docs()` for notes, `chore(conductor)` for registry/archive).

## Phase 1 — Version bump + release notes

- [x] Task 1.1: Bump `package.json` `1.17.0` → `1.18.0` (single string; verify no lockfile churn via `git status --porcelain`). [7da0516]
- [x] Task 1.2: Author `docs/release-notes-v1.18.0.md` (v1.16.0 structure; Verification section left `Pending` until Phase 3). [f511174]
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [3fd5645]

## Phase 2 — Quality gates + PR

- [x] Task 2.1: Full gates — `pnpm run check` ✅ · `pnpm run build` ✅ · `validate-pwa` 15/15 ✅ · `validate-bundle` ✅ · CI Quality Gates ✅ (run 38914426068 incl. Tests — local timeout flake proven environmental, user-approved CI arbitration 2026-10-17).
- [x] Task 2.2: Push `release/v1.18.0`, open PR to `master`, `gh run watch --exit-status` to green, merge (no other commits to `master` except via this PR). [PR #35, CI 38914426068]
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [b92472e]

## Phase 3 — Tag + deploy + live verification

- [x] Task 3.1: Tag `v1.18.0` on the merge commit with lineage guard (`tag parent == merge commit`), push tag. [v1.18.0 → e535c52]
- [~] Task 3.2: Coolify deploy (webhook, `--fail-with-body`) → live entry-hash match vs local `dist/` → live smoke (boot → Hub 20 tiles → adaptive game round-trip → sticker shelf → footer `v1.18.0`); complete the notes Verification section.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Device matrix

- [ ] Task 4.1: 4-class matrix (iPad/iPadOS, iPhone/iOS, Android tablet/phone) + desktop smoke (install/update, offline relaunch, touch targets, landscape lock, reduced-motion spot). Deferral only by explicit user decision, recorded in the checkpoint note (v1.14.1 precedent).
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5 — Branch hygiene + archive

- [ ] Task 5.1: Stale branch cleanup (full local + remote mode; `release/v1.18.0` deleted last, after merge).
- [ ] Task 5.2: Finalize notes, mark registry `[x]`, archive the track.
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Checkpoints

- Phase 1: `[checkpoint: 3fd5645]`
- Phase 2: `[checkpoint: b92472e]`
- Phase 3: `[checkpoint: pending]`
- Phase 4: `[checkpoint: pending]`
- Phase 5: `[checkpoint: pending]`
- Track: `[checkpoint: pending]`

## Verification Notes

- Release diff vs `v1.17.0` must stay the reviewed delta (16 files + version/notes); any new `src/` change → STOP and re-scope.
- If the PR `Quality Gates` job gates red on the pre-existing coverage thresholds, STOP and triage — never weaken thresholds to pass.
- Tag lineage guard and live-hash match are the proof of what shipped; record both SHAs in the Phase 3 checkpoint note.
