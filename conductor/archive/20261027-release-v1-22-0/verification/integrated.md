# Integrated Verification — Release v1.22.0

- Track: 20261027-release-v1-22-0
- Date: 2026-10-27
- Branch: chore/20261027-release-v1-22-0
- Head: 7f2d9ca1 (review acceptance; release content identical to the gated state apart from reviewed notes-prose fixes)

## Result

Pass. The full 8-command gate ran green twice on the release state (subagent run at `420e925b`, primary independent re-run at `c70591bf`): `pnpm check` (260 files), `pnpm typecheck`, `pnpm test -- --run` (126 files / 2781 tests), `pnpm test:coverage` (97.75/91.76/96.88/98.70, above the 95/88/85/90 gate), `pnpm build`, `validate-bundle.js` (shell 148.9 kB ≤ 200 kB), `validate-pwa.js` (16/16), `validate-docs.js` (6/6). After the R1 notes-prose fixes (the only post-gate change, `.md` prose only, no code), the primary re-ran `node scripts/validate-docs.js` (6/6) and `pnpm check` (clean) at `122068af`.

## Phase linkage

- Phase 1 (version bump + notes): verified at `17c4acec`.
- Phase 2 P2.T1 (full gate): verified; P2.T2 (review + fixes): review `PASS WITH FINDINGS`, round 2, all 4 findings fixed. P2.T3 (PR/merge) and Phase 3 (tag + FINAL flip) remain.
- Cross-phase: R1 touched only `docs/release-notes-v1.22.0.md` prose; release diff vs `f44a3a91` (excluding `conductor/`) remains exactly `package.json`, `docs/release-notes-v1.22.0.md`, `README.md`.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| full gate | 8-command `verify_phase` chain | 0 | twice green (subagent + primary independent) |
| docs | `node scripts/validate-docs.js` | 0 | 6/6 post-R1 |
| lint | `pnpm check` | 0 | 260 files post-R1 |

## Acceptance

AC-1 (version `1.22.0`), AC-3 (gate green), AC-5 (device-pass gap recorded) fully evidenced. AC-2 (FINAL flip) and AC-4 (tag on origin) complete in Phase 3 post-merge by design.
