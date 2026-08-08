# Specification — v1.12.0 Release Execution

**Track ID:** `release-1.12.0_20260808` · **Type:** Chore · **Status:** new

## Overview

Ship **TTS Voice Selection** as **v1.12.0**. Execute the standard release process (release branch + version bump → docs → gates → tag → PR → merge to master → Coolify auto-deploy → live verification → device testing), mirroring the v1.6.0–v1.11.0 release-track pattern per `docs/release-checklist.md`.

## Background — Unreleased Delta

| Source | Content |
|---|---|
| **`master` since `v1.11.0`** (tag at `828f9e0`, hotfix-amended) | TTS Voice Selection track (`2716346`..`3f9981d`, 19 commits): `voiceLogic.ts` (+ tests), `speech.ts` integration (`setPreferredVoiceURI`, `resolveVoice`), Settings `preferredVoiceURI` schema (additive v2), `BootScene.create()` sync, SettingsPanel Voice row + Preview, `voiceschanged` listener, device-testing checklist gained 10 v1.12.0 candidate rows, track archived |
| **Push status** | Local `master` is **19 commits ahead of `origin/master`** — the TTS feature commits are *not yet pushed*. This release merges + pushes them to origin for the first time (first CI run exercising the feature) |
| **v1.11.0 status** | Released, deployed, device-tested — **all passed** on 4 device classes; release notes FINAL; no dangling docs |
| **Explicit handoff** | Track `tts-voice-selection_20260808` — spec declares *"Track type: Feature (v1.12.0 candidate)"*; checklist rows titled *"TTS Voice Selection (v1.12.0 candidate)"* await execution |

## Goals

- **FR-1 — Baseline validation:** master contains all TTS Voice Selection code (HEAD = `3f9981d`); quality gates green; working tree clean.
- **FR-2 — Version bump** 1.11.0 → 1.12.0 via `npm version 1.12.0 --no-git-tag-version` on `release/v1.12.0`; app-version footer reflects it automatically (`__APP_VERSION__` Vite define).
- **FR-3 — Release branch + tag + PR:** create `release/v1.12.0` from master; run all quality gates on it; create annotated tag `v1.12.0`; open PR → master (CI gates merge-blocking); merge pushes master → Coolify auto-deploy webhook (Bearer `$COOLIFY_TOKEN`).
- **FR-4 — Release notes:** create `docs/release-notes-v1.12.0.md` per template (What's New / Improvements / Bug Fixes / Known Issues / Installation / Feedback) covering TTS Voice Selection — DRAFT during Phase 3, FINAL at close.
- **FR-5 — Docs sync:** add v1.12.0 record to `docs/device-testing-checklist.md` (the 10 drafted TTS voice rows + carried speech-game/regression rows); patch real gaps only.
- **FR-6 — Deployment verification:** CI run on master green; served `index-*.js` hash matches local `dist/`; `/sw.js` + `/manifest.webmanifest` return 200; Settings footer shows v1.12.0; live smoke: boot → hub → Settings (Voice row: Default → cycling → Preview) → one speech game spot check (Find the Letter) → hub, on `https://aby-little-lab.ansyar-world.top/`.
- **FR-7 — Targeted device testing:** conductor prepares the v1.12.0 checklist record (10 TTS rows + carried rows); **user executes** it on iPad / Android tablet / iPhone / Android phone against the live URL; results recorded and triaged.

## Non-Functional Requirements

- **NFR-1:** Quality gates pass before merge, in CI order: `pnpm run check` → `CI=true pnpm test` → `pnpm run build` → `node scripts/validate-pwa.js`.
- **NFR-2:** Test suite stays green at 1176/1176 or higher (49 files).
- **NFR-3:** No source-code feature changes beyond release work — this is a ship-it track. Defects found during device testing become a documented decision: fix in a follow-up track (out of scope) or hotfix in this track with explicit user approval (max 2 fix attempts per workflow).

## Acceptance Criteria

1. `v1.12.0` tag exists on master; CI deploy succeeded; live site serves the new build (hash match verified); TTS commits reach `origin/master`.
2. `docs/release-notes-v1.12.0.md` written, status FINAL at close, template-compliant; no dangling DRAFTs.
3. Device-testing checklist has an executed v1.12.0 record (10 TTS rows + carried rows) with results and triage.
4. Conductor artifacts: spec/plan/metadata archived; registry updated; track marked complete.

## Out of Scope

- New features or gameplay changes (per-profile voices, language/locale selection — deferred by the tts-voice-selection spec).
- Cloud sync, analytics, or roadmap features.
- Exhaustive full-suite device regression — targeted TTS rows + carried rows only (user decision).

## References

- `docs/release-checklist.md` (release process), `docs/device-testing-checklist.md`, `docs/release-notes-v1.11.0.md`, `conductor/archive/tts-voice-selection_20260808/spec.md`, `conductor/archive/release-1.11.0_20260808/plan.md`, `conductor/workflow.md` (Deployment Workflow), `conductor/tracks.md`.
