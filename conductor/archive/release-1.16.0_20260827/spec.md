# Specification — v1.16.0 Release Execution

**Track ID:** `release-1.16.0_20260827` · **Type:** Chore / Release · **Status:** Approved
**Branch:** `release/v1.16.0` · **Base tag:** `v1.15.0` (`1a10c60` @ 2026-08-24)

## Overview

Ship the completed-but-unreleased **UI/UX Cohesion** batch and resolve the open v1.15.0 known issue — **Ligne WASM not cached on a device's first offline visit** — as **v1.16.0** through the established release process:

`release branch → Ligne offline-first fix (TDD) → release changes → local gates → PR/CI → master merge → annotated tag on master → tag-gated Coolify deployment → live + physical-device verification → branch hygiene → archive`

The unreleased delta at track creation is **exclusively** the UI/UX Cohesion track (52 commits `v1.15.0..master`; 38 non-Conductor files, +2664/−83): cross-game press feedback, speaker visual states, Settings & Learning Progress affordances, Hub tile/profile hierarchy. This delta reaches the remote only through `release/v1.16.0` and a reviewed PR.

## Goals

### FR-1 — Validate the baseline

- Confirm clean working tree, `master`/`origin/master`/`v1.15.0`/`v1.16.0` tag state, and exact unreleased commit range (record count + subjects).
- Confirm UI/UX Cohesion implementation and archived track are present and complete.
- Run the five quality gates on the baseline (`pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`, `node scripts/validate-bundle.js`) and record evidence (tests, bundle sizes, precache entries, validators).

### FR-2 — Ligne offline-first mascot fix (resolves the v1.15.0 known issue)

Root cause: the Ligne WASM engine (`assets/ligne_wasm_bg-*.wasm`, ~645 KB gz) is runtime-cached `CacheFirst` only. An offline visit after install on a device that never completed a successful engine load (short session / load failure / timeout) falls back to the tween owl for that cache state.

- **FR-2.1** — The WASM engine asset is added to the **service-worker precache** (`workbox.globPatterns` adds `wasm`), making the engine available offline from install onward. If the raw asset exceeds Workbox's default 2 MiB `maximumFileSizeToCacheInBytes`, configure it explicitly and verify the entry lands in the precache manifest.
- **FR-2.2** — Lazy activation preserved: the engine remains a lazy chunk compiled at activation time (post-boot, 10 s timeout, never install-blocking). Boot time-to-interactive budget (<3 s) unchanged; tween fallback remains the permanent fallback for load error/timeout; `prefers-reduced-motion` still never loads Ligne (product rule preserved).
- **FR-2.3** — Caching contract made coherent: the now-redundant `ligne-engine-wasm` CacheFirst `runtimeCaching` route is removed; `scripts/validate-pwa.js` checks are updated to assert the new contract ("includes Ligne WASM in precache" replaces "excludes from precache" and "runtime-caches" checks). The validator change is the **failing gate (Red)** that precedes the config change (Green) — regression-first.
- **FR-2.4** — All Ligne/mascot unit suites remain green; new coverage only where a testable surface changes; full suite continues to satisfy configured thresholds.
- **FR-2.5** — Perf/bundle re-baseline recorded: precache total delta, raw/gz WASM size, install-download growth, evidence shell & Phaser vendor chunks and lazy-chunk structure unchanged, boot budget unchanged.

### FR-3 — Prepare v1.16.0

- Bump version `1.15.0 → 1.16.0` via the established `npm version 1.16.0 --no-git-tag-version` on `release/v1.16.0`.
- Confirm `__APP_VERSION__` (Vite `define` from `package.json`) and the Settings footer `v{version}` derive the new version.
- No gameplay or feature changes outside FR-2 during release preparation.

### FR-4 — Finalize release documentation

- Create `docs/release-notes-v1.16.0.md` (sections: What's New — UI/UX Cohesion (press feedback, speaker states, profile rings, parent affordances) + offline-first Hoot fix; Improvements; Bug Fixes; Known Issues — **resolve the Ligne offline issue**, retain accepted per-device storage / cloud-sync-out-of-scope notes; Installation; Feedback). Status DRAFT until production verification finishes.
- Add the v1.16.0 execution record to `docs/device-testing-checklist.md` (4-class matrix, pending).
- Add v1.16.0 prep, deployment-verification, and final sign-off sections to `docs/release-checklist.md`.
- Audit product/release-facing docs for stale claims (product.md, tech-stack.md — PWA precache note; README; PRD; TDD) and patch only confirmed gaps.

### FR-5 — Publish through the guarded pipeline

- Push `release/v1.16.0` and open a PR to `master`.
- Require GitHub Actions Quality Gates to pass before merge.
- Merge the PR, then create the annotated `v1.16.0` tag on the resulting `master` commit.
- Push the tag and verify the master-lineage guard and Coolify deployment succeed.

### FR-6 — Verify production

- Confirm the live site, `sw.js`, and `manifest.webmanifest` return successfully.
- Confirm the served application is `v1.16.0` with no stale version string and precache/WASM present.
- Run a live smoke test covering: Hub 18 tiles; Cohesion behaviors (press feedback, speaker states, profile rings, parent affordances); offline relaunch with **Ligne-animated Hoot (non-RM)** and tween Hoot under `prefers-reduced-motion`; console health.

### FR-7 — Verify physical devices

- Execute the 4-class matrix (iPad/iPadOS, iPhone/iOS, Android tablet, Android phone) covering: landscape layout, touch targets, Cohesion visual states, per-profile sticker/progress persistence, install/update, **offline relaunch with Ligne Hoot**, `prefers-reduced-motion` behavior, and console health.
- Record device/OS/browser details, results, issues, and final sign-off.

### FR-8 — Branch hygiene (full cleanup, local + remote)

- Remove the `fix/ipad-black-screen` worktree at `hidden-river` and delete the duplicate local branch (fix already in `master` via PR #12).
- Delete 10 additional stale local branches: `feat/game-12`, `feat/game-13`, `feat/game-14`, `feat/game-17`, `feat/parental-settings-expansion`, `ci/fix-deploy-checkout`, `ci/tag-deploy-guard`, `fix/speaker-button-tts`, `hotfix/more-less-arrow`, `release/v1.6.0`, `release/v1.7.0`, `release/v1.8.0`, `release/v1.10.0`, `release/v1.11.0`, `release/v1.12.0`, `release/v1.13.0`, `release/v1.14.0` (where present).
- Delete 13 stale remote branches on `origin` (the `origin/` counterparts of the above that exist remotely): `ci/fix-deploy-checkout`, `ci/tag-deploy-guard`, `feat/game-12`, `feat/game-13`, `fix/speaker-button-tts`, `release/v1.6.0`, `release/v1.7.0`, `release/v1.8.0`, `release/v1.10.0`, `release/v1.11.0`, `release/v1.12.0`, `release/v1.13.0`, `release/v1.14.0`.
- Keep `master`, `origin/master`, `release/v1.16.0`, and all release tags. Every deleted branch's content remains reachable via master history, tags, and Conductor archives. No force-push; no tag movement; deletions recorded in a dedicated commit.

## Non-Functional Requirements

- **NFR-1:** Configured coverage thresholds (95 lines / 88 functions / 85 branches / 90 statements) remain satisfied.
- **NFR-2:** `validate-bundle.js` continues to pass (separate Phaser vendor chunk, shell ≤ 200 kB) and `validate-pwa.js` passes with the **new** WASM-precache contract.
- **NFR-3:** PWA validation passes completely after the caching change.
- **NFR-4:** The release preserves local-only, per-profile data and supports existing saves without destructive migration.
- **NFR-5:** No secrets enter source, release notes, logs, or Conductor artifacts.
- **NFR-6:** Critical or High release defects block completion.
- **NFR-7:** A narrowly scoped release-blocking fix may enter this track only with explicit approval and regression coverage; otherwise, discovered defects become follow-up tracks.
- **NFR-8:** Tags are not moved or amended; any exceptional correction requires explicit approval.
- **NFR-9:** Branch deletion is restricted to the enumerated fully-superseded branches; anything else requires approval.

## Acceptance Criteria

1. All intended commits (Cohesion delta + Ligne fix + release changes) merged into `origin/master` via the release PR.
2. Package/application version is `1.16.0`; Settings footer shows it.
3. All five local gates pass; remote CI passes; `validate-pwa.js` asserts the new offline-first WASM contract.
4. Annotated tag `v1.16.0` points to a commit on `master`; tag-gated Coolify deployment succeeds.
5. Production serves `v1.16.0`; live smoke passes — including **offline relaunch showing Ligne-animated Hoot** (non-RM) and tween Hoot under reduced motion.
6. Physical 4-class verification recorded and passing.
7. Branch hygiene completed (local + remote) and recorded.
8. Release notes FINAL; release and device checklists complete; v1.15.0 Ligne known issue marked resolved.
9. Conductor metadata, plan, registry, and archive finalized.

## Out of Scope

- New mini-games or gameplay enhancements; rigging game critters; tap-Hoot interactivity.
- Cloud sync, accounts, authentication, or backend services (accepted known issue preserved).
- Upgrading `@ligne-engine/*` versions or altering the Ligne artboard/states.
- Removing the tween fallback mascot path or changing `prefers-reduced-motion` product behavior.
- Changes to difficulty, reward, play-time, profile, or progress-report behavior.
- Unrelated refactoring, dependency upgrades, analytics, or child-data collection.
- Broad fixes unrelated to a release-blocking defect.

## References

- `conductor/product.md`, `product-guidelines.md`, `tech-stack.md`, `workflow.md`
- `conductor/archive/ui-ux-cohesion_20260826/`, `conductor/archive/hoot-ligne-pilot_20260822/`, `conductor/archive/release-1.14.0_20260810/`
- `docs/release-checklist.md`, `docs/device-testing-checklist.md`, `docs/release-notes-v1.15.0.md`, `docs/perf-baseline.md`
- `src/components/LigneMascot.ts`, `src/components/Mascot.ts`, `vite.config.ts`, `scripts/validate-pwa.js`, `scripts/validate-bundle.js`
