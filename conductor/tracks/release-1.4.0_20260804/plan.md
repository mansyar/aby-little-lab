# Plan: v1.4.0 Release Execution

- **Track ID:** `release-1.4.0_20260804`
- **Type:** Release
- **Status:** Approved (new)

## Phase 1: Baseline Gates & Version Bump

- [x] Task: Run local quality gates (baseline green)
  - [x] Run `pnpm run check` (Biome lint + format — 0 errors)
  - [x] Run `CI=true pnpm test` (full suite, single execution)
  - [x] Run `pnpm run build` (production build succeeds)
  - [x] Run `node scripts/validate-pwa.js` (13/13)
- [x] Task: Bump version to 1.4.0
  - [x] Run `npm version 1.4.0 --no-git-tag-version`
  - [x] Verify `package.json` shows `"version": "1.4.0"`
- [x] Task: Commit version bump `6464d8a`
  - [x] Stage `package.json`
  - [x] Commit `chore(release): Bump version to 1.4.0`
  - [x] Attach git note (task summary, why, files)
  - [x] Record commit SHA in `plan.md`, mark task `[x]`
  - [x] Commit plan update `conductor(plan): Mark task ... as complete`
- [x] Task: Phase Verification & Checkpoint (per `workflow.md`) — gates green, 1.4.0 bumped, user verified `2c40fd0`

## Phase 2: Finalize Release Documentation [checkpoint: 2c40fd0]

- [x] Task: Finalize `docs/release-notes-v1.4.0.md`
  - [x] Flip status DRAFT → FINAL; add release date and pipeline record
  - [x] Keep TTS voice variation in Known Issues (accepted, manual)
- [x] Task: Update `docs/device-testing-checklist.md`
  - [x] Add Execution Record v1.4.0 (devices: iPad, Android tablet, iPhone, Android phone — all passed)
  - [x] Update Sign-Off block (date 2026-08-04)
- [x] Task: Update `docs/release-checklist.md`
  - [x] Add v1.4.0 prep note (gates green, device testing passed, docs drafted)
  - [x] Add Step 7f deployment verification section (filled after deploy)
  - [x] Add Final Sign-Off v1.4.0 block
- [x] Task: Update `docs/TDD.md` release history + check `docs/PRD.md`
  - [x] Append v1.4.0 to the release-history note in `docs/TDD.md`
  - [x] Verify `docs/PRD.md` needs no version-specific update
- [x] Task: Commit docs changes `0788cee`
  - [x] Commit `docs(release): Finalize v1.4.0 release notes, checklist, device records`
  - [x] Attach git note
  - [x] Record commit SHA in `plan.md`, mark task `[x]`
  - [x] Commit plan update
- [x] Task: Phase Verification & Checkpoint (per `workflow.md`) — docs finalized, user verified `d141b71`

## Phase 3: Release Branch, PR, Merge & Tag [checkpoint: d141b71]

- [ ] Task: Create release branch `release/v1.4.0`
- [ ] Task: Open PR `release/v1.4.0` → `master`
- [ ] Task: Merge PR (CI Quality Gates green → Deploy to Coolify fires)
- [ ] Task: Create annotated tag `v1.4.0` — "Release v1.4.0: Multi-Kid Profiles"
  - [ ] Push tag to `origin`
- [ ] Task: Verify CI run
  - [ ] Record run ID (e.g., via `gh run list`)
  - [ ] Confirm Quality Gates job green
  - [ ] Confirm Deploy to Coolify job green
- [ ] Task: Phase Verification & Checkpoint (per `workflow.md`)

## Phase 4: Post-Deploy Verification

- [ ] Task: Verify live index + entry JS hash
  - [ ] Fetch live `index.html` (200); compare entry JS hash to local `dist/assets/index-*.js`
- [ ] Task: Verify `1.4.0` embedded in served bundle (version footer data); no stale `1.3.0`
- [ ] Task: Verify multi-kid profile code in served bundle (profileLogic / profile v2 strings)
- [ ] Task: Verify live `sw.js` + `manifest.webmanifest` return 200
- [ ] Task: Update `docs/release-checklist.md` Step 7f verifiable items + Final Sign-Off; commit docs update
- [ ] Task: Phase Verification & Checkpoint (per `workflow.md`)

## Phase 5: Track Completion & Archive

- [ ] Task: Conduct track review (per Conductor review protocol; apply suggestions)
- [ ] Task: Mark track complete; archive to `conductor/archive/`; update Tracks Registry
- [ ] Task: Final checkpoint & commit

## Notes

- Mirrors the v1.1.0 release-mechanics track structure (`conductor/archive/release-1.1.0-mechanics_20260802/`).
- No feature code changes; only `package.json` version and docs.
- Deployment is fully automated: merge → CI Quality Gates → Coolify webhook.
