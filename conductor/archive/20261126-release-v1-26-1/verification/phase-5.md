# Phase 5 Verification — Pre-authorized tag, deploy and final notes

- **Status:** verified
- **Track:** `20261126-release-v1-26-1`
- **Approval:** owner pre-authorized tag/deploy at track creation and selected “Finish v1.26.1 ship” for this ship gate.
- **Merged PR:** https://github.com/mansyar/aby-little-lab/pull/101
- **Merge commit:** `ce88cb7bde29b70634590e64ed6e69533bf15bf2`

## Preflight

- `git fetch origin master`: exit 0.
- Local `master` and `origin/master`: `ce88cb7bde29b70634590e64ed6e69533bf15bf2`.
- `package.json` version: `1.26.1`.
- No local `v1.26.1` tag and no `refs/tags/v1.26.1` on origin.
- Working tree clean.
- Master CI `45641156051`: success; Quality Gates, both Chromium shards, WebKit, Firefox, mobile Chromium and `Browser Journeys` rollup all passed.

## Immutable tag

- Annotated tag `v1.26.1` created on `ce88cb7bde29b70634590e64ed6e69533bf15bf2`.
- Tag object: `b68cf624c43a3c39a6b3bfbf55dec88a076cfb9f`.
- Pushed to origin: exit 0.
- The tag is immutable and has not been moved.

## Tag CI and deploy

- Tag CI: https://github.com/mansyar/aby-little-lab/actions/runs/45642802812
- Conclusion: success.
- Quality Gates passed; both Chromium shards passed; WebKit, Firefox and mobile Chromium engine jobs passed; `Browser Journeys` rollup passed.
- `Deploy to Coolify` passed, including master-lineage guard and webhook trigger.

## Live verification

- URL: `https://aby-little-lab.ansyar-world.top/?release=v1.26.1&<cache-buster>`
- HTTP status: 200; title `Aby's Little Lab`.
- Served shell: `index-CzNKiaF1.js`.
- Remote SHA-256: `CC173B8A2FE3306B4A37D3F9803509FEA7350C0D97F7C04F33204362A7C55CCB`.
- Local `dist/assets/index-CzNKiaF1.js` SHA-256 was identical.
- The downloaded shell contains `1.26.1`.
- Raw evidence: `.conductor/evidence/live-v1-26-1.md`.

## Device policy

- Physical-device smoke: **SKIPPED — accepted gap**.
- No physical-device, iOS Safari, Android Chrome or Fire tablet coverage is claimed.
- Raw policy: `.conductor/evidence/device-policy-v1-26-1.md`.

## Finalization

- `docs/release-notes-v1.26.1.md` flipped from DRAFT to FINAL with tag, merge, CI, deploy, live and device evidence.
- README Documentation-index label and Releases-table tag were updated to final state.
- Archived track state records `pr_state: merged`, completion of Phase 5, and the immutable tag evidence.
- Post-tag finalization is docs/Conductor-only under the documented release exception; the tag and release merge commit were not changed.
