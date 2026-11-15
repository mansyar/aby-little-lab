# Product Guidelines

## 1. Brand Voice & Personality

**Playful & Warm** — The product speaks like a friendly, encouraging teacher. Every interaction is cheerful and supportive, using gentle humor and positive reinforcement. The child should always feel celebrated, never judged.

### Voice Principles

- **Celebrate effort, not just success.** Every attempt is met with warmth.
- **Use sound, not words.** Tone is conveyed through audio cues and visual reactions — no text is shown to the child.
- **Keep it light.** Funny wake-up sounds, bouncy animations, and delightful particle effects are encouraged.
- **Never rush.** The child sets the pace. There are no timers, no countdowns, no pressure.

## 2. Visual Style

**Storybook Flat** — Clean, flat vector illustrations with thick dark outlines, evoking a children's storybook aesthetic.

### Visual Rules

- **Flat fills only.** No gradients, no shadows (except shadow-match silhouettes), no 3D effects.
- **Thick dark outlines.** All SVG sprites use `--outline` (#2D3748) strokes at 4–6px equivalent at 512px base.
- **Soft/vibrant palette.** Colors are bright but not neon. No pure RGB primaries. See product.md §7 Core Palette.
- **Simple, recognizable shapes.** Characters and objects should be instantly identifiable by a 3-year-old.
- **White/cream backgrounds.** Keep visual noise minimal. Game backgrounds use `--bg-base` (#FAF9F6); Hub uses `--bg-hub` (#FFF8E7).
- **Consistent scale.** All SVG assets generated at 512×512px viewBox, rasterized at load time.

## 3. Accessibility

### Color-Independent Design
- Never rely on color alone for differentiation. Shapes, patterns, and spatial positions must also distinguish items.
- Example: In Shape Sorter, each shape is both a different color AND a different geometric form.
- Example: In Shadow Match, silhouettes differ by outline shape, not just darkness.

### Motion-Friendly
- All animations are gentle and smooth. No rapid flashing, strobing, or vestibular-triggering motion.
- Particle bursts are soft and slow-dissipating, not explosive.
- Transition durations: 200–500ms for UI elements, 300–800ms for celebratory animations.
- Respect `prefers-reduced-motion` if available — reduce particle counts and animation amplitude.

### Audio-Visual Pairing
- Every audio cue has a visual counterpart (e.g., a pop sound accompanies a visual pop animation).
- Every significant visual event has an audio cue (e.g., shape snapping into place plays a chime).
- This ensures the experience is coherent for children with partial hearing or vision.
- BGM and SFX can be toggled independently, but toggling off SFX also mutes gameplay-critical audio cues.

## 4. Error Handling Philosophy

**No-Fail Design** — There are no explicit "wrong" states. The child cannot fail.

### Rules

- **Incorrect actions are ignored or gently redirected.** A shape dropped on the wrong slot simply bounces back to its origin with a gentle wobble.
- **No penalties.** No scoring, no strikes, no game-over states.
- **No negative audio.** Never play harsh or disapproving sounds. The `sfx_incorrect` sound is a gentle, soft descending tone — never alarming.
- **Positive reinforcement only.** Correct actions trigger celebration (chime + particles). Incorrect actions are met with neutral silence or a soft bounce.
- **Self-paced.** The child can take as long as they need. No timeouts.

## 5. Interaction Patterns

### Touch & Drag
- Touch targets: minimum 64×64px. Protected controls (Back, Settings, Musical Memory Replay) expose 96×96px hit areas.
- Custom hit areas on Image objects are tested in **texture-local space** (top-left origin, `+displayOrigin` normalized). With 512px SVG rasterization, centered rects like `(-48,-48,96,96)` land off the visible icon — use the frame-based default (`setInteractive()` without options) or a frame-derived rect. Regression tests must simulate the engine's hit math (see `src/__tests__/helpers/hitTest.ts`).
- Collision bounds are inflated beyond visual size to reduce fine-motor frustration.
- Drag interactions use generous drop zones — the snap radius is forgiving.
- No multi-touch requirements. All interactions are single-finger.
- Texture rasters are tiered per use (`src/utils/textureTiers.ts`): icon 160 / card 256 / hero 512. New scenes must pick display sizes from `textureSizeFor()` instead of assuming a fixed raster size — this cut GPU texture memory ~78% (v1.19-era Hub track).
- Narrow-viewport layouts follow the Hub's paged-grid pattern (`src/game/hubPaging.ts`): classify with `fitDisplayScale` + `isNarrowViewport` (threshold = the 64px touch floor), page only on narrow devices, and keep wide layouts byte-identical to desktop.
- Grouping is a layout concern, not a second navigation model: the registry's `group` field and `src/game/hubGroups.ts` decide membership, a chip only filters which tiles are drawn (176×196, three columns, rows centred), and no scene branches on a group id. The Hub's group chips are top-band chrome on the existing 96×84 control band — the 64px floor still governs game tiles, not chips — and the selection is per visit, never stored, so All stays the landing state.

### Parental Lock
- Hold-for-3-seconds mechanism on a designated UI element (e.g., settings icon, back button).
- Visual progress indicator (filling circle) shows the hold progress; only one hold runs at a time, and the indicator is cleared on release, cancel, or scene shutdown.
- Prevents accidental navigation, settings access, or app exit.

### Plan Then Run
- A plan-then-run interaction is the suite's second answer shape, and Robot Path owns it: the child builds a sequence of steps, reviews it against a visible ghost preview, and only then presses Go. Nothing moves while the plan is being built, so a mistake costs a tap rather than a lost round.
- Steps are absolute (`up`, `right`, `down`, `left`), never forward-and-turn: a preschooler has not yet built the frame that makes a turn meaningful, and absolute arrows mean the same thing wherever the figure stands.
- Illegal steps cannot be added. Off-board, blocked and past-the-goal commands are refused at placement with a nudge and no penalty, so the strip is always a legal prefix, and dropping a step drops everything after it.
- A failed run is a rehearsal, not a loss: the program stays on the strip, the step that first left the route pulses, and the figure returns to its start so one arrow can be replaced and the round retried. A hint may pulse after two stopped runs; it is never placed.
- Go is the only button that moves anything, and it is the same size as every other play target (112×112), so the plan is deliberate and the run is never triggered by a stray tap.

### Auto-Progression
- After game completion, a 3-second delay with win animation before auto-returning to Hub.
- No manual "done" button required from the child.
- Parental lock can override to exit early.

## 6. Audio Guidelines

- **BGM:** Single gentle ambient loop at low volume. Never competes with SFX.
- **SFX:** Short, pleasant, non-startling sounds. Maximum duration 1–2 seconds.
- **Synthesized tones:** Pure sine/triangle waves for frog notes — warm, not buzzy.
- **Volume:** All audio normalized to a comfortable listening level. No sudden volume spikes.
- **Toggle behavior:** BGM and SFX toggle independently. Settings persist in localStorage.
