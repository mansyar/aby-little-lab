# Phase 2 Verification — "The record says what the frame is"

- Track: `20261024-overlay-hit-areas` · Phase 2 · 2026-10-24
- Branch: `fix/20261024-overlay-hit-areas` · Result: **verified** (executor gate 7/8 green; `validate-docs.js` denied — see Blockers)
- Base: `7ec6fa18` · Docs commit: `fff20677` (`docs(components): describe the hit-area frame rule for overlays and toast`)
- Evidence commit: this file's commit (`docs(conductor): record overlay hit areas phase 2 evidence`)

## Base

- Phase base: `7ec6fa18` on `fix/20261024-overlay-hit-areas`.
- Docs commit: `fff20677` — the only code-state change this phase (docs only).
- Evidence commit: the commit that adds this file.

## What changed, per file

### `docs/TDD.md`

- **Anchor :618 — the `ProfilesOverlay.ts` table row** (§5.5 `src/components/settings/` table). Before: `| `ProfilesOverlay.ts` | profile list, add/delete/switch, per-profile limit chips (Off/15/30/45/60) |`. After: the same two cells extended with one clause naming the row's custom hit areas (the Delete button, the play-time chip), the helper `centredHitArea()` from `primitives`, and the mechanism — the helper cancels the `displayOrigin` the engine's `InputManager` adds before testing a custom area, so the described rectangle is the live zone, not the drawn label's extent.
- **Anchor :619 — the `ProgressOverlay.ts` table row.** Before: `| `ProgressOverlay.ts` | per-game learning stats: 6 rows per page (`PROGRESS_PAGE_SIZE = 6`), accuracy bar, `★` mastery at 3 wins, relative last-played, 7-day strip |`. After: the same cells extended with the row's three custom hit areas (the close glyph, the page chevrons, the avatar chips) and the identical mechanism clause, ending "not the drawn glyph's or avatar's extent".
- **Anchor :636 — the §5.7 paragraph.** Before: one sentence (520×150 toast, 200×72 buttons) straight into "`PwaToasts.ts` owns the lifecycle:…". After: a second sentence after the 520×150 sentence — every custom hit area on the toast's controls goes through `centredHitArea()` from `settings/primitives`, which cancels the `displayOrigin` the engine's `InputManager` adds before testing a custom area, so each button's live zone is the described 200×72 rectangle centred on it, not the rendered word's extent; and a final sentence after the `registerType: "prompt"` sentence recording the avatar-chip numbers: the chips apply the same helper to an `Image`, the engine divides an `Image` tap by the drawn scale (`TransformXY`) before the helper's callback runs, the chip's rectangle is written in the image's local frame as `96 / chipScale` so the live band still measures 96×96 in scene space, the chips ride a 56 px pitch so adjacent bands overlap, and the later-drawn chip wins each seam.
- No rows were added or removed; both table rows remain single lines, so column layout is untouched. No heading, link or anchor changed.

### `docs/PRD.md`

- **Anchor §5.2 (:467, new paragraph).** Before: §5.2 held the minimum-target paragraph (:466, ending "…a toggle's target is its row, not its drawn switch.") followed by a blank line and the "Protected controls…" paragraph (:468, now :469 — moved by the insertion, its text untouched). After: one new paragraph between them, two sentences: (a) every custom hit area in the app is framed so the described target is where the drawing is — the parent-facing panels, overlays and the update toast through one origin-cancelling helper (`centredHitArea`), which cancels the display origin Phaser's input system adds before testing a custom area, the scene-level controls through rectangles written in the engine's own frame; (b) the Learning Progress overlay holds the second accepted overlap after the Settings rows: each avatar chip has a 96 by 96 px floor on a 56 px chip pitch, adjacent bands overlap, and the later-drawn chip wins the seam.

## Commands

Layer by layer as separate commands (per the brief; the chained form has been refused for executors across tracks).

| # | Layer | Command | Exit | Summary |
| --- | --- | --- | --- | --- |
| 1 | static | `pnpm check` | 0 | 252 files checked, no fixes applied; the two pre-existing findings only (biome schema-version info at :2:14, `musicalMemoryScene.test.ts:294` noNonNullAssertion) |
| 2 | static | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| 3 | unit | `pnpm test -- --run` | 0 | 121 test files / 2648 tests, all pass (phase-1 baseline unchanged: docs-only phase, +0) |
| 4 | coverage | `pnpm test:coverage` | 0 | statements 97.98 / branches 91.9 / functions 96.71 / lines 98.76 — identical to phase 1 |
| 5 | build-artifact | `pnpm build` | 0 | 343 modules, built in 1.32s; precache 54 entries (1726.08 KiB) |
| 6 | build-artifact | `node scripts/validate-bundle.js` | 0 | shell `index-BdGRHjBx.js` = 138.4 kB ≤ 200 kB; phaser vendor chunk present — fingerprint unchanged from phase 1 (production code untouched) |
| 7 | build-artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| 8 | documents | `node scripts/validate-docs.js` | **DENIED** | sandbox refused after one attempt; refusal verbatim under Blockers — the primary runs this layer (the phase-1 precedent) |

## Document claims against the code

| New sentence (anchor) | What makes it true |
| --- | --- |
| TDD :618 — ProfilesOverlay's custom hit areas (Delete button, play-time chip) go through `centredHitArea()` from `primitives`, which cancels the `displayOrigin` the engine's `InputManager` adds before testing a custom area, so the described rectangle is the live zone, not the drawn label's extent | `src/components/settings/ProfilesOverlay.ts:125` (`remove.setInteractive(centredHitArea(TOGGLE_WIDTH, ROW_HEIGHT))`, comment :123) and `:143` (`chip.setInteractive(centredHitArea(TOGGLE_WIDTH / 2, ROW_HEIGHT))`); helper `src/components/settings/primitives.ts:40-72` (rejects `Rectangle.Contains`; its callback subtracts `displayOriginX/Y`); these are the only custom hit areas in the file (plain `setInteractive()` at :76/:192/:232 is the default frame, not a custom area) |
| TDD :619 — ProgressOverlay's custom hit areas (close glyph, page chevrons, avatar chips) go through the same helper… | `ProgressOverlay.ts:148` (close, `centredHitArea(TOGGLE_HEIGHT, TOGGLE_HEIGHT)`), `:168` (chips, `centredHitArea(96 / chipScale, 96 / chipScale)`), `:267` (chevrons, `centredHitArea(96, 96)`); the only other `setInteractive` in the file is the backdrop's plain default-frame call at :112 |
| TDD :636 — every custom hit area on the toast's controls goes through `centredHitArea()` … so each button's live zone is the described 200×72 rectangle centred on it, not the rendered word's extent | `PwaToast.ts:103-106` (`button.setInteractive(centredHitArea(BUTTON_WIDTH, BUTTON_HEIGHT))` with the engine-frame comment); `BUTTON_WIDTH`/`BUTTON_HEIGHT` = 200/72 match the §5.7 sentence's 200×72; engine-accurate probes in `src/__tests__/components/PwaToast.test.ts` › `PwaToast engine hit test` pin the band (red-then-green recorded in `verification/phase-1.md`) |
| TDD :636 — the chips apply the same helper to an `Image`; the engine divides an `Image` tap by the drawn scale (`TransformXY`) before the helper's callback runs; the rectangle is written in the image's local frame as `96 / chipScale`; the live band still measures 96×96 in scene space; chips ride a 56 px pitch so adjacent bands overlap; later-drawn chip wins each seam | `ProgressOverlay.ts:162-168` (`chipScale = 64 / AVATAR_TEXTURE_SIZE`, `chip.setInteractive(centredHitArea(96 / chipScale, 96 / chipScale))`, the image-local-frame comment :164-167); pitch literal `* 56` at `ProgressOverlay.ts:154`; engine step `InputManager.hitTest` → `TransformXY` (`node_modules/phaser/src/input/InputManager.js:935`, derived in `verification/phase-1.md` Deviation 1); the seam outcome is pinned by `SettingsPanel.test.ts` › `SettingsPanel progress overlay bands` › `selects a chip from a tap inside its own band…` — a seam tap lies inside both bands and the later-drawn chip (greater `callIndex`) wins; phase-1 evidence records the same mechanism note |
| PRD :467 — every custom hit area in the app is framed so the described target is where the drawing is — the panels, overlays and update toast through the origin-cancelling helper, the scene-level controls through rectangles in the engine's own frame | Helper sites (the full set of custom areas on those surfaces): `SettingsPanel.ts:143,253`, `settings/VoiceRow.ts:238` (both split halves through the helper's callback), `settings/InstallRow.ts:61,111`, `settings/ProfilesOverlay.ts:125,143`, `settings/ProgressOverlay.ts:148,168,267`, `PwaToast.ts:106`, plus the shared `createRow`/modal-button builders `settings/primitives.ts:114,144`; `settings/ResetModal.ts:62` is a plain default-frame `setInteractive()` (no custom area, so not in scope of the sentence). Scene-level sites write `(0, 0)`-based rectangles correct in the engine's frame: `GameSceneBase.ts:267-268` (Back), `HubScene.ts:222-223` (settings hold), `ChoiceRoundScene.ts:161-162`, `MemoryMatchScene.ts:151-152`, `WordBuilderScene.ts:180-181`, `NumberOrderScene.ts:266-267`, `StoryOrderScene.ts:228-229`, `game/hub/gridBuilder.ts:247-248` (page dots) — the same inventory the spec's Problem section documents as already correct |
| PRD :467 — the Learning Progress overlay holds the second accepted overlap after the Settings rows: each avatar chip has a 96 by 96 px floor on a 56 px chip pitch, adjacent bands overlap, and the later-drawn chip wins the seam | Band 96 scene px (per the row above), pitch 56 (`ProgressOverlay.ts:154`), so overlap is structural (40 px between adjacent band edges); the seam winner is the later-drawn chip — pinned in `SettingsPanel.test.ts` (seam tap, `dogNow.callIndex > catNow.callIndex`, `callIndex` greater for the later chip). "Second accepted overlap" positions it after the Settings rows' card-lap exception that PRD §5.2 :466 and TDD :609 already record |

Framing checks: no new link, anchor or Conductor path was introduced in either governed file (the validator's five checks scan exactly those), so `validate-docs.js`'s checks are structurally unaffected; "second accepted overlap" mirrors the PRD's own "The one documented exception is the eight Settings rows" phrasing.

## Deviations

None. Every edit is inside the phase's Touches (`docs/TDD.md`, `docs/PRD.md`, this evidence file); no test, source, plan, spec or generator file was touched; git verbs used were exactly `add`, `commit`, `status`, `diff`, `log`, `show`.

## Blockers

- `node scripts/validate-docs.js` → `Permission denied: shell` (envelope: `{"error":{"type":"permission.rejected","message":"Permission denied: shell"}}`). Attempted once per the brief; not retried, not worked around. Expected by this phase's brief and by plan.md's notes; the primary ran this layer green at phase 1 (5/5 checks) and should close it here.

## Notes for the primary agent

- All other seven layers are green on the exact commands, layer by layer; suite counts and coverage are byte-identical to the phase-1 record (121 / 2648; 97.98 / 91.9 / 96.71 / 98.76), as expected for a docs-only phase, and the shell fingerprint `index-BdGRHjBx.js` (138.4 kB) is unchanged because no production file moved.
- The docs deny is the gate's only open item; when the primary runs `node scripts/validate-docs.js`, nothing in the diff adds links, anchors or Conductor paths, so a clean run is expected on structural grounds.
- Wording provenance: the TDD rows and the §5.7 sentence keep the repo's spaced-hyphen voice and backtick the constants (`centredHitArea()`, `displayOrigin`, `TransformXY`, `96 / chipScale`); the PRD paragraph says "display origin" in words because the PRD prose names code inline only where the bundle section does, and `centredHitArea` there is backticked once as the helper's name.
- One passing antecedent worth knowing about (not corrected to keep the docs in the single commit): TDD :636 "…apply the same helper to an `Image` and carry its one accepted overlap" — "its" is meant as the Progress overlay stack's, not the helper's; harmless but the primary may prefer tightening it during review.
- Phase 1 flagged the spec's AC-3 Correction (R1) for phase 2; it is a spec.md change, outside this phase's Touches, so it is untouched here and still owed by the primary.
## Primary verification

Primary append (executor session `ses_e9232af2bffenLmIQpGKx8j3qQ`). Base
`7ec6fa18`; commits `fff20677` (docs), `7648b67b` + `1aeb4372` (evidence).
`git diff --name-only` is exactly `docs/TDD.md`, `docs/PRD.md` and this
evidence file.

### Gate layers (primary, including the executor-blocked layer)

| # | Layer | Exit | Reading |
| --- | --- | --- | --- |
| 1 | `pnpm check` | 0 | unchanged (two pre-existing findings only) |
| 2 | `pnpm typecheck` | 0 | clean |
| 3 | `pnpm test -- --run` | 0 | 121 files / 2648 tests - byte-identical to phase 1 (docs-only) |
| 4 | `pnpm test:coverage` | 0 | 97.98 / 91.9 / 96.71 / 98.76 |
| 5 | `pnpm build` | 0 | precache 54 entries (1726.08 KiB) |
| 6 | `node scripts/validate-bundle.js` | 0 | shell `index-BdGRHjBx.js` 138.4 kB, fingerprint unchanged |
| 7 | `node scripts/validate-pwa.js` | 0 | 16 passed |
| 8 | `node scripts/validate-docs.js` | 0 | **All document validation checks passed** (the blocked layer) |

### Document claims against the shipped code

- TDD `:618`/`:619` rows now enumerate each overlay's exhaustive custom set
  (Delete + chip; close + chevrons + avatar chips) and name the helper - true:
  phase 1 converted exactly those six sites, and the helper cancels
  displayOrigin (verified against Phaser source in phase 1).
- TDD `:636` toast sentence states each button's live zone is the described
  200x72 rectangle - true per PwaToast.test.ts's `expectButtonBand` pins.
- The avatar-chip sentence records the image-local `96 / chipScale` frame and
  the later-chip-wins seam - true: `centredHitArea(96 / chipScale, ...)`
  (ProgressOverlay.ts) and the seam test in SettingsPanel.test.ts.
- PRD 5.2's framing rule deliberately covers both the helper sites and the
  scene-level engine-frame rectangles (Back/settings hold/cards/tiles) - the
  wording keeps the sentence true against all of them rather than
  overclaiming a single mechanism.

### Accepted

1. The third evidence commit (`1aeb4372`) is a two-word correction to the
   executor's own evidence, absorbed by this phase's squash.
2. One extra read-only `git rev-parse` at session start - harmless.
3. The "its one accepted overlap" antecedent nit in TDD `:636` - reads
   tolerably; left as-is (review may tighten).
