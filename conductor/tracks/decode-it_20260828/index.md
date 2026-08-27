# Track: Game 19 — Decode It

**Track ID:** `decode-it_20260828`
**Type:** Feature
**Branch:** `feature/decode-it`
**Created:** 2026-08-28
**Status:** new

## Documents

- [Specification](./spec.md) — Source of Truth for scope (picture+spoken word → tap written word, 6 rounds × 4 choices, 18→22 word pool + 4 new CVC words with art, easy-first bands)
- [Implementation Plan](./plan.md) — TDD task breakdown: Phases 1–4 (word pool + pure logic → scene + TTS → assets + Hub → adaptive + docs + verification)
- [Metadata](./metadata.json)

## Summary

Add the 19th mini-game teaching early decoding & word recognition as a blending complement to Find the Word. Reuses the 18-word pool plus 4 new highly-decodable CVC words (FOX, CUP, MAP, BED) with new item SVGs, ships 6 rounds in easy-first tiers (rounds 1–3: 3-letter / 4–6: 4-letter) with no-shared-first-letter and confusable-family guards, classic picture+speech prompt with speaker replay, and shared win/sticker/auto-return. Hub grows 5×3+3 → 5×3+4 (19 tiles, row 4 holds 4). Plumbing-ready for the existing `adaptiveDifficulty` ±1 band ladder (shift 0 byte-identical).

## Project Context

- [Project Index](../../index.md)
- [Product Definition](../../product.md)
- [Tech Stack](../../tech-stack.md)
- [Workflow](../../workflow.md)
- [Tracks Registry](../../tracks.md)
