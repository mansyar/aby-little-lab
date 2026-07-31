# Implementation Plan: Mobile PWA Shell, Audio, and Completion Feedback Hardening

**Track ID:** `mobile-pwa-hardening_20260731`

---

## Phase 1: Reproduction Baseline and TDD Coverage

- [x] Task: Refresh the approved specification and workflow context [1dace4d]
  - [x] Confirm the affected areas: PWA manifest, `AudioManager`, Hub interaction, six game completion flows, and production validation.
  - [x] Record the deployed baseline: the installed phone PWA was reported not to enter fullscreen; phone navigation controls remained visible; BGM did not play; completion effects were performance-heavy and sometimes persisted; the Playwright deployment check reported 404s for `/audio/pop.mp3`, `/audio/correct.mp3`, `/audio/incorrect.mp3`, `/audio/wake.mp3`, `/audio/win.mp3`, and `/audio/sticker.mp3`.
- [x] Task: Add failing audio behavior tests [TDD-Red] [39d2689]
  - [ ] Test that the first eligible user interaction resumes audio and starts BGM when enabled.
  - [ ] Test that BGM startup is idempotent across scene navigation.
  - [ ] Test that disabled BGM does not start and re-enabling it starts playback.
  - [ ] Test that synthesized SFX APIs remain available without constructing missing MP3 resources.
- [ ] Task: Add failing completion-feedback tests [TDD-Red]
  - [ ] Test that success feedback is single-shot and bounded.
  - [ ] Test that completion feedback is cleaned up after its animation.
  - [ ] Test reduced-motion behavior.
  - [ ] Preserve tests for win audio, sticker award, and Hub auto-return for all six games.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 2: PWA Display and Audio Runtime

- [ ] Task: Update PWA display configuration [TDD/config verification]
  - [ ] Request fullscreen display through supported manifest display metadata.
  - [ ] Retain standalone fallback, landscape orientation, theme, and offline precaching.
  - [ ] Update `scripts/validate-pwa.js` to validate the new display configuration.
- [ ] Task: Implement reliable first-interaction BGM startup [TDD-Green]
  - [ ] Wire the first valid Hub interaction to resume the audio context and start BGM.
  - [ ] Keep startup idempotent and preserve playback across scene changes.
  - [ ] Preserve persisted BGM settings and SettingsPanel behavior.
  - [ ] Handle a rejected playback attempt so a later valid gesture can retry.
- [ ] Task: Remove stale synthesized-SFX MP3 loading [TDD-Green]
  - [ ] Remove the six missing SFX file references and eager `Audio` creation.
  - [ ] Keep Web Audio synthesis and SFX enable/disable behavior intact.
  - [ ] Ensure BGM remains the only file-based audio asset.
- [ ] Task: Run the Phase 2 automated tests and coverage checks
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 3: Lightweight Success Feedback

- [ ] Task: Design the bounded splash/ray effect [TDD-Green]
  - [ ] Use a single low-cost visual effect rather than a persistent particle emitter.
  - [ ] Give the effect an explicit short lifetime and guaranteed cleanup.
  - [ ] Keep the visual style flat, gentle, and within the existing 300–800 ms motion guidance.
- [ ] Task: Replace unbounded success particles in the game scenes
  - [ ] Audit all existing particle burst call sites, including per-action success feedback.
  - [ ] Replace completion/success particle bursts with the bounded splash/ray behavior.
  - [ ] Ensure no emitter or graphics object remains after the effect finishes.
  - [ ] Apply reduced-motion behavior without adding rapid or distracting animation.
  - [ ] Preserve completion sound, sticker animation, and 3-second Hub return.
- [ ] Task: Extend scene tests for all six games
  - [ ] Verify completion still awards stickers only once.
  - [ ] Verify completion still plays the appropriate audio cues.
  - [ ] Verify completion still returns to Hub after the existing delay.
  - [ ] Verify no persistent completion effect remains.
- [ ] Task: Run the Phase 3 automated tests and coverage checks
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Phase 4: Production Validation and Documentation

- [ ] Task: Update release and device checklists
  - [ ] Add installed-PWA fullscreen/standalone expectations and OS navigation-bar limitations.
  - [ ] Add first-interaction BGM verification.
  - [ ] Add no-missing-SFX-request verification.
  - [ ] Add bounded completion-effect and reduced-motion checks.
- [ ] Task: Run project quality gates
  - [ ] Run `CI=true pnpm test`.
  - [ ] Run `pnpm test:coverage` and verify configured thresholds.
  - [ ] Run `pnpm run check`.
  - [ ] Run `pnpm run build`.
  - [ ] Run `node scripts/validate-pwa.js`.
- [ ] Task: Validate the production build with Playwright CLI
  - [ ] Verify manifest display metadata and landscape configuration.
  - [ ] Verify `/audio/bgm.mp3` loads successfully.
  - [ ] Verify the six stale SFX URLs are not requested.
  - [ ] Verify no related console errors occur during Hub → game interactions.
- [ ] Task: Perform manual mobile/PWA verification
  - [ ] Install the new build on a phone.
  - [ ] Verify fullscreen/standalone behavior and document platform-controlled navigation bars.
  - [ ] Tap into a game and confirm BGM begins and continues across navigation.
  - [ ] Complete representative games and confirm the single splash/ray disappears cleanly.
  - [ ] Repeat with reduced-motion enabled.
- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)

## Definition of Done

- All approved acceptance criteria pass.
- Automated tests, coverage, lint/check, build, and PWA validation pass.
- Production Playwright smoke checks show no missing SFX requests.
- Manual phone/PWA verification is recorded.
- Implementation and plan updates are committed according to the project workflow, including Git notes.
