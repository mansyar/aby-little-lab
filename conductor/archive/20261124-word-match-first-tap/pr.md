## Summary

Find the Word now generates its deterministic six-round playthrough before preload and queues only the letters plus prompt assets that run can draw. Unused art groups remain empty, eliminating avoidable SVG rasterization while preserving seeded rounds, adaptive difficulty, prompts, cards, speech, input, completion and saves.

A fresh headed 50-cold five-game run passes the unchanged 400 ms gate: Find the Word p95 and worst are both 251.2 ms, and every other game is also below 400 ms. This branch is stacked on `chore/20261124-first-tap-p95-baseline`; the PR diff is scoped to the Find the Word fix.

## Track

- **ID:** `20261124-word-match-first-tap`
- **Type:** `bug`
- **Spec:** [`conductor/archive/20261124-word-match-first-tap/spec.md`](conductor/archive/20261124-word-match-first-tap/spec.md)
- **Plan:** [`conductor/archive/20261124-word-match-first-tap/plan.md`](conductor/archive/20261124-word-match-first-tap/plan.md)
- **Review:** [`conductor/archive/20261124-word-match-first-tap/review.md`](conductor/archive/20261124-word-match-first-tap/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Selective preload implementation | Queue only selected playthrough art | verified | `4ead5e0d` | Added pure selector, scene integration and deterministic regression tests. |
| 2: Headed performance proof | Prove 50 cold samples within 400 ms | verified | `f8a71706` | Find the Word p95/worst 251.2 ms; all five games pass. |
| 3: Baseline publication and integrated gate | Publish dated evidence and run full gate | verified | `d6cf5a17` | Added per-release refresh procedure; full `verify_phase` passed. |
| R1: Review Fixes | Clarify living suite counts in dated history | verified | `65144c59` | Closed the sole Low review finding without changing measurements. |

## Requirements

- [x] `FR-1` — Generate the deterministic playthrough before art selection.
- [x] `FR-2` — Preload only letters and selected prompt assets; no full unused groups.
- [x] `FR-3` — Preserve texture keys, tiers, prompts, cards, speech, input, adaptive shifts, completion and saves.
- [x] `FR-4` — Provide a pure deterministic selector with no Phaser/storage/DOM/network dependency.
- [x] `FR-5` — Commit headed 50-cold five-game raw JSON proving all worst totals <=400 ms.
- [x] `FR-6` — Publish the dated result, exact command, per-game table, raw evidence and refresh procedure.
- [x] `FR-7` — Run and record the full configured `verify_phase` chain.
- [x] `NFR-1` — Keep `package.json` and `pnpm-lock.yaml` byte-identical.
- [x] `NFR-2` — Limit production changes to `WordMatchScene.ts` and the small helper.
- [x] `NFR-3` — Keep the 400 ms gate and all coverage/build/PWA/docs thresholds unchanged.
- [x] `NFR-4` — Preserve save/schema, scene-flow, art, audio, speech, accessibility and child-facing behavior.
- [x] `NFR-5` — Keep module-size, bundle, PWA and docs guards green.
- [x] `NFR-6` — Remain deterministic and offline-first using local headed Chromium and Vite preview.
- [x] `AC-1` — Selector returns exactly the required keys with no duplicates or unused keys.
- [x] `AC-2` — Scene regression test proves only selected keys plus letters are queued.
- [x] `AC-3` — Tests prove identical seeded/adaptive/gameplay/completion/save behavior.
- [x] `AC-4` — Package/lock diff is empty and production scope is limited to the approved paths.
- [x] `AC-5` — Raw JSON contains 50 cold samples and every game is <=400 ms.
- [x] `AC-6` — Full `verify_phase` exits 0 and is recorded.
- [x] `AC-7` — Baseline docs publish the passing result and `validate-docs` reports 5/5.
- [x] `AC-8` — No headless substitution, gate weakening or scope expansion was used.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| unit | `pnpm test -- --run` | pass | 158 files / 3,393 tests |
| coverage | `pnpm test:coverage` | pass | Statements 97.10%, branches 90.96%, functions 96.35%, lines 98.23% |
| lint | `pnpm check` | pass | 373 files, no fixes |
| format | `pnpm exec biome format .` | pass | 373 files, no fixes |
| typecheck | `pnpm typecheck` | pass | App + E2E clean |
| build | `pnpm build` | pass | Vite 8.3.8; 491 modules; shell 197.99 kB |
| bundle | `node scripts/validate-bundle.js` | pass | 193.4 kB <= 200 kB |
| module-size | `node scripts/validate-module-size.js` | pass | 172 modules, zero warnings |
| textures | `node scripts/validate-textures.js` | pass | 319 SVGs, all budgets pass |
| PWA | `node scripts/validate-pwa.js` | pass | 16/16; 52 chunks precached |
| docs | `node scripts/validate-docs.js` | pass | 5/5 |
| integrated | full `verify_phase` chain | pass | `verification/integrated.md`; R1 final tree also exited 0 |
| performance | `TAP_HEADED=1 TAP_INERT_IDLE=1 node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10` | pass | 50 cold / 0 warm; Find the Word p95/worst 251.2 ms; all games <=400 ms |

Raw performance evidence: [`verification/first-tap-word-match.json`](conductor/archive/20261124-word-match-first-tap/verification/first-tap-word-match.json).

## Review

- **Verdict:** `PASS`
- **Rounds:** 2
- **Fixed:** 1 Low finding
- **Accepted/deferred:** 0

## Deviations and risks

- `src/__tests__/scenes/artDeclarations.test.ts` adds `wordMatchArt` to the non-art module allowlist so the static scanner recognizes the new pure helper. The literal seven-group declaration remains; unused groups are empty and queue no assets. No assertion or runtime gate was weakened.
- Several subagent verification commands were permission-denied; the primary ran the exact commands and recorded the outputs.
- The selector keeps unused groups in a fixed declaration shape for the static guard. Their `assets` arrays are empty, including `music`, so runtime preload work is limited to letters and selected prompts.
- No package, lockfile, save-schema, child-facing or other game-scene change.

## Follow-ups

- none

## Rollback

```bash
# Merge commit
git revert --no-edit -m 1 <merge-commit>
```

No data or schema migration is involved.
