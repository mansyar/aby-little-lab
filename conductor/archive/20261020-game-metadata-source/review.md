# Review — Game Metadata Single Source of Truth

**Track:** 20261020-game-metadata-source
**Branch:** refactor/20261020-game-metadata-source
**Base:** master @ 3201c9c
**Director:** conductor-review (round 1 + round 2, plus both fix phases)
**Verdict:** PASS WITH FINDINGS — every finding closed in-track; no Critical, High or Medium left open.

## Scope

`git diff 3201c9c..HEAD -- . ':!conductor'` — 16 files across five phases and two review-fix phases. Volume is "large" (>300 lines, >15 files), so the per-phase checkpoints (`a7bc1a2`, `c4be760`, `ddda77b`, `f29ad9d`, `0289476`, `abd47b0`, `29acd0c`) were reviewed alongside the combined diff. Requirements were checked against `spec.md` FR-1–FR-10, NFR-1–NFR-5 and AC-1–AC-8; plan compliance against each phase's `Touches`.

Checks run on the tree under review, all exit 0: `pnpm check` (232 files, one pre-existing `noNonNullAssertion` warning plus a biome schema info), `pnpm typecheck`, `pnpm test -- --run` (111 files / 2333 tests), `pnpm test:coverage` (97.7 statements / 90.6 branches / 96.4 functions / 98.6 lines against 90/85/88/95), `pnpm build` (41 chunks, precache 53 entries), `node scripts/validate-bundle.js` (entry 130.1 kB against the 200 kB gate), `node scripts/validate-pwa.js` (16 passed), `node scripts/validate-boot.js` (median cold boot 0.51 s against the 3.0 s budget).

## Requirements coverage

| ID | Verified by | Status |
| --- | --- | --- |
| FR-1 | `gameRegistry.ts` is the only declaration; purity test scans its import specifiers | met |
| FR-2 | `GAME_TILES` derives from the registry; `toStrictEqual` against the frozen pre-track array | met |
| FR-3 | `ProgressOverlay` rows derive from the registry; test asserts order, tile keys and one label per row | met |
| FR-4 | `hubPaging` defaults its tile count to the registry; 23-tile case yields `[20, 21, 22]` | met |
| FR-5 | `SHELL_ASSETS` derives 44 game rows in registry order, nine literal rows follow | met |
| FR-6 | `stickerKeyForGame` is the single sticker convention; no `replace`/template call sites remain | met |
| FR-7 | One suite proves registry ↔ scene loaders ↔ storage ids ↔ shell assets ↔ paging agree | met |
| FR-8 | `MissingGameIds` / `GAME_ID_COVERAGE` turn a missing id into a namechecked `TS2741` | met |
| FR-9 | Missing key, duplicate file stem and duplicate registry key all throw at module evaluation naming the key; all three are unit-tested | met |
| FR-10 | TDD §3.3 / §7.1, PRD §4.1 and README describe the registry and the narrow globs truthfully | met |
| NFR-1 | No dependency, lockfile or asset change in the diff | met |
| NFR-2 | Entry 130.1 kB, boot 0.51 s, precache 53 | met |
| NFR-3 | Registry imports only the `GameId` type | met |
| NFR-4 | Coverage above every configured gate | met |
| NFR-5 | Eager glob pulls no `game/art/` SVG; the eight glyphs stay in the lazy `glyphs-*.js` chunk | met |
| AC-1 | `sceneKey: "` appears only in `gameRegistry.ts` and in the test's frozen golden | met |
| AC-2 | Paging maths tested at 23 tiles without touching a constant | met |
| AC-3 | 44 shell game entries, keys identical, registry order | met |
| AC-4 | Removing a `tileKey`, adding a loader, and duplicating a table key each fail with the key named | met |
| AC-5 | 2333 tests against the pre-track 2305, with check and typecheck green | met |
| AC-6 | Full `verify_phase` green; bundle and boot inside their thresholds | met |
| AC-7 | Hub walkthrough captured at 390×844 (three pages) and 1024×768 (wide): 22 tiles, all icons, earned stickers on Shape Sorter / More or Less / Story Order | met |
| AC-8 | Docs updated; no remaining "hand-maintained list" claim | met |

## Round 1 findings (all closed)

| ID | Severity | Finding | Closed by |
| --- | --- | --- | --- |
| F1 | Medium | `ui/**/*.svg` inlined the eight lazy `game/art/glyphs.ts` SVGs into the shell entry, breaching NFR-5 verbatim | Phase R1: globs narrowed; entry 133.2 → 130.1 kB |
| F2 | Medium | A duplicate registry `tileKey` was caught only by a test assertion, not at module evaluation; both module-eval throws were uncovered | Phase R1 + R2: `buildShellAssets` rejects repeats and misses; three unit tests |
| L1 | Low | `hubPaging` comment still claimed the module was dependency-free after it imported the registry | Phase R1 |
| L2 | Low | TDD budget lines still reported 129.1 KiB | Phase R1: 130.1 KiB / 133.2 kB |
| L3 | Low | Em dashes replaced by hyphens; trailing newline lost | Phase R1 |
| L4 | Low | No shell→registry invariant, so an orphan tile SVG could ship silently | Phase R1: `GAME_SHELL_KEYS` set equality, both directions |
| L5 | Low | PRD overstated "one entry" for adding a game | Phase R1: names the scene-loader row and the type-checked id list |

## Round 2 findings (all closed)

| ID | Severity | Finding | Closed by |
| --- | --- | --- | --- |
| R2-F1 | Medium | TDD §3.3 still documented the pre-fix `ui/**` globs and nothing pinned the glob shape, so the fix could be reverted silently | Phase R2: §3.3 names the three narrow globs and why; source scan rejects `ui/**` and a `sleep_zzz` key |
| R2-F2 | Low | The duplicate-key throw had no committed test; R1.T2's wording claimed both throws were tested | Phase R2: `buildShellAssets` extracted and unit-tested for repeat and miss |
| R2-F3 | Low | Precache row pinned a byte-exact figure that no build produced | Phase R2: "about 1,703 KiB" |
| R2-F4 | Low | Three ASCII hyphens survived the round-1 dash pass | Phase R2 |

## Plan compliance

- Every file in the diff sits inside the union of phase `Touches`. No change to `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, `index.html`, an SVG asset, or a workflow file.
- Every `[x]` task is genuinely done; the two phases executed by the primary (P2, P3) ran the documented commands and produced conforming evidence, because the phase subagent could not be seated.
- Two deviations recorded in the evidence and accepted: the `tileCount: number` annotations (required — `as const` narrows the registry length to the literal `22`) and the `shellOwnership.test.ts` rewrite, which keeps its independent literal 53-key list.
- Review-fix phases are excluded from `metadata.progress` per the workflow, which is why 5/5 phases and 49/49 tasks are recorded with R1 and R2 verified but uncounted.

## Review rounds

Two rounds ran, which is the configured cap. Round 2 closed every round-1 finding and raised one Medium that the fix phases then closed; that closure is evidenced by `verification/phase-R2.md` and the gates above rather than by a third reviewer pass. No finding was deferred as debt, so no issues were created.

## Residual observations (not findings)

- `stickerKeyForGame` is a linear `find` over 22 entries, called up to 22 times per Hub render. Free at this scale; a `Map` would be premature.
- AC-7's Hub captures live under `.conductor/evidence/hub/`, which is gitignored by the workflow's own rule. The walkthrough is real but cannot be re-checked from the branch; if that ever needs to survive review it needs a textual assertion, not a screenshot.
- Pre-existing and deliberately untouched: the `noNonNullAssertion` warning at `src/__tests__/scenes/musicalMemoryScene.test.ts:294`, the `/favicon.ico` 404, and the load-sensitive `hubEngagement.test.ts` 5 s timeout observed once under full-suite load.

## Doc sync

`docs/TDD.md` (§2.1 tree, §3.3, §7.1, budgets), `docs/PRD.md` §4.1 and `README.md` were updated in Phase 5 and corrected in R1/R2. `conductor/product.md` needs no change: the track alters where game identity is declared, not what any game or cross-game system does. **Doc sync: synced.**
