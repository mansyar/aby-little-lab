**PR:** [#47](https://github.com/mansyar/aby-little-lab/pull/47) — eat/20261020-story-sequencing → master — Quality Gates passing.

## Summary

Game 22, **Story Order** — a drag-to-slot sequencing game — plus the
architectural change it needed: panel art that lives in the game's own lazy
chunk instead of the boot shell.

- 6 rounds of 3 shuffled story panels dragged into 3 pip-marked slots, from an
  8-story pool (4 obvious, 4 subtle), easy-first, no repeats.
- Whole-strip validation through the shared `ChoiceRoundScene` base: correct →
  splash + chime + cheer + dot pop + 700 ms advance; incorrect → soft tone,
  nod, and a wiggle that leaves every panel where the child put it so they can
  move one and retry.
- 24 story panels, one tile and one sticker as new art; boot preload 176 → 178.
- The 24 panels are imported only by `src/game/storyOrderArt.ts` and rasterized
  in the scene's own `preload()`, so the boot shell stayed at 195.4 kB of the
  200 kB gate while the game chunk carries 33.92 kB of art.

## Verification

- 103 test files / 2,208 tests green; coverage 98.13 / 90.54 / 98.14 / 98.96.
- Full chain: `pnpm check`, `pnpm typecheck`, tests, coverage, build,
  `validate-bundle`, `validate-pwa` — all pass.
- Zero panel keys in the built shell; all 24 present in the Story Order chunk.
- Hub 22 tiles (6/6/6/4 wide, 10+10+2 paged), 22 progress rows.
- Two review rounds: 7 findings closed in R1, 5 in R2 (including a formatter
  error and Phaser's zero drag threshold that made tap-to-return flaky).

## Notes for review

- The spec was amended rather than the build re-laid out for two findings
  (slots above the tray; a placed panel springs back to its slot on a miss),
  because the shipped interaction is the better one. Both amendments are dated.
- No real-device drag-feel pass; recorded as pending for the release.
- `docs/PRD.md` and `docs/TDD.md` still describe a 20-game suite (pre-existing,
  out of scope).
