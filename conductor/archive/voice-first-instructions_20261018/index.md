# Track: Voice-First Instructions for the Silent Ten

- **ID:** voice-first-instructions_20261018
- **Type:** Feature
- **Status:** New
- **Branch:** `feature/voice-first-instructions`

## Documents

- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Metadata](./metadata.json)

## Summary

Ten of the twenty mini-games teach their rule with a static title or with nothing at all, while the other ten speak a prompt and offer a replay button. For an audience that cannot read, that split makes half the suite dependent on an adult sitting alongside.

This track adds one shared spoken-instruction API to `GameSceneBase` and adopts it in the ten silent games: a short hand-written prompt line, spoken once when the round is set up, with a speaker button to hear it again. The already-speaking games are deliberately left untouched.
