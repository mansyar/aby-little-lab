# Integrated verification placeholder

## Final range

`04f1463113a546f9524a125b2c974af59ebcc6d8..HEAD`

Phase 3 started from `c86ad34a` on
`chore/20261124-first-tap-p95-baseline`. The full-track range above includes the
measurement helper and documentation work plus the reviewed stacked dependency.

## Reviewed stacked dependency

`20261124-word-match-first-tap` / PR #97 was reviewed and merged at
`025b037f`. Its selective preload fix remains untouched by this track's Phase 3;
the resumed baseline was measured after that dependency landed.

## Evidence index

- [Phase 1 — p95 helper, declaration, guard test and measurement integration](phase-1.md)
- [Resumed Phase 2 — pre-fix history and passing headed cold-control evidence](phase-2.md)
- [Phase 3 — baseline publication, component checks and scope audit](phase-3.md)
- [Raw headed cold-control JSON](first-tap-headed.json)

The natural 1 cold / 49 warm run and the approved fallback are disclosed in the
Phase 2 and Phase 3 evidence. The failed 507.4 ms Find the Word pre-fix result is
preserved in Phase 2, while the committed raw JSON holds the resumed 50-cold
passing result.

## Integrated verification (Section 5)

Primary ran the complete configured `verify_phase` chain on the final Phase 3
tree. Result: `PHASE3_VERIFY_PHASE_EXIT=0`.

| Layer | Result |
| --- | --- |
| `pnpm check` | 373 files checked, no fixes. |
| `pnpm typecheck` | Application and E2E clean. |
| `pnpm test -- --run` | 158 files / 3,393 tests passed. |
| `pnpm test:coverage` | Statements 97.08%, branches 90.92%, functions 96.35%, lines 98.23%; all fixed gates clear. |
| `pnpm build` | Vite 8.3.8, 491 modules, shell `index-DcqZRslV.js` 197.99 kB / 50.39 kB gzip, 64 precache entries. |
| `node scripts/validate-bundle.js` | Shell 193.4 kB ≤200 kB. |
| `node scripts/validate-module-size.js` | 172 TypeScript modules, zero warnings. |
| `node scripts/validate-textures.js` | 319 SVGs; all tiered/full/ratio budgets pass. |
| `node scripts/validate-pwa.js` | 16 passed / 0 failed; 52 chunks precached. |
| `node scripts/validate-docs.js` | 5 passed / 0 failed. |

Headed performance evidence is the committed Phase 2 raw JSON: 50 cold / 0 warm
samples, 10 per game, aggregate cold p95 total 270.1 ms, Find the Word p95
249.6 ms, worst Shape Sorter 277.5 ms, every worst cold total ≤400 ms, and
`validate-boot` exit 0. The unchanged product gate is worst cold total ≤400 ms;
p95 remains report-only.

No boot-smoke condition is triggered by Phase 3 because it changes documentation
only. The reviewed Word Match production dependency remains exactly as merged in
PR #97. `package.json` and `pnpm-lock.yaml` are unchanged across the full track.

**Overall verdict: verified.**
