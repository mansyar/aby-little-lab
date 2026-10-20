# Integrated verification — PRD & TDD Truth Pass

- **Track:** `20261020-prd-tdd-truth-pass` (chore)
- **Branch:** `chore/20261020-prd-tdd-truth-pass`
- **Base:** `master` @ `8cb5de4`
- **Head:** `faeb6c4`
- **Date:** 2026-10-20

## What the track changed

| Area | Before | After |
| --- | --- | --- |
| `docs/PRD.md` | 82.6 kB, "all twenty games", game specs 1–20 only, no Feelings Faces or Story Order, no cross-game systems past a sparse list | 9 sections restructured around the shipped product: product definition, curriculum map (9 domains, 22 games in Hub order), 22 five-field game specs, cross-game systems, interaction/touch/motion, audio, performance and asset budget, release readiness |
| `docs/TDD.md` | 57 kB, 8 stale "twenty" references, tree missing `feelings/`, `stories/`, `components/settings/`, `svgDataUri.ts`; no shared bases, no narrator, no audio focus, no play-time/progress/profile/voice logic | 12 sections: toolchain, repository layout reconciled against `git ls-files`, boot and the asset budget (178 boot entries of 202), scene architecture (bases, registry, narrators), components, state and storage v2, game logic modules, audio (duck/watchdog/visibility), motion, testing, build/PWA/CI |
| `conductor/product.md` | 20 mini-games, "Twenty-One Mini-Games" heading, adaptive parenthetical naming only 12 games, 512px raster, 21 tiles 6/6/6/3, "thirteen choice games", duplicate `## Changelog — Game 20` | 22, twenty-two, all 15 adaptive named plus the seven fixed by name, three texture tiers, 22 tiles 6/6/6/4, fourteen choice games, one Game 20 heading |
| `README.md`, `conductor/tech-stack.md` | — | audited, already accurate; no change needed (tech-stack's enumeration nit recorded as prose, not a false number) |

11 files changed, 2,386 insertions, 1,056 deletions — `docs/PRD.md`, `docs/TDD.md`, `conductor/product.md`, and the track's own registry/spec/plan/metadata/verification files.

## Gates at the final commit (`faeb6c4`)

| Command | Result |
| --- | --- |
| `pnpm check` | exit 0 — 206 files, 1 pre-existing warning (`musicalMemoryScene.test.ts:294` noNonNullAssertion) + biome schema info |
| `pnpm typecheck` | exit 0 |
| `pnpm test -- --run` | 103 files / 2,208 tests pass (28.1 s) |
| `pnpm test:coverage` | 98.13 statements / 90.54 branches / 98.14 functions / 98.96 lines |
| `pnpm build` | `index-Dhenc0xK.js` 200.12 kB, 45 precache entries (1,695 KiB) |
| `node scripts/validate-bundle.js` | PASS — shell 195.4 kB of 200 kB, Phaser vendor chunk present |
| `node scripts/validate-pwa.js` | 15 passed / 0 failed |

## Acceptance criteria

| ID | Verdict | Evidence |
| --- | --- | --- |
| AC-1 | **met** | `rg -n "twenty games\|all twenty\|20 game scenes" docs/PRD.md docs/TDD.md` returns nothing; both documents state 22 |
| AC-2 | **met** | Game 21 and Game 22 sections exist in the PRD; Feelings Faces and Story Order appear in both documents |
| AC-3 | **met** | PRD §4.8 names the 15 adaptive and the 7 fixed games; matches `rg -l getAdaptiveBandShift src/scenes` → 14 files / 15 games via `GroupMathScene` |
| AC-4 | **met** | Tree reconciled two-way against `git ls-files src`: 295 production files (202 SVG + 93 code), every one of the 98 documented file names resolves in git |
| AC-5 | **met** | Per-folder counts 202 total: animals 9, feelings 4, items 23, letters 26, numbers 10, shadows 8, shapes 36, stickers 22, stories 24, toys 7, ui 33 |
| AC-6 | **met** | TDD §6 names the v2 fields and states the unguarded write at `storage.ts:81-85` with its failure modes |
| AC-7 | **met** | TDD §8 documents duck to `BGM_VOLUME * 0.08`, 120 ms ramp, 15 s watchdog, `visibilitychange`, and that the ducked level is never persisted |
| AC-8 | **met** | Game 20 heading count 2 → 1; both changelog bodies retained |
| AC-9 | **met** | Facts table in `verification/phase-3.md`; PRD, TDD, README and tech-stack agree row for row after C1–C7 |
| AC-10 | **met** | `git diff --name-only 8cb5de4..HEAD` touches only `docs/` and `conductor/`; no merges; full chain green |

## Non-functional requirements

| ID | Verdict | Note |
| --- | --- | --- |
| NFR-1 | **met** | No `src/`, `scripts/`, `public/` or `package.json` change |
| NFR-2 | **met** | Every number in the facts table carries the command that produced it |
| NFR-3 | **met** | Unverifiable claims omitted rather than guessed; the one number that moved (coverage) is recorded with its two observed values |
| NFR-4 | **met** | PRD product-facing, TDD mechanism-facing; where they overlap the TDD states the mechanism only |
| NFR-5 | **met** | Restructured, not changelogged; `product.md` keeps its dated blockquote changelog by design |
| NFR-6 | **met** | Chain green at the final commit |

## Known carry-overs

1. `src/main.ts:30` still comments "the 7 game scenes are lazy-loaded" — should be 22. Out of scope for a docs-only track; recorded in `phase-3.md`.
2. Coverage's second decimal moves between identical runs (98.11/90.46 and 98.13/90.54 both observed on the same tree). Thresholds clear by several points either way, but a future drift guard should not assert an exact coverage figure.
3. No automated drift guard was added (explicitly out of scope). The facts table is the manual artefact; nothing stops these documents going stale again.
4. `docs/release-notes-*.md` and the dated changelog entries in `product.md` / `tech-stack.md` retain their historical counts (170 SVGs, 20-tile hub) on purpose — they are records, not current-state claims.
