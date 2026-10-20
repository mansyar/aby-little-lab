# Integrated Verification — Docs & Dead-Code Truth Pass

- **Track:** `20261020-docs-truth-pass`
- **Branch:** `chore/20261020-docs-truth-pass`
- **Base:** `8d16d4f` (merge of the shell-diet track, `origin/master`)
- **Head at verification:** `8333b41`
- **Date:** 2026-10-20
- **Result:** verified — all six phases verified, all twelve acceptance criteria met

## 1. Gate at HEAD

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Static | `pnpm check` | 0 | Biome clean; one pre-existing `noNonNullAssertion` warning in `musicalMemoryScene.test.ts` |
| Static | `pnpm typecheck` | 0 | `tsc --noEmit`, tests included |
| Unit | `CI=true pnpm test -- --run` | 0 | 110 files, 2,305 tests |
| Unit | `pnpm test:coverage` | 0 | statements 97.78 · branches 90.66 · functions 96.34 · lines 98.59 |
| Build artifact | `pnpm build` | 0 | entry `index-*.js` 132.21 kB (129.1 KiB shell), Phaser chunk 1,374.82 kB, 41 chunks |
| Build artifact | `node scripts/validate-bundle.js` | 0 | one vendor chunk, shell under the 200 kB gate |
| Build artifact | `node scripts/validate-pwa.js` | 0 | 16/16 checks, 53 precache entries / 1,702.03 KiB, every emitted chunk precached |

Raw output: `.conductor/evidence/phase-6-{check,typecheck,tests,coverage,build,bundle,pwa}.txt`.

Branch coverage moves between runs with no code change (90.73 in Phase 4, 90.66 in Phase 6), so docs quote it as approximate and name CI as the authority.

## 2. Acceptance criteria

| AC | Verdict | Proof |
| --- | --- | --- |
| AC-1 — no empty headings; measured counts with a verified date; CI named as authority | met | `EMPTY_HEADINGS=0` over 20 headings; README:49 carries 2,305 tests across 110 files, "verified 2026-10-20", and names `vite.config.ts` + CI. Phase 1 evidence. |
| AC-2 — at most 240 after Phase 2 and 215 at track end, every trimmed section linked | met | 286 → 237 (Phase 2) → 214 (Phase 3), measured over 214 lines. Nine summaries and the roster each end in links. 53 cross-doc anchors, 0 broken. |
| AC-3 — relocation list names every moved fact and `rg` finds each in the owning doc | met | `verification/phase-2.md` carries the relocation table (3 sections); spot-checks for `Rectangle(0, 0, 96, 96)`, the 0.2× mascot scale and the per-game feedback lines all resolve in the PRD or TDD. |
| AC-4 — TDD counts match the same run; lowest-file claim re-measured or absent | met | TDD §10.2/§10.3 now 110 files / 2,305 tests (verified 2026-10-20) and 97.8 / 90.73 / 96.34 / 98.59; the `decodeLogic.ts` 73.8 % claim was re-measured as still exact and kept. |
| AC-5 — adaptive text matches the constants and no dated line changed | met | `product.md` names the 10-tap window, 6-tap minimum, 0.9 / 0.6, the steady middle, the clamp and the toggle; `git diff -U0` shows 0 changed `^[+-]> **` lines and 14 dated entries intact. |
| AC-6 — `rg "7 game scenes"` empty over `src` and README, audit phrase list zero | met | 0 hits; `main.ts` now says all 22 scenes are lazy-loaded, and `HubScene` said "12 game tiles" and was corrected too. |
| AC-7 — six orphan JSDoc phrases absent; check and typecheck green | met | 0 occurrences in `SettingsPanel.ts`; behaviours documented at `InstallRow.ts:79` and `ResetModal.ts:41,54`; both gates 0. |
| AC-8 — no JSON-import warning from check, typecheck, test or build | met | `with { type: "json" }` at `vite.config.ts:4`; 0 matches for `JSON import`/`configLoader` across all four captured logs. |
| AC-9 — Ligne track archived, metadata complete, registry resolves, no dependency | met | `conductor/tracks/` holds only the live track; archive metadata `complete` + `archived_at` + `archive_path`; ledger points at the archive path; 0 `@ligne-engine` hits; 0 `.ligne`/`.wasm` in `dist`. |
| AC-10 — no `.gitkeep` beside tracked files | met | 15 markers → 1: `src/assets/audio/.gitkeep`, whose directory holds no other tracked file. |
| AC-11 — each phase evidence records commands, exit codes and output | met | `verification/phase-1.md` … `phase-6.md`, each with a commands table and exit codes. |
| AC-12 — no roster line repeats PRD replay-variety detail | met | 22 roster lines, each `- [Game](docs/PRD.md#…) — domain`; the only replay-variety text left in the README is the frozen v1.20.0 release row. |

## 3. Functional requirements

| FR | Landed in | Note |
| --- | --- | --- |
| FR-1 | Phase 1 | Counts, verified date, CI as authority, empty `## Parental Controls` heading folded into `## Parental Lock & Touch UX` |
| FR-2 | Phases 2-3 | Nine systems sections + roster + juice are summaries or pointers |
| FR-3 | Phases 2-3 | Relocation happens before removal; the PRD's per-game field bullets went 110 → 132 as the juice moved in (22 games × 6 fields) |
| FR-4 | Phase 1 | TDD §3.6, §10.2, §10.3 |
| FR-5 | Phase 4 | Adaptive sentence + paged hub layout; twelve other current-state claims re-verified and left alone |
| FR-6 | Phase 5 | `main.ts`, `HubScene.ts`; comment-only diff |
| FR-7 | Phase 5 | 12 lines of orphan JSDoc removed |
| FR-8 | Phase 5 | Import attribute; warning gone from every gate |
| FR-9 | Phase 6 | Archive move, metadata, index note, ledger line |
| FR-10 | Phase 5 | 14 markers removed, 1 kept |
| FR-11 | All phases | Every corrected claim carries its source in the evidence |
| FR-12 | Phase 3 | Roster is 22 lines; three stale pool claims dropped rather than carried |

## 4. Non-functional requirements

| NFR | Verdict |
| --- | --- |
| NFR-1 — no runtime behavior change | met: source diff is two comments, one JSDoc deletion, one import attribute; 2,305 tests unchanged and green |
| NFR-2 — every gate green | met: §1 |
| NFR-3 — no new dependency, no new gate | met: `package.json` untouched |
| NFR-4 — dated history byte-identical | met: release notes untouched; `product.md` diff touches only lines 58 and 85 |
| NFR-5 — conventional style | met: Biome clean, Markdown in the existing voice, relative links |
| NFR-6 — offline verifiable | met: no new external reference |

## 5. Deviations accepted

| Phase | Deviation | Why it stands |
| --- | --- | --- |
| 2 | Three false README claims corrected rather than relocated (deploys are tag-gated, the service worker is prompt-based, the 56 px shelf figure was attached to the wrong object) | the doc owner was wrong; carrying a wrong number into the PRD would have been worse |
| 2 | AC-2's original 170 was revised to 240/215 | measurement replaced an estimate, and the arithmetic is recorded in the criterion itself |
| 3 | PRD §3 intro moved from five fields to six | the new `**Feedback.**` bullet had to be named |
| 3 | Pattern Builder and First Sounds claims corrected in the PRD | both contradicted their logic modules |
| 4 | Phase 4 ran as primary, not a subagent | `conductor/product.md` is not writable by phase executors; the subagent prepared the exact sentence |
| 5 | `HubScene.ts` comment corrected alongside `main.ts` | same class of defect, comment-only |

## 6. Known residue (recorded, not fixed)

- `src/__tests__/scenes/navigation.test.ts:305` still titles a test "creates 7 game tiles". The test asserts add order, not a count, so nothing fails; it falls outside AC-6's wording and outside this track's scope.
- `conductor/tech-stack.md:381` keeps a dated 2026-10-16 entry naming the Ligne track's old path. Dated entries are frozen; the archived track's `## Archive note` is the pointer.
- Branch coverage reads 90.66-90.73 depending on the run; documentation says "≈90 %" and defers to `vite.config.ts`.
