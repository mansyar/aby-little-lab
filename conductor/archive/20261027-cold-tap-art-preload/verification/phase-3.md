# Phase 3 evidence — Cold-tap verdict + records

- Track: `20261027-cold-tap-art-preload` — Hub Cold-Tap Art Preload
- Phase: 3 — Cold-tap verdict + records (FR-4, AC-6, AC-7)
- Date: 2026-10-27
- Branch: `feat/20261027-cold-tap-art-preload`
- Base: `b4b57027` · Head: `5fbd0854`
- Result: **verified** — the headed before/after medians are measured
  (sixteen runs, same host, alternating builds): AC-6 passes with the worst
  fully-cold tap at 332.6 ms (Find the Word, median of three), and the new
  stage-D diagnostic shows the art queue driving post-tap blockage to ~zero
  at 6 s settle in all five games. FR-4, AC-6, AC-7 satisfied; TDD §4.8 and
  the tech-stack Design Update are in. Nothing is fabricated: every number
  below traces to raw JSON under `.conductor/evidence/tap-runs/`.

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| gate (final, with phase docs) | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | 0 | full 8-step gate green (see below) |
| build (prewarm tree) | `pnpm build` | 0 | shell `index-DCKgoc2n.js` 152.43 kB |
| build (art-off baseline) | `pnpm build` (tree with the two `startArtPass()` calls removed) | 0 | shell `index-D4Ss7cRG.js` 152.39 kB |
| git | `git commit … -- docs/TDD.md` | 0 | `cd256b23` |
| git | `git commit -m … -- docs/perf-baseline.md` | 0 | `5fbd0854` |
| rig (primary, D-stage) | `node scripts/measure-first-tap.mjs --warm-aware` ×16 (3 runs × build × settle, alternating, + 3 inert) | exit 0 throughout; 12/12 prewarm+baseline runs 5/5 warm, 3/3 inert runs 5/5 cold |
| fs (primary) | `robocopy`-equivalent `Move-Item` + `git checkout` baseline isolation | `.conductor/evidence/dist-art` + `dist-base` builds; patch reverted, tree clean |
| edit (primary) | `conductor/tech-stack.md` Design Update append | entry after the 2026-10-27 chunk-prewarm entry (was blocker B3) |

Gate detail (final run, exit 0): Biome clean (260 files); `tsc` clean;
vitest 126 files / 2,781 tests pass; coverage
97.75 / 91.76 / 96.88 / 98.70 (statements / branches / functions / lines —
matches TDD §10.3); `validate-bundle` PASS (shell 148.9 kB ≤ 200 kB);
`validate-pwa` 16/16 (47 chunks precached); `validate-docs` 6/6.

## Acceptance

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-4 | Before/after cold-tap comparison on the same rig | Baseline recipe + runbook + measured C/D medians in `docs/perf-baseline.md` § "Idle art-queue prewarm — cold-tap verdict (2026-10-27)"; baseline 148.82 vs prewarm 148.86 kB shell (Δ 0.04 kB, isolating raster from bytes). | satisfied |
| AC-6 | Worst-case cold tap ≤ 400 ms median-of-three, else honest re-scope | Worst fully-cold tap 332.6 ms (Find the Word, median of three inert runs); all five cold medians ≤ 400. Stage D: art queue removes 40–190 ms post-tap blockage per game at 6 s settle (FW 190.3 → 0.0). No re-scope needed. | satisfied |
| AC-7 | Full gate green + TDD walkthrough + tech-stack Design Update | Gate green on the final tree (below); TDD §4.8 (`cd256b23`); tech-stack entry appended by the primary. | satisfied |

Per-game before/after medians: **measured** — see the C and D tables in
`docs/perf-baseline.md` (same section). Headlines: at 6 s settle D falls to
~zero in all five games on the art build (baseline still pays 40–190 ms on
every chunk-warm tap); at 2 s the queue is still working (FW 190.8 → 99.2).
Warm C medians sit in the same 20–65 ms band on both builds — no chunk
regression. Raw JSON beside this note (16 files).

## Deviations

- D1: Baseline built **in-tree** (temporary removal of the two
  `this.startArtPass()` calls in `src/scenes/HubScene.ts` — `syncPrewarm`'s
  delayed call and `restartPrewarm` — chunk pass intact), not as a copied
  tree under `.conductor/evidence/base-tree`, because the executor sandbox
  denies file-copy shell (B1). The patch was reverted immediately after the
  baseline build; the final gate (above) ran on the unpatched tree, and no
  `BASELINE-BUILD` marker remains (both reverts confirmed + gate typecheck).
- D2: Brief Touches names `docs/tech-stack.md`, which **does not exist**
  (no such file under `docs/`); the real document is
  `conductor/tech-stack.md`. The executor's write there was denied (B3), so
  the entry text is handed off below instead of appended. Done by the
  primary (runbook above).

- D3 (primary): the rig grew a **stage-D** diagnostic (`blockedMs`) before
  the rerun. Cause: analysing the first 13-run matrix showed stage C cannot
  see the art half — `recordGamePlay` fires after import but before
  `transitionToScene`, so raster and `create` happen after every C reading
  (both builds measured all-warm, D-less). The extension is app-untouched
  (in-page rAF sampling, no game-code hooks), the budget gate stays on C,
  and the verdict rests on the before/after D comparison. Touches-covered
  (`scripts/measure-first-tap.mjs`).
- D4 (primary): shell figures corrected to **on-disk** sizes (148.82 /
  148.86 kB, matching `validate-bundle`'s 148.9 kB reading); the mid-phase
  build-log figures (152.39 / 152.43 kB) are noted as superseded in the
  verdict. The 0.04 kB delta — the isolation argument — is identical.

## For the primary (unblock runbook) — executed

B1 done via `Move-Item` (`dist/` → `.conductor/evidence/dist-art`,
baseline build → `.conductor/evidence/dist-base`, two-line patch reverted,
`dist-art` restored to `dist/`); B2 done as sixteen headed runs (matrix
above, alternating builds, + 3 inert); B3 done (entry appended after the
2026-10-27 chunk-prewarm entry, exact text as handed off).

## Notes

- P3.T1.1 method follows the prior track's proven pattern (same warm-aware
  rig, same settles, same inert control, median-of-three, alternating
  builds); baseline construction (D1) kept the 0.04 kB shell delta proving
  isolation. The rig's stage-D extension (D3) was validated by its own
  differential: baseline chunk-warm taps still pay 40–190 ms D at 6 s
  settle while art-warm taps pay ~0.
- P3.T1.2 verdict section now carries measured C/D tables and the AC-6
  PASS: worst fully-cold tap 332.6 ms (Find the Word, median of three).
- P3.T2.1 TDD §4.8 follows the §4.7 body-only pattern (no Contents change —
  §4.7 itself has no TOC entry); `validate-docs` 6/6 confirms no count/link
  drift (126 files / 2,781 tests cited consistently).
- Task docs commits: `cd256b23` (TDD §4.8) + `5fbd0854` (verdict skeleton);
  primary task commits below add the rig extension, the measured verdict,
  and the tech-stack entry.

## Primary verification

Primary ran the exact phase gate on the final tree (rig extension + measured
verdict + tech-stack entry):

- `pnpm check` → exit 0, 260 files clean. `pnpm typecheck` → exit 0.
- `pnpm test -- --run` → exit 0, 126 files / 2,781 tests.
- `pnpm test:coverage` → exit 0; 97.75 / 91.76 / 96.88 / 98.70 — all gates held.
- `pnpm build` + `validate-bundle` → PASS (shell entry 148.9 kB ≤ 200 kB).
  `validate-pwa` → 16/16. `validate-docs` → 6/6.
- Headed evidence: sixteen runs, same host, alternating builds — AC-6
  satisfied (worst fully-cold median 332.6 ms ≤ 400 ms), D differential
  shows the art queue removing 40–190 ms per game at 6 s settle, no chunk
  regression (warm C band identical across builds).
- Result: **verified**.
