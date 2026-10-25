# Phase 2 Verification — Retire the legacy load/save pair

- **Track:** `20261025-storage-schema-version` — Storage Schema Version (chore, high)
- **Phase:** 2
- **Date:** 2026-10-25
- **Branch:** `chore/20261025-storage-schema-version`
- **Phase base:** `bfb1cce65f8da96a7f82d7f7c24d435a5dd14492`
- **Head:** `e1d6aa00` (+ follow-up commit for a biome import-order fix, see commands table; evidence commit follows this file)
- **Result:** **verified** — every step of the verification chain ran green. `node scripts/validate-docs.js` was initially denied by the sandbox (permission denied, not retried per brief) and was run by the primary after handoff, passing with exit 0; the full 8-layer chain is green.

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| (chain) | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | denied | Sandbox denied the chained command (`Permission denied: shell`); per brief fallback, steps were run individually in the same order below |
| static | `pnpm check` | 0 (2nd run) | First run: exit 1 with 2 errors from the new `ProfilesOverlay.test.ts` import line (organizeImports + line width) — fixed in commit `style(tests)`. Second run clean: 1 pre-existing warning (`musicalMemoryScene.test.ts:294` non-null assertion) + 1 pre-existing biome schema-version info, both per phase brief |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| unit | `pnpm test -- --run` | 0 | 121 files / 2673 tests, all pass (same counts as phase base) |
| coverage | `pnpm test:coverage` | 0 | statements 97.83% (gate 90), branches 91.62% (gate 85), functions 96.78% (gate 88), lines 98.75% (gate 95) — all above gates |
| build-artifact | `pnpm build` | 0 | vite build ok, 343 modules; PWA precache 53 entries |
| build-artifact | `node scripts/validate-bundle.js` | 0 | shell entry `index-Dfd1Tuhi.js` = 138.7 kB (≤ 200 kB); vendor chunk present |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| docs | `node scripts/validate-docs.js` | 0 | passed — run by primary after sandbox denial, output handed back: "All document validation checks passed!" |

## Acceptance criteria

### AC-4 — grep proof of retirement

Grep 1 — no `load`/`save` exports remain in `src/utils/storage.ts` (pattern `export (function|const) (load|save)\b` over `src/**/*.ts`):

```
No matches found
```

Grep 2 — no bare `load`/`save` import entries anywhere (pattern `^\s+(load|save),?$` over `src/**/*.ts`, covers multi-line import blocks):

```
No matches found
```

Grep 3 — all import sites of `utils/storage` list granular API only: 77 import lines returned for `from "[^"]*utils/storage"`; none contains `load` or `save` (single-line imports inspected verbatim; multi-line blocks covered by Grep 2). Representative lines:

```
src\audio\AudioManager.ts:      import { getSettings, updateSettings } from "../utils/storage";
src\game\hub\stickerShelf.ts:   import { hasSticker } from "../../utils/storage";
src\components\ProfileChip.ts:  import { getActiveProfile, getProfiles, switchProfile } from "../utils/storage";
src\scenes\GameSceneBase.ts:    } from "../utils/storage";   (multi-line block — clean per Grep 2)
```

Grep 4 — every remaining `AppStorage` reference is the v1 migration input (pattern `AppStorage` over `src/**/*.ts`, 13 matches, verbatim):

```
src\__tests__\utils\storage.test.ts:      Line 5:   import type { AppStorage, GameId } from "../../types";
src\__tests__\utils\storage.test.ts:      Line 398: it("migrates a v1 AppStorage save: its stickers become the active profile's and its settings are global", () => {
src\__tests__\utils\storage.test.ts:      Line 399:   const data: AppStorage = {
src\types\index.ts:                        Line 83:  * one-time v1→v2 migration input: `migrateV1` accepts a `Partial<AppStorage>`
src\types\index.ts:                        Line 87:  export interface AppStorage {
src\utils\storage.ts:                      Line 27:    AppStorage,
src\utils\storage.ts:                      Line 87:  function readV1(): Partial<AppStorage> | null {
src\utils\storage.ts:                      Line 91:    return JSON.parse(raw) as Partial<AppStorage>;
src\__tests__\game\profileLogic.test.ts:   Line 12:  import type { AppStorage, AvatarId, GameId, ProfileV2, StickerData } from "../../types";
src\__tests__\game\profileLogic.test.ts:   Line 17:  function v1Save(overrides: Partial<AppStorage> = {}): Partial<AppStorage> {
src\__tests__\game\profileLogic.test.ts:   Line 125:    { stickers: null, settings: null } as unknown as Partial<AppStorage>,
src\game\profileLogic.ts:                  Line 2:     AppStorage,
src\game\profileLogic.ts:                  Line 60:    v1: Partial<AppStorage> | null,
```

All 13 references are: the definition + its migration-input doc comment (`types/index.ts`), `migrateV1`'s parameter (`profileLogic.ts`), `readV1`'s parse target (`storage.ts`), and v1-save fixtures in the two test files. No live read/write usage remains.

### Supporting tests

- `src/__tests__/utils/storage.test.ts` — `describe("v1 migration input") > "migrates a v1 AppStorage save: its stickers become the active profile's and its settings are global"` (line ~398): the former `describe("save")` round-trip test, now staged as a v1 save on `V1_KEY` with the same `AppStorage` literal and the same assertions (migrated payload stickers/earnedAt on the active profile, `settings.bgmEnabled === false`, readback via granular API).
- `"preserves progress across sticker and settings writes and resetProgress"` (line ~872 region): former `save()`-based mutation now expressed via `earnSticker` + `updateSettings`; identical progress assertions (plays/wins/correct/wrong preserved; shape-sorter unearned after reset).
- `"writes update the cached state (write-through)"` (line ~1111 region): former `save()` write-through test via `earnSticker` + `updateSettings`; same assertions.
- `src/__tests__/game/profileLogic.test.ts` — unchanged; its `AppStorage` usages (`v1Save` helper line 17, malformed cast line 125) were already `Partial<AppStorage>` migration-input usage.
- Full regression: 121 files / 2673 tests pass.

## FR-5 mapping

| FR-5 clause | Status |
|---|---|
| `load()`/`save()` exports removed | Done — Grep 1 |
| `hasSticker` / `getSettings` read through the granular path (`getActiveProfile()` / `ensureV2()`) | Done — `src/utils/storage.ts` |
| `AppStorage` remains only as the migration input type | Done — Grep 4; doc comment in `types/index.ts` states the single role |

## NFR status

- **NFR-1** (no kid-visible change, no data loss): satisfied — A3 honoured verbatim: `V1_KEY`, `readV1()` and `migrateV1` untouched (v1 key/read path unchanged); removal is pure public-surface cleanup; full suite green.
- **NFR-2** (full verification chain, coverage gates): satisfied — all 8 layers green (see commands table); gates cleared with margin (statements 97.83/90, branches 91.62/85, functions 96.78/88, lines 98.75/95).
- **NFR-3** (bundle gate): satisfied — shell entry 138.7 kB ≤ 200 kB; size roughly neutral vs phase base.

## Deviations

- `src/__tests__/audio/AudioManager.test.ts`, `src/__tests__/components/SettingsPanel.test.ts`, `src/__tests__/components/settings/ProfilesOverlay.test.ts`, `src/__tests__/components/settings/ProgressOverlay.test.ts`, `src/__tests__/components/settings/VoiceRow.test.ts`, `src/__tests__/components/settings/ResetModal.test.ts` — outside the brief's `Touches` list. Reason: each imported the now-removed `load` export (test-only callers the phase-base survey's production-file scan did not list); `pnpm typecheck` / `pnpm test` cannot pass without redirecting them. All were redirected to the granular API (`getActiveProfile()` / `getSettings()` / `hasSticker()`), keeping behaviour assertions unchanged; the `beforeEach` migration primers in the four settings-overlay tests now call `getActiveProfile()` instead of bare `load()`.

## Notes

- One non-`Touches` edit was biome-mandated after the deviation edits: the `ProfilesOverlay.test.ts` storage import needed re-sorting/multi-lining to satisfy `pnpm check` (commit `style(tests)`).
- The phase-1-landed migration test in storage.test.ts (`migrates a v1 AppStorage save …`) initially asserted the stored v2 payload before any granular read had triggered the migration; fixed by reading via the granular API before the stored-payload assertions (caught by the targeted run, fixed once).
- The docs-validator step was initially denied by the sandbox; the primary ran it after handoff (exit 0, "All document validation checks passed!"), completing the 8-layer green chain and confirming this phase as verified.
