# Phase 1 Verification — 20261128-repeat-machine

- **Branch:** `feat/20261128-repeat-machine` (base `0cce36aa`)
- **Phase goal:** a tested, pure Repeat-N rule module: 2→4 target ramp across six rounds, action+count program authoring, exact-N run verification, and seeded determinism.
- **Status:** **blocked for final sign-off** — 8 of 10 gate commands ran green; `node scripts/validate-module-size.js` and `node scripts/validate-textures.js` were refused by the executor's shell permission layer (see Deviations).
- **TDD:** strict red → green. The red run of `pnpm test -- --run src/__tests__/game/repeatMachineLogic.test.ts` failed to resolve `../../game/repeatMachineLogic`; implementation was then written; the same suite passed. A second red occurred on the guidance-string assertion (`/action/i`), fixed by changing the malformed-program message to `"Pick an action first."`.

## Files changed

| File | Purpose |
| --- | --- |
| `src/game/repeatMachineLogic.ts` | New pure module: `ROUND_SPECS` (2,2,3,3,4,4), `buildRound`/`buildPlaythrough(rng)`, `programIssue`/`isValidCount`/`targetDots`, `runProgram`, `shiftedTarget`, `nextAttempt`, `scoreFor`, `isSessionComplete`. |
| `src/__tests__/game/repeatMachineLogic.test.ts` | New 25-test seeded suite: ramp, authoring, exact-N verification, wrong-count replay, retry, no-repeat/malformed guard, determinism, adaptive shift. |
| `README.md` | Suite-count snapshot refreshed: 3,492/162 → 3,517/163; verified date → 2026-11-28. |
| `docs/TDD.md` | Two count/date claims refreshed (§10.2 suite shape, §10.3 paired coverage row). |
| `docs/perf-baseline.md` | Five numeric suite-count claims refreshed (3,492/162 → 3,517/163). |

No scene, registry, hubGroups, e2e, `src/types/index.ts`, Conductor state or asset/dependency/schema/storage changes.

## Gate results

Exact gate from the run file:

```
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js
```

The chained form was refused by the shell permission layer, so each named command was run as an individual shell call.

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm check` | 0 | Clean (after `pnpm check --write` fixed the new test file's import ordering and one line wrap). |
| `pnpm typecheck` | 0 | Clean. |
| `pnpm test -- --run` | 0 | 163 files / 3,517 tests passed. |
| `pnpm test:coverage` | 0 | Statements 97.15 %, branches 91.06 %, functions 96.49 %, lines 98.24 % — all above gates (90/85/88/95). `repeatMachineLogic.ts`: 100 % stmts / 96.15 % branches / 100 % funcs / 100 % lines. |
| `pnpm build` | 0 | 496 modules; entry `dist/assets/index-BDbRmAgr.js` 190.32 kB (gzip 48.42 kB); 66 precache entries / 1889.89 KiB. Chunk-size warning is the pre-existing Phaser vendor chunk only. |
| `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present; shell entry 185.9 kB ≤ 200 kB. |
| `node scripts/validate-module-size.js` | — | **Permission denied: shell** (not executed). |
| `node scripts/validate-textures.js` | — | **Permission denied: shell** (not executed). |
| `node scripts/validate-pwa.js` | 0 | 16 passed / 0 failed; 54 chunks / 54 precached. |
| `node scripts/validate-docs.js` | 0 | 5 passed / 0 failed, including "living docs state the current test-suite truth". |

`pnpm check && pnpm typecheck` was also run as one permitted individual shell call and passed clean.

### Expected result of the two blocked commands

- `node scripts/validate-module-size.js` reads the guard source: it warns above 400 physical lines and fails above 600 for production `.ts` under `src` (excluding `src/__tests__`, e2e, `.d.ts`). The new module is ~200 lines, so the expected result is all checks passed with no new warning.
- `node scripts/validate-textures.js` enumerates `src/assets/svg/**/*.svg`. Phase 1 adds no assets, so the expected result is unchanged typical/full tier bytes and ratio, all checks passed.

## Acceptance mapping

| Requirement | Evidence |
| --- | --- |
| FR-1 action+count program | `Program`, `MOVE_ACTIONS`, `programIssue`, `isValidCount`; tests in "program authoring". |
| FR-2 exact-N replay | `runProgram` performs exactly `count` pairs; tests in "run verification". |
| FR-4 ramp 2→4 over six rounds | `ROUND_SPECS` = 2,2,3,3,4,4; tests in "target-count schedule". |
| FR-7 / AC-6 no-repeat / malformed guard | Missing action or out-of-range count returns guidance and zero performed pairs instead of throwing; tests in "program authoring" and "run verification". |
| NFR-2 seeded determinism | `buildRound`/`buildPlaythrough` take `Rng`; same-seed equality and different-seed inequality tested over seeds 1–40. |
| AC-1 wrong-count visible replay then retry | `runProgram` replays the full wrong count, `matched: false`, `won: false`; `nextAttempt` increments; score drops from 2 to 1. |
| AC-2 completion/scoring | `scoreFor` (2 first try / 1 retried / 0 loss), `isSessionComplete` requires all six wins — both tested. |
| AC-3 adaptive shift | `shiftedTarget` maps counts through the shared `shiftLadder` clamp; tested for −1/0/+1 and at ramp boundaries. |

## Deviations

1. **Count-only doc refresh (FR-17 precedent).** `README.md`, `docs/TDD.md` and `docs/perf-baseline.md` had to be refreshed in Phase 1 because `scripts/validate-docs.js` derives suite truth from a collect-only `vitest list` run and fails on stale count claims. Only numeric counts and one verified date were touched; all qualitative / coverage narrative sync remains Phase 3's scope.
2. **Chained gate command denied.** The exact chained command in the run file returned `Permission denied: shell`; each named command was run individually instead, with no validation skipped.
3. **Two validators denied.** `node scripts/validate-module-size.js` and `node scripts/validate-textures.js` returned `Permission denied: shell` both in a parallel batch and individually. They are read-only guards and neither touches Phase 1 files. They remain unexecuted rather than being worked around; the primary must run them to close the gate.
