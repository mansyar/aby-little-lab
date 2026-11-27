# Add game 25: a Repeat Machine for loops

## Summary

Adds the 25th game — Repeat Machine (author-then-watch loop play: pick an
action + count 2–4, watch the machine replay it; wrong counts visibly replay
then retry) — with 6-round sessions, scoring, Thinking-group hub placement,
progress rows, a four-engine E2E journey, and docs at 25 games.

## Phases

- P1 `8106bb59`: pure `repeatMachineLogic` + 25 seeded tests (ROUND_SPECS
  2,2,3,3,4,4, exact-N runProgram)
- P2 `cad06d91` + `415ad5de`: `RepeatMachineScene`, 25th-game wiring
  (registry, sceneRegistry, e2eBridge, audio identity, hub art/prewarm,
  tile+sticker keys), repeat-machine journey; texture full cap re-baselined
  320→322 (two copied-shell SVGs under unique keys — reuse, no new design)
- P3 `a1fa6a59`: README/PRD/TDD/changelog/perf-baseline at 25 games plus
  validator tripwire fixes
- R1 `e6e75df5`: review fixes (registry/grid comments, shared textStyle,
  README counts)

## Tests

164 files / 3529 tests green; coverage 96.94 / 90.36 / 96.35 / 98.09
(gates 90/85/88/95). Full gate green: check, typecheck, build, bundle,
module-size (warn-only), textures 76.42/321.00/0.238 vs 80/322/0.5,
PWA 16/0, docs 5/0. Integrated evidence:
`conductor/archive/20261128-repeat-machine/verification/integrated.md`.

## Verification

Per-phase evidence in `verification/{phase-1,phase-2,phase-3,phase-R1}.md`;
review `review.md` — PASS WITH FINDINGS (round 2: F2–F5 fixed, F1 open).

## How to land

Squash or merge; no migrations, no new deps, no storage changes. No secrets
touched.

## Follow-ups

- #108 (RM-11): wide hub grid overflows with 25th tile in default All view —
  game reachable via Thinking chip; needs product decision on overflow rule.
