# Retention Pilot Pack — Blank Run Sheets

> **Status: Not run — no families contacted**
>
> Track: `20261126-retention-pilot-pack` · Phase 1 · 2026-11-26

This is a blank, printable pack for a small retention pilot that has not happened
yet. It turns the [Retention Proxy Validation — Protocol and Privacy Record](retention-validation.md)
into forms an operator can fill in by hand — without changing the app, adding a
collection path, or contacting a family. The protocol is the source of truth. If
anything here and the protocol disagree, the protocol wins.

**No-data attestation.** No family was contacted or recruited for this pack. No
interview was held. No Day-7 or close-out backup export was read. There is no
observed Day-7 value, no measured return rate, and no field result — only blank
sheets. Every status remains `not started`, and every field is empty.

## 1. How to use the pack

Work through §2 to §7 in order, one family at a time. Keep the blank copies in the
pack; write filled copies and any scratch work outside git. Only §7, the
non-identifying summary, is ever committed. The app itself is untouched: no new
counter, analytics, account, upload, or network request is added, and nothing the
family does is collected by the researcher during observation.

## 2. Recruitment note (blank)

A plain note for 1–2 prospective families. Keep it short and honest. Do not ask
for a name, an exact age, or a contact detail; a parent who later chooses to share
a file does so through a channel of their own choosing.

> We are asking 1–2 families to help us check a small idea: do children come back
> to Aby's Little Lab on their own, a week or two after they first play? Taking
> part is **voluntary**, **free**, and **unrelated to using the app** — saying no
> changes nothing about the app or how it works. There is no payment and no
> obligation. We would observe ordinary play for at least 14 days, ask you for two
> local backup exports (one around Day 7 and one at close-out) and a short chat at
> the end. You can say no to any part, or stop at any time, without a reason.

- Date the note was shared: ____________
- Families invited (1–2): ____________
- Recruitment status token: ____________
  (choose from `not started`, `invited`, `consented`, `active`, `completed`,
  `incomplete`, `withdrawn`)
- Non-identifying note: ____________

## 3. Consent form (blank template)

One per family. Keep the signed copy with the family or in a private
researcher-held location outside git — never in a commit.

**The window.** The pilot runs for at least **14 days**. The day the parent signs
is **Day 0**. The family uses the app as they normally would; nothing about the
app is changed for the study.

**The three evidence sources (each optional).** Only with the parent's permission:

1. A first local "Save a backup" export at around **Day 7** — a preliminary
   snapshot, not the final proxy.
2. A second local "Save a backup" export at **Day 14 or later** — the close-out
   export, paired with the first.
3. A short **parent interview** at close-out, using the questions in the protocol.

Declining any one of these is fine. A first export alone cannot establish a
seven-day return, so no proxy is computed from it by itself.

**Privacy rules.** We write only aggregated, non-identifying observations to git:
counts by signal, a direction (higher / lower / mixed), and the recording of
incomplete cases. No name, birth date, exact age, address, contact detail, device
identifier, photo, voice recording, raw timestamp, or identifying screenshot is
written to git. The raw exports and any transcript stay on the family's device or
in a private researcher-held location outside the repository, are never added to
a commit, and are never re-shared. The study adds no analytics, SDK, account,
sign-in, cloud sync, network request, or app change; nothing is transmitted by
the app. These rules preserve the app's shipped
[child privacy statement](child-privacy.md): data leaves the device only through
an action the parent takes.

**Withdrawal.** A parent may withdraw at any point, without a reason. Observation
stops immediately; researcher-held copies of both exports and any transcript are
deleted; no further summary is written from them; and the app on the family's
device is left untouched. A partial window is recorded as incomplete, not as a
negative result.

**Signatures**

- Parent/guardian signature: ____________________  Date: ____________
- Researcher signature: ____________________  Date: ____________
- Status token after signing: ____________ (`consented`)

## 4. Evidence layout and withdrawal deletion

The repository has one scratch home for derived work: `.conductor/evidence/`. The
whole `.conductor/` tree is gitignored, so nothing placed there can enter a
commit, and it is still held to the same no-PII rule as every committed file.

**May live there, only while consent stands:** derived, non-identifying
aggregates — a draft summary, counts by signal, numerator and denominator,
direction labels, and tallies of incomplete cases. Even there, keep day keys and
raw exported fields out; copy only the counts into any working file.

**Must stay outside git and outside `.conductor/evidence/`:** both raw backup
exports (Day 7 and close-out), any interview transcript or recording, a child's
name or contact detail, an exact age or birth date, a device identifier, a photo
or identifying screenshot, and any raw timestamp. Raw exports and transcripts
stay on the family's device or in a private researcher-held location outside the
repository; a parent who shares one chooses the channel, and it is never
re-shared.

**On withdrawal:** stop observation at once; delete every researcher-held copy of
both exports and any transcript; write no further summary from them; leave the
app on the family's device untouched; set the status to `withdrawn`; and record
the partial window as incomplete, never as a failed return.

## 5. The 14-day checklist (blank)

One pass per family. Tick as you go; keep any notes non-identifying and out of
git.

- [ ] **Day 0 — consent.** The parent signs the form in §3. Status becomes
      `consented`; the day of consent is Day 0.
- [ ] **Days 1–13 — ordinary use.** The family uses the app as they normally
      would. The researcher does **not** instrument the app, prompt play, change
      any setting on the family's behalf, or collect data during this step.
      Status becomes `active`.
- [ ] **Around Day 7 — first export (optional).** If the family still consents,
      the parent may share a first local backup export. Keep it private and mark
      it retained, `unreadable / withheld`, or absent. Record **no proxy value**
      from this export alone.
- [ ] **Day 14 or later — close-out.** The parent may share a second local backup
      export and take the interview. If the pair is readable, compute §6 locally
      and set `completed`. If either export is withheld or unreadable, set
      `incomplete` — never an imputed return. The interview stays usable and is
      labelled weaker evidence.
- [ ] **Branch — withdrawal, any day.** Stop observing, delete researcher-held
      copies of both exports and any transcript, set `withdrawn`, and report any
      partial window as incomplete.
- [ ] **Branch — incomplete.** Withdrawal, a short window, or a withheld or
      unreadable export means `incomplete`. Do not fill in, average in, or treat
      the case as a failed return. With only one export shared, record no proxy
      value at all.

## 6. Local Day-7 return proxy — worksheet (blank)

Computed locally from a **pair** of local backup exports, never from one export.
Work out the day values privately; copy only counts into any committed file.

- An **observed play day** is a `day` key in `activity` whose `plays > 0`. A day
  with no recorded play is not an observed day.
- **E** = the earliest observed play day across **both** exports — a conservative
  stand-in for a first play day, not a true first-play field.
- **R** = a later observed play day **in the close-out export** with
  **R − E ≥ 7 calendar days**, inside the family's 14-day observation window.
- A **Day-7 return** is observed only when such an `R` exists. `lastPlayedAt` may
  corroborate that a profile played, but it is not a first-play field and does
  not by itself establish a distinct observed day.

Fill in counts only:

- E from the pair (kept private): ____________
- R from the close-out export (kept private): ____________
- Day-7 return observed (yes / no): ____________
- Numerator — eligible profiles with an observed return: ____________
- Denominator — eligible profiles with **readable paired exports**: ____________
- Proxy value (numerator ÷ denominator): ____________

**Exclusions.** Profiles that are incomplete, withdrawn, unreadable, or backed by
only one export are excluded from the denominator entirely — never counted as
non-returns. No proxy value is recorded from a single export.

**The ≥ 40 % figure is a directional benchmark only** — a roadmap target to
compare a future observation against. It is not a result, not a measured rate,
and not a production-retention claim; no observation has been made. This proxy is
one small local signal from 1–2 families: no statistical significance and no
device-wide or production claim. If an interview contradicts the exports, report
both directions rather than silently reconciling them.

## 7. Non-identifying summary (blank template)

This is the only part of the pack that is committed. It holds counts and
direction labels — deliberately **no field** for a name, contact detail, exact
age, device ID, photo, recording, or raw timestamp. Where an answer is vague, it
stays vague here rather than being made precise.

- Families invited: ____ · Consented: ____ · Active: ____ · Completed: ____ ·
  Incomplete: ____ · Withdrawn: ____
- Eligible readable pairs: ____ · Day-7 returns observed: ____ · Proxy value:
  ____ (benchmark: ≥ 40 %, directional only)
- Interview counts by signal (parent-reported, not measured):
  - Return — asked for the app again unprompted: ____
  - Breadth — games revisited more than once: ____
  - Breadth — games tried once and dropped: ____
  - Completion — stayed to the end of a game's rounds: ____
  - Barriers — external interruptions / in-app friction: ____
- Direction per signal (higher / lower / mixed):
  - Return: ____ · Breadth: ____ · Completion: ____ · Barriers: ____
- Incomplete cases (withdrawal / unreadable export / withheld export / short
  window): ____
- Conflicts and vague answers (both directions reported, kept vague): ____________

## 8. Related documents

- [Retention Proxy Validation — Protocol and Privacy Record](retention-validation.md)
  — the source protocol, proxy definition, interview guide, and privacy rules.
- [Child privacy statement](child-privacy.md) — the shipped no-collection posture
  this pack preserves.
