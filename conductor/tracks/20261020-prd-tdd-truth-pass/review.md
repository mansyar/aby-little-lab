# Review — PRD & TDD Truth Pass

- **Track:** `20261020-prd-tdd-truth-pass`
- **Type:** chore
- **Branch:** `chore/20261020-prd-tdd-truth-pass`
- **Range:** `8cb5de4..3009347`
- **Date:** 2026-10-20
- **Verdict:** BLOCK (1 High, 3 Medium, 4 Low)

## Summary

The structural work is right and the footprint is clean: 12 files changed, all under
`docs/` and `conductor/`, all seven gates reproduced at HEAD, and every row of the
facts table reproduces from its stated command. The PRD's 22-game curriculum map and
the TDD's reconciled repository tree are accurate, and AC-8 holds — one Game 20
heading, both original bodies intact.

What the review found is the failure mode this track exists to prevent: four claims
that are specific, confident and wrong. The worst is a direct contradiction between
the two documents on the same mechanism — the PRD puts letters and numerals at the
160 px icon tier, `src/utils/textureTiers.ts:29-34` has no rule for them so they
resolve to the 256 px card tier, and the TDD says so correctly. One document now
contradicts the other, and neither reader knows which to believe.

## Requirement coverage

| ID | Status | Principal evidence |
| --- | --- | --- |
| FR-1, FR-2, FR-3 | covered | PRD §1–§9, §3.1–§3.22, §4.1–§4.10 |
| FR-4 | **partial** | F1, F3, F5 |
| FR-5 | **partial** | F2, F3 |
| FR-6, FR-7 | covered | TDD §2, §6 |
| FR-8 | **partial** | F4 |
| FR-9, FR-10 | covered | `product.md:142`; facts table |
| NFR-1, NFR-5, NFR-6 | covered | footprint, voice, gates |
| NFR-2 | **partial** | F2/F3/F4 cite no command |
| NFR-3 | **partial** | same three |
| NFR-4 | **partial** | F6 |
| AC-1 | covered, with F8 | no stale pattern in PRD/TDD; four live hits in another `docs/` file |
| AC-2 – AC-10 | covered | see reviewer table |

## Findings

### F1 — High — `docs/PRD.md:504`

The PRD states letters and numerals rasterise at the icon tier (160 px). `TIER_RULES`
in `src/utils/textureTiers.ts:29-34` matches only `tile_`, `sm_shadow_`, five small UI
glyphs and `mascot_`; everything else defaults to `card` (256 px), so `letter_*` and
`numeral_*` are 256 px. `docs/TDD.md:361` lists them under card and `:366` states the
opposite of the PRD outright. The PRD also conceals a real code/comment mismatch at
`textureTiers.ts:10-11`, which claims letters sit at the icon tier.

*Fix:* describe the tiers as they are — icon for Hub tiles, the eight shadow
silhouettes and the five UI glyphs — and note that letters and numerals settle on the
card tier because no rule matches them.

### F2 — Medium — `docs/TDD.md:879`

The TDD names `src/scenes/sceneRegistry.ts` as the least-covered file. It measures
100 % on all four metrics; the real lowest is `src/game/decodeLogic.ts` at 73.8 %
lines / 56.66 % branches (uncovered 63–77). A maintainer would improve a
fully-covered file and never see the gap.

### F3 — Medium — `docs/TDD.md:384`, `docs/PRD.md:512`

Both documents put the shared scene bases (and, in the PRD, the logic modules and
utils) inside the shell entry. The build emits `GameSceneBase` 7.98 kB,
`ChoiceRoundScene` 2.36 kB, `GroupMathScene` 2.02 kB, `dragJuice` 1.03 kB and several
logic modules as separate hoisted chunks — and `README.md:219` says so correctly, so
the rewritten docs now disagree with the README that was already right.

### F4 — Medium — `docs/TDD.md:805`

"`setBGMEnabled` and `setSFXEnabled` … call `restoreBGM()` on every call." Only
`setBGMEnabled` is unconditional (`AudioManager.ts:172-181`); `setSFXEnabled` calls it
inside `if (!enabled)` (`:188-194`). The sentence's own rationale describes the
disable path, so it reads as self-contradictory.

### F5 — Low — `docs/PRD.md:504`

"roughly 39 MiB" is not reproducible. Under the real rules the boot set is
35 icon + 141 card + 2 hero = 42,643,456 B ≈ 40.7 MiB.

### F6 — Low — `docs/PRD.md:383`, `:490`

The PRD duplicates two mechanisms the TDD owns: the `[1, 1, 2, 2, 3, 3]` ladder with
its 1–3 clamp (TDD §7.3) and the duck constants (TDD §8.3). NFR-4 asks for one
description per subsystem; the TDD links back, the PRD does not.

### F7 — Low — `docs/PRD.md:522`

"Every other drawing is shared by two or more games" is false: the eight `sm_shadow_*`
silhouettes are used only by Shadow Match, the four `face_*` only by Feelings Faces,
the 22 `tile_*` only by the Hub, each sticker by one game.

### F8 — Low — `docs/device-testing-checklist.md:260,455,538,539`

Four live "twenty game(s)" lines survive in `docs/`. The spec's goal metric is zero
hits in `docs/`, this file is not in the spec's out-of-scope set, and it is the
checklist a human follows — a tester would verify 20 of 22 Back buttons.

## Plan compliance

Every `[x]` has work behind it and all three checkpoints exist. The one real gap is
P3.T3.1 ("claim-by-claim audit"): four claims were not traceable and the audit did not
catch them — F1–F4.

## Out of scope

`src/main.ts:30`'s "7 game scenes" comment (code, docs-only track); coverage's
second-decimal variance; no automated drift guard; historical counts in
`docs/release-notes-*` and dated changelog blockquotes.

## Debt

None. F1–F8 are all correctable in this track.

## Doc sync

Pending — fixed by Phase R1, then re-verified.

## History

| Round | Verdict | Findings | Open after round |
| --- | --- | --- | --- |
| 1 | BLOCK | 1 High, 3 Medium, 4 Low | 8 |
