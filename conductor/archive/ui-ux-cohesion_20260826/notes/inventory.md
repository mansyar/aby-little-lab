# Interaction Inventory — aby-little-lab (2026-08-26)

**Track:** `ui-ux-cohesion_20260826`
**Task:** Phase 1 — Inventory current interactive surfaces
**Method:** Read-only audit of every interactive UI surface. Canvas is 1024×768, Phaser Scale.FIT. Line numbers approximate to HEAD at audit time.

---

## A. Shared utilities summary

### A1. `src/utils/pressFeedback.ts` — `attachPressFeedback(obj, options?)`
- **Options:** `{ spring?: boolean }` — on release, springs back to base scale via a 150 ms `Back.out` overshoot tween instead of an instant `setScale`.
- **Constants:** `PRESS_SCALE = 0.95`, `SPRING_DURATION = 150`.
- **Object types:** declared union is `Phaser.GameObjects.Text | Phaser.GameObjects.Rectangle` — yet `Phaser.GameObjects.Image` instances are passed at `SpeakerButton.ts:34` and `HubScene.ts:544` (works at runtime; only touches `scaleX/scaleY/scene`). Type union is stale relative to real usage.
- **Events:** `pointerdown` → `setScale(base * 0.95)`; `pointerup`, `pointerout`, `pointercancel` → restore (instant or spring tween). Base scale captured once at attach time.
- **Reduced motion:** first line is `if (isReducedMotion()) return;` — zero listeners registered under reduced motion.
- **Return/cleanup API:** returns `void`; **there is no detach/off API**. Listeners live until the GameObject is destroyed. Fine for per-round objects that get destroyed; a latent constraint for long-lived controls.

### A2. `src/utils/motion.ts`
- `isReducedMotion(): boolean` — `window.matchMedia("(prefers-reduced-motion: reduce)")`, SSR/test-safe.
- `motionDuration(normal, reduced)` and `motionScale(normal, reduced)` — pick value per preference. These are the project's gate for every gameplay/UI tween.

### A3. `src/utils/speech.ts`
- `speakLetter(rate .9)` / `speakWord(rate .8)` / `speakNumber(rate .9)` — all take an `enabled` flag (callers pass `load().settings.sfxEnabled`); interrupt-safe `cancel/resume` with 100 ms deferred re-speak; never throws; returns whether an utterance was dispatched.
- `unlockSpeechForUserGesture()` — iOS/WebKit warm-up; Hub wires it into the first interaction (`HubScene.ts:364-371, 455-461, 495`).
- `isSpeechSupported()` exists but is not surfaced in any UI (see C4).

### A4. `src/utils/dragJuice.ts`
- `attachDragLift(obj: Image, { skipRestore? })` — dragstart: scale ×1.1 (RM ×1.05) + tilt 4° (RM 0°), 120 ms (RM 80 ms) `Sine.out`; dragend: restore 150 ms (RM 100 ms) unless `skipRestore()` (used by BigSmall so the shrink-into-box owns scale).
- `attachDropZoneHighlight(scene, zones)` — scene-level `dragenter/dragleave/dragend`; pulsing `Graphics` outline 6 px `#2b6cb0` α.9, pulse 1.06 (RM 1.02) yoyo ∞, 400 ms (RM 240 ms). Self-cleaning graphic; **but scene-level listeners are never removed** (see C6).
- `snapToSlot(scene, obj, x, y)` — 200 ms (RM 120 ms) `Back.out`.

### A5. `src/utils/completionEffect.ts`
- `createCompletionSplash(scene, x, y)` — 8-ray burst, 420 ms (RM 180 ms), motion-scaled radii, self-destroying Graphics.
- `createWinCelebration(scene, x, y)` — 10 rays (RM 6) + 10 confetti bits (**skipped entirely under RM**), 700 ms (RM 300 ms), all objects self-destruct.

---

## B. Per-surface inventory tables

Legend: **PF** = `attachPressFeedback`; **RM** = reduced-motion handling.

### B1. Hub & profile controls (`src/scenes/HubScene.ts`)

| Control | Events | Press feedback | Persistent states | Touch px | Cleanup | RM | Audio |
|---|---|---|---|---|---|---|---|
| Game tile ×18 (Rectangle, :379-396) | `pointerup` navigates (release-not-down so squish is visible); guarded by `timeUp`/`navLocked` | PF `{spring:true}` at :418 (after entrance completes) | Daily-limit locked: `setAlpha(0.45)` + `disableInteractive()` (:633-637); unlocked via `refreshPlayTimeState()` :658-669 | 160×116 | Scene children; explicit shutdown list :501-522 | Entrance/breathe/attract all gated (:356, 422, 777) | Tap resumes audio + starts BGM + speech unlock; no per-tile SFX |
| Tile idle breathe (tween, :427-447) | — | n/a | — | — | dies with scene | Gated `!reducedMotion` | — |
| Attract wiggle (:772-797) | — | n/a | — | — | timer removed on shutdown :514 | Wiggle gated; `playIdleCall` always plays | `playIdleCall` |
| Settings text button (:464-495) | `pointerdown`→audio; ParentLock 3 s hold (`pointerdown/up/out/cancel`) opens panel | PF (no spring) :494 | none | hit rect 96×96 (text ~70×22) | `parentLock.destroy()` on shutdown | PF-gated | audio on down |
| Profile avatar chip (Image, :529-546) | `pointerup` → open picker | PF :544 | Re-textures to active avatar | 72 visible (frame hit; `AVATAR_CHIP_HIT=96` intent) | destroyed :510-511 | PF-gated | audio on up |
| Profile picker overlay (:553-589) | overlay `pointerup` closes; avatar `pointerup` switches + closes | **none** | Active profile at base×1.15 (:576) — sole selected cue | avatars 96 visible | `closeProfilePicker` destroys all; run on shutdown :509 | no tweens | none |
| Play-time hint arc / moon badge (:624-652) | non-interactive | n/a | cool 0x68d391 vs warm 0xed8936 ≤5 min; moon badge when exhausted | — | destroyed/rebuilt :659 | static | — |
| Pre-game nudge overlay (:675-704) | dim rect is interactive but handler-less (swallows taps 2 s) | none | — | full-screen | auto-destroy after 2000 ms | no motion | — |
| Sticker shelf earned/unearned (:826-954) | non-interactive | n/a | earned = 56 px thumbnail (+shimmer); just-earned = ×1.15 Back.out + burst; unearned = dashed circle α.55 | — | rebuilt on reset :886-902 | shimmer/burst gated | — |
| Scene-level `input.on("pointerdown")` (:455-461) | audio unlock + idle-attract reset | n/a | — | — | scene-scoped, not off'd | n/a | yes |

### B2. Games (18 scenes)

**Shared scaffold — `src/scenes/GameSceneBase.ts`:**
- **← Back button** (:120-147): text 24 px @(20,20), hit rect `(0,0,96,96)`; ParentLock 3 s hold → Hub; **PF** (no spring) :145; destroyed via `registerShutdownCleanup()` :241-249.
- **Progress dots** (:157-183): r=8, spacing 40, y=60, α0.3 → filled α1 + pop tween (motion-gated, `Back.out` yoyo).
- **Completion** (:200-235): `playWin`, mascot `cheer(true)`, win celebration, sticker award + reveal (motion-gated), 3 s auto-return; sets `inputLocked`.
- **Wiggle constants** (:49-61): 4°/RM 2°, 350/RM 200 ms, yoyo ×3, `Sine.inOut` — **re-implemented per scene**, not a shared helper.

| Scene | Interactive controls | Events | Press feedback | Persistent states | Touch px | Cleanup | RM | Audio |
|---|---|---|---|---|---|---|---|---|
| **ShapeSorter** | 3 draggable shape Images (128 px, :137-174); 3 cutout slots + 160 px drop Zones (:120-134) | `drag`/`drop`/`dragend` | none (drag juice instead) | Placed: `disableInteractive()` + stays snapped; wrong drop bounces `Back.out` 300/180 ms | shapes 128, zones 160 | `teardownRound` destroys shapes/zones :218-228; **drop-zone-highlight scene listeners re-registered every round** (see C6) | via dragJuice/splash helpers | correct/incorrect SFX; no speaker (visual game) |
| **AnimalTrace** | Whole-canvas trace: scene `input.on` `pointerdown/pointermove/pointerup` (:129-143); sprites non-interactive | proximity advance (60 px tolerance) | none | Visited dots recolor 0x68d391; next-waypoint ring pulses | n/a (gesture) | sprites/graphics destroyed per pair; scene-scoped input handlers never off'd | Ring pulse gated (:187), hop + food-wiggle motion-gated | correct chime; no speaker |
| **PopFreeze** | Physics bubbles 96 px, `setInteractive()` + `pointerdown` (:127-159) | `pointerdown` → pop or wake | none (bespoke pop/wobble) | Popped bubbles removed + respawn; sleeping bubbles carry animal + Zzz overlays; `roundComplete` locks all | 96 | bubble destroy on pop; breathe tween removed via `events.once("shutdown")` :255 | Pop 200/120 ms, droplets + wobble motion-scaled, breathe gated | `playPop` / `playWake`; no speaker |
| **ShadowMatch** | 6 draggable objects 112 px; shadow slots + 160 px zones (:131-184) | `drag`/`drop`/`dragend` | none (drag juice) | Matched: snap + shadow stamp pulse + white flash + **object dims to α0.5 permanently** + `disableInteractive()` | 112 / zone 160 | objects/zones persist single round; scene-listener leak as ShapeSorter | all via dragJuice + motion helpers | correct/incorrect; no speaker |
| **MusicalMemory** | 3 frog Images 128 px (:120-138); replay SpeakerButton bottom-center (:156-163) | frog `pointerdown`; speaker `pointerdown` | **none on frogs**; SpeakerButton PF | Input locked during playback with **no visual cue** (C3); lily pads drift | frogs 128 | frogs scene-owned; shutdown cleanup via base | Bounce/ripple/lily-drift gated; wrong tap replays sequence | `playFrogNote` C4/E4/G4, correct/incorrect |
| **BigSmall** | 6 toys (96 px ×scale) draggable; 2 boxes + 160 px zones (:138-193) | `drag`/`drop`/`dragend` | none (drag juice; `skipRestore` when sorted) | Sorted toy shrinks to 0 (persists); box lid wiggle 3° + bump ×1.05 | toys 96·big, boxes 128 | per-round objects; listener leak as ShapeSorter | Durations gated; **wiggle angle amplitude NOT motion-scaled** (C5) | correct/incorrect; no speaker |
| **PatternBuilder** | 3 answer cards 128 px Rectangles (:121-140) | `pointerdown` | **none** (C1) | Gap slot outlined α0.4; correct shape flies in `Back.out` 200/120 ms and card+shape destroyed | 128 | per-round destroy | Snap + wiggle gated | correct/incorrect; **no speaker** (visual game) |
| **Alphabet** | 4 answer cards 160 px (:113-133); SpeakerButton | `pointerdown` | **none** (C1) | none between rounds | 160 | `clearRound` destroys rects+letters | Wiggle gated; splash self-managed | correct/incorrect + `speakLetter` on round start; speaker replays target |
| **WordMatch** | 4 word cards (variable width ≈ letters×80 + 60 padding, h=160) 2×2 (:116-152); Speaker | `pointerdown` | **none** (C1) | none | ≥160 tall | `clearRound` | Wiggle gated | `speakWord`; speaker replay |
| **WordBuilder** | 6 letter tiles 132 px (:166-186); 120 px slots; Speaker | tile `pointerdown` | **none** (C1); bespoke thunk ×1.12 (gated) + fly-to-slot + settle pop | Last-use tile → ghost α0.25 + `disableInteractive()`; reuse-case tile thunks and stays active | 132 | `clearRound` | All pop/fly/thunk durations+scales motion-gated | `playPop`, correct/incorrect, `speakWord`; speaker replay |
| **HowMany** | 2×2 (or 3-layout) group cards 200 px (:134-162); Speaker | `pointerdown` | **none** (C1) | Correct card flashes SUCCESS green 250 ms then reverts | 200 | `clearRound` | Numeral pop-in + wiggle gated | `speakNumber`; speaker replay |
| **FirstSounds** | 4 letter cards 160 px (:113-133); Speaker | `pointerdown` | **none** (C1) | none | 160 | `clearRound` | Wiggle gated | `speakWord` prompt + `speakLetter` reinforcement on correct |
| **MoreLess** | 2 group cards 220 px (:133-152); Speaker | `pointerdown` | **PF** :147 | Success flash 250 ms | 220 | `clearRound` | Wiggle gated | `speakWord("more"/"less")`; speaker replay |
| **OddOneOut** | 4 cards 256 px 2×2 (:93-112); Speaker | `pointerdown` | **PF** :106 | Success flash 250 ms | 256 | `clearRound` | Wiggle gated | `speakWord` odd item; speaker replay |
| **ColorMatch** | 4 cards 220 px (:115-135); 110 px prompt swatch (Graphics, inert); Speaker | `pointerdown` | **PF** :128 | Success flash 250 ms | 220 | `clearRound` incl. swatch | Wiggle gated | `speakWord` color name; speaker replay |
| **AddItUp** | 4 answer cards 170 px (:134-155); addend cards inert 180 px; +/= cues pop in | `pointerdown` | **PF** :150 | Success flash 250 ms | 170 | `clearRound` | Symbol pops + wiggle gated | correct/incorrect only; **no speaker by design** (:77-78) |
| **TakeAway** | Mirror of AddItUp; −/= cues (:94-156) | `pointerdown` | **PF** :151 | Success flash 250 ms | 170 | `clearRound` | Gated as AddItUp | correct/incorrect only; no speaker by design |
| **MemoryMatch** | Grid cards 150/132/120 px by band (:101-151) | `pointerdown` → flip | **PF** :126 (**conflicts with flip — see C2**) | Revealed/matched arrays; matched pairs lock face-up + success flash; mismatch flips back after 800 ms | band-sized ≥120 | `clearRound` resets arrays | Deal pop, flip halves (180/120 ms), wiggle all motion-gated | `playPop` on reveal, correct/incorrect; no speaker |

### B3. SettingsPanel rows & buttons (`src/components/SettingsPanel.ts`)
All controls are `Text` with inflated `Geom.Rectangle` hit areas, **all act on `pointerdown`**, **none use press feedback**, none have tweens (so RM is moot), and state is conveyed purely by text/color.

| Control | Line | Hit px | Semantics / states | Notes |
|---|---|---|---|---|
| Backdrop | :174-178 | full screen | `pointerdown` dismisses panel | — |
| BGM toggle | :197, 240-285 | 240×96 | Text `ON/OFF`, green `#68d391` / gray `#a0aec0`; enables/plays or pauses BGM | plays `playCorrect` sample when SFX re-enabled |
| SFX toggle | :198 | 240×96 | same styling | gates all TTS downstream |
| Profiles row | :199, 392-416 | 240×64 | opens Profiles overlay | primary blue |
| Progress row | :200, 418-442 | 240×64 | opens Learning Progress overlay | primary blue |
| Reset Progress row | :201, 995-1020 | 240×64 | danger red; opens confirm modal; after confirm becomes gray "Progress cleared" (:1115-1121) | inline bespoke state change |
| Install row | :292-325 | 240×64 | "Install App" (prompt) or "How to Install" (iOS guide); absent when installed | context-derived state |
| Voice chip | :335-363 | 120×64 | cycles installed voices; persists URI; label truncated 24 chars | primary blue |
| Voice Preview | :365-389 | 120×64 | speaks "Hi! I can talk." honoring SFX toggle | no disabled state when speech unsupported |
| Modal buttons (`createModalButton`) | :1076-1106 | 240×64 | Cancel/Delete/Reset/Close | color-parameterized |

Overlay mechanics: three object buckets — `objects` (panel), `overlayObjects` (Progress / Profiles / iOS / **Reset modal share it** :1032), `modalObjects` (delete confirm). `destroy()` (:225-237) removes the `voiceschanged` listener, destroys all buckets, disposes tracker, restores pinch-zoom lock. **Conflict:** `closeResetModal` destroys *all* `overlayObjects`, so confirming/canceling a reset also closes any concurrently open Progress/Profiles overlay (C2/C6).

### B4. Learning Progress overlay (`SettingsPanel.ts` :450-666)

| Control | Events | Press feedback | Persistent states | Touch px | Cleanup | RM | Audio |
|---|---|---|---|---|---|---|---|
| Backdrop | `pointerdown` closes | none | — | full screen | destroyed with bucket | n/a | none |
| X close | `pointerdown` closes | none | — | 96×96 | same | n/a | none |
| Avatar chips (viewed-profile switch) | `pointerdown` re-renders report | none | **No visual marker of which profile is being viewed** (C3) | 96×96 | same | n/a | none |
| Page "More"/"Back" | `pointerdown` pages 6-at-a-time (18 games → 3 pages) | none | label flips More↔Back; "x / 3" counter | 120×64 | same | n/a | none |
| Per-game rows / accuracy bar / ★ mastery / 7-day bars | non-interactive | n/a | ★ = mastered; green fill bar; activity bars | — | same | static | none |

### B5. ParentLock (`src/components/ParentLock.ts`)
- Hold 3 s (default) on a target's `pointerdown`; cancels on `pointerup`/`pointerout`/`pointercancel`; duplicate downs ignored.
- Feedback: circular progress ring — Graphics slice from 12 o'clock, r=48 (default), fill 0x68d391 α0.6, depth 10000; driven by a tween on a `{value}` proxy over the full hold (:138-149).
- Used by: Hub Settings button, every game's ← Back button.
- Cleanup: exemplary — `destroy()` removes all four listeners, kills timer, stops tween, destroys ring (:124-135).
- RM: not applicable (functional progress, not decoration). No audio.

### B6. SpeakerButton (`src/components/SpeakerButton.ts`)
- `icon_speaker` Image, displaySize 96, frame-default interactive (comment :21-24 documents why custom rects miss), `pointerdown` → `onSpeak` (caller SFX-gates TTS), **PF** (squish, no spring) :34.
- `destroy()` destroys the object (listeners die with it); wired into `registerShutdownCleanup` in all scenes that use it.
- **States: exactly one.** No active-speaking indication, no muted/disabled appearance when SFX off or speech unsupported, no pressed-vs-idle distinction beyond squish (details in C4).

### B7. Other
- **Mascot** (`Mascot.ts`): deliberately **non-interactive** (depth −1, corner placement). All reactions (wave/nod/cheer/idleLoop/sparkle) motion-gated via `motionDuration/motionScale/isReducedMotion`; tweens tracked and removed in `destroy()` (:245-260); Ligne WASM swap with 10 s timeout. No cleanup risk.
- **PwaToast** (`PwaToast.ts`): "Update now" / "Later" / "OK" text buttons, hit **200×72**, act on `pointerdown` (:111); **no press feedback**; entrance fades + scales in unless RM (alpha-only, 300/200 ms) :118-140; `destroy()` clears all objects. Buttons' entrance tween is not tracked but is short-lived.
- **LigneMascot**: WASM variant behind the same non-interactive contract (loaded via `Mascot.activateLigne`).

### Test-coverage snapshot (skim)
- `__tests__/utils/pressFeedback.test.ts`: 8 cases — squish 0.95, restore on up/out/cancel, base-scale relativity, **no listeners under RM (with and without spring)**, spring tween shape.
- `__tests__/scenes/hubScene.test.ts`: tile `pointerup` records play, nav-lock prevents double-record, 18 tiles fully on-canvas. Does not assert press feedback or locked-tile visuals.
- `__tests__/scenes/moreLessScene.test.ts` (representative): correct/wrong card taps, success flash + advance, gentle wiggle, **reduced-motion wiggle amplitude/duration assertions**, parental-lock exit to Hub, relaunch re-unlocks input, speaker-guard during celebration.
- Component tests exist for SpeakerButton, ParentLock, PwaToast, SettingsPanel (incl. pointerdown-driven overlay flows and add-avatar hit-area quirks), Mascot; `gameSceneBase.test.ts` asserts back-button `pointerdown`/`pointerup` wiring and hitArea presence.

---

## C. Gap analysis

### C1. Tappable cards/buttons NOT using `attachPressFeedback`
1. **AlphabetScene** — 4 answer cards (`card.on("pointerdown")`, :125).
2. **WordMatchScene** — 4 word cards (:135).
3. **WordBuilderScene** — 6 letter tiles (:176).
4. **HowManyScene** — group cards (:157).
5. **FirstSoundsScene** — 4 letter cards (:125).
6. **PatternBuilderScene** — 3 answer cards (:133).
7. **MusicalMemoryScene** — 3 frogs (:133).
8. **PopFreezeScene** — bubbles (tap targets; arguably fine as they destruct on tap).
9. **HubScene** — profile-picker avatars + overlay (:564, :577).
10. **Every SettingsPanel control** (rows, toggles, chips, modal buttons — all bare `pointerdown`).
11. **PwaToast** buttons (:111).
12. **AnimalTraceScene** — global drag-trace (n/a by design).

Using it today: Hub tiles (spring), Settings button, profile chip, all ← Back buttons, MoreLess / OddOneOut / ColorMatch / AddItUp / TakeAway / MemoryMatch cards, SpeakerButton. **The split is roughly "older tap-card scenes lack it, newer ones have it" — the clearest cohesion debt in the inventory.**

### C2. Bespoke/duplicate feedback that could conflict
- **MemoryMatch:** PF squish (sets scale 0.95) races the flip tween animating `scaleX` 1→0→1 on the same rect; releasing mid-flip restores full scale against the flip's midpoint (visible glitch potential).
- **Hub tiles:** PF `spring:true` + infinite breathe loop both write `scaleX/scaleY`; base scale is captured post-entrance (=1) while breathe oscillates 1–1.025, so release snaps to 1.0 mid-phase.
- **Wiggle-on-wrong** is copy-pasted across 12+ scenes from `GameSceneBase` constants rather than a shared helper — drift risk (BigSmall already diverges: amplitude not motion-scaled).
- **Success-flash** (`setFillStyle(SUCCESS_COLOR)` + timed revert) duplicated in HowMany/MoreLess/OddOneOut/ColorMatch/AddItUp/TakeAway/MemoryMatch with independent 250 ms timers.
- **SettingsPanel reset flow:** inline "Progress cleared" text mutation + shared `overlayObjects` bucket means the reset modal's lifecycle clobbers any open Progress/Profiles overlay.
- **Profile picker** selected state (×1.15 scale) is bespoke and inconsistent with the Progress overlay (which has none).

### C3. Missing persistent-state visuals
- **MusicalMemory input lock:** during sequence playback (and after wrong answers) taps are swallowed (`inputLocked`) with no "listening…" cue — the only game where the locked state is central to play.
- **All card scenes:** during the 700 ms `NEXT_ROUND_DELAY` transitions, remaining cards look fully active but silently ignore taps.
- **Learning Progress overlay:** no highlight on the currently-viewed profile chip.
- **Hub locked tiles:** alpha-dimmed but no textless lock glyph (moon badge sits at bottom center, easy to miss).
- **WordBuilder reuse-thunk tiles:** no lasting marker of how many times a shared letter (e.g. BALL's L) remains.
- **SettingsPanel:** no hover/pressed affordances anywhere; voice Preview shows no unavailable state; toggles rely on text+color only.

### C4. SpeakerButton state gaps
Current: single static `icon_speaker` texture + squish. Missing:
- **Active-speaking state** (wave rings / pulse while an utterance is queued — the API layer even knows via return values of `speakLetter/speakWord/speakNumber`).
- **Muted state** when SFX toggle is off (button currently looks identical but does nothing audible).
- **Unavailable state** when `isSpeechSupported()` is false (currently indistinguishable).
- Scenes without any replay control at all (AddItUp, TakeAway — documented as intentional; PatternBuilder/ShapeSorter/ShadowMatch/BigSmall/MemoryMatch/AnimalTrace/PopFreeze are silent games) — consistent, but worth codifying.

### C5. Reduced-motion gaps (raw/un-gated motion)
- **BigSmall `reactBox`:** lid wiggle uses literal `BOX_WIGGLE_ANGLE = 3` (no `motionScale`) while its duration *is* gated (:232-239) — inconsistent with every other wiggle.
- **Hub empty-slot fade-in** (:871-879): alpha tween not gated (alpha-only, low severity).
- Everything else audited routes through `motion.ts` or hard-gates (`isReducedMotion()`): entrances (Hub, PwaToast), breathe/attract/decorations (Hub), wiggles (all card scenes), flips/deal (MemoryMatch), pops/droplets (PopFreeze), hop/ring/food-wiggle (AnimalTrace), drag juice + splash + win celebration (utils), mascot, sticker reveal, dot pops.
- Note: `attachPressFeedback` disables itself entirely under RM (including the non-spring squish), whereas most gameplay effects degrade to smaller/faster rather than disappearing — two different RM philosophies coexist.

### C6. Cleanup risks (listeners/tweens without removal)
1. **`attachDropZoneHighlight` leaks:** adds scene-level `dragenter/dragleave/dragend` handlers per call, never removed. `ShapeSorterScene.initRound` calls it **every round** (3×/session), stacking duplicate handlers that search stale, destroyed zone references. Benign today (identity `find` misses), but fragile.
2. **`attachPressFeedback` has no detach API:** safe only where controls are destroyed (per-round cards, shutdown-destroyed hub controls). Any future long-lived reuse inherits stuck listeners.
3. **AnimalTrace / Hub scene-level `input.on(...)` handlers** are never `off`'d (scene-scoped, so cleared on shutdown — acceptable, undocumented).
4. **SettingsPanel bucket sharing:** reset modal lives in `overlayObjects` alongside Progress/Profiles/iOS overlays; closing it destroys whichever overlay was underneath.
5. **Hub nudge `delayedCall`** isn't cancelled on shutdown; if the panel is opened within the 2 s window the game can still launch behind it (edge case).
6. **PopFreeze** accumulates one `events.once("shutdown")` callback per sleeping bubble (bounded, minor).
7. Exemplary: `ParentLock.destroy`, `Mascot.destroy`, `SpeakerButton.destroy` via `registerShutdownCleanup`, SettingsPanel `voiceschanged` removal, PwaToast/Mascot tween tracking.
