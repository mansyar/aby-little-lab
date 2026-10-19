# Phase 4 — Flow, full gate, docs

- **Track:** `20261020-feelings-faces` — Feelings Faces — Game 21 (Social-Emotional Learning)
- **Phase:** 4 — Flow, full gate, docs
- **Date:** 2026-10-20
- **Branch:** `feat/20261020-feelings-faces`
- **Base:** `c947b23f7da50b1a2f27f36ff72a4a2823d4e92e`
- **Head:** `cbd6ec83bdd0831ebcbfbce1fccf8a58e1d02479` (this evidence file lands in the following commit)
- **Result:** **blocked** — every check and task in the phase contract is complete and green except P4.T3.1 (`conductor/product.md`), which this agent is not permitted to edit (product docs are owned by the primary agent; `edit` on that path is refused). The three pending product.md edits are specified under *Outstanding work*.

## Tasks

| Task | Status | Commit |
|---|---|---|
| P4.T1 — Flow suite (hub tile → 6 rounds → sticker → hub) | done | `4fc0e70` |
| P4.T2 — Suite-wide expectations: `GAME_SCENES`/`GAME_SCENE_KEYS` + nav/lifecycle counts 20 → 21 | done | `4fc0e70` |
| P4.T3.1 — `product.md`: game row 21, changelog, cross-game systems | **blocked** (permission) | — |
| P4.T3.2 — `README.md`: twenty-one, game table row, scene/test counts | done | `cbd6ec8` |
| P4.T3.3 — `docs/SVG_STYLE.md` §8 + `textureTiers.ts` header asset counts | done | `cbd6ec8` |
| P4.T4 — Full verification + this report | done | — |

### P4.T1 — Flow suite

`src/__tests__/scenes/feelingsFacesFlow.test.ts` (295 lines, 5 tests) follows the
`shapeSorterFlow` idiom exactly: the nine hoisted `vi.mock` blocks with their
harness doubles, then real imports. It is the first flow suite to instantiate
`HubScene`, so the walk covers the whole journey rather than one scene:

- 21 tiles on the wide Hub, 21 tile icons, `tile_feelings_faces` last, and the
  `Feelings Faces` label present. Tiles are identified by their `pointerup`
  handler rather than by raw `add.rectangle` order, because the Hub also draws
  the ProfileChip active ring.
- Releasing tile 21 awaits `ensureSceneLoaded(hub, "FeelingsFaces")` and starts
  the scene.
- Rule line spoken once, then the round-1 scenario after the 2600 ms opening
  deferral; six rounds each with 3 distinct faces whose live `face_*` textures
  match the round's choices.
- A wrong tap in round 3 plays the incorrect SFX, does not advance, and does not
  count as correct; the round is then completed normally.
- Six correct rounds → one `playWin`, one `playSticker`, `hasSticker("feelings-faces")`
  true, and the sticker image on the scene.
- 3 s auto-return → `scene.start("Hub", { justEarned: "feelings-faces" })`; a fresh
  Hub then shows `sticker_feelings_faces` and the 20 remaining empty slots.
- Replay → no second sticker, and the return carries no `justEarned`.

### P4.T2 — Suite-wide expectations

`src/__tests__/helpers/gameScenes.ts` now imports `FeelingsFacesScene` and lists it
as the 12th `GAME_SCENES` entry, so the three `it.each(GAME_SCENES)` suites in
`sceneLifecycle.test.ts` and `hubEngagement.test.ts` (back-hold navigation, 96×96
Back hit area, press-feedback squish, early release, cancel, hold-ring cleanup)
now run against Feelings Faces too — 15 new executions, no count assertions needed
because no suite asserts `GAME_SCENES.length`.

`GAME_SCENE_KEYS` already carried all 21 keys (Phase 3), so the navigation and
hub-engagement loops needed no arithmetic change; they pass unchanged at 21 tiles.
The 20-vs-21 slot counts in `hubEngagement.test.ts` and `sceneLifecycle.test.ts`
were re-checked and are correct as written: 21 tiles minus the one earned sticker
is 20 empty slots.

One production change was required to make the widened table pass: the lifecycle
suite's `triggerShutdown` helper invokes only the **first** registered `shutdown`
handler, and `FeelingsFacesScene` was the only scene with two (its own rule-line
teardown registered before `registerShutdownCleanup()`), so the parent lock,
mascot and speaker were never destroyed under test. The registrations are now
swapped — shared cleanup first, rule-line teardown second — with a comment saying
why. See *Deviations*.

### P4.T3.2 / P4.T3.3 — Documentation

README: "Twenty" → "Twenty-one" (and social-emotional added to the milestone
list), game table row 21, `scenes/` line 21 lazy-loaded scenes, `feelingsFacesLogic`
in the `game/` listing, a Feelings Faces clause in *Replay variety*, eleven rule
narrators in *Spoken rules* (with the exact rule line), the twenty-one counts in
the parental-lock, reset-sticker, win-celebration and mascot sections, a
*Per-Game Juice* bullet, and the code-splitting section (twenty-one chunks, 42
precache entries). Test counts refreshed to the measured 2,090 across 98 files.

`docs/SVG_STYLE.md`: §0 total 170 → 176; §8 table gained a `feelings/` row (4),
`stickers/` 20 → 21, `ui/` 11 → 12 (`tile_feelings_faces` lives in `ui/`, not
`ui/tiles/`, so `ui/tiles/` stays 20); the contact-sheet sentence now says 11
sheets with `feelings/` unrepresented and the tile on the `ui` sheet.

`src/utils/textureTiers.ts`: header 170 → 176 textures and ~178 MB → ~184 MB
(176 × 512² × 4 B). Counts verified against the tree: feelings 4, stickers 21
(globbed), ui 12, ui/tiles 20.

## Commands

Run as one chain, exactly as written in the brief:

`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`

| # | Command | Exit | Detail |
|---|---|---|---|
| 1 | `pnpm check` | 0 | 194 files; one pre-existing warning (`musicalMemoryScene.test.ts:294` non-null assertion, untouched) and the pre-existing biome schema-version info (2.5.5 config vs 2.5.10 CLI) |
| 2 | `pnpm typecheck` | 0 | `tsc --noEmit`, clean |
| 3 | `pnpm test -- --run` | 0 | **98 files / 2,090 tests passed** (was 97 / 2,075 at Phase 3) |
| 4 | `pnpm test:coverage` | 0 | see summary below — every metric above its threshold |
| 5 | `pnpm build` | 0 | 268 modules; shell entry `index-BaYoZ85p.js` 193.80 kB (37.00 kB gzip); `FeelingsFacesScene-BOQufrCn.js` 5.64 kB; precache 42 entries / 1668.25 KiB |
| 6 | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present; shell entry 189.3 kB ≤ 200 kB |
| 7 | `node scripts/validate-pwa.js` | 0 | 15 passed, 0 failed |

### Coverage summary

| Metric | Result | Threshold | Margin |
|---|---|---|---|
| Lines | **98.99%** (4721/4769) | 95 | +3.99 |
| Functions | **97.97%** (921/940) | 88 | +9.97 |
| Branches | **89.65%** (1118/1247) | 85 | +4.65 |
| Statements | **98.15%** (5047/5142) | 90 | +8.15 |

`FeelingsFacesScene.ts`: 96.09% statements, 81.57% branches, 94.73% functions,
100% lines. No threshold was lowered and no coverage-ignore comment was added.

## Acceptance criteria

| AC / NFR | Verdict | Evidence |
|---|---|---|
| **AC-1** — Hub renders 21 tiles, the 21st is Feelings Faces and launches the scene | met | `feelingsFacesFlow.test.ts` "renders 21 tiles with Feelings Faces as the 21st" and "launches Feelings Faces when the 21st tile is released"; `navigation.test.ts` / `hubEngagement.test.ts` 21-key tile loops; `hasSticker` called 21 times; `GAME_SCENE_KEYS` iteration in `hubEngagement` |
| **AC-10** — Full CI parity green | met | commands table above: all seven commands exit 0, coverage above thresholds, bundle and PWA validators pass, boot path untouched since the Phase 3 smoke |
| **NFR-1** — 60 fps / no new audio / lean boot | met | no new audio assets or SFX calls (reuses `playCorrect` / `playIncorrect` / `playWin` / `playSticker`); the only animation is tween-based; build output is unchanged in shape (Phaser vendor chunk + 21 lazy chunks), precache grew by the six new SVGs |
| **NFR-2** — ≥64×64 targets, no reading required | met | card geometry 220×250 asserted in `feelingsFacesScene.test.ts`; every game now runs through the 96×96 Back hit-area `it.each(GAME_SCENES)` case; caption fallback keeps the round completable without voice |
| **NFR-3** — Reduced motion + BGM/SFX/voice honoured | met | reduced-motion wiggle (2°/200 ms) and entrance coverage in `feelingsFacesScene.test.ts`; caption/dimmed-glyph paths for SFX off, no engine and no voice; audio spies assert the SFX gate |
| **NFR-6** — Strict TS, Biome clean, coverage 95/88/85/90 unchanged | met | `pnpm typecheck` clean, `pnpm check` clean (pre-existing warning only), coverage table above |

## Deviations

| File | Reason |
|---|---|
| `src/scenes/FeelingsFacesScene.ts` | Outside the phase `Touches`, but required by P4.T2: `sceneFlowHarness.triggerShutdown` invokes only the scene's first `shutdown` handler, so the shared cleanup had to be registered before the rule-line teardown. Swapping the two registrations (5 lines) makes the widened `GAME_SCENES` lifecycle cases pass. Shared cleanup running first is also the more defensive order at runtime. |

`conductor/product.md` is **not** listed as a deviation because it was not changed:
the edit tool refuses that path for this agent.

## Outstanding work (for the primary agent)

P4.T3.1 is the only gap. `conductor/product.md` needs three edits:

1. `### 3.1 Eighteen Mini-Games` → `### 3.1 Twenty-One Mini-Games`, and append a
   row 21 after Number Order, e.g.
   `| 21 | Feelings Faces | Social-emotional learning (emotion recognition) | Hear a short everyday scenario, then tap the face showing how Aby feels (6 rounds, 3 faces per round, 16-scenario pool; contrastive pairs first, then the confusable sad/scared pair) |`
2. §3.2 cross-game notes: Mascot "all twenty game scenes" → twenty-one; TTS
   "all twenty games" → twenty-one; *Spoken Rules for Every Game* → twenty-one
   games voiced / **eleven** rule-narrators, adding Feelings Faces
   ("Tap the face that shows how Aby feels."); *Parent Progress Insights* →
   "each of the 21 games" with rows paging 6 + 6 + 6 + 3.
3. §6 `HubScene: 20 game tiles grid (5×4 — four rows of five)` → 21 tiles, 6×4 at
   144 px with rows 6/6/6/3; plus a Game 21 amendment in §4's *Textless Visual
   Cues* chain (the scenario is spoken, the faces are the answer set) and a
   `## Changelog — Game 21 (2026-10-20)` block above the Game 20 entries.

## Notes

- `scripts/render-svg-contact-sheets.mjs` has no `feelings` category, so the four
  face SVGs appear on no contact sheet. The script is outside this phase's
  `Touches`; `docs/SVG_STYLE.md` now states the situation explicitly rather than
  claiming one sheet per folder. Worth a follow-up if the faces need review
  sheets.
- Two duplicate `## Changelog — Game 20` sections already existed in
  `product.md`; left untouched for the primary to reconcile alongside P4.T3.1.
- README's *Build output* bullet still quotes the combined shell figure
  (~1.44 MB / 372 KB gzip) although the build now emits a separate Phaser vendor
  chunk. Out of scope here (the task was scene/test counts); flagged for a
  follow-up doc pass.
- The pre-existing `musicalMemoryScene.test.ts:294` non-null-assertion warning and
  the biome schema-version info are unchanged and were deliberately left alone.
- No `any`, no Biome suppressions, no lowered thresholds, no weakened tests.

## Primary verification

- **Date:** 2026-10-20
- **Command:** pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js — exit 0.
- **Detail:** 98 files / 2,090 tests passed (both plain and coverage runs); coverage lines 98.99% / functions 97.97% / branches 89.65% / statements 98.15% — every threshold cleared; shell entry index-BaYoZ85p.js 189.3 kB (<= 200 kB, validator PASS); PWA validator 15/15. pnpm check clean apart from the pre-existing musicalMemoryScene.test.ts:294 warning and the biome schema-version info.
- **P4.T3.1:** conductor/product.md was edited by the primary agent (the phase subagent is denied product docs): game table row 21, twenty-one counts across mascot/TTS/spoken-rules/progress, the Game 21 textless-cues amendment, the hub 6x4 note, and a Game 21 changelog entry.
- **Coverage-load flake fix:** the navigation test's 21-fresh-hub loop timed out at the 5 s default in the first full-coverage run (it passed solo and in the plain suite run); the test now carries an explicit 15 s timeout (8807eaf). The re-run under full load passed.
- **Squash:** the phase range c947b23..8807eaf (5 commits: flow suite, docs, evidence record, product.md completion, timeout fix) contained no merge or foreign commits and was squashed to 34b2f22.
- **Deviations accepted:** the FeelingsFacesScene.ts shutdown-registration reorder (5 lines, outside Touches, required by the widened GAME_SCENES lifecycle cases) and the primary-authored conductor/product.md change above.
