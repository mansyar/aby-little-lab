# Integrated verification cross-reference — executor draft (P3.T6 only)

- Track: `20261126-release-v1-26-1`
- Phase: 3 — Release-candidate verification
- Date: 2026-11-26
- Branch: `chore/20261126-release-v1-26-1`
- Phase base: `6e0abbf7`
- Executor head: `26af8541`
- Result: **partial** — this file cross-references the P3.T6 fix-forward only; it is not a full integrated/exit-gate sign-off.

## What the executor verified locally

| Check | Command | Exit |
| --- | --- | --- |
| Focused unit suite (includes two new AudioManager regression tests) | `pnpm test -- --run src/__tests__/audio/AudioManager.test.ts` | 0 |
| Format/lint | `pnpm check` | 0 |
| Type checks (app + e2e) | `pnpm typecheck` | 0 |

Denied (reported, not worked around): `pnpm exec vitest run src/__tests__/audio/AudioManager.test.ts` — `Permission denied: shell`. Primary should run it if the file-only invocation is required as evidence.

## What remains primary-owned

- Exact `verify_phase` gate chain and any heavy verification commands.
- Sequential zero-retry browser matrix on all four projects and the boot/perf smoke measurements.
- Fresh authoritative PR CI result for AC-8 before merge/tag; **no green PR/merge/tag CI is claimed here**.
- Final integrated/phase-3 sign-off, `git -c core.whitespace=cr-at-eol diff --check`, and Conductor state updates.

See `verification/phase-3.md` for the reproduced defect, TDD sequence, raw counts, and scope constraints.
