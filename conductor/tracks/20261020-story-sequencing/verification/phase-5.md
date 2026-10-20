# Phase 5 evidence - Documentation sync

- Track: `20261020-story-sequencing` ("Story Order - Game 22 (Story Sequencing)")
- Branch: `feat/20261020-story-sequencing`
- Phase base: `4a5ff9d`
- Date: 2026-10-20
- Executed by: the primary agent (docs-only phase - no production code touched)

## What changed

Three documentation files, no source or test file:

- `conductor/product.md` - header count, §3.1 game table row 22, the Mascot,
  Voice Selection, Spoken Rules and Parent Progress Insights bullets, and a new
  `> **2026-10-20 — Game 22 — Story Order:**` changelog blockquote above the
  Game 21 entry.
- `README.md` - intro count, mini-games table row 22, replay-variety clause,
  spoken-rules list (now twelve rule narrators), per-game juice bullet, tile-icon
  count, back-button/sticker/celebration/mascot counts, project tree (22 lazy
  scenes on the shared bases, 14 choice games), and the bundle section (shell +
  Phaser vendor split, Story Order's 33 kB chunk, art-in-chunk note, 45 precache
  entries).
- `conductor/tech-stack.md` - scene count 24 → 25 (22 game scenes), the shell
  design-update blockquote now says twenty-two scenes and fourteen choice games
  with Story Order described, a new dated blockquote for Story Order and the
  in-chunk art pattern, and tree entries for `StoryOrderScene.ts`,
  `storyOrderLogic.ts`, `storyOrderArt.ts`, `utils/svgDataUri.ts` and
  `assets/svg/stories/`.

## Commands

| Command | Result |
| --- | --- |
| `pnpm check` | exit 0 - 204 files, 1 pre-existing warning (`musicalMemoryScene.test.ts:294`), 1 schema info note |
| `pnpm typecheck` | exit 0, no output |
| `pnpm test -- --run` | 103 files / 2,205 tests passed |
| `pnpm test:coverage` | 98.11 statements / 90.54 branches / 98.04 functions / 98.94 lines |
| `pnpm build` | 271 modules; `StoryOrderScene-D5FX6gb5.js` 33.36 kB; shell `index-cmeS8uaq.js` 200.12 kB raw; precache 45 entries / 1,694.59 KiB |
| `node scripts/validate-bundle.js` | PASS - shell 195.4 kB ≤ 200 kB, Phaser vendor chunk present |
| `node scripts/validate-pwa.js` | 15 passed / 0 failed |

## Acceptance criteria

| ID | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| AC-10 | Documentation names the game, its pool, its hub position and the art placement rule | Met | `product.md` row 22 + changelog blockquote; `README.md` table row 22, replay-variety clause, spoken-rule entry, juice bullet, bundle section; `tech-stack.md` scene/tree entries and dated blockquote |
| NFR-8 | `pnpm check` and `pnpm typecheck` clean, no `any` introduced | Met | both exit 0; no source file changed in this phase |

Stale figures deliberately corrected while documenting: the README still claimed
2,149 tests / 100 files (now 2,205 / 103), 21 tiles and stickers (now 22), 42
precache entries (now 45), and a "single entry chunk ~1.44 MB" build shape that
predates the Phaser vendor chunk split.

## Task commit map

| Task | Commit |
| --- | --- |
| P5.T1 (product doc) | recorded on the phase squash commit |
| P5.T2 (README + tech stack) | recorded on the phase squash commit |

## Deviations

Documentation-only, so the plan's Touches list was sufficient. One judgement
call: `product.md` line 3 said "18 mini-games" and the body had drifted across
several counts; all were brought to 22 rather than only the table row, because a
half-updated doc is worse than the small extra diff. The two pre-existing
duplicated `## Changelog — Game 20` sections were left untouched - the spec
lists unrelated doc drift as out of scope.

## Notes for the primary agent

- The shell has 4.6 kB of headroom against the 200 kB gate; the next game with
  boot-bundled art would need the same in-chunk treatment Story Order now uses.
- `scripts/validate-bundle.js` reports the measured shell (195.4 kB), while the
  raw `index-*.js` is 200.12 kB - the gate's number is the one that matters and
  it is what the docs quote.
- Docs still carrying 20/21-game language: `docs/PRD.md` and `docs/TDD.md`
  (out of scope, recorded in the review out-of-scope list).

## Primary verification

This phase was executed by the primary agent rather than a phase subagent (it
touches documentation only, and the same agent already held the measured numbers
from the four code phases), so verification here is a re-read of the diff plus a
re-run of the full chain after the last edit.

Scope: `git diff --stat 4a5ff9d` on the three docs is the whole change set -
`conductor/product.md`, `README.md`, `conductor/tech-stack.md` - with no
source or test file touched. Every figure quoted was taken from the phase-3 and
phase-4 build output (33.36 kB chunk, 195.4 kB measured shell, 2,205 tests, 45
precache entries, 45 = 42 + tile + sticker + the split `svgDataUri` chunk) and
cross-checked against the last chain run in this phase.

Chain re-run after the final README correction: check 0, typecheck 0, 103 files /
2,205 tests, coverage 98.11 / 90.54 / 98.04 / 98.94, build with
`StoryOrderScene-D5FX6gb5.js` 33.36 kB, `validate-bundle` PASS at 195.4 kB,
`validate-pwa` 15/15.

AC-10 met by inspection: the game appears in the product table, the changelog,
the README mini-games table, the replay-variety paragraph, the spoken-rule list,
the per-game juice section and the bundle section, and the tech stack names the
scene, the logic module, the art module and the new SVG folder.
