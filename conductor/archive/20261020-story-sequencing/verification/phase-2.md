# Phase 2 verification — Panel art and game art module

Track: `20261020-story-sequencing` (Story Order — Game 22)
Branch: `feat/20261020-story-sequencing`
Phase base: `8f937e7`

## What changed

- **24 story panels** added under `src/assets/svg/stories/`, one per `STORY_POOL`
  panel key, in eight trios that share a ground line and framing so each story
  reads as one scene changing:
  - obvious — `story_seed_planted` / `story_seed_sprout` / `story_seed_flower`;
    `story_balloon_flat` / `story_balloon_round` / `story_balloon_aloft`;
    `story_egg` / `story_egg_cracking` / `story_duckling`;
    `story_ice_scoop` / `story_ice_dripping` / `story_ice_puddle`.
  - subtle — `story_banana_whole` / `story_banana_peeled` / `story_banana_peel`;
    `story_cup_full` / `story_cup_pouring` / `story_cup_empty`;
    `story_foot_bare` / `story_foot_sock` / `story_foot_shoe`;
    `story_cloud` / `story_cloud_raining` / `story_rain_puddle`.
  Every file: `viewBox="0 0 512 512"`, flat fills only, `#2D3748` outlines at
  4-6 px, no gradient/filter/image/text/shadow, palette sampled from the
  existing art (`#2B6CB0 #BEE3F8 #90CDF4 #63B3ED`, `#68D391 #48BB78 #C6F6D5`,
  `#FC8181 #F687B3 #FED7D7 #FED7E2`, `#F6E05E #ECC94B #D69E2E`,
  `#C05621 #ED8936 #F6AD55 #A0522D`, `#FFFFFF #FFF8E7 #FEEBC8`, `#F0D5B4`,
  `#2D3748`). All markup is ASCII, so `btoa` cannot throw.
- **Rework after the primary agent's rendered review** (AC-11): `story_balloon_aloft`
  lifted ~100 px higher and shrunk 17% with a long curled string to the band, so
  it no longer twins `story_balloon_round`; `story_foot_bare` redrawn on the
  sock/shoe framing with a heel, instep and five toe lobes; the `#BEE3F8` sky band
  removed from `story_cloud`, `story_cloud_raining` and `story_rain_puddle` so all
  24 panels share one cream + ground-line stage. Each defect is one focused
  commit — see "Visual QA rework".
- **`src/assets/svg/ui/tiles/tile_story_order.svg`** — transparent tile, three
  overlapping picture cards (blue, pink, cream) with a sun and hill on the front
  card; reads at 48 px.
- **`src/assets/svg/stickers/sticker_story_order.svg`** — cream `r="236"`
  sticker circle plus the same three-card stack.
- **`src/utils/svgDataUri.ts`** — the shared `toDataUri(svg)`, moved verbatim
  out of `PreloadScene`; the boot scene now imports it (no behaviour change, no
  new asset entries — the tile/sticker stay out of `SHAPE_ASSETS` until Phase 3).
- **`src/game/storyOrderArt.ts`** — 24 static `?raw` imports, keyed
  `STORY_PANEL_ASSETS` in `STORY_POOL` solution order, and
  `preloadStoryOrderArt(scene)` which registers each panel with
  `scene.load.svg(key, toDataUri(svg), { width: textureSizeFor(key), height: textureSizeFor(key) })`
  (`story_*` keys resolve to the `card` tier, 256²). No tile, no sticker, and
  nothing imports the module yet: Phase 3 wires it into `StoryOrderScene`.
- **`src/__tests__/game/storyOrderArt.test.ts`** — 9 tests: 24 entries; keys
  equal `STORY_POOL.flatMap((story) => story.panels)`; unique keys; non-empty
  `<svg>…</svg>` markup; art-contract guard (512 viewBox, `#2D3748` stroke, no
  gradient/filter/image/text); Latin-1 safety; loader registration (24 calls,
  once per key, 256², data URI); `toDataUri` round-trip through `atob`; and a
  source-level assertion that `PreloadScene` contains neither `storyOrderArt`
  nor `svg/stories/`.
- **`scripts/render-svg-contact-sheets.mjs`** — new `stories` category between
  `cutouts` and `stickers`.

## Commands

Full chain, from the repo root, exactly as the brief specifies:

```
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js
```

Result: **exit 0**, all seven stages green. The chain has been run four times
(initial, at `HEAD` after the first evidence commit, after the visual-QA rework,
and at `HEAD` after this file was updated) with identical outcomes; only
v8's one-statement coverage jitter (98.07–98.09% statements, 90.28–90.36%
branches) and build wall-clock differ between runs.

| Stage | Result |
| --- | --- |
| `pnpm check` | 204 files checked, 0 errors. Pre-existing noise only: a `biome.json` schema-version info (2.5.5 vs CLI 2.5.10) and a `noNonNullAssertion` warning in `src/__tests__/scenes/musicalMemoryScene.test.ts:294`, both untouched by this phase. |
| `pnpm typecheck` | `tsc --noEmit` clean. |
| `pnpm test -- --run` | 102 files, **2174 tests passed**. |
| `pnpm test:coverage` | 102/2174 passed; statements 98.07%, branches 90.28%, functions 98.17%, lines 98.94% (gates 90/85/88/95). |
| `pnpm build` | built; shell entry `dist/assets/index-CMDX8whd.js` 198.06 kB raw (build time varies per run and is not quoted). |
| `node scripts/validate-bundle.js` | `PASS: Phaser vendor chunk present: phaser-P1E8uaLi.js`; `PASS: shell entry index-CMDX8whd.js = 193.4 kB (<= 200 kB)`. |
| `node scripts/validate-pwa.js` | 15 passed, 0 failed. |

Boot count is unchanged at 176 assets: `SHAPE_ASSETS` was not touched, so
`textureTiers.test.ts` (176) and `navigation.test.ts` (176 `svg` calls) still
pass unmodified.

## Acceptance criteria

- **FR-8 (panel art)** — met. 24 panels exist for exactly the 24 `STORY_POOL`
  keys, plus `tile_story_order.svg` and `sticker_story_order.svg`; the tile and
  sticker are art-only in this phase and are registered with the boot preloader
  in Phase 3, per the plan. The 24-key cross-check against `STORY_POOL` is
  asserted in `storyOrderArt.test.ts`, so the pool and the art cannot drift.
- **NFR-3 (style / no new deps)** — met. `docs/SVG_STYLE.md` contract followed
  (512², 8 px safe margin, flat fills, `#2D3748` at 4-6 px, ≤ 3 hues per asset,
  no gradients/filters/shadows/text). No new runtime dependency, font or audio
  asset was added; only the two TS modules and the SVGs.
- **NFR-6 (boot unchanged)** — met. `PreloadScene` changes are limited to
  importing the shared `toDataUri` and deleting the local copy; the 176-asset
  table and the loader loop are byte-identical. `pnpm build` and both validators
  are green.
- **AC-11 (grayscale, ≥ 96 px)** — met. The primary agent rendered and visually
  inspected `docs/svg-contact-sheets/stories.png`; three panels failed that
  review and were redrawn (see "Visual QA rework"), and the rework is in the
  branch. The executor cannot rasterize in its own sandbox, so its review is the
  written one below plus the review artefact. Each trio differs by silhouette or
  internal shape, never hue alone:
  | Trio | Grayscale distinguishers |
  | --- | --- |
  | seed | bare seed on soil → thin stem with two leaves → tall stem plus a six-petal bloom; the vertical mass grows monotonically and the flower sits ~70 px higher than the seed |
  | balloon | low lumpy blob on the ground → inflated oval sitting on the ground band with a short straight string tied to it → the balloon high in the frame (~100 px higher, 17% smaller, 12° tilt) with a long curled string trailing all the way down to the band |
  | duck | smooth closed egg → egg plus a jagged hole, beak and zigzag crack → a body with a head, beak, eye and two shell shards |
  | ice cream | crisp cone plus a 62 px scoop → scoop shrunk to 46 px with two drips and a small puddle → cone on its side plus a large lobed puddle |
  | banana | solid crescent → same crescent with three splayed peel flaps and a pale inner face → peel only, hollow shell and three flaps |
  | cup | dark water half filling the cup → cup tilted 34° with a falling stream into a second cup → upright, no water, visible pale interior ellipse |
  | foot | heel bulge, ankle column, sloping instep, five toe lobes with four separation strokes and an arch crease → the same foot outline in white with a ribbed cuff band → a blue boot with a light sole welt and a strap |
  | rain | one cloud over the ground band, no rain → the same cloud with four falling drops → the cloud gone, a wide puddle with two ripple arcs and three drops above |
  The two puddles differ in shape (lobed body beside a cone vs a wide ellipse with ripples), not only in colour. The full cup's water line and the empty cup's interior ellipse are both `#2B6CB0`/`#90CDF4` against `#BEE3F8`, so they separate in tone as well as shape. The 96 px legibility check remains a design claim: every identifying feature is at least a 4 px stroke on the 512² canvas (≈2 px at 256², ≈0.75 px at 96 px), so the review artefact carries a 96 px row for a human to confirm.

## Visual QA rework (primary review)

The primary agent rendered `docs/svg-contact-sheets/stories.png` and inspected
all 24 panels. Most passed; three defects failed AC-11 / NFR-3 because a child
who cannot read could not tell the order from them. Each was fixed in
`src/assets/svg/stories/` only, and the phase was squashed into `d167eb2` afterwards, so the table points at the commit that carries the art:

| Defect found | Cause | Fix | Commit |
| --- | --- | --- | --- |
| `story_balloon_round` and `story_balloon_aloft` were nearly indistinguishable | both showed a round balloon just above the ground with a short string; only a small height/tilt change separated them | `_round` keeps the inflated oval sitting on the band (bottom at y≈354) with a short straight string tied to the ground; `_aloft` is now clearly airborne — balloon top at y≈62, ~100 px higher, 17% smaller, 12° tilt, with a long curled string trailing ~150 px down to the band. `story_balloon_flat` untouched. | `d167eb2` (squashed) |
| `story_foot_bare` read as a pale stump with cramped toes, beside a sock and a shoe that both read correctly | the anchored silhouette was a wedge with the ankle merged into the heel, so there was no heel, no instep and no room for five toes | redrawn on the same framing and stage position as the sock/shoe (x 132-396, sole on y=392): heel bulge, ankle column, sloping instep, five toe lobes with four separation strokes plus an arch crease, skin `#F0D5B4`. | `d167eb2` (squashed) |
| the cloud trio used a pale blue sky rectangle while the other 21 panels are cream + ground line | a `#BEE3F8` sky band underlay only the rain story | sky band removed from `story_cloud`, `story_cloud_raining` and `story_rain_puddle`, so all 24 panels share one stage. Drops kept; the two puddles still differ by shape (lobed body beside a tipped cone vs a wide ellipse with ripple arcs), not colour. | `d167eb2` (squashed) |

## Visual QA status (read this)

**The executor did not render or inspect a PNG; the primary agent did.** Every
rasterization route is blocked in this sandbox, so the sheet was not produced
here:

- `node scripts/render-svg-contact-sheets.mjs --out .conductor/evidence/phase-2/sheets --png`
  → `permission.rejected: Permission denied: shell`.
- `node scripts/render-svg-contact-sheets.mjs` (bare) → the same rejection.
  Only `node scripts/validate-bundle.js` and the exact verification chain are
  permitted, so the Playwright-dependent renderer cannot run.
- Browser fallback: `browser.preview` → `No desktop browser is connected to this
  session`; `browser.tabs.open("file:///…/preview.html")` →
  `Invalid browser URL. Use an HTTP/HTTPS URL…`.
- Vision fallback: `analyze_image` on an SVG → unsupported format (jpg/png/
  webp/gif/bmp only).

What was done instead:

1. The `stories` category was added to `render-svg-contact-sheets.mjs`, so
   `node scripts/render-svg-contact-sheets.mjs --png` (no category flag) emits
   `docs/svg-contact-sheets/stories.html` and `stories.png` in one run.
2. A review artefact was written at `.conductor/evidence/phase-2/preview.html`
   (gitignored): all 24 panels in colour, the same 24 under
   `filter: grayscale(1)`, a 96 px row for the eight hardest pairs, and the tile
   and sticker at 96 px / 48 px. Open it in a browser to see the sheet without
   Playwright.
3. Written review of every trio's silhouette and internal shape (table above),
   plus the numeric checks the art-contract test enforces (512 viewBox, stroke
   colour, forbidden markup, Latin-1 safety).

The primary agent has now run the renderer and reviewed
`docs/svg-contact-sheets/stories.png`; the three defects that review found are
fixed above, and the sheet should be re-rendered once at final sign-off to
confirm the balloon pair, the bare foot and the unified stage. The panels remain
the one part of this phase that no automated test can judge.

## Task commit map

| Task | Commit | Notes |
| --- | --- | --- |
| P2.T1 (T1.1 obvious + T1.2 subtle) | `23ef712` | `feat(story-order): add 24 story panel SVGs` — one commit for both pool halves |
| P2.T2 (T2.1 tile + sticker) | `8ba0789` | `feat(story-order): add tile and sticker art` |
| P2.T3.1 | `31248c1` | `feat(story-order): add game-local panel art module with shared SVG data URI` (module + `svgDataUri.ts` + `PreloadScene` import swap) |
| P2.T3.2 | `ba1bd02` | `test(story-order): guard panel art keys, style and shell isolation` |
| P2.T4.1 | `58e7e67` | `chore(svg): add stories category to the contact sheet renderer` |
| P2.T4.2 | `634cfb7`, `4e76ca6` | grayscale review recorded above |
| P2.T4 rework | `2676230`, `fb4a8fd`, `382b612` | balloon pair separated, bare foot redrawn, sky band removed from the cloud trio |
| Evidence update | this file's rework commit | records the primary agent's rendered review |

## Deviations

- **The executor never rendered a contact sheet** (P2.T4.1/P2.T4.2). The
  renderer, the browser and the vision model are all unavailable in the executor
  sandbox; see "Visual QA status". The primary agent rendered
  `docs/svg-contact-sheets/stories.png` and its review drives the rework above.
- **Rework after that review** touched only three files under
  `src/assets/svg/stories/` (`story_balloon_round`, `story_balloon_aloft`,
  `story_foot_bare`, plus the sky-band removal in `story_cloud`,
  `story_cloud_raining`, `story_rain_puddle`). No code, test or config changed,
  so the verification chain was re-run and stayed green.
- **`node:fs` was not usable in the test.** `tsc` rejects `node:fs` types in the
  app tsconfig, so the "not imported by `PreloadScene`" assertion reads the
  scene's source through Vite's `?raw` import instead
  (`import preloadSceneSource from "../../scenes/PreloadScene.ts?raw"`). Same
  guarantee, no new type dependency.
- No files outside `Touches` were modified.

## Notes for the primary agent

- `storyOrderArt.ts` is currently imported by nothing but its test, so the
  production build does not contain it at all yet (no `stories` chunk in the
  `dist` listing) — that is expected; Phase 3's `StoryOrderScene` import is what
  pulls it into the lazy game chunk. AC-7's "no panel key in the shell chunk"
  therefore holds trivially now and must be re-proven after Phase 3.
- The shell entry moved 192.4 kB → 193.4 kB (validate-bundle figure) purely from
  extracting `svgDataUri.ts` into its own module; still 6.6 kB under the 200 kB
  gate.
- The 24 panels are ASCII-only by design; the `?raw` strings go through `btoa`,
  which throws on any code point above U+00FF. A future edit that pastes a
  typographic dash into an SVG comment will fail `storyOrderArt.test.ts`'s
  Latin-1 test rather than the app at runtime.
- Art judgement: the primary agent's review caught what the written review
  missed — the balloon pair, the bare foot and the sky band. The bare foot is now
  drawn on the sock/shoe framing, which is the honest fix; the shoe's boot-like
  collar remains the weakest silhouette of the 24 and is worth one more look if
  the sheet is ever reopened. Re-render `docs/svg-contact-sheets/stories.png`
  once at final sign-off.

## Primary verification

Run independently at the phase head, after the art review below.

| Layer | Result |
| --- | --- |
| `pnpm check` | pass - 204 files, 1 pre-existing warning (`musicalMemoryScene.test.ts:294`), 1 schema info note |
| `pnpm typecheck` | pass |
| `pnpm test -- --run` | pass - 102 files / 2,174 tests (2,149 carried + 16 + 9 new, none modified) |
| `pnpm test:coverage` | pass - 98.07 statements / 90.28 branches / 98.17 functions / 98.94 lines |
| `pnpm build` | pass - shell `index-CMDX8whd.js` 198,060 B (193.4 kB) |
| `node scripts/validate-bundle.js` | pass - 193.4 kB <= 200 kB |
| `node scripts/validate-pwa.js` | pass - 15 / 15 |

### Art review (the executor could not rasterise; the primary did)

`node scripts/render-svg-contact-sheets.mjs --png` now works from the primary's
shell and produced `docs/svg-contact-sheets/stories.png`, which was inspected
visually at full size. Three defects failed the AC-11 legibility bar and were
sent back for rework before acceptance:

| Defect | Why it failed | Fix |
| --- | --- | --- |
| `story_balloon_round` vs `story_balloon_aloft` | Both showed a round balloon just above the ground line, differing only slightly in height and tilt - the order was not readable at a glance | `_round` now sits on the ground band with a short straight string; `_aloft` is ~100 px higher, 17 % smaller, tilted, with a long curled string trailing down |
| `story_foot_bare` | Rendered as a pale stump with cramped toes, unlike the sock and shoe next to it | Redrawn on the sock/shoe framing (heel, ankle, instep, five toes) so all three read as the same foot gaining a covering |
| cloud trio | `story_cloud`, `story_cloud_raining` and `story_rain_puddle` carried a pale blue sky rectangle the other 21 panels lacked | Sky band removed; all 24 panels share the cream + ground-line stage, drops retained, both puddles still differ by shape |

Re-rendered and re-inspected after the fixes: all eight trios now read
first-to-last without colour. The two puddles differ by shape (tipped cone
beside a lobed body vs a wide ellipse with ripple arcs) and the cup trio differs
by water line, stream and interior ellipse.

### Shell-budget observation

The shell went 197,004 B (v1.19.0, `index-DcE17GRj.js`) -> 198,060 B
(`index-CMDX8whd.js`): **+1,056 B**. Isolated by rebuilding at this head with
the `PreloadScene` change reverted (197,004 B) - the growth comes from
importing `toDataUri` across a module boundary, not from art. Confirmed no
story art reaches the shell: both builds embed exactly 176 SVGs and contain zero
`story_*` keys. The cost is accepted here (the gate passes with 6.6 kB of
headroom) and flagged for review, because the same extraction was made to stop
the boot loader and the game-local art modules from drifting apart.

Scope: `git diff --stat 8f937e7..HEAD -- src` is the 26 new SVGs, the art
module, the shared helper, the `PreloadScene` import swap, the contact-sheet
category and the new suite. No existing test modified. `git status` clean
apart from this evidence file and the regenerated contact sheets.
