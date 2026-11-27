# Phase 3 verification — Synchronize product and engineering truth

Result: **verified** — the primary ran the exact unchanged gate and it exited 0 with
all ten checks passing; the four-engine Help journey passed 8/8 with unchanged saves
and zero retries, media capture passed and the whitespace check was clean. No
living-figure staleness remained: the docs already state the measured truth. AC-13
(docs truth) is proved by the edits below and AC-12's final gate confirmation is
complete. Historical records and gap boundaries remain explicit.

- Track: `20261127-parent-help-overlay`
- Phase: 3 (`P3.T1`–`P3.T5`)
- Date: 2026-11-28
- Branch: `feat/20261127-parent-help-overlay`
- Phase base: `37562c89aad0d5f504dd6b3cfff7192874d96f65`
- Head at inspection: uncommitted Phase 3 documentation work on the phase base; the
  executor's only commit is this finalized evidence file.
- Prior checkpoints: Phase 1 verified at `a8ec01d56d1d53445554c27e5f98b5d37cc09950`;
  Phase 2 verified/squashed at `99ff5572`, acceptance `a383a352`.

## Commands

| Command / action | Who ran it | Outcome |
| --- | --- | --- |
| Read/edit tool calls on the six allowed docs paths | executor | Six allowlisted files edited; no source, test, config, release-note, archived or Conductor-state file touched. |
| `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | primary (not run by executor) | **Exit 0** — Biome 385 files clean; app and E2E TypeScript clean; Vitest 162 files / 3,490 tests; coverage 97.1 / 91.09 / 96.35 / 98.19; Vite 496 modules; bundle guard pass; module-size 177 files with one warning (`gridBuilder.ts` 461 lines), pass; textures pass; PWA 16 passes / 0 failures; docs 5 passes / 0 failures. |
| Browser journey across four Playwright engines | primary (not run by executor) | 8/8 pass — both Help cases on Chromium, WebKit, Firefox and mobile Chromium; unchanged saves; zero retries. Media capture passed at 844×390; whitespace clean. |
| `git commit` | executor | Only this evidence file was committed after the primary's gate result; no source, test, config, docs or Conductor-state file was committed by the executor. |

## Acceptance criteria

| AC | Status in Phase 3 | Evidence |
| --- | --- | --- |
| AC-1 | Proved in Phase 2; docs now describe it | PRD §4.12, TDD §5.5, README Parental Lock & Touch UX. |
| AC-2 | Proved in Phase 2; docs now describe it | PRD §4.12 close paths, TDD §5.5 lifecycle, device checklist Focused manual checks. |
| AC-3 | Proved in Phase 2; docs now list the eight IDs in order | PRD §4.12, TDD §5.5 `HELP_TOPICS`, README topic list, changelog entry. |
| AC-4 | Proved in Phase 2; copy claims match shipped behaviour | PRD §4.12 read-only boundary, TDD §5.5 content separation. |
| AC-5 | Proved in Phase 2; copy claims match shipped behaviour | TDD §5.5, PRD §4.12; no longitudinal measurement claimed. |
| AC-6 | Proved in Phase 2; copy claims match shipped behaviour | TDD §5.5 content separation, PRD §4.12 no network claim. |
| AC-7 | Proved in Phase 2; copy claims match shipped behaviour | TDD §5.5 backup/restore copy boundary, PRD §4.12. |
| AC-8 | Proved in Phase 2; copy claims match shipped behaviour | TDD §5.5 diagnostics/install/update copy boundary, PRD §4.12. |
| AC-9 | Proved in Phase 2; docs describe boundaries | PRD §4.12, TDD §5.5 `e2eState()` boundary controls. |
| AC-10 | Proved in Phase 2 media pass at 844×390; manual hardware check still pending | TDD §5.5 geometry, device checklist Focused manual checks and unchanged physical-device gap. |
| AC-11 | Proved in Phase 2; docs describe the boundary | PRD §4.12, TDD §5.5 no storage/settings/download/audio/network/navigation calls, README. |
| AC-12 | **Complete — final gate confirmation** | Primary's unchanged exact gate exited 0 with all ten checks passing; four-engine Help journey 8/8 with unchanged saves and zero retries; media pass, docs 5/0, PWA 16/0. |
| AC-13 | **Proved here** | PRD §4.12 + Contents, TDD §5.5 + §3.6 + §10.5, changelog entry, README parent docs, device checklist focused checks; no historical release claim, archived evidence or release note changed. |

## Evidence

- `docs/PRD.md`: Contents bullet and new §4.12 **Parent Help** (eight topics, 2×4 menu,
  480×760 panel, 96×96 targets, 420–430 px wrapping, shared parental gate, both pages,
  close paths, read-only/offline boundary, no hardware or longitudinal claim). §7.2
  living figures refreshed to the primary's measurements: 186.5 kB via
  `validate-bundle.js` / 190.97 kB printed / 48.43 kB gzip, 54 chunks from 496 modules,
  `parent-help-CO1457oM.js` 19.38 kB / 7.35 kB gzip, 66 precache entries / 1890.52 KiB.
- `docs/TDD.md`: §5 module count now 24; §5.5 responsibility table gains `HelpButton.ts`,
  `helpContent.ts`, `HelpOverlay.ts` and prose on lifecycle, E2E state
  (`e2eHelpButton()`, `e2eHelp()`, `E2EHelpState`, `SettingsPanel.e2eOpen()` from
  `!destroyed`), content separation and regression protections (modal gesture ownership
  with `gestureBlocked()` captured at tile `pointerdown` in all three hub grid builders,
  matching-press tile-guard repairs across the seven named test files, and `HubScene`
  reading `settingsPanel?.e2eOpen()`). §3.6 table/paragraph and §10.5 project table,
  core-smoke roster and Chromium roster refreshed from measured output. §10.2/§10.3
  suite and coverage figures already matched the primary's output and were left intact.
- `README.md`: parent-feature paragraph with PRD §4.12 link; 24-file component tree
  including the Help modules; project table 28/20 and 10/7; seven-file smoke roster
  including `help` and the 8/4-engine 8/8 result; bundle paragraph gains the Help chunk
  and PWA entries. `Testing` (3,490 tests across 162 files) already matched measured
  truth; `Releases`, `Documentation` release-note lists and the dated 2026-11-25
  first-attempt results were left unchanged.
- `docs/changelog.md`: new dated `2026-11-28 — Parent Help` entry above the existing
  2026-11-27 entry; all older entries untouched.
- `docs/device-testing-checklist.md`: new `Focused manual checks — Parent Help` section
  before the physical-device result, with four checkboxes: open from both pages, all
  eight topics, close paths and no save change. The
  `Physical-device result for this track: PENDING — not run.` line and every historical
  execution record remain unchanged.
- Final gate record from the primary (exit 0): Biome 385 files clean, app and E2E
  TypeScript clean, Vitest 162 files / 3,490 tests, coverage 97.1 / 91.09 / 96.35 /
  98.19, Vite 496 modules, shell `index-BXMw_AwN.js` 190.97 kB printed / 48.43 kB gzip
  with the 186.5 kB guard pass, `parent-help-CO1457oM.js` 19.38 kB / 7.35 kB gzip,
  module-size 177 files with one warning (`gridBuilder.ts` 461 lines) still pass,
  textures pass, PWA 16 passes / 0 failures with 66 entries / 1890.52 KiB, docs 5
  passes / 0 failures, media capture pass and whitespace clean.
- Primary-measured figures carried into the docs: suite 162 files / 3,490 tests;
  coverage 97.1 % statements (8,091/8,332), 91.09 % branches (2,455/2,695),
  96.35 % functions (1,800/1,868), 98.19 % lines (7,500/7,638); 496 modules; shell
  `index-BXMw_AwN.js` 190.97 kB printed / 48.43 kB gzip and 186.5 kB via
  `validate-bundle.js` (200 kB guard pass); `parent-help-CO1457oM.js` 19.38 kB /
  7.35 kB gzip; 66 PWA entries / 1890.52 KiB; browser journey 8/8 across Chromium,
  WebKit, Firefox and mobile Chromium with unchanged saves and zero retries.

## Deviations

- None from the allowlist: only the six permitted paths were edited.
- `docs/perf-baseline.md` still carries older dated measurements; it was outside the
  Phase 3 allowlist and was already refreshed by the primary in Phase 2, so it was not
  edited here. Flag to the primary if a living-figure alignment check is desired.
- The dated 2026-11-25 first-attempt browser table in the device checklist and all
  historical release notes/evidence were intentionally left unchanged; they are dated
  records, not living figures.

## Notes

- Retention remains unexecuted; this phase makes no retention claim.
- Physical-device testing remains an accepted gap: the automated four-engine journey is
  engine evidence, not hardware validation, and the manual Help checks added to the
  checklist are explicitly not satisfied by it.
- Longitudinal adaptive band measurement remains unclaimed; Help describes the current
  snapshot only.
- The executor did not run the gate; the primary did, unchanged, with exit 0. The
  executor committed only this finalized evidence file after that result. AC-12 is
  complete and the phase result is `verified`.
