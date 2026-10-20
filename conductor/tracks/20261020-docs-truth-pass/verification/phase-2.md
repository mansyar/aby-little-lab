# Phase 2 evidence — De-duplicate the README Systems Sections

| Field | Value |
| --- | --- |
| Track | `20261020-docs-truth-pass` — Docs & Dead-Code Truth Pass |
| Phase | 2 of 6 — De-duplicate the README Systems Sections |
| Date | 2026-10-20 |
| Branch | `chore/20261020-docs-truth-pass` |
| Base commit | `99728bc870c3ed53ed2b53ac0709a0db56f3ca3e` |
| Head commit | `541a75812665bcaa7516e5676549bfdb0f897f20` (code head; this file is the commit after it) |
| Result | **verified** — with the AC-2 line-budget clause recorded as not reached in this phase (see AC table) |

## Commands

The brief's single verification command was run once, as written, from the repo root:

```
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js
```

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Lint/format | `pnpm check` | 0 | 230 files checked. Pre-existing `$schema` 2.5.5 vs CLI 2.5.10 info and one pre-existing `noNonNullAssertion` warning in `musicalMemoryScene.test.ts`; no errors. |
| Types | `pnpm typecheck` | 0 | `tsc --noEmit`, clean. |
| Tests | `pnpm test -- --run` | 0 | 110 files, 2,305 tests passed. |
| Coverage | `pnpm test:coverage` | 0 | statements 97.78, branches 90.66, functions 96.34, lines 98.59. |
| Build | `pnpm build` | 0 | `vite build`, 316 modules; shell `index-*.js` 132.21 kB (30.02 kB gzip), Phaser 1,374.82 kB; PWA `precache 53 entries (1702.03 KiB)`. |
| Bundle gate | `node scripts/validate-bundle.js` | 0 | `PASS: Phaser vendor chunk` (1342.6 kB), `PASS: shell entry = 129.1 kB (<= 200 kB)`. |
| PWA gate | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed; `41 chunks, 41 precached`. |
| **Whole chain** | **as above** | **0** | No step needed a retry. |

## Acceptance criteria

| AC | Criterion | Result |
| --- | --- | --- |
| AC-2 | Every trimmed README section links to the owning doc | **Met.** All nine sections now end with an explicit `Product rules:` / `Implementation:` link line into `docs/PRD.md` and `docs/TDD.md`. |
| AC-2 | No other file links to a removed anchor | **Met.** `rg "README\.md#"` across the repo returns only the plan's own check phrase and the phase-1 evidence line that quotes it; `rg "\)\#"` inside `README.md` returns nothing. Every README link added this phase points at a PRD/TDD heading verified in the file, not at a README anchor. |
| AC-2 | README ≤ 170 lines | **Not met in this phase: 237 lines** (from 286). The nine sections lost 49 of their 107 lines; the floor this phase can reach is bounded by sections it may not touch (Mini-Games table 26 lines, Project Structure 19, Releases 17, Documentation 15) plus `## Per-Game Juice`, which Phase 3 owns. Per the track's stated assumption the 170-line figure is a target, not a gate. |
| AC-3 | A relocation list names every moved fact and `rg` finds each in PRD/TDD | **Met** for every relocated fact (table below). Covered facts were confirmed by reading the owning section before dropping the README text; the `rg` sweep of the relocated phrases is in "Anchor and relocation checks". |

## Relocation table

`covered` = the owning doc already carried the fact, README text was dropped, doc untouched.
`relocated` = the owning doc did **not** carry it, it was written there first, then dropped from README.
`corrected` = the README claim was false against the docs/code and was not propagated.

| README section | Fact | Destination (file → heading) | Verdict |
| --- | --- | --- | --- |
| Parental Lock & Touch UX | Settings + every game's Back gated by a 3-second hold | `docs/PRD.md` → §5.3 The parental lock | covered |
| | 48 px green ring, fills from twelve o'clock | `docs/PRD.md` §5.3, `docs/TDD.md` → §5.3 ParentLock | relocated |
| | One hold at a time, action fires once | `docs/PRD.md` §5.3, `docs/TDD.md` §5.3 | covered |
| | Early release / pointer-out / pointer-cancel never fires | `docs/PRD.md` §5.3 | covered |
| | Ring cleared on release, cancel and shutdown | `docs/PRD.md` §5.3, `docs/TDD.md` §5.3 | relocated |
| | 96×96 hit areas; `Rectangle(0, 0, 96, 96)` top-left anchor; centered speaker `Rectangle(-48, -48, 96, 96)` | `docs/PRD.md` → §5.2 Touch targets, `docs/TDD.md` §5.3, §5.4 SpeakerButton | covered |
| | Settings BGM/SFX toggles with 96 px targets | `docs/TDD.md` → §5.5 SettingsPanel and the settings group | covered |
| | Tapping outside the panel closes it | `docs/TDD.md` §5.5 | relocated |
| | Enabling SFX plays a confirmation chime | `docs/PRD.md` → §6.5 Toggles, `docs/TDD.md` §5.5 (`playCorrect()`) | relocated |
| | `/audio/bgm.mp3`, narration ducks it, hidden document pauses it | `docs/PRD.md` → §6.2 Music, §6.4 Audio focus | covered |
| | Version footer `v{version}`, `__APP_VERSION__` from `package.json` via Vite `define` | `docs/TDD.md` §5.5, → §11.1 Vite build | covered |
| | Reset Progress: two-step confirm, clears stickers, keeps settings, row reads "Progress cleared", shelf re-renders | `docs/PRD.md` → §4.4 Stickers, `docs/TDD.md` §5.5 (`ResetModal.ts` row) | relocated |
| | Install row: Install App / iOS how-to / hidden | `docs/PRD.md` → §4.10 Install and update, `docs/TDD.md` §5.5 (`InstallRow.ts`) | covered |
| | iOS steps: Share → Add to Home Screen | `docs/PRD.md` §4.10 | relocated |
| | 4 profiles, 6 animal avatars, chip switch without PIN, hold to create/delete, v1 migration | `docs/PRD.md` → §4.5 Profiles, `docs/TDD.md` → §6.4 Migration and normalisation | covered |
| | Play-time limits Off/15/30/45/60, arc warm at 5 min, 2 s nudge, moon badge, no mid-game cut, off by default | `docs/PRD.md` → §4.6 Play-time limits, `docs/TDD.md` §5.6 | covered |
| | Mascot waves once at the cap | `docs/PRD.md` §4.6 | relocated |
| | Baloo 2 replaces Courier, larger Settings text, pinch-zoom inside Settings only | `docs/PRD.md` → §5.1 Visual language, §5.5, `docs/TDD.md` §5.5, §5.8 | covered |
| | Dated provenance ("2026-08-05", "2026-08-06") | — | dropped as release history (see Notes) |
| Motion & Feedback | 300 ms crossfade into 180 ms fade-in | `docs/PRD.md` §5.6, `docs/TDD.md` → §9.2 Scene transitions | covered |
| | Win: 10 rays + 10 confetti ~700 ms, sticker ~400 ms later | `docs/PRD.md` §5.6, `docs/TDD.md` → §9.3, §9.4 | covered |
| | 95% press squish, `Back.out` 150 ms, navigate on release, drag-off cancels | `docs/PRD.md` §5.2, §5.6, `docs/TDD.md` §9.3 | covered |
| | Reduced motion: shorter, 6 rays, no confetti, press feedback off, idle chime only | `docs/PRD.md` → §5.7 Reduced motion, `docs/TDD.md` → §9.1, §9.3 | covered |
| | Reduced motion: Hub entrances fade without scale | `docs/PRD.md` §5.7 | relocated |
| | Audio focus: duck 8% over 120 ms, restore paths, 15 s watchdog, hidden document, one charge per visible slice | `docs/PRD.md` §6.4, `docs/TDD.md` → §8.3, §8.4 | covered |
| Hub Experience | 64 px tile icon above a text label | `docs/PRD.md` → §1.5 Session flow, `docs/TDD.md` → §7.1 (module list, `hubGrid.ts`) | relocated |
| | Staggered entrance 40 ms apart over 300 ms | `docs/PRD.md` §5.6 | relocated |
| | Idle bob 2.5 s with phase offset, four drifting dots | `docs/PRD.md` §5.6 | relocated |
| | Sticker shelf thumbnail, 800 ms shimmer, dashed outline | `docs/PRD.md` §4.4 | covered (size claim corrected, see Notes) |
| | Just-earned `Back.out` to 1.15× with sparkle, `{ justEarned }` | `docs/PRD.md` §4.4, `docs/TDD.md` → §4.6 Lifecycle and shutdown | covered |
| | Profile chip 96 px, textless picker, shelf + play-time re-render | `docs/TDD.md` §5.6 | covered |
| | Play-time arc, nudge, moon badge refresh live | `docs/PRD.md` §4.6, `docs/TDD.md` §5.6 | covered |
| | Idle attract ~25 s, 4° wobble, chime repeats every ~10 s, pointer resets timer and audio context | `docs/PRD.md` §5.6, `docs/TDD.md` §8.2 (`playIdleCall`) | covered (repeat + context relocated to §5.6) |
| Professor Hoot Mascot | Two static SVG poses, tween-only, no new audio | `docs/PRD.md` → §4.3 The mascot, `docs/TDD.md` → §5.2 Mascot | covered |
| | Hub bottom-right, 0.2×, touch-inert, waves on load, cheers on `justEarned`, bob + squash-blink | `docs/TDD.md` §5.2 | covered |
| | All 22 games, cheer / nod / win cheer, destroyed on shutdown, Animal Trace has no nod | `docs/PRD.md` §4.3, `docs/TDD.md` §5.2 | covered |
| | `Mascot.ts` + `createCornerMascot()`, overlapping cheers retire the tween and pause blink | `docs/TDD.md` §5.2 | covered |
| | Reduced motion: no idle loop, minimal reactions | `docs/PRD.md` §4.3, `docs/TDD.md` §5.2 | covered |
| UI & Typography | UI/UX Hardening track archived at `conductor/archive/uiux-hardening_20260805/` | `docs/TDD.md` → §12 See also | relocated |
| | Baloo 2 WOFF2 path, `@font-face` in `src/styles/style.css`, precached | `docs/PRD.md` §5.1, `docs/TDD.md` §5.8 (new) | covered / relocated |
| | `typography.ts`: `FONT_FAMILY`, size presets, `textStyle()` on every Text object | `docs/TDD.md` §5.8 (new) | relocated |
| | Find the Letter 256 px target / 128 px cards from `letter_*` | `docs/PRD.md` → §3.8 Find the Letter | relocated |
| | `sleep_zzz` glyph for sleeping decoys | `docs/PRD.md` → §3.3 Pop & Freeze | covered |
| | Preload branding title + tagline above the progress bar | `docs/TDD.md` → §3.3 PreloadScene and the boot asset table | covered |
| | Win sticker reveal ~400 ms after the celebration | `docs/PRD.md` §5.6 | covered |
| PWA Release Readiness | `dist/manifest.webmanifest` + service worker precaching assets, icons, `/audio/bgm.mp3` | `docs/PRD.md` → §1.4 Platforms, install and offline, `docs/TDD.md` → §11.2 PWA configuration | covered |
| | "auto-updating service worker" | `docs/PRD.md` §4.10, `docs/TDD.md` §11.2, §5.7 (`registerType: "prompt"`) | corrected |
| | `pnpm run build` then `node scripts/validate-pwa.js` | `docs/PRD.md` → §8.1 Gates, `docs/TDD.md` → §11.3 Validator scripts | covered |
| | HTTPS host or tunnel; localhost only for same-device smoke tests | `docs/PRD.md` §1.4, `docs/TDD.md` §11.2 | covered |
| Bundle Code Splitting | Lazy game scenes, `sceneRegistry` dynamic imports, `ensureSceneLoaded()` before the crossfade | `docs/PRD.md` → §4.1 Shared scene bases and lazy loading, `docs/TDD.md` → §4.1 Shell scenes and the lazy registry | covered |
| | Phaser 4 invokes `scene` array entries with `new`, so runtime registration is the supported pattern | `docs/TDD.md` §4.1 | covered |
| | Shell 129.1 KiB / 132.21 kB / 30.02 kB gzip against the 200 kB gate | `docs/TDD.md` → §3.6 What the budget costs | covered (gzip figure relocated into the table) |
| | 41 JS chunks: 22 scenes, nine art-group chunks, shared bases, vendor, workbox | `docs/TDD.md` §3.6 | relocated |
| | Rollup hoists shared modules and two-consumer art groups | `docs/TDD.md` §3.6 | covered |
| | Cold boot 419.5 ms, 1697.2 ms at 4× throttle, 53 vs 178 textures, 3 s gate | `docs/TDD.md` → §3.5 In-chunk art | covered |
| | Cold first tap +48 ms widest union / +82 ms worst, 224–334 ms vs 400 ms, `measure-first-tap.mjs` | `docs/TDD.md` §3.5 | covered |
| | 53-key shell set, twelve art groups, `storyOrderArt.ts`, 178 = 53 + 125, six shared avatars | `docs/TDD.md` §3.3, §3.5 | covered |
| | `shellOwnership.test.ts`, `hubTiles.ts` roster | `docs/TDD.md` §3.5, §7.1 | covered |
| | A new game adds an art group and a `preloadArtGroups()` call, never a `PreloadScene` import | `docs/TDD.md` §3.5 | relocated |
| | Offline: 53 precache entries, 1,702.03 KiB, `validate-pwa.js` fails on a missing chunk | `docs/TDD.md` §3.6, §11.3 | covered |
| | Structural acceptance: zero game-scene registrations in the entry chunk | `docs/TDD.md` §3.6 | relocated |
| Docker Deployment | Node build stage → Nginx serving `dist/` | `docs/TDD.md` → §11.5 Container and host | covered |
| | `docker build -t aby-little-lab .` / `docker run --rm -p 8080:80 aby-little-lab` / `http://localhost:8080` | `docs/TDD.md` §11.5 (and kept in the README summary, the only other place they appear) | relocated |
| | TLS terminated at the provider or reverse proxy in front of the container | `docs/TDD.md` §11.2, §11.5 | covered |
| CI/CD | `.github/workflows/ci.yml`, `Quality Gates` step list incl. `CI=true pnpm test` and `validate-boot` | `docs/TDD.md` → §11.4 GitHub Actions | covered |
| | "Merge to `master` fires `Deploy to Coolify`" | `docs/TDD.md` §11.4, `docs/PRD.md` → §8.2 Deploy path | corrected (deploy is tag-gated) |
| | Coolify token with `deploy`, Deploy Webhook URL, `COOLIFY_DEPLOY_WEBHOOK` / `COOLIFY_TOKEN` secrets | `docs/TDD.md` §11.4 (and condensed in the README summary) | relocated |
| | Branch protection requiring `Quality Gates` | `docs/TDD.md` §11.4 (and condensed in the README summary) | relocated |

## Line count

| | Lines |
| --- | --- |
| README before this phase (`99728bc`) | 286 |
| README after this phase (`541a758`) | **237** |
| Removed from the nine sections | 107 |
| Replaced by summaries | 58 |
| Net change | −49 |

`## Per-Game Juice` (22 lines) was left untouched, as the brief assigns it to Phase 3.

## Anchor and relocation checks

```
$ rg "README\.md#" .
conductor/tracks/20261020-docs-truth-pass/plan.md:53:  - [ ] **P2.T3.2: Check inbound anchors** — `rg "README.md#"` across the repo; fix or keep any referenced headings.
conductor/tracks/20261020-docs-truth-pass/verification/phase-1.md:67: (quotes the same check)

$ rg "\)\#" README.md
(no matches)
```

No file links to a README heading, so no inbound anchor broke when the nine section bodies were replaced; all nine headings were kept verbatim, in their original order.

Relocated-phrase sweep (26 matches across `docs/`, all in the owning documents):

```
docs/PRD.md:215   256 px                                   (Find the Letter art)
docs/PRD.md:359   800 ms alpha loop                        (Stickers)
docs/PRD.md:369   mascot waves once                        (Play-time limits)
docs/PRD.md:393   Share, then Add to Home Screen           (Install and update)
docs/PRD.md:435   twelve o'clock                           (The parental lock)
docs/PRD.md:455   40 ms apart / 2.5 second loop / repeating every ten seconds (Motion and feedback)
docs/PRD.md:459   Hub entrances fade without scale         (Reduced motion)
docs/PRD.md:496   correct-answer chime as confirmation     (Toggles)
docs/TDD.md:389   30.02 kB gzip                            (What the budget costs)
docs/TDD.md:396   41 JavaScript chunks / zero game-scene constructor registrations
docs/TDD.md:546   starts at twelve o'clock / cleared on release, cancel and shutdown (ParentLock)
docs/TDD.md:554   closes the panel when tapped             (SettingsPanel)
docs/TDD.md:574   Progress cleared                         (ResetModal)
docs/TDD.md:588   ### 5.8 Typography and fonts
docs/TDD.md:713   64 px tile icons                         (hubGrid.ts)
docs/TDD.md:961   Deploy Webhook URL / Require status checks (GitHub Actions)
docs/TDD.md:967   docker build -t aby-little-lab           (Container and host)
docs/TDD.md:975   conductor/archive/uiux-hardening_20260805 (See also)
```

## Deviations

| File | Change | Why |
| --- | --- | --- |
| `docs/TDD.md` | New subsection `### 5.8 Typography and fonts` plus its Contents line | The README's typography facts (font file, `@font-face` location, `typography.ts` exports) had no owning section, and renumbering an existing section was forbidden. Appending §5.8 is additive and leaves every existing number intact. |
| `docs/TDD.md` | `## 12. See also` gained one link to `conductor/archive/uiux-hardening_20260805/` | The archive path was a README fact with no other home; the alternative was losing it. |
| `README.md` | The CI/CD summary now says deploy is tag-gated instead of merge-triggered | The old claim contradicted `docs/TDD.md` §11.4 and `docs/PRD.md` §8.2 (deploy runs only for a `v*.*.*` tag whose commit is on `master`), and the summary would otherwise have re-published a false fact. Recorded as `corrected` above. |
| `README.md` | "auto-updating service worker" became "the service worker that precaches…" | The app uses `registerType: "prompt"` (TDD §11.2, §5.7); the old wording implied a silent takeover. |
| `README.md` | Sticker shelf "56px" became "a small thumbnail on a cream plaque" | `src/game/hubGrid.ts` uses `STICKER_DISPLAY_SIZE = 22` for the thumbnail and 56 for the surrounding plaque, so the README number was attached to the wrong object. No size claim was relocated. |

No file outside the phase's `Touches` (`README.md`, `docs/PRD.md`, `docs/TDD.md`) was modified apart from this evidence file.

## Notes

- **Dated provenance dropped.** The old README carried "2026-08-05"/"2026-08-06"/"2026-08-02" markers on several bullets. They are release history rather than behaviour, they live in `## Releases` (untouched this phase), and the owning docs are deliberately undated. Nothing factual was lost: each dated statement's content is in the owning section.
- **170-line target.** AC-2's budget is not reachable inside Phase 2's `Touches`: the nine sections only accounted for 107 of 286 lines, and the remaining bulk is sections this phase may not touch. Final measurement is 237 lines.
- **Coverage observation for the Phase 1 owner (not edited).** `docs/TDD.md:897` records "branches 90.73 (verified 2026-10-20)"; today's identical-suite run reports branches **90.66** (statements 97.78, functions 96.34, lines 98.59 otherwise unchanged). No source file changed between `daafe4d` and this commit, so this is almost certainly v8 branch-count drift rather than a doc error — flagged because FR-4/AC-4 own that line, and Phase 2 was told not to re-touch Phase 1 numbers.
- **Pre-existing**, out of scope and left alone: `biome.json` `$schema` 2.5.5 vs CLI 2.5.10 info message, the one `noNonNullAssertion` warning in `musicalMemoryScene.test.ts`, the Vite `./package.json` import-attribute warning, and Vite's >500 kB chunk notice for the Phaser vendor chunk. The JSON-import warning is FR-8's target in Phase 5.
- The verification chain ran once, exit 0, no retries.
