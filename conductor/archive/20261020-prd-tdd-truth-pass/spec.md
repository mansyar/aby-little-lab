# PRD & TDD Truth Pass — Specification

> Requirement IDs are stable. Do not renumber. Mark removed requirements as `Withdrawn`.

## Overview

`docs/PRD.md` (82 kB) and `docs/TDD.md` (57 kB) are the two documents a new
collaborator — human or agent — reads to understand this product. Both stop at
Game 20 and describe an app that no longer exists: twenty games, no shared scene
bases, no narrator, no profiles, no play-time limits, no progress insights, no
adaptive difficulty outside a footnote, and an asset pipeline that predates the
in-chunk art pattern.

This track restructures both documents around the architecture that actually
ships, so that the written record and the code agree for the first time since
August 2026.

## Problem / Motivation

Concrete drift, verified against the working tree:

- `docs/PRD.md` says "all twenty games" (3 places), documents games 1–20 only,
  and never mentions Feelings Faces or Story Order.
- `docs/TDD.md` carries 8 stale twenty-game references and asserts "23 scenes
  (Boot, Preload, Hub, 20 game scenes)" in spirit throughout its directory and
  asset sections.
- Neither document mentions `ChoiceRoundScene`, `GroupMathScene`,
  `RoundNarrator`, the audio-focus policy, `playTimeLogic`, `progressLogic`,
  `profileLogic`, `voiceLogic`, `storyOrderArt`, or the texture tiers — by any
  name.
- The asset manifest and directory tree are structurally wrong, not just
  outdated: there is no `feelings/`, no `stories/`, no `settings/` component
  group, no `svgDataUri.ts`.
- `conductor/product.md` contains two identical `## Changelog — Game 20`
  headings.

The cost is not cosmetic. These documents are the default context for the next
track, and every stale claim becomes a wrong assumption an agent has to unlearn
by reading source.

## Goals & Success Metrics

- **Goal:** both documents describe the shipped app without a single false
  statement.
  **Metric:** `rg` for the stale patterns (`twenty game`, `20 game scenes`,
  `Game 20 — Number Order` as the last game) returns zero hits in `docs/`.
- **Goal:** the architecture is documented, not just the feature list.
  **Metric:** PRD and TDD both name the shared bases, the narrator and the
  audio-focus policy, and each claim maps to a real file.
- **Goal:** a reader can navigate to any subsystem in one hop.
  **Metric:** both documents carry a table of contents whose entries resolve to
  real sections, and no section is duplicated across the two.
- **Goal:** the existing suite still passes untouched.
  **Metric:** 2,208 tests green with a docs-only diff (`git diff --stat` touches
  `docs/` and `conductor/` only).

## Scope

### In Scope

- A structural rewrite of `docs/PRD.md` around the current product: definition
  and audience, curriculum map by developmental domain, all 22 games, cross-game
  systems, touch/UX rules, audio (including focus), performance and asset budget,
  release readiness.
- A structural rewrite of `docs/TDD.md` around the current implementation:
  tooling, boot and asset budget, scene architecture and lazy registry,
  components, storage schema v2, logic modules, motion, audio, testing, build,
  PWA and CI.
- Folding Game 21 (Feelings Faces) and Game 22 (Story Order) into both documents,
  including the two facts that changed most recently: art that loads with the
  game chunk, and a play clock that only counts visible time.
- `conductor/product.md`: remove the duplicate `## Changelog — Game 20` heading
  without losing either body.
- A short cross-document facts table (game count, adaptive split, boot asset
  count, shell budget, test count) so the numbers have one home and any future
  pass can diff against it.

### Out of Scope

- Any change under `src/` — this is a documentation track; the code is the
  source of truth and must not be edited to match the prose.
- Rewriting historical records: release notes, `docs/release-checklist.md`
  entries and archived Conductor tracks stay exactly as written.
- `README.md` and `conductor/tech-stack.md` beyond a consistency check: both were
  synchronised during the Game 22 track and must only be corrected if this pass
  finds a claim they get wrong.
- New screenshots, diagrams or generated artwork.
- An automated drift guard (a test asserting documentation counts match code) —
  considered and deferred; it belongs to a follow-up chore if this pass proves
  the numbers move often enough to warrant it.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | `docs/PRD.md` is restructured around the shipped product: product definition and audience, curriculum map grouped by developmental domain, per-game specifications for all 22 games, cross-game systems, interaction and touch rules, audio, performance and budget, release readiness. Section numbering and a table of contents remain navigable. | must |
| FR-2 | Every one of the 22 games has a PRD entry stating its mechanic, round structure and pool, difficulty model (adaptive or fixed ladder), narration type (rule line vs round target) and any art or pool specifics. Games 21 and 22 are included. | must |
| FR-3 | The PRD documents the cross-game systems as they exist: the shared scene bases (`GameSceneBase` → `ChoiceRoundScene` → `GroupMathScene`), the single `RoundNarrator`, the mascot, stickers, four profiles, play-time limits that count only visible minutes, Learning Progress, adaptive difficulty on 15 of 22 games with the seven fixed ones named, and preferred-voice selection. | must |
| FR-4 | `docs/PRD.md` states the asset-budget reality: 178 SVGs rasterised at boot, tiered by `textureSizeFor()`, a 195.4 kB shell entry against a 200 kB gate, and game art that loads with the game's chunk. | must |
| FR-5 | `docs/TDD.md` is restructured around the shipped implementation: toolchain, boot and asset budget, scene architecture and the lazy scene registry, component inventory, storage schema v2, logic modules, motion and feedback, audio, testing strategy, build, PWA and CI. | must |
| FR-6 | `docs/TDD.md`'s directory tree, asset manifest and asset summary match the working tree: 29 scene files (bases included), 15 component files, 30 logic modules, 14 utils, the tracked SVG corpus (202 files at the time of writing) across 11 folders with correct per-folder counts, and the `settings/` component group. | must |
| FR-7 | `docs/TDD.md` documents storage schema v2 in full: profiles (max 4, avatars, per-profile stickers and progress), `GameId` for 22 games, `playTime` with `limitMinutes`/`usedMinutes`/`lastUsedDate`, `Settings` including `adaptiveDifficulty` and `preferredVoiceURI`, plus the v1 → v2 migration rule and the known write-failure behaviour (unguarded `localStorage.setItem`). | must |
| FR-8 | `docs/TDD.md` documents the audio system as built: `AudioManager` singleton, SFX names, BGM element, duck-to-8 %-over-120 ms under narration with watchdog restore, `visibilitychange` pause/cancel/resume, and the fact that the duck level is never persisted. | must |
| FR-9 | `conductor/product.md` carries exactly one `## Changelog — Game 20` section and exactly one per other game, with no body text lost. | must |
| FR-10 | A cross-document facts table records, for each shared number (game count, adaptive games, boot SVGs, shell size, test count, coverage), the value and where it is written, and all documents agree with it. | should |

### FR-6 / AC-5 corrective note (2026-10-20)

The first draft of this spec quoted a 207-file SVG corpus. That figure came from a
Recurse count that included five `.gitkeep` placeholders. The tracked corpus is
**202** `.svg` files, confirmed with `git ls-files` before Phase 2, and the
per-folder counts below are the corrected ones: animals 9, feelings 4, items 23,
letters 26, numbers 10, shadows 8, shapes 36, stickers 22, stories 24, toys 7,
ui 33. FR-6 and AC-5 now carry those numbers; the requirement itself (manifest
matches the tree) is unchanged.
## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | Documentation-only change: no file under `src/`, `scripts/`, `public/` or `package.json` is modified. |
| NFR-2 | Every count and claim is traceable — each is derived from a command or a source file, and the evidence file records the command next to the number. |
| NFR-3 | No invented content: anything that cannot be verified from the repository is either omitted or explicitly marked as not documented, never guessed. |
| NFR-4 | Both documents remain readable by their own audience — PRD product-facing, TDD implementation-facing — with no duplicated subsystem description; where they overlap the TDD links to the PRD and states only the mechanism. |
| NFR-5 | Existing voice, tone and formatting conventions are preserved; restructuring may move and renumber sections, but must not turn either document into a changelog. |
| NFR-6 | The full gate chain (`pnpm check`, `pnpm typecheck`, tests, coverage, build, `validate-bundle`, `validate-pwa`) still passes, proving the docs change broke nothing. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | `rg -n "twenty games|all twenty|20 game scenes|twenty-two" docs/PRD.md docs/TDD.md` returns only correct, current statements (each match read and justified in the evidence file). | FR-1, FR-5 |
| AC-2 | Both documents contain sections for Game 21 and Game 22, and `rg "Feelings Faces" docs/PRD.md docs/TDD.md` returns hits for both. | FR-2 |
| AC-3 | PRD states the adaptive split explicitly: 15 adaptive games and the seven fixed ones by name; the count matches `rg -l getAdaptiveBandShift src/scenes` (14 files, 15 games via `GroupMathScene`). | FR-3 |
| AC-4 | TDD's directory tree lists every file under `src/` — verified by diffing the tree's file list against `git ls-files src`. | FR-6 |
| AC-5 | TDD's asset manifest per-folder counts match the tracked corpus (202 total across 11 folders: animals 9, feelings 4, items 23, letters 26, numbers 10, shadows 8, shapes 36, stickers 22, stories 24, toys 7, ui 33). | FR-6 |
| AC-6 | TDD documents the storage schema fields named in FR-7, and states the unguarded-write behaviour that `src/utils/storage.ts:81-85` exhibits. | FR-7 |
| AC-7 | TDD documents duck, watchdog, visibility and the never-persisted duck level, each matching `src/audio/AudioManager.ts`. | FR-8 |
| AC-8 | `rg -c "^## Changelog — Game 20" conductor/product.md` returns 1. | FR-9 |
| AC-9 | The facts table exists and every number in it equals the number written in PRD, TDD, README and `conductor/tech-stack.md`. | FR-10 |
| AC-10 | `git diff --stat` for the whole track touches only `docs/` and `conductor/`, and the full gate chain passes at the final commit. | NFR-1, NFR-6 |

## Edge Cases

- **A number that disagrees between documents.** The facts table wins; correct
  the document, not the table, and record the correction in the evidence file.
- **A feature described in an old section that no longer exists** (e.g. the
  pre-tier asset pipeline, the "20 games" release table). Removed or rewritten,
  never left with a caveat that contradicts the code.
- **A claim that is true but unstated in code terms** (e.g. "no-fail design").
  Keep it as a product principle but anchor it to a mechanism where one exists.
- **A file that exists in the tree but is test-only.** Listed under the test
  section, not the production tree.
- **Doc sections whose numbering is referenced elsewhere** (README, tech-stack,
  release notes). Renumbering is allowed, but any cross-reference that breaks is
  found and fixed in the cross-doc phase.

## Dependencies

- **Tracks:** none open. The two most recent tracks —
  `20261020-feelings-faces` and `20261020-story-sequencing` — are archived and
  merged, so their content is available to document.
- **External:** none. No network, no new tooling.

## Open Questions & Assumptions

- **Assumption:** "structural rewrite" means reorganise around current
  architecture and correct every false claim, not rewrite the prose from scratch;
  both documents keep their existing voice.
- **Assumption:** the TDD keeps its role as the implementation reference and the
  PRD keeps its role as the product requirement record. Where they overlap, the
  TDD states mechanism only.
- **Assumption:** historical records (release notes, checklist entries,
  archived tracks) are immutable and out of scope.
- **Open question:** whether an automated drift guard follows. Deferred by
  decision in this track's scope.

## References

- `docs/PRD.md`, `docs/TDD.md` — the documents being restructured.
- `conductor/product.md` — product definition, the 22-game table, cross-game
  systems, changelogs.
- `conductor/product-guidelines.md` — voice, visual style, accessibility.
- `conductor/tech-stack.md` — the technical facts most already synchronised by
  the Game 22 track.
- `src/scenes/GameSceneBase.ts`, `ChoiceRoundScene.ts`, `GroupMathScene.ts`,
  `src/components/RoundNarrator.ts`, `src/utils/storage.ts`,
  `src/audio/AudioManager.ts` — the sources every rewritten claim is checked
  against.
