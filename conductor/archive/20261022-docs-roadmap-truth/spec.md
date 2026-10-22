# Docs & Roadmap Truth Pass — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Bring the repository's documentation back in line with the code it describes,
give the project the Known Issues and roadmap it has never had, write the
release notes for the eight tracks that merged after v1.20.0, and add a
validator that fails the build when the documents drift from the source again.

## Problem / Motivation

The documentation is not merely incomplete — in a growing number of places it
now states things the code contradicts, and a reader cannot tell which half is
current. The audit behind this track found roughly thirty such claims across
`README.md`, `docs/PRD.md`, `docs/TDD.md`, `docs/release-checklist.md`,
`docs/device-testing-checklist.md`, `docs/perf-baseline.md` and
`conductor/product.md`.

The load-bearing examples, all verified against `master` at `ab00187` on
2026-10-22:

- **`docs/PRD.md` §7.1 and §7.2** still describe the boot set as "178 SVG
  entries" rasterised to "35 icon, 141 card and 2 hero textures" costing
  40.7 MiB, and the shell entry as "195.4 kB". The shipped system has a
  **53-key** shell, **125** game art keys in **12** lazy groups, a **202**-SVG
  corpus and a shell entry of **134.6 kB**. PRD §7.3's "Nothing else is
  per-game art" is the exact inverse of the shell diet's whole point.
- **Twelve §3.x "Art and assets" lines** in the PRD still say their art is "in
  the boot set"; nearly all of it is now lazy per-group art.
- **`docs/TDD.md` §2.1 and §2.2** list a source tree that is wrong by 25+
  files: `components/` is "15 files" (16), `game/` is "30 files" and omits
  `audioIdentity.ts`, `dragBoard.ts` and the two undocumented subpackages
  `src/game/art/` and `src/game/hub/`.
- **`docs/TDD.md` §8** predates the per-game audio identity entirely, and
  **§8.2** still lists fixed C5/E5/G5 notes for a system that now derives a
  trio per game.
- **`docs/TDD.md` §3.6** quotes a 130.1 KiB shell against the README's
  129.1 KiB; the measured value is 134.6 kB across **42** chunks, and the
  precache holds **54** entries.
- **`docs/TDD.md` §10.2** claims "110 test files, 2,305 tests". The suite is
  **118 files / 2488 tests**.
- **`README.md:49`** repeats the same stale count; `README.md:158` quotes the
  2026-10-20 build.
- **`docs/release-notes-v1.20.0.md`** carries a Known Issues bullet stating
  that "PRD and TDD still describe a twenty-game suite" — false, and fixed
  three hours after that release shipped.
- **`docs/release-checklist.md`** quotes "13/13" PWA checks (now 16), "19
  precache entries" (now 54), "all seven game Back buttons" (now 22) and
  "seven 56px thumbnails" (now 22 at 22 px, 30 px when paged); it also points
  at three `conductor/tracks/release-*` directories that no longer exist, and
  still carries a v1.16.0 "Release Candidate Gates (DRAFT)" block that lists
  the Ligne WASM engine deleted in PR #38.
- **`docs/device-testing-checklist.md`** says the Hub "pages to 2 pages of 10
  tiles" (22 games is 3 pages: 10 + 10 + 2), lists "twenty 56px stickers", has
  no row for Games 21 or 22, and its newest execution record is dated
  2026-10-17/18 — six tracks before now, including the shell diet that
  materially changed boot and first tap.
- **`docs/perf-baseline.md`** still numbers the shell at 129.1 KiB, 41 chunks
  and 53 precache entries, and its cold-boot figure (419.5 ms) was measured
  before PRs #52–#54.
- **`conductor/product.md`** carries two near-duplicate "Game 20 — Number
  Order" changelog entries (lines 143 and 147) that disagree about the
  difficulty ladder.

Two structural gaps sit underneath the wrong numbers.

**Nothing anywhere in `docs/` states what is known to be broken.** The words
"Known Issues" appear only as a template heading in the release checklist and
as an "Issues Found" field in the device checklist; "Roadmap" and "Future
Work" appear nowhere. The audit's standing debts — the real-device testing
deferred since v1.0, the seven games excluded from adaptive banding, the
hand-rolled drag games, the missing storage schema version, the install-prompt
scope bug — have no home, so each is rediscovered by every reader.

**Eight tracks have merged with zero release-note coverage.** The v1.20.0 tag
sits at `437d56b`. Since it, PRs #48, #49, #50, #51, #52, #53, #54 and #55
merged — the PRD/TDD rewrite, the shell diet, the docs pass, the game-metadata
single source of truth, the drag-board shell, the hub-grid decomposition, the
per-game audio identity and the session-lifecycle fixes. `package.json` still
reads `1.20.0`, and the newest release note on disk is v1.20.0. A parent
reading the release notes sees a product that does not exist.

Who feels it: a maintainer who trusts the TDD and loses an hour to a figure
that was correct in August; a reviewer who cannot tell whether a doc claim is
stale or new; a release manager who has no notes to publish and no Known
Issues to publish with them. If it is not solved, the next truth pass starts
from the same audit, and the drift rate grows with every track.

## Goals & Success Metrics

- **Goal:** every factual claim in `README.md`, `docs/PRD.md`, `docs/TDD.md`,
  `docs/release-checklist.md`, `docs/device-testing-checklist.md`,
  `docs/perf-baseline.md` and `conductor/product.md` matches the code at
  review time.
  - **Metric:** no document states a boot-set size, shell size, chunk count,
    precache count, test count, game count, page count or sticker size that
    the repository contradicts; every remaining figure is either derived from
    the code or carries the date it was measured.
- **Goal:** the project states what it knows is broken and what it intends to
  do next.
  - **Metric:** `docs/roadmap.md` exists with a Known Issues section and a
    Future Work / Roadmap section, and is linked from `README.md`,
    `docs/PRD.md`, `docs/TDD.md` and `docs/perf-baseline.md`; no second copy of
    the list exists anywhere.
- **Goal:** the eight tracks merged since v1.20.0 are documented.
  - **Metric:** `docs/release-notes-v1.21.0.md` exists, is banner-marked
    *Unreleased*, and covers PRs #48 through #55; no version bump and no tag
    accompany it.
- **Goal:** the documents cannot drift back without the build noticing.
  - **Metric:** `node scripts/validate-docs.js` exits non-zero on a deliberate
    drift and is a step in the CI `Quality Gates` job and in the workflow's
    `verify_phase` command.

## Scope

### In Scope

- The PRD and the TDD rewritten against the shipped 22-game product: the
  boot/preload/asset-budget sections (§3.x art lines, §7.1, §7.2, §7.3), the
  source tree (§2.1, §2.2), the base-class member table (§4.2), the
  game-to-base table (§4.5), the audio chapter (§8), the game-logic module
  list and adaptive-banding description (§7.1, §7.3), and the test-suite
  figures (§10.2, §10.3, §10.4).
- `README.md`: the suite figures, the build-output paragraph, the scene
  hierarchy and file-tree lists, the Releases table, the Docs index, the
  "Big & Small" naming, the "bob while idle" wording, and a new Known Issues
  section.
- `conductor/product.md`: the duplicated Game 20 changelog entry collapsed to
  one accurate entry, and the changelog continued for the eight tracks that
  merged after it.
- `docs/release-checklist.md`: the PWA-check, precache, game-count and
  thumbnail arithmetic; the three broken `conductor/tracks/release-*` path
  references; the obsolete v1.16.0 draft block; the release-branch flow
  description; the v1.20.0 sign-off and a v1.21.0 prep block.
- `docs/device-testing-checklist.md`: the sticker and page arithmetic, the
  per-game rows for Games 21 and 22, the rows for what shipped after
  2026-10-20 (per-game audio identity, the shared drag board's swap and
  tap-withdraw, the three-page paged Hub, the cold first-tap art cue, the
  22-tile Progress pagination), and the broken path references.
- `docs/perf-baseline.md`: a header saying which figures are live, a freshly
  measured cold boot, and the current shell size, chunk count and precache
  count.
- `docs/roadmap.md` (new): the Known Issues list and the Future Work /
  Roadmap, as the single home for both.
- `docs/release-notes-v1.21.0.md` (new): the eight unnoted tracks, banner-
  marked *Unreleased*, including the disposition of the v1.20.0 Known Issues.
- `scripts/validate-docs.js` (new) and its wiring into the CI `Quality Gates`
  job and into `conductor/workflow.md`'s `verify_phase` command.

### Out of Scope

- Any change to `src/`. This track touches documentation, one CI-facing
  script, one CI workflow file and the workflow's own gate command.
- The version bump in `package.json`, the `v1.21.0` tag, and the deployment
  it would trigger. Those are human release decisions under
  `conductor/workflow.md`; this track only authors the notes document.
- Rewriting `docs/release-notes-v1.20.0.md`. A shipped release note is a
  historical record. Its false Known Issues bullet is not edited; the new
  v1.21.0 notes state which of the v1.20.0 issues are now resolved.
- The `conductor/product.md` changelog for pre-v1.20.0 games.
- Executing the device-testing checklist. This track corrects what the
  checklist says and adds the missing rows; the rows stay unchecked until a
  human runs them on a device.
- Repository hygiene unrelated to the documents: the stray `test-out.txt` at
  the repository root, the ~99 tracked PNGs under `docs/svg-contact-sheets/`
  that contradict `.gitignore`, and the `.opencode/` ignore rule.
- The seven games excluded from adaptive banding, the hand-rolled drag games,
  the storage schema version, the install-prompt scope bug, and the
  navigation failure path. These are recorded in the roadmap as Known Issues
  and Future Work; fixing them is separate work.
- Any new runtime dependency. The validator uses only the Node standard
  library.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | `docs/PRD.md` and `docs/TDD.md` describe the shipped system. The boot set, the asset tiers, the shell size, the chunk and precache counts, the source tree, the base-class member tables, the game-to-base mapping, the audio chapter (including the per-game audio identity), the game-logic module list, the adaptive-banding description and the test-suite figures all match the code. | must |
| FR-2 | `README.md`, `conductor/product.md`, `docs/release-checklist.md`, `docs/device-testing-checklist.md` and `docs/perf-baseline.md` describe the shipped system. The suite figures, the build-output figures, the scene hierarchy and file lists, the Releases table, the Docs index, the product naming, the product changelog, the checklist arithmetic, the checklist path references, the obsolete draft block and the perf baseline are all corrected; `docs/perf-baseline.md` carries a freshly measured cold boot. | must |
| FR-3 | `docs/roadmap.md` exists and holds two sections, **Known Issues** and **Future Work / Roadmap**. It is the single home for both. `README.md` carries a compact Known Issues list and links to it; `docs/PRD.md`, `docs/TDD.md` and `docs/perf-baseline.md` link to it. No second document carries a copy of either list. | must |
| FR-4 | `docs/release-notes-v1.21.0.md` exists, is banner-marked *Unreleased*, and covers PRs #48 through #55 — what shipped, for whom, and what a parent or maintainer would notice. It also states which of the v1.20.0 Known Issues are now resolved. `package.json` stays at `1.20.0` and no tag is created. | must |
| FR-5 | `scripts/validate-docs.js` exists and asserts the durable document invariants: every `docs/release-notes-v*.md` is linked from the README's Docs index; every relative link in `README.md` and `docs/*.md` resolves to a file; every anchor link resolves to a heading in its target; the PRD and the README describe exactly the games in `GAME_REGISTRY`; the TDD's game table has a row per game; `docs/roadmap.md` carries both required sections; and no document references a `conductor/tracks/` path that does not exist. It exits `0` when the documents agree and non-zero with a per-failure report when they do not. It runs as a step in the CI `Quality Gates` job and is added to the `verify_phase` command in `conductor/workflow.md`. It uses only the Node standard library and never touches the network. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No product behaviour changes. `src/` is not modified. The only new executable artefact is a Node script under `scripts/`, which runs in CI and locally and ships in no bundle. |
| NFR-2 | The validator adds no dependency — no package, no transitive install, nothing fetched at run time. It must run on Node 22 with the repository's own toolchain. |
| NFR-3 | The full gate stays green: `pnpm check`, `pnpm typecheck`, `pnpm test -- --run`, `pnpm test:coverage` (lines 95 / functions 88 / branches 85 / statements 90), `pnpm build`, `node scripts/validate-bundle.js`, `node scripts/validate-pwa.js` (16/16), and — from FR-5 — `node scripts/validate-docs.js`. The pre-existing Biome warning in `src/__tests__/scenes/musicalMemoryScene.test.ts:294` and the `biome.json` schema info are unchanged and out of scope. |
| NFR-4 | Every corrected figure is verifiable: it is either derived from the code at review time, or it is a measured value that carries the date it was measured. A figure that is neither is removed rather than restated. |
| NFR-5 | The documents keep their audience. The PRD and TDD stay technical; the README and the release notes stay readable by a parent, a teacher or a new maintainer. No child-facing copy changes. |
| NFR-6 | The validator must not fail on a legitimate change. It checks durable invariants, never a volatile snapshot such as the test count or the bundle size, so that adding a test or a game does not fail CI before the documents have caught up — it fails only when the documents and the code have genuinely parted. |
| NFR-7 | The offline-first principle holds: no new network access at runtime, in the app or in the validator. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | `docs/PRD.md` §7.1, §7.2 and §7.3 describe a 53-key shell, 125 game art keys in 12 lazy groups and a 202-SVG corpus, and no §3.x "Art and assets" line claims its art is in the boot set when it is lazy. | FR-1 |
| AC-2 | `docs/TDD.md` §2.1 and §2.2 list exactly the production files that exist under `src/`, including `src/game/art/` and `src/game/hub/`, `audioIdentity.ts` and `dragBoard.ts`; and §10.2 states the current suite size. | FR-1 |
| AC-3 | `docs/TDD.md` §8 and `docs/PRD.md` §6.1 describe the per-game audio identity, and `docs/TDD.md` §4.2 and §4.5 match the current base classes and game-to-base mapping. | FR-1 |
| AC-4 | No document under `README.md` or `docs/` states a game count, page count, sticker size, chunk count, precache count, PWA-check count or path reference that the repository contradicts; `conductor/product.md` carries one Game 20 changelog entry, not two; `docs/perf-baseline.md` carries a dated, freshly measured cold boot. | FR-2 |
| AC-5 | `docs/roadmap.md` exists with a **Known Issues** section and a **Future Work / Roadmap** section; `README.md`, `docs/PRD.md`, `docs/TDD.md` and `docs/perf-baseline.md` each link to it; no other document contains a second copy of either list. | FR-3 |
| AC-6 | `docs/release-notes-v1.21.0.md` exists, carries an *Unreleased* banner, names PRs #48–#55, and states the disposition of the v1.20.0 Known Issues; `package.json` still reads `1.20.0` and no `v1.21.0` tag exists. | FR-4 |
| AC-7 | `node scripts/validate-docs.js` exits `0` on the current tree; a deliberate temporary drift (for example a broken link, a removed release-notes file, or a missing PRD game heading) makes it exit non-zero with a per-failure report; the drift is then reverted. The script appears as a step in `.github/workflows/ci.yml`'s `Quality Gates` job and in `conductor/workflow.md`'s `verify_phase`. | FR-5 |
| AC-8 | The full `verify_phase` command, including the new `validate-docs` step, exits `0` on the track branch. | FR-1, FR-2, FR-3, FR-4, FR-5 |

## Edge Cases

- **A volatile number.** The test count, the bundle size and the chunk count
  change on almost every track. The documents either drop the snapshot or
  date it; the validator never gates on it (NFR-6). A dated snapshot that
  goes stale is a documentation miss, not a build failure.
- **A new game.** The validator compares the PRD headings and the README list
  against `GAME_REGISTRY`, so adding a game fails the check until the
  documents describe it. That is the intended friction.
- **Anchors.** Renaming a heading breaks every deep link to it. The anchor
  check catches the breakage; the heading and its links move together.
- **Historical records.** `docs/release-notes-v1.20.0.md` is not rewritten,
  and the `docs/release-checklist.md` and `docs/device-testing-checklist.md`
  per-release blocks are history, not current state. Their *current-state*
  statements are corrected; their dated execution records are not.
- **The unchecked device rows.** Roughly a hundred unchecked device-testing
  rows are pending work, not documentation errors. They stay unchecked. Only
  the factual prose around them and the missing rows for what shipped after
  2026-10-20 are touched.
- **The validator's own reach.** It reads the working tree, so it must run
  from the repository root. It must not assert anything about the tracked
  contact-sheet PNGs or any other file outside the documents it governs.
- **A dirty tree.** The validator's result depends on what is on disk, so the
  phase that adds it verifies against a clean tree.
- **A loaded machine.** `pnpm test -- --run` intermittently hits wall-clock
  timeouts in files no phase touches. The established fallback
  (`--maxWorkers=2`) applies, and no test is modified to work around a
  timeout.

## Dependencies

- **Tracks:** none. The eight tracks this track documents (#48–#55) are all
  merged; `master` at `ab00187` is the base.
- **External:** none. The cold-boot re-measurement needs a local
  `vite preview` on port 4173, Node 22 and pnpm 11.7.0 — all present.

## Open Questions & Assumptions

- **Assumption:** the child's UI label "Big & Small" (the label in
  `GAME_REGISTRY`) is canonical, so the PRD heading and its anchor are
  aligned to it rather than the other way round. The label is what ships in
  the app; the document is what has drifted.
- **Assumption:** "unreleased v1.21.0" is a document name only. `package.json`
  stays at `1.20.0`, no tag is cut, and the version bump and deployment
  remain human release decisions under `conductor/workflow.md`.
- **Assumption:** the validator checks durable invariants and deliberately
  does not gate on the test count, the bundle size or any other volatile
  snapshot, so that ordinary development does not fail CI.
- **Assumption:** the Known Issues and the roadmap live in one new document,
  `docs/roadmap.md`, rather than being duplicated into four documents. Only
  the README carries a short, linked summary.
- **Assumption:** the freshly measured cold boot replaces the 2026-10-20
  figure in `docs/perf-baseline.md`; the old figure remains untouched in the
  v1.20.0 release notes, which are history.
- **Assumption:** `conductor/product.md`'s changelog is continued for the eight
  tracks as a single consolidated entry per track, matching the existing
  per-track style, and the duplicate Game 20 entry is resolved in favour of
  the one that agrees with the shipped ladder (`[1,1,2,2,3,3]` classic).
- **Assumption:** `conductor/product.md` has no "Open Questions & Assumptions"
  section, so no product-level question seeds this spec; the four scope
  decisions the user made on 2026-10-22 are recorded here instead.
- **Question:** should the validator also gate the *number* of precache
  entries and the shell size against the built bundle?
  - **Assumption:** no. Both change with almost every asset or chunk change
    and would make the check a snapshot rather than an invariant. The bundle
    validator (`scripts/validate-bundle.js`) already owns the size gate.

## References

- The audit that seeded this track: `README.md`, `docs/PRD.md` §2, §3, §4.8,
  §6.1, §7.1–7.3; `docs/TDD.md` §2.1, §2.2, §3.3–3.6, §4.2, §4.5, §7.1,
  §7.3, §8, §10.2–10.4; `docs/release-checklist.md`; `docs/device-testing-checklist.md`;
  `docs/perf-baseline.md`; `docs/release-notes-v1.20.0.md`; `conductor/product.md`.
- The shipped code the documents must match: `src/game/gameRegistry.ts` (22
  games), `src/scenes/PreloadScene.ts` (`SHELL_ASSETS`, 53 keys),
  `src/game/art/types.ts` (12 art groups), `src/game/audioIdentity.ts`,
  `src/scenes/GameSceneBase.ts`, `src/scenes/ChoiceRoundScene.ts`,
  `src/game/hub/`, `src/game/dragBoard.ts`, `scripts/validate-bundle.js`,
  `scripts/validate-pwa.js`, `scripts/validate-boot.js`.
- `conductor/workflow.md` — the `## Workflow Config` block, the
  `## Verification Strategy` (including the boot smoke check on port 4173) and
  the Release & deployment section that reserves tagging and the version bump
  for a human.
- `conductor/product-guidelines.md` §1 and §4 — the voice the documents are
  written in.
