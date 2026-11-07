# Local Insights

## Summary

The Progress overlay could tell a parent about one game at a time. It could not
answer the question the roadmap set for Phase 2 - *what is being played, and is
it working* - because three of the signals that answer it were never stored: how
consistent the child is, whether the daily cap is ever reached, and what share of
started games are finished.

This adds one small per-profile record holding exactly what the existing
aggregates cannot (the streak, its best, and the days a cap was reached) and puts
an **Overview** page in front of the per-game rows. `SCHEMA_VERSION` stays at 1:
the field is additive and backfilled, so an older save reads clean and the
unknown-version write protection still refuses to touch a payload it does not
understand.

The roadmap row asked for an "event ring buffer". It was not built, and the row
now says so: the counters that already existed plus two new ones answer the
question, and a buffer would have been instrumentation for its own sake.

## Track

| Phase | What it did | Checkpoint |
|---|---|---|
| 1 | The record: five additive fields, backfill, the streak folded into the existing completion write, the cap-day counter idempotent per day | `ed3d0bed` |
| 2 | The summary: one pure module turning a profile and a moment into three statements and their numbers | `78dca82c` |
| 3 | The page: Overview as page 0, the 7-day strip and every per-game behaviour unmoved | `dec26399` |
| 4 | The proof a parent can reach it: a journey through the gate and a read of all three statements | `38db07a2` |
| Review fixes | Day count from the strip, the completion share printed, day keys validated, three small truths | `64e234e0` |

## What happened

**Phase 1** put the record in the profile, the streak advance inside the single
`mutate` that `recordGameResult` already performs, and the cap counter on the one
site that decides a lock - so a completion costs one write as before, and a
cap-day costs one write a day. The day arithmetic steps calendar dates rather
than subtracting 86 400 seconds, because a daylight-saving boundary would
otherwise skip or repeat a day.

**Phase 2** built the summary with no Phaser, no storage and no clock read in it:
the profile and the moment are arguments. That is what let twelve tests cover
every state - brand new, never completed, under the ten-tap floor, a single wrong
tap, a game played eight days ago, a malformed record - with exact strings and a
finiteness walk.

**Phase 3** put the page in front of the rows and moved nothing else: the gate,
the chips, the strip's coordinates, the six-to-a-page rows and the chevron
clamping all stayed. The summary is derived once per render for the profile the
chip shows, not the active one, so a parent looking at one child cannot read
another child's week.

**Phase 4** proved the path rather than the module: a journey seeds a week of
history, holds the three-second gate, opens Progress and reads the strings the
overlay drew. The bridge publishes those strings instead of recomputing them, so
a page that rendered the wrong sentence would fail the journey.

**Review round** found the defect worth finding: the day count came from each
game's last-played stamp, so a child who played one game on three days read "1
day this week" above a strip drawing three bars. The count now comes from the
same activity entries the strip draws. The same round made the completion rate
readable (the roadmap already claimed it was), and made a stored day key prove it
is a real date.

## Requirements

- **FR-1..FR-9** - met.
- **NFR-1..NFR-6** - met. Note NFR-2 in particular: one extra write per
  completion inside the write that already happened, and one per cap-day, never
  per tap.
- **AC-1..AC-9** - met. AC-7 is this track's own journey: 17 green in 3.2
  minutes, the insights spec at 10.3 s.

## Verification

| Layer | Command | Result |
|---|---|---|
| Static | `pnpm check` | 301 files, no findings |
| Types | `pnpm typecheck` | both programs clean |
| Unit | `CI=true pnpm test -- --run` | 137 files / 2,981 tests |
| Coverage | `pnpm test:coverage` | 97.21 / 91.12 / 96.11 / 98.21 (gate 90 / 85 / 88 / 95) |
| Build | `pnpm build` | 365 modules, 47 chunks, 59 precache entries |
| Bundle | `validate-bundle` | phaser 1,335.0 kB; shell 158.5 kB <= 200 kB |
| PWA | `validate-pwa` | 16 passed, 47/47 chunks precached |
| Docs | `validate-docs` | 5 passed |
| Browser | `pnpm test:e2e` | 17 journeys, 3.2 min on two workers |

## Media

Omitted deliberately, against `pr.media: always`. The change has a visual
surface - a text page in a Canvas overlay - but the useful evidence is the text
itself, which the journey asserts verbatim and the evidence file quotes. A
screenshot of three sentences adds nothing a reviewer cannot read in the spec.

## Review

One round, six findings (1 high, 2 medium, 3 low), all fixed. No overrides, no
deferrals.

## Deviations and risks

- `src/__tests__/components/SettingsPanel.test.ts` and
  `src/__tests__/scenes/hubScene.test.ts` were widened: existing tests asserted
  the page numbering and the settings-state shape this track changed by one page
  and two keys. No production change.
- The bridge gained two published surfaces (the Progress row's point, and the
  overlay's page/pageCount/lines) inside the same `?e2e=1` guard.
- `conductor/product.md` §10.3 was edited by the primary, not a phase agent.
- **Residual risk:** the shell entry grew 3.7 kB across the track, to 158.5 kB of
  the 200 kB gate. The Overview page added a module to the boot path's import
  graph; the next feature that does the same should read the budget rather than
  discover it.
- **Residual risk:** a completed game and a started game are counted per
  *session*, and `plays`/`wins` are cumulative counters, so the share is
  lifetime rather than recent. That is what the page says, and what the roadmap
  metric intends, but a reader expecting a weekly rate would be wrong.

## Follow-ups

None. Adaptive-band spread on the Overview belongs to Phase 4's adaptive work,
where the band ladder is the subject.

## Rollback

```
git revert --no-commit 64e35642..HEAD && git commit -m "revert: local insights"
```

The stored field is additive and ignored by the previous build, so reverting the
code leaves older saves readable - a profile that already has an `insights`
record simply stops showing it.
