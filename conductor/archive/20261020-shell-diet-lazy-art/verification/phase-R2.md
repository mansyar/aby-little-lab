# Phase R2 — Review Fixes, round 2 (F8–F14)

- **Track:** `20261020-shell-diet-lazy-art`
- **Phase:** R2 (second review round: F8–F14)
- **Date:** 2026-10-20
- **Branch:** `refactor/20261020-shell-diet-lazy-art`
- **Base for this phase:** `590cdea` (R1 verified at `c74986d`, plan update `ee8076f`, brief `590cdea`)
- **Result:** verified, with two deviations for the primary (see below). Every
  command in the chain passes except `pnpm check`, which fails on a pre-existing
  untracked build artifact outside this phase's scope — no file this phase
  touched is implicated.

## Commits

| Task | Commit | Message |
| --- | --- | --- |
| R2.T1 (F8) | `eee80db` | `docs(tdd): state the first-tap cost as an increment, not a latency` |
| R2.T2 (F9) | `51008a9` | `docs(perf): disclose how each build in the tap comparison was served` |
| R2.T3 (F10, F11) | `1541492` | `docs(perf): correct the letter key count and drop the bad corroboration` |
| R2.T4 (F12) | `bdbdcda` | `docs(evidence): point AC-5 at the scene test that proves it` |
| R2.T5 (F13) | `ce356a7` | `test(art): prove a failed key draws a placeholder and is never re-queued` |
| R2.T6 (F14) | `52dc8a7` | `test(helpers): require createCanvas on the scene textures double` |
| evidence | this commit | `conductor(verify): record phase R2 evidence` |

## Verification

Run once, in the order the brief gives. `pnpm check` was retried twice (the
allowed maximum) and failed identically both times; the remaining commands were
then run individually, in the same order, so each has its own exit code below.

| Command | Exit | Output |
| --- | --- | --- |
| `pnpm check` | **1** | `biome check` → `× Found a nested root configuration… .conductor/base-build/biome.json` (see deviation 2) |
| `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| `pnpm test -- --run` | 0 | 110 files / **2,305** tests passed |
| `pnpm test:coverage` | 0 | stmts **97.8** / branch **90.73** / funcs **96.34** / lines **98.59** against 90 / 85 / 88 / 95 |
| `pnpm build` | 0 | `index-DkSW5M3z.js` 132.21 kB (30.02 kB gzip), `phaser-P1E8uaLi.js` 1,374.82 kB, 9 art chunks, precache 53 entries (1702.03 KiB as workbox prints it) |
| `node scripts/validate-bundle.js` | 0 | `PASS: Phaser vendor chunk present`; `PASS: shell entry index-DkSW5M3z.js = 129.1 kB (<= 200 kB)` |
| `node scripts/validate-pwa.js` | 0 | 16 passed / 0 failed; `41 chunks, 41 precached` |
| `node scripts/validate-boot.js` | 0 | **median 0.93 s** over 3 cold loads (1233 / 314 / 933 ms) ≤ 3.0 s; ran against a real preview server on 4173, which exited when the run finished (deviation 3) |

Coverage gates unchanged and green; no threshold was touched. The shell entry
and the emitted chunk set are byte-identical to the R1 checkpoint
(`index-DkSW5M3z.js`), which is the expected result of a docs-and-tests-only
phase.

## Findings

| ID | Severity | What changed | Where | Proof |
| --- | --- | --- | --- | --- |
| F8 | High | The present-tense "Measured budgets" paragraph no longer states a first-tap latency. It now states the increment — **+82 ms at worst** (Memory Match), **+48 ms** for the widest union (Find the Word, 83 keys) against the 400 ms budget, absolute **224–334 ms** — names the back-to-back measurement against a build of `f377bf8`, and says the script fails on the worst total, not the cross-game median. | `docs/TDD.md:380` | Text matches `docs/perf-baseline.md` and AC-8 |
| F8 | High | The 2026-10-20 Shell Diet blockquote's `Measured:` clause is replaced in the same terms (+82 ms worst / +48 ms widest union, absolute 224–334 ms, measured against a build of `f377bf8`). **Not applied:** the sandbox denied `edit` twice; the exact find/replace is in `.conductor/evidence/tech-stack-f2-block.md`. | `conductor/tech-stack.md:383` | Block file; deviation 1 |
| F8 | High | Three quotations of the retracted pair in the Phase 5 evidence now carry a short "superseded by Phase R1 (F2) / Phase R2" note, with the historical text kept. | `verification/phase-5.md` (README bullet, perf-baseline bullet, tech-stack blockquote) | Text retained + marker present |
| F9 | Medium | One paragraph added to the Primary verification section: the pre-track build ran on `npx serve dist -l 4174` and the current build on `vite preview` at 4173; `serve` compresses by default and Vite preview does not, stage B is chunk transfer, so the current build was the disadvantaged side and **every delta is an upper bound**. | `verification/phase-R1.md` | Paragraph sits after the delta table |
| F9 | Medium | One line added to the method list with the same disclosure, ending "The deltas below are therefore **upper bounds** on the real cost." | `docs/perf-baseline.md` (Method) | New method bullet |
| F10 | Low | "Find the Letter (46)" → "(26)" — `AlphabetScene` declares only `letters` (26 keys). | `docs/perf-baseline.md`, `verification/phase-4.md`, `verification/phase-R1.md` | Three table rows now read `(26)`; `AlphabetScene.ts` `preloadArt([letters])` |
| F11 | Low | The "−2 ms/texture for 47 extra textures" corroboration is gone. It computes to −94 ms and has the sign backwards. Replaced with: the deltas sit inside this machine's run-to-run spread, so the absolute totals against the 400 ms budget are the number that matters. | `verification/phase-R1.md` | Sentence removed; replacement cites the variance paragraph |
| F12 | Low | AC-5's evidence row now names `alphabetScene.test.ts` and what it proves — a failed declared letter load emits exactly one warning, a tier-sized (256×256) placeholder, and a round that still answers and advances. `placeholder.test.ts` is kept as the secondary unit test. | `verification/integrated.md:41` | Row text; `alphabetScene.test.ts` placeholder assertions |
| F13 | Low | The failed-key test now drives the shipped flow: `loaderror` → `complete` → asserts exactly one `console.warn`, `createCanvas("bubble", 256, 256)` (at `textureSizeFor`), `textures.exists("bubble") === true`, then a second `preloadArtGroups` leaves the registration list unchanged and does not call `load.svg` again. Renamed "draws a placeholder when the load completes and never re-queues the key". The scene double gained a `createCanvas` stub that registers the key, like the real manager. | `src/__tests__/game/art/preloadArtGroups.test.ts` | 9/9 in that file; 2305 tests overall |
| F14 | Low | `MockScene.textures.createCanvas` is **required** again. The cue double returns `null` (manager refused), and the `GameSceneBase` double keeps MockScene's real `createCanvas`, overriding only `exists` with `mockReturnValue(true)` instead of replacing the whole manager. | `src/__tests__/helpers/phaserMock.ts:177`, `src/__tests__/components/ArtLoadingCue.test.ts`, `src/__tests__/scenes/preloadArt.test.ts` | `pnpm typecheck` exit 0; the three touched test files 28/28 |

No behaviour change, no new dependency, no reformatting of untouched lines. The
built output is identical to R1's (`index-DkSW5M3z.js`, same chunk hashes).

## Deviations

1. **`conductor/tech-stack.md` write denied.** `edit` returned
   `permission.rejected` on both attempts, exactly as the brief anticipated. The
   exact one-line replacement is written to
   `.conductor/evidence/tech-stack-f2-block.md` (find/replace pair plus the full
   resulting paragraph) for the primary to apply. `docs/TDD.md` carries the same
   correction and *was* applied.
2. **`pnpm check` cannot pass in this sandbox.** Biome aborts with
   `Found a nested root configuration … .conductor/base-build/biome.json`. That
   directory is the R1 baseline build (a `f377bf8` archive) the primary created
   for the tap comparison; it is untracked and the working tree is clean, so no
   file this phase touched is involved. Deleting or moving it was refused by the
   sandbox (`Move-Item` → `permission.rejected`), so it was left alone. The root
   `biome.json` scopes `files.includes` to `src/**`, `scripts/**` and
   `vite.config.ts`, which the nested file cannot satisfy. The primary should
   remove `.conductor/base-build` (it is in `.gitignore` and reproducible with
   `git archive f377bf8`) and re-run `pnpm check`.
3. **Preview server for the boot run.** `node node_modules/vite/bin/vite.js
   preview --port 4173 --strictPort` *did* start in the background this round
   (unlike R1), so `validate-boot.js` ran against a real preview and passed at a
   0.93 s median. It exited by itself when the boot run finished (exit 1 after
   the harness closed it), and port 4173 is free again; no cleanup step is
   needed. `Stop-Process` was denied in the sandbox, which is why the shutdown
   was left to the harness.
4. **F14 reached one more double than the brief named.** Making `createCanvas`
   required also affects `ArtScene` in `preloadArtGroups.test.ts` (a `MockScene`
   subclass in this phase's `Touches`); it was given its registering stub as part
   of R2.T5, where the placeholder assertion needed it.

## Notes

- The R1 figure corrections were already in the tree; R2 only *propagated* them
  to `docs/TDD.md`, `conductor/tech-stack.md` (blocked) and the Phase 5 evidence,
  and fixed the two remaining internal inconsistencies (F10, F11).
- Nothing was re-measured. F9 is disclosure only, as the brief requires.
- Pre-existing, not introduced: the biome schema-version info (2.5.5 vs 2.5.10)
  and the `noNonNullAssertion` warning in `musicalMemoryScene.test.ts` are the
  same two diagnostics R1 recorded.
- Workbox printed `53 entries (1702.03 KiB)` for the precache in this run, where
  the docs quote 1,701.34 KiB for the same 53 entries at the same chunk hashes.
  The entry count and chunk set are unchanged; the docs were not edited for a
  sub-kilobyte reporting difference.

## Primary verification (independent)

**Scope.** git diff --name-only 590cdea..HEAD lists twelve files: the eleven in
Phase R2 \Touches\ plus \conductor/tech-stack.md\, which the phase could not write
(\dit\ returned \permission.rejected\ twice) and the primary applied afterwards as
\28dd843\. Nothing outside \Touches\ changed.

**Per-finding check, read at the verified head:**

| # | Severity | Verified | Evidence |
| - | -------- | -------- | -------- |
| F8 | High | resolved | \docs/TDD.md\ "Measured budgets" now reads "+82 ms at worst ... +48 ms for the widest art union ... absolute totals 224-334 ms", with the increment rationale and the \377bf8\ comparison; the same clause is in \conductor/tech-stack.md\ (2026-10-20 blockquote); \phase-5.md\ carries "Superseded by Phase R1 (F2) / Phase R2" markers at the three quoted places, history intact. No present-tense 200.1 / 235.8 ms claim remains anywhere (the only surviving mentions are retraction notes). |
| F9 | Medium | resolved | \phase-R1.md\ and \docs/perf-baseline.md\ state that the baseline ran on \
px serve\ and the current build on \ite preview\, that \serve\ compresses and Vite preview does not, that the current build was therefore the disadvantaged side, and that the deltas are upper bounds. Nothing re-measured, per the review's allowed fallback. |
| F10 | Low | resolved | "Find the Letter (26)" in \perf-baseline.md:274\, \phase-4.md:229\, \phase-R1.md:108\. |
| F11 | Low | resolved | The unbounded "−2 ms/texture" sentence is gone; \phase-R1.md:114-116\ now says the deltas sit inside this machine's run-to-run spread and the absolute totals against the 400 ms budget are the number that matters. |
| F12 | Low | resolved | \integrated.md\ AC-5 names \lphabetScene.test.ts\ as the proof (loaderror + complete, one warning, tier-sized placeholder, round completable) and keeps \placeholder.test.ts\ as secondary. |
| F13 | Low | resolved | \preloadArtGroups.test.ts:220\ is now "draws a placeholder when the load completes and never re-queues the key" - it drives \loaderror\ then \complete\ and asserts the placeholder, the single warning and the no-requeue. |
| F14 | Low | resolved | \phaserMock.ts\ textures is \{ exists: MockFn; createCanvas: MockFn }\ again (required); \ArtLoadingCue.test.ts\ returns \
ull\ from its stub and \preloadArt.test.ts\ overrides only \xists\. |

**Gate chain at the verified head** (\pnpm check\ re-run after the primary removed the
stray \.conductor/base-build/biome.json\ that made biome abort on a nested root config):

| Command | Result |
| ------- | ------ |
| \pnpm check\ | exit 0 - 230 files, 1 pre-existing warning (\
oNonNullAssertion\, \musicalMemoryScene.test.ts\) and 1 pre-existing info (biome schema 2.5.5 vs CLI 2.5.10) |
| \pnpm typecheck\ | exit 0 |
| \pnpm test -- --run\ | exit 0 - 110 files / 2,305 tests |
| \pnpm test:coverage\ | 97.8% statements, 90.73% branches, 96.34% functions, 98.59% lines |
| \pnpm build\ | shell \index-DkSW5M3z.js\ 132.21 kB (30.02 kB gzip), precache 53 entries (1,702.03 KiB) |
| \
ode scripts/validate-bundle.js\ | PASS - 129.1 kB entry, single Phaser chunk |
| \
ode scripts/validate-pwa.js\ | PASS - 16/16, 41 chunks precached |
| \
ode scripts/validate-boot.js\ | PASS - median 0.95 s over 3 cold loads (<= 3.00 s) |

The build output hash is identical to Phase R1's, which is the expected result of a
phase that changed documentation and test doubles only.
