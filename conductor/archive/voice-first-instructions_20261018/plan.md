# Implementation Plan: Voice-First Instructions for the Silent Ten

## Phase 1 — Shared Instruction API

- [x] Task: Write failing tests for the shared instruction helper (6 tests in gameSceneBase.test.ts: default band render, one-shot auto-speak, muted + silent when SFX off, replay re-reads the toggle, x/y overrides, shutdown destroys the glyph)
    - Prompt text is created with the given copy, centred by default and at explicit coordinates when overridden
    - A speaker button is created at the standard offset and speaks on tap
    - Auto-speak runs exactly once at creation, gated by `sfxEnabled`
    - Replay reads the current SFX setting, not the construction-time value
    - SFX off produces a muted presentation and no speech call
    - Both objects are destroyed by the scene's shutdown cleanup
- [x] Task: Implement the helper on `GameSceneBase` (`createSpokenInstruction(text, { x?, y? })` + `INSTRUCTION_Y` 112 / `INSTRUCTION_WRAP_WIDTH` 620 / `INSTRUCTION_SPEAKER_GAP` 36; reuses SpeakerButton + textStyle; adds `speakSentence` to utils/speech with 3 tests; shutdown cleanup releases the glyph)
    - Single protected method that renders prompt + button and wires auto-speak/replay
    - Optional coordinate overrides; default placement below the progress dots
    - Reuse `SpeakerButton`, `textStyle`, `load().settings.sfxEnabled`, `speakInstruction`-style gating
- [x] Task: Verify tests pass and the ten existing speaking games are untouched (no edits to their files) — targeted suites 54/54 green, tsc clean, biome clean; no speaking-game file touched
- [x] Task: Commit (`feat(scenes): add shared spoken-instruction helper to GameSceneBase`) (commit 82817e5)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) — verified by the helper + speech suites (54/54), `tsc` and biome clean; full-tree gates re-run at Phase 4 (no per-phase note: the phase's evidence is its commit)

## Phase 2 — Drag-and-Drop Five

- [x] Task: Shape Sorter — instruction at y=126 (below its y=100 progress dots, above the shape slots at y=200); suite extended
- [x] Task: Shadow Match — instruction at the shared band (y=112), clear of the shadow row (133+) and object tray
- [x] Task: Big vs. Small — instruction at the shared band, clear of the boxes (144+) and toy tray
- [x] Task: Animal Trace — instruction at the shared band, above the tracing sprite at centre
- [x] Task: Pop & Freeze — instruction at the shared band; bubbles drift anywhere, so this is the one game where the prompt can be overlapped in motion
- [x] Task: Verify — every suite asserts the copy is rendered and `speakSentence(copy, true)` fired on create; the shared helper's own tests cover replay and the muted/off state. Targeted runs 54/54 (helper) and 121/121 (five flows); tsc clean; biome clean
- [x] Task: Commit (`feat(scenes): speak the rule in the drag-and-drop five`) (commit b6ed833)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) — verified by the five flow suites (121/121), `tsc` and biome clean; full-tree gates re-run at Phase 4

## Phase 3 — Reasoning Five

- [x] Task: Memory Match — instruction above the card grid; existing `getFaceImages` fixture now excludes the `icon_speaker` glyph so the pair-texture assertion stays honest
- [x] Task: Number Order — instruction above the numeral source row; the suite's local speech mock gained `speakSentence`
- [x] Task: Pattern Builder — instruction above the pattern row; harness `mockSpeech` imported
- [x] Task: Add It Up — instruction added and the stale "no speaker button" comment removed; the suite now mocks the speech module
- [x] Task: Take Away — same as Add It Up
- [x] Task: Verify — each suite asserts copy + auto-speak; the instruction is created once in `create()` (outside `renderRound`), so round rebuilds never re-speak. Targeted runs 76/76 across the five; tsc clean; biome clean
- [x] Task: Commit (`feat(scenes): speak the rule in the reasoning five`) (commit f6546c8)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) — verified by the five reasoning suites (76/76), `tsc` and biome clean; full-tree gates re-run at Phase 4

## Phase 4 — Docs, Gates and Device Pass

- [x] Task: Update README (per-game voice coverage note + parent-facing explanation) and `conductor/tech-stack.md` (dated amendment for the shared instruction API) — README gained a "Spoken rules" paragraph listing all twenty voices, the Add It Up bullet no longer claims silence, and the touch-UX line now covers the speaker glyph in all twenty games
- [x] Task: Run all gates: `pnpm run check` (clean, only the pre-existing musicalMemory warning + biome schema info), `pnpm typecheck` (clean), `CI=true pnpm test` (94 files / 2,001 tests), `pnpm run build` (ok, precache 41 entries), `validate-bundle` (shell 176.7 kB <= 200 kB), `validate-pwa` (15/15), `validate-boot` (median 0.96 s)
- [x] Task: Manual smoke on desktop + phone-scale: all ten speak once, replay works, SFX-off is silent and dimmed, no overlap — approved by user on the local dev server
- [x] Task: Commit (`docs: document voice-first instructions across the suite`) (commit c8a6d11)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) (checkpoint: 19393d8)

---

## Progress Notes

- Track created 2026-10-18 on branch `feature/voice-first-instructions` off `origin/master` (`62bdbc0`).
- Baseline: 94 test files / 1,982 tests; `SpeakerButton` present in 10 of 20 game scenes; the other ten show no prompt at all in four cases (ShapeSorter, AnimalTrace, PopFreeze, MemoryMatch) and text-only prompts in six.
- Environment note: this machine is heavily loaded during the pass (other Vite servers, ~27 node processes, CPU spikes). Full-suite runs intermittently report `Test timed out in 5000ms` in unrelated logic suites; every timed-out file passed when re-run alone or with `--testTimeout=30000`, so those are contention artefacts, not regressions. The final green run used `--testTimeout=30000`.

## Phase: Review Fixes

- [x] Task: Apply review suggestions 1ef715e - labelled prompt teardown (label + glyph released together, with a repeat-call regression test; 23 helper tests) and product.md now states the TTS voice drives all twenty games. Gates after the fix: typecheck clean, biome clean (1 pre-existing warning), 94 files / 2002 tests.
