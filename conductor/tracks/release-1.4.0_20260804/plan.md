# Plan: v1.4.0 Release Execution

- **Track ID:** `release-1.4.0_20260804`
- **Type:** Release
- **Status:** Approved (new)

## Phase 1: Baseline Gates & Version Bump

- [ ] Task: Run local quality gates (baseline green)
  - [ ] Run `pnpm run check` (Biome lint + format — 0 errors)
  - [ ] Run `CI=true pnpm test` (full suite, single execution)
  - [ ] Run `pnpm run build` (production build succeeds)
  - [ ] Run `node scripts/validate-pwa.js` (13/13)
- [ ] Task: Bump version to 1.4.0
  - [ ] Run `npm version 1.4.0 --no-git-tag-version`
  - [ ] Verify `package.json` shows `"version": "1.4.0"`
- [ ] Task: Commit version bump
  - [ ] Stage `package.json`
  - [ ] Commit `chore(release): Bump version to 1.4.0`
  - [ ] Attach git note (task summary, why, files)
  - [ ] Record commit SHA in `plan.md`, mark task `[x]`
  - [ ] Commit plan update `conductor(plan): Mark task ... as complete`
- [ ] Task: Phase Verification & Checkpoint (per `workflow.md`)

## Phase 2: Finalize Release Documentation

- [ ] Task: Finalize `docs/release-notes-v1.4.0.md`
  - [ ] Flip status DRAFT → FINAL; add release date and pipeline record
  - [ ] Keep TTS voice variation in Known Issues (accepted, manual)
- [ ] Task: Update `docs/device-testing-checklist.md`
  - [ ] Add Execution Record v1.4.0 (devices: iPad, Android tablet, iPhone, Android phone — all passed)
  - [ ] Update Sign-Off block (date 2026-08-04)
- [ ] Task: Update `docs/release-checklist.md`
  - [ ] Add v1.4.0 prep note (gates green, device testing passed, docs drafted)
  - [ ] Add Step 7f deployment verification section (filled after deploy)
  - [ ] Add Final Sign-Off v1.4.0 block
- [ ] Task: Update `docs/TDD.md` release history + check `docs/PRD.md`
  - [ ] Append v1.4.0 to the release-history note in `docs/TDD.md`
  - [ ] Verify `docs/PRD.md` needs no version-specific update
- [ ] Task: Commit docs changes
  - [ ] Commit `docs(release): Finalize v1.4.0 release notes, checklist, device records`
  - [ ] Attach git note
  - [ ] Record commit SHA in `plan.md`, mark task `[x]`
  - [ ] Commit plan update
- [ ] Task: Phase Verification & Checkpoint (per `workflow.md`)

## Phase 3: Release Branch, PR, Merge & Tag

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
