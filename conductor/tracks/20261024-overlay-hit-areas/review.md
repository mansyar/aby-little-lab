# Track Review - 20261024-overlay-hit-areas

- **Track:** `20261024-overlay-hit-areas` (bug, high)
- **Branch:** `fix/20261024-overlay-hit-areas`
- **Range:** `8fdbff910f4891d93800251e561d450b90d1ef3f..219c916d8a8af3d35d7ef55f265d1d32de1276be`
- **Date:** 2026-10-24
- **Round:** 1 (final)
- **Verdict:** **PASS WITH FINDINGS** - zero Critical or High. One Medium and four
  Low findings, all annotation-level, fixed before the PR (see round-1 fix
  commit `219c916d`).

## Summary

The track's structure is sound. All six defect sites route through the
`centredHitArea()` helper proven in the Settings track, each band measures the
same size as before (20Ox72 toast, 240x64 Delete, 120x64 chip, 96x96 close and
chevrons, 96x96 scene-space chip band), and every drawn position, handler and
press-feedback attachment is unchanged. The avatar chip's band is expressed in
the image-local frame (`96 / chipScale`) because Phaser's `InputManager.hitTest`
divides the tap by drawn scale (`TransformXY`, `InputManager.js:935`) before
`pointWithinHitArea` adds the unscaled display origin - re-derived from Phaser
source by both the executor and the reviewer, and pinned in tests by
arithmetic (`hitArea.width * scale` close to `96`).

The reviewer's exhaustive sweep found **no leftover centre-negative hit-area
pairs in the three components**, and all 47 `setInteractive` sites in
`src/components` are now engine-frame-correct: the six defect sites through the
helper, the Settings rows through the helper (previous track), and the
scene-level sites through `(0,0)`-frame rectangles already written in the
engine's own frame.

## Verification

| Layer | Exit | Reading |
| --- | --- | --- |
| `pnpm check` | 0 | two pre-existing findings only |
| `pnpm typecheck` | 0 | clean |
| `pnpm test -- --run` | 0 | 121 files / 2648 tests |
| `pnpm test:coverage` | 0 | 97.98 / 91.9 / 96.71 / 98.76 |
| `pnpm build` | 0 | precache 54 entries (1726.08 KiB) |
| `node scripts/validate-bundle.js` | 0 | shell `index-BdGRHjBx.js` 138.4 kB <= 200 kB |
| `node scripts/validate-pwa.js` | 0 | 16 passed |
| `node scripts/validate-docs.js` | 0 | all checks passed (run by the primary) |

The reviewer's sandbox denied `pnpm`/`node` and one `git cat-file`; the gate
table is accepted from the primary's own runs recorded in the phase evidence.

## Requirements

| ID | Verdict | Note |
| --- | --- | --- |
| FR-1 | covered | `PwaToast.ts:106` `centredHitArea(BUTTON_WIDTH, BUTTON_HEIGHT)` |
| FR-2 | covered | `ProfilesOverlay.ts:125` Delete; `:143` chip |
| FR-3 | covered (one correction clause) | close + chevrons at `ProgressOverlay.ts:148`/`:267`; FR-3's literal `96, 96` chip call corrected in spec (F4 below) |
| FR-4 | covered | size pins unchanged; no drawn-geometry change |
| FR-5 | covered | `engineHits` / `engineHitsScaled`; red-then-green (8 failed / 2640 passed pre-fix -> 121 / 2648) recorded verbatim |
| NFR-1 | covered | no new dependency; helper imported, not moved or edited |
| NFR-2 | covered | no persisted state |
| NFR-3 | covered | tests derive geometry from created objects |
| NFR-4 | covered | app-wide framing rule in PRD 5.2; frame rules in TTD rows |
| NFR-5 | covered | full gate incl. docs |
| AC-1..AC-6 | covered | see `verification/integrated.md` table with test references |

## Plan compliance

Compliant. 11 tasks in the plan; all landed with checkpoints in ancestry order
(`485970d2` -> `88207888` -> `679c198a` -> `7ec6fa18` -> `303bfe1d` ->
`4b95f5d7`). The non-conductor diff is exactly the union of the two phases'
`Touches` lists (7 code/docs files) plus evidence; `PwaToasts.test.ts` being
unchanged is inside the union (it needs no behavioural change - the toast API
did not move).

## Findings (all fixed before the PR)

| ID | Severity | Finding | Fix |
| --- | --- | --- | --- |
| F1 | Medium | `verification/phase-1.md:157` - the chip's recorded red message `expected 384 to be close to 96 (diff 288)` is arithmetically irreproducible from the committed probe, which must read `expected 24 (diff 72)` for the un-fixed local rect; 384 matches an earlier division-form probe | controlled un-fix re-run by the primary produced the true message; evidence corrected with a provenance note naming the superseded probe |
| F2 | Low | `SettingsPanel.test.ts:1550` - test name still said "whole visible chip label"; body asserts the corrected right-third contract | renamed to "cycles the limit from the drawn chip label..." |
| F3 | Low | phase evidence cites pre-squash hashes (`247c8567`, `fff20677`) without noting the squash; integrated.md range unaware of the review commit | squash notes added to both phase files; integrated.md post-review note names `c7337dde` and pins the range to the verified head |
| F4 | Low | `spec.md:113` - FR-3 still specifies the literal `centredHitArea(96, 96)` chip call though the shipped call is `96 / chipScale` (Deviation 1) | Correction (pre-review) clause added inline, mirroring AC-3's |
| F5 | Low | `spec.md:44` - claimed every scene-level `(0,0)` rect carries a comment; two sites have none | reworded to "written in the engine's own frame (most with comments stating it)" |

## Debt

**None.** Every finding is fixed inside the track. The reviewer's incidental
findings - `MemoryMatchScene.ts` / `WordBuilderScene.ts` lacking the frame
comment, and the page-dot's margin-dependent-centre rect (`gridBuilder.ts`) -
are correct-as-shipped code the reworded spec claim now describes accurately.

## History

| Round | Verdict | C | H | M | L | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | PASS WITH FINDINGS | 0 | 0 | 1 | 4 | 5 (pre-PR) |

## Doc sync

`complete`. PRD 5.2 carries the framing rule and both accepted overlaps; TDD's
component rows and 5.7 name the helper and both frames; the spec's two
corrections are recorded in-track. `validate-docs.js` 5/5 at the review head.
