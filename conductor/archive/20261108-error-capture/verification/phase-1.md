# Phase 1 verification — the log, as a pure module

Track `20261108-error-capture` · branch `feat/20261108-error-capture`
Base `1f20e52de55c099608612a45495251410359906b` (confirmed with `git rev-parse HEAD`
before the first edit).

## Commands

The gate was run as eight separate commands rather than one `&&` chain (this
harness forbids shell chaining); every one exited 0, in this order.

| Command | Exit | The number that mattered |
| --- | --- | --- |
| `pnpm check` | 0 | 309 files checked, no fixes needed |
| `pnpm typecheck` | 0 | both projects (`tsc --noEmit`, then `-p e2e/tsconfig.json`) clean |
| `pnpm test -- --run` | 0 | **141 files / 3,103 tests** (was 140 / 3,069; the new file holds 34) |
| `pnpm test:coverage` | 0 | statements 97.33, branches 91.82, functions 96.30, lines 98.30 |
| `pnpm build` | 0 | 367 modules; shell entry `index-DI9SmdDG.js` 172.30 kB raw |
| `node scripts/validate-bundle.js` | 0 | shell entry **168.3 kB** (<= 200 kB), phaser vendor chunk 1335.0 kB |
| `node scripts/validate-pwa.js` | 0 | 16 checks passed, 47 chunks / 47 precached |
| `node scripts/validate-docs.js` | 0 | 5 checks passed, including the derived suite truth |

`src/utils/diagnostics.ts` is at 100 % statements, branches, functions and lines
(no row in the coverage table means fully covered). Thresholds are 95 / 88 / 85 / 90.

## Shape

`src/utils/diagnostics.ts` exports exactly the briefed surface, and nothing else:

```ts
export const MAX_ENTRIES = 20;
export const MAX_STACK_CHARS = 400;
export type CrashKind;                       // re-exported from ../types
export type CrashEntry;                      // re-exported from ../types
export interface DiagnosticsEnvironment;     // appVersion, userAgent, viewport,
                                             // profileCount, playTime, degraded
export function toCrashEntry(kind, reason, now): CrashEntry;
export function appendCrash(existing, entry): CrashEntry[];
export function normalizeDiagnostics(raw): CrashEntry[];
export function buildDiagnosticsReport(entries, environment, now): string;
```

`CrashKind` and `CrashEntry` are declared in `src/types/index.ts`, because Phase 2
puts `CrashEntry[]` into the save and the save's types live there. They are
re-exported from `diagnostics.ts` as types so the module's documented surface is
the one import a caller needs, with one declaration rather than two.

The report text is built in one place for two reasons. The file a parent emails
and the file the tests assert have to be the same bytes, so no call site may
rearrange the header, the count line or the newest-first order; and the four
sections that are easy to get subtly wrong together (the empty log, the singular
`crash`, the degraded sentence, a stack that already contains newlines) are then
decided once, in one function, with one fixture. The header takes every
environment field as an argument, which is also what lets the purity test forbid
the module from reading any of them itself.

Purity: the module names no browser global and reads no clock. `now: Date` is an
argument everywhere; `at` is `now.toISOString()`.

## Acceptance

**AC-1 — five coercion cases, exact messages.** `toCrashEntry — whatever arrives
becomes a readable entry (AC-1)`: a twelve-case table (`an Error with a message`,
`a rejected string`, `a rejection with no reason`, `a rejection with a null
reason`, `a throw with no value`, `a thrown plain object with a message`, `a
thrown object with no message`, `a thrown object whose message is not text`, `a
thrown object whose message is empty`, `a thrown value that cannot be
serialised`, `a rejected number`, `a rejected empty string`), each asserting
`at`, `kind`, the exact message and stack presence. Plus `names an Error that has
no message of its own` (`new Error("")` reads `Error`), `reads an Error that
carries no stack as an entry with no stack`, and `trims a long stack to its first
four hundred characters, from the front` (a 1,200-character stack comes back at
exactly `MAX_STACK_CHARS` and starts with the original message).

**AC-2 — 25 appends keep the newest 20.** `appendCrash — the newest twenty,
oldest first out (AC-2)`: `keeps exactly the newest twenty of twenty-five, in
order` (length 20, `buffer[0]` is the sixth appended, `buffer[19]` the
twenty-fifth, messages equal `appended.slice(5)`), `returns a new array and
leaves the caller's alone`, and `keeps the serialised buffer bounded at the
maximum stack length (NFR-1)`.

**AC-3 — an absent, pre-track or hand-edited log.** `normalizeDiagnostics — an
absent, pre-track or hand-edited log (AC-3)`: `reads anything that is not an
array as an empty log` (`undefined`, `null`, `{}`, `"[]"`, `42`, `true`), `keeps
an empty array empty`, `drops every entry it cannot read, and keeps the two it
can` (nine unreadable shapes around two good entries), `coerces a non-string
stack to an empty one rather than dropping the entry`, `keeps only the newest
twenty of a longer stored log`.

**P1.T4.1 — the module stays pure.** `the module is pure (P1.T4.1)` reads
`src/utils/diagnostics.ts` through `?raw` and asserts it matches none of the five
forbidden patterns (browser global followed by a member, `Blob`, `URL.`,
`Date.now(`, `new Date()` with no argument). The comment beside it records that
the allowlist question — which module may name which global — belongs to the
Phase 2 guard test.

**Report text.** `buildDiagnosticsReport — the file a parent downloads`: `writes
the header, then the entries newest-first` (the whole text built in the test and
compared, not a snapshot file), `says so in one sentence when nothing has
crashed`, `carries every environment field and the degraded sentence`, `says one
crash, not one crashes`, `keeps a multi-line stack as the throw wrote it`.

## Deviations

1. **`src/types/index.ts` widened** with `CrashKind` and `CrashEntry` (outside
   the plan's Phase 1 `Touches`, required by the brief so Phase 2 can put
   `CrashEntry[]` into `Settings`). No existing type or export changed.
2. **`CrashKind` / `CrashEntry` are re-exported from `diagnostics.ts`** as types,
   so the module exports the documented names while the declarations live in
   `src/types/index.ts` once. Nothing else about the surface differs.
3. **Count claims refreshed** in `README.md` (3,069 / 140 → 3,103 / 141),
   `docs/TDD.md` (two places) and `docs/perf-baseline.md`. The TDD `utils/` tree
   count moved 16 → 17 with `diagnostics.ts` listed, because that line is the
   source of the count. No other figure was restated.
4. **NFR-1's "under 4 kB" cannot be met, and the test says so.** Twenty entries
   at 400 characters of stack each are 8,000 characters of stack alone; the
   serialised buffer measures **9,612 bytes** on this machine. The test therefore
   asserts the bound that follows from the constants
   (`MAX_ENTRIES * (MAX_STACK_CHARS + 200)` = 12,000) and prints the measured
   number in the failure message, with the arithmetic recorded in a comment. The
   spec's figure needs a smaller `MAX_STACK_CHARS`, a smaller `MAX_ENTRIES`, or a
   different number — that is a spec decision, not a code one.
5. **Coverage percentages in `docs/TDD.md` and `docs/perf-baseline.md` were left
   untouched**, as the brief instructed. They are now slightly stale: this run
   measures branches 91.82 (was 91.67), functions 96.30 (was 96.28), lines 98.30
   (was 98.29), statements 97.33 (unchanged). `validate-docs` does not guard
   them.
6. **The full gate ran as eight commands, not one `&&` chain** — the harness
   denies chaining. Order and results are in `## Commands`.

## Notes

- `normalizeDiagnostics` accepts any non-empty string `at`, not a parseable
  timestamp. Entries are shown, never sorted or compared, so a hand-edited
  timestamp is harmless; the shape check is what keeps a foreign payload out.
- A thrown object whose `message` is `""` or not a string is serialised instead,
  so `{ message: "" }` reads `{"message":""}` rather than an empty line.
- `JSON.stringify` is typed `string | undefined`; the module casts because an
  object always serialises, and the `try` around it is what makes a circular
  thrown value read `An unreadable thrown value` instead of throwing inside an
  error handler.
- The purity test imports the source directly (`../../utils/diagnostics.ts?raw`)
  rather than through `import.meta.glob` as the guard test does; both typecheck
  under `vite/client`, and a direct import fails loudly if the path is renamed.
- For Phase 2: the handler seam should call
  `toCrashEntry(kind, reason, new Date())`, then `appendCrash(stored, entry)`,
  then write at `SCHEMA_VERSION` 1 with `normalizeDiagnostics` as the read path.
  The module deliberately knows nothing about `Settings`, storage or degradation.


## Primary verification

Verified 2026-11-08 by the primary agent, independently of the executor. Phase base
`1f20e52de55c099608612a45495251410359906b`, head `6bf3ca51` (three commits, no merges).

| Check | Command | Result |
| --- | --- | --- |
| Tree | `git status --porcelain` | clean apart from this evidence directory |
| Scope | `git diff --stat 1f20e52d..HEAD` | 6 files, +593/−5 — the module, its test, the type addition, three count refreshes |
| Static | `pnpm check` | 309 files, no findings |
| Types | `pnpm typecheck` | both programs, exit 0 |
| Unit | `CI=true pnpm test -- --run` | **141 files / 3,103 tests**, 19.04 s |
| Coverage | `pnpm test:coverage` | **97.33 / 91.82 / 96.30 / 98.30** (6433/6609, 1933/2105, 1409/1463, 5981/6084) |
| Build | `pnpm build` | `dist/sw.js` and the workbox runtime emitted |
| Bundle | `node scripts/validate-bundle.js` | PASS, shell `index-DI9SmdDG.js` at **168.3 kB** — unchanged |
| PWA | `node scripts/validate-pwa.js` | 16 passed / 0 failed |
| Documents | `node scripts/validate-docs.js` | 5 passed / 0 failed |

### A requirement was wrong, and the code said so

The executor reported that NFR-1's "under 4 kB of JSON" cannot hold, and it is right:
twenty entries at 400 characters of stack are 8,000 characters of stack before a single
timestamp, and twenty maximum-length entries serialise to **9,612 bytes**. The test pins
`MAX_ENTRIES × (MAX_STACK_CHARS + 200)` = 12,000 instead, and says so in a comment and in
its failure message rather than quietly asserting something weaker.

The primary accepted the arithmetic and corrected the requirement, not the test: NFR-1 and
AC-2 now carry the 12,000-byte ceiling that follows from the constants, with the measurement
beside it, plus a dated amendment recording that the original figure was written before the
arithmetic and why shrinking the stack would have been the wrong trade (it would cut the
frames that make a trace worth reading). A bound is only useful if it is true.

### The shell entry did not move, and that is the correct result

`validate-bundle` still reports `index-DI9SmdDG.js` at 168.3 kB — byte-identical to before
this phase. `diagnostics.ts` is a pure module that nothing imports yet, so the bundler drops
it entirely. That is the property Phase 2 will change, and this number is the baseline it
must be measured against.

### Coverage figures refreshed to the observed run

The executor's evidence recorded the new figures but left the two live documents at the
previous suite's numbers (91.67 / 96.28 / 98.29) because the brief restricted it to counts.
The primary refreshed both `docs/TDD.md` and `docs/perf-baseline.md` to the numbers this run
produced, then re-ran `validate-docs` and `pnpm check` green.

### What was read, not trusted

- `toCrashEntry` never throws: every coercion ends in a string, and the `JSON.stringify`
  fallback is wrapped, because an error handler that can throw turns one crash into two.
- `appendCrash` returns a new array and drops from the head, so the newest entry is last.
- `normalizeDiagnostics` accepts only arrays, keeps entries with a non-empty `at` and
  `message` and a known `kind`, and re-caps — which is what makes a pre-track payload load
  at schema version 1 without a migration.
- The purity test reads the module's own source with `?raw` and asserts no browser global and
  no clock read. It is a direct import rather than a glob so a rename fails loudly; both
  forms typecheck under `vite/client`.

