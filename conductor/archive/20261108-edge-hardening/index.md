# Edge Hardening

- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Metadata](./metadata.json)

## Track Info

- **Type:** chore
- **Priority:** high
- **Branch:** `chore/20261108-edge-hardening`
- **Base:** `master` @ `5610bc6f`
- **Depends on:** none

## Summary

The container serves the app with `Cache-Control` and nothing else. This track adds a strict `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy` — declared once in an includable snippet so nginx's `add_header` inheritance rule cannot silently drop them on `/sw.js`, `/index.html`, the manifest or hashed assets. It is proven twice: a runtime validator against the built image that also asserts cache semantics are unchanged, and the existing 16 journeys run against the nginx origin so the policy is measured against the real app rather than argued from the config.

## Artifacts

- `verification/phase-<n>.md` — per-phase verification, including mutation proofs
- `verification/integrated.md` — the whole-gate run against the integrated tree
- `review.md` — review rounds and findings
- `pr.md` — the pull request body
