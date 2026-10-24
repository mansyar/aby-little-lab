# Phase 2 verification - The documents state the exception

Track: `20261024-settings-row-targets`
Branch: `fix/20261024-settings-row-targets`
Phase base: `53717468e5a1a014f48fdcfc28f7738e78ebfdda`
Executed: 2026-10-24

## Result

Both documents now describe the geometry Phase 1 shipped and name the Settings-row
exception instead of restating the three constants it replaced. `docs/TDD.md:609`
records one pitch (`ROW_PITCH = 56`) as both the row spacing and the band height,
the derived offsets, the 400 px band width, the card-centred toggle band, the
`VoiceRow` split, the surfaces that keep the 64 px floor, and why the band cannot
be 64. `docs/PRD.md:466` keeps the 64 by 64 px minimum and adds one sentence
naming the eight Settings rows as the single documented exception. No heading,
section, bullet list, link or anchor was added or removed, so the docs validator's
invariants are unaffected.

## Document diffs

### `docs/TDD.md`

```diff
@@ -609 +609 @@ Caption state machine — used by Feelings Faces, the one prompt with a written
-Rows sit at fixed offsets from the panel centre: Profiles `+123`, Progress `+178`, Reset `+234`, Install `+290`, Voice `+345`. Rows are `ROW_CARD_WIDTH = 400` × `ROW_CARD_HEIGHT = 68` cards behind 32 px labels; toggles are `TOGGLE_WIDTH = 240` × `TOGGLE_HEIGHT = 96` hit areas drawn as a 64×32 track with a 24 px knob offset ±16. `ROW_HEIGHT = 64` is the minimum row pitch. The footer shows `v${__APP_VERSION__}` in 24 px `DISABLED_COLOR` (`#a0aec0`) at `centerY - 75`. Turning Sounds back on plays `playCorrect()` as the confirmation chime.
+Rows step by one pitch from a first-row offset of `-47` from the panel centre: `ROW_PITCH = 56` is both the distance between adjacent rows and the height of each row's hit band, so the eight rows land at `-47`, `+9`, `+65`, `+121`, `+177`, `+233`, `+289` and `+345`. Rows are `ROW_CARD_WIDTH = 400` × `ROW_CARD_HEIGHT = 68` cards behind 32 px labels, and each row's band is `ROW_HIT_WIDTH = 400` × `ROW_PITCH` - the full card width - so the label, the switch and the empty card space all activate the same row. A toggle's band is centred on the card rather than on its label, because the label sits 40 px left of the row centre while the switch is drawn 170 px right of it as a 64×32 track with a 24 px knob offset ±16. `VoiceRow` carries two controls, so it splits its one band at the midpoint between its chip and its preview, and both halves stay live. `TOGGLE_HEIGHT = 96` and `ROW_HEIGHT = 64` remain for the modal buttons and for the overlays that keep their own layout and the 64 px floor: `ProfilesOverlay`, `ProgressOverlay` and the iOS how-to overlay the install row opens. The band is 56 px and not 64 because eight rows plus the title and footer cannot each carry a 64 px band inside the 760 px panel without the bands overlapping, and an overlapping band gives the tap to whichever row is drawn last. The footer shows `v${__APP_VERSION__}` in 24 px `DISABLED_COLOR` (`#a0aec0`) at `centerY - 75`. Turning Sounds back on plays `playCorrect()` as the confirmation chime.
```

One line, one paragraph. The footer sentence, the `playCorrect()` chime sentence
and the following `allowPinchZoom()` paragraph are byte-identical to before. No
heading was added.

The three false claims are gone: the five hand-listed offsets (only Profiles,
Progress, Reset, Install and Voice were named, at `+123 … +345`), the
`TOGGLE_WIDTH` × `TOGGLE_HEIGHT` = 240 × 96 toggle hit area, and
`ROW_HEIGHT = 64` as "the minimum row pitch".

### `docs/PRD.md`

```diff
@@ -466 +466 @@ Design rules: thick dark strokes drawn at the 512 base size, flat fills, no grad
-The minimum interactive target is 64 by 64 px, the ideal is 96 by 96 px, and small art may sit inside a larger invisible hit area. Targets are inflated rather than drawn larger, so a 40 px glyph can still have a 96 px hit box.
+The minimum interactive target is 64 by 64 px, the ideal is 96 by 96 px, and small art may sit inside a larger invisible hit area. Targets are inflated rather than drawn larger, so a 40 px glyph can still have a 96 px hit box. The one documented exception is the eight Settings rows, where eight rows inside the panel cap each band at 56 px tall and the full 400 px card width is what carries the target.
```

The 64 by 64 px minimum is kept word for word; one sentence is appended inside
the same paragraph. The "Protected controls" paragraph that follows is unchanged,
and the section still has no bullet list.

## Each doc claim, and the code that makes it true

| Doc claim | Made true by |
| --- | --- |
| "`ROW_PITCH = 56` is both the distance between adjacent rows and the height of each row's hit band" | `primitives.ts:34` (`ROW_PITCH = 56`, with the why-comment at `:27-33`), consumed as a height at `primitives.ts:83-85`, `SettingsPanel.ts:252-254`, `InstallRow.ts:60-67`, `VoiceRow.ts:77-79` and `:108-110`. |
| "a first-row offset of `-47` … the eight rows land at `-47, +9, +65, +121, +177, +233, +289, +345`" | `SettingsPanel.ts:41` (`FIRST_ROW_OFFSET = -47`) and `:152` (`centerY + FIRST_ROW_OFFSET + index * ROW_PITCH`), applied at `:153-162` for the eight rows. |
| "each row's band is `ROW_HIT_WIDTH = 400` × `ROW_PITCH`" | `primitives.ts:25` (`ROW_CARD_WIDTH = 400`), `:36` (`ROW_HIT_WIDTH = ROW_CARD_WIDTH`), `:80-86` (the shared `createRow` rectangle). |
| "the label, the switch and the empty card space all activate the same row" | The band spans `-ROW_HIT_WIDTH / 2 .. +ROW_HIT_WIDTH / 2` about the row centre (`primitives.ts:82`, `SettingsPanel.ts:251`); the switch is at `x + 170` (`SettingsPanel.ts:216`) and the label at `x - 40` (`:238`), both inside it. |
| "A toggle's band is centred on the card rather than on its label … while the switch is drawn 170 px right of it" | `SettingsPanel.ts:247-257`: the rectangle origin is `-ROW_HIT_WIDTH / 2 + 40`, the +40 cancelling the label's `x - 40`; switch at `:216`, knob at `:227`. |
| "`VoiceRow` … splits its one band at the midpoint between its chip and its preview" | `VoiceRow.ts:54-61` (card edges, the two offsets, `splitX`), chip band `:74-82`, preview band `:104-111`; the widths partition the 400 px. |
| "`TOGGLE_HEIGHT = 96` and `ROW_HEIGHT = 64` remain for the modal buttons and the overlays" | Still exported at `primitives.ts:20-21`; used by `createModalButton` (`primitives.ts:121-123`), `ProfilesOverlay.ts:124-151`, `ProgressOverlay.ts:146-149`, and `InstallRow.ts:121-123` (the iOS how-to overlay's Close button, which is why that overlay is named). |
| "The band is 56 px and not 64 because eight rows … cannot each carry a 64 px band inside the 760 px panel without the bands overlapping" | `PANEL_HEIGHT = 760` (`primitives.ts:18`); the eight row stack runs `-47` to `+345`, so eight 64 px bands would need 512 px of the 760 px column around the title and footer and would overlap by 8 px per pair; the same reasoning is recorded at `primitives.ts:27-33`. |
| PRD: "the eight Settings rows … cap each band at 56 px tall and the full 400 px card width is what carries the target" | The same `ROW_PITCH = 56` / `ROW_HIT_WIDTH = 400` pair (`primitives.ts:34`, `:36`), which is the only band the eight-row stack fits. |

## Gate

Run from the repository root on `53717468` + the doc commit, docs first.

| # | Command | Exit | Notes |
| --- | --- | --- | --- |
| 1 | `pnpm check` | 0 | 252 files; the two pre-existing findings only - the `biome.json` schema-version info and the `musicalMemoryScene.test.ts:294` non-null assertion warning. Neither is touched by this phase. |
| 2 | `pnpm typecheck` | 0 | clean, no output beyond the script banner. |
| 3 | `pnpm test -- --run` | 0 | 121 files, 2634 tests passed. Unchanged from Phase 1. |
| 4 | `pnpm test:coverage` | 0 | statements 97.99, branches 92.00, functions 96.69, lines 98.74 - identical to Phase 1. |
| 5 | `pnpm build` | 0 | 343 modules; shell entry `index-DBpptynd.js` 141.61 kB (gzip 32.75 kB); precache 54 entries. |
| 6 | `node scripts/validate-bundle.js` | 0 | Phaser chunk present (1342.6 kB); shell entry 138.3 kB (<= 200 kB). |
| 7 | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed; 42 chunks, 42 precached. |
| 8 | `node scripts/validate-docs.js` | not run | Refused by the execution policy (`Permission denied: shell`) before producing output. Not retried or worked around. See blocker 1. |

The runner surfaces no numeric exit code on success; each row above is recorded as
0 because the command printed its own success output and no error envelope. The
one command that did not run is marked as such rather than assumed.

## Deviations

None. Two files changed, both named in `Touches`: `docs/TDD.md` and
`docs/PRD.md`, one line each. Nothing under `src/`, no test, no config, no
`conductor/tracks/.../plan.md`, `spec.md`, `metadata.json`, `review.md` or
`pr.md`.

## Blockers

1. `node scripts/validate-docs.js` - refused by the execution policy
   (`Permission denied: shell`) before producing output, exactly as in Phase 1.
   Per the brief it was not retried, rephrased or worked around. The docs changes
   only edit two existing paragraph lines: no heading, link, anchor, table row or
   Conductor path was added, removed or moved, so none of the five checks
   (release-note index, link and anchor resolution, the three game lists, the
   roadmap sections, Conductor paths) reads a target this phase changed. The
   primary agent must run it to close AC-6.

## Primary verification

Phase base `53717468`. Commits: `bba146f8 docs(settings): record the one-pitch row band and its 64px exception`, `823aa259 chore(conductor): record phase 2 verification for settings row targets`. The executor reported `blocked` for one reason only: `node scripts/validate-docs.js` was refused by its execution policy before producing output. The primary ran it (5/5), which closes AC-6.

### Scope

`git diff --name-only 53717468..HEAD` is exactly `docs/PRD.md`, `docs/TDD.md` and this evidence file - two one-line document edits, no code, no test, no config.

### Gate

| # | Command | Exit | Notes |
| --- | --- | --- | --- |
| 1 | `pnpm check` | 0 | the two pre-existing findings only |
| 2 | `pnpm typecheck` | 0 | clean |
| 3 | `pnpm test -- --run` | 0 | 121 files / 2634 tests, unchanged |
| 4 | `pnpm test:coverage` | 0 | 97.99 / 92.00 / 96.69 / 98.74, unchanged |
| 5 | `pnpm build` | 0 | shell `index-DBpptynd.js`, precache 54 |
| 6 | `node scripts/validate-bundle.js` | 0 | phaser 1342.6 kB; shell 138.3 kB |
| 7 | `node scripts/validate-pwa.js` | 0 | 16 / 0 |
| 8 | `node scripts/validate-docs.js` | 0 | all passed - the layer the executor was denied |

### Documents checked against the code

- TDD `:609` now names `ROW_PITCH = 56` as both spacing and band height, `FIRST_ROW_OFFSET = -47` with the eight derived offsets, `ROW_HIT_WIDTH = 400`, the card-centred toggle band with the reason for the +40, the `VoiceRow` split, and the 56-not-64 rationale. Each of those maps to a line in `primitives.ts` or `SettingsPanel.ts` that I re-read in Phase 1, so the prose describes the shipped code rather than the plan.
- The TDD paragraph keeps the footer sentence and the `playCorrect()` chime sentence verbatim, and the following `allowPinchZoom()` paragraph is untouched.
- PRD `:466` keeps 64 x 64 as the minimum and adds a single exception sentence naming the eight Settings rows, the 56 px band and the 400 px width as what carries the target. The "Protected controls" paragraph that follows is unchanged, so the stricter rule for state-changing controls still reads as the default.
- The one claim worth double-checking was "eight 64 px bands would need 512 px": the stack runs from `-47` to `+345`, so eight 64 px bands on a 56 px pitch would overlap 8 px per pair. That is arithmetic, not a measurement, and it matches the code.