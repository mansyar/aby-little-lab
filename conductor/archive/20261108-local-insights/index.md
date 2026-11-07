# Local Insights

- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Metadata](./metadata.json)

**Type:** feature
**Priority:** high
**Branch:** `feat/20261108-local-insights`
**Base:** `master` @ `64e35642`
**Depends on:** none

## Summary

The Progress overlay answers "how is this game going" but not "what is being
played, and is it working". This adds one small per-profile `insights` record
that holds the two things the existing aggregates cannot reconstruct — a daily
streak and how many days the daily cap was reached — plus an Overview page as
the overlay's first page that states the week's activity, the completion rate
and the strongest and hardest games, all derived, all local, all on the device.
The stored schema version stays at `1`: the new fields are additive and
backfilled at zero.

## Artifacts

- `verification/phase-1.md` … `phase-4.md`
- `verification/integrated.md`
- `review.md`
- `pr.md`
