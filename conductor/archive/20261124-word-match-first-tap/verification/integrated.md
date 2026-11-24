# Integrated verification — Phase 3

- Track: `20261124-word-match-first-tap`
- Phase: `3`
- Date: `2026-11-24`
- Branch: `fix/20261124-word-match-first-tap`
- Gate head commit: `b57f8cb7a4968e4cf2328f2572aadb6621c161d6`
- Final commit: `b57f8cb7a4968e4cf2328f2572aadb6621c161d6` (Phase 3 publication and evidence remain uncommitted for the primary)
- Verdict: `verified`

`INTEGRATED_GATE_EXIT=0`

The subagent's two permission-denied validators were re-run verbatim by the primary, and the complete configured `verify_phase` chain then passed on the final working tree.

## Full 10-command gate

| # | Command | Exit / state | Summary |
| ---: | --- | --- | --- |
| 1 | `node scripts/validate-docs.js` | 0 | 5/5 document checks passed. |
| 2 | `pnpm check` | 0 | 373 files checked; no fixes. |
| 3 | `pnpm typecheck` | 0 | App and E2E clean. |
| 4 | `pnpm test -- --run` | 0 | 158 files / 3,393 tests passed. |
| 5 | `pnpm test:coverage` | 0 | 97.08% statements, 90.92% branches, 96.35% functions, 98.23% lines. |
| 6 | `pnpm build` | 0 | Vite 8.3.8; 491 modules; shell 197.99 kB; 52 chunks; 64 precache entries. |
| 7 | `node scripts/validate-bundle.js` | 0 | Shell 193.4 kB <= 200 kB. |
| 8 | `node scripts/validate-module-size.js` | 0 | Primary re-run: 172 modules, zero warnings. |
| 9 | `node scripts/validate-textures.js` | 0 | Primary re-run: 319 SVGs; all texture budgets pass. |
| 10 | `node scripts/validate-pwa.js` | 0 | 16/16 checks passed; 52 chunks precached. |

Executed final chain:

```sh
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js
```

Every command exited 0 and the chain returned `INTEGRATED_GATE_EXIT=0`.

## Scope audit

- `git diff bba48c36..HEAD -- package.json pnpm-lock.yaml`: no output.
- `git diff --name-only bba48c36..HEAD -- src ":(exclude)src/__tests__/**"`: exactly `src/game/wordMatchArt.ts` and `src/scenes/WordMatchScene.ts`.
- Test-only `src` changes: `src/__tests__/game/wordMatchArt.test.ts`, `src/__tests__/scenes/artDeclarations.test.ts`, `src/__tests__/scenes/wordMatchScene.test.ts`.
- Phase 3 files: `docs/perf-baseline.md`, `verification/phase-3.md`, and this file. No source, test, config, package, lockfile, product doc or Conductor state change was made by Phase 3.

## Primary verification

The primary re-ran both subagent-denied validators verbatim, then executed the complete configured chain on the final working tree. Results: check 373 files; typecheck clean; 158 files / 3,393 tests; coverage statements 97.08%, branches 90.92%, functions 96.35%, lines 98.23%; build 491 modules, shell 197.99 kB / 50.39 kB gzip, 64 precache entries; bundle 193.4 kB <= 200 kB; module-size 172 with zero warnings; textures 319 passing; PWA 16/16 with 52 chunks; docs 5/5. `INTEGRATED_GATE_EXIT=0`. Scope audit remains clean: package/lockfiles unchanged; production changes limited to `src/game/wordMatchArt.ts` and `src/scenes/WordMatchScene.ts`.

**Integrated verdict: verified.**
