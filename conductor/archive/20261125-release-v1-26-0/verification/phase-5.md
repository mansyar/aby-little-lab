# Phase 5 — Device policy, tag, deploy and final notes

- **Track:** `20261125-release-v1-26-0`
- **Phase:** 5
- **Date:** 2026-11-25
- **Status:** verified
- **Approval:** owner answered “Authorize tag + deploy” and selected “Skip — accepted gap” for device smoke.

## Results

| Task | Result | Evidence |
| --- | --- | --- |
| P5.T1 device policy | complete | Physical-device HTTPS install, landscape, offline and first-tap/audio smoke were skipped as an accepted gap. No physical-device, iOS Safari, Android Chrome or Fire tablet result is claimed. |
| P5.T2 tag preflight | complete | `master` and `origin/master` were both `3c0cef4a63a779132370fb8ec056a7be55bc56ea`; `package.json` was `1.26.0`; no local or remote `v1.26.0` collision; tree clean. |
| P5.T3 tag | complete | Annotated tag `v1.26.0` points to `3c0cef4a`; tag object `bbe186b07ff11c7391d9a12759ef7c5aba15f715`; pushed to origin. The tag is immutable and must never be moved. |
| P5.T4 CI and deploy | complete | Tag run `45541584364` passed Quality Gates, both Browser Journeys shards and rollup; Deploy to Coolify fired and passed. Live release asset/version verification passed. |
| P5.T5 final notes | complete | `docs/release-notes-v1.26.0.md` changed from `DRAFT` to `FINAL` with tag, CI, deploy, live-check and device-policy evidence. |

## Tag CI and Deployment

- Run: https://github.com/mansyar/aby-little-lab/actions/runs/45541584364
- Quality Gates: pass.
- Browser Journeys shard 1: pass; shard 2: pass; rollup: pass.
- Deploy to Coolify: pass; the master-lineage guard and webhook trigger passed.
- Live URL: `https://aby-little-lab.ansyar-world.top/`.

## Live Verification

- A cache-busted request to the live URL returned HTTP 200 and served shell entry `index-0f9hfHo0.js`.
- Remote shell SHA-256: `c4cbae0f83550bde1bf66fe186581d219aa62fe512be31fc80e356b5a46e652e`.
- Local `dist/assets/index-0f9hfHo0.js` SHA-256: identical.
- The live shell contained the `1.26.0` version string.

## Finalization Exception

The approved post-tag finalization procedure was followed on merged `master`: only release notes and archived Conductor state changed; documentation validation and whitespace checks passed before the conventional direct-to-master commit. No tag or merge commit was moved, and no force-push or reset was used.
