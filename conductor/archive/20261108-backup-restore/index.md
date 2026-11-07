# Track: Backup and Restore

- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Metadata](./metadata.json)

**Type:** feature
**Priority:** high
**Branch:** `feat/20261108-backup-restore`
**Base:** `master` @ `8029cfad`
**Depends on:** none

## Summary

A parent can save a child's whole record as one file and restore it on another
device. The backup is a versioned JSON envelope with a checksum, imported through
the OS file picker after a merge-or-replace choice, on a second page inside the
parental Settings panel. The app's canvas-only property is preserved by confining
the first DOM usage in `src/` to one module, enforced by a guard test.

## Artifacts

- `verification/phase-1.md` ... `phase-4.md`
- `verification/integrated.md`
- `review.md`
- `pr.md`
