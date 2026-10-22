# Docs & Roadmap Truth Pass — Implementation Plan

> **Branch:** `chore/20261022-docs-roadmap-truth`
> **Base:** `master` @ `ab00187ed4a0ff6bd779ef9d9a33880f8c6b6b42`

> Only the primary agent writes this file. Phase states: `pending | in_progress |
> verified | failed | blocked`.

## Phase 1: The Technical Docs

- **Goal:** `docs/roadmap.md`, `docs/PRD.md` and `docs/TDD.md` describe the shipped
  22-game product, and the roadmap exists as the single home for the Known
  Issues and the Future Work.
- **Depends on:** none
- **Covers:** FR-1, FR-3, NFR-1, NFR-4, NFR-5, AC-1, AC-2, AC-3, AC-5
- **Touches:** `docs/roadmap.md`, `docs/PRD.md`, `docs/TDD.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified

- [x] **P1.T1: Create `docs/roadmap.md`** — covers: FR-3
  - [x] **P1.T1.1:** Write the **Known Issues** section from the audit's standing
    debts: real-device testing deferred since v1.0; the seven games excluded
    from adaptive banding; the three hand-rolled drag games; the missing
    storage schema version; the install-prompt scope bug; the navigation
    chunk-load failure path; play-time banking on a killed app; the five
    duplicate `shuffle` copies; the repository-hygiene items.
  - [x] **P1.T1.2:** Write the **Future Work / Roadmap** section, ordered by
    value, each item naming the track that would deliver it.
  - [x] **P1.T1.3:** Give every Known Issue a one-line symptom, the file where
    it lives, and how a reader would notice it.
- [x] **P1.T2: Correct the PRD** — covers: FR-1
  - [x] **P1.T2.1:** §7.1 — the boot set: 53 shell keys, 125 game art keys in 12
    lazy groups, the 202-SVG corpus, the tier rule.
  - [x] **P1.T2.2:** §7.2 — the shell entry size, the chunk list, the precache
    count, the measured build.
  - [x] **P1.T2.3:** §7.3 — replace "Nothing else is per-game art" with the
    lazy-group model.
  - [x] **P1.T2.4:** The twelve §3.x "Art and assets" lines — lazy, not boot set.
  - [x] **P1.T2.5:** §6.1 — the sound-effect table, now a per-game trio.
  - [x] **P1.T2.6:** §4.8 — the adaptive-banding description: the 15/7 split, the
    window semantics, and the six shift strategies.
  - [x] **P1.T2.7:** Link `docs/roadmap.md`; align the game heading and its
    anchor with the shipped "Big & Small" label.
- [x] **P1.T3: Correct the TDD** — covers: FR-1
  - [x] **P1.T3.1:** §2.1 and §2.2 — the scripts list and the source tree,
    including `src/game/art/`, `src/game/hub/`, `audioIdentity.ts` and
    `dragBoard.ts`.
  - [x] **P1.T3.2:** §3.3–§3.6 — the shell, the tiers, the in-chunk art, the
    measured budgets.
  - [x] **P1.T3.3:** §4.2 and §4.5 — the base-class member tables and the
    game-to-base mapping.
  - [x] **P1.T3.4:** §7.1 and §7.3 — the module list and the adaptive banding.
  - [x] **P1.T3.5:** §8 — the audio chapter, including the per-game identity.
  - [x] **P1.T3.6:** §10.2–§10.4 — the suite size, the coverage snapshot, the
    SVG count.
  - [x] **P1.T3.7:** Link `docs/roadmap.md`.
- [x] **P1.T4: Record the fact table in the evidence file** — covers: AC-1, AC-2, AC-3
  - [x] **P1.T4.1:** For every corrected figure, record the command or the file
    it was derived from.
  - [x] **P1.T4.2:** Re-run the phase verification command.

**Result:** verified
**Checkpoint:** abd1272
**Evidence:** conductor/tracks/20261022-docs-roadmap-truth/verification/phase-1.md

## Phase 2: The Reader-Facing Docs

- **Goal:** `README.md`, `docs/release-notes-v1.21.0.md` and
  `conductor/product.md` describe the shipped product, carry the release notes
  for the eight unnoted tracks, and link the roadmap.
- **Depends on:** Phase 1
- **Covers:** FR-2, FR-3, FR-4, NFR-4, NFR-5, AC-4, AC-5, AC-6
- **Touches:** `README.md`, `docs/release-notes-v1.21.0.md`, `conductor/product.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified

- [x] **P2.T1: Correct the README** — covers: FR-2
  - [x] **P2.T1.1:** The suite figures and the build-output paragraph.
  - [x] **P2.T1.2:** The scene hierarchy and the file-tree lists.
  - [x] **P2.T1.3:** The Releases table and the Docs index — every
    `docs/release-notes-v*.md` on disk linked.
  - [x] **P2.T1.4:** The "Big & Small" naming, the idle-tile wording, and every
    `docs/PRD.md#anchor` link.
  - [x] **P2.T1.5:** The compact **Known Issues** section and the roadmap link.
- [x] **P2.T2: Write the release notes for the eight tracks** — covers: FR-4
  - [x] **P2.T2.1:** `docs/release-notes-v1.21.0.md` — the *Unreleased* banner
    and one entry per track for PRs #48 through #55.
  - [x] **P2.T2.2:** The disposition of the v1.20.0 Known Issues — which are
    resolved, which stand.
  - [x] **P2.T2.3:** The changes a parent would notice, in plain language.
- [x] **P2.T3: Fix the product changelog** — covers: FR-2
  - [x] **P2.T3.1:** Collapse the duplicate "Game 20 — Number Order" entry to the
    one that agrees with the shipped ladder.
  - [x] **P2.T3.2:** Continue the changelog for the eight tracks, in the
    existing per-track style.

**Result:** verified
**Checkpoint:** 18884a6
**Evidence:** conductor/tracks/20261022-docs-roadmap-truth/verification/phase-2.md

## Phase 3: The Checklists and the Perf Baseline

- **Goal:** `docs/release-checklist.md`, `docs/device-testing-checklist.md` and
  `docs/perf-baseline.md` state the current truth, and the perf baseline carries
  a freshly measured cold boot.
- **Depends on:** Phase 2
- **Covers:** FR-2, FR-3, NFR-4, NFR-5, AC-4, AC-5
- **Touches:** `docs/release-checklist.md`, `docs/device-testing-checklist.md`, `docs/perf-baseline.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`, plus the boot smoke check (`node node_modules/vite/bin/vite.js preview --port 4173 --strictPort`, then `node scripts/validate-boot.js`, then stop the preview)
- **Status:** verified

- [x] **P3.T1: Re-measure the boot figures** — covers: FR-2
  - [x] **P3.T1.1:** Start the preview on 4173, run `node scripts/validate-boot.js`,
    capture the cold-boot median, then stop the preview.
  - [x] **P3.T1.2:** Record the current shell entry size, the chunk count and
    the precache count from the built bundle.
- [x] **P3.T2: Rewrite the perf baseline** — covers: FR-2
  - [x] **P3.T2.1:** A header saying which figures are live and when they were
    measured.
  - [x] **P3.T2.2:** The Shell Diet section — the before/after table, the
    per-game first-tap table, the superseded rasterisation and preload figures.
  - [x] **P3.T2.3:** Link `docs/roadmap.md`.
- [x] **P3.T3: Correct the release checklist** — covers: FR-2
  - [x] **P3.T3.1:** The PWA-check count, the precache count, the game count and
    the thumbnail sizes.
  - [x] **P3.T3.2:** The three `conductor/tracks/release-*` path references.
  - [x] **P3.T3.3:** The obsolete v1.16.0 draft block and the release-branch
    flow description.
  - [x] **P3.T3.4:** The v1.21.0 prep block — notes authored, gates run, version
    bump and tag left to a human.
- [x] **P3.T4: Correct the device-testing checklist** — covers: FR-2
  - [x] **P3.T4.1:** The sticker count and size, the Hub page arithmetic.
  - [x] **P3.T4.2:** The rows for Games 21 and 22, and for what shipped after
    2026-10-20 — the per-game audio identity, the shared drag board's swap and
    tap-withdraw, the three-page paged Hub, the cold first-tap art cue, the
    22-tile Progress pagination.
  - [x] **P3.T4.3:** The broken `conductor/tracks/release-*` path references.

**Result:** verified
**Checkpoint:** 3683c13
**Evidence:** conductor/tracks/20261022-docs-roadmap-truth/verification/phase-3.md

## Phase 4: The Guard

- **Goal:** `scripts/validate-docs.js` asserts the durable document invariants
  and fails the build when the documents and the code part company.
- **Depends on:** Phase 3
- **Covers:** FR-2, FR-5, NFR-1, NFR-2, NFR-3, NFR-4, NFR-6, NFR-7, AC-7, AC-8
- **Touches:** `scripts/validate-docs.js`, `.github/workflows/ci.yml`, `conductor/workflow.md`, `docs/TDD.md` (the validator table in §11.3 only), `README.md` (the CI description and the build paragraph's timing figures)
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P4.T1: Write `scripts/validate-docs.js`** — covers: FR-5
  - [x] **P4.T1.1:** Every `docs/release-notes-v*.md` is linked from the README's
    Docs index.
  - [x] **P4.T1.2:** Every relative link in `README.md` and `docs/*.md` resolves
    to a file; every anchor link resolves to a heading in its target.
  - [x] **P4.T1.3:** The PRD, the README and the TDD's game table describe
    exactly the games in `GAME_REGISTRY`.
  - [x] **P4.T1.4:** `docs/roadmap.md` carries both required sections; no
    document references a `conductor/tracks/` path that does not exist.
  - [x] **P4.T1.5:** A per-failure report on stdout and a non-zero exit. Node
    standard library only; no network.
- [x] **P4.T2: Prove the guard fails on drift** — covers: AC-7
  - [x] **P4.T2.1:** Three deliberate drifts — a broken link, an unlinked
    release-note file, a missing PRD game heading — each makes the script exit
    non-zero with a per-failure report. Revert each.
  - [x] **P4.T2.2:** A clean tree makes the script exit `0`.
- [x] **P4.T3: Wire it in** — covers: FR-5, AC-7, AC-8
  - [x] **P4.T3.1:** A `Document validation` step in the CI `Quality Gates` job.
  - [x] **P4.T3.2:** The `verify_phase` command in `conductor/workflow.md`.
  - [x] **P4.T3.3:** The script in the TDD's §11.3 validator table and in the
    README's CI description.
- [x] **P4.T4: Correct the README's cold first-tap sentence** — covers: FR-2,
  NFR-4
  - [x] **P4.T4.1:** The build paragraph says the 82 ms figure is the *increment*
    the shell-diet track measured against a built pre-track baseline, not the
    absolute cost of a cold first tap, and it points at `docs/perf-baseline.md`
    for the absolute measurement and its date. The 400 ms budget is the budget
    for the absolute figure.
  - [x] **P4.T4.2:** The timing figures stay dated, and the cold-boot figure
    names the 2026-10-22 re-measurement alongside the 2026-10-20 one.

**Result:** verified
**Checkpoint:** 25b26ec
**Evidence:** conductor/tracks/20261022-docs-roadmap-truth/verification/phase-4.md

## Phase R1: Review Fixes

- **Goal:** Resolve review findings F1, F2, F3, F4, F5 and F6
- **Depends on:** Phase 4
- **Covers:** FR-1, FR-2, FR-4, FR-5, NFR-4, AC-4, AC-6, AC-7
- **Touches:** `scripts/validate-docs.js`, `docs/release-checklist.md`, `docs/PRD.md`, `docs/roadmap.md`, `docs/release-notes-v1.21.0.md`, `docs/device-testing-checklist.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **R1.T1: Make the Conductor-path check see the paths it guards** — covers: F1
  - [x] **R1.T1.1:** `checkConductorPaths` scans lines with fenced code blocks
    nulled but inline code spans left intact, so a backticked
    `conductor/tracks/...` reference is seen.
  - [x] **R1.T1.2:** A fourth deliberate drift — reintroduce a backticked
    `conductor/tracks/release-1.1.0-mechanics_20260802/` in
    `docs/release-checklist.md` — makes the script exit non-zero with a
    per-failure report. Revert it, and leave nothing behind.
  - [x] **R1.T1.3:** The clean tree still exits `0`, and the script's header
    comment matches what it does.
- [x] **R1.T2: Bring the release checklist's gate rows up to date** — covers: F2
  - [x] **R1.T2.1:** §1 gains a `validate-docs` row; the Quality Gates step
    list says eight steps and includes `node scripts/validate-docs.js`; the
    Step 2 fence gains the same command.
  - [x] **R1.T2.2:** The Biome file count reads the number the current tree
    actually checks.
- [x] **R1.T3: Say "breathe", not "bob", in the three places that describe the idle tile motion** — covers: F3
  - [x] **R1.T3.1:** `docs/PRD.md` §5.6, `docs/release-checklist.md` §4c and
    `docs/device-testing-checklist.md` agree with `README.md` and with
    `src/game/hub/hubGridConstants.ts`. The mascot's own bob is left alone.
- [x] **R1.T4: Correct the roadmap's repository-hygiene claims** — covers: F4
  - [x] **R1.T4.1:** The number of tracked contact-sheet PNGs, the fact that the
    folder's root holds twelve PNGs the ignore rule does match, and the source
    of the "regenerated" comment all state what the tree actually contains.
- [x] **R1.T5: Correct the two figures in the PR #49 entry** — covers: F5
  - [x] **R1.T5.1:** The lazy art groups are described with their real key
    count, and the first-tap figure says it is an increment and points at the
    absolute measurement.
- [x] **R1.T6: Correct the Learning Progress row's expected behaviour** — covers: F6
  - [x] **R1.T6.1:** The row says the chevrons dim at the first and last page
    rather than wrap, matching `src/components/settings/ProgressOverlay.ts`.

**Result:** verified
**Checkpoint:** f0227f3
**Evidence:** conductor/tracks/20261022-docs-roadmap-truth/verification/phase-R1.md

<!--
The primary appends after acceptance:

**Result:** <verified | failed | blocked | partial>
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261022-docs-roadmap-truth/verification/phase-<n>.md

---

`conductor-review` appends:

## Phase R<n>: Review Fixes

- **Goal:** Resolve review findings F<n>
- **Depends on:** Phase <n>
- **Covers:** F<n>
- **Touches:** <paths>
- **Verification:** <command>
- **Status:** pending

- [ ] **R<n>.T1: Resolve <finding ID>** — covers: F<n>
-->
