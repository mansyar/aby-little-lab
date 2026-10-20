# PR — PRD & TDD Truth Pass (`20261020-prd-tdd-truth-pass`)

## What this changes

The two design documents described a different app. `docs/PRD.md` (82.6 kB) still said
"all twenty games" and specified games 1–20 only — no Feelings Faces, no Story Order,
no shared scene bases, no narrator, no audio focus. `docs/TDD.md` (57 kB) carried eight
stale "twenty" references, a file tree missing `feelings/`, `stories/`,
`components/settings/` and `svgDataUri.ts`, and no description of anything added since
August.

Both are now restructured around the shipped product:

- **PRD** — 9 sections: product definition, a curriculum map (9 domains, 22 games in
  Hub order), 22 five-field game specs, cross-game systems, interaction/touch/motion,
  audio, performance and asset budget, release readiness.
- **TDD** — 12 sections: toolchain, a repository layout reconciled two-way against
  `git ls-files`, boot and the asset budget (178 boot entries of 202 corpus SVGs),
  scene architecture (the three bases, the registry, the narrators), components, state
  and storage v2, game logic modules, audio, motion, testing, build/PWA/CI.
- **`conductor/product.md`** — six stale numbers corrected and the duplicate
  `## Changelog — Game 20` heading removed (both bodies kept).
- **`docs/device-testing-checklist.md`** — the "twenty game(s)" counts and the wide
  Hub grid description corrected to today's 22 / 6×4.

Documentation only. No `src/`, `scripts/`, `public/` or `package.json` change.

## Why it matters

Two review rounds. The first returned **BLOCK** with four claims that were specific,
confident and false — the worst being the PRD putting letters and numerals at the
160 px texture tier while `src/utils/textureTiers.ts` resolves them to 256 and the TDD
said so correctly. A docs track that ships a wrong number has failed at its only job,
so the fix phase re-derived every figure from source, build output or a coverage run
before rewriting the sentence.

The second round passed all eight fixes and found five defects the fix itself had
introduced — including a device checklist left self-contradictory between lines 251
and 272. Phase R2 closed those.

## Verification

| Gate | Result |
| --- | --- |
| `pnpm check` | exit 0 — 206 files, one pre-existing warning |
| `pnpm typecheck` | exit 0 |
| `pnpm test -- --run` | 103 files / 2,208 tests |
| `pnpm test:coverage` | 98.13 / 90.54 / 98.14 / 98.96 |
| `pnpm build` | `index-Dhenc0xK.js` 200.12 kB, 45 precache entries |
| `validate-bundle` | PASS — shell 195.4 kB of 200 kB |
| `validate-pwa` | 15 / 15 |

Footprint: `8cb5de4..HEAD` touches `docs/` and `conductor/` only, no merge commits.

## Review

- Round 1: BLOCK — 1 High, 3 Medium, 4 Low.
- Round 2: PASS WITH FINDINGS — all 8 closed, 5 new (introduced by the fix), closed in R2.
- Final verdict: **PASS**. 5 phases, 53 tasks.

## Follow-up debt (recorded, not fixed)

- `src/utils/textureTiers.ts:8-12` still comments that letters and numerals sit at the
  icon tier — the origin of round 1's High finding. Code, not prose.
- `src/main.ts:30` says "the 7 game scenes are lazy-loaded"; it is 22.
- `docs/device-testing-checklist.md` still has a "twenty 56px stickers" line and a
  "2 pages of 10 tiles" line against `hubPaging`'s `PAGE_COUNT = 3`.
