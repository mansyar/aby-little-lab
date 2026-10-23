# Implementation Plan — Adaptive Difficulty Completion

> **Branch:** `feat/20261023-adaptive-banding-completion`
> **Base:** `master` (after PR #56)

Phases are executed sequentially, one at a time. Phase states:
`pending | in_progress | verified | failed | blocked`. Only the primary agent
writes this file.

> **Machine note (applies to every phase):** plain `pnpm test -- --run` times
> out on this host under load (wall-clock timeouts in untouched files). The
> sanctioned form here is `pnpm test -- --run --maxWorkers=1` (and the same
> flag on the coverage layer). No test is ever edited to work around a
> timeout.

## Phase 1: The three compose-only knobs

- **Goal:** Shape Sorter, Animal Trace and Pop & Freeze respond to the band
  shift, each through its own dimension, with new tests proving the bands
  move and the classic draws reproduce shipped behaviour; no content changes.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, AC-1, AC-2
- **Touches:** `src/game/shapeSorterLogic.ts`, `src/game/animalTraceLogic.ts`,
  `src/game/popFreezeLogic.ts`, `src/scenes/ShapeSorterScene.ts`,
  `src/scenes/AnimalTraceScene.ts`, `src/scenes/PopFreezeScene.ts`,
  `src/__tests__/game/shapeSorterLogic.test.ts`,
  `src/__tests__/game/animalTraceLogic.test.ts`,
  `src/__tests__/game/popFreezeLogic.test.ts`,
  `src/__tests__/scenes/shapeSorterScene.test.ts`,
  `src/__tests__/scenes/animalTraceScene.test.ts`,
  `src/__tests__/scenes/popFreezeScene.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P1.T1: Shape Sorter's band-selected shape pool** — covers: FR-1
  - [x] **P1.T1.1: A failing band-shift test for the shape pool** (a seeded
    or pool-level test shows the easy and hard bands drawing from
    distinguishable pools, and shift 0 drawing all 18 as today)
  - [x] **P1.T1.2: `poolFor(shift)`/band-aware draw in `shapeSorterLogic.ts`**
    (easy = the most ornamental / most distinct subset, classic = all 18,
    hard = the confusable geometric subset; no repeat within a playthrough)
  - [x] **P1.T1.3: Scene wiring** — `ShapeSorterScene` passes
    `getAdaptiveBandShift(...)` once in `create()`, progress dots unchanged
- [x] **P1.T2: Animal Trace's waypoint bandwidth** — covers: FR-2
  - [x] **P1.T2.1: A failing band-shift test for the waypoint count**
  - [x] **P1.T2.2: Band-aware waypoints in `animalTraceLogic.ts` / the
    scene's path generation** (4 / 6 / 8 points; drawing, progress and
    completion consume the round's waypoint count)
  - [x] **P1.T2.3: Scene wiring** — `AnimalTraceScene` passes the shift once
    in `create()`
- [x] **P1.T3: Pop & Freeze's sleeping-bubble bounds** — covers: FR-3
  - [x] **P1.T3.1: A failing band-shift test for the sleeping bounds** (the
    spawn honours 0–1, 1–2 and 2–3 sleeping bubbles, and the wake flow at an
    all-poppable opening stays inert)
  - [x] **P1.T3.2: Band-aware bounds in `popFreezeLogic.ts`** (the bounds
    parameterized; `selectBubbleType` guards hold at the 0 floor)
  - [x] **P1.T3.3: Scene wiring** — `PopFreezeScene` passes the shift once in
    `create()`

**Result:** verified
**Checkpoint:** 3629a81
**Evidence:** conductor/tracks/20261023-adaptive-banding-completion/verification/phase-1.md

## Phase 2: The scale and scenario games

- **Goal:** Big & Small responds through scale contrast, Feelings Faces
  through its distinct/confusable split with a scenario pool grown to 24
  (text-only, spoken by the narrator), classic behaviour pinned.
- **Depends on:** Phase 1
- **Covers:** FR-5, FR-6, AC-1, AC-2
- **Touches:** `src/game/bigSmallLogic.ts`, `src/game/feelingsFacesLogic.ts`,
  `src/scenes/BigSmallScene.ts`, `src/scenes/FeelingsFacesScene.ts`,
  `src/__tests__/game/bigSmallLogic.test.ts`,
  `src/__tests__/game/feelingsFacesLogic.test.ts`,
  `src/__tests__/scenes/bigSmallScene.test.ts`,
  `src/__tests__/scenes/feelingsFacesScene.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P2.T1: Big & Small's scale-contrast knob** — covers: FR-5
  - [x] **P2.T1.1: A failing band-shift test** (the big/small factor pair
    widens at −1, matches 1.5×/0.7× at 0, narrows at +1; both factors keep
    toy and box inside the canvas at every band)
  - [x] **P2.T1.2: Band-aware factors in `bigSmallLogic.ts`**
  - [x] **P2.T1.3: Scene wiring** — `BigSmallScene` passes the shift once in
    `create()`
- [x] **P2.T2: Feelings Faces' contrast split + scenario growth** — covers:
  FR-6
  - [x] **P2.T2.1: A failing band-shift test** (the distinct/confusable mix
    is 6/0, 3/3, 0/6; the four emotions still appear as targets at every
    band; no repeat)
  - [x] **P2.T2.2: The split-point knob in `feelingsFacesLogic.ts`**
  - [x] **P2.T2.3: Eight new scenarios** (2 more per emotion, ≤ 60
    characters each, parents-facing gentle moments per the guidelines)
  - [x] **P2.T2.4: Scene wiring** — `FeelingsFacesScene` passes the shift
    once in `create()`

**Result:** verified
**Checkpoint:** 5dd22fb
**Evidence:** conductor/tracks/20261023-adaptive-banding-completion/verification/phase-2.md

## Phase 3: The two art games

- **Goal:** Shadow Match and Story Order respond to the shift with grown
  content pools — four new silhouette objects (with matching shadows), three
  new stories (nine panels) — the art authored against `SVG_STYLE.md`, the
  contact sheets regenerated, and the art-ownership tests updated.
- **Depends on:** Phase 2
- **Covers:** FR-4, FR-7, FR-8, AC-1, AC-2, AC-3
- **Touches:** `src/game/shadowMatchLogic.ts`, `src/game/storyOrderLogic.ts`,
  `src/game/storyOrderArt.ts`, `src/scenes/ShadowMatchScene.ts`,
  `src/scenes/StoryOrderScene.ts`, `src/assets/svg/**`,
  `docs/svg-contact-sheets/**`,
  `src/__tests__/game/shadowMatchLogic.test.ts`,
  `src/__tests__/game/storyOrderLogic.test.ts`,
  `src/__tests__/scenes/shadowMatchScene.test.ts`,
  `src/__tests__/scenes/storyOrderScene.test.ts`,
  `src/__tests__/game/art/shellOwnership.test.ts`,
  `src/__tests__/game/art/groupIntegrity.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` — plus the boot smoke check on port 4173 (`vite preview --strictPort`, then `node scripts/validate-boot.js`, then stop the preview), because the phase adds assets
- **Status:** verified

**Result:** verified
**Checkpoint:** 6aed316
**Evidence:** conductor/tracks/20261023-adaptive-banding-completion/verification/phase-3.md

- [x] **P3.T1: Shadow Match's four new objects + band selection** — covers:
  FR-4, FR-8
  - [x] **P3.T1.1: Four new silhouette-clustered objects** — object and
    shadow SVGs per `SVG_STYLE.md` (agent-authored; shown to the user before
    phase acceptance), extending the corpus to 12 objects
  - [x] **P3.T1.2: Band-aware round selection in `shadowMatchLogic.ts`**
    (easy excludes the most confusable, hard favours them, classic draws any
    6 of all as today; `isMatch` and the win target unchanged)
  - [x] **P3.T1.3: Ownership + integrity tests updated** (the new keys in
    the lazy groups, none in the 53-key boot shell)
- [x] **P3.T2: Story Order's three new stories + band mix** — covers: FR-7,
  FR-8
  - [x] **P3.T2.1: Three new stories** (one easier-obvious, two
    harder-subtle; nine panels per `SVG_STYLE.md`, panel keys and the
    Story Ladder contract respected; agent-authored, shown before acceptance)
  - [x] **P3.T2.2: Band-aware mix in `storyOrderLogic.ts`** (5+1, 3+3, 1+5
    from pools grown to 5 obvious / 6 subtle; guards held; no repeats)
  - [x] **P3.T2.3: Ownership + integrity tests updated**
- [x] **P3.T3: Contact-sheet regeneration** — covers: FR-8
  - [x] **P3.T3.1: Regenerate the SVG contact sheets** over the grown corpus
    and review the new art rendered

## Phase 4: The documentation truth pass

- **Goal:** The product documents describe a 22-of-22 adaptive app and the
  roadmap loses its resolved entry; the guard stays green.
- **Depends on:** Phase 3
- **Covers:** FR-1..FR-7 (documentation of the shipped behaviour), AC-4
- **Touches:** `docs/PRD.md`, `docs/TDD.md`, `docs/roadmap.md`, `README.md`,
  `docs/SVG_STYLE.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

**Result:** verified
**Checkpoint:** e437dcd
**Evidence:** conductor/tracks/20261023-adaptive-banding-completion/verification/phase-4.md

- [x] **P4.T1: The technical docs** — covers: AC-4
  - [x] **P4.T1.1: PRD §4.8 and the TDD's shift chapter** describe 22/22,
    with the seven games' table rows and the shift-strategy note
  - [x] **P4.T1.2: `docs/SVG_STYLE.md` inventory counts** re-derive from the
    grown corpus
- [x] **P4.T2: The reader-facing docs** — covers: AC-4
  - [x] **P4.T2.1: `docs/roadmap.md`** — the resolved Known Issue and its
    Future Work item removed (the remaining entries re-flow)
  - [x] **P4.T2.2: `README.md`** — the headline Known Issues list drops to
    the remaining entries
- [x] **P4.T3: Guard + product changelog** — covers: AC-4
  - [x] **P4.T3.1: `validate-docs` green** (features/game headings and links
    all still resolve); the `conductor/product.md` changelog entry is made
    by the primary during the post-phase doc sync (the phase executor cannot
    edit `conductor/**`)

<!--
After accepting a phase, the primary appends under it:

**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/<track-id>/verification/phase-<n>.md

`conductor-review` appends its own phase if findings require fixes:

## Phase R1: Review Fixes

- **Goal:** Resolve review findings F1 and F2.
- **Depends on:** Phase 4
- **Covers:** F1, F2
- **Touches:** `docs/TDD.md` (F1's file, `conductor/tracks/20261023-adaptive-banding-completion/verification/phase-3.md`, is Conductor prose the phase executor cannot edit — the primary corrects it during phase acceptance)
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** in_progress

- [ ] **R1.T1: Reconcile the TDD's coverage snapshot** — covers: F2
  - [ ] **R1.T1.1:** Update `docs/TDD.md` §10.3 to the integrated run's figures (statements 97.92, branches 91.81, functions 96.6, lines 98.7) and note that per-run coverage instrumentation varies by a fraction of a point between identical runs.
-->
