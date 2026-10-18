# Implementation Plan: Voice-First Instructions for the Silent Ten

## Phase 1 — Shared Instruction API

- [ ] Task: Write failing tests for the shared instruction helper
    - Prompt text is created with the given copy, centred by default and at explicit coordinates when overridden
    - A speaker button is created at the standard offset and speaks on tap
    - Auto-speak runs exactly once at creation, gated by `sfxEnabled`
    - Replay reads the current SFX setting, not the construction-time value
    - SFX off produces a muted presentation and no speech call
    - Both objects are destroyed by the scene's shutdown cleanup
- [ ] Task: Implement the helper on `GameSceneBase`
    - Single protected method that renders prompt + button and wires auto-speak/replay
    - Optional coordinate overrides; default placement below the progress dots
    - Reuse `SpeakerButton`, `textStyle`, `load().settings.sfxEnabled`, `speakInstruction`-style gating
- [ ] Task: Verify tests pass and the ten existing speaking games are untouched (no edits to their files)
- [ ] Task: Commit (`feat(scenes): add shared spoken-instruction helper to GameSceneBase`)

## Phase 2 — Drag-and-Drop Five

- [ ] Task: Shape Sorter — add instruction, choose a slot clear of the shape rows and tray, extend its suite
- [ ] Task: Shadow Match — same, clear of the shadow row and object tray
- [ ] Task: Big vs. Small — same, clear of the two boxes and the toy tray
- [ ] Task: Animal Trace — same, clear of the path canvas
- [ ] Task: Pop & Freeze — same, clear of the bubble field
- [ ] Task: Verify — each new test asserts copy + auto-speak + replay + muted state; no prompt overlaps art in any band
- [ ] Task: Commit (`feat(scenes): add spoken instructions to the drag-and-drop games`)

## Phase 3 — Reasoning Five

- [ ] Task: Memory Match — add instruction clear of the card grid, extend its suite
- [ ] Task: Number Order — same, clear of the numeral row
- [ ] Task: Pattern Builder — same, clear of the pattern row and answer choices
- [ ] Task: Add It Up — same, clear of the two addend cards and the answer options
- [ ] Task: Take Away — same, clear of the prompt cards and the answer options
- [ ] Task: Verify — same assertion set; instruction survives round rebuilds without re-speaking
- [ ] Task: Commit (`feat(scenes): add spoken instructions to the reasoning games`)

## Phase 4 — Docs, Gates and Device Pass

- [ ] Task: Update README (per-game voice coverage note + parent-facing explanation) and `conductor/tech-stack.md` (dated amendment for the shared instruction API)
- [ ] Task: Run all gates: `pnpm run check`, `pnpm typecheck`, `CI=true pnpm test`, `pnpm run build`, `validate-bundle`, `validate-pwa`, `validate-boot`
- [ ] Task: Manual smoke on desktop + phone-scale: all ten speak once, replay works, SFX-off is silent and dimmed, no overlap
- [ ] Task: Commit (`docs: document voice-first instructions across the suite`)

---

## Progress Notes

- Track created 2026-10-18 on branch `feature/voice-first-instructions` off `origin/master` (`62bdbc0`).
- Baseline: 94 test files / 1,982 tests; `SpeakerButton` present in 10 of 20 game scenes; the other ten show no prompt at all in four cases (ShapeSorter, AnimalTrace, PopFreeze, MemoryMatch) and text-only prompts in six.
