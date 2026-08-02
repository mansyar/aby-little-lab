# Plan: v1.1.0 Release Mechanics

## Phase 1: Baseline Gates & Version Bump [checkpoint: 9ae169a]

- [x] **Task: Run local quality gates (baseline green)**
  - [x] Run `pnpm run check` (Biome lint + format)
  - [x] Run `CI=true pnpm test` (single-execution, full suite)
  - [x] Run `pnpm run build` (production build succeeds)
  - [x] Run `node scripts/validate-pwa.js` (13/13)
- [x] **Task: Bump version to 1.1.0**
  - [x] Run `npm version 1.1.0 --no-git-tag-version`
  - [x] Verify `package.json` shows `"version": "1.1.0"`
- [x] **Task: Commit version bump** `78e5634`
  - [x] Stage `package.json`
  - [x] Commit `chore(release): Bump version to 1.1.0`
  - [x] Attach git note (task summary, why, files)
  - [x] Record commit SHA in `plan.md`, mark task `[x]`
  - [x] Commit plan update `conductor(plan): Mark task ... as complete`
- [ ] **Task: Phase Verification & Checkpoint** *(Refer to workflow.md)*

## Phase 2: Finalize Release Documentation [checkpoint: a2d1159]

- [x] **Task: Finalize `docs/release-notes-v1.1.0.md`**
  - [x] Flip status Draft → final; add date; reflect merged state
  - [x] Keep device-testing + TTS-voice variation in Known Issues (manual)
- [x] **Task: Update `docs/release-checklist.md`**
  - [x] Mark v1.1.0 prep items now satisfied (merge done, gates green)
  - [x] Update Final Sign-Off (version 1.1.0, status)
- [x] **Task: Commit docs changes** `4962e45` (`docs(release): Finalize v1.1.0 release notes and checklist`) + git note + plan update
- [ ] **Task: Phase Verification & Checkpoint** *(Refer to workflow.md)*

## Phase 3: Tag & Deploy [checkpoint: 8afe772]

- [x] **Task: Create annotated tag** `v1.1.0` — *"Release v1.1.0: Find the Letter + PWA & parental settings refinements"*
- [x] **Task: Push `master` + tag to `origin`**
  - [x] Push master (triggers CI: Quality Gates → Deploy to Coolify) — `3544a0e..44676ad`
  - [x] Push tag `v1.1.0`
- [x] **Task: Verify CI run**
  - [x] Record run ID (e.g., via `gh run list`) — **run `30745388316`**
  - [x] Confirm Quality Gates job green — ✓ (52s)
  - [x] Confirm Deploy to Coolify job green — ✓ (5s)
- [ ] **Task: Phase Verification & Checkpoint** *(Refer to workflow.md)*

## Phase 4: Post-Deploy Verification (Automatable)

- [x] **Task: Verify live index + entry JS hash**
  - [x] Fetch live `index.html` (200); compare entry JS hash to local `dist/assets/index-*.js` — live `index-BRXHqYbm.js` matches fresh post-bump local build
- [x] **Task: Verify `1.1.0` embedded in served bundle** (version footer data) — ✓
- [x] **Task: Verify live `sw.js` + manifest return 200** — ✓ both 200
- [x] **Task: Update `docs/release-checklist.md` post-release verifiable items + Final Sign-Off; commit docs update** `e3bbad6` (Step 7b record)
- [ ] **Task: Phase Verification & Checkpoint** *(Refer to workflow.md)*

## Phase 5: Track Completion & Archive

- [ ] **Task: Conduct track review** (per Conductor review protocol; apply suggestions)
- [ ] **Task: Mark track complete; archive to `conductor/archive/`; update Tracks Registry**
- [ ] **Task: Final checkpoint & commit**
