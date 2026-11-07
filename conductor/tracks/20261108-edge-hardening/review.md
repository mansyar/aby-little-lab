# Edge Hardening - Review

- **Track:** `20261108-edge-hardening`
- **Range reviewed:** `5610bc6f6f01996f53265b1213c249686aba2c9a..800be4fc`
- **Reviewer:** `conductor-reviewer` (read-only subagent)
- **Rounds:** 1
- **Verdict:** PASS WITH FINDINGS after the fix round (0 critical, 0 high, 3 medium, 5 low on arrival)

## Findings

| ID | Sev | Finding | Resolution |
| --- | --- | --- | --- |
| F1 | Medium | `fatal()` called `process.exit(1)` from inside `main`'s `try`, so the `finally` that removes the container never ran. A readiness timeout left a container holding port 8080, and the next run failed with a port message instead of the real cause. | `fatal` throws a `FatalError`; cleanup is the idempotent `ensureContainerRemoved`, called by the `finally` and by a `process.once("exit")` hook. Proven with a container that exits before answering: exit 1, no container left, port free. |
| F2 | Medium | `P3.T1.2` was ticked for "the two observed runs from this track's PR" before the PR existed, and `integrated.md` said "Result: verified" without that qualification. | Task unchecked again with the reason attached; `integrated.md` reads "verified (AC-7 partial: the PR's own CI log is the remaining evidence)". |
| F3 | Medium | The CI step runs a cold `docker build`, repeating install and build; NFR-5's 90 s ceiling was unmeasured. | Measured on this PR's log and quoted below rather than estimated. The remedy if it is over: pass `dist` into the build context, not widen the requirement. |
| F4 | Low | The guard used `toContain` per CSP source, so `script-src 'self' https://cdn.example.com` passed — a policy wider than the reviewed one. | `toEqual(expected.sources)`; `img-src` is pinned as exactly `'self' data: blob:`. |
| F5 | Low | No `Content-Type` assertion, so a `sw.js` typed `text/plain` would be refused by the browser under `nosniff` while all checks passed. | Every probe row declares its type. This found a real defect on the first run — the manifest served as `application/octet-stream` — fixed with `default_type`. |
| F6 | Low | The snippet's directive table still headed `img-src` with the pre-widening value. | Heading matches the shipped directive. |
| F7 | Low | Counts moved to 2,927 / 135 files but the dates still read 2026-11-07. | Re-dated to 2026-11-08. |
| F8 | Low | `verification/integrated.md` was untracked. | Committed with the fix round. |

## What the review confirmed

- **The inheritance rule is real and was reproduced**, not just asserted: removing one `include` serves 0 of 4 headers on that route while every other route keeps 4 of 4.
- **The `img-src` widening was measured, not convenient.** `data:` alone blanks every tile (`blob:` refusals logged ten times in a bare boot); `blob:` alone fails `boot` on Phaser's 1×1 `data:` PNG. Both tokens are load-bearing for different code paths, and neither `unsafe-*` was added.
- **Cache assertions are exact strings per class**, including the pre-existing quirk that a **404** for a missing hashed asset is served `immutable` — recorded as a follow-up rather than changed, because FR-5/NFR-2 freeze cache semantics.
- **The guard test is non-vacuous**: it pins the location count, both job names, the action allowlist, and now the exact source list per directive.
- **`process.env.E2E_BASE_URL || undefined`** means an empty value behaves as unset instead of pointing `baseURL` at `''`.
- **CI gating matches its neighbours** exactly (`steps.changes.outputs.tier == 'code'`), so the docs-only tier skips this step with the rest.
- **Nothing the policy breaks escapes the journeys**: TTS is `speechSynthesis`, BGM is a same-origin `Audio`, there is no `fetch` outside Workbox, no `Worker` construction, no `eval`/`new Function`/`innerHTML`, and `screen.orientation.lock` is not a Permissions-Policy-gated feature.

## AC-7 and the one thing this track cannot prove

AC-7 has two halves: the step runs on code changes, and it is skipped for documentation-only changes. The first is proven — this PR's own diff is code, and the step runs. The second is not: the classifier diffs the pull request's whole change set, so a docs-only run cannot be manufactured by adding a documentation-only commit to a code PR. It is left **partial**, on the same footing as `20261107-toolchain-pinning`'s AC-11, and the first genuinely documentation-only PR is its evidence.

## Overrides

None. No finding was downgraded or waived.

## Deferred

Nothing. F3's measurement lands in `pr.md` when CI reports; the missing-asset `immutable` header is a documented follow-up, not deferred work from this track.
