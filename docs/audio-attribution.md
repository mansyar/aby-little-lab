# Audio Attribution — Aby's Little Lab

## Overview

This document inventories every audio asset that ships with Aby's Little Lab and
records the provenance investigation for the one audio file in the shipped
artifact. It is a prepared artifact for a full public-release posture, not a
submission: no store listing exists or is committed, and the app's audience is
family-only.

## Shipped audio inventory

| Asset | Role | Origin / right | Status |
| --- | --- | --- | --- |
| `public/audio/bgm.mp3` | Background music loop — low volume, starts after the first interaction, ducks under speech | Untraceable: no creator, tool, source URL or license recorded | Rights unresolved; see below |
| Feedback tones and effects (correct, incorrect, win, pop, wake, sticker, idle chime) | Synthesized at runtime by the Web Audio API in the app's audio manager | Original to this project — generated in code from formula-derived per-game identities | Covered by this project's MIT `LICENSE` |
| Narration and spoken prompts | Produced on the device by the browser Web Speech API (`window.speechSynthesis`) | Device-provided voices; no app-side audio file is shipped, recorded or uploaded | No bundled audio asset to attribute |

There are no other audio files in the shipped artifact. The app does not upload
audio, record a child's voice, or transmit speech to a service of its own.

## BGM provenance investigation — `public/audio/bgm.mp3`

The origin of the background-music loop was investigated against the repository
history, the repository documentation and past local agent sessions.

- **First tracked:** commit `7bb30468` (2026-07-31), as a relocation into
  `public/audio/`. The previous location, `src/assets/audio/`, held only a
  `.gitkeep`, so the file entered the working tree untracked with no creation
  record.
- **Re-encoded:** commit `fe0197b4` (2026-10-17), from 1,290,406 bytes to
  515,526 bytes (32.14 s). This changed the encoding, not the authorship.
- **Later commits:** the `t3 checkpoint` commits `8b1720ee`, `ab1af912`,
  `4b61be6b`, `cd65f27f` and `91b09816` only re-add the same file. They carry no
  source, creator or license information.
- **Repository documentation:** the docs describe it as the "existing / supplied"
  BGM asset and explicitly excluded licensing it; no license grant is recorded.
- **Past sessions:** no local agent session records its creation, a source URL,
  a generating tool or license terms.

**Verdict:** the BGM's origin is untraceable. There is no creator, tool, URL or
license to cite, and this document claims no right on its behalf.

## Rights resolution status

Not resolved in this phase. The loop has no traceable license, so it is not
represented as licensed here. The choice between replacing it with a
known-licensed loop and removing the loop together with its precache entry is
deliberately left to a later phase, after the product owner decides; this
document records only the investigation and does not pre-empt that decision. No
untraceable right is claimed in the meantime.

## Related documents

- [Third-party notices](third-party-notices.md) — licenses of the bundled libraries and font.
- [Child privacy statement](child-privacy.md) — what data the app handles.
- [Store privacy labels](store-privacy-labels.md) — prepared, not submitted.
