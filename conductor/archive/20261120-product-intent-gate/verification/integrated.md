# Integrated verification — 20261120-product-intent-gate

- **Track:** Product Intent Gate (chore, high)
- **Branch:** `chore/20261120-product-intent-gate`
- **Base:** `85c5f16f` (master)
- **Final implementation head:** `5d66bc5a`
- **Date:** 2026-11-20
- **Result:** PASS

## What this track changed

| Area | Artifacts | Phase |
|---|---|---|
| Decision record | `docs/product-intent.md` — four decisions (audience, accessibility, language, legal posture), dated 2026-11-20 with rationale and consequences | 1 |
| Legal posture | `LICENSE` (MIT), `docs/audio-attribution.md`, `docs/third-party-notices.md`, `docs/child-privacy.md`, `docs/store-privacy-labels.md` — prepared, not submitted | 2 |
| Audio rights | `public/audio/bgm.mp3` replaced in place with CC0-licensed "Calm Loop" by wipics; attribution records the investigation and the new source | 3 |
| Publication | `README.md` accessibility section, Known Issues and Documentation links, MIT License section; `conductor/product.md` Phase 3 done, Phase 5 cancelled, risks closed | 4 |
| Font compliance | `public/fonts/OFL.txt` (upstream Baloo 2 SIL OFL 1.1 text) plus `docs/third-party-notices.md` pointer — authorised deviation | 4 |

## Verification commands

Run from the project root after all four phases had been squashed and before
the review gate. The single chained command exited 0:

```
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js
```

| Layer | Command | Result |
|---|---|---|
| Static | `pnpm check` | Biome clean — 337 files, no fixes applied |
| Static | `pnpm typecheck` | `tsc --noEmit` and `tsc --noEmit -p e2e/tsconfig.json` clean |
| Unit | `pnpm test -- --run` | 153 files, 3,323 tests passed |
| Coverage | `pnpm test:coverage` | 153 files, 3,323 tests passed; statements 97.12% (gate 95), branches 90.94% (gate 88), functions 96.21% (gate 85), lines 98.31% (gate 90) |
| Build | `pnpm build` | Vite 8.3.5 — 411 modules, built in 678 ms; shell entry `index-BIq9mY8m.js` 191.16 kB (48.41 kB gzip); Phaser vendor chunk `phaser-B_vcVLyb.js` 1,367.08 kB (357.00 kB gzip); the >500 kB chunk warning is the pre-existing Phaser vendor chunk |
| Build artifact | `node scripts/validate-bundle.js` | PASS — vendor chunk present (1,335.0 kB reported), shell entry 186.7 kB ≤ 200 kB |
| Build artifact | `node scripts/validate-pwa.js` | 16 passed, 0 failed — manifest, service worker, Workbox, icon, BGM present and precached, 51/51 JS chunks precached, no Ligne animation/WASM entries, navigation route present |
| Docs | `node scripts/validate-docs.js` | 5 passed, 0 failed — release-note index, links/anchors, game lists vs `GAME_REGISTRY`, Conductor paths, living-doc test counts |

Phase-level evidence: `verification/phase-1.md`, `verification/phase-2.md`,
`verification/phase-3.md`, `verification/phase-4.md`.

## Acceptance criteria

| ID | Criterion | Evidence in this track | Status |
|---|---|---|---|
| AC-1 | Decision record exists with all four decisions, each dated and rationalised | `docs/product-intent.md`, phase 1 evidence | Pass |
| AC-2 | Family-only stated; Phase 5 cancelled and Phase 4 next | `docs/product-intent.md`; `conductor/product.md` §10.4, §10.6, §10.8 | Pass |
| AC-3 | Documented touch-only/sighted/textless/landscape stance published in README | `README.md` Accessibility, Known Issues, Documentation | Pass |
| AC-4 | English permanently; i18n and second locale not goals | `docs/product-intent.md` Decision 3 | Pass |
| AC-5 | Full public-release legal posture; five artifacts prepared, not submitted | `LICENSE`, `docs/audio-attribution.md`, `docs/third-party-notices.md`, `docs/child-privacy.md`, `docs/store-privacy-labels.md`, phase 2 evidence | Pass |
| AC-6 | All five legal artifacts exist | Phase 2 evidence; files listed above | Pass |
| AC-7 | BGM rights resolved with investigation recorded and no untraceable right claimed | `public/audio/bgm.mp3`, `docs/audio-attribution.md`, phase 3 evidence, PWA validator | Pass |
| AC-8 | Roadmap records Phase 3 done, README links decision record, docs validator passes | `conductor/product.md` §10.4, README links, validator 5/5 | Pass |

## Artifact provenance

- Replaced BGM: "Calm Loop" by wipics, OpenGameArt item
  `https://opengameart.org/content/calm-loop` (License: CC0, "Public Domain",
  confirmed 2026-11-20), file `https://opengameart.org/sites/default/files/Relaxing.mp3`,
  MP3 44,100 Hz stereo, 19.382875 s, 314,222 bytes. The previously shipped loop's
  origin was untraceable and is no longer shipped; no right is claimed for it.
- Font license: upstream Baloo 2 OFL text from
  `https://raw.githubusercontent.com/google/fonts/main/ofl/baloo2/OFL.txt`
  (4,384 bytes), shipped at `public/fonts/OFL.txt`.

## Deviations and blockers

- Phase 3's subagent could not copy the downloaded CC0 file; the primary ran the
  exact blocked `Copy-Item` command and handed the verified result back. No
  workaround or rephrase was attempted by the subagent.
- Phase 4's subagent was denied writes to `conductor/product.md`; the primary
  applied the five fully specified roadmap edits. No product or design decision
  was required — the spec and approved plan already mandate the update.
- Phase 4's two authorised deviations (shipping `public/fonts/OFL.txt` and
  refreshing the BGM status in `docs/product-intent.md`) were recorded in
  `verification/phase-4.md`.

## Conclusion

All four phases are verified, all eight acceptance criteria pass, and the full
`verify_phase` chain is green. No runtime feature work was introduced: the only
code-adjacent change is the BGM binary replacement at the existing path, plus a
font license text file. The track is ready for `conductor-review`.
