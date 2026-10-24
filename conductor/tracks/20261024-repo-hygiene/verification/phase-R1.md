# Phase R1 verification - Review fixes

Track: `20261024-repo-hygiene` (chore, low) · Branch: `chore/20261024-repo-hygiene` ·
Phase base: `71b962e8f12c7c9b23a14c2fa1fe03839c0d7bc4`

**Result: the three findings are closed and the gate is green, with the docs layer run by the primary.** The executor landed all three edits and seven gate layers; its sandbox refused `node scripts/validate-docs.js`, which the primary ran green (5/5). See [Primary verification](#primary-verification). The executor's account below is kept as written, and its original opening sentence follows this note.
0, and `node scripts/validate-docs.js` is refused by this executor's sandbox before
execution - the same refusal Phase 2 hit.** That is a sandbox limit, not a failing
check, and the primary has to run it (see [Blockers](#6-blockers)).

Commits:

- `db698d51 docs(gitignore): name both extensions in the contact-sheet comment`
- `54f8b4f3 docs(tdd): list .opencode/agents in the root tree`
- `d9c4e996 docs(svg-style): mark the historical contact-sheet folders as corpus snapshots`

## 1. What changed

Three tracked documents, one line each: 3 insertions, 2 deletions. No code, script,
config, lockfile, index or Conductor state file; nothing under
`docs/svg-contact-sheets/` was untracked, deleted or regenerated.

### `.gitignore:16` - 1 insertion, 1 deletion

```diff
-# Generated contact sheets are scratch; the tracked record is the baseline set.
+# Generated contact-sheet PNGs and HTML are scratch; the tracked record is the baseline set.
```

The comment now names both extensions. Lines 17-21 are byte-identical to the phase
base, in the same order (`# The patterns must be depth-independent...`, `**/*.png`,
`**/*.html`, `!...baseline/**/*.png`, `!...baseline/**/*.html`); nothing else in
the file moved.

### `docs/TDD.md` §2.1 - 1 insertion

One line in the fenced root tree, after `.github/workflows/ci.yml` (157) and before
`docs/` (159):

```diff
 ├── .github/workflows/ci.yml
+├── .opencode/agents/             # Conductor subagents - versioned on purpose, see §11.3
 ├── docs/
```

The `#` column is identical to the neighbouring commented entries - verified by
matching `^├── .opencode/agents/ {13}#` and `^├── vite\.config\.ts {16}#` against
the same line, both of which hit. Box-drawing prefix (`├──`), spacing and prose
style (spaced hyphen, no emoji, no new link or heading) match the block. The §11.3
paragraph at line 1065 is untouched: it is the expansion this line points at, and
`grep .opencode docs/TDD.md` now finds two lines (158 and 1065) instead of one.

### `docs/SVG_STYLE.md:111` §7 - 1 insertion, 1 deletion

The existing re-render bullet's sentence was extended on the same line; no second
bullet, no new list item:

```diff
-- Re-render contact sheets: `node scripts/render-svg-contact-sheets.mjs` → `docs/svg-contact-sheets/` (HTML for humans, PNG via headless Chrome when available). Everything written outside `docs/svg-contact-sheets/baseline/` is git-ignored and is not committed; `baseline/` is the tracked record.
+- Re-render contact sheets: `node scripts/render-svg-contact-sheets.mjs` → `docs/svg-contact-sheets/` (HTML for humans, PNG via headless Chrome when available). Everything written outside `docs/svg-contact-sheets/baseline/` is git-ignored and is not committed; `baseline/` is the tracked record. The historical per-phase folders — `final/`, `phase2`, `phase3`, `phase3-pilot`, `phase4` through `phase8` — are point-in-time snapshots of earlier corpora that only git history preserves, not scratch to be deleted: the current script renders today's corpus (`final/` holds 11 category sheets and no `stories`, where the script now writes 12 root sheets including `stories`) and would not recreate them.
```

The parenthetical is not decoration: `docs/svg-contact-sheets/final/` holds 11
`.html`/`.png` pairs with no `stories`, while the folder root holds 12 PNGs
including `stories.png`. So the claim "the current script ... would not recreate
them" is checkable from the tree, not asserted.

## 2. Findings to fix

| Finding | Fix | Closed |
| --- | --- | --- |
| **F1** Low - `.gitignore:16` named neither extension while `plan.md` P1.T1.1 and `verification/integrated.md` claimed it did | Comment rewritten to "Generated contact-sheet PNGs and HTML are scratch..." so the claim is now true | yes |
| **F2** Low - the `.opencode/` note lived only in §11.3 (line 1065), while a reader about to "clean up" the directory consults the §2.1 root tree, which omitted it | `.opencode/agents/` added to the §2.1 tree with a pointer to §11.3, which still carries the full reason | yes |
| **F3** Low - §7 read as "everything outside `baseline/` is throwaway" | Same sentence extended: `baseline/` is the tracked record, the nine historical folders are earlier-corpus snapshots preserved only by git history, all nine named, and stated plainly that today's script would not recreate them | yes |

## 3. Commands

Each layer run separately, exactly as written in the brief.

| Layer | Command | Exit | Observed |
| --- | --- | --- | --- |
| lint/format | `pnpm check` | 0 | 252 files checked; 1 warning (`noNonNullAssertion` in `src/__tests__/scenes/musicalMemoryScene.test.ts:294`, pre-existing) and 1 info (biome schema 2.5.5 vs CLI 2.5.10, pre-existing) |
| types | `pnpm typecheck` | 0 | clean |
| tests | `pnpm test -- --run` | 0 | 121 files / 2631 tests passed, 61.9 s |
| coverage | `pnpm test:coverage` | 0 | statements 97.97 / branches 91.94 / functions 96.69 / lines 98.74 |
| build | `pnpm build` | 0 | 343 modules; `dist/assets/index-C99hcseA.js` 141.54 kB; precache 54 entries (1725.92 KiB) |
| bundle | `node scripts/validate-bundle.js` | 0 | `phaser-P1E8uaLi.js` 1342.6 kB; shell entry `index-C99hcseA.js` = 138.2 kB ≤ 200 kB |
| PWA | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed; 42 chunks, 42 precached |
| docs | `node scripts/validate-docs.js` | **denied** | `{"error":{"type":"permission.rejected","message":"Permission denied: shell"}}` - refused before execution, not retried |

Every number matches the brief's expectation: 121/2631 tests, 97.97/91.94/96.69/98.74
coverage, `index-C99hcseA.js` at 138.2 kB as the bundle validator measures it,
PWA 16/16, 42 chunks precached. The docs layer's expected 5/5 was not observed
because the command never ran.

**Nothing under `src/`, `scripts/`, `vite.config.ts` or the lockfile changed**, so
the shell hash and PWA chunk set are identical to Phase 1 and Phase 2:
`index-C99hcseA.js`, `phaser-P1E8uaLi.js`, 42 emitted chunks.

## 4. Requirement mapping

| Requirement | Evidence | Verdict |
| --- | --- | --- |
| FR-2 - `.gitignore` matches PNGs and HTML at any depth, keeps `baseline/` tracked, and its comment describes that rule accurately | Patterns on lines 18-21 untouched (the phase-2 rule); the comment now names PNGs and HTML, so the accuracy clause holds | met |
| FR-5 - `.opencode/agents/` stays tracked and the repository says why, so the next reader does not "fix" it | Directory untouched and still tracked; the why now sits in the §2.1 tree (where a cleaner looks) and in §11.3 (the expansion) | met |
| NFR-4 - no information a reader needs is lost; baseline sheets and every live document stay tracked | `docs/svg-contact-sheets/baseline/` untouched, no sheet untracked, deleted or regenerated; the SVG_STYLE change is additive prose; all three edits are documentation | met |
| AC-5 - roadmap and README no longer claim the tracked sheets or `.opencode/` as debt, and a tracked document states why `.opencode/agents/` is versioned | Phase 2 removed the debt claims (3 Known Issues, 4 Future Work items); this phase puts the "why" in front of a tree reader as well as in §11.3 | met |

## 5. Deviations

- None. Only `.gitignore`, `docs/TDD.md` and `docs/SVG_STYLE.md` were written -
  the `Touches` set - plus this evidence file.
- The SVG_STYLE addition is a second sentence inside the existing bullet, not a
  second bullet. The brief said "extend the existing sentence (do not add a second
  bullet)"; the bullet count is unchanged.

## 6. Blockers

One refusal. `node scripts/validate-docs.js` is refused by the sandbox before
execution, written exactly as the brief gives it. No retry, no rephrase, no
workaround:

```
PS> node scripts/validate-docs.js
{"error":{"type":"permission.rejected","message":"Permission denied: shell"}}
```

Phase 2's executor hit the identical refusal on the identical command, so this is a
standing sandbox rule for this script, not a transient glitch. It is the only
unproven layer; the primary needs to run it (expected 5/5) to record AC-6.

An earlier, non-gate inspection command was refused the same way and was replaced
by reading the files directly:

```
PS> git diff --stat && git diff -U2 -- .gitignore docs/TDD.md docs/SVG_STYLE.md
{"error":{"type":"permission.rejected","message":"Permission denied: shell"}}
```

The diffs above were read from the files with the read/grep tools instead; no
verification layer depends on that command.

## 7. Notes

- The working tree held nothing but the three documents at the phase base, so each
  finding got its own commit and each commit is a one-file diff.
- No retry was needed on any gate layer; every layer that ran passed first time.

## Primary verification

### Scope

`git diff --name-only 71b962e8..HEAD` is exactly the three Touches paths plus this
evidence file: `.gitignore`, `docs/TDD.md`, `docs/SVG_STYLE.md`,
`verification/phase-R1.md`. Nothing else moved, so the phase's blast radius is
three documents and one comment.

### The three findings, checked against the diff

| Id | Fix as landed | Verdict |
| --- | --- | --- |
| F1 | `.gitignore:16` is now `# Generated contact-sheet PNGs and HTML are scratch; the tracked record is the baseline set.` - both extensions named; lines 18-21 unchanged and in order | closed |
| F2 | `docs/TDD.md:158` adds `├── .opencode/agents/             # Conductor subagents - versioned on purpose, see §11.3` between `ci.yml` and `docs/`, aligned with the neighbouring comment column; the §11.3 paragraph is untouched | closed |
| F3 | `docs/SVG_STYLE.md:111` keeps one bullet and adds a second sentence naming `final/`, `phase2`, `phase3`, `phase3-pilot`, `phase4`-`phase8` as earlier-corpus snapshots that only git history preserves, with the `stories` example | closed |

F1's claim and the comment now agree, so `verification/integrated.md`'s statement
that the comment names both extensions is true rather than aspirational - no
edit to the integrated file is needed. F3's example is verifiable:
`docs/svg-contact-sheets/final/` holds 11 category sheets and no `stories`, while
the generator writes 12 root sheets today.

### Gate

| Layer | Result | Run by |
| --- | --- | --- |
| `pnpm check` | exit 0 | executor |
| `pnpm typecheck` | exit 0 | executor |
| `pnpm test -- --run` | 121 files / 2631 tests | executor |
| `pnpm test:coverage` | 97.97 / 91.94 / 96.69 / 98.74 | executor |
| `pnpm build` | exit 0 | executor |
| `node scripts/validate-bundle.js` | shell `index-C99hcseA.js` 138.2 kB | executor |
| `node scripts/validate-pwa.js` | 16 / 0 | executor |
| `node scripts/validate-docs.js` | 5 / 0 | **primary** - the refused layer |

Three documents and one comment cannot move a test count or a bundle hash, and
neither did: 2631 tests and `index-C99hcseA.js` are the same values the integrated
run recorded.

### Hand checks

- The `.gitignore` patterns were not re-probed after the comment change - a
  comment has no effect on matching, and the phase brief forbade touching lines
  18-21, which the diff confirms.
- The TDD tree line uses the same `├──` glyph and comment column as its
  neighbours, so the block still renders as one tree.
- `SVG_STYLE.md` gained no new bullet: the sentence is appended inside the
  existing re-render bullet, which keeps the section's shape.
