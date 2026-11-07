# Track `20261108-backup-restore` — 2026-11-08 — Phase R1 (review fixes), round 1 — verdict **CHANGES REQUIRED** — fourteen findings, all addressed

## Findings

| ID | Severity | Resolution |
| --- | --- | --- |
| F1 | High | `src/utils/storage.ts` — `saveV2` now returns whether the store accepted the bytes, a private `mutatePersisted` reports it, and `applyImport` returns `store-unavailable` when the write did not land, so the panel never reloads over a restore that lives only in memory. Tests in `storage.test.ts` for a refused import write and for a write-protected future-version payload. |
| F2 | High | `e2e/journeys/backup.spec.ts` — the seeder is `seedSaveWithTwoProfiles` and seeds `p1` and `p2`; the second context now asserts two profiles, four stickers across them, and each child's own progress and insight numbers from storage. `verification/phase-4.md`'s AC-3 row and prose corrected. |
| F3 | Medium | `src/__tests__/guard/backupDom.test.ts` — `crypto` added to `DOM_GLOBALS` (six globals now, no allowance), the allowance test now fails an allowance that stopped matching, and the guard's doc comment and shape probe say so. |
| F4 | Medium | `src/components/SettingsPanel.ts` — the close button is a field and `buildPage` ends with `children.bringToTop(this.closeButton)`, so page two's rebuild restores the invariant; the constructor's single call is gone. Test flips to page two and asserts the call order. |
| F5 | Medium | `src/components/settings/VoiceRow.ts` — `release()` drops the chip, preview and band handles, called from `clearPage()` before the objects are destroyed, and `voiceChanged()` returns early when they are gone. Test fires the platform's `voiceschanged` handler with page two open. |
| F6 | Medium | `src/utils/backupFormat.ts` — `readBackup` refuses a payload that is not a save (no `profiles` array) as `wrong-format`, so a verified `{}` cannot normalise into a default device. |
| F7 | Medium | `src/utils/backupFormat.ts` — `planImport` normalises once (`normalizeV2(incoming, moment)`) and uses that save in both modes, and the `MAX_PROFILES` check runs before the mode switch, so replace cannot install five profiles. Tests for `{}` and for an over-cap replace. |
| F8 | Medium | `src/components/SettingsPanel.ts` — `chooseImport` counts profiles and earned stickers before and after the write and puts the numbers on the result line ("Merged 1 profile and 2 stickers into this one." / "Restored 2 profiles and 1 sticker."), then reloads through `time.delayedCall(900, reloadApp)`. Tests assert the numbers, the zero case, and the delayed restart. |
| F9 | Medium | `src/__tests__/components/SettingsPanel.test.ts` — dismissing the choice card via its backdrop asserts `applyImport` was never called, `choices` is empty and both rows still exist (AC-5). |
| F10 | Low | `docs/perf-baseline.md` — coverage row corrected and, with `README.md`, `docs/TDD.md` §10.2/§10.3, refreshed from the final run: 140 files / 3,069 tests; statements 97.33 / branches 91.67 / functions 96.28 / lines 98.29. |
| F11 | — | Already done; `plan.md` untouched. |
| F12 | Low | `src/__tests__/utils/backupFormat.test.ts` — `the envelope a real save produces (NFR-6)` builds four full profiles (all 22 game ids, full counters, `WINDOW_SIZE` recent, 7-day activity) and asserts the JSON is under 64 kB, reporting the measured size. Measured: **23,435 bytes**. `phase-4.md`'s NFR-6 row replaced with that measurement. |
| F13 | Low | `src/__tests__/utils/backupFormat.test.ts` — the refusal loop now asserts only the code and the exact sentence, with a comment saying `readBackup` is pure and the byte-identity proof belongs to the storage layer, where it exists for `profile-cap` and `store-unavailable`. |
| F14 | Low | `docs/TDD.md` §6.7 — the reading order ends at `checksum-mismatch`; `profile-cap` is attributed to `planImport` after the mode is chosen and `store-unavailable` to `applyImport` before it plans. The §6 `saveV2` snippet and the `mutate` sentence were corrected to match F1. |

## The write-path proof

`src/utils/storage.ts`, as it ends:

```ts
export function applyImport(
  mode: ImportMode,
  incoming: ProfileV2,
  now?: Date,
): { ok: true } | { ok: false; refusal: Refusal } {
  if (isPersistenceDegraded()) {
    return { ok: false, refusal: refusalFor("store-unavailable") };
  }
  const planned = planImport(ensureV2(), incoming, mode, now ?? new Date());
  if (!planned.ok) return planned;
  if (!mutatePersisted(() => planned.next)) {
    return { ok: false, refusal: refusalFor("store-unavailable") };
  }
  return { ok: true };
}
```

and the private twin beside `mutate` (which is unchanged, `saveV2(next);` ignoring the return):

```ts
function mutatePersisted(mutator: (v2: ProfileV2) => ProfileV2): boolean {
  const next = mutator(ensureV2());
  const stored = readV2Raw();
  if (!stored.failed && classifyStoredV2(stored.raw) === "unknown") {
    v2Cache = { provisional: false, raw: stored.raw, state: next };
    return false;
  }
  return saveV2(next);
}
```

Two tests in `src/__tests__/utils/storage.test.ts`, inside `backup export and import`:

1. `refuses an import whose write the store did not accept` — a healthy accepted write first (`updateSettings({})`), `setItem` broken with `QuotaExceededError` immediately before the import (the pre-check reads a flag and writes nothing), then:
   - `expect(result).toMatchObject({ ok: false, refusal: { code: "store-unavailable" } });`
   - `expect(localStorage.getItem(V2_KEY)).toBe(before);`
   - `expect(isPersistenceDegraded()).toBe(true);`
2. `refuses an import into a write-protected future-version save` — a payload stamped `schemaVersion: 99`, then:
   - `expect(result).toMatchObject({ ok: false, refusal: { code: "store-unavailable" } });`
   - `expect(setItem).not.toHaveBeenCalled();`
   - `expect(localStorage.getItem(V2_KEY)).toBe(raw);`

## The merge proof

The journey now seeds two profiles from `p1` and `p2`:

- `p1` — cat, `shape-sorter` + `color-match` earned, `shape-sorter` plays 3 / wins 2 / correct 14 / wrong 6, `color-match` plays 2, `insights` streak 3 / best 5 / cap-days 1, active profile.
- `p2` — dog, `animal-trace` + `pop-freeze` earned, `animal-trace` plays 2 / wins 1 / correct 9 / wrong 3, `insights` streak 1 / best 2 / cap-days 0.

The empty second context therefore holds only its own freshly created `p1`; restoring the file has to **merge into** `p1` and **append** `p2`. After `settleHub` the journey asserts `profileCount === 2`, `stickerCount === 2` (the bridge counts the active child's stickers), four earned stickers across both profiles read from storage, `p1` `progress["shape-sorter"].plays === 3` and `insights.currentStreakDays === 3`, and `p2` `progress["animal-trace"].plays === 2` and `insights.bestStreakDays === 2`. The download, the second `BrowserContext`, the merge tap at its published point, the post-reload assertions, the game launch and both empty `collectErrors` are unchanged.

## Commands

| # | Command | Result |
| --- | --- | --- |
| 1 | `pnpm check` | 0 — 307 files, no findings |
| 2 | `pnpm typecheck` | 0 |
| 3 | `pnpm test -- --run` | 0 — 140 files / 3,069 tests |
| 4 | `pnpm test:coverage` | 0 — statements 97.33 (6381/6556), branches 91.67 (1882/2053), functions 96.28 (1399/1453), lines 98.29 (5935/6038) |
| 5 | `pnpm build` | 0 — 367 modules, 47 chunks, 59 precache entries |
| 6 | `node scripts/validate-bundle.js` | 0 — Phaser 1335.0 kB, shell entry 168.3 kB of 200 |
| 7 | `node scripts/validate-pwa.js` | 0 — 16 checks, 47 chunks / 47 precached |
| 8 | `node scripts/validate-docs.js` | 0 — 5 checks, including the living-docs test counts |
| 9 | `pnpm test:e2e` | **NOT RUN — permission denied** (reported as a blocker; the primary runs it) |
| 10 | `pnpm exec biome check --write …` | **NOT RUN — permission denied**; `pnpm check` was used to read the diff and the four formatting changes were applied by hand |
| 11 | `pnpm exec vitest run <file>` | **NOT RUN — permission denied**; the payload size was read from a temporary failing assertion under `pnpm test -- --run`, then restored |

## Deviations

1. `src/utils/storage.ts` — the brief's step 2 described `mutatePersisted`, which was added; `saveV2`'s signature change also made the `docs/TDD.md` §6 snippet false, so the snippet and the §6.7 `mutate` sentence were corrected in the same phase rather than leaving a doc that contradicts the code.
2. `src/components/SettingsPanel.ts` — `importSummary` and `earnedStickerTotal` are module-level helpers in the same file rather than private methods, because both are pure and one is called before the panel has a state to read; no new module was added.
3. `e2e/journeys/backup.spec.ts` — the brief asked for `stickerCount === 4`; the bridge's `stickerCount()` counts the **active profile only**, and a merge keeps the device's own active child, so the journey asserts 2 on the bridge and 4 across both profiles from `readStoredV2`, with a comment saying which is which.

## Notes

- **Payload size (NFR-6):** 23,435 bytes for four profiles at the shape the app produces — all 22 game ids with counters, a full `WINDOW_SIZE` recent window, a 7-day activity strip, a streak and both play-time fields. The write is a single `setItem` of that payload, the same save path every earned sticker already runs; the frame-time half of NFR-6 is reasoned from that path, not separately timed, and the evidence says so.
- **A brief instruction that could not be honoured as written:** `stickerCount === 4` (see deviation 3). Nothing else in the brief was wrong.
- **A behaviour chosen:** `readBackup` — rather than `planImport` — refuses a checksum-valid payload with no `profiles` array. That is the stricter of the two options the brief allowed, and it means merge can never see `{}` either.
- **A behaviour chosen:** a merge reports the delta (what it added), a replace reports what the device now holds. A like-for-like replace therefore reads "Restored 2 profiles and 2 stickers." rather than "0".
- **Branch coverage:** every branch this phase added has a test — the refused write, the write-protected payload, the unknown-version branch of `mutatePersisted`, the repay of both modes in `planImport`, the early return in `voiceChanged`, the merge/replace split of `chooseImport`, and both pluralisations in `importSummary`. `SettingsPanel.ts` lines 840–845 remain uncovered as before (the pre-existing `?e2e=1` accessors), and no new `catch` was added.
- `conductor/tracks/20261108-backup-restore/plan.md`, `spec.md`, `metadata.json` and the registry were not touched.

## Primary verification

- **Date:** 2026-11-08
- **Phase:** R1 (review fixes), round 1
- **Phase base:** `e5c635e4`
- **Head:** `5b58489a`
- **Verified by:** the primary agent, independently of the phase executor

### The blocked run, cleared

The executor could not run the browser suite, and the two-profile journey was the
whole point of F2, so this was the primary's first job after reading the diff:

| Command | Result |
| --- | --- |
| `pnpm test:e2e` | **19 passed (3.7m)**, exit 0 |

### Gate

| Layer | Command | Result |
| --- | --- | --- |
| Static | `pnpm check` | exit 0, 307 files, no findings |
| Types | `pnpm typecheck` | exit 0, both programs (`src` + `e2e`) |
| Unit | `CI=true pnpm test -- --run` | exit 0, **140 files / 3,069 tests**, 17.27 s |
| Coverage | `pnpm test:coverage` | statements 97.33, branches 91.67, functions 96.28, lines 98.29 — gate 90 / 85 / 88 / 95 |
| Build | `pnpm build` | exit 0, 59 precache entries (1765.75 KiB) |
| Bundle | `node scripts/validate-bundle.js` | PASS phaser 1,335.0 kB; shell `index-DI9SmdDG.js` **168.3 kB** ≤ 200 kB |
| PWA | `node scripts/validate-pwa.js` | 16 passed |
| Docs | `node scripts/validate-docs.js` | 5 passed |
| Browser | `pnpm test:e2e` | 19 passed in 3.7 min on two workers |

### What was read, not trusted

- **F1.** `saveV2` now returns `boolean` — `true` only from inside the accepted-write
  branch, `false` at the tail — and a new `mutatePersisted` walks the same path as
  `mutate` but answers the question `mutate` threw away, returning `false` for the
  write-protected unknown-version branch, which is memory-only by design. `applyImport`
  refuses with `store-unavailable` when it returns false. `mutate` itself is untouched,
  so no other caller changed. Read in the diff at `src/utils/storage.ts:268-330`
  and `:592-625`.
- **F6 + F7.** `planImport` normalises once (`const incomingSave = normalizeV2(incoming, moment)`)
  and checks `incomingSave.profiles.length > MAX_PROFILES` **before** the mode switch,
  so replace is capped as merge already was; both modes then read `incomingSave`.
  `readBackup` gained a payload-shape check after the checksum — `asRecord`, then
  `Array.isArray(payload.profiles)` — so a checksum-valid `{}` is refused as
  `wrong-format` rather than normalising into an empty save.
- **F4.** `bringToTop(closeButton)` moved out of the constructor and appended to
  `buildPage`, after that page's rows, with the comment reworded to say it runs per
  page; the constructor's own `buildPage` call still covers page one. The test now
  asserts two calls and that the second lands after the rows rebuilt by a flip.
- **F5.** `VoiceRow.release()` nulls `chip`, `preview` and `band`, `clearPage` calls it
  before destroying the objects, and `voiceChanged` returns early when the handles are
  gone. The stale chip label the old code cached is not consulted after a release.
- **F8.** `chooseImport` reads `getProfiles()` and the earned-sticker total before and
  after the write, builds one sentence from the delta (`Merged 1 profile and 2 stickers
  into this one.`) or the total (`Restored 2 profiles and 1 sticker.`), shows it in the
  primary colour, and only then schedules `reloadApp` at 900 ms. A refusal still returns
  before any of that.
- **F2.** The journey seeds `p1` **and** `p2`, and after the merge asserts
  `profileCount === 2`, `stickerCount === 2` on the bridge (the active child only — the
  bridge counts the active profile, which is why the executor's brief number of 4 was
  wrong), and from `readStoredV2` that `p1` kept shape-sorter plays 3 while `p2` arrived
  with animal-trace plays 2. The append branch is now exercised end to end.
- **F3.** `crypto` is in `DOM_GLOBALS` with no allowance (nothing in `src/` matches), and
  a new test asserts every allowed module still has at least one DOM site so a stale
  allowance fails instead of lingering.
- **F9.** A test dismisses the choice card and asserts `applyImport` was never called.
- **F12.** A four-profile save at the app's real shape measures **23,435 bytes** of
  envelope JSON against a 64 kB assertion; the frame half is reasoned from the single
  `setItem` of that payload, and the phase-4 evidence line now says so rather than
  citing journey runtimes.

### Findings closed

| Finding | Severity | Fix verified by |
| --- | --- | --- |
| F1 silent failed restore | High | `mutatePersisted` + refusal; two storage tests (refused write during the import, write-protected store) |
| F2 one-profile journey | High | `backup.spec.ts` two-profile seed; 19/19 green |
| F3 guard missed `crypto` | Medium | `DOM_GLOBALS` entry + stale-allowance test |
| F4 ✕ depth after a flip | Medium | `buildPage` raises it; ordering test |
| F5 voice row after a clear | Medium | `release()` + guarded `voiceChanged`; flip-then-event test |
| F6 replace skipped the cap | Medium | cap before the mode switch; over-cap replace test |
| F7 unchecked payload | Medium | shape check in `readBackup`; `{}` refused |
| F8 no numeric summary | Medium | before/after counts, three sentences asserted |
| F9 decline untested | Medium | dismiss test |
| F10 stale coverage row | Low | `perf-baseline.md` refreshed to the run above |
| F11 Phase 4 result hidden in a comment | Low | fixed before the phase began |
| F12 NFR-6 unmeasured | Low | 23,435-byte measurement |
| F13 tautological assertions | Low | replaced with a purity note |
| F14 reading order | Low | TDD order ends at `checksum-mismatch`; plan and store refusals named separately |

**Gate green; the review round is closed with nothing deferred.**

