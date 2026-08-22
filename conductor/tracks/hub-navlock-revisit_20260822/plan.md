# Implementation Plan — Fix Hub Tiles Unresponsive After Completing a Game

**Track ID:** `hub-navlock-revisit_20260822` · **Type:** Bug Fix (+ patch release v1.14.2)
**Methodology:** Strict TDD per `conductor/workflow.md` — failing regression test
(Red) before the minimal fix (Green). Release follows the established gate order:
`pnpm run check` → `CI=true pnpm test` → `pnpm run build`.

For every file-changing task: mark `[~]`, implement, verify, commit with a Git
note, mark `[x]`, record the SHA, and commit the plan update separately.

## Phase 1 — TDD Regression Fix

- [~] **Task 1.1: Write the failing regression test (Red)**
  - [ ] Study the existing Hub tile-launch tests in
        `src/__tests__/scenes/navigation.test.ts` and match their setup/style.
  - [ ] Add a test that replays a second hub visit **on the same scene instance**:
        tap a game tile → simulate game completion/auto-return by re-running
        `create()` on the identical instance → tap a different tile → assert
        navigation proceeds (`scene.start` called with the target key).
  - [ ] Run the targeted suite and confirm the new test fails exactly as the
        production bug does (silent no-op tap).
- [ ] **Task 1.2: Implement the minimal fix (Green)**
  - [ ] In `HubScene.create()`, reset `this.navLocked = false;` beside the
        existing transient-state resets (`timeUp`, `nudgeActive`).
  - [ ] Rerun the targeted suite — new test green, no regressions in file.
- [ ] **Task 1.3: Quality gates**
  - [ ] `pnpm run check`
  - [ ] `CI=true pnpm test`
  - [ ] `pnpm run build`
- [ ] **Task 1.4: Commit the fix**
  - [ ] Commit as `fix(hub): Reset navLocked when the Hub scene restarts`.
  - [ ] Attach task-summary Git note; record SHA in plan; commit plan update.
- [ ] **Task 1.5: Phase Verification & Checkpoint (Refer to workflow.md)**
  - [ ] Announce test command + results; propose manual verification steps
        (dev server: play game → auto-return → start different game).
  - [ ] Await explicit user confirmation; create checkpoint commit + Git note;
        record `[checkpoint: <sha>]`.

## Phase 2 — Version Bump and Release Notes (v1.14.2)

- [ ] **Task 2.1: Verify pre-release state**
  - [ ] Clean tree; `package.json` = 1.14.1; no `v1.14.2` tag exists locally/remotely.
- [ ] **Task 2.2: Bump version**
  - [ ] `npm version 1.14.2 --no-git-tag-version`; confirm only expected files change.
  - [ ] Build once and confirm the bundle embeds `1.14.2` (no stale `1.14.1`).
  - [ ] Commit as `chore(release): Bump version to 1.14.2` + Git note + SHA record.
- [ ] **Task 2.3: Write release notes**
  - [ ] Create `docs/release-notes-v1.14.2.md` using the established section layout,
        describing the hub dead-tiles fix (DRAFT until deployed).
  - [ ] Commit as `docs(release): Prepare v1.14.2 release notes` + Git note + SHA record.
- [ ] **Task 2.4: Phase Verification & Checkpoint (Refer to workflow.md)**

## Phase 3 — Tag, Deploy, and Live Verification

- [ ] **Task 3.1: Create annotated tag `v1.14.2`** on the verified master-lineage HEAD;
      verify annotation/target before any push.
- [ ] **Task 3.2: Push master + tag; monitor CI**
  - [ ] Push `master` (publishes the 55-commit backlog + this work) and the tag.
  - [ ] Confirm tag-run Quality Gates pass and the master-lineage deploy guard passes;
        confirm Deploy to Coolify completes.
  - [ ] Contingency: if branch protection rejects a direct master push, fall back to
        the established release-branch → PR flow (pause for user approval).
- [ ] **Task 3.3: Verify deployment artifacts**
  - [ ] Live URL, `sw.js`, `manifest.webmanifest` return 200; served bundle contains
        `1.14.2` and no stale `1.14.1`; Settings footer shows v1.14.2.
- [ ] **Task 3.4: Live reproduction-path smoke test**
  - [ ] On the live PWA: boot → play a game → auto-return → start a *different*
        game → repeat across several games; confirm zero dead tiles.
- [ ] **Task 3.5: Phase Verification & Checkpoint (Refer to workflow.md)**

## Phase 4 — Finalize and Archive

- [ ] **Task 4.1: Finalize records** — flip release notes DRAFT → FINAL; record
      deployment evidence.
- [ ] **Task 4.2: Complete Conductor state** — metadata → completed/archived;
      move track to `conductor/archive/hub-navlock-revisit_20260822/`; update
      Tracks Registry link; commit `chore(conductor): Archive track
      'Fix Hub Tiles Unresponsive After Completing a Game'` + Git note.
- [ ] **Task 4.3: Final Verification & Checkpoint (Refer to workflow.md)**
