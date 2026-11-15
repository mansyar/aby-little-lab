<!-- PR body for track 20261115-hub-game-groups. Base: master @ 703b12ad. -->

# Hub Game Groups

A pre-reader can now pick a learning domain from six chips in the Hub's top band
and see only that domain's games, at a larger tile size — so any of the 22 games
is at most two taps away, and the board never has to be scanned as a flat list of
22.

## Why

`GAME_REGISTRY` already declared every game once, and `product.md` §3.1 already
sorted them by milestone, but the Hub threw that structure away: 22 tiles in
registry order, packed at 144×116 on wide screens and split into three
10-tile pages on phones. Grouping is a layout concern on settled foundations, not
a registry rewrite.

## What changed

**Data** — every `GAME_REGISTRY` entry carries a typed `group`
(`letters | numbers | thinking | play | stories`); `src/game/hubGroups.ts` owns
the chip table (id, one-word label, spoken name, glyph key), `HUB_SELECTIONS` and
`visibleTileIndexes(selection)`. Membership is 5/5/6/4/2, proved two ways: an
explicit table in `hubGroups.test.ts` and a two-way coverage assertion in
`gameRegistry.test.ts`.

**Chips** — six 96×84 chips at y=66 in the top band (centres 247/353/459/565/671/
777 at 1024 wide), each a plate, a glyph, a 14px word and a hit `Zone`. The row is
built once per visit and repainted with fills and strokes only; a tap rebuilds the
tiles, never the chips (NFR-4). The tap goes through a zone rather than the
plate, so a chip is never mistaken for a launchable tile by the Hub's suites or
the e2e bridge.

**The filtered board** — a chip tap redraws the board as that group's games at
176×196 with 20px spacing, `n` columns for `n ≤ 3` and three otherwise, every row
centred, page dots hidden while filtered. `All` restores the pre-track board
byte-for-byte on both layouts (golden position tables), and the selection resets
to All on every visit and is never stored.

**Speech** — a chip tap announces the group through the existing
`speakSentence(name, getSettings().sfxEnabled)` path, All included as "All games".
The name is spoken on every tap, including a re-tap of the selected chip, because
that is when a pre-reader may want to hear it again.

**Art** — five flat `group_*` SVG glyphs (letter card, numeral card, star beside
a rounded square, note over a face-down card, smiling face) ship as explicit
`SHELL_ASSETS` rows at the icon tier; the All chip's 2×2 grid is drawn, so the
five-group count is honest. Shell inventory: 58 keys / 191 app keys, with the four
guard suites restated rather than loosened.

**Bridge** — `?e2e=1` publishes `{ selected, chips: [{ id, x, y }] }` from the
live row, and `hubTiles()` keeps reporting a game's registry index (not its slot)
on a filtered board.

**Proof** — `e2e/journeys/hub-groups.spec.ts` taps every chip, asserts each drawn
board equals that group's registry indexes, launches and plays Add It Up from the
Numbers board, and returns to find the Hub on All with 22 tiles.

**Docs** — README, PRD, TDD (new §4.9), `conductor/product.md` (changelog + §6) and
`conductor/product-guidelines.md` describe the groups, the two-tap rule and the
58-key shell.

## Decisions

D1 five learning-domain groups, chip order All, Letters, Numbers, Thinking, Play,
Stories, registry order inside each group · D2 six 96×84 chips in the top band ·
D3 176×196 filtered tiles, n≤3 columns, rows centred, dots hidden, All geometry
untouched · D4 selection is per-visit and never stored · D5 `group` on the
registry, `HubGroupId` type-only, words in `hubGroups.ts` · D6 speech through the
`onSelectGroup` dep · D7 five flat glyphs as explicit shell rows with a
`/^group_/ → icon` tier rule · D8 chips built once, repainted alpha/stroke only ·
D9 bridge shape and registry-index tile ids.

Two implementation deviations from the task prose, both logged in
`.conductor/runs/20261115-hub-game-groups/freebuff/decisions.md` and accepted in
review: chip taps use a `Zone` over a non-interactive plate with no press tween
(the plate-plus-`pointerup` shape is how five suites and the bridge recognise a
nav tile; NFR-4 forbids a new tween), and the drawn All glyph is four rectangles
rather than a `Graphics` object (a glyph `Graphics` would join the slot and
play-time suites' drawing-surface predicates).

## Verification

Full gate, run per phase and re-run for the review fix (latest at `9bce0dec`):

| Layer | Command | Result |
| --- | --- | --- |
| browser | `pnpm test:e2e` | 22 journeys pass, the new `hub-groups` one included |
| static | `pnpm check` | 323 files, no findings |
| static | `pnpm typecheck` | clean, app + e2e projects |
| unit | `pnpm test -- --run` | 147 files / 3,204 tests |
| coverage | `pnpm test:coverage` | 97.42 / 92.11 / 96.46 / 98.36 against 90/85/88/95 |
| build | `pnpm build` + `validate-bundle.js` | shell entry 179.4 kB ≤ 200 kB (pre-track 176.9) |
| build | `validate-pwa.js` | 16/16; precache 59 entries / 1,776.92 KiB (+2.0 kB of new art) |
| documents | `validate-docs.js` | 5/5 |

Review: `conductor/tracks/20261115-hub-game-groups/review.md` — round 1
`PASS WITH FINDINGS` (the selected chip went silent on a re-tap; dead
`refreshChips()`), both fixed in Phase 6, round 2 **PASS** with no open findings.
Per-phase evidence is in `verification/phase-1.md` … `phase-6.md`.

## Risk and rollback

The All view is unchanged, and every pre-track hub, navigation and browser
assertion still passes without edits, so a revert is contained to the chip row
and the filtered build path. The shell grew 2.5 kB against a 21 kB headroom, and
the five glyphs are 2.0 kB of the 5 kB art budget. No storage key, schema field,
dependency or network request was added, so no data migration is involved.

## Out of scope

Game scenes and logic, adaptive difficulty, narration, registry order, sticker or
progress or play-time storage, a persisted selection, search or favourites, and a
new animation language for the chip row.
