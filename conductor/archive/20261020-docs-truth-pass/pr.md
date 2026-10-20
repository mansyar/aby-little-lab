# Docs & Dead-Code Truth Pass

Makes the repository's prose describe the app that actually ships. No runtime
behaviour changes: the only source edits are two code comments, one deleted
orphan JSDoc block and one Vite import attribute.

Track: `20261020-docs-truth-pass` (chore, medium). Spec, plan, phase evidence and
the review record live under `conductor/archive/20261020-docs-truth-pass/`.

## What changed

| Phase | Scope | Outcome |
| --- | --- | --- |
| 1 | Measured counts, empty heading | `README.md` and `docs/TDD.md` now quote a real run — 2,305 tests across 110 files, verified 2026-10-20 — and name CI plus `vite.config.ts` as the authority. The empty `## Parental Controls` heading is gone. |
| 2 | README de-duplication | Nine platform and system sections collapsed from 107 lines to 58, each ending in links to the PRD or TDD section that owns the fact. Facts the docs lacked were written first: TDD §5.8 gained Typography and fonts, plus the CI, Docker and shell-budget numbers. |
| 3 | Per-game feedback and the roster | The PRD's 22 game specs each gained a `**Feedback.**` bullet (110 → 132 field bullets). Three stale README pool claims were dropped rather than carried, two PRD claims were corrected against their logic modules, and the README roster is now one line per game: 286 → 237 → 214 lines. |
| 4 | `conductor/product.md` current state | The adaptive sentence now matches `adaptiveLogic.ts` (10-tap window, 6-tap minimum, 0.9 up, 0.6 down, clamped bands, toggle honoured) and the hub line names the paged phone layout. Twelve other current-state claims were re-verified and left untouched; all 14 dated entries are byte-identical. |
| 5 | Code comments, dead JSDoc, Vite warning | `main.ts` no longer claims "7 game scenes" (it is 22) and `HubScene` no longer says "12 game tiles"; the six orphan JSDoc blocks in `SettingsPanel.ts` are deleted; `vite.config.ts` imports `package.json` with `with { type: "json" }` and the `configLoader` warning is gone from every gate; 14 `.gitkeep` markers were removed from directories that hold real files. |
| 6 | Ligne track closure | `drop-ligne-mascot_20261016` moved to `conductor/archive/` with `status: complete`, an archive note recording that the work landed in `755d575`, and a ledger line that points at the archive. |
| R1 | Review fixes | Shadow Match's snap ease corrected to `Cubic.out`, the Settings type size restored to TDD §5.8, Phase 6's checkpoint repointed at its work commit, the archived note's code spans repaired, and the coverage snapshot changed to a range. |

## Verification

Every phase ran the project gate (`pnpm check && pnpm typecheck && pnpm test --
--run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js &&
node scripts/validate-pwa.js`). Final run at head:

| Layer | Result |
| --- | --- |
| Biome | pass, one pre-existing `noNonNullAssertion` warning in `musicalMemoryScene.test.ts` |
| Typecheck | pass |
| Tests | 110 files, 2,305 tests |
| Coverage | statements 97.8 · branches 90.73 · functions 96.34 · lines 98.59 (thresholds 90 / 85 / 88 / 95) |
| Build | entry `index-*.js` 132.21 kB (129.1 KiB shell, 30.02 kB gzip), 41 chunks, 53 precache entries / 1,702.03 KiB |
| Bundle and PWA validators | pass |

Acceptance criteria AC-1 to AC-12 are mapped line by line in
`verification/integrated.md` §2. Review round 1 found three medium and three low
issues; all six are closed in `verification/phase-r1.md`, and the two accepted
residues are recorded in `verification/integrated.md` §6 — a stale
`navigation.test.ts:305` test title, and a dated `tech-stack.md:381` entry that
names the Ligne track's old path.

## Risk

Documentation and comments only, so the blast radius is prose. The one
behavioural file is `vite.config.ts`, where the import attribute changes how Node
loads the config, not how the app runs; the full gate plus both artifact
validators were re-run after it.

Rollback is a revert of the phase commits; nothing migrates and nothing is
persisted in the app.

## Follow-ups (not in this track)

- `src/__tests__/scenes/navigation.test.ts:305` still titles a test "creates 7
  game tiles".
- Real-device pass for Story Order's drag feel is still open from v1.20.0.
