# Mission — 20261115-hub-game-groups

## Goal

```text
Ship Conductor track 20261115-hub-game-groups.

Source of truth: conductor/tracks/20261115-hub-game-groups/{spec.md,plan.md}. Branch feat/20261115-hub-game-groups, base master @ 703b12ad.
Do not ask me anything; every decision is in the plan. Take its pre-authorized defaults and log each one in .conductor/runs/20261115-hub-game-groups/freebuff/decisions.md.

Loop, in this order:
1. For each phase in plan.md whose Status is `pending`, in order, run conductor-implement scoped to it. Accept only when that phase's Verification command exited 0 in that turn and its verification/phase-<n>.md exists. Never re-run a `failed` or `blocked` phase.
2. When every phase is verified, run conductor-review.
3. If review finds fixable findings, run the new Review Fixes phase (the next integer), then review again. Stop after two rounds.
4. Push the branch and open the PR with conductor/tracks/20261115-hub-game-groups/pr.md as the body.

Done when: every phase in plan.md is verified, review.md verdict is PASS, and the PR URL is in metadata.json. Then stop — I merge myself.
Stop early and tell me when: a phase is blocked after two repair attempts, a real decision is missing from the plan, a guard trips, or push/PR tooling is unavailable. If review is still BLOCKED after R2, run ship draft first so the findings are in a draft PR, then stop.
Never merge, never force-push, never weaken or delete a test to make a check pass.
```

## Effort

4 — five phases with a new art inventory and two browser-facing surfaces (the Hub
boot path and the e2e bridge), so repairs and evidence cost more turns than the
default three-phase track.

## Done when

Every phase in plan.md is verified with an evidence file, review.md verdict is
PASS, and the PR URL is in metadata.json.

## Stop rules

Stop and hand back when: a phase is blocked after two repair attempts, a decision
is missing from the plan, review is still BLOCKED after round 2, a guard trips, or
push/PR tooling is unavailable.

## Restart

Re-run /mission with the Goal text above and the same effort. State lives in
`conductor/` and `.conductor/`; nothing depends on the previous conversation.
