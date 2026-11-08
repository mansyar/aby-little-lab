# Track: Error Capture

- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Metadata](./metadata.json)

**Type:** feature
**Priority:** high
**Branch:** `feat/20261108-error-capture`
**Base:** `7d3c0db8`
**Depends on:** `20261107-storage-resilience`, `20261108-backup-restore`, `20261107-release-e2e` (all merged)

## Summary

Two global handlers, installed before the game exists, record each crash in a 20-entry device-level log inside the existing save. A crash while a scene is active raises an icon-only recovery card a child can tap; a crash before the canvas exists reloads once, with a session flag so a deterministic boot failure cannot loop. A parent downloads `diagnostics-<day>.txt` from Settings page two — a short environment header and the newest-first crash lines. Nothing is transmitted, no dependency is added, and the schema stays version 1.

## Artifacts

- `verification/phase-1.md` … `verification/phase-4.md`
- `verification/integrated.md`
- `review.md`
- `pr.md`
