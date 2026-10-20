# Review: Shell Diet: Per-Game Lazy Art Chunks

- **Track:** `20261020-shell-diet-lazy-art`
- **Type:** `refactor`
- **Branch:** `refactor/20261020-shell-diet-lazy-art`
- **Range:** `f377bf8..d5eda08`
- **Date:** 2026-10-20
- **Verdict:** `PASS`

## Summary

The lazy-art split holds up: the twelve group modules are frozen, key-unique and
complete (131 keys, 125 game-only), `preloadArtGroups` is genuinely per-scene owned
with a `shutdown` release path traced against Phaser's own loader, all 21 game
scenes declare the groups they actually draw (checked transitively through
`wordLogic`, `countLogic`, `memoryMatchLogic`, `shapeSorterLogic`), and the shell
really did shrink from 195.4 KiB to 129.1 KiB with tier assignments unchanged.

Round 1 blocked on two High findings. The FR-6 placeholder was dead code — nothing
in `src/` called `ensureArtTexture` while three documents described it as shipped —
and the AC-8/NFR-1 measurement tapped the wrong "worst" game and gated on the
cross-game median. Both were fixed in Phase R1 (`c74986d`) and re-reviewed in round
2, which confirmed the fixes and found one remaining High: `docs/TDD.md` and
`conductor/tech-stack.md` still taught the retracted 200.1 / 235.8 ms figures even
though README, perf-baseline, phase-4 and integrated had been corrected. Phase R2
(`d5eda08`) propagated the increment framing to both docs, disclosed the serving
asymmetry behind the tap comparison, and cleared five smaller findings.

With `review.strict: true` both rounds were fixed in-track rather than deferred;
no finding is left open and no override was needed.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| static | `pnpm check` | pass — 230 files, 1 pre-existing warning, 1 pre-existing info | `verification/phase-R2.md` |
| static | `pnpm typecheck` | pass | `verification/phase-R2.md` |
| unit | `pnpm test -- --run` | pass, 110 files / 2,305 tests | `verification/phase-R2.md` |
| coverage | `pnpm test:coverage` | pass, 97.8 / 90.73 / 96.34 / 98.59 | `verification/phase-R2.md` |
| build | `pnpm build` | pass, shell `index-DkSW5M3z.js` 132.21 kB, 53 precache entries | `verification/phase-R2.md` |
| build-artifact | `node scripts/validate-bundle.js` | pass, 129.1 kB shell, one Phaser chunk | `verification/phase-R2.md` |
| build-artifact | `node scripts/validate-pwa.js` | pass, 16/16, 41 chunks precached | `verification/phase-R2.md` |
| smoke | `node scripts/validate-boot.js` | pass, median 0.95 s (gate 3.0 s) | `verification/phase-R2.md` |
| evidence | `node scripts/measure-first-tap.mjs` | worst increment +82 ms, widest union +48 ms, absolute 224–334 ms | `verification/phase-R1.md` |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1.T2, P4.T1 | `groupIntegrity.test.ts`, `shellOwnership.test.ts` | covered |
| FR-2 | P1.T1.1 | `preloadArtGroups.test.ts` | covered |
| FR-3 | P3.T1, P3.T2, R1.T3 | `artDeclarations.test.ts` (glob discovery), `preloadArt.test.ts` | covered |
| FR-4 | P4.T1 | `preloadScene.test.ts`, `shellOwnership.test.ts`, `navigation.test.ts` | covered |
| FR-5 | P2.T1 | `ArtLoadingCue.test.ts`, `preloadArt.test.ts` (disposal asserted) | covered |
| FR-6 | P2.T2, R1.T1 | `alphabetScene.test.ts` (loaderror → complete), `placeholder.test.ts` | covered |
| FR-7 | P5.T1 | `validate-pwa.js` + negative proof | covered |
| FR-8 | P4.T1, P5.T2 | `shellOwnership.test.ts` | covered |
| FR-9 | P5.T3, R1.T6, R2.T1 | README, tech-stack, TDD, perf-baseline all state the split and the increment | covered |
| NFR-1 | P4.T3, R1.T2 | `measure-first-tap.mjs` five targets, worst-total gate; back-to-back deltas | covered |
| NFR-2 | P5.T1 | 41/41 precached; offline first play run | covered |
| NFR-3 | P4.T1, R1.T7 | `textureSizeFor` unchanged; corpus-wide tier and byte assertions | covered |
| NFR-4 | P4.T1 | `package.json` untouched; 9 art chunks | covered |
| NFR-5 | P5.T4 | `integrated.md` gate table | covered |
| AC-1 | P4.T1 | 129.1 KiB + one `phaser-*.js` | covered |
| AC-2 | P1.T3.1 | `groupIntegrity.test.ts` | covered |
| AC-3 | P1.T3.2 | `preloadArtGroups.test.ts` | covered |
| AC-4 | P3.T3, P5.T2, R1.T3 | `artDeclarations.test.ts` (discovered scenes, injected-file proof), `shellOwnership.test.ts` | covered |
| AC-5 | P2.T3.2, R1.T1 | `alphabetScene.test.ts` — one warning, tier-sized placeholder, round completable | covered |
| AC-6 | P5.T1 | negative proof in `phase-5.md` | covered |
| AC-7 | P4.T3.1 | 808 → 419.5 ms; ~4.2 s → 1697.2 ms | covered |
| AC-8 | P4.T3.2, R1.T2 | worst +82 ms, widest union +48 ms, absolute 224–334 ms vs 400 ms | covered |
| AC-9 | P5.T3, R1.T6, R2.T1 | four docs, no retracted figure left in the present tense | covered |

## Findings

### Critical

- none

### High

- **F1 - The FR-6 placeholder is dead code, and three docs claim it ships** —
  **resolved in `c74986d`.** The registry now keeps a per-scene `failed` set,
  `loaderror` releases the key *and* remembers it, and the loader's `complete`
  handler draws `ensureArtTexture` for each remembered key before clearing. The
  `complete` listener is detached on `shutdown` with the others, `ensureArtTexture`
  is re-exported, and `alphabetScene.test.ts` drives the real path (`loaderror` →
  `complete`) asserting one warning, `textures.exists`, `createCanvas` at the tier
  size and a round that still advances. Removing the `complete` wiring from
  `registry.ts` makes that test fail, so the test can fail.
  - **File:** `src/game/art/registry.ts:81-98`, `src/game/art/index.ts:18`,
    `src/__tests__/scenes/alphabetScene.test.ts:358-383`
  - **Requirement:** FR-6, AC-5

- **F2 - The first-tap measurement tapped the wrong worst game and gated on the median** —
  **resolved in `c74986d`.** `TARGETS` now includes Find the Word (seven groups /
  83 keys, the real widest union), the comment says so, and both the gate and the
  PASS/FAIL summary use `taps.worst.totalMs`. The evidence was re-recorded as a
  before/after against a build of `f377bf8`: **+82 ms worst** (Memory Match),
  **+48 ms** for the widest union, absolute totals 224–334 ms against the 400 ms
  budget.
  - **File:** `scripts/measure-first-tap.mjs:76-84`, `:37`
  - **Requirement:** NFR-1, AC-8

- **F8 - TDD and tech-stack still taught the retracted first-tap figures** —
  **resolved in `d5eda08`.** `docs/TDD.md`'s "Measured budgets" paragraph and the
  `conductor/tech-stack.md` 2026-10-20 blockquote now state the increment (+82 ms
  worst / +48 ms widest union, absolute 224–334 ms, measured back to back against
  `f377bf8`), and the three quotations in `verification/phase-5.md` carry
  "Superseded by Phase R1 (F2) / Phase R2" markers. The only remaining mentions of
  200.1 / 235.8 ms in the repository are explicit retraction notes.
  - **File:** `docs/TDD.md:380`, `conductor/tech-stack.md:383`,
    `verification/phase-5.md:116,146,155`
  - **Requirement:** AC-9, FR-9

### Medium

- **F3 - The art-declaration scan could not see a new game scene** —
  **resolved in `c74986d`.** `SCENE_SOURCES` is `import.meta.glob<string>(
  "../../scenes/*Scene.ts", { query: "?raw", import: "default", eager: true })`
  with a five-name non-game exclusion list and an asserted 22+5 count; adding a
  scene file without editing the test was proved to fail both draw checks.
  - **Requirement:** FR-3, AC-4

- **F9 - The tap comparison served the two builds through different static servers** —
  **resolved in `d5eda08` by disclosure, as the review allowed.** `phase-R1.md` and
  `docs/perf-baseline.md` now state that the baseline ran on `npx serve` and the
  current build on `vite preview`, that `serve` compresses and Vite preview does
  not, that the current build was therefore the disadvantaged side, and that the
  deltas are upper bounds. The absolute 224–334 ms totals against the 400 ms budget
  are unaffected by the asymmetry.
  - **Requirement:** NFR-1, AC-8

### Low

All five round-1 Lows are resolved: **F4** `SHELL_ASSET_COUNT` → `TOTAL_APP_ASSETS`
(53 + 125) in `c74986d`; **F5** the cue-disposal test now asserts `destroy` on the
first cue's mascot and dots and that the live cue owns exactly three undestroyed
dots; **F6** every document says nine art-group chunks with three inlined;
**F7** the tier and GPU-byte assertions iterate the shell set plus every group
(178 keys).

- **F10 - "Find the Letter (46)"** — resolved in `d5eda08`: the union is 26 keys
  (`AlphabetScene` declares `letters` only), fixed in `perf-baseline.md`,
  `phase-4.md` and `phase-R1.md`. **Requirement:** AC-8
- **F11 - The "−2 ms/texture" corroboration did not compute** — resolved in
  `d5eda08`: the sentence is gone and `phase-R1.md` now says the deltas sit inside
  the machine's run-to-run spread, so the absolute totals are the number that
  matters. **Requirement:** NFR-1
- **F12 - AC-5 cited the unit test the review rejected** — resolved in `d5eda08`:
  `integrated.md` names `alphabetScene.test.ts` as the proof and keeps
  `placeholder.test.ts` as secondary. **Requirement:** AC-5, FR-6
- **F13 - A test described a retry the fix removed** — resolved in `d5eda08`:
  `preloadArtGroups.test.ts:220` now drives `loaderror` → `complete` and asserts the
  placeholder, the single warning and that a later call does not re-queue.
  **Requirement:** FR-6
- **F14 - `MockScene.textures.createCanvas` became optional** — resolved in
  `d5eda08`: the field is required again, the cue double returns `null` and the
  scene double overrides only `exists`, so a double used against a placeholder draw
  cannot silently lack the method. **Requirement:** AC-5

## Overrides

- none

## Plan compliance

Seven phases carry `Status: verified` with `Result`, `Checkpoint` and `Evidence`; the
evidence files match the recorded checkpoints (`4423b11`, `af436bf`, `62dc293`,
`4f0a47c`, `b63af7b`, `c74986d`, `d5eda08`). Every `[x]` task was implemented and
spot-checked against the diff. Each phase commit stayed inside its declared
`Touches`, with two widened during execution and recorded: Phase 4 gained the two
test files its shell-shrink broke by design, Phase R1 gained
`src/__tests__/helpers/phaserMock.ts`. The round-1 deviations (the Phase-1 registry
rework, the `tech-stack.md` write the Phase-5 executor was denied and the primary
applied, the TDD corrections) are accurate; its two unreported deviations — P2.T2
shipping a helper with no caller and P4.T3 measuring the median — were F1 and F2 and
are closed. Phase R2 recorded the same `tech-stack.md` denial, and the primary
applied the prepared block as `28dd843`.

## Out of scope

- `docs/TDD.md` §3.6's per-file chunk sizes are stale relative to today's build;
  recorded as debt in `integrated.md` and owned by PRD §7.2.
- `validate-pwa.js`'s string-scan of `precacheAndRoute` and its two `.ligne` checks
  now test nothing — pre-existing weaknesses of that script, not introduced here.
- `src/__tests__/scenes/musicalMemoryScene.test.ts:294` (`noNonNullAssertion`) and
  the biome schema-version info are pre-existing on `master`.
- `plan.md:97` still calls Memory Match "the widest ring" in the Phase 4 Goal — the
  claim F2 retracted. The phase is verified and its evidence is correct; rewording a
  completed phase's goal would rewrite history rather than fix a fact.
- The "before" figures (808 ms, ~4.2 s, 42 precache entries) come from an earlier
  baseline than the immediately-preceding checkpoint (196.9 KiB, 53 entries);
  mixing baselines in one table is a documentation choice, not a regression.

## Debt

- none (strict mode: every finding is fixed in Phase R1 or R2)

## Doc sync

`updated` — `docs/TDD.md`, `docs/perf-baseline.md`, `README.md` and
`conductor/tech-stack.md` were corrected in-track (Phase 5, Phase R1 and Phase R2).

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | BLOCK | 0 | 2 | 1 | 4 | 0 |
| 2 | BLOCK | 0 | 1 | 1 | 5 | 7 |
| final | PASS | 0 | 0 | 0 | 0 | 7 |
