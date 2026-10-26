# Phase 5 Verification — Docs truth pass

**Track:** `20261027-dependency-majors` · **Phase:** 5 · **Branch:** `chore/20261027-dependency-majors` · **Phase base:** `1e211ec7` · **Date:** 2026-10-27

## Commands

| # | Command | Exit | Notes |
|---|---------|------|-------|
| 1 | `pnpm check` | 0 | 258 files checked; 1 pre-existing warning (`noNonNullAssertion`, `musicalMemoryScene.test.ts:296:22`), no fixes applied |
| 2 | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| 3 | `pnpm test -- --run` | 0 | vitest **v5.0.5** — **125 files / 2,729 tests passed** |
| 4 | `pnpm test:coverage` | 0 | 97.82/91.96/96.77/98.74 — denominators byte-identical to the 2026-10-26 snapshot (stmts 5493/5615, branches 1488/1618, funcs 1141/1179, lines 5116/5181) |
| 5 | `pnpm build` | 0 | vite **v8.3.5**, PWA plugin **v2.0.0**, 344 modules, precache **54 entries (1720.45 KiB)** |
| 6 | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present (1335.0 kB); shell entry 139.0 kB (≤ 200 kB) |
| 7 | `node scripts/validate-pwa.js` | 0 | 16 passed / 0 failed; 42 chunks, 42 precached |
| 8 | `node scripts/validate-docs.js` | 0 | **6 passed / 0 failed** (AC-6) |

The chain was run once, exactly as written in the brief, after the P5.T1 commit (`8610fc93`). `conductor/tech-stack.md` is not read by any command in the chain, so the gate result is independent of the pending prepared edit below.

## FR / AC

| Ref | Requirement | Verdict |
|-----|-------------|---------|
| FR-7 | Living docs state the new dependency truth + clearMocks policy; count-drift guard green | Done — `docs/TDD.md` (`8610fc93`) and `conductor/tech-stack.md` (`4630a71e`, applied by the primary from the prepared text below) |
| FR-8 | Every semantic change recorded | Recorded in Deviations/Notes |
| NFR-1 | Zero production-code change | Confirmed — this phase touched only `docs/TDD.md` (and would touch only `conductor/tech-stack.md`) |
| AC-6 | Docs state new versions; validate-docs exit 0 (6/6) | validate-docs 6/6 ✓; TDD.md states new versions ✓; tech-stack.md states them too (`4630a71e`, applied by the primary) |

## Tasks

| Task | Status | Evidence |
|------|--------|----------|
| P5.T1 — TDD dependency table + §10.1 additions | Done | Commit `8610fc93` (details below) |
| P5.T2 — tech-stack version table + quote block + Design Update | Done (primary-applied, `4630a71e`) | "Prepared edits" below |
| P5.T3 — coverage snapshot unchanged | Done | Recorded above (command 4); no edit made — snapshot's 2026-10-26 verification date remains true |
| P5.T4 — full verification chain | Done | Commands table, all 8 exit 0 |

## P5.T1 — files changed (`8610fc93`)

1. **Dependency table (~:91-101):** `Vite ^8.1.5 → ^8.3.5`, `vite-plugin-pwa ^1.3.0 → ^2.0.0`, `Vitest + @vitest/coverage-v8 ^4.1.10 → ^5.0.5`, `happy-dom ^18.0.1 → ^21.0.4`, `Biome ^2.5.5 → ^2.6.3`. `workbox-window ^7.4.1` and everything else unchanged.
2. **§10.1 (~:1015) additions** (inserted after the 20-s-guards sentence, before "Five shared helpers:"):
   - As-of sentence: suite runs on vitest 5.0.5 over happy-dom 21.0.4 as of the 2026-10-27 dependency-majors pass.
   - clearMocks policy: vitest 5 changed the default to `clearMocks: true` (call history cleared before every test, implementations kept); the project embraces the default with no escape hatch — `vite.config.ts` carries no `clearMocks` key — and the full suite passed its first vitest 5 run with zero test-file changes.
   - happy-dom: 21.0.4 disables CSS and IFrame loading by default (SSRF prevention); audit found zero suites needing a re-enable; suite markedly faster (~13–16 s vs ~32–37 s).
   - The pre-existing counts (125 files / 2,729 tests, measured 2026-10-26) and the seven `{ timeout: 120_000 }` sweep sentences were left untouched, per the brief.
3. **§1.3 (:121) — stale-truth fix beyond the brief's inventory:** the paragraph still claimed the biome `$schema` is "pinned to 2.5.5" with a schema-version info diagnostic on every run. Phase 1 refreshed the schema to 2.6.3 matching `package.json`'s `^2.6.3`, so FR-7's "living docs state the new truth" required updating it: the paragraph now states the 2.6.3 pin, that no info message fires, and that the 2.5.5-vs-2.5.10 drift was retired by the 2026-10-27 dependency-majors pass. Within `Touches`; recorded here per FR-8.

## P5.T3 — Coverage snapshot unchanged

Per the plan, the snapshot is refreshed only if shifted. It did not shift: the gate run reproduced **97.82 / 91.96 / 96.77 / 98.74** (stmts/branches/funcs/lines) with denominators **byte-identical** to the vitest 4 measurement recorded on 2026-10-26 (5493/5615, 1488/1618, 1141/1179, 5116/5181). No edit made to the snapshot; its 2026-10-26 verification date remains true.

## Prepared edits — `conductor/tech-stack.md` (P5.T2, permission-denied)

The `edit` tool call against `conductor/tech-stack.md` returned `Permission denied` (first and only attempt, not retried, per the standing rule). The EXACT intended diff text is below for the primary to apply.

**Edit 1 — version table (:9-12), four rows:**

```diff
-| **Build Tool** | Vite | 8.1.5 | Fast HMR, modern ESM bundling, plugin ecosystem |
+| **Build Tool** | Vite | 8.3.5 | Fast HMR, modern ESM bundling, plugin ecosystem |
-| **PWA** | vite-plugin-pwa | 1.3.0 | Auto-generates service worker + manifest; precache for offline play |
+| **PWA** | vite-plugin-pwa | 2.0.0 | Auto-generates service worker + manifest; precache for offline play |
-| **Testing** | Vitest | 4.1.10 | Vite-native, fast, Jest-compatible API, ESM support |
+| **Testing** | Vitest | 5.0.5 | Vite-native, fast, Jest-compatible API, ESM support |
-| **Linting/Formatting** | Biome | 2.5.5 | Fast all-in-one linter and formatter; zero config needed for sensible defaults |
+| **Linting/Formatting** | Biome | 2.6.3 | Fast all-in-one linter and formatter; zero config needed for sensible defaults |
```

**Edit 2 — `package.json` quote block (:30-35), six pins:**

```diff
-    "vite": "^8.1.5",
-    "vite-plugin-pwa": "^1.3.0",
-    "vitest": "^4.1.10",
-    "@vitest/coverage-v8": "^4.1.10",
-    "@biomejs/biome": "^2.5.5",
-    "happy-dom": "^18.0.1"
+    "vite": "^8.3.5",
+    "vite-plugin-pwa": "^2.0.0",
+    "vitest": "^5.0.5",
+    "@vitest/coverage-v8": "^5.0.5",
+    "@biomejs/biome": "^2.6.3",
+    "happy-dom": "^21.0.4"
```

**Edit 3 — Design Update blockquote, newest-first: insert immediately above the `> **2026-10-26 - Design Update (Docs Truth Pass + Count-Drift Guard):**` line (~:65), separated by a blank line on both sides:**

```diff
+- > **2026-10-27 - Design Update (Dependency Majors):** Five dev-dependency majors/minors landed — `@biomejs/biome` 2.5.5 → 2.6.3, `vite` 8.1.5 → 8.3.5, `vitest` + `@vitest/coverage-v8` 4.1.10 → 5.0.5 (exact pair), `happy-dom` 18.0.1 → 21.0.4, `vite-plugin-pwa` 1.3.0 → 2.0.0 (`workbox-window` stays ^7.4.1) — with the full 8-command verification gate green throughout and zero production-code change. Vitest 5's `clearMocks: true` default (call history cleared before every test, implementations kept) is embraced with no escape hatch in `vite.config.ts` — the full suite passed its first vitest 5 run with zero test-file changes; the count-drift guard is kept honest via `--no-staticParse`, because vitest 5's `list` AST-parses files by default and silently drops the 305 dynamically registered tests. happy-dom 21's CSS/IFrame-loading default-off (SSRF prevention) was audited: zero suites needed a re-enable, and the suite runs markedly faster (~13–16 s vs ~32–37 s). vite-plugin-pwa 2.0 needed zero config adaptation — precache byte-equivalent at 54 entries / 1,720.45 KiB (validate-pwa 16/0, 42/42 chunks precached). Node 24.16 local + CI Node 22 satisfy vitest 5's ≥ 22.12 engine requirement.
  > **2026-10-26 - Design Update (Docs Truth Pass + Count-Drift Guard):** …
```

**Finding vs brief:** the brief expected a `happy-dom` row in the version table below the shown rows. Native grep over `conductor/tech-stack.md` found exactly one `happy-dom` occurrence — line 35, the quote block (Edit 2). No happy-dom table row exists, so no table-row edit for it is needed.

## Deviations

None off-`Touches`. `docs/TDD.md` §1.3 (:121) stale `$schema` sentence update is beyond the brief's itemized inventory but within `Touches` and required by FR-7; recorded above.

## Blockers (resolved)

The executor's single dit call against `conductor/tech-stack.md` was permission-denied (not retried, per the standing rule). The primary applied Edits 1-3 from the prepared text below as commit 4630a71e; the row's expected end-state is met (table 8.3.5 / 2.0.0 / 5.0.5 / 2.6.3, quote block with all six pins including happy-dom ^21.0.4, and the 2026-10-27 Design Update blockquote newest-first).

## Notes

- Before → after (every version string): TDD table `^8.1.5→^8.3.5`, `^1.3.0→^2.0.0`, `^4.1.10→^5.0.5`, `^18.0.1→^21.0.4`, `^2.5.5→^2.6.3`; TDD §1.3 `$schema` 2.5.5→2.6.3 prose. tech-stack prepared: `8.1.5→8.3.5`, `1.3.0→2.0.0`, `4.1.10→5.0.5`, `2.5.5→2.6.3` (table) and `^8.1.5→^8.3.5`, `^1.3.0→^2.0.0`, `^4.1.10→^5.0.5`, `^4.1.10→^5.0.5`, `^2.5.5→^2.6.3`, `^18.0.1→^21.0.4` (quote block).
- `package.json` ground truth confirmed first: all six pins already at the new versions (Phases 1–4).
- Suite timing under the gate: 24.72 s standalone-style / 29.55 s coverage run — consistent with the Phase 3 happy-dom-21 speedup record.
- Commits: `8610fc93` (T1), evidence commit follows this file.

## Primary verification

- Worktree audit at acceptance: range `1e211ec7..HEAD` = 3 commits (`8610fc93` TDD, `0b05af30` evidence, `4630a71e` tech-stack), zero merges; `git diff --name-only` = exactly `docs/TDD.md` and `conductor/tech-stack.md` plus the evidence file - zero `src/`, zero scripts, zero config.
- The primary applied the three prepared tech-stack edits verbatim as `4630a71e`: version table rows (Vite 8.3.5, vite-plugin-pwa 2.0.0, Vitest 5.0.5, Biome 2.6.3), the package.json quote block (all six pins including `happy-dom ^21.0.4`; no separate happy-dom table row exists - the executor's grep confirmed), and the 2026-10-27 Design Update blockquote inserted newest-first above the 2026-10-26 entries.
- `node scripts/validate-docs.js` re-run after the tech-stack edit: all document validation checks passed (6/6).
- Full chain result carried from the executor's run (exit 0 on the same tree for every command that reads source; the tech-stack file is read by no chain command).
- The executor's disclosed deviation (TDD §1.3 biome-schema sentence, within Touches) audited: correct and minimal - the stale "pinned to 2.5.5" claim contradicted the Phase 1 schema refresh.

Primary verdict: **verified**.
