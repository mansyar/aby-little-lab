# Review — Story Order (Game 22)

- Track: `20261020-story-sequencing`
- Type: feature
- Branch: `feat/20261020-story-sequencing`
- Range: `95d044e..b3dff94` (production code, tests, scripts, assets; `conductor/` excluded)
- Date: 2026-10-20
- Verdict: **PASS**

## Summary

The game is complete and every gate is green: 2,205 tests across 103 files,
coverage 98.11 / 90.54 / 98.04 / 98.94, shell 195.4 kB of the 200 kB gate,
`StoryOrderScene` 33.36 kB with all 24 panel keys and zero in the boot shell,
PWA 15/15. The art-in-chunk architecture works as designed and the logic module
is sound - the reviewer explicitly cleared the degenerate-RNG rotation (a
rotation of a non-identity permutation is never the identity, and the
`() => 0.999999` test walks straight into that branch) and the missing texture
guard in `preloadStoryOrderArt` (Phaser's loader skips keys already cached).

Three Medium findings, all requirement-vs-build mismatches rather than crashes:

- **M1** the tap-to-return path is unreachable in the real engine, because
  `justDropped` is always true at `pointerup`; the test that "proves" it calls the
  handler directly. Dead code plus a test that certifies impossible behaviour.
- **M2** FR-3 specifies the slots *below* the shuffled panels; the build puts the
  slots above the tray (the mirror of Number Order).
- **M3** AC-3 promises "dropping outside returns the panel home", but a *placed*
  panel springs back to its slot on a miss.

Plus four Low findings: README's ~197 kB shell figure, `product.md` still saying
"eleven rule-narrators" and the new Game 22 block sitting under the Game 21
heading, the sock panel leaning on fill rather than shape, and phase-2 evidence
citing commits that were squashed away.

## Verification (re-run by the reviewer, at `b3dff94`)

| Layer | Result |
| --- | --- |
| `pnpm check` | pass - 206 files, 1 pre-existing warning, 1 schema info |
| `pnpm typecheck` | pass |
| `pnpm test -- --run` | pass - 103 files / 2,205 tests |
| `pnpm test:coverage` | pass - 98.11 / 90.54 / 98.04 / 98.94 |
| `pnpm build` | pass - Story Order chunk 33.36 kB, shell 200,120 B raw |
| `validate-bundle` | pass - 195.4 kB ≤ 200 kB |
| `validate-pwa` | pass - 15 / 15 |
| Dist grep | pass - 24 panel keys only in the Story Order chunk |

## Requirements coverage

| Req | Status | Note |
| --- | --- | --- |
| FR-1, FR-2, FR-5 - FR-9 | Met | scene+registry+tile, logic, validation, completion, narrator, art placement, integration |
| FR-3 | Partial | M2 - vertical order inverted vs the spec text |
| FR-4 | Partial | M1 - tap-to-return unreachable |
| FR-10 | Partial | L1, L2, L4 - doc count/heading/trace errors |
| NFR-1, NFR-2, NFR-3, NFR-4, NFR-6, NFR-7, NFR-8 | Met | 195.4 kB, test diff audited (counts only), no deps, timings preserved, preload 178, backfill, clean gates |
| NFR-5 | Partial | L3 - sock/​foot pair weakest in grayscale |
| AC-1, AC-2, AC-4 - AC-10 | Met | |
| AC-3 | Partial | M3 - "home" vs "back to its slot" |
| AC-11 | Partial | L3 |

## Findings

| ID | Severity | Where | What | Fix |
| --- | --- | --- | --- | --- |
| M1 | Medium | `StoryOrderScene.ts:257-265` | `justDropped` cleared in `pointerdown`, set in `dragend`, read in `pointerup`; with Phaser 4's zero drag thresholds it is always true at `pointerup`, so a tap on a placed panel is a no-op and `returnPanelToSource` is dead | Set `justDropped` in `handleDrop`, clear it in `dragstart`; add tests that drive the real `drop` handler and a real tap sequence |
| M2 | Medium | `StoryOrderScene.ts:12-13` | Slots at `SLOT_Y 264` above the tray at `TRAY_Y 574`, spec says slots below | Amend FR-3 with a dated note (slots above, thumb-side tray) rather than re-lay the board |
| M3 | Medium | `StoryOrderScene.ts:296-311` | A missed drag on a placed panel springs back to its slot, not home | Amend AC-3 to distinguish tray panels (home) from placed panels (back to slot) |
| L1 | Low | `README.md:219` | "~197 kB shell entry" vs 195.4 kB elsewhere | 195.4 kB |
| L2 | Low | `product.md:55,125` | "eleven rule-narrators" (should be twelve); Game 22 block under the Game 21 heading | Retitle and fix the count |
| L3 | Low | `story_foot_sock.svg` | Sock differs from the bare foot mainly by fill | Add a silhouette cue (cuff beyond the heel) |
| L4 | Low | `phase-2.md:127-129` | Art rework attributed to squashed commits | Re-point at `d167eb2` |

## Plan compliance

All five phases carry `Result` / `Checkpoint` / `Evidence` and their evidence
files match the reviewer's own measurements. Two prose-level gaps: FR-3's
vertical order was never asserted by a test, and AC-3's "home" claim was encoded
as the implemented slot-spring instead. Both are being closed by amending the
spec rather than the build (the build's behaviour is the better UX), which the
Phase R1 notes must record explicitly.

## Out of scope (noted, not fixed)

- `docs/PRD.md` and `docs/TDD.md` still describe a 20-game suite.
- No real-device pass for drag feel; recorded as pending for the release.

## Debt

None beyond the above findings.

## Doc sync

Synced: product.md (22 mini-games, changelog, rule-narrator count, drop-outside wording), README.md (tests, table, replay variety, spoken rules, juice, bundle, shell figure), conductor/tech-stack.md (scenes, bases, tree, art-placement note).

## Round 2 (re-review)

The re-review confirmed all seven round-1 findings genuinely closed, and raised
five findings against the fix phase itself:

| ID | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| F1 | High | `pnpm check` was red at `e83f692` - the new test block was unformatted - while the evidence claimed exit 0 | Formatted, check re-run, phase-R1 row corrected to say it was red (Phase R2) |
| F2 | Medium | Phaser's zero drag threshold turned a wobbly tap into a drag that self-dropped, so tap-to-return stayed flaky on a real finger | `input.dragDistanceThreshold = 10` plus threshold and tap-tail tests |
| F3 | Low | FR-3 / AC-3 kept their old sentence and contradicted it in an amendment | Bodies rewritten to the shipped behaviour, dated notes kept as provenance, orientation asserted |
| F4 | Low | A ticked R1 task claimed a product-changelog edit that had not landed | Changelog now matches AC-3; R1.T1.1 retitled to `pointerdown` |
| F5 | Low | The tap case fired `pointerdown` before `dragstart` and mis-stated why the strip must be incomplete | Engine order and corrected rationale |

F2 is worth recording as a reminder: a flag that distinguishes tap from drag
cannot be written by the drag handler alone while the engine's threshold is zero,
because every tap *is* a drag at that setting.
## History

| Round | Verdict | Findings | Remaining |
| --- | --- | --- | --- |
| 1 | PASS WITH FINDINGS | 3 Medium, 4 Low | 7 |
| 2 | BLOCK (fix phase) -> PASS after Phase R2 | 1 High, 1 Medium, 3 Low, all against the fix commit | 0 |
