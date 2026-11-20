# Phase 3 Evidence — Resolve BGM rights

- Track: `20261120-product-intent-gate`
- Phase: 3 — Resolve BGM rights
- Date: 2026-11-20
- Branch: `chore/20261120-product-intent-gate`
- Base commit: `dc140246`
- Head commit: `c1db42bc` (head at verification; implementation complete)
- Result: **verified**

## Outcome

`public/audio/bgm.mp3` was replaced with a known-licensed CC0 loop at the exact
same path, so no code, config, test or precache-wiring changes were needed. The
provenance investigation of the old file is preserved in
`docs/audio-attribution.md`, and its "Rights resolution status" section now
records the resolved replacement outcome.

### Replacement source and license facts

- **Work:** "Calm Loop" by **wipics**.
- **Item page:** https://opengameart.org/content/calm-loop — states
  `License(s): CC0` and `Copyright/Attribution Notice: Public Domain`; fetched
  and confirmed 2026-11-20.
- **Direct file URL:** https://opengameart.org/sites/default/files/Relaxing.mp3
- **License:** CC0 1.0 Universal — public-domain dedication. Attribution is not
  required; the author and source are credited voluntarily with the access date
  as a matter of good practice.
- **Access date:** 2026-11-20.
- **Shipped byte size:** 314,222 bytes (was 515,526 bytes — confirmed by
  `git diff --stat dc140246..HEAD`).
- **ffprobe evidence:** MP3, 44,100 Hz, stereo, duration 19.382875 s,
  314,222 bytes.

## Commands

The chained form `pnpm build && node scripts/validate-pwa.js && node
scripts/validate-docs.js` is not permitted by the phase subagent's shell policy
(`&&` chains are denied), so the three commands were run separately, in the
required order. The primary runs the chained form.

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| build-artifact | `pnpm build` | 0 | Vite 8.3.5 production build, 411 modules transformed; PWA 2.0.0 generateSW wrote `dist/sw.js` and `dist/workbox-2fbc6a65.js`, 63 precache entries (1827.77 KiB). Only the pre-existing >500 kB chunk advisory; no errors. |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed — manifest, service worker, workbox, icon, index, BGM present; SW includes BGM in precache; 51/51 JS chunks precached; no Ligne assets; navigation route present. |
| documents | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed — release-note index complete, every relative link/anchor resolves, docs agree with `GAME_REGISTRY`, no missing Conductor paths, living docs state current test-suite truth. |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| FR-7 / AC-7 | `bgm.mp3` replaced with a known-licensed loop and attributed; investigation and outcome recorded; no untraceable right claimed | Binary commit `c1db42bc` (515,526 → 314,222 bytes); doc commit `3438eb5d` records the "Calm Loop"/wipics CC0 1.0 Universal source, URLs, access date, ffprobe facts, and explicitly states the old binary is no longer shipped and no untraceable right is claimed; source URLs above | verified |
| NFR-1 | No runtime source changes except the BGM asset and its precache wiring | `git diff --stat dc140246..HEAD` lists only `docs/audio-attribution.md`, `public/audio/bgm.mp3` and this evidence file — no code, config or test changes | verified |
| NFR-3 / AC-8 (partial) | Changed docs pass `node scripts/validate-docs.js` | 5 passed, 0 failed | verified |

## Evidence paths

- `conductor/tracks/20261120-product-intent-gate/verification/phase-3.md` — this report.
- `docs/audio-attribution.md` — preserved investigation and resolved CC0 outcome.
- `public/audio/bgm.mp3` — replaced 314,222-byte CC0 MP3.

## Deviations

None. The phase stayed within `Touches` (`docs/audio-attribution.md`,
`public/audio/bgm.mp3`). No changes to `vite.config.ts`,
`scripts/validate-pwa.js` or `src/audio/AudioManager.ts` were required because
the replacement kept the same path and filename.

## Notes

- The binary copy initially returned `permission.rejected` for the phase
  subagent and was reported as a blocker (`8a46304d`); the primary ran the
  identical `Copy-Item` command successfully (exit 0) and handed the result
  back. No workaround or re-run of the copy was attempted by this subagent.
- The `8a46304d` blocker-evidence commit is retained in history; this report
  supersedes its blocked state with the verified outcome.
- Task commits: `3438eb5d` (docs), `c1db42bc` (binary).
