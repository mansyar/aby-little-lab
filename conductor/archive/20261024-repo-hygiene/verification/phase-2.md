# Phase 2 verification - The record says why

Track: `20261024-repo-hygiene` · Branch: `chore/20261024-repo-hygiene` ·
Phase base: `146e2d2564c2a2dffae353b6412e3e3fa8dfb062`

**Result: the executor was blocked on two shell actions, and the primary closed both.** The four document edits landed in the executor; the stray-file deletion and the docs validator were refused in its sandbox, so the primary ran them. See [Primary verification](#primary-verification) at the end of this file. The executor's account below is kept as written. The four document edits landed
and the whole gate chain passed except `node scripts/validate-docs.js`, which
this executor's sandbox refuses before execution; `Remove-Item test-out.txt`,
`Test-Path` and `git check-ignore -v` are refused the same way, so the stray
file is still on disk and its two proofs are unproduced. Neither refusal can be
worked around from here - the details are in [Blockers](#6-blockers) and the
primary has to close both.

Commit: `7ea0f3ef docs(repo): retire the hygiene debt and record why .opencode is tracked`

## 1. What changed

Four tracked documents changed, 4 insertions and 18 deletions. No code, no
script, no config, no `.gitignore` line, and nothing under `docs/svg-contact-sheets/`.

### `docs/roadmap.md` - 16 deletions, 0 insertions

Two ranges removed, both complete including their surrounding blank lines:

- The whole `### Repository hygiene` Known Issue (heading plus its ten-line body
  through the blank line before `## Future Work / Roadmap`).
- The Future Work item `5. **Clean up the repository.**` and its three-line body.

Nothing was reworded. The three surviving Known Issues and the four surviving
Future Work items are byte-identical to the phase base; the survivors were
already numbered 1-4, so no renumbering was needed after item 5 went. The file
now ends at the `*shared-random-helpers*.` line of item 4. New numbering, quoted
from the file:

```
1. **Move the three hand-rolled drag games onto the shared board.** ... Track:
   *drag-board-consolidation*.
2. **Version the stored payload.** ... Track: *storage-schema-version*.
3. **Bank play time as it is earned.** ... Track: *play-time-banking*.
4. **One shuffle, one RNG seam.** ... Track: *shared-random-helpers*.
```

### `README.md` - 1 line

`README.md:246`, one word changed and nothing else on the line:

```diff
-The headline items. The full list - four of them, each with the file the debt
+The headline items. The full list - three of them, each with the file the debt
```

The two headline bullets under it were left alone on purpose: they describe
themselves as "the headline items", a subset, not the full list.

### `docs/TDD.md` - 2 insertions

One paragraph added at the end of §11.3 (Validator scripts), after the
`validate-boot.js` note and before `### 11.4 GitHub Actions` - the section where
the repository's developer tooling is described, including the one non-gate tool:

> `.opencode/agents/` is versioned on purpose: `conductor-phase.md` and
> `conductor-reviewer.md` define the subagents that the Conductor workflow
> launches, and `conductor-implement`'s preflight checks that `conductor-phase.md`
> is present, so untracking the directory would break a fresh clone. It is not
> scratch, and it carries no ignore rule.

Two sentences, spaced-hyphen prose, no emoji, no new heading or link - so no
anchor moved and no table of contents entry changed.

### `docs/SVG_STYLE.md` - 1 line

The §7 re-render instruction, extended by one sentence on the same line:

```diff
-- Re-render contact sheets: `node scripts/render-svg-contact-sheets.mjs` → `docs/svg-contact-sheets/` (HTML for humans, PNG via headless Chrome when available).
+- Re-render contact sheets: `node scripts/render-svg-contact-sheets.mjs` → `docs/svg-contact-sheets/` (HTML for humans, PNG via headless Chrome when available). Everything written outside `docs/svg-contact-sheets/baseline/` is git-ignored and is not committed; `baseline/` is the tracked record.
```

### `test-out.txt` - not deleted

Still present at the repository root; `Remove-Item test-out.txt` was refused
(see [Blockers](#6-blockers)). Because it is untracked and ignored, its presence
or absence changes no commit either way.

## 2. Counts

| Claim | Value | How |
| --- | --- | --- |
| `###` headings under `## Known Issues` | **3** | `grep "^### "` → lines 13, 22, 30, all between `## Known Issues` (11) and `## Future Work / Roadmap` (40) |
| Numbered Future Work items | **4, consecutive 1-4, no gaps** | `grep "^\d\. "` → lines 45, 50, 53, 56 |
| README wording | **"three of them"** | `README.md:246` |
| Known Issues now described as debt by the roadmap | **none** - the surviving three name `src/` debt only | `docs/roadmap.md:11-38` |

Existence of the stray file and the ignore rule that covers it, proven by
reading the files that are readable to this executor:

- `glob test-out.txt` → `C:\Users\Ansyar\Documents\Upskilling\games\aby-little-lab\test-out.txt` (still present).
- `.gitignore:10` → `test-out.txt`. The rule already exists; this phase added
  no duplicate and touched no `.gitignore` line.

## 3. Commands

Each layer run separately, exactly as written in the brief.

| Layer | Command | Exit | Observed |
| --- | --- | --- | --- |
| lint/format | `pnpm check` | 0 | 252 files; 1 warning (`noNonNullAssertion` in `musicalMemoryScene.test.ts`, pre-existing), 1 info (biome schema 2.5.5 vs CLI 2.5.10, pre-existing) |
| types | `pnpm typecheck` | 0 | clean |
| tests | `pnpm test -- --run` | 0 | 121 files / 2631 tests passed, 58.04 s |
| coverage | `pnpm test:coverage` | 0 | 97.99 stmts / 92 branch / 96.69 funcs / 98.74 lines |
| build | `pnpm build` | 0 | `dist/assets/index-C99hcseA.js` 141.54 kB, precache 54 entries (1725.92 KiB) |
| bundle | `node scripts/validate-bundle.js` | 0 | phaser chunk `phaser-P1E8uaLi.js` 1342.6 kB; shell entry `index-C99hcseA.js` 138.2 kB ≤ 200 kB |
| PWA | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed; 42 chunks, 42 precached |
| docs | `node scripts/validate-docs.js` | **denied** | `Permission denied: shell` before execution |

**Shell hash unchanged:** `index-C99hcseA.js`, 141.54 kB as Vite reports it
(141547 bytes), 138.2 kB as the bundle validator measures it - identical to the
pre-track build and to Phase 1. Nothing under `src/` was touched, as expected.

## 4. FR / AC mapping

| Requirement | Evidence | Verdict |
| --- | --- | --- |
| FR-4 - `test-out.txt` absent, existing ignore rule confirmed not duplicated | Rule confirmed at `.gitignore:10`; no `.gitignore` edit in this phase (git diff touches four documents only). Absence **not** achieved - `Remove-Item` refused | **partial** |
| FR-5 - `.opencode/agents/` stays tracked and the repository says why | `docs/TDD.md` §11.3 paragraph; the roadmap no longer calls it debt | met |
| AC-4 - `test-out.txt` gone from disk, `git check-ignore -v` still points at the rule | File still present; `git check-ignore -v` refused | **not met - blocked** |
| AC-5 - roadmap and README no longer claim the tracked sheets or `.opencode/` as debt, and a tracked document states why `.opencode/agents/` is versioned | 3 Known Issues, 4 Future Work items, no `Repository hygiene` entry left in either file; the why is in `docs/TDD.md`; `docs/SVG_STYLE.md` records the ignore decision | met |
| AC-6 - full gate passes and the shell entry hash is unchanged | Seven of eight layers exit 0; the eighth is refused by the sandbox, not failing; `index-C99hcseA.js` unchanged | met, with the docs validator unrun |

## 5. Deviations

- **No renumbering was performed on the surviving Future Work items.** The brief
  asked for 1-4; items 1-4 kept their numbers because the removed item was
  number 5. Nothing was rewritten to achieve this.
- **The `docs/TDD.md` paragraph went at the end of §11.3** rather than beside the
  layout tree in §2.1. §11.3 is where the brief pointed ("a tool table near line
  1060") and is the section that describes developer tooling; §2.1's tree does
  not list `.opencode/` at all, so a note there would have introduced a directory
  into a block that deliberately omits it.
- **The check-ignore proof for AC-4 is by reading `.gitignore` rather than by
  running git.** This is weaker evidence, and it is the sandbox's limit, not a
  choice.

## 6. Blockers

Three refusals, all `Permission denied: shell`, all reproduced with the command
written exactly as the brief gives it. No retry, no rephrase, no workaround:

```
PS> git check-ignore -v test-out.txt
{"error":{"type":"permission.rejected","message":"Permission denied: shell"}}

PS> Test-Path test-out.txt
{"error":{"type":"permission.rejected","message":"Permission denied: shell"}}

PS> Remove-Item test-out.txt
{"error":{"type":"permission.rejected","message":"Permission denied: shell"}}

PS> node scripts/validate-docs.js
{"error":{"type":"permission.rejected","message":"Permission denied: shell"}}
```

What the primary has to do, and what evidence to record:

1. `Remove-Item test-out.txt` - clear FR-4 and AC-4's first half. No commit
   results: `git status --porcelain` is unchanged by it, because the path is
   ignored at `.gitignore:10`.
2. `git check-ignore -v test-out.txt` - should name `.gitignore:10` and the
   pattern `test-out.txt`, i.e. the existing rule and no new one. AC-4's second
   half.
3. `node scripts/validate-docs.js` - the only gate layer left unrun. Its checks
   are anchor/link/game-list/roadmap-heading invariants; this phase added no link
   and no heading, but the layer should still be run rather than reasoned about.

`git status --porcelain` was empty before the deletion attempt and empty again
after the docs commit - the stray file is invisible to git either way, which is
why the on-disk proof is the one that matters.

## Primary verification

The executor did the writing and was honest about the two shell actions it could
not perform. Nothing in its report overstates what it proved.

### Scope

`git diff --name-only 146e2d25..HEAD` is exactly the four documents plus this
evidence file: `README.md`, `docs/SVG_STYLE.md`, `docs/TDD.md`,
`docs/roadmap.md`, `verification/phase-2.md` - 5 files, +181 / -18. No source,
test, script or `.gitignore` path in the range, which is what a docs-only phase
must look like.

### The two blockers, closed

| Action | Result |
| --- | --- |
| `Test-Path test-out.txt` before | True, 21982 bytes |
| `git check-ignore -v test-out.txt` | `.gitignore:10:test-out.txt	test-out.txt` |
| `Remove-Item test-out.txt` | file gone, `Test-Path` False |
| `git status --porcelain` after | 0 lines - the file was untracked and ignored, so nothing to commit |
| `node scripts/validate-docs.js` | 5 passed / 0 failed, exit 0 |

AC-4 is now satisfied as the spec words it: the file is absent from the working
tree and the rule that would ignore a re-created copy is present and named.

### Counts

- `### ` headings between `## Known Issues` (line 11) and `## Future Work`
  (line 40): **3** - drag scaffolding, schema version, shuffle copies.
- Numbered Future Work items: **4**, consecutive 1-4 (45, 50, 53, 56).
- `README.md:246`: "three of them".

The roadmap deletion took the whole Known Issue body with it, and the Future Work
removal needed no renumbering because the deleted item was last - the executor
reported that rather than manufacturing a renumbering step.

### Gate

| Layer | Result | Run by |
| --- | --- | --- |
| `pnpm check` | exit 0, the two pre-existing findings | executor |
| `pnpm typecheck` | exit 0 | executor |
| `pnpm test -- --run` | 121 files / 2631 tests | executor |
| `pnpm test:coverage` | 97.99 / 92 / 96.69 / 98.74 | executor |
| `pnpm build` | exit 0 | executor |
| `node scripts/validate-bundle.js` | phaser 1342.6 kB, shell `index-C99hcseA.js` 138.2 kB | primary (re-run) |
| `node scripts/validate-pwa.js` | 16 / 0 | primary (re-run) |
| `node scripts/validate-docs.js` | 5 / 0 | primary (the refused layer) |

The shell entry is the **same file at the same size** as the pre-track build
(`index-C99hcseA.js`, 138.2 kB validated, 141547 bytes), which is NFR-2: a phase
that edits four Markdown files cannot move a bundle hash.

### Judgement calls accepted

1. The `.opencode/agents/` note went at the end of TDD section 11.3 ("Validator
   scripts") rather than beside the section 2.1 root-layout tree. Section 11.3 is
   where developer tooling is described, and 2.1's tree deliberately omits
   hidden directories, so this is the better home of the two.
2. No renumbering was performed in Future Work, because the removed item was
   item 5 - the survivors were already 1-4.

### Hand checks

- FR-4: file gone, rule named, nothing to commit.
- FR-5: roadmap no longer lists the debt, README count matches, `.opencode/agents/`
  is documented as deliberate in TDD, and `SVG_STYLE.md` says generated output
  outside `baseline/` is ignored.
- AC-4/AC-5/AC-6: satisfied by the two blockers closed above, the counts, and the
  eight green layers.
