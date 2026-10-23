# feat(game): give every game its adaptive difficulty dimension

- **Track:** `20261023-adaptive-banding-completion` (Adaptive Difficulty Completion)
- **Branch:** `feat/20261023-adaptive-banding-completion` → `master`
- **Base:** `master` @ `a054e5a` (after PR #56)
- **Type:** feature · **Priority:** high
- **Review:** PASS (round 2 — round 1 returned PASS WITH FINDINGS with two Low findings, both fixed in Phase R1; round 2 confirmed them and raised one new Low, fixed in the acceptance)

## What this changes

Seven of the twenty-two games ignored the difficulty band the app already
computed for them — Shape Sorter, Animal Trace, Pop & Freeze, Shadow Match,
Big & Small, Feelings Faces and Story Order never called
`getAdaptiveBandShift`, so a child who outgrew the round had no way past it
there, and since PR #55 their taps were folded into a rolling window nothing
read. Each game now exposes one difficulty dimension selected by the same band
the other fifteen consume:

| Game | Easy (−1) | Classic (0, shipped) | Hard (+1) |
|---|---|---|---|
| Shape Sorter | 9 ornamental shapes | all 18, byte-identical draws | 10 confusable geometric shapes |
| Animal Trace | 4-waypoint paths | 6 waypoints | 8 waypoints |
| Pop & Freeze | 0–1 sleeping bubbles | 1–2 | 2–3 |
| Shadow Match | one object per confusable pair | any 6 of 12 | three full confusable pairs |
| Big & Small | wider scale gap (1.6×/0.68×) | 1.5×/0.7× | narrower gap (1.35×/0.8×) |
| Feelings Faces | 6 distinct-emotion rounds | 3 distinct + 3 confusable | 6 confusable rounds |
| Story Order | 5 obvious + 1 subtle | 3 + 3 | 1 obvious + 5 subtle |

Every scene samples the shift exactly once in `create()` — the shipped
fourteen-call-site pattern — and holds it for the playthrough. At the classic
band, with the parent toggle off, or before the window holds six taps, every
game plays exactly as it shipped.

**New content** (the three pools the band math profits from): Shadow Match
grows from 8 to 12 objects in six confusable pairs (sock/boot and kite/bell
join), Story Order from 8 to 11 stories (cake, laundry, the sun — 9 new
panels), Feelings Faces' scenario pool from 16 to 24 (eight new gentle
moments). All 17 new SVGs follow `docs/SVG_STYLE.md` (512 viewBox, 8px safe
margin, flat fills, #2D3748 outlines), live in the lazy art groups and Story
Order's own chunk, passed the user's visual review, and leave the boot shell
at exactly 53 keys. Contact sheets regenerated.

**Documents:** the PRD, TDD, roadmap, README, SVG_STYLE and the product
changelog now describe 22-of-22 adaptive games; the roadmap's resolved
Known Issue and Future Work item are removed.

## Verification

| Layer | Result |
|---|---|
| `pnpm check` / `pnpm typecheck` | exit 0 (the two pre-existing findings only) |
| `pnpm test -- --run --maxWorkers=1` | 119 files / 2,556 tests, all green |
| `pnpm test:coverage` | 97.92 / 91.81 / 96.6 / 98.7 vs gates 90/85/88/95 |
| `pnpm build` + `validate-bundle.js` | 342 modules; shell 134.6 kB ≤ 200 kB |
| `validate-pwa.js` | 16/16; 42 chunks, 42 precached |
| `validate-docs.js` | 5/5 |
| `validate-boot.js` (boot smoke — assets added) | median 1.10 s ≤ 3.0 s |

## Review

Two rounds. Round 1: PASS WITH FINDINGS — two Low findings (a stale ownership
figure in the phase evidence; a coverage snapshot in the TDD disagreeing with
the integrated run by instrumentation fractions), both fixed in Phase R1.
Round 2: PASS — one new Low (the R1 evidence cited pre-squash commit hashes),
fixed in the acceptance.

## Notes for the reviewer

- The seven new strategies are deliberately single-dimension: no round counts,
  win targets, or reaction flows changed; the wake flow, wrong-tap-stays,
  shuffle guards and RNG injection are untouched.
- Classic-identity is pinned per game by tests (classic == default call under
  seeded RNG); failing-first band-difference tests were confirmed against the
  unmodified logic in every content phase.
- Sanctioned deviations recorded in the phase evidence: the art-group modules
  (`items.ts`/`shadows.ts`) omitted from Phase 3's Touches; count-literal test
  updates (33 panels, 186 canonical keys); `--maxWorkers=1` test form on this
  loaded host.
- The version bump, release notes, tag and any device pass remain outside the
  track — human release decisions.
