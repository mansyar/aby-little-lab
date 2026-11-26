# Retention Proxy Validation — Protocol and Privacy Record

> **Status: Protocol only — recruitment not executed**
>
> Track: `20261126-retention-proxy` · Phase 1 · 2026-11-26

This document makes the roadmap's local Day-7 return proxy auditable. It records a
consented study protocol, a definition of the proxy built only from data the app
already keeps on the device, a parent interview guide, the rules for handling
evidence privately, and the honest finding that no field study has happened.

It is a protocol, not a result. No families were recruited, no interviews were
held, and no export was read. Nothing here changes the app: there is no new
analytics, account, upload, save-schema field, or network dependency. The product
question the roadmap raises stays open until a future consented pilot can answer
it.

## 1. Scope and posture

- **In scope:** the study procedure, the proxy definition, the interview questions,
  the privacy rules, and the committed no-data finding.
- **Out of scope:** recruiting or contacting families, conducting interviews,
  analysing any real family's data, and claiming field, production-retention,
  physical-device, or statistically significant results.
- **Privacy posture:** family-only and offline-first. The app holds progress under
  the family's control on the device; this protocol adds no collection path. The
  evidence sources are two local Save a backup exports (Day 7 and close-out) and
  a parent interview, used only with that parent's permission.
- **Factual inputs:** [Roadmap §10.3 (metrics)](../conductor/roadmap.md#103-phase-2--product-operations-3-weeks)
  sets the ≥ 40 % directional target and
  [Roadmap §10.9 (risks)](../conductor/roadmap.md#109-roadmap-risks) records that
  the proxy is noisy and needs confirmation with real families. Neither is a
  finding of this track.

## 2. Pilot protocol

The pilot is deliberately small: **1–2 consenting families**, observed for a
**14-day minimum window** per family. The small target is a feasibility check on
the proxy, not a sample sized for inference.

| Step | What happens | Recorded outcome |
| --- | --- | --- |
| 1. Pre-contact | The owner identifies prospective families and states that participation is voluntary, free, and unrelated to using the app. | Recruitment status: `not started` (the current status) or `invited`. |
| 2. Consent | An adult parent explicitly agrees, in writing, to the window, the three evidence sources (two local backup exports — one at Day 7 and one at close-out — and a parent interview), and the privacy rules in §5. Consent is specific to this pilot and is not implied by using the app. | Recruitment status becomes `consented`; the day of consent is Day 0. |
| 3. Observation | The family uses the app as they normally would for at least 14 days. The researcher does not instrument the app, prompt play, or change any setting on the family's behalf. | Recruitment status becomes `active`. No data is collected by the researcher during this step. |
| 4. Day-7 export (preliminary) | If the family still consents, the parent optionally shares a first local backup export. This is a preliminary snapshot, not the final proxy: one export's seven-day activity window cannot yet supply the inputs in §3. | Export retained privately, recorded as `unreadable / withheld`, or absent; no proxy value is recorded from this step alone. |
| 5. Close-out export and interview | At Day 14 or later, the parent optionally shares a second local backup export and takes the interview in §4. The researcher computes the final proxy in §3 locally from the paired Day-7 and close-out exports, then writes only non-identifying aggregates into a summary. | Recruitment status becomes `completed` when the pair is readable; `incomplete` when either export is withheld or unreadable — never an imputed return. |
| 6. Withdrawal | A parent may withdraw at any point, without a reason. Play stops being observed immediately; both shared export copies and any transcript are deleted from researcher-held storage, and no further use is made of them. | Recruitment status becomes `withdrawn`. Any partial window is reported as incomplete, not as a negative result. |

A family that withdraws, cannot complete the 14 days, or withholds either export is
recorded as **incomplete**. Their data is never filled in, averaged in, or treated
as a failed return. If an export is unreadable or missing, the interview remains
usable and is explicitly labelled weaker evidence (§3). If a family's account of
play contradicts the exports, the conflict is reported directionally rather than
silently resolved in favour of either source.

## 3. Local Day-7 return proxy

The proxy is derived **only** from data the app already stores for a profile on
the device and that a parent can export through the existing Save a backup seam,
using a **pair** of exports: one taken at Day 7 and one at close-out (Day 14 or
later). Each export exposes the per-game Progress record (including `plays`,
`correct`, `wrong`, and `lastPlayedAt`) and the `activity` entries. No new counter,
event, or timestamp is introduced: every input below is an existing exported field.

**Activity-window limit.** `activity` is a `DayActivity[]` of `{ day, plays }`
entries pruned on write to the current day plus the six prior days. Each export
therefore shows only a rolling seven-day window, and one export alone cannot span
a seven-day gap between two observed play days. The pair of exports is what makes
the proxy computable; even then, the earliest day observed in the pair is only a
stand-in for a true first play day, which the app does not store.

**Inputs and definition.** For one consenting family's profile, evaluated locally
from the paired exports:

- An *observed play day* is a `day` key in `activity` whose `plays > 0`. A day key
  with no recorded play is not an observed day.
- `E` is the earliest observed play day across **both** exports — a conservative
  stand-in for a first play day, not a true first-play field.
- `R` is a later observed play day **in the close-out export** with `R − E >= 7`
  calendar days.
- A *Day-7 return* is observed only when such an `R` exists inside the family's
  14-day observation window. A single Day-7 export cannot establish this: its own
  activity window spans at most six calendar days between its earliest and latest
  entries, and it does not prove a seven-day return since first play.
- `lastPlayedAt` (the ISO timestamp of the most recent play, or `null`) may
  corroborate that a profile played, but it is not a first-play field and does not
  by itself establish a distinct observed day outside the `activity` windows.

The proxy value is the number of eligible profiles with an observed return divided
by the number of eligible profiles with **readable paired exports**. Profiles that
are incomplete, withdrawn, unreadable, or backed by only one export are excluded
from the denominator, never counted as non-returns.

**Directional target.** The roadmap's **≥ 40 %** figure in §10.3 is a *directional
target*, carried here as a benchmark to compare a future observation against. It
is **not a result, not a measured rate, and not a production-retention claim**;
no observation has been made. The roadmap itself notes that the seven-day strip
shows reach rather than retention and that a return rate needs a longer history
than a profile holds, so this proxy is necessarily noisy.

**Interpretation limits.** The proxy is one small, local signal from 1–2 families.
It cannot establish statistical significance, device-wide behaviour, or a
production retention figure. It is falsifiable: a future pilot may find the proxy
and the parent interviews disagreeing, in which case both directions are reported
and the product question stays open.

## 4. Parent interview guide

The interview is conversational and takes place at close-out. Each question maps
to one of the four signals the roadmap cares about: return, breadth, completion,
or barriers. Answers are written down as parent-reported observations, not as
measured facts.

| # | Question (asked of the parent) | Signal | What it supports |
| --- | --- | --- | --- |
| 1 | "On which days in the last two weeks did your child ask for the app again, without you opening it for them?" | Return | Corroborates or contradicts the Day-7 proxy; a self-initiated later day is the clearest return evidence. |
| 2 | "Which games did they go back to more than once?" | Breadth (repeat) | Distinguishes a single visited game from a genuine repeated choice; complements the distinct-games figure in §10.3. |
| 3 | "Were there games they tried once and never opened again?" | Breadth (drop-off) | Shows whether novelty or difficulty narrows play; a barrier when the reason is frustration. |
| 4 | "When they started a game, did they usually stay to the end of its rounds?" | Completion | Qualitative check on the roadmap's ≥ 80 % completion target; the target is directional, not a measured result. |
| 5 | "What ended a session — leaving the house, a screen-time limit, losing interest, or something in a game?" | Barrier | Separates external interruptions from in-app friction, so a low return is not misread as disinterest. |
| 6 | "Was anything hard about starting a game or hearing what to do, on the days they did play?" | Barrier | Captures access and speech friction that the on-device counters cannot see. |

The interviewer does not lead the parent toward the ≥ 40 % target or the ≥ 80 %
completion target, and does not ask for a child's name, age in years, or any other
identifier. Where an answer is vague, it is left vague in the summary rather than
made precise.

## 5. Privacy rules

1. **No PII in committed files.** A committed summary contains only aggregated,
   non-identifying observations: counts by signal, a direction (higher / lower /
   mixed), and the recording of incomplete cases. No name, birth date, exact age,
   address, contact detail, device identifier, photo, voice recording, raw
   timestamp, or identifying screenshot is written to git, including in this
   document or in evidence.
2. **Raw evidence stays outside git.** Both of the parent's backup exports (Day 7
   and close-out) and any interview transcript remain on the family's device or in
   a private researcher-held location outside the repository; they are never added
   to a commit. Only the derived, non-identifying summary is committed. If bulky
   derived artifacts are needed, they go under the gitignored `.conductor/evidence/`
   directory, which is still held to rule 1.
3. **No telemetry, upload, or third-party transfer.** The study adds no analytics,
   SDK, account, sign-in, cloud sync, network request, or app change. Nothing is
   transmitted by the app or by this protocol. A parent who chooses to share either
   export or a transcript does so through a private channel of their own choosing,
   and those files are never re-shared or committed.
4. **Consent governs retention.** Evidence is used only while consent stands. On
   withdrawal, researcher-held copies of both exports and any transcript are
   deleted and no further summary is written from them; the app on the family's
   device is left untouched.
5. **Existing promises are preserved.** The conduct here matches the app's shipped
   [child privacy statement](child-privacy.md): no collection, no third-party
   transfer, and data that leaves the device only through an action a parent takes.

## 6. Finding

**Protocol only — recruitment not executed.**

No families were recruited, no parent was contacted as a participant, no interview
was conducted, and no Day-7 or close-out backup export was read for this track.
There is therefore no field result, no observed Day-7 value, no production
retention figure, no physical-device coverage, and no claim of statistical
significance. The ≥ 40 % target remains a directional benchmark from the roadmap,
not an outcome.

What this track delivers is a falsifiable procedure: if 1–2 families are later
recruited under §2, the proxy in §3 and the interviews in §4 can be compared
against the benchmark without altering the app or the privacy posture. Until then,
the roadmap's retention question is explicitly left open.

## 7. Related documents

- [Roadmap §10.3 and §10.9](../conductor/roadmap.md) — the target and the noise risk
  this protocol addresses.
- [Child privacy statement](child-privacy.md) — the shipped no-collection posture
  these rules preserve.
- [Product intent](product-intent.md) — the recorded family-only audience and
  legal posture.
- [Retention pilot pack](retention-pilot-pack.md) — the blank, not-yet-run pack of
  run sheets that turns this protocol into forms an operator can fill in.
