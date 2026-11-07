# Storage Resilience

## Summary

The save layer can no longer throw into a scene. Every `localStorage` access goes
through one guarded route; a refused read or write keeps the change in memory,
raises a session flag, and never reaches the game. The parental settings panel
states the fact in one quiet line while it holds, and a browser journey wins a
game on a device whose writes throw, returns to the hub unaided, and reloads into
a playable hub.

Fixes the README's tracked limitation: `src/utils/storage.ts` called
`localStorage.setItem` with no guard, so a full quota or a private-mode device
threw inside `completeGame` — after `inputLocked = true`, before the celebration
and before the auto-return. The child saw a frozen game.

## Track

`conductor/tracks/20261107-storage-resilience` (archived after merge)

## What happened

| Phase | Goal | Checkpoint |
| --- | --- | --- |
| 1 | Every read and write in the save layer is non-throwing; the session survives; the bytes on a working store are unchanged | `09ea4440` |
| 2 | The panel states the fact while degraded and nothing otherwise; a browser journey proves it end to end | `09484691` |
| R1 | Review F1: a refused read is no longer an empty store — no write while a read is failing, healing on evidence | `c99861b1` |
| R2 | Review round 2: a blocked boot cannot shadow a legacy v1 save; the design documents describe the shipped state machine | `519fe74a` |

Rebased into a linear set of commits; the squash checkpoints above are the
phase boundaries the plan records.

### The defects found while making it total

1. **The write path.** `saveV2` called `setItem` bare. Fixed with a guard plus a
   memo keyed by the bytes the store actually holds, so a refused write still
   shows the earned sticker and the next accepted write persists the whole state.
2. **The read paths.** `readV1` and `readV2Raw` called `getItem` bare, so a
   blocked store threw during hub construction — a blank canvas at boot.
3. **The destructive read (review round 1).** Treating a refusal as an empty
   store meant a read-blocked/write-open device rewrote its own save with
   defaults, cleared the flag, and hid the notice. `SettingsPanel`'s own
   `getSettings()` was the clearing write.
4. **The shadowed migration (review round 2).** A boot that failed every read
   memoized a placeholder keyed with `null`; a heal onto an empty store matched
   that key and skipped `migrateV1(readV1())`, so a v1-only save was overwritten
   by the first write.

## Requirements

- FR-1..FR-7 — met
- NFR-1..NFR-5 — met (no extra `getItem` per read or `setItem` per write; no new
  dependency; shell 153.6 kB of the 200 kB gate; coverage above every threshold;
  nothing child-facing changed)
- AC-1..AC-8 — met. AC-8 is demonstrated: the new tests fail against the pre-fix
  `storage.ts` (14 of 21 could run; the rest cite an export that did not exist),
  and the two review-round tests were each proved red against the file that
  preceded their fix

## Verification

| Layer | Command | Result |
| --- | --- | --- |
| Static | `pnpm check` | 293 files, no fixes |
| Types | `pnpm typecheck` | both programs |
| Unit | `CI=true pnpm test -- --run` | 133 files / 2,912 tests |
| Coverage | `pnpm test:coverage` | 97.21 / 91.14 / 96.18 / 98.21; `storage.ts` 99.35 / 92.7 / 100 / 99.21 |
| Build | `pnpm build` | 363 modules, 59 precache entries |
| Bundle | `node scripts/validate-bundle.js` | shell 153.6 kB <= 200 kB |
| PWA | `node scripts/validate-pwa.js` | 16 passed, 47 chunks |
| Docs | `node scripts/validate-docs.js` | 5 passed |
| Browser | `pnpm test:e2e` | 16 journeys in 3.4 min |
| Boot | `node scripts/validate-boot.js` | median 0.63 s over 3 cold loads |

## Media

Omitted deliberately. This change has one visible surface — a single line of text
in the parental panel while persistence is degraded — and the panel sits behind a
three-second parental hold, so a screenshot proves less than the unit test that
compares the label set between a degraded and a healthy panel.

## Review

Pass with findings, two rounds. Round 1: one High (the destructive read), four
Low. Round 2: seven Medium/Low, all closed in R2. Full record in
`conductor/tracks/20261107-storage-resilience/review.md`.

## Deviations and risks

- **One production behaviour change beyond the guard.** The degraded notice is
  new UI: one non-interactive line at `centerY - 150`, read once at open time,
  with the title, footer and eight rows unmoved. NFR-1 was amended to say so.
- **A test helper outside the plan's Touches.** `src/__tests__/helpers/throwingStorage.ts`
  exists because happy-dom binds `Storage` methods as own properties, so a
  prototype spy never fires.
- **Precedence is stated, not merged.** When a blocked session heals onto a
  persisted save, the persisted state wins over anything earned while blind.
  Merging was rejected: it needs a rule for two versions of one sticker, and the
  spec has none.
- **Residual risk.** A store that silently discards writes without throwing is
  still invisible. Write-read-back verification is recorded in the round-2
  evidence as a roadmap candidate, not fixed here.

## Follow-ups

None opened. Two roadmap candidates are recorded in the evidence: write-read-back
verification, and a documented precedence rule for merged blocked states.

## Rollback

```sh
git revert --no-commit 519fe74a..HEAD && git commit
```
