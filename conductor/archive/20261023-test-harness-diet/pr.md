# PR: Test Harness Diet

- **Track:** 20261023-test-harness-diet
- **Branch:** `chore/20261023-test-harness-diet` → `master`
- **Base:** `master` @ `728a659` (the single-full-gate workflow amendment)
- **Type:** chore · **Priority:** high
- **Review:** PASS (round 1; one Low spec-wording finding fixed in disposition)

## What this changes

Two config lines, five test-file line edits, one TDD paragraph — and the end
of the "machine note" era.

- **`vite.config.ts`**: the Vitest test block sets `pool: "vmThreads"` and
  `testTimeout: 30000`, each with a one-line measured justification. The
  default `forks` pool spawns an OS process per test file; on a loaded host
  that pushed full-suite runs to 460–520 s (serialized) with recurring
  wall-clock timeouts in untouched files. vmThreads runs each file in an
  isolated VM context inside worker threads — isolation preserved, spawn tax
  gone.
- **Five inline per-test timeout overrides deleted** (`countLogic`,
  `numberOrderLogic`, `addItUpLogic`, `takeAwayLogic` — `{ timeout: 20_000 }` —
  and `navigation` — positional `15000`, plus its stale justifying comment) so
  the committed 30 s budget governs them. These five were the recurring
  "timeouts in untouched files" across recent tracks; the phase's failed first
  re-proof is what surfaced them.
- **`docs/TDD.md` §10.1** states the runner: the vmThreads pool, the 30,000 ms
  budget, the retired `--maxWorkers=1` / `--testTimeout=30000` command-line
  workarounds, and the before/after measurement.

## The numbers

| | Before | After |
| --- | --- | --- |
| Full suite, local, loaded host | ~460–520 s (serialized workaround) | **61–63 s**, no flags |
| Coverage, local | 370–520 s, often needing a `--testTimeout` retry | **70–89 s, first try**, gates hold |
| Full gate, local | ~15–20 min | ~5–6 min |
| CI | ~90 s | same config; proven by this PR's run |

Four consecutive sub-90 s no-flag full-suite runs (61.3 / 63.1 / 62.62 / and
the pre-track experiments 59.4 / 59.9 s), coverage 97.94/91.88/96.6/98.7
against gates 90/85/88/95, shell unchanged, PWA 16/16, docs guard 5/5.

## Review

One round, PASS WITH FINDINGS → PASS: the single Low finding rescoped
NFR-7's "governs everywhere" wording — nine pre-existing inline overrides
remain elsewhere (recorded as follow-up debt in `review.md`; they predate this
track and now have more headroom under the committed budget).

## Notes for the reviewer

- The spec was amended mid-phase with user approval (NFR-1 withdrawn → NFR-7)
  after the gate runs surfaced the inline overrides; the amendment story is in
  `verification/phase-1.md`.
- Isolation is preserved: each test file still runs in its own VM context, so
  the module singletons (`AudioManager.getInstance()`, memo caches) stay safe
  — demonstrated by four clean full-suite passes.
- The single-full-gate protocol from the base commit was followed for the
  first time: the subagent's gate runs are the phase record; the primary ran
  the chain once as blocker clearance and the integrated run.
