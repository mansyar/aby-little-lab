# Docs & Dead-Code Truth Pass — Implementation Plan

> **Branch:** `chore/20261020-docs-truth-pass`
> **Base:** `master` @ `8d16d4fd31e80688f231e042508b20d1bd297515`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: README Truth & Measured Counts

- **Goal:** README and TDD state numbers that match a run captured in this phase, and no README heading is empty.
- **Depends on:** none
- **Covers:** FR-1, FR-4, FR-11, AC-1, AC-4
- **Touches:** `README.md`, `docs/TDD.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified
- **Result:** verified
- **Checkpoint:** `daafe4d`
- **Evidence:** `conductor/tracks/20261020-docs-truth-pass/verification/phase-1.md`

- [x] **P1.T1: Capture the measured facts** — covers: FR-11
  - [x] **P1.T1.1: Run the suite once** — record file and test totals from `pnpm test -- --run`.
  - [x] **P1.T1.2: Run coverage once** — record the four metrics and the lowest-covered file from `pnpm test:coverage`.
- [x] **P1.T2: Correct README counts** — covers: FR-1
  - [x] **P1.T2.1: Replace the stale totals** — 2,208 tests across 103 files becomes the measured numbers plus `verified YYYY-MM-DD`.
  - [x] **P1.T2.2: Name the authority** — state that CI and `vite.config.ts` thresholds are the source of truth.
- [x] **P1.T3: Resolve the empty `## Parental Controls` heading** — covers: FR-1
  - [x] **P1.T3.1: Write or fold the section** — source the body from PRD §4.5/4.6, or merge it into the existing parental content; no empty heading remains.
- [x] **P1.T4: Refresh TDD §10.2/10.3** — covers: FR-4
  - [x] **P1.T4.1: Update counts and the coverage snapshot** — use the values captured in P1.T1.
  - [x] **P1.T4.2: Re-measure the lowest-file claim** — correct the `decodeLogic.ts` 73.8% sentence or remove it.
- [x] **P1.T5: Verify the other numeric claims** — covers: FR-1, FR-11
  - [x] **P1.T5.1: Check against build output** — precache entries and KiB, 53-key shell set, 178 texture keys, shell entry size.
  - [x] **P1.T5.2: Record the verified-unchanged list** — in the phase evidence.

## Phase 2: De-duplicate the README Systems Sections

- **Goal:** nine platform and system sections become short linked summaries with no fact lost.
- **Depends on:** Phase 1
- **Covers:** FR-2, FR-3, FR-11, AC-2, AC-3
- **Touches:** `README.md`, `docs/PRD.md`, `docs/TDD.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified

- [x] **P2.T1: Inventory the facts in the nine sections** - covers: FR-3
  - [x] **P2.T1.1: List the sections and facts** - Motion & Feedback, UI & Typography, PWA Release Readiness, Bundle Code Splitting, Docker, CI/CD, Parental Lock & Touch UX, Hub Experience, Professor Hoot.
  - [x] **P2.T1.2: Classify each fact** - `covered` when the owning doc already carries it, `relocate` otherwise.
- [x] **P2.T2: Relocate uncovered facts** - covers: FR-3
  - [x] **P2.T2.1: Write each fact into its owning doc** - product behavior into `docs/PRD.md`, implementation detail into `docs/TDD.md`, at the matching section.
- [x] **P2.T3: Replace the sections with summaries** - covers: FR-2
  - [x] **P2.T3.1: Cap each summary at five lines plus a link** - to the owning PRD or TDD section.
  - [x] **P2.T3.2: Check inbound anchors** - `rg "README.md#"` across the repo; fix or keep any referenced headings.
- [x] **P2.T4: Prove the outcome** - covers: FR-2, FR-3
  - [x] **P2.T4.1: Record the line count and relocation list** - in the phase evidence.

- **Result:** verified. README 286 → 237 lines; the nine sections fell from 107 to 58 lines and each now ends in links to its owning PRD/TDD section. Facts the docs lacked were written first: the PRD gained the platform/bundle/hub details it was missing, the TDD gained §5.8 Typography and fonts plus the CI, Docker and shell-budget facts. Three false README claims were corrected rather than carried: deploys are tag-gated (not merge-gated), the service worker is prompt-based, and the sticker shelf's 56px figure was attached to the wrong object. 31 cross-doc anchors resolve; 0 broken internal anchors. AC-2 was revised to 240 after Phase 2 (original 170 pre-dated measurement) and the remaining gap moved to Phase 3 as FR-12.
- **Checkpoint:** `c96efe1`
- **Evidence:** [`verification/phase-2.md`](./verification/phase-2.md)

## Phase 3: Move Per-Game Juice and the Game Roster into the PRD

- **Goal:** each of the 22 game specs owns its feedback facts and its replay-variety detail, and the README keeps only a one-line-per-game pointer.
- **Depends on:** Phase 2
- **Covers:** FR-2, FR-3, FR-12, AC-2, AC-3, AC-12
- **Touches:** `README.md`, `docs/PRD.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified

- [x] **P3.T1: Add a feedback line to each PRD game spec** — covers: FR-3
  - [x] **P3.T1.1: Cover §3.1-§3.22** — one line per game, preserving reduced-motion variants.
- [x] **P3.T2: Replace the README per-game section** - covers: FR-2
  - [x] **P3.T2.1: Summarize and link** — no orphaned bullets and no dead anchors.
- [x] **P3.T3: Verify 22/22 coverage** - covers: FR-3
  - [x] **P3.T3.1: Record the per-game checklist** - in the phase evidence, flagging any fact intentionally dropped and why.
- [x] **P3.T4: Cut the roster down to one line per game** - covers: FR-12
  - [x] **P3.T4.1: Move replay-variety detail to the PRD** - keep the game name, its domain and its icon, link to the 3 spec, and drop any bullet whose facts the PRD 3 spec already states.
  - [x] **P3.T4.2: Hold the line budget** - README at most 215 lines at the end of the phase, with `## Releases` and `## Project Structure` unchanged.

- **Result:** verified. README 237 -> 214 lines (roster 31 -> 27, per-game juice 23 -> 4), inside the 215 ceiling. The PRD gained 22 `**Feedback.**` bullets (132 field bullets, six per game) and its §3 intro names the sixth field. Reading the README numbers against `src/game/` proved three of them stale - Shape Sorter "6 shapes" where the code takes 3 per round from 18, Animal Trace "6 pairs" where `selectThreePairs()` takes 3 of 6, Pop & Freeze "6 decoys" where the code floats 1-2 at a time - so they were dropped rather than carried across. Two wrong PRD claims were corrected in place: Pattern Builder "six shapes to choose from" (three choices from the 18-shape pool) and First Sounds confusable pairs (only B/P and D/T exist in `SOUND_CONFUSABLE_PAIRS`). The roster now uses the hub labels from `src/game/hubTiles.ts` instead of README-only suffixes. All twelve rule strings were confirmed present in the PRD before the README paragraph was dropped; 53 cross-doc anchors resolve, 0 broken.
- **Checkpoint:** `4dfaf9a`
- **Evidence:** [`verification/phase-3.md`](./verification/phase-3.md)

## Phase 4: product.md Current-State Truth

- **Goal:** current-state adaptive and layout claims match the code, and dated history is byte-identical.
- **Depends on:** none
- **Covers:** FR-5, FR-11, AC-5
- **Touches:** `conductor/product.md`, `docs/PRD.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified

- [x] **P4.T1: Correct the adaptive sentence** — covers: FR-5
  - [x] **P4.T1.1: Match the code** — 6-tap minimum inside a 10-tap window, 0.9 up and 0.6 down, clamped bands, toggle honored.
- [x] **P4.T2: Audit the remaining current-state claims** — covers: FR-5
  - [x] **P4.T2.1: Verify against code** — 22 games, 6×4 tile grid at 144px, 5×2 paged layout, domain counts; fix only failures.
- [x] **P4.T3: Prove history was not rewritten** — covers: NFR-4
  - [x] **P4.T3.1: Inspect the diff** — `git diff -U0 conductor/product.md` shows no changed line inside a dated `> **YYYY-MM-DD**` entry.
- [x] **P4.T4: Fix the Build the Word distractor claim** — covers: FR-11
  - [x] **P4.T4.1: Match the code** — PRD 3.10 says distractors come from nearby letters; `generateLetterTiles` in `src/game/wordLogic.ts` draws them from the remaining alphabet, so state what the code does.

- **Result:** verified. The audit confirmed twelve of thirteen current-state claims against code and changed only what was wrong: the Adaptive Difficulty sentence now states the ten-tap window, the six-tap minimum, 0.9 up and 0.6 down, the steady middle, the clamp and the toggle (previously "≥90% over ≥10 taps"), and the hub line now names the paged phone layout (three 5×2 pages, 10 + 10 + 2) that the wide-grid sentence had made invisible. Roster order, domain counts (4/1/1/2/2/5/5/1/1 = 22), `TILE_WIDTH = 144` with 6×4 rows 6/6/6/4, the 160/256/512 texture tiers and the eight §3.1 mechanic counts all verified correct and left byte-identical. All 14 dated `> **YYYY-MM-DD**` entries are untouched - `git diff -U0 conductor/product.md` has zero `^[+-]> \*\*` lines. PRD §3.10 now says the distractor tiles come from the alphabet minus the word's own letters, which is what `generateLetterTiles` does.
- **Checkpoint:** `9d47921`
- **Evidence:** [`verification/phase-4.md`](./verification/phase-4.md)

## Phase 5: Code Comments, Dead JSDoc, Vite Warning

- **Goal:** no known false comment, no orphan JSDoc, no config warning, and no `.gitkeep` beside real files.
- **Depends on:** none
- **Covers:** FR-6, FR-7, FR-8, FR-10, AC-6, AC-7, AC-8, AC-10
- **Touches:** `src/main.ts`, `src/components/SettingsPanel.ts`, `vite.config.ts`, comment-only sweep paths, `.gitkeep` paths
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified

- [x] **P5.T1: Fix the `main.ts` lazy-scene comment** — covers: FR-6
- [x] **P5.T2: Sweep stale source comments** — covers: FR-6
  - [x] **P5.T2.1: Search and correct** — `rg` for "7 game", "seven game", "20-tile", "12 game", "170 preloaded" and "Ligne" in `src`; correct false comments only.
- [x] **P5.T3: Delete the orphan JSDoc block** — covers: FR-7
  - [x] **P5.T3.1: Remove lines 303-313** — confirm no live method lost documentation.
- [x] **P5.T4: Fix the Vite JSON import** — covers: FR-8
  - [x] **P5.T4.1: Add the import attribute** — `with { type: "json" }`; confirm the warning is gone from test and build output.
- [x] **P5.T5: Remove redundant `.gitkeep` files** — covers: FR-10
  - [x] **P5.T5.1: Delete only where tracked files exist** - list every removed path in the evidence.

- **Result:** verified. `src/main.ts` now says all 22 game scenes are lazy-loaded, and the sweep caught one more false count (`HubScene`'s "grid of 12 game tiles"); the remaining numeric comments are real constants or dated notes and were left alone. The six orphan JSDoc blocks are gone from `SettingsPanel.ts` with their behaviours documented where they now live (`InstallRow`, `ResetModal`). `vite.config.ts` imports `package.json` with `with { type: "json" }`, and the `configLoader: 'native'` warning is absent from check, typecheck, test and build output. Fourteen `.gitkeep` markers were removed from directories that hold tracked files; `src/assets/audio` keeps its marker because it holds nothing else. Gate green at 110 files / 2,305 tests, build still 53 precache entries over 41 chunks, validators pass.
- **Checkpoint:** `11ed38c`
- **Evidence:** [`verification/phase-5.md`](./verification/phase-5.md)

## Phase 6: Close the Executed Ligne Track

- **Goal:** the stale `new` track is archived with proof, and the registry ledger resolves to it.
- **Depends on:** none
- **Covers:** FR-9, AC-9
- **Touches:** `conductor/tracks/drop-ligne-mascot_20261016/**`, `conductor/archive/drop-ligne-mascot_20261016/**`, `conductor/tracks.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** pending

- [ ] **P6.T1: Prove Ligne is absent** — covers: FR-9
  - [ ] **P6.T1.1: Collect the evidence** — no `@ligne-engine` in `package.json` or the lockfile, no `.ligne` or `ligne_wasm` in `dist/`, validator passes, `755d575` deleted the files.
- [ ] **P6.T2: Archive the track** — covers: FR-9
  - [ ] **P6.T2.1: Move the folder** — to `conductor/archive/drop-ligne-mascot_20261016/`.
  - [ ] **P6.T2.2: Update the metadata and index** — `status: "complete"`, `archived_at`, `archive_path`, `doc_sync: "updated"`, plus a one-line retroactive note in `index.md`.
- [ ] **P6.T3: Update the registry ledger** — covers: FR-9
  - [ ] **P6.T3.1: Rewrite the line in place** — marker `[x]`, link to `./archive/drop-ligne-mascot_20261016/index.md`, `(Archived)` suffix; never remove the line.
- [ ] **P6.T4: Verify the state** — covers: FR-9
  - [ ] **P6.T4.1: Check folder, link and evidence** — no track folder remains, the link resolves, the phase evidence records the commands.
