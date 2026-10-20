# Phase 3 evidence — Cross-document consistency

- **Track:** `20261020-prd-tdd-truth-pass`
- **Branch:** `chore/20261020-prd-tdd-truth-pass`
- **Phase base:** `1ee9605`
- **Date:** 2026-10-20
- **Status:** **blocked** — `conductor/product.md` and `conductor/tech-stack.md` cannot be
  edited by this agent. See [Blocker](#blocker-the-two-conductor-documents-are-read-only-to-this-agent).
  The facts table and the full cross-document audit below are complete; the corrections are
  specified exactly and unapplied.

---

## Blocker: the two `conductor/` documents are read-only to this agent

Every edit attempt failed with `permission.rejected` *before* any text matching:

| File | Tool | Result |
| --- | --- | --- |
| `conductor/product.md` (duplicate heading) | edit | `Permission denied: edit` |
| `conductor/product.md` (heading `3.1`) | edit | `Permission denied: edit` |
| `conductor/tech-stack.md` (enumeration) | edit | `Permission denied: edit` |
| `conductor/tracks/20261020-prd-tdd-truth-pass/verification/phase-3.md` | edit | allowed |
| `.conductor/evidence/…` | write | allowed |

The cause is the agent's own permission policy, `.opencode/agents/conductor-phase.md`
lines 9–29: `edit` is denied for `conductor/**` and `**/conductor/**`, then re-allowed only
for `**/conductor/tracks/*/verification/**` and `.conductor/evidence/**`. `docs/PRD.md`,
`docs/TDD.md` and `README.md` are outside `conductor/` and remain editable (none of them
needed a correction, see the audit), but the only two documents that *do* need one are both
under `conductor/`.

A whole-file `write` is not a workaround: several `product.md` changelog lines exceed the
reader's 2,000-character line limit, so the file cannot be reconstructed faithfully, and a
full rewrite is exactly the failure mode this phase was warned about (LF→CRLF conversion,
whole-file diff).

**What the primary agent needs to do:** apply the seven `product.md` corrections in
[Corrections](#corrections) verbatim (they are single-line, one-for-one replacements), then
re-run `rg -c '^## Changelog — Game 20' conductor/product.md` → expect `1`. With that done,
FR-9 / AC-8 and the product.md half of FR-10 / AC-9 are met; the `tech-stack.md` note is
optional polish, not a numeric disagreement.

---

## Facts table

One row per number, with the one document that owns it. Values were re-derived on
2026-10-20 by the command in the last column; nothing was copied from an earlier phase.

| Fact | Value | Owning document | Command that produced it |
| --- | --- | --- | --- |
| Games / `GameId`s | 22 | `conductor/product.md` §3.1 (the game table) | `grep -nE '^  "[a-z-]+",$' src/types/index.ts` → 22 matches (lines 97–118) |
| `ChoiceRoundScene` extenders | 14 = 12 direct + Add It Up & Take Away via `GroupMathScene` | `docs/TDD.md` §4.5 | `grep -nE '^export (abstract )?class \w+ extends' src/scenes` → 12 × `extends ChoiceRoundScene`, 2 × `extends GroupMathScene<…>` |
| Adaptive / fixed games | 15 adaptive, 7 fixed (Shape Sorter, Animal Trace, Pop & Freeze, Shadow Match, Big vs. Small, Feelings Faces, Story Order) | `docs/TDD.md` §4.5 | `grep -n getAdaptiveBandShift src/scenes` → 14 files (`GroupMathScene` serves 2 games) |
| SVG corpus | 202 `.svg` across 11 folders; 5 `.gitkeep` alongside | `docs/TDD.md` §3.3 | `git ls-files src/assets/svg` → 202 `.svg` (animals 9, feelings 4, items 23, letters 26, numbers 10, shadows 8, shapes 36, stickers 22, stories 24, toys 7, ui 33) |
| Boot preload entries | 178 (`SHAPE_ASSETS`, `PreloadScene.ts` lines 191–368) | `docs/TDD.md` §3.3 / §3.6 | `grep -nE '^  \{ key: "' src/scenes/PreloadScene.ts` → 178 matches |
| Boot = corpus − stories | 178 = 202 − 24 | `docs/TDD.md` §3.5 | same two commands above |
| Shell entry | 195.4 kB against the 200 kB gate (200,089 B; Vite prints `200.12 kB` decimal — same file) | `README.md` §Build output | `node scripts/validate-bundle.js` after `pnpm build` |
| Phaser vendor chunk | 1342.6 kB (1,374,822 B; Vite prints `1,374.82 kB`) | `docs/TDD.md` §3.6 | `node scripts/validate-bundle.js` |
| Story Order chunk | 33.92 kB (carries the 24 panel SVGs) | `README.md` §Build output | `pnpm build` chunk table |
| Test files | 103 | `docs/TDD.md` §11 | `pnpm test -- --run` → `Test Files 103 passed (103)` |
| Tests | 2,208 | `docs/TDD.md` §11 | `pnpm test -- --run` → `Tests 2208 passed (2208)` |
| Coverage thresholds | statements 90, branches 85, functions 88, lines 95 | `vite.config.ts`, restated by `README.md` / `docs/TDD.md` / `conductor/tech-stack.md` | `grep -n -A4 'thresholds' vite.config.ts` (lines 75–80) |
| Measured coverage (2026-10-20 run) | statements 98.13, branches 90.54, functions 98.14, lines 98.96 | `docs/TDD.md` §11 | `pnpm test:coverage` |
| Precache entries | 45 (1,695.14 KiB) | `docs/TDD.md` §3.6 / `README.md` | `pnpm build` → `precache 45 entries (1695.14 KiB)`; `node scripts/validate-pwa.js` |

Coverage moves in the second decimal between runs (98.13/90.54/98.14/98.96 here and in phase 2;
98.11/90.46/98.14/98.96 in phase 1). The measured value recorded above is this run's; the
documents state the same figure, so no correction was needed and none was made.

---

## Audit: does every document agree with the table?

Read: `conductor/product.md`, `docs/PRD.md`, `docs/TDD.md`, `README.md`,
`conductor/tech-stack.md`.

| Document | Games 22 | 14 choice | 15 / 7 | 202 | 178 | 195.4 | 103 / 2,208 | thresholds | precache 45 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `conductor/product.md` | **no** (says 20, heading says Twenty-One) | **no** (says thirteen) | **no** (names 12 adaptive) | — | — | — | — | — | — |
| `docs/PRD.md` | yes (§3) | yes (§5.1) | yes (§4.8) | — | yes (§6) | yes (§6) | — | — | — |
| `docs/TDD.md` | yes (§3.1, §4.5) | yes (§4.5) | yes (§4.5) | yes (§3.3) | yes (§3.3, §3.6) | yes (§3.6) | yes (§11) | yes (§11) | yes (§3.6) |
| `README.md` | yes | yes | yes | — | — | yes | yes | yes | yes |
| `conductor/tech-stack.md` | yes | yes (see note) | — | — | — | yes | — | yes | — |

`—` means the document does not state that number, so there is nothing to disagree with.

### Spot-read of absolute claims in the rewritten PRD and TDD

| Claim | Where | Verdict |
| --- | --- | --- |
| "`registerShutdownCleanup()` … called at the end of `create()` by every game scene" | TDD §4.5 | **true** — 21 call sites: 20 concrete scenes + `GroupMathScene`, which Add It Up and Take Away both inherit (22 games covered) |
| "`src/assets/svg/stories/` is the only folder that is not part of the boot set" | TDD §3.3 | **true** — 202 − 24 stories = 178 = the boot table |
| "202 `.svg` files, 512×512 `viewBox`" | TDD §3.3 | **true** for the boot set and the story panels, which is every file: `preloadScene.test.ts` asserts the 512 `viewBox` on all 178 entries, `storyOrderArt.test.ts` on the 24 panels, `feelingsFacesSvg.test.ts` on the four faces |
| "Twelve scenes extend `ChoiceRoundScene` directly, two reach it through `GroupMathScene`, and eight extend `GameSceneBase` directly" | TDD §4.5 | **true** — 12 + 2 + 8 = 22, matches the class declarations |
| "The other seven are fixed: Shape Sorter, Animal Trace, Pop & Freeze, Shadow Match, Big vs. Small, Feelings Faces and Story Order" | PRD §4.8 | **true** — the complement of the 14 files that call `getAdaptiveBandShift` |
| "They live in 14 scene files because Add It Up and Take Away share the group-math scene" | PRD §4.8 | **true** — 15 games, 14 files |
| "The 22 game scenes now sit on two shared abstract bases" | tech-stack 2026-10-20 note | **true** — 12 + 2 on `ChoiceRoundScene`/`GroupMathScene`, 8 on `GameSceneBase`: three bases, two of them new in that note |

No absolute claim in the two rewritten documents overreaches the code.

---

## Product.md repair (P3.T1.1) — specified, **not applied**

`conductor/product.md` carries the heading twice:

```
line 142: ## Changelog — Game 20 (2026-08-28)
line 146: ## Changelog — Game 20 (2026-08-28)
```

Each heading owns exactly one `>` blockquote body (lines 144 and 148), both dated
2026-08-28 and both about Number Order. The second is a longer rewrite of the same entry —
it adds the band-ladder detail (`[1,1,1,1,2,2]` / `[2,2,3,3,3,3]`), the `buildRound`
sampling description and the "Twelfth adaptive game" tail.

**Repair:** delete line 146 and its following blank line, leaving both bodies as two
blockquote paragraphs under the heading at line 142. Both are the same date, so the fold
preserves date order.

Exact edit (old → new):

```
 `GAME_IDS` per-key backfill for old saves.
 
-## Changelog — Game 20 (2026-08-28)
-
 > **2026-08-28 — Game 20 — Number Order:** Numeral-sequencing / ordinality game added. Each round shows an aligned pair of rows
```

**Proof no body is lost** (measured before the repair, so the applier can re-run it after):

| Body | Distinctive text | Occurrences |
| --- | --- | --- |
| first (line 144) | `each card into a slot (drag lift/tilt juice` | 1 |
| second (line 148) | `an aligned pair of rows` | 1 |

After the repair both counts stay at 1 and
`rg -c '^## Changelog — Game 20' conductor/product.md` returns `1` (AC-8). At this commit it
returns `2`, so AC-8 is **not met**.

---

## Corrections

One row per disagreement found by the audit. Every one is in `conductor/product.md`; the
authority column names the document or command that the sentence must be brought into line
with (the sentence changes, never the cited value).

| # | Document | Old text (exact) | New text (exact) | Authority |
| --- | --- | --- | --- | --- |
| C1 | `conductor/product.md` line 11 | `The app packages **20 distinct mini-games**` | `The app packages **22 distinct mini-games**` | facts table row 1: 22 `GameId`s; §3.1 already lists 22 |
| C2 | `conductor/product.md` line 23 | `### 3.1 Twenty-One Mini-Games` | `### 3.1 Twenty-Two Mini-Games` | the table under it has 22 rows |
| C3 | `conductor/product.md` line 60 | `in the five early-numeracy games (How Many?, More or Less, Add It Up, Take Away, Number Order) and the seven literacy & memory games — Find the Word, Build the Word, First Sounds, Find the Letter, Memory Match, Musical Memory, Decode It — difficulty may now shift ±1 band per playthrough via Adaptive Difficulty above; all other games remain fixed-difficulty.` | `in the five early-numeracy games (How Many?, More or Less, Add It Up, Take Away, Number Order), the seven literacy & memory games — Find the Word, Build the Word, First Sounds, Find the Letter, Memory Match, Musical Memory, Decode It — and Color Match, Odd One Out and Pattern Builder, difficulty may now shift ±1 band per playthrough via Adaptive Difficulty above; the other seven games (Shape Sorter, Animal Trace, Pop & Freeze, Shadow Match, Big vs. Small, Feelings Faces, Story Order) remain fixed-difficulty.` | facts table row 3: 15 adaptive / 7 fixed; PRD §4.8 names the same fifteen |
| C4 | `conductor/product.md` line 84 | `**PreloadScene:** Preloads SVG assets (rasterized at 512×512), displays progress bar.` | `**PreloadScene:** Preloads SVG assets (rasterized at three tiers — icon 160px, card 256px, hero 512px), displays progress bar.` | `src/utils/textureTiers.ts`; PRD §6 and TDD §3.4 both describe the three tiers |
| C5 | `conductor/product.md` line 85 | `**HubScene:** 21 game tiles grid (6×4 at 144px — rows 6/6/6/3)` | `**HubScene:** 22 game tiles grid (6×4 at 144px — rows 6/6/6/4)` | `src/game/hubGrid.ts` lines 10–21 (`22 tiles render as 6x4 (rows 6/6/6/4)`); PRD §3 says 22 tiles, 6 by 4 |
| C6 | `conductor/product.md` line 136 | `All thirteen choice games extend them` | `All fourteen choice games extend them` | facts table row 2: 12 direct + 2 via `GroupMathScene` |
| C7 | `conductor/product.md` lines 146–147 | the duplicate `## Changelog — Game 20 (2026-08-28)` heading and its blank line | (deleted) | FR-9 / AC-8; see the repair section above |

**Applied: none.** C1–C7 are all in `conductor/product.md`, which this agent may not edit
(see Blocker). C3 is a trimming edit as much as an addition: it replaces the vague "all other
games" with the seven named fixed games, which is what the PRD and TDD already say.

### Audited and deliberately left alone

| Sentence | Where | Why it stays |
| --- | --- | --- |
| `Fourteen choice games use them: Alphabet … Feelings Faces directly, plus Add It Up and Take Away through GroupMathScene` followed by `Story Order joined later` | `conductor/tech-stack.md` 2026-10-20 note | The total is right (14) and Story Order's membership is stated in the next sentence, but the colon's list is 11 + 2 = 13 on its own. It is a reading stutter, not a false number, and the file is outside this agent's write scope. Worth one word from the primary if touching the file anyway: add `Story Order` to the list, or drop the "joined later" sentence. |
| `20-tile hub`, `170 preloaded SVGs`, `5×4 grid`, `168 → 170` preload steps | `conductor/product.md` lines 132–148, `conductor/tech-stack.md` design notes | Dated changelog entries. They were true on their date and the changelog's job is to record what changed, not to restate today's counts. |
| `v1.19.0 — shared choice-round shell for 13 games` | `README.md` release-notes table | Release record: 13 was the count at that release. |
| `docs/release-notes-v1.*.md`, `docs/device-testing-checklist.md`, `docs/release-checklist.md` (`twenty games`, `twenty stickers`) | `docs/` | Out of the five-document scope: historical release notes and manual QA checklists, not living specifications. |
| `195.4 kB` vs Vite's `200.12 kB` for the same shell chunk | `README.md`, `docs/TDD.md` §3.6, PRD §6 | Not a disagreement. The validator divides bytes by 1024, Vite by 1000; TDD §3.6 already says so for the Phaser chunk. Recorded here so a later pass does not "fix" 195.4 to 200.12. |

---

## Acceptance criteria

| AC | Verdict | Proving command |
| --- | --- | --- |
| **AC-8** — exactly one `## Changelog — Game 20` section in `conductor/product.md` | **FAIL (blocked)** | ripgrep count of `^## Changelog — Game 20` in `conductor/product.md` (run through the Grep tool, `rg -c` semantics) → `2`. Repair specified in C7; the applier re-runs this and expects `1`. |
| **AC-9** — facts table exists and every stated number equals it | **PARTIAL (blocked)** | The table is above. `docs/PRD.md`, `docs/TDD.md`, `README.md` and `conductor/tech-stack.md` match it row for row; `conductor/product.md` disagrees on four rows (C1–C6). |
| **AC-10** — the whole track touches only `docs/` and `conductor/`, no merges, and the full chain passes at the final commit | **PASS for everything this phase could reach** | `git diff --stat 1ee9605..HEAD`, `git log --merges 1ee9605..HEAD` (empty), and the chain below. |

---

## Commands

Chain, run as written at `2cf8f40` (no source edit in this phase; docs only):

```
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js
```

| Stage | Result |
| --- | --- |
| `pnpm check` | exit 0 — 206 files, 1 warning (`noNonNullAssertion`, `musicalMemoryScene.test.ts:294`), 1 info (biome schema 2.5.5 vs CLI 2.5.10) |
| `pnpm typecheck` | exit 0 |
| `pnpm test -- --run` | exit 0 — 103 files, 2,208 tests passed |
| `pnpm test:coverage` | exit 0 — 98.13 / 90.54 / 98.14 / 98.96 (stmts / branch / funcs / lines) |
| `pnpm build` | exit 0 — `precache 45 entries (1695.14 KiB)` |
| `node scripts/validate-bundle.js` | exit 0 — Phaser chunk 1342.6 kB, shell 195.4 kB ≤ 200 kB |
| `node scripts/validate-pwa.js` | exit 0 — 15 passed, 0 failed |

Footprint: `git diff --stat 1ee9605..HEAD` — one file changed =
`conductor/tracks/20261020-prd-tdd-truth-pass/verification/phase-3.md` (215 insertions), and
nothing else. `git log --merges 1ee9605..HEAD` is empty. Nothing outside `docs/` and
`conductor/` was touched across the whole track, and nothing under `src/`, `scripts/`,
`public/` or `package.json` changed.

---

## Deviations

None. Nothing outside the brief's `Touches` was modified, and no source file, script,
`package.json` or score corpus was touched.

## Primary completion of C1–C7 and primary verification

The executor could not edit `conductor/product.md` (its permission policy denies
`edit` under `conductor/**` except `tracks/*/verification/**`), so it specified the
seven corrections and stopped. The primary applied them, one targeted edit each, at
`1ee9605`:

| # | Applied to `conductor/product.md` | Verified by |
| --- | --- | --- |
| C1 | `The app packages **22 distinct mini-games**` | `rg -n "22 distinct mini-games"` → 1 |
| C2 | `### 3.1 Twenty-Two Mini-Games` | `rg -n "3\.1 Twenty"` → 1 |
| C3 | adaptive parenthetical now names the nine + Color Match, Odd One Out and Pattern Builder, and names the seven fixed games | facts table row 3; PRD §4.8 |
| C4 | `rasterized at three tiers — icon 160px, card 256px, hero 512px` | `src/utils/textureTiers.ts` |
| C5 | `**HubScene:** 22 game tiles grid (6×4 at 144px — rows 6/6/6/4)` | `src/game/hubGrid.ts` |
| C6 | `All fourteen choice games extend them` | facts table row 2 |
| C7 | the second `## Changelog — Game 20 (2026-08-28)` heading and its blank line deleted; both bodies kept | heading count 2 → 1; `each card into a slot (drag lift/tilt juice` → 1; `an aligned pair of rows` → 1 |

`conductor/product.md` diff: **6 insertions, 8 deletions**, zero CRLF lines (LF
preserved — checked with a `\r\n` count of 0, because a whole-file rewrite of that
file has silently converted it to CRLF before).

### Acceptance criteria after completion

| AC | Was | Now | Proving command |
| --- | --- | --- | --- |
| AC-8 (one Game 20 heading) | FAIL (2) | **PASS** (1) | `[regex]::Matches(product.md, '^## Changelog … Game 20 \(2026-08-28\)')` → 1 |
| AC-9 (every document agrees with the facts table) | PARTIAL (C1–C7 open) | **PASS** | C1–C7 applied; PRD/TDD/README already agreed |
| AC-10 (footprint) | PASS | **PASS** | `git diff --stat <base_sha>..HEAD` touches `docs/` and `conductor/` only |

`conductor/tech-stack.md` was audited and left unchanged: it notes the same
cosmetic enumeration the executor flagged (states fourteen, lists eleven direct
plus two via `GroupMathScene`, then names Story Order in the next sentence), which
is accurate prose rather than a false number.

### Gate chain at the final commit

`pnpm check` exit 0 (206 files, the one pre-existing `musicalMemoryScene.test.ts:294`
warning plus the biome schema info); `pnpm typecheck` exit 0; 103 files / 2,208 tests
pass; coverage **98.11 / 90.46 / 98.14 / 98.96** this run (the same tree measured
98.13 / 90.54 an hour earlier — the second decimal moves between runs, thresholds
clear by several points either way); build `index-Dhenc0xK.js` 200.12 kB with
`StoryOrderScene` 33.92 kB; `validate-bundle` PASS (shell 195.4 kB of 200 kB);
`validate-pwa` 15/15.

### Carry-over for a future pass

`src/main.ts:30` still says "Shell scenes only — the 7 game scenes are lazy-loaded":
the count should be 22. Out of scope for a docs-only track (NFR-1) and recorded here
so it is not lost.