# Integrated verification - Repository Hygiene

Track: `20261024-repo-hygiene` (chore, low)
Branch: `chore/20261024-repo-hygiene`
Base: `97234c3c8322faac5c579f92293e940b2083b653` (`master`, after v1.21.3)
Verified at: `c05bcb92` (code and docs HEAD `243830da`)

## What changed, by area

| Area | Before | After |
| --- | --- | --- |
| Ignore rule | `docs/svg-contact-sheets/*.png` - matched only the twelve PNGs at the folder root, because gitignore's `*` does not cross `/` | Four patterns covering `**/*.png` and `**/*.html` plus `!...baseline/**` re-includes, with a comment that names both extensions and the baseline as the tracked record |
| Index | 232 tracked paths under `docs/svg-contact-sheets/` (110 PNG at 7.15 MB, 122 HTML) | 22 paths, all `baseline/**` (11 PNG + 11 HTML) |
| Working tree | `test-out.txt`, 21982 bytes at the root | absent; the rule at `.gitignore:10` that ignores a re-created copy is unchanged |
| `docs/roadmap.md` | Four Known Issues and five Future Work items, one of each about hygiene | Three Known Issues and four Future Work items; the survivors' wording untouched |
| `README.md` | "the full list - four of them" | "three of them", matching the three remaining headings |
| `docs/TDD.md` | Developer tooling described, `.opencode/` unexplained | §11.3 states why `.opencode/agents/` is versioned and that it carries no ignore rule |
| `docs/SVG_STYLE.md` | Re-render instruction with no statement about what is committed | §7 says output outside `baseline/` is git-ignored and `baseline/` is the tracked record |

No file was deleted from disk: 122 PNG and 122 HTML remain, 210 of them now
ignored and untracked. No source, test, script or configuration file changed.

## Gate

Run at `c05bcb92`, every layer green:

| Layer | Result |
| --- | --- |
| `pnpm check` | exit 0, the two pre-existing findings (biome `$schema` info, `musicalMemoryScene.test.ts` noNonNullAssertion) |
| `pnpm typecheck` | exit 0 |
| `pnpm test -- --run` | 121 files / 2631 tests |
| `pnpm test:coverage` | 97.97 / 91.94 / 96.69 / 98.74 |
| `pnpm build` | exit 0, precache 54 entries (1725.92 KiB) |
| `node scripts/validate-bundle.js` | phaser `phaser-P1E8uaLi.js` 1342.6 kB; shell `index-C99hcseA.js` 138.2 kB |
| `node scripts/validate-pwa.js` | 16 passed, 0 failed |
| `node scripts/validate-docs.js` | 5 passed, 0 failed |

The shell entry is byte-for-byte the artifact built before this track
(`index-C99hcseA.js`, 138.2 kB validated, 141547 bytes on disk), which is the
NFR-2 proof that moving 210 entries out of the index ships nothing different.
Coverage moved a tenth of a point between the phase run (`97.99 / 92`) and this
integrated run (`97.97 / 91.94`) with no test change in between - ordinary
run-to-run variance, well above the gate. Test count is unchanged at 2631, which
is right for a track that adds no behaviour.

## Cross-phase interaction

1. **The rule and the index only work as a pair.** The Phase 1 rule on its own
   would leave the 210 files tracked, and a generator run would then show as 111
   modified files; the index removal on its own, without the rule, would let the
   next generator run re-create them as untracked noise. Phase 1 proved the pair
   by running the generator after both halves landed and getting a status made
   only of the intended staged deletions.
2. **The stray file needed the old rule, not a new one.** `test-out.txt` was
   already ignored at `.gitignore:10`; Phase 2 deleted it and left the rule
   alone. Nothing in Phase 1's rule rewrite touched it.
3. **The documents describe the shipped state, not the intent.** The roadmap
   removal happened after the index work, so the file it described was already
   gone when the paragraph was deleted; `SVG_STYLE.md` now tells a reader to
   re-render and not expect a commit, which is true of the tree they will see.
4. **`.opencode/agents/` was deliberately left tracked** and documented instead
   of untracked, because `conductor-implement`'s preflight checks
   `conductor-phase.md` exists. The spec recorded that decision and the TDD now
   states it, so a future reader does not "clean it up".

## Acceptance criteria

| Id | Criterion | Evidence |
| --- | --- | --- |
| AC-1 | Exactly 22 tracked paths, all under `baseline/` | `git ls-files docs/svg-contact-sheets` |
| AC-2 | The conflict rule is honoured | `git check-ignore --no-index -v` on four paths, both directions |
| AC-3 | Regenerating is silent | generator run then `git status --porcelain` |
| AC-4 | The stray file is gone, the rule still named | `Test-Path` False, `.gitignore:10` unchanged |
| AC-5 | Docs no longer claim the debt and state the `.opencode/` decision | roadmap, README, TDD §11.3, `SVG_STYLE.md` §7 |
| AC-6 | Full gate passes | the table above |

## Documents synchronised

`docs/roadmap.md` (Known Issue and Future Work item retired), `README.md` (count),
`docs/TDD.md` (§11.3 note), `docs/SVG_STYLE.md` (§7 note). `conductor/product.md`
and the PRD are untouched: none of this is product behaviour.

## Residual risk

- **A pull will delete a maintainer's regenerated sheets.** Those 210 files are
  tracked in `master`'s history, so checking out this branch removes them from
  the working tree of an existing clone. That is the point - they are output -
  but a maintainer who had edited them by hand loses those edits. Recoverable
  from history; worth knowing before the first pull after merge.
- **Repository size does not shrink.** The 7.15 MB of PNGs stay in the object
  database; this track stops the growth and cleans the index, it does not rewrite
  history. A shallow clone is the tool for size, not this.
- **`baseline/` is still 11 PNG + 11 HTML** and remains tracked on purpose, so
  the folder is not empty in a fresh clone and Phase 1's ignore rule had to
  re-include it. Changing anything inside `baseline/` will still show as a
  modification - which is the intended signal.
