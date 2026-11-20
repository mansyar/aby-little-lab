# Store Privacy Labels (Prepared) — Aby's Little Lab

## Status

**Prepared, not submitted.** These labels are drafted for a full public-release
posture. No store listing exists or is committed, and no submission has been
made. The intended distribution is a local sideload / private PWA for a
family-only audience. This document does not describe a live store page.

The labels below are drafted against the Google Play Data Safety form and the
Apple App Store privacy nutrition-label categories. They reflect the app as
shipped.

## Data collected

| Data category | Collected? | Detail |
| --- | --- | --- |
| Name | No | — |
| Email address | No | — |
| Phone number | No | — |
| Physical address | No | — |
| Geolocation | No | — |
| Precise / coarse location | No | — |
| Identifiers (device ID, advertising ID, user ID) | No | — |
| Payment info | No | — |
| Health and fitness | No | — |
| Contacts | No | — |
| Photos, media or files | No | — |
| Browsing or search history | No | — |
| Voice or audio recordings | No | Speech runs on-device; no recording or upload |
| Crash, diagnostic or usage data | No | — |
| Product interaction (analytics events) | No | — |
| Other user content | No | — |

**No data is collected, transmitted or shared with a third party.**

## Data stored on the device

| Data | Purpose | Retention |
| --- | --- | --- |
| Profiles, stickers, progress, settings and play-time budgets | Local gameplay and parental controls | Stored in browser `localStorage` under `abby-little-lab:v2` until the user clears it |

This data never leaves the device. It is not linked to an identity, not used for
tracking or advertising, and not sold or shared.

## Data usage and sharing

- **Used to track you:** No.
- **Linked to identity:** No.
- **Used for advertising or marketing:** No.
- **Sold:** No.
- **Shared with third parties:** No — no analytics, advertising, crash-reporting
  or other data-collecting SDK is bundled.

## Security practices

- Data is not encrypted in transit because no data is transmitted.
- Local data is stored only in the browser's own storage area on the device and
  is removable through the browser's site-data controls.
- No account, password or credential is held by the app or the developer.

## Consistency with the privacy statement

These labels mirror the [child privacy statement](child-privacy.md). The
[third-party notices](third-party-notices.md) list the bundled components; none
of them collects data at runtime. The one audio asset with untraceable
provenance is recorded in [audio attribution](audio-attribution.md); it has no
bearing on data collection.
