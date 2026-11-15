# Review — 20261115-robot-path (round 2)

## Mission state

```
STATE: review R2 — PASS · 0 blocking · 3 Low debt (R1-1, R1-4, R1-5) · 10/10 AC traced · pinned 03cf3714 · independence: cold-read
NEXT: ship — push feat/20261115-robot-path and open the PR with pr.md
STOP: no
```

- **Track:** Robot Path (Game 23), track `20261115-robot-path`
- **Branch / base:** `feat/20261115-robot-path` / `f2f602a0`
- **Round:** 2 of a maximum of 2
- **Commit examined:** **`03cf3714`** (Phase 7 accepted; its code and docs are `26fa4805`)
- **Verdict:** **PASS** — no Critical, High or Medium finding is open, every acceptance criterion traces to code, a test or a named evidence artifact, and the two Medium findings of round 1 are closed by behaviour rather than by wording alone.
- **Independence:** cold-read (E3). The trace below was re-derived from `spec.md`, the diff `f2f602a0..HEAD`, the seven verification files and this round's own gate run — not from the phase reports' claims.
- **Evidence for this round:** `.conductor/evidence/review-r2/gate.log` — **GATE EXIT: 0** on `03cf3714`, tree clean, with `.conductor/evidence/phase-7/gate.log` as the phase's own exit-0 run on the code tree.

## What round 1 asked for, and what round 2 found

| Finding | Round 1 | Round 2 status | Evidence |
|---|---|---|---|
| R1-2 — journey counts | Medium: docs said 22 journeys / 17 spec files (and 21 in one note) against a tree with 18 files and 23 journeys | **closed** | `e2e/journeys/` holds 18 spec files, this round's run reports `23 passed (4.6m)`, and every governed statement now reads 23 / 18: `docs/TDD.md` §10.5 and its nginx note, `docs/perf-baseline.md`'s live header and its 2026-11-16 table. `validate-docs` check 5 ("the living docs state the current test-suite truth") passes |
| R1-3 — hint cap | Medium: `hintFor` pulsed on every stop from the second, so a third stop repeated the hint the spec caps at once per round | **closed in behaviour** | `RobotPathScene` carries `hintOffered`, cleared by `renderRound` and `clearRoundContent`, and `onWiggleComplete` pulses only while it is false. The new test `offers the round's hint once, so a third stopped run pulses nothing` asserts 0 pulses after stop 1, 1 after stop 2 and still 1 after stop 3, and that no stop advances the round. Removing the `!this.hintOffered` guard makes it fail with `expected 2 to be 1`; restoring it makes it pass — the test bites |
| R1-6 — plan wording | Low: P6.T1 called Robot Path one of "the fixed-difficulty seven" against a 23-game roster | **closed** | the task now names Robot Path as the one game no adaptive dimension reaches, with the 15 + 7 + 1 = 23 arithmetic. `git diff b0d19844..HEAD -- plan.md` shows that one line plus the new Phase 7 block: Phase 6's status, checkpoint and verification record are untouched |
| R1-7 — tech-stack counts | Low: "22 lazy game-scene JS chunks" in a dated note, beside current-state bullets that also disagreed with the tree | **closed as far as the tree requires** | the current-state bullets now say 26 scenes (Boot, Preload, Hub, 23 game scenes) and a 23-journey budget measured this round (4.6 min, `launch-all` 2.9 min). The dated `2026-10-27` design-update notes keep their original wording on purpose: they record what the prewarm engine did when it shipped, and rewriting history would make the log less useful, not more. The call and its reason are in the run's decisions log and in `verification/phase-7.md` |
| R1-1 — `Touches` under-declares | Low | **still open, as debt** | plan `Touches` lists remain narrower than the branch's real diff; Phase 7 added one more honest instance (it refreshed `README.md`, outside its own list) and disclosed it rather than hiding it |
| R1-4 — no facing turn | Low | **still open, as debt** | FR-7's "turns to face the direction it moves" is still unimplemented because the walk pose is symmetric; direction is carried by strip arrows and the ghost trail. Closing it needs directional art, which is a design decision the spec's D7 did not take |
| R1-5 — `.dev-server.log` | Low | **still open, as debt, out of code** | the deletion lives in commit `26a05551`; the fix is a line in `pr.md`, which ship writes |

## Pass A — mechanical, run by this review

| Check | Result | Evidence |
|---|---|---|
| Commands pass on a clean run | **pass** | the track's verbatim chain — `pnpm test:e2e && pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` — exited **0** on `03cf3714` with a clean tree: **23 journeys passed (4.6m)**, Biome 330 files (0 errors, the one pre-existing `useImportType` warning), **150 files / 3,255 tests**, coverage 97.24 / 91.61 / 96.3 / 98.31, entry `index-9iYt2XVh.js` 182.5 kB ≤ 200 kB, **49 chunks / 49 precached**, 61 precache entries (1794.50 KiB), docs 5/5 |
| Evidence exists | **pass** | `verification/phase-1.md` … `phase-7.md`, one per phase marked verified |
| State honest | **pass** | plan: seven phases `Status: verified` with checkpoints `26a05551`, `1898f5cc`, `c4197970`, `de311e98`, `f96c923e`, `877bb496`, `26fa4805`; metadata: `phases_total 7`, `tasks_total 20`, `phases_verified 7`, `tasks_done 20`, `last_checkpoint 26fa4805` = Phase 7's checkpoint; 20 checked tasks, none unchecked |
| Decisions authorized | **pass** | every behaviour change is one of D1–D12; Phase 7's two judgement calls (R1-7's dated-note call, the README refresh outside `Touches`) are logged with rationale in the run's decisions file and in the phase record |
| Scope | **fail — R1-1 (Low), unchanged** | 19 files outside the union of Phases 1–6's `Touches` (invariant-forced roster restatements and the two `hub` prewarm modules), plus Phase 7's disclosed `README.md`; no *un*declared file is added by this round |
| Tests weakened | **pass** | Phase 7's test diff is 31 insertions and 0 deletions: one new case, not one relaxed assertion. No added `skip`/`only`/`xit` anywhere in the branch; the round-1 count stands (25 removed count/name lines against 74 added `it(`/`test(` lines) and the suite grew 3,254 → 3,255 |
| No secrets | **pass** | the whole diff has no key, token, private-key header, `.env*` or credential literal |
| Dependencies | **pass** | `package.json` and `pnpm-lock.yaml` unchanged since `f2f602a0` |

## Pass B — judgment

### The criteria that round 1's findings touched

- **FR-10** now reads "at most once per round" and is met: the hint pulses on the second stopped run, never repeats in that round, is cleared on round change and is never auto-placed. **AC-5** still holds: exactly one pulse at two stops, and the hint path never calls `place`.
- **FR-17 / AC-9** hold with the corrected counts: 23 games named in order by README, PRD §2.2/§3.23/§4.1/§4.8/§5/§7 and TDD, the roster at 10 + 10 + 3, the report at 6 + 6 + 6 + 5, and — the finding's own fix — the browser layer's counts now matching the tree it ships. `validate-docs` 5/5 confirms the roster, the anchors and the suite truth in one pass.
- **NFR-3 / NFR-6** hold unchanged: 182.5 kB against a 200 kB gate, project coverage 97.24 / 91.61 / 96.3 / 98.31 against 95 / 88 / 85 / 90. `robotPathLogic.ts`'s uncovered `fallbackRng` body remains a recorded note, not a gate failure.

Every AC-1…AC-10 and FR-1…FR-17 trace in round 1's table still holds; this round re-checked them against `03cf3714` and found no drift, and the only criteria whose *evidence* changed (AC-5, AC-9, FR-10, FR-17) improved.

### Correctness on the fix itself

- `hintOffered` is reset in both places a round is (re)built — `renderRound` and `clearRoundContent` — so a new round offers its hint again, which is what "once per round" means; there is no path where a stale flag suppresses a later round's hint.
- The flag is set only when `hintFor` actually returned a hint, so a first-run stop cannot consume the round's single offer.
- `stoppedRuns` still resets per round and is what the bridge publishes; the bridge's shape is unchanged, so the journey and its three bridge tests are unaffected.
- The new assertion identifies a hint pulse by its **target** (the palette rect for the first solution direction), because the stopped-run wiggle also tweens two objects with `repeat: 2`; a shape-only assertion would have counted the wiggle. That is a deliberate strengthening, not a rewrite.

### Documentation after the fix

The two documents that quote build artefacts now quote the ones this tree emits: entry `index-9iYt2XVh.js` and 61 precache entries at 1794.50 KiB. Those two figures moved because the scene changed, and the phase record says plainly that they were refreshed after the phase's gate run, with `validate-docs` re-run on the final text — this round's own full run then passed on the committed tree, so the claim is verified rather than asserted.

### New observations (non-blocking, no phase)

- **Low — the live header names a content-hashed file.** `docs/perf-baseline.md`'s header and its 2026-11-16 table quote the shell entry's hash, so any future code change leaves them stale until a docs pass refreshes them, as this phase had to. Two hourly options exist (quote the size and let the hash live in the dated section, or keep refreshing); it is a documentation convention question, not a defect, and out of scope for a review fix.
- **Low — R1-1 persists.** The plan's `Touches` lists are still narrower than the branch; closing them is a state-file pass (add the forced paths, and Phase 7's `README.md`), and every instance is disclosed in a phase record.
- **Low — R1-4 and R1-5** remain as debt, unchanged from round 1: a design question (directional art) and a PR-note task.

No Critical, High or Medium finding is open. Nothing in the tree needs a third review round, and no fix from this round weakened a test, a guard or a threshold.

## Debt carried to ship

| ID | Sev | Note |
|---|---|---|
| R1-1 | Low | plan `Touches` under-declares invariant-forced files (19 from Phases 1–6, plus Phase 7's `README.md`); every instance is disclosed |
| R1-4 | Low | FR-7's facing turn is unimplemented with symmetric art; direction is carried by arrows and the trail |
| R1-5 | Low | commit `26a05551` deleted the tracked `.dev-server.log` and ignored it; say so in `pr.md` |
| — | Low | `robotPathLogic.ts`'s `fallbackRng` body (lines 262–265) is the new logic module's only uncovered code |
| — | Low | `RobotPathScene.ts:1`'s `import Phaser` could be `import type Phaser`; pre-existing, warning only |
| — | Low | the perf-baseline header quotes a content-hashed entry filename, so it needs a docs touch whenever the build changes |
