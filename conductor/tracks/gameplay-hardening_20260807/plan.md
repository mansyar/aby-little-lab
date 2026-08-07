# Implementation Plan — Gameplay Hardening: Replay & Session Bug Fixes + Gameplay Depth

**Track ID:** `gameplay-hardening_20260807` · **Type:** bug+feature
**Methodology:** TDD per `conductor/workflow.md` (failing test → implementation → green) for all logic-bearing fixes; scene tests alongside/after for UI-bound changes. Phase checkpoints at each phase end per workflow protocol. Release phases mirror the v1.6.0 release track (`docs/release-checklist.md`).

## Phase 1 — Critical Session & Replay Bug Fixes

- [x] Task 1.1: FR-1 — Animal Trace session state reset [commit: bb26636]
  - [x] Write failing relaunch tests (may scaffold minimal scene-test harness): full-session relaunch → 1 path does NOT complete the round; mid-session exit → relaunch → all 3 paths required
  - [x] Confirm tests fail (Red phase)
  - [x] Reset `currentPairIndex`, `completedPaths`, and `progressDots` in `AnimalTraceScene.create()`
  - [x] Confirm tests pass (Green phase)
  - [x] Commit: `fix(animal-trace): Reset session state on scene relaunch`
- [x] Task 1.2: FR-2 — Shape Sorter progress-dot reset [commit: d726065]
  - [x] Write failing relaunch test: relaunch → complete a round → dot fills (destroy stale dots + reset array in `create()`)
  - [x] Confirm tests fail (Red phase)
  - [x] Clear `progressDots` array in `ShapeSorterScene.create()`
  - [x] Confirm tests pass (Green phase)
  - [x] Commit: `fix(shape-sorter): Reset progress dots on scene relaunch`
- [x] Task 1.3: FR-3 — Speaker crash guard (Alphabet, HowMany, WordMatch, WordBuilder) [commit: 68451d0]
  - [x] Write failing tests per scene: tap speaker during 3s win celebration → no throw
  - [x] Confirm tests fail (Red phase)
  - [x] Guard `onSpeak`: `if (!round) return;` in `AlphabetScene.ts`, `HowManyScene.ts`, `WordMatchScene.ts`, `WordBuilderScene.ts`
  - [x] Confirm tests pass (Green phase)
  - [x] Commit: `fix(speech-games): Guard speaker replay during win celebration`
- [x] Task 1.4: FR-4 — Musical Memory replay resets input position [commit: 8a4d3b9]
  - [x] Write failing test: 2 correct taps → replay → tap first note → judged correct (round progresses)
  - [x] Confirm tests fail (Red phase)
  - [x] Reset `inputIndex = 0` in `MusicalMemoryScene.handleReplay()`
  - [x] Confirm tests pass (Green phase)
  - [x] Commit: `fix(musical-memory): Reset input progress when sequence is replayed`
- [x] Task 1.5: FR-5 — Pop & Freeze physics body matches display [commit: 550a53d]
  - [x] Write failing tests: spawned bubble body size ≈ 96px display; poppable-vs-sleeping tap routing unchanged
  - [x] Confirm tests fail (Red phase)
  - [x] `setCircle(BUBBLE_DISPLAY_SIZE / 2)` on physics bubble spawn in `PopFreezeScene.ts`
  - [x] Confirm tests pass (Green phase); visually verify bounce-at-edge behavior
  - [x] Commit: `fix(pop-freeze): Size bubble physics body to display`
- [ ] Task 1.6: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Auto-Return Transition Guard

- [x] Task 2.1: FR-6 — navigation guard across all 11 game scenes [commit: 96e1786]
  - [x] Write failing test for the Back-during-celebration race in at least one drag scene and one tap scene
  - [x] Add scene-level navigation guard (e.g., `navigating` flag set before every `transitionToScene`; both ParentLock back and auto-return check it)
  - [x] Apply consistently to all 11 game scenes
  - [x] Confirm tests pass; full suite green
  - [x] Commit: `fix(scenes): Guard against double transition during auto-return`
- [ ] Task 2.2: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Cross-Cutting Consistency & Dead Code

- [ ] Task 3.1: Consistency deltas
  - [ ] Shadow Match `DROP_ZONE_SIZE` 120 → 160 (update any size-dependent tests)
  - [ ] Word Builder settle-pop via `motionDuration`/`motionScale` (reduced-motion aware)
  - [ ] Word Builder dot-pop tween `scale:` → `scaleX/scaleY` (align with all siblings)
  - [ ] Shape Sorter back button uses `textStyle()` (Baloo 2)
  - [ ] Commit: `style(scenes): Align drop zone, settle-pop motion, dot tween, back-button font`
- [ ] Task 3.2: Dead code removal
  - [ ] Verify `Curves.Path` (AnimalTrace) and `slotRects` (WordBuilder) are unused including by tests
  - [ ] Remove `selectThreeShapes` (shapeSorterLogic), `baseScale` (BigSmall), `isCorrectWord` (wordLogic), `isCorrectLetter` + `hasCompletedPlaythrough` (alphabetLogic), `isPlaythroughComplete` (countLogic) and their tests-only usages
  - [ ] Full suite green after removal
  - [ ] Commit: `refactor(game): Remove test-only dead exports`
- [ ] Task 3.3: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Gameplay Depth (FR-9)

- [ ] Task 4.1: FR-9a — Animal Trace next-waypoint guidance
  - [ ] Design: highlight next waypoint (larger + pulsing ring via Graphics), light visited waypoints; reduced-motion aware
  - [ ] Write/extend scene tests (next-dot highlight state, visited-dot state)
  - [ ] Implement in `AnimalTraceScene` (draw path / checkProximity / advance)
  - [ ] Commit: `feat(animal-trace): Highlight next waypoint with pulsing ring`
- [ ] Task 4.2: FR-9b — Musical Memory run cap + note-delay scaling
  - [ ] Write failing logic tests: no >2 consecutive same-frog runs in generated sequences; `appendNote` respects cap
  - [ ] Implement cap in `musicalMemoryLogic.ts`
  - [ ] Note-delay scaling: 600 → 480ms at length ≥5 in `MusicalMemoryScene.playSequence` (update timing tests)
  - [ ] Commit: `feat(musical-memory): Cap same-frog runs and scale note delay`
- [ ] Task 4.3: FR-9c — Word Match easy-first ordering
  - [ ] Write failing logic tests: playthrough targets ordered 3-letter before 4-letter
  - [ ] Implement tier ordering in `wordLogic.generateWordPlaythrough` (mirror builder)
  - [ ] Commit: `feat(word-match): Order easy words first`
- [ ] Task 4.4: FR-9d — Correct-answer splashes (Word Match, Find the Letter, Pattern Builder)
  - [ ] Add `createCompletionSplash` at tapped card (WordMatch), target letter (Alphabet), gap (PatternBuilder) on correct answers
  - [ ] Extend scene tests to assert splash emission
  - [ ] Commit: `feat(scenes): Add correct-answer splash to WordMatch, Alphabet, PatternBuilder`
- [ ] Task 4.5: FR-9e — Word Builder used-tile fly-to-slot
  - [ ] Write failing scene tests: placed tile animates into slot; ghost placeholder remains; duplicate letters re-tappable
  - [ ] Implement fly-to-slot + placeholder in `WordBuilderScene`
  - [ ] Commit: `feat(word-builder): Animate used tiles into their slots`
- [ ] Task 4.6: FR-9f — Word Builder phone-safe tile size
  - [ ] Determine `TILE_SIZE` raising so tiles ≥64px at phone FIT scale (~0.49); adjust layout constants
  - [ ] Update/extend scene tests asserting tile dimensions at design resolution
  - [ ] Commit: `feat(word-builder): Raise tile size for phone touch floor`
- [ ] Task 4.7: FR-9g — Pattern Builder 6 rounds
  - [ ] Change `ROUND_COUNT` 5 → 6 in `PatternBuilderScene.ts`; update logic tests that assume 5
  - [ ] Commit: `feat(pattern-builder): Align round count to six`
- [ ] Task 4.8: FR-9h — Confusable-distractor guards (Pattern Builder, Alphabet)
  - [ ] Write failing property tests: distractor choices never confusable with answer (shape families; letter families e.g. C vs G/O/Q, I vs L/T, M vs W)
  - [ ] Implement family-based filtering in `patternBuilderLogic.ts` and `alphabetLogic.ts`
  - [ ] Commit: `feat(logic): Guard distractors against confusable lookalikes`
- [ ] Task 4.9: FR-9i — How Many distinct targets per band + centered last row
  - [ ] Write failing logic tests: no duplicate target within a band
  - [ ] Implement distinct-target draw in `countLogic.createPlaythrough`
  - [ ] Center the last grid row in `HowManyScene.createCardItems` (scene test update)
  - [ ] Commit: `feat(how-many): Distinct targets per band and centered grid rows`
- [ ] Task 4.10: FR-9j — Big Small box-side shuffle
  - [ ] Write failing logic tests: box-side assignment rotates across calls; each play has exactly one big + one small box
  - [ ] Implement shuffle in `bigSmallLogic.createBoxes` (scene renders from returned order)
  - [ ] Commit: `feat(big-small): Shuffle big/small box sides per play`
- [ ] Task 4.11: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5 — Missing Scene Test Suites

- [ ] Task 5.1: `src/__tests__/scenes/animalTraceScene.test.ts`
  - [ ] Cover: pointer down/move/up wiring, proximity advancement, hop tween, pair-complete → next pair, round win → sticker/auto-return, relaunch resets (FR-1), reduced-motion
- [ ] Task 5.2: `src/__tests__/scenes/popFreezeScene.test.ts`
  - [ ] Cover: spawn wiring, tap routing (pop vs wake), pop → respawn invariant (5 concurrent), round-complete lock, droplet emission, win/sticker/auto-return, reduced-motion breathe skip, body-size assertion (FR-5)
- [ ] Task 5.3: `src/__tests__/scenes/patternBuilderScene.test.ts`
  - [ ] Cover: round flow, correct snap (tween → destroy → splice → delayed call), wrong wiggle, `inputLocked` reset on relaunch, sticker gating, parent-lock exit, reduced-motion wiggle
- [ ] Task 5.4: Full suite + coverage gate green
- [ ] Task 5.5: Commit: `test(scenes): Add AnimalTrace, PopFreeze, PatternBuilder scene suites`
- [ ] Task 5.6: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 6 — Pre-Release Baseline Validation

- [ ] Task 6.1: Confirm clean working tree and master tip (`git status --short` empty; `git log -1` expected)
- [ ] Task 6.2: Run full quality gates locally (CI order): `pnpm run check` → `CI=true pnpm test` → `pnpm run build` → `node scripts/validate-pwa.js`
- [ ] Task 6.3: Capture baseline release metrics (test count, precache entries/size, main chunk hash) for release notes
- [ ] Task 6.4: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 7 — Release Branch, Version Bump & Docs

- [ ] Task 7.1: Create release branch `git checkout -b release/v1.7.0` from master
- [ ] Task 7.2: Bump version `npm version 1.7.0 --no-git-tag-version`
  - [ ] Verify `package.json` version = 1.7.0 and `__APP_VERSION__` footer picks it up
- [ ] Task 7.3: Draft `docs/release-notes-v1.7.0.md` (template: What's New / Improvements / Bug Fixes / Known Issues / Installation / Feedback) covering: replay/session fixes, gameplay depth items, consistency pass — written as DRAFT (FINAL in Phase 10)
- [ ] Task 7.4: Update `docs/device-testing-checklist.md` — add v1.7.0 rows (double-playthrough replay of Animal Trace/Shape Sorter, speaker during celebration, Pop & Freeze bubble taps, guided tracing, Word Builder tiles on phone)
- [ ] Task 7.5: Sync knowledge docs (`conductor/tech-stack.md` design-update entry; `conductor/product.md` only for real gaps — e.g., Pattern Builder 6 rounds, gameplay depth notes)
- [ ] Task 7.6: Commit: `docs(release): Prepare v1.7.0 release notes and device checklist`
- [ ] Task 7.7: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 8 — Release Branch Gates + Tag + PR

- [ ] Task 8.1: Re-run all four gates on `release/v1.7.0` (check → test → build → validate-pwa)
- [ ] Task 8.2: Create annotated tag `git tag -a v1.7.0 -m "Release v1.7.0 — replay/session fixes, gameplay depth, consistency pass"` and push
- [ ] Task 8.3: Push branch + tag; open PR `release/v1.7.0` → `master` (body = release notes summary)
  - [ ] Confirm CI "Quality Gates" check passes on the PR (merge-blocking); Deploy correctly skipped (master-only)
- [ ] Task 8.4: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 9 — Merge, Deploy & Verify

- [ ] Task 9.1: Merge PR to master; push master → triggers Coolify auto-deploy webhook (Bearer `$COOLIFY_TOKEN`)
- [ ] Task 9.2: Verify deployment: CI run green; live bundle hash matches local `dist/`; `/sw.js` + `/manifest.webmanifest` 200; Settings footer shows v1.7.0
- [ ] Task 9.3: Live smoke test targeted at the fixed bugs (headless via playwright-cli): Animal Trace full session → replay → full 3 paths again; Shape Sorter relaunch dots fill; speaker tap during celebration on a speech game → no error; Musical Memory replay → next tap correct; Pop & Freeze bubble taps near edge route correctly
- [ ] Task 9.4: Record deployment verification in `docs/release-checklist.md` (v1.7.0 row)
- [ ] Task 9.5: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 10 — Device Testing, Finalize & Archive

- [ ] Task 10.1: Execute the v1.7.0 checklist record (iPad / Android tablet / iPhone / Android phone) against the live URL; record pass/issue per item
- [ ] Task 10.2: Triage findings — document accepted issues in Known Issues; escalate blockers to user (max 2 fix attempts per workflow)
- [ ] Task 10.3: Commit results: `docs(device): Record v1.7.0 device testing results`
- [ ] Task 10.4: Finalize release notes status to FINAL; mark all plan tasks complete; final gates if post-merge changes occurred
- [ ] Task 10.5: Archive track folder to `conductor/archive/gameplay-hardening_20260807/` via `git mv`; registry entry marked `[x]` with archive link
  - [ ] Commit: `chore(conductor): Archive track 'Gameplay Hardening — Replay & Session Bug Fixes + Gameplay Depth'`
- [ ] Task 10.6: Phase Verification & Checkpoint (Refer to workflow.md)
