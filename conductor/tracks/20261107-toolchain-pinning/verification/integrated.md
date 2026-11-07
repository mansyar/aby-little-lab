# Integrated verification — Toolchain Pinning

- Track: `20261107-toolchain-pinning`
- Date: 2026-11-07
- Branch: `chore/20261107-toolchain-pinning`
- Base: `b8d43ffee1e25716cc656450002ece7d9f4e230d`
- Head: `f85099b4` (plus this document)
- Result: **verified**

## Layers, run against the integrated tree

| Layer | Command | Result |
| --- | --- | --- |
| Static | `pnpm check` | 294 files, no findings |
| Types | `pnpm typecheck` | both programs clean |
| Unit | `CI=true pnpm test -- --run` | 134 files / 2,920 tests passed, 35.50 s |
| Coverage | `pnpm test:coverage` | statements 97.19 / branches 91.09 / functions 96.18 / lines 98.21 — gate 90 / 85 / 88 / 95 |
| Build | `pnpm build` | 59 precache entries (1751.05 KiB) |
| Bundle | `node scripts/validate-bundle.js` | phaser `phaser-B_vcVLyb.js` 1,335.0 kB; shell `index-CpDFSutQ.js` 153.6 kB ≤ 200 kB |
| PWA | `node scripts/validate-pwa.js` | 16 passed, 0 failed |
| Documents | `node scripts/validate-docs.js` | 5 passed, 0 failed |
| Image | `docker build -t aby-little-lab:toolchain .` | exit 0 in 36 s on `node:24-alpine`; image carries the same `dist/` shape |
| Clean install | `pnpm install --frozen-lockfile` after moving `node_modules` away | exit 0 in 21.4 s, `using pnpm v12.16.1` |

Coverage prints 97.19 / 91.09 on this run and 97.21 / 91.14 on the run recorded in Phase 3 — v8 instrumentation moves by a hundredth between runs of an unchanged tree. The documented figures are the Phase 3 pair; the gate is what matters and both clear it by a wide margin.

## Cross-phase checks

- **One declaration, every consumer.** `packageManager` and `engines` in `package.json` plus `.node-version`; the Dockerfile, both CI jobs and the README follow, and the guard proves they still do.
- **The guard has teeth.** Two mutations were captured and reverted: `.node-version` → `22` produced three failures (engine range, Dockerfile base, README prerequisites) and `FROM node:23` produced one. No probe survives in any commit.
- **The build works on the new base.** `node:24-alpine` ships Node v24.22.2 and Corepack 0.36.0, so the explicit `corepack prepare pnpm@12.16.1` is the mechanism rather than a fallback.
- **The lockfile owns its tool.** Declaring `packageManager` made pnpm 12 write `packageManagerDependencies: pnpm 12.16.1` and the `@pnpm/exe.*` platform set into `pnpm-lock.yaml`, `linux-x64-musl` included — the defect this track opened with ("the lockfile has no owner") is answered by the tool itself.
- **The dead artefacts are gone.** `pnpm-workspace.yaml` and `serve` (with 70 unique transitive packages) are removed; no tracked file outside Conductor state mentions either.
- **CI classification is fail-safe.** Documentation-only, code and an unknown base were all exercised in the image's own shell; the unknown base resolved to `code`, which is the expensive-but-safe direction.
- **No application behaviour changed.** No `src/` production file was touched. The only `src/` change is a new test file.

## Scope note

Phase Touches were `package.json`, `.node-version`, `pnpm-lock.yaml`, `Dockerfile`, `.github/workflows/ci.yml`, the guard test, `pnpm-workspace.yaml`, `conductor/tech-stack.md`, `docs/TDD.md`, `README.md` and the track's `verification/`.

Two paths were added with the primary's approval during the work:

- **`.dockerignore`** — the first real `docker build` failed on `.conductor/base-build/node_modules`: machine-owned scratch was inside the build context because the file was never excluded. Without this, no developer with Conductor state could build the image locally.
- **`docs/perf-baseline.md`** — the new test file moves the derived suite counts, and `validate-docs` fails any living document that disagrees, so the counts had to be refreshed for the gate to be reachable.

## What the track did not do

No release or tag (this changes how the app is built, not what it does); no dependency upgrades beyond removing `serve`; no CI matrix; no CSP — that is `20261110-edge-hardening`, the last Phase 1 track.

## Runtime note

The gates job for a documentation-only change now installs dependencies and runs `validate-docs`, which is roughly a minute against the previous full run; the browser job still starts a runner but executes no test. The first real GitHub run of both tiers arrives with this track's PR, where the final commit is conductor-only by construction.
