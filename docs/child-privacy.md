# Child Privacy Statement — Aby's Little Lab

## Overview

Aby's Little Lab is an early-learning game suite for children aged 3–5. This
statement explains what the app does and does not do with data. It is written
for a family-only audience and is a prepared artifact for a full public-release
posture, not a submission: no store listing exists or is committed.

## Summary

- The app does not collect personal information from children.
- It has no accounts, no sign-in, no cloud sync and no server of its own.
- It contains no analytics, advertising or tracking code and makes no network
  requests.
- All game data stays on the device, in the browser's local storage.

## What the app stores, and where

Game data — profiles, stickers, progress, settings and play-time budgets — is
stored only in the browser's `localStorage`, under the key `abby-little-lab:v2`.
It never leaves the device and is never transmitted to the developer or to a
third party. Up to four local profiles can exist; each is a set of stickers and
progress attached to a textless animal avatar.

The app does not ask for a name, email address, phone number, birth date, home
address, location, photo, contact list or any other personal identifier.

## Speech and audio

Spoken prompts are produced on the device by the browser's Web Speech API
(`window.speechSynthesis`). The app does not record a child's voice, does not
upload audio, and does not send speech to a service of its own. Background music
is a local loop and sound effects are synthesized in the app; neither transmits
data. See [audio attribution](audio-attribution.md).

## Parental controls

The Settings panel sits behind a three-second hold gate so a young child cannot
change it accidentally. Parents can add or remove local profiles, cap daily
play time, choose a device voice, and reset progress. Resetting clears the
active profile's earned stickers; the browser's own storage controls can clear
everything.

## COPPA (United States)

The app does not collect "personal information" as defined by COPPA from
children under 13: it collects nothing from any user, transmits nothing, and
shares nothing with a third party. No child data is held by the developer, so
there is no developer-side record to review, update or delete. Because no
collection occurs, this statement records no verifiable parental-consent flow;
one would be required before any feature that introduced collection shipped.

## GDPR-K and GDPR (children in the EU/EEA)

No personal data is transmitted to or processed by the developer. All data
remains on the user's device under the family's control, and the app performs no
profiling, advertising or cross-device tracking. A parent can delete all local
data at any time through the browser's site-data controls.

## Changes and contact

This statement describes the app as shipped. Because the developer holds no
child data, there is no data request that can be answered from a developer-side
store. Questions about this statement can be raised with the repository owner
(`mansyar`) through the project repository.

## Related documents

- [Store privacy labels](store-privacy-labels.md) — prepared, not submitted.
- [Third-party notices](third-party-notices.md) — bundled components and their licenses.
